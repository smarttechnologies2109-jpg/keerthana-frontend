
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  FaMusic,
  FaPlay,
  FaPause,
  FaSearch,
} from "react-icons/fa";

import { useNavigate } from "react-router-dom";

import API from "../services/api";
import { usePlayer } from "../context/usePlayer";

import {
  getSongCover,
  DEFAULT_COVER,
} from "../utils/media";

import "../assets/css/allSongs.css";

function AllSongs() {
  const navigate = useNavigate();

  // PLAYER
  const {
    currentSong,
    isPlaying,
    playSong,
    togglePlay,
  } = usePlayer();

  // STATE
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  // LOAD ALL SONGS
  useEffect(() => {
    const loadSongs = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await API.get("/songs");
        const data = response?.data;

        const songList = Array.isArray(data)
          ? data
          : Array.isArray(data?.songs)
            ? data.songs
            : Array.isArray(data?.data)
              ? data.data
              : [];

        setSongs(songList);
      } catch (err) {
        console.error("Load all songs error:", err);
        setSongs([]);
        setError("Unable to load songs. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadSongs();
  }, []);

  // SORT SONGS ALPHABETICALLY
  const sortedSongs = useMemo(() => {
    return [...songs].sort((a, b) => {
      // Prefer the English title when available.
      // If either song has no English title, use its Telugu title.
      const titleA = String(
        a?.titleEnglish || a?.title || ""
      ).trim();

      const titleB = String(
        b?.titleEnglish || b?.title || ""
      ).trim();

      return titleA.localeCompare(titleB, undefined, {
        sensitivity: "base",
        numeric: true,
      });
    });
  }, [songs]);

  // SEARCH SONGS
  const filteredSongs = useMemo(() => {
    const value = search.trim().toLocaleLowerCase();

    if (!value) {
      return sortedSongs;
    }

    return sortedSongs.filter((song) => {
      const title = String(song?.title || "").toLocaleLowerCase();
      const englishTitle = String(
        song?.titleEnglish || ""
      ).toLocaleLowerCase();

      const artist = String(
        song?.artist_name || song?.artist || ""
      ).toLocaleLowerCase();

      return (
        title.includes(value) ||
        englishTitle.includes(value) ||
        artist.includes(value)
      );
    });
  }, [sortedSongs, search]);

  // PLAY / PAUSE SONG
  const handlePlay = async (song) => {
    if (!song) return;

    const isCurrent =
      String(currentSong?.id) === String(song?.id);

    try {
      if (isCurrent) {
        await togglePlay();
        return;
      }

      // Pass the sorted list so Next plays the next
      // song in the same alphabetical order.
      await playSong(song, sortedSongs);
    } catch (err) {
      console.error("Play song error:", err);
    }
  };

  // LOADING
  if (loading) {
    return (
      <div className="all-songs-page">
        <div className="all-songs-loading">
          <FaMusic />
          <h2>Loading Songs...</h2>
          <p>Loading your complete music library.</p>
        </div>
      </div>
    );
  }

  // PAGE
  return (
    <div className="all-songs-page">
      {/* HEADER */}
      <div className="all-songs-header">
        <div className="all-songs-title-area">
          <div className="all-songs-icon">
            <FaMusic />
          </div>

          <div>
            <span className="all-songs-overline">
              YOUR MUSIC
            </span>

            <h1>All Songs</h1>

            <p>
              Browse songs alphabetically by title.
            </p>
          </div>
        </div>
      </div>

      {/* SEARCH */}
      <div className="all-songs-search">
        <FaSearch />

        <input
          type="text"
          value={search}
          onChange={(event) =>
            setSearch(event.target.value)
          }
          placeholder="Search Telugu or English song titles..."
          aria-label="Search songs"
        />
      </div>

      {/* ERROR */}
      {error && (
        <div className="all-songs-error">
          {error}
        </div>
      )}

      {/* EMPTY */}
      {!error && filteredSongs.length === 0 && (
        <div className="all-songs-empty">
          <div className="all-songs-empty-icon">
            <FaMusic />
          </div>

          <h2>No Songs Found</h2>

          <p>
            {search
              ? "Try a different search."
              : "There are no songs available right now."}
          </p>
        </div>
      )}

      {/* SONG LIST */}
      {filteredSongs.length > 0 && (
        <div className="all-songs-list">
          {filteredSongs.map((song) => {
            const cover = getSongCover(song);

            const isCurrent =
              String(currentSong?.id) === String(song?.id);

            const isCurrentPlaying =
              isCurrent && isPlaying;

            return (
              <article
                key={song?.id}
                className={
                  isCurrent
                    ? "all-song-card current"
                    : "all-song-card"
                }
              >
                {/* COVER */}
                <button
                  type="button"
                  className="all-song-cover"
                  onClick={() =>
                    navigate(`/songs/${song.id}`)
                  }
                  aria-label={`Open ${song?.titleEnglish || song?.title || "song"} details`}
                >
                  <img
                    src={cover || DEFAULT_COVER}
                    alt={song?.title || "Song"}
                    onError={(event) => {
                      event.currentTarget.onerror = null;
                      event.currentTarget.src = DEFAULT_COVER;
                    }}
                  />
                </button>

                {/* SONG INFO */}
                <button
                  type="button"
                  className="all-song-info"
                  onClick={() =>
                    navigate(`/songs/${song.id}`)
                  }
                >
                  <strong>
                    {song?.titleEnglish ||
                      song?.title ||
                      "Unknown Song"}
                  </strong>

                  {song?.title &&
                    song?.titleEnglish &&
                    song.title !== song.titleEnglish && (
                      <span className="all-song-english-title">
                        {song.title}
                      </span>
                    )}

                  <span className="all-song-artist">
                    {song?.artist_name ||
                      song?.artist ||
                      "KEERTHANA"}
                  </span>

                  {isCurrent && (
                    <small>
                      {isPlaying ? "Now Playing" : "Paused"}
                    </small>
                  )}
                </button>

                {/* PLAY / PAUSE */}
                <button
                  type="button"
                  className={
                    isCurrentPlaying
                      ? "all-song-play-button playing"
                      : "all-song-play-button"
                  }
                  onClick={() => handlePlay(song)}
                  title={isCurrentPlaying ? "Pause" : "Play"}
                  aria-label={
                    isCurrentPlaying ? "Pause song" : "Play song"
                  }
                >
                  {isCurrentPlaying ? (
                    <FaPause />
                  ) : (
                    <FaPlay />
                  )}
                </button>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default AllSongs;
