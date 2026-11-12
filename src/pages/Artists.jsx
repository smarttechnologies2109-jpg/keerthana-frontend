import { useEffect, useMemo, useState } from "react";
import { FaMicrophone } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

import API from "../services/api";
import { getMediaUrl } from "../utils/media";
import VoiceSearch from "../components/VoiceSearch";

import "../assets/css/artists.css";

/* =========================================================
   KEERTHANA — ARTISTS
   Bilingual names + alphabetical card order + language filter
========================================================= */

const DEFAULT_VOICE_LANGUAGE = "te-IN";

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

const getArtistEnglishName = (artist) => {
  const englishName = String(artist?.name_english || "").trim();
  const teluguName = String(artist?.name_telugu || "").trim();
  const legacyName = String(artist?.name || "").trim();

  if (englishName) return englishName;
  if (legacyName && legacyName !== teluguName) return legacyName;
  return teluguName || "Unknown Artist";
};

const getArtistTeluguName = (artist) => {
  const teluguName = String(artist?.name_telugu || "").trim();
  const englishName = String(artist?.name_english || "").trim();
  const legacyName = String(artist?.name || "").trim();

  if (teluguName && teluguName !== englishName) return teluguName;
  if (legacyName && legacyName !== englishName) return legacyName;
  return "";
};

/* Read language values from common API response shapes.
   Artists without a language value remain visible under All Languages. */
