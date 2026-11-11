
import { useEffect, useRef, useState } from "react";

import {
  FaEdit,
  FaExclamationCircle,
  FaPlus,
  FaSearch,
  FaTags,
  FaTimes,
  FaTrash,
  FaUpload,
} from "react-icons/fa";

import API from "../../services/api";

import "../../assets/css/admin/manageCategories.css";

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

// =====================================================
// IMAGE VALIDATION
// =====================================================

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

// =====================================================
// COMPONENT
// =====================================================

function ManageCategories() {
  // ===================================================
  // REFS
  // ===================================================

  const errorRef = useRef(null);

  // ===================================================
  // STATE
  // ===================================================

  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [search, setSearch] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ===================================================
  // MODAL
  // ===================================================

  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  // ===================================================
  // FORM
  // ===================================================

  const [name, setName] = useState("");
  const [language, setLanguage] = useState("Telugu");

  // ===================================================
  // IMAGE
  // ===================================================

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  // ===================================================
  // AUTOMATIC SCROLL TO ERROR
  // ===================================================

  useEffect(() => {
    if (error && showForm && errorRef.current) {
      requestAnimationFrame(() => {
        errorRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      });
    }
  }, [error, showForm]);

  // ===================================================
  // LOAD CATEGORIES
  // ===================================================

  const loadCategories = async (showLoader = true) => {
    try {
      if (showLoader) {
        setLoading(true);
      }

      setError("");

      const response = await API.get("/admin/categories");

      if (response.data?.success) {
        setCategories(response.data.categories || []);
      } else {
        setCategories([]);
      }
    } catch (err) {
      console.error("Load categories error:", err);

      setError(
        err.response?.data?.message ||
          "Unable to load categories."
      );
    } finally {
      if (showLoader) {
        setLoading(false);
      }
    }
  };

  // ===================================================
  // INITIAL LOAD
  // ===================================================

  useEffect(() => {
    loadCategories();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ===================================================
  // CLEANUP IMAGE PREVIEW URL
  // ===================================================

  useEffect(() => {
    return () => {
      if (imagePreview?.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  // ===================================================
  // OPEN ADD
  // ===================================================

  const openAdd = () => {
    setEditingCategory(null);

    setName("");
    setLanguage("Telugu");

    setImageFile(null);
    setImagePreview("");

    setError("");
    setSuccess("");

    setShowForm(true);
  };

  // ===================================================
  // OPEN EDIT
  // ===================================================

  const openEdit = (category) => {
    setEditingCategory(category);

    setName(category.name || "");
    setLanguage(category.language || "Telugu");

    setImageFile(null);

    // Use only the category's actual uploaded image.
    // No default image is assigned.
    setImagePreview(category.image_url || "");

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
    setEditingCategory(null);

    setName("");
    setLanguage("Telugu");

    setImageFile(null);
    setImagePreview("");

    setError("");
  };

  // ===================================================
  // IMAGE SELECTION
  // ===================================================

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setError(
        "Only JPG, JPEG, PNG and WEBP images are allowed."
      );

      event.target.value = "";
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setError("Image size must be less than 5 MB.");

      event.target.value = "";
      return;
    }

    setError("");
    setSuccess("");

    setImageFile(file);

    const preview = URL.createObjectURL(file);

    setImagePreview(preview);
  };

  // ===================================================
  // SAVE CATEGORY
  // IMAGE + CATEGORY DATA IN ONE REQUEST
  // ===================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    const cleanName = name.trim();

    if (!cleanName) {
      setError("Category name is required.");
      return;
    }

    const validLanguage = LANGUAGES.some(
      (item) => item.value === language
    );

    if (!validLanguage) {
      setError("Please select a valid language.");
      return;
    }

    try {
      setSaving(true);

      setError("");
      setSuccess("");

      const formData = new FormData();

      formData.append("name", cleanName);
      formData.append("language", language);

      if (imageFile) {
        formData.append("image", imageFile);
      }

      // UPDATE CATEGORY

      if (editingCategory) {
        await API.put(
          `/admin/categories/${editingCategory.id}`,
          formData
        );

        setSuccess("Category updated successfully!");
      }

      // CREATE CATEGORY

      else {
        await API.post(
          "/admin/categories",
          formData
        );

        setSuccess("Category created successfully!");
      }

      // REFRESH CATEGORIES

      await loadCategories(false);

      // RESET FORM AFTER SUCCESS

      setShowForm(false);
      setEditingCategory(null);

      setName("");
      setLanguage("Telugu");

      setImageFile(null);
      setImagePreview("");

    } catch (err) {
      console.error("Save category error:", err);

      const status = err.response?.status;

      let message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Unable to save category.";

      if (status === 413) {
        message = "Image is too large. Please upload an image smaller than 5 MB.";
      } else if (status === 401) {
        message = "Your session has expired. Please log in again.";
      } else if (status === 403) {
        message = "You do not have permission to perform this action.";
      } else if (status >= 500) {
        message =
          err.response?.data?.message ||
          "Server error. Please check the backend logs and try again.";
      }

      // KEEP MODAL OPEN AND DISPLAY ERROR

      setError(message);

    } finally {
      setSaving(false);
    }
  };

  // ===================================================
  // DELETE CATEGORY
  // ===================================================

  const handleDelete = async (category) => {
    const confirmed = window.confirm(
      `Delete category "${category.name}"?`
    );

    if (!confirmed) return;

    try {
      setDeletingId(category.id);

      setError("");
      setSuccess("");

      await API.delete(
        `/admin/categories/${category.id}`
      );

      setCategories((previous) =>
        previous.filter(
          (item) => item.id !== category.id
        )
      );

      setSuccess("Category deleted successfully!");

    } catch (err) {
      console.error("Delete category error:", err);

      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Unable to delete category."
      );

    } finally {
      setDeletingId(null);
    }
  };

  // ===================================================
  // SEARCH
  // ===================================================

  const query = search.trim().toLowerCase();

  const filteredCategories = categories.filter(
    (category) => {
      if (!query) return true;

      return (
        category.name?.toLowerCase().includes(query) ||
        category.language?.toLowerCase().includes(query)
      );
    }
  );

  // ===================================================
  // LANGUAGE LABEL
  // ===================================================

  const getLanguageLabel = (value) => {
    return (
      LANGUAGES.find(
        (item) => item.value === value
      )?.label || value || "తెలుగు"
    );
  };

  // ===================================================
  // LOADING
  // ===================================================

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-loading">
          Loading Categories...
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

          <h1>Manage Categories</h1>

          <p>
            Create and manage song categories.
          </p>
        </div>

        <button
          type="button"
          className="admin-primary-button"
          onClick={openAdd}
        >
          <FaPlus />
          Add Category
        </button>
      </div>

      {/* PAGE ERROR - ONLY WHEN MODAL IS CLOSED */}

      {error && !showForm && (
        <div className="admin-error" role="alert">
          <FaExclamationCircle />
          <span>{error}</span>
        </div>
      )}

      {/* SUCCESS MESSAGE */}

      {success && !showForm && (
        <div className="admin-success" role="status">
          {success}
        </div>
      )}

      {/* SEARCH TOOLBAR */}

      <div className="admin-song-toolbar">

        <div className="admin-song-search">
          <FaSearch />

          <input
            type="text"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search categories or language..."
          />
        </div>

        <div className="admin-song-count">
          <FaTags />

          <span>
            {filteredCategories.length}{" "}
            {filteredCategories.length === 1
              ? "Category"
              : "Categories"}
          </span>
        </div>

      </div>

      {/* CATEGORY TABLE */}

      {filteredCategories.length === 0 ? (

        <div className="admin-empty-state">
          <FaTags />

          <h2>No Categories Found</h2>

          <p>
            {search
              ? "Try another search."
              : "Create your first song category."}
          </p>

          {!search && (
            <button
              type="button"
              className="admin-primary-button"
              onClick={openAdd}
            >
              <FaPlus />
              Add Category
            </button>
          )}
        </div>

      ) : (

        <div className="admin-table-wrapper">

          <table className="admin-song-table">

            <thead>
              <tr>
                <th>Category</th>
                <th>Language</th>
                <th>Songs</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>

              {filteredCategories.map((category) => (

                <tr key={category.id}>

                  {/* CATEGORY */}

                  <td>
                    <div className="admin-category-cell">

                      <div className="admin-category-icon">

                        {category.image_url ? (
                          <>
                            <img
                              src={category.image_url}
                              alt={category.name}
                              onError={(event) => {
                                event.currentTarget.style.display =
                                  "none";

                                const fallback =
                                  event.currentTarget.parentElement.querySelector(
                                    ".category-image-fallback"
                                  );

                                if (fallback) {
                                  fallback.style.display = "flex";
                                }
                              }}
                            />

                            <div
                              className="category-image-fallback"
                              style={{ display: "none" }}
                            >
                              <FaTags />
                            </div>
                          </>
                        ) : (
                          <FaTags />
                        )}

                      </div>

                      <strong>
                        {category.name}
                      </strong>

                    </div>
                  </td>

                  {/* LANGUAGE */}

                  <td>
                    {getLanguageLabel(category.language)}
                  </td>

                  {/* SONG COUNT */}

                  <td>
                    {category.song_count ?? 0}
                  </td>

                  {/* ACTIONS */}

                  <td>
                    <div className="admin-table-actions">

                      <button
                        type="button"
                        className="admin-action-button edit"
                        title="Edit Category"
                        onClick={() => openEdit(category)}
                      >
                        <FaEdit />
                      </button>

                      <button
                        type="button"
                        className="admin-action-button delete"
                        title="Delete Category"
                        disabled={
                          deletingId === category.id
                        }
                        onClick={() =>
                          handleDelete(category)
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

      {/* ADD / EDIT MODAL */}

      {showForm && (

        <div className="admin-modal-overlay">

          <div className="admin-modal admin-category-modal">

            {/* MODAL HEADER */}

            <div className="admin-modal-header">

              <div>
                <span>KEERTHANA ADMIN</span>

                <h2>
                  {editingCategory
                    ? "Edit Category"
                    : "Add Category"}
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

            {/* MODAL ERROR - AUTOMATIC SCROLL TARGET */}

            {error && (
              <div
                ref={errorRef}
                className="admin-modal-error"
                role="alert"
                aria-live="assertive"
                tabIndex={-1}
              >
                <FaExclamationCircle />

                <span>{error}</span>
              </div>
            )}

            {/* FORM */}

            <form onSubmit={handleSubmit}>

              {/* LANGUAGE */}

              <div className="admin-field">

                <label>
                  Category Language *
                </label>

                <select
                  value={language}
                  onChange={(event) =>
                    setLanguage(event.target.value)
                  }
                  required
                  disabled={saving}
                >

                  {LANGUAGES.map((item) => (

                    <option
                      key={item.value}
                      value={item.value}
                    >
                      {item.label}
                    </option>

                  ))}

                </select>

              </div>

              {/* CATEGORY NAME */}

              <div className="admin-field">

                <label>
                  Category Name *
                </label>

                <input
                  type="text"
                  value={name}
                  onChange={(event) =>
                    setName(event.target.value)
                  }
                  placeholder={
                    language === "Telugu"
                      ? "ఉదా: ఆరాధన"
                      : language === "Hindi"
                        ? "उदाहरण: आराधना"
                        : language === "Malayalam"
                          ? "ഉദാ: ആരാധന"
                          : language === "Kannada"
                            ? "ಉದಾ: ಆರಾಧನೆ"
                            : language === "Tamil"
                              ? "உதா: ஆராதனை"
                              : "Example: Worship"
                  }
                  autoFocus
                  required
                  disabled={saving}
                />

              </div>

              {/* CATEGORY IMAGE */}

              <div className="admin-field">

                <label>
                  Category Image
                </label>

                <div className="admin-category-upload">

                  <input
                    id="category-image"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleImageChange}
                    disabled={saving}
                  />

                  <label
                    htmlFor="category-image"
                    className="admin-category-browse-button"
                  >
                    <FaUpload />
                    Browse Image
                  </label>

                  <p>
                    PNG, JPG, JPEG or WEBP
                    <br />
                    Maximum 5 MB
                  </p>

                </div>

                {/* IMAGE PREVIEW */}

                <div className="admin-category-image-preview">

                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Category preview"
                      onError={(event) => {
                        event.currentTarget.style.display =
                          "none";
                      }}
                    />
                  ) : (
                    <div className="category-empty-preview">
                      <FaTags />
                      <span>No image selected</span>
                    </div>
                  )}

                </div>

              </div>

              {/* FORM ACTIONS */}

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
                    : editingCategory
                      ? "Update Category"
                      : "Add Category"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </div>
  );
}

export default ManageCategories;
