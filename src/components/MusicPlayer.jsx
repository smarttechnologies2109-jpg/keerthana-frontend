
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  FaCompress,
  FaExpand,
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

import { usePlayer } from "../context/usePlayer";
import { useLikedSongs } from "../context/LikedSongsContext";
import { useAuth } from "../context/AuthContext";
import SleepTimer from "../components/SleepTimer";

import {
  getSongCover,
  DEFAULT_COVER,
  getMediaUrl,
} from "../utils/media";

import "../assets/css/player.css";

/* =========================================================
   HELPERS
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

      if (!match) return null;

      const minutes = Number(match[1]);
      const seconds = Number(match[2]);
      const decimal = match[3] || "0";

      let milliseconds = Number(decimal);

      if (decimal.length === 1) milliseconds *= 100;
      else if (decimal.length === 2) milliseconds *= 10;

      return {
        id: `${index}-${minutes}-${seconds}-${milliseconds}`,
        time: minutes * 60 + seconds + milliseconds / 1000,
        text: match[4].trim(),
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.time - b.time);
}

function getPlayerSongId(song) {
  return song?.id ?? song?.song_id ?? null;
}

/* =========================================================
   MUSIC PLAYER
========================================================= */

function MusicPlayer() {
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
    playSong,
    togglePlay,
    nextSong,
    previousSong,
    seek,
    changeVolume,
    toggleShuffle,
    toggleRepeat,
    closePlayer,
    playQueueSong,
  } = usePlayer();

  /* =======================================================
     LOCAL STATE
  ======================================================= */

  const [seekValue, setSeekValue] = useState(null);
  const [queueOpen, setQueueOpen] = useState(false);
  const [lyricsOpen, setLyricsOpen] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const previousVolumeRef = useRef(1);
  const activeLyricRef = useRef(null);

  const queueButtonRef = useRef(null);
  const queuePanelRef = useRef(null);

  const [queuePanelPosition, setQueuePanelPosition] = useState({
    top: 0,
    left: 0,
  });

  // Always use a safe queue length.
  const queueLength = Array.isArray(queue) ? queue.length : 0;

  /* =======================================================
     RESPONSIVE MODE
  ======================================================= */

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 768px)");

    const updateMobile = () => {
      setIsMobile(mediaQuery.matches);

      if (mediaQuery.matches) {
        setIsFullScreen(false);
      }
    };

    updateMobile();

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", updateMobile);
    } else {
      mediaQuery.addListener(updateMobile);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener("change", updateMobile);
      } else {
        mediaQuery.removeListener(updateMobile);
      }
    };
  }, []);

  /* =======================================================
     QUEUE PANEL POSITION
  ======================================================= */

  useEffect(() => {
    if (!queueOpen) return undefined;

    let frameId;

    const updateQueuePosition = () => {
      const button = queueButtonRef.current;
      const panel = queuePanelRef.current;

      if (!button || !panel) return;

      const buttonRect = button.getBoundingClientRect();
      const panelRect = panel.getBoundingClientRect();

      const margin = 12;
      const gap = 12;

      const panelWidth = Math.min(
        panelRect.width || 360,
        Math.max(1, window.innerWidth - margin * 2)
      );

      const panelHeight = Math.min(
        panelRect.height || 400,
        Math.max(1, window.innerHeight - margin * 2)
      );

      // Align the right side of the panel with the queue button.
      const left = Math.max(
        margin,
        Math.min(
          buttonRect.right - panelWidth,
          window.innerWidth - panelWidth - margin
        )
      );

      // Prefer placing the panel above the player.
      let top = buttonRect.top - panelHeight - gap;

      // If there is not enough space above, try below.
      if (top < margin) {
        const belowTop = buttonRect.bottom + gap;
        const availableBelow =
          window.innerHeight - belowTop - margin;

        if (availableBelow >= Math.min(panelHeight, 180)) {
          top = belowTop;
        } else {
          top = Math.max(
            margin,
            window.innerHeight - panelHeight - margin
          );
        }
      }

      // Keep the panel inside the viewport.
      top = Math.max(
        margin,
        Math.min(
          top,
          window.innerHeight - panelHeight - margin
        )
      );

      setQueuePanelPosition((previous) => {
        if (
          Math.abs(previous.top - top) < 1 &&
          Math.abs(previous.left - left) < 1
        ) {
          return previous;
        }

        return { top, left };
      });
    };

    // Wait for the portal panel to render before measuring it.
    frameId = window.requestAnimationFrame(updateQueuePosition);

    window.addEventListener("resize", updateQueuePosition);
    window.addEventListener("scroll", updateQueuePosition, true);

    const resizeObserver =
      typeof ResizeObserver !== "undefined" && queuePanelRef.current
        ? new ResizeObserver(updateQueuePosition)
        : null;

    if (resizeObserver && queuePanelRef.current) {
      resizeObserver.observe(queuePanelRef.current);
    }

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("resize", updateQueuePosition);
      window.removeEventListener("scroll", updateQueuePosition, true);
      resizeObserver?.disconnect();
    };
  }, [
    queueOpen,
    queueLength,
    currentSong?.id,
    isFullScreen,
    isMobile,
  ]);

  /* =======================================================
     SONG AND LYRICS DATA
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
  const hasSyncedLyrics = syncedLyrics.length > 0;

  const displayedTime =
    seekValue !== null
      ? Number(seekValue)
      : Number(currentTime) || 0;

  const activeLyricIndex = useMemo(() => {
    if (!hasSyncedLyrics) return -1;

    let index = -1;

    for (let i = 0; i < syncedLyrics.length; i += 1) {
      if (displayedTime >= syncedLyrics[i].time) {
        index = i;
      } else {
        break;
      }
    }

    return index;
  }, [displayedTime, syncedLyrics, hasSyncedLyrics]);

  useEffect(() => {
    if (!lyricsOpen || activeLyricIndex < 0) return;

    activeLyricRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, [activeLyricIndex, lyricsOpen]);

  useEffect(() => {
    setLyricsOpen(false);
    setSeekValue(null);
  }, [currentSong?.id]);

  /* =======================================================
     ESCAPE KEY
  ======================================================= */

  useEffect(() => {
    if (!isFullScreen && !queueOpen && !lyricsOpen) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key !== "Escape") return;

      if (lyricsOpen) {
        setLyricsOpen(false);
      } else if (queueOpen) {
        setQueueOpen(false);
      } else {
        setIsFullScreen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isFullScreen, queueOpen, lyricsOpen]);

  /* =======================================================
     NO SONG
  ======================================================= */

  if (!currentSong) return null;

  /* =======================================================
     SAFE VALUES
  ======================================================= */

  const safeDuration = Number.isFinite(Number(duration))
    ? Math.max(0, Number(duration))
    : 0;

  const queueSongs = Array.isArray(queue) ? queue : [];

  const currentSongId = getPlayerSongId(currentSong);

  const upNextSongs = queueSongs.filter((song) => {
    const songId = getPlayerSongId(song);

    if (songId == null || currentSongId == null) {
      return song !== currentSong;
    }

    return String(songId) !== String(currentSongId);
  });

  const hasQueue = upNextSongs.length > 0;

  const currentSongLiked = currentSong.id
    ? isLiked(currentSong.id)
    : false;

  const cover = getSongCover(currentSong) || DEFAULT_COVER;

  /* =======================================================
     SEEK
  ======================================================= */

  const handleSeekChange = (event) => {
    setSeekValue(Number(event.target.value));
  };

  const commitSeek = () => {
    if (seekValue === null) return;

    seek(seekValue);
    setSeekValue(null);
  };

  /* =======================================================
     VOLUME
  ======================================================= */

  const handleVolumeChange = (event) => {
    const value = Number(event.target.value);

    if (value > 0) {
      previousVolumeRef.current = value;
    }

    changeVolume(value);
  };

  const toggleMute = () => {
  const currentVolume = Math.max(
    0,
    Math.min(1, Number(volume) || 0)
  );

  if (currentVolume > 0) {
    previousVolumeRef.current = currentVolume;
    changeVolume(0);
  } else {
    changeVolume(
      Math.max(0.01, Math.min(1, previousVolumeRef.current || 1))
    );
  }
};

  const VolumeIcon =
    Number(volume) <= 0
      ? FaVolumeMute
      : Number(volume) < 0.5
        ? FaVolumeDown
        : FaVolumeUp;

  /* =======================================================
     LIKES AND NAVIGATION
  ======================================================= */

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

  const openSongDetails = () => {
    if (currentSong?.id) {
      setIsFullScreen(false);
      setLyricsOpen(false);
      setQueueOpen(false);

      navigate(`/songs/${currentSong.id}`);
    }
  };

  const openArtistDetails = () => {
    if (currentSong.artist_id) {
      navigate(`/artists/${currentSong.artist_id}`);
    }
  };

  /* =======================================================
     QUEUE
  ======================================================= */

  const handleQueueSong = async (song) => {
    if (!song) return;

    try {
      if (playQueueSong) {
        await playQueueSong(song);
      } else {
        await playSong(song, queueSongs);
      }

      setQueueOpen(false);
    } catch (error) {
      console.error("Queue playback error:", error);
    }
  };

  /* =======================================================
     CLOSE PLAYER
  ======================================================= */

  const handleClosePlayer = async () => {
    setQueueOpen(false);
    setLyricsOpen(false);
    setIsFullScreen(false);

    await closePlayer();
  };

  /* =======================================================
     LYRICS
  ======================================================= */

  const openLyrics = () => {
    if (!hasLyrics) return;

    setQueueOpen(false);
    setLyricsOpen(true);
  };

  const handleLyricClick = (time) => {
    seek(time);
  };

  /* =======================================================
     EXPAND / COLLAPSE
  ======================================================= */

  const toggleFullScreen = () => {
    setIsFullScreen((previous) => !previous);
  };

  const handlePlayerClick = (event) => {
    if (!isMobile || isFullScreen) return;

    if (
      event.target.closest?.(
        "button, input, a, select, textarea, [role='button']"
      )
    ) {
      return;
    }

    setIsFullScreen(true);
  };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <>
      <div
        className={`music-player ${
          isFullScreen ? "music-player-fullscreen" : ""
        }`}
        onClick={handlePlayerClick}
       >
        {/* SONG INFORMATION */}

        <div className="player-song-info">
          <img
            src={cover}
            alt={currentSong.title || "Song cover"}
            onError={(event) => {
              event.currentTarget.onerror = null;
              event.currentTarget.src = DEFAULT_COVER;
            }}
          />

          <div className="player-song-text">
            <button
              type="button"
              className="player-song-title-link"
              onClick={openSongDetails}
            >
              {currentSong.title || "Unknown Song"}
            </button>

            {currentSong.artist_id ? (
              <button
                type="button"
                className="player-artist-link"
                onClick={openArtistDetails}
              >
                {currentSong.artist_name || "KEERTHANA"}
              </button>
            ) : (
              <span className="player-artist-name">
                {currentSong.artist_name || "KEERTHANA"}
              </span>
            )}
          </div>

          <button
            type="button"
            className={`player-like-button ${
              currentSongLiked ? "liked" : ""
            }`}
            onClick={handleLike}
            title={currentSongLiked ? "Remove Like" : "Like"}
            aria-label={currentSongLiked ? "Unlike song" : "Like song"}
          >
            {currentSongLiked ? <FaHeart /> : <FaRegHeart />}
          </button>
        </div>

        {/* PLAYBACK CONTROLS */}

        <div className="player-main">
          <div className="player-buttons">
            <button
              type="button"
              className={
                isShuffle ? "player-shuffle active" : "player-shuffle"
              }
              onClick={toggleShuffle}
              disabled={!hasQueue}
              title="Shuffle"
              aria-label="Toggle shuffle"
            >
              <FaRandom />
            </button>

            <button
              type="button"
              onClick={previousSong}
              disabled={!hasQueue}
              title="Previous"
              aria-label="Previous song"
            >
              <FaStepBackward />
            </button>

            <button
              type="button"
              className="player-play"
              onClick={togglePlay}
              title={isPlaying ? "Pause" : "Play"}
              aria-label={isPlaying ? "Pause song" : "Play song"}
            >
              {isPlaying ? <FaPause /> : <FaPlay />}
            </button>

            <button
              type="button"
              onClick={nextSong}
              disabled={!hasQueue}
              title="Next"
              aria-label="Next song"
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
              aria-label="Toggle repeat"
            >
              <FaRedoAlt />
              {repeatMode === "one" && <span>1</span>}
            </button>
          </div>

          <div className="player-progress">
            <span>{formatTime(displayedTime)}</span>

            <input
              type="range"
              min="0"
              max={safeDuration}
              step="0.1"
              value={Math.min(
                displayedTime,
                safeDuration || displayedTime
              )}
              disabled={safeDuration <= 0}
              onChange={handleSeekChange}
              onMouseUp={commitSeek}
              onTouchEnd={commitSeek}
              onKeyUp={commitSeek}
              aria-label="Song progress"
            />

            <span>{formatTime(safeDuration)}</span>
          </div>
        </div>

        {/* RIGHT-SIDE CONTROLS */}

        
