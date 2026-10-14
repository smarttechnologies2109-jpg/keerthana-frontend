
import { useState } from "react";
import {
  FaMusic,
  FaPlus,
  FaTrash,
  FaEraser,
  FaArrowLeft,
  FaTimes,
  FaCheck,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "../assets/css/playlists.css";

function Playlists() {
  const navigate = useNavigate();

  // Demo state. Replace with your existing playlist API data.
  const [playlists, setPlaylists] = useState([
    {
      id: 1,
      name: "My Worship Songs",
      description: "Songs for personal worship",
      songs: [],
    },
    {
      id: 2,
      name: "Praise and Prayer",
      description: "Music for praise and prayer",
      songs: [],
    },
  ]);

  const [activePlaylist, setActivePlaylist] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [playlistName, setPlaylistName] = useState("");
  const [playlistDescription, setPlaylistDescription] = useState("");
  const [confirmAction, setConfirmAction] = useState(null);

  const openPlaylist = (playlist) => {
    setActivePlaylist(playlist);
  };

  const createPlaylist = (event) => {
    event.preventDefault();

    const name = playlistName.trim();

    if (!name) return;

    const newPlaylist = {
      id: Date.now(),
      name,
      description: playlistDescription.trim(),
      songs: [],
    };

    setPlaylists((previous) => [...previous, newPlaylist]);
    setPlaylistName("");
    setPlaylistDescription("");
    setShowCreateModal(false);
  };

  const clearPlaylist = (playlistId) => {
    setPlaylists((previous) =>
      previous.map((playlist) =>
        playlist.id === playlistId
          ? { ...playlist, songs: [] }
          : playlist
      )
    );

    setActivePlaylist((previous) =>
      previous?.id === playlistId
        ? { ...previous, songs: [] }
        : previous
    );

    setConfirmAction(null);
  };

  const deletePlaylist = (playlistId) => {
    setPlaylists((previous) =>
      previous.filter((playlist) => playlist.id !== playlistId)
    );

    setActivePlaylist((previous) =>
      previous?.id === playlistId ? null : previous
    );

    setConfirmAction(null);
  };

  const requestAction = (type, playlist) => {
    setConfirmAction({ type, playlist });
  };

  const confirmSelectedAction = () => {
    if (!confirmAction) return;

    const { type, playlist } = confirmAction;

    if (type === "clear") {
      clearPlaylist(playlist.id);
    } else if (type === "delete") {
      deletePlaylist(playlist.id);
    }
  };

  return (
    <main className="playlists-page">
      <header className="playlists-header">
        <div>
          <span className="playlists-eyebrow">
            KEERTHANA MUSIC
          </span>

          <h1>
            {activePlaylist ? activePlaylist.name : "Your Playlists"}
          </h1>

          <p>
            {activePlaylist
              ? "Manage your collection of worship songs."
              : "Create, organize, and manage your favourite music collections."}
          </p>
        </div>

        <button
          type="button"
          className="playlists-create-button"
          onClick={() => setShowCreateModal(true)}
        >
          <FaPlus />
          Create Playlist
        </button>
      </header>

      {activePlaylist ? (
        <section className="playlist-detail">
          <button
            type="button"
            className="playlist-back-button"
            onClick={() => setActivePlaylist(null)}
          >
            <FaArrowLeft />
            All Playlists
          </button>

          <div className="playlist-detail-heading">
            <div className="playlist-detail-art">
              <FaMusic />
            </div>

            <div className="playlist-detail-info">
              <span className="playlist-detail-label">
                PLAYLIST
              </span>

              <h2>{activePlaylist.name}</h2>

              <p>
                {activePlaylist.description || "Your personal music collection"}
              </p>

              <span className="playlist-song-count">
                {activePlaylist.songs.length} songs
              </span>
            </div>
          </div>

          <div className="playlist-management-actions">
            <button
              type="button"
              className="playlist-action-clear"
              onClick={() => requestAction("clear", activePlaylist)}
              disabled={activePlaylist.songs.length === 0}
            >
              <FaEraser />
              Clear Songs
            </button>

            <button
              type="button"
              className="playlist-action-delete"
              onClick={() => requestAction("delete", activePlaylist)}
            >
              <FaTrash />
              Delete Playlist
            </button>
          </div>

          {activePlaylist.songs.length === 0 ? (
            <div className="playlist-empty-state">
              <div className="playlist-empty-icon">
                <FaMusic />
              </div>

              <h3>This playlist is empty</h3>

              <p>
                Add songs to your playlist to build your worship collection.
              </p>

              <button
                type="button"
                className="playlists-create-button"
                onClick={() => navigate("/search")}
              >
                <FaPlus />
                Find Songs
              </button>
            </div>
          ) : (
            <div className="playlist-songs-list">
              {activePlaylist.songs.map((song, index) => (
                <div className="playlist-song-row" key={song.id}>
                  <span>{index + 1}</span>
                  <FaMusic />
                  <span>{song.title}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      ) : (
        <section className="playlists-grid-section">
          <div className="playlists-section-heading">
            <div>
              <h2>Your collections</h2>
              <p>
                {playlists.length}{" "}
                {playlists.length === 1 ? "playlist" : "playlists"}
              </p>
            </div>
          </div>

          {playlists.length === 0 ? (
            <div className="playlist-empty-state">
              <div className="playlist-empty-icon">
                <FaMusic />
              </div>

              <h3>Create your first playlist</h3>

              <p>
                Organize your favourite Christian songs in one place.
              </p>

              <button
                type="button"
                className="playlists-create-button"
                onClick={() => setShowCreateModal(true)}
              >
                <FaPlus />
                Create Playlist
              </button>
            </div>
          ) : (
            <div className="playlists-grid">
              {playlists.map((playlist) => (
                <article className="playlist-card" key={playlist.id}>
                  <button
                    type="button"
                    className="playlist-card-open"
                    onClick={() => openPlaylist(playlist)}
                    aria-label={`Open ${playlist.name}`}
                  >
                    <div className="playlist-card-art">
                      <FaMusic />
                    </div>

                    <div className="playlist-card-info">
                      <h3>{playlist.name}</h3>

                      <p>
                        {playlist.description || "Your music collection"}
                      </p>

                      <span>
                        {playlist.songs.length}{" "}
                        {playlist.songs.length === 1 ? "song" : "songs"}
                      </span>
                    </div>
                  </button>

                  <div className="playlist-card-actions">
                    <button
                      type="button"
                      onClick={() => requestAction("clear", playlist)}
                      disabled={playlist.songs.length === 0}
                      aria-label={`Clear songs from ${playlist.name}`}
                      title="Clear Songs"
                    >
                      <FaEraser />
                      Clear
                    </button>

                    <button
                      type="button"
                      className="playlist-card-delete"
                      onClick={() => requestAction("delete", playlist)}
                      aria-label={`Delete ${playlist.name}`}
                      title="Delete Playlist"
                    >
                      <FaTrash />
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {showCreateModal && (
        <div
          className="playlist-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowCreateModal(false);
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
                  Create Playlist
                </h2>
              </div>

              <button
                type="button"
                className="playlist-modal-close"
                onClick={() => setShowCreateModal(false)}
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
                onChange={(event) => setPlaylistName(event.target.value)}
                placeholder="e.g. Morning Worship"
                maxLength={80}
                required
                autoFocus
              />

              <label htmlFor="playlist-description">
                Description (optional)
              </label>

              <textarea
                id="playlist-description"
                value={playlistDescription}
                onChange={(event) =>
                  setPlaylistDescription(event.target.value)
                }
                placeholder="Describe your playlist"
                maxLength={250}
                rows={3}
              />

              <div className="playlist-modal-actions">
                <button
                  type="button"
                  className="playlist-modal-cancel"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="playlists-create-button"
                >
                  <FaCheck />
                  Create
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {confirmAction && (
        <div className="playlist-modal-overlay">
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

            <h2 id="playlist-confirm-title">
              {confirmAction.type === "clear"
                ? "Clear all songs?"
                : "Delete this playlist?"}
            </h2>

            <p id="playlist-confirm-description">
              {confirmAction.type === "clear"
                ? `All songs will be removed from "${confirmAction.playlist.name}". The playlist itself will remain.`
                : `"${confirmAction.playlist.name}" and its playlist collection will be removed. This action cannot be undone.`}
            </p>

            <div className="playlist-modal-actions">
              <button
                type="button"
                className="playlist-modal-cancel"
                onClick={() => setConfirmAction(null)}
              >
                Cancel
              </button>

              <button
                type="button"
                className="playlist-confirm-danger"
                onClick={confirmSelectedAction}
              >
                {confirmAction.type === "clear"
                  ? "Clear Songs"
                  : "Delete Playlist"}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

export default Playlists;
