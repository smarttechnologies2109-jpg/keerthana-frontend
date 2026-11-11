
import React, { useEffect, useRef, useState } from "react";

import {
  FaChurch,
  FaPlus,
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
// COMPONENT
// =========================================================

function ManageMinistries() {

  // =======================================================
  // STATE
  // =======================================================

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showForm, setShowForm] = useState(false);

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

  };

  // =======================================================
  // IMAGE SELECTION
  // =======================================================

  const handleImageChange = (event) => {

    const file = event.target.files?.[0];

    if (!file) return;

    setError("");
    setSuccess("");

    // Validate image type

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {

      setError(
        "Please select a JPG, PNG or WEBP image."
      );

      event.target.value = "";

      return;

    }

    // Validate image size

    if (file.size > MAX_IMAGE_SIZE) {

      setError(
        "Image size must be less than 5 MB."
      );

      event.target.value = "";

      return;

    }

    // Remove previous preview

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

  };

  // =======================================================
  // SAVE MINISTRY
  // MULTIPART UPLOAD TO BACKEND
  // =======================================================

  const handleSubmit = async (event) => {

    event.preventDefault();

    setError("");
    setSuccess("");

    // Validate ministry name

    const cleanName = form.name.trim();

    if (!cleanName) {

      setError("Ministry name is required.");

      return;

    }

    // Validate language

    const validLanguage = LANGUAGES.some(
      (language) => language.value === form.language
    );

    if (!validLanguage) {

      setError(
        "Please select a valid ministry language."
      );

      return;

    }

    try {

      setSaving(true);

      // Create multipart form data

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

      // Add image only when selected

      if (imageFile) {

        formData.append(
          "image",
          imageFile
        );

      }

      // CREATE MINISTRY

      await API.post(
        "/admin/ministries",
        formData
      );

      // Show success

      setSuccess(
        "Ministry added successfully."
      );

      // Close and clear form

      resetForm();

    } catch (error) {

      console.error(
        "Save ministry error:",
        error
      );

      setError(
        error.response?.data?.message ||
        error.message ||
        "Failed to save ministry. Please try again."
      );

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

        {/* ================================================
            PAGE HEADER
        ================================================ */}

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

          {/* ADD MINISTRY BUTTON */}

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

        {/* ================================================
            ALERTS
        ================================================ */}

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

        {/* ================================================
            ADD MINISTRY FORM
        ================================================ */}

        {showForm && (

          <div className="admin-ministry-form-card">

            {/* FORM HEADER */}

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

        {/* ================================================
            IMPORTANT:
            NO ALL MINISTRIES SECTION
            NO MINISTRY CARDS
            NO MINISTRY LIST
            NO MINISTRY COUNT
        ================================================ */}

      </div>

    </div>

  );

}

export default ManageMinistries;
