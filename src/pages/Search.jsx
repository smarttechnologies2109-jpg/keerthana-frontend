import React, {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  FaMusic,
  FaMicrophone,
  FaSearch,
  FaPlay,
  FaPause,
} from "react-icons/fa";

import API from "../services/api";

import VoiceSearch from "../components/VoiceSearch";

import { usePlayer } from "../context/PlayerContext";

import "../assets/css/search.css";


function Search() {
  const [query, setQuery] = useState("");

  const [songs, setSongs] = useState([]);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const [searched, setSearched] = useState(false);

  const [voiceLanguage, setVoiceLanguage] =
    useState("en-IN");


  /* =========================================================
     PLAYER CONTEXT
  ========================================================= */

  const {
    currentSong,
    isPlaying,
    playSong,
    togglePlay,
  } = usePlayer();


  /* =========================================================
     SEARCH SONGS
  ========================================================= */

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

        const result =
          response.data?.songs || [];

        setSongs(result);

      } catch (error) {
        console.error(
          "Search error:",
          error
        );

        setSongs([]);

        setError(
          error.response?.data?.message ||
          "Unable to search songs."
        );

      } finally {
        setLoading(false);
      }
    },
    []
  );


  /* =========================================================
     VOICE SEARCH
  ========================================================= */

  const handleVoiceSearch =
    useCallback(
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


  /* =========================================================
     READ SEARCH QUERY FROM URL
  ========================================================= */

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


  /* =========================================================
     PLAY / PAUSE SEARCH SONG
  ========================================================= */

  const handlePlaySong = async (
    song
  ) => {
    try {
      if (!song) {
        return;
      }


      /* -----------------------------------------------------
         CHECK AUDIO
      ----------------------------------------------------- */

      if (!song.audio_url) {
        console.error(
          "Song has no audio URL:",
          song
        );

        setError(
          "This song does not have an audio file."
        );

        return;
      }


      /* -----------------------------------------------------
         SAME SONG
         
         If this song is already loaded in the
         global player, simply toggle play/pause.
      ----------------------------------------------------- */

      if (
        currentSong?.id === song.id
      ) {
        await togglePlay();

        return;
      }


      /* -----------------------------------------------------
         NEW SONG
         
         IMPORTANT:
         
         Do NOT pass the index as the third
         argument.
         
         PlayerContext expects:
         
         playSong(
           song,
           songList,
           startTime
         )
      ----------------------------------------------------- */

      await playSong(
        song,
        songs
      );

    } catch (error) {
      console.error(
        "Unable to play song:",
        error
      );

      setError(
        "Unable to play this song."
      );
    }
  };


  /* =========================================================
     IS THIS SONG CURRENTLY PLAYING?
  ========================================================= */

  const isCurrentSong =
    (song) => {
      return (
        currentSong?.id ===
        song?.id
      );
    };


  /* =========================================================
     UI
  ========================================================= */

  return (
    <div className="search-page">


      {/* =====================================================
          HEADER
      ===================================================== */}

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


      {/* =====================================================
          SEARCH
      ===================================================== */}

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


      {/* =====================================================
          LOADING
      ===================================================== */}

      {loading && (
        <div className="search-loading">
          Searching songs...
        </div>
      )}


      {/* =====================================================
          ERROR
      ===================================================== */}

      {!loading && error && (
        <div className="search-error">
          {error}
        </div>
      )}


      {/* =====================================================
          RESULTS
      ===================================================== */}

      {!loading &&
        !error &&
        searched &&
        songs.length > 0 && (

          <section className="search-results">


            {/* =================================================
                RESULTS HEADER
            ================================================= */}

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


            {/* =================================================
                SONG LIST
            ================================================= */}

            <div className="search-song-list">

              {songs.map(
                (song) => {

                  const current =
                    isCurrentSong(song);

                  return (

                    <div
                      key={song.id}
                      className={`search-song-card ${
                        current
                          ? "search-song-card-active"
                          : ""
                      }`}
                      onClick={() =>
                        handlePlaySong(song)
                      }
                    >


                      {/* =======================================
                          COVER
                      ======================================= */}

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


                        {/* =====================================
                            PLAY / PAUSE BUTTON
                        ===================================== */}

                        <button
                          type="button"
                          className="search-song-play"
                          onClick={(event) => {
                            event.stopPropagation();

                            handlePlaySong(
                              song
                            );
                          }}
                          aria-label={
                            current &&
                            isPlaying
                              ? "Pause song"
                              : "Play song"
                          }
                        >

                          {current &&
                          isPlaying ? (
                            <FaPause />
                          ) : (
                            <FaPlay />
                          )}

                        </button>

                      </div>


                      {/* =======================================
                          SONG INFORMATION
                      ======================================= */}

                      <div className="search-song-info">

                        <h3>
                          {song.title}
                        </h3>


                        {/* English title */}

                        {song.title_english &&
                          song.title_english !==
                            song.title && (

                            <p className="search-song-english-title">

                              {
                                song.title_english
                              }

                            </p>

                          )}


                        {/* Artist */}

                        <p>
                          {song.artist_name ||
                            song.artist ||
                            "Unknown Artist"}
                        </p>


                        {/* Language */}

                        <span>
                          {song.language ||
                            "Music"}
                        </span>

                      </div>


                      {/* =======================================
                          CURRENT PLAYING INDICATOR
                      ======================================= */}

                      {current && (
                        <div className="search-playing-indicator">

                          {isPlaying
                            ? "Playing"
                            : "Paused"}

                        </div>
                      )}

                    </div>

                  );
                }
              )}

            </div>

          </section>
        )}


      {/* =====================================================
          NO RESULTS
      ===================================================== */}

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


      {/* =====================================================
          START SEARCH
      ===================================================== */}

      {!searched &&
        !loading && (

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