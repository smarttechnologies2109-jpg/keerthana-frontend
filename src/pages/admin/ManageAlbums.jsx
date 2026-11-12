
import { useEffect, useMemo, useRef, useState } from "react";

import {
  FaCompactDisc,
  FaEdit,
  FaPlus,
  FaSearch,
  FaTimes,
  FaTrash,
  FaImage,
} from "react-icons/fa";

import API from "../../services/api";
import { getMediaUrl } from "../../utils/media";

import "../../assets/css/admin/manageAlbums.css";

// =====================================================
// LANGUAGES
// =====================================================

const LANGUAGES = [
  { value: "Telugu", label: "తెలుగు" },
  { value: "Hindi", label: "हिन्दी" },
  { value: "English", label: "English" },
  { value: "Malayalam", label: "മലയാളം" },
  { value: "Kannada", label: "ಕನ್ನಡ" },
  { value: "Tamil", label: "தமிழ்" },
];

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

// =====================================================
// HELPER FUNCTIONS
// =====================================================

const getEnglishTitle = (album) =>
  album?.title_english || album?.title || "";

const getTeluguTitle = (album) =>
  album?.title_telugu || album?.title || "";

// =====================================================
// COMPONENT
// =====================================================

function ManageAlbums() {
  // ===================================================
  // DATA
  // ===================================================

  const [albums, setAlbums] = useState([]);

  // ===================================================
  // PAGE STATE
  // ===================================================

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");

  // ===================================================
  // MODAL
  // ===================================================

  const [showForm, setShowForm] = useState(false);
  const [editingAlbum, setEditingAlbum] = useState(null);

  // ===================================================
  // FORM
  // ===================================================

  const initialForm = {
    title_english: "",
    title_telugu: "",
    language: "Telugu",
    release_year: "",
    cover_url: "",
  };

  const [form, setForm] = useState(initialForm);

  // ===================================================
  // COVER IMAGE
  // ===================================================

  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const errorMessageRef = useRef(null);

  // Automatically bring validation/API errors into view inside the modal.
  useEffect(() => {
    if (!error || !showForm || !errorMessageRef.current) return;

    requestAnimationFrame(() => {
      errorMessageRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    });
  }, [error, showForm]);

  // ===================================================
  // IMAGE PREVIEW CLEANUP
  // ===================================================

  useEffect(() => {
    return () => {
      if (coverPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(coverPreview);
      }
    };
  }, [coverPreview]);

  // ===================================================
  // CLEAR IMAGE PREVIEW
  // ===================================================

  const clearCoverPreview = () => {
    if (coverPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(coverPreview);
    }

    setCoverPreview(null);
  };

  // ===================================================
  // GET COVER URL
  // ===================================================

  const getCover = (coverUrl) => {
    if (!coverUrl || typeof coverUrl !== "string") return "";

    try {
      // Keep absolute URLs and data/blob URLs intact; normalize stored S3 keys
      // through the shared media utility.
      if (/^(https?:|data:|blob:)/i.test(coverUrl)) return coverUrl;
      return getMediaUrl(coverUrl) || "";
    } catch (error) {
      console.error("Album cover URL error:", error);
      return "";
    }
  };

  // ===================================================
  // LOAD DATA
  // ===================================================

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const albumsResponse = await API.get("/admin/albums");
      setAlbums(albumsResponse.data?.albums || []);
    } catch (error) {
      console.error("Load albums error:", error);

      setError(
        error.response?.data?.message ||
          "Unable to load albums."
      );
    } finally {
      setLoading(false);
    }
  };

  // ===================================================
  // INITIAL LOAD
  // ===================================================

  useEffect(() => {
    loadData();
  }, []);

  // ===================================================
  // OPEN ADD
  // ===================================================

  const openAdd = () => {
    setEditingAlbum(null);

    setCoverFile(null);
    clearCoverPreview();

    setForm({ ...initialForm });

    setError("");
    setSuccess("");
    setShowForm(true);
  };

  // ===================================================
  // OPEN EDIT
  // ===================================================

  const openEdit = (album) => {
    setEditingAlbum(album);

    setCoverFile(null);
    clearCoverPreview();

    setCoverPreview(
      getCover(album.cover_url)
    );

    setForm({
      title_english: getEnglishTitle(album),
      title_telugu: getTeluguTitle(album),
      language: album.language || "Telugu",
      release_year: album.release_year
        ? String(album.release_year)
        : "",
      cover_url: album.cover_url || "",
    });

    setError("");
    setSuccess("");
    setShowForm(true);
  };

  // ===================================================
  // CLOSE FORM
  // ===================================================

  const closeForm = () => {
    if (saving) return;

    setShowForm(false);
    setEditingAlbum(null);

    setCoverFile(null);
    clearCoverPreview();

    setForm({ ...initialForm });

    setError("");
  };

  // ===================================================
  // INPUT CHANGE
  // ===================================================

  const handleChange = (event) => {
    const { name, value } = event.target;

    if (name === "language") {
      setForm((previous) => ({
        ...previous,
        language: value,
          }));

      return;
    }

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // ===================================================
  // COVER IMAGE CHANGE
  // ===================================================

  const handleCoverChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setError(
        "Only JPG, PNG or WebP images are allowed."
      );

      event.target.value = "";
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setError(
        "Cover image must be smaller than 5 MB."
      );

      event.target.value = "";
      return;
    }

    setError("");

    clearCoverPreview();

    setCoverFile(file);

    const previewUrl = URL.createObjectURL(file);

    setCoverPreview(previewUrl);
  };

  // ===================================================
  // SAVE ALBUM
  // ===================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    const englishTitle = form.title_english.trim();
    const teluguTitle = form.title_telugu.trim();

    if (!englishTitle) {
      setError("English album title is required.");
      return;
    }

    if (!teluguTitle) {
      setError("Telugu album title is required.");
      return;
    }

    // DUPLICATE ALBUM TITLE VALIDATION
    // Normalize Unicode, ignore case, and collapse extra spaces.
    const normalizeAlbumTitle = (value) =>
      String(value || "")
        .normalize("NFKC")
        .trim()
        .replace(/\s+/g, " ")
        .toLocaleLowerCase();

    const currentAlbumId = editingAlbum?.id;

    const duplicateEnglish = albums.some((album) => {
      if (
        currentAlbumId != null &&
        String(album.id) === String(currentAlbumId)
      ) {
        return false;
      }

      const existingEnglish =
        album.title_english || album.titleEnglish || album.title || "";

      return (
        normalizeAlbumTitle(existingEnglish) ===
        normalizeAlbumTitle(englishTitle)
      );
    });

    if (duplicateEnglish) {
      setError(
        `The English album title "${englishTitle}" already exists. Please use a unique title.`
      );
      return;
    }

    const duplicateTelugu = albums.some((album) => {
      if (
        currentAlbumId != null &&
        String(album.id) === String(currentAlbumId)
      ) {
        return false;
      }

      const existingTelugu =
        album.title_telugu || album.titleTelugu || album.title || "";

      return (
        normalizeAlbumTitle(existingTelugu) ===
        normalizeAlbumTitle(teluguTitle)
      );
    });

    if (duplicateTelugu) {
      setError(
        `The Telugu album title "${teluguTitle}" already exists. Please use a unique title.`
      );
      return;
    }

    const validLanguage = LANGUAGES.some(
      (language) =>
        language.value === form.language
    );

    if (!validLanguage) {
      setError("Please select a valid album language.");
      return;
    }

    if (form.release_year) {
      const year = Number(form.release_year);

      if (
        !Number.isInteger(year) ||
        year < 1900 ||
        year > 2100
      ) {
        setError("Please enter a valid release year.");
        return;
      }
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const formData = new FormData();

      // Bilingual album names
      formData.append("title_english", englishTitle);
      formData.append("title_telugu", teluguTitle);

      // Backward compatibility:
      // Keep the existing title column populated with Telugu.
      formData.append("title", teluguTitle);

      formData.append("language", form.language);
      formData.append("release_year", form.release_year || "");

      // Upload only when a new image is selected.
      if (coverFile) {
        formData.append("cover", coverFile);
      }

      // UPDATE
      if (editingAlbum) {
        await API.put(
          `/admin/albums/${editingAlbum.id}`,
          formData
        );

        setSuccess("Album updated successfully!");
      }

      // CREATE
      else {
        await API.post(
          "/admin/albums",
          formData
        );

        setSuccess("Album created successfully!");
      }

      await loadData();

      setShowForm(false);
      setEditingAlbum(null);
      setCoverFile(null);
      clearCoverPreview();

      setForm({ ...initialForm });
    } catch (error) {
      console.error("Save album error:", error);

      setError(
        error.response?.data?.message ||
          "Unable to save album."
      );
    } finally {
      setSaving(false);
    }
  };

  // ===================================================
  // DELETE ALBUM
  // ===================================================

  const handleDelete = async (album) => {
    const confirmed = window.confirm(
      `Delete album "${getEnglishTitle(album)} / ${getTeluguTitle(album)}"?`
    );

    if (!confirmed) return;

    try {
      setDeletingId(album.id);
      setError("");
      setSuccess("");

      await API.delete(
        `/admin/albums/${album.id}`
      );

      setAlbums((previous) =>
        previous.filter(
          (item) => item.id !== album.id
        )
      );

      setSuccess("Album deleted successfully!");
    } catch (error) {
      console.error("Delete album error:", error);

      setError(
        error.response?.data?.message ||
          "Unable to delete album."
      );
    } finally {
      setDeletingId(null);
    }
  };

  // ===================================================
  // SEARCH + ALPHABETICAL ORDER (A-Z)
  // ===================================================

  const filteredAlbums = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();

    return [...albums]
      .filter((album) => {
        if (!query) return true;

        return [
          album.title,
          album.title_english,
          album.title_telugu,
          album.language,
          album.release_year,
        ]
          .filter(Boolean)
          .some((value) =>
            String(value).toLocaleLowerCase().includes(query)
          );
      })
      .sort((a, b) => {
        const titleA =
          a.title_english || a.titleEnglish || a.title || a.title_telugu || "";
        const titleB =
          b.title_english || b.titleEnglish || b.title || b.title_telugu || "";

        return String(titleA).localeCompare(String(titleB), "en", {
          sensitivity: "base",
          numeric: true,
        });
      });
  }, [albums, search]);

  // ===================================================
  // LANGUAGE LABEL
  // ===================================================

  const getLanguageLabel = (value) => {
    return (
      LANGUAGES.find(
        (language) => language.value === value
      )?.label || value || "—"
    );
  };

  // ===================================================
  // ALBUM DISPLAY
  // ===================================================

  const getAlbumDisplay = (album) => {
    const english = getEnglishTitle(album);
    const telugu = getTeluguTitle(album);

    return {
      english,
      telugu,
    };
  };

  // ===================================================
  // LOADING
  // ===================================================

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-loading">
          Loading Albums...
        </div>
      </div>
    );
  }

  // ===================================================
  // UI
  // ===================================================

  return (
    <div className="admin-page">

      {/* HEADER */}

      <div className="admin-header">
        <div>
          <span>KEERTHANA ADMIN</span>

          <h1>Manage Albums</h1>

          <p>
            Create and manage Christian music albums.
          </p>
        </div>

        <button
          type="button"
          className="admin-primary-button"
          onClick={openAdd}
        >
          <FaPlus />
          Add Album
        </button>
      </div>

      {/* MESSAGES */}

      {!showForm && error && (
        <div className="admin-error" role="alert">
          {error}
        </div>
      )}

      {!showForm && success && (
        <div className="admin-success">
          {success}
        </div>
      )}

      {/* SEARCH */}

      <div className="admin-song-toolbar">
        <div className="admin-song-search">
          <FaSearch />

          <input
            type="text"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search English or Telugu album titles..."
            aria-label="Search albums"
          />

          {search && (
            <button
              type="button"
              className="admin-album-search-clear"
              onClick={() => setSearch("")}
              aria-label="Clear album search"
              title="Clear search"
            >
              <FaTimes />
            </button>
          )}
        </div>

        <div className="admin-song-count">
          <FaCompactDisc />

          <span>
            {filteredAlbums.length}{" "}
            {filteredAlbums.length === 1
              ? "Album"
              : "Albums"}
          </span>
        </div>
      </div>

      {/* ALBUM TABLE */}

      {filteredAlbums.length === 0 ? (
        <div className="admin-empty-state">
          <FaCompactDisc />

          <h2>{search ? "No Matching Albums" : "No Albums Found"}</h2>

          <p>
            {search
              ? "Try another search."
              : "Create your first KEERTHANA album."}
          </p>

          {!search && (
            <button
              type="button"
              className="admin-primary-button"
              onClick={openAdd}
            >
              <FaPlus />
              Add Album
            </button>
          )}
        </div>
      ) : (
        <div className="admin-table-wrapper">
          <table className="admin-song-table">

            <thead>
              <tr>
                <th className="admin-album-number-column">No.</th>
                <th>Album</th>
                <th>Language</th>
                <th>Release Year</th>
                <th>Songs</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredAlbums.map((album, index) => {
                const albumNames = getAlbumDisplay(album);
                const coverSrc = getCover(album.cover_url);

                return (
                  <tr key={album.id}>
                    <td className="admin-album-number">
                      {String(index + 1).padStart(2, "0")}
                    </td>

                    {/* ALBUM */}

                    <td>
                      <div className="admin-album-cell">

                        <div className="admin-album-cover">
                          {coverSrc && (
                            <img
                              src={coverSrc}
                              alt={albumNames.english}
                              onError={(event) => {
                                console.error(
                                  "Album cover failed to load:",
                                  coverSrc
                                );
                                event.currentTarget.style.display = "none";
                              }}
                            />
                          )}
                        </div>

                        <div className="admin-album-names">
                          <strong>
                            {albumNames.english || "—"}
                          </strong>

                          <span>
                            {albumNames.telugu || "—"}
                          </span>
                        </div>

                      </div>
                    </td>

                    {/* LANGUAGE */}

                    <td>
                      {getLanguageLabel(album.language)}
                    </td>

                    {/* YEAR */}

                    <td>
                      {album.release_year || "—"}
                    </td>

                    {/* SONG COUNT */}

                    <td>
                      {album.song_count ?? 0}
                    </td>

                    {/* ACTIONS */}

                    <td>
                      <div className="admin-table-actions">

                        <button
                          type="button"
                          className="admin-action-button edit"
                          title="Edit Album"
                          onClick={() => openEdit(album)}
                        >
                          <FaEdit />
                        </button>

                        <button
                          type="button"
                          className="admin-action-button delete"
                          title="Delete Album"
                          disabled={deletingId === album.id}
                          onClick={() => handleDelete(album)}
                        >
                          <FaTrash />
                        </button>

                      </div>
                    </td>

                  </tr>
                );
              })}
            </tbody>

          </table>
        </div>
      )}

      {/* ADD / EDIT MODAL */}

      {showForm && (
        <div className="admin-modal-overlay">

          <div className="admin-modal">

            {/* HEADER */}

            <div className="admin-modal-header">
              <div>
                <span>KEERTHANA ADMIN</span>

                <h2>
                  {editingAlbum
                    ? "Edit Album"
                    : "Add Album"}
                </h2>
              </div>

              <button
                type="button"
                className="admin-modal-close"
                onClick={closeForm}
                disabled={saving}
              >
                <FaTimes />
              </button>
            </div>

            {/* FORM */}

            {error && (
              <div
                ref={errorMessageRef}
                className="album-form-error"
                role="alert"
                aria-live="assertive"
                tabIndex={-1}
              >
                <strong>Unable to save album</strong>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>

              {/* LANGUAGE */}

              <div className="admin-field">
                <label>Album Language *</label>

                <select
                  name="language"
                  value={form.language}
                  onChange={handleChange}
                  required
                >
                  {LANGUAGES.map((language) => (
                    <option
                      key={language.value}
                      value={language.value}
                    >
                      {language.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* ENGLISH TITLE */}

              <div className="admin-field">
                <label>Album Title (English) *</label>

                <input
                  type="text"
                  name="title_english"
                  value={form.title_english}
                  onChange={handleChange}
                  placeholder="Enter album title in English"
                  maxLength={255}
                  required
                />
              </div>

              {/* TELUGU TITLE */}

              <div className="admin-field">
                <label>Album Title (Telugu) *</label>

                <input
                  type="text"
                  name="title_telugu"
                  value={form.title_telugu}
                  onChange={handleChange}
                  placeholder="ఆల్బమ్ పేరు తెలుగులో నమోదు చేయండి"
                  maxLength={255}
                  required
                />
              </div>

              {/* RELEASE YEAR */}

              <div className="admin-field">
                <label>Release Year</label>

                <input
                  type="number"
                  name="release_year"
                  min="1900"
                  max="2100"
                  value={form.release_year}
                  onChange={handleChange}
                  placeholder="2026"
                />
              </div>

              {/* COVER IMAGE */}

              <div className="admin-field">
                <label>Album Cover</label>

                <div className="album-cover-upload">

                  {/* PREVIEW */}

                  <div className="album-cover-upload-preview">
                    {coverPreview && (
                      <img
                        src={coverPreview}
                        alt="Album cover preview"
                        onError={(event) => {
                          event.currentTarget.style.display =
                            "none";
                        }}
                      />
                    )}
                  </div>

                  {/* UPLOAD DETAILS */}

                  <div className="album-cover-upload-content">

                    <div className="album-cover-upload-icon">
                      <FaImage />
                    </div>

                    <strong>
                      Upload Album Cover
                    </strong>

                    <span>JPG, PNG, WEBP</span>

                    <span>Maximum 5 MB</span>

                    <label className="admin-primary-button album-cover-select">
                      <FaImage />
                      Choose Image

                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleCoverChange}
                        disabled={saving}
                        hidden
                      />
                    </label>

                  </div>
                </div>

                <div className="album-cover-file-name">
                  {coverFile
                    ? coverFile.name
                    : editingAlbum?.cover_url
                      ? "Current image"
                      : "No image selected"}
                </div>

                <small>
                  Cover image is optional. No default image will be used.
                </small>
              </div>

              {/* ACTIONS */}

              <div className="admin-form-actions">

                <button
                  type="button"
                  className="admin-cancel-button"
                  disabled={saving}
                  onClick={closeForm}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="admin-primary-button"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingAlbum
                      ? "Update Album"
                      : "Add Album"}
                </button>

              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}

export default ManageAlbums;
