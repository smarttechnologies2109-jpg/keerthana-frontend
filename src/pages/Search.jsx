import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  FaMusic,
  FaSearch,
  FaPlay,
  FaPause,
  FaTimes,
} from "react-icons/fa";

import API from "../services/api";
import VoiceSearch from "../components/VoiceSearch";
import { usePlayer } from "../context/usePlayer";

import {
  getSongCover,
  DEFAULT_COVER,
} from "../utils/media";

import "../assets/css/search.css";

const getSongTitles = (song) => {
  const fields = [
    song?.title,
    song?.title_english,
    song?.titleEnglish,
    song?.english_title,
    song?.englishTitle,
    song?.title_telugu,
    song?.titleTelugu,
    song?.title_hindi,
    song?.titleHindi,
    song?.title_tamil,
    song?.titleTamil,
    song?.title_kannada,
    song?.titleKannada,
    song?.title_malayalam,
    song?.titleMalayalam,
    song?.name,
  ];

  return [
    ...new Set(
      fields
        .filter(
          (value) =>
            typeof value === "string" ||
            typeof value === "number"
        )
        .map((value) => String(value).trim())
        .filter(Boolean)
    ),
  ];
};

const normalizeText = (value) =>
  String(value ?? "")
    .normalize("NFC")
    .toLocaleLowerCase()
    .trim();

const getArtistName = (song) => {
  if (typeof song?.artist_name === "string") {
    return song.artist_name;
  }

  if (typeof song?.artistName === "string") {
    return song.artistName;
  }

  if (typeof song?.artist === "string") {
    return song.artist;
  }

  if (typeof song?.artist?.name === "string") {
    return song.artist.name;
  }

  return "Unknown Artist";
};

const getAlbumName = (song) => {
  if (typeof song?.album_name === "string") {
    return song.album_name;
  }

  if (typeof song?.albumName === "string") {
    return song.albumName;
  }

  if (typeof song?.album === "string") {
    return song.album;
  }

  return song?.album?.title || "";
};

const getCategoryName = (song) => {
  if (typeof song?.category_name === "string") {
    return song.category_name;
  }

  if (typeof song?.categoryName === "string") {
    return song.categoryName;
  }

  if (typeof song?.category === "string") {
    return song.category;
  }

  return song?.category?.name || "";
};

const getSongList = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.songs)) return data.songs;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.data?.songs)) {
    return data.data.songs;
  }
  return [];
};

