
import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  FaArrowLeft,
  FaMusic,
  FaPause,
  FaPlay,
  FaPlus,
  FaCheck,
  FaTrash,
  FaSearch,
  FaTimes,
  FaEllipsisV,
  FaHeart,
  FaRegHeart,
  FaListUl,
  FaStepForward,
  FaCompactDisc,
} from "react-icons/fa";

import API from "../services/api";

import { usePlayer } from "../context/usePlayer";
import { useLikedSongs } from "../context/LikedSongsContext";

import Sidebar from "../components/Sidebar";
import MusicPlayer from "../components/MusicPlayer";
import VoiceSearch from "../components/VoiceSearch";

import {
  getSongCover,
  DEFAULT_COVER,
} from "../utils/media";

import "../assets/css/MoodSongs.css";
import "../assets/css/allSongs.css";

/* =========================================================
   MOOD INFORMATION
========================================================= */

const moodInformation = {
  worship: {
    name: "Worship",
    description: "Songs to praise and worship God",
  },
  praise: {
    name: "Praise",
    description: "Joyful songs celebrating God's goodness",
  },
  prayer: {
    name: "Prayer",
    description: "Peaceful songs for prayer and devotion",
  },
  hope: {
    name: "Hope & Faith",
    description: "Songs that strengthen faith and bring hope",
  },
  peace: {
    name: "Peace & Comfort",
    description: "Calm songs for comfort and inner peace",
  },
  thanksgiving: {
    name: "Thanksgiving",
    description: "Songs of gratitude and thanksgiving to God",
  },
};

/* =========================================================
   SONG HELPERS
========================================================= */

const getSongId = (song) =>
  song?.id ?? song?.song_id;

const normalizeSong = (song) => ({
  ...song,
  id: getSongId(song),
});

const getSongTitle = (song) =>
  song?.title ||
  song?.title_english ||
  "Untitled Song";

const getAlbumName = (song) =>
  song?.album_name ||
  song?.album_title ||
  song?.album?.title ||
  (typeof song?.album === "string" ? song.album : "");

const getAlbumId = (song) =>
  song?.album_id ??
  song?.album?.id ??
  song?.album?.album_id;

/* =========================================================
   COMPONENT
========================================================= */

