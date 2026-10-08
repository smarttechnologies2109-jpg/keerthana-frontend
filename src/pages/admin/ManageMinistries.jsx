import React, { useEffect, useState } from "react";

import {
  FaChurch,
  FaEdit,
  FaPlus,
  FaTrash,
  FaTimes,
  FaSave,
  FaUpload,
  FaImage,
} from "react-icons/fa";

import API from "../../services/api";

import "../../assets/css/admin/manageMinistries.css";

import AdminSidebar from "../../components/admin/AdminSidebar";
import AdminHeader from "../../components/admin/AdminHeader.jsx";


/* =========================================================
   SUPPORTED LANGUAGES
========================================================= */

const LANGUAGES = [
  {
    value: "Telugu",
    label: "తెలుగు",
  },
  {
    value: "Hindi",
    label: "हिन्दी",
  },
  {
    value: "English",
    label: "English",
  },
  {
    value: "Malayalam",
    label: "മലയാളം",
  },
  {
    value: "Kannada",
    label: "ಕನ್ನಡ",
  },
  {
    value: "Tamil",
    label: "தமிழ்",
  },
];


const getLanguageLabel = (value) => {

  const language = LANGUAGES.find(
    (item) => item.value === value
  );

  return language?.label || value || "తెలుగు";
};


/* =========================================================
   DEFAULT MINISTRY IMAGE
========================================================= */

const DEFAULT_MINISTRY_IMAGE =
  "/images/default-ministry.png";


