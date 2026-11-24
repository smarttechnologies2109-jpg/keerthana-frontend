import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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
import "../../assets/css/admin/addSong.dragCrop.css";


const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

const LANGUAGES = [
  { value: "Telugu", label: "Telugu" },
  { value: "Hindi", label: "Hindi" },
  { value: "English", label: "English" },
  { value: "Malayalam", label: "Malayalam" },
  { value: "Kannada", label: "Kannada" },
  { value: "Tamil", label: "Tamil" },
];

const createCroppedImage = (imageSrc, pixelCrop) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Unable to create image canvas.");

        canvas.width = Math.max(1, Math.round(pixelCrop.width));
        canvas.height = Math.max(1, Math.round(pixelCrop.height));
        context.drawImage(
          image,
          pixelCrop.x,
          pixelCrop.y,
          pixelCrop.width,
          pixelCrop.height,
          0,
          0,
          canvas.width,
          canvas.height
        );
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error("Could not create the cropped image."));
            return;
          }
          resolve(blob);
        }, "image/jpeg", 0.92);
      } catch (error) {
        reject(error);
      }
    };
    image.onerror = () => reject(new Error("Could not load the selected image."));
    image.src = imageSrc;
  });


function DragCropSelector({ imageSrc, onCropComplete }) {
  const imageRef = useRef(null);
  const frameRef = useRef(null);
  const dragRef = useRef(null);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [selection, setSelection] = useState({ x: 10, y: 10, width: 80, height: 80 });

  const getPoint = (event) => {
    const bounds = frameRef.current.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(100, ((event.clientX - bounds.left) / bounds.width) * 100)),
      y: Math.max(0, Math.min(100, ((event.clientY - bounds.top) / bounds.height) * 100)),
    };
  };

  const startDrag = (event, mode) => {
    event.preventDefault();
    event.stopPropagation();
    const point = getPoint(event);
    dragRef.current = { mode, start: point, original: selection };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const moveDrag = (event) => {
    if (!dragRef.current) return;
    const point = getPoint(event);
    const { mode, start, original } = dragRef.current;
    const dx = point.x - start.x;
    const dy = point.y - start.y;
    const minSize = 8;
    let next = { ...original };

    if (mode === "move") {
      next.x = Math.max(0, Math.min(100 - original.width, original.x + dx));
      next.y = Math.max(0, Math.min(100 - original.height, original.y + dy));
    } else {
      if (mode.includes("e")) next.width = Math.max(minSize, Math.min(100 - original.x, original.width + dx));
      if (mode.includes("s")) next.height = Math.max(minSize, Math.min(100 - original.y, original.height + dy));
      if (mode.includes("w")) {
        const right = original.x + original.width;
        next.x = Math.max(0, Math.min(right - minSize, original.x + dx));
        next.width = right - next.x;
      }
      if (mode.includes("n")) {
        const bottom = original.y + original.height;
        next.y = Math.max(0, Math.min(bottom - minSize, original.y + dy));
        next.height = bottom - next.y;
      }
    }
    setSelection(next);
  };

  const endDrag = () => {
    dragRef.current = null;
  };

  const handleImageLoad = (event) => {
    const image = event.currentTarget;
    setImageSize({ width: image.naturalWidth, height: image.naturalHeight });
    setSelection({ x: 10, y: 10, width: 80, height: 80 });
  };

  useEffect(() => {
    if (!imageSize.width || !imageSize.height || !frameRef.current) return;
    const crop = {
      x: (selection.x / 100) * imageSize.width,
      y: (selection.y / 100) * imageSize.height,
      width: (selection.width / 100) * imageSize.width,
      height: (selection.height / 100) * imageSize.height,
    };
    onCropComplete(crop);
  }, [selection, imageSize, onCropComplete]);

  return (
    <div className="admin-drag-crop-stage">
      <div className="admin-drag-crop-frame" ref={frameRef}
        onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={endDrag}>
        <img ref={imageRef} src={imageSrc} alt="Crop source" onLoad={handleImageLoad} draggable="false" />
        {imageSize.width > 0 && (
          <div className="admin-drag-crop-selection"
            style={{ left: `${selection.x}%`, top: `${selection.y}%`, width: `${selection.width}%`, height: `${selection.height}%` }}
            onPointerDown={(event) => startDrag(event, "move")}>
            {["nw", "n", "ne", "e", "se", "s", "sw", "w"].map((handle) => (
              <span key={handle} className={`admin-drag-crop-handle handle-${handle}`}
                onPointerDown={(event) => startDrag(event, handle)} />
            ))}
          </div>
        )}
      </div>
      <p className="admin-drag-crop-hint">Drag the box to move it. Drag its corners or edges to resize.</p>
    </div>
  );
}



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

  // IMAGE CROPPER
  const [cropSource, setCropSource] = useState("");
  const [cropPixels, setCropPixels] = useState(null);
  const [showCropper, setShowCropper] = useState(false);
  const [cropSaving, setCropSaving] = useState(false);

  // PAGINATION
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

