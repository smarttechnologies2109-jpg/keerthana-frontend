import { useEffect, useMemo, useRef, useState } from "react";
import Cropper from "react-easy-crop";

import {
  FaCompactDisc,
  FaEdit,
  FaPlus,
  FaSearch,
  FaTimes,
  FaTrash,
  FaImage,
} from "react-icons/fa";

import API from "../../services/api";
import { getMediaUrl } from "../../utils/media";

import "../../assets/css/admin/manageAlbums.css";


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

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

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
          rotatedCanvas, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height,
          0, 0, outputCanvas.width, outputCanvas.height
        );
        outputCanvas.toBlob(
          (blob) => blob ? resolve(blob) : reject(new Error("Could not create the cropped image.")),
          "image/jpeg", 0.92
        );
      } catch (error) { reject(error); }
    };
    image.onerror = () => reject(new Error("Could not load the selected image."));
    image.src = imageSrc;
  });

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

// =====================================================
// HELPER FUNCTIONS
// =====================================================

const getEnglishTitle = (album) =>
  album?.title_english || album?.title || "";

const getTeluguTitle = (album) =>
  album?.title_telugu || album?.title || "";

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
// COMPONENT
// =====================================================

function ManageAlbums() {
  // ===================================================
  // DATA
  // ===================================================

  const [albums, setAlbums] = useState([]);

  // ===================================================
  // PAGE STATE
  // ===================================================

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);


  // ===================================================
  // MODAL
  // ===================================================

  const [showForm, setShowForm] = useState(false);
  const [editingAlbum, setEditingAlbum] = useState(null);

  // ===================================================
  // FORM
  // ===================================================

  const initialForm = {
    title_english: "",
    title_telugu: "",
    language: "Telugu",
    release_year: "",
    cover_url: "",
  };

  const [form, setForm] = useState(initialForm);

  // ===================================================
  // COVER IMAGE
  // ===================================================

  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [cropSource, setCropSource] = useState("");
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [aspect, setAspect] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [showCropper, setShowCropper] = useState(false);
  const [cropSaving, setCropSaving] = useState(false);
  const errorMessageRef = useRef(null);

  // Automatically bring validation/API errors into view inside the modal.
  useEffect(() => {
    if (!error || !showForm || !errorMessageRef.current) return;

    requestAnimationFrame(() => {
      errorMessageRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    });
  }, [error, showForm]);

  // ===================================================
  // IMAGE PREVIEW CLEANUP
  // ===================================================

  useEffect(() => {
    return () => {
      if (coverPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(coverPreview);
      }
    };
  }, [coverPreview]);

  // ===================================================
  // CLEAR IMAGE PREVIEW
  // ===================================================

  const clearCoverPreview = () => {
    if (coverPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(coverPreview);
    }

    setCoverPreview(null);
  };

  // ===================================================
  // GET COVER URL
  // ===================================================

  const getCover = (coverUrl) => {
    if (!coverUrl || typeof coverUrl !== "string") return "";

    try {
      // Keep absolute URLs and data/blob URLs intact; normalize stored S3 keys
      // through the shared media utility.
      if (/^(https?:|data:|blob:)/i.test(coverUrl)) return coverUrl;
      return getMediaUrl(coverUrl) || "";
    } catch (error) {
      console.error("Album cover URL error:", error);
      return "";
    }
  };

  // ===================================================
  // LOAD DATA
  // ===================================================

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const albumsResponse = await API.get("/admin/albums");
      setAlbums(albumsResponse.data?.albums || []);
    } catch (error) {
      console.error("Load albums error:", error);

      setError(
        error.response?.data?.message ||
          "Unable to load albums."
      );
    } finally {
      setLoading(false);
    }
  };

  // ===================================================
  // INITIAL LOAD
  // ===================================================

  useEffect(() => {
    loadData();
  }, []);

  const resetCropState = () => {
    setShowCropper(false);
    setCropSource("");
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setAspect(1);
    setCroppedAreaPixels(null);
    setCropSaving(false);
  };

  // ===================================================
  // OPEN ADD
  // ===================================================

  const openAdd = () => {
    setEditingAlbum(null);

    setCoverFile(null);
    clearCoverPreview();
    resetCropState();

    setForm({ ...initialForm });

    setError("");
    setSuccess("");
    setShowForm(true);
  };

  // ===================================================
  // OPEN EDIT
  // ===================================================

  const openEdit = (album) => {
    setEditingAlbum(album);

    setCoverFile(null);
    clearCoverPreview();
    resetCropState();

    setCoverPreview(
      getCover(album.cover_url)
    );

    setForm({
      title_english: getEnglishTitle(album),
      title_telugu: getTeluguTitle(album),
      language: album.language || "Telugu",
      release_year: album.release_year
        ? String(album.release_year)
        : "",
      cover_url: album.cover_url || "",
    });

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
    setEditingAlbum(null);

    setCoverFile(null);
    clearCoverPreview();
    resetCropState();

    setForm({ ...initialForm });

    setError("");
  };

  // ===================================================
  // INPUT CHANGE
  // ===================================================

  const handleChange = (event) => {
    const { name, value } = event.target;

    if (name === "language") {
      setForm((previous) => ({
        ...previous,
        language: value,
      }));

      return;
    }

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // ===================================================
  // COVER IMAGE CHANGE
  // ===================================================

  const handleCoverChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setError("Only JPG, PNG or WebP images are allowed.");
      event.target.value = "";
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setError("Cover image must be smaller than 5 MB.");
      event.target.value = "";
      return;
    }
    setError("");
    const sourceUrl = URL.createObjectURL(file);
    setCropSource(sourceUrl);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setAspect(1);
    setCroppedAreaPixels(null);
    setShowCropper(true);
    event.target.value = "";
  };

  const handleCropComplete = (_area, areaPixels) => {
    setCroppedAreaPixels(areaPixels);
  };

  const closeCropper = () => {
    if (cropSaving) return;
    setShowCropper(false);
    setCropSource("");
    setCroppedAreaPixels(null);
  };

  const applyCrop = async () => {
    if (!cropSource || !croppedAreaPixels) {
      setError("Please adjust the crop area before applying.");
      return;
    }
    try {
      setCropSaving(true);
      const blob = await createCroppedImage(cropSource, croppedAreaPixels, rotation);
      const croppedFile = new File(
        [blob], `keerthana-album-cover-${Date.now()}.jpg`, { type: "image/jpeg" }
      );
      clearCoverPreview();
      setCoverFile(croppedFile);
      setCoverPreview(URL.createObjectURL(croppedFile));
      setShowCropper(false);
      setCropSource("");
      setCroppedAreaPixels(null);
      setError("");
    } catch (error) {
      console.error("Album cover crop error:", error);
      setError(error.message || "Unable to crop this image. Please try another image.");
    } finally {
      setCropSaving(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const englishTitle = form.title_english.trim();
    const teluguTitle = form.title_telugu.trim();

    if (!englishTitle) {
      setError("English album title is required.");
      return;
    }

    if (!teluguTitle) {
      setError("Telugu album title is required.");
      return;
    }

    // DUPLICATE ALBUM TITLE VALIDATION
    // Normalize Unicode, ignore case, and collapse extra spaces.
    const normalizeAlbumTitle = (value) =>
      String(value || "")
        .normalize("NFKC")
        .trim()
        .replace(/\s+/g, " ")
        .toLocaleLowerCase();

    const currentAlbumId = editingAlbum?.id;

    const duplicateEnglish = albums.some((album) => {
      if (
        currentAlbumId != null &&
        String(album.id) === String(currentAlbumId)
      ) {
        return false;
      }

      const existingEnglish =
        album.title_english || album.titleEnglish || album.title || "";

      return (
        normalizeAlbumTitle(existingEnglish) ===
        normalizeAlbumTitle(englishTitle)
      );
    });

    if (duplicateEnglish) {
      setError(
        `The English album title "${englishTitle}" already exists. Please use a unique title.`
      );
      return;
    }

    const duplicateTelugu = albums.some((album) => {
      if (
        currentAlbumId != null &&
        String(album.id) === String(currentAlbumId)
      ) {
        return false;
      }

      const existingTelugu =
        album.title_telugu || album.titleTelugu || album.title || "";

      return (
        normalizeAlbumTitle(existingTelugu) ===
        normalizeAlbumTitle(teluguTitle)
      );
    });

    if (duplicateTelugu) {
      setError(
        `The Telugu album title "${teluguTitle}" already exists. Please use a unique title.`
      );
      return;
    }

    const validLanguage = LANGUAGES.some(
      (language) =>
        language.value === normalizeLanguage(form.language)
    );

    if (!validLanguage) {
      setError("Please select a valid album language.");
      return;
    }

    if (form.release_year) {
      const year = Number(form.release_year);

      if (
        !Number.isInteger(year) ||
        year < 1900 ||
        year > 2100
      ) {
        setError("Please enter a valid release year.");
        return;
      }
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const formData = new FormData();

      // Bilingual album names
      formData.append("title_english", englishTitle);
      formData.append("title_telugu", teluguTitle);

      // Backward compatibility:
      // Keep the existing title column populated with Telugu.
      formData.append("title", teluguTitle);

      formData.append("language", form.language);
      formData.append("release_year", form.release_year || "");

      // Upload only when a new image is selected.
      if (coverFile) {
        formData.append("cover", coverFile);
      }

      // UPDATE
      if (editingAlbum) {
        await API.put(
          `/admin/albums/${editingAlbum.id}`,
          formData
        );

        setSuccess("Album updated successfully!");
      }

      // CREATE
      else {
        await API.post(
          "/admin/albums",
          formData
        );

        setSuccess("Album created successfully!");
      }

      await loadData();

      setShowForm(false);
      setEditingAlbum(null);
      setCoverFile(null);
      clearCoverPreview();
      resetCropState();

      setForm({ ...initialForm });
    } catch (error) {
      console.error("Save album error:", error);

      setError(
        error.response?.data?.message ||
          "Unable to save album."
      );
    } finally {
      setSaving(false);
    }
  };

  // ===================================================
  // DELETE ALBUM
  // ===================================================

  const handleDelete = async (album) => {
    const confirmed = window.confirm(
      `Delete album "${album?.title_english || album?.titleEnglish || "Untitled album"}"?`
    );

    if (!confirmed) return;

    try {
      setDeletingId(album.id);
      setError("");
      setSuccess("");

      await API.delete(
        `/admin/albums/${album.id}`
      );

      setAlbums((previous) =>
        previous.filter(
          (item) => item.id !== album.id
        )
      );

      setSuccess("Album deleted successfully!");
    } catch (error) {
      console.error("Delete album error:", error);

      setError(
        error.response?.data?.message ||
          "Unable to delete album."
      );
    } finally {
      setDeletingId(null);
    }
  };

  // ===================================================
  // SEARCH + LANGUAGE FILTER + ALPHABETICAL ORDER
  // ===================================================

  const filteredAlbums = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();

    return [...albums]
      .filter((album) => {
        const matchesLanguage =
          selectedLanguage === "All" ||
          normalizeLanguage(album.language) === selectedLanguage;

        const matchesSearch =
          !query ||
          [
            album.title_english || album.titleEnglish,
            normalizeLanguage(album.language),
            album.release_year,
          ]
            .filter(Boolean)
            .some((value) =>
              String(value).toLocaleLowerCase().includes(query)
            );

        return matchesLanguage && matchesSearch;
      })
      .sort((a, b) => {
        const titleA = a.title_english || a.titleEnglish || "";
        const titleB = b.title_english || b.titleEnglish || "";

        return String(titleA).localeCompare(String(titleB), "en", {
          sensitivity: "base",
          numeric: true,
        });
      });
  }, [albums, search, selectedLanguage]);

  const totalPages = Math.max(1, Math.ceil(filteredAlbums.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedAlbums = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * pageSize;
    return filteredAlbums.slice(startIndex, startIndex + pageSize);
  }, [filteredAlbums, safeCurrentPage, pageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedLanguage, pageSize]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  // ===================================================
  // LANGUAGE-WISE ALBUM COUNTS
  // ===================================================

  const languageCounts = useMemo(() => {
    const counts = {};

    LANGUAGES.forEach(({ value }) => {
      counts[value] = albums.filter(
        (album) => normalizeLanguage(album.language) === value
      ).length;
    });

    return counts;
  }, [albums]);

  // ===================================================
  // LANGUAGE LABEL
  // ===================================================

  const getLanguageLabel = (value) => {
    return (
      LANGUAGES.find(
        (language) => language.value === normalizeLanguage(value)
      )?.label || value || "—"
    );
  };

  // ===================================================
  // ALBUM DISPLAY
  // ===================================================

  const getAlbumDisplay = (album) => ({
    english: album?.title_english || album?.titleEnglish || "",
  });

  // ===================================================
  // LOADING
  // ===================================================

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-loading">
          Loading Albums...
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

          <h1>Manage Albums</h1>

          <p>
            Create and manage Christian music albums.
          </p>
        </div>

        <button
          type="button"
          className="admin-primary-button"
          onClick={openAdd}
        >
          <FaPlus />
          Add Album
        </button>
      </div>

      {/* MESSAGES */}

      {!showForm && error && (
        <div className="admin-error" role="alert">
          {error}
        </div>
      )}

      {!showForm && success && (
        <div className="admin-success">
          {success}
        </div>
      )}

      {/* LANGUAGE OVERVIEW CARDS */}

      <div className="admin-album-language-section">
        <button
          type="button"
          className={`admin-album-language-card total ${
            selectedLanguage === "All" ? "active" : ""
          }`}
          onClick={() => setSelectedLanguage("All")}
        >
          <span className="admin-album-language-label">
            All Albums
          </span>

          <strong>{albums.length}</strong>

          <small>Total albums</small>
        </button>

        {LANGUAGES.map((language) => (
          <button
            type="button"
            key={language.value}
            className={`admin-album-language-card ${
              selectedLanguage === language.value ? "active" : ""
            }`}
            onClick={() => setSelectedLanguage(language.value)}
          >
            <span className="admin-album-language-label">
              {language.label}
            </span>

            <strong>
              {languageCounts[language.value] || 0}
            </strong>

            <small>Albums</small>
          </button>
        ))}
      </div>

      {/* SEARCH + LANGUAGE FILTER */}

      <div className="admin-song-toolbar">
        <div className="admin-song-search">
          <FaSearch />

          <input
            type="text"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search English album titles..."
            aria-label="Search albums"
          />

          {search && (
            <button
              type="button"
              className="admin-album-search-clear"
              onClick={() => setSearch("")}
              aria-label="Clear album search"
              title="Clear search"
            >
              <FaTimes />
            </button>
          )}
        </div>

        <div className="admin-album-language-filter">
          <label htmlFor="album-language-filter">
            Language
          </label>

          <select
            id="album-language-filter"
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

        <div className="admin-album-pagination-size">
          <label htmlFor="album-page-size">Rows per page</label>
          <select
            id="album-page-size"
            value={pageSize}
            onChange={(event) => setPageSize(Number(event.target.value))}
          >
            {[10, 25, 50].map((size) => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        </div>

        <div className="admin-song-count">
          <FaCompactDisc />
          <span>
            {filteredAlbums.length ? (safeCurrentPage - 1) * pageSize + 1 : 0}–
            {Math.min(safeCurrentPage * pageSize, filteredAlbums.length)} of {filteredAlbums.length} Albums
          </span>
        </div>
      </div>

      {/* ALBUM TABLE */}

      {filteredAlbums.length === 0 ? (
        <div className="admin-empty-state">
          <FaCompactDisc />

          <h2>
            {search || selectedLanguage !== "All"
              ? "No Matching Albums"
              : "No Albums Found"}
          </h2>

          <p>
            {search || selectedLanguage !== "All"
              ? "Try another search or select a different language."
              : "Create your first KEERTHANA album."}
          </p>

          {!search && selectedLanguage === "All" && (
            <button
              type="button"
              className="admin-primary-button"
              onClick={openAdd}
            >
              <FaPlus />
              Add Album
            </button>
          )}
        </div>
      ) : (
        <div className="admin-table-wrapper">
          <table className="admin-song-table">

            <thead>
              <tr>
                <th className="admin-album-number-column">No.</th>
                <th>Album</th>
                <th>Language</th>
                <th>Release Year</th>
                <th>Songs</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {paginatedAlbums.map((album, index) => {
                const albumNames = getAlbumDisplay(album);
                const coverSrc = getCover(album.cover_url);

                return (
                  <tr key={album.id}>
                    <td className="admin-album-number">
                      {String((safeCurrentPage - 1) * pageSize + index + 1).padStart(2, "0")}
                    </td>

                    {/* ALBUM */}

                    <td>
                      <div className="admin-album-cell">

                        <div className="admin-album-cover">
                          {coverSrc && (
                            <img
                              src={coverSrc}
                              alt={albumNames.english}
                              onError={(event) => {
                                console.error(
                                  "Album cover failed to load:",
                                  coverSrc
                                );
                                event.currentTarget.style.display = "none";
                              }}
                            />
                          )}
                        </div>

                        <div className="admin-album-names">
                          <strong>
                            {albumNames.english || "—"}
                          </strong>

                        </div>

                      </div>
                    </td>

                    {/* LANGUAGE */}

                    <td>
                      {getLanguageLabel(album.language)}
                    </td>

                    {/* YEAR */}

                    <td>
                      {album.release_year || "—"}
                    </td>

                    {/* SONG COUNT */}

                    <td>
                      {album.song_count ?? 0}
                    </td>

                    {/* ACTIONS */}

                    <td>
                      <div className="admin-table-actions">

                        <button
                          type="button"
                          className="admin-action-button edit"
                          title="Edit Album"
                          onClick={() => openEdit(album)}
                        >
                          <FaEdit />
                        </button>

                        <button
                          type="button"
                          className="admin-action-button delete"
                          title="Delete Album"
                          disabled={deletingId === album.id}
                          onClick={() => handleDelete(album)}
                        >
                          <FaTrash />
                        </button>

                      </div>
                    </td>

                  </tr>
                );
              })}
            </tbody>

          </table>
        </div>
      )}

      {filteredAlbums.length > 0 && (
        <div className="admin-album-pagination" aria-label="Album table pagination">
          <button type="button" onClick={() => setCurrentPage(1)} disabled={safeCurrentPage === 1}>First</button>
          <button type="button" onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={safeCurrentPage === 1}>Previous</button>
          <div className="admin-album-page-numbers">
            {Array.from({ length: totalPages }, (_, index) => index + 1)
              .filter((page) => page === 1 || page === totalPages || Math.abs(page - safeCurrentPage) <= 2)
              .map((page, index, pages) => (
                <span className="admin-album-page-item" key={page}>
                  {index > 0 && page - pages[index - 1] > 1 && <span className="admin-album-page-ellipsis">…</span>}
                  <button
                    type="button"
                    className={page === safeCurrentPage ? "active" : ""}
                    aria-current={page === safeCurrentPage ? "page" : undefined}
                    onClick={() => setCurrentPage(page)}
                  >{page}</button>
                </span>
              ))}
          </div>
          <button type="button" onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} disabled={safeCurrentPage === totalPages}>Next</button>
          <button type="button" onClick={() => setCurrentPage(totalPages)} disabled={safeCurrentPage === totalPages}>Last</button>
          <span className="admin-album-page-summary">Page {safeCurrentPage} of {totalPages}</span>
        </div>
      )}

      {/* ADD / EDIT MODAL */}

      {showForm && (
        <div className="admin-modal-overlay">

          <div className="admin-modal">

            {/* HEADER */}

            <div className="admin-modal-header">
              <div>
                <span>KEERTHANA ADMIN</span>

                <h2>
                  {editingAlbum
                    ? "Edit Album"
                    : "Add Album"}
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

            {error && (
              <div
                ref={errorMessageRef}
                className="album-form-error"
                role="alert"
                aria-live="assertive"
                tabIndex={-1}
              >
                <strong>Unable to save album</strong>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>

              {/* LANGUAGE */}

              <div className="admin-field">
                <label>Album Language *</label>

                <select
                  name="language"
                  value={form.language}
                  onChange={handleChange}
                  required
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

              {/* ENGLISH TITLE */}

              <div className="admin-field">
                <label>Album Title (English) *</label>

                <input
                  type="text"
                  name="title_english"
                  value={form.title_english}
                  onChange={handleChange}
                  placeholder="Enter album title in English"
                  maxLength={255}
                  required
                />
              </div>

              {/* TELUGU TITLE */}

              <div className="admin-field">
                <label>Album Title (Telugu) *</label>

                <input
                  type="text"
                  name="title_telugu"
                  value={form.title_telugu}
                  onChange={handleChange}
                  placeholder="ఆల్బమ్ పేరు తెలుగులో నమోదు చేయండి"
                  maxLength={255}
                  required
                />
              </div>

              {/* RELEASE YEAR */}

              <div className="admin-field">
                <label>Release Year</label>

                <input
                  type="number"
                  name="release_year"
                  min="1900"
                  max="2100"
                  value={form.release_year}
                  onChange={handleChange}
                  placeholder="2026"
                />
              </div>

              {/* COVER IMAGE */}

              <div className="admin-field">
                <label>Album Cover</label>

                <div className="album-cover-upload">

                  {/* PREVIEW */}

                  <div className="album-cover-upload-preview">
                    {coverPreview && (
                      <img
                        src={coverPreview}
                        alt="Album cover preview"
                        onError={(event) => {
                          event.currentTarget.style.display =
                            "none";
                        }}
                      />
                    )}
                  </div>

                  {/* UPLOAD DETAILS */}

                  <div className="album-cover-upload-content">

                    <div className="album-cover-upload-icon">
                      <FaImage />
                    </div>

                    <strong>
                      Upload Album Cover
                    </strong>

                    <span>JPG, PNG, WEBP</span>

                    <span>Maximum 5 MB</span>

                    <label className="admin-primary-button album-cover-select">
                      <FaImage />
                      Choose Image

                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleCoverChange}
                        disabled={saving || showCropper}
                        hidden
                      />
                    </label>

                  </div>
                </div>

                <div className="album-cover-file-name">
                  {coverFile
                    ? coverFile.name
                    : editingAlbum?.cover_url
                      ? "Current image"
                      : "No image selected"}
                </div>

                <small>
                  Cover image is optional. No default image will be used.
                </small>
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
                  disabled={saving || showCropper || cropSaving}
                >
                  {saving
                    ? "Saving..."
                    : editingAlbum
                      ? "Update Album"
                      : "Add Album"}
                </button>

              </div>

            </form>

          </div>
        </div>
      )}

      {showCropper && cropSource && (
        <div className="admin-cropper-backdrop" role="dialog" aria-modal="true" aria-label="Crop album cover">
          <div className="admin-cropper-modal">
            <div className="admin-cropper-header">
              <div><h2>Crop Album Cover</h2><p>Adjust the image before saving your album.</p></div>
              <button type="button" onClick={closeCropper} disabled={cropSaving} aria-label="Close cropper"><FaTimes /></button>
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
              />
            </div>
            <div className="admin-cropper-controls">
              <div className="admin-cropper-control-group">
                <label htmlFor="album-cover-zoom">Zoom</label>
                <div className="admin-cropper-zoom-row">
                  <span>−</span>
                  <input id="album-cover-zoom" type="range" min="1" max="3" step="0.1" value={zoom} onChange={(event) => setZoom(Number(event.target.value))} />
                  <span>+</span>
                </div>
              </div>
              <div className="admin-cropper-control-group">
                <label>Aspect ratio</label>
                <div className="admin-cropper-ratios">
                  {[{ label: "1:1", value: 1 }, { label: "4:5", value: 4 / 5 }, { label: "16:9", value: 16 / 9 }].map((ratio) => (
                    <button type="button" key={ratio.label} className={aspect === ratio.value ? "active" : ""} onClick={() => setAspect(ratio.value)}>{ratio.label}</button>
                  ))}
                </div>
              </div>
              <div className="admin-cropper-control-group">
                <label>Rotate</label>
                <div className="admin-cropper-rotate-row">
                  <button type="button" onClick={() => setRotation((value) => value - 90)}>Rotate left</button>
                  <button type="button" onClick={() => setRotation((value) => value + 90)}>Rotate right</button>
                  <button type="button" onClick={() => { setCrop({ x: 0, y: 0 }); setZoom(1); setRotation(0); }}>Reset</button>
                </div>
              </div>
            </div>
            <div className="admin-cropper-footer">
              <button type="button" className="admin-cropper-cancel" onClick={closeCropper} disabled={cropSaving}>Cancel</button>
              <button type="button" className="admin-cropper-apply" onClick={applyCrop} disabled={cropSaving || !croppedAreaPixels}>{cropSaving ? "Cropping..." : "Apply Crop"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManageAlbums;