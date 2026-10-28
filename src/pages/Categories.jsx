
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  FaThLarge,
  FaMusic,
  FaRedo,
  FaArrowRight,
  FaSearch,
} from "react-icons/fa";

import API from "../services/api";
import Sidebar from "../components/Sidebar";
import VoiceSearch from "../components/VoiceSearch";

import "../assets/css/categories.css";

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
  const [voiceLanguage, setVoiceLanguage] = useState("te-IN");

  /* =========================================================
     LOAD CATEGORIES
  ========================================================= */

  const loadCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

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
    } catch (err) {
      console.error("Load categories error:", err);

      setCategories([]);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to load categories. Please check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  /* =========================================================
     SEARCH CATEGORIES
  ========================================================= */

  const filteredCategories = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    if (!searchText) {
      return categories;
    }

    return categories.filter((category) => {
      const name = String(category?.name || "").toLowerCase();

      const description = String(
        category?.description || ""
      ).toLowerCase();

      return (
        name.includes(searchText) ||
        description.includes(searchText)
      );
    });
  }, [categories, search]);

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
    <div className="categories-page">
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
                      {search.trim()
                        ? "No matching categories"
                        : "No categories yet"}
                    </h2>

                    <p>
                      {search.trim()
                        ? "Try another search or clear your search."
                        : "Music categories will appear here when they are added to KEERTHANA."}
                    </p>

                    {search.trim() && (
                      <button
                        type="button"
                        className="categories-secondary-button"
                        onClick={() => setSearch("")}
                      >
                        Clear Search
                      </button>
                    )}

                    {!search.trim() && (
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

                        return (
                          <article
                            key={category.id}
                            className="category-card"
                            role="button"
                            tabIndex={0}
                            aria-label={`Open ${
                              category?.name || "category"
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
                            {/* CARD ICON */}

                            <div className="category-card-top">
                              <span className="category-card-icon">
                                <FaMusic />
                              </span>

                              <FaArrowRight className="category-card-arrow" />
                            </div>

                            {/* CARD INFORMATION */}

                            <div className="category-card-content">
                              <h3>
                                {category?.name ||
                                  "Unnamed Category"}
                              </h3>

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
