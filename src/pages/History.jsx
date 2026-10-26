
import { useCallback, useEffect, useState } from "react";

import {
  FaClock,
  FaHistory,
  FaPlay,
  FaPause,
  FaTrash,
  FaMusic,
  FaSearch,
  FaTimes,
} from "react-icons/fa";

import API from "../services/api";
import { usePlayer } from "../context/PlayerContext";
import { getMediaUrl } from "../utils/media";
import VoiceSearch from "../components/VoiceSearch";

import "../assets/css/history.css";

/* =========================================================
   KEERTHANA — LISTENING HISTORY
========================================================= */

const DEFAULT_COVER = "/images/default-cover.png";

/* =========================================================
   HELPERS
========================================================= */

const getSongId = (song) =>
  song?.id ?? song?.song_id ?? song?.songId ?? null;

const getSongTitle = (song) =>
  song?.title ||
  song?.title_english ||
  song?.name ||
  "Untitled Song";

const getArtistName = (song) =>
  song?.artist_name ||
  (typeof song?.artist === "string"
    ? song.artist
    : song?.artist?.name) ||
  "Unknown Artist";

const getAlbumName = (song) =>
  song?.album_name ||
  song?.album?.title ||
  (typeof song?.album === "string"
    ? song.album
    : "Single");

const formatPlayedDate = (value) => {
  if (!value) return "Recently played";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Recently played";
  }

  const now = new Date();

  const today = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );

  const playedDay = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );

  const days = Math.round(
    (today.getTime() - playedDay.getTime()) / 86400000
  );

  if (days === 0) {
    return `Today, ${date.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    })}`;
  }

  if (days === 1) {
    return "Yesterday";
  }

  return date.toLocaleDateString([], {
    day: "numeric",
    month: "short",
    year:
      date.getFullYear() !== now.getFullYear()
        ? "numeric"
        : undefined,
  });
};

const normalizeHistory = (responseData) => {
  const records = Array.isArray(responseData)
    ? responseData
    : responseData?.history ||
      responseData?.songs ||
      responseData?.recently_played ||
      responseData?.data ||
      [];

  if (!Array.isArray(records)) return [];

  const seen = new Set();

  return records
    .map((record) => {
      const song = record?.song || record?.track || record;

      if (!song || typeof song !== "object") {
        return null;
      }

      const id = getSongId(song);

      if (id == null || seen.has(String(id))) {
        return null;
      }

      seen.add(String(id));

      return {
        ...song,
        id,
        played_at:
          record?.played_at ||
          record?.playedAt ||
          record?.last_played_at ||
          record?.created_at ||
          song?.played_at ||
          null,
      };
    })
    .filter(Boolean);
};

/* =========================================================
   HISTORY PAGE
========================================================= */

