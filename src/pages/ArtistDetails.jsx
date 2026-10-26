
import { useEffect, useRef, useState } from "react";

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

  const {
    playSong,
    togglePlay,
    currentSong,
    isPlaying,
    addToQueue,
  } = usePlayer();

  const [artist, setArtist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeMenu, setActiveMenu] = useState(null);
  const [notice, setNotice] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [voiceLanguage, setVoiceLanguage] = useState("te-IN");

  const handleVoiceSearch = (recognizedText) => {
    setSearchQuery(recognizedText);
  };

  /* =========================================================
     LOAD ARTIST DETAILS
  ========================================================= */

  useEffect(() => {
    let cancelled = false;

    const loadArtist = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await API.get(`/artists/${id}`);

        if (cancelled) return;

        const data = response.data;
        setArtist(data.artist || data || null);
      } catch (err) {
        console.error("Failed to load artist:", err);

        if (!cancelled) {
          setError(
            err.response?.data?.message ||
              "Unable to load artist details. Please try again."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    if (id) {
      loadArtist();
    } else {
      setError("Artist ID is missing.");
      setLoading(false);
    }

    return () => {
      cancelled = true;
    };
  }, [id]);

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

  const query = searchQuery.trim().toLowerCase();

  const filteredSongs = songs.filter((song) => {
    if (!query) return true;

    const title = (song.title || "").toLowerCase();

    const englishTitle = (
      song.title_english || ""
    ).toLowerCase();

    const language = (
      song.language || "Telugu"
    ).toLowerCase();

    const artistName = (
      song.artist_name || artist?.name || ""
    ).toLowerCase();

    return (
      title.includes(query) ||
      englishTitle.includes(query) ||
      language.includes(query) ||
      artistName.includes(query)
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
        await playSong(song, songs);
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
        await playSong(playableSongs[0], playableSongs);
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
    <main className="artist-details-page">
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
                alt={artist.name || "Artist"}
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

            <h1>{artist.name || "Unknown Artist"}</h1>

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
                  : `Songs by ${artist.name} will appear here when they are available.`}
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
