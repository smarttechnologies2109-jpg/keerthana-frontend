
import { useEffect, useMemo, useState } from "react";

import {
  FaMusic,
  FaPlay,
  FaPause,
  FaSearch,
  FaMicrophone,
  FaMicrophoneSlash,
  FaTimes,
} from "react-icons/fa";

import { useNavigate } from "react-router-dom";

import API from "../services/api";
import { usePlayer } from "../context/usePlayer";

import {
  getSongCover,
  DEFAULT_COVER,
} from "../utils/media";

import "../assets/css/allSongs.css";

const LANGUAGES = [
  { label: "All Languages", value: "all" },
  { label: "తెలుగు", value: "te-IN" },
  { label: "English", value: "en-IN" },
  { label: "हिन्दी", value: "hi-IN" },
  { label: "മലയാളം", value: "ml-IN" },
  { label: "ಕನ್ನಡ", value: "kn-IN" },
  { label: "தமிழ்", value: "ta-IN" },
];

const LANGUAGE_NAMES = {
  telugu: "te-IN",
  te: "te-IN",
  "te-in": "te-IN",
  english: "en-IN",
  en: "en-IN",
  "en-in": "en-IN",
  hindi: "hi-IN",
  hi: "hi-IN",
  "hi-in": "hi-IN",
  malayalam: "ml-IN",
  ml: "ml-IN",
  "ml-in": "ml-IN",
  kannada: "kn-IN",
  kn: "kn-IN",
  "kn-in": "kn-IN",
  tamil: "ta-IN",
  ta: "ta-IN",
  "ta-in": "ta-IN",
};

const normalizeText = (value) =>
  String(value ?? "")
    .normalize("NFC")
    .toLocaleLowerCase()
    .trim();

const normalizeLanguage = (value) => {
  const key = normalizeText(value);
  return LANGUAGE_NAMES[key] || key;
};

const getSongTitles = (song) => {
  const possibleTitles = [
    song?.title,
    song?.titleEnglish,
    song?.title_english,
    song?.englishTitle,
    song?.english_title,
    song?.titleTelugu,
    song?.title_telugu,
    song?.teluguTitle,
    song?.titleHindi,
    song?.title_hindi,
    song?.titleMalayalam,
    song?.title_malayalam,
    song?.titleKannada,
    song?.title_kannada,
    song?.titleTamil,
    song?.title_tamil,
    song?.name,
  ];

  return [
    ...new Set(
      possibleTitles
        .filter(
          (title) =>
            typeof title === "string" ||
            typeof title === "number"
        )
        .map((title) => String(title).trim())
        .filter(Boolean)
    ),
  ];
};

