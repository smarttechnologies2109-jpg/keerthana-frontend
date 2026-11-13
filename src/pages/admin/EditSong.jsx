
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  FaArrowLeft,
  FaCloudUploadAlt,
  FaImage,
  FaMusic,
  FaSave,
  FaTimes,
} from "react-icons/fa";

import API from "../../services/api";
import { getMediaUrl } from "../../utils/media";
import "../../assets/css/admin/editSong.css";

const LANGUAGES = [
  { value: "Telugu", label: "Telugu" },
  { value: "Hindi", label: "Hindi" },
  { value: "English", label: "English" },
  { value: "Malayalam", label: "Malayalam" },
  { value: "Kannada", label: "Kannada" },
  { value: "Tamil", label: "Tamil" },
];

const LANGUAGE_CONFIG = {
  Telugu: {
    titleLabel: "Song Title (Telugu)",
    lyricsPlaceholder: "తెలుగు పాట సాహిత్యాన్ని నమోదు చేయండి...",
  },
  Hindi: {
    titleLabel: "Song Title (Hindi)",
    lyricsPlaceholder: "गीत के बोल दर्ज करें...",
  },
  English: {
    titleLabel: "Song Title (English)",
    lyricsPlaceholder: "Enter song lyrics...",
  },
  Malayalam: {
    titleLabel: "Song Title (Malayalam)",
    lyricsPlaceholder: "പാട്ടിന്റെ വരികൾ നൽകുക...",
  },
  Kannada: {
    titleLabel: "Song Title (Kannada)",
    lyricsPlaceholder: "ಹಾಡಿನ ಸಾಹಿತ್ಯವನ್ನು ನಮೂದಿಸಿ...",
  },
  Tamil: {
    titleLabel: "Song Title (Tamil)",
    lyricsPlaceholder: "பாடல் வரிகளை உள்ளிடவும்...",
  },
};

const EMPTY_FORM = {
  title: "",
  title_english: "",
  language: "Telugu",
  lyrics: "",
  artist_id: "",
  album_id: "",
  category_id: "",
  ministry_id: "",
};

const getList = (data, key) => {
  if (Array.isArray(data?.[key])) return data[key];
  if (Array.isArray(data?.data?.[key])) return data.data[key];
  if (Array.isArray(data)) return data;
  return [];
};

const getOptionLabel = (item, type) => {
  if (!item) return "";

  if (type === "album") {
    return (
      item.title ||
      item.name ||
      item.title_english ||
      `Album ${item.id}`
    );
  }

  return (
    item.name ||
    item.name_english ||
    item.title ||
    `Item ${item.id}`
  );
};