const MoodSongs = () => {
  const { mood } = useParams();
  const navigate = useNavigate();

  /* =======================================================
     PLAYER
  ======================================================= */

  const player = usePlayer();

  const {
    playSong,
    togglePlay,
    currentSong,
    isPlaying,
    addToQueue,
  } = player;

  /* =======================================================
     LIKED SONGS
  ======================================================= */

  const likedContext = useLikedSongs();

  const {
    isLiked,
    toggleLike,
  } = likedContext;

  /* =======================================================
     STATE
  ======================================================= */

  const [songs, setSongs] = useState([]);
  const [browseSongs, setBrowseSongs] = useState([]);

  const [loading, setLoading] = useState(true);
  const [browseLoading, setBrowseLoading] = useState(false);

  const [addingId, setAddingId] = useState(null);
  const [removingId, setRemovingId] = useState(null);

  const [showBrowser, setShowBrowser] = useState(false);

  // Independent search values for each search area.
  const [searchMoodSongs, setSearchMoodSongs] = useState("");
  const [search, setSearch] = useState("");

  // Independent voice-language preferences.
  const [voiceLanguageMoodSongs, setVoiceLanguageMoodSongs] =
    useState("te-IN");

  const [voiceLanguageBrowse, setVoiceLanguageBrowse] =
    useState("te-IN");

  const [error, setError] = useState("");
  const [browseError, setBrowseError] = useState("");

  const [menuSongId, setMenuSongId] = useState(null);
  const [notice, setNotice] = useState("");

  const menuRef = useRef(null);

  /* =======================================================
     CURRENT MOOD
  ======================================================= */

  const currentMood = moodInformation[mood];

  /* =======================================================
     VOICE SEARCH HANDLERS
  ======================================================= */

  const handleMoodSongsVoiceSearch = useCallback(
    (recognizedText) => {
      setSearchMoodSongs(recognizedText);
    },
    []
  );

  const handleBrowseVoiceSearch = useCallback(
    (recognizedText) => {
      setSearch(recognizedText);
    },
    []
  );

  /* =======================================================
     NOTIFICATION / TOAST
  ======================================================= */

  const showNotice = useCallback((message) => {
    setNotice(message);
  }, []);

  useEffect(() => {
    if (!notice) return undefined;

    const timeout = window.setTimeout(() => {
      setNotice("");
    }, 2600);

    return () => window.clearTimeout(timeout);
  }, [notice]);

  /* =======================================================
     CLOSE MENU ON OUTSIDE CLICK OR ESCAPE
  ======================================================= */

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target)
      ) {
        setMenuSongId(null);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setMenuSongId(null);
      }
    };

    document.addEventListener(
      "pointerdown",
      handlePointerDown
    );

    document.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      document.removeEventListener(
        "pointerdown",
        handlePointerDown
      );

      document.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, []);

  /* =======================================================
     LOAD MOOD SONGS
  ======================================================= */

  const loadMoodSongs = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await API.get(
        `/moods/${encodeURIComponent(mood)}/songs`
      );

      const data = response?.data;

      setSongs(
        Array.isArray(data?.songs)
          ? data.songs
          : Array.isArray(data)
            ? data
            : []
      );
    } catch (err) {
      console.error(
        "Load mood songs error:",
        err.response?.data || err.message
      );

      setError(
        err.response?.data?.message ||
          "Unable to load songs for this mood."
      );
    } finally {
      setLoading(false);
    }
  }, [mood]);

  /* =======================================================
     LOAD BROWSE SONGS
  ======================================================= */

  const loadBrowseSongs = useCallback(async () => {
    try {
      setBrowseLoading(true);
      setBrowseError("");

      const response = await API.get(
        `/moods/${encodeURIComponent(mood)}/browse`
      );

      const data = response?.data;

      setBrowseSongs(
        Array.isArray(data?.songs)
          ? data.songs
          : []
      );
    } catch (err) {
      console.error(
        "Browse songs error:",
        err.response?.data || err.message
      );

      setBrowseSongs([]);

      setBrowseError(
        err.response?.data?.message ||
          "Unable to browse songs."
      );
    } finally {
      setBrowseLoading(false);
    }
  }, [mood]);

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    setSongs([]);
    setBrowseSongs([]);
    setError("");
    setBrowseError("");
    setMenuSongId(null);
    setSearchMoodSongs("");
    setSearch("");

    if (!mood || !moodInformation[mood]) {
      setLoading(false);
      return;
    }

    loadMoodSongs();
  }, [mood, loadMoodSongs]);

  /* =======================================================
     OPEN BROWSER
  ======================================================= */

  const handleOpenBrowser = async () => {
    setShowBrowser(true);
    await loadBrowseSongs();
  };

  /* =======================================================
     CLOSE BROWSER
  ======================================================= */

  const handleCloseBrowser = () => {
    setShowBrowser(false);
    setSearch("");
  };

  /* =======================================================
     ADD SONG TO MOOD
  ======================================================= */

  const handleAddSong = async (song) => {
    const songId = getSongId(song);

    if (
      !songId ||
      addingId !== null ||
      removingId !== null
    ) {
      return;
    }

    try {
      setAddingId(songId);

      await API.post(
        `/moods/songs/${songId}`,
        { mood }
      );

      await Promise.all([
        loadMoodSongs(),
        loadBrowseSongs(),
      ]);

      showNotice("Song added to this mood");
    } catch (err) {
      console.error(
        "Add song to mood error:",
        err.response?.data || err.message
      );

      showNotice(
        err.response?.data?.message ||
          "Unable to add song to mood."
      );
    } finally {
      setAddingId(null);
    }
  };

  /* =======================================================
     REMOVE SONG FROM MOOD
  ======================================================= */

  const handleRemoveSong = async (song) => {
    const songId = getSongId(song);

    if (
      !songId ||
      removingId !== null ||
      addingId !== null
    ) {
      return;
    }

    try {
      setRemovingId(songId);

      await API.delete(
        `/moods/songs/${songId}/${encodeURIComponent(mood)}`
      );

      await Promise.all([
        loadMoodSongs(),
        loadBrowseSongs(),
      ]);

      showNotice("Song removed from this mood");
    } catch (err) {
      console.error(
        "Remove song from mood error:",
        err.response?.data || err.message
      );

      showNotice(
        err.response?.data?.message ||
          "Unable to remove song from mood."
      );
    } finally {
      setRemovingId(null);
    }
  };

  /* =======================================================
     PLAY / PAUSE SONG
  ======================================================= */

  const handleSongPlayPause = async (song) => {
    if (!song?.audio_url) {
      showNotice("Audio is not available for this song.");
      return;
    }

    try {
      if (
        Number(getSongId(currentSong)) ===
        Number(getSongId(song))
      ) {
        await togglePlay();
        return;
      }

      const index = songs.findIndex(
        (item) =>
          Number(getSongId(item)) ===
          Number(getSongId(song))
      );

      await playSong(
        normalizeSong(song),
        songs.map(normalizeSong),
        index >= 0 ? index : 0
      );
    } catch (err) {
      console.error("Play mood song error:", err);
      showNotice("Unable to play this song.");
    }
  };

  /* =======================================================
     PLAY ALL
  ======================================================= */

  const handlePlayAll = async () => {
    if (songs.length === 0) return;

    const firstPlayableIndex = songs.findIndex(
      (song) => Boolean(song?.audio_url)
    );

    if (firstPlayableIndex < 0) {
      showNotice("No playable songs in this mood.");
      return;
    }

    const currentBelongsToMood = songs.some(
      (song) =>
        Number(getSongId(song)) ===
        Number(getSongId(currentSong))
    );

    if (currentBelongsToMood) {
      await togglePlay();
      return;
    }

    try {
      await playSong(
        normalizeSong(songs[firstPlayableIndex]),
        songs.map(normalizeSong),
        firstPlayableIndex
      );
    } catch (err) {
      console.error("Play all mood songs error:", err);
      showNotice("Unable to play this mood.");
    }
  };

  /* =======================================================
     PLAY NOW — CONTEXT MENU
  ======================================================= */

  const handlePlayNow = async (song) => {
    setMenuSongId(null);

    if (!song?.audio_url) {
      showNotice("Audio is not available for this song.");
      return;
    }

    try {
      const songId = getSongId(song);

      if (
        Number(getSongId(currentSong)) === Number(songId)
      ) {
        if (!isPlaying) {
          await togglePlay();
        }

        return;
      }

      const index = songs.findIndex(
        (item) =>
          Number(getSongId(item)) === Number(songId)
      );

      await playSong(
        normalizeSong(song),
        songs.map(normalizeSong),
        index >= 0 ? index : 0
      );
    } catch (err) {
      console.error("Play Now error:", err);
      showNotice("Unable to play this song.");
    }
  };

  /* =======================================================
     ADD TO QUEUE
  ======================================================= */

  const handleAddToQueue = (song) => {
    if (typeof addToQueue !== "function") {
      setMenuSongId(null);
      showNotice("Queue is unavailable right now.");
      return;
    }

    try {
      addToQueue(normalizeSong(song));
      setMenuSongId(null);
      showNotice("Added to your queue");
    } catch (err) {
      console.error("Add to queue error:", err);
      setMenuSongId(null);
      showNotice("Unable to add song to queue.");
    }
  };

  /* =======================================================
     PLAY NEXT
  ======================================================= */

  const handlePlayNext = (song) => {
    const normalizedSong = normalizeSong(song);

    if (typeof player.playNext === "function") {
      try {
        player.playNext(normalizedSong);
        setMenuSongId(null);
        showNotice("Added to play next");
      } catch (err) {
        console.error("Play Next error:", err);
        setMenuSongId(null);
        showNotice("Unable to add song to play next.");
      }

      return;
    }

    if (
      Array.isArray(player.queue) &&
      typeof player.setQueue === "function"
    ) {
      const queue = player.queue.map(normalizeSong);

      const duplicateIndex = queue.findIndex(
        (item) =>
          Number(getSongId(item)) ===
          Number(getSongId(song))
      );

      if (duplicateIndex >= 0) {
        queue.splice(duplicateIndex, 1);
      }

      const currentIndex = Number.isInteger(
        player.currentIndex
      )
        ? player.currentIndex
        : -1;

      queue.splice(
        Math.max(0, currentIndex + 1),
        0,
        normalizedSong
      );

      player.setQueue(queue);
      setMenuSongId(null);
      showNotice("Added to play next");
      return;
    }

    handleAddToQueue(song);
  };

  /* =======================================================
     LIKE / UNLIKE
  ======================================================= */

  const handleToggleLike = async (song) => {
    if (typeof toggleLike !== "function") {
      setMenuSongId(null);
      showNotice("Liked Songs is unavailable right now.");
      return;
    }

    const wasLiked = Boolean(
      typeof isLiked === "function"
        ? isLiked(getSongId(song))
        : false
    );

    try {
      await toggleLike(normalizeSong(song));

      setMenuSongId(null);

      showNotice(
        wasLiked
          ? "Removed from Liked Songs"
          : "Added to Liked Songs"
      );
    } catch (err) {
      console.error("Toggle liked song error:", err);
      setMenuSongId(null);
      showNotice("Unable to update Liked Songs.");
    }
  };

  /* =======================================================
     ADD TO PLAYLIST
  ======================================================= */

  const handleAddToPlaylist = (song) => {
    setMenuSongId(null);

    navigate("/playlists", {
      state: {
        selectedSong: normalizeSong(song),
        action: "add-song",
      },
    });
  };

  /* =======================================================
     VIEW ALBUM
  ======================================================= */

  const handleViewAlbum = (song) => {
    const albumId = getAlbumId(song);

    setMenuSongId(null);

    if (!albumId) {
      showNotice("This song has no linked album.");
      return;
    }

    window.dispatchEvent(
      new CustomEvent("keerthana:view-album", {
        detail: {
          albumId,
          song: normalizeSong(song),
        },
      })
    );
  };

  /* =======================================================
     FILTER MOOD SONGS
  ======================================================= */

  const filteredMoodSongs = songs.filter((song) => {
    const value = searchMoodSongs.trim().toLowerCase();

    if (!value) return true;

    return [
      song.title,
      song.title_english,
      song.artist_name,
      song.artist,
      getAlbumName(song),
      song.language,
      song.category_name,
    ].some((item) =>
      String(item || "").toLowerCase().includes(value)
    );
  });

  /* =======================================================
     FILTER BROWSE SONGS
  ======================================================= */

  const filteredBrowseSongs = browseSongs.filter((song) => {
    const value = search.trim().toLowerCase();

    if (!value) return true;

    return [
      song.title,
      song.title_english,
      song.artist_name,
      song.artist,
      song.album_name,
      song.album_title,
      song.language,
    ].some((item) =>
      String(item || "").toLowerCase().includes(value)
    );
  });

  /* =======================================================
     UNKNOWN MOOD
  ======================================================= */

  if (!currentMood) {
    return (
      <div className="mood-songs-page">
        <Sidebar />

        <main className="mood-songs-content">
          <button
            type="button"
            className="mood-back-btn"
            onClick={() => navigate("/mood-playlists")}
          >
            <FaArrowLeft />
            Back to Moods
          </button>

          <div className="mood-empty">
            <FaMusic />
            <h2>Mood Not Found</h2>
            <p>The selected mood does not exist.</p>
          </div>
        </main>

        <MusicPlayer />
      </div>
    );
  }

  /* =======================================================
     MAIN PAGE
  ======================================================= */

  return (
    <div className="mood-songs-page">
      <Sidebar />

      <main className="mood-songs-content">
        {/* BACK */}

        <button
          type="button"
          className="mood-back-btn"
          onClick={() => navigate("/mood-playlists")}
        >
          <FaArrowLeft />
          Back to Moods
        </button>

        {/* MOOD HEADER */}

        <section className="mood-songs-header">
          <div className="mood-songs-icon">
            <FaMusic />
          </div>

          <div className="mood-header-info">
            <span className="mood-small-label">
              KEERTHANA
            </span>

            <h1>{currentMood.name}</h1>
            <p>{currentMood.description}</p>
          </div>
        </section>

        {/* ACTIONS */}

        <div className="mood-actions">
          <button
            type="button"
            className="mood-play-all-btn"
            onClick={handlePlayAll}
            disabled={
              loading ||
              !songs.some((song) => song?.audio_url)
            }
          >
            {currentSong &&
            songs.some(
              (song) =>
                Number(getSongId(song)) ===
                Number(getSongId(currentSong))
            ) &&
            isPlaying ? (
              <FaPause />
            ) : (
              <FaPlay />
            )}

            {currentSong &&
            songs.some(
              (song) =>
                Number(getSongId(song)) ===
                Number(getSongId(currentSong))
            ) &&
            isPlaying
              ? "Pause"
              : "Play All"}
          </button>

          <span className="mood-song-count">
            {songs.length}{" "}
            {songs.length === 1 ? "Song" : "Songs"}
          </span>

          <button
            type="button"
            className="mood-add-songs-btn"
            onClick={handleOpenBrowser}
          >
            <FaPlus />
            Add Songs
          </button>
        </div>

        {/* LOADING */}

        {loading && (
          <div className="mood-loading">
            <div className="mood-spinner" />
            <p>Loading songs...</p>
          </div>
        )}

        {/* ERROR */}

        {!loading && error && (
          <div className="mood-error">
            <FaMusic />
            <h2>Something went wrong</h2>
            <p>{error}</p>

            <button
              type="button"
              onClick={loadMoodSongs}
            >
              Try Again
            </button>
          </div>
        )}

        {/* EMPTY MOOD */}

        {!loading && !error && songs.length === 0 && (
          <div className="mood-empty">
            <FaMusic />

            <h2>No Songs in {currentMood.name}</h2>

            <p>
              Add songs to this mood to create your mood
              playlist.
            </p>

            <button
              type="button"
              onClick={handleOpenBrowser}
            >
              <FaPlus />
              Browse All Songs
            </button>
          </div>
        )}

        {/* MOOD SONG SEARCH */}

        {!loading && !error && songs.length > 0 && (
          <section className="mood-track-discovery">
            <div
              className="mood-songs-voice-search-section"
              aria-label="Search songs in this mood"
            >
              <VoiceSearch
                value={searchMoodSongs}
                onChange={setSearchMoodSongs}
                onSearch={handleMoodSongsVoiceSearch}
                language={voiceLanguageMoodSongs}
                onLanguageChange={setVoiceLanguageMoodSongs}
                placeholder="Search songs, artists, albums or languages..."
                ariaLabel="Search songs in this mood"
              />
            </div>

            <div
              className="mood-track-search-summary"
              aria-live="polite"
            >
              <div>
                <h2>
                  {searchMoodSongs.trim()
                    ? "Search Results"
                    : `${currentMood.name} Songs`}
                </h2>

                <p>
                  {searchMoodSongs.trim()
                    ? "Songs matching your search"
                    : "Explore songs in this mood"}
                </p>
              </div>

              <span className="mood-track-result-count">
                {filteredMoodSongs.length}{" "}
                {filteredMoodSongs.length === 1
                  ? "song"
                  : "songs"}
              </span>
            </div>
          </section>
        )}

        {/* HORIZONTAL SONG ROWS */}

        {!loading && !error && songs.length > 0 && (
          <section className="mood-song-list">
            {filteredMoodSongs.length > 0 ? (
              filteredMoodSongs.map((song) => {
                const songId = getSongId(song);

                const index = songs.findIndex(
                  (item) =>
                    Number(getSongId(item)) ===
                    Number(songId)
                );

                const isCurrent =
                  Number(getSongId(currentSong)) ===
                  Number(songId);

                const isCurrentPlaying =
                  isCurrent && isPlaying;

                const menuOpen = menuSongId === songId;

                const liked = Boolean(
                  typeof isLiked === "function"
                    ? isLiked(songId)
                    : false
                );

                const albumName = getAlbumName(song);

                let cover = DEFAULT_COVER;

                try {
                  cover = getSongCover(song) || DEFAULT_COVER;
                } catch {
                  cover = DEFAULT_COVER;
                }

                return (
                  <article
                    key={songId || index}
                    className={`mood-song-card mood-song-card-playable ${
                      isCurrent ? "is-current" : ""
                    }`}
                    tabIndex={song?.audio_url ? 0 : -1}
                    aria-label={`Play ${getSongTitle(song)}`}
                    onClick={(event) => {
                      if (
                        event.target.closest(
                          "button, a, [role='menu']"
                        )
                      ) {
                        return;
                      }

                      handleSongPlayPause(song);
                    }}
                    onKeyDown={(event) => {
                      if (
                        event.target === event.currentTarget &&
                        (event.key === "Enter" ||
                          event.key === " ")
                      ) {
                        event.preventDefault();
                        handleSongPlayPause(song);
                      }
                    }}
                  >
                    {/* PLAY / PAUSE */}

                    <button
                      type="button"
                      className="mood-song-play"
                      disabled={!song?.audio_url}
                      aria-label={
                        isCurrentPlaying
                          ? `Pause ${getSongTitle(song)}`
                          : `Play ${getSongTitle(song)}`
                      }
                      title={
                        isCurrentPlaying
                          ? "Pause song"
                          : "Play song"
                      }
                      onClick={(event) => {
                        event.stopPropagation();
                        handleSongPlayPause(song);
                      }}
                    >
                      {isCurrentPlaying ? (
                        <FaPause />
                      ) : (
                        <FaPlay />
                      )}
                    </button>

                    {/* TRACK NUMBER */}

                    <span className="mood-song-number">
                      {String(index + 1).padStart(2, "0")}
                    </span>

                    {/* COVER */}

                    <button
                      type="button"
                      className="mood-song-cover"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleSongPlayPause(song);
                      }}
                      aria-label={`Play ${getSongTitle(song)}`}
                    >
                      <img
                        src={cover}
                        alt=""
                        loading="lazy"
                        onError={(event) => {
                          event.currentTarget.onerror = null;
                          event.currentTarget.src = DEFAULT_COVER;
                        }}
                      />
                    </button>

                    {/* SONG INFORMATION */}

                    <button
                      type="button"
                      className="mood-song-info"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleSongPlayPause(song);
                      }}
                      title={`Play ${getSongTitle(song)}`}
                    >
                      <strong>{getSongTitle(song)}</strong>

                      {song.title_english &&
                        song.title_english !== song.title && (
                          <span className="mood-song-english">
                            {song.title_english}
                          </span>
                        )}

                      <span className="mood-song-artist">
                        {song.artist_name ||
                          song.artist ||
                          "Unknown Artist"}
                      </span>
                    </button>

                    {/* LANGUAGE */}

                    <span className="mood-song-language">
                      {song.language || ""}
                    </span>

                    {/* THREE-DOT MENU */}

                    <div
                      className="mood-song-menu-wrap all-song-menu-container"
                      ref={menuOpen ? menuRef : null}
                      onClick={(event) => event.stopPropagation()}
                      onKeyDown={(event) => event.stopPropagation()}
                    >
                      <button
                        type="button"
                        className="mood-song-menu-trigger all-song-menu-trigger"
                        aria-label={`More options for ${getSongTitle(song)}`}
                        aria-haspopup="menu"
                        aria-expanded={menuOpen}
                        title="More options"
                        onClick={() =>
                          setMenuSongId((current) =>
                            current === songId ? null : songId
                          )
                        }
                      >
                        <FaEllipsisV />
                      </button>

                      {menuOpen && (
                        <div
                          className="all-song-context-menu"
                          role="menu"
                          aria-label={`Options for ${getSongTitle(song)}`}
                        >
                          <button
                            type="button"
                            role="menuitem"
                            onClick={() => handlePlayNow(song)}
                          >
                            <FaPlay />
                            <span>Play Now</span>
                          </button>

                          <button
                            type="button"
                            role="menuitem"
                            onClick={() => handlePlayNext(song)}
                          >
                            <FaStepForward />
                            <span>Play Next</span>
                          </button>

                          <button
                            type="button"
                            role="menuitem"
                            onClick={() => handleAddToQueue(song)}
                          >
                            <FaPlus />
                            <span>Add to Queue</span>
                          </button>

                          <div className="all-song-menu-divider" />

                          <button
                            type="button"
                            role="menuitem"
                            onClick={() => handleToggleLike(song)}
                          >
                            {liked ? <FaHeart /> : <FaRegHeart />}

                            <span>
                              {liked
                                ? "Remove from Liked Songs"
                                : "Add to Liked Songs"}
                            </span>
                          </button>

                          <button
                            type="button"
                            role="menuitem"
                            onClick={() => handleAddToPlaylist(song)}
                          >
                            <FaListUl />
                            <span>Add to Playlist</span>
                          </button>

                          {albumName && (
                            <>
                              <div className="all-song-menu-divider" />

                              <button
                                type="button"
                                role="menuitem"
                                onClick={() => handleViewAlbum(song)}
                              >
                                <FaCompactDisc />
                                <span>View Album</span>
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </article>
                );
              })
            ) : (
              <div className="mood-search-empty">
                <div className="mood-search-empty-icon">
                  <FaSearch />
                </div>

                <h3>No matching songs found</h3>

                <p>
                  Try another song title, artist, album or
                  language.
                </p>

                <button
                  type="button"
                  onClick={() => setSearchMoodSongs("")}
                >
                  Clear Search
                </button>
              </div>
            )}
          </section>
        )}
      </main>

      {/* BROWSE SONGS MODAL */}

      {showBrowser && (
        <div
          className="mood-browser-overlay"
          onClick={handleCloseBrowser}
        >
          <div
            className="mood-browser"
            onClick={(event) => event.stopPropagation()}
          >
            {/* MODAL HEADER */}

            <div className="mood-browser-header">
              <div>
                <span>ADD SONGS</span>

                <h2>Browse All Songs</h2>

                <p>
                  Add songs to{" "}
                  <strong>{currentMood.name}</strong>
                </p>
              </div>

              <button
                type="button"
                className="mood-browser-close"
                onClick={handleCloseBrowser}
                aria-label="Close"
              >
                <FaTimes />
              </button>
            </div>

            {/* BROWSE VOICE SEARCH */}

            <div
              className="mood-browser-voice-search-section"
              aria-label="Search songs to add to this mood"
            >
              <VoiceSearch
                value={search}
                onChange={setSearch}
                onSearch={handleBrowseVoiceSearch}
                language={voiceLanguageBrowse}
                onLanguageChange={setVoiceLanguageBrowse}
                placeholder="Search songs, artists or albums..."
                ariaLabel="Search songs to add to this mood"
              />
            </div>

            {/* BROWSER CONTENT */}

            {browseLoading ? (
              <div className="mood-browser-loading">
                <div className="mood-spinner" />
                <p>Loading all songs...</p>
              </div>
            ) : browseError ? (
              <div className="mood-browser-empty">
                <FaMusic />

                <h3>Unable to load songs</h3>

                <p>{browseError}</p>

                <button
                  type="button"
                  onClick={loadBrowseSongs}
                >
                  Try Again
                </button>
              </div>
            ) : filteredBrowseSongs.length === 0 ? (
              <div className="mood-browser-empty">
                <FaMusic />

                <h3>No songs found</h3>

                <p>Try another search.</p>

                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                  >
                    Clear Search
                  </button>
                )}
              </div>
            ) : (
              <div className="mood-browser-list">
                {filteredBrowseSongs.map((song) => {
                  const songId = getSongId(song);

                  const alreadyAdded = Boolean(song.is_in_mood);

                  const isAdding = addingId === songId;
                  const isRemoving = removingId === songId;

                  let browserCover = DEFAULT_COVER;

                  try {
                    browserCover =
                      getSongCover(song) || DEFAULT_COVER;
                  } catch {
                    browserCover = DEFAULT_COVER;
                  }

                  return (
                    <div
                      key={songId}
                      className={`mood-browser-song ${
                        alreadyAdded ? "already-added" : ""
                      }`}
                    >
                      {/* BROWSER COVER */}

                      <div className="mood-browser-cover">
                        <img
                          src={browserCover}
                          alt=""
                          loading="lazy"
                          onError={(event) => {
                            event.currentTarget.onerror = null;
                            event.currentTarget.src = DEFAULT_COVER;
                          }}
                        />
                      </div>

                      {/* BROWSER SONG INFORMATION */}

                      <div className="mood-browser-info">
                        <h3>{getSongTitle(song)}</h3>

                        <p>
                          {song.artist_name ||
                            song.artist ||
                            "Unknown Artist"}
                        </p>

                        {song.language && (
                          <small>{song.language}</small>
                        )}
                      </div>

                      {/* ADD / REMOVE */}

                      <div className="mood-browser-action">
                        {alreadyAdded ? (
                          <button
                            type="button"
                            className="mood-remove-btn"
                            disabled={
                              isRemoving ||
                              removingId !== null ||
                              addingId !== null
                            }
                            onClick={() => handleRemoveSong(song)}
                          >
                            {isRemoving ? (
                              "Removing..."
                            ) : (
                              <>
                                <FaTrash />
                                Remove
                              </>
                            )}
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="mood-add-btn"
                            disabled={
                              isAdding ||
                              addingId !== null ||
                              removingId !== null
                            }
                            onClick={() => handleAddSong(song)}
                          >
                            {isAdding ? (
                              "Adding..."
                            ) : (
                              <>
                                <FaPlus />
                                Add
                              </>
                            )}
                          </button>
                        )}
                      </div>

                      {/* ADDED INDICATOR */}

                      {alreadyAdded && (
                        <div className="mood-added-badge">
                          <FaCheck />
                          Added
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* MODAL FOOTER */}

            <div className="mood-browser-footer">
              <span>
                {filteredBrowseSongs.length}{" "}
                {filteredBrowseSongs.length === 1
                  ? "song"
                  : "songs"}
              </span>

              <button
                type="button"
                onClick={handleCloseBrowser}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ACTION FEEDBACK */}

      {notice && (
        <div className="all-songs-toast" role="status">
          {notice}
        </div>
      )}

      {/* GLOBAL MUSIC PLAYER */}

      <MusicPlayer />
    </div>
  );
};

export default MoodSongs;