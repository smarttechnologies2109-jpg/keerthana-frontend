
import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
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

const getMinistryImage = (ministry) => {
  return (
    ministry?.image_url ||
    ministry?.imageUrl ||
    ministry?.cover_url ||
    ministry?.image ||
    ""
  );
};

// =========================================================
// COMPONENT
// =========================================================

function ManageMinistries() {
  const [saving, setSaving] = useState(false);
  const [loadingMinistries, setLoadingMinistries] = useState(true);
  const [ministries, setMinistries] = useState([]);

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
    name: "",
    description: "",
    image_url: "",
    language: "Telugu",
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
        previewUrlRef.current = "";
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
      description: "",
      image_url: "",
      language: "Telugu",
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
  // AUTO SCROLL TO ERROR INSIDE POPUP
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
      setError(
        "Image size must be less than 5 MB."
      );

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
      setListError(
        "This ministry does not have a valid ID."
      );
      return;
    }

    clearImagePreview();

    const existingImage = getMinistryImage(ministry);

    setEditingId(id);

    setForm({
      name: ministry.name || "",
      description: ministry.description || "",
      image_url: existingImage,
      language: ministry.language || "Telugu",
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

    const cleanName = form.name.trim();

    if (!cleanName) {
      setError("Ministry name is required.");
      return;
    }

    const validLanguage = LANGUAGES.some(
      (language) => language.value === form.language
    );

    if (!validLanguage) {
      setError("Please select a valid ministry language.");
      return;
    }

    const isEditing = Boolean(editingId);

    try {
      setSaving(true);

      const formData = new FormData();

      formData.append("name", cleanName);
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
      setListError(
        "This ministry does not have a valid ID."
      );
      return;
    }

    const ministryName = ministry.name || "this ministry";

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
            String(item.id || item.ministry_id) !==
            String(id)
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
  // IMAGE ERROR HANDLER
  // =======================================================

  const handleImageError = (event) => {
    event.currentTarget.style.display = "none";

    const fallback =
      event.currentTarget.parentElement?.querySelector(
        ".ministry-image-fallback"
      );

    if (fallback) {
      fallback.style.display = "flex";
    }
  };

  // =======================================================
  // IMAGE DISPLAY - NO DEFAULT IMAGE
  // =======================================================

  const renderMinistryImage = (imageUrl, altText) => {
    if (!imageUrl) {
      return (
        <div className="ministry-image-fallback">
          <FaChurch />
        </div>
      );
    }

    return (
      <>
        <img
          src={imageUrl}
          alt={altText}
          onError={handleImageError}
        />

        <div
          className="ministry-image-fallback"
          style={{ display: "none" }}
        >
          <FaChurch />
        </div>
      </>
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

        {/* =================================================
            MINISTRY LIST
        ================================================= */}

        <div className="admin-ministry-list-section">

          <div className="admin-ministry-list-header">

            <div>
              <h2>All Ministries</h2>
              <p>Manage your available song ministries.</p>
            </div>

            <div className="admin-ministry-list-actions">

              <span className="admin-ministry-count">
                {ministries.length} Ministries
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
                    loadingMinistries
                      ? "ministry-spinning"
                      : ""
                  }
                />
                Refresh
              </button>

            </div>

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

          ) : ministries.length === 0 ? (

            <div className="admin-ministry-empty">

              <div className="admin-ministry-empty-icon">
                <FaChurch />
              </div>

              <h3>No Ministries Found</h3>

              <p>
                No ministries have been added yet.
                Click Add Ministry to create your first ministry.
              </p>

              <button
                type="button"
                className="admin-ministry-add-button"
                onClick={handleAdd}
              >
                <FaPlus />
                Add Your First Ministry
              </button>

            </div>

          ) : (

            <div className="admin-ministry-grid">

              {ministries.map((ministry, index) => {

                const ministryId =
                  ministry.id ||
                  ministry.ministry_id ||
                  index;

                const imageUrl =
                  getMinistryImage(ministry);

                return (
                  <div
                    className="admin-ministry-card"
                    key={ministryId}
                  >

                    <div className="admin-ministry-card-image">
                      {renderMinistryImage(
                        imageUrl,
                        ministry.name || "Ministry"
                      )}
                    </div>

                    <div className="admin-ministry-card-content">

                      <h3>
                        {ministry.name || "Untitled Ministry"}
                      </h3>

                      <span className="admin-ministry-language">
                        {ministry.language || "Language not specified"}
                      </span>

                      <p>
                        {ministry.description?.trim() ||
                          "No description available."}
                      </p>

                    </div>

                    {/* EDIT / DELETE BUTTONS */}

                    <div
                      className="admin-ministry-card-actions"
                      style={{
                        display: "flex",
                        gap: "10px",
                        padding: "0 16px 16px",
                        flexWrap: "wrap",
                      }}
                    >

                      <button
                        type="button"
                        className="admin-ministry-edit-button"
                        onClick={() => handleEdit(ministry)}
                        disabled={
                          saving || deletingId !== null
                        }
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "7px",
                          padding: "9px 14px",
                          border: "1px solid #c9a85c",
                          borderRadius: "8px",
                          background: "transparent",
                          color: "inherit",
                          cursor: "pointer",
                        }}
                      >
                        <FaEdit />
                        <span>Edit</span>
                      </button>

                      <button
                        type="button"
                        className="admin-ministry-delete-button"
                        onClick={() => handleDelete(ministry)}
                        disabled={
                          saving || deletingId !== null
                        }
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "7px",
                          padding: "9px 14px",
                          border: "1px solid #dc6b6b",
                          borderRadius: "8px",
                          background: "transparent",
                          color: "#dc6b6b",
                          cursor: "pointer",
                        }}
                      >
                        <FaTrash />
                        <span>
                          {String(deletingId) ===
                          String(ministryId)
                            ? "Deleting..."
                            : "Delete"}
                        </span>
                      </button>

                    </div>

                  </div>
                );
              })}

            </div>

          )}

        </div>

      </div>

      {/* =================================================
          ADD / EDIT POPUP MODAL
      ================================================= */}

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
                  {editingId
                    ? "Edit Ministry"
                    : "Add New Ministry"}
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

              {/* MINISTRY NAME */}

              <div className="admin-ministry-field">

                <label htmlFor="ministry-name">
                  Ministry Name <span>*</span>
                </label>

                <input
                  id="ministry-name"
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Example: Hosanna Ministries"
                  maxLength={255}
                  required
                  disabled={saving}
                />

              </div>

              {/* LANGUAGE */}

              <div className="admin-ministry-field">

                <label htmlFor="ministry-language">
                  Ministry Language <span>*</span>
                </label>

                <select
                  id="ministry-language"
                  name="language"
                  value={form.language}
                  onChange={handleChange}
                  required
                  disabled={saving}
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

                <small>
                  Select the language of this ministry.
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

                {/* IMAGE PREVIEW */}

                <div className="admin-ministry-image-preview">

                  {renderMinistryImage(
                    imagePreview,
                    "Ministry preview"
                  )}

                  {!imagePreview && (
                    <span className="ministry-no-image-text">
                      No image selected
                    </span>
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
                    editingId
                      ? "Updating..."
                      : "Saving..."
                  ) : (
                    <>
                      <FaSave />
                      {editingId
                        ? "Update Ministry"
                        : "Save Ministry"}
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
