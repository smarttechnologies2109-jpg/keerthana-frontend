import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FaArrowLeft,
  FaCloudUploadAlt,
  FaImage,
  FaMusic,
  FaSave,
  FaSearch,
  FaTimes,
} from "react-icons/fa";

import API from "../../services/api";
import { getMediaUrl } from "../../utils/media";
import "../../assets/css/admin/editSong.css";

const LANGUAGES = [
  { value: "Telugu", label: "తెలుగు" },
  { value: "Hindi", label: "हिन्दी" },
  { value: "English", label: "English" },
  { value: "Malayalam", label: "മലയാളം" },
  { value: "Kannada", label: "ಕನ್ನಡ" },
  { value: "Tamil", label: "தமிழ்" },
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
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.[key])) return data[key];
  if (Array.isArray(data?.data?.[key])) return data.data[key];
  return [];
};

const normalizeText = (value) =>
  String(value || "").normalize("NFKC").trim().toLocaleLowerCase();

const getBilingualLabel = (english, telugu, fallback = "") => {
  const en = String(english || "").trim();
  const te = String(telugu || "").trim();

  if (en && te && normalizeText(en) !== normalizeText(te)) {
    return `${en} / ${te}`;
  }

  return en || te || fallback;
};

const getEntityLabel = (item, type) => {
  if (!item) return "";

  if (type === "artist") {
    return getBilingualLabel(
      item.name_english,
      item.name_telugu || item.name,
      "Unnamed Artist"
    );
  }

  if (type === "album") {
    return getBilingualLabel(
      item.title_english,
      item.title_telugu || item.title || item.name,
      "Untitled Album"
    );
  }

  if (type === "category") {
    return getBilingualLabel(
      item.name_english,
      item.name_telugu || item.name,
      "Unnamed Category"
    );
  }

  return getBilingualLabel(
    item.name_english,
    item.name_telugu || item.name,
    "Unnamed Ministry"
  );
};

