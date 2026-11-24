import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  FaArrowLeft,
  FaMusic,
  FaSearch,
  FaFilter,
  FaTimes,
} from "react-icons/fa";

import API from "../../services/api";

import "../../assets/css/businessowner/BusinessOwnerSongs.css";



/* =========================================================
   LANGUAGES
========================================================= */

const LANGUAGES = [
  "Telugu",
  "Hindi",
  "English",
  "Malayalam",
  "Kannada",
  "Tamil",
];

const normalizeLanguage = (value) => {
  const normalized = String(value ?? "").trim().toLowerCase().replace(/\s+/g, "");
  const aliases = {
    telugu: "Telugu", te: "Telugu", "te-in": "Telugu",
    hindi: "Hindi", hi: "Hindi", "hi-in": "Hindi",
    english: "English", en: "English", "en-in": "English",
    malayalam: "Malayalam", ml: "Malayalam", "ml-in": "Malayalam",
    kannada: "Kannada", kn: "Kannada", "kn-in": "Kannada",
    tamil: "Tamil", ta: "Tamil", "ta-in": "Tamil",
  };
  return aliases[normalized] || String(value ?? "").trim();
};

// Never render Telugu-script text in the Business Owner song table.
const containsTelugu = (value) => /[\u0C00-\u0C7F]/.test(String(value ?? ""));

const firstEnglish = (...values) => {
  const value = values.find(
    (item) =>
      typeof item === "string" &&
      item.trim() &&
      !containsTelugu(item)
  );
  return value ? value.trim() : "";
};

const getEnglishSongTitle = (song) =>
  firstEnglish(song?.title_english, song?.english_title, song?.titleEnglish) ||
  "English title not available";

const getEnglishArtist = (song, artistsById = {}) => {
  const artistObject =
    song?.artist && typeof song.artist === "object" ? song.artist : {};
  const artistDetails =
    song?.artist_details && typeof song.artist_details === "object"
      ? song.artist_details
      : song?.artistDetails && typeof song.artistDetails === "object"
        ? song.artistDetails
        : {};
  const artistId =
    song?.artist_id ??
    song?.artistId ??
    artistObject?.id ??
    artistObject?.artist_id ??
    artistDetails?.id ??
    artistDetails?.artist_id;
  const linkedArtist = artistsById[String(artistId ?? "")] || {};

  return (
    firstEnglish(
      song?.artist_name_english,
      song?.artist_english,
      song?.artist_english_name,
      song?.artist_name_en,
      linkedArtist?.name_english,
      linkedArtist?.english_name,
      linkedArtist?.nameEnglish,
      linkedArtist?.englishName,
      artistObject?.name_english,
      artistObject?.english_name,
      artistObject?.nameEnglish,
      artistDetails?.name_english,
      artistDetails?.english_name,
      song?.artist_name,
      song?.artistName,
      typeof song?.artist === "string" ? song.artist : ""
    ) || "English artist name not available"
  );
};

const getRelatedId = (song, field) => {
  const object = song?.[field] && typeof song[field] === "object" ? song[field] : {};
  const camel = field === "ministry" ? "ministryId" : `${field}Id`;
  return song?.[`${field}_id`] ?? song?.[camel] ?? object?.id ?? object?.[`${field}_id`];
};

const getEnglishAlbum = (song, albumsById = {}) => {
  const album = song?.album && typeof song.album === "object" ? song.album : {};
  const linked = albumsById[String(getRelatedId(song, "album") ?? "")] || {};
  return firstEnglish(
    song?.album_title_english, song?.album_name_english, song?.album_english,
    album?.title_english, album?.name_english, album?.english_name,
    linked?.title_english, linked?.name_english, linked?.english_name,
    song?.album_title, typeof song?.album === "string" ? song.album : ""
  ) || "English album name not available";
};

const getEnglishCategory = (song, categoriesById = {}) => {
  const category = song?.category && typeof song.category === "object" ? song.category : {};
  const linked = categoriesById[String(getRelatedId(song, "category") ?? "")] || {};
  return firstEnglish(
    song?.category_name_english, song?.category_english,
    category?.name_english, category?.english_name,
    linked?.name_english, linked?.english_name, linked?.nameEnglish,
    song?.category_name, typeof song?.category === "string" ? song.category : ""
  ) || "English category name not available";
};

