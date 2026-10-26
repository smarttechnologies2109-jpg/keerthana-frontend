
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  FaHeart,
  FaPlay,
  FaPause,
  FaMusic,
  FaArrowLeft,
  FaEllipsisV,
  FaCompactDisc,
  FaListUl,
  FaPlus,
  FaRegHeart,
  FaStepForward,
  FaSearch,
} from "react-icons/fa";

import { Navigate, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { useLikedSongs } from "../context/LikedSongsContext";
import { usePlayer } from "../context/usePlayer";

import VoiceSearch from "../components/VoiceSearch";

import {
  getSongCover,
  DEFAULT_COVER,
} from "../utils/media";

import "../assets/css/likedSongs.css";

function LikedSongs() {
  const navigate = useNavigate();

  const { user, loading: authLoading } = useAuth();

  const likedContext = useLikedSongs();

  const {
    likedSongs = [],
    loading,
    unlikeSong,
    isLiked,
    toggleLike,
  } = likedContext;

  const player = usePlayer();

  const {
    playSong,
    togglePlay,
    currentSong,
    isPlaying,
    addToQueue,
  } = player;

  const [menuSongId, setMenuSongId] = useState(null);
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");

  // Voice-search language; Telugu is the default.
  const [voiceLanguage, setVoiceLanguage] = useState("te-IN");

  const menuRef = useRef(null);

  /* =========================================================
     VOICE SEARCH
     Voice and typed search use the same search state.
  ========================================================= */

  const handleVoiceSearch = useCallback((recognizedText) => {
    setSearch(recognizedText);
  }, []);

  /* =========================================================
     SONG HELPERS
  ========================================================= */

  const getSongId = (song) => song?.id ?? song?.song_id;

  const normalizeSong = (song) => ({
    ...song,
    id: getSongId(song),
  });

  const getSongTitle = (song) =>
    song?.title || song?.title_english || "Untitled Song";

  const getAlbumName = (song) =>
    song?.album_name ||
    song?.album_title ||
    song?.album?.title ||
    (typeof song?.album === "string" ? song.album : "");

  const getAlbumId = (song) =>
    song?.album_id ??
    song?.album?.id ??
    song?.album?.album_id;

  const isCurrentSong = (song) =>
    Boolean(
      currentSong &&
        Number(getSongId(currentSong)) === Number(getSongId(song))
    );

  const showNotice = useCallback((message) => {
    setNotice(message);
  }, []);

  /* =========================================================
     AUTO-DISMISS NOTICES
  ========================================================= */

  useEffect(() => {
    if (!notice) return undefined;

    const timeout = window.setTimeout(() => {
      setNotice("");
    }, 2600);

    return () => window.clearTimeout(timeout);
  }, [notice]);

  /* =========================================================
     CLOSE MENU ON OUTSIDE CLICK / ESCAPE
  ========================================================= */

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

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  /* =========================================================
     FILTER LIKED SONGS
  ========================================================= */

  const filteredLikedSongs = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return likedSongs;

    return likedSongs.filter((song) => {
      const searchableValues = [
        song.title,
        song.title_english,
        song.artist_name,
        song.artist,
        getAlbumName(song),
        song.language,
        song.category_name,
      ];

      return searchableValues.some((value) =>
        String(value || "").toLowerCase().includes(query)
      );
    });
  }, [likedSongs, search]);

  /* =========================================================
     PLAY / PAUSE SONG
  ========================================================= */

  const handlePlayPause = async (song) => {
    if (!song?.audio_url) {
      showNotice("Audio is not available for this song.");
      return;
    }

    try {
      if (isCurrentSong(song)) {
        await togglePlay();
        return;
      }

      const index = likedSongs.findIndex(
        (item) =>
          Number(getSongId(item)) === Number(getSongId(song))
      );

      await playSong(
        normalizeSong(song),
        likedSongs.map(normalizeSong),
        index >= 0 ? index : 0
      );
    } catch (error) {
      console.error("Unable to play song:", error);
      showNotice("Couldn't play this song.");
    }
  };

  /* =========================================================
     PLAY ALL
  ========================================================= */

  const handlePlayAll = async () => {
    const firstIndex = likedSongs.findIndex(
      (song) => Boolean(song?.audio_url)
    );

    if (firstIndex < 0) {
      showNotice("No playable songs in your collection.");
      return;
    }

    try {
      await playSong(
        normalizeSong(likedSongs[firstIndex]),
        likedSongs.map(normalizeSong),
        firstIndex
      );
    } catch (error) {
      console.error("Unable to play liked songs:", error);
      showNotice("Couldn't play your liked songs.");
    }
  };

  /* =========================================================
     PLAY NOW
  ========================================================= */

  const handlePlayNow = async (song) => {
    setMenuSongId(null);

    if (!song?.audio_url) {
      showNotice("Audio is not available for this song.");
      return;
    }

    const index = likedSongs.findIndex(
      (item) =>
        Number(getSongId(item)) === Number(getSongId(song))
    );

    try {
      if (isCurrentSong(song)) {
        if (!isPlaying) {
          await togglePlay();
        }

        return;
      }

      await playSong(
        normalizeSong(song),
        likedSongs.map(normalizeSong),
        index >= 0 ? index : 0
      );
    } catch (error) {
      console.error("Unable to play song:", error);
      showNotice("Couldn't play this song.");
    }
  };

  /* =========================================================
     PLAY NEXT
  ========================================================= */

  const handlePlayNext = (song) => {
    const normalizedSong = normalizeSong(song);

    if (typeof player.playNext === "function") {
      try {
        player.playNext(normalizedSong);
        setMenuSongId(null);
        showNotice("Added to play next");
      } catch (error) {
        console.error("Unable to play next:", error);
        setMenuSongId(null);
        showNotice("Couldn't add this song to play next.");
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
          Number(getSongId(item)) === Number(getSongId(song))
      );

      if (duplicateIndex >= 0) {
        queue.splice(duplicateIndex, 1);
      }

      const currentIndex = Number.isInteger(player.currentIndex)
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

  /* =========================================================
     ADD TO QUEUE
  ========================================================= */

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
    } catch (error) {
      console.error("Unable to add song to queue:", error);
      setMenuSongId(null);
      showNotice("Couldn't add this song to the queue.");
    }
  };

  /* =========================================================
     REMOVE FROM LIKED SONGS
  ========================================================= */

  const handleRemoveFromLiked = async (song) => {
    setMenuSongId(null);

    try {
      if (typeof toggleLike === "function") {
        await toggleLike(normalizeSong(song));
      } else if (typeof unlikeSong === "function") {
        await unlikeSong(getSongId(song));
      } else {
        showNotice("Liked Songs is unavailable right now.");
        return;
      }

      showNotice("Removed from Liked Songs");
    } catch (error) {
      console.error("Unable to remove liked song:", error);
      showNotice("Couldn't update Liked Songs.");
    }
  };

  /* =========================================================
     ADD TO PLAYLIST
  ========================================================= */

  const handleAddToPlaylist = (song) => {
    setMenuSongId(null);

    navigate("/playlists", {
      state: {
        selectedSong: normalizeSong(song),
        action: "add-song",
      },
    });
  };

  /* =========================================================
     VIEW ALBUM
  ========================================================= */

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

    showNotice(
      "Album action sent. Connect it to your album details route if needed."
    );
  };

  /* =========================================================
     SONG DETAILS
  ========================================================= */

  const handleSongDetails = (song) => {
    setMenuSongId(null);
    navigate(`/songs/${getSongId(song)}`);
  };

  /* =========================================================
     AUTHENTICATION LOADING
  ========================================================= */

  if (authLoading) {
    return (
      <main className="liked-page">
        <div className="liked-status">
          <span className="liked-spinner" />
          Checking your account...
        </div>
      </main>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  /* =========================================================
     PAGE
  ========================================================= */

  return (
    <main className="liked-page">
      {/* BACK NAVIGATION */}

      <button
        type="button"
        className="liked-back-btn"
        onClick={() => navigate(-1)}
      >
        <FaArrowLeft />
        <span>Back</span>
      </button>

      {/* HERO HEADER */}

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
        </div>
      </section>

      {/* TOTAL COLLECTION COUNT */}

      <div className="liked-count-row">
        <span className="liked-count">
          <FaMusic />

          {likedSongs.length}{" "}
          {likedSongs.length === 1 ? "song" : "songs"}
        </span>
      </div>

      {/* SONG COLLECTION */}

      <section className="liked-collection">
        {/* PLAY ALL */}

        {!loading && likedSongs.length > 0 && (
          <div className="liked-track-actions">
            <button
              type="button"
              className="liked-play-all"
              onClick={handlePlayAll}
              disabled={!likedSongs.some((song) => song?.audio_url)}
            >
              <FaPlay />
              <span>Play All</span>
            </button>
          </div>
        )}

        {/* LOADING */}

        {loading ? (
          <div className="liked-status">
            <span className="liked-spinner" />
            Loading your liked songs...
          </div>
        ) : likedSongs.length === 0 ? (
          /* EMPTY COLLECTION */

          <div className="liked-empty">
            <div className="liked-empty-icon">
              <FaHeart />
            </div>

            <h2>Your collection starts here</h2>

            <p>
              Tap the heart on any song to save it to your
              personal music collection.
            </p>

            <button
              type="button"
              className="liked-browse-btn"
              onClick={() => navigate("/home")}
            >
              <FaMusic />
              Explore Music
            </button>
          </div>
        ) : (
          <>
            {/* VOICE SEARCH + LANGUAGE SELECTOR */}

            <section
              className="liked-search-section"
              aria-label="Search liked songs"
            >
              <div className="liked-voice-search-section">
                <VoiceSearch
                  value={search}
                  onChange={setSearch}
                  onSearch={handleVoiceSearch}
                  language={voiceLanguage}
                  onLanguageChange={setVoiceLanguage}
                  placeholder="Search songs, artists, albums or languages..."
                  ariaLabel="Search liked songs by voice or text"
                />
              </div>

              {/* SEARCH SUMMARY */}

              <div
                className="liked-search-summary"
                aria-live="polite"
              >
                <div>
                  <h2>
                    {search.trim()
                      ? "Search Results"
                      : "Your Songs"}
                  </h2>

                  <p>
                    {search.trim()
                      ? "Matching songs in your collection"
                      : "Your saved favourites"}
                  </p>
                </div>

                <span className="liked-search-result-count">
                  {filteredLikedSongs.length}{" "}
                  {filteredLikedSongs.length === 1
                    ? "song"
                    : "songs"}
                </span>
              </div>
            </section>

            {/* SONG LIST */}

            {filteredLikedSongs.length === 0 ? (
              <div className="liked-search-empty">
                <div className="liked-search-empty-icon">
                  <FaSearch />
                </div>

                <h2>No matching songs found</h2>

                <p>
                  Try another title, artist, album, language or
                  category.
                </p>

                <button
                  type="button"
                  onClick={() => setSearch("")}
                >
                  Clear Search
                </button>
              </div>
            ) : (
              <div className="liked-song-list">
                {filteredLikedSongs.map((song) => {
                  const songId = getSongId(song);
                  const songIsCurrent = isCurrentSong(song);
                  const songIsPlaying = songIsCurrent && isPlaying;

                  let cover = DEFAULT_COVER;

                  try {
                    cover = getSongCover(song) || DEFAULT_COVER;
                  } catch {
                    cover = DEFAULT_COVER;
                  }

                  const albumName = getAlbumName(song);
                  const isMenuOpen = menuSongId === songId;

                  const liked = Boolean(
                    typeof isLiked === "function"
                      ? isLiked(songId)
                      : true
                  );

                  return (
                    <article
                      key={songId}
                      className={`liked-song-row ${
                        songIsCurrent ? "is-current" : ""
                      }`}
                    >
                      {/* PLAY / PAUSE */}

                      <button
                        type="button"
                        className={`liked-row-play ${
                          songIsPlaying ? "is-playing" : ""
                        }`}
                        disabled={!song?.audio_url}
                        aria-label={
                          songIsPlaying
                            ? `Pause ${getSongTitle(song)}`
                            : `Play ${getSongTitle(song)}`
                        }
                        title={
                          songIsPlaying ? "Pause song" : "Play song"
                        }
                        onClick={() => handlePlayPause(song)}
                      >
                        {songIsPlaying ? <FaPause /> : <FaPlay />}
                      </button>

                      {/* TRACK NUMBER */}

                      <span className="liked-row-number">
                        {String(
                          likedSongs.findIndex(
                            (item) =>
                              Number(getSongId(item)) ===
                              Number(songId)
                          ) + 1
                        ).padStart(2, "0")}
                      </span>

                      {/* COVER */}

                      <button
                        type="button"
                        className="liked-row-cover"
                        onClick={() => handleSongDetails(song)}
                        aria-label={`View ${getSongTitle(song)} details`}
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
                        className="liked-row-info"
                        onClick={() => handleSongDetails(song)}
                        title={`View ${getSongTitle(song)} details`}
                      >
                        <strong>{getSongTitle(song)}</strong>

                        {song.title_english &&
                          song.title_english !== song.title && (
                            <span className="liked-row-english">
                              {song.title_english}
                            </span>
                          )}

                        <span className="liked-row-artist">
                          {song.artist_name ||
                            song.artist ||
                            "KEERTHANA"}
                        </span>
                      </button>

                      {/* LANGUAGE */}

                      <div className="liked-row-language">
                        {song.language && (
                          <span>{song.language}</span>
                        )}
                      </div>

                      {/* CATEGORY */}

                      <div className="liked-row-category">
                        {song.category_name && (
                          <span>{song.category_name}</span>
                        )}
                      </div>

                      {/* THREE-DOT MENU */}

                      <div
                        className="liked-row-menu-wrap all-song-menu-container"
                        ref={isMenuOpen ? menuRef : null}
                      >
                        <button
                          type="button"
                          className="liked-row-menu-btn all-song-menu-trigger"
                          aria-label={`More options for ${getSongTitle(song)}`}
                          aria-haspopup="menu"
                          aria-expanded={isMenuOpen}
                          title="More options"
                          onClick={(event) => {
                            event.stopPropagation();

                            setMenuSongId((current) =>
                              current === songId ? null : songId
                            );
                          }}
                        >
                          <FaEllipsisV />
                        </button>

                        {isMenuOpen && (
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
                              onClick={() => handleRemoveFromLiked(song)}
                            >
                              {liked ? <FaHeart /> : <FaRegHeart />}
                              <span>Remove from Liked Songs</span>
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
                })}
              </div>
            )}
          </>
        )}
      </section>

      {/* TOAST FEEDBACK */}

      {notice && (
        <div className="all-songs-toast" role="status">
          {notice}
        </div>
      )}
    </main>
  );
}

export default LikedSongs;
