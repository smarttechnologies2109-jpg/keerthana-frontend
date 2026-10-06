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

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  const [language, setLanguage] = useState("");


  /* =======================================================
     READ LANGUAGE FROM URL
  ======================================================= */

  useEffect(() => {

    const params =
      new URLSearchParams(
        location.search
      );

    const urlLanguage =
      params.get("language");


    if (
      urlLanguage &&
      LANGUAGES.includes(urlLanguage)
    ) {

      setLanguage(urlLanguage);

    }

    else {

      setLanguage("");

    }

  }, [
    location.search,
  ]);


  /* =======================================================
     LOAD SONGS
     
     IMPORTANT:
     Reload whenever URL language changes.
  ======================================================= */

  useEffect(() => {

    const loadSongs = async () => {

      try {

        setLoading(true);

        setError("");


        /* -----------------------------------------------
           READ CURRENT LANGUAGE FROM URL
        ------------------------------------------------ */

        const params =
          new URLSearchParams(
            location.search
          );

        const urlLanguage =
          params.get("language");


        /* -----------------------------------------------
           API REQUEST
        ------------------------------------------------ */

        const response =
          await API.get(
            "/owner/music/songs",
            {
              params:
                urlLanguage &&
                LANGUAGES.includes(
                  urlLanguage
                )
                  ? {
                      language:
                        urlLanguage,
                    }
                  : {},
            }
          );


        const data =
          response?.data;


        /* -----------------------------------------------
           SUPPORT DIFFERENT RESPONSE FORMATS
        ------------------------------------------------ */

        if (
          Array.isArray(data)
        ) {

          setSongs(data);

        }

        else if (
          Array.isArray(
            data?.songs
          )
        ) {

          setSongs(
            data.songs
          );

        }

        else {

          setSongs([]);

        }

      }

      catch (err) {

        console.error(
          "Failed to load owner songs:",
          err
        );


        setError(
          err?.response?.data?.message ||
          "Unable to load songs."
        );


        setSongs([]);

      }

      finally {

        setLoading(false);

      }

    };


    loadSongs();


  }, [
    location.search,
  ]);


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

        const title =
          String(
            song?.title || ""
          ).toLowerCase();


        const englishTitle =
          String(
            song?.title_english || ""
          ).toLowerCase();


        const artist =
          String(
            song?.artist_name ||
            song?.artist ||
            ""
          ).toLowerCase();


        const album =
          String(
            song?.album_title ||
            song?.album ||
            ""
          ).toLowerCase();


        const songLanguage =
          String(
            song?.language || ""
          );


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
          songLanguage === language;


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
  ]);


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

                  {filteredSongs.map(
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

                      const title =
                        song?.title ||
                        "Untitled Song";


                      /* ---------------------------------------------
                         ARTIST
                      --------------------------------------------- */

                      const artist =
                        song?.artist_name ||
                        song?.artist ||
                        "Unknown Artist";


                      /* ---------------------------------------------
                         ALBUM
                      --------------------------------------------- */

                      const album =
                        song?.album_title ||
                        song?.album ||
                        "No Album";


                      /* ---------------------------------------------
                         CATEGORY
                      --------------------------------------------- */

                      const category =
                        song?.category_name ||
                        song?.category ||
                        "—";


                      /* ---------------------------------------------
                         MINISTRY
                      --------------------------------------------- */

                      const ministry =
                        song?.ministry_name ||
                        song?.ministry ||
                        "—";


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

                            {index + 1}

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


                                {song?.title_english && (

                                  <span>
                                    {
                                      song.title_english
                                    }
                                  </span>

                                )}

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

                              {song?.language ||
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

          </section>

        )}

      </main>

    </div>

  );

};


export default BusinessOwnerSongs;