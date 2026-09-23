import React, {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  FaMusic,
  FaMicrophone,
  FaSearch,
} from "react-icons/fa";

import API from "../services/api";

import VoiceSearch from "../components/VoiceSearch";

import "../assets/css/search.css";

function Search() {
  const [query, setQuery] =
    useState("");

  const [songs, setSongs] =
    useState([]);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [searched, setSearched] =
    useState(false);

  const [voiceLanguage, setVoiceLanguage] =
    useState("en-IN");

  const handleSearch = useCallback(
    async (searchQuery) => {
      const cleanQuery =
        String(searchQuery || "").trim();

      if (!cleanQuery) {
        return;
      }

      try {
        setLoading(true);
        setError("");
        setSearched(true);

        const response =
          await API.get(
            `/songs/search?q=${encodeURIComponent(
              cleanQuery
            )}`
          );

        setSongs(
          response.data?.songs || []
        );
      } catch (error) {
        console.error(
          "Search error:",
          error
        );

        setSongs([]);

        setError(
          error.response?.data
            ?.message ||
            "Unable to search songs."
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const handleVoiceSearch = useCallback(
    (voiceText) => {
      const cleanText =
        String(
          voiceText || ""
        ).trim();

      if (!cleanText) {
        return;
      }

      setQuery(cleanText);

      handleSearch(cleanText);
    },
    [handleSearch]
  );

  useEffect(() => {
    const params =
      new URLSearchParams(
        window.location.search
      );

    const initialQuery =
      params.get("q");

    if (initialQuery) {
      setQuery(initialQuery);

      handleSearch(initialQuery);
    }
  }, [handleSearch]);

  const handlePlaySong = (song) => {
    console.log(
      "Play song:",
      song
    );

    // Connect your existing MusicPlayer here.
  };

  return (
    <div className="search-page">

      <div className="search-page-header">

        <span className="search-page-label">
          KEERTHANA
        </span>

        <h1>
          Search Music
        </h1>

        <p>
          Search Christian songs by
          title, artist, lyrics, or voice.
        </p>

      </div>

      <div className="search-main-area">

        <VoiceSearch
          value={query}
          onChange={setQuery}
          onSearch={handleVoiceSearch}
          language={voiceLanguage}
        />

        <div className="voice-language-selector">

          <span>
            Voice Language
          </span>

          <select
            value={voiceLanguage}
            onChange={(event) =>
              setVoiceLanguage(
                event.target.value
              )
            }
          >
            <option value="en-IN">
              English
            </option>

            <option value="te-IN">
              తెలుగు
            </option>

            <option value="hi-IN">
              हिन्दी
            </option>

            <option value="ta-IN">
              தமிழ்
            </option>

            <option value="kn-IN">
              ಕನ್ನಡ
            </option>

            <option value="ml-IN">
              മലയാളം
            </option>
          </select>

        </div>

      </div>

      {loading && (
        <div className="search-loading">
          Searching songs...
        </div>
      )}

      {!loading && error && (
        <div className="search-error">
          {error}
        </div>
      )}

      {!loading &&
        !error &&
        searched &&
        songs.length > 0 && (

          <section className="search-results">

            <div className="search-results-header">

              <div>
                <span>
                  SEARCH RESULTS
                </span>

                <h2>
                  {songs.length}{" "}
                  {songs.length === 1
                    ? "Song"
                    : "Songs"}{" "}
                  Found
                </h2>
              </div>

              <div className="search-results-query">

                <FaSearch />

                <span>
                  {query}
                </span>

              </div>

            </div>

            <div className="search-song-list">

              {songs.map((song) => (

                <div
                  key={song.id}
                  className="search-song-card"
                  onClick={() =>
                    handlePlaySong(song)
                  }
                >

                  <div className="search-song-cover">

                    {song.cover_url ? (
                      <img
                        src={
                          song.cover_url
                        }
                        alt={
                          song.title
                        }
                      />
                    ) : (
                      <FaMusic />
                    )}

                  </div>

                  <div className="search-song-info">

                    <h3>
                      {song.title}
                    </h3>

                    <p>
                      {song.artist_name ||
                        song.artist ||
                        "Unknown Artist"}
                    </p>

                    <span>
                      {song.language ||
                        "Music"}
                    </span>

                  </div>

                </div>

              ))}

            </div>

          </section>
        )}

      {!loading &&
        !error &&
        searched &&
        songs.length === 0 && (

          <div className="search-empty">

            <div className="search-empty-icon">
              <FaSearch />
            </div>

            <h2>
              No songs found
            </h2>

            <p>
              Try another song, artist,
              lyric, or use voice search.
            </p>

          </div>
        )}

      {!searched && !loading && (

        <div className="search-start">

          <div className="search-start-icon">
            <FaMicrophone />
          </div>

          <h2>
            Search with your voice
          </h2>

          <p>
            Tap the microphone and say
            the name of a Christian song,
            artist, or lyric.
          </p>

        </div>
      )}

    </div>
  );
}

export default Search;