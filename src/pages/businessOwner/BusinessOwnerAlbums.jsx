import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaCompactDisc,
  FaSearch,
  FaFilter,
  FaTimes,
  FaGlobe,
  FaMusic,
} from "react-icons/fa";
import API from "../../services/api";
import "../../assets/css/businessowner/BusinessOwnerAlbums.css";

/* =========================================================
   BUSINESS OWNER ALBUMS
   - Shows English and Telugu album names when supplied by API.
   - Artist and language labels are removed from album cards.
   - Summary separates unique languages from total albums.
========================================================= */

const LANGUAGES = [
  "Telugu",
  "Hindi",
  "English",
  "Malayalam",
  "Kannada",
  "Tamil",
];

const LANGUAGE_ALIASES = {
  te: "telugu",
  "te-in": "telugu",
  telugu: "telugu",
  "తెలుగు": "telugu",
  hi: "hindi",
  "hi-in": "hindi",
  hindi: "hindi",
  "हिन्दी": "hindi",
  en: "english",
  "en-in": "english",
  english: "english",
  ml: "malayalam",
  "ml-in": "malayalam",
  malayalam: "malayalam",
  kn: "kannada",
  "kn-in": "kannada",
  kannada: "kannada",
  ta: "tamil",
  "ta-in": "tamil",
  tamil: "tamil",
};

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
        value.language_name,
        value.language_code,
        value.display_name,
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
    .replace(/\\s+/g, " ")
    .trim();

  if (!raw) return "";

  if (LANGUAGE_ALIASES[raw]) return LANGUAGE_ALIASES[raw];

  const prefix = raw.split(/[-\\s([]/)[0];
  return LANGUAGE_ALIASES[prefix] || "";
};

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

const containsTelugu = (value) =>
  /[\u0C00-\u0C7F]/.test(String(value || ""));

/*
 * Also checks API fields whose names contain both an album/name/title
 * term and an English/EN term. This supports common backend naming
 * variations without accidentally using artist fields as album titles.
 */
const findNamedTranslation = (album, language) => {
  if (!album || typeof album !== "object") return "";

  const languagePattern =
    language === "english" ? /(english|_en$|^en_)/i : /(telugu|_te$|^te_)/i;

  const titlePattern = /(album|title|name)/i;

  for (const [key, value] of Object.entries(album)) {
    if (!titlePattern.test(key) || !languagePattern.test(key)) continue;
    const candidate = firstNonEmpty(value);
    if (candidate) return candidate;
  }

  const nestedGroups = [
    album.titles,
    album.names,
    album.translations,
    album.localized_names,
    album.localizedNames,
  ];

  for (const group of nestedGroups) {
    if (!group || typeof group !== "object") continue;

    const candidate =
      language === "english"
        ? firstNonEmpty(
            group.english,
            group.en,
            group.English,
            group.EN
          )
        : firstNonEmpty(
            group.telugu,
            group.te,
            group.Telugu,
            group.TE
          );

    if (candidate) return candidate;
  }

  return "";
};

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
    album?.album_title_en,
    album?.album_name_en,
    album?.albumTitleEn,
    album?.albumNameEn,
    album?.album_english_name,
    album?.english_album_name,
    album?.albumEnglishName,
    album?.englishAlbumName,
    album?.title_in_english,
    album?.name_in_english,
    album?.album_title_in_english,
    album?.album?.title_english,
    album?.album?.english_name,
    album?.album?.name_english,
    album?.album?.title_en,
    album?.name_in_english,
    album?.englishTitle,
    album?.englishName,
    album?.titles?.english,
    album?.titles?.en,
    album?.names?.english,
    album?.names?.en,
    album?.translations?.en,
    album?.translations?.english,
    findNamedTranslation(album, "english")
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
    album?.album_title_te,
    album?.album_name_te,
    album?.teluguTitle,
    album?.teluguName,
    album?.album_telugu_name,
    album?.telugu_album_name,
    album?.albumTeluguName,
    album?.teluguAlbumName,
    album?.title_in_telugu,
    album?.name_in_telugu,
    album?.album_title_in_telugu,
    album?.album?.title_telugu,
    album?.album?.telugu_name,
    album?.album?.name_telugu,
    album?.album?.title_te,
    album?.titles?.telugu,
    album?.titles?.te,
    album?.names?.telugu,
    album?.names?.te,
    album?.translations?.te,
    album?.translations?.telugu,
    findNamedTranslation(album, "telugu")
  );

  // Check all generic title/name fields independently. Some endpoints return
  // the Telugu title in `title` and the English title in `album_name` (or vice
  // versa), so selecting only the first non-empty field loses the English name.
  const genericNames = [
    album?.title,
    album?.album_title,
    album?.albumTitle,
    album?.name,
    album?.album_name,
    album?.album?.title,
    album?.album?.album_title,
    album?.album?.name
  ]
    .map((value) => firstNonEmpty(value))
    .filter(Boolean);

  const generalEnglish = genericNames.find((value) => !containsTelugu(value)) || "";
  const generalTelugu = genericNames.find((value) => containsTelugu(value)) || "";

  const english = englishExplicit || generalEnglish;
  const telugu = teluguExplicit || generalTelugu;
  const general = genericNames.join(" ");

  return {
    english: english || "English name not provided",
    telugu,
    searchable: [english, telugu, general].filter(Boolean).join(" "),
  };
};

