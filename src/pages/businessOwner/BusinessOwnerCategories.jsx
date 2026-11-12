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
  FaGlobe,
  FaLanguage,
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

/* Normalize stored language values so Telugu, telugu, te-IN, etc. match. */
const normalizeLanguage = (value) => {
  const raw = String(value || "").trim().toLowerCase();
  if (!raw) return "";

  const aliases = {
    te: "telugu", "te-in": "telugu", telugu: "telugu",
    hi: "hindi", "hi-in": "hindi", hindi: "hindi",
    en: "english", "en-in": "english", english: "english",
    ml: "malayalam", "ml-in": "malayalam", malayalam: "malayalam",
    kn: "kannada", "kn-in": "kannada", kannada: "kannada",
    ta: "tamil", "ta-in": "tamil", tamil: "tamil",
  };

  return aliases[raw] || raw.replace(/\s+/g, " ");
};


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


    const matchedLanguage = LANGUAGES.find(
      (item) => normalizeLanguage(item) === normalizeLanguage(urlLanguage)
    );

    setLanguage(matchedLanguage || "");

  }, [location.search]);


  /* =======================================================
     LOAD CATEGORIES
  ======================================================= */

  useEffect(() => {

    const loadCategories = async () => {

      try {

        setLoading(true);

        setError("");

// Load the full collection once. Language cards and the dropdown
// filter this complete list locally, so counts remain accurate.
const response = await API.get("/owner/music/categories");


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


        const categoryLanguage = normalizeLanguage(
          category?.language || category?.language_name || category?.lang
        );


        const matchesSearch =
          !searchText ||
          name.includes(searchText) ||
          description.includes(searchText);


        const matchesLanguage =
          !language ||
          categoryLanguage === normalizeLanguage(language);


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
     LANGUAGE COUNTS
  ======================================================= */

  const languageCounts = useMemo(() => {
    const counts = Object.fromEntries(
      LANGUAGES.map((item) => [item, 0])
    );

    categories.forEach((category) => {
      const normalized = normalizeLanguage(
        category?.language || category?.language_name || category?.lang
      );
      const matched = LANGUAGES.find(
        (item) => normalizeLanguage(item) === normalized
      );
      if (matched) counts[matched] += 1;
    });

    return counts;
  }, [categories]);


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
      <style>{`
        .owner-categories-language-section { margin: 0 0 24px; }
        .owner-categories-language-heading { display:flex; align-items:center; justify-content:space-between; gap:14px; margin-bottom:14px; flex-wrap:wrap; }
        .owner-categories-language-heading h2 { margin:0 0 5px; color:#f7f3e9; font-size:1.12rem; }
        .owner-categories-language-heading p { margin:0; color:#aebbd0; font-size:.88rem; }
        .owner-categories-language-total { display:inline-flex; align-items:center; gap:8px; color:#e8d39a; font-weight:700; }
        .owner-categories-language-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(145px,1fr)); gap:12px; }
        .owner-categories-language-card { display:flex; flex-direction:column; align-items:flex-start; gap:7px; min-height:132px; padding:16px; border:1px solid rgba(207,177,112,.22); border-radius:16px; background:linear-gradient(145deg,rgba(20,39,72,.96),rgba(9,20,40,.98)); color:#f5f1e8; text-align:left; cursor:pointer; transition:transform .2s ease,border-color .2s ease,box-shadow .2s ease; }
        .owner-categories-language-card:hover { transform:translateY(-3px); border-color:#d7b96e; box-shadow:0 10px 26px rgba(0,0,0,.22); }
        .owner-categories-language-card.active { border-color:#e0c27b; background:linear-gradient(145deg,rgba(35,69,119,.98),rgba(13,31,59,.98)); box-shadow:0 0 0 1px rgba(224,194,123,.25); }
        .owner-categories-language-card-icon { display:grid; place-items:center; width:30px; height:30px; border-radius:9px; background:rgba(220,190,119,.13); color:#e3c77f; }
        .owner-categories-language-card-label { color:#d4deed; font-size:.82rem; font-weight:600; }
        .owner-categories-language-card strong { color:#fff; font-size:1.55rem; line-height:1; }
        .owner-categories-language-card small { color:#aebbd0; font-size:.74rem; }
        @media(max-width:600px) { .owner-categories-language-grid { grid-template-columns:repeat(2,minmax(0,1fr)); } .owner-categories-language-card { min-height:120px; padding:13px; } }
      `}</style>


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
            LANGUAGE CARDS
        ================================================= */}

        <section className="owner-categories-language-section">
          <div className="owner-categories-language-heading">
            <div>
              <h2>Categories by Language</h2>
              <p>Select a language to view its categories.</p>
            </div>
            <span className="owner-categories-language-total">
              <FaGlobe /> {categories.length} Total
            </span>
          </div>

          <div className="owner-categories-language-grid">
            <button
              type="button"
              className={`owner-categories-language-card ${!language ? "active" : ""}`}
              onClick={() => handleLanguageChange({ target: { value: "" } })}
            >
              <span className="owner-categories-language-card-icon"><FaGlobe /></span>
              <span className="owner-categories-language-card-label">All Languages</span>
              <strong>{categories.length}</strong>
              <small>All categories</small>
            </button>

            {LANGUAGES.map((item) => (
              <button
                type="button"
                key={item}
                className={`owner-categories-language-card ${language === item ? "active" : ""}`}
                onClick={() => handleLanguageChange({ target: { value: item } })}
              >
                <span className="owner-categories-language-card-icon"><FaLanguage /></span>
                <span className="owner-categories-language-card-label">{item}</span>
                <strong>{languageCounts[item]}</strong>
                <small>{languageCounts[item] === 1 ? "Category" : "Categories"}</small>
              </button>
            ))}
          </div>
        </section>


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
