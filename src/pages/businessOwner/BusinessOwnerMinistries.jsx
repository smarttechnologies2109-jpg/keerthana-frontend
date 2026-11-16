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

\========================================================= */



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

\========================================================= */



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



const containsTelugu = (value) => /[\u0C00-\u0C7F]/.test(String(value ?? ""));



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



  const generalCandidates = [

    ministry?.name,

    ministry?.ministry_name,

    ministry?.ministryName,

    ministry?.title,

    nested?.name,

    nested?.ministry_name,

    nested?.title

  ].map((value) => String(value ?? "").trim()).filter(Boolean);



  const generalEnglish = generalCandidates.find((value) => !containsTelugu(value)) || "";

  const english = englishName && !containsTelugu(englishName)

    ? englishName

    : generalEnglish;



  return {

    english,

    fallback: english || "English name not provided by API"

  };

};



const getEnglishDescription = (ministry) => {

  const explicitEnglish = firstNonEmpty(

    ministry?.description_english,

    ministry?.english_description,

    ministry?.descriptionEnglish,

    ministry?.description_en,

    ministry?.about_english,

    ministry?.english_about

  );



  if (explicitEnglish && !containsTelugu(explicitEnglish)) {

    return String(explicitEnglish).trim();

  }



  const generalDescription = String(ministry?.description ?? "").trim();

  return generalDescription && !containsTelugu(generalDescription)

    ? generalDescription

    : "";

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

\========================================================= */



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

        const response = await API.get("/owner/music/ministries");
        const ministryRows = extractMinistryArray(response?.data);

        // The owner endpoint may return only the localized `name`.
        // Load canonical ministry records for their English name fields.
        let canonicalRows = [];
        try {
          const canonicalResponse = await API.get("/ministries");
          canonicalRows = extractMinistryArray(canonicalResponse?.data);
        } catch (canonicalError) {
          console.warn("Unable to load canonical ministry names:", canonicalError);
        }

        const canonicalById = {};
        canonicalRows.forEach((item) => {
          const id = item?.id ?? item?.ministry_id ?? item?.ministryId;
          if (id != null) canonicalById[String(id)] = item;
        });

        const mergedRows = ministryRows.map((item) => {
          const id = item?.id ?? item?.ministry_id ?? item?.ministryId;
          const canonical = id != null ? canonicalById[String(id)] : null;
          if (!canonical) return item;

          return {
            ...canonical,
            ...item,
            name_english:
              item?.name_english ||
              item?.english_name ||
              item?.nameEnglish ||
              item?.ministry_name_english ||
              item?.ministry_name_en ||
              canonical?.name_english ||
              canonical?.english_name ||
              canonical?.nameEnglish ||
              canonical?.ministry_name_english ||
              canonical?.ministry_name_en,
          };
        });

        setMinistries(mergedRows);



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

            ministry?.name_english,

            ministry?.english_name,

            ministry?.ministry_name_english,

            ministry?.ministry_name_en,

            ministry?.title_english,

            ministry?.title_en

          ]

            .filter((value) => value && !containsTelugu(value))

            .join(" ")

            .toLowerCase();



          const description = getEnglishDescription(ministry).toLowerCase();



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

        .owner-ministry-name-wrapper {

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


        .owner-ministries-table-wrapper {
          width: min(1440px, calc(100% - 48px));
          margin: 0 auto;
          overflow-x: auto;
          border: 1px solid rgba(104, 153, 220, .22);
          border-radius: 16px;
          background: rgba(8, 19, 36, .72);
          scrollbar-width: thin;
          scrollbar-color: rgba(216, 184, 106, .55) rgba(10, 22, 43, .7);
        }
        .owner-ministries-table {
          width: 100%;
          min-width: 760px;
          border-collapse: collapse;
          text-align: left;
        }
        .owner-ministries-table thead {
          background: linear-gradient(110deg, rgba(29, 55, 91, .98), rgba(15, 32, 56, .98));
        }
        .owner-ministries-table th {
          padding: 16px 18px;
          color: #e8d19b;
          font-size: .78rem;
          font-weight: 800;
          letter-spacing: .07em;
          text-transform: uppercase;
          white-space: nowrap;
          border-bottom: 1px solid rgba(216, 184, 106, .25);
        }
        .owner-ministries-table td {
          padding: 13px 18px;
          color: #e8eef9;
          font-size: .9rem;
          border-bottom: 1px solid rgba(130, 157, 194, .13);
          vertical-align: middle;
        }
        .owner-ministries-table tbody tr { transition: background .18s ease; }
        .owner-ministries-table tbody tr:hover { background: rgba(55, 91, 143, .17); }
        .owner-ministries-table tbody tr:last-child td { border-bottom: 0; }
        .owner-ministries-row-number {
          width: 58px;
          color: #9fb0ca !important;
          font-weight: 700;
          font-variant-numeric: tabular-nums;
        }
        .owner-ministries-table-ministry {
          display: flex;
          align-items: center;
          gap: 13px;
          min-width: 280px;
        }
        .owner-ministries-table-image {
          flex: 0 0 54px;
          width: 54px;
          height: 54px;
          overflow: hidden;
          border-radius: 10px;
          background: linear-gradient(145deg, #19345b, #091428);
          border: 1px solid rgba(216, 184, 106, .24);
        }
        .owner-ministries-table-image img {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .owner-ministries-table-name {
          display: flex;
          flex-direction: column;
          gap: 5px;
          min-width: 0;
        }
        .owner-ministries-table-name strong {
          color: #f4f7ff;
          font-size: .94rem;
          font-weight: 750;
          overflow-wrap: anywhere;
        }
        .owner-ministries-table-name span {
          color: #91a4c2;
          font-size: .74rem;
          line-height: 1.4;
          max-width: 460px;
        }
        .owner-ministries-language-badge,
        .owner-ministries-song-count {
          display: inline-flex;
          align-items: center;
          padding: 6px 11px;
          border: 1px solid rgba(104, 153, 220, .3);
          border-radius: 999px;
          background: rgba(32, 59, 96, .42);
          color: #dce8fb;
          font-size: .78rem;
          font-weight: 700;
          white-space: nowrap;
        }
        .owner-ministries-table-id {
          color: #9fb0ca !important;
          font-size: .8rem !important;
          font-variant-numeric: tabular-nums;
          white-space: nowrap;
        }
        @media (max-width: 640px) {
          .owner-ministries-table-wrapper {
            width: calc(100% - 28px);
          }
          .owner-ministries-table th,
          .owner-ministries-table td { padding: 11px 12px; }
          .owner-ministries-table-image {
            flex-basis: 46px;
            width: 46px;
            height: 46px;
          }
          .owner-ministries-table-name strong { font-size: .86rem; }
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



            <div className="owner-ministries-table-wrapper">
              <table className="owner-ministries-table">
                <thead>
                  <tr>
                    <th scope="col">#</th>
                    <th scope="col">Ministry</th>
                    <th scope="col">Language</th>
                    <th scope="col">Total Songs</th>
                    <th scope="col">ID</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMinistries.map((ministry, index) => {
                    const names = getMinistryNames(ministry);
                    const name =
                      names.english || "English name not provided by API";
                    const image = getMinistryImage(ministry);
                    const ministryLanguage = getMinistryLanguage(ministry);
                    const songCount = getSongCount(ministry);
                    const ministryId =
                      ministry.id || ministry.ministry_id || "—";

                    return (
                      <tr
                        key={
                          ministry.id ||
                          ministry.ministry_id ||
                          ministry.uuid ||
                          `${name}-${index}`
                        }
                      >
                        <td className="owner-ministries-row-number">
                          {index + 1}
                        </td>
                        <td>
                          <div className="owner-ministries-table-ministry">
                            <div className="owner-ministries-table-image">
                              <img
                                src={image}
                                alt={name}
                                loading="lazy"
                                onError={(event) => {
                                  event.currentTarget.onerror = null;
                                  event.currentTarget.src =
                                    "/images/default-ministry.png";
                                }}
                              />
                            </div>
                            <div className="owner-ministries-table-name">
                              <strong>{name}</strong>
                              {getEnglishDescription(ministry) && (
                                <span>{getEnglishDescription(ministry)}</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="owner-ministries-language-badge">
                            {ministryLanguage}
                          </span>
                        </td>
                        <td>
                          <span className="owner-ministries-song-count">
                            {songCount} {Number(songCount) === 1 ? "Song" : "Songs"}
                          </span>
                        </td>
                        <td className="owner-ministries-table-id">
                          {ministryId}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

          )}



      </section>



    </div>



  );



};





export default BusinessOwnerMinistries;