
import React, { useCallback, useEffect, useState, useRef, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  FaArrowLeft,
  FaPause,
  FaPlay,
  FaEllipsisV,
  FaMusic,
  FaInfoCircle,
  FaTimes,
  FaSearch,
} from "react-icons/fa";

import API from "../services/api";
import { usePlayer } from "../context/usePlayer";
import VoiceSearch from "../components/VoiceSearch";

import "../assets/css/ministry-details.css";

const DEFAULT_MINISTRY_IMAGE = "/default-ministry.png";
const DEFAULT_SONG_IMAGE = "/default-song.png";


/* =====================================================
   BILINGUAL MINISTRY / SONG NAME HELPERS
===================================================== */

const getMinistryEnglishName = (item) => {
  if (!item) return "";
  const english = String(item.name_english || "").trim();
  const legacy = String(item.name || "").trim();
  const telugu = String(item.name_telugu || "").trim();
  if (english) return english;
  if (legacy && legacy !== telugu) return legacy;
  return legacy || telugu;
};

const getMinistryTeluguName = (item) => {
  if (!item) return "";
  const telugu = String(item.name_telugu || "").trim();
  const legacy = String(item.name || "").trim();
  const english = String(item.name_english || "").trim();
  if (telugu) return telugu;
  if (legacy && legacy !== english) return legacy;
  return "";
};

const getSongTeluguTitle = (song) =>
  String(song?.title_telugu || song?.title || "").trim();

const getSongEnglishTitle = (song) =>
  String(song?.title_english || "").trim();

const compareMinistrySongs = (a, b) => {
  const titleA = getSongEnglishTitle(a) || getSongTeluguTitle(a);
  const titleB = getSongEnglishTitle(b) || getSongTeluguTitle(b);
  return titleA.localeCompare(titleB, "en", {
    sensitivity: "base",
    numeric: true,
  });
};

const MinistryDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const {
    playSong,
    togglePlay,
    currentSong,
    isPlaying,
  } = usePlayer();

  const [ministry, setMinistry] = useState(null);
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [voiceLanguage, setVoiceLanguage] = useState("te-IN");
  const [openMenuSongId, setOpenMenuSongId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);

  const menuRef = useRef(null);
  const requestInProgressRef = useRef(false);
  const ministryRef = useRef(ministry);
  const songsRef = useRef(songs);
  const touchStartYRef = useRef(null);
  const pullDistanceRef = useRef(0);

  ministryRef.current = ministry;
  songsRef.current = songs;

  /* =====================================================
     LOAD MINISTRY + SONGS
     Silent refresh keeps the current page and player intact.
  ===================================================== */

  const loadData = useCallback(async ({ silent = false } = {}) => {
    if (!id || requestInProgressRef.current) return;

    requestInProgressRef.current = true;

    if (!silent) {
      if (!ministryRef.current) setLoading(true);
      setError("");
    } else {
      setRefreshing(true);
    }

    try {
      const [ministryResponse, songsResponse] = await Promise.all([
        API.get(`/ministries/${id}`),
        API.get(`/ministries/${id}/songs`),
      ]);

      const ministryData = ministryResponse.data;
      const nextMinistry = ministryData?.ministry || ministryData || null;

      const songData = songsResponse.data;
      const nextSongs = Array.isArray(songData?.songs)
        ? songData.songs
        : Array.isArray(songData)
        ? songData
        : [];

      setMinistry(nextMinistry);
      setSongs(nextSongs);
      setError("");
    } catch (err) {
      console.error("Load ministry details error:", err);

      if (!ministryRef.current) {
        setError(
          err?.response?.data?.message || "Unable to load ministry."
        );
      }
    } finally {
      requestInProgressRef.current = false;
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    if (!id) {
      setError("Ministry ID is missing.");
      setLoading(false);
      return;
    }

    setMinistry(null);
    setSongs([]);
    ministryRef.current = null;
    songsRef.current = [];
    setLoading(true);
    loadData();
  }, [id, loadData]);

  // Refresh API data whenever the app returns to the foreground.
  useEffect(() => {
    const handleAppResume = () => loadData({ silent: true });

    window.addEventListener("keerthana:app-resume", handleAppResume);
    return () => {
      window.removeEventListener("keerthana:app-resume", handleAppResume);
    };
  }, [loadData]);

  // Pull down from the top of the page to refresh ministry details and songs.
  const handleTouchStart = (event) => {
    if (window.scrollY > 0 || requestInProgressRef.current) return;
    touchStartYRef.current = event.touches?.[0]?.clientY ?? null;
  };

  const handleTouchMove = (event) => {
    if (touchStartYRef.current == null || requestInProgressRef.current) return;

    const currentY = event.touches?.[0]?.clientY ?? touchStartYRef.current;
    const distance = Math.max(
      0,
      Math.min((currentY - touchStartYRef.current) * 0.5, 88)
    );

    pullDistanceRef.current = distance;
    setPullDistance(distance);
  };

  const resetPullGesture = () => {
    touchStartYRef.current = null;
    pullDistanceRef.current = 0;
    setPullDistance(0);
  };

  const handleTouchEnd = () => {
    const shouldRefresh = pullDistanceRef.current >= 62;
    resetPullGesture();

    if (shouldRefresh) loadData({ silent: true });
  };

  /* =====================================================
     VOICE SEARCH
  ===================================================== */

  const handleVoiceSearch = (recognizedText) => {
    setSearch(recognizedText);
  };

  /* =====================================================
     SORT SONGS A-Z + FILTER SONGS
     Sorting is shared by the visible list and Play All.
  ===================================================== */

  const sortedSongs = useMemo(() => {
    return [...songs].sort(compareMinistrySongs);
  }, [songs]);

  const searchText = search.trim().toLowerCase();

  const filteredSongs = useMemo(() => {
    return sortedSongs.filter((song) => {
      if (!searchText) return true;

      const searchableFields = [
        song?.title,
        song?.title_telugu,
        song?.title_english,
        song?.artist_name,
        song?.artist,
        song?.language,
        song?.category_name,
        song?.album_name,
      ];

      return searchableFields.some((field) =>
        String(field || "").toLowerCase().includes(searchText)
      );
    });
  }, [sortedSongs, searchText]);

  /* =====================================================
     CLOSE MENU ON OUTSIDE CLICK / ESCAPE
  ===================================================== */

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target)
      ) {
        setOpenMenuSongId(null);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setOpenMenuSongId(null);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );

      document.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, []);

  /* =====================================================
     SONG HELPERS
  ===================================================== */

  const isMinistrySong = (song) =>
    songs.some(
      (item) => String(item.id) === String(song?.id)
    );

  const isCurrentSong = (song) =>
    Boolean(
      currentSong &&
      String(currentSong.id) === String(song?.id)
    );

  const ministryIsPlaying = Boolean(
    currentSong &&
    isPlaying &&
    isMinistrySong(currentSong)
  );

  /* =====================================================
     MINISTRY PLAY ALL / PAUSE
     Uses ALL songs, not search-filtered results.
  ===================================================== */

  const handleMinistryPlayPause = async () => {
    if (!songs.length) return;

    if (currentSong && isMinistrySong(currentSong)) {
      await togglePlay();
      return;
    }

    const playableSongs = sortedSongs.filter(
      (song) => song?.audio_url
    );

    if (!playableSongs.length) return;

    await playSong(playableSongs[0], playableSongs);
  };

  /* =====================================================
     INDIVIDUAL SONG PLAY / PAUSE
  ===================================================== */

  const handleSongPlayPause = async (song) => {
    if (!song?.audio_url) return;

    setOpenMenuSongId(null);

    if (isCurrentSong(song)) {
      await togglePlay();
      return;
    }

    await playSong(song, sortedSongs);
  };

  /* =====================================================
     THREE-DOT MENU
  ===================================================== */

  const toggleSongMenu = (event, songId) => {
    event.stopPropagation();

    setOpenMenuSongId((previous) =>
      String(previous) === String(songId)
        ? null
        : songId
    );
  };

  const openSongDetails = (song) => {
    setOpenMenuSongId(null);
    navigate(`/songs/${song.id}`);
  };

  const handleMenuAction = async (action, song) => {
    setOpenMenuSongId(null);

    if (action === "details") {
      openSongDetails(song);
      return;
    }

    if (action === "play") {
      await handleSongPlayPause(song);
      return;
    }

    /*
      Queue and like actions retain their existing
      placeholders until connected to your actual
      player queue and liked-songs functions.
    */

    if (action === "queue") {
      console.info(
        "Connect this action to your existing addToQueue method.",
        song
      );
      return;
    }

    if (action === "like") {
      console.info(
        "Connect this action to your existing likeSong method.",
        song
      );
    }
  };

  /* =====================================================
     LOADING STATE
  ===================================================== */

  if (loading) {
    return (
      <div className="ministry-details-page">
        <div className="ministry-loading">
          <span
            className="ministry-loading-spinner"
            aria-hidden="true"
          />
          <span>Loading ministry...</span>
        </div>
      </div>
    );
  }

  /* =====================================================
     ERROR STATE
  ===================================================== */

  if (error) {
    return (
      <div className="ministry-details-page">
        <button
          type="button"
          className="ministry-back-button"
          onClick={() => navigate("/ministries")}
        >
          <FaArrowLeft />
          <span>Back to Ministries</span>
        </button>

        <div className="ministry-error">
          <h2>Something went wrong</h2>
          <p>{error}</p>

          <button
            type="button"
            className="ministry-retry-button"
            onClick={() => loadData()}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  /* =====================================================
     NOT FOUND
  ===================================================== */

  if (!ministry) {
    return (
      <div className="ministry-details-page">
        <button
          type="button"
          className="ministry-back-button"
          onClick={() => navigate("/ministries")}
        >
          <FaArrowLeft />
          <span>Back to Ministries</span>
        </button>

        <div className="ministry-empty-state">
          <FaMusic className="ministry-empty-state-icon" />
          <h2>Ministry not found</h2>
          <p>The requested ministry could not be found.</p>
        </div>
      </div>
    );
  }

  /* =====================================================
     MINISTRY DATA
  ===================================================== */

  const ministryImage =
    ministry.image_url ||
    ministry.image ||
    ministry.logo ||
    DEFAULT_MINISTRY_IMAGE;

  const playableSongs = sortedSongs.filter(
    (song) => song?.audio_url
  );

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <div
      className="ministry-details-page"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={resetPullGesture}
    >
      <style>{`
        .ministry-refresh-indicator {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          min-height: 38px;
          color: var(--text-secondary, #aebbd0);
          font-size: 13px;
          font-weight: 600;
        }
        .ministry-refresh-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(212, 175, 55, 0.25);
          border-top-color: #d4af37;
          border-radius: 50%;
          animation: ministry-refresh-spin 0.75s linear infinite;
        }
        @keyframes ministry-refresh-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
      {refreshing && (
        <div className="ministry-refresh-indicator" role="status" aria-live="polite">
          <span className="ministry-refresh-spinner" aria-hidden="true" />
          <span>Refreshing ministry...</span>
        </div>
      )}
      {!refreshing && pullDistance > 0 && (
        <div
          className="ministry-refresh-indicator"
          style={{ transform: `translateY(${Math.min(pullDistance, 62)}px)` }}
          aria-hidden="true"
        >
          <span className="ministry-refresh-spinner" aria-hidden="true" />
          <span>Pull to refresh</span>
        </div>
      )}
      {/* BACK BUTTON */}

      <button
        type="button"
        className="ministry-back-button"
        onClick={() => navigate("/ministries")}
      >
        <FaArrowLeft />
        <span>Back to Ministries</span>
      </button>

      {/* MINISTRY HERO */}

      <section className="ministry-header">
        <div className="ministry-header-image">
          <img
            src={ministryImage}
            alt={getMinistryEnglishName(ministry) || "Ministry"}
            onError={(event) => {
              event.currentTarget.onerror = null;
              event.currentTarget.src = DEFAULT_MINISTRY_IMAGE;
            }}
          />
        </div>

        <div className="ministry-header-content">
          <span className="ministry-header-eyebrow">
            MINISTRY
          </span>

          <div className="ministry-header-names">
            <h1>{getMinistryEnglishName(ministry)}</h1>
            {getMinistryTeluguName(ministry) &&
              getMinistryTeluguName(ministry) !== getMinistryEnglishName(ministry) && (
                <p className="ministry-header-telugu-name">
                  {getMinistryTeluguName(ministry)}
                </p>
              )}
          </div>

          {ministry.description && (
            <p className="ministry-header-description">
              {ministry.description}
            </p>
          )}

          <div className="ministry-header-meta">
            {/* Optional ministry metadata */}
          </div>
        </div>
      </section>

      {/* PLAY ALL */}

      <div className="ministry-actions">
        <button
          type="button"
          className={`ministry-play-all-btn ${
            ministryIsPlaying ? "is-playing" : ""
          }`}
          onClick={handleMinistryPlayPause}
          disabled={!playableSongs.length}
          aria-label={
            ministryIsPlaying
              ? "Pause ministry songs"
              : "Play all ministry songs"
          }
        >
          {ministryIsPlaying ? <FaPause /> : <FaPlay />}

          <span>
            {ministryIsPlaying ? "Pause All" : "Play All"}
          </span>
        </button>
      </div>

      {/* SONGS SECTION */}

      <section className="ministry-songs-section">
        {/* VOICE SEARCH */}

        <div
          className="ministry-details-voice-search-section"
          aria-label="Search ministry songs"
        >
          <VoiceSearch
            value={search}
            onChange={setSearch}
            onSearch={handleVoiceSearch}
            language={voiceLanguage}
            onLanguageChange={setVoiceLanguage}
            placeholder="Search songs, artists, languages..."
            ariaLabel="Search ministry songs"
          />
        </div>

        {/* SONG HEADING AND TRACKER */}

        <div className="ministry-songs-heading">
          <div>
            <h2>Songs</h2>
            <p>
              Songs from {getMinistryEnglishName(ministry)}
              {getMinistryTeluguName(ministry) &&
                getMinistryTeluguName(ministry) !== getMinistryEnglishName(ministry)
                ? ` • ${getMinistryTeluguName(ministry)}`
                : ""}
            </p>
          </div>

          <span className="ministry-track-count">
            {filteredSongs.length}{" "}
            {filteredSongs.length === 1 ? "TRACK" : "TRACKS"}
          </span>
        </div>

        {/* NO SONGS / NO SEARCH RESULTS */}

        {songs.length === 0 ? (
          <div className="ministry-empty-state">
            <div className="ministry-empty-state-icon">
              <FaMusic />
            </div>

            <h2>No songs available</h2>

            <p>
              Songs added to this ministry will appear here.
            </p>
          </div>
        ) : filteredSongs.length === 0 ? (
          <div className="ministry-empty-state ministry-search-empty">
            <div className="ministry-empty-state-icon">
              <FaSearch />
            </div>

            <h2>No matching songs</h2>

            <p>
              No songs match "{search.trim()}". Try another
              title, artist, or language.
            </p>

            <button
              type="button"
              className="ministry-clear-search-btn"
              onClick={() => setSearch("")}
            >
              Clear Search
            </button>
          </div>
        ) : (
          /* SONG LIST */

          <div className="ministry-song-list">
            {filteredSongs.map((song, index) => {
              const songImage =
                song.cover_url ||
                song.album_cover ||
                song.artist_image ||
                DEFAULT_SONG_IMAGE;

              const songIsCurrent = isCurrentSong(song);
              const songIsPlaying = songIsCurrent && isPlaying;

              const menuIsOpen =
                String(openMenuSongId) === String(song.id);

              return (
                <article
                  key={song.id}
                  className={`ministry-song-row ${
                    songIsCurrent ? "is-current" : ""
                  }`}
                >
                  {/* PLAY / PAUSE */}

                  <button
                    type="button"
                    className={`song-play-btn ${
                      songIsPlaying ? "is-playing" : ""
                    }`}
                    onClick={() => handleSongPlayPause(song)}
                    disabled={!song?.audio_url}
                    aria-label={
                      songIsPlaying
                        ? `Pause ${song.title}`
                        : `Play ${song.title}`
                    }
                    title={
                      songIsPlaying ? "Pause song" : "Play song"
                    }
                  >
                    {songIsPlaying ? <FaPause /> : <FaPlay />}
                  </button>

                  {/* TRACK NUMBER */}

                  <span className="song-number">
                    {String(index + 1).padStart(2, "0")}
                  </span>

                  {/* SONG COVER */}

                  <button
                    type="button"
                    className="song-cover"
                    onClick={() => openSongDetails(song)}
                    aria-label={`View ${song.title} details`}
                  >
                    <img
                      src={songImage}
                      alt=""
                      onError={(event) => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src = DEFAULT_SONG_IMAGE;
                      }}
                    />
                  </button>

                  {/* SONG INFORMATION */}

                  <button
                    type="button"
                    className="song-info"
                    onClick={() => handleSongPlayPause(song)}
                    disabled={!song?.audio_url}
                    title={
                      songIsPlaying
                        ? `Pause ${song.title}`
                        : `Play ${song.title}`
                    }
                    aria-label={
                      songIsPlaying
                        ? `Pause ${song.title}`
                        : `Play ${song.title}`
                    }
                  >
                    <strong>
                      {getSongTeluguTitle(song) ||
                        getSongEnglishTitle(song) ||
                        "Untitled Song"}
                    </strong>

                    {getSongEnglishTitle(song) &&
                      getSongEnglishTitle(song) !== getSongTeluguTitle(song) && (
                        <span className="song-english-title">
                          {getSongEnglishTitle(song)}
                        </span>
                      )}

                    <span className="song-artist">
                      {song.artist_name ||
                        song.artist ||
                        "Unknown Artist"}
                    </span>
                  </button>

                  {/* LANGUAGE */}

                  <div className="song-language">
                    {song.language && (
                      <span>{song.language}</span>
                    )}
                  </div>

                  {/* THREE-DOT MENU */}

                  <div
                    className="ministry-song-menu-wrap"
                    ref={menuIsOpen ? menuRef : null}
                  >
                    <button
                      type="button"
                      className="ministry-song-menu-button"
                      aria-label={`More options for ${song.title}`}
                      aria-haspopup="menu"
                      aria-expanded={menuIsOpen}
                      onClick={(event) =>
                        toggleSongMenu(event, song.id)
                      }
                    >
                      <FaEllipsisV />
                    </button>

                    {menuIsOpen && (
                      <div
                        className="ministry-song-menu"
                        role="menu"
                      >
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() =>
                            handleMenuAction("play", song)
                          }
                          disabled={!song?.audio_url}
                        >
                          {songIsPlaying ? <FaPause /> : <FaPlay />}
                          <span>
                            {songIsPlaying ? "Pause" : "Play"}
                          </span>
                        </button>

                        <button
                          type="button"
                          role="menuitem"
                          onClick={() =>
                            handleMenuAction("queue", song)
                          }
                        >
                          <FaMusic />
                          <span>Add to Queue</span>
                        </button>

                        <button
                          type="button"
                          role="menuitem"
                          onClick={() =>
                            handleMenuAction("like", song)
                          }
                        >
                          <FaTimes />
                          <span>Like / Unlike</span>
                        </button>

                        <div className="ministry-song-menu-divider" />

                        <button
                          type="button"
                          role="menuitem"
                          onClick={() =>
                            handleMenuAction("details", song)
                          }
                        >
                          <FaInfoCircle />
                          <span>Song Details</span>
                        </button>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default MinistryDetails;
