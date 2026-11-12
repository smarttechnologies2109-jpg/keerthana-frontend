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

import "../../assets/css/businessowner/BusinessOwnerMinistries.css";


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
   NORMALIZE LANGUAGE VALUES
   Handles case, spaces and common language codes.
========================================================= */

const normalizeLanguage = (value) => {
  const raw = String(value ?? "").trim().toLowerCase();

  if (!raw) return "";

  const aliases = {
    te: "Telugu",
    "te-in": "Telugu",
    telugu: "Telugu",
    "తెలుగు": "Telugu",
    hi: "Hindi",
    "hi-in": "Hindi",
    hindi: "Hindi",
    en: "English",
    "en-in": "English",
    english: "English",
    ml: "Malayalam",
    "ml-in": "Malayalam",
    malayalam: "Malayalam",
    kn: "Kannada",
    "kn-in": "Kannada",
    kannada: "Kannada",
    ta: "Tamil",
    "ta-in": "Tamil",
    tamil: "Tamil",
  };

  if (aliases[raw]) return aliases[raw];

  // Accept values such as "TELUGU (te)", "te_IN", and "te-IN".
  const compact = raw.replace(/_/g, "-");
  if (aliases[compact]) return aliases[compact];

  const code = compact.split(/[-\s(]/)[0];
  if (aliases[code]) return aliases[code];

  return LANGUAGES.find(
    (item) => item.toLowerCase() === raw
  ) || "";
};

const firstNonEmpty = (...values) => {
  for (const value of values) {
    if (value === null || value === undefined) continue;

    if (typeof value === "object") {
      const nested = value.name || value.label || value.code || value.value;
      if (nested !== null && nested !== undefined && String(nested).trim()) {
        return nested;
      }
      continue;
    }

    if (String(value).trim()) return value;
  }

  return "";
};

const getMinistryLanguage = (ministry) => {
  const raw = firstNonEmpty(
    ministry?.language,
    ministry?.language_name,
    ministry?.languageName,
    ministry?.language_code,
    ministry?.languageCode,
    ministry?.primary_language,
    ministry?.primaryLanguage,
    ministry?.song_language,
    ministry?.ministry_language,
    ministry?.ministryLanguage,
    ministry?.language_label,
    ministry?.languageLabel,
    ministry?.lang
  );

  const normalized = normalizeLanguage(raw);
  if (normalized) return normalized;
  if (String(raw || "").includes("తెలుగు")) return "Telugu";

  const relatedLanguages = Array.isArray(ministry?.languages)
    ? ministry.languages
    : [];

  for (const item of relatedLanguages) {
    const match = normalizeLanguage(item);
    if (match) return match;
    if (String(item || "").includes("తెలుగు")) return "Telugu";
  }

  // Current Admin ministry records are Telugu; the owner API may omit language.
  return "Telugu";
};

const getMinistryNames = (ministry) => {
  const translations = ministry?.translations || {};
  const names = ministry?.names || {};
  const nested = ministry?.ministry || {};

  const englishName = String(firstNonEmpty(
    ministry?.name_english,
    ministry?.english_name,
    ministry?.nameEnglish,
    ministry?.ministry_name_english,
    ministry?.ministryNameEnglish,
    ministry?.ministry_name_en,
    ministry?.ministryNameEn,
    ministry?.english_ministry_name,
    ministry?.ministry_english_name,
    ministry?.name_en,
    ministry?.nameEn,
    ministry?.englishName,
    ministry?.title_english,
    ministry?.title_en,
    ministry?.en_name,
    ministry?.name_in_english,
    nested?.name_english,
    nested?.english_name,
    nested?.ministry_name_english,
    nested?.name_en,
    names?.english,
    names?.en,
    names?.English,
    translations?.en,
    translations?.english,
    translations?.English
  )).trim();

  const teluguName = String(firstNonEmpty(
    ministry?.name_telugu,
    ministry?.telugu_name,
    ministry?.nameTelugu,
    ministry?.ministry_name_telugu,
    ministry?.ministryNameTelugu,
    ministry?.ministry_name_te,
    ministry?.telugu_ministry_name,
    ministry?.ministry_telugu_name,
    ministry?.name_te,
    ministry?.nameTe,
    ministry?.teluguName,
    ministry?.name_in_telugu,
    nested?.name_telugu,
    nested?.telugu_name,
    nested?.ministry_name_telugu,
    nested?.name_te,
    names?.telugu,
    names?.te,
    names?.Telugu,
    translations?.te,
    translations?.telugu,
    translations?.Telugu
  )).trim();

  const generalCandidates = [
    ministry?.name,
    ministry?.ministry_name,
    ministry?.ministryName,
    ministry?.title,
    nested?.name,
    nested?.ministry_name,
    nested?.title
  ].map((value) => String(value ?? "").trim()).filter(Boolean);

  const generalEnglish = generalCandidates.find(
    (value) => !/[\u0C00-\u0C7F]/.test(value)
  ) || "";
  const generalTelugu = generalCandidates.find(
    (value) => /[\u0C00-\u0C7F]/.test(value)
  ) || "";

  const displayEnglish = englishName || generalEnglish;
  const displayTelugu = teluguName || generalTelugu;

  return {
    english: displayEnglish,
    telugu: displayTelugu,
    fallback: displayEnglish || displayTelugu || "Unnamed Ministry"
  };
};

const extractMinistryArray = (payload) => {
  if (Array.isArray(payload)) return payload;

  const candidates = [
    payload?.ministries,
    payload?.data,
    payload?.results,
    payload?.items,
    payload?.records,
    payload?.data?.ministries,
    payload?.data?.results,
    payload?.data?.items,
    payload?.data?.records,
    payload?.result?.ministries,
    payload?.result?.data,
    payload?.response?.ministries,
    payload?.response?.data,
    payload?.data?.data?.ministries,
  ];

  return candidates.find(Array.isArray) || [];
};


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


    setLanguage(
      normalizeLanguage(urlLanguage)
    );

  }, [location.search]);


  /* =======================================================
     LOAD MINISTRIES
  ======================================================= */

  useEffect(() => {

    const loadMinistries = async () => {

      try {

        setLoading(true);
        setError("");

// Load the complete ministry collection once.
        // Language filtering and counts are handled consistently
        // on the frontend, so selecting a language cannot hide
        // matching records because of backend case differences.
        const response = await API.get(
          "/owner/music/ministries"
        );


        const data = response?.data;
        const ministryRows = extractMinistryArray(data);

        // Keep the original API objects intact. The helper functions
        // above normalize the language/name field variations for display.
        setMinistries(ministryRows);

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

          const names = getMinistryNames(ministry);

          const searchableNames = [
            names.english,
            names.telugu,
            names.fallback,
            ministry?.name,
            ministry?.ministry_name,
            ministry?.ministryName,
            ministry?.name_english,
            ministry?.english_name,
            ministry?.ministry_name_english,
            ministry?.ministry_name_en,
            ministry?.name_telugu,
            ministry?.telugu_name,
            ministry?.ministry_name_telugu,
            ministry?.ministry_name_te,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          const description = String(
            ministry?.description || ""
          ).toLowerCase();

          const ministryLanguage = getMinistryLanguage(ministry);

          const matchesSearch =
            !searchText ||
            searchableNames.includes(searchText) ||
            description.includes(searchText);


          const matchesLanguage =
            !language ||
            ministryLanguage === normalizeLanguage(language);


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
     LANGUAGE-WISE MINISTRY COUNTS
  ======================================================= */

  const languageCounts = useMemo(() => {
    const counts = Object.fromEntries(
      LANGUAGES.map((item) => [item, 0])
    );

    ministries.forEach((ministry) => {
      const normalized = getMinistryLanguage(ministry);

      if (normalized && Object.prototype.hasOwnProperty.call(counts, normalized)) {
        counts[normalized] += 1;
      }
    });

    return counts;
  }, [ministries]);


  /* =======================================================
     SELECT LANGUAGE
  ======================================================= */

  const selectLanguage = (selectedLanguage) => {
    const normalized = normalizeLanguage(selectedLanguage);

    setLanguage(normalized);

    if (normalized) {
      navigate(
        `/owner/music/ministries?language=${encodeURIComponent(normalized)}`,
        { replace: true }
      );
    } else {
      navigate("/owner/music/ministries", { replace: true });
    }
  };


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

  const handleLanguageChange = (event) => {
    selectLanguage(event.target.value);
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

      <style>{`
        .owner-ministries-language-section {
          width: min(1440px, calc(100% - 48px));
          margin: 0 auto 28px;
          padding: 24px;
          border: 1px solid rgba(212, 175, 110, 0.18);
          border-radius: 20px;
          background: linear-gradient(135deg, rgba(10, 24, 52, 0.96), rgba(17, 39, 78, 0.92));
          box-shadow: 0 14px 38px rgba(0, 0, 0, 0.18);
        }
        .owner-ministries-language-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 20px;
        }
        .owner-ministries-language-heading h2 {
          margin: 0 0 6px;
          color: #f4e5c4;
          font-size: 20px;
          font-weight: 750;
        }
        .owner-ministries-language-heading p {
          margin: 0;
          color: #b8c5dc;
          font-size: 13px;
        }
        .owner-ministries-language-heading > span {
          color: #e8c98d;
          font-size: 12px;
          font-weight: 700;
          white-space: nowrap;
        }
        .owner-ministries-language-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(145px, 1fr));
          gap: 12px;
        }
        .owner-ministries-language-card {
          display: flex;
          min-height: 116px;
          flex-direction: column;
          align-items: flex-start;
          justify-content: center;
          gap: 5px;
          padding: 16px;
          border: 1px solid rgba(167, 190, 226, 0.16);
          border-radius: 15px;
          background: rgba(255, 255, 255, 0.055);
          color: #fff;
          text-align: left;
          cursor: pointer;
          transition: transform 180ms ease, border-color 180ms ease, background 180ms ease;
        }
        .owner-ministries-language-card:hover {
          transform: translateY(-3px);
          border-color: rgba(232, 201, 141, 0.65);
          background: rgba(47, 86, 151, 0.3);
        }
        .owner-ministries-language-card.active {
          border-color: #e8c98d;
          background: linear-gradient(135deg, rgba(37, 77, 143, 0.72), rgba(21, 46, 91, 0.9));
          box-shadow: inset 0 0 0 1px rgba(232, 201, 141, 0.18), 0 8px 22px rgba(0, 0, 0, 0.16);
        }
        .owner-ministries-language-card-label {
          color: #dce6f6;
          font-size: 13px;
          font-weight: 650;
        }
        .owner-ministries-language-card strong {
          color: #f1d49c;
          font-size: 27px;
          line-height: 1.1;
        }
        .owner-ministries-language-card small {
          color: #aebed7;
          font-size: 11px;
        }
        .owner-ministry-bilingual-name {
          display: flex;
          flex-direction: column;
          gap: 5px;
          min-width: 0;
        }
        .owner-ministry-name-english {
          margin: 0;
          color: #f7f8fc;
          font-size: 17px;
          font-weight: 750;
          line-height: 1.3;
          overflow-wrap: anywhere;
        }
        .owner-ministry-name-telugu {
          margin: 0;
          color: #e8c98d;
          font-size: 15px;
          font-weight: 650;
          line-height: 1.4;
          overflow-wrap: anywhere;
        }
        .owner-ministry-name-caption {
          color: #9fb0ca;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.07em;
          text-transform: uppercase;
        }
        @media (max-width: 640px) {
          .owner-ministries-language-section {
            width: calc(100% - 28px);
            padding: 17px;
          }
          .owner-ministries-language-heading {
            align-items: flex-start;
            flex-direction: column;
          }
          .owner-ministries-language-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
      `}</style>


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
          LANGUAGE-WISE MINISTRY CARDS
      ================================================= */}

      <section className="owner-ministries-language-section">
        <div className="owner-ministries-language-heading">
          <div>
            <h2>Ministries by Language</h2>
            <p>Select a language to view its ministries.</p>
          </div>
          <span>{ministries.length} Total Ministries</span>
        </div>

        <div className="owner-ministries-language-grid">
          <button
            type="button"
            className={`owner-ministries-language-card ${
              !language ? "active" : ""
            }`}
            onClick={() => selectLanguage("")}
          >
            <span className="owner-ministries-language-card-label">
              All Languages
            </span>
            <strong>{ministries.length}</strong>
            <small>All ministries</small>
          </button>

          {LANGUAGES.map((item) => (
            <button
              type="button"
              key={item}
              className={`owner-ministries-language-card ${
                normalizeLanguage(language) === item ? "active" : ""
              }`}
              onClick={() => selectLanguage(item)}
            >
              <span className="owner-ministries-language-card-label">
                {item}
              </span>
              <strong>{languageCounts[item] || 0}</strong>
              <small>
                {languageCounts[item] === 1 ? "Ministry" : "Ministries"}
              </small>
            </button>
          ))}
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
                    key={ministry.id || ministry.ministry_id || ministry.uuid || getMinistryNames(ministry).fallback}
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
                          getMinistryNames(ministry).fallback
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

                        {(() => {
                          const names = getMinistryNames(ministry);

                          return (
                            <div className="owner-ministry-bilingual-name">
                              <span className="owner-ministry-name-caption">
                                Ministry Name
                              </span>

                              <h2 className="owner-ministry-name-english">
                                {names.english || "English name not provided by API"}
                              </h2>

                              {names.telugu && (
                                <p className="owner-ministry-name-telugu">
                                  {names.telugu}
                                </p>
                              )}
                            </div>
                          );
                        })()}

                        {getMinistryLanguage(ministry) && (
                          <span
                            className={`owner-ministry-language-badge owner-ministry-language-${getMinistryLanguage(
                              ministry
                            ).toLowerCase()}`}
                          >
                            {getMinistryLanguage(ministry)}
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

                          ID: {ministry.id || ministry.ministry_id || "—"}

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