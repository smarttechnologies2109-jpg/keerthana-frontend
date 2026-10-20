
import {
  FaHeart,
  FaPlay,
  FaPause,
  FaTrash,
  FaMusic,
  FaArrowLeft,
} from "react-icons/fa";

import { Navigate, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { useLikedSongs } from "../context/LikedSongsContext";
import { usePlayer } from "../context/usePlayer";

import {
  getSongCover,
  DEFAULT_COVER,
} from "../utils/media";

import "../assets/css/likedSongs.css";

function LikedSongs() {
  const navigate = useNavigate();

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

  const isCurrentSong = (song) =>
    currentSong &&
    Number(currentSong.id) === Number(song?.id);

  const handlePlayPause = async (song) => {
    if (!song?.audio_url) {
      console.warn("Song does not have an audio URL:", song);
      return;
    }

    if (isCurrentSong(song)) {
      await togglePlay();
      return;
    }

    // Preserve the existing liked songs queue.
    await playSong(song, likedSongs);
  };

  const handlePlayAll = async () => {
    if (!likedSongs.length) return;

    const firstPlayableSong = likedSongs.find(
      (song) => song?.audio_url
    );

    if (!firstPlayableSong) return;

    await playSong(firstPlayableSong, likedSongs);
  };

  if (authLoading) {
    return (
      <div className="liked-page">
        <div className="liked-status">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <main className="liked-page">

      {/* Back navigation */}
      <button
        type="button"
        className="liked-back-btn"
        onClick={() => navigate(-1)}
      >
        <FaArrowLeft />
        <span>Back</span>
      </button>

      {/* Premium hero */}
      <section className="liked-hero">
        <div className="liked-hero-art">
          <FaHeart />
          <span className="liked-art-note note-one">♪</span>
          <span className="liked-art-note note-two">♫</span>
        </div>

        <div className="liked-hero-content">
          <span className="liked-eyebrow">
            YOUR PERSONAL COLLECTION
          </span>

          <h1>Liked Songs</h1>

          <p>
            Your favourite worship songs, together in one place.
          </p>

          <div className="liked-hero-meta">
            <span className="liked-count">
              <FaMusic />
              {likedSongs.length}{" "}
              {likedSongs.length === 1 ? "song" : "songs"}
            </span>

            {likedSongs.length > 0 && (
              <button
                type="button"
                className="liked-play-all"
                onClick={handlePlayAll}
                disabled={
                  !likedSongs.some((song) => song?.audio_url)
                }
              >
                <FaPlay />
                Play all
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Section heading */}
      <section className="liked-collection">
        <div className="liked-section-heading">
          <div>
            <span className="liked-section-label">
              YOUR MUSIC
            </span>
            <h2>Saved favourites</h2>
          </div>

          <span className="liked-section-count">
            {likedSongs.length} tracks
          </span>
        </div>

        {loading ? (
          <div className="liked-status">
            <span className="liked-spinner" />
            Loading your liked songs...
          </div>
        ) : likedSongs.length === 0 ? (
          <div className="liked-empty">
            <div className="liked-empty-icon">
              <FaHeart />
            </div>

            <h2>Your collection starts here</h2>

            <p>
              Tap the heart on any song to save it to your
              personal music collection.
            </p>
          </div>
        ) : (
          <div className="liked-grid">
            {likedSongs.map((song, index) => {
              const songIsCurrent = isCurrentSong(song);
              const songIsPlaying = songIsCurrent && isPlaying;

              return (
                <article
                  className={`liked-card ${
                    songIsCurrent ? "is-current" : ""
                  }`}
                  key={song.id}
                >
                  {/* Square cover artwork */}
                  <div className="liked-card-cover">
                    <img
                      src={getSongCover(song)}
                      alt={song.title || "Song cover"}
                      loading="lazy"
                      onError={(event) => {
                        if (
                          !event.currentTarget.src.includes(
                            "default-cover.png"
                          )
                        ) {
                          event.currentTarget.src = DEFAULT_COVER;
                        }
                      }}
                    />

                    <span className="liked-card-number">
                      {String(index + 1).padStart(2, "0")}
                    </span>

                    {songIsPlaying && (
                      <span className="liked-playing-label">
                        NOW PLAYING
                      </span>
                    )}

                    <div className="liked-cover-overlay">
                      <button
                        type="button"
                        className="liked-card-play"
                        disabled={!song?.audio_url}
                        aria-label={
                          songIsPlaying
                            ? `Pause ${song.title}`
                            : `Play ${song.title}`
                        }
                        onClick={() => handlePlayPause(song)}
                      >
                        {songIsPlaying ? <FaPause /> : <FaPlay />}
                      </button>
                    </div>
                  </div>

                  {/* Song details */}
                  <div className="liked-card-details">
                    <div className="liked-card-text">
                      <h3 title={song.title}>
                        {song.title || "Untitled song"}
                      </h3>

                      <p title={song.artist_name || "KEERTHANA"}>
                        {song.artist_name || "KEERTHANA"}
                      </p>
                    </div>

                    <button
                      type="button"
                      className="liked-card-remove"
                      aria-label={`Remove ${song.title} from liked songs`}
                      title="Remove from liked songs"
                      onClick={() => unlikeSong(song.id)}
                    >
                      <FaHeart />
                    </button>
                  </div>

                  {song.category_name && (
                    <span className="liked-card-category">
                      {song.category_name}
                    </span>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>

    </main>
  );
}

export default LikedSongs;
