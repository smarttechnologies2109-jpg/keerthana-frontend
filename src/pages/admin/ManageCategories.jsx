
import { useEffect, useMemo, useRef, useState } from "react";

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

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

// Normalize names before duplicate comparison.
// This ignores letter case, repeated spaces and Unicode composition differences.
const normalizeCategoryName = (value) =>
  String(value || "")
    .normalize("NFC")
    .trim()
    .replace(/\\s+/g, " ")
    .toLocaleLowerCase();

function ManageCategories() {
  const errorRef = useRef(null);

  // DATA
  const [categories, setCategories] = useState([]);

  // LOADING
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // SEARCH
  const [search, setSearch] = useState("");

  // MESSAGES
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // MODAL
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  // BILINGUAL CATEGORY NAMES
  const [nameEnglish, setNameEnglish] = useState("");
  const [nameTelugu, setNameTelugu] = useState("");

  // IMAGE
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  // SCROLL TO ERROR
  useEffect(() => {
    if (error && showForm && errorRef.current) {
      requestAnimationFrame(() => {
        errorRef.current.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      });
    }
  }, [error, showForm]);

  // LOAD CATEGORIES
  const loadCategories = async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);

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
      if (showLoader) setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // CLEAN IMAGE PREVIEW
  useEffect(() => {
    return () => {
      if (imagePreview?.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  // RESET FORM
  const resetForm = () => {
    setEditingCategory(null);
    setNameEnglish("");
    setNameTelugu("");
    setImageFile(null);
    setImagePreview("");
    setError("");
  };

  // ADD CATEGORY
  const openAdd = () => {
    resetForm();
    setSuccess("");
    setShowForm(true);
  };

  // EDIT CATEGORY
  const openEdit = (category) => {
    setEditingCategory(category);

    setNameEnglish(
      category.name_english || category.nameEnglish || category.name || ""
    );

    setNameTelugu(
      category.name_telugu || category.nameTelugu || category.name || ""
    );

    setImageFile(null);
    setImagePreview(category.image_url || "");

    setError("");
    setSuccess("");
    setShowForm(true);
  };

  // CLOSE MODAL
  const closeForm = () => {
    if (saving) return;

    setShowForm(false);
    resetForm();
  };

  // IMAGE VALIDATION
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
    setImagePreview(URL.createObjectURL(file));
  };

  // SAVE CATEGORY
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (saving) return;

    const english = nameEnglish.trim();
    const telugu = nameTelugu.trim();

    if (!english) {
      setError("Please enter the English category name.");
      return;
    }

    if (!telugu) {
      setError("దయచేసి తెలుగు కేటగిరీ పేరును నమోదు చేయండి.");
      return;
    }

    // DUPLICATE VALIDATION
    // English names are compared with English names, and Telugu with Telugu.
    // When editing, exclude the category currently being edited.
    const currentCategoryId = editingCategory?.id;

    const duplicateEnglish = categories.some((category) => {
      if (
        editingCategory &&
        String(category.id) === String(currentCategoryId)
      ) {
        return false;
      }

      const existingEnglish =
        category.name_english ||
        category.nameEnglish ||
        category.name ||
        "";

      return (
        normalizeCategoryName(existingEnglish) ===
        normalizeCategoryName(english)
      );
    });

    if (duplicateEnglish) {
      setError(
        `"${english}" already exists. Please use a different English category name.`
      );
      return;
    }

    const duplicateTelugu = categories.some((category) => {
      if (
        editingCategory &&
        String(category.id) === String(currentCategoryId)
      ) {
        return false;
      }

      const existingTelugu =
        category.name_telugu ||
        category.nameTelugu ||
        category.name ||
        "";

      return (
        normalizeCategoryName(existingTelugu) ===
        normalizeCategoryName(telugu)
      );
    });

    if (duplicateTelugu) {
      setError(
        `ఈ తెలుగు కేటగిరీ పేరు ఇప్పటికే ఉంది: "${telugu}". దయచేసి వేరే పేరు నమోదు చేయండి.`
      );
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const formData = new FormData();

      // BILINGUAL FIELDS
      formData.append("name", telugu);
      formData.append("name_english", english);
      formData.append("name_telugu", telugu);

      if (imageFile) {
        formData.append("image", imageFile);
      }

      if (editingCategory) {
        await API.put(
          `/admin/categories/${editingCategory.id}`,
          formData
        );

        setSuccess("Category updated successfully!");
      } else {
        await API.post("/admin/categories", formData);

        setSuccess("Category created successfully!");
      }

      await loadCategories(false);

      setShowForm(false);
      resetForm();

    } catch (err) {
      console.error("Save category error:", err);

      const status = err.response?.status;

      let message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Unable to save category.";

      if (status === 413) {
        message = "Image is too large. Maximum size is 5 MB.";
      } else if (status === 401) {
        message = "Your session has expired. Please log in again.";
      } else if (status === 403) {
        message = "You do not have permission to perform this action.";
      } else if (status >= 500) {
        message =
          err.response?.data?.message ||
          "Server error. Please check backend logs.";
      }

      setError(message);
    } finally {
      setSaving(false);
    }
  };

  // DELETE CATEGORY
  const handleDelete = async (category) => {
    const confirmed = window.confirm(
      `Delete category "${category.name_english || category.name}"?`
    );

    if (!confirmed) return;

    try {
      setDeletingId(category.id);
      setError("");
      setSuccess("");

      await API.delete(`/admin/categories/${category.id}`);

      setCategories((previous) =>
        previous.filter((item) => item.id !== category.id)
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

  // SEARCH BOTH LANGUAGES + ALPHABETICAL ORDER (A-Z)
  const filteredCategories = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();

    return [...categories]
      .filter((category) => {
        if (!query) return true;

        const englishName =
          category.name_english || category.nameEnglish || category.name || "";
        const teluguName =
          category.name_telugu || category.nameTelugu || category.name || "";

        return (
          String(englishName).toLocaleLowerCase().includes(query) ||
          String(teluguName).toLocaleLowerCase().includes(query)
        );
      })
      .sort((a, b) => {
        const nameA =
          a.name_english || a.nameEnglish || a.name || a.name_telugu || "";
        const nameB =
          b.name_english || b.nameEnglish || b.name || b.name_telugu || "";

        return String(nameA).localeCompare(String(nameB), "en", {
          sensitivity: "base",
          numeric: true,
        });
      });
  }, [categories, search]);

  // LOADING
  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-loading">
          Loading Categories...
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">

      {/* HEADER */}

      <div className="admin-header">
        <div>
          <span>KEERTHANA ADMIN</span>

          <h1>Manage Music Categories</h1>

          <p>
            Manage Christian music categories in English and Telugu.
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

      {/* PAGE ERROR */}

      {error && !showForm && (
        <div className="admin-error" role="alert">
          <FaExclamationCircle />
          <span>{error}</span>
        </div>
      )}

      {/* SUCCESS */}

      {success && !showForm && (
        <div className="admin-success" role="status">
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
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search English or Telugu categories..."
            aria-label="Search categories"
          />

          {search && (
            <button
              type="button"
              className="admin-category-search-clear"
              onClick={() => setSearch("")}
              aria-label="Clear category search"
              title="Clear search"
            >
              <FaTimes />
            </button>
          )}
        </div>

        <div className="admin-song-count">
          <FaTags />

          <span>
            {filteredCategories.length} Categories
          </span>
        </div>
      </div>

      {/* CATEGORY TABLE */}

      {filteredCategories.length === 0 ? (
        <div className="admin-empty-state">
          <FaTags />

          <h2>{search ? "No Matching Categories" : "No Categories Found"}</h2>

          <p>
            {search
              ? "Try another search."
              : "Create your first Christian music category."}
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
                <th className="admin-category-number-column">No.</th>
                <th>Category Image</th>
                <th>English Name</th>
                <th>Telugu Name</th>
                <th>Songs</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredCategories.map((category, index) => (
                <tr key={category.id}>
                  <td className="admin-category-number">
                    {String(index + 1).padStart(2, "0")}
                  </td>

                  <td>
                    <div className="admin-category-cell">
                      <div className="admin-category-icon">
                        {category.image_url && (
                          <img
                            src={category.image_url}
                            alt={
                              category.name_english ||
                              category.name ||
                              "Category"
                            }
                            onError={(event) => {
                              event.currentTarget.style.display = "none";
                            }}
                          />
                        )}
                      </div>
                    </div>
                  </td>

                  <td>
                    <strong>
                      {category.name_english || category.name || "-"}
                    </strong>
                  </td>

                  <td>
                    <strong>
                      {category.name_telugu || category.name || "-"}
                    </strong>
                  </td>

                  <td>
                    {category.song_count ?? 0}
                  </td>

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
                        disabled={deletingId === category.id}
                        onClick={() => handleDelete(category)}
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
                    ? "Edit Music Category"
                    : "Add Music Category"}
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

            {/* ERROR */}

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

            <form onSubmit={handleSubmit}>

              {/* ENGLISH NAME */}

              <div className="admin-field">
                <label>
                  Category Name (English) *
                </label>

                <input
                  type="text"
                  value={nameEnglish}
                  onChange={(event) =>
                    setNameEnglish(event.target.value)
                  }
                  placeholder="Example: Worship"
                  required
                  autoFocus
                  disabled={saving}
                />
              </div>

              {/* TELUGU NAME */}

              <div className="admin-field">
                <label>
                  కేటగిరీ పేరు (తెలుగు) *
                </label>

                <input
                  type="text"
                  value={nameTelugu}
                  onChange={(event) =>
                    setNameTelugu(event.target.value)
                  }
                  placeholder="ఉదాహరణ: ఆరాధన"
                  required
                  disabled={saving}
                />
              </div>

              {/* IMAGE UPLOAD */}

              <div className="admin-field">
                <label>Category Image</label>

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

                {/* NO DEFAULT IMAGE */}

                <div className="admin-category-image-preview">
                  {imagePreview && (
                    <img
                      src={imagePreview}
                      alt="Category preview"
                      onError={(event) => {
                        event.currentTarget.style.display = "none";
                      }}
                    />
                  )}
                </div>
              </div>

              {/* PREVIEW */}

              <div className="admin-category-name-preview">
                <span>Category Preview</span>

                <strong>
                  {nameEnglish || "English Name"}
                </strong>

                <strong>
                  {nameTelugu || "తెలుగు పేరు"}
                </strong>
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
