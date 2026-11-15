import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import {
  FaHeart,
  FaPlay,
  FaPause,
  FaTrash,
  FaPlus,
  FaCheck,
  FaMusic,
  FaArrowLeft,
  FaEllipsisV,
  FaStepForward,
  FaListUl,
} from "react-icons/fa";

import { usePlayer } from "../context/usePlayer";

import {
  getFavorites,
  removeFavorite,
  addFavorite,
} from "../utils/favorites";

import { getSongCover } from "../utils/media";
import API from "../services/api";
import VoiceSearch from "../components/VoiceSearch";

import "../assets/css/favorites.css";

function Favorites() {
  const navigate = useNavigate();

  /* =========================================
     GLOBAL PLAYER
  ========================================= */

  const player = usePlayer();

  const {
    currentSong,
    isPlaying,
    playSong,
    togglePlay,
    addToQueue,
  } = player;

  const [menuSongId, setMenuSongId] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuSongId(null);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") setMenuSongId(null);
    };

    document.addEventListener("pointerdown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("pointerdown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  /* =========================================
     STATE
  ========================================= */

  const [favorites, setFavorites] = useState([]);
  const [allSongs, setAllSongs] = useState([]);

  const [browseLoading, setBrowseLoading] = useState(false);
  const [browseError, setBrowseError] = useState("");

  const [favoritesSearch, setFavoritesSearch] = useState("");
  const [searchText, setSearchText] = useState("");

  const [showBrowse, setShowBrowse] = useState(false);

  // Voice-search language selectors
  const [favoritesVoiceLanguage, setFavoritesVoiceLanguage] =
    useState("te-IN");

  const [browseVoiceLanguage, setBrowseVoiceLanguage] =
    useState("te-IN");

  /* =========================================
     LOAD FAVORITES
  ========================================= */

  const loadFavorites = useCallback(() => {
    const savedFavorites = getFavorites();

    setFavorites(
      Array.isArray(savedFavorites) ? savedFavorites : []
    );
  }, []);

  useEffect(() => {
    loadFavorites();

    const handleFavoritesChanged = () => {
      loadFavorites();
    };

    window.addEventListener(
      "favoritesChanged",
      handleFavoritesChanged
    );

    window.addEventListener(
      "storage",
      handleFavoritesChanged
    );

    return () => {
      window.removeEventListener(
        "favoritesChanged",
        handleFavoritesChanged
      );

      window.removeEventListener(
        "storage",
        handleFavoritesChanged
      );
    };
  }, [loadFavorites]);

  /* =========================================
     LOAD ALL SONGS
  ========================================= */

  const loadAllSongs = async () => {
    try {
      setBrowseLoading(true);
      setBrowseError("");

      const response = await API.get("/songs");
      const data = response.data;

      if (Array.isArray(data?.songs)) {
        setAllSongs(data.songs);
      } else if (Array.isArray(data)) {
        setAllSongs(data);
      } else {
        setAllSongs([]);
      }
    } catch (error) {
      console.error("Load songs error:", error);

      setBrowseError(
        error?.response?.data?.message ||
          "Unable to load songs. Please try again."
      );
    } finally {
      setBrowseLoading(false);
    }
  };

  const handleBrowseSongs = async () => {
    setShowBrowse(true);
    await loadAllSongs();
  };

  const handleCloseBrowse = () => {
    setShowBrowse(false);
    setSearchText("");
    setBrowseError("");
  };

  /* =========================================
     VOICE SEARCH HANDLERS
  ========================================= */

  const handleFavoritesVoiceSearch = useCallback((text) => {
    setFavoritesSearch(text);
  }, []);

  const handleBrowseVoiceSearch = useCallback((text) => {
    setSearchText(text);
  }, []);

  /* =========================================
     FAVORITE HELPERS
  ========================================= */

  const isFavorite = useCallback(
    (songId) =>
      favorites.some(
        (song) => String(song.id) === String(songId)
      ),
    [favorites]
  );

  const favoriteQueue = useMemo(
    () => favorites,
    [favorites]
  );

  const hasTeluguScript = (value) =>
    /[\u0C00-\u0C7F]/.test(String(value || ""));

  const getSongEnglishTitle = (song) => {
    const candidates = [
      song?.title_english,
      song?.titleEnglish,
      song?.english_title,
      song?.englishTitle,
      song?.title,
      song?.name,
    ];

    const value = candidates.find(
      (item) =>
        typeof item === "string" &&
        item.trim() &&
        !hasTeluguScript(item)
    );

    return String(value || "Untitled Song").trim();
  };

  const getSongTeluguTitle = (song) => {
    const candidates = [
      song?.title_telugu,
      song?.titleTelugu,
      song?.title_native,
      song?.title,
      song?.name,
    ];

    const value = candidates.find(
      (item) =>
        typeof item === "string" &&
        item.trim() &&
        hasTeluguScript(item)
    );

    const title = String(value || "").trim();
    return title && title !== getSongEnglishTitle(song) ? title : "";
  };

  const getSongEnglishArtist = (song) => {
    const candidates = [
      song?.artist_name_english,
      song?.artist_english,
      song?.artistEnglish,
      song?.artist?.name_english,
      song?.artist?.english_name,
      song?.artist_name,
      typeof song?.artist === "string" ? song.artist : "",
      song?.artist?.name,
    ];

    const value = candidates.find(
      (item) =>
        typeof item === "string" &&
        item.trim() &&
        !hasTeluguScript(item)
    );

    return String(value || "Unknown Artist").trim();
  };

  const handlePlayNext = (song) => {
    setMenuSongId(null);

    try {
      if (typeof player.playNext === "function") {
        player.playNext(song);
        return;
      }

      if (Array.isArray(player.queue) && typeof player.setQueue === "function") {
        const queue = [...player.queue];
        const currentIndex = Number.isInteger(player.currentIndex)
          ? player.currentIndex
          : -1;
        queue.splice(Math.max(0, currentIndex + 1), 0, song);
        player.setQueue(queue);
        return;
      }

      if (typeof addToQueue === "function") {
        addToQueue(song);
        return;
      }

      console.warn("Play Next is unavailable in the current player.");
    } catch (error) {
      console.error("Play Next failed:", error);
    }
  };

  const handleAddToQueue = (song) => {
    setMenuSongId(null);

    if (typeof addToQueue !== "function") {
      console.warn("Add to Queue is unavailable in the current player.");
      return;
    }

    try {
      addToQueue(song);
    } catch (error) {
      console.error("Add to Queue failed:", error);
    }
  };

  const handleAddToPlaylist = (song) => {
    setMenuSongId(null);
    navigate("/playlists", {
      state: {
        selectedSong: song,
        action: "add-song",
      },
    });
  };

  const handleAddFavorite = (song) => {
    if (!song?.id || isFavorite(song.id)) return;

    try {
      addFavorite(song);
      loadFavorites();
    } catch (error) {
      console.error("Add favorite error:", error);
    }
  };

  const handleRemove = (song) => {
    if (!song?.id) return;

    removeFavorite(song.id);
    loadFavorites();
  };

  const handleClearAll = () => {
    if (favorites.length === 0) return;

    const confirmed = window.confirm(
      "Remove all favorite songs?"
    );

    if (!confirmed) return;

    favorites.forEach((song) => {
      removeFavorite(song.id);
    });

    loadFavorites();
    setFavoritesSearch("");
  };

  /* =========================================
     PLAY / PAUSE SONG
  ========================================= */

  const handlePlay = async (
    song,
    songs = favoriteQueue
  ) => {
    if (!song?.id || !song.audio_url) return;

    const isCurrent =
      currentSong?.id != null &&
      String(currentSong.id) === String(song.id);

    try {
      if (isCurrent) {
        await togglePlay();
        return;
      }

      const playableSongs = Array.isArray(songs)
        ? songs.filter((item) => item?.audio_url)
        : [];

      const songIndex = playableSongs.findIndex(
        (item) => String(item.id) === String(song.id)
      );

      await playSong(
        song,
        playableSongs.length > 0
          ? playableSongs
          : [song],
        Math.max(songIndex, 0)
      );
    } catch (error) {
      console.error(
        "Favorite song playback error:",
        error
      );
    }
  };

  /* =========================================
     PLAY ALL FAVORITES
  ========================================= */

  const handlePlayAll = async () => {
    const playableSongs = favorites.filter(
      (song) => song?.id && song.audio_url
    );

    if (playableSongs.length === 0) return;

    const firstSong = playableSongs[0];

    const isFirstSongCurrent =
      currentSong?.id != null &&
      String(currentSong.id) === String(firstSong.id);

    try {
      if (isFirstSongCurrent) {
        await togglePlay();
        return;
      }

      await playSong(firstSong, playableSongs, 0);
    } catch (error) {
      console.error(
        "Play all favorites error:",
        error
      );
    }
  };

  /* =========================================
     SEARCH HELPERS
  ========================================= */

  const getSongSearchText = (song) => {
    const artist =
      typeof song.artist === "string"
        ? song.artist
        : song.artist?.name || "";

    return [
      song.title,
      song.title_english,
      song.titleEnglish,
      song.artist_name,
      artist,
      song.album_name,
      song.album?.name,
      song.category_name,
      song.language,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
  };

  /* =========================================
     FILTER FAVORITE SONGS
  ========================================= */

  const filteredFavorites = useMemo(() => {
    const query = favoritesSearch.trim().toLowerCase();

    if (!query) return favorites;

    return favorites.filter((song) =>
      getSongSearchText(song).includes(query)
    );
  }, [favorites, favoritesSearch]);

  /* =========================================
     FILTER BROWSE SONGS
  ========================================= */

  const filteredSongs = useMemo(() => {
    const query = searchText.trim().toLowerCase();

    if (!query) return allSongs;

    return allSongs.filter((song) =>
      getSongSearchText(song).includes(query)
    );
  }, [allSongs, searchText]);

  /* =========================================
     ACCESSIBLE SONG INFO HANDLERS
  ========================================= */

  const handleSongInfoKeyDown = (
    event,
    song,
    songs
  ) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handlePlay(song, songs);
    }
  };

  /* =========================================
     BROWSE SONG ROW
  ========================================= */

  const renderBrowseSong = (song, index) => {
    const isCurrent =
      currentSong?.id != null &&
      String(currentSong.id) === String(song.id);

    const playing = isCurrent && isPlaying;
    const favorite = isFavorite(song.id);
    const cover = getSongCover(song);

    return (
      <div
        className={`favorite-browse-row ${
          isCurrent ? "favorite-browse-current" : ""
        }`}
        key={song.id || index}
      >
        <span className="favorite-browse-number">
          {index + 1}
        </span>

        <div
          className="favorite-browse-cover"
          onClick={() => handlePlay(song, allSongs)}
          role="button"
          tabIndex={0}
          onKeyDown={(event) =>
            handleSongInfoKeyDown(
              event,
              song,
              allSongs
            )
          }
          aria-label={`Play ${getSongEnglishTitle(song)}`}
        >
          {cover ? (
            <img
              src={cover}
              alt={song.title || "Song cover"}
            />
          ) : (
            <div className="favorite-browse-cover-placeholder">
              <FaMusic aria-hidden="true" />
            </div>
          )}
        </div>

        <div
          className="favorite-browse-info"
          onClick={() => handlePlay(song, allSongs)}
          role="button"
          tabIndex={0}
          onKeyDown={(event) =>
            handleSongInfoKeyDown(
              event,
              song,
              allSongs
            )
          }
          aria-label={`Play ${getSongEnglishTitle(song)}`}
        >
          <h3>{song.title || "Untitled Song"}</h3>

          {(song.title_english || song.titleEnglish) && (
            <p>
              {song.title_english || song.titleEnglish}
            </p>
          )}

          <span>
            {song.artist_name ||
              song.artist?.name ||
              song.artist ||
              "Unknown Artist"}
          </span>
        </div>

        <span className="favorite-browse-language">
          {song.language || ""}
        </span>

        <button
          type="button"
          className={`favorite-browse-play ${
            playing ? "is-playing" : ""
          }`}
          onClick={() => handlePlay(song, allSongs)}
          disabled={!song.audio_url}
          title={playing ? "Pause song" : "Play song"}
          aria-label={playing ? "Pause song" : "Play song"}
        >
          {playing ? (
            <FaPause aria-hidden="true" />
          ) : (
            <FaPlay aria-hidden="true" />
          )}
        </button>

        {favorite ? (
          <button
            type="button"
            className="favorite-added-button"
            onClick={() => handleRemove(song)}
            title="Remove from favorites"
            aria-label="Remove from favorites"
          >
            <FaCheck aria-hidden="true" />
          </button>
        ) : (
          <button
            type="button"
            className="favorite-add-button"
            onClick={() => handleAddFavorite(song)}
            title="Add to favorites"
            aria-label="Add to favorites"
          >
            <FaPlus aria-hidden="true" />
          </button>
        )}
      </div>
    );
  };

  /* =========================================
     FAVORITE SONG ROW
     Play button at far left.
     No queue, heart, or three-dot menu.
  ========================================= */

  const renderFavoriteSong = (song, index) => {
    const isCurrent =
      currentSong?.id != null &&
      String(currentSong.id) === String(song.id);

    const playing = isCurrent && isPlaying;
    const cover = getSongCover(song);

    return (
      <div
        className={`favorite-song ${
          isCurrent ? "favorite-song-current" : ""
        }`}
        key={song.id || index}
      >
        <button
          type="button"
          className={`favorite-row-play ${
            playing ? "is-playing" : ""
          }`}
          onClick={() =>
            handlePlay(song, favoriteQueue)
          }
          disabled={!song.audio_url}
          title={playing ? "Pause song" : "Play song"}
          aria-label={playing ? "Pause song" : "Play song"}
        >
          {playing ? (
            <FaPause aria-hidden="true" />
          ) : (
            <FaPlay aria-hidden="true" />
          )}
        </button>

        <div
          className="favorite-song-cover"
          onClick={() =>
            handlePlay(song, favoriteQueue)
          }
          role="button"
          tabIndex={0}
          aria-label={`Play ${getSongEnglishTitle(song)}`}
          onKeyDown={(event) =>
            handleSongInfoKeyDown(
              event,
              song,
              favoriteQueue
            )
          }
        >
          {cover ? (
            <img
              src={cover}
              alt={song.title || "Song cover"}
            />
          ) : (
            <div className="favorite-cover-placeholder">
              <FaMusic aria-hidden="true" />
            </div>
          )}
        </div>

        <div
          className="favorite-song-info"
          onClick={() =>
            handlePlay(song, favoriteQueue)
          }
          role="button"
          tabIndex={0}
          aria-label={`Play ${getSongEnglishTitle(song)}`}
          onKeyDown={(event) =>
            handleSongInfoKeyDown(
              event,
              song,
              favoriteQueue
            )
          }
        >
          <h3>{getSongEnglishTitle(song)}</h3>

          {getSongTeluguTitle(song) && (
            <p className="favorite-song-english">
              {getSongTeluguTitle(song)}
            </p>
          )}

          <p className="favorite-song-artist">
            {getSongEnglishArtist(song)}
          </p>
        </div>

        <div
          className="favorite-song-menu-wrap"
          ref={menuSongId === song.id ? menuRef : null}
        >
          <button
            type="button"
            className="favorite-song-menu-button"
            aria-label={`More options for ${getSongEnglishTitle(song)}`}
            aria-haspopup="menu"
            aria-expanded={menuSongId === song.id}
            onClick={(event) => {
              event.stopPropagation();
              setMenuSongId((current) =>
                String(current) === String(song.id) ? null : song.id
              );
            }}
          >
            <FaEllipsisV aria-hidden="true" />
          </button>

          {menuSongId === song.id && (
            <div className="favorite-song-context-menu" role="menu">
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuSongId(null);
                  handlePlay(song, favoriteQueue);
                }}
              >
                <FaPlay aria-hidden="true" />
                <span>Play Now</span>
              </button>

              <button
                type="button"
                role="menuitem"
                onClick={() => handlePlayNext(song)}
              >
                <FaStepForward aria-hidden="true" />
                <span>Play Next</span>
              </button>

              <button
                type="button"
                role="menuitem"
                onClick={() => handleAddToQueue(song)}
              >
                <FaPlus aria-hidden="true" />
                <span>Add to Queue</span>
              </button>

              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuSongId(null);
                  handleRemove(song);
                }}
              >
                <FaTrash aria-hidden="true" />
                <span>Remove from Favorites</span>
              </button>

              <button
                type="button"
                role="menuitem"
                onClick={() => handleAddToPlaylist(song)}
              >
                <FaListUl aria-hidden="true" />
                <span>Add to Playlist</span>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  /* =========================================
     PAGE
  ========================================= */

  return (
    <div className="favorites-page">
      {/* HEADER */}

      <header className="favorites-header">
        <button
          type="button"
          className="favorites-back-button"
          onClick={() => navigate(-1)}
          aria-label="Go back"
        >
          <FaArrowLeft aria-hidden="true" />
        </button>

        <div className="favorites-title-wrapper">
          <div className="favorites-title-icon">
            <FaHeart aria-hidden="true" />
          </div>

          <div>
            <h1>My Favorites</h1>

            <p>
              {favorites.length}{" "}
              {favorites.length === 1
                ? "favorite song"
                : "favorite songs"}
            </p>
          </div>
        </div>
      </header>

      {/* PLAY ALL LEFT; OTHER ACTIONS RIGHT */}

      <div className="favorites-main-actions">
        <button
          type="button"
          className="favorites-play-all-button"
          onClick={handlePlayAll}
          disabled={
            !favorites.some((song) => song.audio_url)
          }
        >
          {currentSong &&
          String(currentSong.id) ===
            String(favorites.find(
              (song) => song.audio_url
            )?.id) &&
          isPlaying ? (
            <FaPause aria-hidden="true" />
          ) : (
            <FaPlay aria-hidden="true" />
          )}

          <span>Play All</span>
        </button>

        <div className="favorites-toolbar">
          {favorites.length > 0 && (
            <button
              type="button"
              className="favorites-clear-songs-button"
              onClick={handleClearAll}
            >
              <FaTrash aria-hidden="true" />
              <span>Clear Songs</span>
            </button>
          )}

          <button
            type="button"
            className="favorites-add-songs-button"
            onClick={handleBrowseSongs}
          >
            <FaPlus aria-hidden="true" />
            <span>Add Songs</span>
          </button>
        </div>
      </div>

      {/* ADD SONGS BROWSER */}

      {showBrowse && (
        <section className="favorites-browse-section">
          <div className="favorites-browse-header">
            <div>
              <h2>Add Songs</h2>
              <p>
                Discover songs and add them to your favorites
              </p>
            </div>

            <button
              type="button"
              className="favorites-browse-close"
              onClick={handleCloseBrowse}
            >
              Close
            </button>
          </div>

          {/* VOICE SEARCH — BROWSE SONGS */}

          <div className="favorites-browser-voice-search">
            <VoiceSearch
              value={searchText}
              onChange={setSearchText}
              onSearch={handleBrowseVoiceSearch}
              language={browseVoiceLanguage}
              onLanguageChange={setBrowseVoiceLanguage}
              placeholder="Search songs or artists to add..."
              ariaLabel="Search songs to add to favorites by voice or text"
            />
          </div>

          {browseLoading && (
            <div className="favorites-browse-status">
              Loading songs...
            </div>
          )}

          {!browseLoading && browseError && (
            <div className="favorites-browse-error">
              {browseError}
            </div>
          )}

          {!browseLoading &&
            !browseError &&
            filteredSongs.length > 0 && (
              <div className="favorites-browse-list">
                {filteredSongs.map(renderBrowseSong)}
              </div>
            )}

          {!browseLoading &&
            !browseError &&
            filteredSongs.length === 0 && (
              <div className="favorites-browse-empty">
                <FaMusic aria-hidden="true" />
                <h3>No songs found</h3>
                <p>Try another song or artist.</p>
              </div>
            )}
        </section>
      )}

      {/* FAVORITE SONGS */}

      {favorites.length === 0 ? (
        <section className="favorites-empty">
          <div className="favorites-empty-icon">
            <FaHeart aria-hidden="true" />
          </div>

          <h2>No Favorite Songs Yet</h2>

          <p>
            Add songs to your favorites to keep your worship
            music together in one place.
          </p>

          <button
            type="button"
            className="favorites-empty-add-button"
            onClick={handleBrowseSongs}
          >
            <FaPlus aria-hidden="true" />
            <span>Add Your First Song</span>
          </button>
        </section>
      ) : (
        <section className="favorites-list-section">
          <div className="favorites-list-heading">
            <div>
              <h2>Your Songs</h2>
              <p>
                {filteredFavorites.length}{" "}
                {filteredFavorites.length === 1
                  ? "song"
                  : "songs"}{" "}
                shown · {favorites.length} saved
              </p>
            </div>
          </div>

          {/* VOICE SEARCH — SAVED FAVORITES */}

          <div className="favorites-voice-search-section">
            <VoiceSearch
              value={favoritesSearch}
              onChange={setFavoritesSearch}
              onSearch={handleFavoritesVoiceSearch}
              language={favoritesVoiceLanguage}
              onLanguageChange={setFavoritesVoiceLanguage}
              placeholder="Search favorites by song, artist, album or language..."
              ariaLabel="Search favorite songs by voice or text"
            />
          </div>

          {filteredFavorites.length > 0 ? (
            <div className="favorites-list">
              {filteredFavorites.map(renderFavoriteSong)}
            </div>
          ) : (
            <div className="favorites-browse-empty">
              <FaMusic aria-hidden="true" />
              <h3>No matching favorite songs</h3>
              <p>
                Try a different song title, artist, album or
                language.
              </p>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

export default Favorites;