<div className="player-right-controls">
  {/* LYRICS */}
  <button
    type="button"
    className={
      lyricsOpen
        ? "player-lyrics-button active"
        : "player-lyrics-button"
    }
    onClick={lyricsOpen ? () => setLyricsOpen(false) : openLyrics}
    disabled={!hasLyrics}
    title={hasLyrics ? "Lyrics" : "Lyrics unavailable"}
    aria-label="Toggle lyrics"
    aria-pressed={lyricsOpen}
  >
    <FaMicrophone />
    <span>Lyrics</span>
  </button>

  {/* QUEUE / UP NEXT */}
  <button
    ref={queueButtonRef}
    type="button"
    className={
      queueOpen
        ? "player-queue-button active"
        : "player-queue-button"
    }
    onClick={() => {
      setLyricsOpen(false);
      setQueueOpen((value) => !value);
    }}
    title="Queue / Up Next"
    aria-label="Open music queue"
    aria-expanded={queueOpen}
  >
    <FaListUl />
    <span>Queue</span>
  </button>

  {/* SLEEP TIMER */}
  <div className="player-sleep-timer-control">
    <SleepTimer />
  </div>

  {/* VOLUME CONTROL */}
  <div className="player-volume">
    <button
      type="button"
      onClick={toggleMute}
      className="player-volume-button"
      title={Number(volume) > 0 ? "Mute" : "Unmute"}
      aria-label={Number(volume) > 0 ? "Mute" : "Unmute"}
    >
      <VolumeIcon />
    </button>

    <input
      type="range"
      min="0"
      max="1"
      step="0.01"
      value={Number(volume) || 0}
      onChange={handleVolumeChange}
      aria-label="Volume"
      title={`Volume: ${Math.round((Number(volume) || 0) * 100)}%`}
    />
  </div>

  {/* EXPAND / COLLAPSE PLAYER */}
  <button
    type="button"
    className="player-expand-btn"
    onClick={toggleFullScreen}
    aria-label={
      isFullScreen ? "Collapse player" : "Expand player"
    }
    title={isFullScreen ? "Collapse player" : "Expand player"}
    aria-pressed={isFullScreen}
  >
    {isFullScreen ? <FaCompress /> : <FaExpand />}
  </button>

  {/* CLOSE PLAYER */}
  <button
    type="button"
    className="player-close-button"
    onClick={handleClosePlayer}
    title="Close player"
    aria-label="Close player"
  >
    <FaTimes />
  </button>
