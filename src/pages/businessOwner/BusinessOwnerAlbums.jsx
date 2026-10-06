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
  FaCompactDisc,
  FaSearch,
  FaFilter,
  FaTimes,
} from "react-icons/fa";

import API from "../../services/api";

import "../../assets/css/businessowner/BusinessOwnerAlbums.css";


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
   BUSINESS OWNER ALBUMS
========================================================= */

const BusinessOwnerAlbums = () => {

  const navigate = useNavigate();

  const location = useLocation();


  /* =======================================================
     STATE
  ======================================================= */

  const [albums, setAlbums] = useState([]);

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

  }, [location.search]);


  /* =======================================================
     LOAD ALBUMS
  ======================================================= */

  useEffect(() => {

    const loadAlbums = async () => {

      try {

        setLoading(true);

        setError("");


       const params = new URLSearchParams(
  location.search
);

const urlLanguage =
  params.get("language");

const response =
  await API.get(
    "/owner/music/albums",
    {
      params: urlLanguage
        ? {
            language: urlLanguage,
          }
        : {},
    }
  );


        const data =
          response?.data;


        if (Array.isArray(data)) {

          setAlbums(data);

        }

        else if (
          Array.isArray(data?.albums)
        ) {

          setAlbums(
            data.albums
          );

        }

        else {

          setAlbums([]);

        }

      }

      catch (err) {

        console.error(
          "Failed to load owner albums:",
          err
        );


        setError(
          err?.response?.data?.message ||
          "Unable to load albums."
        );

        setAlbums([]);

      }

      finally {

        setLoading(false);

      }

    };


    loadAlbums();

  }, []);


  /* =======================================================
     FILTER ALBUMS
  ======================================================= */

  const filteredAlbums = useMemo(() => {

    const searchText =
      search
        .trim()
        .toLowerCase();


    return albums.filter(
      (album) => {

        const title =
          String(
            album?.title || ""
          ).toLowerCase();


        const artist =
          String(
            album?.artist_name ||
            album?.artist ||
            ""
          ).toLowerCase();


        const year =
          String(
            album?.release_year ||
            ""
          ).toLowerCase();


        const albumLanguage =
          String(
            album?.language ||
            ""
          );


        const matchesSearch =
          !searchText ||
          title.includes(searchText) ||
          artist.includes(searchText) ||
          year.includes(searchText);


        const matchesLanguage =
          !language ||
          albumLanguage === language;


        return (
          matchesSearch &&
          matchesLanguage
        );

      }
    );

  }, [
    albums,
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
      "/owner/music/albums",
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


    setLanguage(
      selectedLanguage
    );


    if (selectedLanguage) {

      navigate(
        `/owner/music/albums?language=${encodeURIComponent(
          selectedLanguage
        )}`,
        {
          replace: true,
        }
      );

    }

    else {

      navigate(
        "/owner/music/albums",
        {
          replace: true,
        }
      );

    }

  };


  /* =======================================================
     RENDER
  ======================================================= */

  return (

    <div className="owner-albums-page">


      {/* ===================================================
          HEADER
      =================================================== */}

      <header className="owner-albums-header">


        <button
          type="button"
          className="owner-albums-back-button"
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


        <div className="owner-albums-title-area">

          <div className="owner-albums-title-icon">

            <FaCompactDisc />

          </div>


          <div>

            <h1>
              Albums
            </h1>

            <p>
              View all albums in the
              KEERTHANA collection.
            </p>

          </div>

        </div>

      </header>


      {/* ===================================================
          CONTENT
      =================================================== */}

      <main className="owner-albums-content">


        {/* =================================================
            SUMMARY
        ================================================= */}

        <div className="owner-albums-summary">


          <div className="owner-albums-summary-card">

            <span>
              Total Albums
            </span>

            <strong>
              {albums.length}
            </strong>

          </div>


          <div className="owner-albums-summary-card">

            <span>
              Showing
            </span>

            <strong>
              {filteredAlbums.length}
            </strong>

          </div>


          <div className="owner-albums-summary-card">

            <span>
              Language
            </span>

            <strong className="owner-albums-language-value">

              {language || "All"}

            </strong>

          </div>

        </div>


        {/* =================================================
            FILTER
        ================================================= */}

        <section className="owner-albums-filter-card">


          <div className="owner-albums-filter-title">

            <FaFilter />

            <span>
              Search & Filter
            </span>

          </div>


          <div className="owner-albums-filter-row">


            {/* SEARCH */}

            <div className="owner-albums-search">

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


              {search && (

                <button
                  type="button"
                  className="owner-albums-clear-search"
                  onClick={() =>
                    setSearch("")
                  }
                  aria-label="Clear search"
                >

                  <FaTimes />

                </button>

              )}

            </div>


            {/* LANGUAGE */}

            <select
              value={language}
              onChange={
                handleLanguageChange
              }
              className="owner-albums-language-select"
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


            {/* CLEAR */}

            {(search || language) && (

              <button
                type="button"
                className="owner-albums-clear-button"
                onClick={clearFilters}
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

          <div className="owner-albums-error">

            {error}

          </div>

        )}


        {/* =================================================
            LOADING
        ================================================= */}

        {loading ? (

          <div className="owner-albums-loading">

            <div className="owner-albums-spinner"></div>

            <p>
              Loading albums...
            </p>

          </div>

        ) : filteredAlbums.length === 0 ? (

          /* ===============================================
             EMPTY
          =============================================== */

          <div className="owner-albums-empty">

            <div className="owner-albums-empty-icon">

              <FaCompactDisc />

            </div>


            <h2>
              No Albums Found
            </h2>


            <p>

              {search || language
                ? "No albums match the selected search or language filter."
                : "There are no albums in the KEERTHANA collection yet."
              }

            </p>


            {(search || language) && (

              <button
                type="button"
                onClick={clearFilters}
                className="owner-albums-empty-button"
              >

                Clear Filters

              </button>

            )}

          </div>

        ) : (

          /* ===============================================
             ALBUM GRID
          =============================================== */

          <section className="owner-albums-list-card">


            <div className="owner-albums-list-header">

              <div>

                <h2>
                  Album Collection
                </h2>

                <p>
                  {filteredAlbums.length} album
                  {filteredAlbums.length !== 1
                    ? "s"
                    : ""}
                  {" "}displayed
                </p>

              </div>

            </div>


            <div className="owner-albums-grid">

              {filteredAlbums.map(
                (album, index) => {


                  const cover =
                    album?.cover_url ||
                    album?.cover ||
                    "/images/default-album.png";


                  const title =
                    album?.title ||
                    "Untitled Album";


                  const artist =
                    album?.artist_name ||
                    album?.artist ||
                    "Unknown Artist";


                  const languageName =
                    album?.language ||
                    "Unknown";


                  const year =
                    album?.release_year ||
                    "—";


                  const songCount =
                    album?.song_count ??
                    album?.songs_count ??
                    album?.total_songs ??
                    null;


                  return (

                    <article
                      key={
                        album?.id ||
                        `${title}-${index}`
                      }
                      className="owner-album-card"
                    >


                      {/* COVER */}

                      <div className="owner-album-cover-wrapper">

                        <img
                          src={cover}
                          alt={title}
                          className="owner-album-cover"
                          onError={(
                            event
                          ) => {

                            event.currentTarget.src =
                              "/images/default-album.png";

                          }}
                        />

                      </div>


                      {/* DETAILS */}

                      <div className="owner-album-details">


                        <h3>
                          {title}
                        </h3>


                        <p className="owner-album-artist">

                          {artist}

                        </p>


                        <div className="owner-album-meta">


                          <span>

                            {languageName}

                          </span>


                          <span>

                            {year}

                          </span>


                          {songCount !== null && (

                            <span>

                              {songCount} song
                              {songCount !== 1
                                ? "s"
                                : ""}

                            </span>

                          )}

                        </div>

                      </div>

                    </article>

                  );

                }
              )}

            </div>

          </section>

        )}

      </main>

    </div>

  );

};


export default BusinessOwnerAlbums;