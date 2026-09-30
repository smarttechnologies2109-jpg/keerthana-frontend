import React, {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  FaArrowLeft,
  FaPause,
  FaPlay,
} from "react-icons/fa";

import API from "../services/api";

import { usePlayer } from "../context/usePlayer";

import "../assets/css/ministry-details.css";


const MinistryDetails = () => {

  const { id } = useParams();

  const navigate = useNavigate();


  /* =====================================================
     GLOBAL PLAYER
  ===================================================== */

  const {
    playSong,
    togglePlay,
    currentSong,
    isPlaying,
  } = usePlayer();


  const [ministry, setMinistry] =
    useState(null);

  const [songs, setSongs] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  /* =====================================================
     LOAD MINISTRY + SONGS
  ===================================================== */

  useEffect(() => {

    const loadData = async () => {

      try {

        setLoading(true);
        setError("");


        /* -----------------------------------------------
           LOAD MINISTRY
        ----------------------------------------------- */

        const ministryResponse =
          await API.get(
            `/ministries/${id}`
          );

        setMinistry(
          ministryResponse.data
        );


        /* -----------------------------------------------
           LOAD MINISTRY SONGS
        ----------------------------------------------- */

        const songsResponse =
          await API.get(
            `/ministries/${id}/songs`
          );

        const songData =
          songsResponse.data;


        if (
          songData &&
          Array.isArray(songData.songs)
        ) {

          setSongs(
            songData.songs
          );

        } else if (
          Array.isArray(songData)
        ) {

          setSongs(
            songData
          );

        } else {

          setSongs([]);

        }

      } catch (err) {

        console.error(
          "Load ministry details error:",
          err
        );

        setError(
          err?.response?.data?.message ||
          "Unable to load ministry."
        );

      } finally {

        setLoading(false);

      }

    };


    if (id) {
      loadData();
    }

  }, [id]);


  /* =====================================================
     CHECK WHETHER SONG BELONGS TO THIS MINISTRY
  ===================================================== */

  const isMinistrySong = (song) => {

    return songs.some(
      (ministrySong) =>
        Number(ministrySong.id) ===
        Number(song?.id)
    );

  };


  /* =====================================================
     CHECK CURRENT SONG
  ===================================================== */

  const isCurrentSong = (song) => {

    return (
      currentSong &&
      Number(currentSong.id) ===
        Number(song?.id)
    );

  };


  /* =====================================================
     MINISTRY PLAY / PAUSE
  ===================================================== */

  const handleMinistryPlayPause =
    async () => {

      if (!songs.length) {
        return;
      }


      /*
        Check whether the currently loaded
        song belongs to this ministry.
      */

      const currentBelongsToMinistry =
        currentSong &&
        isMinistrySong(currentSong);


      /*
        If a ministry song is already loaded,
        toggle Play / Pause.
      */

      if (currentBelongsToMinistry) {

        await togglePlay();

        return;

      }


      /*
        Otherwise start the first song
        from this ministry.
      */

      const firstPlayableSong =
        songs.find(
          (song) =>
            song?.audio_url
        );


      if (!firstPlayableSong) {

        console.warn(
          "No playable songs found in this ministry."
        );

        return;

      }


      await playSong(
        firstPlayableSong,
        songs
      );

    };


  /* =====================================================
     SONG PLAY / PAUSE
  ===================================================== */

  const handleSongPlayPause =
    async (song) => {

      if (!song?.audio_url) {

        console.warn(
          "Song does not have an audio URL:",
          song
        );

        return;

      }


      /*
        SAME SONG
        --------------------------------
        If this song is currently loaded:

        Playing → Pause
        Paused  → Play
      */

      if (
        currentSong &&
        Number(currentSong.id) ===
          Number(song.id)
      ) {

        await togglePlay();

        return;

      }


      /*
        DIFFERENT SONG
        --------------------------------
        Start the selected song.

        The ministry songs become
        the current player queue.
      */

      await playSong(
        song,
        songs
      );

    };


  /* =====================================================
     MINISTRY PLAYING STATE
  ===================================================== */

  const ministryIsPlaying =
    Boolean(
      currentSong &&
      isPlaying &&
      isMinistrySong(currentSong)
    );


  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {

    return (

      <div className="ministry-details-page">

        <div className="ministry-loading">

          Loading ministry...

        </div>

      </div>

    );

  }


  /* =====================================================
     ERROR
  ===================================================== */

  if (error) {

    return (

      <div className="ministry-details-page">

        <div className="ministry-error">

          <h2>
            Something went wrong
          </h2>

          <p>
            {error}
          </p>

          <button
            type="button"
            onClick={() =>
              navigate("/ministries")
            }
          >
            Back to Ministries
          </button>

        </div>

      </div>

    );

  }


  /* =====================================================
     MINISTRY NOT FOUND
  ===================================================== */

  if (!ministry) {

    return (

      <div className="ministry-details-page">

        <div className="ministry-error">

          <h2>
            Ministry not found
          </h2>

          <button
            type="button"
            onClick={() =>
              navigate("/ministries")
            }
          >
            Back to Ministries
          </button>

        </div>

      </div>

    );

  }


  /* =====================================================
     MINISTRY IMAGE
  ===================================================== */

  const ministryImage =
    ministry.image_url ||
    ministry.image ||
    ministry.logo ||
    "/default-ministry.png";


  /* =====================================================
     RENDER
  ===================================================== */

  return (

    <div className="ministry-details-page">


      {/* =================================================
         BACK BUTTON
      ================================================= */}

      <button
        type="button"
        className="ministry-back-btn"
        onClick={() =>
          navigate("/ministries")
        }
      >

        <FaArrowLeft />

        <span>
          Back to Ministries
        </span>

      </button>


      {/* =================================================
         MINISTRY HEADER
      ================================================= */}

      <section className="ministry-header">

        <div className="ministry-header-image">

          <img
            src={ministryImage}
            alt={ministry.name}
            onError={(e) => {

              e.currentTarget.src =
                "/default-ministry.png";

            }}
          />

        </div>


        <div className="ministry-header-content">

          <span className="ministry-label">
            MINISTRY
          </span>


          <h1>
            {ministry.name}
          </h1>


          {ministry.description && (

            <p>
              {ministry.description}
            </p>

          )}


          <div className="ministry-song-count">

            <strong>
              {songs.length}
            </strong>

            <span>
              {songs.length === 1
                ? " Song"
                : " Songs"}
            </span>

          </div>


          {/* =================================================
             MINISTRY PLAY / PAUSE BUTTON
          ================================================= */}

          <button
            type="button"
            className={`ministry-play-btn ${
              ministryIsPlaying
                ? "is-playing"
                : ""
            }`}
            onClick={
              handleMinistryPlayPause
            }
            disabled={!songs.length}
            aria-label={
              ministryIsPlaying
                ? "Pause ministry"
                : "Play ministry"
            }
          >

            {ministryIsPlaying
              ? <FaPause />
              : <FaPlay />
            }

            <span>
              {ministryIsPlaying
                ? "Pause"
                : "Play"
              }
            </span>

          </button>

        </div>

      </section>


      {/* =================================================
         SONGS SECTION
      ================================================= */}

      <section className="ministry-songs-section">


        <div className="ministry-section-heading">

          <div>

            <h2>
              Songs
            </h2>

            <p>
              Songs from {ministry.name}
            </p>

          </div>

        </div>


        {/* =================================================
           NO SONGS
        ================================================= */}

        {songs.length === 0 ? (

          <div className="ministry-empty">

            <div className="ministry-empty-icon">
              🎵
            </div>

            <h3>
              No songs available
            </h3>

            <p>
              This ministry does not have
              any songs yet.
            </p>

          </div>

        ) : (

          <div className="ministry-song-list">

            {songs.map(
              (song, index) => {

                /* -----------------------------------------
                   SONG IMAGE
                ----------------------------------------- */

                const songImage =
                  song.cover_url ||
                  song.album_cover ||
                  song.artist_image ||
                  "/default-song.png";


                /* -----------------------------------------
                   CURRENT SONG
                ----------------------------------------- */

                const songIsCurrent =
                  isCurrentSong(song);


                /* -----------------------------------------
                   PLAYING STATE
                ----------------------------------------- */

                const songIsPlaying =
                  songIsCurrent &&
                  isPlaying;


                return (

                  <div
                    key={song.id}
                    className={`ministry-song-row ${
                      songIsCurrent
                        ? "is-current"
                        : ""
                    }`}
                  >


                    {/* -------------------------------------
                       NUMBER
                    ------------------------------------- */}

                    <div className="song-number">

                      {index + 1}

                    </div>


                    {/* -------------------------------------
                       COVER
                    ------------------------------------- */}

                    <div
                      className="song-cover"
                      onClick={() =>
                        navigate(
                          `/songs/${song.id}`
                        )
                      }
                    >

                      <img
                        src={songImage}
                        alt={song.title}
                        onError={(e) => {

                          e.currentTarget.src =
                            "/default-song.png";

                        }}
                      />

                    </div>


                    {/* -------------------------------------
                       SONG INFORMATION
                    ------------------------------------- */}

                    <div
                      className="song-info"
                      onClick={() =>
                        navigate(
                          `/songs/${song.id}`
                        )
                      }
                    >

                      <h3>
                        {song.title}
                      </h3>


                      {song.title_english && (

                        <p>
                          {song.title_english}
                        </p>

                      )}


                      <span>

                        {song.artist_name ||
                          song.artist ||
                          "Unknown Artist"}

                      </span>

                    </div>


                    {/* -------------------------------------
                       LANGUAGE
                    ------------------------------------- */}

                    <div className="song-language">

                      {song.language && (

                        <span>
                          {song.language}
                        </span>

                      )}

                    </div>


                    {/* -------------------------------------
                       DURATION
                    ------------------------------------- */}

                    <div className="song-duration">

                      {song.duration
                        ? `${Math.floor(
                            song.duration / 60
                          )}:${String(
                            song.duration % 60
                          ).padStart(
                            2,
                            "0"
                          )}`
                        : "--:--"}

                    </div>


                    {/* -------------------------------------
                       PLAY / PAUSE BUTTON
                    ------------------------------------- */}

                    <button
                      type="button"
                      className={`song-play-btn ${
                        songIsPlaying
                          ? "is-playing"
                          : ""
                      }`}
                      onClick={(e) => {

                        e.stopPropagation();

                        handleSongPlayPause(
                          song
                        );

                      }}
                      disabled={!song?.audio_url}
                      aria-label={
                        songIsPlaying
                          ? "Pause song"
                          : "Play song"
                      }
                    >

                      {songIsPlaying
                        ? <FaPause />
                        : <FaPlay />
                      }

                    </button>


                  </div>

                );

              }
            )}

          </div>

        )}

      </section>

    </div>

  );

};


export default MinistryDetails;