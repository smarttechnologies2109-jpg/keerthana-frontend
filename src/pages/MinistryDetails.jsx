import React, {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import API from "../services/api";

import "../assets/css/ministry-details.css";


const MinistryDetails = () => {

  const { id } = useParams();

  const navigate = useNavigate();


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
           Load ministry
        ----------------------------------------------- */

        const ministryResponse =
          await API.get(
            `/ministries/${id}`
          );

        setMinistry(
          ministryResponse.data
        );


        /* -----------------------------------------------
           Load ministry songs
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

          setSongs(songData);

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
     IMAGE
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
         BACK
      ================================================= */}

      <button
        className="ministry-back-btn"
        onClick={() =>
          navigate("/ministries")
        }
      >
        ← Back to Ministries
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

        </div>

      </section>


      {/* =================================================
         SONGS
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

                const songImage =
                  song.cover_url ||
                  song.album_cover ||
                  song.artist_image ||
                  "/default-song.png";


                return (

                  <div
                    key={song.id}
                    className="ministry-song-row"
                    onClick={() =>
                      navigate(
                        `/songs/${song.id}`
                      )
                    }
                  >

                    <div className="song-number">
                      {index + 1}
                    </div>


                    <div className="song-cover">

                      <img
                        src={songImage}
                        alt={song.title}
                        onError={(e) => {
                          e.currentTarget.src =
                            "/default-song.png";
                        }}
                      />

                    </div>


                    <div className="song-info">

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


                    <div className="song-language">

                      {song.language && (
                        <span>
                          {song.language}
                        </span>
                      )}

                    </div>


                    <div className="song-duration">

                      {song.duration
                        ? `${Math.floor(
                            song.duration / 60
                          )}:${String(
                            song.duration % 60
                          ).padStart(2, "0")}`
                        : "--:--"}

                    </div>


                    <button
                      className="song-play-btn"
                      onClick={(e) => {

                        e.stopPropagation();

                        navigate(
                          `/songs/${song.id}`
                        );

                      }}
                    >
                      ▶
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