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
  FaCompactDisc,
  FaSearch,
  FaFilter,
  FaTimes,
} from "react-icons/fa";

import API from "../../services/api";

import "../../assets/css/businessowner/BusinessOwnerAlbums.css";


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
    "hindi (hi)": "hindi",
    en: "english", "en-in": "english", english: "english",
    "english (en)": "english",
    ml: "malayalam", "ml-in": "malayalam", malayalam: "malayalam",
    "malayalam (ml)": "malayalam",
    kn: "kannada", "kn-in": "kannada", kannada: "kannada",
    "kannada (kn)": "kannada",
    ta: "tamil", "ta-in": "tamil", tamil: "tamil",
    "tamil (ta)": "tamil",
  };

  if (aliases[raw]) return aliases[raw];

  const prefix = raw.split(/[-\s([]/)[0];
  return aliases[prefix] || raw;
};

const getAlbumLanguage = (album) =>
  firstNonEmpty(
    album?.language,
    album?.language_name,
    album?.languageName,
    album?.language_code,
    album?.languageCode,
    album?.primary_language,
    album?.primaryLanguage,
    album?.album_language,
    album?.albumLanguage,
    album?.lang
  );

const extractAlbumArray = (payload) => {
  if (Array.isArray(payload)) return payload;

  const candidates = [
    payload?.albums,
    payload?.data,
    payload?.results,
    payload?.items,
    payload?.records,
    payload?.data?.albums,
    payload?.data?.results,
    payload?.data?.items,
    payload?.data?.records,
    payload?.result?.albums,
    payload?.result?.data,
  ];

  return candidates.find(Array.isArray) || [];
};

const containsTelugu = (value) => /[\u0C00-\u0C7F]/.test(String(value || ""));

const getAlbumNames = (album) => {
  const englishExplicit = firstNonEmpty(
    album?.title_english,
    album?.english_title,
    album?.titleEnglish,
    album?.album_title_english,
    album?.albumTitleEnglish,
    album?.album_name_english,
    album?.albumNameEnglish,
    album?.name_english,
    album?.english_name,
    album?.title_en,
    album?.name_en,
    album?.englishTitle,
    album?.titles?.english,
    album?.titles?.en,
    album?.names?.english,
    album?.names?.en,
    album?.translations?.en,
    album?.translations?.english
  );

  const teluguExplicit = firstNonEmpty(
    album?.title_telugu,
    album?.telugu_title,
    album?.titleTelugu,
    album?.album_title_telugu,
    album?.albumTitleTelugu,
    album?.album_name_telugu,
    album?.albumNameTelugu,
    album?.name_telugu,
    album?.telugu_name,
    album?.title_te,
    album?.name_te,
    album?.teluguTitle,
    album?.titles?.telugu,
    album?.titles?.te,
    album?.names?.telugu,
    album?.names?.te,
    album?.translations?.te,
    album?.translations?.telugu
  );

  const general = firstNonEmpty(
    album?.title,
    album?.album_title,
    album?.albumTitle,
    album?.name,
    album?.album_name
  );

  const english = englishExplicit || (!containsTelugu(general) ? general : "");
  const telugu = teluguExplicit || (containsTelugu(general) ? general : "");

  return {
    english: english || "English name not provided",
    telugu: telugu || "",
    searchable: [english, telugu, general].filter(Boolean).join(" "),
  };
};

const getAlbumCover = (album) =>
  firstNonEmpty(
    album?.cover_url,
    album?.coverUrl,
    album?.cover_image_url,
    album?.coverImageUrl,
    album?.album_cover_url,
    album?.albumCoverUrl,
    album?.image_url,
    album?.imageUrl,
    album?.image,
    album?.cover,
    album?.thumbnail_url,
    album?.thumbnail,
    album?.artwork_url,
    album?.artwork
  );

const getAlbumArtist = (album) =>
  firstNonEmpty(
    album?.artist_name,
    album?.artistName,
    album?.artist,
    album?.artist?.name,
    album?.artists?.[0]?.name
  );

const getAlbumYear = (album) =>
  firstNonEmpty(album?.release_year, album?.releaseYear, album?.year);

const getAlbumSongCount = (album) =>
  album?.song_count ?? album?.songs_count ?? album?.total_songs ?? album?.totalSongs ?? null;

/* =========================================================
   BUSINESS OWNER ALBUMS
========================================================= */

const BusinessOwnerAlbums = () => {

  const navigate = useNavigate();

  const location = useLocation();


  /* =======================================================
     STATE
  ======================================================= */

  const [albums, setAlbums] = useState([]);

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
     LOAD ALBUMS
  ======================================================= */

  useEffect(() => {

    const loadAlbums = async () => {

      try {

        setLoading(true);

        setError("");
        // Load the complete album collection; filter locally for accurate totals.
        const response = await API.get("/owner/music/albums");


        const albumList = extractAlbumArray(response?.data);
        setAlbums(albumList);

      }

      catch (err) {

        console.error(
          "Failed to load owner albums:",
          err
        );


        setError(
          err?.response?.data?.message ||
          "Unable to load albums."
        );

        setAlbums([]);

      }

      finally {

        setLoading(false);

      }

    };


    loadAlbums();

  }, []);


  /* =======================================================
     FILTER ALBUMS
  ======================================================= */

  const filteredAlbums = useMemo(() => {

    const searchText =
      search
        .trim()
        .toLowerCase();


    return albums.filter(
      (album) => {

        const names = getAlbumNames(album);
        const title = names.searchable.toLowerCase();
        const artist = getAlbumArtist(album).toLowerCase();
        const year = String(getAlbumYear(album) || "").toLowerCase();
        const albumLanguage = normalizeLanguage(getAlbumLanguage(album));

        const matchesSearch =
          !searchText ||
          title.includes(searchText) ||
          artist.includes(searchText) ||
          year.includes(searchText);


        const matchesLanguage =
          !language ||
          albumLanguage === normalizeLanguage(language);


        return (
          matchesSearch &&
          matchesLanguage
        );

      }
    );

  }, [
    albums,
    search,
    language,
  ]);

  const languageCounts = useMemo(() => {
    const counts = Object.fromEntries(LANGUAGES.map((item) => [item, 0]));

    albums.forEach((album) => {
      const normalized = normalizeLanguage(getAlbumLanguage(album));
      const matched = LANGUAGES.find(
        (item) => normalizeLanguage(item) === normalized
      );
      if (matched) counts[matched] += 1;
    });

    return counts;
  }, [albums]);


  /* =======================================================
     CLEAR FILTERS
  ======================================================= */

  const clearFilters = () => {

    setSearch("");

    setLanguage("");


    navigate(
      "/owner/music/albums",
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
        `/owner/music/albums?language=${encodeURIComponent(
          selectedLanguage
        )}`,
        {
          replace: true,
        }
      );

    }

    else {

      navigate(
        "/owner/music/albums",
        {
          replace: true,
        }
      );

    }

  };


  /* =======================================================
     RENDER
  ======================================================= */

  return (

    <div className="owner-albums-page">
      <style>{`
        .owner-albums-language-card {
          min-width: 118px;
          display: flex;
          flex-direction: column;
          gap: 7px;
          justify-content: center;
        }
        .owner-albums-language-card strong {
          color: #f7e6b2;
          font-size: 1.45rem;
        }
        .owner-album-cover-wrapper {
          overflow: hidden;
          background: rgba(10, 22, 43, .8);
        }
        .owner-album-cover {
          display: block;
          width: 100%;
          height: 100%;
          min-height: 170px;
          object-fit: cover;
        }
        .owner-album-cover-placeholder {
          min-height: 170px;
          display: grid;
          place-items: center;
          color: #d8b86a;
          font-size: 3rem;
          background: linear-gradient(145deg, #142748, #091428);
        }
        .owner-album-bilingual-title {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        .owner-album-bilingual-title h3 {
          margin: 0;
        }
        .owner-album-telugu-title {
          margin: 0;
          color: #d8c58f;
          font-size: .95rem;
          line-height: 1.5;
          font-weight: 600;
        }
      `}</style>


      {/* ===================================================
          HEADER
      =================================================== */}

      <header className="owner-albums-header">


        <button
          type="button"
          className="owner-albums-back-button"
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


        <div className="owner-albums-title-area">

          <div className="owner-albums-title-icon">

            <FaCompactDisc />

          </div>


          <div>

            <h1>
              Albums
            </h1>

            <p>
              View all albums in the
              KEERTHANA collection.
            </p>

          </div>

        </div>

      </header>


      {/* ===================================================
          CONTENT
      =================================================== */}

      <main className="owner-albums-content">


        {/* =================================================
            SUMMARY
        ================================================= */}

        <div className="owner-albums-summary">

          <button
            type="button"
            className="owner-albums-summary-card owner-albums-language-card"
            style={{ cursor: "pointer", textAlign: "left", border: !language ? "1px solid #d8b86a" : undefined, background: !language ? "rgba(216,184,106,0.12)" : undefined }}
            onClick={() => navigate("/owner/music/albums", { replace: true })}
            aria-pressed={!language}
          >
            <span>All Languages</span>
            <strong>{albums.length}</strong>
          </button>

          {LANGUAGES.map((item) => {
            const count = languageCounts[item] || 0;
            const active = normalizeLanguage(language) === normalizeLanguage(item);

            return (
              <button
                type="button"
                key={item}
                className="owner-albums-summary-card owner-albums-language-card"
                style={{ cursor: "pointer", textAlign: "left", border: active ? "1px solid #d8b86a" : undefined, background: active ? "rgba(216,184,106,0.12)" : undefined }}
                onClick={() => navigate(`/owner/music/albums?language=${encodeURIComponent(item)}`, { replace: true })}
                aria-pressed={active}
              >
                <span>{item}</span>
                <strong>{count}</strong>
              </button>
            );
          })}



          <div className="owner-albums-summary-card">

            <span>
              Total Albums
            </span>

            <strong>
              {albums.length}
            </strong>

          </div>


          <div className="owner-albums-summary-card">

            <span>
              Showing
            </span>

            <strong>
              {filteredAlbums.length}
            </strong>

          </div>


          <div className="owner-albums-summary-card">

            <span>
              Language
            </span>

            <strong className="owner-albums-language-value">

              {language || "All"}

            </strong>

          </div>

        </div>


        {/* =================================================
            FILTER
        ================================================= */}

        <section className="owner-albums-filter-card">


          <div className="owner-albums-filter-title">

            <FaFilter />

            <span>
              Search & Filter
            </span>

          </div>


          <div className="owner-albums-filter-row">


            {/* SEARCH */}

            <div className="owner-albums-search">

              <FaSearch />

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search albums or artists..."
              />


              {search && (

                <button
                  type="button"
                  className="owner-albums-clear-search"
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
              className="owner-albums-language-select"
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
                className="owner-albums-clear-button"
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

          <div className="owner-albums-error">

            {error}

          </div>

        )}


        {/* =================================================
            LOADING
        ================================================= */}

        {loading ? (

          <div className="owner-albums-loading">

            <div className="owner-albums-spinner"></div>

            <p>
              Loading albums...
            </p>

          </div>

        ) : filteredAlbums.length === 0 ? (

          /* ===============================================
             EMPTY
          =============================================== */

          <div className="owner-albums-empty">

            <div className="owner-albums-empty-icon">

              <FaCompactDisc />

            </div>


            <h2>
              No Albums Found
            </h2>


            <p>

              {search || language
                ? "No albums match the selected search or language filter."
                : "There are no albums in the KEERTHANA collection yet."
              }

            </p>


            {(search || language) && (

              <button
                type="button"
                onClick={clearFilters}
                className="owner-albums-empty-button"
              >

                Clear Filters

              </button>

            )}

          </div>

        ) : (

          /* ===============================================
             ALBUM GRID
          =============================================== */

          <section className="owner-albums-list-card">


            <div className="owner-albums-list-header">

              <div>

                <h2>
                  Album Collection
                </h2>

                <p>
                  {filteredAlbums.length} album
                  {filteredAlbums.length !== 1
                    ? "s"
                    : ""}
                  {" "}displayed
                </p>

              </div>

            </div>


            <div className="owner-albums-grid">

              {filteredAlbums.map(
                (album, index) => {


              


                  const names = getAlbumNames(album);
                  const title = names.english;
                  const teluguTitle = names.telugu;
                  const artist = getAlbumArtist(album) || "Unknown Artist";
                  const languageName = getAlbumLanguage(album) || "Unknown";
                  const year = getAlbumYear(album) || "—";
                  const songCount = getAlbumSongCount(album);
                  const cover = getAlbumCover(album);


                  return (

                    <article
                      key={
                        album?.id ||
                        album?.album_id ||
                        `${title}-${teluguTitle || "album"}-${index}`
                      }
                      className="owner-album-card"
                    >


                      {/* COVER */}

                      <div className="owner-album-cover-wrapper">
                        {cover ? (
                          <img
                            src={cover}
                            alt={`${title}${teluguTitle ? ` - ${teluguTitle}` : ""} album cover`}
                            className="owner-album-cover"
                            loading="lazy"
                            onError={(event) => {
                              event.currentTarget.style.display = "none";
                              const placeholder = event.currentTarget.parentElement?.querySelector(
                                ".owner-album-cover-placeholder"
                              );
                              if (placeholder) placeholder.style.display = "grid";
                            }}
                          />
                        ) : null}
                        <div
                          className="owner-album-cover-placeholder"
                          style={{ display: cover ? "none" : "grid" }}
                          aria-label="Album cover unavailable"
                        >
                          <FaCompactDisc />
                        </div>
                      </div>


                      {/* DETAILS */}

                      <div className="owner-album-details">


                        <div className="owner-album-bilingual-title">
                          <h3>{title}</h3>
                          {teluguTitle && (
                            <p className="owner-album-telugu-title">
                              {teluguTitle}
                            </p>
                          )}
                        </div>


                        <p className="owner-album-artist">

                          {artist}

                        </p>


                        <div className="owner-album-meta">


                          <span>

                            {languageName}

                          </span>


                          <span>

                            {year}

                          </span>


                          {songCount !== null && (

                            <span>

                              {songCount} song
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


export default BusinessOwnerAlbums;