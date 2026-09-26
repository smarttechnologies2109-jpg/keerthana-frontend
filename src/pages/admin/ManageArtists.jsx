import {
  useEffect,
  useState,
} from "react";

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

import "../../assets/css/admin/manageArtists.css";


const DEFAULT_ARTIST =
  "/images/default-artist.png";


/* =========================================================
   LANGUAGES
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


function ManageArtists() {

  /* =====================================================
     STATE
  ===================================================== */

  const [artists, setArtists] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [search, setSearch] =
    useState("");


  /* =====================================================
     FORM
  ===================================================== */

  const [showForm, setShowForm] =
    useState(false);

  const [
    editingArtist,
    setEditingArtist,
  ] = useState(null);


  const [form, setForm] =
    useState({
      name: "",
      bio: "",
      language: "Telugu",
      image_url: "",
    });


  /* =====================================================
     IMAGE
  ===================================================== */

  const [imageFile, setImageFile] =
    useState(null);

  const [imagePreview, setImagePreview] =
    useState(DEFAULT_ARTIST);


  /* =====================================================
     LOAD ARTISTS
  ===================================================== */

  const loadArtists = async () => {

    try {

      setLoading(true);
      setError("");

      const response =
        await API.get(
          "/admin/artists"
        );

      setArtists(
        response.data.artists || []
      );

    } catch (error) {

      console.error(
        "Load artists error:",
        error
      );

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


  /* =====================================================
     OPEN ADD
  ===================================================== */

  const openAdd = () => {

    setEditingArtist(null);

    setForm({
      name: "",
      bio: "",
      language: "Telugu",
      image_url: "",
    });

    setImageFile(null);

    setImagePreview(
      DEFAULT_ARTIST
    );

    setError("");
    setSuccess("");
    setShowForm(true);

  };


  /* =====================================================
     OPEN EDIT
  ===================================================== */

  const openEdit = (artist) => {

    setEditingArtist(
      artist
    );

    setForm({

      name:
        artist.name || "",

      bio:
        artist.bio || "",

      language:
        artist.language || "Telugu",

      image_url:
        artist.image_url || "",

    });

    setImageFile(null);

    setImagePreview(
      artist.image_url ||
      DEFAULT_ARTIST
    );

    setError("");
    setSuccess("");
    setShowForm(true);

  };


  /* =====================================================
     CLOSE FORM
  ===================================================== */

  const closeForm = () => {

    if (saving) {
      return;
    }

    setShowForm(false);

    setEditingArtist(null);

    setImageFile(null);

    setImagePreview(
      DEFAULT_ARTIST
    );

  };


  /* =====================================================
     TEXT CHANGE
  ===================================================== */

  const handleChange = (event) => {

    const {
      name,
      value,
    } = event.target;

    setForm(
      (previous) => ({
        ...previous,
        [name]: value,
      })
    );

  };


  /* =====================================================
     IMAGE CHANGE
  ===================================================== */

  const handleImageChange = (
    event
  ) => {

    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (
      !allowedTypes.includes(
        file.type
      )
    ) {

      setError(
        "Only JPG, PNG or WebP images are allowed."
      );

      event.target.value = "";

      return;
    }

    if (
      file.size >
      5 * 1024 * 1024
    ) {

      setError(
        "Artist image must be smaller than 5 MB."
      );

      event.target.value = "";

      return;
    }

    setError("");

    setImageFile(file);

    const previewUrl =
      URL.createObjectURL(
        file
      );

    setImagePreview(
      previewUrl
    );

  };


  /* =====================================================
     SAVE ARTIST
  ===================================================== */

  const handleSubmit = async (
    event
  ) => {

    event.preventDefault();

    /* NAME */

    if (
      !form.name.trim()
    ) {

      setError(
        "Artist name is required."
      );

      return;
    }


    /* LANGUAGE */

    const selectedLanguage =
      LANGUAGES.some(
        (language) =>
          language.value ===
          form.language
      );

    if (!selectedLanguage) {

      setError(
        "Please select a valid language."
      );

      return;
    }


    try {

      setSaving(true);

      setError("");
      setSuccess("");


      const formData =
        new FormData();


      formData.append(
        "name",
        form.name.trim()
      );


      formData.append(
        "bio",
        form.bio.trim()
      );


      formData.append(
        "language",
        form.language
      );


      if (imageFile) {

        formData.append(
          "cover",
          imageFile
        );

      }


      /* UPDATE */

      if (editingArtist) {

        await API.put(
          `/admin/artists/${editingArtist.id}`,
          formData
        );

        setSuccess(
          "Artist updated successfully!"
        );

      }


      /* CREATE */

      else {

        await API.post(
          "/admin/artists",
          formData
        );

        setSuccess(
          "Artist created successfully!"
        );

      }


      await loadArtists();


      setShowForm(false);

      setEditingArtist(null);

      setImageFile(null);

      setImagePreview(
        DEFAULT_ARTIST
      );


    } catch (error) {

      console.error(
        "Save artist error:",
        error
      );

      setError(
        error.response?.data?.message ||
        "Unable to save artist."
      );

    } finally {

      setSaving(false);

    }

  };


  /* =====================================================
     DELETE
  ===================================================== */

  const handleDelete = async (
    artist
  ) => {

    const confirmed =
      window.confirm(
        `Delete artist "${artist.name}"?`
      );

    if (!confirmed) {
      return;
    }

    try {

      setError("");
      setSuccess("");

      await API.delete(
        `/admin/artists/${artist.id}`
      );

      setArtists(
        (previous) =>
          previous.filter(
            (item) =>
              item.id !== artist.id
          )
      );

      setSuccess(
        "Artist deleted successfully!"
      );

    } catch (error) {

      console.error(
        "Delete artist error:",
        error
      );

      setError(
        error.response?.data?.message ||
        "Unable to delete artist."
      );

    }

  };


  /* =====================================================
     SEARCH
  ===================================================== */

  const filteredArtists =
    artists.filter(
      (artist) => {

        const query =
          search
            .trim()
            .toLowerCase();

        if (!query) {
          return true;
        }

        return (
          artist.name
            ?.toLowerCase()
            .includes(query) ||

          artist.bio
            ?.toLowerCase()
            .includes(query) ||

          artist.language
            ?.toLowerCase()
            .includes(query)
        );

      }
    );


  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {

    return (

      <div className="admin-page">

        <div className="admin-loading">

          Loading Artists...

        </div>

      </div>

    );

  }


  /* =====================================================
     PAGE
  ===================================================== */

  return (

    <div className="admin-page">


      {/* HEADER */}

      <div className="admin-header">

        <div>

          <span>
            KEERTHANA ADMIN
          </span>

          <h1>
            Manage Artists
          </h1>

          <p>
            Add, edit and manage
            Christian music artists.
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

      {error && (

        <div className="admin-error">
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
              setSearch(
                event.target.value
              )
            }
            placeholder="Search artists..."
          />

        </div>


        <div className="admin-song-count">

          <FaMicrophone />

          <span>

            {filteredArtists.length}
            {" Artists"}

          </span>

        </div>

      </div>


      {/* TABLE */}

      <div className="admin-table-wrapper">

        <table className="admin-song-table">

          <thead>

            <tr>

              <th>
                Artist
              </th>

              <th>
                Language
              </th>

              <th>
                Bio
              </th>

              <th>
                Songs
              </th>

              <th>
                Actions
              </th>

            </tr>

          </thead>


          <tbody>

            {filteredArtists.length === 0 ? (

              <tr>

                <td
                  colSpan="5"
                  style={{
                    textAlign: "center",
                    padding: "30px",
                  }}
                >
                  No artists found.
                </td>

              </tr>

            ) : (

              filteredArtists.map(
                (artist) => (

                  <tr
                    key={
                      artist.id
                    }
                  >

                    <td>

                      <div className="admin-artist-cell">

                        <div className="admin-artist-avatar">

                          <img
                            src={
                              artist.image_url ||
                              DEFAULT_ARTIST
                            }
                            alt={
                              artist.name
                            }
                            onError={(
                              event
                            ) => {

                              event.currentTarget.src =
                                DEFAULT_ARTIST;

                            }}
                          />

                        </div>


                        <strong>
                          {artist.name}
                        </strong>

                      </div>

                    </td>


                    <td>

                      {
                        LANGUAGES.find(
                          (language) =>
                            language.value ===
                            artist.language
                        )?.label ||
                        "తెలుగు"
                      }

                    </td>


                    <td>

                      <span className="admin-table-bio">

                        {artist.bio ||
                          "—"}

                      </span>

                    </td>


                    <td>

                      {artist.song_count ??
                        0}

                    </td>


                    <td>

                      <div className="admin-table-actions">

                        <button
                          type="button"
                          className="admin-action-button edit"
                          title="Edit Artist"
                          onClick={() =>
                            openEdit(
                              artist
                            )
                          }
                        >
                          <FaEdit />
                        </button>


                        <button
                          type="button"
                          className="admin-action-button delete"
                          title="Delete Artist"
                          onClick={() =>
                            handleDelete(
                              artist
                            )
                          }
                        >
                          <FaTrash />
                        </button>

                      </div>

                    </td>

                  </tr>

                )
              )

            )}

          </tbody>

        </table>

      </div>


      {/* MODAL */}

      {showForm && (

        <div className="admin-modal-overlay">

          <div className="admin-modal">


            <div className="admin-modal-header">

              <div>

                <span>
                  KEERTHANA ADMIN
                </span>

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


            <form
              onSubmit={
                handleSubmit
              }
            >


              {/* ARTIST NAME */}

              <div className="admin-field">

                <label>
                  Artist Name *
                </label>

                <input
                  type="text"
                  name="name"
                  value={
                    form.name
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Artist name"
                  required
                />

              </div>


              {/* LANGUAGE */}

              <div className="admin-field">

                <label>
                  Artist Language *
                </label>

                <select
                  name="language"
                  value={
                    form.language
                  }
                  onChange={
                    handleChange
                  }
                  required
                >

                  {LANGUAGES.map(
                    (language) => (

                      <option
                        key={
                          language.value
                        }
                        value={
                          language.value
                        }
                      >

                        {language.label}

                      </option>

                    )
                  )}

                </select>

              </div>


              {/* BIO */}

              <div className="admin-field">

                <label>
                  Biography
                </label>

                <textarea
                  name="bio"
                  rows="6"
                  value={
                    form.bio
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Short artist biography..."
                />

              </div>


              {/* IMAGE */}

              <div className="admin-field">

                <label>
                  Artist Cover Image
                </label>


                <div className="artist-image-upload">


                  <div className="artist-image-preview">

                    <img
                      src={
                        imagePreview ||
                        DEFAULT_ARTIST
                      }
                      alt="Artist preview"
                      onError={(
                        event
                      ) => {

                        event.currentTarget.src =
                          DEFAULT_ARTIST;

                      }}
                    />

                  </div>


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
                    onChange={
                      handleImageChange
                    }
                    style={{
                      display:
                        "none",
                    }}
                  />


                  <div className="artist-file-name">

                    {imageFile
                      ? imageFile.name
                      : editingArtist?.image_url
                        ? "Current image"
                        : "No file chosen — default image will be used"}

                  </div>


                  <small>

                    JPG, PNG or WebP.
                    Maximum 5 MB.

                  </small>

                </div>

              </div>


              {/* ACTIONS */}

              <div className="admin-form-actions">

                <button
                  type="button"
                  className="admin-cancel-button"
                  onClick={
                    closeForm
                  }
                  disabled={
                    saving
                  }
                >
                  Cancel
                </button>


                <button
                  type="submit"
                  className="admin-primary-button"
                  disabled={
                    saving
                  }
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