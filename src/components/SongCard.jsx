import {
  FaPlay,
  FaPause,
  FaPlus,
} from "react-icons/fa";

import {
  useNavigate,
} from "react-router-dom";

import {
  usePlayer,
} from "../context/usePlayer";

import {
  getSongCover,
  DEFAULT_COVER,
} from "../utils/media";

import "../assets/css/songCard.css";


function SongCard({
  song,
  queue = [],
  resume = false,
}) {

  /* =====================================================
     NAVIGATION
  ===================================================== */

  const navigate =
    useNavigate();


  /* =====================================================
     PLAYER
  ===================================================== */

  const {
    currentSong,
    isPlaying,
    playSong,
    togglePlay,
    addToQueue,
  } = usePlayer();


  /* =====================================================
     SAFETY
  ===================================================== */

  if (!song) {
    return null;
  }


  /* =====================================================
     CURRENT SONG
  ===================================================== */

  const isCurrentSong =
    Number(currentSong?.id) ===
    Number(song.id);


  /* =====================================================
     CHECK IF ALREADY IN QUEUE
  ===================================================== */

  const isInQueue =
    Array.isArray(queue) &&
    queue.some(
      (item) =>
        Number(item?.id) ===
        Number(song.id)
    );


  /* =====================================================
     COVER IMAGE
  ===================================================== */

  const cover =
    getSongCover(song);


  /* =====================================================
     PLAY / PAUSE
  ===================================================== */

  const handlePlay =
    async (event) => {

      event.stopPropagation();


      if (isCurrentSong) {

        await togglePlay();

        return;

      }


      const startTime =
        resume
          ? Number(
              song.progress_seconds
            ) || 0
          : 0;


      await playSong(
        song,
        queue,
        startTime
      );

    };


  /* =====================================================
     ADD TO QUEUE
  ===================================================== */

  const handleAddToQueue =
    (event) => {

      event.stopPropagation();


      if (
        !addToQueue ||
        isInQueue
      ) {
        return;
      }


      addToQueue(song);

    };


  /* =====================================================
     OPEN DETAILS
  ===================================================== */

  const openSongDetails =
    () => {

      navigate(
        `/songs/${song.id}`
      );

    };


  /* =====================================================
     KEYBOARD
  ===================================================== */

  const handleKeyDown =
    (event) => {

      if (
        event.key === "Enter" ||
        event.key === " "
      ) {

        event.preventDefault();

        openSongDetails();

      }

    };


  /* =====================================================
     PROGRESS
  ===================================================== */

  const progress =
    Number(
      song.progress_seconds
    ) || 0;


  const songDuration =
    Number(
      song.duration
    ) || 0;


  const progressPercentage =
    resume &&
    songDuration > 0
      ? Math.min(
          100,
          Math.max(
            0,
            (
              progress /
              songDuration
            ) * 100
          )
        )
      : 0;


  /* =====================================================
     UI
  ===================================================== */

  return (

    <div
      className={
        isCurrentSong
          ? "song-card-component playing"
          : "song-card-component"
      }

      onClick={openSongDetails}

      onKeyDown={handleKeyDown}

      role="button"

      tabIndex={0}
    >


      {/* =================================================
          COVER
      ================================================= */}

      <div className="song-card-cover">

        <img
          src={cover}

          alt={
            song.title ||
            "Song cover"
          }

          loading="lazy"

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


        {/* =================================================
            OVERLAY
        ================================================= */}

        <div className="song-card-overlay">

          <button
            type="button"

            className="song-card-play"

            onClick={handlePlay}

            aria-label={
              isCurrentSong &&
              isPlaying
                ? `Pause ${song.title}`
                : `Play ${song.title}`
            }
          >

            {isCurrentSong &&
            isPlaying ? (

              <FaPause />

            ) : (

              <FaPlay />

            )}

          </button>


          {/* =================================================
              ADD TO QUEUE
          ================================================= */}

          <button
            type="button"

            className={
              isInQueue
                ? "song-card-queue added"
                : "song-card-queue"
            }

            onClick={handleAddToQueue}

            disabled={isInQueue}

            aria-label={
              isInQueue
                ? `${song.title} is already in queue`
                : `Add ${song.title} to queue`
            }

            title={
              isInQueue
                ? "Already in queue"
                : "Add to queue"
            }
          >

            <FaPlus />

          </button>

        </div>


        {/* =================================================
            PLAYING INDICATOR
        ================================================= */}

        {isCurrentSong &&
          isPlaying && (

            <div className="song-playing-indicator">

              <span />
              <span />
              <span />
              <span />

            </div>

          )}

      </div>


      {/* =================================================
          SONG CONTENT
      ================================================= */}

      <div className="song-card-content">

        <h3 title={song.title}>

          {song.title ||
            "Unknown Song"}

        </h3>


        {song.title_english && (

          <p
            className="song-card-english"

            title={
              song.title_english
            }
          >

            {song.title_english}

          </p>

        )}


        <p
          className="song-card-artist"

          title={
            song.artist_name ||
            "KEERTHANA"
          }
        >

          {song.artist_name ||
            "KEERTHANA"}

        </p>


        {song.category_name && (

          <span className="song-card-category">

            {song.category_name}

          </span>

        )}


        {/* =================================================
            CONTINUE LISTENING
        ================================================= */}

        {resume &&
          songDuration > 0 && (

            <div className="song-card-resume">

              <div className="song-card-progress">

                <div
                  className="song-card-progress-fill"

                  style={{
                    width:
                      `${progressPercentage}%`,
                  }}
                />

              </div>


              <span>

                {Math.round(
                  progressPercentage
                )}% listened

              </span>

            </div>

          )}

      </div>

    </div>

  );

}


export default SongCard;