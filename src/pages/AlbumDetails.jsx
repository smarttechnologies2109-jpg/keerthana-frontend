
import {
  useEffect,
  useState,
} from "react";

import {
  FaArrowLeft,
  FaCompactDisc,
  FaPause,
  FaPlay,
} from "react-icons/fa";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import API from "../services/api";

import {
  usePlayer,
} from "../context/usePlayer";

import {
  getAlbumCover,
  DEFAULT_COVER,
} from "../utils/media";

import "../assets/css/albumDetails.css";

function AlbumDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const {
    playSong,
    togglePlay,
    currentSong,
    isPlaying,
  } = usePlayer();

  const [album, setAlbum] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* LOAD ALBUM */

  useEffect(() => {
    const loadAlbum = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await API.get(`/albums/${id}`);

        setAlbum(response.data.album);
      } catch (error) {
        console.error("Album error:", error);

        setError(
          error.response?.data?.message ||
          "Unable to load album"
        );
      } finally {
        setLoading(false);
      }
    };

    loadAlbum();
  }, [id]);

  /* LOADING */

  if (loading) {
    return (
      <div className="album-details-page album-details-loading">
        <div className="album-details-loader" />
        <p>Loading album...</p>
      </div>
    );
  }

  /* ERROR */

  if (error || !album) {
    return (
      <div className="album-details-page album-details-error">
        <button
          type="button"
          className="album-details-back"
          onClick={() => navigate("/albums")}
        >
          <FaArrowLeft />
          Back to Albums
        </button>

        <p>{error || "Album not found"}</p>
      </div>
    );
  }

  /* ALBUM COVER */

  const cover = getAlbumCover(album);

  /* CHECK WHETHER SONG BELONGS TO ALBUM */

  const isAlbumSong = (song) =>
    album.songs?.some(
      (albumSong) => albumSong.id === song?.id
    );

  /* ALBUM PLAY / PAUSE */

  const handleAlbumPlayPause = async () => {
    if (!album.songs?.length) {
      return;
    }

    const currentBelongsToAlbum =
      currentSong && isAlbumSong(currentSong);

    if (currentBelongsToAlbum) {
      await togglePlay();
      return;
    }

    await playSong(
      album.songs[0],
      album.songs
    );
  };

  /* SONG PLAY / PAUSE */

  const handleSongPlayPause = async (song) => {
    if (currentSong?.id === song.id) {
      await togglePlay();
      return;
    }

    await playSong(
      song,
      album.songs
    );
  };

  /* ALBUM BUTTON STATE */

  const albumIsPlaying = Boolean(
    currentSong &&
    isPlaying &&
    isAlbumSong(currentSong)
  );

  return (
    <div className="album-details-page">

      {/* BACK BUTTON */}

      <button
        type="button"
        className="album-details-back"
        onClick={() => navigate(-1)}
      >
        <FaArrowLeft />
        Back
      </button>

      {/* ALBUM HERO */}

      <section className="album-details-hero">

        <div className="album-details-cover">
          {cover ? (
            <img
              src={cover}
              alt={album.title || "Album cover"}
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
          ) : (
            <FaCompactDisc />
          )}
        </div>

        <div className="album-details-info">

          <span className="album-details-label">
            ALBUM
          </span>

          <h1>{album.title}</h1>

          <button
            type="button"
            className="album-details-artist"
            onClick={() => {
              if (album.artist_id) {
                navigate(`/artists/${album.artist_id}`);
              }
            }}
          >
            {album.artist_name || "KEERTHANA"}
          </button>

          <p>
            {album.song_count ?? album.songs?.length ?? 0}{" "}
            {(album.song_count ?? album.songs?.length ?? 0) === 1
              ? "song"
              : "songs"}
          </p>

        </div>

      </section>

      {/* ALBUM PLAY / PAUSE */}

      {/* <div className="album-details-actions">
        <button
          type="button"
          onClick={handleAlbumPlayPause}
          disabled={!album.songs?.length}
          aria-label={
            albumIsPlaying ? "Pause album" : "Play album"
          }
        >
          {albumIsPlaying ? <FaPause /> : <FaPlay />}
        </button>
      </div> */}

      {/* SQUARE SONG CARDS */}

      <section
        className="album-details-song-grid"
        aria-label="Album songs"
      >
        {album.songs?.map((song, index) => {
          const songIsCurrent =
            currentSong?.id === song.id;

          const songIsPlaying =
            songIsCurrent && isPlaying;

          return (
            <article
              className={`album-details-song-card ${
                songIsCurrent ? "is-current" : ""
              }`}
              key={song.id}
            >
              <span className="album-details-track-number">
                {String(index + 1).padStart(2, "0")}
              </span>

              <div className="album-details-song-info">
                <strong>{song.title}</strong>

                <span>
                  {song.artist_name || album.artist_name || "KEERTHANA"}
                </span>
              </div>

              <span className="album-details-category">
                {song.category_name || "Christian Music"}
              </span>

              <button
                type="button"
                className="album-details-song-play"
                onClick={() => handleSongPlayPause(song)}
                aria-label={
                  songIsPlaying ? "Pause song" : "Play song"
                }
              >
                {songIsPlaying ? <FaPause /> : <FaPlay />}
              </button>
            </article>
          );
        })}
      </section>

      {!album.songs?.length && (
        <div className="album-details-empty">
          <FaCompactDisc />
          <h2>No songs yet</h2>
          <p>Songs added to this album will appear here.</p>
        </div>
      )}

    </div>
  );
}

export default AlbumDetails;