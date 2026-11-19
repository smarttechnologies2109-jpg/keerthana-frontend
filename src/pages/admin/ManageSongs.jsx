

import {

  useEffect,

  useMemo,

  useState,

} from "react";



import {

  FaEdit,

  FaMusic,

  FaPlus,

  FaSearch,

  FaTrash,

  FaTimes,

  FaFilter,

} from "react-icons/fa";



import { useNavigate } from "react-router-dom";



import API from "../../services/api";

import { getMediaUrl } from "../../utils/media";



import "../../assets/css/admin/manageSongs.css";



function ManageSongs() {

  const navigate = useNavigate();



  /* =====================================================

     STATE

  ===================================================== */



  const [songs, setSongs] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");



  const [search, setSearch] = useState("");



  const [selectedLanguage, setSelectedLanguage] =

    useState("All");



  const [selectedAdvancedFilter, setSelectedAdvancedFilter] =

    useState("All");



  const [deletingId, setDeletingId] = useState(null);



  const ALL = "All";



  /* =====================================================

     LANGUAGE OPTIONS

     ALL LABELS IN ENGLISH

  ===================================================== */



  const languageOptions = [

    { value: "Telugu", label: "Telugu" },

    { value: "Hindi", label: "Hindi" },

    { value: "English", label: "English" },

    { value: "Malayalam", label: "Malayalam" },

    { value: "Kannada", label: "Kannada" },

    { value: "Tamil", label: "Tamil" },

  ];



  /* =====================================================

     NORMALIZE TEXT

  ===================================================== */



  const normalizeText = (value) =>

    String(value ?? "")

      .trim()

      .toLowerCase()

      .replace(/\s+/g, " ");



  /* =====================================================

     GET ENGLISH DISPLAY NAMES

  ===================================================== */



  // Read English names from the song response first, then from the

  // related master records loaded below (artists/albums/ministries/categories).

  const hasTelugu = (value) => /[\u0C00-\u0C7F]/.test(String(value ?? ""));



  const pickEnglish = (...values) => {

    const value = values.find(

      (item) =>

        typeof item === "string" &&

        item.trim() &&

        !hasTelugu(item)

    );

    return value ? value.trim() : "";

  };



  const getRelationName = (song, type) => {
    const relationCandidates = [
      song?.[type],
      song?.[`${type}_details`],
      song?.[`${type}Details`],
      song?.[`${type}_data`],
    ];
    const relation = relationCandidates.find(
      (item) => item && typeof item === "object"
    ) || {};

    const prefixes = {
      artist: [
        "artist_name_english", "artist_english_name", "artist_name_en",
        "artistEnglishName", "artistNameEnglish",
      ],
      album: [
        "album_name_english", "album_english_name", "album_name_en",
        "albumEnglishName", "albumNameEnglish",
      ],
      ministry: [
        "ministry_name_english", "ministry_english_name", "ministry_name_en",
        "ministryEnglishName", "ministryNameEnglish",
        "ministry_name", "ministryName", "ministry", "ministry_title",
      ],
      category: [
        "category_name_english", "category_english_name", "category_name_en",
        "categoryEnglishName", "categoryNameEnglish",
      ],
    };

    const nameFields = prefixes[type] || [];
    return pickEnglish(
      ...nameFields.map((field) => song?.[field]),
      relation?.name_english,
      relation?.english_name,
      relation?.nameEnglish,
      relation?.title_english,
      relation?.name_en,
      relation?.englishName,
      relation?.artist_name_english,
      relation?.album_name_english,
      relation?.ministry_name_english,
      relation?.category_name_english,
      relation?.name,
      relation?.title
    );
  };

  const getArtist = (song) =>

    pickEnglish(song?.artist_name_english, song?.artist_english_name) ||

    getRelationName(song, "artist");



  const getAlbum = (song) =>

    pickEnglish(song?.album_name_english, song?.album_english_name) ||

    getRelationName(song, "album");



  const getMinistry = (song) => {
    const directName = pickEnglish(
      song?.ministry_name_english,
      song?.ministry_english_name,
      song?.ministryNameEnglish,
      song?.ministry_name,
      song?.ministryName,
      song?.ministry_title,
      song?.ministryTitle
    );

    if (directName) return directName;

    const relationName = getRelationName(song, "ministry");
    if (relationName && !/^\d+$/.test(String(relationName).trim())) {
      return relationName;
    }

    // Some API responses return ministry as a plain name instead of an object.
    // Do not display a numeric ministry ID as though it were a ministry name.
    const plainMinistry = song?.ministry;
    if (
      typeof plainMinistry === "string" &&
      plainMinistry.trim() &&
      !/^\d+$/.test(plainMinistry.trim())
    ) {
      return plainMinistry.trim();
    }

    return "";
  };



  const getCategory = (song) =>

    pickEnglish(song?.category_name_english, song?.category_english_name) ||

    getRelationName(song, "category");



  /* =====================================================

     EMPTY VALUE CHECK

  ===================================================== */



  const isEmptyValue = (value) =>

    value === null ||

    value === undefined ||

    String(value).trim() === "";



  /* =====================================================

     LANGUAGE NORMALIZATION

  ===================================================== */



  const normalizeLanguage = (value) => {

    const language = String(value || "")

      .trim()

      .toLowerCase();



    const match = languageOptions.find(

      (item) =>

        item.value.toLowerCase() === language

    );



    return match ? match.value : "";

  };



  /* =====================================================

     LANGUAGE LABEL

  ===================================================== */



  const getLanguageLabel = (value) => {

    return normalizeLanguage(value) || "Unknown";

  };



  /* =====================================================

     LOAD SONGS

  ===================================================== */



  const extractRows = (payload, keys = []) => {
    if (Array.isArray(payload)) return payload;

    const containers = [
      payload,
      payload?.data,
      payload?.result,
      payload?.results,
      payload?.ministries,
      payload?.data?.data,
    ].filter(Boolean);

    for (const container of containers) {
      if (Array.isArray(container)) return container;
      for (const key of keys) {
        if (Array.isArray(container?.[key])) return container[key];
      }
    }

    return [];
  };



  const getMasterId = (record, type = "") => {
    const typeIdFields = {
      artist: ["artist_id", "artistId", "artistID"],
      album: ["album_id", "albumId", "albumID"],
      ministry: ["ministry_id", "ministryId", "ministryID"],
      category: ["category_id", "categoryId", "categoryID"],
    };

    const candidates = [
      record?.id,
      ...(typeIdFields[type] || []).map((field) => record?.[field]),
    ];
    return candidates.find(
      (value) => value !== null && value !== undefined && String(value).trim() !== ""
    ) ?? null;
  };

  const getMasterEnglishName = (record, type = "") => {
    const typeNameFields = {
      artist: ["artist_name_english", "artist_english_name", "artistNameEnglish", "artistEnglishName"],
      album: ["album_name_english", "album_english_name", "albumNameEnglish", "albumEnglishName"],
      ministry: [
        "ministry_name_english",
        "ministry_english_name",
        "ministryNameEnglish",
        "ministryEnglishName",
        "ministry_name_en",
        "ministryNameEn",
        "english_ministry_name",
        "ministry_name",
        "ministryName",
        "ministry",
        "ministry_title",
        "ministryTitle",
        "name",
        "name_en",
        "nameEn",
      ],
      category: ["category_name_english", "category_english_name", "categoryNameEnglish", "categoryEnglishName"],
    };

    return pickEnglish(
      ...(typeNameFields[type] || []).map((field) => record?.[field]),
      record?.name_english,
      record?.english_name,
      record?.nameEnglish,
      record?.title_english,
      record?.name_en,
      record?.nameEn,
      record?.englishName,
      record?.name,
      record?.title
    );
  };



  const loadSongs = async () => {

    try {

      setLoading(true);

      setError("");



      // Load songs and their master data. The /songs endpoint may return

      // relationship IDs without the joined English display names.

      const [
        songsResult,
        artistsResult,
        albumsResult,
        ministriesResult,
        adminMinistriesResult,
        categoriesResult,
      ] = await Promise.allSettled([
        API.get("/songs"),
        API.get("/artists"),
        API.get("/albums"),
        API.get("/ministries"),
        // Always request the admin master list too. The public endpoint can
        // return a partial/filtered list and may omit ministries such as Hosanna.
        API.get("/admin/ministries"),
        API.get("/categories"),
      ]);



      if (songsResult.status !== "fulfilled") {

        throw songsResult.reason;

      }



      const songRows = extractRows(songsResult.value?.data, ["songs"]);

      const artistRows = artistsResult.status === "fulfilled"

        ? extractRows(artistsResult.value?.data, ["artists"])

        : [];

      const albumRows = albumsResult.status === "fulfilled"

        ? extractRows(albumsResult.value?.data, ["albums"])

        : [];

      const publicMinistryRows = ministriesResult.status === "fulfilled"
        ? extractRows(ministriesResult.value?.data, ["ministries"])
        : [];

      const adminMinistryRows = adminMinistriesResult.status === "fulfilled"
        ? extractRows(adminMinistriesResult.value?.data, ["ministries"])
        : [];

      // Merge both endpoints so a partial public list cannot hide a ministry.
      const ministryRowsById = new Map();
      [...publicMinistryRows, ...adminMinistryRows].forEach((record, index) => {
        const id = getMasterId(record, "ministry");
        const key = id !== null ? String(id).trim() : `no-id-${index}`;
        ministryRowsById.set(key, record);
      });
      const ministryRows = [...ministryRowsById.values()];

      if (adminMinistriesResult.status === "rejected") {
        console.warn(
          "Unable to load ministry master records from /admin/ministries:",
          adminMinistriesResult.reason
        );
      }

      const categoryRows = categoriesResult.status === "fulfilled"

        ? extractRows(categoriesResult.value?.data, ["categories"])

        : [];



      const makeLookup = (rows, type) => {
        const lookup = {};
        rows.forEach((record) => {
          const id = getMasterId(record, type);
          const name = getMasterEnglishName(record, type);
          if (id !== null && id !== undefined && name) {
            lookup[String(id).trim()] = name;
          }
        });
        return lookup;
      };

      const lookups = {
        artist: makeLookup(artistRows, "artist"),
        album: makeLookup(albumRows, "album"),
        ministry: makeLookup(ministryRows, "ministry"),
        category: makeLookup(categoryRows, "category"),
      };

      // Name lookup is a fallback for APIs that return a ministry name rather
      // than its foreign-key ID. Keep comparisons case/space insensitive.
      const ministryNameLookup = {};
      ministryRows.forEach((record) => {
        const name = getMasterEnglishName(record, "ministry");
        if (name) ministryNameLookup[normalizeText(name)] = name;
      });

      console.log("MINISTRY MASTER ROWS:", ministryRows);
      console.log("MINISTRY ID LOOKUP:", lookups.ministry);
      console.log("MINISTRY NAME LOOKUP:", ministryNameLookup);



      const enrichedSongs = songRows.map((song) => {

        const artistId = song?.artist_id ?? song?.artistId;

        const albumId = song?.album_id ?? song?.albumId;

        const ministryId = getRelationId(song, "ministry");
        const ministryNameFromSong = getMinistry(song);
        const ministryNameFromId = ministryId != null
          ? lookups.ministry[String(ministryId).trim()]
          : "";
        const ministryNameFromText = ministryNameFromSong
          ? ministryNameLookup[normalizeText(ministryNameFromSong)] || ministryNameFromSong
          : "";

        const categoryId = song?.category_id ?? song?.categoryId;



        return {

          ...song,

          artist_name_english: getArtist(song) ||

            (artistId != null ? lookups.artist[String(artistId)] : "") || "",

          album_name_english: getAlbum(song) ||

            (albumId != null ? lookups.album[String(albumId)] : "") || "",

          ministry_name_english:
            ministryNameFromSong || ministryNameFromId || ministryNameFromText || "",

          category_name_english: getCategory(song) ||

            (categoryId != null ? lookups.category[String(categoryId)] : "") || "",

        };

      });



      console.log("MANAGE SONGS ENRICHED RESPONSE:", enrichedSongs);

      setSongs(enrichedSongs);

    } catch (error) {

      console.error("LOAD SONGS ERROR:", error);

      setError(

        error.response?.data?.message ||

        "Unable to load songs. Please try again."

      );

    } finally {

      setLoading(false);

    }

  };



  useEffect(() => {

    loadSongs();

  }, []);



  /* =====================================================

     LANGUAGE COUNTS

  ===================================================== */



  const languageCounts = useMemo(() => {

    const counts = Object.fromEntries(

      languageOptions.map((item) => [

        item.value,

        0,

      ])

    );



    songs.forEach((song) => {

      const language = normalizeLanguage(song.language);



      if (language) {

        counts[language] += 1;

      }

    });



    return counts;

  }, [songs]);



  /* =====================================================

     ADVANCED FILTER OPTIONS



     ONLY EMPTY + UNKNOWN



     NO INDIVIDUAL NAMES

  ===================================================== */



  const advancedFilterGroups = [

    {

      label: "ARTIST",

      options: [

        {

          value: "artist|empty",

          label: "Empty Artist",

        },

        {

          value: "artist|unknown",

          label: "Unknown Artist",

        },

      ],

    },

    {

      label: "ALBUM",

      options: [

        {

          value: "album|empty",

          label: "Empty Album",

        },

        {

          value: "album|unknown",

          label: "Unknown Album",

        },

      ],

    },

    {

      label: "MINISTRY",

      options: [

        {

          value: "ministry|empty",

          label: "Empty Ministry",

        },

        {

          value: "ministry|unknown",

          label: "Unknown Ministry",

        },

      ],

    },

    {

      label: "CATEGORY",

      options: [

        {

          value: "category|empty",

          label: "Empty Category",

        },

        {

          value: "category|unknown",

          label: "Unknown Category",

        },

      ],

    },

  ];



  /* =====================================================

     ADVANCED FILTER MATCHING



     BACKEND FLAGS ARE USED.



     This avoids confusing text values,

     IDs and missing relationships.

  ===================================================== */



  const getRelationId = (song, field) => {
    const relationCandidates = [
      song?.[field],
      song?.[`${field}_details`],
      song?.[`${field}Details`],
      song?.[`${field}_data`],
    ];
    const relation = relationCandidates.find(
      (item) => item && typeof item === "object"
    ) || {};

    const idFields = {
      artist: ["artist_id", "artistId", "artistID"],
      album: ["album_id", "albumId", "albumID"],
      ministry: ["ministry_id", "ministryId", "ministryID"],
      category: ["category_id", "categoryId", "categoryID"],
    };

    const directRelation = song?.[field];
    const candidates = [
      song?.[`${field}_id`],
      song?.[`${field}Id`],
      song?.[`${field}ID`],
      relation?.id,
      ...(idFields[field] || []).map((key) => relation?.[key]),
      ...(typeof directRelation === "string" || typeof directRelation === "number"
        ? [directRelation]
        : []),
    ];

    return candidates.find(
      (value) => value !== null && value !== undefined && String(value).trim() !== ""
    ) ?? null;
  };

  const isUnknownLabel = (value, field) => {
    const normalized = normalizeText(value);
    return (
      normalized === "unknown" ||
      normalized === `unknown ${field}` ||
      normalized === "not available" ||
      normalized === "n/a"
    );
  };

  const matchesAdvancedFilter = (song, filter) => {
    if (filter === ALL) return true;

    const [field, type] = filter.split("|");
    const getters = {
      artist: getArtist,
      album: getAlbum,
      ministry: getMinistry,
      category: getCategory,
    };
    const value = getters[field]?.(song) || "";
    const id = getRelationId(song, field);
    const missingId = id === null || id === undefined || String(id).trim() === "";
    const missingName = isEmptyValue(value);
    const unknownName = isUnknownLabel(value, field);

    if (type === "empty") {
      return missingId && missingName;
    }

    if (type === "unknown") {
      return unknownName || (!missingId && missingName);
    }

    return true;
  };

  const filteredSongs = useMemo(() => {

    const query = normalizeText(search);



    const result = songs.filter((song) => {



      // LANGUAGE FILTER

      if (

        selectedLanguage !== ALL &&

        normalizeLanguage(song.language) !== selectedLanguage

      ) {

        return false;

      }



      // ADVANCED FILTER

      if (

        !matchesAdvancedFilter(

          song,

          selectedAdvancedFilter

        )

      ) {

        return false;

      }



      // SEARCH

      if (!query) {

        return true;

      }



      const searchableValues = [

        song.title_english,

        getArtist(song),

        getAlbum(song),

        getMinistry(song),

        getCategory(song),

        song.language,

      ];



      return searchableValues.some((value) =>

        normalizeText(value).includes(query)

      );

    });



    // ENGLISH ALPHABETICAL ORDER

    return [...result].sort((a, b) => {

      const titleA = String(a.title_english || "");

      const titleB = String(b.title_english || "");



      return titleA.localeCompare(

        titleB,

        "en",

        {

          sensitivity: "base",

          numeric: true,

        }

      );

    });



  }, [

    songs,

    search,

    selectedLanguage,

    selectedAdvancedFilter,

  ]);



  /* =====================================================

     CLEAR FILTERS

  ===================================================== */



  const clearFilters = () => {

    setSearch("");

    setSelectedLanguage(ALL);

    setSelectedAdvancedFilter(ALL);

  };



  const hasActiveFilters =

    search.trim() !== "" ||

    selectedLanguage !== ALL ||

    selectedAdvancedFilter !== ALL;



  /* =====================================================

     DELETE SONG

  ===================================================== */



  const handleDelete = async (song) => {

    const confirmed = window.confirm(

      `Are you sure you want to delete "${song.title_english || "this song"}"?`

    );



    if (!confirmed) return;



    try {

      setDeletingId(song.id);

      setError("");

      setSuccess("");



      await API.delete(`/admin/songs/${song.id}`);



      setSongs((previous) =>

        previous.filter(

          (item) => item.id !== song.id

        )

      );



      setSuccess(

        `"${song.title_english || "Song"}" deleted successfully.`

      );



    } catch (error) {

      console.error("DELETE SONG ERROR:", error);



      setError(

        error.response?.data?.message ||

        "Unable to delete song. Please try again."

      );



    } finally {

      setDeletingId(null);

    }

  };



  /* =====================================================

     COVER URL

  ===================================================== */



  const getCover = (song) => {

    if (!song.cover_url) {

      return null;

    }



    if (

      song.cover_url.startsWith("http://") ||

      song.cover_url.startsWith("https://")

    ) {

      return song.cover_url;

    }



    return getMediaUrl(song.cover_url);

  };



  /* =====================================================

     DISPLAY VALUE

  ===================================================== */



  const displayValue = (value, fallback) => {

    return isEmptyValue(value) ? fallback : value;

  };



  /* =====================================================

     LOADING

  ===================================================== */



  if (loading) {

    return (

      <div className="admin-page">

        <div className="admin-loading">

          Loading Songs...

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

          <span>KEERTHANA ADMIN</span>



          <h1>Manage Songs</h1>



          <p>

            Add, edit and manage songs in KEERTHANA.

          </p>

        </div>



        <button

          type="button"

          className="admin-primary-button"

          onClick={() =>

            navigate("/admin/songs/add")

          }

        >

          <FaPlus />

          Add Song

        </button>

      </div>



      {/* ERROR */}



      {error && (

        <div className="admin-error" role="alert">

          {error}

        </div>

      )}



      {/* SUCCESS */}



      {success && (

        <div className="admin-success" role="status">

          {success}

        </div>

      )}



      {/* LANGUAGE SUMMARY */}



      <section

        className="admin-song-language-section"

        aria-label="Song language summary"

      >



        <button

          type="button"

          className={`admin-song-language-card admin-song-total-card ${

            selectedLanguage === ALL ? "active" : ""

          }`}

          onClick={() => setSelectedLanguage(ALL)}

        >

          <span className="admin-song-language-card-top">

            <span className="admin-song-language-card-label">

              TOTAL SONGS

            </span>

            <FaMusic />

          </span>



          <strong>{songs.length}</strong>



          <span className="admin-song-language-card-caption">

            All Languages

          </span>

        </button>



        {languageOptions.map((language) => (

          <button

            type="button"

            key={language.value}

            className={`admin-song-language-card ${

              selectedLanguage === language.value

                ? "active"

                : ""

            }`}

            onClick={() =>

              setSelectedLanguage((current) =>

                current === language.value

                  ? ALL

                  : language.value

              )

            }

          >

            <span className="admin-song-language-card-top">

              <span className="admin-song-language-card-label">

                {language.label}

              </span>

            </span>



            <strong>

              {languageCounts[language.value] || 0}

            </strong>



            <span className="admin-song-language-card-caption">

              Songs

            </span>

          </button>

        ))}



      </section>



      {/* SEARCH + TWO FILTERS */}



      <div className="admin-song-toolbar">



        {/* SEARCH */}



        <div className="admin-song-search">

          <FaSearch />



          <input

            type="text"

            value={search}

            onChange={(event) =>

              setSearch(event.target.value)

            }

            placeholder="Search songs, artists, albums..."

            aria-label="Search songs"

          />

        </div>



        {/* FILTER 1: LANGUAGE */}



        <div className="admin-song-language-filter">



          <label htmlFor="admin-song-language-select">

            Language

          </label>



          <select

            id="admin-song-language-select"

            value={selectedLanguage}

            onChange={(event) =>

              setSelectedLanguage(event.target.value)

            }

          >

            <option value={ALL}>

              All Languages

            </option>



            {languageOptions.map((language) => (

              <option

                key={language.value}

                value={language.value}

              >

                {language.label}

              </option>

            ))}

          </select>



        </div>



        {/* FILTER 2: ADVANCED */}



        <div className="admin-song-language-filter admin-song-advanced-filter">



          <label htmlFor="admin-song-advanced-select">

            <FaFilter />

            Advanced Filter

          </label>



          <select

            id="admin-song-advanced-select"

            value={selectedAdvancedFilter}

            onChange={(event) =>

              setSelectedAdvancedFilter(event.target.value)

            }

          >

            <option value={ALL}>

              All Filters

            </option>



            {advancedFilterGroups.map((group) => (

              <optgroup

                key={group.label}

                label={group.label}

              >

                {group.options.map((option) => (

                  <option

                    key={option.value}

                    value={option.value}

                  >

                    {option.label}

                  </option>

                ))}

              </optgroup>

            ))}



          </select>



        </div>



        {/* CLEAR */}



        {hasActiveFilters && (

          <button

            type="button"

            className="admin-primary-button admin-song-clear-filters"

            onClick={clearFilters}

          >

            <FaTimes />

            Clear Filters

          </button>

        )}



        {/* COUNT */}



        <div className="admin-song-count">

          <FaMusic />



          <span>

            {filteredSongs.length} of {songs.length} Songs

          </span>

        </div>



      </div>



      {/* FILTER STATUS */}



      {hasActiveFilters && (

        <div className="admin-song-filter-summary">

          <FaFilter />



          <span>

            Showing {filteredSongs.length} matching songs

          </span>

        </div>

      )}



      {/* EMPTY STATE */}



      {filteredSongs.length === 0 ? (



        <div className="admin-empty-state">



          <FaMusic />



          <h2>

            {hasActiveFilters

              ? "No Songs Found"

              : "No Songs Yet"}

          </h2>



          <p>

            {hasActiveFilters

              ? "No songs match your selected filters. Try another option or clear filters."

              : "Add your first song to KEERTHANA."}

          </p>



          {hasActiveFilters ? (

            <button

              type="button"

              className="admin-primary-button"

              onClick={clearFilters}

            >

              <FaTimes />

              Clear Filters

            </button>

          ) : (

            <button

              type="button"

              className="admin-primary-button"

              onClick={() =>

                navigate("/admin/songs/add")

              }

            >

              <FaPlus />

              Add Song

            </button>

          )}



        </div>



      ) : (



        /* SONGS TABLE */



        <div className="admin-table-wrapper">



          <table className="admin-song-table">



            <thead>

              <tr>

                <th className="admin-song-number-heading">

                  No.

                </th>



                <th>Song</th>

                <th>Artist</th>

                <th>Album</th>

                <th>Ministry</th>

                <th>Category</th>

                <th>Language</th>

                <th>Actions</th>

              </tr>

            </thead>



            <tbody>



              {filteredSongs.map((song, index) => {



                const cover = getCover(song);



                return (

                  <tr key={song.id}>



                    {/* NUMBER */}



                    <td className="admin-song-number">

                      {String(index + 1).padStart(2, "0")}

                    </td>



                    {/* SONG */}



                    <td>

                      <div className="admin-song-cell">



                        <div className="admin-song-cover">



                          {cover ? (

                            <img

                              src={cover}

                              alt={song.title_english || "Song cover"}

                              onError={(event) => {

                                event.currentTarget.style.display =

                                  "none";

                              }}

                            />

                          ) : (

                            <FaMusic />

                          )}



                        </div>



                        <div className="admin-song-info">



                          <strong>

                            {displayValue(

                              song.title_english,

                              "Untitled Song"

                            )}

                          </strong>



                        </div>



                      </div>

                    </td>



                    {/* ARTIST */}



                    <td>

                      {displayValue(

                        getArtist(song),

                        "Unknown Artist"

                      )}

                    </td>



                    {/* ALBUM */}



                    <td>

                      {displayValue(

                        getAlbum(song),

                        "Unknown Album"

                      )}

                    </td>



                    {/* MINISTRY */}



                    <td>

                      {displayValue(

                        getMinistry(song),

                        "Unknown Ministry"

                      )}

                    </td>



                    {/* CATEGORY */}



                    <td>

                      {displayValue(

                        getCategory(song),

                        "Unknown Category"

                      )}

                    </td>



                    {/* LANGUAGE */}



                    <td>

                      <span className="admin-song-language-badge">

                        {getLanguageLabel(song.language)}

                      </span>

                    </td>



                    {/* ACTIONS */}



                    <td>

                      <div className="admin-table-actions">



                        <button

                          type="button"

                          className="admin-action-button edit"

                          title="Edit Song"

                          onClick={() =>

                            navigate(

                              `/admin/songs/${song.id}/edit`

                            )

                          }

                        >

                          <FaEdit />

                        </button>



                        <button

                          type="button"

                          className="admin-action-button delete"

                          title="Delete Song"

                          disabled={deletingId === song.id}

                          onClick={() =>

                            handleDelete(song)

                          }

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



    </div>

  );

}



export default ManageSongs;
