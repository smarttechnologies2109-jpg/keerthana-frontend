import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaMusic,
  FaCompactDisc,
  FaUsers,
  FaFolderOpen,
  FaChurch,
  FaGlobe,
  FaLanguage,
  FaArrowRight,
} from "react-icons/fa";
import API from "../../services/api";
import "../../assets/css/businessowner/BusinessOwnerMusic.css";

/* =========================================================
   BUSINESS OWNER MUSIC
   Language cards are calculated from the complete song list.
========================================================= */

const LANGUAGES = [
  "Telugu",
  "Hindi",
  "English",
  "Malayalam",
  "Kannada",
  "Tamil",
];

const normalizeLanguage = (value) => {
  const raw = String(value ?? "").trim().toLowerCase();
  if (!raw) return "";

  const aliases = {
    te: "telugu",
    "te-in": "telugu",
    telugu: "telugu",
    hi: "hindi",
    "hi-in": "hindi",
    hindi: "hindi",
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

  return aliases[raw] || raw;
};

const extractSongs = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.songs)) return payload.songs;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.songs)) return payload.data.songs;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
};

const BusinessOwnerMusic = () => {
  const navigate = useNavigate();
  const [songs, setSongs] = useState([]);
  const [songsLoading, setSongsLoading] = useState(true);
  const [songsError, setSongsError] = useState("");

  useEffect(() => {
    let active = true;

    const loadSongs = async () => {
      try {
        setSongsLoading(true);
        setSongsError("");

        // Fetch without a language parameter so counts represent the full collection.
        const response = await API.get("/owner/music/songs");
        const allSongs = extractSongs(response?.data);

        if (active) setSongs(allSongs);
      } catch (error) {
        console.error("Failed to load music collection counts:", error);
        if (active) {
          setSongs([]);
          setSongsError(
            error?.response?.data?.message ||
              "Unable to load language-wise song counts."
          );
        }
      } finally {
        if (active) setSongsLoading(false);
      }
    };

    loadSongs();
    return () => {
      active = false;
    };
  }, []);

  const languageCounts = useMemo(() => {
    const counts = Object.fromEntries(LANGUAGES.map((language) => [language, 0]));

    songs.forEach((song) => {
      const normalized = normalizeLanguage(song?.language);
      const matchingLanguage = LANGUAGES.find(
        (language) => normalizeLanguage(language) === normalized
      );
      if (matchingLanguage) counts[matchingLanguage] += 1;
    });

    return counts;
  }, [songs]);

  const musicSections = [
    {
      key: "songs",
      title: "Songs",
      description: "View all songs in the KEERTHANA collection.",
      icon: <FaMusic />,
      path: "/owner/music/songs",
    },
    {
      key: "albums",
      title: "Albums",
      description: "View all albums available in the KEERTHANA collection.",
      icon: <FaCompactDisc />,
      path: "/owner/music/albums",
    },
    {
      key: "artists",
      title: "Artists",
      description: "View artists and their music collection.",
      icon: <FaUsers />,
      path: "/owner/music/artists",
    },
    {
      key: "categories",
      title: "Categories",
      description: "View music categories used in KEERTHANA.",
      icon: <FaFolderOpen />,
      path: "/owner/music/categories",
    },
    {
      key: "ministries",
      title: "Ministries",
      description: "View ministries and their songs.",
      icon: <FaChurch />,
      path: "/owner/music/ministries",
    },
  ];

  const totalSongs = songs.length;

  return (
    <div className="owner-music-page">
      <header className="owner-music-header">
        <button
          type="button"
          className="owner-music-back-button"
          onClick={() => navigate("/owner/dashboard")}
        >
          <FaArrowLeft />
          <span>Dashboard</span>
        </button>

        <div className="owner-music-heading">
          <div className="owner-music-heading-icon">
            <FaMusic />
          </div>
          <div>
            <h1>Music Collection</h1>
            <p>Manage and explore the KEERTHANA music collection.</p>
          </div>
        </div>
      </header>

      <main className="owner-music-content">
        {/* OVERALL COLLECTION SUMMARY */}
        <section className="owner-music-language-section">
          <div className="owner-music-section-heading">
            <div>
              <span className="owner-music-eyebrow">COLLECTION OVERVIEW</span>
              <h2>Music by Language</h2>
              <p>Choose a language to view its songs in the collection.</p>
            </div>
            <div className="owner-music-total-card">
              <span><FaMusic /> Total Songs</span>
              <strong>{songsLoading ? "…" : totalSongs.toLocaleString("en-IN")}</strong>
            </div>
          </div>

          {songsError && (
            <div className="owner-music-count-error" role="alert">
              {songsError}
            </div>
          )}

          <div className="owner-music-language-grid">
            <button
              type="button"
              className="owner-music-language-card owner-music-language-card-all"
              onClick={() => navigate("/owner/music/songs")}
            >
              <span className="owner-music-language-icon"><FaGlobe /></span>
              <span className="owner-music-language-name">All Languages</span>
              <strong>{songsLoading ? "…" : totalSongs.toLocaleString("en-IN")}</strong>
              <span className="owner-music-language-caption">Total collection</span>
              <FaArrowRight className="owner-music-language-arrow" />
            </button>

            {LANGUAGES.map((language) => (
              <button
                type="button"
                key={language}
                className="owner-music-language-card"
                onClick={() =>
                  navigate(
                    `/owner/music/songs?language=${encodeURIComponent(language)}`
                  )
                }
              >
                <span className="owner-music-language-icon"><FaLanguage /></span>
                <span className="owner-music-language-name">{language}</span>
                <strong>
                  {songsLoading
                    ? "…"
                    : (languageCounts[language] || 0).toLocaleString("en-IN")}
                </strong>
                <span className="owner-music-language-caption">Songs available</span>
                <FaArrowRight className="owner-music-language-arrow" />
              </button>
            ))}
          </div>
          <p className="owner-music-language-footnote">
            {songsLoading
              ? "Loading language-wise collection…"
              : "Select any language card to open its song collection."}
          </p>
        </section>

        {/* MUSIC MANAGEMENT SECTIONS */}
        <section className="owner-music-management-section">
          <div className="owner-music-section-heading owner-music-management-heading">
            <div>
              <span className="owner-music-eyebrow">MANAGEMENT</span>
              <h2>Explore Music Collection</h2>
              <p>Browse the songs, albums, artists, categories and ministries.</p>
            </div>
          </div>

          <div className="owner-music-grid">
            {musicSections.map((section) => (
              <button
                type="button"
                key={section.key}
                className="owner-music-section-card"
                onClick={() => navigate(section.path)}
              >
                <div className="owner-music-section-icon">{section.icon}</div>
                <div className="owner-music-section-content">
                  <h2>{section.title}</h2>
                  <p>{section.description}</p>
                </div>
                <div className="owner-music-section-arrow">→</div>
              </button>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default BusinessOwnerMusic;
