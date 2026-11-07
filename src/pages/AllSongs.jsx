
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  FaCompactDisc,
  FaEllipsisV,
  FaHeart,
  FaListUl,
  FaMusic,
  FaPause,
  FaPlay,
  FaPlus,
  FaRegHeart,
  FaStepForward,
} from "react-icons/fa";

import API from "../services/api";
import { usePlayer } from "../context/usePlayer";
import { useLikedSongs } from "../context/LikedSongsContext";

import {
  getSongCover,
  DEFAULT_SONG_COVER,
} from "../utils/media";

import VoiceSearch from "../components/VoiceSearch";

import "../assets/css/allSongs.css";

import { useNavigate } from "react-router-dom";

/* =====================================================
   LANGUAGE FILTERS
   Native-script labels with API-compatible values
===================================================== */

const LANGUAGES = [
  { value: "All", label: "All" },
  { value: "Telugu", label: "తెలుగు" },
  { value: "English", label: "English" },
  { value: "Hindi", label: "हिन्दी" },
  { value: "Malayalam", label: "മലയാളം" },
  { value: "Kannada", label: "ಕನ್ನಡ" },
  { value: "Tamil", label: "தமிழ்" },
];

/* =====================================================
   LANGUAGE-SPECIFIC UI TEXT
===================================================== */

const LANGUAGE_TEXT = {
  All: {
    allSongs: "All Songs",
    search: "Search songs, artists, and albums...",
    songs: "songs",
    playAll: "Play All",
    clearFilters: "Clear Filters",
    emptyTitle: "No songs found",
    emptyMessage:
      "Try another search or choose a different language.",
    loadingTitle: "Loading songs...",
  },

  Telugu: {
    allSongs: "అన్ని పాటలు",
    search: "పాటలు, గాయకులు, ఆల్బమ్‌లను వెతకండి...",
    searchHint: "పాట, గాయకుడు, ఆల్బమ్ లేదా మూడ్ ద్వారా వెతకండి",
    songs: "పాటలు",
    playAll: "అన్నీ ప్లే చేయండి",
    clearFilters: "ఫిల్టర్లను తొలగించండి",
    emptyTitle: "పాటలు కనబడలేదు",
    emptyMessage:
      "మరో పదంతో వెతకండి లేదా వేరే భాషను ఎంచుకోండి.",
    loadingTitle: "పాటలు లోడ్ అవుతున్నాయి...",
  },

  English: {
    allSongs: "All Songs",
    search: "Search songs, artists, and albums...",
    songs: "songs",
    playAll: "Play All",
    clearFilters: "Clear Filters",
    emptyTitle: "No songs found",
    emptyMessage:
      "Try another search or choose a different language.",
    loadingTitle: "Loading songs...",
  },

  Hindi: {
    allSongs: "सभी गाने",
    search: "गाने, गायक और एल्बम खोजें...",
    searchHint: "गाने, गायक, एल्बम या मूड से खोजें",
    songs: "गाने",
    playAll: "सभी चलाएँ",
    clearFilters: "फ़िल्टर हटाएँ",
    emptyTitle: "कोई गाना नहीं मिला",
    emptyMessage:
      "दूसरे शब्द से खोजें या कोई दूसरी भाषा चुनें।",
    loadingTitle: "गाने लोड हो रहे हैं...",
  },

  Malayalam: {
    allSongs: "എല്ലാ പാട്ടുകളും",
    search: "പാട്ടുകൾ, ഗായകർ, ആൽബങ്ങൾ തിരയുക...",
    searchHint: "പാട്ട്, ഗായകൻ, ആൽബം അല്ലെങ്കിൽ മൂഡ് തിരയുക",
    songs: "പാട്ടുകൾ",
    playAll: "എല്ലാം പ്ലേ ചെയ്യുക",
    clearFilters: "ഫിൽട്ടറുകൾ നീക്കുക",
    emptyTitle: "പാട്ടുകളൊന്നും കണ്ടെത്തിയില്ല",
    emptyMessage:
      "മറ്റൊരു വാക്ക് തിരയുക അല്ലെങ്കിൽ മറ്റൊരു ഭാഷ തിരഞ്ഞെടുക്കുക.",
    loadingTitle: "പാട്ടുകൾ ലോഡ് ചെയ്യുന്നു...",
  },

  Kannada: {
    allSongs: "ಎಲ್ಲಾ ಹಾಡುಗಳು",
    search: "ಹಾಡುಗಳು, ಗಾಯಕರು ಮತ್ತು ಆಲ್ಬಮ್‌ಗಳನ್ನು ಹುಡುಕಿ...",
    searchHint: "ಹಾಡು, ಗಾಯಕ, ಆಲ್ಬಮ್ ಅಥವಾ ಮೂಡ್ ಹುಡುಕಿ",
    songs: "ಹಾಡುಗಳು",
    playAll: "ಎಲ್ಲವನ್ನೂ ಪ್ಲೇ ಮಾಡಿ",
    clearFilters: "ಫಿಲ್ಟರ್‌ಗಳನ್ನು ತೆರವುಗೊಳಿಸಿ",
    emptyTitle: "ಯಾವುದೇ ಹಾಡುಗಳು ಕಂಡುಬಂದಿಲ್ಲ",
    emptyMessage:
      "ಬೇರೆ ಪದದಿಂದ ಹುಡುಕಿ ಅಥವಾ ಬೇರೆ ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ.",
    loadingTitle: "ಹಾಡುಗಳನ್ನು ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ...",
  },

  Tamil: {
    allSongs: "அனைத்து பாடல்கள்",
    search: "பாடல்கள், பாடகர்கள் மற்றும் ஆல்பங்களைத் தேடுங்கள்...",
    searchHint: "பாடல், பாடகர், ஆல்பம் அல்லது மனநிலை மூலம் தேடுங்கள்",
    songs: "பாடல்கள்",
    playAll: "அனைத்தையும் இயக்கு",
    clearFilters: "வடிகட்டிகளை நீக்கு",
    emptyTitle: "பாடல்கள் எதுவும் கிடைக்கவில்லை",
    emptyMessage:
      "வேறு சொல்லைத் தேடுங்கள் அல்லது வேறு மொழியைத் தேர்ந்தெடுக்கவும்.",
    loadingTitle: "பாடல்கள் ஏற்றப்படுகின்றன...",
  },
};

