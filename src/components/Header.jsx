import React, {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  FaChevronLeft,
  FaChevronRight,
  FaSearch,
  FaUser,
  FaSignOutAlt,
  FaBars,
  FaMicrophone,
  FaMicrophoneSlash,
} from "react-icons/fa";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../context/AuthContext";

import "../assets/css/header.css";

function Header({ onToggleSidebar }) {
  const navigate = useNavigate();
  const location = useLocation();

  const { user, logout } = useAuth();

  /* =====================================================
     VOICE SEARCH
  ===================================================== */

  const [searchValue, setSearchValue] =
    useState("");

  const [isListening, setIsListening] =
    useState(false);

  const [voiceSupported, setVoiceSupported] =
    useState(true);

  const recognitionRef =
    useRef(null);

  /* =====================================================
     PAGE TITLE
  ===================================================== */

  const getPageTitle = () => {
    const path = location.pathname;

    if (path === "/") {
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

    return "KEERTHANA";
  };

  /* =====================================================
     LOGOUT
  ===================================================== */

  const handleLogout = () => {
    logout();

    navigate(
      "/login",
      {
        replace: true,
      }
    );
  };

  /* =====================================================
     SEARCH
  ===================================================== */

  const handleSearchSubmit = (event) => {
    event.preventDefault();

    const value =
      String(searchValue || "").trim();

    if (!value) {
      navigate("/search");
      return;
    }

    navigate(
      `/search?q=${encodeURIComponent(value)}`
    );
  };

  /* =====================================================
     VOICE SEARCH
  ===================================================== */

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setVoiceSupported(false);
      return;
    }

    const recognition =
      new SpeechRecognition();

    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    // Voice language
    recognition.lang = "en-IN";

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

    recognitionRef.current =
      recognition;

    return () => {
      try {
        recognition.stop();
      } catch (error) {
        // Ignore cleanup errors
      }

      recognitionRef.current = null;
    };
  }, [navigate]);

  /* =====================================================
     START VOICE SEARCH
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

  /* =====================================================
     STOP VOICE SEARCH
  ===================================================== */

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

  /* =====================================================
     VOICE BUTTON
  ===================================================== */

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
     KEYBOARD SEARCH
  ===================================================== */

  const handleSearchKeyDown = (event) => {
    if (event.key !== "/") {
      return;
    }

    const target =
      event.target;

    if (
      target.tagName !== "INPUT" &&
      target.tagName !== "TEXTAREA"
    ) {
      event.preventDefault();

      const searchInput =
        document.querySelector(
          ".header-search-input"
        );

      if (searchInput) {
        searchInput.focus();
      }
    }
  };

  useEffect(() => {
    window.addEventListener(
      "keydown",
      handleSearchKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleSearchKeyDown
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

        {/* MOBILE HAMBURGER */}

        <button
          type="button"
          className="header-menu-button"
          onClick={onToggleSidebar}
          aria-label="Open menu"
          title="Open menu"
        >
          <FaBars />
        </button>


        {/* BACK / FORWARD */}

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

        <div className="header-mobile-brand">

          <div className="header-mobile-logo">
            ♪
          </div>

          <div className="header-mobile-brand-text">

            <strong>
              KEERTHANA
            </strong>

            <span>
              Christian Music
            </span>

          </div>

        </div>


        {/* CURRENT PAGE TITLE */}

        <div className="header-page-info">

          <span>
            KEERTHANA
          </span>

          <h2>
            {getPageTitle()}
          </h2>

        </div>

      </div>


      {/* =================================================
          RIGHT
      ================================================= */}

      <div className="keerthana-header-right">


        {/* =================================================
            SEARCH + VOICE SEARCH
        ================================================= */}

        <form
          className={`header-search-box ${
            isListening
              ? "header-search-listening"
              : ""
          }`}
          onSubmit={handleSearchSubmit}
        >

          {/* SEARCH ICON */}

          <FaSearch
            className="header-search-icon"
          />


          {/* SEARCH INPUT */}

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
          />


          {/* VOICE SEARCH BUTTON */}

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


          {/* KEYBOARD SHORTCUT */}

          <kbd>
            /
          </kbd>

        </form>


        {/* =================================================
            USER ACCOUNT INDICATOR
            NO PROFILE NAVIGATION
        ================================================= */}

        {!user ? (

          <button
            type="button"
            className="header-login-button"
            onClick={() =>
              navigate("/login")
            }
          >

            <FaUser />

            <span>
              Login
            </span>

          </button>

        ) : (

          <div className="header-user">

            {/* USER DISPLAY ONLY */}

            {/* <div
              className="header-profile-display"
              title={user?.name || "User"}
             >

              <div className="header-avatar">

                {user?.name
                  ? user.name
                      .charAt(0)
                      .toUpperCase()
                  : "U"}

              </div>


              <div className="header-user-info">

                <strong>
                  {user?.name || "User"}
                </strong>

                <span>
                  Listener
                </span>

              </div>

            </div>
 */}

            {/* LOGOUT */}

            {/* <button
              type="button"
              className="header-logout-button"
              onClick={handleLogout}
              aria-label="Logout"
              title="Logout"
              >

              <FaSignOutAlt />

            </button> */}

          </div>

        )}

      </div>

    </header>
  );
}

export default Header;