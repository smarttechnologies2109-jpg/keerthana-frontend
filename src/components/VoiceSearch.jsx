import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  FaMicrophone,
  FaMicrophoneSlash,
  FaSearch,
  FaTimes,
} from "react-icons/fa";

import "../assets/css/voiceSearch.css";

const DEFAULT_VOICE_WS_URL =
  "wss://ke-de4d85674ebd473184155d3a955db0ba.ecs.ap-south-1.on.aws/api/voice-search/stream";

const VOICE_WS_URL =
  import.meta.env.VITE_VOICE_SEARCH_WS_URL ||
  DEFAULT_VOICE_WS_URL;

const TARGET_SAMPLE_RATE = 16000;
const SOCKET_CONNECT_TIMEOUT_MS = 15000;

const LANGUAGE_LABELS = {
  "te-IN": "తెలుగు (Telugu)",
  "hi-IN": "हिन्दी (Hindi)",
  "en-IN": "English (India)",
  "ml-IN": "മലയാളം (Malayalam)",
  "kn-IN": "ಕನ್ನಡ (Kannada)",
  "ta-IN": "தமிழ் (Tamil)",
};

function getLanguageLabel(code) {
  return LANGUAGE_LABELS[code] || code || "Unknown";
}

// AWS performs automatic language identification. Do not send a
// language parameter unless the backend contract is changed deliberately.
function buildVoiceSocketUrl() {
  const url = new URL(VOICE_WS_URL);
  url.searchParams.delete("language");
  return url.toString();
}

// Convert browser Float32 audio to mono, signed 16-bit PCM at 16 kHz.
function downsampleToPcm16(input, inputSampleRate) {
  if (!input?.length || !inputSampleRate) {
    return new ArrayBuffer(0);
  }

  const ratio = inputSampleRate / TARGET_SAMPLE_RATE;
  const outputLength = Math.floor(input.length / ratio);

  if (outputLength <= 0) {
    return new ArrayBuffer(0);
  }

  const pcm = new Int16Array(outputLength);

  for (let i = 0; i < outputLength; i += 1) {
    const start = Math.floor(i * ratio);
    const end = Math.min(
      Math.floor((i + 1) * ratio),
      input.length
    );

    let total = 0;
    let count = 0;

    for (let j = start; j < end; j += 1) {
      total += input[j];
      count += 1;
    }

    const sample = count ? total / count : 0;
    const clamped = Math.max(-1, Math.min(1, sample));

    pcm[i] =
      clamped < 0
        ? Math.round(clamped * 0x8000)
        : Math.round(clamped * 0x7fff);
  }

  return pcm.buffer;
}

