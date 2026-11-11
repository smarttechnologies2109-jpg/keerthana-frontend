
import React, { useEffect, useRef, useState } from "react";

import {
  FaChurch,
  FaEdit,
  FaPlus,
  FaTrash,
  FaTimes,
  FaSave,
  FaUpload,
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

const getLanguageLabel = (value) => {
  const language = LANGUAGES.find(
    (item) =>
      item.value.toLowerCase() ===
      String(value || "").toLowerCase()
  );

  return language?.label || value || "తెలుగు";
};

const getMinistryList = (responseData) => {
  if (Array.isArray(responseData)) {
    return responseData;
  }

  if (Array.isArray(responseData?.ministries)) {
    return responseData.ministries;
  }

  if (Array.isArray(responseData?.data)) {
    return responseData.data;
  }

  return [];
};

// =========================================================
// COMPONENT
// =========================================================

function ManageMinistries() {
  // -------------------------------------------------------
  // STATE
  // -------------------------------------------------------

  const [ministries, setMinistries] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  const imageInputRef = useRef(null);
  const previewUrlRef = useRef("");

  const [form, setForm] = useState({
    name: "",
    description: "",
    image_url: "",
    language: "Telugu",
  });

  // -------------------------------------------------------
  // IMAGE PREVIEW CLEANUP
  // -------------------------------------------------------

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

  // -------------------------------------------------------
  // LOAD MINISTRIES
  // -------------------------------------------------------

  const loadMinistries = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await API.get("/ministries");

      const ministryList = getMinistryList(response.data);

      setMinistries(ministryList);
    } catch (error) {
      console.error("Load ministries error:", error);

      setError(
        error.response?.data?.message ||
          "Failed to load ministries. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMinistries();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -------------------------------------------------------
  // INPUT CHANGE
  // -------------------------------------------------------

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // -------------------------------------------------------
  // IMAGE SELECTION
  // -------------------------------------------------------

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setError("");
    setSuccess("");

    // Validate image MIME type.

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setError("Please select a JPG, PNG or WEBP image.");

      event.target.value = "";
      return;
    }

    // Validate image size.

    if (file.size > MAX_IMAGE_SIZE) {
      setError("Image size must be less than 5 MB.");

      event.target.value = "";
      return;
    }

    // Remove previous temporary preview.

    clearImagePreview();

    const previewUrl = URL.createObjectURL(file);

    previewUrlRef.current = previewUrl;

    setImageFile(file);
    setImagePreview(previewUrl);
  };

  // -------------------------------------------------------
  // RESET FORM
  // -------------------------------------------------------

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

    setEditingId(null);
    setShowForm(false);

    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  };

  // -------------------------------------------------------
  // OPEN ADD FORM
  // -------------------------------------------------------

  const handleAdd = () => {
    resetForm();

    setError("");
    setSuccess("");

    setShowForm(true);
  };

  // -------------------------------------------------------
  // OPEN EDIT FORM
  // -------------------------------------------------------

  const handleEdit = (ministry) => {
    clearImagePreview();

    setEditingId(ministry.id);

    setForm({
      name: ministry.name || "",
      description: ministry.description || "",
      image_url: ministry.image_url || "",
      language: ministry.language || "Telugu",
    });

    setImageFile(null);

    // Show only the actual uploaded ministry image.
    // No default image is used.

    setImagePreview(ministry.image_url || "");

    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }

    setError("");
    setSuccess("");

    setShowForm(true);
  };

  // -------------------------------------------------------
  // SAVE MINISTRY
  // DIRECT MULTIPART UPLOAD TO BACKEND
  // -------------------------------------------------------

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    // Validate ministry name.

    const cleanName = form.name.trim();

    if (!cleanName) {
      setError("Ministry name is required.");
      return;
    }

    // Validate language.

    const validLanguage = LANGUAGES.some(
      (language) => language.value === form.language
    );

    if (!validLanguage) {
      setError("Please select a valid ministry language.");
      return;
    }

    try {
      setSaving(true);

      // Create multipart form data.

      const formData = new FormData();

      formData.append("name", cleanName);

      formData.append(
        "description",
        form.description.trim()
      );

      formData.append("language", form.language);

      // Add image only if a new image was selected.

      if (imageFile) {
        formData.append("image", imageFile);
      }

      // UPDATE MINISTRY

      if (editingId) {
        await API.put(
          `/admin/ministries/${editingId}`,
          formData
        );

        setSuccess("Ministry updated successfully.");
      }

      // CREATE MINISTRY

      else {
        await API.post(
          "/admin/ministries",
          formData
        );

        setSuccess("Ministry added successfully.");
      }

      // Clear form and reload data.

      resetForm();

      await loadMinistries();
    } catch (error) {
      console.error("Save ministry error:", error);

      setError(
        error.response?.data?.message ||
          error.message ||
          "Failed to save ministry. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  // -------------------------------------------------------
  // DELETE MINISTRY
  // -------------------------------------------------------

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this ministry?"
    );

    if (!confirmed) return;

    try {
      setDeletingId(id);

      setError("");
      setSuccess("");

      await API.delete(`/admin/ministries/${id}`);

      setSuccess("Ministry deleted successfully.");

      await loadMinistries();
    } catch (error) {
      console.error("Delete ministry error:", error);

      setError(
        error.response?.data?.message ||
          "Failed to delete ministry. Please try again."
      );
    } finally {
      setDeletingId(null);
    }
  };

  // -------------------------------------------------------
  // IMAGE ERROR HANDLER
  // -------------------------------------------------------

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

  // -------------------------------------------------------
  // IMAGE DISPLAY
  // -------------------------------------------------------

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

  // -------------------------------------------------------
  // RENDER
  // -------------------------------------------------------

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

        {/* ALERTS */}

        {error && (
          <div
            className="admin-ministry-alert error"
            role="alert"
          >
            {error}
          </div>
        )}

        {success && (
          <div
            className="admin-ministry-alert success"
            role="status"
          >
            {success}
          </div>
        )}

        {/* MINISTRY FORM */}

        {showForm && (

          <div className="admin-ministry-form-card">

            <div className="admin-ministry-form-header">

              <div>
                <h2>
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
                aria-label="Close form"
              >
                <FaTimes />
              </button>

            </div>

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

                      {editingId
                        ? "Update Ministry"
                        : "Save Ministry"}
                    </>
                  )}
                </button>

              </div>

            </form>

          </div>
        )}

        {/* MINISTRY LIST */}

        

      </div>

    </div>
  );
}

export default ManageMinistries;