function SearchableDropdown({
  options = [],
  value = "",
  onChange,
  placeholder = "Select an option",
  searchPlaceholder = "Type to search...",
  emptyText = "No matching options found.",
  getLabel,
  getSearchText,
  disabled = false,
  allowClear = false,
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef(null);
  const searchRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false);
        setQuery("");
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
        setQuery("");
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  useEffect(() => {
    if (open) {
      const frame = requestAnimationFrame(() => searchRef.current?.focus());
      return () => cancelAnimationFrame(frame);
    }
  }, [open]);

  const selectedOption = options.find(
    (option) => String(option.id) === String(value)
  );
  const selectedLabel = selectedOption ? getLabel(selectedOption) : "";
  const normalizedQuery = normalizeText(query);

  const visibleOptions = options.filter((option) => {
    if (!normalizedQuery) return true;
    const searchable = getSearchText
      ? getSearchText(option)
      : getLabel(option);
    return normalizeText(searchable).includes(normalizedQuery);
  });

  const chooseOption = (option) => {
    onChange(String(option.id));
    setOpen(false);
    setQuery("");
  };

  return (
   <div
  className={`admin-searchable-dropdown ${open ? "is-open" : ""}`}
  ref={rootRef}
>
      <button
        type="button"
        className={`admin-searchable-trigger${open ? " is-open" : ""}`}
        onClick={() => setOpen((previous) => !previous)}
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
      >
        <span className={selectedLabel ? "has-value" : "is-placeholder"}>
          {selectedLabel || placeholder}
        </span>
        <span className="admin-searchable-chevron" aria-hidden="true">
          ▾
        </span>
      </button>

      {open && (
        <div className="admin-searchable-menu">
          <div className="admin-searchable-input-wrap">
            <FaSearch aria-hidden="true" />
            <input
              ref={searchRef}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              onKeyDown={(event) => {
                if (event.key === "Enter" && visibleOptions.length > 0) {
                  event.preventDefault();
                  chooseOption(visibleOptions[0]);
                }
              }}
            />
            {query && (
              <button
                type="button"
                className="admin-searchable-clear"
                onClick={() => setQuery("")}
                aria-label="Clear search"
              >
                <FaTimes />
              </button>
            )}
          </div>

          <div className="admin-searchable-options" role="listbox">
            {allowClear && (
              <button
                type="button"
                role="option"
                aria-selected={!value}
                className={`admin-searchable-option${!value ? " is-selected" : ""}`}
                onClick={() => {
                  onChange("");
                  setOpen(false);
                  setQuery("");
                }}
              >
                <span>{placeholder}</span>
                {!value && <span className="admin-searchable-check">✓</span>}
              </button>
            )}

            {visibleOptions.length > 0 ? (
              visibleOptions.map((option) => (
                <button
                  type="button"
                  role="option"
                  aria-selected={String(option.id) === String(value)}
                  className={`admin-searchable-option${
                    String(option.id) === String(value) ? " is-selected" : ""
                  }`}
                  key={option.id}
                  onClick={() => chooseOption(option)}
                >
                  <span>{getLabel(option)}</span>
                  {String(option.id) === String(value) && (
                    <span className="admin-searchable-check">✓</span>
                  )}
                </button>
              ))
            ) : (
              <div className="admin-searchable-empty">{emptyText}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

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
        if (!song) throw new Error("Song details were not found.");

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

  useEffect(() => {
    return () => {
      if (coverPreview) URL.revokeObjectURL(coverPreview);
    };
  }, [coverPreview]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
    setError("");
    setSuccess("");
  };

  const handleRelationshipChange = (field, value) => {
    setForm((previous) => ({ ...previous, [field]: value }));
    setError("");
    setSuccess("");
  };

  const handleAudioChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = [
      "audio/mpeg",
      "audio/mp3",
      "audio/mp4",
      "audio/x-m4a",
      "application/octet-stream",
    ];
    const validExtension = /\.(mp3|m4a)$/i.test(file.name);

    if (!allowedTypes.includes(file.type) && !validExtension) {
      setError("Please choose an MP3 or M4A audio file.");
      event.target.value = "";
      return;
    }

    if (!file.size || file.size > 30 * 1024 * 1024) {
      setError("Audio file must be non-empty and smaller than 30 MB.");
      event.target.value = "";
      return;
    }

    setAudioFile(file);
    setError("");
    setSuccess("");
  };

  const handleCoverChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setError("Cover must be JPG, PNG or WebP.");
      event.target.value = "";
      return;
    }

    if (!file.size || file.size > 10 * 1024 * 1024) {
      setError("Cover image must be non-empty and smaller than 10 MB.");
      event.target.value = "";
      return;
    }

    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
    setError("");
    setSuccess("");
  };

  const removeNewAudio = () => {
    setAudioFile(null);
    const input = document.getElementById("edit-song-audio");
    if (input) input.value = "";
  };

  const removeNewCover = () => {
    if (coverPreview) URL.revokeObjectURL(coverPreview);
    setCoverFile(null);
    setCoverPreview("");
    const input = document.getElementById("edit-song-cover");
    if (input) input.value = "";
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "0 MB";
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

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

      setTimeout(() => navigate("/admin/songs"), 900);
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

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-loading">Loading Song...</div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-form-header">
        <button
          type="button"
          className="admin-back-button"
          onClick={() => navigate("/admin/songs")}
          disabled={saving}
        >
          <FaArrowLeft /> Back
        </button>
        <div>
          <span>KEERTHANA ADMIN</span>
          <h1>Edit Song</h1>
          <p>Update only the song details you want to change.</p>
        </div>
      </div>

      {error && <div className="admin-error" role="alert">{error}</div>}
      {success && <div className="admin-success" role="status">{success}</div>}

      <form className="admin-song-form" onSubmit={handleSubmit} encType="multipart/form-data">
        <div className="admin-form-section">
          <div className="admin-form-section-title">
            <h2>Song Information</h2>
            <p>Existing song information is loaded automatically.</p>
          </div>

          <div className="admin-form-grid">
            <div className="admin-field">
              <label>Song Language *</label>
              <select name="language" value={form.language} onChange={handleChange} disabled={saving} required>
                {LANGUAGES.map((language) => (
                  <option key={language.value} value={language.value}>{language.label}</option>
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
              <SearchableDropdown
                options={artists}
                value={form.artist_id}
                onChange={(value) => handleRelationshipChange("artist_id", value)}
                placeholder="Select Artist"
                searchPlaceholder="Search artist in English or Telugu..."
                emptyText="No artists found."
                getLabel={(artist) => getEntityLabel(artist, "artist")}
                getSearchText={(artist) => `${artist.name_english || ""} ${artist.name_telugu || ""} ${artist.name || ""}`}
                disabled={saving}
              />
            </div>

            <div className="admin-field">
              <label>Album</label>
              <SearchableDropdown
                options={albums}
                value={form.album_id}
                onChange={(value) => handleRelationshipChange("album_id", value)}
                placeholder="No Album"
                searchPlaceholder="Search album in English or Telugu..."
                emptyText="No albums found."
                getLabel={(album) => getEntityLabel(album, "album")}
                getSearchText={(album) => `${album.title_english || ""} ${album.title_telugu || ""} ${album.title || ""} ${album.name || ""}`}
                disabled={saving}
                allowClear
              />
            </div>

            <div className="admin-field">
              <label>Category *</label>
              <SearchableDropdown
                options={categories}
                value={form.category_id}
                onChange={(value) => handleRelationshipChange("category_id", value)}
                placeholder="Select Category"
                searchPlaceholder="Search category in English or Telugu..."
                emptyText="No categories found."
                getLabel={(category) => getEntityLabel(category, "category")}
                getSearchText={(category) => `${category.name_english || ""} ${category.name_telugu || ""} ${category.name || ""}`}
                disabled={saving}
              />
            </div>

            <div className="admin-field">
              <label>Ministry</label>
              <SearchableDropdown
                options={ministries}
                value={form.ministry_id}
                onChange={(value) => handleRelationshipChange("ministry_id", value)}
                placeholder="No Ministry"
                searchPlaceholder="Search ministry in English or Telugu..."
                emptyText="No ministries found."
                getLabel={(ministry) => getEntityLabel(ministry, "ministry")}
                getSearchText={(ministry) => `${ministry.name_english || ""} ${ministry.name_telugu || ""} ${ministry.name || ""}`}
                disabled={saving}
                allowClear
              />
            </div>
          </div>
        </div>

        <div className="admin-form-section">
          <div className="admin-form-section-title">
            <h2>Media</h2>
            <p>Your existing files will be kept unless you select replacements.</p>
          </div>

          <div className="admin-upload-grid">
            <div className="admin-upload-box">
              <div className="admin-upload-icon"><FaMusic /></div>
              <h3>Audio File</h3>
              {existingAudio && <p className="admin-existing-media">Current audio is available</p>}
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
                  <label htmlFor="edit-song-audio" className="admin-upload-button">
                    <FaCloudUploadAlt /> Replace Audio
                  </label>
                </>
              ) : (
                <div className="admin-selected-file">
                  <div>
                    <strong>{audioFile.name}</strong>
                    <span>New audio • {formatFileSize(audioFile.size)}</span>
                  </div>
                  <button type="button" onClick={removeNewAudio} disabled={saving} aria-label="Remove selected audio">
                    <FaTimes />
                  </button>
                </div>
              )}
            </div>

            <div className="admin-upload-box">
              {coverPreview ? (
                <img className="admin-cover-preview" src={coverPreview} alt="New cover preview" />
              ) : existingCover ? (
                <img className="admin-cover-preview" src={getMediaUrl(existingCover)} alt="Current song cover" />
              ) : (
                <div className="admin-upload-icon"><FaImage /></div>
              )}
              <h3>Cover Image</h3>
              <p>{coverFile ? "New cover selected" : existingCover ? "Current cover" : "No current cover"}</p>
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
                  <label htmlFor="edit-song-cover" className="admin-upload-button">
                    <FaCloudUploadAlt /> {existingCover ? "Replace Cover" : "Add Cover"}
                  </label>
                </>
              ) : (
                <div className="admin-selected-file">
                  <div>
                    <strong>{coverFile.name}</strong>
                    <span>{formatFileSize(coverFile.size)}</span>
                  </div>
                  <button type="button" onClick={removeNewCover} disabled={saving} aria-label="Remove selected cover">
                    <FaTimes />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

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

        <div className="admin-form-actions">
          <button type="button" className="admin-cancel-button" disabled={saving} onClick={() => navigate("/admin/songs")}>
            Cancel
          </button>
          <button type="submit" className="admin-primary-button" disabled={saving}>
            <FaSave /> {saving ? "Saving..." : "Update Song"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default EditSong;
