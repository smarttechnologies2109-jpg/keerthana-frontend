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
  FaUsers,
  FaSearch,
  FaFilter,
  FaTimes,
  FaMusic,
} from "react-icons/fa";

import API from "../../services/api";

import "../../assets/css/businessOwner/BusinessOwnerArtists.css";


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
   BUSINESS OWNER ARTISTS
========================================================= */

const BusinessOwnerArtists = () => {

  const navigate = useNavigate();

  const location = useLocation();


  /* =======================================================
     STATE
  ======================================================= */

  const [artists, setArtists] = useState([]);

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
     LOAD ARTISTS
  ======================================================= */

  useEffect(() => {

    const loadArtists = async () => {

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
    "/owner/music/artists",
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

          setArtists(data);

        }

        else if (
          Array.isArray(data?.artists)
        ) {

          setArtists(
            data.artists
          );

        }

        else {

          setArtists([]);

        }

      }

      catch (err) {

        console.error(
          "Failed to load owner artists:",
          err
        );


        setError(
          err?.response?.data?.message ||
          "Unable to load artists."
        );

        setArtists([]);

      }

      finally {

        setLoading(false);

      }

    };


    loadArtists();

  }, []);


  /* =======================================================
     FILTER ARTISTS
  ======================================================= */

  const filteredArtists = useMemo(() => {

    const searchText =
      search
        .trim()
        .toLowerCase();


    return artists.filter(
      (artist) => {

        const name =
          String(
            artist?.name || ""
          ).toLowerCase();


        const bio =
          String(
            artist?.bio || ""
          ).toLowerCase();


        const artistLanguage =
          String(
            artist?.language ||
            ""
          );


        const matchesSearch =
          !searchText ||
          name.includes(searchText) ||
          bio.includes(searchText);


        const matchesLanguage =
          !language ||
          artistLanguage === language;


        return (
          matchesSearch &&
          matchesLanguage
        );

      }
    );

  }, [
    artists,
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
      "/owner/music/artists",
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
        `/owner/music/artists?language=${encodeURIComponent(
          selectedLanguage
        )}`,
        {
          replace: true,
        }
      );

    }

    else {

      navigate(
        "/owner/music/artists",
        {
          replace: true,
        }
      );

    }

  };


  /* =======================================================
     GET ARTIST IMAGE
  ======================================================= */

  const getArtistImage = (
    artist
  ) => {

    return (
      artist?.image_url ||
      artist?.image ||
      artist?.profile_image ||
      "/images/default-artist.png"
    );

  };


  /* =======================================================
     RENDER
  ======================================================= */

  return (

    <div className="owner-artists-page">


      {/* ===================================================
          HEADER
      =================================================== */}

      <header className="owner-artists-header">


        <button
          type="button"
          className="owner-artists-back-button"
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


        <div className="owner-artists-title-area">

          <div className="owner-artists-title-icon">

            <FaUsers />

          </div>


          <div>

            <h1>
              Artists
            </h1>

            <p>
              View all artists in the
              KEERTHANA collection.
            </p>

          </div>

        </div>

      </header>


      {/* ===================================================
          CONTENT
      =================================================== */}

      <main className="owner-artists-content">


        {/* =================================================
            SUMMARY
        ================================================= */}

        <div className="owner-artists-summary">


          <div className="owner-artists-summary-card">

            <span>
              Total Artists
            </span>

            <strong>
              {artists.length}
            </strong>

          </div>


          <div className="owner-artists-summary-card">

            <span>
              Showing
            </span>

            <strong>
              {filteredArtists.length}
            </strong>

          </div>


          <div className="owner-artists-summary-card">

            <span>
              Language
            </span>

            <strong className="owner-artists-language-value">

              {language || "All"}

            </strong>

          </div>

        </div>


        {/* =================================================
            FILTER
        ================================================= */}

        <section className="owner-artists-filter-card">


          <div className="owner-artists-filter-title">

            <FaFilter />

            <span>
              Search & Filter
            </span>

          </div>


          <div className="owner-artists-filter-row">


            {/* SEARCH */}

            <div className="owner-artists-search">

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


              {search && (

                <button
                  type="button"
                  className="owner-artists-clear-search"
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
              className="owner-artists-language-select"
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
                className="owner-artists-clear-button"
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

          <div className="owner-artists-error">

            {error}

          </div>

        )}


        {/* =================================================
            LOADING
        ================================================= */}

        {loading ? (

          <div className="owner-artists-loading">

            <div className="owner-artists-spinner"></div>

            <p>
              Loading artists...
            </p>

          </div>

        ) : filteredArtists.length === 0 ? (

          /* ===============================================
             EMPTY
          =============================================== */

          <div className="owner-artists-empty">

            <div className="owner-artists-empty-icon">

              <FaUsers />

            </div>


            <h2>
              No Artists Found
            </h2>


            <p>

              {search || language
                ? "No artists match the selected search or language filter."
                : "There are no artists in the KEERTHANA collection yet."
              }

            </p>


            {(search || language) && (

              <button
                type="button"
                onClick={clearFilters}
                className="owner-artists-empty-button"
              >

                Clear Filters

              </button>

            )}

          </div>

        ) : (

          /* ===============================================
             ARTIST GRID
          =============================================== */

          <section className="owner-artists-list-card">


            <div className="owner-artists-list-header">

              <div>

                <h2>
                  Artist Collection
                </h2>

                <p>
                  {filteredArtists.length} artist
                  {filteredArtists.length !== 1
                    ? "s"
                    : ""}
                  {" "}displayed
                </p>

              </div>

            </div>


            <div className="owner-artists-grid">

              {filteredArtists.map(
                (artist, index) => {


                  const image =
                    getArtistImage(
                      artist
                    );


                  const name =
                    artist?.name ||
                    "Unknown Artist";


                  const artistLanguage =
                    artist?.language ||
                    "Unknown";


                  const songCount =
                    artist?.song_count ??
                    artist?.songs_count ??
                    artist?.total_songs ??
                    null;


                  return (

                    <article
                      key={
                        artist?.id ||
                        `${name}-${index}`
                      }
                      className="owner-artist-card"
                    >


                      {/* IMAGE */}

                      <div className="owner-artist-image-wrapper">

                        <img
                          src={image}
                          alt={name}
                          className="owner-artist-image"
                          onError={(
                            event
                          ) => {

                            event.currentTarget.src =
                              "/images/default-artist.png";

                          }}
                        />

                      </div>


                      {/* DETAILS */}

                      <div className="owner-artist-details">


                        <h3>
                          {name}
                        </h3>


                        {artist?.bio && (

                          <p className="owner-artist-bio">

                            {artist.bio}

                          </p>

                        )}


                        <div className="owner-artist-meta">


                          <span>
                            {artistLanguage}
                          </span>


                          {songCount !== null && (

                            <span>

                              <FaMusic />

                              {songCount}

                              {" "}

                              song
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


export default BusinessOwnerArtists;