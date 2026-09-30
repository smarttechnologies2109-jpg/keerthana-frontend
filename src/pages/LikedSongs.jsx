import {
  FaHeart,
  FaPlay,
  FaPause,
  FaTrash,
} from "react-icons/fa";

import {
  Navigate,
} from "react-router-dom";

import {
  useAuth,
} from "../context/AuthContext";

import {
  useLikedSongs,
} from "../context/LikedSongsContext";

import {
  usePlayer,
} from "../context/usePlayer";

import {
  getSongCover,
  DEFAULT_COVER,
} from "../utils/media";

import "../assets/css/likedSongs.css";


function LikedSongs() {

  const {
    user,
    loading: authLoading,
  } = useAuth();


  const {
    likedSongs,
    loading,
    unlikeSong,
  } = useLikedSongs();


  const {
    playSong,
    togglePlay,
    currentSong,
    isPlaying,
  } = usePlayer();


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
     PLAY / PAUSE SONG
  ===================================================== */

  const handlePlayPause = async (song) => {

    if (!song?.audio_url) {

      console.warn(
        "Song does not have an audio URL:",
        song
      );

      return;

    }


    /*
      SAME SONG

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

      Start selected song.

      All liked songs become
      the player queue.
    */

    await playSong(
      song,
      likedSongs
    );

  };


  /* =====================================================
     AUTH LOADING
  ===================================================== */

  if (authLoading) {

    return (

      <div className="liked-page">

        Loading...

      </div>

    );

  }


  /* =====================================================
     LOGIN REQUIRED
  ===================================================== */

  if (!user) {

    return (

      <Navigate
        to="/login"
        replace
      />

    );

  }


  /* =====================================================
     RENDER
  ===================================================== */

  return (

    <div className="liked-page">


      {/* =================================================
         HERO
      ================================================= */}

      <section className="liked-hero">

        <div className="liked-hero-icon">

          <FaHeart />

        </div>


        <div>

          <p>
            PLAYLIST
          </p>

          <h1>
            Liked Songs
          </h1>

          <span>

            {likedSongs.length}

            {" "}

            {
              likedSongs.length === 1
                ? "song"
                : "songs"
            }

          </span>

        </div>

      </section>


      {/* =================================================
         LOADING
      ================================================= */}

      {loading ? (

        <div className="liked-status">

          Loading liked songs...

        </div>

      ) : likedSongs.length === 0 ? (

        /* =================================================
           EMPTY
        ================================================= */

        <div className="liked-empty">

          <FaHeart />

          <h2>
            Songs you like will
            appear here
          </h2>

          <p>
            Tap the heart on any
            song to save it.
          </p>

        </div>

      ) : (

        /* =================================================
           SONG LIST
        ================================================= */

        <div className="liked-list">

          {likedSongs.map(
            (song, index) => {

              const songIsCurrent =
                isCurrentSong(song);

              const songIsPlaying =
                songIsCurrent &&
                isPlaying;


              return (

                <div
                  className={`liked-row ${
                    songIsCurrent
                      ? "is-current"
                      : ""
                  }`}
                  key={song.id}
                >


                  {/* -------------------------------------
                     NUMBER
                  ------------------------------------- */}

                  <span
                    className="liked-number"
                  >
                    {index + 1}
                  </span>


                  {/* -------------------------------------
                     COVER
                  ------------------------------------- */}

                  <img
                    src={
                      getSongCover(song)
                    }

                    alt={
                      song.title ||
                      "Song cover"
                    }

                    className="liked-cover"

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


                  {/* -------------------------------------
                     SONG INFORMATION
                  ------------------------------------- */}

                  <div
                    className="liked-song-info"
                  >

                    <strong>
                      {song.title}
                    </strong>

                    <span>
                      {
                        song.artist_name ||
                        "KEERTHANA"
                      }
                    </span>

                  </div>


                  {/* -------------------------------------
                     CATEGORY
                  ------------------------------------- */}

                  <span
                    className="liked-category"
                  >

                    {
                      song.category_name ||
                      ""
                    }

                  </span>


                  {/* -------------------------------------
                     PLAY / PAUSE
                  ------------------------------------- */}

                  <button
                    type="button"

                    className={`liked-play ${
                      songIsPlaying
                        ? "is-playing"
                        : ""
                    }`}

                    disabled={
                      !song?.audio_url
                    }

                    aria-label={
                      songIsPlaying
                        ? "Pause song"
                        : "Play song"
                    }

                    onClick={() =>
                      handlePlayPause(
                        song
                      )
                    }
                  >

                    {songIsPlaying
                      ? <FaPause />
                      : <FaPlay />
                    }

                  </button>


                  {/* -------------------------------------
                     REMOVE
                  ------------------------------------- */}

                  <button
                    type="button"

                    className="liked-remove"

                    aria-label="Remove liked song"

                    onClick={() =>
                      unlikeSong(
                        song.id
                      )
                    }
                  >

                    <FaTrash />

                  </button>


                </div>

              );

            }
          )}

        </div>

      )}

    </div>

  );

}


export default LikedSongs;