</div>

      </div>

      {/* QUEUE PANEL — RENDERED OUTSIDE THE PLAYER LAYOUT */}

      {queueOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={queuePanelRef}
            className="player-queue-panel"
            style={{
              position: "fixed",
              top: `${queuePanelPosition.top}px`,
              left: `${queuePanelPosition.left}px`,
              right: "auto",
              bottom: "auto",
              width: "min(360px, calc(100vw - 24px))",
              maxWidth: "calc(100vw - 24px)",
              maxHeight: "calc(100dvh - 24px)",
              overflowY: "auto",
              boxSizing: "border-box",
              zIndex: 11010,
            }}
          >
            <div className="player-queue-header">
              <div>
                <small>KEERTHANA</small>
                <h3>Queue</h3>
                <span className="queue-total">
                  {upNextSongs.length === 0
                    ? "No songs waiting"
                    : `${upNextSongs.length} song${
                        upNextSongs.length === 1 ? "" : "s"
                      } up next`}
                </span>
              </div>

              <div className="queue-header-actions">
                <button
                  type="button"
                  className="queue-panel-close"
                  onClick={() => setQueueOpen(false)}
                  title="Close Queue"
                  aria-label="Close queue"
                >
                  <FaTimes />
                </button>
              </div>
            </div>

            <div className="queue-section-title">
              <span>Now Playing</span>
            </div>

            <button
              type="button"
              className="queue-song-row current"
              onClick={() => setQueueOpen(false)}
            >
              <img
                src={cover}
                alt=""
                onError={(event) => {
                  event.currentTarget.onerror = null;
                  event.currentTarget.src = DEFAULT_COVER;
                }}
              />

              <div className="queue-song-info">
                <strong>{currentSong.title || "Unknown Song"}</strong>
                <span>{currentSong.artist_name || "KEERTHANA"}</span>
              </div>

              <span className="queue-playing-status">
                {isPlaying ? "Playing" : "Paused"}
              </span>
            </button>

            <div className="queue-section-title queue-up-next-title">
              <span>Up Next</span>
              {hasQueue && (
                <span className="queue-count-label">
                  {upNextSongs.length}
                </span>
              )}
            </div>

            <div className="queue-song-list">
              {upNextSongs.map((song, index) => {
                const songCover = song.cover_url
                  ? getMediaUrl(song.cover_url)
                  : getSongCover(song) || DEFAULT_COVER;

                const songKey =
                  getPlayerSongId(song) ?? `${song.title ?? "song"}-${index}`;

                return (
                  <div
                    className="queue-song-row queue-song-item"
                    key={songKey}
                  >
                    <button
                      type="button"
                      className="queue-song-main"
                      onClick={() => handleQueueSong(song)}
                    >
                      <img
                        src={songCover}
                        alt=""
                        onError={(event) => {
                          event.currentTarget.onerror = null;
                          event.currentTarget.src = DEFAULT_COVER;
                        }}
                      />

                      <div className="queue-song-info">
                        <strong>{song.title || "Unknown Song"}</strong>
                        <span>
                          {song.artist_name || "KEERTHANA"}
                        </span>
                      </div>
                    </button>
                  </div>
                );
              })}

              {!hasQueue && (
                <div className="queue-empty">
                  <FaListUl />
                  <strong>Your queue is empty</strong>
                  <span>Add songs to listen continuously.</span>
                </div>
              )}
            </div>
          </div>,
          document.body
        )}

      {/* LYRICS OVERLAY */}

      {lyricsOpen && (
        <div
          className="player-lyrics-overlay"
          onClick={() => setLyricsOpen(false)}
        >
          <div
            className="player-lyrics-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="player-lyrics-header">
              <div>
                <small>KEERTHANA • LYRICS</small>
                <h2>{currentSong.title || "Unknown Song"}</h2>
                <p>{currentSong.artist_name || "KEERTHANA"}</p>
              </div>

              <button
                type="button"
                onClick={() => setLyricsOpen(false)}
                aria-label="Close lyrics"
              >
                <FaTimes />
              </button>
            </div>

            <div className="player-lyrics-content">
              {hasSyncedLyrics ? (
                <div className="synced-lyrics-list">
                  {syncedLyrics.map((lyric, index) => {
                    const active = index === activeLyricIndex;

                    return (
                      <button
                        type="button"
                        key={lyric.id}
                        ref={active ? activeLyricRef : null}
                        className={
                          active
                            ? "synced-lyric-line active"
                            : "synced-lyric-line"
                        }
                        onClick={() => handleLyricClick(lyric.time)}
                      >
                        {lyric.text}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="plain-lyrics">
                  {lyrics.split(/\r?\n/).map((line, index) => (
                    <p key={`${index}-${line}`}>
                      {line || "\u00A0"}
                    </p>
                  ))}
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
