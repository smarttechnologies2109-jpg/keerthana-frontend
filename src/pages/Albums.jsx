
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  FaCompactDisc,
  FaExclamationCircle,
  FaMusic,
  FaRedoAlt,
  FaTimes,
} from "react-icons/fa";

import { useNavigate } from "react-router-dom";

import API from "../services/api";
import { getAlbumCover } from "../utils/media";
import VoiceSearch from "../components/VoiceSearch";

import "../assets/css/albums.css";

/* =========================================================
   KEERTHANA — ALBUMS
   Bilingual display + alphabetical sorting + language filter
========================================================= */

const DEFAULT_ALBUM_IMAGE = "/default-album.png";

/* LANGUAGE OPTIONS */

const LANGUAGES = [
  { value: "All", label: "All Languages" },
  { value: "Telugu", label: "తెలుగు" },
  { value: "English", label: "English" },
  { value: "Hindi", label: "हिन्दी" },
  { value: "Malayalam", label: "മലയാളം" },
  { value: "Kannada", label: "ಕನ್ನಡ" },
  { value: "Tamil", label: "தமிழ்" },
];

/* LANGUAGE NORMALIZATION */

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

/* GET ALBUM LANGUAGES */

const getAlbumLanguages = (album) => {
  const rawValues = [
    album?.language,
    album?.album_language,
    album?.language_name,
    album?.language_code,
    album?.primary_language,

    ...(Array.isArray(album?.languages)
      ? album.languages
      : []),

    ...(Array.isArray(album?.song_languages)
      ? album.song_languages
      : []),
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

  return [...new Set(normalized)];
};

/* ALBUM ENGLISH TITLE */

const getAlbumEnglishTitle = (album) => {
  const english = String(
    album?.title_english || ""
  ).trim();

  const primary = String(
    album?.title || ""
  ).trim();

  const telugu = String(
    album?.title_telugu || ""
  ).trim();

  if (english) return english;

  if (primary && primary !== telugu) {
    return primary;
  }

  return primary || telugu || "Untitled Album";
};

/* ALBUM TELUGU TITLE */

const getAlbumTeluguTitle = (album) => {
  const telugu = String(
    album?.title_telugu || ""
  ).trim();

  const primary = String(
    album?.title || ""
  ).trim();

  const english = String(
    album?.title_english || ""
  ).trim();

  if (telugu && telugu !== english) {
    return telugu;
  }

  if (primary && primary !== english) {
    return primary;
  }

  return "";
};

/* ARTIST ENGLISH NAME */

const getArtistEnglishName = (album) => {
  const english = String(
    album?.artist_name_english ||
    album?.artist_english ||
    ""
  ).trim();

  const primary = String(
    album?.artist_name || ""
  ).trim();

  const telugu = String(
    album?.artist_name_telugu || ""
  ).trim();

  if (english) return english;

  if (primary && primary !== telugu) {
    return primary;
  }

  return primary || telugu || "";
};

/* ARTIST TELUGU NAME */

const getArtistTeluguName = (album) => {
  const telugu = String(
    album?.artist_name_telugu ||
    album?.artist_telugu ||
    ""
  ).trim();

  const primary = String(
    album?.artist_name || ""
  ).trim();

  const english = String(
    album?.artist_name_english ||
    album?.artist_english ||
    ""
  ).trim();

  if (telugu && telugu !== english) {
    return telugu;
  }

  if (primary && primary !== english) {
    return primary;
  }

  return "";
};

/* =========================================================
   ALBUMS COMPONENT
========================================================= */

function Albums() {
  const navigate = useNavigate();

  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchQuery, setSearchQuery] = useState("");

  // All Languages is selected by default.
  const [selectedLanguage, setSelectedLanguage] =
    useState("All");

  const [voiceLanguage, setVoiceLanguage] =
    useState("te-IN");

  /* VOICE SEARCH */

  const handleVoiceSearch = (recognizedText) => {
    setSearchQuery(recognizedText);
  };

  /* FETCH ALBUMS */

  const fetchAlbums = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await API.get("/albums");

      const data = response?.data;

      const albumList = Array.isArray(data?.albums)
        ? data.albums
        : Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data)
            ? data
            : [];

      setAlbums(albumList);
    } catch (err) {
      console.error("Unable to load albums:", err);

      setError(
        "Unable to load albums. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlbums();
  }, []);

  /* SEARCH AND LANGUAGE FILTER */

  const query = searchQuery.trim().toLowerCase();

  const filteredAlbums = useMemo(() => {
    const matchingAlbums = albums.filter((album) => {
      const searchableFields = [
        album?.title,
        album?.title_english,
        album?.title_telugu,

        album?.artist_name,
        album?.artist_name_english,
        album?.artist_name_telugu,

        album?.artist_english,
        album?.artist_telugu,
      ];

      const matchesSearch =
        !query ||
        searchableFields.some((field) =>
          String(field || "")
            .toLowerCase()
            .includes(query)
        );

      const albumLanguages = getAlbumLanguages(album);

      const matchesLanguage =
        selectedLanguage === "All" ||
        albumLanguages.includes(selectedLanguage);

      return matchesSearch && matchesLanguage;
    });

    return [...matchingAlbums].sort((a, b) =>
      getAlbumEnglishTitle(a).localeCompare(
        getAlbumEnglishTitle(b),
        "en",
        {
          sensitivity: "base",
          numeric: true,
        }
      )
    );
  }, [albums, query, selectedLanguage]);

  /* LOADING STATE */

  if (loading) {
    return (
      <div className="albums-page">
        <div className="albums-loading">
          <span className="albums-loading-spinner" />
          <p>Loading albums...</p>
        </div>
      </div>
    );
  }

  /* MAIN PAGE */

  return (
    <div className="albums-page">

      {/* HEADER */}

      <header className="albums-header">
        <p>KEERTHANA</p>
        <h1>Albums</h1>
        <span>Christian Music Collections</span>
      </header>

      {/* ERROR STATE */}

      {error && (
        <div
          className="albums-error"
          role="alert"
        >
          <FaExclamationCircle />

          <span>{error}</span>

          <button
            type="button"
            className="albums-retry"
            onClick={fetchAlbums}
          >
            <FaRedoAlt />
            Retry
          </button>
        </div>
      )}

      {!error && (
        <section className="albums-section">

          {/* SECTION HEADING */}

          <div className="albums-section-heading">
            <div>
              <span className="albums-section-eyebrow">
                YOUR MUSIC COLLECTION
              </span>

              <h2>
                {query
                  ? "Search Results"
                  : "Explore Albums"}
              </h2>
            </div>

            <span className="albums-total">
              {query || selectedLanguage !== "All"
                ? `${filteredAlbums.length} ${
                    filteredAlbums.length === 1
                      ? "Match"
                      : "Matches"
                  }`
                : `${albums.length} ${
                    albums.length === 1
                      ? "Album"
                      : "Albums"
                  }`}
            </span>
          </div>

          {/* VOICE SEARCH */}

          <section
            className="albums-voice-search-section"
            aria-label="Search albums"
          >
            <VoiceSearch
              value={searchQuery}
              onChange={setSearchQuery}
              onSearch={handleVoiceSearch}
              language={voiceLanguage}
              onLanguageChange={setVoiceLanguage}
              placeholder="Search albums..."
              ariaLabel="Search albums by album title "
            />
          </section>

          {/* LANGUAGE DROPDOWN */}

          <section
            className="albums-filter-bar"
            aria-label="Filter albums by language"
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
              htmlFor="albums-language-filter"
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
              id="albums-language-filter"
              className="albums-language-select"
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
          </section>

          {/* SEARCH RESULTS COUNT */}

          {(query || selectedLanguage !== "All") && (
            <p
              className="albums-search-summary"
              aria-live="polite"
            >
              {filteredAlbums.length}{" "}
              {filteredAlbums.length === 1
                ? "album"
                : "albums"}{" "}
              found
            </p>
          )}

          {/* ALBUM GRID */}

          {filteredAlbums.length > 0 ? (
            <div
              className="albums-grid"
              id="albums-grid"
            >
              {filteredAlbums.map((album) => {
                let coverUrl = DEFAULT_ALBUM_IMAGE;

                try {
                  coverUrl =
                    getAlbumCover(album) ||
                    DEFAULT_ALBUM_IMAGE;
                } catch (coverError) {
                  console.warn(
                    "Unable to resolve album cover:",
                    coverError
                  );
                }

                const songCount =
                  Number(album.song_count) || 0;

                const englishTitle =
                  getAlbumEnglishTitle(album);

                const teluguTitle =
                  getAlbumTeluguTitle(album);

                const englishArtist =
                  getArtistEnglishName(album);

                const teluguArtist =
                  getArtistTeluguName(album);

                return (
                  <article
                    className="album-card"
                    key={album.id}
                    role="button"
                    tabIndex={0}
                    aria-label={`Open album ${englishTitle}`}
                    onClick={() =>
                      navigate(`/albums/${album.id}`)
                    }
                    onKeyDown={(event) => {
                      if (
                        event.key === "Enter" ||
                        event.key === " "
                      ) {
                        event.preventDefault();

                        navigate(`/albums/${album.id}`);
                      }
                    }}
                  >

                    {/* ALBUM COVER */}

                    <div className="album-card-cover">
                      <img
                        src={coverUrl}
                        alt={`${englishTitle} album cover`}
                        loading="lazy"
                        onError={(event) => {
                          event.currentTarget.onerror = null;

                          event.currentTarget.src =
                            DEFAULT_ALBUM_IMAGE;
                        }}
                      />

                      <div className="album-cover-overlay">
                        <span className="album-cover-play">
                          <FaCompactDisc />
                        </span>
                      </div>
                    </div>

                    {/* ALBUM DETAILS */}

                    <div className="album-card-info">

                      {/* BILINGUAL ALBUM TITLE */}

                      <div className="album-card-names">
                        <h3 title={englishTitle}>
                          {englishTitle}
                        </h3>

                        {teluguTitle && (
                          <span className="album-telugu-title">
                            {teluguTitle}
                          </span>
                        )}
                      </div>

                      {/* ARTIST NAMES
                          No KEERTHANA fallback. */}

                      {(englishArtist || teluguArtist) && (
                        <div className="album-card-artist-names">

                          {englishArtist && (
                            <p title={englishArtist}>
                              {englishArtist}
                            </p>
                          )}

                          {teluguArtist && (
                            <span className="album-telugu-artist">
                              {teluguArtist}
                            </span>
                          )}

                        </div>
                      )}

                      {/* SONG COUNT */}

                      <span className="album-song-count">
                        <FaMusic />

                        {songCount}{" "}
                        {songCount === 1
                          ? "Song"
                          : "Songs"}
                      </span>

                    </div>
                  </article>
                );
              })}
            </div>
          ) : (

            /* EMPTY STATE */

            <div className="albums-empty">

              <div className="albums-empty-icon">
                <FaCompactDisc />
              </div>

              <h2>
                {query || selectedLanguage !== "All"
                  ? "No Matching Albums"
                  : "No Albums Available"}
              </h2>

              <p>
                {query || selectedLanguage !== "All"
                  ? "Try another album title or artist name, or choose All Languages."
                  : "Your Christian music collections will appear here when albums are available."}
              </p>

              {(query || selectedLanguage !== "All") ? (
                <button
                  type="button"
                  className="albums-reset-search"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedLanguage("All");
                  }}
                >
                  <FaTimes />
                  Clear Filters
                </button>
              ) : (
                <button
                  type="button"
                  className="albums-retry"
                  onClick={fetchAlbums}
                >
                  <FaRedoAlt />
                  Refresh Albums
                </button>
              )}

            </div>
          )}

        </section>
      )}
    </div>
  );
}

export default Albums;
