
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  FaChurch,
  FaMusic,
  FaArrowRight,
} from "react-icons/fa";

import API from "../services/api";
import Sidebar from "../components/Sidebar";
import VoiceSearch from "../components/VoiceSearch";

import "../assets/css/ministries.css";

/* =========================================================
   BILINGUAL MINISTRY NAME HELPERS
========================================================= */

const getMinistryEnglishName = (ministry) => {
  const english = String(ministry?.name_english || ministry?.nameEnglish || "").trim();
  const legacy = String(ministry?.name || "").trim();
  const telugu = String(ministry?.name_telugu || "").trim();

  if (english) return english;
  if (legacy && legacy !== telugu) return legacy;
  return telugu || legacy || "Unnamed Ministry";
};

const getMinistryTeluguName = (ministry) => {
  const telugu = String(ministry?.name_telugu || "").trim();
  const english = getMinistryEnglishName(ministry);
  const legacy = String(ministry?.name || "").trim();

  if (telugu && telugu !== english) return telugu;
  if (legacy && legacy !== english) return legacy;
  return "";
};

function Ministries() {
  const navigate = useNavigate();

  const [ministries, setMinistries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [voiceLanguage, setVoiceLanguage] = useState("te-IN");

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
     VOICE SEARCH
  ========================================================= */

  const handleVoiceSearch = (recognizedText) => {
    setSearch(recognizedText);
  };

  /* =========================================================
     SEARCH + ALPHABETICAL ORDER (A-Z)
     Search English/Telugu names and descriptions.
  ========================================================= */

  const ministryNameCollator = new Intl.Collator("en", {
    usage: "sort",
    sensitivity: "base",
    numeric: true,
    ignorePunctuation: true,
  });

  const filteredMinistries = useMemo(() => {
    const searchText = search.trim().toLocaleLowerCase();

    return [...ministries]
      .filter((ministry) => {
        if (!searchText) return true;

        return [
          ministry?.name,
          ministry?.name_english,
          ministry?.nameEnglish,
          ministry?.name_telugu,
          ministry?.nameTelugu,
          ministry?.description,
        ].some((value) =>
          String(value || "").toLocaleLowerCase().includes(searchText)
        );
      })
      .sort((a, b) =>
        ministryNameCollator.compare(
          getMinistryEnglishName(a),
          getMinistryEnglishName(b)
        )
      );
  }, [ministries, search]);

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
      {/* SIDEBAR */}

      <Sidebar />

      {/* MAIN AREA */}

      <div className="ministries-main">
        <div className="ministries-body">
          {/* LOADING */}

          {loading && (
            <div className="ministries-loading">
              <div className="ministries-spinner"></div>
              <p>Loading ministries...</p>
            </div>
          )}

          {/* ERROR */}

          {!loading && error && (
            <div className="ministries-error">
              <div className="ministries-error-icon">
                <FaChurch />
              </div>

              <h2>Unable to load ministries</h2>
              <p>{error}</p>

              <button
                type="button"
                onClick={loadMinistries}
              >
                Try Again
              </button>
            </div>
          )}

          {/* CONTENT */}

          {!loading && !error && (
            <>
              {/* HERO */}

              <section className="ministries-hero">
                <div className="ministries-hero-content">
                  <div className="ministries-hero-icon">
                    <FaChurch />
                  </div>

                  <div className="ministries-hero-text">
                    <span className="ministries-eyebrow">
                      KEERTHANA
                    </span>

                    <h1>Ministries</h1>

                    <p>
                      Explore Christian music from different
                      ministries and worship communities.
                    </p>
                  </div>
                </div>
              </section>

              {/* MINISTRIES CONTENT */}

              <section className="ministries-content">
                {/* VOICE SEARCH */}

                <div
                  className="ministries-voice-search-section"
                  aria-label="Search ministries"
                >
                  <VoiceSearch
                    value={search}
                    onChange={setSearch}
                    onSearch={handleVoiceSearch}
                    language={voiceLanguage}
                    onLanguageChange={setVoiceLanguage}
                    placeholder="Search ministries..."
                    ariaLabel="Search ministries"
                  />
                </div>

                {/* HEADING AND RESULT COUNT */}

                <div className="ministries-heading">
                  <div>
                    <h2>Discover Ministries</h2>

                    <p>
                      {filteredMinistries.length}{" "}
                      {filteredMinistries.length === 1
                        ? "ministry"
                        : "ministries"}
                    </p>
                  </div>
                </div>

                {/* EMPTY STATE */}

                {filteredMinistries.length === 0 ? (
                  <div className="ministries-empty">
                    <div className="ministries-empty-icon">
                      <FaChurch />
                    </div>

                    <h3>No ministries found</h3>

                    <p>
                      {search.trim()
                        ? "Try a different search."
                        : "No ministries have been added yet."}
                    </p>

                    {search.trim() && (
                      <button
                        type="button"
                        onClick={() => setSearch("")}
                      >
                        Clear Search
                      </button>
                    )}
                  </div>
                ) : (
                  /* MINISTRIES GRID */

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
                          onClick={() => openMinistry(ministry)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (
                              e.key === "Enter" ||
                              e.key === " "
                            ) {
                              e.preventDefault();
                              openMinistry(ministry);
                            }
                          }}
                        >
                          {/* CARD IMAGE */}

                          <div className="ministry-card-image">
                            {image && (
                              <img
                                src={image}
                                alt={`${getMinistryEnglishName(ministry)} ministry`}
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

                          {/* CARD INFORMATION */}

                          <div className="ministry-card-info">
                            <div className="ministry-card-names">
                              <h3>{getMinistryEnglishName(ministry)}</h3>

                              {getMinistryTeluguName(ministry) && (
                                <p className="ministry-card-telugu-name">
                                  {getMinistryTeluguName(ministry)}
                                </p>
                              )}
                            </div>

                            {ministry?.description && (
                              <p>{ministry.description}</p>
                            )}

                            <div className="ministry-card-footer">
                              <span>Explore music</span>
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
