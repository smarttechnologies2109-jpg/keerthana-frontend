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

const getList = (payload, keys = []) => {
  if (Array.isArray(payload)) return payload;
  for (const key of keys) {
    if (Array.isArray(payload?.[key])) return payload[key];
  }
  return Array.isArray(payload?.data) ? payload.data : [];
};

const containsTelugu = (value) => /[\u0C00-\u0C7F]/.test(String(value || ""));

const getSongArtistsForStatistics = (song, songsById = {}, artistsById = {}) => {
  const id = song?.song_id ?? song?.id;
  const reference = id == null ? {} : songsById[String(id)] || {};
  const sources = [reference, song];
  const names = [];
  const seen = new Set();

  const addName = (value) => {
    if (typeof value !== "string") return;
    value.split(",").forEach((part) => {
      const name = part.trim();
      if (!name || containsTelugu(name) || /^(unknown artist|null|undefined|n\/a)$/i.test(name)) return;
      const key = name.toLocaleLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        names.push(name);
      }
    });
  };

  const addArtist = (artist) => {
    if (artist == null) return;
    if (typeof artist === "string" || typeof artist === "number") {
      const linked = artistsById[String(artist)];
      if (linked) addArtist(linked);
      else if (typeof artist === "string" && !/^\d+$/.test(artist.trim())) addName(artist);
      return;
    }
    if (typeof artist !== "object") return;
    if (artist.artist && typeof artist.artist === "object") addArtist(artist.artist);
    const artistId = artist.id ?? artist.artist_id ?? artist.artistId;
    const linked = artistId != null ? artistsById[String(artistId)] : null;
    if (linked && linked !== artist) {
      addName(linked.name_english || linked.english_name || linked.nameEnglish || linked.name);
    }
    [
      artist.name_english, artist.english_name, artist.nameEnglish,
      artist.englishName, artist.artist_name_english, artist.artist_english,
      artist.artist_name_en, artist.name_en, artist.display_name, artist.name,
    ].forEach(addName);
  };

  sources.forEach((source) => {
    [
      ...(Array.isArray(source?.artists) ? source.artists : source?.artists ? [source.artists] : []),
      ...(Array.isArray(source?.song_artists) ? source.song_artists : []),
      ...(Array.isArray(source?.artist) ? source.artist : []),
    ].forEach(addArtist);
    [
      ...(Array.isArray(source?.artist_ids) ? source.artist_ids : []),
      ...(Array.isArray(source?.artistIds) ? source.artistIds : []),
    ].forEach(addArtist);
  });

  if (names.length === 0) {
    sources.forEach((source) => {
      const artistObject =
        source?.artist && typeof source.artist === "object" && !Array.isArray(source.artist)
          ? source.artist : {};
      [
        source?.artist_id, source?.artistId, artistObject?.id, artistObject?.artist_id,
      ].filter((value) => value != null).forEach((artistId) => {
        addArtist(artistsById[String(artistId)] || { id: artistId });
      });
      [
        source?.artist_english, source?.artist_name_english,
        source?.artist_english_name, source?.artist_name_en,
        artistObject?.name_english, artistObject?.english_name,
        artistObject?.nameEnglish, artistObject?.name,
      ].forEach(addName);
    });
  }

  return names.join(", ") || "Unknown Artist";
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

  const [artistsById, setArtistsById] = useState({});
  const [songsById, setSongsById] = useState({});

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

        const [response, songsResult, artistsResult] = await Promise.all([
          API.get("/statistics"),
          API.get("/songs").catch(() => null),
          API.get("/artists").catch(() => null),
        ]);

        if (!active) return;

        const songList = getList(songsResult?.data, ["songs"]);
        const artistList = getList(artistsResult?.data, ["artists"]);
        const songLookup = {};
        const artistLookup = {};

        songList.forEach((song) => {
          const id = song?.id ?? song?.song_id;
          if (id != null) songLookup[String(id)] = song;
        });

        artistList.forEach((artist) => {
          const id = artist?.id ?? artist?.artist_id;
          const englishName =
            artist?.name_english || artist?.english_name ||
            artist?.nameEnglish || artist?.englishName ||
            artist?.artist_name_english || "";
          if (id != null && typeof englishName === "string" &&
              englishName.trim() && !containsTelugu(englishName)) {
            artistLookup[String(id)] = { ...artist, name_english: englishName.trim() };
          }
        });

        setSongsById(songLookup);
        setArtistsById(artistLookup);

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

  const recentListeningDays = Array.isArray(statistics?.daily)
    ? statistics.daily.slice(0, 7).reverse()
    : [];
  const recentSevenDaySeconds = recentListeningDays.reduce(
    (total, day) => total + (Number(day?.listening_seconds) || 0),
    0
  );
  const recentSevenDayPlays = recentListeningDays.reduce(
    (total, day) => total + (Number(day?.play_count) || 0),
    0
  );
  const recentDayPeak = Math.max(
    1,
    ...recentListeningDays.map((day) => Number(day?.listening_seconds) || 0)
  );

  const languageTotal = topLanguages.reduce(
    (sum, item) => sum + (Number(item?.play_count) || 0), 0
  );
  const artistTotal = topArtists.reduce(
    (sum, item) => sum + (Number(item?.play_count) || 0), 0
  );
  const languagePalette = ["#c08af5", "#edce86", "#df8fb5", "#a88bd4", "#d69b77", "#b7a0cc"];
  const artistPalette = ["#edce86", "#c08af5", "#df8fb5", "#a88bd4", "#d69b77", "#b7a0cc"];
  const makeDonutGradient = (items, total, key) => {
    if (!total) return "conic-gradient(#3b2a49 0deg 360deg)";
    let cursor = 0;
    const stops = items.map((item, index) => {
      const value = Math.max(0, Number(item?.[key]) || 0);
      const start = cursor;
      cursor += (value / total) * 360;
      return `${languagePalette[index % languagePalette.length]} ${start}deg ${cursor}deg`;
    });
    return `conic-gradient(${stops.join(", ")})`;
  };
  const dailyChartPeak = Math.max(
    1, ...recentListeningDays.map((day) => Number(day?.play_count) || 0)
  );
  const hourlyData = Array.isArray(statistics?.hourly) ? statistics.hourly : [];
  const hourlyPeak = Math.max(1, ...hourlyData.map((item) => Number(item?.play_count) || 0));


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

      {/* VISUAL ANALYTICS — derived only from API statistics */}
      <section className="statistics-visual-grid" aria-label="Listening analytics visualizations">
        <article className="statistics-chart-panel statistics-trend-panel">
          <div className="statistics-chart-heading">
            <div><span className="statistics-chart-kicker">LISTENING TRENDS</span><h2>Daily plays</h2></div>
            <span className="statistics-chart-total">{recentSevenDayPlays.toLocaleString()} plays</span>
          </div>
          {recentListeningDays.length ? (
            <div className="statistics-column-chart" role="img" aria-label="Bar chart showing plays for the seven most recent recorded days">
              {recentListeningDays.map((day, index) => {
                const plays = Number(day?.play_count) || 0;
                const height = plays ? Math.max(5, plays / dailyChartPeak * 100) : 2;
                return <div className="statistics-column-item" key={`plays-${day?.date || index}`}>
                  <strong>{plays}</strong>
                  <div className="statistics-column-track"><span style={{height:`${height}%`}} /></div>
                  <small>{String(day?.date || `Day ${index + 1}`).slice(5,10)}</small>
                </div>;
              })}
            </div>
          ) : <div className="statistics-chart-empty">Daily play data will appear as you listen.</div>}
        </article>

        <article className="statistics-chart-panel">
          <div className="statistics-chart-heading">
            <div><span className="statistics-chart-kicker">MUSIC DISCOVERY</span><h2>Language mix</h2></div>
            <span className="statistics-chart-total">{languageTotal.toLocaleString()} plays</span>
          </div>
          {topLanguages.length && languageTotal ? (
            <div className="statistics-donut-layout">
              <div className="statistics-donut" role="img" aria-label="Donut chart of listening plays by language" style={{background:makeDonutGradient(topLanguages,languageTotal,"play_count")}}>
                <div><strong>{languageTotal.toLocaleString()}</strong><small>Total plays</small></div>
              </div>
              <div className="statistics-chart-legend">
                {topLanguages.map((item,index)=>{
                  const value=Number(item?.play_count)||0;
                  return <div className="statistics-legend-row" key={`lang-chart-${item.language||index}`}>
                    <i style={{background:languagePalette[index%languagePalette.length]}} />
                    <span>{item.language||"Unknown"}</span><strong>{Math.round(value/languageTotal*100)}%</strong>
                  </div>;
                })}
              </div>
            </div>
          ) : <div className="statistics-chart-empty">Language breakdown will appear when listening data is available.</div>}
        </article>

        <article className="statistics-chart-panel">
          <div className="statistics-chart-heading">
            <div><span className="statistics-chart-kicker">YOUR FAVOURITES</span><h2>Top artists</h2></div>
            <span className="statistics-chart-total">{artistTotal.toLocaleString()} plays</span>
          </div>
          {topArtists.length && artistTotal ? (
            <div className="statistics-horizontal-chart">
              {topArtists.slice(0,6).map((item,index)=>{
                const value=Number(item?.play_count)||0;
                return <div className="statistics-horizontal-row" key={`artist-chart-${item.artist||index}`}>
                  <div className="statistics-horizontal-label"><span>{item.artist_english||item.artist||"Unknown Artist"}</span><strong>{value}</strong></div>
                  <div className="statistics-horizontal-track"><span style={{width:`${Math.max(value?3:0,value/Math.max(1,Number(topArtists[0]?.play_count)||1)*100)}%`,background:artistPalette[index%artistPalette.length]}} /></div>
                </div>;
              })}
            </div>
          ) : <div className="statistics-chart-empty">Artist insights will appear when listening data is available.</div>}
        </article>

        <article className="statistics-chart-panel">
          <div className="statistics-chart-heading">
            <div><span className="statistics-chart-kicker">DAILY RHYTHM</span><h2>Listening time</h2></div>
            <span className="statistics-chart-total">{formatTime(recentSevenDaySeconds)}</span>
          </div>
          {recentListeningDays.length ? (
            <div className="statistics-column-chart statistics-time-chart" role="img" aria-label="Bar chart showing listening duration for the seven most recent recorded days">
              {recentListeningDays.map((day,index)=>{
                const seconds=Number(day?.listening_seconds)||0;
                const height=seconds?Math.max(5,seconds/recentDayPeak*100):2;
                return <div className="statistics-column-item" key={`time-${day?.date||index}`}>
                  <strong>{seconds?formatTime(seconds):"0"}</strong>
                  <div className="statistics-column-track"><span style={{height:`${height}%`}} /></div>
                  <small>{String(day?.date||`Day ${index+1}`).slice(5,10)}</small>
                </div>;
              })}
            </div>
          ) : <div className="statistics-chart-empty">Listening-time trends will appear as activity is recorded.</div>}
        </article>
      </section>

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

              {/* SONG INFO */}
