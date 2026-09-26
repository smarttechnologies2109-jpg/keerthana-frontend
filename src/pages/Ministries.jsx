import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  FaChurch,
  FaMusic,
  FaArrowRight,
  FaSearch,
} from "react-icons/fa";

import API from "../services/api";

import Sidebar from "../components/Sidebar";
import Header from "../components/Header";

import "../assets/css/ministries.css";

function Ministries() {
  const navigate = useNavigate();

  const [ministries, setMinistries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  /* =========================================================
     LOAD MINISTRIES
  ========================================================= */

  useEffect(() => {
    loadMinistries();
  }, []);

  const loadMinistries = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await API.get("/ministries");

      const data = response.data;

      const ministryData = Array.isArray(data)
        ? data
        : Array.isArray(data?.ministries)
        ? data.ministries
        : Array.isArray(data?.data)
        ? data.data
        : [];

      setMinistries(ministryData);
    } catch (err) {
      console.error("Load ministries error:", err);

      setError(
        err?.response?.data?.message ||
          "Unable to load ministries"
      );
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     SEARCH
  ========================================================= */

  const searchText = search.trim().toLowerCase();

  const filteredMinistries = ministries.filter((ministry) => {
    if (!searchText) {
      return true;
    }

    const name = String(ministry?.name || "").toLowerCase();

    const description = String(
      ministry?.description || ""
    ).toLowerCase();

    return (
      name.includes(searchText) ||
      description.includes(searchText)
    );
  });

  /* =========================================================
     OPEN MINISTRY
  ========================================================= */

  const openMinistry = (ministry) => {
    if (!ministry?.id) {
      return;
    }

    navigate(`/ministries/${ministry.id}`);
  };

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="ministries-page">

      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <Sidebar />

      {/* =====================================================
          MAIN AREA
      ===================================================== */}

      <div className="ministries-main">

        {/* ===================================================
            HEADER
        =================================================== */}

        <Header />

        {/* ===================================================
            PAGE BODY
        =================================================== */}

        <div className="ministries-body">

          {/* =================================================
              LOADING
          ================================================= */}

          {loading && (
            <div className="ministries-loading">

              <div className="ministries-spinner"></div>

              <p>
                Loading ministries...
              </p>

            </div>
          )}

          {/* =================================================
              ERROR
          ================================================= */}

          {!loading && error && (
            <div className="ministries-error">

              <div className="ministries-error-icon">
                <FaChurch />
              </div>

              <h2>
                Unable to load ministries
              </h2>

              <p>
                {error}
              </p>

              <button
                type="button"
                onClick={loadMinistries}
              >
                Try Again
              </button>

            </div>
          )}

          {/* =================================================
              CONTENT
          ================================================= */}

          {!loading && !error && (
            <>

              {/* =============================================
                  HERO
              ============================================= */}

              <section className="ministries-hero">

                <div className="ministries-hero-content">

                  <div className="ministries-hero-icon">
                    <FaChurch />
                  </div>

                  <div className="ministries-hero-text">

                    <span className="ministries-eyebrow">
                      KEERTHANA
                    </span>

                    <h1>
                      Ministries
                    </h1>

                    <p>
                      Explore Christian music from
                      different ministries and worship
                      communities.
                    </p>

                  </div>

                </div>

                {/* =========================================
                    SEARCH
                ========================================= */}

                <div className="ministries-search">

                  <FaSearch />

                  <input
                    type="text"
                    placeholder="Search ministries..."
                    value={search}
                    onChange={(e) =>
                      setSearch(e.target.value)
                    }
                    aria-label="Search ministries"
                  />

                </div>

              </section>

              {/* =============================================
                  MINISTRIES CONTENT
              ============================================= */}

              <section className="ministries-content">

                {/* =========================================
                    HEADING
                ========================================= */}

                <div className="ministries-heading">

                  <div>
                    <h2>
                      Discover Ministries
                    </h2>

                    <p>
                      {filteredMinistries.length}{" "}
                      {filteredMinistries.length === 1
                        ? "ministry"
                        : "ministries"}
                    </p>
                  </div>

                </div>

                {/* =========================================
                    EMPTY
                ========================================= */}

                {filteredMinistries.length === 0 ? (

                  <div className="ministries-empty">

                    <div className="ministries-empty-icon">
                      <FaChurch />
                    </div>

                    <h3>
                      No ministries found
                    </h3>

                    <p>
                      {search
                        ? "Try a different search."
                        : "No ministries have been added yet."}
                    </p>

                    {search && (
                      <button
                        type="button"
                        onClick={() => setSearch("")}
                      >
                        Clear Search
                      </button>
                    )}

                  </div>

                ) : (

                  /* =========================================
                     GRID
                  ========================================= */

                  <div className="ministries-grid">

                    {filteredMinistries.map((ministry) => {

                      const image =
                        ministry?.image_url ||
                        ministry?.image ||
                        ministry?.logo ||
                        ministry?.profile_image ||
                        null;

                      return (
                        <article
                          key={ministry.id}
                          className="ministry-card"
                          onClick={() =>
                            openMinistry(ministry)
                          }
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (
                              e.key === "Enter" ||
                              e.key === " "
                            ) {
                              openMinistry(ministry);
                            }
                          }}
                        >

                          {/* =================================
                              CARD IMAGE
                          ================================= */}

                          <div className="ministry-card-image">

                            {image && (
                              <img
                                src={image}
                                alt={
                                  ministry?.name ||
                                  "Ministry"
                                }
                                loading="lazy"
                                onError={(e) => {
                                  e.currentTarget.style.display =
                                    "none";

                                  e.currentTarget
                                    .nextElementSibling
                                    ?.classList.add("show");
                                }}
                              />
                            )}

                            <div
                              className={`ministry-card-placeholder ${
                                image ? "" : "show"
                              }`}
                            >
                              <FaChurch />
                            </div>

                            <div className="ministry-card-overlay">

                              <span>
                                <FaMusic />
                              </span>

                            </div>

                          </div>

                          {/* =================================
                              CARD INFO
                          ================================= */}

                          <div className="ministry-card-info">

                            <h3>
                              {ministry?.name ||
                                "Unnamed Ministry"}
                            </h3>

                            {ministry?.description && (
                              <p>
                                {ministry.description}
                              </p>
                            )}

                            <div className="ministry-card-footer">

                              <span>
                                Explore music
                              </span>

                              <FaArrowRight />

                            </div>

                          </div>

                        </article>
                      );
                    })}

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

export default Ministries;