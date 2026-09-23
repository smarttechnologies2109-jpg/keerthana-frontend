import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  FaHeart,
  FaListUl,
  FaMicrophone,
  FaPause,
  FaPlay,
  FaRandom,
  FaRedoAlt,
  FaRegHeart,
  FaStepBackward,
  FaStepForward,
  FaTimes,
  FaVolumeDown,
  FaVolumeMute,
  FaVolumeUp,
} from "react-icons/fa";

import { useNavigate } from "react-router-dom";

import { usePlayer } from "../context/PlayerContext";
import { useLikedSongs } from "../context/LikedSongsContext";
import { useAuth } from "../context/AuthContext";

import {
  getSongCover,
  DEFAULT_COVER,
  getMediaUrl,
} from "../utils/media";

import "../assets/css/player.css";


/* =========================================================
   FORMAT TIME
========================================================= */

function formatTime(seconds) {
  const value = Number(seconds);

  if (!Number.isFinite(value) || value < 0) {
    return "0:00";
  }

  const minutes = Math.floor(value / 60);

  const secondsPart = Math.floor(value % 60)
    .toString()
    .padStart(2, "0");

  return `${minutes}:${secondsPart}`;
}


/* =========================================================
   PARSE LRC LYRICS

   Example:

   [00:05.00] First line
   [00:10.50] Second line
   [00:15.00] Third line
========================================================= */

