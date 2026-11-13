
import { useCallback, useEffect, useRef, useState } from "react";

import {
  FaArrowLeft,
  FaMicrophone,
  FaPause,
  FaPlay,
  FaEllipsisV,
  FaPlus,
  FaListUl,
  FaMusic,
  FaTimes,
} from "react-icons/fa";

import { useNavigate, useParams } from "react-router-dom";

import API from "../services/api";
import { usePlayer } from "../context/usePlayer";
import { getMediaUrl } from "../utils/media";
import VoiceSearch from "../components/VoiceSearch";

import "../assets/css/artistDetails.css";

function ArtistDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const menuRef = useRef(null);
  const requestInProgressRef = useRef(false);
  const requestIdRef = useRef(0);
  const touchStartYRef = useRef(null);
  const pullDistanceRef = useRef(0);

  const {
    playSong,
    togglePlay,
    currentSong,
    isPlaying,
    addToQueue,
  } = usePlayer();

  const [artist, setArtist] = useState(null);
  const artistRef = useRef(null);
  artistRef.current = artist;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [activeMenu, setActiveMenu] = useState(null);
  const [notice, setNotice] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [voiceLanguage, setVoiceLanguage] = useState("te-IN");

  const handleVoiceSearch = (recognizedText) => {
    setSearchQuery(recognizedText);
  };

  /* =========================================================
     LOAD ARTIST DETAILS
     Silent refresh updates API data without resetting the page,
     search state, player, or current playback.
  ========================================================= */

  const loadArtist = useCallback(async ({ silent = false } = {}) => {
    if (!id || requestInProgressRef.current) return;

    requestInProgressRef.current = true;
    const requestId = ++requestIdRef.current;

    if (!silent) {
      setLoading(true);
      setError("");
    } else {
      setRefreshing(true);
    }

    try {
      const response = await API.get(`/artists/${id}`);
      if (requestId !== requestIdRef.current) return;

      const data = response?.data;
      const nextArtist = data?.artist || data || null;

      if (nextArtist) {
        setArtist(nextArtist);
        setError("");
      } else if (!artistRef.current) {
        setError("Artist details are not available.");
      }
    } catch (err) {
      console.error("Failed to load artist:", err);
      if (!silent || !artistRef.current) {
        setError(
          err.response?.data?.message ||
            "Unable to load artist details. Please try again."
        );
      }
    } finally {
      if (requestId === requestIdRef.current) {
        requestInProgressRef.current = false;
        setLoading(false);
        setRefreshing(false);
        setPullDistance(0);
        pullDistanceRef.current = 0;
      }
    }
  }, [id]);

  useEffect(() => {
    if (!id) {
      setError("Artist ID is missing.");
      setLoading(false);
      return undefined;
    }

    loadArtist();

    return () => {
      requestIdRef.current += 1;
      requestInProgressRef.current = false;
    };
  }, [id, loadArtist]);

  /* Refresh when the app returns to the foreground. */
  useEffect(() => {
    const handleAppResume = () => {
      if (document.visibilityState === "hidden") return;
      loadArtist({ silent: true });
    };

    window.addEventListener("keerthana:app-resume", handleAppResume);
    return () => {
      window.removeEventListener("keerthana:app-resume", handleAppResume);
    };
  }, [loadArtist]);

  /* Pull-to-refresh: only activate when the page is at the top. */
  const handleTouchStart = (event) => {
    if (window.scrollY > 0 || event.touches.length !== 1) return;
    touchStartYRef.current = event.touches[0].clientY;
    pullDistanceRef.current = 0;
  };

  const handleTouchMove = (event) => {
    if (
      touchStartYRef.current == null ||
      window.scrollY > 0 ||
      loading ||
      refreshing
    ) return;

    const delta = event.touches[0].clientY - touchStartYRef.current;
    if (delta <= 0) return;

    const distance = Math.min(delta * 0.5, 88);
    pullDistanceRef.current = distance;
    setPullDistance(distance);
  };

  const handleTouchEnd = () => {
    const shouldRefresh = pullDistanceRef.current >= 64;
    touchStartYRef.current = null;
    pullDistanceRef.current = 0;
    setPullDistance(0);

    if (shouldRefresh) loadArtist({ silent: true });
  };

  const handleTouchCancel = () => {
    touchStartYRef.current = null;
    pullDistanceRef.current = 0;
    setPullDistance(0);
  };

  /* =========================================================
     CLOSE MENU ON OUTSIDE CLICK / ESCAPE
  ========================================================= */

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target)
      ) {
        setActiveMenu(null);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setActiveMenu(null);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  /* =========================================================
     SONG DATA & SEARCH
  ========================================================= */

  const songs = Array.isArray(artist?.songs)
    ? artist.songs
    : [];

  const getSongEnglishTitle = (song) =>
    String(song?.title_english || "").trim();

  const getSongPrimaryTitle = (song) =>
    String(song?.title || song?.title_english || "Untitled song").trim();

  const sortedSongs = [...songs].sort((a, b) => {
    const titleA = getSongEnglishTitle(a) || getSongPrimaryTitle(a);
    const titleB = getSongEnglishTitle(b) || getSongPrimaryTitle(b);

    return titleA.localeCompare(titleB, "en", {
      sensitivity: "base",
      numeric: true,
    });
  });

  const artistEnglishName =
    artist?.name_english ||
    artist?.name ||
    "Unknown Artist";

  const artistTeluguName =
    artist?.name_telugu &&
    artist.name_telugu.trim() !== artistEnglishName.trim()
      ? artist.name_telugu
      : "";

  const query = searchQuery.trim().toLowerCase();

  const filteredSongs = sortedSongs.filter((song) => {
    if (!query) return true;

    const searchableFields = [
      song?.title,
      song?.title_english,
      song?.artist_name,
      song?.artist,
      song?.language,
      song?.category_name,
      song?.album_name,
      artist?.name,
      artist?.name_english,
      artist?.name_telugu,
    ];

    return searchableFields.some((field) =>
      String(field || "").toLowerCase().includes(query)
    );
  });

  const artistImage = artist?.image_url
    ? getMediaUrl(artist.image_url)
    : null;

  /* =========================================================
     CURRENT SONG HELPERS
  ========================================================= */

  const isCurrentSong = (song) =>
    currentSong?.id != null &&
    song?.id != null &&
    String(currentSong.id) === String(song.id);

  const artistHasCurrentSong = songs.some(isCurrentSong);

  const artistIsPlaying =
    artistHasCurrentSong && Boolean(isPlaying);

  /* =========================================================
     PLAY / PAUSE A SONG
  ========================================================= */

  const handleSongPlayPause = async (song) => {
    if (!song?.audio_url) {
      setNotice("Audio is not available for this song.");
      return;
    }

    setActiveMenu(null);
    setNotice("");

    try {
      if (isCurrentSong(song)) {
        await togglePlay();
      } else {
        await playSong(song, sortedSongs);
      }
    } catch (err) {
      console.error("Song playback error:", err);
      setNotice("Unable to play this song. Please try again.");
    }
  };

  /* =========================================================
     PLAY ALL ARTIST SONGS
     Uses ALL artist songs, not search results.
  ========================================================= */

  const handleArtistPlayPause = async () => {
    const playableSongs = songs.filter(
      (song) => song?.audio_url
    );

    if (!playableSongs.length) return;

    setNotice("");

    try {
      if (artistHasCurrentSong) {
        await togglePlay();
      } else {
        await playSong(playableSongs[0], sortedSongs.filter((song) => song?.audio_url));
      }
    } catch (err) {
      console.error("Artist playback error:", err);
      setNotice("Unable to play these songs. Please try again.");
    }
  };

  /* =========================================================
     ADD TO QUEUE
  ========================================================= */

  const handleAddToQueue = (song) => {
    setActiveMenu(null);
    setNotice("");

    if (typeof addToQueue !== "function") {
      setNotice("Queue is not available in the current player.");
      return;
    }

    try {
      addToQueue(song);
      setNotice(`Added "${song.title || "Song"}" to your queue.`);
    } catch (err) {
      console.error("Add to queue error:", err);
      setNotice("Unable to add this song to the queue.");
    }
  };

  /* =========================================================
     ADD TO PLAYLIST
  ========================================================= */

  const handleAddToPlaylist = (song) => {
    setActiveMenu(null);

    navigate("/playlists", {
      state: {
        selectedSong: song,
        action: "add-song",
      },
    });
  };

  /* =========================================================
     LOADING STATE
  ========================================================= */

  if (loading) {
    return (
      <main className="artist-details-page artist-details-loading">
        <div className="artist-loading-indicator" />
        <p>Loading artist...</p>
      </main>
    );
  }

  /* =========================================================
     ERROR STATE
  ========================================================= */

  if (error || !artist) {
    return (
      <main className="artist-details-page">
        <button
          type="button"
          className="artist-back"
          onClick={() => navigate(-1)}
        >
          <FaArrowLeft />
          <span>Back</span>
        </button>

        <div className="artist-details-error">
          <FaMicrophone />

          <h2>Artist unavailable</h2>

          <p>{error || "This artist could not be found."}</p>

          <button
            type="button"
            onClick={() => loadArtist()}
          >
            Try again
          </button>
          <button
            type="button"
            onClick={() => navigate("/artists")}
          >
            Browse artists
          </button>
        </div>
      </main>
    );
  }

  /* =========================================================
     PAGE
  ========================================================= */

  return (
    <main
      className="artist-details-page"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
    >
      {(refreshing || pullDistance > 0) && (
        <div
          className="artist-details-refresh-indicator"
          role="status"
          aria-live="polite"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            minHeight: "42px",
            color: "#e7c978",
            fontSize: "13px",
            fontWeight: 600,
            opacity: refreshing ? 1 : Math.min(pullDistance / 64, 1),
          }}
        >
          <span className="artist-loading-indicator" />
          {refreshing
            ? "Refreshing artist..."
            : pullDistance >= 64
              ? "Release to refresh"
              : "Pull down to refresh"}
        </div>
      )}
      <div className="artist-details-main">
        {/* BACK NAVIGATION */}

        <button
          type="button"
          className="artist-back"
          onClick={() => navigate(-1)}
        >
          <FaArrowLeft />
          <span>Back</span>
        </button>

        {/* ARTIST PROFILE */}

        <section className="artist-profile-bar">
          <div className="artist-profile-avatar">
            {artistImage ? (
              <img
                src={artistImage}
                alt={artistEnglishName}
                onError={(event) => {
                  event.currentTarget.onerror = null;
                  event.currentTarget.src =
                    "/images/default-artist.png";
                }}
              />
            ) : (
              <FaMicrophone />
            )}
          </div>

          <div className="artist-profile-content">
            <span className="artist-profile-label">
              <FaMicrophone />
              ARTIST
            </span>

            <div className="artist-profile-names">
              <h1>{artistEnglishName}</h1>
              {artistTeluguName && (
                <p className="artist-profile-telugu-name">
                  {artistTeluguName}
                </p>
              )}
            </div>

            <p className="artist-profile-description">
              <span>Christian Worship Music</span>
            </p>
          </div>
        </section>

        {/* PLAY ALL */}

        <div className="artist-play-all-bar">
          <button
            type="button"
            className="artist-profile-play"
            onClick={handleArtistPlayPause}
            disabled={!songs.some((song) => song?.audio_url)}
            aria-label={
              artistIsPlaying
                ? "Pause artist songs"
                : "Play artist songs"
            }
          >
            {artistIsPlaying ? <FaPause /> : <FaPlay />}
            <span>
              {artistIsPlaying ? "Pause" : "Play all"}
            </span>
          </button>
        </div>

        {/* STATUS MESSAGE */}

        {notice && (
          <div className="artist-notice" role="status">
            <FaMusic />

            <span>{notice}</span>

            <button
              type="button"
              aria-label="Dismiss message"
              onClick={() => setNotice("")}
            >
              ×
            </button>
          </div>
        )}

        {/* SONG COLLECTION */}

        <section className="artist-songs-section">
          <div className="artist-songs-header">
            <div>
              <span className="artist-songs-overline">
                DISCOVER THE MUSIC
              </span>

              <h2>{query ? "Search Results" : "Songs"}</h2>
            </div>

            <span className="artist-track-count">
              {String(
                query ? filteredSongs.length : songs.length
              ).padStart(2, "0")}{" "}
              {query
                ? filteredSongs.length === 1
                  ? "match"
                  : "matches"
                : "tracks"}
            </span>
          </div>

          {/* VOICE SEARCH
              VoiceSearch owns its input, microphone,
              clear button and language selector.
          */}

          <section
            className="artist-details-search-section"
            aria-label="Search this artist's songs"
          >
            <VoiceSearch
              value={searchQuery}
              onChange={setSearchQuery}
              onSearch={handleVoiceSearch}
              language={voiceLanguage}
              onLanguageChange={setVoiceLanguage}
              placeholder="Search songs by title or language..."
              ariaLabel="Search this artist's songs"
            />
          </section>

          {query && (
            <p
              className="artist-details-search-summary"
              aria-live="polite"
            >
              {filteredSongs.length}{" "}
              {filteredSongs.length === 1
                ? "song"
                : "songs"}{" "}
              found
            </p>
          )}

          {/* FILTERED SONG LIST */}

          {filteredSongs.length > 0 ? (
            <div
              className="artist-song-list"
              id="artist-song-list"
            >
              {filteredSongs.map((song, index) => {
                const cover = song.cover_url
                  ? getMediaUrl(song.cover_url)
                  : "/images/default-cover.png";

                const isCurrent = isCurrentSong(song);
                const isSongPlaying = isCurrent && isPlaying;
                const menuOpen = activeMenu === song.id;

                const songTitle =
                  song.title ||
                  song.title_english ||
                  "Untitled song";

                return (
                  <article
                    key={song.id}
                    className={`artist-track-row ${
                      isCurrent ? "is-current" : ""
                    }`}
                  >
                    {/* TRACK NUMBER */}

                    <span className="artist-track-index">
                      {isSongPlaying ? (
                        <span
                          className="artist-track-equalizer"
                          aria-label="Currently playing"
                        >
                          <i />
                          <i />
                          <i />
                        </span>
                      ) : (
                        <span className="artist-track-number">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                      )}
                    </span>

                    {/* COVER ART */}

                    <div className="artist-track-artwork">
                      <img
                        src={cover}
                        alt={`${songTitle} cover`}
                        loading="lazy"
                        onError={(event) => {
                          event.currentTarget.onerror = null;
                          event.currentTarget.src =
                            "/images/default-cover.png";
                        }}
                      />
                    </div>

                    {/* SONG DETAILS */}

                    <button
                      type="button"
                      className="artist-track-details"
                      onClick={() => handleSongPlayPause(song)}
                      disabled={!song?.audio_url}
                      aria-label={
                        isSongPlaying
                          ? `Pause ${songTitle}`
                          : `Play ${songTitle}`
                      }
                      title={
                        isSongPlaying
                          ? `Pause ${songTitle}`
                          : `Play ${songTitle}`
                      }
                    >
                      <strong
                        className={
                          isCurrent ? "is-playing-title" : ""
                        }
                      >
                        {songTitle}
                      </strong>

                      {getSongEnglishTitle(song) &&
                        getSongEnglishTitle(song).toLowerCase() !==
                          songTitle.toLowerCase() && (
                          <span className="artist-track-english-title">
                            {getSongEnglishTitle(song)}
                          </span>
                        )}

                      <span>
                        {song.artist_name || artist.name}
                      </span>
                    </button>

                    {/* LANGUAGE */}

                    <span className="artist-track-language">
                      {song.language || "Telugu"}
                    </span>

                    {/* THREE-DOT MENU */}

                    <div
                      className="artist-track-actions"
                      ref={menuOpen ? menuRef : null}
                    >
                      <button
                        type="button"
                        className={`artist-track-more ${
                          menuOpen ? "is-open" : ""
                        }`}
                        aria-label={`More options for ${songTitle}`}
                        aria-haspopup="menu"
                        aria-expanded={menuOpen}
                        onClick={(event) => {
                          event.stopPropagation();

                          setActiveMenu(
                            menuOpen ? null : song.id
                          );
                        }}
                      >
                        <FaEllipsisV />
                      </button>

                      {menuOpen && (
                        <div
                          className="artist-track-menu"
                          role="menu"
                        >
                          <button
                            type="button"
                            role="menuitem"
                            onClick={() =>
                              handleSongPlayPause(song)
                            }
                            disabled={!song?.audio_url}
                          >
                            {isSongPlaying ? (
                              <FaPause />
                            ) : (
                              <FaPlay />
                            )}

                            <span>
                              {isSongPlaying ? "Pause" : "Play"}
                            </span>
                          </button>

                          <button
                            type="button"
                            role="menuitem"
                            onClick={() =>
                              handleAddToQueue(song)
                            }
                          >
                            <FaPlus />
                            <span>Add to queue</span>
                          </button>

                          <button
                            type="button"
                            role="menuitem"
                            onClick={() =>
                              handleAddToPlaylist(song)
                            }
                          >
                            <FaListUl />
                            <span>Add to playlist</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="artist-songs-empty">
              <span className="artist-empty-icon">
                <FaMusic />
              </span>

              <h3>
                {query
                  ? "No matching songs"
                  : "No songs available"}
              </h3>

              <p>
                {query
                  ? "Try another song title or language."
                  : `Songs by ${artistEnglishName} will appear here when they are available.`}
              </p>

              {query && (
                <button
                  type="button"
                  className="artist-details-reset-search"
                  onClick={() => setSearchQuery("")}
                >
                  <FaTimes />
                  Clear search
                </button>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

export default ArtistDetails;