const getArtistLanguages = (artist) => {
  const rawValues = [
    artist?.language,
    artist?.language_name,
    artist?.language_code,
    artist?.primary_language,
    ...(Array.isArray(artist?.languages) ? artist.languages : []),
    ...(Array.isArray(artist?.song_languages) ? artist.song_languages : []),
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

function Artists() {
  const navigate = useNavigate();

  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("All");
  const [voiceLanguage, setVoiceLanguage] = useState(
    DEFAULT_VOICE_LANGUAGE
  );

  /* -------------------------------------------------------
     LOAD ARTISTS
  ------------------------------------------------------- */

  useEffect(() => {
    let cancelled = false;

    const loadArtists = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await API.get("/artists");
        const data = response?.data;

        const artistList = Array.isArray(data)
          ? data
          : Array.isArray(data?.artists)
            ? data.artists
            : Array.isArray(data?.data)
              ? data.data
              : [];

        if (!cancelled) {
          setArtists(artistList);
        }
      } catch (err) {
        console.error("Artists error:", err);

        if (!cancelled) {
          setError("Unable to load artists. Please try again.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadArtists();

    return () => {
      cancelled = true;
    };
  }, []);

  /* -------------------------------------------------------
     SEARCH + LANGUAGE FILTER
  ------------------------------------------------------- */

  const query = searchQuery.trim().toLowerCase();

  const filteredArtists = useMemo(() => {
    return artists
      .filter((artist) => {
        const searchableFields = [
          artist?.name,
          artist?.name_english,
          artist?.name_telugu,
        ];

        const matchesSearch =
          !query ||
          searchableFields.some((field) =>
            String(field || "").toLowerCase().includes(query)
          );

        const artistLanguages = getArtistLanguages(artist);
        const matchesLanguage =
          selectedLanguage === "All" ||
          artistLanguages.includes(selectedLanguage);

        return matchesSearch && matchesLanguage;
      })
      .sort((artistA, artistB) =>
        getArtistEnglishName(artistA).localeCompare(
          getArtistEnglishName(artistB),
          "en",
          { sensitivity: "base", numeric: true }
        )
      );
  }, [artists, query, selectedLanguage]);

  const handleVoiceSearch = (recognizedText) => {
    setSearchQuery(recognizedText);
  };

  /* -------------------------------------------------------
     LOADING STATE
  ------------------------------------------------------- */

  if (loading) {
    return (
      <main className="artists-page">
        <p className="artists-loading" role="status">
          Loading artists...
        </p>
      </main>
    );
  }

  /* -------------------------------------------------------
     PAGE
  ------------------------------------------------------- */

  return (
    <main className="artists-page">
      <header className="artists-header">
        <p>KEERTHANA</p>
        <h1>Artists</h1>
        <span>Christian singers and worship artists</span>
      </header>

      {/* SINGLE SEARCH BAR WITH VOICE SEARCH */}
      <section
        className="artists-search-section"
        aria-label="Search artists"
      >
        <VoiceSearch
          value={searchQuery}
          onChange={setSearchQuery}
          onSearch={handleVoiceSearch}
          language={voiceLanguage}
          onLanguageChange={setVoiceLanguage}
          placeholder="Search artists..."
          ariaLabel="Search artists by English or Telugu name"
        />
      </section>

      {/* LANGUAGE FILTER — DEFAULT: ALL LANGUAGES */}
      <section
        className="artists-filter-bar"
        aria-label="Filter artists by language"
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
          htmlFor="artists-language-filter"
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
          id="artists-language-filter"
          className="artists-language-select"
          value={selectedLanguage}
          onChange={(event) => setSelectedLanguage(event.target.value)}
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
              style={{ background: "#101d35", color: "#f5f7fb" }}
            >
              {language.label}
            </option>
          ))}
        </select>
      </section>

      {/* SEARCH RESULTS COUNT */}
      {(query || selectedLanguage !== "All") && !error && (
        <p className="artists-search-summary" aria-live="polite">
          {filteredArtists.length}{" "}
          {filteredArtists.length === 1 ? "artist" : "artists"} found
        </p>
      )}

      {/* ERROR STATE */}
      {error && (
        <div className="artists-error" role="alert">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => window.location.reload()}
          >
            Try again
          </button>
        </div>
      )}

      {/* ARTIST COLLECTION — A TO Z */}
      {!error && filteredArtists.length > 0 && (
        <section
          className="artists-grid"
          id="artists-grid"
          aria-label="Artists"
        >
          {filteredArtists.map((artist) => {
            let image = null;

            if (artist.image_url) {
              try {
                image = getMediaUrl(artist.image_url);
              } catch {
                image = null;
              }
            }

            const englishName = getArtistEnglishName(artist);
            const teluguName = getArtistTeluguName(artist);

            return (
              <button
                type="button"
                className="artist-card"
                key={artist.id}
                onClick={() => navigate(`/artists/${artist.id}`)}
                aria-label={`View ${englishName}${teluguName ? `, ${teluguName}` : ""}`}
              >
                <div className="artist-image">
                  {image ? (
                    <img
                      src={image}
                      alt={englishName}
                      loading="lazy"
                      onError={(event) => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.style.display = "none";
                      }}
                    />
                  ) : (
                    <FaMicrophone aria-hidden="true" />
                  )}
                </div>

                <div className="artist-card-names">
                  <h3>{englishName}</h3>
                  {teluguName && (
                    <p className="artist-telugu-name">{teluguName}</p>
                  )}
                </div>

                <p>Artist</p>

                <span>{artist.song_count ?? 0} songs</span>
              </button>
            );
          })}
        </section>
      )}

      {/* EMPTY STATE */}
      {!error && filteredArtists.length === 0 && (
        <div className="artists-empty">
          <FaMicrophone
            className="artists-empty-icon"
            aria-hidden="true"
          />

          <h2>
            {query || selectedLanguage !== "All"
              ? "No matching artists"
              : "No artists available"}
          </h2>

          <p>
            {query || selectedLanguage !== "All"
              ? "Try another artist name or choose All Languages."
              : "Artists will appear here when they are available."}
          </p>

          {(query || selectedLanguage !== "All") && (
            <button
              type="button"
              className="artists-reset-search"
              onClick={() => {
                setSearchQuery("");
                setSelectedLanguage("All");
              }}
            >
              Clear filters
            </button>
          )}
        </div>
      )}
    </main>
  );
}

export default Artists;
