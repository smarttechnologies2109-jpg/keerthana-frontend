import { useEffect, useRef, useState } from "react";
import Cropper from "react-easy-crop";
import { useNavigate, useParams } from "react-router-dom";
import {
  FaArrowLeft,
  FaCloudUploadAlt,
  FaImage,
  FaMusic,
  FaSave,
  FaSearch,
  FaTimes,
} from "react-icons/fa";

import API from "../../services/api";
import { getMediaUrl } from "../../utils/media";
import "../../assets/css/admin/editSong.css";


const LANGUAGES = [
  { value: "Telugu", label: "తెలుగు" },
  { value: "Hindi", label: "हिन्दी" },
  { value: "English", label: "English" },
  { value: "Malayalam", label: "മലയാളം" },
  { value: "Kannada", label: "ಕನ್ನಡ" },
  { value: "Tamil", label: "தமிழ்" },
];

const LANGUAGE_CONFIG = {
  Telugu: {
    titleLabel: "Song Title (Telugu)",
    lyricsPlaceholder: "తెలుగు పాట సాహిత్యాన్ని నమోదు చేయండి...",
  },
  Hindi: {
    titleLabel: "Song Title (Hindi)",
    lyricsPlaceholder: "गीत के बोल दर्ज करें...",
  },
  English: {
    titleLabel: "Song Title (English)",
    lyricsPlaceholder: "Enter song lyrics...",
  },
  Malayalam: {
    titleLabel: "Song Title (Malayalam)",
    lyricsPlaceholder: "പാട്ടിന്റെ വരികൾ നൽകുക...",
  },
  Kannada: {
    titleLabel: "Song Title (Kannada)",
    lyricsPlaceholder: "ಹಾಡಿನ ಸಾಹಿತ್ಯವನ್ನು ನಮೂದಿಸಿ...",
  },
  Tamil: {
    titleLabel: "Song Title (Tamil)",
    lyricsPlaceholder: "பாடல் வரிகளை உள்ளிடவும்...",
  },
};

const EMPTY_FORM = {
  title: "",
  title_english: "",
  language: "Telugu",
  lyrics: "",
  artist_id: "",
  album_id: "",
  category_id: "",
  ministry_id: "",
};

const getList = (data, key) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.[key])) return data[key];
  if (Array.isArray(data?.data?.[key])) return data.data[key];
  return [];
};

const normalizeText = (value) =>
  String(value || "").normalize("NFKC").trim().toLocaleLowerCase();

const getBilingualLabel = (english, telugu, fallback = "") => {
  const en = String(english || "").trim();
  const te = String(telugu || "").trim();

  if (en && te && normalizeText(en) !== normalizeText(te)) {
    return `${en} / ${te}`;
  }

  return en || te || fallback;
};

const getEntityLabel = (item, type) => {
  if (!item) return "";

  if (type === "artist") {
    return getBilingualLabel(
      item.name_english,
      item.name_telugu || item.name,
      "Unnamed Artist"
    );
  }

  if (type === "album") {
    return getBilingualLabel(
      item.title_english,
      item.title_telugu || item.title || item.name,
      "Untitled Album"
    );
  }

  if (type === "category") {
    return getBilingualLabel(
      item.name_english,
      item.name_telugu || item.name,
      "Unnamed Category"
    );
  }

  return getBilingualLabel(
    item.name_english,
    item.name_telugu || item.name,
    "Unnamed Ministry"
  );
};

