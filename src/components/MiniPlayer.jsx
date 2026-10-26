
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  FaExpand,
  FaHeart,
  FaPause,
  FaPlay,
  FaRandom,
  FaRedoAlt,
  FaRegHeart,
  FaStepBackward,
  FaStepForward,
  FaVolumeDown,
  FaVolumeMute,
  FaVolumeUp,
  FaTimes,
  FaMicrophone,
  FaListUl,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

import { usePlayer } from "../context/usePlayer";
import { useLikedSongs } from "../context/LikedSongsContext";
import { useAuth } from "../context/AuthContext";
import SleepTimer from "../components/SleepTimer";

import {
  getSongCover,
  DEFAULT_COVER,
  getMediaUrl,
} from "../utils/media";

import "../assets/css/mini-player.css";

/* =========================================================
   TIME FORMAT
========================================================= */

function formatTime(seconds) {
  const value = Number(seconds);

  if (!Number.isFinite(value) || value < 0) {
    return "0:00";
  }

  return `${Math.floor(value / 60)}:${String(
    Math.floor(value % 60)
  ).padStart(2, "0")}`;
}

/* =========================================================
   LYRICS PARSER
========================================================= */

function parseLyrics(lyrics) {
  if (typeof lyrics !== "string") return [];

  const regex =
    /^\[(\d{1,2}):([0-5]\d)(?:\.(\d{1,3}))?\]\s*(.+)$/;

  return lyrics
    .split(/\r?\n/)
    .map((line, index) => {
      const match = line.trim().match(regex);

      if (!match) return null;

      const decimal = match[3] || "0";
      let milliseconds = Number(decimal);

      if (decimal.length === 1) {
        milliseconds *= 100;
      } else if (decimal.length === 2) {
        milliseconds *= 10;
      }

      return {
        id: `${index}-${line}`,
        time:
          Number(match[1]) * 60 +
          Number(match[2]) +
          milliseconds / 1000,
        text: match[4].trim(),
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.time - b.time);
}

/* =========================================================
   SONG ID HELPER
========================================================= */

function songId(song) {
  return song?.id ?? song?.song_id ?? null;
}

/* =========================================================
   MINI PLAYER
========================================================= */

export default function MiniPlayer({ onExpand }) {
  const navigate = useNavigate();

  const { user } = useAuth();
  const { isLiked, toggleLike } = useLikedSongs();

  const {
    currentSong,
    queue,
    isPlaying,
    currentTime,
    duration,
    volume,
    isShuffle,
    repeatMode,
    togglePlay,
    nextSong,
    previousSong,
    seek,
    changeVolume,
    toggleShuffle,
    toggleRepeat,
    closePlayer,
    playSong,
    playQueueSong,
  } = usePlayer();

  /* =======================================================
     LOCAL STATE
  ======================================================= */

  const [seekValue, setSeekValue] = useState(null);
  const [queueOpen, setQueueOpen] = useState(false);
  const [lyricsOpen, setLyricsOpen] = useState(false);
  const [previousVolume, setPreviousVolume] = useState(1);

  const lyricLineRef = useRef(null);

  /* =======================================================
     SONG DATA
  ======================================================= */

  const lyrics =
    typeof currentSong?.lyrics === "string"
      ? currentSong.lyrics.trim()
      : "";

  const syncedLyrics = useMemo(
    () => parseLyrics(lyrics),
    [lyrics]
  );

  const safeDuration = Number.isFinite(Number(duration))
    ? Math.max(0, Number(duration))
    : 0;

  const displayedTime =
    seekValue !== null
      ? Number(seekValue)
      : Number(currentTime) || 0;

  const activeLyricIndex = useMemo(() => {
    let active = -1;

    for (
      let index = 0;
      index < syncedLyrics.length;
      index += 1
    ) {
      if (displayedTime >= syncedLyrics[index].time) {
        active = index;
      } else {
        break;
      }
    }

    return active;
  }, [displayedTime, syncedLyrics]);

  const cover = currentSong
    ? getSongCover(currentSong) || DEFAULT_COVER
    : DEFAULT_COVER;

  const liked = currentSong?.id
    ? isLiked(currentSong.id)
    : false;

  const queueSongs = Array.isArray(queue) ? queue : [];

  const nextSongs = queueSongs.filter(
    (song) =>
      songId(song) == null ||
      currentSong?.id == null ||
      String(songId(song)) !== String(currentSong.id)
  );

  const VolumeIcon =
    Number(volume) <= 0
      ? FaVolumeMute
      : Number(volume) < 0.5
        ? FaVolumeDown
        : FaVolumeUp;

  /* =======================================================
     AUTO-SCROLL ACTIVE LYRIC
  ======================================================= */

  useEffect(() => {
    if (!lyricsOpen) return;

    lyricLineRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, [activeLyricIndex, lyricsOpen]);

  /* =======================================================
     RESET PANELS WHEN SONG CHANGES
  ======================================================= */

  useEffect(() => {
    setLyricsOpen(false);
    setQueueOpen(false);
    setSeekValue(null);
  }, [currentSong?.id]);

  /* =======================================================
     ESCAPE KEY
  ======================================================= */

  useEffect(() => {
    if (!lyricsOpen && !queueOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setLyricsOpen(false);
        setQueueOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [lyricsOpen, queueOpen]);

  /* =======================================================
     PLAYER HANDLERS
  ======================================================= */

  if (!currentSong) return null;

  const handleLike = async () => {
    if (!user) {
      navigate("/login");
      return;
    }

    try {
      await toggleLike(currentSong);
    } catch (error) {
      console.error("Like error:", error);
    }
  };

  const commitSeek = () => {
    if (seekValue === null) return;

    seek(Number(seekValue));
    setSeekValue(null);
  };

  const toggleMute = () => {
    const currentVolume = Number(volume) || 0;

    if (currentVolume > 0) {
      setPreviousVolume(currentVolume);
      changeVolume(0);
    } else {
      changeVolume(previousVolume || 1);
    }
  };

  const handleQueueSong = async (song) => {
    try {
      if (typeof playQueueSong === "function") {
        await playQueueSong(song);
      } else if (typeof playSong === "function") {
        await playSong(song, queueSongs);
      }

      setQueueOpen(false);
    } catch (error) {
      console.error("Queue playback error:", error);
    }
  };

  /* =======================================================
     PANEL OPEN/CLOSE HANDLERS

     Lyrics = dedicated overlay.
     Queue  = compact floating panel.
  ======================================================= */

  const openLyrics = () => {
    setQueueOpen(false);
    setLyricsOpen(true);
  };

  const closeLyrics = () => {
    setLyricsOpen(false);
  };

  const openQueue = () => {
    setLyricsOpen(false);
    setQueueOpen((previous) => !previous);
  };

  const closeQueue = () => {
    setQueueOpen(false);
  };

  /* =======================================================
     LYRICS OVERLAY

     Lyrics retains its focused overlay experience.
  ======================================================= */

  const lyricsPanel = lyricsOpen && (
    <div
      className="mini-player-overlay"
      onClick={closeLyrics}
    >
      <section
        className="mini-player-panel mini-player-lyrics-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Song lyrics"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="mini-panel-header">
          <div className="mini-panel-heading">
            <span className="mini-panel-eyebrow">
              KEERTHANA MUSIC
            </span>

            <h2>Song Lyrics</h2>

            <p>
              {currentSong.title || "Unknown Song"} ·{" "}
              {currentSong.artist_name ||
                currentSong.artist ||
                "KEERTHANA"}
            </p>
          </div>

          <button
            type="button"
            className="mini-panel-close"
            onClick={closeLyrics}
            aria-label="Close lyrics"
            title="Close lyrics"
          >
            <FaTimes />
          </button>
        </header>

        <div className="mini-lyrics-content">
          {!lyrics ? (
            <div className="mini-panel-empty">
              <FaMicrophone />

              <h3>Lyrics not available</h3>

              <p>
                Lyrics have not been added for this song yet.
              </p>
            </div>
          ) : syncedLyrics.length > 0 ? (
            <div className="mini-synced-lyrics">
              {syncedLyrics.map((line, index) => (
                <button
                  key={line.id}
                  type="button"
                  ref={
                    index === activeLyricIndex
                      ? lyricLineRef
                      : null
                  }
                  className={
                    index === activeLyricIndex
                      ? "mini-lyric-line active"
                      : "mini-lyric-line"
                  }
                  onClick={() => seek(line.time)}
                  title="Jump to this lyric"
                >
                  {line.text}
                </button>
              ))}
            </div>
          ) : (
            <div className="mini-plain-lyrics">
              {lyrics.split(/\r?\n/).map((line, index) => (
                <p key={`${index}-${line}`}>
                  {line || "\u00A0"}
                </p>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );

  /* =======================================================
     QUEUE FLOATING PANEL

     Important:
     - No full-screen backdrop.
     - Does not block the rest of the page.
     - Does not use aria-modal="true".
     - Floats above the mini-player.
     - Uses its own CSS class, separate from lyrics.
  ======================================================= */

  const queuePanel = queueOpen && (
    <div className="mini-queue-popover-root">
      <section
        className="mini-player-panel mini-player-queue-panel"
        role="dialog"
        aria-modal="false"
        aria-label="Song queue"
      >
        <header className="mini-panel-header">
          <div className="mini-panel-heading">
            <span className="mini-panel-eyebrow">
              YOUR LISTENING SESSION
            </span>

            <h2>Up Next</h2>

            <p>
              {nextSongs.length} song
              {nextSongs.length === 1 ? "" : "s"} in queue
            </p>
          </div>

          <button
            type="button"
            className="mini-panel-close"
            onClick={closeQueue}
            aria-label="Close queue"
            title="Close queue"
          >
            <FaTimes />
          </button>
        </header>

        <div className="mini-queue-current">
          <img
            src={cover}
            alt=""
            onError={(event) => {
              event.currentTarget.onerror = null;
              event.currentTarget.src = DEFAULT_COVER;
            }}
          />

          <div className="mini-queue-current-info">
            <span>NOW PLAYING</span>

            <strong>
              {currentSong.title || "Unknown Song"}
            </strong>

            <small>
              {currentSong.artist_name ||
                currentSong.artist ||
                "KEERTHANA"}
            </small>
          </div>

          <span
            className={
              isPlaying
                ? "mini-queue-status playing"
                : "mini-queue-status"
            }
          >
            {isPlaying ? "Playing" : "Paused"}
          </span>
        </div>

        <div className="mini-queue-list">
          {nextSongs.map((song, index) => {
            const songCover = song.cover_url
              ? getMediaUrl(song.cover_url)
              : getSongCover(song) || DEFAULT_COVER;

            return (
              <button
                type="button"
                className="mini-queue-song"
                key={
                  songId(song) ??
                  `${song.title}-${index}`
                }
                onClick={() => handleQueueSong(song)}
                title={`Play ${song.title || "song"}`}
              >
                <img
                  src={songCover}
                  alt=""
                  onError={(event) => {
                    event.currentTarget.onerror = null;
                    event.currentTarget.src = DEFAULT_COVER;
                  }}
                />

                <span className="mini-queue-number">
                  {index + 1}
                </span>

                <span className="mini-queue-song-info">
                  <strong>
                    {song.title || "Unknown Song"}
                  </strong>

                  <small>
                    {song.artist_name ||
                      song.artist ||
                      "KEERTHANA"}
                  </small>
                </span>

                <FaPlay className="mini-queue-play-icon" />
              </button>
            );
          })}

          {nextSongs.length === 0 && (
            <div className="mini-panel-empty">
              <FaListUl />

              <h3>Your queue is empty</h3>

              <p>
                Choose more songs to keep listening.
              </p>
            </div>
          )}
        </div>

        <footer className="mini-queue-footer">
          <span>
            <FaListUl />
            Listening queue
          </span>

          <button
            type="button"
            onClick={closeQueue}
          >
            Done
          </button>
        </footer>
      </section>
    </div>
  );

  /* =======================================================
     MINI PLAYER UI
  ======================================================= */

  return (
    <>
      {typeof document !== "undefined" &&
        createPortal(
          <section
            className="keerthana-mini-player"
            aria-label="KEERTHANA mini player"
          >
            {/* Progress indicator */}
            <div className="mini-player-progress-top">
              <span
                style={{
                  width: `${
                    safeDuration > 0
                      ? Math.min(
                          100,
                          (displayedTime / safeDuration) * 100
                        )
                      : 0
                  }%`,
                }}
              />
            </div>

            {/* Song information */}
            <div className="mini-player-song">
              <button
                className="mini-player-cover-button"
                type="button"
                onClick={onExpand}
                aria-label="Open full player"
              >
                <img
                  src={cover}
                  alt=""
                  onError={(event) => {
                    event.currentTarget.onerror = null;
                    event.currentTarget.src = DEFAULT_COVER;
                  }}
                />
              </button>

              <div className="mini-player-song-info">
                <button
                  type="button"
                  className="mini-player-title"
                  onClick={() =>
                    currentSong.id &&
                    navigate(`/songs/${currentSong.id}`)
                  }
                  title={currentSong.title || "Unknown Song"}
                >
                  {currentSong.title || "Unknown Song"}
                </button>

                <span>
                  {currentSong.artist_name ||
                    currentSong.artist ||
                    "KEERTHANA"}
                </span>
              </div>

              <button
                type="button"
                className={`mini-player-like ${
                  liked ? "is-liked" : ""
                }`}
                onClick={handleLike}
                aria-label={liked ? "Unlike song" : "Like song"}
                title={liked ? "Unlike song" : "Like song"}
              >
                {liked ? <FaHeart /> : <FaRegHeart />}
              </button>
            </div>

            {/* Playback controls */}
            <div className="mini-player-center">
              <div className="mini-player-controls">
                <button
                  type="button"
                  className={isShuffle ? "is-active" : ""}
                  onClick={toggleShuffle}
                  disabled={nextSongs.length === 0}
                  aria-label="Shuffle"
                  title="Shuffle"
                >
                  <FaRandom />
                </button>

                <button
                  type="button"
                  onClick={previousSong}
                  disabled={nextSongs.length === 0}
                  aria-label="Previous song"
                  title="Previous"
                >
                  <FaStepBackward />
                </button>

                <button
                  type="button"
                  className="mini-player-play"
                  onClick={togglePlay}
                  aria-label={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? <FaPause /> : <FaPlay />}
                </button>

                <button
                  type="button"
                  onClick={nextSong}
                  disabled={nextSongs.length === 0}
                  aria-label="Next song"
                  title="Next"
                >
                  <FaStepForward />
                </button>

                <button
                  type="button"
                  className={
                    repeatMode !== "off" ? "is-active" : ""
                  }
                  onClick={toggleRepeat}
                  aria-label="Repeat"
                  title="Repeat"
                >
                  <FaRedoAlt />

                  {repeatMode === "one" && (
                    <span>1</span>
                  )}
                </button>
              </div>

              {/* Progress slider */}
              <div className="mini-player-progress">
                <span>{formatTime(displayedTime)}</span>

                <input
                  type="range"
                  min="0"
                  max={safeDuration || 1}
                  step="0.1"
                  value={Math.min(
                    displayedTime,
                    safeDuration || 0
                  )}
                  disabled={safeDuration <= 0}
                  onChange={(event) =>
                    setSeekValue(Number(event.target.value))
                  }
                  onPointerUp={commitSeek}
                  onKeyUp={commitSeek}
                  onTouchEnd={commitSeek}
                  aria-label="Song progress"
                />

                <span>{formatTime(safeDuration)}</span>
              </div>
            </div>

            {/* Player tools */}
            <div className="mini-player-actions">
              <button
                type="button"
                className={`mini-player-tool ${
                  lyricsOpen ? "is-active" : ""
                }`}
                onClick={openLyrics}
                aria-label="Open lyrics"
                title="Lyrics"
              >
                <FaMicrophone />
                <span>Lyrics</span>
              </button>

              <button
                type="button"
                className={`mini-player-tool ${
                  queueOpen ? "is-active" : ""
                }`}
                onClick={openQueue}
                aria-label="Toggle queue"
                aria-expanded={queueOpen}
                title="Queue"
              >
                <FaListUl />
                <span>Queue</span>
              </button>

              <div className="mini-player-sleep">
                <SleepTimer />
              </div>

              <button
                type="button"
                className="mini-player-volume-button"
                onClick={toggleMute}
                aria-label={
                  Number(volume) > 0 ? "Mute" : "Unmute"
                }
                title={Number(volume) > 0 ? "Mute" : "Unmute"}
              >
                <VolumeIcon />
              </button>

              <input
                className="mini-player-volume-range"
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={Number(volume) || 0}
                onChange={(event) => {
                  const value = Number(event.target.value);

                  if (value > 0) {
                    setPreviousVolume(value);
                  }

                  changeVolume(value);
                }}
                aria-label="Volume"
              />

              <button
                type="button"
                className="mini-player-expand"
                onClick={onExpand}
                title="Open full player"
                aria-label="Open full player"
              >
                <FaExpand />
              </button>

              <button
                type="button"
                className="mini-player-close"
                onClick={closePlayer}
                title="Close player"
                aria-label="Close player"
              >
                <FaTimes />
              </button>
            </div>
          </section>,
          document.body
        )}

      {/* Lyrics remains a full overlay */}
      {typeof document !== "undefined" &&
        lyricsPanel &&
        createPortal(lyricsPanel, document.body)}

      {/* Queue is a compact floating panel */}
      {typeof document !== "undefined" &&
        queuePanel &&
        createPortal(queuePanel, document.body)}
    </>
  );
}
