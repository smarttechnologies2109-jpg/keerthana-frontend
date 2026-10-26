
import {
  useEffect,
  useState,
} from "react";

import {
  FaCompactDisc,
  FaExclamationCircle,
  FaMusic,
  FaRedoAlt,
  FaTimes,
} from "react-icons/fa";

import {
  useNavigate,
} from "react-router-dom";

import API from "../services/api";

import {
  getAlbumCover,
  DEFAULT_ALBUM,
} from "../utils/media";

import VoiceSearch from "../components/VoiceSearch";

import "../assets/css/albums.css";

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

      setAlbums(
        Array.isArray(response.data?.albums)
          ? response.data.albums
          : []
      );
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

  const filteredAlbums = albums.filter((album) => {
    if (!query) return true;

    const title = (album.title || "").toLowerCase();
    const artist = (album.artist_name || "").toLowerCase();

    return (
      title.includes(query) ||
      artist.includes(query)
    );
  });

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
      {/* COMPACT HEADER */}

      <header className="albums-header">
        <p>KEERTHANA</p>

        <h1>Albums</h1>

        <span>
          Christian Music Collections
        </span>
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

      {/* ALBUM COLLECTION */}

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

          {/* VOICE SEARCH
              VoiceSearch already includes its own:
              - Search input
              - Clear button
              - Microphone
              - Voice-language selector
          */}

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

          {/* SEARCH SUMMARY */}

          {query && (
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

          {/* FILTERED ALBUM GRID */}

          {filteredAlbums.length > 0 ? (
            <div
              className="albums-grid"
              id="albums-grid"
            >
              {filteredAlbums.map((album) => {
                const coverUrl = getAlbumCover(album);

                const songCount =
                  Number(album.song_count) || 0;

                return (
                  <article
                    className="album-card"
                    key={album.id}
                    role="button"
                    tabIndex={0}
                    aria-label={`Open album ${
                      album.title || "Album"
                    }`}
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
                        alt={album.title || "Album cover"}
                        loading="lazy"
                        onError={(event) => {
                          if (
                            event.currentTarget.dataset
                              .fallbackApplied
                          ) {
                            return;
                          }

                          event.currentTarget.dataset
                            .fallbackApplied = "true";

                          event.currentTarget.src =
                            DEFAULT_ALBUM;
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
                      <h3
                        title={
                          album.title || "Untitled album"
                        }
                      >
                        {album.title || "Untitled Album"}
                      </h3>

                      <p
                        title={
                          album.artist_name || "KEERTHANA"
                        }
                      >
                        {album.artist_name || "KEERTHANA"}
                      </p>

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
            /* NO MATCHES / EMPTY STATE */

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
