
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

const LANGUAGE_LABELS = {
  "te-IN": "తెలుగు (Telugu)",
  "hi-IN": "हिन्दी (Hindi)",
  "en-IN": "English (India)",
  "ml-IN": "മലയാളം (Malayalam)",
  "kn-IN": "ಕನ್ನಡ (Kannada)",
  "ta-IN": "தமிழ் (Tamil)",
};

function getLanguageLabel(code) {
  return LANGUAGE_LABELS[code] || code;
}

// Connect without forcing any language.
// AWS automatically identifies the spoken language.
function buildVoiceSocketUrl() {
  const url = new URL(VOICE_WS_URL);

  url.searchParams.delete("language");

  return url.toString();
}

// Convert browser Float32 audio to mono,
// signed 16-bit PCM at 16 kHz.
function downsampleToPcm16(input, inputSampleRate) {
  if (!input?.length || !inputSampleRate) {
    return new ArrayBuffer(0);
  }

  if (inputSampleRate === TARGET_SAMPLE_RATE) {
    const pcm = new Int16Array(input.length);

    for (let i = 0; i < input.length; i++) {
      const sample = Math.max(-1, Math.min(1, input[i]));

      pcm[i] =
        sample < 0
          ? Math.round(sample * 0x8000)
          : Math.round(sample * 0x7fff);
    }

    return pcm.buffer;
  }

  const ratio = inputSampleRate / TARGET_SAMPLE_RATE;
  const outputLength = Math.floor(input.length / ratio);

  if (outputLength <= 0) {
    return new ArrayBuffer(0);
  }

  const pcm = new Int16Array(outputLength);

  for (let i = 0; i < outputLength; i++) {
    const start = Math.floor(i * ratio);

    const end = Math.min(
      Math.floor((i + 1) * ratio),
      input.length
    );

    let total = 0;
    let count = 0;

    for (let j = start; j < end; j++) {
      total += input[j];
      count++;
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
  const [isProcessing, setIsProcessing] = useState(false);
  const [voiceError, setVoiceError] = useState("");
  const [detectedLanguage, setDetectedLanguage] = useState("");

  const socketRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const audioContextRef = useRef(null);
  const sourceRef = useRef(null);
  const processorRef = useRef(null);
  const silentGainRef = useRef(null);

  const finalTranscriptRef = useRef("");
  const isStoppingRef = useRef(false);
  const mountedRef = useRef(true);
  const audioFrameCountRef = useRef(0);

  // Clean up microphone and audio processing.
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
      mediaStreamRef.current
        .getTracks()
        .forEach((track) => track.stop());

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

  // Stop recording and ask AWS to finish transcription.
  const stopListening = useCallback(async () => {
    isStoppingRef.current = true;

    if (mountedRef.current) {
      setIsListening(false);
      setIsProcessing(true);
    }

    await cleanupAudio();

    const socket = socketRef.current;

    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: "stop" }));
    } else {
      if (
        socket &&
        socket.readyState !== WebSocket.CLOSED
      ) {
        socket.close();
      }

      if (mountedRef.current) {
        setIsProcessing(false);
      }
    }
  }, [cleanupAudio]);

  // Start automatic voice recognition.
  const startListening = useCallback(async () => {
    if (isListening || isProcessing) return;

    setVoiceError("");
    setDetectedLanguage("");

    finalTranscriptRef.current = "";
    audioFrameCountRef.current = 0;
    isStoppingRef.current = false;

    if (
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia
    ) {
      setVoiceError(
        "Microphone access requires HTTPS and a supported browser."
      );
      return;
    }

    if (typeof WebSocket === "undefined") {
      setVoiceError(
        "Voice search is not supported in this browser."
      );
      return;
    }

    let socket;

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

      mediaStreamRef.current = mediaStream;

      const track = mediaStream.getAudioTracks()[0];

      console.log("KEERTHANA microphone track:", {
        label: track?.label,
        enabled: track?.enabled,
        muted: track?.muted,
        settings: track?.getSettings?.(),
      });

      // No language query parameter.
      // AWS detects the language automatically.
      const socketUrl = buildVoiceSocketUrl();

      console.log("KEERTHANA automatic voice detection:", {
        socketUrl,
        supportedLanguages: Object.keys(LANGUAGE_LABELS),
      });

      socket = new WebSocket(socketUrl);

      socket.binaryType = "arraybuffer";
      socketRef.current = socket;

      socket.onopen = async () => {
        try {
          if (isStoppingRef.current) {
            socket.close();
            return;
          }

          const AudioContextClass =
            window.AudioContext ||
            window.webkitAudioContext;

          if (!AudioContextClass) {
            throw new Error(
              "Audio recording is not supported by this browser."
            );
          }

          const audioContext = new AudioContextClass();

          audioContextRef.current = audioContext;

          await audioContext.resume();

          const source =
            audioContext.createMediaStreamSource(mediaStream);

          sourceRef.current = source;

          const processor =
            audioContext.createScriptProcessor(4096, 1, 1);

          processorRef.current = processor;

          // Keep the processor running silently.
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

            if (pcmBuffer.byteLength === 0) return;

            audioFrameCountRef.current += 1;

            // Audio diagnostics approximately once per second.
            if (audioFrameCountRef.current % 12 === 0) {
              let rawMax = 0;
              let rawSumSquares = 0;

              for (let i = 0; i < input.length; i++) {
                rawMax = Math.max(
                  rawMax,
                  Math.abs(input[i])
                );

                rawSumSquares += input[i] * input[i];
              }

              const rawRms = Math.sqrt(
                rawSumSquares / input.length
              );

              let pcmMin = 32767;
              let pcmMax = -32768;
              let pcmSumSquares = 0;

              const pcm = new Int16Array(pcmBuffer);

              for (let i = 0; i < pcm.length; i++) {
                const sample = pcm[i];

                pcmMin = Math.min(pcmMin, sample);
                pcmMax = Math.max(pcmMax, sample);

                pcmSumSquares += sample * sample;
              }

              const pcmRms = Math.sqrt(
                pcmSumSquares / pcm.length
              );

              console.log("KEERTHANA AUDIO DIAGNOSTIC:", {
                inputSampleRate: audioContext.sampleRate,
                targetSampleRate: TARGET_SAMPLE_RATE,
                bytes: pcmBuffer.byteLength,
                rawMax: Number(rawMax.toFixed(5)),
                rawRms: Number(rawRms.toFixed(5)),
                pcmMin,
                pcmMax,
                pcmRms: Math.round(pcmRms),
                languageDetection: "AWS automatic",
              });
            }

            socket.send(pcmBuffer);
          };

          source.connect(processor);
          processor.connect(silentGain);
          silentGain.connect(audioContext.destination);

          if (mountedRef.current) {
            setIsListening(true);
            setIsProcessing(false);
          }
        } catch (error) {
          console.error(
            "KEERTHANA audio setup error:",
            error
          );

          if (mountedRef.current) {
            setVoiceError(
              error.message ||
              "Unable to start microphone audio."
            );

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

      // Receive AWS transcription and detected language.
      socket.onmessage = (event) => {
        let message;

        try {
          message = JSON.parse(event.data);
        } catch {
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

            onChange(preview);
          } else {
            finalTranscriptRef.current = [
              finalTranscriptRef.current,
              transcriptText,
            ]
              .filter(Boolean)
              .join(" ")
              .trim();

            onChange(finalTranscriptRef.current);
          }
        }

        if (message.type === "complete") {
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
            setIsProcessing(false);
          }

          if (transcript) {
            onChange(transcript);
            onSearch?.(transcript);
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
        }

        if (message.type === "error") {
          if (mountedRef.current) {
            setVoiceError(
              message.message ||
              "Voice search failed. Please try again."
            );

            setIsListening(false);
            setIsProcessing(false);
          }

          cleanupAudio();

          if (socket.readyState === WebSocket.OPEN) {
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
        if (!mountedRef.current) return;

        setVoiceError(
          "Unable to connect to voice search. Check the backend WebSocket and ECS deployment."
        );

        setIsListening(false);
        setIsProcessing(false);

        cleanupAudio();
      };

      socket.onclose = () => {
        cleanupAudio();

        if (socketRef.current === socket) {
          socketRef.current = null;
        }

        if (mountedRef.current) {
          setIsListening(false);
          setIsProcessing(false);
        }
      };
    } catch (error) {
      console.error(
        "KEERTHANA voice-search startup error:",
        error
      );

      await cleanupAudio();

      if (mountedRef.current) {
        setIsListening(false);
        setIsProcessing(false);

        if (error.name === "NotAllowedError") {
          setVoiceError(
            "Please allow microphone access in Chrome site settings."
          );
        } else if (error.name === "NotFoundError") {
          setVoiceError(
            "No microphone was found on this device."
          );
        } else {
          setVoiceError(
            error.message ||
            "Unable to start voice search."
          );
        }
      }
    }
  }, [
    cleanupAudio,
    isListening,
    isProcessing,
    onChange,
    onSearch,
    stopListening,
  ]);

  const toggleListening = () => {
    if (isListening) {
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
    if (isListening) {
      stopListening();
    }

    onChange("");
    setVoiceError("");
    setDetectedLanguage("");

    finalTranscriptRef.current = "";
  };

  // Component cleanup.
  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      isStoppingRef.current = true;

      cleanupAudio();

      const socket = socketRef.current;

      if (socket) {
        try {
          socket.close();
        } catch {}

        socketRef.current = null;
      }
    };
  }, [cleanupAudio]);

  return (
    <div className="keerthana-voice-search">

      {/* Search bar */}
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
              : isProcessing
                ? "Processing voice search"
                : "Start voice search"
          }
          aria-pressed={isListening}
          title={
            isListening
              ? "Stop listening"
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

      {/* Voice feedback */}
      <div
        className="voice-search-feedback"
        aria-live="polite"
        role="status"
      >
        {isListening ? (
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
