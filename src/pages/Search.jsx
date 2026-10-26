
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  FaMusic,
  FaSearch,
  FaPlay,
  FaPause,
  FaTimes,
  FaEllipsisV,
  FaListUl,
  FaPlus,
  FaStepForward,
  FaHeart,
  FaRegHeart,
  FaRedo,
} from "react-icons/fa";

import { useNavigate } from "react-router-dom";

import API from "../services/api";
import VoiceSearch from "../components/VoiceSearch";
import { usePlayer } from "../context/usePlayer";
import { useLikedSongs } from "../context/LikedSongsContext";

import {
  getSongCover,
  DEFAULT_COVER,
} from "../utils/media";

import "../assets/css/search.css";

/* =====================================================
   SONG TITLE HELPERS
===================================================== */

const getSongTitles = (song) => {
  const fields = [
    song?.title,
    song?.title_english,
    song?.titleEnglish,
    song?.english_title,
    song?.englishTitle,
    song?.title_telugu,
    song?.titleTelugu,
    song?.title_hindi,
    song?.titleHindi,
    song?.title_tamil,
    song?.titleTamil,
    song?.title_kannada,
    song?.titleKannada,
    song?.title_malayalam,
    song?.titleMalayalam,
    song?.name,
  ];

  return [
    ...new Set(
      fields
        .filter(
          (value) =>
            typeof value === "string" ||
            typeof value === "number"
        )
        .map((value) => String(value).trim())
        .filter(Boolean)
    ),
  ];
};

/* =====================================================
   TEXT NORMALIZATION
===================================================== */

const normalizeText = (value) =>
  String(value ?? "")
    .normalize("NFC")
    .toLocaleLowerCase()
    .trim();

/* =====================================================
   ARTIST
===================================================== */

const getArtistName = (song) => {
  if (typeof song?.artist_name === "string") {
    return song.artist_name;
  }

  if (typeof song?.artistName === "string") {
    return song.artistName;
  }

  if (typeof song?.artist === "string") {
    return song.artist;
  }

  if (typeof song?.artist?.name === "string") {
    return song.artist.name;
  }

  return "Unknown Artist";
};

/* =====================================================
   ALBUM
===================================================== */

const getAlbumName = (song) => {
  if (typeof song?.album_name === "string") {
    return song.album_name;
  }

  if (typeof song?.albumName === "string") {
    return song.albumName;
  }

  if (typeof song?.album === "string") {
    return song.album;
  }

  return song?.album?.title || "";
};

/* =====================================================
   CATEGORY
===================================================== */

const getCategoryName = (song) => {
  if (typeof song?.category_name === "string") {
    return song.category_name;
  }

  if (typeof song?.categoryName === "string") {
    return song.categoryName;
  }

  if (typeof song?.category === "string") {
    return song.category;
  }

  return song?.category?.name || "";
};

/* =====================================================
   API RESPONSE NORMALIZATION
===================================================== */

const getSongList = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.songs)) return data.songs;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.data?.songs)) return data.data.songs;

  return [];
};

/* =====================================================
   SEARCH PAGE
===================================================== */

