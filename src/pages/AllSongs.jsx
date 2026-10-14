
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

const VOICE_LANGUAGES = [
  { label: "తెలుగు", value: "te-IN" },
  { label: "English", value: "en-IN" },
  { label: "हिन्दी", value: "hi-IN" },
  { label: "മലയാളം", value: "ml-IN" },
  { label: "ಕನ್ನಡ", value: "kn-IN" },
  { label: "தமிழ்", value: "ta-IN" },
];

// Read titles from common API/database field names.
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

// Normalize text without removing non-English characters.
const normalizeText = (value) =>
  String(value ?? "")
    .normalize("NFC")
    .toLocaleLowerCase()
    .trim();

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

  const [voiceLanguage, setVoiceLanguage] = useState("te-IN");
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState("");
  const [voiceSupported, setVoiceSupported] = useState(true);

  // LOAD SONGS
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
          setError("Unable to load songs. Please try again.");
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

  // SORT ALPHABETICALLY
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

  // SEARCH ALL AVAILABLE TITLE FIELDS AND SONG METADATA
  const filteredSongs = useMemo(() => {
    const query = normalizeText(search);

    if (!query) {
      return sortedSongs;
    }

    return sortedSongs.filter((song) => {
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
        ...(Array.isArray(song?.moods) ? song.moods : []),
      ];

      return searchableFields.some((field) =>
        normalizeText(field).includes(query)
      );
    });
  }, [sortedSongs, search]);

  // VOICE SEARCH
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
          setVoiceError("No song name was detected. Try again.");
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
      setVoiceError("Unable to start voice search. Please try again.");
    }
  };

  // PLAY / PAUSE
  const handlePlay = async (song) => {
    if (!song) return;

    const isCurrent =
      String(currentSong?.id) === String(song?.id);

    try {
      if (isCurrent) {
        await togglePlay();
      } else {
        // Preserve the complete alphabetical playback queue.
        await playSong(song, sortedSongs);
      }
    } catch (err) {
      console.error("Play song error:", err);
    }
  };

  if (loading) {
    return (
      <div className="all-songs-page">
        <div className="all-songs-loading">
          <FaMusic className="all-songs-loading-icon" />
          <h2>Loading Songs...</h2>
          <p>Preparing your KEERTHANA music library.</p>
        </div>
      </div>
    );
  }

  return (
    <main className="all-songs-page">
      {/* PAGE HEADER */}
      <header className="all-songs-header">
        <div className="all-songs-title-area">
          <div className="all-songs-icon">
            <FaMusic />
          </div>

          <div className="all-songs-heading">
            <span className="all-songs-overline">
              KEERTHANA MUSIC LIBRARY
            </span>

            <h1>All Songs</h1>

            <p>
              Discover worship songs in your language.
            </p>
          </div>
        </div>

        <div className="all-songs-total">
          <strong>{songs.length}</strong>
          <span>{songs.length === 1 ? "Song" : "Songs"}</span>
        </div>
      </header>

      {/* SEARCH */}
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
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search any song in any language..."
            aria-label="Search song titles and artists"
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
            disabled={!voiceSupported && !voiceError}
          >
            {isListening ? (
              <FaMicrophoneSlash />
            ) : (
              <FaMicrophone />
            )}
          </button>
        </div>

        <div className="all-songs-search-footer">
          <span>
            {search
              ? `${filteredSongs.length} matching ${
                  filteredSongs.length === 1 ? "song" : "songs"
                }`
              : "Search by song title, artist, album, or language"}
          </span>

          <label className="all-songs-voice-language">
            <span>Voice:</span>

            <select
              value={voiceLanguage}
              onChange={(event) =>
                setVoiceLanguage(event.target.value)
              }
              aria-label="Voice search language"
            >
              {VOICE_LANGUAGES.map((language) => (
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
          <p className="all-songs-voice-status" role="status">
            <span className="all-songs-pulse" />
            Listening... Speak the song name.
          </p>
        )}

        {voiceError && (
          <p className="all-songs-voice-error" role="alert">
            {voiceError}
          </p>
        )}
      </section>

      {/* API ERROR */}
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

      {/* EMPTY RESULTS */}
      {!error && filteredSongs.length === 0 && (
        <div className="all-songs-empty">
          <div className="all-songs-empty-icon">
            <FaSearch />
          </div>

          <h2>
            {search ? "No Matching Songs" : "No Songs Available"}
          </h2>

          <p>
            {search
              ? `No songs match "${search}". Try another spelling or language.`
              : "Songs will appear here when they are available."}
          </p>

          {search && (
            <button
              type="button"
              className="all-songs-reset-search"
              onClick={() => setSearch("")}
            >
              Show All Songs
            </button>
          )}
        </div>
      )}

      {/* LIVE SEARCH RESULTS */}
      {!error && filteredSongs.length > 0 && (
        <section
          className="all-songs-results"
          aria-label="Song search results"
        >
          {search && (
            <div className="all-songs-results-heading">
              <h2>Search Results</h2>
              <span>{filteredSongs.length} found</span>
            </div>
          )}

          <div className="all-songs-list">
            {filteredSongs.map((song) => {
              const cover = getSongCover(song);

              const isCurrent =
                String(currentSong?.id) === String(song?.id);

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

              const secondaryTitle =
                titles.find(
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
                        event.currentTarget.src = DEFAULT_COVER;
                      }}
                    />
                  </button>

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

                    {isCurrent && (
                      <small className="all-song-playing-label">
                        {isPlaying
                          ? "Now Playing"
                          : "Paused"}
                      </small>
                    )}
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