function parseLyrics(lyrics) {
  if (!lyrics || typeof lyrics !== "string") {
    return [];
  }

  const timestampRegex =
    /^\[(\d{1,2}):([0-5]\d)(?:\.(\d{1,3}))?\]\s*(.+)$/;

  return lyrics
    .split(/\r?\n/)
    .map((line, index) => {
      const match = line.trim().match(timestampRegex);

      if (!match) {
        return null;
      }

      const minutes = Number(match[1]);
      const seconds = Number(match[2]);

      const decimal = match[3] || "0";

      let milliseconds = Number(decimal);

      if (decimal.length === 1) {
        milliseconds *= 100;
      } else if (decimal.length === 2) {
        milliseconds *= 10;
      }

      return {
        id: `${index}-${minutes}-${seconds}-${milliseconds}`,
        time:
          minutes * 60 +
          seconds +
          milliseconds / 1000,
        text: match[4].trim(),
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.time - b.time);
}


/* =========================================================
   MUSIC PLAYER
========================================================= */

function MusicPlayer() {
  const navigate = useNavigate();

  const { user } = useAuth();

  const {
    isLiked,
    toggleLike,
  } = useLikedSongs();

  const {
    currentSong,
    queue,
    isPlaying,
    currentTime,
    duration,
    volume,
    shuffle,
    repeatMode,
    playSong,
    togglePlay,
    nextSong,
    previousSong,
    seek,
    changeVolume,
    toggleShuffle,
    toggleRepeat,
    closePlayer,
  } = usePlayer();


  /* =======================================================
     LOCAL STATE
  ======================================================= */

  const [seekValue, setSeekValue] = useState(null);

  const [queueOpen, setQueueOpen] = useState(false);

  const [lyricsOpen, setLyricsOpen] = useState(false);

  const previousVolumeRef = useRef(1);

  const activeLyricRef = useRef(null);


  /* =======================================================
     LYRICS
  ======================================================= */

  const lyrics =
    typeof currentSong?.lyrics === "string"
      ? currentSong.lyrics.trim()
      : "";

  const syncedLyrics = useMemo(
    () => parseLyrics(currentSong?.lyrics),
    [currentSong?.lyrics]
  );

  const hasLyrics = Boolean(lyrics);

  const hasSyncedLyrics =
    syncedLyrics.length > 0;


  /* =======================================================
     DISPLAY TIME
  ======================================================= */

  const displayedTime =
    seekValue !== null
      ? Number(seekValue)
      : Number(currentTime) || 0;


  /* =======================================================
     ACTIVE LYRIC
  ======================================================= */

  const activeLyricIndex = useMemo(() => {
    if (!hasSyncedLyrics) {
      return -1;
    }

    let index = -1;

    for (
      let i = 0;
      i < syncedLyrics.length;
      i += 1
    ) {
      if (
        displayedTime >= syncedLyrics[i].time
      ) {
        index = i;
      } else {
        break;
      }
    }

    return index;
  }, [
    displayedTime,
    syncedLyrics,
    hasSyncedLyrics,
  ]);


  /* =======================================================
     AUTO SCROLL LYRICS
  ======================================================= */

  useEffect(() => {
    if (!lyricsOpen) {
      return;
    }

    if (activeLyricIndex < 0) {
      return;
    }

    activeLyricRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, [
    activeLyricIndex,
    lyricsOpen,
  ]);


  /* =======================================================
     CLOSE LYRICS WHEN SONG CHANGES
  ======================================================= */

  useEffect(() => {
    setLyricsOpen(false);
  }, [currentSong?.id]);


  /* =======================================================
     IMPORTANT

     All hooks are above this condition.
     This prevents React hook errors.
  ======================================================= */

  if (!currentSong) {
    return null;
  }


  /* =======================================================
     VALUES
  ======================================================= */

  const safeDuration =
    Number.isFinite(Number(duration))
      ? Number(duration)
      : 0;

  const queueSongs =
    Array.isArray(queue)
      ? queue
      : [];

  const hasQueue =
    queueSongs.length > 1;


  /* =======================================================
     LIKE
  ======================================================= */

  const currentSongLiked =
    currentSong.id
      ? isLiked(currentSong.id)
      : false;


  /* =======================================================
     COVER
  ======================================================= */

  const cover =
    getSongCover(currentSong);


  /* =======================================================
     SEEK
  ======================================================= */

  const handleSeekChange = (event) => {
    setSeekValue(
      Number(event.target.value)
    );
  };

  const commitSeek = () => {
    if (seekValue === null) {
      return;
    }

    seek(seekValue);
    setSeekValue(null);
  };


  /* =======================================================
     VOLUME
  ======================================================= */

  const handleVolumeChange = (event) => {
    const value =
      Number(event.target.value);

    if (value > 0) {
      previousVolumeRef.current = value;
    }

    changeVolume(value);
  };

  const toggleMute = () => {
    if (Number(volume) > 0) {
      previousVolumeRef.current =
        Number(volume);

      changeVolume(0);
      return;
    }

    changeVolume(
      previousVolumeRef.current || 1
    );
  };

  const VolumeIcon =
    Number(volume) <= 0
      ? FaVolumeMute
      : Number(volume) < 0.5
        ? FaVolumeDown
        : FaVolumeUp;


  /* =======================================================
     LIKE SONG
  ======================================================= */

  const handleLike = async () => {
    if (!user) {
      navigate("/login");
      return;
    }

    try {
      await toggleLike(currentSong);
    } catch (error) {
      console.error(
        "Like error:",
        error
      );
    }
  };


  /* =======================================================
     SONG DETAILS
  ======================================================= */

  const openSongDetails = () => {
    if (!currentSong.id) {
      return;
    }

    navigate(
      `/songs/${currentSong.id}`
    );
  };


  /* =======================================================
     ARTIST DETAILS
  ======================================================= */

  const openArtistDetails = () => {
    if (!currentSong.artist_id) {
      return;
    }

    navigate(
      `/artists/${currentSong.artist_id}`
    );
  };


  /* =======================================================
     QUEUE SONG
  ======================================================= */

  const handleQueueSong = async (song) => {
    if (!song) {
      return;
    }

    await playSong(
      song,
      queueSongs
    );

    setQueueOpen(false);
  };


  /* =======================================================
     CLOSE PLAYER
  ======================================================= */

  const handleClosePlayer = async () => {
    setQueueOpen(false);
    setLyricsOpen(false);

    await closePlayer();
  };


  /* =======================================================
     LYRICS
  ======================================================= */

  const openLyrics = () => {
    if (!hasLyrics) {
      return;
    }

    setQueueOpen(false);
    setLyricsOpen(true);
  };

  const closeLyrics = () => {
    setLyricsOpen(false);
  };


  /* =======================================================
     LYRICS SEEK
  ======================================================= */

  const handleLyricClick = (time) => {
    seek(time);
  };


  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <>
      {/* ===================================================
          PLAYER
      =================================================== */}

      <div className="music-player">

        {/* SONG INFO */}

        <div className="player-song-info">

          <img
            src={cover}
            alt={currentSong.title || "Song"}
            onError={(event) => {
              event.currentTarget.onerror = null;
              event.currentTarget.src =
                DEFAULT_COVER;
            }}
          />

          <div className="player-song-text">

            <button
              type="button"
              className="player-song-title-link"
              onClick={openSongDetails}
            >
              {currentSong.title ||
                "Unknown Song"}
            </button>

            {currentSong.artist_id ? (
              <button
                type="button"
                className="player-artist-link"
                onClick={openArtistDetails}
              >
                {currentSong.artist_name ||
                  "KEERTHANA"}
              </button>
            ) : (
              <span className="player-artist-name">
                {currentSong.artist_name ||
                  "KEERTHANA"}
              </span>
            )}

          </div>

          <button
            type="button"
            className={
              currentSongLiked
                ? "player-like-button liked"
                : "player-like-button"
            }
            onClick={handleLike}
            title={
              currentSongLiked
                ? "Remove Like"
                : "Like"
            }
          >
            {currentSongLiked ? (
              <FaHeart />
            ) : (
              <FaRegHeart />
            )}
          </button>

        </div>


        {/* CENTER */}

        <div className="player-main">

          <div className="player-buttons">

            <button
              type="button"
              className={
                shuffle
                  ? "player-shuffle active"
                  : "player-shuffle"
              }
              onClick={toggleShuffle}
              disabled={!hasQueue}
              title="Shuffle"
            >
              <FaRandom />
            </button>

            <button
              type="button"
              onClick={previousSong}
              disabled={!hasQueue}
              title="Previous"
            >
              <FaStepBackward />
            </button>

            <button
              type="button"
              className="player-play"
              onClick={togglePlay}
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

            <button
              type="button"
              onClick={nextSong}
              disabled={!hasQueue}
              title="Next"
            >
              <FaStepForward />
            </button>

            <button
              type="button"
              className={
                repeatMode !== "off"
                  ? "player-repeat active"
                  : "player-repeat"
              }
              onClick={toggleRepeat}
              title="Repeat"
            >
              <FaRedoAlt />

              {repeatMode === "one" && (
                <span>1</span>
              )}
            </button>

          </div>


          {/* PROGRESS */}

          <div className="player-progress">

            <span>
              {formatTime(displayedTime)}
            </span>

            <input
              type="range"
              min="0"
              max={safeDuration || 0}
              step="0.1"
              value={Math.min(
                displayedTime,
                safeDuration ||
                  displayedTime
              )}
              disabled={
                safeDuration <= 0
              }
              onChange={handleSeekChange}
              onMouseUp={commitSeek}
              onTouchEnd={commitSeek}
              onKeyUp={commitSeek}
            />

            <span>
              {formatTime(safeDuration)}
            </span>

          </div>

        </div>


        {/* RIGHT */}

        <div className="player-right-controls">

          {/* LYRICS */}

          <button
            type="button"
            className={
              lyricsOpen
                ? "player-lyrics-button active"
                : "player-lyrics-button"
            }
            onClick={
              lyricsOpen
                ? closeLyrics
                : openLyrics
            }
            disabled={!hasLyrics}
            title={
              hasLyrics
                ? "Lyrics"
                : "Lyrics unavailable"
            }
          >
            <FaMicrophone />
            <span>Lyrics</span>
          </button>


          {/* QUEUE */}

          <button
            type="button"
            className={
              queueOpen
                ? "player-queue-button active"
                : "player-queue-button"
            }
            onClick={() =>
              setQueueOpen(
                (value) => !value
              )
            }
            title="Queue"
          >
            <FaListUl />
          </button>


          {/* VOLUME */}

          <div className="player-volume">

            <button
              type="button"
              onClick={toggleMute}
              className="player-volume-button"
              title={
                Number(volume) > 0
                  ? "Mute"
                  : "Unmute"
              }
            >
              <VolumeIcon />
            </button>

            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={Number(volume) || 0}
              onChange={
                handleVolumeChange
              }
            />

          </div>


          {/* CLOSE */}

          <button
            type="button"
            className="player-close-button"
            onClick={handleClosePlayer}
            title="Close player"
          >
            <FaTimes />
          </button>

        </div>

      </div>


      {/* ===================================================
          QUEUE
      =================================================== */}

      {queueOpen && (
        <div className="player-queue-panel">

          <div className="player-queue-header">

            <div>
              <small>KEERTHANA</small>
              <h3>Queue</h3>
            </div>

            <button
              type="button"
              onClick={() =>
                setQueueOpen(false)
              }
            >
              <FaTimes />
            </button>

          </div>


          <div className="queue-section-title">
            Now Playing
          </div>

          <button
            type="button"
            className="queue-song-row current"
            onClick={() =>
              handleQueueSong(currentSong)
            }
          >
            <img
              src={cover}
              alt=""
              onError={(event) => {
                event.currentTarget.onerror = null;
                event.currentTarget.src =
                  DEFAULT_COVER;
              }}
            />

            <div className="queue-song-info">
              <strong>
                {currentSong.title ||
                  "Unknown Song"}
              </strong>

              <span>
                {currentSong.artist_name ||
                  "KEERTHANA"}
              </span>
            </div>

            <span>
              {isPlaying
                ? "Playing"
                : "Paused"}
            </span>
          </button>


          <div className="queue-section-title">
            Up Next
          </div>

          <div className="queue-song-list">

            {queueSongs
              .filter(
                (song) =>
                  song.id !==
                  currentSong.id
              )
              .map((song) => {

                const songCover =
                  song.cover_url
                    ? getMediaUrl(
                        song.cover_url
                      )
                    : DEFAULT_COVER;

                return (
                  <button
                    type="button"
                    className="queue-song-row"
                    key={song.id}
                    onClick={() =>
                      handleQueueSong(song)
                    }
                  >
                    <img
                      src={songCover}
                      alt=""
                      onError={(event) => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src =
                          DEFAULT_COVER;
                      }}
                    />

                    <div className="queue-song-info">
                      <strong>
                        {song.title ||
                          "Unknown Song"}
                      </strong>

                      <span>
                        {song.artist_name ||
                          "KEERTHANA"}
                      </span>
                    </div>

                    <FaPlay />
                  </button>
                );
              })}

            {queueSongs.filter(
              (song) =>
                song.id !==
                currentSong.id
            ).length === 0 && (
              <div className="queue-empty">
                No more songs
              </div>
            )}

          </div>

        </div>
      )}


      {/* ===================================================
          LYRICS
      =================================================== */}

      {lyricsOpen && (
        <div
          className="player-lyrics-overlay"
          onClick={closeLyrics}
        >
          <div
            className="player-lyrics-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div className="player-lyrics-header">

              <div>
                <small>
                  KEERTHANA • LYRICS
                </small>

                <h2>
                  {currentSong.title ||
                    "Unknown Song"}
                </h2>

                <p>
                  {currentSong.artist_name ||
                    "KEERTHANA"}
                </p>
              </div>

              <button
                type="button"
                onClick={closeLyrics}
              >
                <FaTimes />
              </button>

            </div>


            <div className="player-lyrics-content">

              {hasSyncedLyrics ? (
                <div className="synced-lyrics-list">

                  {syncedLyrics.map(
                    (lyric, index) => {

                      const active =
                        index ===
                        activeLyricIndex;

                      return (
                        <button
                          type="button"
                          key={lyric.id}
                          ref={
                            active
                              ? activeLyricRef
                              : null
                          }
                          className={
                            active
                              ? "synced-lyric-line active"
                              : "synced-lyric-line"
                          }
                          onClick={() =>
                            handleLyricClick(
                              lyric.time
                            )
                          }
                        >
                          {lyric.text}
                        </button>
                      );
                    }
                  )}

                </div>
              ) : (
                <div className="plain-lyrics">

                  {lyrics
                    .split(/\r?\n/)
                    .map(
                      (line, index) => (
                        <p
                          key={`${index}-${line}`}
                        >
                          {line || "\u00A0"}
                        </p>
                      )
                    )}

                </div>
              )}

            </div>

          </div>
        </div>
      )}

    </>
  );
}


export default MusicPlayer;