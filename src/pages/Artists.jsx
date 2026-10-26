
import { useEffect, useState } from "react";
import { FaMicrophone } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

import API from "../services/api";
import { getMediaUrl } from "../utils/media";
import VoiceSearch from "../components/VoiceSearch";

import "../assets/css/artists.css";

/* =========================================================
   KEERTHANA — ARTISTS
========================================================= */

const DEFAULT_VOICE_LANGUAGE = "te-IN";

function Artists() {
  const navigate = useNavigate();

  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
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
            : [];

        if (!cancelled) {
          setArtists(artistList);
        }
      } catch (err) {
        console.error("Artists error:", err);

        if (!cancelled) {
          setError(
            "Unable to load artists. Please try again."
          );
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
     SEARCH — TYPED OR VOICE
  ------------------------------------------------------- */

  const query = searchQuery.trim().toLowerCase();

  const filteredArtists = artists.filter((artist) => {
    if (!query) return true;

    return String(artist?.name || "")
      .toLowerCase()
      .includes(query);
  });

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

        <span>
          Christian singers and worship artists
        </span>
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
          ariaLabel="Search artists by name"
        />
      </section>

      {/* SEARCH RESULTS COUNT */}

      {query && !error && (
        <p
          className="artists-search-summary"
          aria-live="polite"
        >
          {filteredArtists.length}{" "}
          {filteredArtists.length === 1
            ? "artist"
            : "artists"}{" "}
          found
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

      {/* ARTIST COLLECTION */}

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

            return (
              <button
                type="button"
                className="artist-card"
                key={artist.id}
                onClick={() =>
                  navigate(`/artists/${artist.id}`)
                }
                aria-label={`View ${artist.name || "artist"}`}
              >
                <div className="artist-image">
                  {image ? (
                    <img
                      src={image}
                      alt={artist.name || "Artist"}
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

                <h3>{artist.name || "Unknown Artist"}</h3>

                <p>Artist</p>

                <span>
                  {artist.song_count ?? 0} songs
                </span>
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
            {query
              ? "No matching artists"
              : "No artists available"}
          </h2>

          <p>
            {query
              ? "Try another artist name or clear your search."
              : "Artists will appear here when they are available."}
          </p>

          {query && (
            <button
              type="button"
              className="artists-reset-search"
              onClick={() => setSearchQuery("")}
            >
              Clear search
            </button>
          )}
        </div>
      )}
    </main>
  );
}

export default Artists;
