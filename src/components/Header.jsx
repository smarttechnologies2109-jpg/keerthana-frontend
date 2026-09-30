import React, {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  FaBars,
  FaBell,
  FaChevronLeft,
  FaChevronRight,
  FaMicrophone,
  FaMicrophoneSlash,
  FaSearch,
  FaUser,
  FaMusic,
} from "react-icons/fa";

import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationsContext";

import "../assets/css/header.css";

function Header({ onToggleSidebar }) {
  const navigate = useNavigate();
  const location = useLocation();

  const { user } = useAuth();
  const { unreadCount } = useNotifications();

  /* =====================================================
     SEARCH
  ===================================================== */

  const [searchValue, setSearchValue] = useState("");

  /* =====================================================
     VOICE SEARCH
  ===================================================== */

  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(true);

  const recognitionRef = useRef(null);

  /* =====================================================
     PAGE TITLE
  ===================================================== */

  const getPageTitle = () => {
    const path = location.pathname;

    if (path === "/" || path === "/home") {
      return "Home";
    }

    if (path.startsWith("/search")) {
      return "Search";
    }

    if (path.startsWith("/library")) {
      return "Your Library";
    }

    if (
      path.startsWith("/song") ||
      path.startsWith("/songs")
    ) {
      return "Songs";
    }

    if (
      path.startsWith("/artist") ||
      path.startsWith("/artists")
    ) {
      return "Artists";
    }

    if (
      path.startsWith("/album") ||
      path.startsWith("/albums")
    ) {
      return "Albums";
    }

    if (path.startsWith("/liked-songs")) {
      return "Liked Songs";
    }

    if (path.startsWith("/favorites")) {
      return "Favorites";
    }

    if (path.startsWith("/playlists")) {
      return "Playlists";
    }

    if (path.startsWith("/history")) {
      return "Listening History";
    }

    if (path.startsWith("/premium")) {
      return "Premium";
    }

    if (path.startsWith("/profile")) {
      return "Profile";
    }

    if (path.startsWith("/offline-songs")) {
      return "Offline Songs";
    }

    if (path.startsWith("/notifications")) {
      return "Notifications";
    }

    return "KEERTHANA";
  };

  /* =====================================================
     SEARCH SUBMIT
  ===================================================== */

  const handleSearchSubmit = (event) => {
    event.preventDefault();

    const value = searchValue.trim();

    if (!value) {
      navigate("/search");
      return;
    }

    navigate(
      `/search?q=${encodeURIComponent(value)}`
    );
  };

  /* =====================================================
     VOICE SEARCH SETUP
  ===================================================== */

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setVoiceSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();

    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.lang = "en-IN";

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      let transcript = "";

      for (
        let index = event.resultIndex;
        index < event.results.length;
        index++
      ) {
        transcript +=
          event.results[index][0].transcript;
      }

      transcript = transcript.trim();

      if (transcript) {
        setSearchValue(transcript);
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
        navigate(
          `/search?q=${encodeURIComponent(
            transcript
          )}`
        );
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

    recognitionRef.current = recognition;

    return () => {
      try {
        recognition.stop();
      } catch {
        // Ignore cleanup errors
      }

      recognitionRef.current = null;
    };
  }, [navigate]);

  /* =====================================================
     VOICE SEARCH CONTROL
  ===================================================== */

  const startVoiceSearch = () => {
    if (!recognitionRef.current) {
      return;
    }

    try {
      recognitionRef.current.start();
    } catch (error) {
      console.error(
        "Unable to start voice search:",
        error
      );
    }
  };

  const stopVoiceSearch = () => {
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

  const handleVoiceSearch = () => {
    if (!voiceSupported) {
      alert(
        "Voice search is not supported in this browser. Please use Google Chrome or Microsoft Edge."
      );

      return;
    }

    if (isListening) {
      stopVoiceSearch();
    } else {
      startVoiceSearch();
    }
  };

  /* =====================================================
     KEYBOARD SEARCH SHORTCUT
  ===================================================== */

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key !== "/") {
        return;
      }

      const target = event.target;

      const isTyping =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      if (isTyping) {
        return;
      }

      event.preventDefault();

      const searchInput =
        document.querySelector(
          ".header-search-input"
        );

      searchInput?.focus();
    };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, []);

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <header className="keerthana-header">

      {/* =================================================
          LEFT
      ================================================= */}

      <div className="keerthana-header-left">

        {/* MENU */}

        <button
          type="button"
          className="header-menu-button"
          onClick={onToggleSidebar}
          aria-label="Open menu"
          title="Open menu"
        >
          <FaBars />
        </button>

        {/* DESKTOP NAVIGATION */}

        <div className="header-history-buttons">

          <button
            type="button"
            className="header-circle-button"
            onClick={() => navigate(-1)}
            aria-label="Go back"
            title="Go back"
          >
            <FaChevronLeft />
          </button>

          <button
            type="button"
            className="header-circle-button"
            onClick={() => navigate(1)}
            aria-label="Go forward"
            title="Go forward"
          >
            <FaChevronRight />
          </button>

        </div>

        {/* MOBILE BRAND */}

        <Link
          to="/home"
          className="header-mobile-brand"
        >
          <div className="header-mobile-logo">
            <FaMusic />
          </div>

          <div className="header-mobile-brand-text">
            <strong>KEERTHANA</strong>
            <span>Christian Music</span>
          </div>
        </Link>

        {/* PAGE TITLE */}

        <div className="header-page-info">

          <span>KEERTHANA</span>

          <h2>
            {getPageTitle()}
          </h2>

        </div>

      </div>

      {/* =================================================
          RIGHT
      ================================================= */}

      <div className="keerthana-header-right">

        {/* SEARCH */}

        <form
          className={`header-search-box ${
            isListening
              ? "header-search-listening"
              : ""
          }`}
          onSubmit={handleSearchSubmit}
        >

          <FaSearch className="header-search-icon" />

          <input
            type="text"
            name="search"
            value={searchValue}
            onChange={(event) =>
              setSearchValue(
                event.target.value
              )
            }
            className="header-search-input"
            placeholder={
              isListening
                ? "Listening..."
                : "Search songs, artists..."
            }
            autoComplete="off"
            aria-label="Search"
          />

          {/* VOICE */}

          {voiceSupported && (
            <button
              type="button"
              className={`header-voice-button ${
                isListening
                  ? "header-voice-button-active"
                  : ""
              }`}
              onClick={handleVoiceSearch}
              title={
                isListening
                  ? "Stop listening"
                  : "Voice search"
              }
              aria-label={
                isListening
                  ? "Stop listening"
                  : "Voice search"
              }
            >
              {isListening ? (
                <FaMicrophoneSlash />
              ) : (
                <FaMicrophone />
              )}
            </button>
          )}

          {/* KEYBOARD */}

          <kbd>/</kbd>

        </form>

        {/* NOTIFICATIONS */}

        <Link
          to="/notifications"
          className="header-notification-button"
          title="Notifications"
          aria-label="Notifications"
        >
          <FaBell />

          {unreadCount > 0 && (
            <span className="header-notification-badge">
              {unreadCount > 99
                ? "99+"
                : unreadCount}
            </span>
          )}
        </Link>

        {/* LOGIN */}

        {!user && (
          <button
            type="button"
            className="header-login-button"
            onClick={() =>
              navigate("/login")
            }
          >
            <FaUser />

            <span>Login</span>
          </button>
        )}

      </div>

    </header>
  );
}

export default Header;