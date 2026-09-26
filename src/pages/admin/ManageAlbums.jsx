import {
  useEffect,
  useState,
} from "react";

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

import {
  getMediaUrl,
  DEFAULT_ALBUM,
} from "../../utils/media";

import "../../assets/css/admin/manageAlbums.css";


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


function ManageAlbums() {

  /* =====================================================
     DATA
  ===================================================== */

  const [albums, setAlbums] =
    useState([]);

  const [artists, setArtists] =
    useState([]);


  /* =====================================================
     PAGE STATE
  ===================================================== */

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [
    deletingId,
    setDeletingId,
  ] = useState(null);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [search, setSearch] =
    useState("");


  /* =====================================================
     MODAL
  ===================================================== */

  const [showForm, setShowForm] =
    useState(false);

  const [
    editingAlbum,
    setEditingAlbum,
  ] = useState(null);


  /* =====================================================
     FORM
  ===================================================== */

  const [form, setForm] =
    useState({
      title: "",
      language: "Telugu",
      artist_id: "",
      release_year: "",
      cover_url: "",
    });


  /* =====================================================
     COVER IMAGE
  ===================================================== */

  const [coverFile, setCoverFile] =
    useState(null);

  const [coverPreview, setCoverPreview] =
    useState(DEFAULT_ALBUM);


  /* =====================================================
     LOAD DATA
  ===================================================== */

  const loadData = async () => {

    try {

      setLoading(true);
      setError("");

      const [
        albumsResponse,
        artistsResponse,
      ] = await Promise.all([

        API.get(
          "/admin/albums"
        ),

        API.get(
          "/admin/artists"
        ),

      ]);


      setAlbums(
        albumsResponse
          .data
          .albums || []
      );


      setArtists(
        artistsResponse
          .data
          .artists || []
      );


    } catch (error) {

      console.error(
        "Load albums error:",
        error
      );

      setError(
        error.response
          ?.data
          ?.message ||
        "Unable to load albums."
      );

    } finally {

      setLoading(false);

    }

  };


  useEffect(() => {

    loadData();

  }, []);


  /* =====================================================
     OPEN ADD
  ===================================================== */

  const openAdd = () => {

    setEditingAlbum(null);

    setCoverFile(null);

    setCoverPreview(
      DEFAULT_ALBUM
    );


    setForm({
      title: "",
      language: "Telugu",
      artist_id: "",
      release_year: "",
      cover_url: "",
    });


    setError("");
    setSuccess("");
    setShowForm(true);

  };


  /* =====================================================
     OPEN EDIT
  ===================================================== */

  const openEdit = (
    album
  ) => {

    setEditingAlbum(
      album
    );

    setCoverFile(null);


    const existingCover =
      album.cover_url
        ? getCover(
            album.cover_url
          )
        : DEFAULT_ALBUM;


    setCoverPreview(
      existingCover
    );


    setForm({

      title:
        album.title ||
        "",

      language:
        album.language ||
        "Telugu",

      artist_id:
        album.artist_id
          ? String(
              album.artist_id
            )
          : "",

      release_year:
        album.release_year
          ? String(
              album.release_year
            )
          : "",

      cover_url:
        album.cover_url ||
        "",

    });


    setError("");
    setSuccess("");
    setShowForm(true);

  };


  /* =====================================================
     CLOSE
  ===================================================== */

  const closeForm = () => {

    if (saving) {
      return;
    }

    setShowForm(false);

    setEditingAlbum(null);

    setCoverFile(null);

    setCoverPreview(
      DEFAULT_ALBUM
    );

  };


  /* =====================================================
     INPUT CHANGE
  ===================================================== */

  const handleChange = (
    event
  ) => {

    const {
      name,
      value,
    } = event.target;


    if (
      name === "language"
    ) {

      setForm(
        (previous) => ({
          ...previous,
          language: value,
          artist_id: "",
        })
      );

      return;
    }


    setForm(
      (previous) => ({
        ...previous,
        [name]: value,
      })
    );

  };


  /* =====================================================
     COVER IMAGE CHANGE
  ===================================================== */

  const handleCoverChange = (
    event
  ) => {

    const file =
      event.target.files?.[0];


    if (!file) {

      setCoverFile(null);

      setCoverPreview(
        editingAlbum?.cover_url
          ? getCover(
              editingAlbum.cover_url
            )
          : DEFAULT_ALBUM
      );

      return;

    }


    if (
      !file.type.startsWith(
        "image/"
      )
    ) {

      setError(
        "Please select a valid image file."
      );

      event.target.value = "";

      return;

    }


    if (
      file.size >
      5 * 1024 * 1024
    ) {

      setError(
        "Cover image must be smaller than 5 MB."
      );

      event.target.value = "";

      return;

    }


    setError("");

    setCoverFile(
      file
    );


    const previewUrl =
      URL.createObjectURL(
        file
      );


    setCoverPreview(
      previewUrl
    );

  };


  /* =====================================================
     SAVE
  ===================================================== */

  const handleSubmit = async (
    event
  ) => {

    event.preventDefault();


    if (
      !form.title.trim()
    ) {

      setError(
        "Album title is required."
      );

      return;

    }


    const validLanguage =
      LANGUAGES.some(
        (language) =>
          language.value ===
          form.language
      );


    if (!validLanguage) {

      setError(
        "Please select a valid album language."
      );

      return;

    }


    if (
      form.release_year
    ) {

      const year =
        Number(
          form.release_year
        );


      if (
        !Number.isInteger(
          year
        ) ||
        year < 1900 ||
        year > 2100
      ) {

        setError(
          "Please enter a valid release year."
        );

        return;

      }

    }


    try {

      setSaving(true);

      setError("");
      setSuccess("");


      const formData =
        new FormData();


      formData.append(
        "title",
        form.title.trim()
      );


      formData.append(
        "language",
        form.language
      );


      formData.append(
        "artist_id",
        form.artist_id || ""
      );


      formData.append(
        "release_year",
        form.release_year || ""
      );


      if (coverFile) {

        formData.append(
          "cover",
          coverFile
        );

      }


      /* UPDATE */

      if (
        editingAlbum
      ) {

        await API.put(
          `/admin/albums/${editingAlbum.id}`,
          formData,
          {
            headers: {
              "Content-Type":
                "multipart/form-data",
            },
          }
        );


        setSuccess(
          "Album updated successfully!"
        );

      }


      /* CREATE */

      else {

        await API.post(
          "/admin/albums",
          formData,
          {
            headers: {
              "Content-Type":
                "multipart/form-data",
            },
          }
        );


        setSuccess(
          "Album created successfully!"
        );

      }


      await loadData();


      setShowForm(false);

      setEditingAlbum(null);

      setCoverFile(null);

      setCoverPreview(
        DEFAULT_ALBUM
      );


    } catch (error) {

      console.error(
        "Save album error:",
        error
      );

      setError(
        error.response
          ?.data
          ?.message ||
        "Unable to save album."
      );

    } finally {

      setSaving(false);

    }

  };


  /* =====================================================
     DELETE
  ===================================================== */

  const handleDelete = async (
    album
  ) => {

    const confirmed =
      window.confirm(
        `Delete album "${album.title}"?`
      );


    if (!confirmed) {
      return;
    }


    try {

      setDeletingId(
        album.id
      );

      setError("");
      setSuccess("");


      await API.delete(
        `/admin/albums/${album.id}`
      );


      setAlbums(
        (previous) =>
          previous.filter(
            (item) =>
              item.id !==
              album.id
          )
      );


      setSuccess(
        "Album deleted successfully!"
      );


    } catch (error) {

      console.error(
        "Delete album error:",
        error
      );


      setError(
        error.response
          ?.data
          ?.message ||
        "Unable to delete album."
      );


    } finally {

      setDeletingId(null);

    }

  };


  /* =====================================================
     SEARCH
  ===================================================== */

  const query =
    search
      .trim()
      .toLowerCase();


  const filteredAlbums =
    albums.filter(
      (album) => {

        if (!query) {
          return true;
        }


        return [

          album.title,
          album.artist_name,
          album.language,
          album.release_year,

        ]
          .filter(Boolean)
          .some(
            (value) =>
              String(value)
                .toLowerCase()
                .includes(
                  query
                )
          );

      }
    );


  /* =====================================================
     COVER
  ===================================================== */

  const getCover = (
    coverUrl
  ) => {

    if (!coverUrl) {

      return DEFAULT_ALBUM;

    }


    if (
      coverUrl.startsWith(
        "http://"
      ) ||
      coverUrl.startsWith(
        "https://"
      )
    ) {

      return coverUrl;

    }


    return getMediaUrl(
      coverUrl
    );

  };


  /* =====================================================
     LANGUAGE MATCHING ARTISTS
  ===================================================== */

  const filteredArtists =
    artists.filter(
      (artist) =>
        (artist.language ||
          "Telugu") ===
        form.language
    );


  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {

    return (

      <div className="admin-page">

        <div className="admin-loading">

          Loading Albums...

        </div>

      </div>

    );

  }


  return (

    <div className="admin-page">


      {/* HEADER */}

      <div className="admin-header">

        <div>

          <span>
            KEERTHANA ADMIN
          </span>

          <h1>
            Manage Albums
          </h1>

          <p>
            Create and manage
            Christian music albums.
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
            placeholder="Search albums, artists or language..."
          />

        </div>


        <div className="admin-song-count">

          <FaCompactDisc />

          <span>

            {filteredAlbums.length}
            {" "}
            {filteredAlbums.length === 1
              ? "Album"
              : "Albums"}

          </span>

        </div>

      </div>


      {/* TABLE */}

      {filteredAlbums.length === 0 ? (

        <div className="admin-empty-state">

          <FaCompactDisc />

          <h2>
            No Albums Found
          </h2>

          <p>

            {search
              ? "Try another search."
              : "Create your first KEERTHANA album."}

          </p>


          {!search && (

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

                <th>
                  Album
                </th>

                <th>
                  Language
                </th>

                <th>
                  Artist
                </th>

                <th>
                  Release Year
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

              {filteredAlbums.map(
                (album) => {

                  const cover =
                    getCover(
                      album.cover_url
                    );


                  const languageLabel =
                    LANGUAGES.find(
                      (language) =>
                        language.value ===
                        album.language
                    )?.label ||
                    "తెలుగు";


                  return (

                    <tr
                      key={
                        album.id
                      }
                    >

                      {/* ALBUM */}

                      <td>

                        <div className="admin-album-cell">

                          <div className="admin-album-cover">

                            <img
                              src={cover}
                              alt={
                                album.title
                              }
                              onError={(
                                event
                              ) => {

                                event.currentTarget.src =
                                  DEFAULT_ALBUM;

                              }}
                            />

                          </div>


                          <strong>
                            {album.title}
                          </strong>

                        </div>

                      </td>


                      {/* LANGUAGE */}

                      <td>

                        {languageLabel}

                      </td>


                      {/* ARTIST */}

                      <td>

                        {album.artist_name ||
                          "—"}

                      </td>


                      {/* YEAR */}

                      <td>

                        {album.release_year ||
                          "—"}

                      </td>


                      {/* SONG COUNT */}

                      <td>

                        {album.song_count ??
                          0}

                      </td>


                      {/* ACTIONS */}

                      <td>

                        <div className="admin-table-actions">

                          <button
                            type="button"
                            className="admin-action-button edit"
                            title="Edit Album"
                            onClick={() =>
                              openEdit(
                                album
                              )
                            }
                          >

                            <FaEdit />

                          </button>


                          <button
                            type="button"
                            className="admin-action-button delete"
                            title="Delete Album"
                            disabled={
                              deletingId ===
                              album.id
                            }
                            onClick={() =>
                              handleDelete(
                                album
                              )
                            }
                          >

                            <FaTrash />

                          </button>

                        </div>

                      </td>

                    </tr>

                  );

                }
              )}

            </tbody>

          </table>

        </div>

      )}


      {/* ADD / EDIT MODAL */}

      {showForm && (

        <div className="admin-modal-overlay">

          <div className="admin-modal">


            {/* HEADER */}

            <div className="admin-modal-header">

              <div>

                <span>
                  KEERTHANA ADMIN
                </span>

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

            <form
              onSubmit={
                handleSubmit
              }
            >


              {/* LANGUAGE */}

              <div className="admin-field">

                <label>
                  Album Language *
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


              {/* TITLE */}

              <div className="admin-field">

                <label>
                  Album Title *
                </label>


                <input
                  type="text"
                  name="title"
                  value={
                    form.title
                  }
                  onChange={
                    handleChange
                  }
                  placeholder={
                    `${form.language} album title`
                  }
                  required
                />

              </div>


              {/* ARTIST */}

              <div className="admin-field">

                <label>
                  Artist
                </label>


                <select
                  name="artist_id"
                  value={
                    form.artist_id
                  }
                  onChange={
                    handleChange
                  }
                >

                  <option value="">
                    No Artist
                  </option>


                  {filteredArtists.length === 0 ? (

                    <option
                      value=""
                      disabled
                    >
                      No {form.language} artists available
                    </option>

                  ) : (

                    filteredArtists.map(
                      (artist) => (

                        <option
                          key={
                            artist.id
                          }
                          value={
                            artist.id
                          }
                        >

                          {artist.name}

                        </option>

                      )
                    )

                  )}

                </select>


                <small>

                  Only{" "}
                  {
                    LANGUAGES.find(
                      (language) =>
                        language.value ===
                        form.language
                    )?.label
                  }{" "}
                  artists are shown.

                </small>

              </div>


              {/* RELEASE YEAR */}

              <div className="admin-field">

                <label>
                  Release Year
                </label>


                <input
                  type="number"
                  name="release_year"
                  min="1900"
                  max="2100"
                  value={
                    form.release_year
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="2026"
                />

              </div>


              {/* COVER */}

              <div className="admin-field">

                <label>
                  Album Cover
                </label>


                <div className="album-cover-upload">


                  <div className="album-cover-upload-preview">

                    <img
                      src={
                        coverPreview ||
                        DEFAULT_ALBUM
                      }
                      alt="Album cover preview"
                      onError={(
                        event
                      ) => {

                        event.currentTarget.src =
                          DEFAULT_ALBUM;

                      }}
                    />

                  </div>


                  <div className="album-cover-upload-content">

                    <div className="album-cover-upload-icon">

                      <FaImage />

                    </div>


                    <strong>
                      Upload Album Cover
                    </strong>


                    <span>
                      JPG, PNG, WEBP
                    </span>


                    <span>
                      Maximum 5 MB
                    </span>


                    <label className="admin-primary-button album-cover-select">

                      <FaImage />

                      Choose Image


                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        onChange={
                          handleCoverChange
                        }
                        hidden
                      />

                    </label>

                  </div>

                </div>


                <small>

                  Cover image is optional.
                  If you don't upload an image,
                  the default album cover will be used.

                </small>

              </div>


              {/* ACTIONS */}

              <div className="admin-form-actions">

                <button
                  type="button"
                  className="admin-cancel-button"
                  disabled={
                    saving
                  }
                  onClick={
                    closeForm
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
                    : editingAlbum
                      ? "Update Album"
                      : "Add Album"}

                </button>

              </div>


            </form>

          </div>

        </div>

      )}

    </div>

  );

}


export default ManageAlbums;