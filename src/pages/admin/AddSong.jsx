
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaCloudUploadAlt,
  FaImage,
  FaMusic,
  FaPlus,
  FaSearch,
  FaSave,
  FaTimes,
} from "react-icons/fa";

import API from "../../services/api";
import "../../assets/css/admin/addSong.css";

const LANGUAGES = [
  { value: "Telugu", nativeName: "తెలుగు" },
  { value: "Hindi", nativeName: "हिन्दी" },
  { value: "English", nativeName: "English" },
  { value: "Malayalam", nativeName: "മലയാളം" },
  { value: "Kannada", nativeName: "ಕನ್ನಡ" },
  { value: "Tamil", nativeName: "தமிழ்" },
];

const LANGUAGE_CONFIG = {
  Telugu: {
    nativeName: "తెలుగు",
    titleLabel: "పాట పేరు",
    titlePlaceholder: "తెలుగు పాట పేరు",
    lyricsPlaceholder: `పల్లవి:
మీ పాట పల్లవి...

చరణం 1:
మొదటి చరణం...

చరణం 2:
రెండవ చరణం...`,
  },
  Hindi: {
    nativeName: "हिन्दी",
    titleLabel: "गीत का नाम",
    titlePlaceholder: "हिन्दी गीत का नाम",
    lyricsPlaceholder: `पल्लवी:
आपके गीत की पल्लवी...

चरण 1:
पहला चरण...

चरण 2:
दूसरा चरण...`,
  },
  English: {
    nativeName: "English",
    titleLabel: "Song Title",
    titlePlaceholder: "Song title",
    lyricsPlaceholder: `Chorus:
Enter the chorus lyrics...

Verse 1:
Enter the first verse...

Verse 2:
Enter the second verse...`,
  },
  Malayalam: {
    nativeName: "മലയാളം",
    titleLabel: "പാട്ടിന്റെ പേര്",
    titlePlaceholder: "മലയാളം പാട്ടിന്റെ പേര്",
    lyricsPlaceholder: `പല്ലവി:
പാട്ടിന്റെ പല്ലവി...

ചരണം 1:
ആദ്യ ചരണം...

ചരണം 2:
രണ്ടാം ചരണം...`,
  },
  Kannada: {
    nativeName: "ಕನ್ನಡ",
    titleLabel: "ಹಾಡಿನ ಹೆಸರು",
    titlePlaceholder: "ಕನ್ನಡ ಹಾಡಿನ ಹೆಸರು",
    lyricsPlaceholder: `ಪಲ್ಲವಿ:
ಹಾಡಿನ ಪಲ್ಲವಿ...

ಚರಣ 1:
ಮೊದಲ ಚರಣ...

ಚರಣ 2:
ಎರಡನೇ ಚರಣ...`,
  },
  Tamil: {
    nativeName: "தமிழ்",
    titleLabel: "பாடல் பெயர்",
    titlePlaceholder: "தமிழ் பாடல் பெயர்",
    lyricsPlaceholder: `பல்லவி:
பாடலின் பல்லவி...

சரணம் 1:
முதல் சரணம்...

சரணம் 2:
இரண்டாவது சரணம்...`,
  },
};



const initialForm = {
  title: "",
  title_english: "",
  language: "Telugu",
  lyrics: "",
  artist_id: "",
  album_id: "",
  category_id: "",
  ministry_id: "", 
  featured: false,
};

const extractList = (data, key) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.[key])) return data[key];
  return [];
};


/* =====================================================
   SEARCHABLE DROPDOWN
   Search is built into the opened dropdown menu.
===================================================== */

