
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
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
  FaEllipsisV,
  FaPlus,
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

/* ENGLISH SONG TITLE */

function getSongTitle(song) {
  return (
    song?.title_english ||
    song?.title ||
    "Untitled Song"
  );
}

/* TELUGU SONG TITLE */

function getTeluguSongTitle(song) {
  return (
    song?.title_telugu ||
    song?.title_native ||
    song?.title_te ||
    (
      String(song?.language || "").toLowerCase() === "telugu"
        ? song?.title
        : ""
    ) ||
    ""
  );
}

/* ARTIST NAME - ALWAYS ENGLISH */

function getArtistName(song) {
  return (
    song?.artist_name_english ||
    song?.artist_english ||
    song?.artist?.name_english ||
    song?.artist?.name_english ||
    song?.artist?.english_name ||
    song?.artist_name ||
    song?.artist?.name ||
    (typeof song?.artist === "string" ? song.artist : "") ||
    "Unknown Artist"
  );
}
/* SORT NEWEST FIRST */

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

  /* PLAYER TOGGLE SUPPORT */

  const togglePlayback =
    player.togglePlayPause ||
    player.togglePlay ||
    player.togglePlayback;

  /* STATES */

  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);

  const requestInProgressRef = useRef(false);
  const songsRef = useRef(songs);

  songsRef.current = songs;

  const touchStartYRef = useRef(null);
  const pullTriggeredRef = useRef(false);

  // Three-dot song actions menu.
  const [openMenuSongId, setOpenMenuSongId] = useState(null);
  const songMenuRef = useRef(null);

  /* =====================================================
     LOAD SONGS
  ===================================================== */

  const loadSongs = useCallback(
    async ({ silent = false } = {}) => {
      if (requestInProgressRef.current) {
        return;
      }

      requestInProgressRef.current = true;

      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

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

        if (!silent || songsRef.current.length === 0) {
          setError(
            "Unable to load new songs. Please try again."
          );
        }
      } finally {
        requestInProgressRef.current = false;
        setLoading(false);
        setRefreshing(false);
        setPullDistance(0);
      }
    },
    []
  );

  /* INITIAL LOAD */

  useEffect(() => {
    loadSongs();
  }, [loadSongs]);

  /* =====================================================
     REFRESH WHEN APP RETURNS TO FOREGROUND
  ===================================================== */

  useEffect(() => {
    const handleAppResume = () => {
      loadSongs({ silent: true });
    };

    window.addEventListener(
      "keerthana:app-resume",
      handleAppResume
    );

    return () => {
      window.removeEventListener(
        "keerthana:app-resume",
        handleAppResume
      );
    };
  }, [loadSongs]);

  /* =====================================================
     CLOSE SONG MENU ON OUTSIDE TAP / ESCAPE
  ===================================================== */

  useEffect(() => {
    if (openMenuSongId === null) return undefined;

    const handleOutsidePointer = (event) => {
      if (
        songMenuRef.current &&
        !songMenuRef.current.contains(event.target)
      ) {
        setOpenMenuSongId(null);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setOpenMenuSongId(null);
      }
    };

    document.addEventListener("pointerdown", handleOutsidePointer);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("pointerdown", handleOutsidePointer);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [openMenuSongId]);

  /* =====================================================
     ADD SONG TO PLAYLIST
  ===================================================== */

  const handleAddToPlaylist = useCallback(
    (song) => {
      setOpenMenuSongId(null);

      navigate("/playlists", {
        state: {
          selectedSong: song,
          action: "add-song",
        },
      });
    },
    [navigate]
  );

  /* =====================================================
     PULL DOWN TO REFRESH
  ===================================================== */

  const handleTouchStart = useCallback((event) => {
    if (
      window.scrollY > 0 ||
      event.touches.length !== 1
    ) {
      touchStartYRef.current = null;
      return;
    }

    touchStartYRef.current =
      event.touches[0].clientY;

    pullTriggeredRef.current = false;
  }, []);

  const handleTouchMove = useCallback(
    (event) => {
      if (
        touchStartYRef.current === null ||
        refreshing ||
        loading ||
        window.scrollY > 0 ||
        event.touches.length !== 1
      ) {
        return;
      }

      const distance =
        event.touches[0].clientY -
        touchStartYRef.current;

      if (distance > 0) {
        setPullDistance(
          Math.min(distance * 0.55, 90)
        );
      }
    },
    [refreshing, loading]
  );

  const handleTouchEnd = useCallback(() => {
    const shouldRefresh =
      pullDistance >= 65 &&
      !pullTriggeredRef.current &&
      !refreshing &&
      !loading;

    touchStartYRef.current = null;

    if (shouldRefresh) {
      pullTriggeredRef.current = true;
      loadSongs({ silent: true });
    } else {
      setPullDistance(0);
    }
  }, [
    pullDistance,
    refreshing,
    loading,
    loadSongs,
  ]);

  /* =====================================================
     SEARCH
     English title + Telugu title + Artist + Language
  ===================================================== */

  const filteredSongs = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return songs;

    return songs.filter((song) => {
      const englishTitle =
        getSongTitle(song).toLowerCase();

      const teluguTitle =
        getTeluguSongTitle(song).toLowerCase();

      const artist =
        getArtistName(song).toLowerCase();

      const language =
        String(song?.language || "").toLowerCase();

      return (
        englishTitle.includes(query) ||
        teluguTitle.includes(query) ||
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

      if (
        isSameSong &&
        typeof togglePlayback === "function"
      ) {
        togglePlayback();
        return;
      }

      if (!isSameSong) {
        playSong(song, filteredSongs);
        return;
      }

      console.warn(
        "PlayerContext does not expose a playback toggle function."
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
     RENDER
  ===================================================== */

  return (
    <main
      className="recently-added-page"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >

      {/* PULL REFRESH INDICATOR */}

      {(pullDistance > 0 || refreshing) && (
        <div
          className="recently-added-refresh-indicator"
          role="status"
          aria-live="polite"
          style={{
            position: "fixed",
            top: "14px",
            left: "50%",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "9px",
            padding: "10px 16px",
            borderRadius: "999px",
            background: "#101d35",
            color: "#f5f7fb",
            border: "1px solid rgba(212, 175, 55, 0.45)",
            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.25)",
            fontSize: "13px",
            fontWeight: 600,
            whiteSpace: "nowrap",
            opacity: refreshing
              ? 1
              : Math.min(pullDistance / 65, 1),
            transform: `translate(-50%, ${
              refreshing
                ? 0
                : Math.min(pullDistance - 42, 12)
            }px)`,
            pointerEvents: "none",
          }}
        >
          <span className="recently-added-spinner" />

          <span>
            {refreshing
              ? "Refreshing songs..."
              : pullDistance >= 65
                ? "Release to refresh"
                : "Pull down to refresh"}
          </span>
        </div>
      )}

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
              onClick={() => loadSongs()}
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

          /* SONG LIST */

          <section
            className="recently-added-grid"
            aria-label="Recently added songs"
          >

            {filteredSongs.map((song) => {
              const id = getSongId(song);

              const title = getSongTitle(song);
              const teluguTitle = getTeluguSongTitle(song);
              const artist = getArtistName(song);
              const menuKey = String(id ?? `${title}-${artist}`);

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

                  {/* ARTWORK */}

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

                  {/* SONG INFORMATION */}

                  <div className="recently-added-song-info">

                    <button
                      type="button"
                      className="recently-added-song-details"
                      onClick={() => handlePlay(song)}
                      title={`Play ${title}`}
                    >

                      {/* ENGLISH TITLE */}

                      <span className="recently-added-song-title">
                        {title}
                      </span>

                      {/* TELUGU TITLE */}

                      {teluguTitle && (
                        <span className="recently-added-telugu-title">
                          {teluguTitle}
                        </span>
                      )}

                      {/* ENGLISH ARTIST NAME */}

                      <span className="recently-added-artist">
                        {artist}
                      </span>

                    </button>

                  </div>

                  {/* THREE-DOT SONG ACTIONS */}

                  <div
                    className="recently-added-song-menu-wrap"
                    ref={openMenuSongId === menuKey ? songMenuRef : null}
                  >
                    <button
                      type="button"
                      className="recently-added-menu-trigger"
                      aria-label={`More options for ${title}`}
                      aria-haspopup="menu"
                      aria-expanded={openMenuSongId === menuKey}
                      title="More options"
                      onClick={(event) => {
                        event.stopPropagation();
                        setOpenMenuSongId((current) =>
                          current === menuKey ? null : menuKey
                        );
                      }}
                    >
                      <FaEllipsisV />
                    </button>

                    {openMenuSongId === menuKey && (
                      <div
                        className="recently-added-song-menu"
                        role="menu"
                        aria-label={`${title} song actions`}
                        onClick={(event) => event.stopPropagation()}
                      >
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            setOpenMenuSongId(null);
                            handlePlay(song);
                          }}
                        >
                          <FaPlay />
                          <span>Play Now</span>
                        </button>

                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => handleAddToPlaylist(song)}
                        >
                          <FaPlus />
                          <span>Add to Playlist</span>
                        </button>

                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            setOpenMenuSongId(null);
                            navigate(`/songs/${id}`);
                          }}
                          disabled={id == null}
                        >
                          <FaCompactDisc />
                          <span>View Song Details</span>
                        </button>
                      </div>
                    )}
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
