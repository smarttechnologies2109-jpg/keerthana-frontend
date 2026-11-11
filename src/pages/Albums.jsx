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
   Bilingual display + alphabetical sorting
========================================================= */

const DEFAULT_ALBUM_IMAGE = "/default-album.png";

const getAlbumEnglishTitle = (album) => {
  const english = String(album?.title_english || "").trim();
  const primary = String(album?.title || "").trim();
  const telugu = String(album?.title_telugu || "").trim();

  if (english) return english;
  if (primary && primary !== telugu) return primary;
  return primary || telugu || "Untitled Album";
};

const getAlbumTeluguTitle = (album) => {
  const telugu = String(album?.title_telugu || "").trim();
  const primary = String(album?.title || "").trim();
  const english = String(album?.title_english || "").trim();

  if (telugu && telugu !== english) return telugu;
  if (primary && primary !== english) return primary;
  return "";
};

const getArtistEnglishName = (album) => {
  const english = String(
    album?.artist_name_english || album?.artist_english || ""
  ).trim();

  const primary = String(album?.artist_name || "").trim();
  const telugu = String(album?.artist_name_telugu || "").trim();

  if (english) return english;
  if (primary && primary !== telugu) return primary;
  return primary || telugu || "KEERTHANA";
};

const getArtistTeluguName = (album) => {
  const telugu = String(
    album?.artist_name_telugu || album?.artist_telugu || ""
  ).trim();

  const primary = String(album?.artist_name || "").trim();
  const english = String(
    album?.artist_name_english || album?.artist_english || ""
  ).trim();

  if (telugu && telugu !== english) return telugu;
  if (primary && primary !== english) return primary;
  return "";
};

function Albums() {
  const navigate = useNavigate();

  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [voiceLanguage, setVoiceLanguage] = useState("te-IN");

  /* =====================================================
     VOICE SEARCH
  ===================================================== */

  const handleVoiceSearch = (recognizedText) => {
    setSearchQuery(recognizedText);
  };

  /* =====================================================
     FETCH ALBUMS
  ===================================================== */

  const fetchAlbums = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await API.get("/albums");
      const data = response?.data;

      const albumList = Array.isArray(data?.albums)
        ? data.albums
        : Array.isArray(data)
          ? data
          : [];

      setAlbums(albumList);
    } catch (err) {
      console.error("Unable to load albums:", err);
      setError("Unable to load albums. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlbums();
  }, []);

  /* =====================================================
     SEARCH & FILTER ALBUMS
  ===================================================== */

  const query = searchQuery.trim().toLowerCase();

  const filteredAlbums = useMemo(() => {
    const matchingAlbums = albums.filter((album) => {
      if (!query) return true;

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

      return searchableFields.some((field) =>
        String(field || "").toLowerCase().includes(query)
      );
    });

    return [...matchingAlbums].sort((a, b) =>
      getAlbumEnglishTitle(a).localeCompare(
        getAlbumEnglishTitle(b),
        "en",
        { sensitivity: "base", numeric: true }
      )
    );
  }, [albums, query]);

  /* =====================================================
     LOADING STATE
  ===================================================== */

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

  /* =====================================================
     MAIN PAGE
  ===================================================== */

  return (
    <div className="albums-page">
      <header className="albums-header">
        <p>KEERTHANA</p>
        <h1>Albums</h1>
        <span>Christian Music Collections</span>
      </header>

      {/* ERROR STATE */}

      {error && (
        <div className="albums-error" role="alert">
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
          <div className="albums-section-heading">
            <div>
              <span className="albums-section-eyebrow">
                YOUR MUSIC COLLECTION
              </span>

              <h2>
                {query ? "Search Results" : "Explore Albums"}
              </h2>
            </div>

            <span className="albums-total">
              {query
                ? `${filteredAlbums.length} ${
                    filteredAlbums.length === 1 ? "Match" : "Matches"
                  }`
                : `${albums.length} ${
                    albums.length === 1 ? "Album" : "Albums"
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
              placeholder="Search albums or artists..."
              ariaLabel="Search albums by album title or artist"
            />
          </section>

          {query && (
            <p
              className="albums-search-summary"
              aria-live="polite"
            >
              {filteredAlbums.length}{" "}
              {filteredAlbums.length === 1 ? "album" : "albums"} found
            </p>
          )}

          {/* ALPHABETICALLY SORTED ALBUM GRID */}

          {filteredAlbums.length > 0 ? (
            <div className="albums-grid" id="albums-grid">
              {filteredAlbums.map((album) => {
                let coverUrl = DEFAULT_ALBUM_IMAGE;

                try {
                  coverUrl = getAlbumCover(album) || DEFAULT_ALBUM_IMAGE;
                } catch (coverError) {
                  console.warn(
                    "Unable to resolve album cover:",
                    coverError
                  );
                }

                const songCount = Number(album.song_count) || 0;
                const englishTitle = getAlbumEnglishTitle(album);
                const teluguTitle = getAlbumTeluguTitle(album);
                const englishArtist = getArtistEnglishName(album);
                const teluguArtist = getArtistTeluguName(album);

                return (
                  <article
                    className="album-card"
                    key={album.id}
                    role="button"
                    tabIndex={0}
                    aria-label={`Open album ${englishTitle}`}
                    onClick={() => navigate(`/albums/${album.id}`)}
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
                    <div className="album-card-cover">
                      <img
                        src={coverUrl}
                        alt={`${englishTitle} album cover`}
                        loading="lazy"
                        onError={(event) => {
                          event.currentTarget.onerror = null;
                          event.currentTarget.src = DEFAULT_ALBUM_IMAGE;
                        }}
                      />

                      <div className="album-cover-overlay">
                        <span className="album-cover-play">
                          <FaCompactDisc />
                        </span>
                      </div>
                    </div>

                    <div className="album-card-info">
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

                      <div className="album-card-artist-names">
                        <p title={englishArtist}>
                          {englishArtist}
                        </p>

                        {teluguArtist && (
                          <span className="album-telugu-artist">
                            {teluguArtist}
                          </span>
                        )}
                      </div>

                      <span className="album-song-count">
                        <FaMusic />
                        {songCount}{" "}
                        {songCount === 1 ? "Song" : "Songs"}
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="albums-empty">
              <div className="albums-empty-icon">
                <FaCompactDisc />
              </div>

              <h2>
                {query
                  ? "No Matching Albums"
                  : "No Albums Available"}
              </h2>

              <p>
                {query
                  ? "Try another album title or artist name."
                  : "Your Christian music collections will appear here when albums are available."}
              </p>

              {query ? (
                <button
                  type="button"
                  className="albums-reset-search"
                  onClick={() => setSearchQuery("")}
                >
                  <FaTimes />
                  Clear Search
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
