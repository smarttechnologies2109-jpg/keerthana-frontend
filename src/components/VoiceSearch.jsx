
import React, {
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

/* =========================================================
   SUPPORTED VOICE SEARCH LANGUAGES
========================================================= */

const LANGUAGES = [
  { value: "te-IN", label: "తెలుగు (Telugu)" },
  { value: "hi-IN", label: "हिन्दी (Hindi)" },
  { value: "en-IN", label: "English" },
  { value: "ml-IN", label: "മലയാളം (Malayalam)" },
  { value: "kn-IN", label: "ಕನ್ನಡ (Kannada)" },
  { value: "ta-IN", label: "தமிழ் (Tamil)" },
];

/* =========================================================
   KEERTHANA VOICE SEARCH
========================================================= */

function VoiceSearch({
  value = "",
  onChange = () => {},
  onSearch,
  language = "en-IN",
  onLanguageChange,
  placeholder = "Search songs...",
  ariaLabel = "Search",
}) {
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState("");

  const recognitionRef = useRef(null);

  const SpeechRecognition =
    typeof window !== "undefined"
      ? window.SpeechRecognition ||
        window.webkitSpeechRecognition
      : null;

  const supported = Boolean(SpeechRecognition);

  /* =======================================================
     CLEAN UP SPEECH RECOGNITION
  ======================================================= */

  useEffect(() => {
    return () => {
      const recognition = recognitionRef.current;

      if (recognition) {
        recognition.onstart = null;
        recognition.onresult = null;
        recognition.onerror = null;
        recognition.onend = null;

        try {
          recognition.abort();
        } catch {
          // Recognition may already have stopped.
        }

        recognitionRef.current = null;
      }
    };
  }, []);

  /* =======================================================
     STOP LISTENING
  ======================================================= */

  const stopListening = () => {
    const recognition = recognitionRef.current;

    if (recognition) {
      try {
        recognition.stop();
      } catch {
        // Recognition may already have stopped.
      }
    }

    setIsListening(false);
  };

  /* =======================================================
     START / STOP VOICE SEARCH
  ======================================================= */

  const toggleListening = () => {
    setVoiceError("");

    if (!supported) {
      setVoiceError(
        "Voice search is not supported in this browser."
      );
      return;
    }

    if (isListening) {
      stopListening();
      return;
    }

    try {
      const recognition = new SpeechRecognition();

      recognitionRef.current = recognition;
      recognition.lang = language;
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        let transcript = "";

        for (
          let i = event.resultIndex;
          i < event.results.length;
          i += 1
        ) {
          transcript += event.results[i][0].transcript;
        }

        const cleaned = transcript.trim();

        if (cleaned) {
          onChange(cleaned);

          const lastResult =
            event.results[event.results.length - 1];

          if (lastResult?.isFinal) {
            onSearch?.(cleaned);
          }
        }
      };

      recognition.onerror = (event) => {
        setIsListening(false);

        if (
          event.error === "not-allowed" ||
          event.error === "service-not-allowed"
        ) {
          setVoiceError(
            "Allow microphone access in your browser to use voice search."
          );
        } else if (event.error === "no-speech") {
          setVoiceError(
            "No speech detected. Please try again."
          );
        } else if (event.error !== "aborted") {
          setVoiceError(
            "Voice search couldn't hear that. Please try again."
          );
        }
      };

      recognition.onend = () => {
        setIsListening(false);

        if (recognitionRef.current === recognition) {
          recognitionRef.current = null;
        }
      };

      recognition.start();
    } catch {
      setIsListening(false);
      recognitionRef.current = null;

      setVoiceError(
        "Unable to start voice search. Please try again."
      );
    }
  };

  /* =======================================================
     SUBMIT TYPED SEARCH
  ======================================================= */

  const handleSubmit = (event) => {
    event.preventDefault();

    const query = String(value || "").trim();

    if (query) {
      onSearch?.(query);
    }
  };

  /* =======================================================
     CLEAR SEARCH
  ======================================================= */

  const clearSearch = () => {
    onChange("");
    setVoiceError("");
  };

  /* =======================================================
     RENDER
  ======================================================= */

  const selectedLanguage = LANGUAGES.find(
    (item) => item.value === language
  );

  return (
    <div className="keerthana-voice-search">
      {/* SEARCH INPUT */}

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
              ? "Listening… speak now"
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
          aria-label={
            isListening
              ? "Stop voice search"
              : "Start voice search"
          }
          aria-pressed={isListening}
          title={
            !supported
              ? "Voice search is not supported in this browser"
              : isListening
                ? "Stop listening"
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

      {/* LANGUAGE SELECTOR BELOW SEARCH BAR */}

      <div className="voice-search-options">
        <label htmlFor="voice-search-language">
          Voice search language
        </label>

        <select
          id="voice-search-language"
          value={language}
          onChange={(event) => {
            onLanguageChange?.(event.target.value);
            setVoiceError("");

            if (isListening) {
              stopListening();
            }
          }}
          aria-label="Voice search language"
        >
          {LANGUAGES.map((item) => (
            <option
              key={item.value}
              value={item.value}
            >
              {item.label}
            </option>
          ))}
        </select>
      </div>

      {/* VOICE SEARCH STATUS */}

      <div
        className="voice-search-feedback"
        aria-live="polite"
        role="status"
      >
        {isListening ? (
          <>
            <span className="voice-search-pulse" />

            Listening in{" "}
            {selectedLanguage?.label || language}
          </>
        ) : voiceError ? (
          <span className="voice-search-error">
            {voiceError}
          </span>
        ) : (
          <span>
            {/* {supported
              ? "Type a playlist name or tap the microphone to speak."
              : "Type to search. Voice search is unavailable in this browser."} */}
          </span>
        )}
      </div>
    </div>
  );
}

export default VoiceSearch;
