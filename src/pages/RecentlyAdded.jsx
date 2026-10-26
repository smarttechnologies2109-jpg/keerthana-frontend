
import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import {
  FaArrowLeft,
  FaCompactDisc,
  FaPlay,
  FaPause,
  FaMusic,
  FaSearch,
  FaExclamationCircle,
} from "react-icons/fa";

import API from "../services/api";
import { usePlayer } from "../context/usePlayer";
import { getSongCover } from "../utils/media";

import "../assets/css/recently-added.css";

/* =========================================================
   HELPERS
========================================================= */

function getArray(response) {
  const data = response?.data;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.songs)) return data.songs;
  if (Array.isArray(data?.data)) return data.data;

  return [];
}

function getSongId(song) {
  return song?.id ?? song?.song_id;
}

function getSongTitle(song) {
  return (
    song?.title ||
    song?.title_english ||
    "Untitled Song"
  );
}

function getArtistName(song) {
  return (
    song?.artist_name ||
    song?.artist?.name ||
    (typeof song?.artist === "string" ? song.artist : "") ||
    "Unknown Artist"
  );
}

function sortNewestFirst(songs) {
  return [...songs].sort((a, b) => {
    const dateA = new Date(
      a?.created_at || a?.createdAt || 0
    ).getTime();

    const dateB = new Date(
      b?.created_at || b?.createdAt || 0
    ).getTime();

    if (
      Number.isFinite(dateA) &&
      Number.isFinite(dateB) &&
      dateA !== dateB &&
      dateA > 0 &&
      dateB > 0
    ) {
      return dateB - dateA;
    }

    return (
      Number(getSongId(b) || 0) -
      Number(getSongId(a) || 0)
    );
  });
}

/* =========================================================
   RECENTLY ADDED PAGE
========================================================= */

