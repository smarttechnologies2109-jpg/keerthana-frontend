
import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  FaMusic,
  FaPlus,
  FaTrash,
  FaTimes,
  FaCheck,
  FaSearch,
} from "react-icons/fa";

import API from "../services/api";
import { usePlayer } from "../context/usePlayer";
import VoiceSearch from "../components/VoiceSearch";

import "../assets/css/playlists.css";

/* =========================================================
   RESPONSE HELPERS
========================================================= */

const getPlaylists = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.playlists)) return data.playlists;
  if (Array.isArray(data?.data?.playlists)) {
    return data.data.playlists;
  }
  if (Array.isArray(data?.data)) return data.data;

  return [];
};

const getSongTitle = (song) =>
  song?.title_english ||
  song?.titleEnglish ||
  song?.title ||
  "Unknown Song";

const getPlaylistDetails = (data) =>
  data?.playlist ||
  data?.data?.playlist ||
  data?.data ||
  data;

/* =========================================================
   VOICE SEARCH LANGUAGES
========================================================= */

const VOICE_LANGUAGES = [
  { value: "te-IN", label: "తెలుగు" },
  { value: "hi-IN", label: "हिन्दी" },
  { value: "en-IN", label: "English" },
  { value: "ml-IN", label: "മലയാളം" },
  { value: "kn-IN", label: "ಕನ್ನಡ" },
  { value: "ta-IN", label: "தமிழ்" },
];

/* =========================================================
   PLAYLIST COLLECTION PAGE
========================================================= */

