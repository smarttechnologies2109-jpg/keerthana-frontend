import React, { useEffect, useState } from "react";
import API from "../services/api";

import {
  FaMusic,
  FaClock,
  FaHeadphones,
  FaCheckCircle,
  FaChartBar,
  FaMicrophone,
  FaGlobe,
} from "react-icons/fa";

import "../assets/css/Statistics.css";
import Sidebar from "../components/Sidebar";
import MusicPlayer from "../components/MusicPlayer";

/* =========================================================
   FORMAT LISTENING TIME
========================================================= */

const formatTime = (seconds) => {
  const totalSeconds = Number(seconds) || 0;

  const hours = Math.floor(
    totalSeconds / 3600
  );

  const minutes = Math.floor(
    (totalSeconds % 3600) / 60
  );

  const remainingSeconds =
    totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  }

  return `${remainingSeconds}s`;
};

/* =========================================================
   FORMAT HOUR
========================================================= */

const formatHour = (hour) => {
  if (
    hour === null ||
    hour === undefined
  ) {
    return "--";
  }

  const h = Number(hour);

  if (Number.isNaN(h)) {
    return "--";
  }

  const suffix =
    h >= 12 ? "PM" : "AM";

  const formattedHour =
    h % 12 || 12;

  return `${formattedHour} ${suffix}`;
};

/* =========================================================
   STATISTICS PAGE
========================================================= */

