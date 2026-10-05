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
  FaChurch,
  FaSearch,
  FaFilter,
  FaTimes,
  FaMusic,
} from "react-icons/fa";

import API from "../../services/api";

import "../../assets/css/businessOwner/BusinessOwnerMinistries.css";


/* =========================================================
   SUPPORTED LANGUAGES
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
   COMPONENT
========================================================= */

const BusinessOwnerMinistries = () => {

  const navigate = useNavigate();
  const location = useLocation();


  /* =======================================================
     STATE
  ======================================================= */

  const [ministries, setMinistries] = useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [language, setLanguage] =
    useState("");


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

    } else {

      setLanguage("");

    }

  }, [location.search]);


  /* =======================================================
     LOAD MINISTRIES
  ======================================================= */

  useEffect(() => {

    const loadMinistries = async () => {

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
    "/owner/music/ministries",
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


        /*
          Supports:

          [
            {...}
          ]

          OR

          {
            ministries: [...]
          }
        */

        if (Array.isArray(data)) {

          setMinistries(data);

        } else if (
          Array.isArray(
            data?.ministries
          )
        ) {

          setMinistries(
            data.ministries
          );

        } else {

          setMinistries([]);

        }

      } catch (err) {

        console.error(
          "Failed to load owner ministries:",
          err
        );


        setError(
          err?.response?.data?.message ||
          "Unable to load ministries."
        );


        setMinistries([]);

      } finally {

        setLoading(false);

      }

    };


    loadMinistries();

  }, []);


  /* =======================================================
     FILTER MINISTRIES
  ======================================================= */

  const filteredMinistries =
    useMemo(() => {

      const searchText =
        search
          .trim()
          .toLowerCase();


      return ministries.filter(
        (ministry) => {

          const name =
            String(
              ministry?.name || ""
            ).toLowerCase();


          const description =
            String(
              ministry?.description || ""
            ).toLowerCase();


          const ministryLanguage =
            String(
              ministry?.language || ""
            );


          const matchesSearch =
            !searchText ||
            name.includes(
              searchText
            ) ||
            description.includes(
              searchText
            );


          const matchesLanguage =
            !language ||
            ministryLanguage === language;


          return (
            matchesSearch &&
            matchesLanguage
          );

        }
      );

    }, [
      ministries,
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
      "/owner/music/ministries",
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
        `/owner/music/ministries?language=${encodeURIComponent(
          selectedLanguage
        )}`,
        {
          replace: true,
        }
      );

    } else {

      navigate(
        "/owner/music/ministries",
        {
          replace: true,
        }
      );

    }

  };


  /* =======================================================
     MINISTRY IMAGE
  ======================================================= */

  const getMinistryImage = (
    ministry
  ) => {

    return (
      ministry?.image_url ||
      ministry?.image ||
      ministry?.cover_url ||
      "/images/default-ministry.png"
    );

  };


  /* =======================================================
     SONG COUNT
  ======================================================= */

  const getSongCount = (
    ministry
  ) => {

    return (
      ministry?.song_count ??
      ministry?.songs_count ??
      ministry?.total_songs ??
      0
    );

  };


  /* =======================================================
     RENDER
  ======================================================= */

  return (

    <div className="owner-ministries-page">


      {/* =================================================
          HEADER
      ================================================= */}

      <header className="owner-ministries-header">

        <div className="owner-ministries-header-left">

          <button
            type="button"
            className="owner-ministries-back-btn"
            onClick={() =>
              navigate("/owner/music")
            }
          >

            <FaArrowLeft />

            <span>
              Music Collection
            </span>

          </button>


          <div className="owner-ministries-title">

            <div className="owner-ministries-title-icon">
              <FaChurch />
            </div>

            <div>

              <h1>
                Ministries
              </h1>

              <p>
                View and manage the ministry
                collection
              </p>

            </div>

          </div>

        </div>

      </header>


      {/* =================================================
          SUMMARY
      ================================================= */}

      <section className="owner-ministries-summary">

        <div className="owner-ministry-summary-card">

          <div className="owner-ministry-summary-icon">
            <FaChurch />
          </div>

          <div>

            <span>
              Total Ministries
            </span>

            <strong>
              {ministries.length}
            </strong>

          </div>

        </div>


        <div className="owner-ministry-summary-card">

          <div className="owner-ministry-summary-icon">
            <FaFilter />
          </div>

          <div>

            <span>
              Showing
            </span>

            <strong>
              {filteredMinistries.length}
            </strong>

          </div>

        </div>


        <div className="owner-ministry-summary-card">

          <div className="owner-ministry-summary-icon">
            <FaChurch />
          </div>

          <div>

            <span>
              Language
            </span>

            <strong>

              {language || "All"}

            </strong>

          </div>

        </div>

      </section>


      {/* =================================================
          FILTERS
      ================================================= */}

      <section className="owner-ministries-filter-card">

        <div className="owner-ministries-search">

          <FaSearch />

          <input
            type="text"
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Search ministries..."
          />

        </div>


        <div className="owner-ministries-language">

          <FaFilter />

          <select
            value={language}
            onChange={
              handleLanguageChange
            }
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

        </div>


        {(search || language) && (

          <button
            type="button"
            className="owner-ministries-clear-btn"
            onClick={
              clearFilters
            }
          >

            <FaTimes />

            Clear Filters

          </button>

        )}

      </section>


      {/* =================================================
          CONTENT
      ================================================= */}

      <section className="owner-ministries-content">


        {/* LOADING */}

        {loading && (

          <div className="owner-ministries-loading">

            <div className="owner-ministries-spinner"></div>

            <p>
              Loading ministries...
            </p>

          </div>

        )}


        {/* ERROR */}

        {!loading && error && (

          <div className="owner-ministries-error">

            <FaChurch />

            <h3>
              Unable to load ministries
            </h3>

            <p>
              {error}
            </p>

          </div>

        )}


        {/* EMPTY */}

        {!loading &&
          !error &&
          filteredMinistries.length === 0 && (

            <div className="owner-ministries-empty">

              <div className="owner-ministries-empty-icon">
                <FaChurch />
              </div>

              <h3>
                No Ministries Found
              </h3>

              <p>

                {search || language
                  ? "No ministries match your current filters."
                  : "No ministries have been added yet."
                }

              </p>

            </div>

          )}


        {/* MINISTRY GRID */}

        {!loading &&
          !error &&
          filteredMinistries.length > 0 && (

            <div className="owner-ministries-grid">

              {filteredMinistries.map(
                (ministry) => (

                  <article
                    className="owner-ministry-card"
                    key={ministry.id}
                  >


                    {/* IMAGE */}

                    <div className="owner-ministry-image-wrapper">

                      <img
                        src={
                          getMinistryImage(
                            ministry
                          )
                        }
                        alt={
                          ministry?.name ||
                          "Ministry"
                        }
                        className="owner-ministry-image"
                        onError={(
                          event
                        ) => {

                          if (
                            event.currentTarget.src.endsWith(
                              "/images/default-ministry.png"
                            )
                          ) {
                            return;
                          }

                          event.currentTarget.src =
                            "/images/default-ministry.png";

                        }}
                      />


                      <div className="owner-ministry-image-icon">

                        <FaChurch />

                      </div>

                    </div>


                    {/* CONTENT */}

                    <div className="owner-ministry-card-content">

                      <div className="owner-ministry-card-top">

                        <h2>
                          {ministry?.name ||
                            "Unnamed Ministry"}
                        </h2>


                        {ministry?.language && (

                          <span
                            className={`owner-ministry-language-badge owner-ministry-language-${String(
                              ministry.language
                            )
                              .toLowerCase()
                              .replace(
                                /\s+/g,
                                "-"
                              )}`}
                          >
                            {ministry.language}
                          </span>

                        )}

                      </div>


                      {/* DESCRIPTION */}

                      {ministry?.description && (

                        <p className="owner-ministry-description">

                          {ministry.description}

                        </p>

                      )}


                      {/* FOOTER */}

                      <div className="owner-ministry-card-footer">

                        <div className="owner-ministry-song-count">

                          <FaMusic />

                          <span>

                            {getSongCount(
                              ministry
                            )}

                            {" "}

                            {getSongCount(
                              ministry
                            ) === 1
                              ? "Song"
                              : "Songs"}

                          </span>

                        </div>


                        <div className="owner-ministry-id">

                          ID: {ministry.id}

                        </div>

                      </div>

                    </div>

                  </article>

                )
              )}

            </div>

          )}

      </section>

    </div>

  );

};


export default BusinessOwnerMinistries;