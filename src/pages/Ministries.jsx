
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

/* =========================================================
   LANGUAGE FILTER HELPERS
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

const getMinistryLanguages = (ministry) => {
  const rawValues = [
    ministry?.language,
    ministry?.ministry_language,
    ministry?.language_name,
    ministry?.language_code,
    ministry?.primary_language,
    ...(Array.isArray(ministry?.languages) ? ministry.languages : []),
    ...(Array.isArray(ministry?.song_languages) ? ministry.song_languages : []),
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

  // Fallback for existing Telugu ministries whose API response
  // contains bilingual names but does not yet include language metadata.
  if (
    String(ministry?.name_telugu || ministry?.nameTelugu || "").trim() &&
    !normalized.includes("Telugu")
  ) {
    normalized.push("Telugu");
  }

  return [...new Set(normalized)];
};

function Ministries() {
  const navigate = useNavigate();

  const [ministries, setMinistries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("All");
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
        const searchableValues = [
          ministry?.name,
          ministry?.name_english,
          ministry?.nameEnglish,
          ministry?.name_telugu,
          ministry?.nameTelugu,
          ministry?.description,
        ];

        const matchesSearch =
          !searchText ||
          searchableValues.some((value) =>
            String(value || "").toLocaleLowerCase().includes(searchText)
          );

        const ministryLanguages = getMinistryLanguages(ministry);
        const matchesLanguage =
          selectedLanguage === "All" ||
          ministryLanguages.includes(selectedLanguage);

        return matchesSearch && matchesLanguage;
      })
      .sort((a, b) =>
        ministryNameCollator.compare(
          getMinistryEnglishName(a),
          getMinistryEnglishName(b)
        )
      );
  }, [ministries, search, selectedLanguage]);

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

                {/* LANGUAGE DROPDOWN — DEFAULT: ALL LANGUAGES */}

                <div
                  className="ministries-filter-bar"
                  aria-label="Filter ministries by language"
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
                    htmlFor="ministries-language-filter"
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
                    id="ministries-language-filter"
                    className="ministries-language-select"
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
                      {search.trim() || selectedLanguage !== "All"
                        ? "Try another search or choose All Languages."
                        : "No ministries have been added yet."}
                    </p>

                    {(search.trim() || selectedLanguage !== "All") && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearch("");
                          setSelectedLanguage("All");
                        }}
                      >
                        Clear Filters
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
