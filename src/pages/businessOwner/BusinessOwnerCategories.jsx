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
  FaFolderOpen,
  FaSearch,
  FaFilter,
  FaTimes,
  FaMusic,
} from "react-icons/fa";

import API from "../../services/api";

import "../../assets/css/businessowner/BusinessOwnerCategories.css";


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
   BUSINESS OWNER CATEGORIES
========================================================= */

const BusinessOwnerCategories = () => {

  const navigate = useNavigate();

  const location = useLocation();


  /* =======================================================
     STATE
  ======================================================= */

  const [categories, setCategories] = useState([]);

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

    } else {

      setLanguage("");

    }

  }, [location.search]);


  /* =======================================================
     LOAD CATEGORIES
  ======================================================= */

  useEffect(() => {

    const loadCategories = async () => {

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
    "/owner/music/categories",
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

          setCategories(data);

        }

        else if (
          Array.isArray(data?.categories)
        ) {

          setCategories(
            data.categories
          );

        }

        else {

          setCategories([]);

        }

      }

      catch (err) {

        console.error(
          "Failed to load owner categories:",
          err
        );


        setError(
          err?.response?.data?.message ||
          "Unable to load categories."
        );

        setCategories([]);

      }

      finally {

        setLoading(false);

      }

    };


    loadCategories();

  }, []);


  /* =======================================================
     FILTER CATEGORIES
  ======================================================= */

  const filteredCategories = useMemo(() => {

    const searchText =
      search
        .trim()
        .toLowerCase();


    return categories.filter(
      (category) => {

        const name =
          String(
            category?.name || ""
          ).toLowerCase();


        const description =
          String(
            category?.description ||
            ""
          ).toLowerCase();


        const categoryLanguage =
          String(
            category?.language ||
            ""
          );


        const matchesSearch =
          !searchText ||
          name.includes(searchText) ||
          description.includes(searchText);


        const matchesLanguage =
          !language ||
          categoryLanguage === language;


        return (
          matchesSearch &&
          matchesLanguage
        );

      }
    );

  }, [
    categories,
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
      "/owner/music/categories",
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
        `/owner/music/categories?language=${encodeURIComponent(
          selectedLanguage
        )}`,
        {
          replace: true,
        }
      );

    } else {

      navigate(
        "/owner/music/categories",
        {
          replace: true,
        }
      );

    }

  };


  /* =======================================================
     CATEGORY IMAGE
  ======================================================= */

  const getCategoryImage = (
    category
  ) => {

    return (
      category?.image_url ||
      category?.image ||
      "/images/default-category.png"
    );

  };


  /* =======================================================
     RENDER
  ======================================================= */

  return (

    <div className="owner-categories-page">


      {/* ===================================================
          HEADER
      =================================================== */}

      <header className="owner-categories-header">


        <button
          type="button"
          className="owner-categories-back-button"
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


        <div className="owner-categories-title-area">

          <div className="owner-categories-title-icon">

            <FaFolderOpen />

          </div>


          <div>

            <h1>
              Categories
            </h1>

            <p>
              View all categories in the
              KEERTHANA collection.
            </p>

          </div>

        </div>

      </header>


      {/* ===================================================
          CONTENT
      =================================================== */}

      <main className="owner-categories-content">


        {/* =================================================
            SUMMARY
        ================================================= */}

        <div className="owner-categories-summary">


          <div className="owner-categories-summary-card">

            <span>
              Total Categories
            </span>

            <strong>
              {categories.length}
            </strong>

          </div>


          <div className="owner-categories-summary-card">

            <span>
              Showing
            </span>

            <strong>
              {filteredCategories.length}
            </strong>

          </div>


          <div className="owner-categories-summary-card">

            <span>
              Language
            </span>

            <strong className="owner-categories-language-value">

              {language || "All"}

            </strong>

          </div>

        </div>


        {/* =================================================
            FILTER
        ================================================= */}

        <section className="owner-categories-filter-card">


          <div className="owner-categories-filter-title">

            <FaFilter />

            <span>
              Search & Filter
            </span>

          </div>


          <div className="owner-categories-filter-row">


            {/* SEARCH */}

            <div className="owner-categories-search">

              <FaSearch />

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search categories..."
              />


              {search && (

                <button
                  type="button"
                  className="owner-categories-clear-search"
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
              className="owner-categories-language-select"
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
                className="owner-categories-clear-button"
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

          <div className="owner-categories-error">

            {error}

          </div>

        )}


        {/* =================================================
            LOADING
        ================================================= */}

        {loading ? (

          <div className="owner-categories-loading">

            <div className="owner-categories-spinner"></div>

            <p>
              Loading categories...
            </p>

          </div>

        ) : filteredCategories.length === 0 ? (

          /* ===============================================
             EMPTY
          =============================================== */

          <div className="owner-categories-empty">

            <div className="owner-categories-empty-icon">

              <FaFolderOpen />

            </div>


            <h2>
              No Categories Found
            </h2>


            <p>

              {search || language
                ? "No categories match the selected search or language filter."
                : "There are no categories in the KEERTHANA collection yet."
              }

            </p>


            {(search || language) && (

              <button
                type="button"
                onClick={clearFilters}
                className="owner-categories-empty-button"
              >

                Clear Filters

              </button>

            )}

          </div>

        ) : (

          /* ===============================================
             CATEGORY GRID
          =============================================== */

          <section className="owner-categories-list-card">


            <div className="owner-categories-list-header">

              <div>

                <h2>
                  Category Collection
                </h2>

                <p>
                  {filteredCategories.length} categor
                  {filteredCategories.length !== 1
                    ? "ies"
                    : "y"}
                  {" "}displayed
                </p>

              </div>

            </div>


            <div className="owner-categories-grid">

              {filteredCategories.map(
                (category, index) => {


                  const image =
                    getCategoryImage(
                      category
                    );


                  const name =
                    category?.name ||
                    "Unnamed Category";


                  const categoryLanguage =
                    category?.language ||
                    "Unknown";


                  const songCount =
                    category?.song_count ??
                    category?.songs_count ??
                    category?.total_songs ??
                    null;


                  return (

                    <article
                      key={
                        category?.id ||
                        `${name}-${index}`
                      }
                      className="owner-category-card"
                    >


                      {/* IMAGE */}

                      <div className="owner-category-image-wrapper">

                        <img
                          src={image}
                          alt={name}
                          className="owner-category-image"
                          onError={(
                            event
                          ) => {

                            event.currentTarget.src =
                              "/images/default-category.png";

                          }}
                        />

                      </div>


                      {/* DETAILS */}

                      <div className="owner-category-details">


                        <h3>
                          {name}
                        </h3>


                        {category?.description && (

                          <p className="owner-category-description">

                            {category.description}

                          </p>

                        )}


                        <div className="owner-category-meta">


                          <span>
                            {categoryLanguage}
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


export default BusinessOwnerCategories;
