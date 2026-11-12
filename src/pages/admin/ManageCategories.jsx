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

const LANGUAGES = [
  { value: "Telugu", label: "తెలుగు" },
  { value: "Hindi", label: "हिन्दी" },
  { value: "English", label: "English" },
  { value: "Malayalam", label: "മലയാളം" },
  { value: "Kannada", label: "ಕನ್ನಡ" },
  { value: "Tamil", label: "தமிழ்" },
];

const normalizeCategoryName = (value) =>
  String(value || "")
    .normalize("NFC")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase();

const normalizeLanguage = (value) => {
  const language = String(value || "").trim().toLowerCase();

  const aliases = {
    te: "Telugu",
    "te-in": "Telugu",
    telugu: "Telugu",

    hi: "Hindi",
    "hi-in": "Hindi",
    hindi: "Hindi",

    en: "English",
    "en-in": "English",
    english: "English",

    ml: "Malayalam",
    "ml-in": "Malayalam",
    malayalam: "Malayalam",

    kn: "Kannada",
    "kn-in": "Kannada",
    kannada: "Kannada",

    ta: "Tamil",
    "ta-in": "Tamil",
    tamil: "Tamil",
  };

  return aliases[language] || "";
};

const getSongCategoryId = (song) =>
  song?.category_id ??
  song?.categoryId ??
  song?.category?.id ??
  null;

const getSongLanguage = (song) =>
  normalizeLanguage(song?.language || song?.language_name);

// Existing categories do not have a language column in the current form/API.
// Treat categories without an explicit language as Telugu (the app's current
// default category language). If the backend later returns category.language,
// that value will be used automatically.
const getCategoryLanguage = (category) =>
  normalizeLanguage(
    category?.language ||
      category?.language_name ||
      category?.languageName
  ) || "Telugu";

const getCategoryEnglishName = (category) =>
  category?.name_english ||
  category?.nameEnglish ||
  category?.name ||
  "";

const getCategoryTeluguName = (category) =>
  category?.name_telugu ||
  category?.nameTelugu ||
  category?.name ||
  "";

const getSongCategoryName = (song) =>
  song?.category_name ||
  song?.categoryName ||
  (typeof song?.category === "string" ? song.category : "") ||
  "";