function ManageMinistries() {

  const [ministries, setMinistries] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  const [form, setForm] = useState({
    name: "",
    description: "",
    image_url: "",
    language: "Telugu",
  });


  /* =========================================================
     LOAD MINISTRIES
  ========================================================= */

  const loadMinistries = async () => {

    try {

      setLoading(true);
      setError("");

      const response = await API.get("/ministries");

      setMinistries(response.data || []);

    } catch (error) {

      console.error(
        "Load ministries error:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Failed to load ministries."
      );

    } finally {

      setLoading(false);

    }

  };


  useEffect(() => {

    loadMinistries();

  }, []);


  /* =========================================================
     INPUT CHANGE
  ========================================================= */

  const handleChange = (event) => {

    const {
      name,
      value,
    } = event.target;


    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

  };


  /* =========================================================
     IMAGE SELECT
  ========================================================= */

  const handleImageChange = (event) => {

    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }


    /* -------------------------------------------------------
       VALIDATE FILE TYPE
    ------------------------------------------------------- */

    if (!file.type.startsWith("image/")) {

      setError(
        "Please select a valid image file."
      );

      event.target.value = "";

      return;
    }


    /* -------------------------------------------------------
       VALIDATE FILE SIZE
       Maximum 5 MB
    ------------------------------------------------------- */

    if (file.size > 5 * 1024 * 1024) {

      setError(
        "Image size must be less than 5 MB."
      );

      event.target.value = "";

      return;
    }


    setError("");
    setImageFile(file);


    /* -------------------------------------------------------
       CREATE PREVIEW
    ------------------------------------------------------- */

    const previewUrl =
      URL.createObjectURL(file);

    setImagePreview(previewUrl);

  };


  /* =========================================================
     UPLOAD IMAGE
  ========================================================= */

  const uploadImage = async () => {

    if (!imageFile) {
      return form.image_url || "";
    }


    try {

      setUploadingImage(true);


      const formData =
        new FormData();

      formData.append(
        "image",
        imageFile
      );


      const response =
        await API.post(
          "/admin/upload",
          formData,
          {
            headers: {
              "Content-Type":
                "multipart/form-data",
            },
          }
        );


      /*
        Expected backend response:

        {
          "url": "/uploads/ministries/example.jpg"
        }
      */

      const uploadedUrl =
        response.data?.url ||
        response.data?.image_url ||
        response.data?.path;


      if (!uploadedUrl) {

        throw new Error(
          "Image upload response did not contain an image URL."
        );

      }


      return uploadedUrl;

    } catch (error) {

      console.error(
        "Upload ministry image error:",
        error
      );

      throw new Error(
        error.response?.data?.message ||
          "Failed to upload ministry image."
      );

    } finally {

      setUploadingImage(false);

    }

  };


  /* =========================================================
     RESET FORM
  ========================================================= */

  const resetForm = () => {

    if (imagePreview) {

      URL.revokeObjectURL(
        imagePreview
      );

    }


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

  };


  /* =========================================================
     OPEN ADD FORM
  ========================================================= */

  const handleAdd = () => {

    setEditingId(null);

    setForm({
      name: "",
      description: "",
      image_url: "",
      language: "Telugu",
    });

    setImageFile(null);
    setImagePreview("");

    setError("");
    setSuccess("");

    setShowForm(true);

  };


  /* =========================================================
     OPEN EDIT FORM
  ========================================================= */

  const handleEdit = (ministry) => {

    setEditingId(ministry.id);

    setForm({
      name: ministry.name || "",
      description: ministry.description || "",
      image_url: ministry.image_url || "",
      language: ministry.language || "Telugu",
    });

    setImageFile(null);

    setImagePreview(
      ministry.image_url ||
        DEFAULT_MINISTRY_IMAGE
    );

    setError("");
    setSuccess("");

    setShowForm(true);

  };


  /* =========================================================
     SAVE MINISTRY
  ========================================================= */

  const handleSubmit = async (event) => {

    event.preventDefault();

    setError("");
    setSuccess("");


    /* -------------------------------------------------------
       VALIDATE NAME
    ------------------------------------------------------- */

    if (!form.name.trim()) {

      setError(
        "Ministry name is required."
      );

      return;
    }


    /* -------------------------------------------------------
       VALIDATE LANGUAGE
    ------------------------------------------------------- */

    if (
      !LANGUAGES.some(
        (language) =>
          language.value ===
          form.language
      )
    ) {

      setError(
        "Please select a valid ministry language."
      );

      return;
    }


    try {

      setSaving(true);


      /* -----------------------------------------------------
         UPLOAD IMAGE FIRST
      ----------------------------------------------------- */

      let imageUrl =
        form.image_url.trim();


      if (imageFile) {

        imageUrl =
          await uploadImage();

      }


      /* -----------------------------------------------------
         MINISTRY DATA
      ----------------------------------------------------- */

      const ministryData = {

        name:
          form.name.trim(),

        description:
          form.description.trim(),

        image_url:
          imageUrl,

        language:
          form.language,

      };


      /* -----------------------------------------------------
         UPDATE
      ----------------------------------------------------- */

      if (editingId) {

        await API.put(
          `/admin/ministries/${editingId}`,
          ministryData
        );

        setSuccess(
          "Ministry updated successfully."
        );

      }


      /* -----------------------------------------------------
         CREATE
      ----------------------------------------------------- */

      else {

        await API.post(
          "/admin/ministries",
          ministryData
        );

        setSuccess(
          "Ministry added successfully."
        );

      }


      resetForm();

      await loadMinistries();

    } catch (error) {

      console.error(
        "Save ministry error:",
        error
      );

      setError(
        error.response?.data?.message ||
          error.message ||
          "Failed to save ministry."
      );

    } finally {

      setSaving(false);

    }

  };


  /* =========================================================
     DELETE MINISTRY
  ========================================================= */

  const handleDelete = async (id) => {

    const confirmed =
      window.confirm(
        "Are you sure you want to delete this ministry?"
      );


    if (!confirmed) {
      return;
    }


    try {

      setError("");
      setSuccess("");

      await API.delete(
        `/admin/ministries/${id}`
      );

      setSuccess(
        "Ministry deleted successfully."
      );

      await loadMinistries();

    } catch (error) {

      console.error(
        "Delete ministry error:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Failed to delete ministry."
      );

    }

  };


  /* =========================================================
     RENDER
  ========================================================= */

  return (

    <div className="admin-ministries-page">

      <AdminSidebar />

      <div className="admin-ministries-main">

        {/* <AdminHeader /> */}


        {/* =====================================================
            PAGE HEADER
        ===================================================== */}

        <div className="admin-ministries-header">

          <div className="admin-ministries-title">

            <div className="admin-ministries-title-icon">
              <FaChurch />
            </div>

            <div>

              <h1>
                Ministries
              </h1>

              <p>
                Create and manage song ministries.
              </p>

            </div>

          </div>


          <button
            type="button"
            className="admin-ministry-add-button"
            onClick={handleAdd}
          >

            <FaPlus />

            <span>
              Add Ministry
            </span>

          </button>

        </div>


        {/* =====================================================
            ALERTS
        ===================================================== */}

        {error && (

          <div className="admin-ministry-alert error">
            {error}
          </div>

        )}


        {success && (

          <div className="admin-ministry-alert success">
            {success}
          </div>

        )}


        {/* =====================================================
            FORM
        ===================================================== */}

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
                disabled={
                  saving ||
                  uploadingImage
                }
              >
                <FaTimes />
              </button>

            </div>


            <form
              onSubmit={handleSubmit}
              className="admin-ministry-form"
            >

              {/* =================================================
                  MINISTRY NAME
              ================================================= */}

              <div className="admin-ministry-field">

                <label htmlFor="ministry-name">

                  Ministry Name

                  <span>*</span>

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
                />

              </div>


              {/* =================================================
                  MINISTRY LANGUAGE
              ================================================= */}

              <div className="admin-ministry-field">

                <label htmlFor="ministry-language">

                  Ministry Language

                  <span>*</span>

                </label>


                <select
                  id="ministry-language"
                  name="language"
                  value={form.language}
                  onChange={handleChange}
                  required
                >

                  {LANGUAGES.map(
                    (language) => (

                      <option
                        key={language.value}
                        value={language.value}
                      >
                        {language.label}
                      </option>

                    )
                  )}

                </select>


                <small>
                  Select the language of this ministry.
                </small>

              </div>


              {/* =================================================
                  DESCRIPTION
              ================================================= */}

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
                />

              </div>


              {/* =================================================
                  MINISTRY IMAGE
              ================================================= */}

              <div className="admin-ministry-field">

                <label htmlFor="ministry-image">

                  Ministry Image

                </label>


                <div className="admin-ministry-upload-box">

                  <input
                    id="ministry-image"
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    onChange={handleImageChange}
                    disabled={
                      saving ||
                      uploadingImage
                    }
                  />


                  <label
                    htmlFor="ministry-image"
                    className="admin-ministry-upload-button"
                  >

                    <FaUpload />

                    <span>
                      Browse Image
                    </span>

                  </label>


                  <small>

                    PNG, JPG, JPEG or WEBP.
                    Maximum 5 MB.

                  </small>

                </div>


                {/* =================================================
                    IMAGE PREVIEW
                ================================================= */}

                <div className="admin-ministry-image-preview">

                  <img
                    src={
                      imagePreview ||
                      DEFAULT_MINISTRY_IMAGE
                    }
                    alt="Ministry preview"
                    onError={(
                      event
                    ) => {

                      event.currentTarget.src =
                        DEFAULT_MINISTRY_IMAGE;

                    }}
                  />

                </div>

              </div>


              {/* =================================================
                  BUTTONS
              ================================================= */}

              <div className="admin-ministry-form-actions">

                <button
                  type="button"
                  className="admin-ministry-cancel-button"
                  onClick={resetForm}
                  disabled={
                    saving ||
                    uploadingImage
                  }
                >

                  <FaTimes />

                  Cancel

                </button>


                <button
                  type="submit"
                  className="admin-ministry-save-button"
                  disabled={
                    saving ||
                    uploadingImage
                  }
                >

                  {saving ||
                  uploadingImage ? (

                    uploadingImage
                      ? "Uploading..."
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

        )}


        {/* =====================================================
            MINISTRY LIST
        ===================================================== */}

        <div className="admin-ministry-list-card">

          <div className="admin-ministry-list-header">

            <div>

              <h2>
                All Ministries
              </h2>

              <span>

                {ministries.length}{" "}

                {ministries.length === 1
                  ? "Ministry"
                  : "Ministries"}

              </span>

            </div>

          </div>


          {/* ===================================================
              LOADING
          =================================================== */}

          {loading ? (

            <div className="admin-ministry-loading">

              <div className="admin-ministry-spinner" />

              <p>
                Loading ministries...
              </p>

            </div>

          ) : ministries.length === 0 ? (

            /* =================================================
               EMPTY
            ================================================= */

            <div className="admin-ministry-empty">

              <FaChurch />

              <h3>
                No Ministries Yet
              </h3>

              <p>
                Add your first ministry to start
                organizing songs.
              </p>

              <button
                type="button"
                onClick={handleAdd}
                className="admin-ministry-empty-button"
              >

                <FaPlus />

                Add Ministry

              </button>

            </div>

          ) : (

            /* =================================================
               MINISTRY CARDS
            ================================================= */

            <div className="admin-ministry-grid">

              {ministries.map(
                (ministry) => (

                  <div
                    className="admin-ministry-card"
                    key={ministry.id}
                  >

                    {/* IMAGE */}

                    <div className="admin-ministry-card-image">

                      <img
                        src={
                          ministry.image_url ||
                          DEFAULT_MINISTRY_IMAGE
                        }
                        alt={
                          ministry.name
                        }
                        onError={(
                          event
                        ) => {

                          event.currentTarget.src =
                            DEFAULT_MINISTRY_IMAGE;

                        }}
                      />

                    </div>


                    {/* CONTENT */}

                    <div className="admin-ministry-card-content">

                      <h3>
                        {ministry.name}
                      </h3>


                      {/* LANGUAGE */}

                      <div className="admin-ministry-language">

                        {getLanguageLabel(
                          ministry.language
                        )}

                      </div>


                      {ministry.description ? (

                        <p>
                          {ministry.description}
                        </p>

                      ) : (

                        <p className="no-description">
                          No description added.
                        </p>

                      )}


                      <div className="admin-ministry-card-footer">

                        <span>
                          Ministry #{ministry.id}
                        </span>


                        <div className="admin-ministry-card-actions">

                          <button
                            type="button"
                            className="admin-ministry-edit-button"
                            onClick={() =>
                              handleEdit(
                                ministry
                              )
                            }
                            title="Edit Ministry"
                          >
                            <FaEdit />
                          </button>


                          <button
                            type="button"
                            className="admin-ministry-delete-button"
                            onClick={() =>
                              handleDelete(
                                ministry.id
                              )
                            }
                            title="Delete Ministry"
                          >
                            <FaTrash />
                          </button>

                        </div>

                      </div>

                    </div>

                  </div>

                )
              )}

            </div>

          )}

        </div>

      </div>

    </div>

  );

}


export default ManageMinistries;