function AllSongs() {
  const navigate = useNavigate();

  const {
    currentSong,
    isPlaying,
    playSong,
    togglePlay,
  } = usePlayer();

  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  // Default: show songs in every language.
  const [selectedLanguage, setSelectedLanguage] =
    useState("all");

  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState("");
  const [voiceSupported, setVoiceSupported] = useState(true);

  // Use the selected language for speech recognition.
  // Telugu is the default voice language when All Languages is selected.
  const voiceLanguage =
    selectedLanguage === "all"
      ? "te-IN"
      : selectedLanguage;

  // Load songs from the existing API.
  useEffect(() => {
    let active = true;

    const loadSongs = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await API.get("/songs");
        const data = response?.data;

        const songList = Array.isArray(data)
          ? data
          : Array.isArray(data?.songs)
            ? data.songs
            : Array.isArray(data?.data)
              ? data.data
              : [];

        if (active) {
          setSongs(songList);
        }
      } catch (err) {
        console.error("Load all songs error:", err);

        if (active) {
          setSongs([]);
          setError(
            "Unable to load songs. Please try again."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadSongs();

    return () => {
      active = false;
    };
  }, []);

  // Sort the complete library alphabetically.
  const sortedSongs = useMemo(() => {
    return [...songs].sort((a, b) => {
      const titleA =
        a?.titleEnglish ||
        a?.title_english ||
        a?.englishTitle ||
        a?.english_title ||
        a?.title ||
        "";

      const titleB =
        b?.titleEnglish ||
        b?.title_english ||
        b?.englishTitle ||
        b?.english_title ||
        b?.title ||
        "";

      return String(titleA).localeCompare(
        String(titleB),
        undefined,
        {
          sensitivity: "base",
          numeric: true,
        }
      );
    });
  }, [songs]);

  // Filter by language first.
  // "all" includes songs from every language.
  const languageSongs = useMemo(() => {
    if (selectedLanguage === "all") {
      return sortedSongs;
    }

    return sortedSongs.filter((song) => {
      return (
        normalizeLanguage(song?.language) ===
        normalizeLanguage(selectedLanguage)
      );
    });
  }, [sortedSongs, selectedLanguage]);

  // Search only within the currently selected language.
  const filteredSongs = useMemo(() => {
    const query = normalizeText(search);

    if (!query) {
      return languageSongs;
    }

    return languageSongs.filter((song) => {
      const searchableFields = [
        ...getSongTitles(song),
        song?.artist_name,
        song?.artist,
        song?.artistName,
        song?.album_name,
        song?.album,
        song?.albumName,
        song?.category_name,
        song?.category,
        song?.language,
        ...(Array.isArray(song?.moods)
          ? song.moods
          : []),
      ];

      return searchableFields.some((field) =>
        normalizeText(field).includes(query)
      );
    });
  }, [languageSongs, search]);

  // Voice search.
  const handleVoiceSearch = () => {
    setVoiceError("");

    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setVoiceSupported(false);
      setVoiceError(
        "Voice search is not supported in this browser. Try Chrome."
      );
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();

      recognition.lang = voiceLanguage;
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setVoiceError("");
      };

      recognition.onresult = (event) => {
        const transcript =
          event.results?.[0]?.[0]?.transcript || "";

        if (transcript.trim()) {
          setSearch(transcript.trim());
        } else {
          setVoiceError(
            "No song name was detected. Try again."
          );
        }
      };

      recognition.onerror = (event) => {
        if (event.error === "not-allowed") {
          setVoiceError(
            "Microphone access denied. Allow microphone access in your browser."
          );
        } else if (event.error === "no-speech") {
          setVoiceError(
            "No speech detected. Please speak the song name again."
          );
        } else if (event.error !== "aborted") {
          setVoiceError(
            "Voice search failed. Please try again."
          );
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      setIsListening(true);
      recognition.start();
    } catch (err) {
      console.error("Voice search error:", err);
      setIsListening(false);
      setVoiceError(
        "Unable to start voice search. Please try again."
      );
    }
  };

  // Play the selected song with the full queue for the
  // selected language, rather than just the search results.
  const handlePlay = async (song) => {
    if (!song) return;

    const isCurrent =
      String(currentSong?.id) === String(song?.id);

    try {
      if (isCurrent) {
        await togglePlay();
      } else {
        await playSong(song, languageSongs);
      }
    } catch (err) {
      console.error("Play song error:", err);
    }
  };

  if (loading) {
    return (
      <main className="all-songs-page">
        <div className="all-songs-loading">
          <FaMusic className="all-songs-loading-icon" />
          <h2>Loading Your Music</h2>
          <p>
            Preparing your KEERTHANA music library.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="all-songs-page">
      <header className="all-songs-header">
        <div className="all-songs-title-area">
          <div className="all-songs-icon">
            <FaMusic />
          </div>

          <div className="all-songs-heading">
            <span className="all-songs-overline">
              KEERTHANA MUSIC
            </span>

            <h1>All Songs</h1>

            <p>
              Discover worship songs in your language.
            </p>
          </div>
        </div>
      </header>

      {/* Search, voice input, and language filter */}
      <section
        className="all-songs-search-section"
        aria-label="Search music"
      >
        <div
          className={`all-songs-search ${
            isListening ? "is-listening" : ""
          }`}
        >
          <FaSearch className="all-songs-search-icon" />

          <input
            type="search"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search songs, artists, albums..."
            aria-label="Search songs"
            autoComplete="off"
          />

          {search && (
            <button
              type="button"
              className="all-songs-clear"
              onClick={() => {
                setSearch("");
                setVoiceError("");
              }}
              aria-label="Clear search"
              title="Clear search"
            >
              <FaTimes />
            </button>
          )}

          <button
            type="button"
            className={`all-songs-mic ${
              isListening ? "active" : ""
            }`}
            onClick={handleVoiceSearch}
            aria-label={
              isListening
                ? "Stop voice search"
                : "Start voice search"
            }
            title={
              isListening
                ? "Stop voice search"
                : "Search using your voice"
            }
            disabled={!voiceSupported}
          >
            {isListening ? (
              <FaMicrophoneSlash />
            ) : (
              <FaMicrophone />
            )}
          </button>
        </div>

        <div className="all-songs-search-footer">
          <span className="all-songs-search-hint">
            {selectedLanguage === "all"
              ? "Browse songs in every language"
              : `Showing ${LANGUAGES.find(
                  (item) => item.value === selectedLanguage
                )?.label || selectedLanguage} songs`}
          </span>

          <label className="all-songs-voice-language">
            <span>Language</span>

            <select
              value={selectedLanguage}
              onChange={(event) => {
                setSelectedLanguage(event.target.value);
                setSearch("");
                setVoiceError("");
              }}
              aria-label="Filter songs by language"
            >
              {LANGUAGES.map((language) => (
                <option
                  key={language.value}
                  value={language.value}
                >
                  {language.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {isListening && (
          <p
            className="all-songs-voice-status"
            role="status"
          >
            <span className="all-songs-pulse" />
            Listening... Speak the song name.
          </p>
        )}

        {voiceError && (
          <p
            className="all-songs-voice-error"
            role="alert"
          >
            {voiceError}
          </p>
        )}
      </section>

      {error && (
        <div className="all-songs-error" role="alert">
          <p>{error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>
        </div>
      )}

      {!error && filteredSongs.length === 0 && (
        <div className="all-songs-empty">
          <div className="all-songs-empty-icon">
            <FaSearch />
          </div>

          <h2>
            {search
              ? "No Matching Songs"
              : "No Songs Available"}
          </h2>

          <p>
            {search
              ? "Try another song title or select a different language."
              : "There are no songs available for this language yet."}
          </p>

          {(search || selectedLanguage !== "all") && (
            <button
              type="button"
              className="all-songs-reset-search"
              onClick={() => {
                setSearch("");
                setSelectedLanguage("all");
              }}
            >
              Show All Songs
            </button>
          )}
        </div>
      )}

      {!error && filteredSongs.length > 0 && (
        <section
          className="all-songs-results"
          aria-label="Songs"
        >
          {search && (
            <div className="all-songs-results-heading">
              <h2>Search Results</h2>
            </div>
          )}

          <div className="all-songs-list">
            {filteredSongs.map((song) => {
              const cover = getSongCover(song);

              const isCurrent =
                String(currentSong?.id) ===
                String(song?.id);

              const isCurrentPlaying =
                isCurrent && isPlaying;

              const titles = getSongTitles(song);

              const primaryTitle =
                song?.titleEnglish ||
                song?.title_english ||
                song?.englishTitle ||
                song?.english_title ||
                song?.title ||
                "Unknown Song";

              const secondaryTitle = titles.find(
                (title) =>
                  normalizeText(title) !==
                  normalizeText(primaryTitle)
              );

              const artistName =
                song?.artist_name ||
                song?.artistName ||
                (typeof song?.artist === "string"
                  ? song.artist
                  : song?.artist?.name) ||
                "KEERTHANA";

              return (
                <article
                  key={song?.id}
                  className={`all-song-card ${
                    isCurrent ? "current" : ""
                  }`}
                >
                  <button
                    type="button"
                    className="all-song-cover"
                    onClick={() =>
                      navigate(`/songs/${song.id}`)
                    }
                    aria-label={`Open ${primaryTitle} details`}
                  >
                    <img
                      src={cover || DEFAULT_COVER}
                      alt={primaryTitle}
                      loading="lazy"
                      onError={(event) => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src =
                          DEFAULT_COVER;
                      }}
                    />

                    {/* <span className="all-song-cover-play">
                      {isCurrentPlaying ? (
                        <FaPause />
                      ) : (
                        <FaPlay />
                      )}
                    </span> */}
                  </button>

                  <div className="all-song-card-info">
                    <button
                      type="button"
                      className="all-song-info"
                      onClick={() =>
                        navigate(`/songs/${song.id}`)
                      }
                      aria-label={`View details for ${primaryTitle}`}
                    >
                      <strong className="all-song-primary-title">
                        {primaryTitle}
                      </strong>

                      {secondaryTitle && (
                        <span className="all-song-english-title">
                          {secondaryTitle}
                        </span>
                      )}

                      <span className="all-song-artist">
                        {artistName}
                      </span>
                    </button>

                    <button
                      type="button"
                      className={`all-song-play-button ${
                        isCurrentPlaying ? "playing" : ""
                      }`}
                      onClick={() => handlePlay(song)}
                      title={
                        isCurrentPlaying ? "Pause" : "Play"
                      }
                      aria-label={
                        isCurrentPlaying
                          ? `Pause ${primaryTitle}`
                          : `Play ${primaryTitle}`
                      }
                     >
                      {isCurrentPlaying ? (
                        <FaPause />
                      ) : (
                        <FaPlay />
                      )}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}
    </main>
  );
}

export default AllSongs;