export default function History() {
  const {
    currentSong,
    isPlaying,
    playSong,
    togglePlay,
  } = usePlayer();

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [clearing, setClearing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  /* -------------------------------------------------------
     VOICE SEARCH
     Language selection is managed by VoiceSearch.jsx.
  ------------------------------------------------------- */

  const handleVoiceSearch = useCallback((recognizedText) => {
    setSearchQuery(recognizedText);
  }, []);

  /* -------------------------------------------------------
     CURRENT SONG HELPERS
  ------------------------------------------------------- */

  const isCurrentSong = useCallback(
    (song) => {
      const currentId = getSongId(currentSong);
      const songId = getSongId(song);

      return (
        currentId != null &&
        songId != null &&
        String(currentId) === String(songId)
      );
    },
    [currentSong]
  );

  const isSongPlaying = (song) =>
    isCurrentSong(song) && isPlaying;

  const isHistoryPlaying =
    history.some(isCurrentSong) && isPlaying;

  /* -------------------------------------------------------
     LOAD HISTORY
  ------------------------------------------------------- */

  const loadHistory = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await API.get("/history");

      setHistory(normalizeHistory(response?.data));
    } catch (err) {
      console.error(
        "Failed to load listening history:",
        err
      );

      setError(
        err?.response?.data?.message ||
          "Unable to load your listening history. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  /* -------------------------------------------------------
     FILTER HISTORY
  ------------------------------------------------------- */

  const query = searchQuery.trim().toLowerCase();

  const filteredHistory = history.filter((song) => {
    if (!query) return true;

    const title = getSongTitle(song).toLowerCase();
    const artist = getArtistName(song).toLowerCase();
    const album = getAlbumName(song).toLowerCase();

    const playedDate = formatPlayedDate(song.played_at)
      .toLowerCase();

    return (
      title.includes(query) ||
      artist.includes(query) ||
      album.includes(query) ||
      playedDate.includes(query)
    );
  });

  /* -------------------------------------------------------
     PLAY INDIVIDUAL SONG
  ------------------------------------------------------- */

  const handlePlaySong = async (song) => {
    if (!song) return;

    try {
      if (isCurrentSong(song)) {
        await togglePlay();
        return;
      }

      const index = filteredHistory.findIndex(
        (item) =>
          String(getSongId(item)) ===
          String(getSongId(song))
      );

      await playSong(
        song,
        filteredHistory,
        Math.max(index, 0)
      );
    } catch (err) {
      console.error("History playback failed:", err);
    }
  };

  /* -------------------------------------------------------
     PLAY ALL / PAUSE ALL
  ------------------------------------------------------- */

  const handlePlayAll = async () => {
    if (!filteredHistory.length) return;

    try {
      const containsCurrent = filteredHistory.some(
        isCurrentSong
      );

      if (containsCurrent) {
        await togglePlay();
        return;
      }

      await playSong(
        filteredHistory[0],
        filteredHistory,
        0
      );
    } catch (err) {
      console.error("Play All history failed:", err);
    }
  };

  /* -------------------------------------------------------
     CLEAR HISTORY
  ------------------------------------------------------- */

  const handleClearHistory = async () => {
    if (!history.length || clearing) return;

    const confirmed = window.confirm(
      "Are you sure you want to clear your listening history?"
    );

    if (!confirmed) return;

    setClearing(true);
    setError("");

    try {
      await API.delete("/history");

      setHistory([]);
      setSearchQuery("");
    } catch (err) {
      console.error(
        "Failed to clear listening history:",
        err
      );

      setError(
        err?.response?.data?.message ||
          "Unable to clear history. Please try again."
      );
    } finally {
      setClearing(false);
    }
  };

  /* -------------------------------------------------------
     COVER IMAGE
  ------------------------------------------------------- */

  const getCover = (song) => {
    const cover =
      song?.cover_url ||
      song?.coverUrl ||
      song?.album_cover ||
      song?.image_url;

    if (!cover) return DEFAULT_COVER;

    try {
      return getMediaUrl(cover) || DEFAULT_COVER;
    } catch {
      return DEFAULT_COVER;
    }
  };

  /* -------------------------------------------------------
     RENDER
  ------------------------------------------------------- */

  return (
    <main className="history-page">
      <section className="history-container">

        {/* PAGE HEADER */}

        <header className="history-header">
          <div className="history-heading">
            <span className="history-heading-icon">
              <FaHistory />
            </span>

            <div>
              <p className="history-eyebrow">
                YOUR MUSIC JOURNEY
              </p>

              <h1>Listening History</h1>

              <p className="history-subtitle">
                Return to the songs that have been part of
                your worship.
              </p>
            </div>
          </div>

          <div className="history-count">
            <FaClock />

            <span>
              {history.length}{" "}
              {history.length === 1 ? "song" : "songs"}
            </span>
          </div>
        </header>

        {/* TOOLBAR */}

        <div className="history-toolbar">
          <div className="history-toolbar-left">
            <button
              type="button"
              className={`history-play-all ${
                isHistoryPlaying ? "is-playing" : ""
              }`}
              onClick={handlePlayAll}
              disabled={
                loading || filteredHistory.length === 0
              }
              aria-label={
                isHistoryPlaying
                  ? "Pause listening history"
                  : "Play songs in listening history"
              }
            >
              {isHistoryPlaying ? <FaPause /> : <FaPlay />}

              <span>
                {isHistoryPlaying ? "Pause All" : "Play All"}
              </span>
            </button>

            <span className="history-toolbar-caption">
              {filteredHistory.length > 0
                ? query
                  ? `Play ${filteredHistory.length} matching ${
                      filteredHistory.length === 1
                        ? "song"
                        : "songs"
                    }`
                  : "Play your recently listened songs"
                : history.length > 0
                  ? "No songs match your search"
                  : "Your recently played songs will appear here"}
            </span>
          </div>

          <button
            type="button"
            className="history-clear-button"
            onClick={handleClearHistory}
            disabled={
              loading || clearing || history.length === 0
            }
          >
            <FaTrash />

            <span>
              {clearing ? "Clearing..." : "Clear History"}
            </span>
          </button>
        </div>

        {/* SINGLE SEARCH BAR + LANGUAGE SELECTOR */}

        <section
          className="history-search-controls"
          aria-label="Search listening history"
         >
          <div className="history-search">
            <VoiceSearch
              value={searchQuery}
              onChange={setSearchQuery}
              onSearch={handleVoiceSearch}
              placeholder="Search songs, artists, or albums..."
              ariaLabel="Search listening history by voice or text"
            />
          </div>

          
        </section>

        {/* SEARCH RESULTS SUMMARY */}

        {!loading && history.length > 0 && query && (
          <p
            className="history-search-summary"
            aria-live="polite"
          >
            {filteredHistory.length}{" "}
            {filteredHistory.length === 1 ? "song" : "songs"}{" "}
            found
          </p>
        )}

        {/* ERROR */}

        {error && (
          <div className="history-error" role="alert">
            <span>{error}</span>

            <button
              type="button"
              onClick={loadHistory}
              disabled={loading}
            >
              Try again
            </button>
          </div>
        )}

        {/* LOADING / EMPTY / RESULTS */}

        {loading ? (
          <div className="history-status">
            <span className="history-spinner" />
            <p>Loading your listening history...</p>
          </div>
        ) : history.length === 0 ? (
          <div className="history-empty">
            <div className="history-empty-icon">
              <FaMusic />
            </div>

            <h2>Your history is waiting</h2>

            <p>
              Songs you listen to will appear here, making it
              easy to find your favourite worship music again.
            </p>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="history-empty history-no-results">
            <div className="history-empty-icon">
              <FaSearch />
            </div>

            <h2>No matching songs</h2>

            <p>
              No songs match "{searchQuery.trim()}". Try
              searching for another title, artist, or album.
            </p>

            <button
              type="button"
              className="history-reset-search"
              onClick={() => setSearchQuery("")}
            >
              <FaTimes />
              Clear search
            </button>
          </div>
        ) : (
          <section className="history-list-section">
            <div className="history-list-heading">
              <h2>
                {query ? "Search Results" : "Recently Played"}
              </h2>

              <span>
                {filteredHistory.length}{" "}
                {filteredHistory.length === 1
                  ? "track"
                  : "tracks"}
              </span>
            </div>

            {/* TABLE HEADER */}

            <div className="history-table-header">
              <span className="history-number-heading">#</span>
              <span className="history-song-heading">Song</span>
              <span className="history-album-heading">Album</span>
              <span className="history-date-heading">
                Last Played
              </span>
            </div>

            {/* SONG ROWS */}

            <div
              className="history-song-list"
              id="history-song-list"
            >
              {filteredHistory.map((song, index) => {
                const songId = getSongId(song);
                const playing = isSongPlaying(song);
                const selected = isCurrentSong(song);

                return (
                  <article
                    className={`history-row ${
                      selected ? "is-current-song" : ""
                    }`}
                    key={songId ?? index}
                  >
                    {/* PLAY / PAUSE */}

                    <div className="history-row-number">
                      <span className="history-track-number">
                        {String(index + 1).padStart(2, "0")}
                      </span>

                      <button
                        type="button"
                        className="history-row-play"
                        onClick={() => handlePlaySong(song)}
                        aria-label={`${
                          playing ? "Pause" : "Play"
                        } ${getSongTitle(song)}`}
                        title={playing ? "Pause song" : "Play song"}
                      >
                        {playing ? <FaPause /> : <FaPlay />}
                      </button>
                    </div>

                    {/* SONG DETAILS */}

                    <button
                      type="button"
                      className="history-song-info history-song-open"
                      onClick={() => handlePlaySong(song)}
                      aria-label={`${
                        playing ? "Pause" : "Play"
                      } ${getSongTitle(song)}`}
                    >
                      <img
                        className="history-cover"
                        src={getCover(song)}
                        alt=""
                        loading="lazy"
                        onError={(event) => {
                          event.currentTarget.onerror = null;
                          event.currentTarget.src = DEFAULT_COVER;
                        }}
                      />

                      <div className="history-song-text">
                        <h3 title={getSongTitle(song)}>
                          {getSongTitle(song)}
                        </h3>

                        <p title={getArtistName(song)}>
                          {getArtistName(song)}
                        </p>
                      </div>
                    </button>

                    {/* ALBUM */}

                    <div className="history-album">
                      <span>{getAlbumName(song)}</span>
                    </div>

                    {/* LAST PLAYED */}

                    <div className="history-date">
                      <FaClock className="history-date-icon" />

                      <span>
                        {formatPlayedDate(song.played_at)}
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}
      </section>
    </main>
  );
}