const getEnglishMinistry = (song, ministriesById = {}) => {
  const ministry = song?.ministry && typeof song.ministry === "object" ? song.ministry : {};
  const linked = ministriesById[String(getRelatedId(song, "ministry") ?? "")] || {};
  return firstEnglish(
    song?.ministry_name_english, song?.ministry_english,
    ministry?.name_english, ministry?.english_name,
    linked?.name_english, linked?.english_name, linked?.ministry_name_english,
    song?.ministry_name, typeof song?.ministry === "string" ? song.ministry : ""
  ) || "English ministry name not available";
};

const extractRows = (payload, keys) => {
  if (Array.isArray(payload)) return payload;
  for (const key of keys) {
    if (Array.isArray(payload?.[key])) return payload[key];
    if (Array.isArray(payload?.data?.[key])) return payload.data[key];
  }
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const buildEnglishLookup = (rows, nameFields) => {
  const lookup = {};
  rows.forEach((row) => {
    const id = row?.id ?? row?.artist_id ?? row?.album_id ?? row?.category_id ?? row?.ministry_id;
    const englishName = firstEnglish(...nameFields.map((field) => row?.[field]));
    if (id != null && englishName) lookup[String(id)] = { ...row, name_english: englishName };
  });
  return lookup;
};

/* =========================================================
   BUSINESS OWNER SONGS
========================================================= */

const BusinessOwnerSongs = () => {

  const navigate = useNavigate();

  const location = useLocation();


  /* =======================================================
     STATE
  ======================================================= */

  const [songs, setSongs] = useState([]);

  const [artistsById, setArtistsById] = useState({});
  const [albumsById, setAlbumsById] = useState({});
  const [categoriesById, setCategoriesById] = useState({});
  const [ministriesById, setMinistriesById] = useState({});

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  const [language, setLanguage] = useState("");
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);


  /* =======================================================
     READ LANGUAGE FROM URL
  ======================================================= */

  useEffect(() => {

    const params =
      new URLSearchParams(
        location.search
      );

    const urlLanguage = params.get("language");
    const normalizedLanguage = normalizeLanguage(urlLanguage);

    setLanguage(
      LANGUAGES.includes(normalizedLanguage)
        ? normalizedLanguage
        : ""
    );

  }, [
    location.search,
  ]);


  /* =======================================================
     LOAD COMPLETE SONG COLLECTION
     Fetch all songs once for accurate totals and language cards.
  ======================================================= */

  useEffect(() => {
    let isMounted = true;

    const loadSongs = async () => {
      try {
        setLoading(true);
        setError("");

        // Fetch the complete collection. Filtering is done locally.
        const response = await API.get("/owner/music/songs");
        const data = response?.data;

        let songList = [];
        if (Array.isArray(data)) songList = data;
        else if (Array.isArray(data?.songs)) songList = data.songs;
        else if (Array.isArray(data?.data)) songList = data.data;
        else if (Array.isArray(data?.rows)) songList = data.rows;

        // Load master records so relationship IDs can be displayed as English names.
        const [artistsResult, albumsResult, categoriesResult, ministriesResult] =
          await Promise.allSettled([
            API.get("/artists"),
            API.get("/albums"),
            API.get("/categories"),
            API.get("/ministries"),
          ]);

        const getResultRows = (result, keys) =>
          result.status === "fulfilled"
            ? extractRows(result.value?.data, keys)
            : [];

        const artistRows = getResultRows(artistsResult, ["artists", "data", "items"]);
        const albumRows = getResultRows(albumsResult, ["albums", "data", "items"]);
        const categoryRows = getResultRows(categoriesResult, ["categories", "data", "items"]);
        const ministryRows = getResultRows(ministriesResult, ["ministries", "data", "items"]);

        if (isMounted) {
          setArtistsById(buildEnglishLookup(artistRows, [
            "name_english", "english_name", "nameEnglish", "englishName"
          ]));
          setAlbumsById(buildEnglishLookup(albumRows, [
            "name_english", "title_english", "english_name", "album_name_english",
            "nameEnglish", "titleEnglish"
          ]));
          setCategoriesById(buildEnglishLookup(categoryRows, [
            "name_english", "english_name", "nameEnglish", "category_name_english"
          ]));
          setMinistriesById(buildEnglishLookup(ministryRows, [
            "name_english", "english_name", "nameEnglish", "ministry_name_english"
          ]));
        }

        if (isMounted) setSongs(songList);
      } catch (err) {
        console.error("Failed to load owner songs:", err);
        if (isMounted) {
          setError(
            err?.response?.data?.message ||
            "Unable to load songs. Please try again."
          );
          setSongs([]);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadSongs();
    return () => {
      isMounted = false;
    };
  }, []);

  /* =======================================================
     LANGUAGE COUNTS
  ======================================================= */

  const languageCounts = useMemo(() => {
    const counts = Object.fromEntries(LANGUAGES.map((item) => [item, 0]));

    songs.forEach((song) => {
      const normalized = normalizeLanguage(song?.language);
      if (Object.prototype.hasOwnProperty.call(counts, normalized)) {
        counts[normalized] += 1;
      }
    });

    return counts;
  }, [songs]);

  /* =======================================================
     FILTER SONGS
  ======================================================= */

  const filteredSongs = useMemo(() => {

    const searchText =
      search
        .trim()
        .toLowerCase();


    return songs.filter(
      (song) => {

        const title = getEnglishSongTitle(song).toLowerCase();
        const englishTitle = title;
        const artist = getEnglishArtist(song, artistsById).toLowerCase();
        const album = getEnglishAlbum(song, albumsById).toLowerCase();


        const songLanguage = normalizeLanguage(song?.language);


        /* -----------------------------------------------
           SEARCH MATCH
        ------------------------------------------------ */

        const matchesSearch =
          !searchText ||
          title.includes(
            searchText
          ) ||
          englishTitle.includes(
            searchText
          ) ||
          artist.includes(
            searchText
          ) ||
          album.includes(
            searchText
          );


        /* -----------------------------------------------
           LANGUAGE MATCH
           
           API already filters the songs,
           but this keeps the frontend safe.
        ------------------------------------------------ */

        const matchesLanguage =
          !language ||
          songLanguage === normalizeLanguage(language);


        return (
          matchesSearch &&
          matchesLanguage
        );

      }
    );

  }, [
    songs,
    search,
    language,
    artistsById,
    albumsById,
  ]);

  // Pagination is applied after search and language filtering.
  const totalPages = Math.max(1, Math.ceil(filteredSongs.length / pageSize));

  useEffect(() => {
    setCurrentPage(1);
  }, [search, language, pageSize]);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  const paginatedSongs = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredSongs.slice(startIndex, startIndex + pageSize);
  }, [filteredSongs, currentPage, pageSize]);


  /* =======================================================
     CLEAR FILTERS
  ======================================================= */

  const clearFilters = () => {

    setSearch("");

    setLanguage("");


    navigate(
      "/owner/music/songs",
      {
        replace: true,
      }
    );

  };


  /* =======================================================
     LANGUAGE CHANGE
  ======================================================= */

  const handleLanguageChange = (
    event
  ) => {

    const selectedLanguage =
      event.target.value;


    /*
     * Update local state immediately.
     */

    setLanguage(
      selectedLanguage
    );


    /* -----------------------------------------------
       ALL LANGUAGES
    ------------------------------------------------ */

    if (!selectedLanguage) {

      navigate(
        "/owner/music/songs",
        {
          replace: true,
        }
      );

      return;

    }


    /* -----------------------------------------------
       SELECTED LANGUAGE
    ------------------------------------------------ */

    navigate(
      `/owner/music/songs?language=${encodeURIComponent(
        selectedLanguage
      )}`,
      {
        replace: true,
      }
    );

  };


  /* =======================================================
     RENDER
  ======================================================= */

  return (

    <div className="owner-songs-page">
      <style>{`
        .owner-songs-language-section {
          margin: 22px 0 26px;
          padding: 22px;
          border: 1px solid rgba(213, 177, 105, 0.18);
          border-radius: 20px;
          background: linear-gradient(135deg, rgba(13, 28, 57, 0.96), rgba(18, 42, 82, 0.88));
          box-shadow: 0 14px 34px rgba(0, 0, 0, 0.16);
        }
        .owner-songs-language-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          margin-bottom: 18px;
        }
        .owner-songs-language-heading h2 {
          margin: 0 0 5px;
          color: #f8f5ed;
          font-size: 20px;
          font-weight: 800;
        }
        .owner-songs-language-heading p,
        .owner-songs-language-heading > span {
          margin: 0;
          color: #b9c6dc;
          font-size: 13px;
        }
        .owner-songs-language-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(145px, 1fr));
          gap: 12px;
        }
        .owner-songs-language-card {
          min-width: 0;
          display: grid;
          justify-items: start;
          gap: 7px;
          padding: 16px;
          border: 1px solid rgba(190, 205, 229, 0.15);
          border-radius: 15px;
          color: #f5f7fb;
          text-align: left;
          background: rgba(5, 15, 35, 0.48);
          cursor: pointer;
          transition: transform .2s ease, border-color .2s ease, background .2s ease;
        }
        .owner-songs-language-card:hover {
          transform: translateY(-3px);
          border-color: rgba(225, 190, 120, 0.7);
        }
        .owner-songs-language-card.active {
          border-color: #dfbd7b;
          background: linear-gradient(135deg, rgba(37, 83, 153, 0.8), rgba(102, 78, 43, 0.42));
          box-shadow: 0 0 0 1px rgba(223, 189, 123, 0.16);
        }
        .owner-songs-language-card-icon {
          width: 34px;
          height: 34px;
          display: grid;
          place-items: center;
          border-radius: 10px;
          color: #e5c889;
          background: rgba(229, 200, 137, 0.12);
        }
        .owner-songs-language-card-name { font-size: 13px; color: #dce6f5; font-weight: 700; }
        .owner-songs-language-card strong { font-size: 25px; line-height: 1.1; color: #fff; }
        .owner-songs-language-card small { color: #aebbd0; font-size: 11px; }
        @media (max-width: 600px) {
          .owner-songs-language-section { padding: 16px; }
          .owner-songs-language-heading { align-items: flex-start; flex-direction: column; }
          .owner-songs-language-cards { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
      `}</style>


      {/* =================================================
          HEADER
      ================================================= */}

      <header className="owner-songs-header">


        {/* BACK BUTTON */}

        <button
          type="button"
          className="owner-songs-back-button"
          onClick={() =>
            navigate(
              "/owner/music"
            )
          }
        >

          <FaArrowLeft />

          <span>
            Music Collection
          </span>

        </button>


        {/* TITLE */}

        <div className="owner-songs-title-area">

          <div className="owner-songs-title-icon">

            <FaMusic />

          </div>


          <div>

            <h1>

              {language
                ? `${language} Songs`
                : "Songs"}

            </h1>


            <p>

              {language
                ? `View all ${language} songs in the KEERTHANA collection.`
                : "View all songs in the KEERTHANA collection."}

            </p>

          </div>

        </div>

      </header>


      {/* =================================================
          CONTENT
      ================================================= */}

      <main className="owner-songs-content">


        {/* =================================================
            TOP SUMMARY
        ================================================= */}

        <div className="owner-songs-summary">


          {/* TOTAL SONGS */}

          <div className="owner-songs-summary-card">

            <span>
              Total Songs
            </span>

            <strong>
              {songs.length}
            </strong>

          </div>


          {/* SHOWING */}

          <div className="owner-songs-summary-card">

            <span>
              Showing
            </span>

            <strong>
              {filteredSongs.length}
            </strong>

          </div>


          {/* LANGUAGE */}

          <div className="owner-songs-summary-card">

            <span>
              Language
            </span>

            <strong
              className="owner-songs-language-value"
            >

              {language || "All"}

            </strong>

          </div>


        </div>

        {/* LANGUAGE COLLECTION CARDS */}
        <section className="owner-songs-language-section">
          <div className="owner-songs-language-heading">
            <div>
              <h2>Languages</h2>
              <p>Select a language to view its songs.</p>
            </div>
            <span>{songs.length} songs in total</span>
          </div>

          <div className="owner-songs-language-cards">
            <button
              type="button"
              className={`owner-songs-language-card owner-songs-all-card ${!language ? "active" : ""}`}
              onClick={() => handleLanguageChange({ target: { value: "" } })}
              aria-pressed={!language}
            >
              <span className="owner-songs-language-card-icon"><FaMusic /></span>
              <span className="owner-songs-language-card-name">All Languages</span>
              <strong>{songs.length}</strong>
              <small>Total songs</small>
            </button>

            {LANGUAGES.map((item) => (
              <button
                type="button"
                key={item}
                className={`owner-songs-language-card ${language === item ? "active" : ""}`}
                onClick={() => handleLanguageChange({ target: { value: item } })}
                aria-pressed={language === item}
              >
                <span className="owner-songs-language-card-icon"><FaMusic /></span>
                <span className="owner-songs-language-card-name">{item}</span>
                <strong>{languageCounts[item] || 0}</strong>
                <small>{languageCounts[item] === 1 ? "Song" : "Songs"}</small>
              </button>
            ))}
          </div>
        </section>

        {/* =================================================
            FILTER BAR
        ================================================= */}

        <section className="owner-songs-filter-card">


          {/* FILTER TITLE */}

          <div className="owner-songs-filter-title">

            <FaFilter />

            <span>
              Search & Filter
            </span>

          </div>


          <div className="owner-songs-filter-row">


            {/* =================================================
                SEARCH
            ================================================= */}

            <div className="owner-songs-search">

              <FaSearch />


              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search songs, artists or albums..."
              />


              {search && (

                <button
                  type="button"
                  className="owner-songs-clear-search"
                  onClick={() =>
                    setSearch("")
                  }
                  aria-label="Clear search"
                >

                  <FaTimes />

                </button>

              )}

            </div>


            {/* =================================================
                LANGUAGE
            ================================================= */}

            <select
              value={language}
              onChange={
                handleLanguageChange
              }
              className="owner-songs-language-select"
            >

              <option value="">
                All Languages
              </option>


              {LANGUAGES.map(
                (item) => (

                  <option
                    key={item}
                    value={item}
                  >

                    {item}

                  </option>

                )
              )}

            </select>


            {/* =================================================
                CLEAR
            ================================================= */}

            {(search || language) && (

              <button
                type="button"
                className="owner-songs-clear-button"
                onClick={
                  clearFilters
                }
              >

                <FaTimes />

                Clear

              </button>

            )}

          </div>

        </section>


        {/* =================================================
            ERROR
        ================================================= */}

        {error && (

          <div className="owner-songs-error">

            {error}

          </div>

        )}


        {/* =================================================
            LOADING
        ================================================= */}

        {loading ? (

          <div className="owner-songs-loading">

            <div className="owner-songs-spinner"></div>

            <p>
              Loading songs...
            </p>

          </div>

        ) : filteredSongs.length === 0 ? (


          /* ===============================================
             EMPTY
          =============================================== */

          <div className="owner-songs-empty">


            <div className="owner-songs-empty-icon">

              <FaMusic />

            </div>


            <h2>
              No Songs Found
            </h2>


            <p>

              {search || language
                ? "No songs match the selected search or language filter."
                : "There are no songs in the KEERTHANA collection yet."}

            </p>


            {(search || language) && (

              <button
                type="button"
                onClick={
                  clearFilters
                }
                className="owner-songs-empty-button"
              >

                Clear Filters

              </button>

            )}

          </div>


        ) : (


          /* ===============================================
             SONG TABLE
          =============================================== */

          <section className="owner-songs-table-card">


            {/* TABLE HEADER */}

            <div className="owner-songs-table-header">

              <div>

                <h2>
                  {language
                    ? `${language} Song Collection`
                    : "Song Collection"}
                </h2>


                <p>

                  {filteredSongs.length} song
                  {filteredSongs.length !== 1
                    ? "s"
                    : ""}

                  {" "}displayed

                </p>

              </div>

            </div>


            {/* TABLE */}

            <div className="owner-songs-table-wrapper">

              <table className="owner-songs-table">


                {/* =================================================
                    TABLE HEAD
                ================================================= */}

                <thead>

                  <tr>

                    <th>
                      #
                    </th>

                    <th>
                      Song
                    </th>

                    <th>
                      Artist
                    </th>

                    <th>
                      Album
                    </th>

                    <th>
                      Language
                    </th>

                    <th>
                      Category
                    </th>

                    <th>
                      Ministry
                    </th>

                  </tr>

                </thead>


                {/* =================================================
                    TABLE BODY
                ================================================= */}

                <tbody>

                  {paginatedSongs.map(
                    (song, index) => {


                      /* ---------------------------------------------
                         COVER
                      --------------------------------------------- */

                      const cover =
                        song?.cover_url ||
                        song?.cover ||
                        "/images/default-cover.png";


                      /* ---------------------------------------------
                         TITLE
                      --------------------------------------------- */

                      const title = getEnglishSongTitle(song);


                      /* ---------------------------------------------
                         ARTIST
                      --------------------------------------------- */

                      const artist = getEnglishArtist(song, artistsById);


                      /* ---------------------------------------------
                         ALBUM
                      --------------------------------------------- */

                      const album = getEnglishAlbum(song, albumsById);


                      /* ---------------------------------------------
                         CATEGORY
                      --------------------------------------------- */

                      const category = getEnglishCategory(song, categoriesById);


                      /* ---------------------------------------------
                         MINISTRY
                      --------------------------------------------- */

                      const ministry = getEnglishMinistry(song, ministriesById);


                      return (

                        <tr
                          key={
                            song?.id ||
                            `${title}-${index}`
                          }
                        >


                          {/* =========================================
                              NUMBER
                          ========================================= */}

                          <td
                            className="owner-songs-number"
                          >

                            {(currentPage - 1) * pageSize + index + 1}

                          </td>


                          {/* =========================================
                              SONG
                          ========================================= */}

                          <td>

                            <div className="owner-song-info">


                              <img
                                src={cover}
                                alt={title}
                                className="owner-song-cover"
                                onError={(
                                  event
                                ) => {

                                  event.currentTarget.src =
                                    "/images/default-cover.png";

                                }}
                              />


                              <div>

                                <strong>
                                  {title}
                                </strong>




                              </div>

                            </div>

                          </td>


                          {/* =========================================
                              ARTIST
                          ========================================= */}

                          <td>

                            {artist}

                          </td>


                          {/* =========================================
                              ALBUM
                          ========================================= */}

                          <td>

                            {album}

                          </td>


                          {/* =========================================
                              LANGUAGE
                          ========================================= */}

                          <td>

                            <span
                              className={`owner-song-language owner-song-language-${String(
                                song?.language ||
                                "unknown"
                              )
                                .toLowerCase()
                                .replace(
                                  /\s+/g,
                                  "-"
                                )}`}
                            >

                              {normalizeLanguage(song?.language) ||
                                "Unknown"}

                            </span>

                          </td>


                          {/* =========================================
                              CATEGORY
                          ========================================= */}

                          <td>

                            {category}

                          </td>


                          {/* =========================================
                              MINISTRY
                          ========================================= */}

                          <td>

                            {ministry}

                          </td>


                        </tr>

                      );

                    }
                  )}

                </tbody>

              </table>

            </div>

            <div className="owner-songs-pagination">
              <div className="owner-songs-pagination-info">
                Showing <strong>{(currentPage - 1) * pageSize + 1}</strong>
                –<strong>{Math.min(currentPage * pageSize, filteredSongs.length)}</strong>
                of <strong>{filteredSongs.length}</strong> songs
              </div>

              <div className="owner-songs-pagination-controls">
                <label className="owner-songs-page-size">
                  Rows per page
                  <select
                    value={pageSize}
                    onChange={(event) => setPageSize(Number(event.target.value))}
                    aria-label="Rows per page"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                </label>

                <button type="button" onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1} aria-label="First page">
                  First
                </button>
                <button type="button"
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  disabled={currentPage === 1} aria-label="Previous page">
                  Previous
                </button>
                <span className="owner-songs-page-indicator">
                  Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
                </span>
                <button type="button"
                  onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                  disabled={currentPage >= totalPages} aria-label="Next page">
                  Next
                </button>
                <button type="button" onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage >= totalPages} aria-label="Last page">
                  Last
                </button>
              </div>
            </div>

          </section>

        )}

      </main>

    </div>

  );

};


export default BusinessOwnerSongs;