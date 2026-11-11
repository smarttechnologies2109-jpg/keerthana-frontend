
import { useEffect, useState } from "react";

import {
  FaArrowLeft,
  FaCompactDisc,
  FaEllipsisV,
  FaPause,
  FaPlay,
  FaPlus,
  FaTimes,
} from "react-icons/fa";

import { useNavigate, useParams } from "react-router-dom";

import API from "../services/api";
import { usePlayer } from "../context/usePlayer";

import {
  getAlbumCover,
  
} from "../utils/media";

import VoiceSearch from "../components/VoiceSearch";

import "../assets/css/albumDetails.css";

function getAlbumEnglishTitle(album) {
  return album?.title_english || album?.title || album?.title_telugu || "Untitled Album";
}
function getAlbumTeluguTitle(album) {
  const telugu = album?.title_telugu || "";
  return telugu && telugu.trim() !== getAlbumEnglishTitle(album).trim() ? telugu : "";
}
function getArtistEnglishName(album) {
  return album?.artist_name_english || album?.artist_name || album?.artist_name_telugu || "KEERTHANA";
}
function getArtistTeluguName(album) {
  const telugu = album?.artist_name_telugu || "";
  return telugu && telugu.trim() !== getArtistEnglishName(album).trim() ? telugu : "";
}
function getSongEnglishTitle(song) {
  return song?.title_english || song?.title || song?.title_telugu || "Untitled song";
}
function getSongTeluguTitle(song) {
  const telugu = song?.title_telugu || song?.title || "";
  return telugu && telugu.trim() !== getSongEnglishTitle(song).trim() ? telugu : "";
}
function compareSongsAlphabetically(a, b) {
  return getSongEnglishTitle(a).localeCompare(getSongEnglishTitle(b), "en", {
    sensitivity: "base",
    numeric: true,
  });
}

function AlbumDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const {
    playSong,
    togglePlay,
    currentSong,
    isPlaying,
    addToQueue,
  } = usePlayer();

  const [album, setAlbum] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openMenuId, setOpenMenuId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [voiceLanguage, setVoiceLanguage] = useState("te-IN");

  /* =====================================================
     VOICE SEARCH
  ===================================================== */

  const handleVoiceSearch = (recognizedText) => {
    setSearchQuery(recognizedText);
  };

  /* =====================================================
     LOAD ALBUM
  ===================================================== */

  useEffect(() => {
    let cancelled = false;

    const loadAlbum = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await API.get(`/albums/${id}`);

        if (!cancelled) {
          setAlbum(response.data.album);
        }
      } catch (err) {
        console.error("Album error:", err);

        if (!cancelled) {
          setError(
            err.response?.data?.message ||
              "Unable to load album"
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    if (!id) {
      setError("Album ID is missing.");
      setLoading(false);
      return;
    }

    loadAlbum();

    return () => {
      cancelled = true;
    };
  }, [id]);

  /* =====================================================
     LOADING STATE
  ===================================================== */

  if (loading) {
    return (
      <div className="album-details-page album-details-loading">
        <div className="album-details-loader" />
        <p>Loading album...</p>
      </div>
    );
  }

  /* =====================================================
     ERROR STATE
  ===================================================== */

  if (error || !album) {
    return (
      <div className="album-details-page album-details-error">
        <button
          type="button"
          className="album-details-back"
          onClick={() => navigate("/albums")}
        >
          <FaArrowLeft />
          Back to Albums
        </button>

        <p>{error || "Album not found"}</p>
      </div>
    );
  }

  /* =====================================================
     ALBUM DATA & SEARCH
  ===================================================== */

  const songs = Array.isArray(album.songs)
    ? [...album.songs].sort(compareSongsAlphabetically)
    : [];

  const albumEnglishTitle = getAlbumEnglishTitle(album);
  const albumTeluguTitle = getAlbumTeluguTitle(album);
  const artistEnglishName = getArtistEnglishName(album);
  const artistTeluguName = getArtistTeluguName(album);

  const cover = getAlbumCover(album);

  const query = searchQuery.trim().toLowerCase();

  const filteredSongs = songs
    .filter((song) => {
      if (!query) return true;

      const searchableFields = [
        song?.title,
        song?.title_english,
        song?.title_telugu,
        song?.artist_name,
        song?.artist_name_english,
        song?.artist_name_telugu,
        album?.artist_name,
        album?.artist_name_english,
        album?.artist_name_telugu,
        song?.language,
        song?.category_name,
        song?.category_name_english,
        song?.category_name_telugu,
      ];

      return searchableFields.some((field) =>
        String(field || "").toLowerCase().includes(query)
      );
    })
    .sort(compareSongsAlphabetically);

  const isAlbumSong = (song) =>
    songs.some(
      (albumSong) =>
        String(albumSong.id) === String(song?.id)
    );

  /* =====================================================
     FORMAT DURATION
  ===================================================== */

  const formatDuration = (value) => {
    if (value == null || value === "") return "";

    if (typeof value === "string" && value.includes(":")) {
      return value;
    }

    const seconds = Number(value);

    if (!Number.isFinite(seconds) || seconds < 0) {
      return "";
    }

    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);

    return `${mins}:${String(secs).padStart(2, "0")}`;
  };

  /* =====================================================
     PLAY ALL — COMPLETE ALBUM
  ===================================================== */

  const handleAlbumPlayPause = async () => {
    if (!songs.length) return;

    try {
      if (currentSong && isAlbumSong(currentSong)) {
        await togglePlay();
        return;
      }

      await playSong(songs[0], songs);
    } catch (err) {
      console.error("Album playback error:", err);
    }
  };

  /* =====================================================
     PLAY / PAUSE TRACK
  ===================================================== */

  const handleSongPlayPause = async (song) => {
    setOpenMenuId(null);

    try {
      if (String(currentSong?.id) === String(song.id)) {
        await togglePlay();
        return;
      }

      await playSong(song, songs);
    } catch (err) {
      console.error("Song playback error:", err);
    }
  };

  /* =====================================================
     ADD TO QUEUE
  ===================================================== */

  const handleAddToQueue = async (song) => {
    setOpenMenuId(null);

    if (typeof addToQueue !== "function") {
      console.warn(
        "addToQueue is not available in usePlayer()."
      );
      return;
    }

    try {
      await addToQueue(song);
    } catch (err) {
      console.error("Add to queue error:", err);
    }
  };

  /* =====================================================
     ADD TO PLAYLIST
  ===================================================== */

  const handleAddToPlaylist = (song) => {
    setOpenMenuId(null);

    navigate("/playlists", {
      state: {
        selectedSong: song,
        action: "add-song",
      },
    });
  };

  const albumIsPlaying = Boolean(
    currentSong &&
      isPlaying &&
      isAlbumSong(currentSong)
  );

  /* =====================================================
     PAGE
  ===================================================== */

  return (
    <div className="album-details-page">
      {/* BACK NAVIGATION */}

      <button
        type="button"
        className="album-details-back"
        onClick={() => navigate(-1)}
      >
        <FaArrowLeft />
        Back
      </button>

      {/* ALBUM HEADER */}

      <section className="album-details-hero">
        <div className="album-details-cover">
          {cover ? (
            <img
              src={cover}
              alt={`${albumEnglishTitle} album cover`}
              onError={(event) => {
                event.currentTarget.style.display = "none";
              }}
            />
          ) : (
            <FaCompactDisc />
          )}
        </div>

        <div className="album-details-info">
          <span className="album-details-label">
            ALBUM
          </span>

          <div className="album-details-title-names">
            <h1>{albumEnglishTitle}</h1>
            {albumTeluguTitle && (
              <p className="album-details-telugu-title">{albumTeluguTitle}</p>
            )}
          </div>

          <button
            type="button"
            className="album-details-artist"
            onClick={() => {
              if (album.artist_id) {
                navigate(`/artists/${album.artist_id}`);
              }
            }}
          >
            <span className="album-details-artist-names">
              <span>{artistEnglishName}</span>
              {artistTeluguName && (
                <span className="album-details-telugu-artist">{artistTeluguName}</span>
              )}
            </span>
          </button>
        </div>
      </section>

      {/* PLAY ALL — ALWAYS USES FULL ALBUM */}

      <div className="album-details-actions">
        <button
          type="button"
          className="album-details-play-all"
          onClick={handleAlbumPlayPause}
          disabled={!songs.length}
        >
          {albumIsPlaying ? <FaPause /> : <FaPlay />}

          <span>
            {albumIsPlaying ? "Pause Album" : "Play All"}
          </span>
        </button>
      </div>

      {/* SONG LIST */}

      <section className="album-details-song-section">
        <div className="album-details-list-heading">
          <div>
            <span className="album-details-list-eyebrow">
              YOUR WORSHIP COLLECTION
            </span>

            <h2>
              {query ? "Search Results" : "Tracks"}
            </h2>
          </div>

          <span className="album-details-track-count">
            {query
              ? filteredSongs.length
              : songs.length}{" "}
            {query
              ? filteredSongs.length === 1
                ? "MATCH"
                : "MATCHES"
              : songs.length === 1
                ? "TRACK"
                : "TRACKS"}
          </span>
        </div>

        {/* VOICE SEARCH */}

        <section
          className="album-details-voice-search-section"
          aria-label="Search tracks in this album"
        >
          <VoiceSearch
            value={searchQuery}
            onChange={setSearchQuery}
            onSearch={handleVoiceSearch}
            language={voiceLanguage}
            onLanguageChange={setVoiceLanguage}
            placeholder="Search songs, artists, language..."
            ariaLabel="Search tracks in this album"
          />
        </section>

        {/* SEARCH SUMMARY */}

        {query && (
          <p
            className="album-details-search-summary"
            aria-live="polite"
          >
            {filteredSongs.length}{" "}
            {filteredSongs.length === 1
              ? "song"
              : "songs"}{" "}
            found
          </p>
        )}

        {/* FILTERED TRACK LIST */}

        {filteredSongs.length > 0 && (
          <div
            className="album-details-song-list"
            id="album-details-song-list"
          >
            {filteredSongs.map((song, index) => {
              const isCurrent =
                String(currentSong?.id) === String(song.id);

              const isCurrentlyPlaying =
                isCurrent && isPlaying;

              const duration = formatDuration(song.duration);

              return (
                <article
                  className={`album-details-song-row ${
                    isCurrent ? "is-current" : ""
                  }`}
                  key={song.id}
                >
                  {/* PLAY / PAUSE */}

                  <button
                    type="button"
                    className="album-details-track-number"
                    onClick={() => handleSongPlayPause(song)}
                    aria-label={
                      isCurrentlyPlaying
                        ? `Pause ${song.title || "song"}`
                        : `Play ${song.title || "song"}`
                    }
                    title={
                      isCurrentlyPlaying
                        ? "Pause song"
                        : "Play song"
                    }
                  >
                    {isCurrentlyPlaying ? (
                      <FaPause />
                    ) : (
                      <FaPlay />
                    )}
                  </button>

                  {/* TRACK COVER */}

                  <button
                    type="button"
                    className="album-details-track-art"
                    onClick={() => handleSongPlayPause(song)}
                    aria-label={`Play ${
                      song.title || "song"
                    }`}
                  >
                    {song.cover_url || cover ? (
                      <img
                        src={song.cover_url || cover}
                        alt=""
                        onError={(event) => {
                          event.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <FaCompactDisc aria-hidden="true" />
                    )}
                  </button>

                  {/* TRACK DETAILS */}

                  <button
                    type="button"
                    className="album-details-track-main"
                    onClick={() => handleSongPlayPause(song)}
                  >
                    <strong title={getSongEnglishTitle(song)}>
                      {getSongEnglishTitle(song)}
                    </strong>

                    {getSongTeluguTitle(song) && (
                      <span className="album-details-track-telugu-title">
                        {getSongTeluguTitle(song)}
                      </span>
                    )}

                    <span>
                      {song.artist_name_english ||
                        song.artist_name ||
                        artistEnglishName}
                    </span>

                    {(song.artist_name_telugu || artistTeluguName) && (
                      <span className="album-details-track-telugu-artist">
                        {song.artist_name_telugu || artistTeluguName}
                      </span>
                    )}
                  </button>

                  {/* LANGUAGE */}

                  <span className="album-details-track-language">
                    {song.language || "Telugu"}
                  </span>

                  {/* CATEGORY */}

                  <span className="album-details-track-category">
                    {song.category_name || "Christian Music"}
                  </span>

                  {/* DURATION */}

                  <span className="album-details-track-duration">
                    {duration}
                  </span>

                  {/* THREE-DOT MENU */}

                  <div className="album-details-track-menu-wrap">
                    <button
                      type="button"
                      className="album-details-more-button"
                      aria-label={`More options for ${
                        song.title || "song"
                      }`}
                      aria-haspopup="true"
                      aria-expanded={openMenuId === song.id}
                      onClick={() =>
                        setOpenMenuId((previous) =>
                          previous === song.id
                            ? null
                            : song.id
                        )
                      }
                    >
                      <FaEllipsisV />
                    </button>

                    {openMenuId === song.id && (
                      <>
                        <button
                          type="button"
                          className="album-details-menu-backdrop"
                          aria-label="Close song menu"
                          onClick={() => setOpenMenuId(null)}
                        />

                        <div className="album-details-song-menu">
                          <button
                            type="button"
                            onClick={() =>
                              handleSongPlayPause(song)
                            }
                          >
                            {isCurrentlyPlaying ? (
                              <FaPause />
                            ) : (
                              <FaPlay />
                            )}

                            <span>
                              {isCurrentlyPlaying
                                ? "Pause"
                                : "Play"}
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleAddToQueue(song)
                            }
                          >
                            <FaPlus />
                            <span>Add to queue</span>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleAddToPlaylist(song)
                            }
                          >
                            <FaCompactDisc />
                            <span>Add to playlist</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* EMPTY / NO MATCHES */}

        {!filteredSongs.length && (
          <div className="album-details-empty">
            <FaCompactDisc />

            <h2>
              {query
                ? "No Matching Songs"
                : "No Songs Yet"}
            </h2>

            <p>
              {query
                ? "Try another song title, artist, language, or category."
                : "Songs added to this album will appear here."}
            </p>

            {query && (
              <button
                type="button"
                className="album-details-reset-search"
                onClick={() => setSearchQuery("")}
              >
                <FaTimes />
                Clear Search
              </button>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

export default AlbumDetails;