// SCROLL TO ERROR
useEffect(() => {
  if (!error || !showForm) return;

  const frame = requestAnimationFrame(() => {
    errorRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });

    errorRef.current?.focus({
      preventScroll: true,
    });
  });

  return () => cancelAnimationFrame(frame);
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
      setError("Only JPG, JPEG, PNG and WEBP images are allowed.");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setError("Image size must be less than 5 MB.");
      event.target.value = "";
      return;
    }

    const sourceUrl = URL.createObjectURL(file);
    setCropSource(sourceUrl);
    setCropPixels(null);
    setShowCropper(true);
    setError("");
    setSuccess("");
  };

  const handleCropComplete = useCallback((croppedAreaPixels) => {
    setCropPixels(croppedAreaPixels);
  }, []);

  const closeCropper = () => {
    setShowCropper(false);
    if (cropSource) URL.revokeObjectURL(cropSource);
    setCropSource("");
    setCropPixels(null);
    const input = document.getElementById("category-image");
    if (input) input.value = "";
  };

  const applyCrop = async () => {
    if (!cropSource || !cropPixels) {
      setError("Please adjust the crop area before applying.");
      return;
    }

    try {
      setCropSaving(true);
      const croppedBlob = await createCroppedImage(cropSource, cropPixels);
      const croppedFile = new File(
        [croppedBlob],
        `keerthana-category-${Date.now()}.jpg`,
        { type: "image/jpeg", lastModified: Date.now() }
      );

      setImageFile(croppedFile);
      setImagePreview((previous) => {
        if (previous?.startsWith("blob:")) URL.revokeObjectURL(previous);
        return URL.createObjectURL(croppedFile);
      });
      closeCropper();
      setError("");
    } catch (cropError) {
      console.error("Category image crop error:", cropError);
      setError(cropError.message || "Unable to crop this image.");
    } finally {
      setCropSaving(false);
    }
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

        const matchesSearch =
          !query ||
          String(englishName).toLocaleLowerCase().includes(query);

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

  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedLanguage, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredCategories.length / pageSize));
  const paginatedCategories = filteredCategories.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

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
            Manage your Christian music categories.
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
            placeholder="Search categories by English name..."
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
                <th>Category Name</th>
                <th>Songs</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {paginatedCategories.map((category, index) => (
                <tr key={category.id}>

                  <td className="admin-category-number">
                    {String((currentPage - 1) * pageSize + index + 1).padStart(2, "0")}
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

      {/* PAGINATION */}
      {filteredCategories.length > 0 && (
        <div className="admin-pagination">
          <div className="admin-pagination-info">
            Showing <strong>{(currentPage - 1) * pageSize + 1}</strong>–
            <strong>{Math.min(currentPage * pageSize, filteredCategories.length)}</strong>
            {" "}of <strong>{filteredCategories.length}</strong> categories
          </div>
          <div className="admin-pagination-controls">
            <label className="admin-pagination-size">
              Rows
              <select
                value={pageSize}
                onChange={(event) => {
                  setPageSize(Number(event.target.value));
                  setCurrentPage(1);
                }}
                aria-label="Categories per page"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              per page
            </label>
            <button type="button" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>First</button>
            <button type="button" onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={currentPage === 1}>Previous</button>
            <span className="admin-pagination-current">{currentPage} / {totalPages}</span>
            <button type="button" onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} disabled={currentPage === totalPages}>Next</button>
            <button type="button" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}>Last</button>
          </div>
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

      {/* CATEGORY COVER IMAGE CROPPER */}
      {showCropper && cropSource && (
        <div className="admin-cropper-backdrop" role="dialog" aria-modal="true" aria-label="Crop category cover image">
          <div className="admin-cropper-modal">
            <div className="admin-cropper-header">
              <div>
                <h2>Crop Category Cover</h2>
                <p>Drag and resize the crop area before applying.</p>
              </div>
              <button type="button" onClick={closeCropper} disabled={cropSaving} aria-label="Close cropper"><FaTimes /></button>
            </div>
            <div className="admin-cropper-area admin-cropper-area-selection">
              <DragCropSelector
                imageSrc={cropSource}
                onCropComplete={handleCropComplete}
              />
            </div>
            <div className="admin-cropper-footer">
              <button type="button" className="admin-cropper-cancel" onClick={closeCropper} disabled={cropSaving}>Cancel</button>
              <button type="button" className="admin-cropper-apply" onClick={applyCrop} disabled={cropSaving || !cropPixels}>
                {cropSaving ? "Applying..." : "Apply Crop"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManageCategories;