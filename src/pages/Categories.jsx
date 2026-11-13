
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  FaThLarge,
  FaMusic,
  FaRedo,
  FaArrowRight,
  FaSearch,
} from "react-icons/fa";

import API from "../services/api";
import { getMediaUrl } from "../utils/media";
import Sidebar from "../components/Sidebar";
import VoiceSearch from "../components/VoiceSearch";

import "../assets/css/categories.css";

/* =========================================================
   CATEGORY NAME HELPERS
========================================================= */

const getCategoryEnglishName = (category) => {
  const english = String(category?.name_english || "").trim();
  const legacy = String(category?.name || "").trim();
  const telugu = String(category?.name_telugu || "").trim();

  if (english) return english;
  if (legacy && legacy !== telugu) return legacy;
  return telugu || legacy || "Unnamed Category";
};

const getCategoryTeluguName = (category) => {
  const telugu = String(category?.name_telugu || "").trim();
  const legacy = String(category?.name || "").trim();
  const english = String(category?.name_english || "").trim();

  if (telugu && telugu !== getCategoryEnglishName(category)) return telugu;
  if (legacy && legacy !== english && legacy !== getCategoryEnglishName(category)) {
    return legacy;
  }
  return "";
};

const getCategoryCoverUrl = (category) => {
  const imagePath =
    category?.image_url ||
    category?.imageUrl ||
    category?.cover_url ||
    category?.image ||
    category?.photo;

  if (!imagePath || typeof imagePath !== "string") return "";

  try {
    return getMediaUrl(imagePath) || "";
  } catch (error) {
    console.error("Category cover URL error:", error);
    return "";
  }
};


/* =========================================================
   LANGUAGE FILTER
========================================================= */

const LANGUAGES = [
  { value: "All", label: "All Languages" },
  { value: "Telugu", label: "తెలుగు" },
  { value: "English", label: "English" },
  { value: "Hindi", label: "हिन्दी" },
  { value: "Malayalam", label: "മലയാളം" },
  { value: "Kannada", label: "ಕನ್ನಡ" },
  { value: "Tamil", label: "தமிழ்" },
];

const LANGUAGE_ALIASES = {
  te: "Telugu",
  "te-in": "Telugu",
  telugu: "Telugu",
  "తెలుగు": "Telugu",
  en: "English",
  "en-in": "English",
  english: "English",
  hi: "Hindi",
  "hi-in": "Hindi",
  hindi: "Hindi",
  "हिन्दी": "Hindi",
  "हिंदी": "Hindi",
  ml: "Malayalam",
  "ml-in": "Malayalam",
  malayalam: "Malayalam",
  "മലയാളം": "Malayalam",
  kn: "Kannada",
  "kn-in": "Kannada",
  kannada: "Kannada",
  "ಕನ್ನಡ": "Kannada",
  ta: "Tamil",
  "ta-in": "Tamil",
  tamil: "Tamil",
  "தமிழ்": "Tamil",
};

const normalizeLanguage = (value) => {
  if (value == null) return "";

  const raw = String(value).trim().toLowerCase();
  return LANGUAGE_ALIASES[raw] || String(value).trim();
};

const getCategoryLanguages = (category) => {
  const rawValues = [
    category?.language,
    category?.category_language,
    category?.language_name,
    category?.language_code,
    category?.primary_language,
    ...(Array.isArray(category?.languages) ? category.languages : []),
    ...(Array.isArray(category?.song_languages) ? category.song_languages : []),
  ];

  const normalized = rawValues
    .flatMap((value) => {
      if (value == null || value === "") return [];

      if (typeof value === "object") {
        return [
          value.language,
          value.name,
          value.code,
          value.language_name,
        ].filter(Boolean);
      }

      return [value];
    })
    .map(normalizeLanguage)
    .filter(Boolean);

  // The categories API may not yet include language metadata.
  // These categories have Telugu names and are assigned to Telugu.
  const hasTeluguName = Boolean(
    String(category?.name_telugu || "").trim()
  );

  if (
    hasTeluguName &&
    !normalized.includes("Telugu")
  ) {
    normalized.push("Telugu");
  }

  return [...new Set(normalized)];
};

/* =========================================================
   KEERTHANA MUSIC — CATEGORIES PAGE

   Backend:
   GET /api/categories

   Expected response:
   {
     success: true,
     count: 2,
     categories: [
       {
         id: 1,
         name: "Worship",
         song_count: 10
       }
     ]
   }
========================================================= */

function Categories() {
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("All");
  const [voiceLanguage, setVoiceLanguage] = useState("te-IN");
  const [refreshing, setRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);

  const requestInProgressRef = useRef(false);
  const categoriesRef = useRef(categories);
  categoriesRef.current = categories;
  const touchStartYRef = useRef(null);
  const pullDistanceRef = useRef(0);

  /* =========================================================
     LOAD CATEGORIES
  ========================================================= */

  const loadCategories = useCallback(async ({ silent = false } = {}) => {
    if (requestInProgressRef.current) return;

    requestInProgressRef.current = true;

    try {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
        setError("");
      }

      // Uses the shared API instance and its configured base URL.
      const response = await API.get("/categories");
      const data = response.data;

      // Support the response formats used by different endpoints.
      const categoryData = Array.isArray(data)
        ? data
        : Array.isArray(data?.categories)
        ? data.categories
        : Array.isArray(data?.data)
        ? data.data
        : [];

      if (data?.success === false) {
        throw new Error(
          data?.message || "Unable to load categories."
        );
      }

      setCategories(categoryData);
      setError("");
    } catch (err) {
      console.error("Load categories error:", err);

      // Keep the currently displayed categories during background refresh.
      if (!silent || categoriesRef.current.length === 0) {
        if (!silent) setCategories([]);
        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Unable to load categories. Please check your connection and try again."
        );
      }
    } finally {
      requestInProgressRef.current = false;
      setLoading(false);
      setRefreshing(false);
      setPullDistance(0);
      pullDistanceRef.current = 0;
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // Refresh only category data when the app returns to the foreground.
  useEffect(() => {
    const handleAppResume = () => {
      loadCategories({ silent: true });
    };

    window.addEventListener("keerthana:app-resume", handleAppResume);
    return () => {
      window.removeEventListener("keerthana:app-resume", handleAppResume);
    };
  }, [loadCategories]);

  /* =========================================================
     PULL DOWN TO REFRESH
  ========================================================= */

  const handleTouchStart = (event) => {
    if (
      window.scrollY <= 0 &&
      event.touches?.length === 1 &&
      !loading &&
      !refreshing
    ) {
      touchStartYRef.current = event.touches[0].clientY;
      pullDistanceRef.current = 0;
    } else {
      touchStartYRef.current = null;
    }
  };

  const handleTouchMove = (event) => {
    if (
      touchStartYRef.current === null ||
      window.scrollY > 0 ||
      loading ||
      refreshing
    ) {
      return;
    }

    const delta = event.touches[0].clientY - touchStartYRef.current;
    const distance = Math.min(Math.max(delta, 0) * 0.5, 84);

    pullDistanceRef.current = distance;
    setPullDistance(distance);
  };

  const handleTouchEnd = () => {
    const shouldRefresh = pullDistanceRef.current >= 58;
    touchStartYRef.current = null;

    if (shouldRefresh && !requestInProgressRef.current) {
      loadCategories({ silent: true });
    } else {
      pullDistanceRef.current = 0;
      setPullDistance(0);
    }
  };

  const handleTouchCancel = () => {
    touchStartYRef.current = null;
    pullDistanceRef.current = 0;
    setPullDistance(0);
  };

  /* =========================================================
     SEARCH CATEGORIES — ENGLISH + TELUGU
     Results are displayed alphabetically by English name.
  ========================================================= */

  const filteredCategories = useMemo(() => {
    const searchText = search.trim().toLocaleLowerCase();

    return [...categories]
      .filter((category) => {
        const searchableValues = [
          category?.name,
          category?.name_english,
          category?.name_telugu,
          category?.description,
        ];

        const matchesSearch =
          !searchText ||
          searchableValues.some((value) =>
            String(value || "")
              .toLocaleLowerCase()
              .includes(searchText)
          );

        const categoryLanguages = getCategoryLanguages(category);
        const matchesLanguage =
          selectedLanguage === "All" ||
          categoryLanguages.includes(selectedLanguage);

        return matchesSearch && matchesLanguage;
      })
      .sort((a, b) =>
        getCategoryEnglishName(a).localeCompare(
          getCategoryEnglishName(b),
          "en",
          { sensitivity: "base", numeric: true }
        )
      );
  }, [categories, search, selectedLanguage]);

  /* =========================================================
     VOICE SEARCH
  ========================================================= */

  const handleVoiceSearch = (recognizedText) => {
    setSearch(recognizedText);
  };

  /* =========================================================
     OPEN CATEGORY
  ========================================================= */

  const openCategory = (category) => {
    if (
      category?.id === undefined ||
      category?.id === null ||
      category.id === ""
    ) {
      return;
    }

    navigate(
      `/categories/${encodeURIComponent(category.id)}`
    );
  };

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div
      className="categories-page"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
    >
      {(pullDistance > 0 || refreshing) && (
        <div
          className="categories-pull-refresh"
          role="status"
          aria-live="polite"
          style={{
            position: "fixed",
            top: "12px",
            left: "50%",
            zIndex: 1000,
            transform: `translate(-50%, ${Math.min(pullDistance, 58)}px)`,
            display: "flex",
            alignItems: "center",
            gap: "9px",
            padding: "10px 16px",
            borderRadius: "999px",
            background: "#101d35",
            color: "#f5f7fb",
            border: "1px solid rgba(212, 175, 55, 0.55)",
            boxShadow: "0 8px 24px rgba(0,0,0,0.24)",
            pointerEvents: "none",
          }}
        >
          <span
            className="categories-spinner"
            style={{ width: "16px", height: "16px" }}
          />
          <span>{refreshing ? "Refreshing categories..." : "Release to refresh"}</span>
        </div>
      )}
      {/* SIDEBAR */}

      <Sidebar />

      {/* MAIN AREA */}

      <div className="categories-main">
        <div className="categories-body">
          {/* LOADING */}

          {loading && (
            <div
              className="categories-status"
              role="status"
              aria-live="polite"
            >
              <span className="categories-spinner" />

              <h2>Loading categories...</h2>

              <p>Preparing your music collection.</p>
            </div>
          )}

          {/* ERROR */}

          {!loading && error && (
            <div
              className="categories-status categories-error"
              role="alert"
            >
              <div className="categories-status-icon">
                <FaThLarge />
              </div>

              <h2>Categories unavailable</h2>

              <p>{error}</p>

              <button
                type="button"
                className="categories-primary-button"
                onClick={loadCategories}
              >
                <FaRedo />
                Try Again
              </button>
            </div>
          )}

          {/* CONTENT */}

          {!loading && !error && (
            <>
              {/* HERO */}

              <section className="categories-hero">
                <div className="categories-hero-content">
                  <div className="categories-hero-icon">
                    <FaThLarge />
                  </div>

                  <div className="categories-hero-copy">
                    <span className="categories-eyebrow">
                      DISCOVER YOUR WORSHIP
                    </span>

                    <h1>Music Categories</h1>

                    <p>
                      Explore Christian music by category and
                      find songs for every moment of worship.
                    </p>
                  </div>
                </div>
              </section>

              {/* CATEGORIES CONTENT */}

              <section className="categories-content">
                {/* VOICE SEARCH */}

                <div
                  className="categories-voice-search-section"
                  aria-label="Search categories"
                >
                  <VoiceSearch
                    value={search}
                    onChange={setSearch}
                    onSearch={handleVoiceSearch}
                    language={voiceLanguage}
                    onLanguageChange={setVoiceLanguage}
                    placeholder="Search music categories..."
                    ariaLabel="Search music categories"
                  />
                </div>

                {/* LANGUAGE DROPDOWN — DEFAULT: ALL LANGUAGES */}

                <div
                  className="categories-filter-bar"
                  aria-label="Filter categories by language"
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    alignItems: "center",
                    gap: "10px",
                    width: "100%",
                    margin: "14px 0 18px",
                  }}
                >
                  <label
                    htmlFor="categories-language-filter"
                    style={{
                      color: "var(--text-secondary, #aebbd0)",
                      fontSize: "13px",
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                    }}
                  >
                    Language
                  </label>

                  <select
                    id="categories-language-filter"
                    className="categories-language-select"
                    value={selectedLanguage}
                    onChange={(event) =>
                      setSelectedLanguage(event.target.value)
                    }
                    style={{
                      minWidth: "160px",
                      maxWidth: "100%",
                      padding: "11px 36px 11px 13px",
                      borderRadius: "12px",
                      border: "1px solid rgba(212, 175, 55, 0.38)",
                      background: "#101d35",
                      color: "#f5f7fb",
                      fontSize: "14px",
                      fontWeight: 600,
                      cursor: "pointer",
                      outline: "none",
                    }}
                  >
                    {LANGUAGES.map((language) => (
                      <option
                        key={language.value}
                        value={language.value}
                        style={{
                          background: "#101d35",
                          color: "#f5f7fb",
                        }}
                      >
                        {language.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* HEADING AND COUNT */}

                <div className="categories-heading">
                  <div>
                    <h2>Explore Categories</h2>

                    <p>
                      {filteredCategories.length}{" "}
                      {filteredCategories.length === 1
                        ? "category"
                        : "categories"}
                    </p>
                  </div>

                  <div className="categories-total">
                    <span className="categories-total-number">
                      {categories.length}
                    </span>

                    <span>
                      {categories.length === 1
                        ? "Category"
                        : "Categories"}
                    </span>
                  </div>
                </div>

                {/* EMPTY STATE */}

                {filteredCategories.length === 0 ? (
                  <div className="categories-status">
                    <div className="categories-status-icon">
                      {search.trim() ? (
                        <FaSearch />
                      ) : (
                        <FaThLarge />
                      )}
                    </div>

                    <h2>
                      {search.trim() || selectedLanguage !== "All"
                        ? "No matching categories"
                        : "No categories yet"}
                    </h2>

                    <p>
                      {search.trim() || selectedLanguage !== "All"
                        ? "Try another search or choose All Languages."
                        : "Music categories will appear here when they are added to KEERTHANA."}
                    </p>

                    {(search.trim() || selectedLanguage !== "All") && (
                      <button
                        type="button"
                        className="categories-secondary-button"
                        onClick={() => {
                          setSearch("");
                          setSelectedLanguage("All");
                        }}
                      >
                        Clear Filters
                      </button>
                    )}

                    {!search.trim() && selectedLanguage === "All" && (
                      <button
                        type="button"
                        className="categories-secondary-button"
                        onClick={loadCategories}
                      >
                        <FaRedo />
                        Refresh Categories
                      </button>
                    )}
                  </div>
                ) : (
                  /* CATEGORY GRID */

                  <div
                    className="categories-grid"
                    aria-label="Available music categories"
                  >
                    {filteredCategories.map(
                      (category, index) => {
                        const songCount = Number(
                          category?.song_count || 0
                        );
                        const categoryCover = getCategoryCoverUrl(category);

                        return (
                          <article
                            key={category.id}
                            className="category-card"
                            role="button"
                            tabIndex={0}
                            aria-label={`Open ${getCategoryEnglishName(
                              category
                            )}${
                              getCategoryTeluguName(category)
                                ? `, ${getCategoryTeluguName(category)}`
                                : ""
                            }, ${songCount} ${
                              songCount === 1 ? "song" : "songs"
                            }`}
                            onClick={() =>
                              openCategory(category)
                            }
                            onKeyDown={(event) => {
                              if (
                                event.key === "Enter" ||
                                event.key === " "
                              ) {
                                event.preventDefault();
                                openCategory(category);
                              }
                            }}
                            style={{
                              "--category-index": index % 10,
                            }}
                          >
                            {/* CATEGORY COVER IMAGE */}

                            <div className="category-card-top">
                              {categoryCover ? (
                                <img
                                  className="category-card-cover"
                                  src={categoryCover}
                                  alt={`${getCategoryEnglishName(category)} category cover`}
                                  loading="lazy"
                                  onError={(event) => {
                                    console.error(
                                      "Category cover failed to load:",
                                      categoryCover
                                    );
                                    event.currentTarget.style.display = "none";
                                  }}
                                  style={{
                                    display: "block",
                                    width: "100%",
                                    height: "150px",
                                    objectFit: "cover",
                                    borderRadius: "14px",
                                  }}
                                />
                              ) : (
                                <span className="category-card-icon">
                                  <FaMusic />
                                </span>
                              )}

                              <FaArrowRight className="category-card-arrow" />
                            </div>

                            {/* CARD INFORMATION */}

                            <div className="category-card-content">
                              <div className="category-card-names">
                                <h3>{getCategoryEnglishName(category)}</h3>

                                {getCategoryTeluguName(category) && (
                                  <p className="category-telugu-name">
                                    {getCategoryTeluguName(category)}
                                  </p>
                                )}
                              </div>

                              {category?.description && (
                                <p className="category-card-description">
                                  {category.description}
                                </p>
                              )}

                              <div className="category-card-footer">
                                <span className="category-song-count">
                                  <FaMusic />
                                  {songCount}{" "}
                                  {songCount === 1
                                    ? "song"
                                    : "songs"}
                                </span>

                                <span className="category-explore-label">
                                  Explore music
                                </span>
                              </div>
                            </div>

                            <div className="category-card-accent" />
                          </article>
                        );
                      }
                    )}
                  </div>
                )}

                {/* REFRESH */}

                {filteredCategories.length > 0 && (
                  <div className="categories-footer">
                    <button
                      type="button"
                      className="categories-refresh-button"
                      onClick={loadCategories}
                      disabled={loading}
                    >
                      <FaRedo />
                      Refresh Categories
                    </button>
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Categories;
