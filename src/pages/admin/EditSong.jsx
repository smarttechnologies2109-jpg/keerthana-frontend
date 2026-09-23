import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  FaArrowLeft,
  FaCloudUploadAlt,
  FaImage,
  FaMusic,
  FaSave,
  FaTimes,
} from "react-icons/fa";

import API
  from "../../services/api";

import {
  getMediaUrl,
} from "../../utils/media";

import "../../assets/css/editSong.css";




function EditSong() {

  const navigate =
    useNavigate();

  const {
    id,
  } = useParams();


  /* =====================================================
     FORM
  ===================================================== */

  const [form, setForm] =
    useState({

      title: "",

      title_english: "",

      language:
        "Telugu",

      lyrics: "",

      artist_id: "",

      album_id: "",

      category_id: "",

      featured: false,

    });


  /* =====================================================
     EXISTING MEDIA
  ===================================================== */

  const [
    existingAudio,
    setExistingAudio,
  ] = useState("");


  const [
    existingCover,
    setExistingCover,
  ] = useState("");


  /* =====================================================
     NEW FILES
  ===================================================== */

  const [
    audioFile,
    setAudioFile,
  ] = useState(null);


  const [
    coverFile,
    setCoverFile,
  ] = useState(null);


  const [
    coverPreview,
    setCoverPreview,
  ] = useState("");


  /* =====================================================
     OPTIONS
  ===================================================== */

  const [artists, setArtists] =
    useState([]);


  const [albums, setAlbums] =
    useState([]);


  const [
    categories,
    setCategories,
  ] = useState([]);


  /* =====================================================
     STATUS
  ===================================================== */

  const [loading, setLoading] =
    useState(true);


  const [saving, setSaving] =
    useState(false);


  const [error, setError] =
    useState("");


  const [success, setSuccess] =
    useState("");


  /* =====================================================
     LOAD EVERYTHING
  ===================================================== */

  useEffect(() => {

    const loadPage =
      async () => {

        try {

          setLoading(true);

          setError("");


          const [
            songResponse,
            artistsResponse,
            albumsResponse,
            categoriesResponse,
          ] =
            await Promise.all([

              API.get(
                `/admin/songs/${id}`
              ),

              API.get(
                "/artists"
              ),

              API.get(
                "/albums"
              ),

              API.get(
                "/categories"
              ),

            ]);


          const song =
            songResponse.data.song;


          /* =============================================
             SET FORM
          ============================================= */

          setForm({

            title:
              song.title ||
              "",

            title_english:
              song.title_english ||
              "",

            language:
              song.language ||
              "Telugu",

            lyrics:
              song.lyrics ||
              "",

            artist_id:
              song.artist_id
                ? String(
                    song.artist_id
                  )
                : "",

            album_id:
              song.album_id
                ? String(
                    song.album_id
                  )
                : "",

            category_id:
              song.category_id
                ? String(
                    song.category_id
                  )
                : "",

            featured:
              Boolean(
                song.featured
              ),

          });


          setExistingAudio(
            song.audio_url ||
            ""
          );


          setExistingCover(
            song.cover_url ||
            ""
          );


          /* =============================================
             OPTIONS
          ============================================= */

          setArtists(
            artistsResponse
              .data
              .artists ||
            []
          );


          setAlbums(
            albumsResponse
              .data
              .albums ||
            []
          );


          setCategories(
            categoriesResponse
              .data
              .categories ||
            []
          );


        } catch (error) {

          console.error(
            "Edit song load error:",
            error
          );


          setError(
            error.response
              ?.data
              ?.message ||
            "Unable to load song."
          );


        } finally {

          setLoading(false);

        }

      };


    loadPage();

  }, [id]);


  /* =====================================================
     CLEAN PREVIEW
  ===================================================== */

  useEffect(() => {

    return () => {

      if (coverPreview) {

        URL.revokeObjectURL(
          coverPreview
        );

      }

    };

  }, [coverPreview]);


  /* =====================================================
     CHANGE
  ===================================================== */

  const handleChange = (
    event
  ) => {

    const {
      name,
      value,
      type,
      checked,
    } =
      event.target;


    setForm(
      (previous) => ({

        ...previous,

        [name]:
          type ===
          "checkbox"
            ? checked
            : value,

      })
    );

  };


  /* =====================================================
     AUDIO CHANGE
  ===================================================== */

  const handleAudioChange = (
    event
  ) => {

    const file =
      event.target
        .files?.[0];


    if (!file) {
      return;
    }


    const allowedTypes = [
      "audio/mpeg",
      "audio/mp3",
      "audio/mp4",
      "audio/x-m4a",
    ];


    if (
      !allowedTypes.includes(
        file.type
      )
    ) {

      setError(
        "Please choose an MP3 or M4A audio file."
      );

      event.target.value =
        "";

      return;

    }


    if (
      file.size >
      30 * 1024 * 1024
    ) {

      setError(
        "Audio file must be smaller than 30 MB."
      );

      event.target.value =
        "";

      return;

    }


    setAudioFile(file);

    setError("");

  };


  /* =====================================================
     COVER CHANGE
  ===================================================== */

  const handleCoverChange = (
    event
  ) => {

    const file =
      event.target
        .files?.[0];


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
        "Cover must be JPG, PNG or WebP."
      );

      event.target.value =
        "";

      return;

    }


    if (
      file.size >
      10 * 1024 * 1024
    ) {

      setError(
        "Cover image must be smaller than 10 MB."
      );

      event.target.value =
        "";

      return;

    }


    if (coverPreview) {

      URL.revokeObjectURL(
        coverPreview
      );

    }


    const preview =
      URL.createObjectURL(
        file
      );


    setCoverFile(file);

    setCoverPreview(
      preview
    );

    setError("");

  };


  /* =====================================================
     REMOVE NEW AUDIO
  ===================================================== */

  const removeNewAudio =
    () => {

      setAudioFile(null);


      const input =
        document.getElementById(
          "edit-song-audio"
        );


      if (input) {

        input.value =
          "";

      }

    };


  /* =====================================================
     REMOVE NEW COVER
  ===================================================== */

  const removeNewCover =
    () => {

      if (coverPreview) {

        URL.revokeObjectURL(
          coverPreview
        );

      }


      setCoverFile(null);

      setCoverPreview("");


      const input =
        document.getElementById(
          "edit-song-cover"
        );


      if (input) {

        input.value =
          "";

      }

    };


  /* =====================================================
     FORMAT SIZE
  ===================================================== */

  const formatFileSize = (
    bytes
  ) => {

    if (!bytes) {
      return "0 MB";
    }


    return `${(
      bytes /
      (1024 * 1024)
    ).toFixed(2)} MB`;

  };


  /* =====================================================
     SUBMIT
  ===================================================== */

  const handleSubmit =
    async (
      event
    ) => {

      event.preventDefault();


      if (
        !form.title.trim()
      ) {

        setError(
          "Song title is required."
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
          "title",
          form.title.trim()
        );


        formData.append(
          "title_english",
          form.title_english
        );


        formData.append(
          "language",
          form.language
        );


        formData.append(
          "lyrics",
          form.lyrics
        );


        if (
          form.artist_id
        ) {

          formData.append(
            "artist_id",
            form.artist_id
          );

        }


        if (
          form.album_id
        ) {

          formData.append(
            "album_id",
            form.album_id
          );

        }


        if (
          form.category_id
        ) {

          formData.append(
            "category_id",
            form.category_id
          );

        }


        formData.append(
          "featured",
          String(
            form.featured
          )
        );


        /* =============================================
           ONLY SEND NEW FILES
        ============================================= */

        if (audioFile) {

          formData.append(
            "audio",
            audioFile
          );

        }


        if (coverFile) {

          formData.append(
            "cover",
            coverFile
          );

        }


        const response =
          await API.put(
            `/admin/songs/${id}`,
            formData
          );


        console.log(
          "Updated song:",
          response.data
        );


        setSuccess(
          "Song updated successfully!"
        );


        setTimeout(
          () => {

            navigate(
              "/admin/songs"
            );

          },
          800
        );


      } catch (error) {

        console.error(
          "Update song error:",
          error
        );


        setError(
          error.response
            ?.data
            ?.message ||
          "Unable to update song."
        );


      } finally {

        setSaving(false);

      }

    };


  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {

    return (

      <div className="admin-page">

        <div className="admin-loading">

          Loading Song...

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

      <div className="admin-form-header">


        <button
          type="button"

          className="admin-back-button"

          onClick={() =>
            navigate(
              "/admin/songs"
            )
          }
        >

          <FaArrowLeft />

          Back

        </button>


        <div>

          <span>
            KEERTHANA ADMIN
          </span>

          <h1>
            Edit Song
          </h1>

          <p>
            Update song information,
            lyrics and media.
          </p>

        </div>


      </div>


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


      <form
        className="admin-song-form"

        onSubmit={
          handleSubmit
        }
      >


        {/* =============================================
            SONG INFORMATION
        ============================================= */}

        <div className="admin-form-section">


          <div className="admin-form-section-title">

            <h2>
              Song Information
            </h2>

            <p>
              Edit the song details.
            </p>

          </div>


          <div className="admin-form-grid">


            <div className="admin-field">

              <label>
                Song Title *
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
              />

            </div>


            <div className="admin-field">

              <label>
                English Title
              </label>

              <input
                type="text"

                name="title_english"

                value={
                  form.title_english
                }

                onChange={
                  handleChange
                }
              />

            </div>


            <div className="admin-field">

              <label>
                Language
              </label>

              <select
                name="language"

                value={
                  form.language
                }

                onChange={
                  handleChange
                }
              >

                <option value="Telugu">
                  Telugu
                </option>

                <option value="English">
                  English
                </option>

                <option value="Hindi">
                  Hindi
                </option>

              </select>

            </div>


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


            <div className="admin-field">

              <label>
                Album
              </label>

              <select
                name="album_id"

                value={
                  form.album_id
                }

                onChange={
                  handleChange
                }
              >

                <option value="">
                  No Album
                </option>


                {albums.map(
                  (album) => (

                    <option
                      key={
                        album.id
                      }

                      value={
                        album.id
                      }
                    >

                      {album.title}

                    </option>

                  )
                )}

              </select>

            </div>


            <div className="admin-field">

              <label>
                Category
              </label>

              <select
                name="category_id"

                value={
                  form.category_id
                }

                onChange={
                  handleChange
                }
              >

                <option value="">
                  No Category
                </option>


                {categories.map(
                  (category) => (

                    <option
                      key={
                        category.id
                      }

                      value={
                        category.id
                      }
                    >

                      {category.name}

                    </option>

                  )
                )}

              </select>

            </div>


          </div>

        </div>


        {/* =============================================
            MEDIA
        ============================================= */}

        <div className="admin-form-section">


          <div className="admin-form-section-title">

            <h2>
              Media
            </h2>

            <p>
              Leave unchanged to keep
              the current files.
            </p>

          </div>


          <div className="admin-upload-grid">


            {/* AUDIO */}

            <div className="admin-upload-box">


              <div className="admin-upload-icon">

                <FaMusic />

              </div>


              <h3>
                Audio File
              </h3>


              {existingAudio && (

                <p className="admin-existing-media">

                  Current audio available

                </p>

              )}


              {!audioFile ? (

                <>

                  <input
                    id="edit-song-audio"

                    className="admin-file-input"

                    type="file"

                    accept=".mp3,.m4a,audio/mpeg,audio/mp4"

                    onChange={
                      handleAudioChange
                    }
                  />


                  <label
                    htmlFor="edit-song-audio"

                    className="admin-upload-button"
                  >

                    <FaCloudUploadAlt />

                    Replace Audio

                  </label>

                </>

              ) : (

                <div className="admin-selected-file">


                  <div>

                    <strong>
                      {audioFile.name}
                    </strong>

                    <span>

                      New audio •{" "}

                      {formatFileSize(
                        audioFile.size
                      )}

                    </span>

                  </div>


                  <button
                    type="button"

                    onClick={
                      removeNewAudio
                    }
                  >

                    <FaTimes />

                  </button>


                </div>

              )}


            </div>


            {/* COVER */}

            <div className="admin-upload-box">


              {coverPreview ? (

                <img
                  className="admin-cover-preview"

                  src={
                    coverPreview
                  }

                  alt="New cover"
                />

              ) : existingCover ? (

                <img
                  className="admin-cover-preview"

                  src={
                    getMediaUrl(
                      existingCover
                    )
                  }

                  alt="Current cover"
                />

              ) : (

                <div className="admin-upload-icon">

                  <FaImage />

                </div>

              )}


              <h3>
                Cover Image
              </h3>


              <p>

                {coverFile
                  ? "New cover selected"
                  : existingCover
                    ? "Current cover"
                    : "No current cover"}

              </p>


              {!coverFile ? (

                <>

                  <input
                    id="edit-song-cover"

                    className="admin-file-input"

                    type="file"

                    accept=".jpg,.jpeg,.png,.webp"

                    onChange={
                      handleCoverChange
                    }
                  />


                  <label
                    htmlFor="edit-song-cover"

                    className="admin-upload-button"
                  >

                    <FaCloudUploadAlt />

                    {existingCover
                      ? "Replace Cover"
                      : "Add Cover"}

                  </label>

                </>

              ) : (

                <div className="admin-selected-file">

                  <div>

                    <strong>
                      {coverFile.name}
                    </strong>

                    <span>

                      {formatFileSize(
                        coverFile.size
                      )}

                    </span>

                  </div>


                  <button
                    type="button"

                    onClick={
                      removeNewCover
                    }
                  >

                    <FaTimes />

                  </button>

                </div>

              )}


            </div>


          </div>

        </div>


        {/* =============================================
            LYRICS
        ============================================= */}

        <div className="admin-form-section">


          <div className="admin-form-section-title">

            <h2>
              Lyrics
            </h2>

            <p>
              Edit Pallavi and
              Charanam lyrics.
            </p>

          </div>


          <div className="admin-field">

            <textarea
              name="lyrics"

              rows="18"

              value={
                form.lyrics
              }

              onChange={
                handleChange
              }

              placeholder="Enter lyrics..."
            />

          </div>


        </div>


        {/* =============================================
            FEATURED
        ============================================= */}

        <label className="admin-checkbox">

          <input
            type="checkbox"

            name="featured"

            checked={
              form.featured
            }

            onChange={
              handleChange
            }
          />


          <div>

            <strong>
              Featured Song
            </strong>

            <span>
              Show this song in
              Featured Worship.
            </span>

          </div>

        </label>


        {/* =============================================
            ACTIONS
        ============================================= */}

        <div className="admin-form-actions">


          <button
            type="button"

            className="admin-cancel-button"

            disabled={
              saving
            }

            onClick={() =>
              navigate(
                "/admin/songs"
              )
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

            <FaSave />


            {saving
              ? "Saving..."
              : "Update Song"}

          </button>


        </div>


      </form>


    </div>

  );

}


export default EditSong;