/* =====================================================
   HELPERS
===================================================== */

const getSongId = (song) =>
  song?.id ?? song?.song_id;

const getSongTitle = (song) =>
  song?.title ||
  song?.title_english ||
  "Untitled Song";

const getArtistName = (song) =>
  song?.artist_name ||
  song?.artist?.name ||
  (typeof song?.artist === "string"
    ? song.artist
    : "") ||
  "Unknown Artist";

const getAlbumName = (song) =>
  song?.album_name ||
  song?.album?.title ||
  (typeof song?.album === "string"
    ? song.album
    : "");

const getLanguage = (song) =>
  song?.language || "Telugu";

const normalizeSong = (song) => ({
  ...song,
  id: getSongId(song),
});

/* =====================================================
   ALL SONGS PAGE
===================================================== */

export default function AllSongs() {
  const navigate = useNavigate();

  const player = usePlayer();
  const likedContext = useLikedSongs();

  const {
    currentSong,
    isPlaying,
    playSong,
    togglePlay,
    addToQueue,
  } = player;

  const { isLiked, toggleLike } = likedContext;

  /* ---------------------------------------------------
     STATE
  --------------------------------------------------- */

  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [language, setLanguage] = useState("All");

  const [menuSongId, setMenuSongId] = useState(null);
  const [notice, setNotice] = useState("");

  const menuRef = useRef(null);

  const currentSongId = getSongId(currentSong);

  /* ---------------------------------------------------
     CURRENT LANGUAGE TEXT
  --------------------------------------------------- */

  const languageText =
    LANGUAGE_TEXT[language] || LANGUAGE_TEXT.All;

  /* ===================================================
     LOAD SONGS
  =================================================== */

  const loadSongs = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await API.get("/songs");

      const payload = response?.data;

      const list = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.songs)
          ? payload.songs
          : Array.isArray(payload?.data)
            ? payload.data
            : [];

      const validSongs = list
        .map(normalizeSong)
        .filter((song) => song.id != null);

      validSongs.sort((a, b) =>
        getSongTitle(a).localeCompare(getSongTitle(b))
      );

      setSongs(validSongs);
    } catch (err) {
      console.error("Failed to load songs:", err);

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
     CLOSE MENU ON OUTSIDE CLICK OR ESCAPE
  =================================================== */

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

  /* ===================================================
     TEMPORARY FEEDBACK
  =================================================== */

  useEffect(() => {
    if (!notice) return undefined;

    const timeout = window.setTimeout(
      () => setNotice(""),
      2600
    );

    return () => window.clearTimeout(timeout);
  }, [notice]);

  const showNotice = useCallback((message) => {
    setNotice(message);
  }, []);

  /* ===================================================
     SEARCH AND LANGUAGE FILTER
  =================================================== */

  const filteredSongs = useMemo(() => {
    const query = search
      .trim()
      .toLocaleLowerCase();

    return songs.filter((song) => {
      const matchesLanguage =
        language === "All" ||
        getLanguage(song).toLowerCase() ===
          language.toLowerCase();

      const moods = Array.isArray(song.moods)
        ? song.moods
        : [];

      const searchableText = [
        song.title,
        song.title_english,
        getArtistName(song),
        getAlbumName(song),
        song.category_name,
        song.category?.name,
        getLanguage(song),
        ...moods,
      ]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase();

      return (
        matchesLanguage &&
        searchableText.includes(query)
      );
    });
  }, [songs, search, language]);

  /* ===================================================
     PLAY SONG
  =================================================== */

  const handlePlay = useCallback(
    (song, list = filteredSongs) => {
      const normalizedSong = normalizeSong(song);

      if (
        currentSongId === normalizedSong.id &&
        typeof togglePlay === "function"
      ) {
        togglePlay();
        return;
      }

      if (typeof playSong !== "function") {
        showNotice("Player is unavailable right now.");
        return;
      }

      const playlist = list.map(normalizeSong);

      const index = playlist.findIndex(
        (item) => item.id === normalizedSong.id
      );

      playSong(
        normalizedSong,
        playlist,
        index >= 0 ? index : 0
      );
    },
    [
      currentSongId,
      filteredSongs,
      playSong,
      togglePlay,
      showNotice,
    ]
  );

  /* ===================================================
     PLAY ALL
  =================================================== */

  const handlePlayAll = () => {
    if (filteredSongs.length > 0) {
      handlePlay(filteredSongs[0], filteredSongs);
    }
  };

  /* ===================================================
     ADD TO QUEUE
  =================================================== */

  const handleAddToQueue = (song) => {
    if (typeof addToQueue !== "function") {
      showNotice("Queue is unavailable right now.");
      return;
    }

    addToQueue(normalizeSong(song));

    setMenuSongId(null);

    showNotice("Added to your queue");
  };

  /* ===================================================
     PLAY NEXT
  =================================================== */

  const handlePlayNext = (song) => {
    const normalizedSong = normalizeSong(song);

    if (typeof player.playNext === "function") {
      player.playNext(normalizedSong);

      setMenuSongId(null);

      showNotice("Added to play next");
      return;
    }

    if (
      Array.isArray(player.queue) &&
      typeof player.setQueue === "function"
    ) {
      const queue = player.queue.map(normalizeSong);

      const duplicateIndex = queue.findIndex(
        (item) => item.id === normalizedSong.id
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

    handleAddToQueue(normalizedSong);
  };

  /* ===================================================
     LIKE / UNLIKE
  =================================================== */

  const handleToggleLike = async (song) => {
    if (typeof toggleLike !== "function") {
      showNotice("Liked Songs is unavailable right now.");
      return;
    }

    const wasLiked = Boolean(
      isLiked?.(getSongId(song))
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
      console.error(
        "Unable to update liked song:",
        err
      );

      showNotice("Couldn't update Liked Songs");
    }
  };

  /* ===================================================
     PLAYLIST INTEGRATION
  =================================================== */

  const handleAddToPlaylist = (song) => {
    setMenuSongId(null);

    navigate("/playlists", {
      state: {
        selectedSong: normalizeSong(song),
        action: "add-song",
      },
    });
  };

  /* ===================================================
     ALBUM NAVIGATION
     Existing event integration preserved.
  =================================================== */

  const handleViewAlbum = (song) => {
    const albumId =
      song?.album_id ??
      song?.album?.id ??
      song?.album?.album_id;

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
      "Connect this action to your album details route."
    );
  };

  /* ===================================================
     VOICE SEARCH
     AWS automatically identifies the spoken language.
     Transcript updates the existing search state.
  =================================================== */

  const handleVoiceSearchChange = useCallback(
    (nextValue) => {
      setSearch(nextValue);
    },
    []
  );

  const handleVoiceSearchSubmit = useCallback(
    (spokenText) => {
      const searchText = String(
        spokenText || ""
      ).trim();

      if (searchText) {
        setSearch(searchText);
      }
    },
    []
  );

  /* ===================================================
     RENDER
  =================================================== */

  return (
    <main className="all-songs-page">

      {/* PAGE HEADER */}

      <header className="all-songs-header">
        <div className="all-songs-title-area">

          <div
            className="all-songs-icon"
            aria-hidden="true"
          >
            <FaMusic />
          </div>

          <div className="all-songs-heading">

            <span className="all-songs-overline">
              YOUR WORSHIP LIBRARY
            </span>

            <h1>{languageText.allSongs}</h1>

            <p>{languageText.searchHint}</p>

          </div>
        </div>
      </header>

      {/* SEARCH */}

      <section
        className="all-songs-search-section"
        aria-label="Search songs"
      >

        <VoiceSearch
          value={search}
          onChange={handleVoiceSearchChange}
          onSearch={handleVoiceSearchSubmit}
          placeholder={languageText.search}
          ariaLabel="Search songs, artists, albums and lyrics"
        />

      </section>

      {/* RESULTS */}

      <section className="all-songs-results">

        <div className="all-songs-results-heading">

          {/* ALL SONGS TITLE */}

          <div className="all-songs-results-title">
            <h2>{languageText.allSongs}</h2>
          </div>

          {/* PLAY ALL */}

          <div className="all-songs-play-all-row">

            <button
              type="button"
              className="all-songs-play-all"
              onClick={handlePlayAll}
              disabled={
                !filteredSongs.length || loading
              }
            >
              <FaPlay />
              {languageText.playAll}
            </button>

          </div>
        </div>

        {/* LANGUAGE FILTERS */}

        <div
          className="all-songs-language-filters"
          aria-label="Filter songs by language"
        >

          {LANGUAGES.map((item) => (

            <button
              key={item.value}
              type="button"
              className={`all-songs-language-chip ${
                language === item.value
                  ? "active"
                  : ""
              }`}
              onClick={() => setLanguage(item.value)}
              aria-pressed={
                language === item.value
              }
            >
              {item.label}
            </button>

          ))}

        </div>

        {/* LOADING */}

        {loading ? (

          <div
            className="all-songs-loading"
            role="status"
          >

            <FaMusic className="all-songs-loading-icon" />

            <h2>{languageText.loadingTitle}</h2>

            <p>
              Please wait while we prepare your songs.
            </p>

          </div>

        ) : error ? (

          /* ERROR */

          <div
            className="all-songs-error"
            role="alert"
          >

            <p>{error}</p>

            <button
              type="button"
              onClick={loadSongs}
            >
              Try Again
            </button>

          </div>

        ) : filteredSongs.length === 0 ? (

          /* EMPTY STATE */

          <div className="all-songs-empty">

            <FaMusic className="all-songs-empty-icon" />

            <h2>{languageText.emptyTitle}</h2>

            <p>{languageText.emptyMessage}</p>

            {(search || language !== "All") && (

              <button
                type="button"
                className="all-songs-reset-search"
                onClick={() => {
                  setSearch("");
                  setLanguage("All");
                }}
              >
                {languageText.clearFilters}
              </button>

            )}

          </div>

        ) : (

          /* SONG LIST */

          <div className="all-songs-list">

            {filteredSongs.map((song) => {

              const songId = getSongId(song);

              const isCurrent =
                currentSongId === songId;

              const playing =
                isCurrent && isPlaying;

              const liked = Boolean(
                isLiked?.(songId)
              );

              const albumName = getAlbumName(song);

              let cover = DEFAULT_SONG_COVER;

              try {
                cover =
                  getSongCover(song) ||
                  DEFAULT_SONG_COVER;
              } catch {
                cover = DEFAULT_SONG_COVER;
              }

              return (

                <article
                  key={songId}
                  className={`all-song-card ${
                    isCurrent ? "current" : ""
                  }`}
                >

                  {/* SONG COVER */}

                  <button
                    type="button"
                    className="all-song-cover"
                    onClick={() => handlePlay(song)}
                    aria-label={`${
                      playing ? "Pause" : "Play"
                    } ${getSongTitle(song)}`}
                  >

                    <img
                      src={cover}
                      alt={`${getSongTitle(song)} cover`}
                      loading="lazy"
                      onError={(event) => {
                        event.currentTarget.onerror = null;

                        event.currentTarget.src =
                          DEFAULT_SONG_COVER;
                      }}
                    />

                    <span className="all-song-cover-play">

                      {playing ? (
                        <FaPause />
                      ) : (
                        <FaPlay />
                      )}

                    </span>

                  </button>

                  {/* SONG DETAILS */}

                  <div className="all-song-card-info">

                    <button
                      type="button"
                      className="all-song-info"
                      onClick={() => handlePlay(song)}
                      title={getSongTitle(song)}
                    >

                      <span className="all-song-primary-title">
                        {getSongTitle(song)}
                      </span>

                      {song.title_english &&
                        song.title_english !== song.title && (

                          <span className="all-song-english-title">
                            {song.title_english}
                          </span>

                        )}

                      <span className="all-song-artist">
                        {getArtistName(song)}
                      </span>

                    </button>

                  </div>

                  {/* THREE-DOT MENU */}

                  <div
                    className="all-song-menu-container"
                    ref={
                      menuSongId === songId
                        ? menuRef
                        : null
                    }
                  >

                    <button
                      type="button"
                      className="all-song-menu-trigger"
                      aria-label={`More options for ${getSongTitle(song)}`}
                      aria-haspopup="menu"
                      aria-expanded={
                        menuSongId === songId
                      }
                      onClick={() =>
                        setMenuSongId((current) =>
                          current === songId
                            ? null
                            : songId
                        )
                      }
                    >
                      <FaEllipsisV />
                    </button>

                    {menuSongId === songId && (

                      <div
                        className="all-song-context-menu"
                        role="menu"
                        aria-label={`Options for ${getSongTitle(song)}`}
                      >

                        {/* PLAY NOW */}

                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            handlePlay(song);
                            setMenuSongId(null);
                          }}
                        >
                          <FaPlay />
                          <span>Play Now</span>
                        </button>

                        {/* PLAY NEXT */}

                        <button
                          type="button"
                          role="menuitem"
                          onClick={() =>
                            handlePlayNext(song)
                          }
                        >
                          <FaStepForward />
                          <span>Play Next</span>
                        </button>

                        {/* ADD TO QUEUE */}

                        <button
                          type="button"
                          role="menuitem"
                          onClick={() =>
                            handleAddToQueue(song)
                          }
                        >
                          <FaPlus />
                          <span>Add to Queue</span>
                        </button>

                        <div className="all-song-menu-divider" />

                        {/* LIKE / UNLIKE */}

                        <button
                          type="button"
                          role="menuitem"
                          onClick={() =>
                            handleToggleLike(song)
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

                        {/* PLAYLIST */}

                        <button
                          type="button"
                          role="menuitem"
                          onClick={() =>
                            handleAddToPlaylist(song)
                          }
                        >
                          <FaListUl />
                          <span>Add to Playlist</span>
                        </button>

                        {/* ALBUM */}

                        {albumName && (

                          <>

                            <div className="all-song-menu-divider" />

                            <button
                              type="button"
                              role="menuitem"
                              onClick={() =>
                                handleViewAlbum(song)
                              }
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

      </section>

      {/* TOAST */}

      {notice && (

        <div
          className="all-songs-toast"
          role="status"
        >
          {notice}
        </div>

      )}

    </main>
  );
}