function SearchableDropdown({
  options = [],
  value = "",
  onChange,
  placeholder = "Select an option",
  searchPlaceholder = "Type to search...",
  emptyText = "No matching options found.",
  getLabel,
  getSearchText,
  disabled = false,
  allowClear = false,
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef(null);
  const searchRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false);
        setQuery("");
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
        setQuery("");
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  useEffect(() => {
    if (open) {
      const frame = requestAnimationFrame(() => searchRef.current?.focus());
      return () => cancelAnimationFrame(frame);
    }
  }, [open]);

  const selectedOption = options.find(
    (option) => String(option.id) === String(value)
  );
  const selectedLabel = selectedOption ? getLabel(selectedOption) : "";
  const normalizedQuery = normalizeText(query);

  const visibleOptions = options.filter((option) => {
    if (!normalizedQuery) return true;
    const searchable = getSearchText
      ? getSearchText(option)
      : getLabel(option);
    return normalizeText(searchable).includes(normalizedQuery);
  });

  const chooseOption = (option) => {
    onChange(String(option.id));
    setOpen(false);
    setQuery("");
  };

  return (
   <div
  className={`admin-searchable-dropdown ${open ? "is-open" : ""}`}
  ref={rootRef}
>
      <button
        type="button"
        className={`admin-searchable-trigger${open ? " is-open" : ""}`}
        onClick={() => setOpen((previous) => !previous)}
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
      >
        <span className={selectedLabel ? "has-value" : "is-placeholder"}>
          {selectedLabel || placeholder}
        </span>
        <span className="admin-searchable-chevron" aria-hidden="true">
          ▾
        </span>
      </button>

      {open && (
        <div className="admin-searchable-menu">
          <div className="admin-searchable-input-wrap">
            <FaSearch aria-hidden="true" />
            <input
              ref={searchRef}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              onKeyDown={(event) => {
                if (event.key === "Enter" && visibleOptions.length > 0) {
                  event.preventDefault();
                  chooseOption(visibleOptions[0]);
                }
              }}
            />
            {query && (
              <button
                type="button"
                className="admin-searchable-clear"
                onClick={() => setQuery("")}
                aria-label="Clear search"
              >
                <FaTimes />
              </button>
            )}
          </div>

          <div className="admin-searchable-options" role="listbox">
            {allowClear && (
              <button
                type="button"
                role="option"
                aria-selected={!value}
                className={`admin-searchable-option${!value ? " is-selected" : ""}`}
                onClick={() => {
                  onChange("");
                  setOpen(false);
                  setQuery("");
                }}
              >
                <span>{placeholder}</span>
                {!value && <span className="admin-searchable-check">✓</span>}
              </button>
            )}

            {visibleOptions.length > 0 ? (
              visibleOptions.map((option) => (
                <button
                  type="button"
                  role="option"
                  aria-selected={String(option.id) === String(value)}
                  className={`admin-searchable-option${
                    String(option.id) === String(value) ? " is-selected" : ""
                  }`}
                  key={option.id}
                  onClick={() => chooseOption(option)}
                >
                  <span>{getLabel(option)}</span>
                  {String(option.id) === String(value) && (
                    <span className="admin-searchable-check">✓</span>
                  )}
                </button>
              ))
            ) : (
              <div className="admin-searchable-empty">{emptyText}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


function MultiArtistDropdown({ options = [], value = [], onChange, disabled = false }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef(null);
  const searchRef = useRef(null);
  const selectedIds = (Array.isArray(value) ? value : []).map(String);
  const selectedArtists = selectedIds.map((id) => options.find((a) => String(a.id) === id)).filter(Boolean);

  useEffect(() => {
    const outside = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false);
        setQuery("");
      }
    };
    const escape = (event) => {
      if (event.key === "Escape") { setOpen(false); setQuery(""); }
    };
    document.addEventListener("mousedown", outside);
    document.addEventListener("touchstart", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("mousedown", outside);
      document.removeEventListener("touchstart", outside);
      document.removeEventListener("keydown", escape);
    };
  }, []);

  useEffect(() => {
    if (open) {
      const frame = requestAnimationFrame(() => searchRef.current?.focus());
      return () => cancelAnimationFrame(frame);
    }
  }, [open]);

  const filtered = options.filter((artist) =>
    normalizeText(`${artist.name_english || ""} ${artist.name_telugu || ""} ${artist.name || ""}`)
      .includes(normalizeText(query))
  );
  const toggle = (artistId) => {
    const id = String(artistId);
    onChange(selectedIds.includes(id) ? selectedIds.filter((item) => item !== id) : [...selectedIds, id]);
  };

  return (
    <div className={`admin-searchable-dropdown admin-multi-artist ${open ? "is-open" : ""}`} ref={rootRef}>
      <button type="button" className={`admin-searchable-trigger${open ? " is-open" : ""}`}
        onClick={() => setOpen((previous) => !previous)} aria-haspopup="listbox"
        aria-expanded={open} disabled={disabled}>
        <span className={selectedIds.length ? "has-value" : "is-placeholder"}>
          {selectedIds.length ? `${selectedIds.length} artist${selectedIds.length === 1 ? "" : "s"} selected` : "Select one or more artists"}
        </span>
        <span className="admin-searchable-chevron" aria-hidden="true">▾</span>
      </button>

      {selectedArtists.length > 0 && (
        <div className="admin-multi-artist-selected" style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
          {selectedArtists.map((artist) => (
            <span className="admin-multi-artist-chip" key={artist.id}
              style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "6px 10px", borderRadius: 20, background: "rgba(30, 64, 120, 0.12)" }}>
              {getEntityLabel(artist, "artist")}
              <button type="button" disabled={disabled}
                aria-label={`Remove ${getEntityLabel(artist, "artist")}`}
                onClick={() => toggle(artist.id)} style={{ border: 0, background: "transparent", cursor: "pointer" }}>
                <FaTimes />
              </button>
            </span>
          ))}
        </div>
      )}

      {open && (
        <div className="admin-searchable-menu">
          <div className="admin-searchable-input-wrap">
            <FaSearch aria-hidden="true" />
            <input ref={searchRef} type="search" value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search artist in English or Telugu..." aria-label="Search artists" />
            {query && <button type="button" className="admin-searchable-clear"
              onClick={() => setQuery("")} aria-label="Clear search"><FaTimes /></button>}
          </div>
          <div className="admin-searchable-options" role="listbox" aria-multiselectable="true">
            {filtered.length ? filtered.map((artist) => {
              const checked = selectedIds.includes(String(artist.id));
              return (
                <button type="button" role="option" aria-selected={checked}
                  className={`admin-searchable-option${checked ? " is-selected" : ""}`}
                  key={artist.id} onClick={() => toggle(artist.id)}>
                  <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <input type="checkbox" checked={checked} readOnly tabIndex={-1} />
                    {getEntityLabel(artist, "artist")}
                  </span>
                  {checked && <span className="admin-searchable-check">✓</span>}
                </button>
              );
            }) : <div className="admin-searchable-empty">No artists found.</div>}
          </div>
          <div style={{ padding: "10px 12px", fontSize: 12, opacity: 0.75 }}>
            Select multiple artists. Click a selected artist again to remove it.
          </div>
        </div>
      )}
    </div>
  );
}

/* =====================================================
   IMAGE CROPPER HELPER
===================================================== */

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

function EditSong() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [form, setForm] = useState(EMPTY_FORM);
  const [originalForm, setOriginalForm] = useState(EMPTY_FORM);
  const [selectedArtistIds, setSelectedArtistIds] = useState([]);

  const [existingAudio, setExistingAudio] = useState("");
  const [existingCover, setExistingCover] = useState("");
  const [audioFile, setAudioFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState("");

  // COVER CROPPER (shared with Add Song)
  const [cropSource, setCropSource] = useState("");
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [aspect, setAspect] = useState(1);
  const [cropPixels, setCropPixels] = useState(null);
  const [showCropper, setShowCropper] = useState(false);
  const [cropSaving, setCropSaving] = useState(false);

  const [artists, setArtists] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [categories, setCategories] = useState([]);
  const [ministries, setMinistries] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const errorRef = useRef(null);


useEffect(() => {
  if (!error || loading) return;

  const frame = requestAnimationFrame(() => {
    errorRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });

    errorRef.current?.focus({ preventScroll: true });
  });

  return () => cancelAnimationFrame(frame);
}, [error, loading]);


  const selectedLanguage =
    LANGUAGE_CONFIG[form.language] || LANGUAGE_CONFIG.Telugu;

  useEffect(() => {
    let active = true;

    const loadPage = async () => {
      try {
        setLoading(true);
        setError("");

        const [
          songResponse,
          artistsResponse,
          albumsResponse,
          categoriesResponse,
          ministriesResponse,
        ] = await Promise.all([
          API.get(`/admin/songs/${id}`),
          API.get("/artists"),
          API.get("/albums"),
          API.get("/categories"),
          API.get("/ministries"),
        ]);

        if (!active) return;

        const song = songResponse.data?.song;
        if (!song) throw new Error("Song details were not found.");

        const loadedForm = {
          title: song.title || "",
          title_english: song.title_english || "",
          language: song.language || "Telugu",
          lyrics: song.lyrics || "",
          artist_id:
            song.artist_id !== null && song.artist_id !== undefined
              ? String(song.artist_id)
              : "",
          album_id:
            song.album_id !== null && song.album_id !== undefined
              ? String(song.album_id)
              : "",
          category_id:
            song.category_id !== null && song.category_id !== undefined
              ? String(song.category_id)
              : "",
          ministry_id:
            song.ministry_id !== null && song.ministry_id !== undefined
              ? String(song.ministry_id)
              : "",
        };

        const songArtistIds = Array.isArray(song.artist_ids)
          ? song.artist_ids.map((artist) => String(typeof artist === "object" ? artist.id : artist))
          : Array.isArray(song.artists)
          ? song.artists.map((artist) => String(typeof artist === "object" ? artist.id : artist))
          : song.artist_id !== null && song.artist_id !== undefined
          ? [String(song.artist_id)]
          : [];

        setSelectedArtistIds(songArtistIds);
        setForm(loadedForm);
        setOriginalForm({ ...loadedForm, artist_ids: [...songArtistIds] });
        setExistingAudio(song.audio_url || "");
        setExistingCover(song.cover_url || "");

        setArtists(getList(artistsResponse.data, "artists"));
        setAlbums(getList(albumsResponse.data, "albums"));
        setCategories(getList(categoriesResponse.data, "categories"));
        setMinistries(getList(ministriesResponse.data, "ministries"));
      } catch (err) {
        console.error("Edit song load error:", err);
        if (active) {
          setError(
            err.response?.data?.message ||
              err.message ||
              "Unable to load song details."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    loadPage();
    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    return () => {
      if (coverPreview) URL.revokeObjectURL(coverPreview);
    };
  }, [coverPreview]);

  useEffect(() => {
    return () => {
      if (cropSource) URL.revokeObjectURL(cropSource);
    };
  }, [cropSource]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
    setError("");
    setSuccess("");
  };

  const handleRelationshipChange = (field, value) => {
    setForm((previous) => ({ ...previous, [field]: value }));
    setError("");
    setSuccess("");
  };

  const handleAudioChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = [
      "audio/mpeg",
      "audio/mp3",
      "audio/mp4",
      "audio/x-m4a",
      "application/octet-stream",
    ];
    const validExtension = /\.(mp3|m4a)$/i.test(file.name);

    if (!allowedTypes.includes(file.type) && !validExtension) {
      setError("Please choose an MP3 or M4A audio file.");
      event.target.value = "";
      return;
    }

    if (!file.size || file.size > 30 * 1024 * 1024) {
      setError("Audio file must be non-empty and smaller than 30 MB.");
      event.target.value = "";
      return;
    }

    setAudioFile(file);
    setError("");
    setSuccess("");
  };

  const handleCoverChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setError("Cover must be JPG, PNG or WebP.");
      event.target.value = "";
      return;
    }

    if (!file.size || file.size > 10 * 1024 * 1024) {
      setError("Cover image must be non-empty and smaller than 10 MB.");
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
    setSuccess("");
  };

  const handleCropComplete = (_croppedArea, croppedAreaPixels) => {
    setCropPixels(croppedAreaPixels);
  };

  const closeCropper = () => {
    setShowCropper(false);
    if (cropSource) URL.revokeObjectURL(cropSource);
    setCropSource("");
    const input = document.getElementById("edit-song-cover");
    if (input) input.value = "";
  };

  const applyCrop = async () => {
    if (!cropSource || !cropPixels) {
      setError("Please adjust the crop area before applying.");
      return;
    }

    try {
      setCropSaving(true);
      const croppedBlob = await createCroppedImage(cropSource, cropPixels, rotation);
      const croppedFile = new File(
        [croppedBlob],
        `keerthana-cover-${Date.now()}.jpg`,
        { type: "image/jpeg", lastModified: Date.now() }
      );

      setCoverFile(croppedFile);
      setCoverPreview((previous) => {
        if (previous) URL.revokeObjectURL(previous);
        return URL.createObjectURL(croppedFile);
      });
      closeCropper();
      setError("");
      setSuccess("");
    } catch (err) {
      console.error("Cover crop error:", err);
      setError(err.message || "Unable to crop the cover image.");
    } finally {
      setCropSaving(false);
    }
  };

  const removeNewAudio = () => {
    setAudioFile(null);
    const input = document.getElementById("edit-song-audio");
    if (input) input.value = "";
  };

  const removeNewCover = () => {
    if (coverPreview) URL.revokeObjectURL(coverPreview);
    setCoverFile(null);
    setCoverPreview("");
    const input = document.getElementById("edit-song-cover");
    if (input) input.value = "";
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "0 MB";
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!form.title.trim()) {
      setError("Song title is required.");
      return;
    }

    if (!LANGUAGES.some((item) => item.value === form.language)) {
      setError("Please select a valid song language.");
      return;
    }

    if (selectedArtistIds.length === 0) {
      setError("Please select at least one artist.");
      return;
    }

    const changedFields = [
      "title",
      "title_english",
      "language",
      "lyrics",
      "album_id",
      "category_id",
      "ministry_id",
    ];

    const formData = new FormData();
    let hasChanges = false;

    changedFields.forEach((field) => {
      const currentValue = String(form[field] ?? "");
      const originalValue = String(originalForm[field] ?? "");
      if (currentValue !== originalValue) {
        formData.append(field, currentValue);
        hasChanges = true;
      }
    });

    const originalArtistIds = Array.isArray(originalForm.artist_ids)
      ? originalForm.artist_ids.map(String)
      : [];
    const artistSelectionChanged =
      selectedArtistIds.length !== originalArtistIds.length ||
      selectedArtistIds.some((artistId, index) => artistId !== originalArtistIds[index]);

    if (artistSelectionChanged) {
      formData.append("artist_ids", JSON.stringify(selectedArtistIds));
      formData.append("artist_id", selectedArtistIds[0] || "");
      hasChanges = true;
    }

    if (audioFile) {
      formData.append("audio", audioFile);
      hasChanges = true;
    }

    if (coverFile) {
      formData.append("cover", coverFile);
      hasChanges = true;
    }

    if (!hasChanges) {
      setError("No changes detected. Please edit a field before saving.");
      return;
    }

    try {
      setSaving(true);
      const response = await API.put(`/admin/songs/${id}`, formData);

      if (response.data?.success === false) {
        throw new Error(response.data?.message || "Song update failed.");
      }

      setSuccess("Song updated successfully!");
      setOriginalForm({ ...form, artist_ids: [...selectedArtistIds] });

      setTimeout(() => navigate("/admin/songs"), 900);
    } catch (err) {
      console.error("Update song error:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to update song. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-loading">Loading Song...</div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-form-header">
        <button
          type="button"
          className="admin-back-button"
          onClick={() => navigate("/admin/songs")}
          disabled={saving}
        >
          <FaArrowLeft /> Back
        </button>
        <div>
          <span>KEERTHANA ADMIN</span>
          <h1>Edit Song</h1>
          <p>Update only the song details you want to change.</p>
        </div>
      </div>

      {error && (
  <div
    ref={errorRef}
    className="admin-error"
    role="alert"
    aria-live="assertive"
    tabIndex={-1}
  >
    {error}
  </div>
)}
      {success && <div className="admin-success" role="status">{success}</div>}

      <form className="admin-song-form" onSubmit={handleSubmit} encType="multipart/form-data">
        <div className="admin-form-section">
          <div className="admin-form-section-title">
            <h2>Song Information</h2>
            <p>Existing song information is loaded automatically.</p>
          </div>

          <div className="admin-form-grid">
            <div className="admin-field">
              <label>Song Language *</label>
              <select name="language" value={form.language} onChange={handleChange} disabled={saving} required>
                {LANGUAGES.map((language) => (
                  <option key={language.value} value={language.value}>{language.label}</option>
                ))}
              </select>
            </div>

            <div className="admin-field">
              <label>{selectedLanguage.titleLabel} *</label>
              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder={selectedLanguage.titleLabel}
                maxLength={255}
                required
                disabled={saving}
              />
            </div>

            <div className="admin-field">
              <label>English Title</label>
              <input
                type="text"
                name="title_english"
                value={form.title_english}
                onChange={handleChange}
                placeholder="Enter English title"
                maxLength={255}
                disabled={saving}
              />
            </div>

            <div className="admin-field">
              <label>Artists *</label>
              <MultiArtistDropdown
                options={artists}
                value={selectedArtistIds}
                onChange={(value) => {
                  setSelectedArtistIds(value);
                  setError("");
                  setSuccess("");
                }}
                disabled={saving}
              />
              <small>Select all artists who performed this song.</small>
            </div>

            <div className="admin-field">
              <label>Album</label>
              <SearchableDropdown
                options={albums}
                value={form.album_id}
                onChange={(value) => handleRelationshipChange("album_id", value)}
                placeholder="No Album"
                searchPlaceholder="Search album in English or Telugu..."
                emptyText="No albums found."
                getLabel={(album) => getEntityLabel(album, "album")}
                getSearchText={(album) => `${album.title_english || ""} ${album.title_telugu || ""} ${album.title || ""} ${album.name || ""}`}
                disabled={saving}
                allowClear
              />
            </div>

            <div className="admin-field">
              <label>Category *</label>
              <SearchableDropdown
                options={categories}
                value={form.category_id}
                onChange={(value) => handleRelationshipChange("category_id", value)}
                placeholder="Select Category"
                searchPlaceholder="Search category in English or Telugu..."
                emptyText="No categories found."
                getLabel={(category) => getEntityLabel(category, "category")}
                getSearchText={(category) => `${category.name_english || ""} ${category.name_telugu || ""} ${category.name || ""}`}
                disabled={saving}
              />
            </div>

            <div className="admin-field">
              <label>Ministry</label>
              <SearchableDropdown
                options={ministries}
                value={form.ministry_id}
                onChange={(value) => handleRelationshipChange("ministry_id", value)}
                placeholder="No Ministry"
                searchPlaceholder="Search ministry in English or Telugu..."
                emptyText="No ministries found."
                getLabel={(ministry) => getEntityLabel(ministry, "ministry")}
                getSearchText={(ministry) => `${ministry.name_english || ""} ${ministry.name_telugu || ""} ${ministry.name || ""}`}
                disabled={saving}
                allowClear
              />
            </div>
          </div>
        </div>

        <div className="admin-form-section">
          <div className="admin-form-section-title">
            <h2>Media</h2>
            <p>Your existing files will be kept unless you select replacements.</p>
          </div>

          <div className="admin-upload-grid">
            <div className="admin-upload-box">
              <div className="admin-upload-icon"><FaMusic /></div>
              <h3>Audio File</h3>
              {existingAudio && <p className="admin-existing-media">Current audio is available</p>}
              {!audioFile ? (
                <>
                  <input
                    id="edit-song-audio"
                    className="admin-file-input"
                    type="file"
                    accept=".mp3,.m4a,audio/mpeg,audio/mp4"
                    onChange={handleAudioChange}
                    disabled={saving}
                  />
                  <label htmlFor="edit-song-audio" className="admin-upload-button">
                    <FaCloudUploadAlt /> Replace Audio
                  </label>
                </>
              ) : (
                <div className="admin-selected-file">
                  <div>
                    <strong>{audioFile.name}</strong>
                    <span>New audio • {formatFileSize(audioFile.size)}</span>
                  </div>
                  <button type="button" onClick={removeNewAudio} disabled={saving} aria-label="Remove selected audio">
                    <FaTimes />
                  </button>
                </div>
              )}
            </div>

            <div className="admin-upload-box">
              {coverPreview ? (
                <img className="admin-cover-preview" src={coverPreview} alt="New cover preview" />
              ) : existingCover ? (
                <img className="admin-cover-preview" src={getMediaUrl(existingCover)} alt="Current song cover" />
              ) : (
                <div className="admin-upload-icon"><FaImage /></div>
              )}
              <h3>Cover Image</h3>
              <p>{coverFile ? "New cover selected" : existingCover ? "Current cover" : "No current cover"}</p>
              <input
                id="edit-song-cover"
                className="admin-file-input"
                type="file"
                accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                onChange={handleCoverChange}
                disabled={saving || cropSaving}
              />
              <div className="admin-cover-actions">
                <label htmlFor="edit-song-cover" className="admin-upload-button">
                  <FaCloudUploadAlt /> {coverFile ? "Change / Crop Cover" : existingCover ? "Replace / Crop Cover" : "Add / Crop Cover"}
                </label>
                {coverFile && (
                  <button type="button" className="admin-cover-remove-button" onClick={removeNewCover} disabled={saving || cropSaving}>
                    <FaTimes /> Discard New Cover
                  </button>
                )}
              </div>
              {coverFile && <small>Cropped image: {formatFileSize(coverFile.size)}</small>}
            </div>
          </div>
        </div>

        <div className="admin-form-section">
          <div className="admin-form-section-title">
            <h2>Lyrics</h2>
            <p>Edit the lyrics without changing the other song details.</p>
          </div>
          <div className="admin-field">
            <textarea
              name="lyrics"
              rows="18"
              value={form.lyrics}
              onChange={handleChange}
              placeholder={selectedLanguage.lyricsPlaceholder}
              disabled={saving}
            />
          </div>
        </div>

        <div className="admin-form-actions">
          <button type="button" className="admin-cancel-button" disabled={saving || cropSaving} onClick={() => navigate("/admin/songs")}>
            Cancel
          </button>
          <button type="submit" className="admin-primary-button" disabled={saving || cropSaving || showCropper}>
            <FaSave /> {saving ? "Saving..." : "Update Song"}
          </button>
        </div>

        {showCropper && cropSource && (
          <div className="admin-cropper-backdrop" role="presentation">
            <section className="admin-cropper-modal" role="dialog" aria-modal="true" aria-labelledby="edit-admin-cropper-title">
              <header className="admin-cropper-header">
                <div>
                  <h2 id="edit-admin-cropper-title">Edit Cover Image</h2>
                  <p>Move, zoom or rotate your image to frame the artwork.</p>
                </div>
                <button type="button" onClick={closeCropper} aria-label="Close cropper" disabled={cropSaving}>
                  <FaTimes />
                </button>
              </header>

              <div className="admin-cropper-area">
                <Cropper
                  image={cropSource}
                  crop={crop}
                  zoom={zoom}
                  rotation={rotation}
                  aspect={aspect || undefined}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onRotationChange={setRotation}
                  onCropComplete={handleCropComplete}
                  restrictPosition={false}
                  showGrid
                />
              </div>

              <div className="admin-cropper-controls">
                <div className="admin-cropper-control-group">
                  <label htmlFor="edit-cover-zoom">Zoom</label>
                  <div className="admin-cropper-zoom-row">
                    <span>−</span>
                    <input id="edit-cover-zoom" type="range" min="1" max="3" step="0.05" value={zoom} onChange={(event) => setZoom(Number(event.target.value))} />
                    <span>+</span>
                  </div>
                </div>

                <div className="admin-cropper-control-group">
                  <label>Aspect ratio</label>
                  <div className="admin-cropper-ratios">
                    <button type="button" className={aspect === 1 ? "active" : ""} onClick={() => setAspect(1)}>1:1</button>
                    <button type="button" className={aspect === 4 / 5 ? "active" : ""} onClick={() => setAspect(4 / 5)}>4:5</button>
                    <button type="button" className={aspect === 16 / 9 ? "active" : ""} onClick={() => setAspect(16 / 9)}>16:9</button>
                  </div>
                </div>

                <div className="admin-cropper-control-group">
                  <label>Rotate</label>
                  <div className="admin-cropper-rotate-row">
                    <button type="button" onClick={() => setRotation((value) => (value - 90 + 360) % 360)}>↶ Rotate left</button>
                    <button type="button" onClick={() => setRotation((value) => (value + 90) % 360)}>↷ Rotate right</button>
                    <button type="button" onClick={() => { setCrop({ x: 0, y: 0 }); setZoom(1); setRotation(0); setAspect(1); }}>Reset</button>
                  </div>
                </div>
              </div>

              <footer className="admin-cropper-footer">
                <button type="button" className="admin-cropper-cancel" onClick={closeCropper} disabled={cropSaving}>Cancel</button>
                <button type="button" className="admin-cropper-apply" onClick={applyCrop} disabled={cropSaving || !cropPixels}>
                  {cropSaving ? "Applying..." : "Apply Crop"}
                </button>
              </footer>
            </section>
          </div>
        )}
      </form>
    </div>
  );
}

export default EditSong;
