
import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  useMemo,
} from "react";

import {
  FaChurch,
  FaPlus,
  FaTimes,
  FaSave,
  FaUpload,
  FaExclamationCircle,
  FaSyncAlt,
  FaEdit,
  FaTrash,
  FaSearch,
} from "react-icons/fa";

import API from "../../services/api";
import "../../assets/css/admin/manageMinistries.css";
import AdminSidebar from "../../components/admin/AdminSidebar";

// =========================================================
// SUPPORTED LANGUAGES
// =========================================================

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

// =========================================================
// HELPERS
// =========================================================

const getMinistryImage = (ministry) =>
  ministry?.image_url ||
  ministry?.imageUrl ||
  ministry?.cover_url ||
  ministry?.image ||
  "";

// =========================================================
// COMPONENT
// =========================================================

function ManageMinistries() {
  const [saving, setSaving] = useState(false);
  const [loadingMinistries, setLoadingMinistries] = useState(true);
  const [ministries, setMinistries] = useState([]);
  const [search, setSearch] = useState("");

  const [error, setError] = useState("");
  const [listError, setListError] = useState("");
  const [success, setSuccess] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  const imageInputRef = useRef(null);
  const previewUrlRef = useRef("");
  const errorRef = useRef(null);

  const [form, setForm] = useState({
    // Keep name as the legacy Telugu name for backward compatibility.
    name: "",
    name_english: "",
    name_telugu: "",
    description: "",
    image_url: "",
    language: "",
  });

  // =======================================================
  // FETCH MINISTRIES
  // =======================================================

  const fetchMinistries = useCallback(async () => {
    try {
      setLoadingMinistries(true);
      setListError("");

      const response = await API.get("/ministries");
      const data = response.data;

      let ministryList = [];

      if (Array.isArray(data)) {
        ministryList = data;
      } else if (Array.isArray(data?.ministries)) {
        ministryList = data.ministries;
      } else if (Array.isArray(data?.data)) {
        ministryList = data.data;
      } else if (Array.isArray(data?.data?.ministries)) {
        ministryList = data.data.ministries;
      } else if (Array.isArray(data?.results)) {
        ministryList = data.results;
      }

      setMinistries(ministryList);
    } catch (err) {
      console.error("Fetch ministries error:", err);

      setListError(
        err.response?.data?.message ||
        "Unable to load ministries. Please try again."
      );
    } finally {
      setLoadingMinistries(false);
    }
  }, []);

  useEffect(() => {
    fetchMinistries();
  }, [fetchMinistries]);

  // =======================================================
  // IMAGE PREVIEW CLEANUP
  // =======================================================

  const clearImagePreview = () => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = "";
    }
  };

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  // =======================================================
  // RESET FORM
  // =======================================================

  const resetForm = useCallback(() => {
    clearImagePreview();

    setForm({
      name: "",
      name_english: "",
      name_telugu: "",
      description: "",
      image_url: "",
      language: "",
    });

    setEditingId(null);
    setImageFile(null);
    setImagePreview("");
    setError("");
    setShowForm(false);

    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  }, []);

  // =======================================================
  // CLOSE POPUP WITH ESCAPE KEY
  // =======================================================

  useEffect(() => {
    if (!showForm) return undefined;

    const handleEscape = (event) => {
      if (event.key === "Escape" && !saving) {
        resetForm();
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [showForm, saving, resetForm]);

  // =======================================================
  // AUTO SCROLL TO ERROR
  // =======================================================

  useEffect(() => {
    if (error && showForm && errorRef.current) {
      errorRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });

      errorRef.current.focus({
        preventScroll: true,
      });
    }
  }, [error, showForm]);

  // =======================================================
  // INPUT CHANGE
  // =======================================================

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  };

  // =======================================================
  // IMAGE SELECTION
  // =======================================================

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setError("");
    setSuccess("");

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setError(
        "Invalid image format. Please select a JPG, PNG or WEBP image."
      );

      event.target.value = "";
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setError("Image size must be less than 5 MB.");

      event.target.value = "";
      return;
    }

    clearImagePreview();

    const previewUrl = URL.createObjectURL(file);

    previewUrlRef.current = previewUrl;

    setImageFile(file);
    setImagePreview(previewUrl);
  };

  // =======================================================
  // OPEN ADD MINISTRY POPUP
  // =======================================================

  const handleAdd = () => {
    resetForm();
    setError("");
    setSuccess("");
    setShowForm(true);
  };

  // =======================================================
  // OPEN EDIT MINISTRY POPUP
  // =======================================================

  const handleEdit = (ministry) => {
    const id = ministry.id || ministry.ministry_id;

    if (!id) {
      setListError("This ministry does not have a valid ID.");
      return;
    }

    clearImagePreview();

    const existingImage = getMinistryImage(ministry);

    setEditingId(id);

    setForm({
      // Fall back to the legacy name for categories created before bilingual support.
      name: ministry.name_telugu || ministry.name || "",
      name_english:
        ministry.name_english || ministry.nameEnglish || ministry.name || "",
      name_telugu:
        ministry.name_telugu || ministry.nameTelugu || ministry.name || "",
      description: ministry.description || "",
      image_url: existingImage,
      language: ministry.language || "",
    });

    setImageFile(null);
    setImagePreview(existingImage);

    setError("");
    setSuccess("");
    setListError("");

    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }

    setShowForm(true);
  };

  // =======================================================
  // SAVE / UPDATE MINISTRY
  // =======================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (saving) return;

    setError("");
    setSuccess("");

    const cleanEnglishName = form.name_english.trim();
    const cleanTeluguName = form.name_telugu.trim();

    // BILINGUAL MINISTRY NAME VALIDATION
    if (!cleanEnglishName) {
      setError("English ministry name is required.");
      return;
    }

    if (!cleanTeluguName) {
      setError("దయచేసి తెలుగు మినిస్ట్రీ పేరు నమోదు చేయండి.");
      return;
    }

    // LANGUAGE VALIDATION
    const validLanguage = LANGUAGES.some(
      (language) => language.value === form.language
    );

    if (!validLanguage) {
      setError("Please select a ministry language.");
      return;
    }

    const isEditing = Boolean(editingId);

    try {
      setSaving(true);

      const formData = new FormData();

      // Keep the legacy name field populated for existing backend consumers.
      formData.append("name", cleanTeluguName);
      formData.append("name_english", cleanEnglishName);
      formData.append("name_telugu", cleanTeluguName);
      formData.append(
        "description",
        form.description.trim()
      );
      formData.append("language", form.language);

      if (imageFile) {
        formData.append("image", imageFile);
      }

      let response;

      if (isEditing) {
        response = await API.put(
          `/admin/ministries/${editingId}`,
          formData
        );
      } else {
        response = await API.post(
          "/admin/ministries",
          formData
        );
      }

      setSuccess(
        response.data?.message ||
        (isEditing
          ? "Ministry updated successfully."
          : "Ministry added successfully.")
      );

      resetForm();

      await fetchMinistries();

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (err) {
      console.error("Save ministry error:", err);

      const status = err.response?.status;

      const backendError =
        err.response?.data?.error ||
        err.response?.data?.message;

      let message =
        backendError ||
        err.message ||
        "Failed to save ministry. Please try again.";

      if (status === 400) {
        message =
          backendError ||
          "Invalid ministry details. Please check your information.";
      } else if (status === 401) {
        message =
          "Your session has expired. Please log in again.";
      } else if (status === 403) {
        message =
          "You do not have permission to manage ministries.";
      } else if (status === 413) {
        message =
          "The uploaded image is too large. Maximum size is 5 MB.";
      } else if (status >= 500) {
        message =
          backendError ||
          "Server error while saving ministry. Please try again.";
      }

      if (err.response?.data?.failedStep) {
        message =
          `${err.response.data.failedStep}: ${message}`;
      }

      setError(message);
    } finally {
      setSaving(false);
    }
  };

  // =======================================================
  // DELETE MINISTRY
  // =======================================================

  const handleDelete = async (ministry) => {
    const id = ministry.id || ministry.ministry_id;

    if (!id) {
      setListError("This ministry does not have a valid ID.");
      return;
    }

    const ministryName =
      ministry.name_english || ministry.name || "this ministry";

    const confirmed = window.confirm(
      `Are you sure you want to delete "${ministryName}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      setDeletingId(id);
      setListError("");
      setSuccess("");

      const response = await API.delete(
        `/admin/ministries/${id}`
      );

      setMinistries((previous) =>
        previous.filter(
          (item) =>
            String(item.id || item.ministry_id) !== String(id)
        )
      );

      setSuccess(
        response.data?.message ||
        "Ministry deleted successfully."
      );

      if (String(editingId) === String(id)) {
        resetForm();
      }
    } catch (err) {
      console.error("Delete ministry error:", err);

      setListError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Failed to delete ministry. Please try again."
      );
    } finally {
      setDeletingId(null);
    }
  };

  // =======================================================
  // SEARCH + ALPHABETICAL SORT (A-Z)
  // =======================================================

  const filteredMinistries = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();

    const matchingMinistries = ministries.filter((ministry) => {
      if (!query) return true;

      const searchableValues = [
        ministry.name_english,
        ministry.nameEnglish,
        ministry.name_telugu,
        ministry.nameTelugu,
        ministry.name,
        ministry.description,
        ministry.language,
      ];

      return searchableValues
        .filter(Boolean)
        .some((value) =>
          String(value).toLocaleLowerCase().includes(query)
        );
    });

    return [...matchingMinistries].sort((a, b) => {
      const nameA = String(
        a.name_english || a.nameEnglish || a.name || a.name_telugu || ""
      ).trim();
      const nameB = String(
        b.name_english || b.nameEnglish || b.name || b.name_telugu || ""
      ).trim();

      return nameA.localeCompare(nameB, "en", {
        sensitivity: "base",
        numeric: true,
      });
    });
  }, [ministries, search]);

  // MINISTRY IMAGE DISPLAY - NO DEFAULT IMAGE
  // =======================================================

  const renderMinistryImage = (imageUrl, altText) => {
    if (!imageUrl) return null;

    return (
      <img
        src={imageUrl}
        alt={altText}
        onError={(event) => {
          event.currentTarget.style.display = "none";
        }}
      />
    );
  };

  // =======================================================
  // RENDER
  // =======================================================

  return (
    <div className="admin-ministries-page">

      <AdminSidebar />

      <div className="admin-ministries-main">

        {/* PAGE HEADER */}

        <div className="admin-ministries-header">

          <div className="admin-ministries-title">

            <div className="admin-ministries-title-icon">
              <FaChurch />
            </div>

            <div>
              <h1>Ministries</h1>
              <p>Create and manage song ministries.</p>
            </div>

          </div>

          <button
            type="button"
            className="admin-ministry-add-button"
            onClick={handleAdd}
            disabled={saving}
          >
            <FaPlus />
            <span>Add Ministry</span>
          </button>

        </div>

        {/* SUCCESS MESSAGE */}

        {success && (
          <div
            className="admin-ministry-alert success"
            role="status"
          >
            {success}
          </div>
        )}

        {/* MINISTRY LIST */}

        <div className="admin-ministry-list-section">

          <div className="admin-ministry-list-header">

            <div>
              <h2>All Ministries</h2>
              <p>Manage your available song ministries.</p>
            </div>

            <div className="admin-ministry-list-actions">

              <span className="admin-ministry-count">
                {filteredMinistries.length}{" "}
                {filteredMinistries.length === 1 ? "Ministry" : "Ministries"}
              </span>

              <button
                type="button"
                className="admin-ministry-refresh-button"
                onClick={fetchMinistries}
                disabled={loadingMinistries}
                title="Refresh ministries"
              >
                <FaSyncAlt
                  className={
                    loadingMinistries ? "ministry-spinning" : ""
                  }
                />
                Refresh
              </button>

            </div>

          </div>

          {/* MINISTRY SEARCH */}
          <div className="admin-ministry-search">
            <FaSearch aria-hidden="true" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search ministries by English name, Telugu name, or language..."
              aria-label="Search ministries"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Clear ministry search"
                title="Clear search"
              >
                <FaTimes />
              </button>
            )}
          </div>

          {/* LIST ERROR */}

          {listError && (
            <div className="admin-ministry-alert error">
              <FaExclamationCircle />
              <span>{listError}</span>

              <button
                type="button"
                onClick={fetchMinistries}
              >
                Retry
              </button>
            </div>
          )}

          {/* LOADING */}

          {loadingMinistries ? (

            <div className="admin-ministry-loading">
              <FaSyncAlt className="ministry-spinning" />
              <p>Loading ministries...</p>
            </div>

          ) : filteredMinistries.length === 0 ? (

            <div className="admin-ministry-empty">

              <div className="admin-ministry-empty-icon">
                <FaChurch />
              </div>

              <h3>
                {search ? "No Matching Ministries" : "No Ministries Found"}
              </h3>

              <p>
                {search
                  ? "Try another ministry name, Telugu name, or language."
                  : "No ministries have been added yet. Click Add Ministry to create your first ministry."}
              </p>

              {!search && (
                <button
                  type="button"
                  className="admin-ministry-add-button"
                  onClick={handleAdd}
                >
                  <FaPlus />
                  Add Your First Ministry
                </button>
              )}

            </div>

          ) : (

            <div className="admin-ministry-table-wrapper">
              <table className="admin-ministry-table">
                <thead>
                  <tr>
                    <th className="admin-ministry-number-heading">No.</th>
                    <th>Image</th>
                    <th>Ministry Name (English)</th>
                    <th>మినిస్ట్రీ పేరు (తెలుగు)</th>
                    <th>Language</th>
                    <th>Description</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredMinistries.map((ministry, index) => {
                    const ministryId =
                      ministry.id || ministry.ministry_id || `ministry-${index}`;

                    const imageUrl = getMinistryImage(ministry);
                    const englishName =
                      ministry.name_english ||
                      ministry.nameEnglish ||
                      ministry.name ||
                      "Untitled Ministry";
                    const teluguName =
                      ministry.name_telugu ||
                      ministry.nameTelugu ||
                      ministry.name ||
                      "-";

                    return (
                      <tr key={ministryId}>
                        <td className="admin-ministry-number">
                          {String(index + 1).padStart(2, "0")}
                        </td>

                        <td>
                          <div className="admin-ministry-table-image">
                            {imageUrl &&
                              renderMinistryImage(imageUrl, englishName)}
                          </div>
                        </td>

                        <td>
                          <strong className="admin-ministry-table-english">
                            {englishName}
                          </strong>
                        </td>

                        <td>
                          <strong className="admin-ministry-table-telugu">
                            {teluguName}
                          </strong>
                        </td>

                        <td>
                          <span className="admin-ministry-table-language">
                            {ministry.language || "Not specified"}
                          </span>
                        </td>

                        <td className="admin-ministry-table-description">
                          {ministry.description?.trim() ||
                            "No description available."}
                        </td>

                        <td>
                          <div className="admin-ministry-table-actions">
                            <button
                              type="button"
                              className="admin-ministry-edit-button"
                              onClick={() => handleEdit(ministry)}
                              disabled={saving || deletingId !== null}
                              title="Edit ministry"
                              aria-label={`Edit ${englishName}`}
                            >
                              <FaEdit />
                              <span>Edit</span>
                            </button>

                            <button
                              type="button"
                              className="admin-ministry-delete-button"
                              onClick={() => handleDelete(ministry)}
                              disabled={saving || deletingId !== null}
                              title="Delete ministry"
                              aria-label={`Delete ${englishName}`}
                            >
                              <FaTrash />
                              <span>
                                {String(deletingId) === String(ministryId)
                                  ? "Deleting..."
                                  : "Delete"}
                              </span>
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

        </div>

      </div>

      {/* ADD / EDIT POPUP MODAL */}

      {showForm && (

        <div
          className="admin-ministry-modal-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !saving
            ) {
              resetForm();
            }
          }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            background: "rgba(3, 8, 20, 0.78)",
            backdropFilter: "blur(8px)",
            overflowY: "auto",
          }}
        >

          <div
            className="admin-ministry-form-card admin-ministry-modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ministry-modal-title"
            onMouseDown={(event) => event.stopPropagation()}
            style={{
              position: "relative",
              width: "100%",
              maxWidth: "680px",
              maxHeight: "calc(100vh - 40px)",
              overflowY: "auto",
              margin: "auto",
              background: "#101a2d",
              border: "1px solid rgba(201, 168, 92, 0.35)",
              borderRadius: "18px",
              boxShadow: "0 24px 80px rgba(0,0,0,0.5)",
              padding: "24px",
              color: "#ffffff",
            }}
          >

            {/* POPUP HEADER */}

            <div className="admin-ministry-form-header">

              <div>
                <h2 id="ministry-modal-title">
                  {editingId ? "Edit Ministry" : "Add New Ministry"}
                </h2>

                <p>
                  Enter the ministry information below.
                </p>
              </div>

              <button
                type="button"
                className="admin-ministry-close-button"
                onClick={resetForm}
                disabled={saving}
                aria-label="Close popup"
              >
                <FaTimes />
              </button>

            </div>

            {/* ERROR MESSAGE */}

            {error && (
              <div
                ref={errorRef}
                className="admin-ministry-alert error admin-ministry-form-error"
                role="alert"
                aria-live="assertive"
                tabIndex={-1}
              >
                <FaExclamationCircle />
                <span>{error}</span>
              </div>
            )}

            {/* FORM */}

            <form
              onSubmit={handleSubmit}
              className="admin-ministry-form"
              encType="multipart/form-data"
            >

              {/* ENGLISH MINISTRY NAME */}

              <div className="admin-ministry-field">

                <label htmlFor="ministry-name-english">
                  Ministry Name (English) <span>*</span>
                </label>

                <input
                  id="ministry-name-english"
                  type="text"
                  name="name_english"
                  value={form.name_english}
                  onChange={handleChange}
                  placeholder="Example: Hosanna Ministries"
                  maxLength={255}
                  required
                  disabled={saving}
                />

              </div>

              {/* TELUGU MINISTRY NAME */}

              <div className="admin-ministry-field">

                <label htmlFor="ministry-name-telugu">
                  మినిస్ట్రీ పేరు (తెలుగు) <span>*</span>
                </label>

                <input
                  id="ministry-name-telugu"
                  type="text"
                  name="name_telugu"
                  value={form.name_telugu}
                  onChange={handleChange}
                  placeholder="ఉదాహరణ: హోసన్నా మినిస్ట్రీ"
                  maxLength={255}
                  required
                  disabled={saving}
                />

              </div>

              {/* LANGUAGE SELECT */}

              <div className="admin-ministry-field">

                <label htmlFor="ministry-language">
                  Select Ministry Language <span>*</span>
                </label>

                <select
                  id="ministry-language"
                  name="language"
                  value={form.language}
                  onChange={handleChange}
                  required
                  disabled={saving}
                >

                  <option value="" disabled>
                    -- Select Language --
                  </option>

                  {LANGUAGES.map((language) => (
                    <option
                      key={language.value}
                      value={language.value}
                    >
                      {language.label} ({language.value})
                    </option>
                  ))}

                </select>

                <small>
                  Select the language for this ministry.
                </small>

              </div>

              {/* DESCRIPTION */}

              <div className="admin-ministry-field">

                <label htmlFor="ministry-description">
                  Description
                </label>

                <textarea
                  id="ministry-description"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Enter ministry description..."
                  rows={4}
                  disabled={saving}
                />

              </div>

              {/* IMAGE UPLOAD */}

              <div className="admin-ministry-field">

                <label htmlFor="ministry-image">
                  Ministry Image
                </label>

                <div className="admin-ministry-upload-box">

                  <input
                    ref={imageInputRef}
                    id="ministry-image"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleImageChange}
                    disabled={saving}
                  />

                  <label
                    htmlFor="ministry-image"
                    className="admin-ministry-upload-button"
                  >
                    <FaUpload />
                    <span>Browse Image</span>
                  </label>

                  <small>
                    PNG, JPG, JPEG or WEBP.
                    Maximum 5 MB.
                  </small>

                  {imageFile && (
                    <small>
                      Selected: {imageFile.name}
                    </small>
                  )}

                </div>

                {/* IMAGE PREVIEW - NO DEFAULT IMAGE */}

                <div className="admin-ministry-image-preview">
                  {imagePreview &&
                    renderMinistryImage(
                      imagePreview,
                      "Ministry preview"
                    )}
                </div>

              </div>

              {/* POPUP BUTTONS */}

              <div className="admin-ministry-form-actions">

                <button
                  type="button"
                  className="admin-ministry-cancel-button"
                  onClick={resetForm}
                  disabled={saving}
                >
                  <FaTimes />
                  Cancel
                </button>

                <button
                  type="submit"
                  className="admin-ministry-save-button"
                  disabled={saving}
                >
                  {saving ? (
                    editingId ? "Updating..." : "Saving..."
                  ) : (
                    <>
                      <FaSave />
                      {editingId ? "Update Ministry" : "Save Ministry"}
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
}

export default ManageMinistries;
