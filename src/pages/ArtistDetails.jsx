
import {
  useEffect,
  useState,
} from "react";

import {
  FaArrowLeft,
  FaMicrophone,
  FaPause,
  FaPlay,
} from "react-icons/fa";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import API
  from "../services/api";

import {
  usePlayer,
} from "../context/usePlayer";

import {
  getMediaUrl,
} from "../utils/media";

import "../assets/css/artistDetails.css";


function ArtistDetails() {

  const { id } =
    useParams();

  const navigate =
    useNavigate();

  const {
    playSong,
    togglePlay,
    currentSong,
    isPlaying,
  } = usePlayer();


  const [artist, setArtist] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  /* =========================================================
     LOAD ARTIST
  ========================================================= */

  useEffect(() => {

    const loadArtist =
      async () => {

        try {

          setLoading(true);
          setError("");

          const response =
            await API.get(
              `/artists/${id}`
            );

          setArtist(
            response.data.artist
          );

        } catch (error) {

          console.error(error);

          setError(
            error.response?.data?.message ||
            "Unable to load artist"
          );

        } finally {

          setLoading(false);

        }

      };


    loadArtist();

  }, [id]);


  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {

    return (
      <div className="artist-details-page">
        Loading artist...
      </div>
    );

  }


  /* =========================================================
     ERROR
  ========================================================= */

  if (
    error ||
    !artist
  ) {

    return (
      <div className="artist-details-page">

        <button
          type="button"
          className="artist-back"
          onClick={() =>
            navigate("/artists")
          }
        >
          <FaArrowLeft />
          Back
        </button>

        <p>
          {error}
        </p>

      </div>
    );

  }


  /* =========================================================
     ARTIST IMAGE
  ========================================================= */

  const artistImage =
    artist.image_url
      ? getMediaUrl(
          artist.image_url
        )
      : null;


  /* =========================================================
     CHECK CURRENT SONG
  ========================================================= */

  const isCurrentArtistSong =
    (song) =>
      currentSong?.id === song?.id;


  /* =========================================================
     PLAY ALL / PAUSE
  ========================================================= */

  const handleArtistPlayPause =
    async () => {

      if (
        !artist.songs?.length
      ) {
        return;
      }


      /*
        If the currently playing
        song belongs to this artist,
        toggle play/pause.
      */

      const currentBelongsToArtist =
        artist.songs.some(
          (song) =>
            song.id ===
            currentSong?.id
        );


      if (
        currentBelongsToArtist
      ) {

        await togglePlay();

        return;
      }


      /*
        Otherwise start the
        artist's first song.
      */

      await playSong(
        artist.songs[0],
        artist.songs
      );

    };


  /* =========================================================
     SONG PLAY / PAUSE
  ========================================================= */

  const handleSongPlayPause =
    async (
      song
    ) => {

      /*
        Same song:
        toggle play/pause.
      */

      if (
        currentSong?.id ===
        song.id
      ) {

        await togglePlay();

        return;
      }


      /*
        Different song:
        start that song.
      */

      await playSong(
        song,
        artist.songs
      );

    };


  /*
    Artist button should show Pause
    when ANY song from this artist
    is currently playing.
  */

  const artistIsPlaying =
    Boolean(
      currentSong &&
      isPlaying &&
      artist.songs?.some(
        (song) =>
          song.id ===
          currentSong.id
      )
    );


  return (

    <div className="artist-details-page">


      {/* =====================================================
          BACK
      ===================================================== */}

      <button
        type="button"
        className="artist-back"
        onClick={() =>
          navigate(-1)
        }
      >
        <FaArrowLeft />

        Back
      </button>


      {/* =====================================================
          HERO
      ===================================================== */}

      <section className="artist-hero">

        <div className="artist-hero-image">

          {artistImage ? (

            <img
              src={artistImage}
              alt={artist.name}
            />

          ) : (

            <FaMicrophone />

          )}

        </div>


        <div>

          <span>
            ARTIST
          </span>

          <h1>
            {artist.name}
          </h1>

          <p>
            {artist.song_count}
            {" "}
            songs
            {" • "}
            {artist.album_count}
            {" "}
            albums
          </p>

        </div>

      </section>


      {/* =====================================================
          PLAY / PAUSE ARTIST
      ===================================================== */}

      <div className="artist-actions">

        <button
          type="button"
          onClick={
            handleArtistPlayPause
          }
          disabled={
            !artist.songs?.length
          }
          aria-label={
            artistIsPlaying
              ? "Pause artist"
              : "Play artist"
          }
        >

          {artistIsPlaying ? (
            <FaPause />
          ) : (
            <FaPlay />
          )}

        </button>

      </div>


      {/* =====================================================
          SONGS
      ===================================================== */}

      <section>

        <h2>
          Popular Songs
        </h2>


        <div className="artist-song-list">

          {artist.songs?.map(
            (
              song,
              index
            ) => {

              const cover =
                song.cover_url
                  ? getMediaUrl(
                      song.cover_url
                    )
                  : "/images/default-cover.png";


              const songIsCurrent =
                isCurrentArtistSong(
                  song
                );


              const songIsPlaying =
                songIsCurrent &&
                isPlaying;


              return (

                <div
                  className={
                    `artist-song-row ${
                      songIsCurrent
                        ? "is-current"
                        : ""
                    }`
                  }
                  key={song.id}
                >


                  {/* NUMBER */}

                  <span>
                    {index + 1}
                  </span>


                  {/* COVER */}

                  <img
                    src={cover}
                    alt={song.title}
                  />


                  {/* SONG INFORMATION */}

                  <div>

                    <strong>
                      {song.title}
                    </strong>

                    <span>
                      {song.album_title ||
                        artist.name}
                    </span>

                  </div>


                  {/* PLAY / PAUSE */}

                  <button
                    type="button"
                    onClick={() =>
                      handleSongPlayPause(
                        song
                      )
                    }
                    aria-label={
                      songIsPlaying
                        ? "Pause song"
                        : "Play song"
                    }
                  >

                    {songIsPlaying ? (
                      <FaPause />
                    ) : (
                      <FaPlay />
                    )}

                  </button>

                </div>

              );

            }
          )}

        </div>

      </section>


      {/* =====================================================
          ALBUMS
      ===================================================== */}

      {artist.albums?.length > 0 && (

        <section
          className="artist-albums"
        >

          <h2>
            Albums
          </h2>


          <div
            className="artist-album-grid"
          >

            {artist.albums.map(
              (album) => {

                const cover =
                  album.cover_url
                    ? getMediaUrl(
                        album.cover_url
                      )
                    : null;


                return (

                  <button
                    type="button"
                    className="artist-album-card"
                    key={album.id}
                    onClick={() =>
                      navigate(
                        `/albums/${album.id}`
                      )
                    }
                  >

                    <div>

                      {cover ? (

                        <img
                          src={cover}
                          alt={album.title}
                        />

                      ) : (

                        <FaMicrophone />

                      )}

                    </div>


                    <h3>
                      {album.title}
                    </h3>


                    <span>
                      {album.song_count}
                      {" "}
                      songs
                    </span>

                  </button>

                );

              }
            )}

          </div>

        </section>

      )}

    </div>

  );

}


export default ArtistDetails;

