
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  FaCompress,
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

import "../assets/css/full-player.css";

function formatTime(seconds) {
  const value = Number(seconds);

  if (!Number.isFinite(value) || value < 0) return "0:00";

  return `${Math.floor(value / 60)}:${String(
    Math.floor(value % 60)
  ).padStart(2, "0")}`;
}

function parseLyrics(lyrics) {
  if (typeof lyrics !== "string") return [];

  const regex = /^\[(\d{1,2}):([0-5]\d)(?:\.(\d{1,3}))?\]\s*(.+)$/;

  return lyrics
    .split(/\r?\n/)
    .map((line, index) => {
      const match = line.trim().match(regex);
      if (!match) return null;

      const decimal = match[3] || "0";
      let milliseconds = Number(decimal);

      if (decimal.length === 1) milliseconds *= 100;
      else if (decimal.length === 2) milliseconds *= 10;

      return {
        id: `${index}-${match[1]}-${match[2]}`,
        time: Number(match[1]) * 60 + Number(match[2]) + milliseconds / 1000,
        text: match[4].trim(),
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.time - b.time);
}

function songId(song) {
  return song?.id ?? song?.song_id ?? null;
}

export default function FullPlayer({ onCollapse }) {
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
    playSong,
    playQueueSong,
    closePlayer,
  } = usePlayer();

  const [lyricsOpen, setLyricsOpen] = useState(false);
  const [queueOpen, setQueueOpen] = useState(false);
  const [seekValue, setSeekValue] = useState(null);
  const [queuePosition, setQueuePosition] = useState({ top: 80, left: 20 });

  const lyricsButtonRef = useRef(null);
  const queueButtonRef = useRef(null);
  const queuePanelRef = useRef(null);
  const activeLyricRef = useRef(null);
  const previousVolumeRef = useRef(1);

  const lyrics =
    typeof currentSong?.lyrics === "string"
      ? currentSong.lyrics.trim()
      : "";

  const syncedLyrics = useMemo(
    () => parseLyrics(lyrics),
    [lyrics]
  );

  const hasSyncedLyrics = syncedLyrics.length > 0;
  const displayedTime =
    seekValue !== null ? seekValue : Number(currentTime) || 0;

  const activeLyricIndex = useMemo(() => {
    let active = -1;

    for (let index = 0; index < syncedLyrics.length; index += 1) {
      if (displayedTime >= syncedLyrics[index].time) active = index;
      else break;
    }

    return active;
  }, [displayedTime, syncedLyrics]);

  useEffect(() => {
    if (!lyricsOpen || activeLyricIndex < 0) return;

    activeLyricRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, [lyricsOpen, activeLyricIndex]);

  useEffect(() => {
    setLyricsOpen(false);
    setQueueOpen(false);
    setSeekValue(null);
  }, [currentSong?.id]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key !== "Escape") return;

      if (lyricsOpen) setLyricsOpen(false);
      else if (queueOpen) setQueueOpen(false);
      else onCollapse();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [lyricsOpen, queueOpen, onCollapse]);

  useEffect(() => {
    if (!queueOpen) return undefined;

    const updatePosition = () => {
      const button = queueButtonRef.current;
      const panel = queuePanelRef.current;
      if (!button || !panel) return;

      const margin = 16;
      const buttonRect = button.getBoundingClientRect();
      const panelRect = panel.getBoundingClientRect();

      const width = Math.min(panelRect.width || 380, window.innerWidth - margin * 2);
      const height = Math.min(panelRect.height || 480, window.innerHeight - margin * 2);

      const left = Math.max(
        margin,
        Math.min(buttonRect.right - width, window.innerWidth - width - margin)
      );

      let top = buttonRect.top - height - 12;
      if (top < margin) {
        top = Math.min(
          buttonRect.bottom + 12,
          window.innerHeight - height - margin
        );
      }

      setQueuePosition({ top: Math.max(margin, top), left });
    };

    const frame = requestAnimationFrame(updatePosition);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [queueOpen, queue?.length]);

  if (!currentSong) return null;

  const safeDuration = Number.isFinite(Number(duration))
    ? Math.max(0, Number(duration))
    : 0;

  const songs = Array.isArray(queue) ? queue : [];
  const currentId = songId(currentSong);

  const upNext = songs.filter((song) => {
    const id = songId(song);
    if (id == null || currentId == null) return song !== currentSong;
    return String(id) !== String(currentId);
  });

  const liked = currentSong.id ? isLiked(currentSong.id) : false;
  const cover = getSongCover(currentSong) || DEFAULT_COVER;

  const VolumeIcon =
    Number(volume) <= 0
      ? FaVolumeMute
      : Number(volume) < 0.5
        ? FaVolumeDown
        : FaVolumeUp;

  const toggleMute = () => {
    const value = Number(volume) || 0;

    if (value > 0) {
      previousVolumeRef.current = value;
      changeVolume(0);
    } else {
      changeVolume(previousVolumeRef.current || 1);
    }
  };

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
  const id = currentSong?.id ?? currentSong?.song_id;

  if (id == null) return;

  // Close Full Player and its open panels.
  setLyricsOpen(false);
  setQueueOpen(false);

  // Collapse to Mini Player before navigating.
  onCollapse();

  // Open the existing Song Details route.
  navigate(`/songs/${id}`);
};
  const playSelectedSong = async (song) => {
    try {
      if (playQueueSong) await playQueueSong(song);
      else await playSong(song, songs);

      setQueueOpen(false);
    } catch (error) {
      console.error("Queue playback error:", error);
    }
  };

  const handleClose = async () => {
    setLyricsOpen(false);
    setQueueOpen(false);
    onCollapse();
    await closePlayer();
  };

  const lyricsAvailable = lyrics.length > 0;

  return createPortal(
    <main className="keerthana-full-player">
      <header className="full-player-header">
        <button
          type="button"
          className="full-player-icon-button"
          onClick={onCollapse}
          title="Minimize player"
          aria-label="Minimize player"
        >
          <FaCompress />
        </button>

        <div className="full-player-brand">
          <span className="full-player-brand-mark">K</span>
          <span>KEERTHANA <small>MUSIC</small></span>
        </div>

        <button
          type="button"
          className="full-player-icon-button"
          onClick={handleClose}
          title="Close player"
          aria-label="Close player"
        >
          <FaTimes />
        </button>
      </header>

      <section className="full-player-body">
     
<button
  type="button"
  className="full-player-artwork-wrap full-player-details-link"
  onClick={openSongDetails}
  title="View song details"
  aria-label={`View details for ${currentSong.title || "this song"}`}
>
  <img
    className="full-player-artwork"
    src={cover}
    alt={currentSong.title || "Song cover"}
    onError={(event) => {
      event.currentTarget.onerror = null;
      event.currentTarget.src = DEFAULT_COVER;
    }}
  />
  <span className="full-player-artwork-glow" />
</button>


        <div className="full-player-song-info">
          <span className="full-player-eyebrow">NOW PLAYING</span>

          <button
  type="button"
  className="full-player-title-link"
  onClick={openSongDetails}
  title="View song details"
>
  {currentSong.title || "Unknown Song"}
</button>

          <p>
            {currentSong.artist_name ||
              currentSong.artist ||
              "KEERTHANA"}
          </p>

          <button
            type="button"
            className={`full-player-like ${liked ? "is-liked" : ""}`}
            onClick={handleLike}
            aria-label={liked ? "Unlike song" : "Like song"}
          >
            {liked ? <FaHeart /> : <FaRegHeart />}
            <span>{liked ? "Liked" : "Add to liked songs"}</span>
          </button>
        </div>

        <div className="full-player-controls-area">
          <div className="full-player-controls">
            <button
              type="button"
              className={isShuffle ? "is-active" : ""}
              onClick={toggleShuffle}
              disabled={upNext.length === 0}
              title="Shuffle"
              aria-label="Shuffle"
            >
              <FaRandom />
            </button>

            <button
              type="button"
              onClick={previousSong}
              disabled={upNext.length === 0}
              title="Previous"
              aria-label="Previous song"
            >
              <FaStepBackward />
            </button>

            <button
              type="button"
              className="full-player-play"
              onClick={togglePlay}
              title={isPlaying ? "Pause" : "Play"}
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <FaPause /> : <FaPlay />}
            </button>

            <button
              type="button"
              onClick={nextSong}
              disabled={upNext.length === 0}
              title="Next"
              aria-label="Next song"
            >
              <FaStepForward />
            </button>

            <button
              type="button"
              className={repeatMode !== "off" ? "is-active" : ""}
              onClick={toggleRepeat}
              title="Repeat"
              aria-label="Repeat"
            >
              <FaRedoAlt />
              {repeatMode === "one" && <span>1</span>}
            </button>
          </div>

          <div className="full-player-progress">
            <span>{formatTime(displayedTime)}</span>

            <input
              type="range"
              min="0"
              max={safeDuration}
              step="0.1"
              value={Math.min(displayedTime, safeDuration)}
              disabled={safeDuration <= 0}
              onChange={(event) => setSeekValue(Number(event.target.value))}
              onPointerUp={() => {
                if (seekValue !== null) {
                  seek(seekValue);
                  setSeekValue(null);
                }
              }}
              onKeyUp={() => {
                if (seekValue !== null) {
                  seek(seekValue);
                  setSeekValue(null);
                }
              }}
              aria-label="Song progress"
            />

            <span>{formatTime(safeDuration)}</span>
          </div>
        </div>
      </section>

      <footer className="full-player-toolbar">
        <div className="full-player-toolbar-group">
          <button
            ref={lyricsButtonRef}
            type="button"
            className={lyricsOpen ? "is-active" : ""}
            onClick={() => {
              setQueueOpen(false);
              setLyricsOpen((value) => !value);
            }}
            title="Open lyrics"
            aria-label="Open lyrics"
            aria-pressed={lyricsOpen}
          >
            <FaMicrophone />
            <span>Lyrics</span>
          </button>

          <button
            ref={queueButtonRef}
            type="button"
            className={queueOpen ? "is-active" : ""}
            onClick={() => {
              setLyricsOpen(false);
              setQueueOpen((value) => !value);
            }}
            title="Open queue"
            aria-label="Open queue"
            aria-pressed={queueOpen}
          >
            <FaListUl />
            <span>Queue</span>
            <span className="full-player-queue-count">{upNext.length}</span>
          </button>

          <div className="full-player-sleep">
            <SleepTimer />
          </div>
        </div>

        <div className="full-player-volume">
          <button type="button" onClick={toggleMute} aria-label="Mute or unmute">
            <VolumeIcon />
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={Number(volume) || 0}
            onChange={(event) => {
              const value = Number(event.target.value);
              if (value > 0) previousVolumeRef.current = value;
              changeVolume(value);
            }}
            aria-label="Volume"
          />
        </div>
      </footer>

      {lyricsOpen && (
        <div
          className="full-player-overlay"
          onClick={() => setLyricsOpen(false)}
        >
          <section
            className="full-player-panel full-player-lyrics-panel"
            onClick={(event) => event.stopPropagation()}
            aria-label="Song lyrics"
          >
            <header className="full-player-panel-header">
              <div>
                <span>KEERTHANA • LYRICS</span>
                <h2>{currentSong.title || "Song Lyrics"}</h2>
                <p>{currentSong.artist_name || "KEERTHANA"}</p>
              </div>

              <button
                type="button"
                onClick={() => setLyricsOpen(false)}
                aria-label="Close lyrics"
              >
                <FaTimes />
              </button>
            </header>

            <div className="full-player-lyrics-content">
              {!lyricsAvailable ? (
                <div className="full-player-no-lyrics">
                  <FaMicrophone />
                  <h3>Lyrics are not available yet</h3>
                  <p>Lyrics have not been added for this song.</p>
                </div>
              ) : hasSyncedLyrics ? (
                <div className="full-player-synced-lyrics">
                  {syncedLyrics.map((line, index) => (
                    <button
                      type="button"
                      key={line.id}
                      ref={index === activeLyricIndex ? activeLyricRef : null}
                      className={
                        index === activeLyricIndex
                          ? "full-player-lyric-line is-active"
                          : "full-player-lyric-line"
                      }
                      onClick={() => seek(line.time)}
                    >
                      {line.text}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="full-player-plain-lyrics">
                  {lyrics.split(/\r?\n/).map((line, index) => (
                    <p key={`${index}-${line}`}>{line || "\u00A0"}</p>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      )}

      {queueOpen && (
        <div
          className="full-player-overlay full-player-queue-overlay"
          onClick={() => setQueueOpen(false)}
        >
          <section
            ref={queuePanelRef}
            className="full-player-panel full-player-queue-panel"
            style={{
              position: "fixed",
              top: queuePosition.top,
              left: queuePosition.left,
            }}
            onClick={(event) => event.stopPropagation()}
            aria-label="Song queue"
          >
            <header className="full-player-panel-header">
              <div>
                <span>YOUR LISTENING SESSION</span>
                <h2>Queue</h2>
                <p>{upNext.length} songs up next</p>
              </div>

              <button
                type="button"
                onClick={() => setQueueOpen(false)}
                aria-label="Close queue"
              >
                <FaTimes />
              </button>
            </header>

            <div className="full-player-queue-current">
              <img src={cover} alt="" />
              <div>
                <small>NOW PLAYING</small>
                <strong>{currentSong.title || "Unknown Song"}</strong>
                <span>{currentSong.artist_name || "KEERTHANA"}</span>
              </div>
            </div>

            <div className="full-player-queue-list">
              {upNext.map((song, index) => (
                <button
                  type="button"
                  key={songId(song) ?? `${song.title}-${index}`}
                  className="full-player-queue-song"
                  onClick={() => playSelectedSong(song)}
                >
                  <img
                    src={
                      song.cover_url
                        ? getMediaUrl(song.cover_url)
                        : getSongCover(song) || DEFAULT_COVER
                    }
                    alt=""
                    onError={(event) => {
                      event.currentTarget.onerror = null;
                      event.currentTarget.src = DEFAULT_COVER;
                    }}
                  />
                  <span className="full-player-queue-song-info">
                    <strong>{song.title || "Unknown Song"}</strong>
                    <small>{song.artist_name || "KEERTHANA"}</small>
                  </span>
                  <FaPlay />
                </button>
              ))}

              {upNext.length === 0 && (
                <div className="full-player-queue-empty">
                  <FaListUl />
                  <strong>No songs in the queue</strong>
                  <p>Add more songs to continue listening.</p>
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </main>,
    document.body
  );
}