export default function RecentlyAdded() {
  const navigate = useNavigate();

  const player = usePlayer();

  const {
    playSong,
    currentSong,
    isPlaying,
  } = player;

  // Accommodate common toggle-function names if provided
  // by the existing PlayerContext.
  const togglePlayback =
    player.togglePlayPause ||
    player.togglePlay ||
    player.togglePlayback;

  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  /* =====================================================
     LOAD SONGS
  ===================================================== */

  const loadSongs = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await API.get("/songs");

      setSongs(
        sortNewestFirst(getArray(response))
      );
    } catch (err) {
      console.error(
        "Failed to load recently added songs:",
        err
      );

      setError(
        "Unable to load new songs. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSongs();
  }, [loadSongs]);

  /* =====================================================
     SEARCH
  ===================================================== */

  const filteredSongs = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return songs;

    return songs.filter((song) => {
      const title = getSongTitle(song).toLowerCase();
      const artist = getArtistName(song).toLowerCase();
      const language = String(
        song?.language || ""
      ).toLowerCase();

      return (
        title.includes(query) ||
        artist.includes(query) ||
        language.includes(query)
      );
    });
  }, [songs, search]);

  /* =====================================================
     PLAY / PAUSE
  ===================================================== */

  const handlePlay = useCallback(
    (song) => {
      if (typeof playSong !== "function") {
        console.error(
          "playSong is not available in PlayerContext."
        );
        return;
      }

      const selectedId = getSongId(song);
      const currentId = getSongId(currentSong);

      const isSameSong =
        selectedId != null &&
        currentId != null &&
        String(selectedId) === String(currentId);

      // Clicking the currently playing song toggles playback
      // only when PlayerContext provides a toggle function.
      if (isSameSong && typeof togglePlayback === "function") {
        togglePlayback();
        return;
      }

      // Clicking a different song starts that song.
      // Pass the currently displayed list as the queue.
      if (!isSameSong) {
        playSong(song, filteredSongs);
        return;
      }

      // Same song, but no toggle function is exposed.
      // Avoid calling playSong again because that could restart it.
      console.warn(
        "Add or expose your PlayerContext pause/resume toggle function to enable same-song toggling."
      );
    },
    [
      playSong,
      currentSong,
      togglePlayback,
      filteredSongs,
    ]
  );

  /* =====================================================
     SONG DETAILS
  ===================================================== */

  const openSong = useCallback(
    (song) => {
      const id = getSongId(song);

      if (id != null) {
        navigate(`/songs/${id}`);
      }
    },
    [navigate]
  );

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <main className="recently-added-page">
      <div className="recently-added-content">

        {/* BACK BUTTON */}

        <button
          type="button"
          className="recently-added-back"
          onClick={() => navigate(-1)}
        >
          <FaArrowLeft />
          <span>Back</span>
        </button>

        {/* HEADER */}

        <header className="recently-added-header">
          <div className="recently-added-heading-icon">
            <FaCompactDisc />
          </div>

          <div className="recently-added-heading-copy">
            <p className="recently-added-eyebrow">
              FRESH FROM KEERTHANA
            </p>

            <h1>Recently Added</h1>

            <p className="recently-added-subtitle">
              Discover the latest Christian songs added
              to your music library.
            </p>
          </div>
        </header>

        {/* SEARCH */}

        <div className="recently-added-toolbar">
          <div className="recently-added-search">
            <FaSearch />

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Find a song, artist or language..."
              aria-label="Search recently added songs"
            />
          </div>

          {!loading && (
            <span className="recently-added-count">
              {filteredSongs.length}{" "}
              {filteredSongs.length === 1
                ? "song"
                : "songs"}
            </span>
          )}
        </div>

        {/* ERROR */}

        {error && (
          <div
            className="recently-added-error"
            role="alert"
          >
            <FaExclamationCircle />

            <span>{error}</span>

            <button
              type="button"
              onClick={loadSongs}
            >
              Retry
            </button>
          </div>
        )}

        {/* LOADING */}

        {loading ? (
          <div className="recently-added-status">
            <span className="recently-added-spinner" />

            <p>Loading the latest songs...</p>
          </div>
        ) : filteredSongs.length > 0 ? (
          <section
            className="recently-added-grid"
            aria-label="Recently added songs"
          >
            {filteredSongs.map((song) => {
              const id = getSongId(song);
              const title = getSongTitle(song);
              const artist = getArtistName(song);

              const currentId = getSongId(currentSong);

              const isCurrent =
                id != null &&
                currentId != null &&
                String(currentId) === String(id);

              const isCurrentPlaying =
                isCurrent && Boolean(isPlaying);

              return (
                <article
                  key={id ?? `${title}-${artist}`}
                  className={[
                    "recently-added-card",
                    isCurrent ? "is-current" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {/* ARTWORK: CLICK TO PLAY / PAUSE */}

                  <button
                    type="button"
                    className="recently-added-artwork"
                    onClick={() => handlePlay(song)}
                    aria-label={
                      isCurrentPlaying
                        ? `Pause ${title}`
                        : `Play ${title}`
                    }
                  >
                    <img
                      src={getSongCover(song)}
                      alt={title}
                      loading="lazy"
                      onError={(event) => {
                        event.currentTarget.style.visibility =
                          "hidden";
                      }}
                    />

                    <span
                      className="recently-added-artwork-fallback"
                      aria-hidden="true"
                    >
                      <FaMusic />
                    </span>

                    <span
                      className="recently-added-play-button"
                      aria-hidden="true"
                    >
                      {isCurrentPlaying ? (
                        <FaPause />
                      ) : (
                        <FaPlay />
                      )}
                    </span>
                  </button>

                  {/* TITLE AND ARTIST: CLICK TO PLAY */}

                  <div className="recently-added-song-info">
                    <button
                      type="button"
                      className="recently-added-song-details"
                      onClick={() => handlePlay(song)}
                      title={`Play ${title}`}
                    >
                      <span className="recently-added-song-title">
                        {title}
                      </span>

                      <span className="recently-added-artist">
                        {artist}
                      </span>
                    </button>

                    {song?.language && (
                      <span className="recently-added-language">
                        {song.language}
                      </span>
                    )}

                    {/* SEPARATE DETAILS ACTION */}

                  </div>
                </article>
              );
            })}
          </section>
        ) : (
          /* EMPTY STATE */

          <div className="recently-added-empty">
            <span className="recently-added-empty-icon">
              <FaCompactDisc />
            </span>

            <h2>
              {search.trim()
                ? "No matching songs"
                : "No songs available yet"}
            </h2>

            <p>
              {search.trim()
                ? "Try another song title, artist or language."
                : "New songs will appear here when they are added to KEERTHANA."}
            </p>

            {search.trim() && (
              <button
                type="button"
                onClick={() => setSearch("")}
              >
                Clear search
              </button>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