<div className="statistics-song-info">
                    <strong>
                      {song.title_english || song.title || "Unknown Song"}
                    </strong>

                    {song.title && song.title_english && song.title !== song.title_english && (
                      <span>{song.title}</span>
                    )}

                    <small>
                      {getSongArtistsForStatistics(song, songsById, artistsById)}
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

                   {/* ARTIST */}
<div className="statistics-small-info">
                      <strong>
                        {artist.artist_english || "Unknown Artist"}
                      </strong>

                      <span>
                        {Number(artist.unique_songs || 0)} songs
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

      {recentListeningDays.length > 0 && (
        <section className="statistics-section recent-week-section">
          <div className="statistics-section-title">
            <div>
              <FaChartBar />
              <h2>Recent 7 Recorded Days</h2>
            </div>
          </div>

          <div className="recent-week-summary">
            <div>
              <span>Total listening</span>
              <strong>{formatTime(recentSevenDaySeconds)}</strong>
            </div>
            <div>
              <span>Songs played</span>
              <strong>{recentSevenDayPlays.toLocaleString()}</strong>
            </div>
          </div>

          <div className="recent-week-bars" aria-label="Listening time over the seven most recent recorded days">
            {recentListeningDays.map((day, index) => {
              const seconds = Number(day?.listening_seconds) || 0;
              const height = seconds > 0
                ? Math.max(5, (seconds / recentDayPeak) * 100)
                : 3;
              return (
                <div className="recent-week-bar-item" key={`recent-day-${day?.date || index}`}>
                  <strong>{formatTime(seconds)}</strong>
                  <div className="recent-week-bar-track">
                    <span style={{ height: `${height}%` }} />
                  </div>
                  <small>{String(day?.date || `Day ${index + 1}`).slice(0, 10)}</small>
                </div>
              );
            })}
          </div>
          <p className="recent-week-note">Based on the seven most recent daily records returned by your listening statistics.</p>
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