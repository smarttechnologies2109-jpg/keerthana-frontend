
import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  FaArrowLeft,
  FaMusic,
  FaRedo,
  FaThLarge,
  FaArrowRight,
} from "react-icons/fa";

import API from "../services/api";
import Sidebar from "../components/Sidebar";

import "../assets/css/categoryDetails.css";

/* =========================================================
   KEERTHANA MUSIC — CATEGORY DETAILS

   Backend:
   GET /api/categories/:id

   Uses the shared API instance configured for AWS ECS.
========================================================= */

function CategoryDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* =========================================================
     LOAD CATEGORY DETAILS
  ========================================================= */

  const loadCategory = useCallback(async () => {
    if (!id) {
      setCategory(null);
      setError("A category ID was not provided.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");
      setCategory(null);

      const response = await API.get(
        `/categories/${encodeURIComponent(id)}`
      );

      const data = response.data;

      if (data?.success === false) {
        throw new Error(
          data?.message || "Unable to load category."
        );
      }

      // Support the expected backend response and common wrappers.
      const categoryData =
        data?.category ||
        data?.data?.category ||
        data?.data ||
        null;

      if (
        !categoryData ||
        categoryData.id === undefined ||
        categoryData.id === null
      ) {
        throw new Error("Category details were not found.");
      }

      setCategory(categoryData);
    } catch (err) {
      console.error("Load category details error:", err);

      setCategory(null);

      setError(
        err?.response?.status === 404
          ? "This category could not be found."
          : err?.response?.data?.message ||
              err?.message ||
              "Unable to load this category. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadCategory();
  }, [loadCategory]);

  /* =========================================================
     NAVIGATION
  ========================================================= */

  const goToCategories = () => {
    navigate("/categories");
  };

  const goToSongs = () => {
    // The current category endpoint returns category metadata
    // and song_count, not the individual songs.
    navigate("/songs");
  };

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="category-details-layout">
      {/* SIDEBAR */}

      <Sidebar />

      {/* MAIN AREA */}

      <main className="category-details-page">
        {/* BACK BUTTON */}

        <button
          type="button"
          className="category-back-button"
          onClick={goToCategories}
        >
          <FaArrowLeft aria-hidden="true" />
          All Categories
        </button>

        {/* LOADING */}

        {loading && (
          <section
            className="categories-status"
            role="status"
            aria-live="polite"
          >
            <span className="categories-spinner" />

            <h2>Loading category</h2>

            <p>Getting your music category details...</p>
          </section>
        )}

        {/* ERROR */}

        {!loading && error && (
          <section
            className="categories-status categories-error"
            role="alert"
          >
            <div className="categories-status-icon">
              <FaThLarge aria-hidden="true" />
            </div>

            <h2>Unable to open category</h2>

            <p>{error}</p>

            <div className="category-detail-actions">
              <button
                type="button"
                className="categories-primary-button"
                onClick={loadCategory}
              >
                <FaRedo aria-hidden="true" />
                Try Again
              </button>

              <button
                type="button"
                className="categories-secondary-button"
                onClick={goToCategories}
              >
                <FaArrowLeft aria-hidden="true" />
                All Categories
              </button>
            </div>
          </section>
        )}

        {/* CATEGORY DETAILS */}

        {!loading && !error && category && (
          <section className="category-detail-card">
            <div className="category-detail-art">
              <FaMusic aria-hidden="true" />
            </div>

            <span className="categories-eyebrow">
              DISCOVER YOUR WORSHIP
            </span>

            <h1>
              {category.name || "Music Category"}
            </h1>

            {category.description && (
              <p className="category-detail-description">
                {category.description}
              </p>
            )}

            <p className="category-detail-count">
              <FaMusic aria-hidden="true" />

              <span>
                {Number(category.song_count || 0)}{" "}
                {Number(category.song_count || 0) === 1
                  ? "song"
                  : "songs"}
              </span>
            </p>

            <div className="category-detail-actions">
              <button
                type="button"
                className="categories-primary-button"
                onClick={goToSongs}
              >
                <FaMusic aria-hidden="true" />
                Browse All Songs
                <FaArrowRight aria-hidden="true" />
              </button>

              <button
                type="button"
                className="categories-secondary-button"
                onClick={goToCategories}
              >
                <FaThLarge aria-hidden="true" />
                All Categories
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default CategoryDetails;