function Search() {
  const {
    currentSong,
    isPlaying,
    playSong,
    togglePlay,
  } = usePlayer();

  const [allSongs, setAllSongs] = useState([]);
  const [query, setQuery] = useState("");
  const [voiceLanguage, setVoiceLanguage] = useState("te-IN");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [playError, setPlayError] = useState("");

  const voiceLanguages = [
    { label: "తెలుగు", value: "te-IN" },
    { label: "English", value: "en-IN" },
    { label: "हिन्दी", value: "hi-IN" },
    { label: "മലയാളം", value: "ml-IN" },
    { label: "ಕನ್ನಡ", value: "kn-IN" },
    { label: "தமிழ்", value: "ta-IN" },
  ];

  useEffect(() => {
    let active = true;

    const loadSongs = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await API.get("/songs");
        const list = getSongList(response?.data);

        if (active) {
          setAllSongs(list);
        }
      } catch (err) {
        console.error("Search song loading error:", err);

        if (active) {
          setError(
            err.response?.data?.message ||
              "Unable to load songs. Please try again."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    loadSongs();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initialQuery = params.get("q");

    if (initialQuery) {
      setQuery(initialQuery);
    }
  }, []);

  const sortedSongs = useMemo(() => {
    return [...allSongs].sort((a, b) => {
      const titleA =
        a?.title_english ||
        a?.titleEnglish ||
        a?.english_title ||
        a?.englishTitle ||
        a?.title ||
        "";

      const titleB =
        b?.title_english ||
        b?.titleEnglish ||
        b?.english_title ||
        b?.englishTitle ||
        b?.title ||
        "";

      return String(titleA).localeCompare(String(titleB), undefined, {
        sensitivity: "base",
        numeric: true,
      });
    });
  }, [allSongs]);

  const filteredSongs = useMemo(() => {
    const term = normalizeText(query);

    if (!term) return [];

    return sortedSongs.filter((song) => {
      const moods = Array.isArray(song?.moods)
        ? song.moods.join(" ")
        : "";

      const fields = [
        ...getSongTitles(song),
        getArtistName(song),
        getAlbumName(song),
        getCategoryName(song),
        song?.language,
        song?.lyrics,
        moods,
      ];

      return fields.some((field) =>
        normalizeText(field).includes(term)
      );
    });
  }, [sortedSongs, query]);

  const handleVoiceSearch = useCallback((recognizedText) => {
    const text = String(recognizedText || "").trim();

    if (text) {
      setQuery(text);
      setPlayError("");
    }
  }, []);

  const handlePlaySong = useCallback(
    async (song) => {
      if (!song) return;

      setPlayError("");

      const isCurrent =
        String(currentSong?.id) === String(song?.id);

      try {
        if (isCurrent) {
          await togglePlay();
          return;
        }

        if (!song.audio_url) {
          setPlayError(
            `Audio is unavailable for "${getSongTitles(song)[0] || "this song"}".`
          );
          return;
        }

        await playSong(song, sortedSongs);
      } catch (err) {
        console.error("Unable to play song:", err);
        setPlayError("Unable to play this song. Please try again.");
      }
    },
    [currentSong, togglePlay, playSong, sortedSongs]
  );

  const clearSearch = () => {
    setQuery("");
    setPlayError("");
  };

  return (
    <main className="search-page">
      <header className="search-page-header">
        <div className="search-brand-icon">
          <FaSearch />
        </div>

        <div className="search-page-heading">
          <span className="search-page-label">
            KEERTHANA DISCOVER
          </span>

          <h1>Find Your Worship Song</h1>

          <p>
            Search song titles, artists, albums, lyrics, and more.
          </p>
        </div>
      </header>

      <section className="search-main-area" aria-label="Music discovery">
        <div className="search-input-wrapper">
          <FaSearch className="search-input-icon" />

          <VoiceSearch
            value={query}
            onChange={setQuery}
            onSearch={handleVoiceSearch}
            language={voiceLanguage}
          />

          {query && (
            <button
              type="button"
              className="search-clear-button"
              onClick={clearSearch}
              aria-label="Clear search"
              title="Clear search"
            >
              <FaTimes />
            </button>
          )}
        </div>

        <div className="search-toolbar">
          <span className="search-live-hint">
            {query.trim()
              ? `${filteredSongs.length} matching results`
              : "Start typing to discover songs"}
          </span>

          <label className="voice-language-selector">
            <span>Voice language</span>

            <select
              value={voiceLanguage}
              onChange={(event) =>
                setVoiceLanguage(event.target.value)
              }
            >
              {voiceLanguages.map((language) => (
                <option key={language.value} value={language.value}>
                  {language.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {loading && (
        <div className="search-state-card">
          <span className="search-loading-spinner" />
          <h2>Finding your music</h2>
          <p>Loading the KEERTHANA library...</p>
        </div>
      )}

      {!loading && error && (
        <div className="search-state-card search-error" role="alert">
          <h2>Unable to load music</h2>
          <p>{error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>
        </div>
      )}

      {!loading && !error && !query.trim() && (
        <section className="search-discovery-intro">
          <div className="search-discovery-icon">
            <FaMusic />
          </div>
          <h2>What would you like to hear?</h2>
          <p>
            Search using any part of a song title, artist name, album,
            or lyrics. You can type in Telugu, English, Hindi, and more.
          </p>
        </section>
      )}

      {!loading && !error && playError && (
        <p className="search-play-error" role="alert">
          {playError}
        </p>
      )}

      {!loading && !error && query.trim() && filteredSongs.length > 0 && (
        <section className="search-results">
          <div className="search-results-header">
            <div>
              <span className="search-section-label">
                RESULTS FOR
              </span>
              <h2>“{query.trim()}”</h2>
            </div>

            <span className="search-results-count">
              {filteredSongs.length}{" "}
              {filteredSongs.length === 1 ? "result" : "results"}
            </span>
          </div>

          <div className="search-song-list">
            {filteredSongs.map((song) => {
              const current =
                String(currentSong?.id) === String(song?.id);

              const playing = current && isPlaying;
              const titles = getSongTitles(song);

              const primaryTitle =
                song?.title_english ||
                song?.titleEnglish ||
                song?.english_title ||
                song?.englishTitle ||
                song?.title ||
                "Unknown Song";

              const secondaryTitle = titles.find(
                (title) =>
                  normalizeText(title) !== normalizeText(primaryTitle)
              );

              const cover = getSongCover(song) || DEFAULT_COVER;

              return (
                <article
                  key={song.id}
                  className={`search-song-card ${
                    current ? "search-song-card-active" : ""
                  }`}
                >
                  <img
                    className="search-song-cover"
                    src={cover}
                    alt={primaryTitle}
                    loading="lazy"
                    onError={(event) => {
                      event.currentTarget.onerror = null;
                      event.currentTarget.src = DEFAULT_COVER;
                    }}
                  />

                  <div className="search-song-info">
                    <h3>{primaryTitle}</h3>

                    {secondaryTitle && (
                      <p className="search-song-secondary">
                        {secondaryTitle}
                      </p>
                    )}

                    <p className="search-song-artist">
                      {getArtistName(song)}
                    </p>

                    <div className="search-song-meta">
                      {getAlbumName(song) && (
                        <span>{getAlbumName(song)}</span>
                      )}
                      {song?.language && <span>{song.language}</span>}
                      {getCategoryName(song) && (
                        <span>{getCategoryName(song)}</span>
                      )}
                    </div>

                    {current && (
                      <small className="search-playing-indicator">
                        {playing ? "Now Playing" : "Paused"}
                      </small>
                    )}
                  </div>

                  <button
                    type="button"
                    className={`search-song-play ${
                      playing ? "playing" : ""
                    }`}
                    onClick={() => handlePlaySong(song)}
                    aria-label={`${playing ? "Pause" : "Play"} ${primaryTitle}`}
                    title={playing ? "Pause" : "Play"}
                  >
                    {playing ? <FaPause /> : <FaPlay />}
                  </button>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {!loading &&
        !error &&
        query.trim() &&
        filteredSongs.length === 0 && (
          <div className="search-state-card search-empty">
            <div className="search-empty-icon">
              <FaSearch />
            </div>

            <h2>No matching songs</h2>
            <p>
              Try another spelling, language, artist, or lyric.
            </p>

            <button
              type="button"
              className="search-show-all-button"
              onClick={clearSearch}
            >
              Clear Search
            </button>
          </div>
        )}
    </main>
  );
}

export default Search;