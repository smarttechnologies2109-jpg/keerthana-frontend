import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  FaArrowLeft,
  FaPlay,
  FaPause,
  FaStepBackward,
  FaStepForward,
  FaHeart,
  FaRegHeart,
  FaPlus,
  FaVolumeUp,
  FaMusic,
  FaMinus,
  FaRedo,
  FaFileAlt,
} from "react-icons/fa";

import API from "../services/api";

import {
  usePlayer,
} from "../context/PlayerContext";

import {
  useAuth,
} from "../context/AuthContext";

import {
  getMediaUrl,
} from "../utils/media";

import "../assets/css/songDetails.css";


function SongDetails() {

  const {
    id,
  } = useParams();

  const navigate =
    useNavigate();


  /* =====================================================
     AUTH
  ===================================================== */

  const {
    user,
  } = useAuth();


  /* =====================================================
     PLAYER
  ===================================================== */

  const {
    currentSong,
    isPlaying,
    currentTime,
    duration,
    volume,

    playSong,
    togglePlay,
    nextSong,
    previousSong,
    seek,
    changeVolume,
  } = usePlayer();


  /* =====================================================
     STATE
  ===================================================== */

  const [song, setSong] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [liked, setLiked] =
    useState(false);

  const [fontSize, setFontSize] =
    useState(22);


  /* =====================================================
     LOAD SONG
  ===================================================== */

  useEffect(() => {

    const loadSong =
      async () => {

        try {

          setLoading(true);

          setError("");


          const response =
            await API.get(
              `/songs/${id}`
            );


          setSong(
            response.data.song
          );


        } catch (error) {

          console.error(
            "Song details error:",
            error
          );


          setError(
            "Unable to load song"
          );


        } finally {

          setLoading(false);

        }

      };


    loadSong();

  }, [id]);


  /* =====================================================
     CHECK LIKED STATUS
  ===================================================== */

  useEffect(() => {

    if (
      !user ||
      !song
    ) {

      setLiked(false);

      return;

    }


    const checkLiked =
      async () => {

        try {

          const response =
            await API.get(
              "/liked-songs"
            );


          const likedSongs =
            response.data.songs || [];


          const exists =
            likedSongs.some(
              (item) =>
                Number(item.id) ===
                Number(song.id)
            );


          setLiked(exists);


        } catch (error) {

          console.error(
            "Liked songs check error:",
            error
          );

        }

      };


    checkLiked();

  }, [user, song]);


  /* =====================================================
     CURRENT SONG CHECK
  ===================================================== */

  const isCurrentSong =
    Number(currentSong?.id) ===
    Number(song?.id);


  /* =====================================================
     PLAY
  ===================================================== */

  const handlePlay =
    () => {

      if (!song) {
        return;
      }


      if (isCurrentSong) {

        togglePlay();

        return;

      }


      playSong(
        song,
        [song]
      );

    };


  /* =====================================================
     LIKE / UNLIKE
  ===================================================== */

  const handleLike =
    async () => {

      if (!user) {

        navigate("/login");

        return;

      }


      if (!song) {
        return;
      }


      try {

        if (liked) {

          await API.delete(
            `/liked-songs/${song.id}`
          );


          setLiked(false);

        } else {

          await API.post(
            "/liked-songs",
            {
              song_id:
                song.id,
            }
          );


          setLiked(true);

        }


      } catch (error) {

        console.error(
          "Like song error:",
          error.response?.data ||
            error.message
        );

      }

    };


  /* =====================================================
     ADD TO PLAYLIST
  ===================================================== */

  const handleAddPlaylist =
    () => {

      if (!user) {

        navigate("/login");

        return;

      }


      /*
        Phase 13 can add a popup here.

        For now navigate to playlists
        with selected song ID.
      */

      navigate(
        `/playlists?song=${song.id}`
      );

    };


  /* =====================================================
     FORMAT TIME
  ===================================================== */

  const formatTime =
    (seconds) => {

      if (
        !Number.isFinite(
          Number(seconds)
        )
      ) {

        return "0:00";

      }


      const total =
        Math.floor(
          Number(seconds)
        );


      const minutes =
        Math.floor(
          total / 60
        );


      const remainingSeconds =
        total % 60;


      return (
        `${minutes}:${String(
          remainingSeconds
        ).padStart(
          2,
          "0"
        )}`
      );

    };


  /* =====================================================
     LYRIC FONT
  ===================================================== */

  const increaseFont =
    () => {

      setFontSize(
        (current) =>
          Math.min(
            34,
            current + 2
          )
      );

    };


  const decreaseFont =
    () => {

      setFontSize(
        (current) =>
          Math.max(
            16,
            current - 2
          )
      );

    };


  const resetFont =
    () => {

      setFontSize(22);

    };


  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {

    return (

      <div className="song-details-page">

        <div className="song-details-loading">

          <FaMusic />

          <h2>
            Loading Song...
          </h2>

        </div>

      </div>

    );

  }


  /* =====================================================
     ERROR
  ===================================================== */

  if (
    error ||
    !song
  ) {

    return (

      <div className="song-details-page">

        <div className="song-details-error">

          <FaMusic />

          <h2>
            Song not found
          </h2>

          <p>
            {error}
          </p>


          <button
            type="button"
            onClick={() =>
              navigate("/")
            }
          >

            Go Home

          </button>

        </div>

      </div>

    );

  }


  /* =====================================================
     COVER
  ===================================================== */

  const cover =
    song.cover_url
      ? getMediaUrl(
          song.cover_url
        )
      : "/images/default-cover.png";


  /* =====================================================
     PLAYER VALUES
  ===================================================== */

  const displayedTime =
    isCurrentSong
      ? currentTime
      : 0;


  const displayedDuration =
    isCurrentSong
      ? duration
      : Number(
          song.duration
        ) || 0;


  /* =====================================================
     PAGE
  ===================================================== */

  return (

    <div className="song-details-page">


      {/* ===============================================
          TOP BAR
      =============================================== */}

      <div className="song-details-topbar">

        <button
          type="button"
          className="song-back-button"

          onClick={() =>
            navigate(-1)
          }
        >

          <FaArrowLeft />

        </button>


        <div>

          <span>
            NOW PLAYING
          </span>

          <strong>
            KEERTHANA
          </strong>

        </div>

      </div>


      {/* ===============================================
          SONG HERO
      =============================================== */}

      <section className="song-details-hero">


        {/* COVER */}

        <div className="song-details-cover">

          <img
            src={cover}
            alt={song.title}
          />

        </div>


        {/* INFO */}

        <div className="song-details-info">

          <span className="song-type">
            CHRISTIAN MUSIC
          </span>


          <h1>
            {song.title}
          </h1>


          {song.title_english && (

            <h2>
              {song.title_english}
            </h2>

          )}


          <div className="song-meta">

            <button
              type="button"

              onClick={() => {

                if (
                  song.artist_id
                ) {

                  navigate(
                    `/artists/${song.artist_id}`
                  );

                }

              }}
            >

              {song.artist_name ||
                "KEERTHANA"}

            </button>


            {song.album_title && (

              <>

                <span>
                  •
                </span>


                <button
                  type="button"

                  onClick={() => {

                    if (
                      song.album_id
                    ) {

                      navigate(
                        `/albums/${song.album_id}`
                      );

                    }

                  }}
                >

                  {song.album_title}

                </button>

              </>

            )}


            {song.category_name && (

              <>

                <span>
                  •
                </span>

                <span>
                  {song.category_name}
                </span>

              </>

            )}

          </div>


          {/* ACTIONS */}

          <div className="song-actions">


            <button
              type="button"

              className="song-main-play"

              onClick={
                handlePlay
              }
            >

              {isCurrentSong &&
              isPlaying ? (

                <FaPause />

              ) : (

                <FaPlay />

              )}

            </button>

          <button
  type="button"
  className="song-lyrics-button"
  onClick={() => {
    const lyricsSection =
      document.getElementById(
        "lyrics-section"
      );

    lyricsSection?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }}
>
  <FaFileAlt />

  <span>
    Lyrics
  </span>
</button>
            <button
              type="button"

              className={
                liked
                  ? "song-like active"
                  : "song-like"
              }

              onClick={
                handleLike
              }

              title={
                liked
                  ? "Remove from Liked Songs"
                  : "Add to Liked Songs"
              }
            >

              {liked ? (
                <FaHeart />
              ) : (
                <FaRegHeart />
              )}

            </button>


            <button
              type="button"

              className="song-add-playlist"

              onClick={
                handleAddPlaylist
              }
            >

              <FaPlus />

              Add to Playlist

            </button>

          </div>

        </div>

      </section>


      {/* ===============================================
          FULL PLAYER
      =============================================== */}

      <section className="song-full-player">


        {/* CONTROLS */}

        <div className="song-player-controls">


          <button
            type="button"

            onClick={
              previousSong
            }

            disabled={
              !isCurrentSong
            }
          >

            <FaStepBackward />

          </button>


          <button
            type="button"

            className="song-player-main"

            onClick={
              handlePlay
            }
          >

            {isCurrentSong &&
            isPlaying ? (

              <FaPause />

            ) : (

              <FaPlay />

            )}

          </button>


          <button
            type="button"

            onClick={
              nextSong
            }

            disabled={
              !isCurrentSong
            }
          >

            <FaStepForward />

          </button>


        </div>


        {/* PROGRESS */}

        <div className="song-progress-area">

          <span>
            {formatTime(
              displayedTime
            )}
          </span>


          <input
            type="range"

            min="0"

            max={
              displayedDuration ||
              0
            }

            step="1"

            value={
              Math.min(
                displayedTime,
                displayedDuration ||
                  0
              )
            }

            disabled={
              !isCurrentSong ||
              !displayedDuration
            }

            onChange={(event) =>
              seek(
                event.target.value
              )
            }
          />


          <span>
            {formatTime(
              displayedDuration
            )}
          </span>

        </div>


        {/* VOLUME */}

        <div className="song-volume">

          <FaVolumeUp />


          <input
            type="range"

            min="0"
            max="1"
            step="0.01"

            value={volume}

            onChange={(event) =>
              changeVolume(
                event.target.value
              )
            }
          />

        </div>


      </section>


      {/* ===============================================
          LYRICS
      =============================================== */}

     <section
  id="lyrics-section"
  className="lyrics-section"
>


        <div className="lyrics-heading">

          <div>

            <span>
              LYRICS
            </span>

            <h2>
              Song Lyrics
            </h2>

          </div>


          <div className="lyrics-tools">


            <button
              type="button"

              onClick={
                decreaseFont
              }

              title="Decrease font size"
            >

              <FaMinus />

            </button>


            <span>
              {fontSize}px
            </span>


            <button
              type="button"

              onClick={
                increaseFont
              }

              title="Increase font size"
            >

              <FaPlus />

            </button>


            <button
              type="button"

              onClick={
                resetFont
              }

              title="Reset font size"
            >

              <FaRedo />

            </button>


          </div>

        </div>


        {song.lyrics ? (

          <div
            className="song-lyrics"

            style={{
              fontSize:
                `${fontSize}px`,
            }}
          >

            {song.lyrics}

          </div>

        ) : (

          <div className="no-lyrics">

            <FaMusic />

            <h3>
              Lyrics not available
            </h3>

            <p>
              Lyrics for this song
              will be added soon.
            </p>

          </div>

        )}


      </section>


    </div>

  );

}


export default SongDetails;