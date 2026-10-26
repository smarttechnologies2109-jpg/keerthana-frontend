
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useNavigate, useParams } from "react-router-dom";

import {
  FaArrowLeft,
  FaMusic,
  FaPlay,
  FaPause,
  FaPlus,
  FaTrash,
  FaTimes,
  FaSearch,
  FaBroom,
} from "react-icons/fa";

import API from "../services/api";
import { usePlayer } from "../context/usePlayer";
import { getMediaUrl } from "../utils/media";
import VoiceSearch from "../components/VoiceSearch";

import "../assets/css/playlistDetails.css";

const DEFAULT_COVER = "/images/default-cover.png";

const VOICE_LANGUAGES = [
  { value: "te-IN", label: "Telugu" },
  { value: "hi-IN", label: "Hindi" },
  { value: "en-IN", label: "English" },
  { value: "ml-IN", label: "Malayalam" },
  { value: "kn-IN", label: "Kannada" },
  { value: "ta-IN", label: "Tamil" },
];

/* =========================================================
   RESPONSE HELPERS
========================================================= */

const getPlaylistFromResponse = (response) => {
  const data = response?.data;

  return (
    data?.playlist ||
    data?.data?.playlist ||
    data?.data ||
    data ||
    null
  );
};

const getSongsFromResponse = (response) => {
  const data = response?.data;

  if (Array.isArray(data?.songs)) return data.songs;
  if (Array.isArray(data?.data?.songs)) return data.data.songs;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;

  return [];
};

const getSongTitle = (song) =>
  song?.title_english ||
  song?.titleEnglish ||
  song?.title ||
  "Unknown Song";

const getSongArtist = (song) =>
  song?.artist_name ||
  song?.artist?.name ||
  "KEERTHANA";

const getSongCategory = (song) =>
  song?.category_name ||
  song?.category?.name ||
  "Christian Music";

const getSongSearchFields = (song) => [
  song?.title,
  song?.title_english,
  song?.titleEnglish,
  song?.artist_name,
  song?.artist?.name,
  song?.album_name,
  song?.album?.name,
  song?.category_name,
  song?.category?.name,
  song?.language,
];

/* =========================================================
   COMPONENT
========================================================= */

function PlaylistDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const {
    currentSong,
    isPlaying,
    playSong,
    togglePlay,
  } = usePlayer();

  const [playlist, setPlaylist] = useState(null);
  const [allSongs, setAllSongs] = useState([]);

  const [loading, setLoading] = useState(true);
  const [songsLoading, setSongsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [error, setError] = useState("");
  const [songsError, setSongsError] = useState("");

  const [showAddSongs, setShowAddSongs] = useState(false);

  const [playlistSearch, setPlaylistSearch] = useState("");
  const [songSearch, setSongSearch] = useState("");
  const [voiceLanguage, setVoiceLanguage] = useState("te-IN");

  /* =======================================================
     LOAD PLAYLIST
  ======================================================= */

  const fetchPlaylist = useCallback(async () => {
    if (!id) {
      setPlaylist(null);
      setError("Playlist ID is missing.");
      setLoading(false);
      return null;
    }

    try {
      setLoading(true);
      setError("");

      const response = await API.get(`/playlists/${id}`);
      const loadedPlaylist = getPlaylistFromResponse(response);

      if (!loadedPlaylist || loadedPlaylist.id == null) {
        setPlaylist(null);
        setError("Playlist not found.");
        return null;
      }

      const normalizedPlaylist = {
        ...loadedPlaylist,
        songs: Array.isArray(loadedPlaylist.songs)
          ? loadedPlaylist.songs
          : [],
      };

      setPlaylist(normalizedPlaylist);

      return normalizedPlaylist;
    } catch (err) {
      console.error("Load playlist error:", err);

      setPlaylist(null);
      setError(
        err.response?.data?.message ||
          "Unable to load playlist."
      );

      return null;
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchPlaylist();
  }, [fetchPlaylist]);

  /* =======================================================
     LOAD AVAILABLE SONGS
  ======================================================= */

  const fetchAllSongs = useCallback(async () => {
    try {
      setSongsLoading(true);
      setSongsError("");

      const response = await API.get("/songs");

      setAllSongs(getSongsFromResponse(response));
    } catch (err) {
      console.error("Load songs error:", err);

      setSongsError(
        err.response?.data?.message ||
          "Unable to load songs."
      );
    } finally {
      setSongsLoading(false);
    }
  }, []);

  /* =======================================================
     OPEN / CLOSE ADD SONGS MODAL
  ======================================================= */

  const openAddSongs = async () => {
    setSongSearch("");
    setSongsError("");
    setShowAddSongs(true);

    await fetchAllSongs();
  };

  const closeAddSongs = () => {
    if (actionLoading) return;

    setShowAddSongs(false);
    setSongSearch("");
    setSongsError("");
  };

  /* =======================================================
     SEARCH AVAILABLE SONGS
  ======================================================= */

  const filteredSongs = useMemo(() => {
    const query = songSearch.trim().toLowerCase();

    if (!query) return allSongs;

    return allSongs.filter((song) =>
      getSongSearchFields(song).some((value) =>
        String(value || "").toLowerCase().includes(query)
      )
    );
  }, [allSongs, songSearch]);

  /* =======================================================
     SEARCH CURRENT PLAYLIST SONGS
  ======================================================= */

  const playlistSongs = playlist?.songs || [];

  const filteredPlaylistSongs = useMemo(() => {
    const query = playlistSearch.trim().toLowerCase();

    if (!query) return playlistSongs;

    return playlistSongs.filter((song) =>
      getSongSearchFields(song).some((value) =>
        String(value || "").toLowerCase().includes(query)
      )
    );
  }, [playlistSongs, playlistSearch]);

  /* =======================================================
     CHECK IF SONG ALREADY EXISTS
  ======================================================= */

  const songExistsInPlaylist = useCallback(
    (songId) =>
      (playlist?.songs || []).some(
        (song) => String(song.id) === String(songId)
      ),
    [playlist?.songs]
  );

  /* =======================================================
     ADD SONG TO PLAYLIST
  ======================================================= */

  const addSong = async (songId) => {
    if (actionLoading) return;

    try {
      setActionLoading(true);
      setSongsError("");

      const songToAdd = allSongs.find(
        (song) => String(song.id) === String(songId)
      );

      if (!songToAdd) {
        setSongsError("Unable to find this song.");
        return;
      }

      if (!songToAdd.audio_url) {
        setSongsError(
          "Audio is not available for this song."
        );
        return;
      }

      if (songExistsInPlaylist(songId)) {
        setSongsError(
          "This song is already in the playlist."
        );
        return;
      }

      await API.post(`/playlists/${id}/songs/${songId}`);

      const response = await API.get(`/playlists/${id}`);
      const updatedPlaylist = getPlaylistFromResponse(response);

      if (!updatedPlaylist) {
        setSongsError(
          "Song added, but unable to refresh the playlist."
        );
        return;
      }

      const updatedSongs = Array.isArray(updatedPlaylist.songs)
        ? updatedPlaylist.songs
        : [];

      setPlaylist({
        ...updatedPlaylist,
        songs: updatedSongs,
      });

      const addedSong = updatedSongs.find(
        (song) => String(song.id) === String(songId)
      );

      setShowAddSongs(false);
      setSongSearch("");

      if (addedSong) {
        try {
          await playSong(addedSong, updatedSongs);
        } catch (playError) {
          console.error(
            "Song added, but playback failed:",
            playError
          );

          setError(
            "Song added, but playback could not start."
          );
        }
      }
    } catch (err) {
      console.error("Add song error:", err);

      setSongsError(
        err.response?.data?.message ||
          "Unable to add this song."
      );
    } finally {
      setActionLoading(false);
    }
  };

  /* =======================================================
     REMOVE SONG FROM PLAYLIST
  ======================================================= */

  const removeSong = async (songId) => {
    if (actionLoading) return;

    try {
      setActionLoading(true);
      setError("");

      await API.delete(
        `/playlists/${id}/songs/${songId}`
      );

      await fetchPlaylist();
    } catch (err) {
      console.error("Remove song error:", err);

      setError(
        err.response?.data?.message ||
          "Unable to remove song."
      );
    } finally {
      setActionLoading(false);
    }
  };

  /* =======================================================
     CLEAR ALL PLAYLIST SONGS
  ======================================================= */

  const clearSongs = async () => {
    if (!playlistSongs.length || actionLoading) return;

    const confirmed = window.confirm(
      `Remove all ${playlistSongs.length} songs from "${playlist.name}"? The playlist itself will remain.`
    );

    if (!confirmed) return;

    try {
      setActionLoading(true);
      setError("");

      for (const song of playlistSongs) {
        await API.delete(
          `/playlists/${id}/songs/${song.id}`
        );
      }

      await fetchPlaylist();
      setPlaylistSearch("");
    } catch (err) {
      console.error("Clear playlist songs error:", err);

      setError(
        err.response?.data?.message ||
          "Some songs could not be removed. Refresh the playlist and try again."
      );

      await fetchPlaylist();
    } finally {
      setActionLoading(false);
    }
  };

  /* =======================================================
     DELETE PLAYLIST
  ======================================================= */

  const deletePlaylist = async () => {
    if (!playlist || actionLoading) return;

    const confirmed = window.confirm(
      `Delete "${playlist.name}"? This will delete the playlist.`
    );

    if (!confirmed) return;

    try {
      setActionLoading(true);
      setError("");

      await API.delete(`/playlists/${id}`);

      navigate("/playlists", { replace: true });
    } catch (err) {
      console.error("Delete playlist error:", err);

      setError(
        err.response?.data?.message ||
          "Unable to delete playlist."
      );
    } finally {
      setActionLoading(false);
    }
  };

  /* =======================================================
     PLAYBACK HELPERS
  ======================================================= */

  const isCurrentSong = (song) =>
    currentSong?.id != null &&
    String(currentSong.id) === String(song?.id);

  const isSongPlaying = (song) =>
    isCurrentSong(song) && isPlaying;

  const handleSongPlayPause = async (song) => {
    if (!song?.audio_url) {
      setError("Audio is not available for this song.");
      return;
    }

    try {
      setError("");

      if (isCurrentSong(song)) {
        await togglePlay();
      } else {
        await playSong(song, playlistSongs);
      }
    } catch (err) {
      console.error("Song playback error:", err);
      setError("Unable to play this song.");
    }
  };

  const handlePlaylistPlayPause = async () => {
    if (!playlistSongs.length) return;

    const currentBelongsToPlaylist = playlistSongs.some(
      (song) =>
        String(song.id) === String(currentSong?.id)
    );

    try {
      setError("");

      if (currentBelongsToPlaylist) {
        await togglePlay();
        return;
      }

      const firstPlayableSong = playlistSongs.find(
        (song) => song.audio_url
      );

      if (!firstPlayableSong) {
        setError("No playable songs in this playlist.");
        return;
      }

      await playSong(firstPlayableSong, playlistSongs);
    } catch (err) {
      console.error("Playlist playback error:", err);
      setError("Unable to play this playlist.");
    }
  };

  const playlistPlaying =
    Boolean(playlistSongs.length) &&
    Boolean(isPlaying) &&
    playlistSongs.some(
      (song) =>
        String(song.id) === String(currentSong?.id)
    );

  /* =======================================================
     LOADING STATE
  ======================================================= */

  if (loading) {
    return (
      <main className="playlist-details-page">
        <div
          className="playlist-loading"
          role="status"
          aria-live="polite"
        >
          <span className="playlist-loading-spinner" />
          <FaMusic aria-hidden="true" />
          <span>Loading playlist...</span>
        </div>
      </main>
    );
  }

  /* =======================================================
     PLAYLIST NOT FOUND
  ======================================================= */

  if (!playlist) {
    return (
      <main className="playlist-details-page">
        <button
          type="button"
          className="playlist-back-button"
          onClick={() => navigate("/playlists")}
        >
          <FaArrowLeft aria-hidden="true" />
          Back to Playlists
        </button>

        <div className="playlist-error" role="alert">
          <span>{error || "Playlist not found."}</span>

          <button
            type="button"
            onClick={fetchPlaylist}
          >
            Try again
          </button>
        </div>
      </main>
    );
  }

  /* =======================================================
     MAIN PAGE
  ======================================================= */

  return (
    <main className="playlist-details-page">
      <button
        type="button"
        className="playlist-back-button"
        onClick={() => navigate("/playlists")}
      >
        <FaArrowLeft aria-hidden="true" />
        Back to Playlists
      </button>

      {/* PLAYLIST HERO */}

      <section className="playlist-hero">
        <div className="playlist-large-cover">
          <img
            src={
              playlist.cover_url
                ? getMediaUrl(playlist.cover_url)
                : DEFAULT_COVER
            }
            alt={`${playlist.name} cover`}
            onError={(event) => {
              event.currentTarget.onerror = null;
              event.currentTarget.src = DEFAULT_COVER;
            }}
          />
        </div>

        <div className="playlist-hero-info">
          <span className="playlist-label">
            YOUR COLLECTION
          </span>

          <h1>{playlist.name}</h1>

          <p>
            {playlist.description ||
              "Your personal music collection"}
          </p>
        </div>
      </section>

      {/* PLAYLIST ACTIONS */}

      <section
        className="playlist-actions"
        aria-label="Playlist actions"
      >
        <button
          type="button"
          className={`playlist-main-play ${
            playlistPlaying ? "is-playing" : ""
          }`}
          onClick={handlePlaylistPlayPause}
          disabled={actionLoading || !playlistSongs.length}
          aria-label={
            playlistPlaying ? "Pause playlist" : "Play playlist"
          }
        >
          {playlistPlaying ? <FaPause /> : <FaPlay />}
          <span>{playlistPlaying ? "Pause" : "Play All"}</span>
        </button>

        <button
          type="button"
          className="playlist-add-button"
          onClick={openAddSongs}
          disabled={actionLoading}
        >
          <FaPlus aria-hidden="true" />
          Add Songs
        </button>

        <button
          type="button"
          className="playlist-clear-button"
          onClick={clearSongs}
          disabled={actionLoading || !playlistSongs.length}
        >
          <FaBroom aria-hidden="true" />
          Clear Songs
        </button>

        <button
          type="button"
          className="playlist-delete-button"
          onClick={deletePlaylist}
          disabled={actionLoading}
        >
          <FaTrash aria-hidden="true" />
          Delete Playlist
        </button>
      </section>

      {/* GENERAL ERROR */}

      {error && (
        <div className="playlist-error" role="alert">
          <span>{error}</span>

          <button
            type="button"
            onClick={() => setError("")}
            aria-label="Dismiss error"
          >
            <FaTimes aria-hidden="true" />
          </button>
        </div>
      )}

      {/* PLAYLIST SONGS */}

      <section className="playlist-song-section">
        <div className="playlist-section-heading">
          <div>
            <span className="playlist-section-eyebrow">
              NOW AND ALWAYS
            </span>

            <h2>Playlist songs</h2>
          </div>

          <span className="playlist-count">
            {playlistSongs.length}{" "}
            {playlistSongs.length === 1 ? "song" : "songs"}
          </span>
        </div>

        {/* VOICE SEARCH AND LANGUAGE */}

        <div className="playlist-voice-search">
          <div className="playlist-voice-search-control">
            <VoiceSearch
              value={playlistSearch}
              onChange={setPlaylistSearch}
              onSearch={setPlaylistSearch}
              language={voiceLanguage}
              placeholder="Search songs in this playlist..."
              ariaLabel="Search songs in this playlist"
            />
          </div>
{/* 
          <div className="playlist-voice-language">
            <label htmlFor="playlist-voice-language-select">
              Voice search language
            </label>

            <select
              id="playlist-voice-language-select"
              value={voiceLanguage}
              onChange={(event) =>
                setVoiceLanguage(event.target.value)
              }
              aria-label="Choose voice search language"
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
          </div> */}
        </div>

        {/* SEARCH RESULTS COUNT */}

        <div
          className="playlist-page-search-summary"
          aria-live="polite"
        >
          {playlistSearch.trim()
            ? `${filteredPlaylistSongs.length} matching ${
                filteredPlaylistSongs.length === 1
                  ? "song"
                  : "songs"
              }`
            : `${playlistSongs.length} ${
                playlistSongs.length === 1 ? "song" : "songs"
              } in this playlist`}
        </div>

        {/* EMPTY PLAYLIST */}

        {!playlistSongs.length ? (
          <div className="playlist-empty-state">
            <div className="playlist-empty-icon">
              <FaMusic aria-hidden="true" />
            </div>

            <h2>Your playlist is waiting</h2>

            <p>
              Add your favorite Christian songs and create a
              collection for every moment of worship.
            </p>

            <button
              type="button"
              onClick={openAddSongs}
            >
              <FaPlus aria-hidden="true" />
              Add Your First Songs
            </button>
          </div>
        ) : filteredPlaylistSongs.length === 0 ? (
          /* NO SEARCH RESULTS */

          <div className="playlist-empty-state playlist-search-empty">
            <div className="playlist-empty-icon">
              <FaSearch aria-hidden="true" />
            </div>

            <h2>No songs found</h2>

            <p>
              Try another song title, artist, album, or language.
            </p>

            <button
              type="button"
              onClick={() => setPlaylistSearch("")}
            >
              <FaTimes aria-hidden="true" />
              Clear Search
            </button>
          </div>
        ) : (
          /* SONG TABLE */

          <div className="playlist-song-list">
            <div className="playlist-table-header">
              <span>#</span>
              <span>SONG</span>
              <span>CATEGORY</span>
              <span className="playlist-table-action-heading">
                ACTION
              </span>
            </div>

            {filteredPlaylistSongs.map((song, index) => {
              const current = isCurrentSong(song);
              const playing = isSongPlaying(song);
              const title = getSongTitle(song);

              return (
                <div
                  className={`playlist-song-row ${
                    current ? "is-current" : ""
                  } ${playing ? "is-playing" : ""}`}
                  key={song.id}
                >
                  {/* SONG NUMBER AND PLAY BUTTON */}

                  <div className="playlist-song-number">
                    <span className="song-number">
                      {current ? (
                        <span
                          className="playlist-current-indicator"
                          aria-label="Currently selected song"
                        >
                          ♫
                        </span>
                      ) : (
                        index + 1
                      )}
                    </span>

                    <button
                      type="button"
                      className={`playlist-song-play ${
                        playing ? "is-playing" : ""
                      }`}
                      onClick={() => handleSongPlayPause(song)}
                      disabled={!song.audio_url || actionLoading}
                      aria-label={`${
                        playing ? "Pause" : "Play"
                      } ${title}`}
                      title={playing ? "Pause" : "Play"}
                    >
                      {playing ? <FaPause /> : <FaPlay />}
                    </button>
                  </div>

                  {/* SONG DETAILS */}

                  <div className="playlist-song-title">
                    <img
                      src={
                        song.cover_url
                          ? getMediaUrl(song.cover_url)
                          : DEFAULT_COVER
                      }
                      alt={`${title} cover`}
                      loading="lazy"
                      onError={(event) => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src = DEFAULT_COVER;
                      }}
                    />

                    <div>
                      <strong>{title}</strong>

                      {song.title_english &&
                        song.title_english !== song.title && (
                          <small>{song.title_english}</small>
                        )}

                      <span>{getSongArtist(song)}</span>
                    </div>
                  </div>

                  {/* CATEGORY */}

                  <div className="playlist-song-category">
                    {getSongCategory(song)}
                  </div>

                  {/* REMOVE SONG */}

                  <button
                    type="button"
                    className="playlist-remove-song"
                    onClick={() => removeSong(song.id)}
                    disabled={actionLoading}
                    title="Remove song"
                    aria-label={`Remove ${title} from playlist`}
                  >
                    <FaTimes aria-hidden="true" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* =====================================================
          ADD SONGS MODAL
      ===================================================== */}

      {showAddSongs && (
        <div
          className="add-song-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeAddSongs();
            }
          }}
        >
          <section
            className="add-song-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-songs-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            {/* MODAL HEADER */}

            <div className="add-song-header">
              <div>
                <span>KEERTHANA MUSIC</span>
                <h2 id="add-songs-title">Add Songs</h2>
                <p>
                  Find the songs you want to worship with.
                </p>
              </div>

              <button
                type="button"
                onClick={closeAddSongs}
                disabled={actionLoading}
                aria-label="Close Add Songs"
              >
                <FaTimes aria-hidden="true" />
              </button>
            </div>

            {/* AVAILABLE SONGS SEARCH */}

            <div className="playlist-add-search">
              <FaSearch aria-hidden="true" />

              <input
                type="search"
                value={songSearch}
                onChange={(event) =>
                  setSongSearch(event.target.value)
                }
                placeholder="Search songs, artists, albums..."
                aria-label="Search available songs"
              />

              {songSearch && (
                <button
                  type="button"
                  onClick={() => setSongSearch("")}
                  aria-label="Clear search"
                >
                  <FaTimes aria-hidden="true" />
                </button>
              )}
            </div>

            <div
              className="playlist-add-search-summary"
              aria-live="polite"
            >
              {songSearch.trim()
                ? `${filteredSongs.length} matching ${
                    filteredSongs.length === 1
                      ? "song"
                      : "songs"
                  }`
                : `${allSongs.length} available ${
                    allSongs.length === 1 ? "song" : "songs"
                  }`}
            </div>

            {/* MODAL ERROR */}

            {songsError && (
              <div className="playlist-error" role="alert">
                <span>{songsError}</span>

                <button
                  type="button"
                  onClick={() => setSongsError("")}
                  aria-label="Dismiss message"
                >
                  <FaTimes aria-hidden="true" />
                </button>
              </div>
            )}

            {/* AVAILABLE SONGS LIST */}

            <div className="add-song-list">
              {songsLoading ? (
                <div className="add-song-empty" role="status">
                  <span className="playlist-loading-spinner" />
                  <p>Loading songs...</p>
                </div>
              ) : songsError && !allSongs.length ? (
                <div className="add-song-empty">
                  <FaMusic aria-hidden="true" />
                  <p>Unable to load songs.</p>

                  <button
                    type="button"
                    onClick={fetchAllSongs}
                  >
                    Try again
                  </button>
                </div>
              ) : filteredSongs.length === 0 ? (
                <div className="add-song-empty">
                  <FaMusic aria-hidden="true" />

                  <p>
                    {allSongs.length
                      ? "No songs match your search."
                      : "No songs are available."}
                  </p>

                  {songSearch && allSongs.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSongSearch("")}
                    >
                      Clear Search
                    </button>
                  )}
                </div>
              ) : (
                filteredSongs.map((song) => {
                  const alreadyAdded = songExistsInPlaylist(song.id);
                  const title = getSongTitle(song);

                  return (
                    <div
                      className="add-song-row"
                      key={song.id}
                    >
                      <img
                        src={
                          song.cover_url
                            ? getMediaUrl(song.cover_url)
                            : DEFAULT_COVER
                        }
                        alt={`${title} cover`}
                        loading="lazy"
                        onError={(event) => {
                          event.currentTarget.onerror = null;
                          event.currentTarget.src = DEFAULT_COVER;
                        }}
                      />

                      <div className="add-song-info">
                        <strong>{title}</strong>

                        <small>
                          {song.artist_name ||
                            song.artist?.name ||
                            "Unknown Artist"}
                        </small>

                        <span>
                          {song.album_name ||
                            song.album?.name ||
                            "Single"}
                        </span>
                      </div>

                      <button
                        type="button"
                        className={alreadyAdded ? "song-added" : ""}
                        disabled={alreadyAdded || actionLoading}
                        onClick={() => addSong(song.id)}
                      >
                        {alreadyAdded
                          ? "Added"
                          : actionLoading
                            ? "Adding..."
                            : "Add"}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

export default PlaylistDetails;
