import { useEffect, useMemo, useRef, useState } from "react";
import Cropper from "react-easy-crop";

import {
  FaEdit,
  FaMicrophone,
  FaPlus,
  FaSearch,
  FaTrash,
  FaTimes,
  FaImage,
} from "react-icons/fa";

import API from "../../services/api";
import { getMediaUrl } from "../../utils/media";

import "../../assets/css/admin/manageArtists.css";


// =====================================================
// LANGUAGES
// =====================================================

const LANGUAGES = [
  { value: "Telugu", label: "Telugu" },
  { value: "Hindi", label: "Hindi" },
  { value: "English", label: "English" },
  { value: "Malayalam", label: "Malayalam" },
  { value: "Kannada", label: "Kannada" },
  { value: "Tamil", label: "Tamil" },
];

// =====================================================
// NORMALIZE LANGUAGE
// =====================================================

const getEnglishArtistName = (artist) => {
  const candidates = [
    artist?.name_english,
    artist?.nameEnglish,
    artist?.english_name,
  ];

  return (
    candidates.find(
      (value) =>
        typeof value === "string" &&
        value.trim() &&
        !/[\u0C00-\u0C7F]/.test(value)
    )?.trim() || "—"
  );
};

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

// =====================================================
// EMPTY FORM
// =====================================================

const EMPTY_FORM = {
  name: "",
  name_english: "",
  name_telugu: "",
  bio: "",
  language: "Telugu",
  image_url: "",
};

// =====================================================
// IMAGE HELPERS
// =====================================================

const getArtistImage = (imageUrl) => {
  if (!imageUrl) return null;

  return getMediaUrl(imageUrl);
};

const getArtistImageUrl = (imageUrl) => {
  if (!imageUrl) return "";

  try {
    return getMediaUrl(imageUrl);
  } catch (error) {
    console.error("Artist image URL error:", error);
    return imageUrl;
  }
};

// Create a cropped image file from the selected crop area.
const createCroppedImage = (imageSrc, pixelCrop, rotation = 0) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      try {
        const radians = (rotation * Math.PI) / 180;
        const sin = Math.abs(Math.sin(radians));
        const cos = Math.abs(Math.cos(radians));
        const rotatedWidth = image.width * cos + image.height * sin;
        const rotatedHeight = image.width * sin + image.height * cos;

        const rotatedCanvas = document.createElement("canvas");
        const rotatedContext = rotatedCanvas.getContext("2d");
        if (!rotatedContext) throw new Error("Unable to create image canvas.");
        rotatedCanvas.width = Math.round(rotatedWidth);
        rotatedCanvas.height = Math.round(rotatedHeight);
        rotatedContext.translate(rotatedWidth / 2, rotatedHeight / 2);
        rotatedContext.rotate(radians);
        rotatedContext.drawImage(image, -image.width / 2, -image.height / 2);

        const outputCanvas = document.createElement("canvas");
        const outputContext = outputCanvas.getContext("2d");
        if (!outputContext) throw new Error("Unable to create cropped image canvas.");
        outputCanvas.width = Math.max(1, Math.round(pixelCrop.width));
        outputCanvas.height = Math.max(1, Math.round(pixelCrop.height));
        outputContext.drawImage(
          rotatedCanvas,
          pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height,
          0, 0, outputCanvas.width, outputCanvas.height
        );
        outputCanvas.toBlob(
          (blob) => blob
            ? resolve(blob)
            : reject(new Error("Could not create the cropped image.")),
          "image/jpeg",
          0.92
        );
      } catch (error) {
        reject(error);
      }
    };
    image.onerror = () => reject(new Error("Could not load the selected image."));
    image.src = imageSrc;
  });

// =====================================================
// COMPONENT
// =====================================================

