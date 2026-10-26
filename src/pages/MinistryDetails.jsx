
import React, { useEffect, useState, useRef } from "react";
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

  const menuRef = useRef(null);

  /* =====================================================
     LOAD MINISTRY + SONGS
  ===================================================== */

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      try {
        setLoading(true);
        setError("");

        const [ministryResponse, songsResponse] =
          await Promise.all([
            API.get(`/ministries/${id}`),
            API.get(`/ministries/${id}/songs`),
          ]);

        if (cancelled) return;

        const ministryData = ministryResponse.data;

        setMinistry(
          ministryData?.ministry || ministryData
        );

        const songData = songsResponse.data;

        if (Array.isArray(songData?.songs)) {
          setSongs(songData.songs);
        } else if (Array.isArray(songData)) {
          setSongs(songData);
        } else {
          setSongs([]);
        }
      } catch (err) {
        if (cancelled) return;

        console.error("Load ministry details error:", err);

        setError(
          err?.response?.data?.message ||
            "Unable to load ministry."
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    if (id) {
      loadData();
    } else {
      setError("Ministry ID is missing.");
      setLoading(false);
    }

    return () => {
      cancelled = true;
    };
  }, [id]);

  /* =====================================================
     VOICE SEARCH
  ===================================================== */

  const handleVoiceSearch = (recognizedText) => {
    setSearch(recognizedText);
  };

  /* =====================================================
     FILTER SONGS
  ===================================================== */

  const searchText = search.trim().toLowerCase();

  const filteredSongs = songs.filter((song) => {
    if (!searchText) return true;

    const searchableFields = [
      song?.title,
      song?.title_english,
      song?.artist_name,
      song?.artist,
      song?.language,
      song?.category_name,
      song?.album_name,
    ];

    return searchableFields.some((field) =>
      String(field || "")
        .toLowerCase()
        .includes(searchText)
    );
  });

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

    const playableSongs = songs.filter(
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

    await playSong(song, songs);
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
            onClick={() => window.location.reload()}
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

  const playableSongs = songs.filter(
    (song) => song?.audio_url
  );

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <div className="ministry-details-page">
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
            alt={ministry.name || "Ministry"}
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

          <h1>{ministry.name}</h1>

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
            <p>Songs from {ministry.name}</p>
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
                    <strong>{song.title}</strong>

                    {song.title_english && (
                      <span className="song-english-title">
                        {song.title_english}
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