function Search() {
  const navigate = useNavigate();
  const player = usePlayer();

  const {
    currentSong,
    isPlaying,
    playSong,
    togglePlay,
  } = player;

  const {
    isLiked,
    toggleLike,
    likedSongs,
  } = useLikedSongs();

  /* ---------------------------------------------------
     STATE
  --------------------------------------------------- */

  const [allSongs, setAllSongs] = useState([]);
  const [query, setQuery] = useState("");
  const [voiceLanguage, setVoiceLanguage] = useState("te-IN");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [playError, setPlayError] = useState("");
  const [menuError, setMenuError] = useState("");
  const [openMenuId, setOpenMenuId] = useState(null);

  const menuRef = useRef(null);

  /* ---------------------------------------------------
     VOICE SEARCH LANGUAGES
  --------------------------------------------------- */

  const voiceLanguages = [
    { label: "తెలుగు", value: "te-IN" },
    { label: "English", value: "en-IN" },
    { label: "हिन्दी", value: "hi-IN" },
    { label: "മലയാളം", value: "ml-IN" },
    { label: "ಕನ್ನಡ", value: "kn-IN" },
    { label: "தமிழ்", value: "ta-IN" },
  ];

  /* ===================================================
     LOAD SONGS
  =================================================== */

  const loadSongs = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await API.get("/songs");
      setAllSongs(getSongList(response?.data));
    } catch (err) {
      console.error("Search song loading error:", err);

      setError(
        err?.response?.data?.message ||
          "Unable to load songs. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSongs();
  }, [loadSongs]);

  /* ===================================================
     INITIAL SEARCH QUERY
  =================================================== */

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initialQuery = params.get("q");

    if (initialQuery) {
      setQuery(initialQuery);
    }
  }, []);

  /* ===================================================
     CLOSE MENU ON OUTSIDE CLICK OR ESCAPE
  =================================================== */

  useEffect(() => {
    if (openMenuId === null) return undefined;

    const handleOutsideClick = (event) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target)
      ) {
        setOpenMenuId(null);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setOpenMenuId(null);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
      document.removeEventListener("keydown", handleEscape);
    };
  }, [openMenuId]);

  /* ===================================================
     SORT SONGS
  =================================================== */

  const sortedSongs = useMemo(() => {
    return [...allSongs].sort((a, b) => {
      const titleA =
        a?.title_english ||
        a?.titleEnglish ||
        a?.english_title ||
        a?.englishTitle ||
        a?.title ||
        "";

      const titleB =
        b?.title_english ||
        b?.titleEnglish ||
        b?.english_title ||
        b?.englishTitle ||
        b?.title ||
        "";

      return String(titleA).localeCompare(
        String(titleB),
        undefined,
        {
          sensitivity: "base",
          numeric: true,
        }
      );
    });
  }, [allSongs]);

  /* ===================================================
     SEARCH FILTER
  =================================================== */

  const filteredSongs = useMemo(() => {
    const term = normalizeText(query);

    if (!term) return [];

    return sortedSongs.filter((song) => {
      const moods = Array.isArray(song?.moods)
        ? song.moods.join(" ")
        : "";

      const fields = [
        ...getSongTitles(song),
        getArtistName(song),
        getAlbumName(song),
        getCategoryName(song),
        song?.language,
        song?.lyrics,
        moods,
      ];

      return fields.some((field) =>
        normalizeText(field).includes(term)
      );
    });
  }, [sortedSongs, query]);

  /* ===================================================
     VOICE SEARCH
  =================================================== */

  const handleVoiceSearch = useCallback((recognizedText) => {
    const text = String(recognizedText || "").trim();

    if (text) {
      setQuery(text);
      setPlayError("");
      setMenuError("");
      setOpenMenuId(null);
    }
  }, []);

  /* ===================================================
     PLAY SONG
  =================================================== */

  const handlePlaySong = useCallback(
    async (song) => {
      if (!song) return;

      setPlayError("");
      setMenuError("");

      const isCurrent =
        String(currentSong?.id) === String(song?.id);

      try {
        if (isCurrent) {
          await togglePlay();
          return;
        }

        if (!song.audio_url) {
          setPlayError(
            `Audio is unavailable for "${
              getSongTitles(song)[0] || "this song"
            }".`
          );
          return;
        }

        const index = sortedSongs.findIndex(
          (item) => String(item?.id) === String(song?.id)
        );

        await playSong(song, sortedSongs, index);
      } catch (err) {
        console.error("Unable to play song:", err);

        setPlayError(
          "Unable to play this song. Please try again."
        );
      }
    },
    [currentSong, togglePlay, playSong, sortedSongs]
  );

  /* ===================================================
     LIKED SONG STATUS
  =================================================== */

  const songIsLiked = useCallback(
    (song) => {
      if (typeof isLiked === "function") {
        return Boolean(isLiked(song?.id));
      }

      if (Array.isArray(likedSongs)) {
        return likedSongs.some(
          (item) =>
            String(item?.id ?? item?.song_id) ===
            String(song?.id)
        );
      }

      return false;
    },
    [isLiked, likedSongs]
  );

  /* ===================================================
     THREE-DOT MENU ACTIONS
  =================================================== */

  const handleMenuAction = useCallback(
    async (action, song) => {
      setOpenMenuId(null);
      setMenuError("");

      try {
        switch (action) {
          case "play":
            await handlePlaySong(song);
            break;

          case "next": {
            if (typeof player.playNext === "function") {
              await player.playNext(song);
              break;
            }

            if (
              typeof player.setQueue === "function" &&
              Array.isArray(player.queue)
            ) {
              const nextQueue = [...player.queue];

              const existingIndex = nextQueue.findIndex(
                (item) => String(item?.id) === String(song?.id)
              );

              if (existingIndex !== -1) {
                nextQueue.splice(existingIndex, 1);
              }

              const insertAt =
                Number.isInteger(player.currentIndex) &&
                player.currentIndex >= 0
                  ? Math.min(
                      player.currentIndex + 1,
                      nextQueue.length
                    )
                  : 0;

              nextQueue.splice(insertAt, 0, song);
              player.setQueue(nextQueue);
              break;
            }

            setMenuError(
              "Play Next is not supported by your current player."
            );
            break;
          }

          case "queue":
            if (typeof player.addToQueue === "function") {
              await player.addToQueue(song);
            } else {
              setMenuError(
                "Add to Queue is not available in your current PlayerContext."
              );
            }
            break;

          case "like":
            if (typeof toggleLike === "function") {
              await toggleLike(song);
            } else {
              setMenuError(
                "Liked Songs is not available in your current context."
              );
            }
            break;

          case "playlist":
            navigate("/playlists", {
              state: {
                selectedSong: song,
                action: "add-song",
              },
            });
            break;

          default:
            break;
        }
      } catch (err) {
        console.error(
          `Search menu action "${action}" failed:`,
          err
        );

        setMenuError(
          err?.response?.data?.message ||
            "That action could not be completed. Please try again."
        );
      }
    },
    [player, toggleLike, handlePlaySong, navigate]
  );

  /* ===================================================
     CLEAR SEARCH
  =================================================== */

  const clearSearch = useCallback(() => {
    setQuery("");
    setPlayError("");
    setMenuError("");
    setOpenMenuId(null);
  }, []);

  /* ===================================================
     RENDER
  =================================================== */

  return (
    <main className="search-page">
      {/* PAGE HEADER */}

      <header className="search-page-header">
        <div className="search-page-heading">
          <span className="search-page-eyebrow">
            KEERTHANA MUSIC
          </span>

          <h1>Search</h1>

          <p>
            Discover worship songs, artists, albums, and lyrics.
          </p>
        </div>
      </header>      




      {/* SEARCH BAR + VOICE SEARCH */}

      <section
        className="search-controls"
        aria-label="Song search"
      >
        <div className="search-input-wrapper">
          <FaSearch
            className="search-input-icon"
            aria-hidden="true"
          />

          <input
            type="search"
            className="search-input"
            placeholder="Search songs, artists, albums, lyrics..."
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPlayError("");
              setMenuError("");
              setOpenMenuId(null);
            }}
            aria-label="Search songs, artists, albums, and lyrics"
            autoComplete="off"
          />

          {query && (
            <button
              type="button"
              className="search-clear-button"
              onClick={clearSearch}
              aria-label="Clear search"
              title="Clear search"
            >
              <FaTimes />
            </button>
          )}

        
        </div>

        {/* Single voice-language selector below the search bar */}

        <div className="search-language-inline">
         

          <div className="search-language-controls">
            <label
              className="search-language-label"
              htmlFor="search-voice-language"
            >
              Voice language
            </label>

            <select
              id="search-voice-language"
              className="search-language-select"
              value={voiceLanguage}
              onChange={(event) =>
                setVoiceLanguage(event.target.value)
              }
            >
              {voiceLanguages.map((language) => (
                <option
                  key={language.value}
                  value={language.value}
                >
                  {language.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>


      {/* PLAYBACK FEEDBACK */}

      {playError && (
        <div
          className="search-message search-error"
          role="alert"
        >
          <span>{playError}</span>

          <button
            type="button"
            onClick={() => setPlayError("")}
            aria-label="Dismiss playback error"
          >
            <FaTimes />
          </button>
        </div>
      )}

      {/* MENU FEEDBACK */}

      {menuError && (
        <div
          className="search-message search-error"
          role="alert"
        >
          <span>{menuError}</span>

          <button
            type="button"
            onClick={() => setMenuError("")}
            aria-label="Dismiss menu error"
          >
            <FaTimes />
          </button>
        </div>
      )}

      {/* LOADING STATE */}

      {loading && (
        <section
          className="search-state-card search-loading"
          aria-live="polite"
        >
          <div className="search-loading-spinner" />
          <h2>Loading your music</h2>
          <p>Preparing your song library...</p>
        </section>
      )}

      {/* API ERROR */}

      {!loading && error && (
        <section
          className="search-state-card search-error-state"
          role="alert"
        >
          <div className="search-empty-icon">
            <FaMusic />
          </div>

          <h2>Unable to Load Songs</h2>
          <p>{error}</p>

          <button
            type="button"
            className="search-show-all-button"
            onClick={loadSongs}
          >
            <FaRedo />
            <span>Try Again</span>
          </button>
        </section>
      )}

      {/* SEARCH RESULTS */}

      {!loading && !error && query.trim() && (
        <section className="search-results-section">
          <div className="search-results-header">
            <div>
              <h2>Search Results</h2>

              <p>
                {filteredSongs.length}{" "}
                {filteredSongs.length === 1
                  ? "song"
                  : "songs"}{" "}
                found
              </p>
            </div>

            <button
              type="button"
              className="search-results-clear"
              onClick={clearSearch}
            >
              <FaTimes />
              <span>Clear</span>
            </button>
          </div>

          {/* HORIZONTAL SONG ROWS */}

          {filteredSongs.length > 0 && (
            <div className="search-song-list">
              {filteredSongs.map((song) => {
                const titles = getSongTitles(song);
                const primaryTitle =
                  titles[0] || "Untitled Song";

                const secondaryTitle =
                  titles.find(
                    (title) => title !== primaryTitle
                  ) || "";

                const current =
                  String(currentSong?.id) ===
                  String(song?.id);

                const playing = current && isPlaying;

                const menuOpen =
                  String(openMenuId) === String(song?.id);

                const liked = songIsLiked(song);
                const cover =
                  getSongCover(song) || DEFAULT_COVER;

                return (
                  <article
                    key={song.id}
                    className={`search-song-card ${
                      current
                        ? "search-song-card-active"
                        : ""
                    }`}
                  >
                    {/* PLAY BUTTON */}

                    <button
                      type="button"
                      className={`search-song-play ${
                        playing ? "playing" : ""
                      }`}
                      onClick={() => handlePlaySong(song)}
                      aria-label={`${playing ? "Pause" : "Play"} ${primaryTitle}`}
                      title={playing ? "Pause" : "Play"}
                    >
                      {playing ? <FaPause /> : <FaPlay />}
                    </button>

                    {/* SONG COVER */}

                    <button
                      type="button"
                      className="search-song-cover-button"
                      onClick={() => handlePlaySong(song)}
                      aria-label={`Play ${primaryTitle}`}
                      title={`Play ${primaryTitle}`}
                    >
                      <img
                        className="search-song-cover"
                        src={cover}
                        alt=""
                        loading="lazy"
                        onError={(event) => {
                          event.currentTarget.onerror = null;
                          event.currentTarget.src =
                            DEFAULT_COVER;
                        }}
                      />
                    </button>

                    {/* SONG DETAILS */}

                    <div className="search-song-info">
                      <h3 title={primaryTitle}>
                        <button
                          type="button"
                          className="search-song-title-button"
                          onClick={() => handlePlaySong(song)}
                        >
                          {primaryTitle}
                        </button>
                      </h3>

                      {secondaryTitle && (
                        <p
                          className="search-song-secondary"
                          title={secondaryTitle}
                        >
                          {secondaryTitle}
                        </p>
                      )}

                      <p className="search-song-artist">
                        {getArtistName(song)}
                      </p>

                      <div className="search-song-meta">
                        {getAlbumName(song) && (
                          <span title={getAlbumName(song)}>
                            {getAlbumName(song)}
                          </span>
                        )}

                        {song?.language && (
                          <span title={song.language}>
                            {song.language}
                          </span>
                        )}

                        {getCategoryName(song) && (
                          <span title={getCategoryName(song)}>
                            {getCategoryName(song)}
                          </span>
                        )}
                      </div>

                      {current && (
                        <small className="search-playing-indicator">
                          {playing
                            ? "Now Playing"
                            : "Paused"}
                        </small>
                      )}
                    </div>

                    {/* THREE-DOT MENU */}

                    <div
                      className="search-song-menu-container"
                      ref={menuOpen ? menuRef : null}
                    >
                      <button
                        type="button"
                        className="search-song-menu-trigger"
                        aria-label={`More options for ${primaryTitle}`}
                        aria-haspopup="menu"
                        aria-expanded={menuOpen}
                        title="More options"
                        onClick={() => {
                          setMenuError("");

                          setOpenMenuId((previous) =>
                            String(previous) ===
                            String(song.id)
                              ? null
                              : song.id
                          );
                        }}
                      >
                        <FaEllipsisV />
                      </button>

                      {menuOpen && (
                        <div
                          className="search-song-context-menu"
                          role="menu"
                        >
                          <button
                            type="button"
                            role="menuitem"
                            onClick={() =>
                              handleMenuAction("play", song)
                            }
                          >
                            <FaPlay />
                            <span>Play now</span>
                          </button>

                          {(typeof player.playNext ===
                            "function" ||
                            (typeof player.setQueue ===
                              "function" &&
                              Array.isArray(player.queue))) && (
                            <button
                              type="button"
                              role="menuitem"
                              onClick={() =>
                                handleMenuAction("next", song)
                              }
                            >
                              <FaStepForward />
                              <span>Play next</span>
                            </button>
                          )}

                          <button
                            type="button"
                            role="menuitem"
                            onClick={() =>
                              handleMenuAction("queue", song)
                            }
                          >
                            <FaPlus />
                            <span>Add to queue</span>
                          </button>

                          <div className="search-song-menu-divider" />

                          <button
                            type="button"
                            role="menuitem"
                            onClick={() =>
                              handleMenuAction("like", song)
                            }
                          >
                            {liked ? (
                              <FaHeart />
                            ) : (
                              <FaRegHeart />
                            )}

                            <span>
                              {liked
                                ? "Remove from Liked Songs"
                                : "Add to Liked Songs"}
                            </span>
                          </button>

                          <button
                            type="button"
                            role="menuitem"
                            onClick={() =>
                              handleMenuAction("playlist", song)
                            }
                          >
                            <FaListUl />
                            <span>Add to playlist</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* INITIAL EMPTY STATE */}

      {!loading && !error && !query.trim() && (
        <section className="search-state-card search-empty">
          <div
            className="search-empty-icon"
            aria-hidden="true"
          >
            <FaSearch />
          </div>

          <h2>Find Your Favourite Worship Songs</h2>

          <p>
            Search by song title, artist, album, category, mood,
            or lyrics.
          </p>

          <p className="search-hint">
            Try searching for worship, praise, prayer, or your
            favourite song.
          </p>
        </section>
      )}

      {/* NO RESULTS */}

      {!loading &&
        !error &&
        query.trim() &&
        filteredSongs.length === 0 && (
          <section className="search-state-card search-empty">
            <div
              className="search-empty-icon"
              aria-hidden="true"
            >
              <FaSearch />
            </div>

            <h2>No Matching Songs</h2>

            <p>
              We couldn't find a song matching "
              {query.trim()}". Try another spelling, artist
              name, language, or lyric.
            </p>

            <button
              type="button"
              className="search-show-all-button"
              onClick={clearSearch}
            >
              <FaTimes />
              <span>Clear Search</span>
            </button>
          </section>
        )}
    </main>
  );
}

export default Search;
