import {
  FaPlay,
  FaPause,
  FaStepBackward,
  FaStepForward,
  FaTimes,
  FaMusic,
} from "react-icons/fa";

import {
  usePlayer,
} from "../context/usePlayer";

import {
  getSongCover,
} from "../utils/media";

import "../assets/css/mini-player.css";


function MiniPlayer() {

  const {
    currentSong,
    isPlaying,
    currentTime,
    duration,
    togglePlay,
    nextSong,
    previousSong,
    closePlayer,
  } = usePlayer();


  /* =========================================================
     NO SONG
  ========================================================= */

  if (!currentSong) {
    return null;
  }


  /* =========================================================
     COVER
  ========================================================= */

  const cover =
    getSongCover(
      currentSong
    );


  /* =========================================================
     SAFE VALUES
  ========================================================= */

  const safeCurrentTime =
    Number(currentTime) || 0;

  const safeDuration =
    Number(duration) || 0;


  /* =========================================================
     PROGRESS
  ========================================================= */

  const progressPercent =
    safeDuration > 0
      ? Math.min(
          100,
          Math.max(
            0,
            (
              safeCurrentTime /
              safeDuration
            ) * 100
          )
        )
      : 0;


  /* =========================================================
     FORMAT TIME
  ========================================================= */

  const formatTime =
    (seconds) => {

      const value =
        Math.max(
          0,
          Math.floor(
            Number(seconds) || 0
          )
        );

      const minutes =
        Math.floor(
          value / 60
        );

      const secondsPart =
        value % 60;

      return `${minutes}:${secondsPart
        .toString()
        .padStart(2, "0")}`;
    };


  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div
      className="mini-player"
    >

      {/* =================================================
          PROGRESS BAR
      ================================================= */}

      <div
        className="mini-player-progress"
      >
        <div
          className="mini-player-progress-fill"
          style={{
            width:
              `${progressPercent}%`,
          }}
        />
      </div>


      {/* =================================================
          CONTENT
      ================================================= */}

      <div
        className="mini-player-content"
      >

        {/* =================================================
            COVER
        ================================================= */}

        <div
          className="mini-player-cover"
        >

          {cover ? (

            <img
              src={cover}
              alt={
                currentSong.title ||
                "Song"
              }
              onError={
                (event) => {

                  event.currentTarget
                    .onerror = null;

                  event.currentTarget.src =
                    "/images/default-cover.png";
                }
              }
            />

          ) : (

            <FaMusic />

          )}

        </div>


        {/* =================================================
            SONG INFORMATION
        ================================================= */}

        <div
          className="mini-player-info"
        >

          <strong>
            {
              currentSong.title ||
              "Unknown Song"
            }
          </strong>

          <span>
            {
              currentSong.artist_name ||
              currentSong.artist ||
              "KEERTHANA"
            }
          </span>

        </div>


        {/* =================================================
            PREVIOUS
        ================================================= */}

        <button
          type="button"
          className="mini-player-button"
          onClick={
            previousSong
          }
          aria-label="Previous song"
          title="Previous"
        >
          <FaStepBackward />
        </button>


        {/* =================================================
            PLAY / PAUSE
        ================================================= */}

        <button
          type="button"
          className="mini-player-main-button"
          onClick={
            togglePlay
          }
          aria-label={
            isPlaying
              ? "Pause"
              : "Play"
          }
          title={
            isPlaying
              ? "Pause"
              : "Play"
          }
        >

          {isPlaying ? (
            <FaPause />
          ) : (
            <FaPlay />
          )}

        </button>


        {/* =================================================
            NEXT
        ================================================= */}

        <button
          type="button"
          className="mini-player-button"
          onClick={
            nextSong
          }
          aria-label="Next song"
          title="Next"
        >
          <FaStepForward />
        </button>


        {/* =================================================
            CLOSE
        ================================================= */}

        <button
          type="button"
          className="mini-player-close"
          onClick={
            closePlayer
          }
          aria-label="Close player"
          title="Close player"
        >
          <FaTimes />
        </button>

      </div>


      {/* =================================================
          TIME
      ================================================= */}

      <div
        className="mini-player-time"
      >

        <span>
          {
            formatTime(
              safeCurrentTime
            )
          }
        </span>

        <span>
          {
            formatTime(
              safeDuration
            )
          }
        </span>

      </div>

    </div>
  );
}


export default MiniPlayer;