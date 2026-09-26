import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  FaArrowLeft,
  FaMusic,
  FaSearch,
  FaPlus,
  FaTimes,
  FaEdit,
  FaTrash,
  FaSave,
  FaCompactDisc,
  FaMicrophone,
  FaFolder,
  FaPlay,
  FaImage,
  FaSyncAlt,
} from "react-icons/fa";

import API from "../../services/api";

import "../../assets/css/businessOwner/BusinessOwnerMusic.css";

const emptyForm = {
  title: "",
  artist: "",
  album: "",
  category: "",
  audio_url: "",
  cover_image: "",
};

const BusinessOwnerMusic = () => {
  const navigate = useNavigate();

  const [music, setMusic] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingMusic, setEditingMusic] = useState(null);

  const [form, setForm] = useState(emptyForm);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchMusic = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await API.get("/owner/music");

      setMusic(response.data?.music || []);
    } catch (err) {
      console.error("Fetch owner music error:", err);

      setError(
        err.response?.data?.message ||
          "Failed to load music."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMusic();
  }, []);

  const filteredMusic = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) {
      return music;
    }

    return music.filter((item) =>
      [
        item.title,
        item.artist,
        item.album,
        item.category,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value)
            .toLowerCase()
            .includes(keyword)
        )
    );
  }, [music, search]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const openAddModal = () => {
    setEditingMusic(null);
    setForm(emptyForm);
    setError("");
    setSuccess("");
    setShowModal(true);
  };

  const openEditModal = (item) => {
    setEditingMusic(item);

    setForm({
      title: item.title || "",
      artist: item.artist || "",
      album: item.album || "",
      category: item.category || "",
      audio_url: item.audio_url || "",
      cover_image: item.cover_image || "",
    });

    setError("");
    setSuccess("");
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) {
      return;
    }

    setShowModal(false);
    setEditingMusic(null);
    setForm(emptyForm);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!form.title.trim()) {
      setError("Music title is required.");
      return;
    }

    if (!form.artist.trim()) {
      setError("Artist name is required.");
      return;
    }

    if (!form.audio_url.trim()) {
      setError("Audio URL is required.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        title: form.title.trim(),
        artist: form.artist.trim(),
        album: form.album.trim(),
        category: form.category.trim(),
        audio_url: form.audio_url.trim(),
        cover_image: form.cover_image.trim(),
      };

      if (editingMusic) {
        const response = await API.put(
          `/owner/music/${editingMusic.id}`,
          payload
        );

        setSuccess(
          response.data?.message ||
            "Music updated successfully."
        );
      } else {
        const response = await API.post(
          "/owner/music",
          payload
        );

        setSuccess(
          response.data?.message ||
            "Music added successfully."
        );
      }

      await fetchMusic();

      setTimeout(() => {
        setShowModal(false);
        setEditingMusic(null);
        setForm(emptyForm);
        setSuccess("");
      }, 700);
    } catch (err) {
      console.error("Save music error:", err);

      setError(
        err.response?.data?.message ||
          "Failed to save music."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    const item = music.find(
      (musicItem) => musicItem.id === id
    );

    const confirmed = window.confirm(
      `Are you sure you want to delete "${item?.title || "this music"}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setSuccess("");

      await API.delete(`/owner/music/${id}`);

      setMusic((previous) =>
        previous.filter((item) => item.id !== id)
      );

      setSuccess("Music deleted successfully.");

      setTimeout(() => {
        setSuccess("");
      }, 2500);
    } catch (err) {
      console.error("Delete music error:", err);

      setError(
        err.response?.data?.message ||
          "Failed to delete music."
      );
    }
  };

  const formatDate = (date) => {
    if (!date) {
      return "-";
    }

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="owner-music-page">

      {/* HEADER */}
      <header className="owner-music-header">
        <div className="owner-music-header-left">

          <button
            type="button"
            className="owner-music-back-btn"
            onClick={() => navigate("/owner/dashboard")}
            title="Back to Dashboard"
          >
            <FaArrowLeft />
          </button>

          <div className="owner-music-title-wrapper">
            <div className="owner-music-title-icon">
              <FaMusic />
            </div>

            <div>
              <h1>Music Management</h1>
              <p>
                Add, edit and manage your music content
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          className="create-music-btn"
          onClick={openAddModal}
        >
          <FaPlus />
          <span>Add Music</span>
        </button>
      </header>

      <main className="owner-music-main">

        {/* ALERTS */}
        {error && (
          <div className="music-alert music-alert-error">
            <span>{error}</span>

            <button
              type="button"
              onClick={() => setError("")}
            >
              <FaTimes />
            </button>
          </div>
        )}

        {success && (
          <div className="music-alert music-alert-success">
            <span>{success}</span>

            <button
              type="button"
              onClick={() => setSuccess("")}
            >
              <FaTimes />
            </button>
          </div>
        )}

        {/* TOP SECTION */}
        <section className="music-top-section">

          <div className="music-count-box">
            <div className="music-count-icon">
              <FaMusic />
            </div>

            <div>
              <span>Total Music</span>
              <strong>{music.length}</strong>
            </div>
          </div>

          <div className="music-search-box">
            <FaSearch />

            <input
              type="text"
              placeholder="Search by title, artist, album or category..."
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
            />

            {search && (
              <button
                type="button"
                className="clear-music-search"
                onClick={() => setSearch("")}
                title="Clear Search"
              >
                <FaTimes />
              </button>
            )}
          </div>

        </section>

        {/* MUSIC TABLE */}
        <section className="music-table-card">

          <div className="music-table-header">

            <div>
              <h2>Music Library</h2>
              <p>
                {filteredMusic.length} music item
                {filteredMusic.length !== 1 ? "s" : ""}
              </p>
            </div>

            <div className="music-header-actions">

              <button
                type="button"
                className="refresh-music-btn"
                onClick={fetchMusic}
                title="Refresh"
              >
                <FaSyncAlt />
                <span>Refresh</span>
              </button>

              <button
                type="button"
                className="table-add-music-btn"
                onClick={openAddModal}
              >
                <FaPlus />
                <span>Add Music</span>
              </button>

            </div>
          </div>

          {loading ? (
            <div className="music-loading">
              <div className="music-loading-spinner"></div>
              <p>Loading music...</p>
            </div>
          ) : filteredMusic.length === 0 ? (
            <div className="music-empty">

              <div className="music-empty-icon">
                <FaMusic />
              </div>

              <h3>
                {search
                  ? "No music found"
                  : "No music available"}
              </h3>

              <p>
                {search
                  ? "Try a different search term."
                  : "Start adding music to your library."}
              </p>

              {!search && (
                <button
                  type="button"
                  className="empty-add-music-btn"
                  onClick={openAddModal}
                >
                  <FaPlus />
                  Add Your First Music
                </button>
              )}

            </div>
          ) : (
            <div className="music-table-wrapper">

              <table className="music-table">

                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Music</th>
                    <th>Artist</th>
                    <th>Album</th>
                    <th>Category</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>

                  {filteredMusic.map((item) => (
                    <tr key={item.id}>

                      <td>
                        <span className="music-id">
                          #{item.id}
                        </span>
                      </td>

                      <td>
                        <div className="music-name-cell">

                          <div className="music-cover">

                            {item.cover_image ? (
                              <img
                                src={item.cover_image}
                                alt={item.title}
                                onError={(event) => {
                                  event.currentTarget.style.display =
                                    "none";
                                  event.currentTarget.nextSibling.style.display =
                                    "flex";
                                }}
                              />
                            ) : null}

                            <div
                              className="music-cover-placeholder"
                              style={{
                                display: item.cover_image
                                  ? "none"
                                  : "flex",
                              }}
                            >
                              <FaMusic />
                            </div>

                          </div>

                          <div className="music-name-info">
                            <strong>{item.title}</strong>

                            {item.audio_url && (
                              <a
                                href={item.audio_url}
                                target="_blank"
                                rel="noreferrer"
                                className="music-play-link"
                              >
                                <FaPlay />
                                Play
                              </a>
                            )}
                          </div>

                        </div>
                      </td>

                      <td>
                        <div className="music-artist-cell">
                          <FaMicrophone />
                          <span>
                            {item.artist || "-"}
                          </span>
                        </div>
                      </td>

                      <td>
                        <div className="music-album-cell">
                          <FaCompactDisc />
                          <span>
                            {item.album || "-"}
                          </span>
                        </div>
                      </td>

                      <td>
                        <span className="music-category">
                          <FaFolder />
                          {item.category || "General"}
                        </span>
                      </td>

                      <td>
                        <span className="music-created-date">
                          {formatDate(item.created_at)}
                        </span>
                      </td>

                      <td>
                        <div className="music-actions">

                          <button
                            type="button"
                            className="edit-music-btn"
                            title="Edit Music"
                            onClick={() =>
                              openEditModal(item)
                            }
                          >
                            <FaEdit />
                          </button>

                          <button
                            type="button"
                            className="delete-music-btn"
                            title="Delete Music"
                            onClick={() =>
                              handleDelete(item.id)
                            }
                          >
                            <FaTrash />
                          </button>

                        </div>
                      </td>

                    </tr>
                  ))}

                </tbody>

              </table>

            </div>
          )}

        </section>

      </main>

      {/* ADD / EDIT MODAL */}
      {showModal && (
        <div
          className="owner-music-modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !saving
            ) {
              closeModal();
            }
          }}
        >

          <div className="owner-music-modal">

            <div className="owner-music-modal-header">

              <div className="music-modal-title">
                <div className="music-modal-title-icon">
                  {editingMusic ? (
                    <FaEdit />
                  ) : (
                    <FaPlus />
                  )}
                </div>

                <div>
                  <h2>
                    {editingMusic
                      ? "Edit Music"
                      : "Add New Music"}
                  </h2>

                  <p>
                    {editingMusic
                      ? "Update music information"
                      : "Add a new music item"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="music-modal-close-btn"
                onClick={closeModal}
                disabled={saving}
              >
                <FaTimes />
              </button>

            </div>

            <form
              className="owner-music-form"
              onSubmit={handleSubmit}
            >

              <div className="music-form-grid">

                {/* TITLE */}
                <div className="music-form-group full-width">
                  <label>
                    Music Title
                    <span>*</span>
                  </label>

                  <div className="music-input-wrapper">
                    <FaMusic />

                    <input
                      type="text"
                      name="title"
                      value={form.title}
                      onChange={handleChange}
                      placeholder="Enter music title"
                      required
                    />
                  </div>
                </div>

                {/* ARTIST */}
                <div className="music-form-group">
                  <label>
                    Artist
                    <span>*</span>
                  </label>

                  <div className="music-input-wrapper">
                    <FaMicrophone />

                    <input
                      type="text"
                      name="artist"
                      value={form.artist}
                      onChange={handleChange}
                      placeholder="Enter artist name"
                      required
                    />
                  </div>
                </div>

                {/* ALBUM */}
                <div className="music-form-group">
                  <label>Album</label>

                  <div className="music-input-wrapper">
                    <FaCompactDisc />

                    <input
                      type="text"
                      name="album"
                      value={form.album}
                      onChange={handleChange}
                      placeholder="Enter album name"
                    />
                  </div>
                </div>

                {/* CATEGORY */}
                <div className="music-form-group">
                  <label>Category</label>

                  <div className="music-input-wrapper">
                    <FaFolder />

                    <input
                      type="text"
                      name="category"
                      value={form.category}
                      onChange={handleChange}
                      placeholder="Example: Worship"
                    />
                  </div>
                </div>

                {/* AUDIO URL */}
                <div className="music-form-group">
                  <label>
                    Audio URL
                    <span>*</span>
                  </label>

                  <div className="music-input-wrapper">
                    <FaPlay />

                    <input
                      type="url"
                      name="audio_url"
                      value={form.audio_url}
                      onChange={handleChange}
                      placeholder="https://example.com/song.mp3"
                      required
                    />
                  </div>
                </div>

                {/* COVER */}
                <div className="music-form-group full-width">
                  <label>Cover Image URL</label>

                  <div className="music-input-wrapper">
                    <FaImage />

                    <input
                      type="url"
                      name="cover_image"
                      value={form.cover_image}
                      onChange={handleChange}
                      placeholder="https://example.com/cover.jpg"
                    />
                  </div>
                </div>

              </div>

              {error && (
                <div className="music-modal-error">
                  {error}
                </div>
              )}

              {success && (
                <div className="music-modal-success">
                  {success}
                </div>
              )}

              <div className="music-modal-actions">

                <button
                  type="button"
                  className="music-modal-cancel-btn"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="music-modal-save-btn"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <span className="music-button-spinner"></span>
                      Saving...
                    </>
                  ) : (
                    <>
                      <FaSave />
                      {editingMusic
                        ? "Update Music"
                        : "Add Music"}
                    </>
                  )}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </div>
  );
};

export default BusinessOwnerMusic;