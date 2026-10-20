
import { useCallback, useEffect, useRef, useState } from "react";
import {
  FaBars,
  FaBell,
  FaChevronLeft,
  FaChevronRight,
  FaMicrophone,
  FaMicrophoneSlash,
  FaMusic,
  FaSearch,
  FaUser,
} from "react-icons/fa";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationsContext";
import "../assets/css/header.css";

const PAGE_TITLES = [
  { paths: ["/", "/home"], title: "Home", exact: true },
  { paths: ["/search"], title: "Explore" },
  { paths: ["/library"], title: "Your Library" },
  { paths: ["/liked-songs"], title: "Liked Songs" },
  { paths: ["/favorites"], title: "Favorites" },
  { paths: ["/playlists"], title: "Playlists" },
  { paths: ["/history"], title: "Listening History" },
  { paths: ["/premium"], title: "Premium" },
  { paths: ["/profile"], title: "Profile" },
  { paths: ["/offline-songs"], title: "Offline Songs" },
  { paths: ["/notifications"], title: "Notifications" },
  { paths: ["/song", "/songs"], title: "Songs" },
  { paths: ["/artist", "/artists"], title: "Artists" },
  { paths: ["/album", "/albums"], title: "Albums" },
];

function getPageTitle(pathname) {
  const page = PAGE_TITLES.find(({ paths, exact }) =>
    paths.some((path) =>
      exact
        ? pathname === path
        : pathname === path || pathname.startsWith(`${path}/`)
    )
  );

  return page?.title ?? "KEERTHANA";
}

function Header({ onToggleSidebar }) {
  const navigate = useNavigate();
  const location = useLocation();
  const searchInputRef = useRef(null);
  const recognitionRef = useRef(null);

  const { user } = useAuth();
  const { unreadCount = 0 } = useNotifications();

  const [searchValue, setSearchValue] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(true);

  const pageTitle = getPageTitle(location.pathname);

  const handleSearchSubmit = useCallback(
    (event) => {
      event.preventDefault();

      const query = searchValue.trim();

      navigate(
        query ? `/search?q=${encodeURIComponent(query)}` : "/search"
      );
    },
    [navigate, searchValue]
  );

  const stopVoiceSearch = useCallback(() => {
    try {
      recognitionRef.current?.stop();
    } catch {
      // Recognition may already be inactive.
    }

    setIsListening(false);
  }, []);

  const handleVoiceSearch = useCallback(() => {
    const recognition = recognitionRef.current;

    if (!recognition) {
      if (!voiceSupported) {
        window.alert(
          "Voice search is not supported in this browser. Try Chrome or Edge."
        );
      }
      return;
    }

    if (isListening) {
      stopVoiceSearch();
      return;
    }

    try {
      recognition.start();
    } catch (error) {
      console.warn("Unable to start voice search:", error);
    }
  }, [isListening, stopVoiceSearch, voiceSupported]);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setVoiceSupported(false);
      return undefined;
    }

    const recognition = new SpeechRecognition();

    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.lang = "en-IN";

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);

    recognition.onerror = (event) => {
      console.warn("Voice search error:", event.error);
      setIsListening(false);
    };

    recognition.onresult = (event) => {
      let interimTranscript = "";
      let finalTranscript = "";

      for (
        let index = event.resultIndex;
        index < event.results.length;
        index += 1
      ) {
        const result = event.results[index];
        const transcript = result[0]?.transcript ?? "";

        if (result.isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      const finalQuery = finalTranscript.trim();
      const currentQuery = `${finalTranscript} ${interimTranscript}`.trim();

      if (currentQuery) {
        setSearchValue(currentQuery);
      }

      if (finalQuery) {
        navigate(`/search?q=${encodeURIComponent(finalQuery)}`);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.onstart = null;
      recognition.onend = null;
      recognition.onerror = null;
      recognition.onresult = null;

      try {
        recognition.stop();
      } catch {
        // Ignore cleanup errors.
      }

      recognitionRef.current = null;
    };
  }, [navigate]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      const target = event.target;

      const isTyping =
        target instanceof HTMLElement &&
        (target.matches("input, textarea, select") ||
          target.isContentEditable);

      if (
        event.key !== "/" ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        isTyping
      ) {
        return;
      }

      event.preventDefault();
      searchInputRef.current?.focus();
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <header className="keerthana-header">
      <div className="keerthana-header-left">
        <button
          type="button"
          className="header-menu-button"
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
          title="Menu"
        >
          <FaBars aria-hidden="true" />
        </button>

        <div className="header-history-buttons">
          <button
            type="button"
            className="header-circle-button"
            onClick={() => navigate(-1)}
            aria-label="Go back"
            title="Go back"
          >
            <FaChevronLeft aria-hidden="true" />
          </button>

          <button
            type="button"
            className="header-circle-button"
            onClick={() => navigate(1)}
            aria-label="Go forward"
            title="Go forward"
          >
            <FaChevronRight aria-hidden="true" />
          </button>
        </div>

        <Link
          to="/home"
          className="header-brand"
          aria-label="KEERTHANA home"
        >
          <span className="header-brand-mark" aria-hidden="true">
            <FaMusic />
          </span>

          <span className="header-brand-copy">
            <strong>KEERTHANA</strong>
            <small>CHRISTIAN MUSIC</small>
          </span>
        </Link>

        <div className="header-page-info" aria-live="polite">
          <span>NOW EXPLORING</span>
          <h2>{pageTitle}</h2>
        </div>
      </div>

      <div className="keerthana-header-right">
        <form
          className={`header-search-box ${
            isListening ? "header-search-listening" : ""
          }`}
          onSubmit={handleSearchSubmit}
          role="search"
        >
          <FaSearch className="header-search-icon" aria-hidden="true" />

          <input
            ref={searchInputRef}
            type="search"
            name="search"
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            className="header-search-input"
            placeholder={
              isListening
                ? "Listening..."
                : "Search songs, artists, lyrics..."
            }
            autoComplete="off"
            aria-label="Search songs, artists, and lyrics"
          />

          {voiceSupported && (
            <button
              type="button"
              className={`header-voice-button ${
                isListening ? "header-voice-button-active" : ""
              }`}
              onClick={handleVoiceSearch}
              aria-label={
                isListening ? "Stop listening" : "Start voice search"
              }
              aria-pressed={isListening}
              title={isListening ? "Stop listening" : "Voice search"}
            >
              {isListening ? (
                <FaMicrophoneSlash aria-hidden="true" />
              ) : (
                <FaMicrophone aria-hidden="true" />
              )}
            </button>
          )}

          <kbd aria-hidden="true">/</kbd>
        </form>

        <Link
          to="/notifications"
          className="header-notification-button"
          title="Notifications"
          aria-label={`Notifications${
            unreadCount > 0 ? `, ${unreadCount} unread` : ""
          }`}
        >
          <FaBell aria-hidden="true" />

          {unreadCount > 0 && (
            <span
              className="header-notification-badge"
              aria-hidden="true"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Link>

        {!user && (
          <button
            type="button"
            className="header-login-button"
            onClick={() => navigate("/login")}
          >
            <FaUser aria-hidden="true" />
            <span>Login</span>
          </button>
        )}
      </div>
    </header>
  );
}

export default Header;