function ManageCategories() {
  const errorRef = useRef(null);

  // DATA
  const [categories, setCategories] = useState([]);
  const [songs, setSongs] = useState([]);

  // LOADING
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // FILTERS
  const [search, setSearch] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("All");

  // MESSAGES
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // MODAL
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  // CATEGORY NAMES
  const [nameEnglish, setNameEnglish] = useState("");
  const [nameTelugu, setNameTelugu] = useState("");

  // IMAGE
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  // SCROLL TO ERROR
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

  // LOAD CATEGORIES AND SONGS
  const loadCategories = async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);

      setError("");

      const [categoryResult, songResult] = await Promise.allSettled([
        API.get("/admin/categories"),
        API.get("/songs"),
      ]);

      if (categoryResult.status === "fulfilled") {
        const categoryData = categoryResult.value.data;

        setCategories(
          categoryData?.categories ||
          categoryData?.data?.categories ||
          []
        );
      } else {
        throw categoryResult.reason;
      }

      if (songResult.status === "fulfilled") {
        const songData = songResult.value.data;

        setSongs(
          Array.isArray(songData)
            ? songData
            : songData?.songs ||
              songData?.data?.songs ||
              []
        );
      } else {
        console.warn(
          "Unable to load songs for language counts:",
          songResult.reason
        );

        setSongs([]);
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
      category.name_english ||
      category.nameEnglish ||
      category.name ||
      ""
    );

    setNameTelugu(
      category.name_telugu ||
      category.nameTelugu ||
      category.name ||
      ""
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
      setError(
        "దయచేసి తెలుగు కేటగిరీ పేరును నమోదు చేయండి."
      );
      return;
    }

    const currentCategoryId = editingCategory?.id;

    // CHECK DUPLICATE ENGLISH NAME
    const duplicateEnglish = categories.some((category) => {
      if (
        editingCategory &&
        String(category.id) === String(currentCategoryId)
      ) {
        return false;
      }

      return (
        normalizeCategoryName(getCategoryEnglishName(category)) ===
        normalizeCategoryName(english)
      );
    });

    if (duplicateEnglish) {
      setError(
        `"${english}" already exists. Please use a different English category name.`
      );
      return;
    }

    // CHECK DUPLICATE TELUGU NAME
    const duplicateTelugu = categories.some((category) => {
      if (
        editingCategory &&
        String(category.id) === String(currentCategoryId)
      ) {
        return false;
      }

      return (
        normalizeCategoryName(getCategoryTeluguName(category)) ===
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
      `Delete category "${getCategoryEnglishName(category)}"?`
    );

    if (!confirmed) return;

    try {
      setDeletingId(category.id);
      setError("");
      setSuccess("");

      await API.delete(`/admin/categories/${category.id}`);

      setCategories((previous) =>
        previous.filter(
          (item) => String(item.id) !== String(category.id)
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

  // CHECK WHETHER A SONG BELONGS TO A CATEGORY
  const songBelongsToCategory = (song, category) => {
    const songCategoryId = getSongCategoryId(song);

    if (songCategoryId !== null && songCategoryId !== undefined) {
      return String(songCategoryId) === String(category.id);
    }

    const songCategoryName = normalizeCategoryName(
      getSongCategoryName(song)
    );

    const englishName = normalizeCategoryName(
      getCategoryEnglishName(category)
    );

    const teluguName = normalizeCategoryName(
      getCategoryTeluguName(category)
    );

    return (
      songCategoryName &&
      (
        songCategoryName === englishName ||
        songCategoryName === teluguName
      )
    );
  };

  // SONG COUNT FOR EACH CATEGORY
  const getCategorySongCount = (category, language = "All") => {
    if (songs.length === 0 && language === "All") {
      return Number(category.song_count || 0);
    }

    return songs.filter((song) => {
      const belongsToCategory = songBelongsToCategory(
        song,
        category
      );

      const matchesLanguage =
        language === "All" ||
        getSongLanguage(song) === language;

      return belongsToCategory && matchesLanguage;
    }).length;
  };

  // LANGUAGE-WISE CATEGORY COUNTS
  // Count category records by their own language, not by linked songs.
  // Categories without a saved language are counted as Telugu.
  const languageCounts = useMemo(() => {
    const counts = {};

    LANGUAGES.forEach(({ value }) => {
      counts[value] = categories.filter(
        (category) => getCategoryLanguage(category) === value
      ).length;
    });

    return counts;
  }, [categories]);

  // FILTER CATEGORIES
  const filteredCategories = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();

    return [...categories]
      .filter((category) => {
        const englishName = getCategoryEnglishName(category);
        const teluguName = getCategoryTeluguName(category);

        const matchesSearch =
          !query ||
          String(englishName).toLocaleLowerCase().includes(query) ||
          String(teluguName).toLocaleLowerCase().includes(query);

        const matchesLanguage =
          selectedLanguage === "All" ||
          getCategoryLanguage(category) === selectedLanguage;

        return matchesSearch && matchesLanguage;
      })
      .sort((a, b) => {
        return getCategoryEnglishName(a).localeCompare(
          getCategoryEnglishName(b),
          "en",
          {
            sensitivity: "base",
            numeric: true,
          }
        );
      });
  }, [categories, songs, search, selectedLanguage]);

  const totalSongs = songs.length;

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

      {/* LANGUAGE OVERVIEW CARDS */}

      <div className="admin-category-language-section">

        <button
          type="button"
          className={`admin-category-language-card total ${
            selectedLanguage === "All" ? "active" : ""
          }`}
          onClick={() => setSelectedLanguage("All")}
        >
          <span className="admin-category-language-label">
            All Categories
          </span>

          <strong>{categories.length}</strong>

          <small>
            {totalSongs.toLocaleString()} total songs
          </small>
        </button>

        {LANGUAGES.map((language) => (
          <button
            type="button"
            key={language.value}
            className={`admin-category-language-card ${
              selectedLanguage === language.value ? "active" : ""
            }`}
            onClick={() => setSelectedLanguage(language.value)}
          >
            <span className="admin-category-language-label">
              {language.label}
            </span>

            <strong>
              {languageCounts[language.value] || 0}
            </strong>

            <small>Categories with songs</small>
          </button>
        ))}
      </div>

      {/* SEARCH AND LANGUAGE FILTER */}

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

        <div className="admin-category-language-filter">
          <label htmlFor="category-language-filter">
            Language
          </label>

          <select
            id="category-language-filter"
            value={selectedLanguage}
            onChange={(event) =>
              setSelectedLanguage(event.target.value)
            }
          >
            <option value="All">All Languages</option>

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

          <h2>
            {search || selectedLanguage !== "All"
              ? "No Matching Categories"
              : "No Categories Found"}
          </h2>

          <p>
            {search || selectedLanguage !== "All"
              ? "No categories with songs were found for this language and search. Try another language or search."
              : "Create your first Christian music category."}
          </p>

          {!search && selectedLanguage === "All" && (
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
                <th className="admin-category-number-column">
                  No.
                </th>

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
                              getCategoryEnglishName(category) ||
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
                      {getCategoryEnglishName(category) || "-"}
                    </strong>
                  </td>

                  <td>
                    <strong>
                      {getCategoryTeluguName(category) || "-"}
                    </strong>
                  </td>

                  <td>
                    {getCategorySongCount(
                      category,
                      selectedLanguage
                    ).toLocaleString()}
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