function ManageArtists() {
  // ===================================================
  // STATE
  // ===================================================

  const [artists, setArtists] = useState([]);

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");

  const [selectedLanguage, setSelectedLanguage] =
    useState("All");

  // ===================================================
  // FORM STATE
  // ===================================================

  const [showForm, setShowForm] = useState(false);

  const [editingArtist, setEditingArtist] = useState(null);

  const [form, setForm] = useState(EMPTY_FORM);

  // ===================================================
  // IMAGE STATE
  // ===================================================

  const [imageFile, setImageFile] = useState(null);

  const [imagePreview, setImagePreview] = useState(null);

  // COVER IMAGE CROPPER
  const [cropSource, setCropSource] = useState("");
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [aspect, setAspect] = useState(1);
  const [cropPixels, setCropPixels] = useState(null);
  const [showCropper, setShowCropper] = useState(false);
  const [cropSaving, setCropSaving] = useState(false);

  // PAGINATION
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const errorRef = useRef(null);

  // ===================================================
  // SCROLL TO ERROR
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
  // LOAD ARTISTS
  // ===================================================

  const loadArtists = async () => {
    try {
      setLoading(true);

      setError("");

      const response = await API.get("/admin/artists");

      setArtists(response.data.artists || []);
    } catch (error) {
      console.error("Load artists error:", error);

      setError(
        error.response?.data?.message ||
          "Unable to load artists."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadArtists();
  }, []);

  // ===================================================
  // CLEAN IMAGE PREVIEW URL
  // ===================================================

  const clearImagePreview = () => {
    setImagePreview((previous) => {
      if (previous?.startsWith("blob:")) {
        URL.revokeObjectURL(previous);
      }

      return null;
    });
  };

  // ===================================================
  // OPEN ADD FORM
  // ===================================================

  const openAdd = () => {
    setEditingArtist(null);

    setForm({ ...EMPTY_FORM });

    setImageFile(null);

    clearImagePreview();

    setError("");

    setSuccess("");

    setShowForm(true);
  };

  // ===================================================
  // OPEN EDIT FORM
  // ===================================================

  const openEdit = (artist) => {
    setEditingArtist(artist);

    setForm({
      name: artist.name || "",

      name_english: getEnglishArtistName(artist) === "—"
        ? ""
        : getEnglishArtistName(artist),

      name_telugu:
        artist.name_telugu || artist.name || "",

      bio: artist.bio || "",

      language: normalizeLanguage(artist.language) || "Telugu",

      image_url: artist.image_url || "",
    });

    setImageFile(null);

    clearImagePreview();

    setImagePreview(
      getArtistImageUrl(artist.image_url) || null
    );

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

    setEditingArtist(null);

    setImageFile(null);

    clearImagePreview();

    setForm({ ...EMPTY_FORM });
  };

  // ===================================================
  // TEXT CHANGE
  // ===================================================

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // ===================================================
  // IMAGE CHANGE
  // ===================================================

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setError("Only JPG, PNG or WebP images are allowed.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Artist image must be smaller than 5 MB.");
      event.target.value = "";
      return;
    }

    const sourceUrl = URL.createObjectURL(file);
    setCropSource(sourceUrl);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setAspect(1);
    setCropPixels(null);
    setShowCropper(true);
    setError("");
  };

  const handleCropComplete = (_croppedArea, croppedAreaPixels) => {
    setCropPixels(croppedAreaPixels);
  };

  const closeCropper = () => {
    setShowCropper(false);
    if (cropSource) URL.revokeObjectURL(cropSource);
    setCropSource("");
    const input = document.getElementById("artist-cover-input");
    if (input) input.value = "";
  };

  const applyCrop = async () => {
    if (!cropSource || !cropPixels) {
      setError("Please adjust the crop area before applying.");
      return;
    }

    try {
      setCropSaving(true);
      const croppedBlob = await createCroppedImage(
        cropSource,
        cropPixels,
        rotation
      );
      const croppedFile = new File(
        [croppedBlob],
        `keerthana-artist-${Date.now()}.jpg`,
        { type: "image/jpeg", lastModified: Date.now() }
      );

      setImageFile(croppedFile);
      setImagePreview((previous) => {
        if (previous?.startsWith("blob:")) URL.revokeObjectURL(previous);
        return URL.createObjectURL(croppedFile);
      });
      closeCropper();
      setError("");
    } catch (err) {
      console.error("Artist image crop error:", err);
      setError(err.message || "Unable to crop the artist image.");
    } finally {
      setCropSaving(false);
    }
  };

  // ===================================================
  // SAVE ARTIST
  // ===================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    const englishName = form.name_english.trim();

    const teluguName = form.name_telugu.trim();

    if (!englishName) {
      setError("English artist name is required.");
      return;
    }

    if (!teluguName) {
      setError("Telugu artist name is required.");
      return;
    }

    const selectedLanguageIsValid = LANGUAGES.some(
      (language) => language.value === form.language
    );

    if (!selectedLanguageIsValid) {
      setError("Please select a valid language.");
      return;
    }

    // DUPLICATE NAME VALIDATION

    const normalizeArtistName = (value) =>
      String(value || "")
        .normalize("NFKC")
        .trim()
        .replace(/\s+/g, " ")
        .toLocaleLowerCase();

    const currentArtistId = editingArtist?.id;

    const duplicateEnglish = artists.some((artist) => {
      if (
        currentArtistId != null &&
        String(artist.id) === String(currentArtistId)
      ) {
        return false;
      }

      const existingEnglish =
        artist.name_english ||
        artist.nameEnglish ||
        artist.name ||
        "";

      return (
        normalizeArtistName(existingEnglish) ===
        normalizeArtistName(englishName)
      );
    });

    if (duplicateEnglish) {
      setError(
        `The English artist name "${englishName}" already exists. Please use a unique name.`
      );

      return;
    }

    const duplicateTelugu = artists.some((artist) => {
      if (
        currentArtistId != null &&
        String(artist.id) === String(currentArtistId)
      ) {
        return false;
      }

      const existingTelugu =
        artist.name_telugu ||
        artist.nameTelugu ||
        artist.name ||
        "";

      return (
        normalizeArtistName(existingTelugu) ===
        normalizeArtistName(teluguName)
      );
    });

    if (duplicateTelugu) {
      setError(
        `The Telugu artist name "${teluguName}" already exists. Please use a unique name.`
      );

      return;
    }

    try {
      setSaving(true);

      setError("");

      setSuccess("");

      const formData = new FormData();

      // Keep legacy name field for compatibility.
      // Telugu is stored in the existing name column.

      formData.append("name", teluguName);

      formData.append("name_english", englishName);

      formData.append("name_telugu", teluguName);

      formData.append("bio", form.bio.trim());

      formData.append("language", form.language);

      // Upload image only when a new file is selected.

      if (imageFile) {
        formData.append("cover", imageFile);
      }

      // UPDATE ARTIST

      if (editingArtist) {
        await API.put(
          `/admin/artists/${editingArtist.id}`,
          formData
        );

        setSuccess("Artist updated successfully!");
      }

      // CREATE ARTIST

      else {
        await API.post("/admin/artists", formData);

        setSuccess("Artist created successfully!");
      }

      await loadArtists();

      setShowForm(false);

      setEditingArtist(null);

      setImageFile(null);

      clearImagePreview();

      setForm({ ...EMPTY_FORM });
    } catch (error) {
      console.error("Save artist error:", error);

      setError(
        error.response?.data?.message ||
          "Unable to save artist."
      );
    } finally {
      setSaving(false);
    }
  };

  // ===================================================
  // DELETE ARTIST
  // ===================================================

  const handleDelete = async (artist) => {
    const displayName =
      artist.name_english ||
      artist.name ||
      "this artist";

    const confirmed = window.confirm(
      `Delete artist "${displayName}"?`
    );

    if (!confirmed) return;

    try {
      setError("");

      setSuccess("");

      await API.delete(`/admin/artists/${artist.id}`);

      setArtists((previous) =>
        previous.filter(
          (item) => item.id !== artist.id
        )
      );

      setSuccess("Artist deleted successfully!");
    } catch (error) {
      console.error("Delete artist error:", error);

      setError(
        error.response?.data?.message ||
          "Unable to delete artist."
      );
    }
  };

  // ===================================================
  // LANGUAGE-WISE ARTIST COUNTS
  // ===================================================

  const languageCounts = useMemo(() => {
    const counts = {};

    LANGUAGES.forEach(({ value }) => {
      counts[value] = artists.filter(
        (artist) =>
          normalizeLanguage(artist.language) === value
      ).length;
    });

    return counts;
  }, [artists]);

  // ===================================================
  // SEARCH + LANGUAGE FILTER + A-Z SORTING
  // ===================================================

  const filteredArtists = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();

    return [...artists]
      .filter((artist) => {
        const englishName =
          artist.name_english ||
          artist.nameEnglish ||
          "";

        const bio = artist.bio || "";
        const language = normalizeLanguage(artist.language) || "";

        const matchesSearch =
          !query ||
          String(englishName).toLocaleLowerCase().includes(query) ||
          String(bio).toLocaleLowerCase().includes(query) ||
          String(language).toLocaleLowerCase().includes(query);

        const matchesLanguage =
          selectedLanguage === "All" ||
          normalizeLanguage(artist.language) === selectedLanguage;

        return matchesSearch && matchesLanguage;
      })
      .sort((a, b) => {
        const nameA =
          a.name_english ||
          a.nameEnglish ||
          "";

        const nameB =
          b.name_english ||
          b.nameEnglish ||
          "";

        return String(nameA).localeCompare(
          String(nameB),
          "en",
          {
            sensitivity: "base",
            numeric: true,
          }
        );
      });
  }, [artists, search, selectedLanguage]);

  // Reset to the first page whenever the search or language filter changes.
  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedLanguage, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredArtists.length / pageSize));
  const paginatedArtists = filteredArtists.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // ===================================================
  // LOADING
  // ===================================================

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-loading">
          Loading Artists...
        </div>
      </div>
    );
  }

  // ===================================================
  // PAGE
  // ===================================================

  return (
    <div className="admin-page">

      {/* HEADER */}

      <div className="admin-header">
        <div>
          <span>KEERTHANA ADMIN</span>

          <h1>Manage Artists</h1>

          <p>
            Add, edit and manage Christian music artists.
          </p>
        </div>

        <button
          type="button"
          className="admin-primary-button"
          onClick={openAdd}
        >
          <FaPlus />
          Add Artist
        </button>
      </div>

      {/* MESSAGES */}

      {!showForm && error && (
        <div
          className="admin-error"
          role="alert"
          aria-live="assertive"
        >
          {error}
        </div>
      )}

      {success && (
        <div className="admin-success">
          {success}
        </div>
      )}

      {/* LANGUAGE OVERVIEW CARDS */}

      <div className="admin-artist-language-section">

        <button
          type="button"
          className={`admin-artist-language-card total ${
            selectedLanguage === "All" ? "active" : ""
          }`}
          onClick={() => setSelectedLanguage("All")}
        >
          <span className="admin-artist-language-label">
            All Artists
          </span>

          <strong>{artists.length}</strong>

          <small>Total artists</small>
        </button>

        {LANGUAGES.map((language) => (
          <button
            type="button"
            key={language.value}
            className={`admin-artist-language-card ${
              selectedLanguage === language.value ? "active" : ""
            }`}
            onClick={() =>
              setSelectedLanguage(language.value)
            }
          >
            <span className="admin-artist-language-label">
              {language.label}
            </span>

            <strong>
              {languageCounts[language.value] || 0}
            </strong>

            <small>Artists</small>
          </button>
        ))}

      </div>

      {/* SEARCH + LANGUAGE DROPDOWN */}

      <div className="admin-song-toolbar">

        <div className="admin-song-search">
          <FaSearch />

          <input
            type="text"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search artists by English name..."
            aria-label="Search artists"
          />

          {search && (
            <button
              type="button"
              className="admin-artist-search-clear"
              onClick={() => setSearch("")}
              aria-label="Clear artist search"
              title="Clear search"
            >
              <FaTimes />
            </button>
          )}
        </div>

        <div className="admin-artist-language-filter">
          <label htmlFor="artist-language-filter">
            Language
          </label>

          <select
            id="artist-language-filter"
            value={selectedLanguage}
            onChange={(event) =>
              setSelectedLanguage(event.target.value)
            }
          >
            <option value="All">
              All Languages
            </option>

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
          <FaMicrophone />

          <span>
            {filteredArtists.length} Artists
          </span>
        </div>

      </div>

      {/* ARTISTS TABLE */}

      <div className="admin-table-wrapper">
        <table className="admin-song-table">

          <thead>
            <tr>
              <th className="admin-artist-number-heading">
                No.
              </th>

              <th>Artist</th>

              <th>Language</th>

              <th>Bio</th>

              <th>Songs</th>

              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredArtists.length === 0 ? (
              <tr>
                <td
                  colSpan="6"
                  style={{
                    textAlign: "center",
                    padding: "30px",
                  }}
                >
                  No artists found.
                </td>
              </tr>
            ) : (
              paginatedArtists.map((artist, index) => (
                <tr key={artist.id}>

                  <td className="admin-artist-number">
                    {String((currentPage - 1) * pageSize + index + 1).padStart(2, "0")}
                  </td>

                  <td>
                    <div className="admin-artist-cell">

                      <div className="admin-artist-avatar">
                        {artist.image_url && (
                          <img
                            src={getArtistImage(artist.image_url)}
                            alt={artist.name || "Artist"}
                            onError={(event) => {
                              event.currentTarget.style.display = "none";
                            }}
                          />
                        )}
                      </div>

                      <div className="admin-artist-names">
                        <strong>{getEnglishArtistName(artist)}</strong>
                      </div>

                    </div>
                  </td>

                  <td>
                    {
                      LANGUAGES.find(
                        (language) =>
                          language.value ===
                          normalizeLanguage(artist.language)
                      )?.label || "—"
                    }
                  </td>

                  <td>
                    <span className="admin-table-bio">
                      {artist.bio || "—"}
                    </span>
                  </td>

                  <td>
                    {artist.song_count ?? 0}
                  </td>

                  <td>
                    <div className="admin-table-actions">

                      <button
                        type="button"
                        className="admin-action-button edit"
                        title="Edit Artist"
                        onClick={() => openEdit(artist)}
                      >
                        <FaEdit />
                      </button>

                      <button
                        type="button"
                        className="admin-action-button delete"
                        title="Delete Artist"
                        onClick={() => handleDelete(artist)}
                      >
                        <FaTrash />
                      </button>

                    </div>
                  </td>

                </tr>
              ))
            )}
          </tbody>

        </table>
      </div>

      {/* PAGINATION */}
      {filteredArtists.length > 0 && (
        <div className="admin-pagination">
          <div className="admin-pagination-info">
            Showing <strong>{(currentPage - 1) * pageSize + 1}</strong>–
            <strong>{Math.min(currentPage * pageSize, filteredArtists.length)}</strong>
            {" "}of <strong>{filteredArtists.length}</strong> artists
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
                aria-label="Artists per page"
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

          <div className="admin-modal">

            {/* MODAL HEADER */}

            <div className="admin-modal-header">
              <div>
                <span>KEERTHANA ADMIN</span>

                <h2>
                  {editingArtist
                    ? "Edit Artist"
                    : "Add Artist"}
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

            {/* FORM */}

            <form onSubmit={handleSubmit} noValidate>

              {error && (
                <div
                  ref={errorRef}
                  className="admin-error artist-form-error"
                  role="alert"
                  aria-live="assertive"
                  tabIndex="-1"
                >
                  <strong>Unable to save artist</strong>

                  <span>{error}</span>
                </div>
              )}

              {/* ENGLISH ARTIST NAME */}

              <div className="admin-field">
                <label>
                  Artist Name (English) *
                </label>

                <input
                  type="text"
                  name="name_english"
                  value={form.name_english}
                  onChange={handleChange}
                  placeholder="Example: Pr. John Wesley"
                  required
                  disabled={saving}
                />
              </div>

              {/* TELUGU ARTIST NAME */}

              <div className="admin-field">
                <label>
                  Artist Name (Telugu) *
                </label>

                <input
                  type="text"
                  name="name_telugu"
                  value={form.name_telugu}
                  onChange={handleChange}
                  placeholder="ఉదాహరణ: బ్రదర్ జాన్ వెస్లీ"
                  required
                  disabled={saving}
                />
              </div>

              {/* LANGUAGE */}

              <div className="admin-field">
                <label>
                  Artist Language *
                </label>

                <select
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
              </div>

              {/* BIO */}

              <div className="admin-field">
                <label>Biography</label>

                <textarea
                  name="bio"
                  rows="6"
                  value={form.bio}
                  onChange={handleChange}
                  placeholder="Short artist biography..."
                  disabled={saving}
                />
              </div>

              {/* ARTIST IMAGE */}

              <div className="admin-field">
                <label>Artist Cover Image</label>

                <div className="artist-image-upload">

                  {/* IMAGE PREVIEW */}

                  <div className="artist-image-preview">
                    {imagePreview && (
                      <img
                        src={imagePreview}
                        alt="Artist preview"
                        onError={(event) => {
                          event.currentTarget.style.display =
                            "none";
                        }}
                      />
                    )}
                  </div>

                  {/* CHOOSE IMAGE */}

                  <label
                    htmlFor="artist-cover-input"
                    className="artist-file-button"
                  >
                    <FaImage />

                    {imageFile
                      ? "Change Image"
                      : "Choose Image"}
                  </label>

                  <input
                    id="artist-cover-input"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleImageChange}
                    disabled={saving}
                    style={{ display: "none" }}
                  />

                  {/* FILE NAME */}

                  <div className="artist-file-name">
                    {imageFile
                      ? imageFile.name
                      : editingArtist?.image_url
                        ? "Current image"
                        : "No image selected"}
                  </div>

                  <small>
                    JPG, PNG or WebP. Maximum 5 MB.
                  </small>

                </div>
              </div>

              {/* FORM ACTIONS */}

              <div className="admin-form-actions">

                <button
                  type="button"
                  className="admin-cancel-button"
                  onClick={closeForm}
                  disabled={saving}
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
                    : editingArtist
                      ? "Update Artist"
                      : "Add Artist"}
                </button>

              </div>

            </form>
          </div>
        </div>
      )}

      {/* COVER IMAGE CROPPER */}
      {showCropper && cropSource && (
        <div className="admin-cropper-backdrop" role="dialog" aria-modal="true" aria-label="Crop artist cover image">
          <div className="admin-cropper-modal">
            <div className="admin-cropper-header">
              <div>
                <h2>Crop Artist Cover</h2>
                <p>Adjust the image before saving. Square crop is recommended.</p>
              </div>
              <button type="button" onClick={closeCropper} disabled={cropSaving} aria-label="Close cropper">
                <FaTimes />
              </button>
            </div>

            <div className="admin-cropper-area">
              <Cropper
                image={cropSource}
                crop={crop}
                zoom={zoom}
                rotation={rotation}
                aspect={aspect}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onRotationChange={setRotation}
                onCropComplete={handleCropComplete}
                restrictPosition
              />
            </div>

            <div className="admin-cropper-controls">
              <div className="admin-cropper-control-group">
                <label htmlFor="artist-crop-zoom">Zoom</label>
                <div className="admin-cropper-zoom-row">
                  <span>−</span>
                  <input id="artist-crop-zoom" type="range" min="1" max="3" step="0.1" value={zoom} onChange={(event) => setZoom(Number(event.target.value))} />
                  <span>+</span>
                </div>
              </div>

              <div className="admin-cropper-control-group">
                <label>Aspect ratio</label>
                <div className="admin-cropper-ratios">
                  <button type="button" className={aspect === 1 ? "active" : ""} onClick={() => setAspect(1)}>Square</button>
                  <button type="button" className={aspect === 4 / 5 ? "active" : ""} onClick={() => setAspect(4 / 5)}>Portrait</button>
                  <button type="button" className={aspect === 16 / 9 ? "active" : ""} onClick={() => setAspect(16 / 9)}>Landscape</button>
                </div>
              </div>

              <div className="admin-cropper-control-group">
                <label>Rotate</label>
                <div className="admin-cropper-rotate-row">
                  <button type="button" onClick={() => setRotation((value) => value - 90)}>Rotate left</button>
                  <button type="button" onClick={() => setRotation((value) => value + 90)}>Rotate right</button>
                </div>
              </div>
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

export default ManageArtists;