import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  FaArrowLeft,
  FaCloudUploadAlt,
  FaImage,
  FaMusic,
  FaPlus,
  FaSave,
  FaTimes,
} from "react-icons/fa";

import API from "../../services/api";

import "../../assets/css/admin/addSong.css";


function AddSong() {

  const navigate =
    useNavigate();


  /* =====================================================
     SUPPORTED LANGUAGES
  ===================================================== */

  const LANGUAGES = [
    {
      value: "Telugu",
      nativeName: "తెలుగు",
    },
    {
      value: "Hindi",
      nativeName: "हिन्दी",
    },
    {
      value: "English",
      nativeName: "English",
    },
    {
      value: "Malayalam",
      nativeName: "മലയാളം",
    },
    {
      value: "Kannada",
      nativeName: "ಕನ್ನಡ",
    },
    {
      value: "Tamil",
      nativeName: "தமிழ்",
    },
  ];


  /* =====================================================
     LANGUAGE CONFIGURATION
  ===================================================== */

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


  /* =====================================================
     FORM STATE
  ===================================================== */

  const [
    form,
    setForm,
  ] = useState({

    title: "",

    title_english: "",

    language: "Telugu",

    lyrics: "",

    artist_id: "",

    album_id: "",

    category_id: "",

    ministry_id: "",

    moods: [],

    featured: false,

  });


  const selectedLanguage =
    LANGUAGE_CONFIG[
      form.language
    ] ||
    LANGUAGE_CONFIG.Telugu;


  /* =====================================================
     FILE STATE
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
     DROPDOWN DATA
  ===================================================== */

  const [
    artists,
    setArtists,
  ] = useState([]);


  const [
    albums,
    setAlbums,
  ] = useState([]);


  const [
    categories,
    setCategories,
  ] = useState([]);


  const [
    ministries,
    setMinistries,
  ] = useState([]);


  const [
    ministriesLoading,
    setMinistriesLoading,
  ] = useState(true);


  /* =====================================================
     QUICK CREATE FORMS
  ===================================================== */

  const [
    showArtistForm,
    setShowArtistForm,
  ] = useState(false);


  const [
    showAlbumForm,
    setShowAlbumForm,
  ] = useState(false);


  const [
    showCategoryForm,
    setShowCategoryForm,
  ] = useState(false);


  /* =====================================================
     NEW ARTIST
  ===================================================== */

  const [
    newArtist,
    setNewArtist,
  ] = useState({

    name: "",

    bio: "",

  });


  /* =====================================================
     NEW ALBUM
  ===================================================== */

  const [
    newAlbum,
    setNewAlbum,
  ] = useState({

    title: "",

    artist_id: "",

    release_year: "",

  });


  /* =====================================================
     NEW CATEGORY
  ===================================================== */

  const [
    newCategory,
    setNewCategory,
  ] = useState({

    name: "",

  });


  /* =====================================================
     PAGE STATE
  ===================================================== */

  const [
    pageLoading,
    setPageLoading,
  ] = useState(true);


  const [
    saving,
    setSaving,
  ] = useState(false);


  const [
    quickSaving,
    setQuickSaving,
  ] = useState(false);


  const [
    error,
    setError,
  ] = useState("");


  const [
    success,
    setSuccess,
  ] = useState("");


  /* =====================================================
     LOAD ALL DATA
  ===================================================== */

  useEffect(() => {

    const loadData = async () => {

      try {

        setPageLoading(true);

        setMinistriesLoading(true);

        setError("");


        const [
          artistsResponse,
          albumsResponse,
          categoriesResponse,
          ministriesResponse,
        ] = await Promise.all([

          API.get("/artists"),

          API.get("/albums"),

          API.get("/categories"),

          API.get("/ministries"),

        ]);


        /* =================================================
           ARTISTS
        ================================================= */

        setArtists(
          Array.isArray(
            artistsResponse.data?.artists
          )
            ? artistsResponse.data.artists
            : Array.isArray(
                artistsResponse.data
              )
              ? artistsResponse.data
              : []
        );


        /* =================================================
           ALBUMS
        ================================================= */

        setAlbums(
          Array.isArray(
            albumsResponse.data?.albums
          )
            ? albumsResponse.data.albums
            : Array.isArray(
                albumsResponse.data
              )
              ? albumsResponse.data
              : []
        );


        /* =================================================
           CATEGORIES
        ================================================= */

        setCategories(
          Array.isArray(
            categoriesResponse.data?.categories
          )
            ? categoriesResponse.data.categories
            : Array.isArray(
                categoriesResponse.data
              )
              ? categoriesResponse.data
              : []
        );


        /* =================================================
           MINISTRIES
        ================================================= */

        const ministryData =
          ministriesResponse.data;


        if (
          Array.isArray(
            ministryData
          )
        ) {

          setMinistries(
            ministryData
          );

        } else if (
          Array.isArray(
            ministryData?.ministries
          )
        ) {

          setMinistries(
            ministryData.ministries
          );

        } else {

          setMinistries([]);

        }


      } catch (error) {

        console.error(
          "Add Song form data error:",
          error
        );


        setError(
          error.response?.data?.message ||
          "Unable to load artists, albums, categories or ministries."
        );


      } finally {

        setPageLoading(false);

        setMinistriesLoading(false);

      }

    };


    loadData();

  }, []);


  /* =====================================================
     FILTER DATA BY SELECTED LANGUAGE
  ===================================================== */

  const filteredArtists =
    artists.filter(
      (artist) =>
        String(
          artist.language || ""
        ).trim().toLowerCase() ===
        String(
          form.language
        ).trim().toLowerCase()
    );


  const filteredAlbums =
    albums.filter(
      (album) =>
        String(
          album.language || ""
        ).trim().toLowerCase() ===
        String(
          form.language
        ).trim().toLowerCase()
    );


  const filteredCategories =
    categories.filter(
      (category) =>
        String(
          category.language || ""
        ).trim().toLowerCase() ===
        String(
          form.language
        ).trim().toLowerCase()
    );


  const filteredMinistries =
    ministries.filter(
      (ministry) =>
        String(
          ministry.language || ""
        ).trim().toLowerCase() ===
        String(
          form.language
        ).trim().toLowerCase()
    );


  /* =====================================================
     LANGUAGE CHANGE
  ===================================================== */

  const handleLanguageChange = (
    event
  ) => {

    const language =
      event.target.value;


    setForm(
      (previous) => ({

        ...previous,

        language,

        artist_id: "",

        album_id: "",

        category_id: "",

        ministry_id: "",

      })
    );


    setNewAlbum(
      (previous) => ({

        ...previous,

        artist_id: "",

      })
    );


    setShowArtistForm(false);

    setShowAlbumForm(false);

    setShowCategoryForm(false);

    setError("");

    setSuccess("");

  };


  /* =====================================================
     CLEAN COVER PREVIEW
  ===================================================== */

  useEffect(() => {

    return () => {

      if (
        coverPreview
      ) {

        URL.revokeObjectURL(
          coverPreview
        );

      }

    };

  }, [coverPreview]);


  /* =====================================================
     NORMAL FIELD CHANGE
  ===================================================== */

  const handleChange = (
    event
  ) => {

    const {
      name,
      value,
      type,
      checked,
    } = event.target;


    setForm(
      (previous) => ({

        ...previous,

        [name]:
          type === "checkbox"
            ? checked
            : value,

      })
    );

  };


  /* =====================================================
     MOOD CHANGE
  ===================================================== */

  const handleMoodChange = (
    event
  ) => {

    const {
      value,
      checked,
    } = event.target;


    setForm(
      (previous) => ({

        ...previous,

        moods:
          checked

            ? [
                ...(previous.moods || []),
                value,
              ]

            : (
                previous.moods || []
              ).filter(
                (mood) =>
                  mood !== value
              ),

      })
    );

  };


  /* =====================================================
     ARTIST CHANGE
  ===================================================== */

  const handleArtistChange = (
    event
  ) => {

    const artistId =
      event.target.value;


    setForm(
      (previous) => ({

        ...previous,

        artist_id:
          artistId,

        album_id: "",

      })
    );


    setNewAlbum(
      (previous) => ({

        ...previous,

        artist_id:
          artistId,

      })
    );

  };


  /* =====================================================
     QUICK CREATE ARTIST
  ===================================================== */

  const createArtist =
    async () => {

      const name =
        newArtist
          .name
          .trim();


      if (!name) {

        setError(
          "Artist name is required."
        );

        return;

      }


      try {

        setQuickSaving(true);

        setError("");

        setSuccess("");


        const response =
          await API.post(
            "/admin/artists",
            {

              name,

              bio:
                newArtist
                  .bio
                  .trim(),

              language:
                form.language,

            }
          );


        const artist =
          response
            .data
            .artist;


        if (!artist) {

          throw new Error(
            "Artist was not returned by server."
          );

        }


        setArtists(
          (previous) => [

            ...previous,

            artist,

          ]
        );


        setForm(
          (previous) => ({

            ...previous,

            artist_id:
              String(
                artist.id
              ),

            album_id: "",

          })
        );


        setNewAlbum(
          (previous) => ({

            ...previous,

            artist_id:
              String(
                artist.id
              ),

          })
        );


        setNewArtist({

          name: "",

          bio: "",

        });


        setShowArtistForm(false);


        setSuccess(
          `Artist "${artist.name}" added successfully.`
        );


      } catch (error) {

        console.error(
          "Create artist error:",
          error
        );


        setError(
          error.response
            ?.data
            ?.message ||
          error.message ||
          "Unable to create artist."
        );


      } finally {

        setQuickSaving(false);

      }

    };


  /* =====================================================
     QUICK CREATE ALBUM
  ===================================================== */

  const createAlbum =
    async () => {

      const title =
        newAlbum
          .title
          .trim();


      const artistId =
        newAlbum
          .artist_id ||
        form.artist_id;


      if (!title) {

        setError(
          "Album title is required."
        );

        return;

      }


      if (!artistId) {

        setError(
          "Please select or create an artist before creating an album."
        );

        return;

      }


      try {

        setQuickSaving(true);

        setError("");

        setSuccess("");


        const response =
          await API.post(
            "/admin/albums",
            {

              title,

              artist_id:
                Number(
                  artistId
                ),

              release_year:
                newAlbum
                  .release_year
                  ? Number(
                      newAlbum
                        .release_year
                    )
                  : null,

              language:
                form.language,

            }
          );


        const album =
          response
            .data
            .album;


        if (!album) {

          throw new Error(
            "Album was not returned by server."
          );

        }


        setAlbums(
          (previous) => [

            ...previous,

            album,

          ]
        );


        setForm(
          (previous) => ({

            ...previous,

            album_id:
              String(
                album.id
              ),

          })
        );


        setNewAlbum({

          title: "",

          artist_id:
            String(
              artistId
            ),

          release_year: "",

        });


        setShowAlbumForm(false);


        setSuccess(
          `Album "${album.title}" added successfully.`
        );


      } catch (error) {

        console.error(
          "Create album error:",
          error
        );


        setError(
          error.response
            ?.data
            ?.message ||
          error.message ||
          "Unable to create album."
        );


      } finally {

        setQuickSaving(false);

      }

    };


  /* =====================================================
     QUICK CREATE CATEGORY
  ===================================================== */

  const createCategory =
    async () => {

      const name =
        newCategory
          .name
          .trim();


      if (!name) {

        setError(
          "Category name is required."
        );

        return;

      }


      try {

        setQuickSaving(true);

        setError("");

        setSuccess("");


        const response =
          await API.post(
            "/admin/categories",
            {

              name,

              language:
                form.language,

            }
          );


        const category =
          response
            .data
            .category;


        if (!category) {

          throw new Error(
            "Category was not returned by server."
          );

        }


        setCategories(
          (previous) => [

            ...previous,

            category,

          ]
        );


        setForm(
          (previous) => ({

            ...previous,

            category_id:
              String(
                category.id
              ),

          })
        );


        setNewCategory({

          name: "",

        });


        setShowCategoryForm(false);


        setSuccess(
          `Category "${category.name}" added successfully.`
        );


      } catch (error) {

        console.error(
          "Create category error:",
          error
        );


        setError(
          error.response
            ?.data
            ?.message ||
          error.message ||
          "Unable to create category."
        );


      } finally {

        setQuickSaving(false);

      }

    };


  /* =====================================================
     AUDIO FILE
  ===================================================== */

  const handleAudioChange = (
    event
  ) => {

    const file =
      event
        .target
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


    const fileName =
      file.name
        .toLowerCase();


    const validExtension =
      fileName.endsWith(".mp3") ||
      fileName.endsWith(".m4a");


    if (
      !allowedTypes.includes(
        file.type
      ) &&
      !validExtension
    ) {

      setError(
        "Please select an MP3 or M4A audio file."
      );


      event.target.value = "";

      return;

    }


    const maxSize =
      30 *
      1024 *
      1024;


    if (
      file.size >
      maxSize
    ) {

      setError(
        "Audio file must be smaller than 30 MB."
      );


      event.target.value = "";

      return;

    }


    setError("");

    setAudioFile(file);

  };


  /* =====================================================
     REMOVE AUDIO
  ===================================================== */

  const removeAudio = () => {

    setAudioFile(null);


    const input =
      document.getElementById(
        "song-audio-input"
      );


    if (input) {
      input.value = "";
    }

  };


  /* =====================================================
     COVER FILE
  ===================================================== */

  const handleCoverChange = (
    event
  ) => {

    const file =
      event
        .target
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
        "Cover image must be JPG, PNG or WebP."
      );


      event.target.value = "";

      return;

    }


    const maxImageSize =
      10 *
      1024 *
      1024;


    if (
      file.size >
      maxImageSize
    ) {

      setError(
        "Cover image must be smaller than 10 MB."
      );


      event.target.value = "";

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

    setCoverPreview(preview);

    setError("");

  };


  /* =====================================================
     REMOVE COVER
  ===================================================== */

  const removeCover = () => {

    if (coverPreview) {

      URL.revokeObjectURL(
        coverPreview
      );

    }


    setCoverFile(null);

    setCoverPreview("");


    const input =
      document.getElementById(
        "song-cover-input"
      );


    if (input) {
      input.value = "";
    }

  };


  /* =====================================================
     FILE SIZE
  ===================================================== */

  const formatFileSize = (
    bytes
  ) => {

    if (!bytes) {
      return "0 MB";
    }


    const mb =
      bytes /
      (1024 * 1024);


    return `${mb.toFixed(2)} MB`;

  };


  /* =====================================================
     SUBMIT SONG
  ===================================================== */

  const handleSubmit =
    async (
      event
    ) => {

      event.preventDefault();

      setError("");

      setSuccess("");


      /* LANGUAGE */

      if (
        !LANGUAGES.some(
          (language) =>
            language.value ===
            form.language
        )
      ) {

        setError(
          "Please select a valid song language."
        );

        return;

      }


      /* TITLE */

      if (
        !form.title.trim()
      ) {

        setError(
          `${selectedLanguage.titleLabel} is required.`
        );

        return;

      }


      /* ARTIST */

      if (
        !form.artist_id
      ) {

        setError(
          "Please select or create an artist."
        );

        return;

      }


      /* CATEGORY */

      if (
        !form.category_id
      ) {

        setError(
          "Please select or create a category."
        );

        return;

      }


      /* AUDIO */

      if (
        !audioFile
      ) {

        setError(
          "Please select an audio file."
        );

        return;

      }


      /* =================================================
         FRONTEND LANGUAGE SAFETY CHECK
      ================================================= */

      const selectedArtist =
        artists.find(
          (artist) =>
            String(
              artist.id
            ) ===
            String(
              form.artist_id
            )
        );


      const selectedAlbum =
        form.album_id
          ? albums.find(
              (album) =>
                String(
                  album.id
                ) ===
                String(
                  form.album_id
                )
            )
          : null;


      const selectedCategory =
        categories.find(
          (category) =>
            String(
              category.id
            ) ===
            String(
              form.category_id
            )
        );


      const selectedMinistry =
        form.ministry_id
          ? ministries.find(
              (ministry) =>
                String(
                  ministry.id
                ) ===
                String(
                  form.ministry_id
                )
            )
          : null;


      const languageMatches = (
        item
      ) => {

        if (!item) {
          return true;
        }


        return (
          String(
            item.language || ""
          ).trim().toLowerCase() ===
          String(
            form.language
          ).trim().toLowerCase()
        );

      };


      if (
        !languageMatches(
          selectedArtist
        )
      ) {

        setError(
          "Selected artist does not belong to the selected song language."
        );

        return;

      }


      if (
        !languageMatches(
          selectedAlbum
        )
      ) {

        setError(
          "Selected album does not belong to the selected song language."
        );

        return;

      }


      if (
        !languageMatches(
          selectedCategory
        )
      ) {

        setError(
          "Selected category does not belong to the selected song language."
        );

        return;

      }


      if (
        !languageMatches(
          selectedMinistry
        )
      ) {

        setError(
          "Selected ministry does not belong to the selected song language."
        );

        return;

      }


      try {

        setSaving(true);


        const formData =
          new FormData();


        /* TITLE */

        formData.append(
          "title",
          form.title.trim()
        );


        /* ENGLISH TITLE */

        formData.append(
          "title_english",
          form.title_english.trim()
        );


        /* LANGUAGE */

        formData.append(
          "language",
          form.language
        );


        /* LYRICS */

        formData.append(
          "lyrics",
          form.lyrics
        );


        /* ARTIST */

        formData.append(
          "artist_id",
          form.artist_id
        );


        /* ALBUM */

        if (
          form.album_id
        ) {

          formData.append(
            "album_id",
            form.album_id
          );

        }


        /* CATEGORY */

        formData.append(
          "category_id",
          form.category_id
        );


        /* MINISTRY */

        if (
          form.ministry_id
        ) {

          formData.append(
            "ministry_id",
            form.ministry_id
          );

        }


        /* MOODS */

        formData.append(
          "moods",
          JSON.stringify(
            form.moods || []
          )
        );


        /* FEATURED */

        formData.append(
          "featured",
          String(
            form.featured
          )
        );


        /* AUDIO */

        formData.append(
          "audio",
          audioFile
        );


        /* COVER */

        if (
          coverFile
        ) {

          formData.append(
            "cover",
            coverFile
          );

        }


        /* =================================================
           SEND SONG
        ================================================= */

        const response =
          await API.post(
            "/admin/songs",
            formData
          );


        console.log(
          "Song uploaded:",
          response.data
        );


        setSuccess(
          "Song uploaded successfully!"
        );


        setTimeout(
          () => {

            navigate(
              "/admin/songs"
            );

          },
          1000
        );


      } catch (error) {

        console.error(
          "Song upload error:",
          error
        );


        setError(
          error.response
            ?.data
            ?.message ||
          "Unable to upload song."
        );


      } finally {

        setSaving(false);

      }

    };


  /* =====================================================
     PAGE LOADING
  ===================================================== */

  if (
    pageLoading
  ) {

    return (

      <div className="admin-page">

        <div className="admin-loading">

          Loading Add Song...

        </div>

      </div>

    );

  }


  /* =====================================================
     PAGE
  ===================================================== */

  return (

    <div className="admin-page">


      {/* =================================================
          HEADER
      ================================================= */}

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
            Add New Song
          </h1>


          <p>
            Add the song, artist,
            album, category, ministry,
            mood, audio and lyrics
            from one page.
          </p>

        </div>

      </div>


      {/* =================================================
          ERROR
      ================================================= */}

      {error && (

        <div className="admin-error">

          {error}

        </div>

      )}


      {/* =================================================
          SUCCESS
      ================================================= */}

      {success && (

        <div className="admin-success">

          {success}

        </div>

      )}


      {/* =================================================
          SONG FORM
      ================================================= */}

      <form
        className="admin-song-form"
        onSubmit={handleSubmit}
      >


        {/* =================================================
            SONG INFORMATION
        ================================================= */}

        <div className="admin-form-section">

          <div className="admin-form-section-title">

            <h2>
              Song Information
            </h2>

            <p>
              Enter the basic
              details of the song.
            </p>

          </div>


          <div className="admin-form-grid">


            {/* =================================================
                LANGUAGE
            ================================================= */}

            <div className="admin-field">

              <label>
                Song Language
              </label>


              <select
                name="language"
                value={form.language}
                onChange={handleLanguageChange}
                required
              >

                {LANGUAGES.map(
                  (language) => (

                    <option
                      key={language.value}
                      value={language.value}
                    >
                      {language.nativeName}
                    </option>

                  )
                )}

              </select>


              <small>
                Selected language:
                {" "}
                {selectedLanguage.nativeName}
              </small>

            </div>


            {/* =================================================
                TITLE
            ================================================= */}

            <div className="admin-field">

              <label>
                {selectedLanguage.titleLabel} *
              </label>


              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder={
                  selectedLanguage.titlePlaceholder
                }
                maxLength={255}
                required
              />

            </div>


            {/* =================================================
                ENGLISH TITLE
            ================================================= */}

            <div className="admin-field">

              <label>
                English Title
              </label>


              <input
                type="text"
                name="title_english"
                value={form.title_english}
                onChange={handleChange}
                placeholder="English title"
                maxLength={255}
              />

            </div>


            {/* =================================================
                ARTIST
            ================================================= */}

            <div className="admin-field">

              <div className="admin-field-label-row">

                <label>
                  Artist
                </label>


                <button
                  type="button"
                  className="admin-inline-add-button"
                  onClick={() => {

                    setError("");

                    setSuccess("");

                    setShowArtistForm(
                      (previous) =>
                        !previous
                    );

                    setShowAlbumForm(false);

                    setShowCategoryForm(false);

                  }}
                >

                  <FaPlus />

                  New Artist

                </button>

              </div>


              <select
                name="artist_id"
                value={form.artist_id}
                onChange={handleArtistChange}
                required
              >

                <option value="">
                  Select Artist
                </option>


                {filteredArtists.map(
                  (artist) => (

                    <option
                      key={artist.id}
                      value={artist.id}
                    >

                      {artist.name}

                    </option>

                  )
                )}

              </select>


              {filteredArtists.length === 0 && (

                <small>
                  No artists available for{" "}
                  {selectedLanguage.nativeName}.
                </small>

              )}


              {showArtistForm && (

                <div className="admin-quick-create">

                  <h4>
                    Add New Artist
                  </h4>


                  <input
                    type="text"
                    placeholder="Artist name"
                    value={newArtist.name}
                    onChange={(
                      event
                    ) =>

                      setNewArtist(
                        (previous) => ({

                          ...previous,

                          name:
                            event.target.value,

                        })
                      )

                    }
                  />


                  <textarea
                    rows="3"
                    placeholder="Artist bio (optional)"
                    value={newArtist.bio}
                    onChange={(
                      event
                    ) =>

                      setNewArtist(
                        (previous) => ({

                          ...previous,

                          bio:
                            event.target.value,

                        })
                      )

                    }
                  />


                  <div className="admin-quick-actions">

                    <button
                      type="button"
                      disabled={quickSaving}
                      onClick={() =>
                        setShowArtistForm(false)
                      }
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

                      {quickSaving
                        ? "Adding..."
                        : "Add Artist"}

                    </button>

                  </div>

                </div>

              )}

            </div>


            {/* =================================================
                ALBUM
            ================================================= */}

            <div className="admin-field">

              <div className="admin-field-label-row">

                <label>
                  Album
                </label>


                <button
                  type="button"
                  className="admin-inline-add-button"
                  onClick={() => {

                    setError("");

                    setSuccess("");


                    if (
                      !form.artist_id
                    ) {

                      setError(
                        "Please select or create an artist first."
                      );

                      return;

                    }


                    setNewAlbum(
                      (previous) => ({

                        ...previous,

                        artist_id:
                          form.artist_id,

                      })
                    );


                    setShowAlbumForm(
                      (previous) =>
                        !previous
                    );


                    setShowArtistForm(false);

                    setShowCategoryForm(false);

                  }}
                >

                  <FaPlus />

                  New Album

                </button>

              </div>


              <select
                name="album_id"
                value={form.album_id}
                onChange={handleChange}
              >

                <option value="">
                  No Album / Single
                </option>


                {filteredAlbums

                  .filter(
                    (album) => {

                      if (
                        !form.artist_id
                      ) {

                        return false;

                      }


                      if (
                        !album.artist_id
                      ) {

                        return false;

                      }


                      return (
                        String(
                          album.artist_id
                        ) ===
                        String(
                          form.artist_id
                        )
                      );

                    }
                  )

                  .map(
                    (album) => (

                      <option
                        key={album.id}
                        value={album.id}
                      >

                        {album.title}

                      </option>

                    )
                  )}

              </select>


              <small>
                Album is optional.
                Leave this as
                "No Album / Single"
                for a single.
              </small>


              {showAlbumForm && (

                <div className="admin-quick-create">

                  <h4>
                    Add New Album
                  </h4>


                  <input
                    type="text"
                    placeholder="Album title"
                    value={newAlbum.title}
                    onChange={(
                      event
                    ) =>

                      setNewAlbum(
                        (previous) => ({

                          ...previous,

                          title:
                            event.target.value,

                        })
                      )

                    }
                  />


                  <input
                    type="number"
                    min="1900"
                    max="2100"
                    placeholder="Release year (optional)"
                    value={
                      newAlbum.release_year
                    }
                    onChange={(
                      event
                    ) =>

                      setNewAlbum(
                        (previous) => ({

                          ...previous,

                          release_year:
                            event.target.value,

                        })
                      )

                    }
                  />


                  <div className="admin-quick-actions">

                    <button
                      type="button"
                      disabled={quickSaving}
                      onClick={() =>
                        setShowAlbumForm(false)
                      }
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

                      {quickSaving
                        ? "Adding..."
                        : "Add Album"}

                    </button>

                  </div>

                </div>

              )}

            </div>


            {/* =================================================
                CATEGORY
            ================================================= */}

            <div className="admin-field">

              <div className="admin-field-label-row">

                <label>
                  Category
                </label>


                <button
                  type="button"
                  className="admin-inline-add-button"
                  onClick={() => {

                    setError("");

                    setSuccess("");

                    setShowCategoryForm(
                      (previous) =>
                        !previous
                    );

                    setShowArtistForm(false);

                    setShowAlbumForm(false);

                  }}
                >

                  <FaPlus />

                  New Category

                </button>

              </div>


              <select
                name="category_id"
                value={form.category_id}
                onChange={handleChange}
                required
              >

                <option value="">
                  Select Category
                </option>


                {filteredCategories.map(
                  (category) => (

                    <option
                      key={category.id}
                      value={category.id}
                    >

                      {category.name}

                    </option>

                  )
                )}

              </select>


              {filteredCategories.length === 0 && (

                <small>
                  No categories available for{" "}
                  {selectedLanguage.nativeName}.
                </small>

              )}


              {showCategoryForm && (

                <div className="admin-quick-create">

                  <h4>
                    Add New Category
                  </h4>


                  <input
                    type="text"
                    placeholder="Category name"
                    value={newCategory.name}
                    onChange={(
                      event
                    ) =>

                      setNewCategory({

                        name:
                          event.target.value,

                      })

                    }
                  />


                  <div className="admin-quick-actions">

                    <button
                      type="button"
                      disabled={quickSaving}
                      onClick={() =>
                        setShowCategoryForm(false)
                      }
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

                      {quickSaving
                        ? "Adding..."
                        : "Add Category"}

                    </button>

                  </div>

                </div>

              )}

            </div>


            {/* =================================================
                MINISTRY
            ================================================= */}

            <div className="admin-field">

              <div className="admin-field-label-row">

                <label htmlFor="ministry_id">
                  Ministry
                </label>

              </div>


              <select
                id="ministry_id"
                name="ministry_id"
                value={form.ministry_id}
                onChange={handleChange}
                disabled={ministriesLoading}
              >

                <option value="">

                  {ministriesLoading
                    ? "Loading ministries..."
                    : "No Ministry / General"}

                </option>


                {filteredMinistries.map(
                  (ministry) => (

                    <option
                      key={ministry.id}
                      value={ministry.id}
                    >

                      {ministry.name}

                    </option>

                  )
                )}

              </select>


              <small>

                Only ministries matching the
                selected song language are shown.

              </small>


              {!ministriesLoading &&
                filteredMinistries.length === 0 && (

                  <small
                    style={{
                      display: "block",
                      marginTop: "6px",
                    }}
                  >

                    No ministries available for{" "}
                    {selectedLanguage.nativeName}.
                    You can add ministries from
                    Admin → Ministries.

                  </small>

                )}

            </div>


            {/* =================================================
                MOODS
            ================================================= */}

            <div className="admin-field admin-mood-field">

              <div className="admin-field-label-row">

                <label>
                  Music Mood
                </label>

              </div>


              <small>
                Select one or more moods for
                this Christian song.
              </small>


              <div className="admin-mood-grid">

                <label className="admin-mood-option">

                  <input
                    type="checkbox"
                    value="worship"
                    checked={
                      form.moods.includes(
                        "worship"
                      )
                    }
                    onChange={
                      handleMoodChange
                    }
                  />

                  <span>
                    Worship
                  </span>

                </label>


                <label className="admin-mood-option">

                  <input
                    type="checkbox"
                    value="praise"
                    checked={
                      form.moods.includes(
                        "praise"
                      )
                    }
                    onChange={
                      handleMoodChange
                    }
                  />

                  <span>
                    Praise
                  </span>

                </label>


                <label className="admin-mood-option">

                  <input
                    type="checkbox"
                    value="prayer"
                    checked={
                      form.moods.includes(
                        "prayer"
                      )
                    }
                    onChange={
                      handleMoodChange
                    }
                  />

                  <span>
                    Prayer
                  </span>

                </label>


                <label className="admin-mood-option">

                  <input
                    type="checkbox"
                    value="hope"
                    checked={
                      form.moods.includes(
                        "hope"
                      )
                    }
                    onChange={
                      handleMoodChange
                    }
                  />

                  <span>
                    Hope & Faith
                  </span>

                </label>


                <label className="admin-mood-option">

                  <input
                    type="checkbox"
                    value="peace"
                    checked={
                      form.moods.includes(
                        "peace"
                      )
                    }
                    onChange={
                      handleMoodChange
                    }
                  />

                  <span>
                    Peace & Comfort
                  </span>

                </label>


                <label className="admin-mood-option">

                  <input
                    type="checkbox"
                    value="thanksgiving"
                    checked={
                      form.moods.includes(
                        "thanksgiving"
                      )
                    }
                    onChange={
                      handleMoodChange
                    }
                  />

                  <span>
                    Thanksgiving
                  </span>

                </label>

              </div>

            </div>

          </div>

        </div>


        {/* =================================================
            MEDIA
        ================================================= */}

        <div className="admin-form-section">

          <div className="admin-form-section-title">

            <h2>
              Media
            </h2>

            <p>
              Upload the song audio
              and cover artwork.
            </p>

          </div>


          <div className="admin-upload-grid">


            {/* AUDIO */}

            <div className="admin-upload-box">

              <div className="admin-upload-icon">

                <FaMusic />

              </div>


              <h3>
                Audio File *
              </h3>


              <p>
                MP3 or M4A
              </p>


              {!audioFile ? (

                <>

                  <input
                    id="song-audio-input"
                    className="admin-file-input"
                    type="file"
                    accept=".mp3,.m4a,audio/mpeg,audio/mp4"
                    onChange={
                      handleAudioChange
                    }
                  />


                  <label
                    htmlFor="song-audio-input"
                    className="admin-upload-button"
                  >

                    <FaCloudUploadAlt />

                    Choose Audio

                  </label>

                </>

              ) : (

                <div className="admin-selected-file">

                  <div>

                    <strong>
                      {audioFile.name}
                    </strong>

                    <span>
                      {
                        formatFileSize(
                          audioFile.size
                        )
                      }
                    </span>

                  </div>


                  <button
                    type="button"
                    onClick={
                      removeAudio
                    }
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


              <h3>
                Cover Image
              </h3>


              <p>
                JPG, PNG or WebP
              </p>


              {!coverFile ? (

                <>

                  <input
                    id="song-cover-input"
                    className="admin-file-input"
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                    onChange={
                      handleCoverChange
                    }
                  />


                  <label
                    htmlFor="song-cover-input"
                    className="admin-upload-button"
                  >

                    <FaCloudUploadAlt />

                    Choose Cover

                  </label>

                </>

              ) : (

                <div className="admin-selected-file">

                  <div>

                    <strong>
                      {coverFile.name}
                    </strong>

                    <span>
                      {
                        formatFileSize(
                          coverFile.size
                        )
                      }
                    </span>

                  </div>


                  <button
                    type="button"
                    onClick={
                      removeCover
                    }
                    aria-label="Remove cover"
                  >

                    <FaTimes />

                  </button>

                </div>

              )}

            </div>

          </div>

        </div>


        {/* =================================================
            LYRICS
        ================================================= */}

        <div className="admin-form-section">

          <div className="admin-form-section-title">

            <h2>
              Lyrics — {selectedLanguage.nativeName}
            </h2>

            <p>
              Enter the lyrics in the selected
              song language.
            </p>

          </div>


          <div className="admin-field">

            <textarea
              name="lyrics"
              value={form.lyrics}
              onChange={handleChange}
              rows="16"
              placeholder={
                selectedLanguage.lyricsPlaceholder
              }
            />

          </div>

        </div>


        {/* =================================================
            FEATURED
        ================================================= */}

        <label className="admin-checkbox">

          <input
            type="checkbox"
            name="featured"
            checked={form.featured}
            onChange={handleChange}
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


        {/* =================================================
            ACTIONS
        ================================================= */}

        <div className="admin-form-actions">

          <button
            type="button"
            className="admin-cancel-button"
            disabled={
              saving ||
              quickSaving
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
              saving ||
              quickSaving
            }
          >

            <FaSave />


            {saving
              ? "Uploading..."
              : "Save Song"}

          </button>

        </div>


      </form>

    </div>

  );

}


export default AddSong;