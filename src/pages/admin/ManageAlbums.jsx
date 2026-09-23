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

import API
  from "../../services/api";

import {
  getMediaUrl,
  DEFAULT_ALBUM,
} from "../../utils/media";

import "../../assets/css/manageAlbums.css";


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
      ] =
        await Promise.all([

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
          .albums ||
        []
      );


      setArtists(
        artistsResponse
          .data
          .artists ||
        []
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
    } =
      event.target;


    setForm(
      (previous) => ({

        ...previous,

        [name]:
          value,

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


    /* IMAGE CHECK */

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


    /* SIZE CHECK - 5 MB */

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


      /* =================================================
         FORM DATA
      ================================================= */

      const formData =
        new FormData();


      formData.append(
        "title",
        form.title.trim()
      );


      formData.append(
        "artist_id",
        form.artist_id || ""
      );


      formData.append(
        "release_year",
        form.release_year || ""
      );


      /*
        Only append the file when
        the user selected a new image.
      */

      if (coverFile) {

        formData.append(
          "cover",
          coverFile
        );

      }


      /* =================================================
         UPDATE
      ================================================= */

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


      /* =================================================
         CREATE
      ================================================= */

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
     FILTER
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


      {/* =================================================
          HEADER
      ================================================= */}

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


      {/* =================================================
          MESSAGES
      ================================================= */}

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


      {/* =================================================
          TOOLBAR
      ================================================= */}

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
            placeholder="Search albums or artists..."
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


      {/* =================================================
          TABLE
      ================================================= */}

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
                              alt={album.title}
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


      {/* =================================================
          ADD / EDIT MODAL
      ================================================= */}

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
                  placeholder="Album title"
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


                  {artists.map(
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
                  )}

                </select>

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


              {/* =================================================
                  COVER IMAGE
              ================================================= */}

              <div className="admin-field">

                <label>
                  Album Cover
                </label>


                <div
                  className="album-cover-upload"
                >

                  <div
                    className="album-cover-upload-preview"
                  >

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


                  <div
                    className="album-cover-upload-content"
                  >

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


                    <label
                      className="admin-primary-button album-cover-select"
                    >

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