function Playlists() {
  const navigate = useNavigate();
  const location = useLocation();

  const { playSong } = usePlayer();

  /* =======================================================
     STATE
  ======================================================= */

  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [voiceLanguage, setVoiceLanguage] = useState("en-IN");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddSongs, setShowAddSongs] = useState(false);

  const [playlistName, setPlaylistName] = useState("");
  const [playlistDescription, setPlaylistDescription] = useState("");

  const [confirmAction, setConfirmAction] = useState(null);
  const [pendingSong, setPendingSong] = useState(null);
  const [targetPlaylistId, setTargetPlaylistId] = useState("");

  /* =======================================================
     FILTER PLAYLISTS
  ======================================================= */

  const filteredPlaylists = playlists.filter((playlist) => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) return true;

    const name = String(playlist?.name || "").toLowerCase();
    const description = String(
      playlist?.description || ""
    ).toLowerCase();

    return name.includes(query) || description.includes(query);
  });

  /* =======================================================
     LOAD PLAYLISTS
  ======================================================= */

  const fetchPlaylists = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await API.get("/playlists");

      setPlaylists(getPlaylists(response?.data));
    } catch (err) {
      console.error("Load playlists error:", err);

      setError(
        err?.response?.data?.message ||
          "Unable to load your playlists. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlaylists();
  }, [fetchPlaylists]);

  /* =======================================================
     OPEN PLAYLIST DETAILS
  ======================================================= */

  const openPlaylist = useCallback(
    (playlist) => {
      if (!playlist?.id) {
        setActionError("Unable to open this playlist.");
        return;
      }

      setActionError("");
      navigate(`/playlists/${playlist.id}`);
    },
    [navigate]
  );

  /* =======================================================
     HANDLE SONG PASSED FROM SEARCH
  ======================================================= */

  useEffect(() => {
    const song = location.state?.selectedSong;
    const action = location.state?.action;

    if (song && action === "add-song") {
      setPendingSong(song);
      setTargetPlaylistId("");
      setShowAddSongs(true);
      setActionError("");
    }
  }, [location.state]);

  /* =======================================================
     CREATE PLAYLIST
  ======================================================= */

  const createPlaylist = async (event) => {
    event.preventDefault();

    const name = playlistName.trim();

    if (!name) {
      setActionError("Enter a playlist name.");
      return;
    }

    try {
      setActionLoading(true);
      setActionError("");

      await API.post("/playlists", {
        name,
        description: playlistDescription.trim(),
      });

      setPlaylistName("");
      setPlaylistDescription("");
      setShowCreateModal(false);

      await fetchPlaylists();
    } catch (err) {
      console.error("Create playlist error:", err);

      setActionError(
        err?.response?.data?.message ||
          "Unable to create the playlist."
      );
    } finally {
      setActionLoading(false);
    }
  };

  /* =======================================================
     DELETE PLAYLIST
  ======================================================= */

  const deletePlaylist = async (playlist) => {
    if (!playlist?.id) return;

    try {
      setActionLoading(true);
      setActionError("");

      await API.delete(`/playlists/${playlist.id}`);

      setConfirmAction(null);

      await fetchPlaylists();
    } catch (err) {
      console.error("Delete playlist error:", err);

      setActionError(
        err?.response?.data?.message ||
          "Unable to delete this playlist."
      );
    } finally {
      setActionLoading(false);
    }
  };

  /* =======================================================
     ADD SEARCH SONG TO SELECTED PLAYLIST
  ======================================================= */

  const handleAddSelectedSong = async () => {
    if (!targetPlaylistId || !pendingSong?.id) {
      setActionError("Choose a playlist first.");
      return;
    }

    try {
      setActionLoading(true);
      setActionError("");

      const playlistResponse = await API.get(
        `/playlists/${targetPlaylistId}`
      );

      const playlist = getPlaylistDetails(playlistResponse?.data);

      const existingSongs = Array.isArray(playlist?.songs)
        ? playlist.songs
        : [];

      const alreadyAdded = existingSongs.some(
        (song) => String(song.id) === String(pendingSong.id)
      );

      if (alreadyAdded) {
        setActionError("This song is already in that playlist.");
        return;
      }

      await API.post(
        `/playlists/${targetPlaylistId}/songs/${pendingSong.id}`
      );

      await fetchPlaylists();

      /* Attempt playback without failing the add operation. */

      try {
        const updatedResponse = await API.get(
          `/playlists/${targetPlaylistId}`
        );

        const updatedPlaylist = getPlaylistDetails(
          updatedResponse?.data
        );

        const updatedSongs = Array.isArray(updatedPlaylist?.songs)
          ? updatedPlaylist.songs
          : [];

        const addedSong = updatedSongs.find(
          (song) => String(song.id) === String(pendingSong.id)
        );

        if (addedSong?.audio_url) {
          await playSong(addedSong, updatedSongs);
        }
      } catch (playbackError) {
        console.error(
          "Load added song for playback error:",
          playbackError
        );
      }

      setShowAddSongs(false);
      setPendingSong(null);
      setTargetPlaylistId("");

      navigate("/playlists", {
        replace: true,
        state: {},
      });
    } catch (err) {
      console.error("Add song to playlist error:", err);

      setActionError(
        err?.response?.data?.message ||
          "Unable to add this song. Please try again."
      );
    } finally {
      setActionLoading(false);
    }
  };

  /* =======================================================
     HANDLE CREATE QUERY PARAMETER
  ======================================================= */

  useEffect(() => {
    const params = new URLSearchParams(location.search);

    if (params.get("create") === "true") {
      setShowCreateModal(true);
    }
  }, [location.search]);

  /* =======================================================
     CLOSE ADD SONG MODAL
  ======================================================= */

  const closeAddSongsModal = () => {
    if (actionLoading) return;

    setShowAddSongs(false);
    setPendingSong(null);
    setTargetPlaylistId("");
    setActionError("");

    if (location.state?.action === "add-song") {
      navigate("/playlists", {
        replace: true,
        state: {},
      });
    }
  };

  /* =======================================================
     CLEAR SEARCH
  ======================================================= */

  const clearPlaylistSearch = () => {
    setSearchQuery("");
  };

  /* =======================================================
     LOADING STATE
  ======================================================= */

  if (loading) {
    return (
      <main className="playlists-page">
        <div className="playlists-main">
          <div className="playlist-empty-state">
            <FaMusic />
            <h3>Loading your playlists...</h3>
            <p>Please wait while we load your collection.</p>
          </div>
        </div>
      </main>
    );
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <main className="playlists-page">
      <div className="playlists-main">
        {/* ERROR MESSAGES */}

        {error && (
          <div className="playlist-error" role="alert">
            <p>{error}</p>
            <button
              type="button"
              onClick={fetchPlaylists}
              disabled={loading}
            >
              Try again
            </button>
          </div>
        )}

        {actionError && !showCreateModal && !showAddSongs && (
          <div className="playlist-error" role="alert">
            <p>{actionError}</p>
            <button
              type="button"
              onClick={() => setActionError("")}
            >
              <FaTimes /> Dismiss
            </button>
          </div>
        )}

        {/* PLAYLIST COLLECTION */}

        <section className="playlists-grid-section">
          {/* SECTION HEADER */}

          <div className="playlists-section-heading">
            <div>
              <span className="playlists-section-eyebrow">
                YOUR PERSONAL COLLECTION
              </span>

              <h2>Made by you</h2>

              <p>
                Your playlists, organized around the music you love.
              </p>
            </div>

            <button
              type="button"
              className="playlists-secondary-button"
              onClick={() => {
                setActionError("");
                setShowCreateModal(true);
              }}
            >
              <FaPlus />
              New playlist
            </button>
          </div>

          {/* PLAYLIST SEARCH BAR */}

          
{/* PLAYLIST SEARCH BAR + VOICE LANGUAGE */}

<div className="playlists-search-section">
  <div className="playlists-search-row">
    <div className="playlists-search playlists-voice-search">
      <VoiceSearch
        value={searchQuery}
        onChange={setSearchQuery}
        onSearch={setSearchQuery}
        language={voiceLanguage}
        onLanguageChange={setVoiceLanguage}
        placeholder="Search your playlists..."
        ariaLabel="Search your playlists"
      />
    </div>
  </div>
</div>

{/* SEARCH RESULTS SUMMARY */}

{playlists.length > 0 && searchQuery.trim() && (
  <p
    className="playlists-search-summary"
    aria-live="polite"
  >
    {filteredPlaylists.length}{" "}
    {filteredPlaylists.length === 1
      ? "playlist"
      : "playlists"}{" "}
    found
  </p>
)}


          {/* EMPTY COLLECTION */}

          {playlists.length === 0 && !searchQuery.trim() ? (
            <div className="playlist-empty-state">
              <div className="playlist-empty-art">
                <FaMusic />
                <span>♪</span>
              </div>

              <span className="playlist-empty-eyebrow">
                START SOMETHING PERSONAL
              </span>

              <h3>Your first playlist starts here</h3>

              <p>
                Create a playlist, then add songs directly from your
                music library.
              </p>

              <button
                type="button"
                className="playlists-create-button"
                onClick={() => {
                  setActionError("");
                  setShowCreateModal(true);
                }}
              >
                <FaPlus />
                Create your first playlist
              </button>
            </div>
          ) : filteredPlaylists.length > 0 ? (
            /* PLAYLIST CARDS */

            <div className="playlists-grid" id="playlists-grid">
              {filteredPlaylists.map((playlist, index) => {
                const songCount = Number(
                  playlist.song_count ??
                    playlist.songs?.length ??
                    0
                );

                return (
                  <article
                    className="playlist-card"
                    key={playlist.id}
                  >
                    {/* ARTWORK */}

                    <button
                      type="button"
                      className={`playlist-card-open playlist-card-artwork artwork-variant-${index % 4}`}
                      onClick={() => openPlaylist(playlist)}
                      aria-label={`Open ${playlist.name}`}
                    >
                      <span className="playlist-art-decoration playlist-art-decoration-one" />
                      <span className="playlist-art-decoration playlist-art-decoration-two" />

                      <span className="playlist-card-art-icon">
                        <FaMusic />
                      </span>

                      <span className="playlist-card-open-play">
                        <FaSearch />
                      </span>

                      <span className="playlist-card-art-label">
                        KEERTHANA
                      </span>
                    </button>

                    {/* PLAYLIST INFORMATION */}

                    <div className="playlist-card-info">
                      <button
                        type="button"
                        className="playlist-card-title-button"
                        onClick={() => openPlaylist(playlist)}
                      >
                        <h3>{playlist.name}</h3>
                      </button>

                      <p>
                        {playlist.description ||
                          "Your music collection"}
                      </p>

                      <span className="playlist-card-song-count">
                        {songCount}{" "}
                        {songCount === 1 ? "song" : "songs"}
                      </span>
                    </div>

                    {/* PLAYLIST ACTIONS */}

                    <div className="playlist-card-actions">
                      <button
                        type="button"
                        onClick={() => openPlaylist(playlist)}
                        aria-label={`Open ${playlist.name} to manage songs`}
                      >
                        <FaPlus />
                        <span>Add songs</span>
                      </button>

                      <button
                        type="button"
                        className="playlist-card-delete"
                        onClick={() => {
                          setActionError("");
                          setConfirmAction({
                            type: "delete",
                            playlist,
                          });
                        }}
                        aria-label={`Delete ${playlist.name}`}
                        title="Delete playlist"
                      >
                        <FaTrash />
                        <span>Delete</span>
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            /* NO SEARCH RESULTS */

            <div className="playlist-empty-state playlists-no-results">
              <div className="playlist-empty-art">
                <FaSearch />
              </div>

              <span className="playlist-empty-eyebrow">
                NO MATCHES FOUND
              </span>

              <h3>No playlists found</h3>

              <p>
                No playlists match "{searchQuery.trim()}". Try
                another name or description.
              </p>

              <button
                type="button"
                className="playlists-create-button"
                onClick={clearPlaylistSearch}
              >
                <FaTimes />
                Clear search
              </button>
            </div>
          )}
        </section>
      </div>

      {/* CREATE PLAYLIST MODAL */}

      {showCreateModal && (
        <div
          className="playlist-modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !actionLoading
            ) {
              setShowCreateModal(false);
              setActionError("");
            }
          }}
        >
          <section
            className="playlist-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-playlist-title"
          >
            <div className="playlist-modal-heading">
              <div>
                <span className="playlists-eyebrow">
                  YOUR MUSIC
                </span>

                <h2 id="create-playlist-title">
                  Create a playlist
                </h2>

                <p>
                  Give your collection a name of its own.
                </p>
              </div>

              <button
                type="button"
                className="playlist-modal-close"
                onClick={() => {
                  setShowCreateModal(false);
                  setActionError("");
                }}
                disabled={actionLoading}
                aria-label="Close"
              >
                <FaTimes />
              </button>
            </div>

            <form onSubmit={createPlaylist}>
              <label htmlFor="playlist-name">
                Playlist name
              </label>

              <input
                id="playlist-name"
                value={playlistName}
                onChange={(event) =>
                  setPlaylistName(event.target.value)
                }
                placeholder="e.g. Morning Worship"
                maxLength={80}
                required
                autoFocus
              />

              <label htmlFor="playlist-description">
                Description <span>(optional)</span>
              </label>

              <textarea
                id="playlist-description"
                value={playlistDescription}
                onChange={(event) =>
                  setPlaylistDescription(event.target.value)
                }
                placeholder="What is this collection about?"
                maxLength={250}
                rows={3}
              />

              {actionError && (
                <p role="alert" className="playlist-error">
                  {actionError}
                </p>
              )}

              <div className="playlist-modal-actions">
                <button
                  type="button"
                  className="playlist-modal-cancel"
                  onClick={() => {
                    setShowCreateModal(false);
                    setActionError("");
                  }}
                  disabled={actionLoading}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="playlists-create-button"
                  disabled={actionLoading}
                >
                  <FaCheck />
                  {actionLoading
                    ? "Creating..."
                    : "Create playlist"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {/* ADD SONG TO A PLAYLIST */}

      {showAddSongs && pendingSong && (
        <div
          className="playlist-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeAddSongsModal();
            }
          }}
        >
          <section
            className="playlist-modal playlist-add-songs-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-songs-title"
          >
            <div className="playlist-modal-heading">
              <div>
                <span className="playlists-eyebrow">
                  KEERTHANA MUSIC
                </span>

                <h2 id="add-songs-title">
                  Add song to a playlist
                </h2>

                <p>
                  Choose where you want to save this song.
                </p>
              </div>

              <button
                type="button"
                className="playlist-modal-close"
                onClick={closeAddSongsModal}
                disabled={actionLoading}
                aria-label="Close"
              >
                <FaTimes />
              </button>
            </div>

            {actionError && (
              <p className="playlist-error" role="alert">
                {actionError}
              </p>
            )}

            <div className="playlist-add-selected-song">
              <div className="playlist-add-selected-song-info">
                <FaMusic />

                <div>
                  <strong>{getSongTitle(pendingSong)}</strong>

                  <span>
                    {pendingSong.artist_name ||
                      pendingSong.artist?.name ||
                      "KEERTHANA MUSIC"}
                  </span>
                </div>
              </div>

              <label htmlFor="target-playlist">
                Choose playlist
              </label>

              <select
                id="target-playlist"
                value={targetPlaylistId}
                onChange={(event) =>
                  setTargetPlaylistId(event.target.value)
                }
                disabled={actionLoading}
              >
                <option value="">Select a playlist</option>

                {playlists.map((playlist) => (
                  <option
                    key={playlist.id}
                    value={playlist.id}
                  >
                    {playlist.name}
                  </option>
                ))}
              </select>

              {playlists.length === 0 && (
                <p>
                  Create a playlist first, then add this song.
                </p>
              )}

              <div className="playlist-modal-actions">
                <button
                  type="button"
                  className="playlist-modal-cancel"
                  onClick={closeAddSongsModal}
                  disabled={actionLoading}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="playlists-create-button"
                  onClick={handleAddSelectedSong}
                  disabled={
                    actionLoading ||
                    !targetPlaylistId ||
                    playlists.length === 0
                  }
                >
                  <FaPlus />
                  {actionLoading
                    ? "Adding..."
                    : "Add to playlist"}
                </button>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* DELETE CONFIRMATION */}

      {confirmAction?.type === "delete" && (
        <div
          className="playlist-modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !actionLoading
            ) {
              setConfirmAction(null);
              setActionError("");
            }
          }}
        >
          <section
            className="playlist-modal playlist-confirm-modal"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="playlist-confirm-title"
            aria-describedby="playlist-confirm-description"
          >
            <div className="playlist-confirm-icon">
              <FaTrash />
            </div>

            <span className="playlist-confirm-eyebrow">
              PLEASE CONFIRM
            </span>

            <h2 id="playlist-confirm-title">
              Delete this playlist?
            </h2>

            <p id="playlist-confirm-description">
              "{confirmAction.playlist.name}" will be removed
              from your playlist collection.
            </p>

            {actionError && (
              <p className="playlist-error" role="alert">
                {actionError}
              </p>
            )}

            <div className="playlist-modal-actions">
              <button
                type="button"
                className="playlist-modal-cancel"
                onClick={() => {
                  setConfirmAction(null);
                  setActionError("");
                }}
                disabled={actionLoading}
              >
                Cancel
              </button>

              <button
                type="button"
                className="playlist-confirm-danger"
                onClick={() =>
                  deletePlaylist(confirmAction.playlist)
                }
                disabled={actionLoading}
              >
                {actionLoading
                  ? "Please wait..."
                  : "Delete playlist"}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

export default Playlists;