function SearchableDropdown({
  options = [],
  value = "",
  onChange,
  placeholder = "Select an option",
  searchPlaceholder = "Type to search...",
  emptyText = "No matching options found.",
  getLabel,
  getSearchText,
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
      requestAnimationFrame(() => searchRef.current?.focus());
    }
  }, [open]);

  const selectedOption = options.find(
    (option) => String(option.id) === String(value)
  );

  const selectedLabel = selectedOption ? getLabel(selectedOption) : "";

  const normalizedQuery = query.trim().toLocaleLowerCase();

  const visibleOptions = options.filter((option) => {
    if (!normalizedQuery) return true;

    const searchable = getSearchText
      ? getSearchText(option)
      : getLabel(option);

    return String(searchable || "")
      .toLocaleLowerCase()
      .includes(normalizedQuery);
  });

  const chooseOption = (option) => {
    onChange(String(option.id));
    setOpen(false);
    setQuery("");
  };

  return (
    <div className="admin-searchable-dropdown" ref={rootRef}>
      <button
        type="button"
        className={`admin-searchable-trigger${open ? " is-open" : ""}`}
        onClick={() => setOpen((previous) => !previous)}
        aria-haspopup="listbox"
        aria-expanded={open}
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

function AddSong() {
  const navigate = useNavigate();

  const [form, setForm] = useState(initialForm);

  const [audioFile, setAudioFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState("");

  const [artists, setArtists] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [categories, setCategories] = useState([]);
  const [ministries, setMinistries] = useState([]);

  // Search text for each independent dropdown

  const [artistsLoading, setArtistsLoading] = useState(true);
  const [albumsLoading, setAlbumsLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [ministriesLoading, setMinistriesLoading] = useState(true);

  const [showArtistForm, setShowArtistForm] = useState(false);
  const [showAlbumForm, setShowAlbumForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);

  const [newArtist, setNewArtist] = useState({
    name: "",
    bio: "",
  });

  const [newAlbum, setNewAlbum] = useState({
    title: "",
    release_year: "",
  });

  const [newCategory, setNewCategory] = useState({
    name: "",
  });

  const [pageLoading, setPageLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [quickSaving, setQuickSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const selectedLanguage =
    LANGUAGE_CONFIG[form.language] || LANGUAGE_CONFIG.Telugu;

  

  /* =====================================================
     LOAD EACH ENTITY INDEPENDENTLY

     A failed endpoint does not prevent other dropdowns
     from loading.
  ===================================================== */

  useEffect(() => {
    let cancelled = false;

    const loadOne = async (
      endpoint,
      key,
      setter,
      setLoading,
      label
    ) => {
      try {
        const response = await API.get(endpoint);

        if (!cancelled) {
          setter(extractList(response.data, key));
        }
      } catch (err) {
        console.error(`Failed to load ${label}:`, err);

        if (!cancelled) {
          setter([]);

          setError((previous) =>
            previous
              ? `${previous} ${label} could not be loaded.`
              : `${label} could not be loaded. Other fields remain available.`
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    const requests = [
      loadOne(
        "/artists",
        "artists",
        setArtists,
        setArtistsLoading,
        "Artists"
      ),
      loadOne(
        "/albums",
        "albums",
        setAlbums,
        setAlbumsLoading,
        "Albums"
      ),
      loadOne(
        "/categories",
        "categories",
        setCategories,
        setCategoriesLoading,
        "Categories"
      ),
      loadOne(
        "/ministries",
        "ministries",
        setMinistries,
        setMinistriesLoading,
        "Ministries"
      ),
    ];

    Promise.all(requests).finally(() => {
      if (!cancelled) {
        setPageLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  /* =====================================================
     INDEPENDENT DROPDOWN LISTS

     No language filtering.
     No artist-to-album dependency.
     No category-to-ministry dependency.
  ===================================================== */

  const sortAndSearch = (items, searchText, getLabel) => {
    const query = searchText.trim().toLocaleLowerCase();

    return [...items]
      .filter((item) =>
        String(getLabel(item) || "")
          .toLocaleLowerCase()
          .includes(query)
      )
      .sort((a, b) =>
        String(getLabel(a) || "").localeCompare(
          String(getLabel(b) || ""),
          undefined,
          { sensitivity: "base", numeric: true }
        )
      );
  };

  const filteredArtists = sortAndSearch(
    artists,
    "",
    (artist) => artist.name_english || artist.name || artist.name_telugu || ""
  );

  const filteredAlbums = sortAndSearch(
    albums,
    "",
    (album) => album.title_english || album.title || album.title_telugu || ""
  );

  const filteredCategories = sortAndSearch(
    categories,
    "",
    (category) =>
      category.name_english || category.name || category.name_telugu || ""
  );

  const filteredMinistries = sortAndSearch(
    ministries,
    "",
    (ministry) =>
      ministry.name_english || ministry.name || ministry.name_telugu || ""
  );

  /* =====================================================
     LANGUAGE CHANGE

     Keep the selected artist, album, category and ministry.
     Changing language only changes the song language and
     language-specific labels/placeholders.
  ===================================================== */

  const handleLanguageChange = (event) => {
    const language = event.target.value;

    setForm((previous) => ({
      ...previous,
      language,
    }));

    setError("");
    setSuccess("");

    setShowArtistForm(false);
    setShowAlbumForm(false);
    setShowCategoryForm(false);
  };

  /* =====================================================
     COVER PREVIEW CLEANUP
  ===================================================== */

  useEffect(() => {
    return () => {
      if (coverPreview) {
        URL.revokeObjectURL(coverPreview);
      }
    };
  }, [coverPreview]);

  /* =====================================================
     NORMAL FIELD CHANGE
  ===================================================== */

const handleMinistryChangeValue = (ministryId) => {
  console.log("[AddSong] Ministry selected:", ministryId);

  setForm((previous) => ({
    ...previous,
    ministry_id: ministryId,
  }));
};


  /* =====================================================
     ARTIST CHANGE

     Selecting an artist does not change the album.
  ===================================================== */

  const handleArtistChange = (event) => {
    setForm((previous) => ({
      ...previous,
      artist_id: event.target.value,
    }));
  };

  /* =====================================================
     QUICK CREATE ARTIST
  ===================================================== */

  const createArtist = async () => {
    const name = newArtist.name.trim();

    if (!name) {
      setError("Artist name is required.");
      return;
    }

    try {
      setQuickSaving(true);
      setError("");
      setSuccess("");

      const response = await API.post("/admin/artists", {
        name,
        bio: newArtist.bio.trim(),
        language: form.language,
      });

      const artist = response.data?.artist;

      if (!artist?.id) {
        throw new Error("Artist was not returned by server.");
      }

      setArtists((previous) => [
        ...previous.filter(
          (item) => String(item.id) !== String(artist.id)
        ),
        artist,
      ]);

      setForm((previous) => ({
        ...previous,
        artist_id: String(artist.id),
      }));

      setNewArtist({ name: "", bio: "" });
      setShowArtistForm(false);
      setSuccess(`Artist "${artist.name}" added successfully.`);
    } catch (err) {
      console.error("Create artist error:", err);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to create artist."
      );
    } finally {
      setQuickSaving(false);
    }
  };

  /* =====================================================
     QUICK CREATE ALBUM

     Album creation does not depend on the selected artist.
     The backend/database must permit a NULL artist_id.
  ===================================================== */

  const createAlbum = async () => {
    const title = newAlbum.title.trim();

    if (!title) {
      setError("Album title is required.");
      return;
    }

    try {
      setQuickSaving(true);
      setError("");
      setSuccess("");

      const payload = {
        title,
        artist_id: null,
        release_year: newAlbum.release_year
          ? Number(newAlbum.release_year)
          : null,
        language: form.language,
      };

      const response = await API.post("/admin/albums", payload);
      const album = response.data?.album;

      if (!album?.id) {
        throw new Error(
          "Album was not returned by server. Check the album API response."
        );
      }

      setAlbums((previous) => [
        ...previous.filter(
          (item) => String(item.id) !== String(album.id)
        ),
        album,
      ]);

      setForm((previous) => ({
        ...previous,
        album_id: String(album.id),
      }));

      setNewAlbum({ title: "", release_year: "" });
      setShowAlbumForm(false);
      setSuccess(`Album "${album.title}" added successfully.`);
    } catch (err) {
      console.error("Create album error:", err);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to create album."
      );
    } finally {
      setQuickSaving(false);
    }
  };

  /* =====================================================
     QUICK CREATE CATEGORY

     Category creation does not depend on a ministry.
  ===================================================== */

  const createCategory = async () => {
    const name = newCategory.name.trim();

    if (!name) {
      setError("Category name is required.");
      return;
    }

    try {
      setQuickSaving(true);
      setError("");
      setSuccess("");

      const response = await API.post("/admin/categories", {
        name,
        language: form.language,
      });

      const category = response.data?.category;

      if (!category?.id) {
        throw new Error("Category was not returned by server.");
      }

      setCategories((previous) => [
        ...previous.filter(
          (item) => String(item.id) !== String(category.id)
        ),
        category,
      ]);

      setForm((previous) => ({
        ...previous,
        category_id: String(category.id),
      }));

      setNewCategory({ name: "" });
      setShowCategoryForm(false);
      setSuccess(`Category "${category.name}" added successfully.`);
    } catch (err) {
      console.error("Create category error:", err);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to create category."
      );
    } finally {
      setQuickSaving(false);
    }
  };

  /* =====================================================
     AUDIO FILE
  ===================================================== */

  const handleAudioChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      setAudioFile(null);
      return;
    }

    const fileName = file.name.toLowerCase();

    const validExtension =
      fileName.endsWith(".mp3") || fileName.endsWith(".m4a");

    const allowedTypes = [
      "audio/mpeg",
      "audio/mp3",
      "audio/mp4",
      "audio/x-m4a",
      "application/octet-stream",
    ];

    if (!validExtension && !allowedTypes.includes(file.type)) {
      setError("Please select an MP3 or M4A audio file.");
      setAudioFile(null);
      event.target.value = "";
      return;
    }

    if (file.size === 0) {
      setError("The selected audio file is empty.");
      setAudioFile(null);
      event.target.value = "";
      return;
    }

    if (file.size > 30 * 1024 * 1024) {
      setError("Audio file must be smaller than 30 MB.");
      setAudioFile(null);
      event.target.value = "";
      return;
    }

    setAudioFile(file);
    setError("");
  };

  const removeAudio = () => {
    setAudioFile(null);

    const input = document.getElementById("song-audio-input");

    if (input) input.value = "";
  };



  const handleChange = (event) => {
  const { name, value, type, checked } = event.target;

  console.log("========== FORM CHANGE ==========");
  console.log("Field name:", name);
  console.log("New value:", value);
  console.log("Input type:", type);
  console.log("Checked:", checked);
  console.log("Form before change:", form);

  setForm((previous) => {
    const updatedForm = {
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    };

    console.log("Form after change:", updatedForm);
   
    console.log("Ministry after change:", updatedForm.ministry_id);

    return updatedForm;
  });
};
  /* =====================================================
     COVER FILE
  ===================================================== */

  const handleCoverChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      setError("Cover image must be JPG, PNG or WebP.");
      event.target.value = "";
      return;
    }

    if (file.size === 0) {
      setError("The selected cover image is empty.");
      event.target.value = "";
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("Cover image must be smaller than 10 MB.");
      event.target.value = "";
      return;
    }

    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
    setError("");
  };

  const removeCover = () => {
    setCoverFile(null);
    setCoverPreview("");

    const input = document.getElementById("song-cover-input");

    if (input) input.value = "";
  };

  /* =====================================================
     FILE SIZE
  ===================================================== */

  const formatFileSize = (bytes) => {
    if (!bytes) return "0 MB";

    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  /* =====================================================
     SUBMIT SONG

     Artist and category remain required.
     Album and ministry are optional.
     No language-matching validation is performed.
  ===================================================== */

 const handleSubmit = async (event) => {
  event.preventDefault();

  setError("");
  setSuccess("");

  if (!LANGUAGES.some((language) => language.value === form.language)) {
    alert("Please select a valid song language.");
    return;
  }

  if (!form.title.trim()) {
    alert(`${selectedLanguage.titleLabel} is required.`);
    return;
  }

  if (!form.artist_id) {
    alert("Artist name is required. Please select or create an artist.");
    return;
  }

  if (!form.category_id) {
    alert("Category is required. Please select or create a category.");
    return;
  }

  if (!audioFile) {
    alert("Audio file is required. Please select an audio file.");
    return;
  }

  // Keep all your existing upload logic below this point unchanged.

    try {
      setSaving(true);

      const formData = new FormData();

      formData.append("title", form.title.trim());
      formData.append("title_english", form.title_english.trim());
      formData.append("language", form.language);
      formData.append("lyrics", form.lyrics);

      formData.append("artist_id", form.artist_id);
      formData.append("category_id", form.category_id);

      if (form.album_id) {
        formData.append("album_id", form.album_id);
      }


if (form.ministry_id) {
  formData.append("ministry_id", form.ministry_id);
}





   
      formData.append("featured", String(form.featured));
      formData.append("audio", audioFile);

      if (coverFile) {
        formData.append("cover", coverFile);
      }

      const response = await API.post("/admin/songs", formData);

      if (response.data?.success === false) {
        throw new Error(
          response.data?.message || "Song upload failed."
        );
      }

      setSuccess("Song uploaded successfully!");

      setTimeout(() => {
        navigate("/admin/songs");
      }, 1000);
    } catch (err) {
      console.error("Song upload error:", err);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to upload song."
      );
    } finally {
      setSaving(false);
    }
  };

  /* =====================================================
     PAGE LOADING
  ===================================================== */

  if (pageLoading) {
    return (
      <div className="admin-page">
        <div className="admin-loading">Loading Add Song...</div>
      </div>
    );
  }

  /* =====================================================
     PAGE
  ===================================================== */

  return (
    <div className="admin-page">
      <div className="admin-form-header">
        <button
          type="button"
          className="admin-back-button"
          onClick={() => navigate("/admin/songs")}
        >
          <FaArrowLeft />
          Back
        </button>

        <div>
          <span>KEERTHANA ADMIN</span>
          <h1>Add New Song</h1>
          <p>
            Add the song, artist, album, category, ministry,
             audio and lyrics from one page.
          </p>
        </div>
      </div>

      {error && <div className="admin-error">{error}</div>}
      {success && <div className="admin-success">{success}</div>}

      <form className="admin-song-form" onSubmit={handleSubmit}>
        {/* SONG INFORMATION */}

        <div className="admin-form-section">
          <div className="admin-form-section-title">
            <h2>Song Information</h2>
            <p>Enter the basic details of the song.</p>
          </div>

          <div className="admin-form-grid">
            {/* LANGUAGE */}

            <div className="admin-field">
              <label>Song Language</label>

              <select
                name="language"
                value={form.language}
                onChange={handleLanguageChange}
                required
              >
                {LANGUAGES.map((language) => (
                  <option key={language.value} value={language.value}>
                    {language.nativeName}
                  </option>
                ))}
              </select>

              <small>
                Selected language: {selectedLanguage.nativeName}
              </small>
            </div>

           

       {/* SONG TITLE */}

<div className="admin-field">
  <label>{selectedLanguage.titleLabel} *</label>

  <input
    type="text"
    name="title"
    value={form.title}
    onChange={handleChange}
    placeholder={selectedLanguage.titlePlaceholder}
    maxLength={255}
    required
  />
</div>

            {/* ENGLISH TITLE */}

            <div className="admin-field">
              <label>English Title</label>

              <input
                type="text"
                name="title_english"
                value={form.title_english}
                onChange={handleChange}
                placeholder="English title"
                maxLength={255}
              />
            </div>

            {/* ARTIST */}

            <div className="admin-field">
              <div className="admin-field-label-row">
                <label>Artist *</label>

                <button
                  type="button"
                  className="admin-inline-add-button"
                  onClick={() => {
                    setError("");
                    setSuccess("");
                    setShowArtistForm((previous) => !previous);
                    setShowAlbumForm(false);
                    setShowCategoryForm(false);
                  }}
                >
                  <FaPlus /> New Artist
                </button>
              </div>

              <SearchableDropdown
                options={filteredArtists}
                value={form.artist_id}
                onChange={(value) =>
                  setForm((previous) => ({ ...previous, artist_id: value }))
                }
                placeholder="Select Artist"
                searchPlaceholder="Search artists..."
                emptyText="No artists found. Please create an artist."
                getLabel={(artist) =>
                  artist.name_english ||
                  artist.name ||
                  artist.name_telugu ||
                  "Unnamed Artist"
                }
                getSearchText={(artist) =>
                  [
                    artist.name_english,
                    artist.name,
                    artist.name_telugu,
                    artist.bio,
                  ]
                    .filter(Boolean)
                    .join(" ")
                }
              />

              {artistsLoading && <small>Loading artists...</small>}

              {!artistsLoading && filteredArtists.length === 0 && (
                <small>No artists available. Please create an artist.</small>
              )}

              {showArtistForm && (
                <div className="admin-quick-create">
                  <h4>Add New Artist</h4>

                  <input
                    type="text"
                    placeholder="Artist name"
                    value={newArtist.name}
                    onChange={(event) =>
                      setNewArtist((previous) => ({
                        ...previous,
                        name: event.target.value,
                      }))
                    }
                  />

                  <textarea
                    rows="3"
                    placeholder="Artist bio (optional)"
                    value={newArtist.bio}
                    onChange={(event) =>
                      setNewArtist((previous) => ({
                        ...previous,
                        bio: event.target.value,
                      }))
                    }
                  />

                  <div className="admin-quick-actions">
                    <button
                      type="button"
                      disabled={quickSaving}
                      onClick={() => setShowArtistForm(false)}
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      className="admin-primary-button"
                      disabled={quickSaving}
                      onClick={createArtist}
                    >
                      <FaPlus />
                      {quickSaving ? "Adding..." : "Add Artist"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ALBUM */}

            <div className="admin-field">
              <div className="admin-field-label-row">
                <label>Album</label>

                <button
                  type="button"
                  className="admin-inline-add-button"
                  onClick={() => {
                    setError("");
                    setSuccess("");
                    setShowAlbumForm((previous) => !previous);
                    setShowArtistForm(false);
                    setShowCategoryForm(false);
                  }}
                >
                  <FaPlus /> New Album
                </button>
              </div>

              <SearchableDropdown
                options={filteredAlbums}
                value={form.album_id}
                onChange={(value) =>
                  setForm((previous) => ({ ...previous, album_id: value }))
                }
                placeholder="No Album / Single"
                searchPlaceholder="Search albums..."
                emptyText="No matching albums found."
                getLabel={(album) =>
                  album.title_english ||
                  album.title ||
                  album.title_telugu ||
                  "Untitled Album"
                }
                getSearchText={(album) =>
                  [
                    album.title_english,
                    album.title,
                    album.title_telugu,
                    album.artist_name_english,
                    album.artist_name,
                    album.artist_name_telugu,
                  ]
                    .filter(Boolean)
                    .join(" ")
                }
              />

              {albumsLoading && <small>Loading albums...</small>}

              <small>
                Album is optional. Select any album or leave this as
                No Album / Single.
              </small>

              {showAlbumForm && (
                <div className="admin-quick-create">
                  <h4>Add New Album</h4>

                  <input
                    type="text"
                    placeholder="Album title"
                    value={newAlbum.title}
                    onChange={(event) =>
                      setNewAlbum((previous) => ({
                        ...previous,
                        title: event.target.value,
                      }))
                    }
                  />

                  <input
                    type="number"
                    min="1900"
                    max="2100"
                    placeholder="Release year (optional)"
                    value={newAlbum.release_year}
                    onChange={(event) =>
                      setNewAlbum((previous) => ({
                        ...previous,
                        release_year: event.target.value,
                      }))
                    }
                  />

                  <small>
                    Creating an album without an artist requires backend
                    and database support for a NULL artist_id.
                  </small>

                  <div className="admin-quick-actions">
                    <button
                      type="button"
                      disabled={quickSaving}
                      onClick={() => setShowAlbumForm(false)}
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      className="admin-primary-button"
                      disabled={quickSaving}
                      onClick={createAlbum}
                    >
                      <FaPlus />
                      {quickSaving ? "Adding..." : "Add Album"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* CATEGORY */}

            <div className="admin-field">
              <div className="admin-field-label-row">
                <label>Category *</label>

                <button
                  type="button"
                  className="admin-inline-add-button"
                  onClick={() => {
                    setError("");
                    setSuccess("");
                    setShowCategoryForm((previous) => !previous);
                    setShowArtistForm(false);
                    setShowAlbumForm(false);
                  }}
                >
                  <FaPlus /> New Category
                </button>
              </div>

              <SearchableDropdown
                options={filteredCategories}
                value={form.category_id}
                onChange={(value) =>
                  setForm((previous) => ({ ...previous, category_id: value }))
                }
                placeholder="Select Category"
                searchPlaceholder="Search categories..."
                emptyText="No categories found. Please create a category."
                getLabel={(category) =>
                  category.name_english ||
                  category.name ||
                  category.name_telugu ||
                  "Unnamed Category"
                }
                getSearchText={(category) =>
                  [
                    category.name_english,
                    category.name,
                    category.name_telugu,
                  ]
                    .filter(Boolean)
                    .join(" ")
                }
              />

              {categoriesLoading && <small>Loading categories...</small>}

              {!categoriesLoading && filteredCategories.length === 0 && (
                <small>
                  No categories available. Please create a category.
                </small>
              )}

              {showCategoryForm && (
                <div className="admin-quick-create">
                  <h4>Add New Category</h4>

                  <input
                    type="text"
                    placeholder="Category name"
                    value={newCategory.name}
                    onChange={(event) =>
                      setNewCategory({ name: event.target.value })
                    }
                  />

                  <div className="admin-quick-actions">
                    <button
                      type="button"
                      disabled={quickSaving}
                      onClick={() => setShowCategoryForm(false)}
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      className="admin-primary-button"
                      disabled={quickSaving}
                      onClick={createCategory}
                    >
                      <FaPlus />
                      {quickSaving ? "Adding..." : "Add Category"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* MINISTRY */}


{/* MINISTRY */}

<div className="admin-field">
  <div className="admin-field-label-row">
    <label htmlFor="ministry_id">Ministry</label>
  </div>

  <SearchableDropdown
    options={filteredMinistries}
    value={form.ministry_id}
    onChange={handleMinistryChangeValue}
    placeholder="Select Ministry (Optional)"
    searchPlaceholder="Search ministries..."
    emptyText="No matching ministries found."
    getLabel={(ministry) =>
      ministry.name_english ||
      ministry.name ||
      ministry.name_telugu ||
      "Unnamed Ministry"
    }
    getSearchText={(ministry) =>
      [
        ministry.name_english,
        ministry.name,
        ministry.name_telugu,
        ministry.description,
        ministry.language,
      ]
        .filter(Boolean)
        .join(" ")
    }
  />


</div>     

          </div> {/* CLOSE admin-form-grid */}
        </div>   {/* CLOSE admin-form-section */}

        {/* MEDIA */}

        <div className="admin-form-section">
          <div className="admin-form-section-title">
            <h2>Media</h2>
            <p>Upload the song audio and cover artwork.</p>
          </div>

          <div className="admin-upload-grid">
            {/* AUDIO */}

            <div className="admin-upload-box">
              <div className="admin-upload-icon">
                <FaMusic />
              </div>

              <h3>Audio File *</h3>
              <p>MP3 or M4A, maximum 30 MB</p>

              {!audioFile ? (
                <>
                  <input
                    id="song-audio-input"
                    className="admin-file-input"
                    type="file"
                    accept=".mp3,.m4a,audio/mpeg,audio/mp4"
                    onChange={handleAudioChange}
                  />

                  <label
                    htmlFor="song-audio-input"
                    className="admin-upload-button"
                  >
                    <FaCloudUploadAlt /> Choose Audio
                  </label>
                </>
              ) : (
                <div className="admin-selected-file">
                  <div>
                    <strong>{audioFile.name}</strong>
                    <span>{formatFileSize(audioFile.size)}</span>
                  </div>

                  <button
                    type="button"
                    onClick={removeAudio}
                    aria-label="Remove audio"
                  >
                    <FaTimes />
                  </button>
                </div>
              )}
            </div>

            {/* COVER */}

            <div className="admin-upload-box">
              {!coverPreview ? (
                <div className="admin-upload-icon">
                  <FaImage />
                </div>
              ) : (
                <img
                  className="admin-cover-preview"
                  src={coverPreview}
                  alt="Song cover preview"
                />
              )}

              <h3>Cover Image</h3>
              <p>JPG, PNG or WebP, maximum 10 MB</p>

              {!coverFile ? (
                <>
                  <input
                    id="song-cover-input"
                    className="admin-file-input"
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                    onChange={handleCoverChange}
                  />

                  <label
                    htmlFor="song-cover-input"
                    className="admin-upload-button"
                  >
                    <FaCloudUploadAlt /> Choose Cover
                  </label>
                </>
              ) : (
                <div className="admin-selected-file">
                  <div>
                    <strong>{coverFile.name}</strong>
                    <span>{formatFileSize(coverFile.size)}</span>
                  </div>

                  <button
                    type="button"
                    onClick={removeCover}
                    aria-label="Remove cover"
                  >
                    <FaTimes />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* LYRICS */}

        <div className="admin-form-section">
          <div className="admin-form-section-title">
            <h2>Lyrics — {selectedLanguage.nativeName}</h2>
            <p>Enter the lyrics in the selected song language.</p>
          </div>

          <div className="admin-field">
            <textarea
              name="lyrics"
              value={form.lyrics}
              onChange={handleChange}
              rows="16"
              placeholder={selectedLanguage.lyricsPlaceholder}
            />
          </div>
        </div>

        {/* FEATURED */}

        <label className="admin-checkbox">
          <input
            type="checkbox"
            name="featured"
            checked={form.featured}
            onChange={handleChange}
          />

          <div>
            <strong>Featured Song</strong>
            <span>Show this song in Featured Worship.</span>
          </div>
        </label>

        {/* ACTIONS */}

        <div className="admin-form-actions">
          <button
            type="button"
            className="admin-cancel-button"
            disabled={saving || quickSaving}
            onClick={() => navigate("/admin/songs")}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="admin-primary-button"
            disabled={saving || quickSaving}
          >
            <FaSave />
            {saving ? "Uploading..." : "Save Song"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default AddSong;
