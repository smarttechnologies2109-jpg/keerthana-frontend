
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

// =========================================================
// IMAGE VALIDATION
// =========================================================

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

// =========================================================
// IMAGE URL HELPER
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
  // =======================================================
  // STATE
  // =======================================================

  const [saving, setSaving] = useState(false);

  const [loadingMinistries, setLoadingMinistries] = useState(true);

  const [ministries, setMinistries] = useState([]);

  const [error, setError] = useState("");
  const [listError, setListError] = useState("");
  const [success, setSuccess] = useState("");

  const [showForm, setShowForm] = useState(false);

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  // =======================================================
  // REFS
  // =======================================================

  const imageInputRef = useRef(null);
  const previewUrlRef = useRef("");
  const errorRef = useRef(null);

  // =======================================================
  // FORM STATE
  // =======================================================

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

      // Existing public ministries endpoint
      const response = await API.get("/ministries");

      const responseData = response.data;

      // Support common API response formats:
      // []
      // { ministries: [] }
      // { data: [] }
      // { success: true, ministries: [] }

      let ministryList = [];

      if (Array.isArray(responseData)) {
        ministryList = responseData;
      } else if (Array.isArray(responseData?.ministries)) {
        ministryList = responseData.ministries;
      } else if (Array.isArray(responseData?.data)) {
        ministryList = responseData.data;
      } else if (
        Array.isArray(responseData?.data?.ministries)
      ) {
        ministryList = responseData.data.ministries;
      } else if (Array.isArray(responseData?.results)) {
        ministryList = responseData.results;
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

  // =======================================================
  // LOAD LIST WHEN PAGE OPENS
  // =======================================================

  useEffect(() => {
    fetchMinistries();
  }, [fetchMinistries]);

  // =======================================================
  // AUTOMATIC SCROLL TO ERROR
  // =======================================================

  useEffect(() => {
    if (error && showForm && errorRef.current) {
      requestAnimationFrame(() => {
        errorRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });

        errorRef.current?.focus({
          preventScroll: true,
        });
      });
    }
  }, [error, showForm]);

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
  // INPUT CHANGE
  // =======================================================

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    if (error) {
      setError("");
    }

    if (success) {
      setSuccess("");
    }
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
        "Image size must be less than 5 MB. Please select a smaller image."
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
  // RESET FORM
  // =======================================================

  const resetForm = () => {
    clearImagePreview();

    setForm({
      name: "",
      description: "",
      image_url: "",
      language: "Telugu",
    });

    setImageFile(null);
    setImagePreview("");

    setError("");
    setShowForm(false);

    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  };

  // =======================================================
  // OPEN ADD MINISTRY FORM
  // =======================================================

  const handleAdd = () => {
    resetForm();

    setError("");
    setSuccess("");

    setShowForm(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // =======================================================
  // SAVE MINISTRY
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

    try {
      setSaving(true);

      const formData = new FormData();

      formData.append("name", cleanName);

      formData.append(
        "description",
        form.description.trim()
      );

      formData.append(
        "language",
        form.language
      );

      if (imageFile) {
        formData.append("image", imageFile);
      }

      // SAVE TO BACKEND

      const response = await API.post(
        "/admin/ministries",
        formData
      );

      // SHOW SUCCESS MESSAGE

      setSuccess(
        response.data?.message ||
        "Ministry added successfully."
      );

      // CLOSE AND CLEAR FORM

      resetForm();

      // IMPORTANT:
      // REFRESH THE MINISTRY LIST AFTER SAVING

      await fetchMinistries();

      // SCROLL TO LIST

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (err) {
      console.error("Save ministry error:", err);

      const status = err.response?.status;

      let message =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        "Failed to save ministry. Please try again.";

      const backendError =
        err.response?.data?.error ||
        err.response?.data?.message;

      const failedStep =
        err.response?.data?.failedStep;

      if (status === 400) {
        message =
          backendError ||
          "Invalid ministry details. Please check your information.";
      } else if (status === 401) {
        message =
          "Your session has expired. Please log in again.";
      } else if (status === 403) {
        message =
          "You do not have permission to add a ministry.";
      } else if (status === 413) {
        message =
          "The uploaded image is too large. Please select an image smaller than 5 MB.";
      } else if (status >= 500) {
        message =
          backendError ||
          "Server error while saving ministry. Please try again.";
      }

      if (failedStep) {
        message = `${failedStep}: ${message}`;
      }

      setError(message);
    } finally {
      setSaving(false);
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
  // IMAGE DISPLAY
  // NO DEFAULT IMAGE
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

              <p>
                Create and manage song ministries.
              </p>
            </div>

          </div>

          {!showForm && (
            <button
              type="button"
              className="admin-ministry-add-button"
              onClick={handleAdd}
              disabled={saving}
            >
              <FaPlus />
              <span>Add Ministry</span>
            </button>
          )}

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

        {/* ADD MINISTRY FORM */}

        {showForm && (

          <div className="admin-ministry-form-card">

            <div className="admin-ministry-form-header">

              <div>
                <h2>Add New Ministry</h2>

                <p>
                  Enter the ministry information below.
                </p>
              </div>

              <button
                type="button"
                className="admin-ministry-close-button"
                onClick={resetForm}
                disabled={saving}
                aria-label="Close form"
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

              {/* MINISTRY LANGUAGE */}

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

              {/* MINISTRY IMAGE */}

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

              {/* FORM BUTTONS */}

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
                    "Saving..."
                  ) : (
                    <>
                      <FaSave />
                      Save Ministry
                    </>
                  )}
                </button>

              </div>

            </form>

          </div>
        )}

        {/* =================================================
            MINISTRY LIST SECTION
        ================================================= */}

        <div className="admin-ministry-list-section">

          <div className="admin-ministry-list-header">

            <div>
              <h2>All Ministries</h2>

              <p>
                Manage your available song ministries.
              </p>
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
                    loadingMinistries ? "ministry-spinning" : ""
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

            /* EMPTY STATE */

            <div className="admin-ministry-empty">

              <div className="admin-ministry-empty-icon">
                <FaChurch />
              </div>

              <h3>No Ministries Found</h3>

              <p>
                No ministries have been added yet.
                Click Add Ministry to create your first ministry.
              </p>

              {!showForm && (
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

            /* MINISTRY CARDS */

            <div className="admin-ministry-grid">

              {ministries.map((ministry, index) => {

                const ministryId =
                  ministry.id ||
                  ministry.ministry_id ||
                  index;

                const imageUrl = getMinistryImage(ministry);

                return (

                  <div
                    className="admin-ministry-card"
                    key={ministryId}
                  >

                    {/* MINISTRY IMAGE */}

                    <div className="admin-ministry-card-image">

                      {renderMinistryImage(
                        imageUrl,
                        ministry.name || "Ministry"
                      )}

                    </div>

                    {/* MINISTRY DETAILS */}

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

                  </div>

                );
              })}

            </div>

          )}

        </div>

      </div>

    </div>
  );
}

export default ManageMinistries;
