
import { useState } from "react";
import {
  FaMusic,
  FaPlus,
  FaTrash,
  FaEraser,
  FaArrowLeft,
  FaTimes,
  FaCheck,
  FaHeadphones,
  FaArrowRight,
  FaPlay,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "../assets/css/playlists.css";

function Playlists() {
  const navigate = useNavigate();

  // Existing demo state and playlist behavior
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
      <div className="playlists-main">
        <header className="playlists-hero">
          <div className="playlists-hero-glow" aria-hidden="true" />

          <div className="playlists-hero-copy">
            <span className="playlists-eyebrow">
              <span className="playlists-eyebrow-dot" />
              KEERTHANA MUSIC
            </span>

            <h1>
              Your worship.
              <br />
              <span>Your collections.</span>
            </h1>

            <p>
              Create a soundtrack for every moment.
              Keep your favourite praise, prayer, and worship
              songs together in one personal space.
            </p>

            <button
              type="button"
              className="playlists-create-button"
              onClick={() => setShowCreateModal(true)}
            >
              <FaPlus />
              <span>Create playlist</span>
              <FaArrowRight className="playlists-button-arrow" />
            </button>
          </div>

          <div className="playlists-hero-art" aria-hidden="true">
            <div className="playlists-hero-orbit playlists-hero-orbit-one" />
            <div className="playlists-hero-orbit playlists-hero-orbit-two" />

            <div className="playlists-hero-disc">
              <div className="playlists-hero-disc-inner">
                <FaHeadphones />
              </div>
            </div>

            <span className="playlists-hero-note playlists-note-one">♫</span>
            <span className="playlists-hero-note playlists-note-two">♪</span>

            <div className="playlists-hero-caption">
              <span className="playlists-caption-icon">
                <FaMusic />
              </span>
              <span>
                <strong>Made for your moments</strong>
                <small>Praise · Prayer · Worship</small>
              </span>
            </div>
          </div>
        </header>

        {activePlaylist ? (
          <section className="playlist-detail">
            <button
              type="button"
              className="playlist-back-button"
              onClick={() => setActivePlaylist(null)}
            >
              <FaArrowLeft />
              <span>All playlists</span>
            </button>

            <div className="playlist-detail-heading">
              <div className="playlist-detail-art">
                <div className="playlist-detail-art-glow" />
                <FaMusic />
              </div>

              <div className="playlist-detail-info">
                <span className="playlist-detail-label">PLAYLIST</span>

                <h2>{activePlaylist.name}</h2>

                <p>
                  {activePlaylist.description ||
                    "Your personal music collection"}
                </p>

                <span className="playlist-song-count">
                  <FaMusic />
                  {activePlaylist.songs.length}{" "}
                  {activePlaylist.songs.length === 1 ? "song" : "songs"}
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
                Clear songs
              </button>

              <button
                type="button"
                className="playlist-action-delete"
                onClick={() => requestAction("delete", activePlaylist)}
              >
                <FaTrash />
                Delete playlist
              </button>
            </div>

            {activePlaylist.songs.length === 0 ? (
              <div className="playlist-empty-state">
                <div className="playlist-empty-art">
                  <FaMusic />
                  <span>♪</span>
                </div>

                <span className="playlist-empty-eyebrow">
                  YOUR NEXT FAVOURITE SONG
                </span>

                <h3>This playlist is waiting for music</h3>

                <p>
                  Find songs that speak to your heart and add them
                  to this collection.
                </p>

                <button
                  type="button"
                  className="playlists-create-button"
                  onClick={() => navigate("/search")}
                >
                  <FaPlay />
                  Find songs
                </button>
              </div>
            ) : (
              <div className="playlist-songs-list">
                {activePlaylist.songs.map((song, index) => (
                  <div className="playlist-song-row" key={song.id}>
                    <span className="playlist-song-index">
                      {String(index + 1).padStart(2, "0")}
                    </span>

                    <span className="playlist-song-icon">
                      <FaMusic />
                    </span>

                    <span className="playlist-song-title">
                      {song.title}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        ) : (
          <section className="playlists-grid-section">
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
                onClick={() => setShowCreateModal(true)}
              >
                <FaPlus />
                New playlist
              </button>
            </div>

            {playlists.length === 0 ? (
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
                  Bring your favourite Christian songs together
                  in one beautiful collection.
                </p>

                <button
                  type="button"
                  className="playlists-create-button"
                  onClick={() => setShowCreateModal(true)}
                >
                  <FaPlus />
                  Create your first playlist
                </button>
              </div>
            ) : (
              <div className="playlists-grid">
                {playlists.map((playlist, index) => (
                  <article className="playlist-card" key={playlist.id}>
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
                        <FaPlay />
                      </span>

                      <span className="playlist-card-art-label">
                        KEERTHANA
                      </span>
                    </button>

                    <div className="playlist-card-info">
                      <button
                        type="button"
                        className="playlist-card-title-button"
                        onClick={() => openPlaylist(playlist)}
                      >
                        <h3>{playlist.name}</h3>
                      </button>

                      <p>
                        {playlist.description || "Your music collection"}
                      </p>

                      <span className="playlist-card-song-count">
                        {playlist.songs.length}{" "}
                        {playlist.songs.length === 1 ? "song" : "songs"}
                      </span>
                    </div>

                    <div className="playlist-card-actions">
                      <button
                        type="button"
                        onClick={() => requestAction("clear", playlist)}
                        disabled={playlist.songs.length === 0}
                        aria-label={`Clear songs from ${playlist.name}`}
                        title="Clear songs"
                      >
                        <FaEraser />
                        <span>Clear</span>
                      </button>

                      <button
                        type="button"
                        className="playlist-card-delete"
                        onClick={() => requestAction("delete", playlist)}
                        aria-label={`Delete ${playlist.name}`}
                        title="Delete playlist"
                      >
                        <FaTrash />
                        <span>Delete</span>
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        <footer className="playlists-footer-note">
          <span className="playlists-footer-icon">
            <FaMusic />
          </span>

          <div>
            <strong>Every song can become a special moment.</strong>
            <p>Build your own collection of praise, prayer, and worship.</p>
          </div>

          <span className="playlists-footer-note-mark" aria-hidden="true">
            ♪
          </span>
        </footer>
      </div>

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
                <span className="playlists-eyebrow">YOUR MUSIC</span>
                <h2 id="create-playlist-title">Create a playlist</h2>
                <p>Give your collection a name of its own.</p>
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
              <label htmlFor="playlist-name">Playlist name</label>

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
                  Create playlist
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {confirmAction && (
        <div
          className="playlist-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setConfirmAction(null);
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
              {confirmAction.type === "clear"
                ? "Clear this playlist?"
                : "Delete this playlist?"}
            </h2>

            <p id="playlist-confirm-description">
              {confirmAction.type === "clear"
                ? `All songs will be removed from "${confirmAction.playlist.name}". The playlist itself will remain.`
                : `"${confirmAction.playlist.name}" will be removed from your playlist collection. This action cannot be undone.`}
            </p>

            <div className="playlist-modal-actions">
              <button
                type="button"
                className="playlist-modal-cancel"
                onClick={() => setConfirmAction(null)}
              >
                Keep playlist
              </button>

              <button
                type="button"
                className="playlist-confirm-danger"
                onClick={confirmSelectedAction}
              >
                {confirmAction.type === "clear"
                  ? "Clear songs"
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
