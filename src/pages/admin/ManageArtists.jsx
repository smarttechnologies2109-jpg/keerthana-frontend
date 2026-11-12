

import { useEffect, useMemo, useRef, useState } from "react";

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

  { value: "Telugu", label: "తెలుగు" },

  { value: "Hindi", label: "हिन्दी" },

  { value: "English", label: "English" },

  { value: "Malayalam", label: "മലയാളം" },

  { value: "Kannada", label: "ಕನ್ನಡ" },

  { value: "Tamil", label: "தமிழ்" },

];

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
  const errorRef = useRef(null);

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

      name_english:

        artist.name_english || artist.name || "",

      name_telugu:

        artist.name_telugu || artist.name || "",

      bio: artist.bio || "",

      language: artist.language || "Telugu",

      image_url: artist.image_url || "",

    });

    setImageFile(null);

    clearImagePreview();

    setImagePreview(getArtistImageUrl(artist.image_url) || null);

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

    const allowedTypes = [

      "image/jpeg",

      "image/png",

      "image/webp",

    ];

    if (!allowedTypes.includes(file.type)) {

      setError(

        "Only JPG, PNG or WebP images are allowed."

      );

      event.target.value = "";

      return;

    }

    if (file.size > 5 * 1024 * 1024) {

      setError(

        "Artist image must be smaller than 5 MB."

      );

      event.target.value = "";

      return;

    }

    setError("");

    clearImagePreview();

    setImageFile(file);

    const previewUrl = URL.createObjectURL(file);

    setImagePreview(previewUrl);

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

    const selectedLanguage = LANGUAGES.some(

      (language) => language.value === form.language

    );

    if (!selectedLanguage) {

      setError("Please select a valid language.");

      return;

    }

    // DUPLICATE NAME VALIDATION

    // Normalize Unicode, ignore case, and collapse extra spaces.

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

        artist.name_english || artist.nameEnglish || artist.name || "";

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

        artist.name_telugu || artist.nameTelugu || artist.name || "";

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

  // SEARCH ARTISTS + ALPHABETICAL ORDER (A-Z)

  // ===================================================

  const filteredArtists = useMemo(() => {

    const query = search.trim().toLocaleLowerCase();

    return [...artists]

      .filter((artist) => {

        if (!query) return true;

        const englishName =

          artist.name_english || artist.nameEnglish || artist.name || "";

        const teluguName =

          artist.name_telugu || artist.nameTelugu || artist.name || "";

        const bio = artist.bio || "";

        const language = artist.language || "";

        return (

          String(englishName).toLocaleLowerCase().includes(query) ||

          String(teluguName).toLocaleLowerCase().includes(query) ||

          String(bio).toLocaleLowerCase().includes(query) ||

          String(language).toLocaleLowerCase().includes(query)

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

  }, [artists, search]);

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

        <div className="admin-error" role="alert" aria-live="assertive">

          {error}

        </div>

      )}

      {success && (

        <div className="admin-success">

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

            onChange={(event) =>

              setSearch(event.target.value)

            }

            placeholder="Search English or Telugu artist names..."

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

              <th className="admin-artist-number-heading">No.</th>

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

              filteredArtists.map((artist, index) => (

                <tr key={artist.id}>

                  <td className="admin-artist-number">

                    {String(index + 1).padStart(2, "0")}

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

                        <strong>

                          {artist.name_english ||

                            artist.name ||

                            "—"}

                        </strong>

                        <small>

                          {artist.name_telugu ||

                            artist.name ||

                            "—"}

                        </small>

                      </div>

                    </div>

                  </td>

                  <td>

                    {

                      LANGUAGES.find(

                        (language) =>

                          language.value === artist.language

                      )?.label || artist.language || "—"

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

                <label>Artist Name (English) *</label>

                <input

                  type="text"

                  name="name_english"

                  value={form.name_english}

                  onChange={handleChange}

                  placeholder="Example: Pr. John Wesley"

                  required

                />

              </div>

              {/* TELUGU ARTIST NAME */}

              <div className="admin-field">

                <label>Artist Name (Telugu) *</label>

                <input

                  type="text"

                  name="name_telugu"

                  value={form.name_telugu}

                  onChange={handleChange}

                  placeholder="ఉదాహరణ: బ్రదర్ జాన్ వెస్లీ"

                  required

                />

              </div>

              {/* LANGUAGE */}

              <div className="admin-field">

                <label>Artist Language *</label>

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

              {/* BIO */}

              <div className="admin-field">

                <label>Biography</label>

                <textarea

                  name="bio"

                  rows="6"

                  value={form.bio}

                  onChange={handleChange}

                  placeholder="Short artist biography..."

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

    </div>

  );

}

export default ManageArtists;
