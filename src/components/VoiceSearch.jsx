import React, {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  FaMicrophone,
  FaMicrophoneSlash,
  FaSearch,
} from "react-icons/fa";

import "../assets/css/voiceSearch.css";

function VoiceSearch({
  value,
  onChange,
  onSearch,
  language = "en-IN",
}) {
  const [isListening, setIsListening] =
    useState(false);

  const [supported, setSupported] =
    useState(true);

  const recognitionRef =
    useRef(null);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSupported(false);
      return;
    }

    const recognition =
      new SpeechRecognition();

    recognition.continuous = false;

    recognition.interimResults = true;

    recognition.maxAlternatives = 1;

    recognition.lang = language;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      let transcript = "";

      for (
        let i = event.resultIndex;
        i < event.results.length;
        i++
      ) {
        transcript +=
          event.results[i][0].transcript;
      }

      transcript =
        transcript.trim();

      if (transcript) {
        onChange?.(transcript);
      }

      const lastResult =
        event.results[
          event.results.length - 1
        ];

      if (
        lastResult &&
        lastResult.isFinal &&
        transcript
      ) {
        onSearch?.(transcript);
      }
    };

    recognition.onerror = (event) => {
      console.error(
        "Voice search error:",
        event.error
      );

      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current =
      recognition;

    return () => {
      try {
        recognition.stop();
      } catch (error) {
        // Ignore cleanup errors
      }
    };
  }, [
    language,
    onChange,
    onSearch,
  ]);

  const startListening = () => {
    if (!recognitionRef.current) {
      return;
    }

    try {
      recognitionRef.current.lang =
        language;

      recognitionRef.current.start();
    } catch (error) {
      console.error(
        "Unable to start voice search:",
        error
      );
    }
  };

  const stopListening = () => {
    if (!recognitionRef.current) {
      return;
    }

    try {
      recognitionRef.current.stop();
    } catch (error) {
      console.error(
        "Unable to stop voice search:",
        error
      );
    }

    setIsListening(false);
  };

  const handleMicClick = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const query =
      String(value || "").trim();

    if (!query) {
      return;
    }

    onSearch?.(query);
  };

  if (!supported) {
    return (
      <div className="voice-search-wrapper">
        <div className="voice-search-not-supported">
          Voice search is not supported
          in this browser.
        </div>
      </div>
    );
  }

  return (
    <form
      className={`voice-search-wrapper ${
        isListening
          ? "voice-search-is-listening"
          : ""
      }`}
      onSubmit={handleSubmit}
    >
      <div className="voice-search-box">

        <FaSearch
          className="voice-search-icon"
        />

        <input
          type="text"
          value={value || ""}
          onChange={(event) =>
            onChange?.(
              event.target.value
            )
          }
          placeholder={
            isListening
              ? "Listening..."
              : "Search songs, artists..."
          }
          className="voice-search-input"
          autoComplete="off"
        />

        <button
          type="button"
          className={`voice-search-mic ${
            isListening
              ? "voice-search-mic-active"
              : ""
          }`}
          onClick={handleMicClick}
          title={
            isListening
              ? "Stop listening"
              : "Voice search"
          }
          aria-label={
            isListening
              ? "Stop listening"
              : "Start voice search"
          }
        >
          {isListening ? (
            <FaMicrophoneSlash />
          ) : (
            <FaMicrophone />
          )}
        </button>

        <button
          type="submit"
          className="voice-search-submit"
          title="Search"
          aria-label="Search"
        >
          <FaSearch />
        </button>

      </div>

      {isListening && (
        <div className="voice-search-status">

          <span className="voice-search-pulse"></span>

          <span>
            Listening... Speak now
          </span>

        </div>
      )}
    </form>
  );
}

export default VoiceSearch;