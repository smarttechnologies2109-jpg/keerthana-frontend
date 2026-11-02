
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
        track.stop();
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

    if (mountedRef.current) {
      setIsListening(false);
      setIsProcessing(true);
    }

    await cleanupAudio();

    const socket = socketRef.current;

    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: "stop" }));
    } else if (
      socket &&
      socket.readyState !== WebSocket.CLOSED
    ) {
      socket.close();
    } else if (mountedRef.current) {
      setIsProcessing(false);
    }
  }, [cleanupAudio]);

  const startListening = useCallback(async () => {
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
        "Microphone access requires a supported browser and secure connection."
      );
      return;
    }

    if (typeof WebSocket === "undefined") {
      setVoiceError("Voice search is not supported in this browser.");
      return;
    }

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

      const socket = new WebSocket(VOICE_WS_URL);
      socket.binaryType = "arraybuffer";
      socketRef.current = socket;

      socket.onopen = async () => {
        try {
          if (isStoppingRef.current) {
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

          const source =
            audioContext.createMediaStreamSource(mediaStream);

          sourceRef.current = source;

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

            if (pcmBuffer.byteLength > 0) {
              socket.send(pcmBuffer);

              // Log one audio frame approximately every second.
              audioFrameCountRef.current++;

              if (audioFrameCountRef.current % 12 === 0) {
                let maxAmplitude = 0;

                const pcm = new Int16Array(pcmBuffer);

                for (let i = 0; i < pcm.length; i++) {
                  maxAmplitude = Math.max(
                    maxAmplitude,
                    Math.abs(pcm[i])
                  );
                }

                console.log("KEERTHANA microphone diagnostic:", {
                  sampleRate: TARGET_SAMPLE_RATE,
                  bytes: pcmBuffer.byteLength,
                  maxAmplitude,
                });
              }
            }
          };

          source.connect(processor);
          processor.connect(silentGain);
          silentGain.connect(audioContext.destination);

          if (mountedRef.current) {
            setIsListening(true);
            setIsProcessing(false);
          }
        } catch (error) {
          if (mountedRef.current) {
            setVoiceError(
              error.message || "Unable to start microphone audio."
            );
          }

          await cleanupAudio();

          if (socket.readyState === WebSocket.OPEN) {
            socket.close();
          }
        }
      };

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

          if (message.languageCode) {
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

          if (message.languageCode) {
            setDetectedLanguage(message.languageCode);
          }

          setIsListening(false);
          setIsProcessing(false);

          if (transcript) {
            onChange(transcript);
            onSearch?.(transcript);
          } else if (mountedRef.current) {
            setVoiceError(
              "No speech was detected. Please try again."
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
          setVoiceError(
            message.message || "Voice search failed. Please try again."
          );

          setIsListening(false);
          setIsProcessing(false);
          cleanupAudio();

          if (socket.readyState === WebSocket.OPEN) {
            socket.close();
          }
        }

        if (message.type === "limit") {
          setVoiceError(message.message || "Voice search limit reached.");
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
      await cleanupAudio();

      setIsListening(false);
      setIsProcessing(false);

      if (error.name === "NotAllowedError") {
        setVoiceError(
          "Please allow microphone access to use voice search."
        );
      } else if (error.name === "NotFoundError") {
        setVoiceError("No microphone was found on this device.");
      } else {
        setVoiceError(
          error.message || "Unable to start voice search."
        );
      }
    }
  }, [cleanupAudio, onChange, onSearch, stopListening]);

  const toggleListening = () => {
    if (isListening) {
      stopListening();
      return;
    }

    if (isProcessing) return;

    startListening();
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
            isListening ? "Listening… speak now" : placeholder
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

      <div
        className="voice-search-feedback"
        aria-live="polite"
        role="status"
      >
        {isListening ? (
          <>
            <span className="voice-search-pulse" />
            Listening… speak in Telugu
          </>
        ) : isProcessing ? (
          "Processing your speech…"
        ) : voiceError ? (
          <span className="voice-search-error">
            {voiceError}
          </span>
        ) : detectedLanguage ? (
          `Detected language: ${detectedLanguage}`
        ) : null}
      </div>
    </div>
  );
}

export default VoiceSearch;