const Statistics = () => {
  const [
    statistics,
    setStatistics,
  ] = useState(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  /* =======================================================
     LOAD STATISTICS
  ======================================================= */

  useEffect(() => {
    let active = true;

    const loadStatistics = async () => {
      try {
        setLoading(true);
        setError("");

        /* ===============================================
           CHECK LOGIN TOKEN
        =============================================== */

        const token =
          localStorage.getItem(
            "keerthana_token"
          );

        if (!token) {
          if (active) {
            setError(
              "Please login to view your listening statistics."
            );
          }

          return;
        }

        /* ===============================================
           API REQUEST

           api.js automatically adds:

           Authorization:
           Bearer <token>
        =============================================== */

        const response =
          await API.get(
            "/statistics"
          );

        if (!active) {
          return;
        }

        /* ===============================================
           SUCCESS
        =============================================== */

        if (
          response.data?.success
        ) {
          setStatistics(
            response.data
          );
        } else {
          setError(
            response.data?.message ||
              "Failed to load statistics"
          );
        }
      } catch (err) {
        console.error(
          "Statistics API error:",
          err.response?.data ||
            err.message
        );

        if (!active) {
          return;
        }

        /* ===============================================
           AUTHENTICATION ERROR
        =============================================== */

        if (
          err.response?.status ===
          401
        ) {
          setError(
            "Your login session has expired. Please login again."
          );

          return;
        }

        /* ===============================================
           SERVER ERROR
        =============================================== */

        setError(
          err.response?.data?.message ||
            "Failed to load listening statistics"
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadStatistics();

    return () => {
      active = false;
    };
  }, []);

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <div className="statistics-page">

        <div className="statistics-loading">

          <FaChartBar />

          <span>
            Loading your listening statistics...
          </span>

        </div>

      </div>
    );
  }

  /* =======================================================
     ERROR
  ======================================================= */

  if (error) {
    return (
      <div className="statistics-page">

        <div className="statistics-error">

          <FaChartBar />

          <h2>
            Unable to Load Statistics
          </h2>

          <p>
            {error}
          </p>

        </div>

      </div>
    );
  }

  /* =======================================================
     DATA
  ======================================================= */

  const overview =
    statistics?.overview || {};

  const topSongs =
    statistics?.topSongs || [];

  const topArtists =
    statistics?.topArtists || [];

  const topLanguages =
    statistics?.topLanguages || [];

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="statistics-page">

      {/* =================================================
          HEADER
      ================================================= */}

      <Sidebar/>

      <div className="statistics-header">

        <div>

          <h1>
            Listening Statistics
          </h1>

          <p>
            Discover your personal
            Christian music listening
            journey.
          </p>

        </div>

        <div className="statistics-header-icon">
          <FaChartBar />
        </div>

      </div>

      {/* =================================================
          OVERVIEW CARDS
      ================================================= */}

      <div className="statistics-cards">

        {/* TOTAL PLAYS */}

        <div className="statistics-card">

          <div className="statistics-card-icon">
            <FaMusic />
          </div>

          <div>

            <span>
              Total Plays
            </span>

            <strong>
              {Number(
                overview.totalPlays || 0
              )}
            </strong>

          </div>

        </div>

        {/* UNIQUE SONGS */}

        <div className="statistics-card">

          <div className="statistics-card-icon">
            <FaHeadphones />
          </div>

          <div>

            <span>
              Unique Songs
            </span>

            <strong>
              {Number(
                overview.uniqueSongs || 0
              )}
            </strong>

          </div>

        </div>

        {/* LISTENING TIME */}

        <div className="statistics-card">

          <div className="statistics-card-icon">
            <FaClock />
          </div>

          <div>

            <span>
              Listening Time
            </span>

            <strong>
              {formatTime(
                overview.totalSeconds
              )}
            </strong>

          </div>

        </div>

        {/* COMPLETED */}

        <div className="statistics-card">

          <div className="statistics-card-icon">
            <FaCheckCircle />
          </div>

          <div>

            <span>
              Completed
            </span>

            <strong>
              {Number(
                overview.completedSongs || 0
              )}
            </strong>

          </div>

        </div>

        {/* MOST ACTIVE HOUR */}

        <div className="statistics-card">

          <div className="statistics-card-icon">
            <FaClock />
          </div>

          <div>

            <span>
              Most Active
            </span>

            <strong>
              {formatHour(
                overview.mostActiveHour
              )}
            </strong>

          </div>

        </div>

      </div>

      {/* =================================================
          TOP SONGS
      ================================================= */}

      <section className="statistics-section">

        <div className="statistics-section-title">

          <div>

            <FaMusic />

            <h2>
              Top Songs
            </h2>

          </div>

        </div>

        {topSongs.length === 0 ? (

          <div className="statistics-empty">

            <FaMusic />

            <span>
              No listening history yet.
            </span>

          </div>

        ) : (

          <div className="statistics-list">

            {topSongs.map(
              (song, index) => (

                <div
                  className="statistics-list-item"
                  key={
                    song.song_id ||
                    `song-${index}`
                  }
                >

                  {/* RANK */}

                  <div className="statistics-rank">
                    {index + 1}
                  </div>

                  {/* SONG INFO */}

                  <div className="statistics-song-info">

                    <strong>
                      {song.title ||
                        "Unknown Song"}
                    </strong>

                    {song.title_english && (
                      <span>
                        {song.title_english}
                      </span>
                    )}

                    <small>
                      {song.artist ||
                        "Unknown Artist"}
                    </small>

                  </div>

                  {/* PLAY COUNT */}

                  <div className="statistics-song-count">

                    <strong>
                      {Number(
                        song.play_count || 0
                      )}
                    </strong>

                    <span>
                      plays
                    </span>

                  </div>

                  {/* LISTENING TIME */}

                  <div className="statistics-song-time">

                    {formatTime(
                      song.listening_seconds
                    )}

                  </div>

                </div>

              )
            )}

          </div>

        )}

      </section>

      {/* =================================================
          ARTISTS + LANGUAGES
      ================================================= */}

      <div className="statistics-two-column">

        {/* =================================================
            TOP ARTISTS
        ================================================= */}

        <section className="statistics-section">

          <div className="statistics-section-title">

            <div>

              <FaMicrophone />

              <h2>
                Top Artists
              </h2>

            </div>

          </div>

          {topArtists.length === 0 ? (

            <div className="statistics-empty">

              <FaMicrophone />

              <span>
                No artist data available.
              </span>

            </div>

          ) : (

            <div className="statistics-small-list">

              {topArtists.map(
                (artist, index) => (

                  <div
                    className="statistics-small-item"
                    key={`${artist.artist || "artist"}-${index}`}
                  >

                    {/* RANK */}

                    <div className="statistics-small-rank">
                      {index + 1}
                    </div>

                    {/* ARTIST */}

                    <div className="statistics-small-info">

                      <strong>
                        {artist.artist ||
                          "Unknown Artist"}
                      </strong>

                      <span>
                        {Number(
                          artist.unique_songs ||
                            0
                        )}{" "}
                        songs
                      </span>

                    </div>

                    {/* PLAYS */}

                    <div className="statistics-small-count">

                      {Number(
                        artist.play_count || 0
                      )}

                      <small>
                        plays
                      </small>

                    </div>

                  </div>

                )
              )}

            </div>

          )}

        </section>

        {/* =================================================
            TOP LANGUAGES
        ================================================= */}

        <section className="statistics-section">

          <div className="statistics-section-title">

            <div>

              <FaGlobe />

              <h2>
                Languages
              </h2>

            </div>

          </div>

          {topLanguages.length === 0 ? (

            <div className="statistics-empty">

              <FaGlobe />

              <span>
                No language data available.
              </span>

            </div>

          ) : (

            <div className="statistics-small-list">

              {topLanguages.map(
                (language, index) => (

                  <div
                    className="statistics-small-item"
                    key={`${language.language || "language"}-${index}`}
                  >

                    {/* RANK */}

                    <div className="statistics-small-rank">
                      {index + 1}
                    </div>

                    {/* LANGUAGE */}

                    <div className="statistics-small-info">

                      <strong>
                        {language.language ||
                          "Unknown"}
                      </strong>

                      <span>
                        {formatTime(
                          language.listening_seconds
                        )}
                      </span>

                    </div>

                    {/* PLAYS */}

                    <div className="statistics-small-count">

                      {Number(
                        language.play_count || 0
                      )}

                      <small>
                        plays
                      </small>

                    </div>

                  </div>

                )
              )}

            </div>

          )}

        </section>

      </div>

      {/* =================================================
          DAILY LISTENING
      ================================================= */}

      {statistics?.daily &&
        statistics.daily.length > 0 && (

          <section className="statistics-section">

            <div className="statistics-section-title">

              <div>

                <FaChartBar />

                <h2>
                  Daily Listening Activity
                </h2>

              </div>

            </div>

            <div className="statistics-list">

              {statistics.daily.map(
                (day, index) => (

                  <div
                    className="statistics-list-item"
                    key={`day-${day.date}-${index}`}
                  >

                    <div className="statistics-rank">
                      {index + 1}
                    </div>

                    <div className="statistics-song-info">

                      <strong>
                        {String(
                          day.date
                        )}
                      </strong>

                      <small>
                        Listening activity
                      </small>

                    </div>

                    <div className="statistics-song-count">

                      <strong>
                        {Number(
                          day.play_count || 0
                        )}
                      </strong>

                      <span>
                        plays
                      </span>

                    </div>

                    <div className="statistics-song-time">

                      {formatTime(
                        day.listening_seconds
                      )}

                    </div>

                  </div>

                )
              )}

            </div>

          </section>

        )}

      {/* =================================================
          HOURLY LISTENING
      ================================================= */}

      {statistics?.hourly &&
        statistics.hourly.length > 0 && (

          <section className="statistics-section">

            <div className="statistics-section-title">

              <div>

                <FaClock />

                <h2>
                  Hourly Listening Activity
                </h2>

              </div>

            </div>

            <div className="statistics-list">

              {statistics.hourly.map(
                (item, index) => (

                  <div
                    className="statistics-list-item"
                    key={`hour-${item.hour}-${index}`}
                  >

                    <div className="statistics-rank">
                      {index + 1}
                    </div>

                    <div className="statistics-song-info">

                      <strong>
                        {formatHour(
                          item.hour
                        )}
                      </strong>

                      <small>
                        Listening activity
                      </small>

                    </div>

                    <div className="statistics-song-count">

                      <strong>
                        {Number(
                          item.play_count || 0
                        )}
                      </strong>

                      <span>
                        plays
                      </span>

                    </div>

                    <div className="statistics-song-time">

                      {formatTime(
                        item.listening_seconds
                      )}

                    </div>

                  </div>

                )
              )}

            </div>

          </section>

        )}
    <MusicPlayer/>
    </div>
  );
};

export default Statistics;