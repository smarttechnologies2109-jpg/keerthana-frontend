
import {
  useEffect,
  useState,
} from "react";

import {
  FaArrowLeft,
  FaCompactDisc,
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
  getAlbumCover,
  DEFAULT_COVER,
} from "../utils/media";

import "../assets/css/albumDetails.css";


function AlbumDetails() {

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


  const [album, setAlbum] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  /* =========================================================
     LOAD ALBUM
  ========================================================= */

  useEffect(() => {

    const loadAlbum =
      async () => {

        try {

          setLoading(true);
          setError("");

          const response =
            await API.get(
              `/albums/${id}`
            );

          setAlbum(
            response.data.album
          );

        } catch (error) {

          console.error(
            "Album error:",
            error
          );

          setError(
            error.response?.data?.message ||
            "Unable to load album"
          );

        } finally {

          setLoading(false);

        }

      };


    loadAlbum();

  }, [id]);


  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {

    return (
      <div className="album-page">
        Loading album...
      </div>
    );

  }


  /* =========================================================
     ERROR
  ========================================================= */

  if (
    error ||
    !album
  ) {

    return (
      <div className="album-page">

        <button
          type="button"
          className="album-back"
          onClick={() =>
            navigate("/albums")
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
     ALBUM COVER
  ========================================================= */

  const cover =
    getAlbumCover(album);


  /* =========================================================
     CHECK WHETHER CURRENT SONG
     BELONGS TO THIS ALBUM
  ========================================================= */

  const isAlbumSong =
    (song) =>
      album.songs?.some(
        (albumSong) =>
          albumSong.id ===
          song?.id
      );


  /* =========================================================
     ALBUM PLAY / PAUSE
  ========================================================= */

  const handleAlbumPlayPause =
    async () => {

      if (
        !album.songs?.length
      ) {
        return;
      }


      /*
        Check whether the global
        current song belongs to
        this album.
      */

      const currentBelongsToAlbum =
        currentSong &&
        isAlbumSong(
          currentSong
        );


      /*
        Same album is currently
        playing -> pause.
      */

      if (
        currentBelongsToAlbum
      ) {

        await togglePlay();

        return;
      }


      /*
        Another song is playing,
        or nothing is playing.

        Start the first song
        from this album.
      */

      await playSong(
        album.songs[0],
        album.songs
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
        If this exact song is
        currently loaded, toggle
        play/pause.
      */

      if (
        currentSong?.id ===
        song.id
      ) {

        await togglePlay();

        return;
      }


      /*
        Different song -> play it.
      */

      await playSong(
        song,
        album.songs
      );

    };


  /* =========================================================
     ALBUM BUTTON STATE
  ========================================================= */

  const albumIsPlaying =
    Boolean(
      currentSong &&
      isPlaying &&
      isAlbumSong(
        currentSong
      )
    );


  return (

    <div className="album-page">


      {/* =====================================================
          BACK
      ===================================================== */}

      <button
        type="button"
        className="album-back"
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

      <section className="album-hero">

        <div className="album-cover">

          {cover ? (

            <img
              src={cover}
              alt={
                album.title ||
                "Album cover"
              }
              onError={(event) => {

                if (
                  !event.currentTarget.src.includes(
                    "default-cover.png"
                  )
                ) {

                  event.currentTarget.src =
                    DEFAULT_COVER;

                }

              }}
            />

          ) : (

            <FaCompactDisc />

          )}

        </div>


        <div className="album-info">

          <span>
            ALBUM
          </span>


          <h1>
            {album.title}
          </h1>


          <button
            type="button"
            className="album-artist-link"
            onClick={() => {

              if (
                album.artist_id
              ) {

                navigate(
                  `/artists/${album.artist_id}`
                );

              }

            }}
          >

            {album.artist_name ||
              "KEERTHANA"}

          </button>


          <p>

            {album.song_count}

            {" "}

            {
              album.song_count === 1
                ? "song"
                : "songs"
            }

          </p>

        </div>

      </section>


      {/* =====================================================
          ALBUM PLAY / PAUSE
      ===================================================== */}

      <div className="album-actions">

        <button
          type="button"
          onClick={
            handleAlbumPlayPause
          }
          disabled={
            !album.songs?.length
          }
          aria-label={
            albumIsPlaying
              ? "Pause album"
              : "Play album"
          }
        >

          {albumIsPlaying ? (
            <FaPause />
          ) : (
            <FaPlay />
          )}

        </button>

      </div>


      {/* =====================================================
          SONG LIST
      ===================================================== */}

      <div className="album-song-list">

        {album.songs?.map(
          (
            song,
            index
          ) => {

            const songIsCurrent =
              currentSong?.id ===
              song.id;


            const songIsPlaying =
              songIsCurrent &&
              isPlaying;


            return (

              <div
                className={
                  `album-song-row ${
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


                {/* SONG INFORMATION */}

                <div>

                  <strong>
                    {song.title}
                  </strong>

                  <span>
                    {song.artist_name ||
                      album.artist_name}
                  </span>

                </div>


                {/* CATEGORY */}

                <span
                  className="album-category"
                >

                  {song.category_name ||
                    "Christian Music"}

                </span>


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


    </div>

  );

}


export default AlbumDetails;

