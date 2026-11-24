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
  FaUsers,
  FaSearch,
  FaFilter,
  FaTimes,
  FaMusic,
} from "react-icons/fa";

import API from "../../services/api";

import "../../assets/css/businessowner/BusinessOwnerArtists.css";



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

const firstNonEmpty = (...values) => {
  for (const value of values) {
    if (value === null || value === undefined) continue;

    if (typeof value === "object" && !Array.isArray(value)) {
      const nested = firstNonEmpty(
        value.name,
        value.title,
        value.label,
        value.value,
        value.code,
        value.url,
        value.src
      );
      if (nested) return nested;
      continue;
    }

    const cleaned = String(value).trim();
    if (cleaned) return cleaned;
  }
  return "";
};

const normalizeLanguage = (value) => {
  const raw = firstNonEmpty(value)
    .toLowerCase()
    .replace(/_/g, "-")
    .replace(/\s+/g, " ")
    .trim();

  if (!raw) return "";

  const aliases = {
    te: "telugu", "te-in": "telugu", telugu: "telugu",
    "telugu (te)": "telugu",
    hi: "hindi", "hi-in": "hindi", hindi: "hindi",
    en: "english", "en-in": "english", english: "english",
    ml: "malayalam", "ml-in": "malayalam", malayalam: "malayalam",
    kn: "kannada", "kn-in": "kannada", kannada: "kannada",
    ta: "tamil", "ta-in": "tamil", tamil: "tamil",
  };

  if (aliases[raw]) return aliases[raw];

  const prefix = raw.split(/[-\s([]/)[0];
  return aliases[prefix] || "";
};

const getArtistLanguage = (artist) => {
  const direct = firstNonEmpty(
    artist?.language,
    artist?.language_name,
    artist?.languageName,
    artist?.language_code,
    artist?.languageCode,
    artist?.primary_language,
    artist?.primaryLanguage,
    artist?.artist_language,
    artist?.artistLanguage,
    artist?.song_language,
    artist?.songLanguage,
    artist?.lang,
    artist?.language?.label,
    artist?.language?.display_name
  );

  const normalizedDirect = normalizeLanguage(direct);
  if (LANGUAGES.some((item) => normalizeLanguage(item) === normalizedDirect)) {
    return normalizedDirect;
  }

  const songs = Array.isArray(artist?.songs) ? artist.songs : [];
  for (const song of songs) {
    const songLanguage = normalizeLanguage(firstNonEmpty(
      song?.language,
      song?.language_name,
      song?.language_code,
      song?.song_language
    ));
    if (LANGUAGES.some((item) => normalizeLanguage(item) === songLanguage)) {
      return songLanguage;
    }
  }

  const languages = Array.isArray(artist?.languages) ? artist.languages : [];
  for (const item of languages) {
    const value = normalizeLanguage(item);
    if (LANGUAGES.some((language) => normalizeLanguage(language) === value)) {
      return value;
    }
  }

  return "";
};

const extractArtistArray = (payload) => {
  if (Array.isArray(payload)) return payload;

  const candidates = [
    payload?.artists,
    payload?.data,
    payload?.results,
    payload?.items,
    payload?.records,
    payload?.data?.artists,
    payload?.data?.results,
    payload?.data?.items,
    payload?.data?.records,
    payload?.result?.artists,
    payload?.result?.data,
  ];

  return candidates.find(Array.isArray) || [];
};

const containsTelugu = (value) => /[\u0C00-\u0C7F]/.test(String(value || ""));

const getArtistNames = (artist) => {
  const englishExplicit = firstNonEmpty(
    artist?.name_english,
    artist?.english_name,
    artist?.artist_name_english,
    artist?.artistNameEnglish,
    artist?.artist_name_en,
    artist?.english_artist_name,
    artist?.artist_english_name,
    artist?.englishName,
    artist?.artist?.name_english,
    artist?.artist?.english_name,
    artist?.display_name_english,
    artist?.name_en,
    artist?.nameEnglish,
    artist?.displayNameEnglish,
    artist?.title_english,
    artist?.title_en,
    artist?.names?.english,
    artist?.names?.en,
    artist?.translations?.en,
    artist?.translations?.english
  );

  const generic = firstNonEmpty(
    artist?.name,
    artist?.artist_name,
    artist?.artistName,
    artist?.display_name,
    artist?.displayName,
    artist?.title,
    artist?.artist?.name,
    artist?.artist?.artist_name
  );

  const english = englishExplicit || (!containsTelugu(generic) ? generic : "");

  return {
    english: english || "English name not provided",
    searchable: english || "",
  };
};

const getArtistImage = (artist) =>
  firstNonEmpty(
    artist?.image_url,
    artist?.imageUrl,
    artist?.profile_image_url,
    artist?.profileImageUrl,
    artist?.profile_image,
    artist?.profileImage,
    artist?.photo_url,
    artist?.photo,
    artist?.image,
    artist?.avatar_url,
    artist?.avatar
  );

const getArtistSongCount = (artist) =>
  artist?.song_count ?? artist?.songs_count ?? artist?.total_songs ?? artist?.totalSongs ?? null;

/* =========================================================
   BUSINESS OWNER ARTISTS
========================================================= */

const BusinessOwnerArtists = () => {

  const navigate = useNavigate();

  const location = useLocation();


  /* =======================================================
     STATE
  ======================================================= */

  const [artists, setArtists] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  const [language, setLanguage] = useState("");

  // PAGINATION
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);


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


    const normalizedLanguage = normalizeLanguage(urlLanguage);
    const matchedLanguage = LANGUAGES.find(
      (item) => normalizeLanguage(item) === normalizedLanguage
    );
    setLanguage(matchedLanguage || "");

  }, [location.search]);


  /* =======================================================
     LOAD ARTISTS
  ======================================================= */

  useEffect(() => {

    const loadArtists = async () => {

      try {

        setLoading(true);

        setError("");


     // Load the complete collection once. Counts and filters are calculated locally.
        const response = await API.get("/owner/music/artists");


        const artistList = extractArtistArray(response?.data);
        setArtists(artistList);

      }

      catch (err) {

        console.error(
          "Failed to load owner artists:",
          err
        );


        setError(
          err?.response?.data?.message ||
          "Unable to load artists."
        );

        setArtists([]);

      }

      finally {

        setLoading(false);

      }

    };


    loadArtists();

  }, []);


  /* =======================================================
     FILTER ARTISTS
  ======================================================= */

  const filteredArtists = useMemo(() => {

    const searchText =
      search
        .trim()
        .toLowerCase();


    return artists.filter(
      (artist) => {

        const names = getArtistNames(artist);
        const name = names.searchable.toLowerCase();
        const bioValue = firstNonEmpty(
          artist?.bio_english,
          artist?.english_bio,
          artist?.description_english,
          artist?.descriptionEnglish,
          artist?.bio,
          artist?.description
        );
        const bio = containsTelugu(bioValue) ? "" : bioValue.toLowerCase();
        const artistLanguage = normalizeLanguage(getArtistLanguage(artist));

        const matchesSearch =
          !searchText ||
          name.includes(searchText) ||
          bio.includes(searchText);


        const matchesLanguage =
          !language ||
          artistLanguage === normalizeLanguage(language);


        return (
          matchesSearch &&
          matchesLanguage
        );

      }
    );

  }, [
    artists,
    search,
    language,
  ]);


  /* =======================================================
     PAGINATION
  ======================================================= */

  const totalPages = Math.max(1, Math.ceil(filteredArtists.length / pageSize));

  useEffect(() => {
    setCurrentPage(1);
  }, [search, language, pageSize]);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  const paginatedArtists = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredArtists.slice(startIndex, startIndex + pageSize);
  }, [filteredArtists, currentPage, pageSize]);


  /* =======================================================
     LANGUAGE-WISE ARTIST COUNTS
  ======================================================= */

  const languageCounts = useMemo(() => {
    const counts = Object.fromEntries(LANGUAGES.map((item) => [item, 0]));
    artists.forEach((artist) => {
      const normalized = normalizeLanguage(getArtistLanguage(artist));
      const matched = LANGUAGES.find(
        (item) => normalizeLanguage(item) === normalized
      );
      if (matched) counts[matched] += 1;
    });
    return counts;
  }, [artists]);

  const selectLanguage = (selectedLanguage) => {
    setLanguage(selectedLanguage);
    navigate(
      selectedLanguage
        ? `/owner/music/artists?language=${encodeURIComponent(selectedLanguage)}`
        : "/owner/music/artists",
      { replace: true }
    );
  };


  /* =======================================================
     CLEAR FILTERS
  ======================================================= */

  const clearFilters = () => {

    setSearch("");

    setLanguage("");


    navigate(
      "/owner/music/artists",
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
     RENDER
  ======================================================= */

  return (

    <div className="owner-artists-page">

      <style>{`
        .owner-artist-bilingual-name h3 {
          margin: 0;
        }
        .owner-artists-language-card strong {
          font-variant-numeric: tabular-nums;
        }
        .owner-artists-language-section {
          margin: 0 0 26px; padding: 22px;
          border: 1px solid rgba(212,175,112,.20); border-radius: 20px;
          background: linear-gradient(135deg, rgba(13,27,55,.96), rgba(20,43,82,.92));
          box-shadow: 0 14px 35px rgba(0,0,0,.16);
        }
        .owner-artists-language-heading {
          display:flex; align-items:center; justify-content:space-between;
          gap:14px; margin-bottom:18px;
        }
        .owner-artists-language-heading h2 { margin:0 0 5px; color:#f5e7c8; font-size:1.15rem; }
        .owner-artists-language-heading p { margin:0; color:#b8c4d8; font-size:.88rem; }
        .owner-artists-total-pill {
          padding:8px 13px; border:1px solid rgba(224,190,130,.35);
          border-radius:999px; color:#f2d49c; background:rgba(224,190,130,.09);
          font-size:.82rem; white-space:nowrap;
        }
        .owner-artists-language-cards {
          display:grid; grid-template-columns:repeat(auto-fit,minmax(145px,1fr)); gap:12px;
        }
        .owner-artists-language-card {
          display:flex; min-height:145px; flex-direction:column; align-items:flex-start;
          gap:7px; padding:16px; border:1px solid rgba(155,177,211,.18);
          border-radius:16px; color:#edf3ff; background:rgba(255,255,255,.045);
          text-align:left; cursor:pointer;
          transition:transform .2s ease,border-color .2s ease,background .2s ease,box-shadow .2s ease;
        }
        .owner-artists-language-card:hover {
          transform:translateY(-3px); border-color:rgba(230,195,133,.65);
          background:rgba(40,75,125,.48);
        }
        .owner-artists-language-card.active {
          border-color:#d9b777;
          background:linear-gradient(145deg,rgba(38,77,133,.72),rgba(28,49,83,.95));
          box-shadow:0 0 0 1px rgba(217,183,119,.20),0 10px 24px rgba(0,0,0,.16);
        }
        .owner-artists-language-card-icon {
          display:grid; width:34px; height:34px; place-items:center;
          border-radius:10px; color:#e4c58f; background:rgba(228,197,143,.12);
        }
        .owner-artists-language-card-label { color:#dce7f8; font-size:.83rem; font-weight:600; }
        .owner-artists-language-card strong { color:#f5d69e; font-size:1.65rem; line-height:1.1; }
        .owner-artists-language-card small { color:#aebdd3; font-size:.75rem; }
        @media(max-width:600px) {
          .owner-artists-language-section { padding:16px; }
          .owner-artists-language-heading { align-items:flex-start; flex-direction:column; }
          .owner-artists-language-cards { grid-template-columns:repeat(2,minmax(0,1fr)); }
        }

        .owner-artists-table-wrapper {
          width: 100%;
          overflow-x: auto;
          border: 1px solid rgba(104, 153, 220, .22);
          border-radius: 16px;
          background: rgba(8, 19, 36, .72);
          scrollbar-width: thin;
          scrollbar-color: rgba(216, 184, 106, .55) rgba(10, 22, 43, .7);
        }

        .owner-artists-table {
          width: 100%;
          min-width: 650px;
          border-collapse: collapse;
          text-align: left;
        }

        .owner-artists-table thead {
          background: linear-gradient(110deg, rgba(29, 55, 91, .98), rgba(15, 32, 56, .98));
        }

        .owner-artists-table th {
          padding: 16px 18px;
          color: #e8d19b;
          font-size: .78rem;
          font-weight: 800;
          letter-spacing: .07em;
          text-transform: uppercase;
          white-space: nowrap;
          border-bottom: 1px solid rgba(216, 184, 106, .25);
        }

        .owner-artists-table td {
          padding: 13px 18px;
          color: #e8eef9;
          font-size: .9rem;
          border-bottom: 1px solid rgba(130, 157, 194, .13);
          vertical-align: middle;
        }

        .owner-artists-table tbody tr {
          transition: background .18s ease;
        }

        .owner-artists-table tbody tr:hover {
          background: rgba(55, 91, 143, .17);
        }

        .owner-artists-table tbody tr:last-child td {
          border-bottom: 0;
        }

        .owner-artists-row-number {
          width: 58px;
          color: #9fb0ca !important;
          font-weight: 700;
          font-variant-numeric: tabular-nums;
        }

        .owner-artists-table-artist {
          display: flex;
          align-items: center;
          gap: 13px;
          min-width: 250px;
        }

        .owner-artists-table-image {
          flex: 0 0 54px;
          width: 54px;
          height: 54px;
          overflow: hidden;
          border-radius: 50%;
          background: linear-gradient(145deg, #19345b, #091428);
          border: 1px solid rgba(216, 184, 106, .24);
        }

        .owner-artists-table-image img {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .owner-artists-table-artist-name {
          display: flex;
          flex-direction: column;
          gap: 5px;
          min-width: 0;
        }

        .owner-artists-table-artist-name strong {
          color: #f4f7ff;
          font-size: .94rem;
          font-weight: 750;
          overflow-wrap: anywhere;
        }

        .owner-artists-table-artist-name span {
          color: #91a4c2;
          font-size: .74rem;
        }

        .owner-artists-language-badge,
        .owner-artists-song-count {
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

        @media (max-width: 640px) {
          .owner-artists-table th,
          .owner-artists-table td {
            padding: 11px 12px;
          }

          .owner-artists-table-image {
            flex-basis: 46px;
            width: 46px;
            height: 46px;
          }

          .owner-artists-table-artist-name strong {
            font-size: .86rem;
          }
        }

      `}</style>


      {/* ===================================================
          HEADER
      =================================================== */}

      <header className="owner-artists-header">


        <button
          type="button"
          className="owner-artists-back-button"
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


        <div className="owner-artists-title-area">

          <div className="owner-artists-title-icon">

            <FaUsers />

          </div>


          <div>

            <h1>
              Artists
            </h1>

            <p>
              View all artists in the
              KEERTHANA collection.
            </p>

          </div>

        </div>

      </header>


      {/* ===================================================
          CONTENT
      =================================================== */}

      <main className="owner-artists-content">


        {/* =================================================
            SUMMARY
        ================================================= */}

        <div className="owner-artists-summary">


          <div className="owner-artists-summary-card">

            <span>
              Total Artists
            </span>

            <strong>
              {artists.length}
            </strong>

          </div>


          <div className="owner-artists-summary-card">

            <span>
              Showing
            </span>

            <strong>
              {filteredArtists.length}
            </strong>

          </div>


          <div className="owner-artists-summary-card">

            <span>
              Language
            </span>

            <strong className="owner-artists-language-value">

              {language || "All"}

            </strong>

          </div>

        </div>


        {/* =================================================
            LANGUAGE-WISE ARTIST CARDS
        ================================================= */}

        <section className="owner-artists-language-section">
          <div className="owner-artists-language-heading">
            <div>
              <h2>Artists by Language</h2>
              <p>Select a language to view its artists.</p>
            </div>
            <span className="owner-artists-total-pill">
              {artists.length} Total Artists
            </span>
          </div>

          <div className="owner-artists-language-cards">
            <button
              type="button"
              className={`owner-artists-language-card ${!language ? "active" : ""}`}
              onClick={() => selectLanguage("")}
              aria-pressed={!language}
            >
              <span className="owner-artists-language-card-icon"><FaUsers /></span>
              <span className="owner-artists-language-card-label">All Languages</span>
              <strong>{artists.length}</strong>
              <small>All artists</small>
            </button>

            {LANGUAGES.map((item) => (
              <button
                type="button"
                key={item}
                className={`owner-artists-language-card ${language === item ? "active" : ""}`}
                onClick={() => selectLanguage(item)}
                aria-pressed={language === item}
              >
                <span className="owner-artists-language-card-icon"><FaMusic /></span>
                <span className="owner-artists-language-card-label">{item}</span>
                <strong>{languageCounts[item] || 0}</strong>
                <small>{languageCounts[item] === 1 ? "Artist" : "Artists"}</small>
              </button>
            ))}
          </div>
        </section>


        {/* =================================================
            FILTER
        ================================================= */}

        <section className="owner-artists-filter-card">


          <div className="owner-artists-filter-title">

            <FaFilter />

            <span>
              Search & Filter
            </span>

          </div>


          <div className="owner-artists-filter-row">


            {/* SEARCH */}

            <div className="owner-artists-search">

              <FaSearch />

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search artists in English..."
              />


              {search && (

                <button
                  type="button"
                  className="owner-artists-clear-search"
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
              className="owner-artists-language-select"
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
                className="owner-artists-clear-button"
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

          <div className="owner-artists-error">

            {error}

          </div>

        )}


        {/* =================================================
            LOADING
        ================================================= */}

        {loading ? (

          <div className="owner-artists-loading">

            <div className="owner-artists-spinner"></div>

            <p>
              Loading artists...
            </p>

          </div>

        ) : filteredArtists.length === 0 ? (

          /* ===============================================
             EMPTY
          =============================================== */

          <div className="owner-artists-empty">

            <div className="owner-artists-empty-icon">

              <FaUsers />

            </div>


            <h2>
              No Artists Found
            </h2>


            <p>

              {search || language
                ? "No artists match the selected search or language filter."
                : "There are no artists in the KEERTHANA collection yet."
              }

            </p>


            {(search || language) && (

              <button
                type="button"
                onClick={clearFilters}
                className="owner-artists-empty-button"
              >

                Clear Filters

              </button>

            )}

          </div>

        ) : (

          /* ===============================================
             ARTIST GRID
          =============================================== */

          <section className="owner-artists-list-card">


            <div className="owner-artists-list-header">

              <div>

                <h2>
                  Artist Collection
                </h2>

                <p>
                  {filteredArtists.length} artist
                  {filteredArtists.length !== 1
                    ? "s"
                    : ""}
                  {" "}displayed
                </p>

              </div>

            </div>


            <div className="owner-artists-table-wrapper">
              <table className="owner-artists-table">
                <thead>
                  <tr>
                    <th scope="col">#</th>
                    <th scope="col">Artist</th>
                    <th scope="col">Language</th>
                    <th scope="col">Total Songs</th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedArtists.map((artist, index) => {
                    const image = getArtistImage(artist);
                    const name = getArtistNames(artist).english;
                    const artistLanguage =
                      getArtistLanguage(artist) || "Language not provided";
                    const songCount = getArtistSongCount(artist);

                    return (
                      <tr
                        key={
                          artist?.id ||
                          artist?.artist_id ||
                          `${name}-${index}`
                        }
                      >
                        <td className="owner-artists-row-number">
                          {(currentPage - 1) * pageSize + index + 1}
                        </td>

                        <td>
                          <div className="owner-artists-table-artist">
                            <div className="owner-artists-table-image">
                              <img
                                src={image || "/images/default-artist.png"}
                                alt={name}
                                loading="lazy"
                                onError={(event) => {
                                  event.currentTarget.onerror = null;
                                  event.currentTarget.src =
                                    "/images/default-artist.png";
                                }}
                              />
                            </div>

                            <div className="owner-artists-table-artist-name">
                              <strong>{name}</strong>
                              <span>KEERTHANA Music Artist</span>
                            </div>
                          </div>
                        </td>

                        <td>
                          <span className="owner-artists-language-badge">
                            {artistLanguage}
                          </span>
                        </td>

                        <td>
                          <span className="owner-artists-song-count">
                            {songCount !== null && songCount !== undefined
                              ? `${songCount} song${Number(songCount) !== 1 ? "s" : ""}`
                              : "—"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* PAGINATION CONTROLS */}
            <div className="owner-artists-pagination">
              <div className="owner-artists-pagination-info">
                Showing <strong>{filteredArtists.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}</strong>–
                <strong>{Math.min(currentPage * pageSize, filteredArtists.length)}</strong>
                {" "}of <strong>{filteredArtists.length}</strong> artists
              </div>

              <div className="owner-artists-pagination-controls">
                <label className="owner-artists-pagination-size">
                  Rows
                  <select
                    value={pageSize}
                    onChange={(event) => setPageSize(Number(event.target.value))}
                    aria-label="Artists per page"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                  per page
                </label>

                <button type="button" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>First</button>
                <button type="button" onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={currentPage === 1}>Previous</button>
                <span className="owner-artists-pagination-current">{currentPage} / {totalPages}</span>
                <button type="button" onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} disabled={currentPage === totalPages}>Next</button>
                <button type="button" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}>Last</button>
              </div>
            </div>

          </section>

        )}

      </main>

    </div>

  );

};


export default BusinessOwnerArtists;