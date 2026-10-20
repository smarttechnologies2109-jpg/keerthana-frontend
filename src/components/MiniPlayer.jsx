
import { useState } from "react";

import {
  FaPlay,
  FaPause,
  FaStepBackward,
  FaStepForward,
  FaTimes,
  FaMusic,
  FaAlignLeft,
  FaChevronDown,
} from "react-icons/fa";

import { usePlayer } from "../context/usePlayer";
import { getSongCover } from "../utils/media";

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

  const [showLyrics, setShowLyrics] = useState(false);
  const [showFullPlayer, setShowFullPlayer] = useState(false);

  if (!currentSong) {
    return null;
  }

  const cover = getSongCover(currentSong);

  const safeCurrentTime = Number(currentTime) || 0;
  const safeDuration = Number(duration) || 0;

  const progressPercent =
    safeDuration > 0
      ? Math.min(
          100,
          Math.max(0, (safeCurrentTime / safeDuration) * 100)
        )
      : 0;

  const formatTime = (seconds) => {
    const value = Math.max(0, Math.floor(Number(seconds) || 0));
    const minutes = Math.floor(value / 60);
    const secondsPart = value % 60;

    return `${minutes}:${String(secondsPart).padStart(2, "0")}`;
  };

  const lyricsValue =
    currentSong.lyrics ??
    currentSong.lyrics_text ??
    currentSong.lyric ??
    currentSong.lyricsText ??
    currentSong.song_lyrics ??
    "";

  const lyrics =
    typeof lyricsValue === "string" ? lyricsValue : "";

  const hasLyrics = lyrics.trim().length > 0;

  const songTitle = currentSong.title || "Unknown Song";

  const artistName =
    currentSong.artist_name ||
    currentSong.artist ||
    currentSong.artistName ||
    "KEERTHANA";

  const handleClosePlayer = (event) => {
    event?.stopPropagation();
    setShowFullPlayer(false);
    setShowLyrics(false);
    closePlayer();
  };

  const openLyrics = () => {
    setShowLyrics(true);
    setShowFullPlayer(true);
  };

  return (
    <>
      {/* MINI PLAYER */}
      <div className="mini-player">
        <div className="mini-player-progress">
          <div
            className="mini-player-progress-fill"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="mini-player-content">
          <button
            type="button"
            className="mini-player-cover mini-player-open-button"
            onClick={() => setShowFullPlayer(true)}
            aria-label="Open full music player"
            title="Open full player"
          >
            {cover ? (
              <img
                src={cover}
                alt={songTitle}
                onError={(event) => {
                  event.currentTarget.onerror = null;
                  event.currentTarget.src =
                    "/images/default-cover.png";
                }}
              />
            ) : (
              <FaMusic />
            )}
          </button>

          <button
            type="button"
            className="mini-player-info mini-player-open-button"
            onClick={() => setShowFullPlayer(true)}
            aria-label={`Open player for ${songTitle}`}
          >
            <strong>{songTitle}</strong>
            <span>{artistName}</span>
          </button>

          <button
            type="button"
            className={`mini-player-button mini-player-lyrics-button ${
              showLyrics ? "active" : ""
            }`}
            onClick={openLyrics}
            aria-label="Show song lyrics"
            title="Lyrics"
          >
            <FaAlignLeft />
            <span className="mini-player-lyrics-label">Lyrics</span>
          </button>

          <button
            type="button"
            className="mini-player-button"
            onClick={previousSong}
            aria-label="Previous song"
            title="Previous"
          >
            <FaStepBackward />
          </button>

          <button
            type="button"
            className="mini-player-main-button"
            onClick={togglePlay}
            aria-label={isPlaying ? "Pause" : "Play"}
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <FaPause /> : <FaPlay />}
          </button>

          <button
            type="button"
            className="mini-player-button"
            onClick={nextSong}
            aria-label="Next song"
            title="Next"
          >
            <FaStepForward />
          </button>

          <button
            type="button"
            className="mini-player-close"
            onClick={handleClosePlayer}
            aria-label="Close player"
            title="Close player"
          >
            <FaTimes />
          </button>
        </div>

        <div className="mini-player-time">
          <span>{formatTime(safeCurrentTime)}</span>
          <span>{formatTime(safeDuration)}</span>
        </div>
      </div>

      {/* FULL MUSIC PLAYER */}
      {showFullPlayer && (
        <div
          className="full-player-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Full music player"
        >
          <div className="full-player">
            {/* Header */}
            <header className="full-player-header">
              <button
                type="button"
                className="full-player-icon-button"
                onClick={() => setShowFullPlayer(false)}
                aria-label="Minimize player"
                title="Minimize player"
              >
                <FaChevronDown />
              </button>

              <div className="full-player-header-title">
                <span>NOW PLAYING</span>
                <strong>KEERTHANA MUSIC</strong>
              </div>

              <button
                type="button"
                className="full-player-icon-button"
                onClick={handleClosePlayer}
                aria-label="Close player"
                title="Close player"
              >
                <FaTimes />
              </button>
            </header>

            {/* Album Artwork */}
            <div className="full-player-artwork">
              {cover ? (
                <img
                  src={cover}
                  alt={songTitle}
                  onError={(event) => {
                    event.currentTarget.onerror = null;
                    event.currentTarget.src =
                      "/images/default-cover.png";
                  }}
                />
              ) : (
                <div className="full-player-default-artwork">
                  <FaMusic />
                </div>
              )}
            </div>

            {/* Song Details */}
            <div className="full-player-song-details">
              <div className="full-player-song-text">
                <h1>{songTitle}</h1>
                <p>{artistName}</p>
              </div>

              <button
                type="button"
                className={`full-player-lyrics-toggle ${
                  showLyrics ? "active" : ""
                }`}
                onClick={() => setShowLyrics((value) => !value)}
                aria-label={showLyrics ? "Hide lyrics" : "Show lyrics"}
                title={showLyrics ? "Hide lyrics" : "Show lyrics"}
                aria-expanded={showLyrics}
              >
                <FaAlignLeft />
              </button>
            </div>

            {/* Progress */}
            <div className="full-player-progress-area">
              <div className="full-player-progress-track">
                <div
                  className="full-player-progress-fill"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <div className="full-player-time">
                <span>{formatTime(safeCurrentTime)}</span>
                <span>{formatTime(safeDuration)}</span>
              </div>
            </div>

            {/* Playback Controls */}
            <div className="full-player-controls">
              <button
                type="button"
                className="full-player-control-button"
                onClick={previousSong}
                aria-label="Previous song"
                title="Previous song"
              >
                <FaStepBackward />
              </button>

              <button
                type="button"
                className="full-player-play-button"
                onClick={togglePlay}
                aria-label={isPlaying ? "Pause" : "Play"}
                title={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? <FaPause /> : <FaPlay />}
              </button>

              <button
                type="button"
                className="full-player-control-button"
                onClick={nextSong}
                aria-label="Next song"
                title="Next song"
              >
                <FaStepForward />
              </button>
            </div>

            {/* Lyrics Section: Below Playback Controls */}
            {showLyrics && (
              <section className="full-player-lyrics">
                <div className="full-player-lyrics-heading">
                  <FaAlignLeft />

                  <h2>Song Lyrics</h2>

                  <button
                    type="button"
                    className="full-player-lyrics-hide"
                    onClick={() => setShowLyrics(false)}
                    aria-label="Hide lyrics"
                  >
                    Hide
                  </button>
                </div>

                {hasLyrics ? (
                  <div className="full-player-lyrics-text">
                    {lyrics}
                  </div>
                ) : (
                  <div className="full-player-lyrics-empty">
                    <FaMusic />
                    <h3>Lyrics not available</h3>
                    <p>
                      Lyrics are not included in the current song data.
                    </p>
                  </div>
                )}
              </section>
            )}

            {/* Add your existing Sleep Timer component here,
                below the playback controls, when available. */}
          </div>
        </div>
      )}
    </>
  );
}

export default MiniPlayer;
