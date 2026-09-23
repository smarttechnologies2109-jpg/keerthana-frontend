import {
  FaHeart,
  FaPlay,
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
} from "../context/PlayerContext";

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
  } = usePlayer();


  if (authLoading) {

    return (
      <div className="liked-page">
        Loading...
      </div>
    );

  }


  if (!user) {

    return (
      <Navigate
        to="/login"
        replace
      />
    );

  }


  return (

    <div className="liked-page">


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


      {loading ? (

        <div className="liked-status">
          Loading liked songs...
        </div>

      ) : likedSongs.length === 0 ? (

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

        <div className="liked-list">


          {likedSongs.map(
            (song, index) => (

              <div
                className="liked-row"
                key={song.id}
              >

                <span
                  className=
                    "liked-number"
                >
                  {index + 1}
                </span>


              <img
  src={
    getSongCover(song)
  }

  alt={
    song.title ||
    "Song cover"
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


                <div
                  className=
                    "liked-song-info"
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


                <span
                  className=
                    "liked-category"
                >

                  {
                    song.category_name ||
                    ""
                  }

                </span>


                <button
                  type="button"
                  className="liked-play"

                  onClick={() =>
                    playSong(
                      song,
                      likedSongs
                    )
                  }
                >

                  <FaPlay />

                </button>


                <button
                  type="button"
                  className="liked-remove"

                  onClick={() =>
                    unlikeSong(
                      song.id
                    )
                  }
                >

                  <FaTrash />

                </button>

              </div>

            )
          )}


        </div>

      )}


    </div>

  );

}


export default LikedSongs;