const getAlbumLanguage = (album) => {
  const direct = firstNonEmpty(
    album?.language,
    album?.language_name,
    album?.languageName,
    album?.language_code,
    album?.languageCode,
    album?.primary_language,
    album?.primaryLanguage,
    album?.album_language,
    album?.albumLanguage,
    album?.album_language_name,
    album?.albumLanguageName,
    album?.language_label,
    album?.languageLabel,
    album?.lang,
    album?.lang_code,
    album?.language?.name,
    album?.language?.label,
    album?.language?.code
  );

  const normalized = normalizeLanguage(direct);
  if (normalized) return normalized;

  // Some album APIs return a list of languages instead of one language field.
  const languages = Array.isArray(album?.languages) ? album.languages : [];
  for (const item of languages) {
    const match = normalizeLanguage(item);
    if (match) return match;
  }

  // Do not silently classify records with no language as Telugu.
  return "";
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

const getAlbumYear = (album) =>
  firstNonEmpty(album?.release_year, album?.releaseYear, album?.year);

const getAlbumSongCount = (album) =>
  album?.song_count ??
  album?.songs_count ??
  album?.total_songs ??
  album?.totalSongs ??
  (Array.isArray(album?.songs) ? album.songs.length : null);

const BusinessOwnerAlbums = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [language, setLanguage] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const urlLanguage = params.get("language");

    const matchedLanguage = LANGUAGES.find(
      (item) =>
        normalizeLanguage(item) === normalizeLanguage(urlLanguage)
    );

    setLanguage(matchedLanguage || "");
  }, [location.search]);

  useEffect(() => {
    let active = true;

    const loadAlbums = async () => {
      try {
        setLoading(true);
        setError("");

        // Fetch the full collection; summary counts are calculated locally.
        const response = await API.get("/owner/music/albums");
        const albumList = extractAlbumArray(response?.data);

        if (active) setAlbums(albumList);
      } catch (err) {
        console.error("Failed to load owner albums:", err);

        if (active) {
          setError(
            err?.response?.data?.message || "Unable to load albums."
          );
          setAlbums([]);
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    loadAlbums();

    return () => {
      active = false;
    };
  }, []);

  const filteredAlbums = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    return albums.filter((album) => {
      const names = getAlbumNames(album);
      const year = String(getAlbumYear(album) || "").toLowerCase();
      const albumLanguage = normalizeLanguage(getAlbumLanguage(album));

      const matchesSearch =
        !searchText ||
        names.searchable.toLowerCase().includes(searchText) ||
        year.includes(searchText);

      const matchesLanguage =
        !language ||
        albumLanguage === normalizeLanguage(language);

      return matchesSearch && matchesLanguage;
    });
  }, [albums, search, language]);

  const albumLanguageCounts = useMemo(() => {
    const counts = Object.fromEntries(
      LANGUAGES.map((item) => [normalizeLanguage(item), 0])
    );

    albums.forEach((album) => {
      const albumLanguage = getAlbumLanguage(album);
      if (Object.prototype.hasOwnProperty.call(counts, albumLanguage)) {
        counts[albumLanguage] += 1;
      }
    });

    return counts;
  }, [albums]);

  const uniqueLanguageCount = useMemo(() => {
    const languages = new Set(
      albums
        .map((album) => normalizeLanguage(getAlbumLanguage(album)))
        .filter(Boolean)
    );

    return languages.size;
  }, [albums]);

  const clearFilters = () => {
    setSearch("");
    setLanguage("");
    navigate("/owner/music/albums", { replace: true });
  };

  const handleLanguageChange = (event) => {
    const selectedLanguage = event.target.value;
    setLanguage(selectedLanguage);

    if (selectedLanguage) {
      navigate(
        `/owner/music/albums?language=${encodeURIComponent(selectedLanguage)}`,
        { replace: true }
      );
    } else {
      navigate("/owner/music/albums", { replace: true });
    }
  };

  return (
    <div className="owner-albums-page">
      <style>{`
        .owner-albums-summary-card.owner-albums-summary-total {
          border: 1px solid rgba(216, 184, 106, .38);
          background: linear-gradient(145deg, rgba(30, 53, 88, .92), rgba(12, 25, 46, .96));
        }

        .owner-albums-language-summary {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(145px, 1fr));
          gap: 14px;
        }

        .owner-albums-language-summary .owner-albums-summary-card {
          width: 100%;
          min-width: 0;
          min-height: 142px;
          padding: 18px;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          justify-content: center;
          gap: 8px;
          border-radius: 16px;
          text-align: left;
          color: #f4f7ff;
          cursor: pointer;
          transition: transform .18s ease, border-color .18s ease, background .18s ease;
        }

        .owner-albums-language-summary .owner-albums-summary-card:hover {
          transform: translateY(-3px);
          border-color: rgba(216, 184, 106, .72);
        }

        .owner-albums-language-summary .owner-albums-summary-card.active {
          border-color: #d8b86a;
          box-shadow: 0 0 0 1px rgba(216, 184, 106, .18);
          background: linear-gradient(145deg, rgba(31, 61, 105, .98), rgba(12, 25, 46, .98));
        }

        .owner-albums-language-summary .owner-albums-summary-card span {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #d9e5f8;
          font-weight: 700;
        }

        .owner-albums-language-summary .owner-albums-summary-card strong {
          color: #f0d49b;
          font-size: 1.8rem;
          line-height: 1.1;
        }

        .owner-albums-language-summary .owner-albums-summary-card small {
          color: #aebed7;
          font-size: .78rem;
        }

        .owner-albums-language-count {
          border: 1px solid rgba(104, 153, 220, .34);
          background: linear-gradient(145deg, rgba(25, 48, 79, .92), rgba(12, 25, 46, .96));
        }

        @media (max-width: 640px) {
          .owner-albums-language-summary {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        .owner-albums-summary-card.owner-albums-summary-languages {
          border: 1px solid rgba(104, 153, 220, .34);
          background: linear-gradient(145deg, rgba(25, 48, 79, .92), rgba(12, 25, 46, .96));
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

      <header className="owner-albums-header">
        <button
          type="button"
          className="owner-albums-back-button"
          onClick={() => navigate("/owner/music")}
        >
          <FaArrowLeft />
          <span>Music Collection</span>
        </button>

        <div className="owner-albums-title-area">
          <div className="owner-albums-title-icon">
            <FaCompactDisc />
          </div>

          <div>
            <h1>Albums</h1>
            <p>View all albums in the KEERTHANA collection.</p>
          </div>
        </div>
      </header>

      <main className="owner-albums-content">
        {/* ALBUM COUNTS: total plus each supported language */}
        <section className="owner-albums-summary owner-albums-language-summary">
          <button
            type="button"
            className={`owner-albums-summary-card owner-albums-summary-total ${
              !language ? "active" : ""
            }`}
            onClick={() => {
              setLanguage("");
              navigate("/owner/music/albums", { replace: true });
            }}
          >
            <span><FaGlobe /> All Albums</span>
            <strong>
              {loading ? "…" : albums.length.toLocaleString("en-IN")}
            </strong>
            <small>Total albums in the collection</small>
          </button>

          {LANGUAGES.map((item) => {
            const normalized = normalizeLanguage(item);
            const active = normalizeLanguage(language) === normalized;

            return (
              <button
                type="button"
                key={item}
                className={`owner-albums-summary-card owner-albums-language-count ${
                  active ? "active" : ""
                }`}
                onClick={() => {
                  setLanguage(item);
                  navigate(
                    `/owner/music/albums?language=${encodeURIComponent(item)}`,
                    { replace: true }
                  );
                }}
              >
                <span><FaMusic /> {item}</span>
                <strong>
                  {loading
                    ? "…"
                    : (albumLanguageCounts[normalized] || 0).toLocaleString("en-IN")}
                </strong>
                <small>
                  {(albumLanguageCounts[normalized] || 0) === 1
                    ? "Album"
                    : "Albums"}
                </small>
              </button>
            );
          })}
        </section>

        <section className="owner-albums-filter-card">
          <div className="owner-albums-filter-title">
            <FaFilter />
            <span>Search & Filter</span>
          </div>

          <div className="owner-albums-filter-row">
            <div className="owner-albums-search">
              <FaSearch />

              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search album names..."
                aria-label="Search album names"
              />

              {search && (
                <button
                  type="button"
                  className="owner-albums-clear-search"
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                >
                  <FaTimes />
                </button>
              )}
            </div>

            <select
              value={language}
              onChange={handleLanguageChange}
              className="owner-albums-language-select"
              aria-label="Filter albums by language"
            >
              <option value="">All Languages</option>
              {LANGUAGES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

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

        {error && (
          <div className="owner-albums-error" role="alert">
            {error}
          </div>
        )}

        {loading ? (
          <div className="owner-albums-loading">
            <div className="owner-albums-spinner" />
            <p>Loading albums...</p>
          </div>
        ) : filteredAlbums.length === 0 ? (
          <div className="owner-albums-empty">
            <div className="owner-albums-empty-icon">
              <FaCompactDisc />
            </div>

            <h2>No Albums Found</h2>
            <p>
              {search || language
                ? "No albums match the selected search or language filter."
                : "There are no albums in the KEERTHANA collection yet."}
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
          <section className="owner-albums-list-card">
            <div className="owner-albums-list-header">
              <div>
                <h2>Album Collection</h2>
                <p>
                  {filteredAlbums.length.toLocaleString("en-IN")} album
                  {filteredAlbums.length !== 1 ? "s" : ""} displayed
                </p>
              </div>
            </div>

            <div className="owner-albums-grid">
              {filteredAlbums.map((album, index) => {
                const names = getAlbumNames(album);
                const title = names.english;
                const teluguTitle = names.telugu;
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
                    <div className="owner-album-cover-wrapper">
                      {cover && (
                        <img
                          src={cover}
                          alt={`${title}${teluguTitle ? ` - ${teluguTitle}` : ""} album cover`}
                          className="owner-album-cover"
                          loading="lazy"
                          onError={(event) => {
                            event.currentTarget.style.display = "none";
                            const placeholder =
                              event.currentTarget.parentElement?.querySelector(
                                ".owner-album-cover-placeholder"
                              );
                            if (placeholder) placeholder.style.display = "grid";
                          }}
                        />
                      )}

                      <div
                        className="owner-album-cover-placeholder"
                        style={{ display: cover ? "none" : "grid" }}
                        aria-label="Album cover unavailable"
                      >
                        <FaCompactDisc />
                      </div>
                    </div>

                    <div className="owner-album-details">
                      <div className="owner-album-bilingual-title">
                        <h3>{title}</h3>
                        {teluguTitle && (
                          <p className="owner-album-telugu-title">
                            {teluguTitle}
                          </p>
                        )}
                      </div>

                      <div className="owner-album-meta">
                        <span>{year}</span>

                        {songCount !== null && songCount !== undefined && (
                          <span>
                            {songCount} song{Number(songCount) !== 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default BusinessOwnerAlbums;