function EditSong() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [form, setForm] = useState(EMPTY_FORM);
  const [originalForm, setOriginalForm] = useState(EMPTY_FORM);

  const [existingAudio, setExistingAudio] = useState("");
  const [existingCover, setExistingCover] = useState("");

  const [audioFile, setAudioFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState("");

  const [artists, setArtists] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [categories, setCategories] = useState([]);
  const [ministries, setMinistries] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const selectedLanguage =
    LANGUAGE_CONFIG[form.language] || LANGUAGE_CONFIG.Telugu;

  // -----------------------------------------------------
  // LOAD SONG AND DROPDOWN DATA
  // -----------------------------------------------------

  useEffect(() => {
    let active = true;

    const loadPage = async () => {
      try {
        setLoading(true);
        setError("");

        const [
          songResponse,
          artistsResponse,
          albumsResponse,
          categoriesResponse,
          ministriesResponse,
        ] = await Promise.all([
          API.get(`/admin/songs/${id}`),
          API.get("/artists"),
          API.get("/albums"),
          API.get("/categories"),
          API.get("/ministries"),
        ]);

        if (!active) return;

        const song = songResponse.data?.song;

        if (!song) {
          throw new Error("Song details were not found.");
        }

        const loadedForm = {
          title: song.title || "",
          title_english: song.title_english || "",
          language: song.language || "Telugu",
          lyrics: song.lyrics || "",
          artist_id:
            song.artist_id !== null && song.artist_id !== undefined
              ? String(song.artist_id)
              : "",
          album_id:
            song.album_id !== null && song.album_id !== undefined
              ? String(song.album_id)
              : "",
          category_id:
            song.category_id !== null && song.category_id !== undefined
              ? String(song.category_id)
              : "",
          ministry_id:
            song.ministry_id !== null && song.ministry_id !== undefined
              ? String(song.ministry_id)
              : "",
        };

        setForm(loadedForm);
        setOriginalForm(loadedForm);

        setExistingAudio(song.audio_url || "");
        setExistingCover(song.cover_url || "");

        setArtists(getList(artistsResponse.data, "artists"));
        setAlbums(getList(albumsResponse.data, "albums"));
        setCategories(getList(categoriesResponse.data, "categories"));
        setMinistries(getList(ministriesResponse.data, "ministries"));
      } catch (err) {
        console.error("Edit song load error:", err);

        if (active) {
          setError(
            err.response?.data?.message ||
              err.message ||
              "Unable to load song details."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    loadPage();

    return () => {
      active = false;
    };
  }, [id]);

  // -----------------------------------------------------
  // CLEAN UP COVER PREVIEW
  // -----------------------------------------------------

  useEffect(() => {
    return () => {
      if (coverPreview) {
        URL.revokeObjectURL(coverPreview);
      }
    };
  }, [coverPreview]);

  // -----------------------------------------------------
  // INPUT CHANGE
  // -----------------------------------------------------

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  };

  // -----------------------------------------------------
  // AUDIO FILE CHANGE
  // -----------------------------------------------------

  const handleAudioChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const allowedTypes = [
      "audio/mpeg",
      "audio/mp3",
      "audio/mp4",
      "audio/x-m4a",
    ];

    const validExtension = /\.(mp3|m4a)$/i.test(file.name);

    if (!allowedTypes.includes(file.type) && !validExtension) {
      setError("Please choose an MP3 or M4A audio file.");
      event.target.value = "";
      return;
    }

    if (file.size > 30 * 1024 * 1024) {
      setError("Audio file must be smaller than 30 MB.");
      event.target.value = "";
      return;
    }

    setAudioFile(file);
    setError("");
    setSuccess("");
  };

  // -----------------------------------------------------
  // COVER FILE CHANGE
  // -----------------------------------------------------

  const handleCoverChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      setError("Cover must be JPG, PNG or WebP.");
      event.target.value = "";
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("Cover image must be smaller than 10 MB.");
      event.target.value = "";
      return;
    }

    if (coverPreview) {
      URL.revokeObjectURL(coverPreview);
    }

    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
    setError("");
    setSuccess("");
  };

  // -----------------------------------------------------
  // REMOVE SELECTED AUDIO
  // -----------------------------------------------------

  const removeNewAudio = () => {
    setAudioFile(null);

    const input = document.getElementById("edit-song-audio");
    if (input) input.value = "";
  };

  // -----------------------------------------------------
  // REMOVE SELECTED COVER
  // -----------------------------------------------------

  const removeNewCover = () => {
    if (coverPreview) {
      URL.revokeObjectURL(coverPreview);
    }

    setCoverFile(null);
    setCoverPreview("");

    const input = document.getElementById("edit-song-cover");
    if (input) input.value = "";
  };

  // -----------------------------------------------------
  // FILE SIZE
  // -----------------------------------------------------

  const formatFileSize = (bytes) => {
    if (!bytes) return "0 MB";
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // -----------------------------------------------------
  // SUBMIT - SEND ONLY CHANGED FIELDS
  // -----------------------------------------------------

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!form.title.trim()) {
      setError("Song title is required.");
      return;
    }

    if (!LANGUAGES.some((item) => item.value === form.language)) {
      setError("Please select a valid song language.");
      return;
    }

    const changedFields = [
      "title",
      "title_english",
      "language",
      "lyrics",
      "artist_id",
      "album_id",
      "category_id",
      "ministry_id",
    ];

    const formData = new FormData();
    let hasChanges = false;

    changedFields.forEach((field) => {
      const currentValue = String(form[field] ?? "");
      const originalValue = String(originalForm[field] ?? "");

      if (currentValue !== originalValue) {
        // Append empty values too, so optional relationships
        // can be cleared when the user deliberately removes them.
        formData.append(field, currentValue);
        hasChanges = true;
      }
    });

    if (audioFile) {
      formData.append("audio", audioFile);
      hasChanges = true;
    }

    if (coverFile) {
      formData.append("cover", coverFile);
      hasChanges = true;
    }

    if (!hasChanges) {
      setError("No changes detected. Please edit a field before saving.");
      return;
    }

    try {
      setSaving(true);

      const response = await API.put(`/admin/songs/${id}`, formData);

      if (response.data?.success === false) {
        throw new Error(response.data?.message || "Song update failed.");
      }

      setSuccess("Song updated successfully!");

      setOriginalForm({ ...form });

      setTimeout(() => {
        navigate("/admin/songs");
      }, 900);
    } catch (err) {
      console.error("Update song error:", err);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to update song. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  // -----------------------------------------------------
  // LOADING
  // -----------------------------------------------------

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-loading">Loading Song...</div>
      </div>
    );
  }

  // -----------------------------------------------------
  // PAGE
  // -----------------------------------------------------

  return (
    <div className="admin-page">
      <div className="admin-form-header">
        <button
          type="button"
          className="admin-back-button"
          onClick={() => navigate("/admin/songs")}
          disabled={saving}
        >
          <FaArrowLeft />
          Back
        </button>

        <div>
          <span>KEERTHANA ADMIN</span>
          <h1>Edit Song</h1>
          <p>Update only the song details you want to change.</p>
        </div>
      </div>

      {error && (
        <div className="admin-error" role="alert">
          {error}
        </div>
      )}

      {success && (
        <div className="admin-success" role="status">
          {success}
        </div>
      )}

      <form
        className="admin-song-form"
        onSubmit={handleSubmit}
        encType="multipart/form-data"
      >
        {/* SONG INFORMATION */}

        <div className="admin-form-section">
          <div className="admin-form-section-title">
            <h2>Song Information</h2>
            <p>Existing song information is loaded automatically.</p>
          </div>

          <div className="admin-form-grid">
            <div className="admin-field">
              <label>Song Language *</label>
              <select
                name="language"
                value={form.language}
                onChange={handleChange}
                disabled={saving}
                required
              >
                {LANGUAGES.map((language) => (
                  <option key={language.value} value={language.value}>
                    {language.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="admin-field">
              <label>{selectedLanguage.titleLabel} *</label>
              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder={selectedLanguage.titleLabel}
                maxLength={255}
                required
                disabled={saving}
              />
            </div>

            <div className="admin-field">
              <label>English Title</label>
              <input
                type="text"
                name="title_english"
                value={form.title_english}
                onChange={handleChange}
                placeholder="Enter English title"
                maxLength={255}
                disabled={saving}
              />
            </div>

            <div className="admin-field">
              <label>Artist *</label>
              <select
                name="artist_id"
                value={form.artist_id}
                onChange={handleChange}
                disabled={saving}
              >
                <option value="">Select Artist</option>
                {artists.map((artist) => (
                  <option key={artist.id} value={String(artist.id)}>
                    {getOptionLabel(artist, "artist")}
                  </option>
                ))}
              </select>
            </div>

            <div className="admin-field">
              <label>Album</label>
              <select
                name="album_id"
                value={form.album_id}
                onChange={handleChange}
                disabled={saving}
              >
                <option value="">No Album</option>
                {albums.map((album) => (
                  <option key={album.id} value={String(album.id)}>
                    {getOptionLabel(album, "album")}
                  </option>
                ))}
              </select>
            </div>

            <div className="admin-field">
              <label>Category *</label>
              <select
                name="category_id"
                value={form.category_id}
                onChange={handleChange}
                disabled={saving}
              >
                <option value="">Select Category</option>
                {categories.map((category) => (
                  <option key={category.id} value={String(category.id)}>
                    {getOptionLabel(category, "category")}
                  </option>
                ))}
              </select>
            </div>

            <div className="admin-field">
              <label>Ministry</label>
              <select
                name="ministry_id"
                value={form.ministry_id}
                onChange={handleChange}
                disabled={saving}
              >
                <option value="">No Ministry</option>
                {ministries.map((ministry) => (
                  <option key={ministry.id} value={String(ministry.id)}>
                    {getOptionLabel(ministry, "ministry")}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* MEDIA */}

        <div className="admin-form-section">
          <div className="admin-form-section-title">
            <h2>Media</h2>
            <p>
              Your existing files will be kept unless you select replacements.
            </p>
          </div>

          <div className="admin-upload-grid">
            {/* AUDIO */}

            <div className="admin-upload-box">
              <div className="admin-upload-icon">
                <FaMusic />
              </div>

              <h3>Audio File</h3>

              {existingAudio && (
                <p className="admin-existing-media">
                  Current audio is available
                </p>
              )}

              {!audioFile ? (
                <>
                  <input
                    id="edit-song-audio"
                    className="admin-file-input"
                    type="file"
                    accept=".mp3,.m4a,audio/mpeg,audio/mp4"
                    onChange={handleAudioChange}
                    disabled={saving}
                  />

                  <label
                    htmlFor="edit-song-audio"
                    className="admin-upload-button"
                  >
                    <FaCloudUploadAlt />
                    Replace Audio
                  </label>
                </>
              ) : (
                <div className="admin-selected-file">
                  <div>
                    <strong>{audioFile.name}</strong>
                    <span>
                      New audio • {formatFileSize(audioFile.size)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={removeNewAudio}
                    disabled={saving}
                    aria-label="Remove selected audio"
                  >
                    <FaTimes />
                  </button>
                </div>
              )}
            </div>

            {/* COVER */}

            <div className="admin-upload-box">
              {coverPreview ? (
                <img
                  className="admin-cover-preview"
                  src={coverPreview}
                  alt="New cover preview"
                />
              ) : existingCover ? (
                <img
                  className="admin-cover-preview"
                  src={getMediaUrl(existingCover)}
                  alt="Current song cover"
                />
              ) : (
                <div className="admin-upload-icon">
                  <FaImage />
                </div>
              )}

              <h3>Cover Image</h3>

              <p>
                {coverFile
                  ? "New cover selected"
                  : existingCover
                    ? "Current cover"
                    : "No current cover"}
              </p>

              {!coverFile ? (
                <>
                  <input
                    id="edit-song-cover"
                    className="admin-file-input"
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp"
                    onChange={handleCoverChange}
                    disabled={saving}
                  />

                  <label
                    htmlFor="edit-song-cover"
                    className="admin-upload-button"
                  >
                    <FaCloudUploadAlt />
                    {existingCover ? "Replace Cover" : "Add Cover"}
                  </label>
                </>
              ) : (
                <div className="admin-selected-file">
                  <div>
                    <strong>{coverFile.name}</strong>
                    <span>{formatFileSize(coverFile.size)}</span>
                  </div>

                  <button
                    type="button"
                    onClick={removeNewCover}
                    disabled={saving}
                    aria-label="Remove selected cover"
                  >
                    <FaTimes />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* LYRICS */}

        <div className="admin-form-section">
          <div className="admin-form-section-title">
            <h2>Lyrics</h2>
            <p>Edit the lyrics without changing the other song details.</p>
          </div>

          <div className="admin-field">
            <textarea
              name="lyrics"
              rows="18"
              value={form.lyrics}
              onChange={handleChange}
              placeholder={selectedLanguage.lyricsPlaceholder}
              disabled={saving}
            />
          </div>
        </div>

        {/* ACTIONS */}

        <div className="admin-form-actions">
          <button
            type="button"
            className="admin-cancel-button"
            disabled={saving}
            onClick={() => navigate("/admin/songs")}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="admin-primary-button"
            disabled={saving}
          >
            <FaSave />
            {saving ? "Saving..." : "Update Song"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default EditSong;