function VoiceSearch({
  value = "",
  onChange = () => {},
  onSearch,
  placeholder = "Search songs, artists, albums, lyrics...",
  ariaLabel = "Search songs, artists, albums and lyrics",
}) {
  const [isListening, setIsListening] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [voiceError, setVoiceError] = useState("");
  const [detectedLanguage, setDetectedLanguage] = useState("");

  const socketRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const audioContextRef = useRef(null);
  const sourceRef = useRef(null);
  const processorRef = useRef(null);
  const silentGainRef = useRef(null);
  const connectTimeoutRef = useRef(null);

  const finalTranscriptRef = useRef("");
  const isStoppingRef = useRef(false);
  const mountedRef = useRef(false);
  const startingRef = useRef(false);
  const audioFrameCountRef = useRef(0);

  const clearConnectTimeout = useCallback(() => {
    if (connectTimeoutRef.current) {
      window.clearTimeout(connectTimeoutRef.current);
      connectTimeoutRef.current = null;
    }
  }, []);

  const cleanupAudio = useCallback(async () => {
    if (processorRef.current) {
      processorRef.current.onaudioprocess = null;
      try {
        processorRef.current.disconnect();
      } catch {}
      processorRef.current = null;
    }

    if (sourceRef.current) {
      try {
        sourceRef.current.disconnect();
      } catch {}
      sourceRef.current = null;
    }

    if (silentGainRef.current) {
      try {
        silentGainRef.current.disconnect();
      } catch {}
      silentGainRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {}
      });
      mediaStreamRef.current = null;
    }

    if (audioContextRef.current) {
      const context = audioContextRef.current;
      audioContextRef.current = null;

      if (context.state !== "closed") {
        try {
          await context.close();
        } catch {}
      }
    }
  }, []);

  const stopListening = useCallback(async () => {
    isStoppingRef.current = true;
    clearConnectTimeout();

    if (mountedRef.current) {
      setIsListening(false);
      setIsStarting(false);
      setIsProcessing(true);
    }

    await cleanupAudio();

    const socket = socketRef.current;

    if (socket?.readyState === WebSocket.OPEN) {
      try {
        socket.send(JSON.stringify({ type: "stop" }));
      } catch {
        try {
          socket.close();
        } catch {}
      }
    } else {
      if (
        socket &&
        socket.readyState !== WebSocket.CLOSED
      ) {
        try {
          socket.close();
        } catch {}
      }

      if (mountedRef.current) {
        setIsProcessing(false);
      }
    }
  }, [cleanupAudio, clearConnectTimeout]);

  const startListening = useCallback(async () => {
    if (
      startingRef.current ||
      isStarting ||
      isListening ||
      isProcessing
    ) {
      return;
    }

    startingRef.current = true;
    isStoppingRef.current = false;
    finalTranscriptRef.current = "";
    audioFrameCountRef.current = 0;

    setVoiceError("");
    setDetectedLanguage("");
    setIsStarting(true);
    setIsProcessing(false);

    if (
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia
    ) {
      startingRef.current = false;
      setIsStarting(false);
      setVoiceError(
        "Microphone access requires HTTPS and a supported browser."
      );
      return;
    }

    if (typeof WebSocket === "undefined") {
      startingRef.current = false;
      setIsStarting(false);
      setVoiceError(
        "Voice search is not supported in this browser."
      );
      return;
    }

    let socket = null;

    try {
      const mediaStream =
        await navigator.mediaDevices.getUserMedia({
          audio: {
            channelCount: 1,
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });

      // The component may have unmounted while the permission prompt
      // was open. Do not leave the microphone running in that case.
      if (!mountedRef.current || isStoppingRef.current) {
        mediaStream.getTracks().forEach((track) => track.stop());
        startingRef.current = false;
        return;
      }

      mediaStreamRef.current = mediaStream;

      const track = mediaStream.getAudioTracks()[0];
      console.log("KEERTHANA microphone track:", {
        label: track?.label,
        enabled: track?.enabled,
        muted: track?.muted,
        settings: track?.getSettings?.(),
      });

      socket = new WebSocket(buildVoiceSocketUrl());
      socket.binaryType = "arraybuffer";
      socketRef.current = socket;

      connectTimeoutRef.current = window.setTimeout(() => {
        if (
          socket.readyState === WebSocket.CONNECTING &&
          mountedRef.current
        ) {
          setVoiceError(
            "Voice search connection timed out. Please try again."
          );
          setIsStarting(false);
          setIsProcessing(false);
          startingRef.current = false;
          cleanupAudio();
          socket.close();
        }
      }, SOCKET_CONNECT_TIMEOUT_MS);

      socket.onopen = async () => {
        clearConnectTimeout();

        try {
          if (
            isStoppingRef.current ||
            !mountedRef.current
          ) {
            socket.close();
            return;
          }

          const AudioContextClass =
            window.AudioContext || window.webkitAudioContext;

          if (!AudioContextClass) {
            throw new Error(
              "Audio recording is not supported by this browser."
            );
          }

          const audioContext = new AudioContextClass();
          audioContextRef.current = audioContext;
          await audioContext.resume();

          if (
            isStoppingRef.current ||
            !mountedRef.current ||
            socket.readyState !== WebSocket.OPEN
          ) {
            await cleanupAudio();
            return;
          }

          const source =
            audioContext.createMediaStreamSource(mediaStream);
          sourceRef.current = source;

          // ScriptProcessorNode is used here to preserve compatibility
          // with the existing backend's raw PCM WebSocket protocol.
          const processor =
            audioContext.createScriptProcessor(4096, 1, 1);
          processorRef.current = processor;

          const silentGain = audioContext.createGain();
          silentGain.gain.value = 0;
          silentGainRef.current = silentGain;

          processor.onaudioprocess = (event) => {
            if (
              isStoppingRef.current ||
              socket.readyState !== WebSocket.OPEN
            ) {
              return;
            }

            const input =
              event.inputBuffer.getChannelData(0);

            const pcmBuffer = downsampleToPcm16(
              input,
              audioContext.sampleRate
            );

            if (!pcmBuffer.byteLength) return;

            audioFrameCountRef.current += 1;

            if (audioFrameCountRef.current % 12 === 0) {
              let rawMax = 0;
              let rawSumSquares = 0;

              for (let i = 0; i < input.length; i += 1) {
                rawMax = Math.max(rawMax, Math.abs(input[i]));
                rawSumSquares += input[i] * input[i];
              }

              const rawRms = Math.sqrt(
                rawSumSquares / input.length
              );

              console.log("KEERTHANA AUDIO DIAGNOSTIC:", {
                inputSampleRate: audioContext.sampleRate,
                targetSampleRate: TARGET_SAMPLE_RATE,
                bytes: pcmBuffer.byteLength,
                rawMax: Number(rawMax.toFixed(5)),
                rawRms: Number(rawRms.toFixed(5)),
                languageDetection: "AWS automatic",
              });
            }

            try {
              socket.send(pcmBuffer);
            } catch (error) {
              console.error(
                "KEERTHANA audio send error:",
                error
              );
            }
          };

          source.connect(processor);
          processor.connect(silentGain);
          silentGain.connect(audioContext.destination);

          startingRef.current = false;

          if (mountedRef.current) {
            setIsStarting(false);
            setIsListening(true);
            setIsProcessing(false);
          }
        } catch (error) {
          console.error(
            "KEERTHANA audio setup error:",
            error
          );

          startingRef.current = false;

          if (mountedRef.current) {
            setVoiceError(
              error?.message ||
                "Unable to start microphone audio."
            );
            setIsStarting(false);
            setIsListening(false);
            setIsProcessing(false);
          }

          await cleanupAudio();

          if (
            socket.readyState === WebSocket.OPEN ||
            socket.readyState === WebSocket.CONNECTING
          ) {
            socket.close();
          }
        }
      };

      socket.onmessage = (event) => {
        let message;

        try {
          message = JSON.parse(event.data);
        } catch {
          console.warn(
            "KEERTHANA received an unrecognized voice-search message."
          );
          return;
        }

        if (message.type === "transcript") {
          const transcriptText =
            String(message.text || "").trim();

          if (
            message.languageCode &&
            mountedRef.current
          ) {
            setDetectedLanguage(message.languageCode);
          }

          if (!transcriptText) return;

          if (message.isPartial) {
            const preview = [
              finalTranscriptRef.current,
              transcriptText,
            ]
              .filter(Boolean)
              .join(" ")
              .trim();

            if (mountedRef.current) {
              onChange(preview);
            }
          } else {
            finalTranscriptRef.current = [
              finalTranscriptRef.current,
              transcriptText,
            ]
              .filter(Boolean)
              .join(" ")
              .trim();

            if (mountedRef.current) {
              onChange(finalTranscriptRef.current);
            }
          }
        }

        if (message.type === "complete") {
          clearConnectTimeout();

          const transcript =
            finalTranscriptRef.current.trim();

          if (
            message.languageCode &&
            mountedRef.current
          ) {
            setDetectedLanguage(message.languageCode);
          }

          if (mountedRef.current) {
            setIsListening(false);
            setIsStarting(false);
            setIsProcessing(false);
          }

          startingRef.current = false;

          if (transcript) {
            if (mountedRef.current) {
              onChange(transcript);
              onSearch?.(transcript);
            }
          } else if (mountedRef.current) {
            setVoiceError(
              "No speech was detected. Please speak clearly and try again."
            );
          }

          if (socketRef.current === socket) {
            socketRef.current = null;
          }

          if (
            socket.readyState === WebSocket.OPEN ||
            socket.readyState === WebSocket.CONNECTING
          ) {
            socket.close();
          }

          cleanupAudio();
        }

        if (message.type === "error") {
          clearConnectTimeout();
          startingRef.current = false;

          if (mountedRef.current) {
            setVoiceError(
              message.message ||
                "Voice search failed. Please try again."
            );
            setIsListening(false);
            setIsStarting(false);
            setIsProcessing(false);
          }

          cleanupAudio();

          if (
            socket.readyState === WebSocket.OPEN ||
            socket.readyState === WebSocket.CONNECTING
          ) {
            socket.close();
          }
        }

        if (message.type === "limit") {
          if (mountedRef.current) {
            setVoiceError(
              message.message ||
                "Voice search limit reached."
            );
          }
          stopListening();
        }
      };

      socket.onerror = () => {
        clearConnectTimeout();
        startingRef.current = false;

        if (mountedRef.current) {
          setVoiceError(
            "Unable to connect to voice search. Check the backend WebSocket and ECS deployment."
          );
          setIsListening(false);
          setIsStarting(false);
          setIsProcessing(false);
        }

        cleanupAudio();
      };

      socket.onclose = () => {
        clearConnectTimeout();
        startingRef.current = false;
        cleanupAudio();

        if (socketRef.current === socket) {
          socketRef.current = null;
        }

        if (mountedRef.current) {
          setIsListening(false);
          setIsStarting(false);
          setIsProcessing(false);
        }
      };
    } catch (error) {
      console.error(
        "KEERTHANA voice-search startup error:",
        error
      );

      startingRef.current = false;
      clearConnectTimeout();
      await cleanupAudio();

      if (socketRef.current === socket) {
        socketRef.current = null;
      }

      if (
        socket &&
        socket.readyState !== WebSocket.CLOSED
      ) {
        try {
          socket.close();
        } catch {}
      }

      if (mountedRef.current) {
        setIsStarting(false);
        setIsListening(false);
        setIsProcessing(false);

        if (error?.name === "NotAllowedError") {
          setVoiceError(
            "Please allow microphone access in Chrome site settings."
          );
        } else if (error?.name === "NotFoundError") {
          setVoiceError(
            "No microphone was found on this device."
          );
        } else if (error?.name === "NotReadableError") {
          setVoiceError(
            "The microphone is busy or unavailable. Close other apps using it and try again."
          );
        } else {
          setVoiceError(
            error?.message ||
              "Unable to start voice search."
          );
        }
      }
    }
  }, [
    cleanupAudio,
    clearConnectTimeout,
    isListening,
    isProcessing,
    isStarting,
    onChange,
    onSearch,
    stopListening,
  ]);

  const toggleListening = () => {
    if (isListening || isStarting) {
      stopListening();
    } else if (!isProcessing) {
      startListening();
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const searchText = String(value || "").trim();

    if (searchText) {
      onSearch?.(searchText);
    }
  };

  const clearSearch = () => {
    if (isListening || isStarting) {
      stopListening();
    }

    onChange("");
    setVoiceError("");
    setDetectedLanguage("");
    finalTranscriptRef.current = "";
  };

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      isStoppingRef.current = true;
      startingRef.current = false;
      clearConnectTimeout();

      cleanupAudio();

      const socket = socketRef.current;

      if (socket) {
        try {
          socket.close();
        } catch {}
        socketRef.current = null;
      }
    };
  }, [cleanupAudio, clearConnectTimeout]);

  const isBusy = isStarting || isProcessing;

  return (
    <div className="keerthana-voice-search">
      <form
        className={`voice-search-bar ${
          isListening ? "is-listening" : ""
        }`}
        onSubmit={handleSubmit}
        role="search"
      >
        <span
          className="voice-search-leading-icon"
          aria-hidden="true"
        >
          <FaSearch />
        </span>

        <input
          type="search"
          value={value}
          onChange={(event) => {
            onChange(event.target.value);
            setVoiceError("");
          }}
          placeholder={
            isListening
              ? "Listening… speak in any supported language"
              : placeholder
          }
          aria-label={ariaLabel}
          autoComplete="off"
        />

        {value && (
          <button
            type="button"
            className="voice-search-clear"
            onClick={clearSearch}
            aria-label="Clear search"
            title="Clear search"
          >
            <FaTimes />
          </button>
        )}

        <button
          type="button"
          className={`voice-search-mic ${
            isListening ? "is-active" : ""
          }`}
          onClick={toggleListening}
          disabled={isProcessing}
          aria-label={
            isListening
              ? "Stop voice search"
              : isStarting
                ? "Connecting to voice search"
                : isProcessing
                  ? "Processing voice search"
                  : "Start voice search"
          }
          aria-pressed={isListening}
          title={
            isListening
              ? "Stop listening"
              : isStarting
                ? "Connecting to voice search"
                : isProcessing
                  ? "Processing speech"
                  : "Search by voice"
          }
        >
          {isListening ? (
            <FaMicrophoneSlash />
          ) : (
            <FaMicrophone />
          )}
        </button>
      </form>

      <div
        className="voice-search-feedback"
        aria-live="polite"
        role="status"
      >
        {isStarting ? (
          "Connecting to voice search…"
        ) : isListening ? (
          <>
            <span className="voice-search-pulse" />
            Listening… Speak in Telugu, Hindi, English,
            Malayalam, Kannada or Tamil.
          </>
        ) : isProcessing ? (
          "Processing your speech…"
        ) : voiceError ? (
          <span className="voice-search-error">
            {voiceError}
          </span>
        ) : detectedLanguage ? (
          `Detected language: ${getLanguageLabel(
            detectedLanguage
          )}`
        ) : null}
      </div>
    </div>
  );
}

export default VoiceSearch;
