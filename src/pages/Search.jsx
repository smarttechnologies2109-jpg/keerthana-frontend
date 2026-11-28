

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



import { getSongCover } from "../utils/media";



import "../assets/css/search.css";



/* =====================================================

   SONG TITLE HELPERS

===================================================== */



const getSongTitles = (song) => {

  const hasTeluguScript = (value) => /[\u0C00-\u0C7F]/.test(String(value || ""));



  const englishCandidates = [

    song?.title_english,

    song?.titleEnglish,

    song?.english_title,

    song?.englishTitle,

    song?.title,

    song?.name,

  ];



  const englishTitle = englishCandidates.find(

    (value) =>

      typeof value === "string" &&

      value.trim() &&

      !hasTeluguScript(value)

  );



  const teluguCandidates = [

    song?.title_telugu,

    song?.titleTelugu,

    song?.title_native,

    song?.title,

    song?.name,

  ];



  const teluguTitle = teluguCandidates.find(

    (value) =>

      typeof value === "string" &&

      value.trim() &&

      hasTeluguScript(value)

  );



  const primary = String(englishTitle || "Untitled Song").trim();

  const secondary = String(teluguTitle || "").trim();



  return {

    primary,

    secondary: secondary && secondary !== primary ? secondary : "",

  };

};



/* =====================================================

   TEXT NORMALIZATION

===================================================== */



const normalizeText = (value) =>

  String(value ?? "")

    .normalize("NFC")

    .toLocaleLowerCase()

    .trim();




const SEARCH_LANGUAGES = [
  "All Languages",
  "Telugu",
  "Hindi",
  "English",
  "Malayalam",
  "Kannada",
  "Tamil",
];

const normalizeLanguage = (value) => {
  const normalized = normalizeText(value);
  const match = SEARCH_LANGUAGES.find(
    (language) => normalizeText(language) === normalized
  );
  return match && match !== "All Languages" ? match : "";
};

const getSongLanguage = (song) =>
  normalizeLanguage(song?.language || song?.song_language || song?.language_name);

/* =====================================================

   ARTIST

===================================================== */



const hasTeluguScript = (value) =>
  /[\u0C00-\u0C7F]/.test(String(value ?? ""));

const getArtistName = (song, artistsById = {}) => {
  const candidates = [];

  // Support both direct artist arrays and the song_artists join-table response.
  if (Array.isArray(song?.artists)) candidates.push(...song.artists);
  if (Array.isArray(song?.song_artists)) candidates.push(...song.song_artists);

  if (Array.isArray(song?.artist)) {
    candidates.push(...song.artist);
  } else if (song?.artist && typeof song.artist === "object") {
    candidates.push(song.artist);
  }

  if (Array.isArray(song?.artist_ids)) candidates.push(...song.artist_ids);

  // Keep the legacy single-artist ID as a fallback.
  if (!candidates.length) {
    const legacyId = song?.artist_id ?? song?.artistId;
    if (legacyId != null) candidates.push(legacyId);
  }

  const names = [];

  const addName = (value) => {
    if (
      typeof value !== "string" ||
      !value.trim() ||
      hasTeluguScript(value)
    ) return;

    const cleanName = value.trim();
    if (!names.some((name) => name.toLowerCase() === cleanName.toLowerCase())) {
      names.push(cleanName);
    }
  };

  candidates.forEach((candidate) => {
    if (candidate == null) return;

    // Join-table records may look like:
    // { artist_id: 17, artist: { id: 17, name_english: "..." } }
    const nested =
      typeof candidate === "object" && candidate.artist &&
      typeof candidate.artist === "object"
        ? candidate.artist
        : {};

    const candidateId =
      typeof candidate === "object"
        ? candidate.id ??
          candidate.artist_id ??
          nested.id ??
          nested.artist_id
        : typeof candidate === "number" ||
            /^\d+$/.test(String(candidate).trim())
          ? candidate
          : null;

    const linkedArtist =
      candidateId != null ? artistsById[String(candidateId)] || {} : {};

    const artistObjects = [
      typeof candidate === "object" ? candidate : {},
      nested,
      linkedArtist,
    ];

    artistObjects.forEach((artist) => {
      addName(
        artist.name_english ||
          artist.english_name ||
          artist.artist_name_english ||
          artist.englishName ||
          artist.nameEnglish
      );
    });

    if (typeof candidate === "string" && candidateId == null) {
      // Legacy artist names are shown only when they are English.
      addName(candidate);
    }
  });

  // Support older API responses that expose a single English artist field.
  if (!names.length) {
    const artistObject =
      song?.artist && typeof song.artist === "object" ? song.artist : {};
    const nestedArtist =
      song?.artist_details && typeof song.artist_details === "object"
        ? song.artist_details
        : song?.artistDetails && typeof song.artistDetails === "object"
          ? song.artistDetails
          : {};

    addName(
      song?.artist_name_english ||
        song?.artist_english ||
        song?.artist_english_name ||
        song?.artist_name_en ||
        song?.artistEnglishName ||
        song?.artistNameEnglish ||
        song?.artistEnglish ||
        artistObject.name_english ||
        artistObject.english_name ||
        artistObject.artist_name_english ||
        artistObject.englishName ||
        artistObject.nameEnglish ||
        nestedArtist.name_english ||
        nestedArtist.english_name ||
        nestedArtist.nameEnglish ||
        nestedArtist.englishName ||
        (typeof song?.artist === "string" ? song.artist : "") ||
        song?.artist_name ||
        song?.artistName
    );

    const legacyId =
      song?.artist_id ??
      song?.artistId ??
      artistObject.id ??
      artistObject.artist_id ??
      nestedArtist.id;

    if (!names.length && legacyId != null) {
      const linkedArtist = artistsById[String(legacyId)] || {};
      addName(
        linkedArtist.name_english ||
          linkedArtist.english_name ||
          linkedArtist.nameEnglish
      );
    }
  }

  return names.length ? names.join(", ") : "Unknown Artist";
};/* =====================================================

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

  if (Array.isArray(data?.data?.songs)) {

    return data.data.songs;

  }



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

  const [artistsById, setArtistsById] = useState({});
  const [query, setQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("keerthana_recent_searches") || "[]");
      return Array.isArray(saved) ? saved.filter((item) => typeof item === "string").slice(0, 6) : [];
    } catch {
      return [];
    }
  });

  const [browseLanguage, setBrowseLanguage] = useState("");

  const [voiceLanguage, setVoiceLanguage] = useState("te-IN");



  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [playError, setPlayError] = useState("");

  const [menuError, setMenuError] = useState("");

  const [openMenuId, setOpenMenuId] = useState(null);




  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) return undefined;

    const timeout = window.setTimeout(() => {
      setRecentSearches((previous) => {
        const next = [term, ...previous.filter((item) => item.toLowerCase() !== term.toLowerCase())].slice(0, 6);
        try {
          localStorage.setItem("keerthana_recent_searches", JSON.stringify(next));
        } catch (error) {
          console.warn("Could not save recent searches:", error);
        }
        return next;
      });
    }, 900);

    return () => window.clearTimeout(timeout);
  }, [query]);

  const clearRecentSearches = () => {
    setRecentSearches([]);
    try {
      localStorage.removeItem("keerthana_recent_searches");
    } catch (error) {
      console.warn("Could not clear recent searches:", error);
    }
  };

  const menuRef = useRef(null);



  /* ===================================================

     LOAD SONGS

  =================================================== */



  const loadSongs = useCallback(async () => {

    try {

      setLoading(true);

      setError("");



      const response = await API.get("/songs");
      const songs = getSongList(response?.data);

      // /songs can return artist_id without the English artist name.
      // Match that ID against the /artists endpoint as a fallback.
      try {
        const artistsResponse = await API.get("/artists");
        const artistsPayload = artistsResponse?.data;
        const artistList = Array.isArray(artistsPayload)
          ? artistsPayload
          : Array.isArray(artistsPayload?.artists)
            ? artistsPayload.artists
            : Array.isArray(artistsPayload?.data)
              ? artistsPayload.data
              : Array.isArray(artistsPayload?.data?.artists)
                ? artistsPayload.data.artists
                : [];

        const lookup = {};
        artistList.forEach((artist) => {
          const artistId = artist?.id ?? artist?.artist_id;
          const englishName =
            artist?.name_english ||
            artist?.english_name ||
            artist?.nameEnglish;

          if (
            artistId != null &&
            typeof englishName === "string" &&
            englishName.trim() &&
            !hasTeluguScript(englishName)
          ) {
            lookup[String(artistId)] = {
              ...artist,
              name_english: englishName.trim(),
            };
          }
        });
        setArtistsById(lookup);
      } catch (artistError) {
        console.warn("Search page could not load artist fallback list:", artistError);
        setArtistsById({});
      }

      setAllSongs(songs);

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

    const params = new URLSearchParams(

      window.location.search

    );



    const requestedLanguage = normalizeLanguage(
      params.get("language") || params.get("lang") || ""
    );
    const initialQuery = params.get("q");

    if (requestedLanguage) {
      setBrowseLanguage(requestedLanguage);
    } else if (initialQuery && normalizeLanguage(initialQuery)) {
      setBrowseLanguage(normalizeLanguage(initialQuery));
    } else if (initialQuery) {
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



    document.addEventListener(

      "mousedown",

      handleOutsideClick

    );



    document.addEventListener(

      "keydown",

      handleEscape

    );



    return () => {

      document.removeEventListener(

        "mousedown",

        handleOutsideClick

      );



      document.removeEventListener(

        "keydown",

        handleEscape

      );

    };

  }, [openMenuId]);



  /* ===================================================

     SORT SONGS

  =================================================== */



  const sortedSongs = useMemo(() => {

    const collator = new Intl.Collator("en", {

      sensitivity: "base",

      numeric: true,

    });



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



      return collator.compare(

        String(titleA),

        String(titleB)

      );

    });

  }, [allSongs]);



  /* ===================================================

     SEARCH FILTER

  =================================================== */



  const filteredSongs = useMemo(() => {
    const term = normalizeText(query);

    return sortedSongs.filter((song) => {
      const songLanguage = getSongLanguage(song);

      if (browseLanguage && songLanguage !== normalizeText(browseLanguage)) {
        return false;
      }

      if (!term) return Boolean(browseLanguage);

      const moods = Array.isArray(song?.moods)
        ? song.moods.join(" ")
        : typeof song?.moods === "string"
          ? song.moods
          : "";

      const fields = [
        getSongTitles(song).primary,
        getSongTitles(song).secondary,
        getArtistName(song, artistsById),
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
  }, [sortedSongs, query, artistsById, browseLanguage]);

  /* ===================================================

     VOICE SEARCH

  =================================================== */



  const handleVoiceSearch = useCallback(

    (spokenText) => {

      const searchText = String(

        spokenText || ""

      ).trim();



      if (!searchText) return;



      setQuery(searchText);

      setPlayError("");

      setMenuError("");

      setOpenMenuId(null);

    },

    []

  );



  /* ===================================================

     PLAY / PAUSE SONG

  =================================================== */



  const handlePlaySong = useCallback(

    async (song) => {

      if (!song?.audio_url) {

        setPlayError(

          "Audio is not available for this song."

        );

        return;

      }



      setPlayError("");

      setMenuError("");

      setOpenMenuId(null);



      try {

        const isCurrent =

          currentSong?.id != null &&

          song?.id != null &&

          String(currentSong.id) ===

            String(song.id);



        if (isCurrent) {

          if (typeof togglePlay === "function") {

            await togglePlay();

          } else {

            setPlayError(

              "Playback control is unavailable."

            );

          }

        } else {

          if (typeof playSong === "function") {

            await playSong(song, sortedSongs);

          } else {

            setPlayError(

              "Song playback is unavailable."

            );

          }

        }

      } catch (err) {

        console.error(

          "Search song playback error:",

          err

        );



        setPlayError(

          err?.response?.data?.message ||

            err?.message ||

            "Unable to play this song. Please try again."

        );

      }

    },

    [

      currentSong,

      playSong,

      sortedSongs,

      togglePlay,

    ]

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

            if (

              typeof player.playNext === "function"

            ) {

              await player.playNext(song);

              break;

            }



            if (

              typeof player.setQueue === "function" &&

              Array.isArray(player.queue)

            ) {

              const nextQueue = [...player.queue];



              const existingIndex =

                nextQueue.findIndex(

                  (item) =>

                    String(item?.id) ===

                    String(song?.id)

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



              nextQueue.splice(

                insertAt,

                0,

                song

              );



              player.setQueue(nextQueue);

              break;

            }



            setMenuError(

              "Play Next is not supported by your current player."

            );

            break;

          }



          case "queue":

            if (

              typeof player.addToQueue === "function"

            ) {

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

    [

      player,

      toggleLike,

      handlePlaySong,

      navigate,

    ]

  );



  /* ===================================================

     CLEAR SEARCH

  =================================================== */



  const clearSearch = useCallback(() => {

    setQuery("");
    setBrowseLanguage("");

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

            Discover worship songs, artists, albums,

            and lyrics.

          </p>

        </div>

      </header>



      {/* SEARCH BAR + VOICE SEARCH */}



      <section

        className="search-controls"

        aria-label="Song search"

      >

        <VoiceSearch

          value={query}

          language={voiceLanguage}

          onLanguageChange={setVoiceLanguage}

          onChange={(nextValue) => {

            setQuery(nextValue);

            setPlayError("");

            setMenuError("");

            setOpenMenuId(null);

          }}

          onSearch={handleVoiceSearch}

          placeholder="Search songs, artists, albums, lyrics..."

          ariaLabel="Search songs, artists, albums, and lyrics"

        />

        <div className="search-language-filter">
          <label htmlFor="search-language-select">Browse language</label>
          <select
            id="search-language-select"
            value={browseLanguage || "All Languages"}
            onChange={(event) => {
              setBrowseLanguage(normalizeLanguage(event.target.value));
              setPlayError("");
              setMenuError("");
              setOpenMenuId(null);
            }}
          >
            {SEARCH_LANGUAGES.map((language) => (
              <option key={language} value={language}>
                {language}
              </option>
            ))}
          </select>
        </div>

      </section>




      {recentSearches.length > 0 && !query.trim() && (
        <section className="search-recent-searches" aria-label="Recent searches">
          <div className="search-recent-heading">
            <h2>Recent searches</h2>
            <button type="button" onClick={clearRecentSearches}>Clear history</button>
          </div>
          <div className="search-recent-chips">
            {recentSearches.map((term) => (
              <button
                type="button"
                key={term}
                onClick={() => setQuery(term)}
                title={`Search for ${term}`}
              >
                <span>{term}</span>
              </button>
            ))}
          </div>
        </section>
      )}

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



      {!loading && !error && (query.trim() || browseLanguage) && (

        <section className="search-results-section">



          <div className="search-results-header">

            <div>

              <h2>{browseLanguage ? `${browseLanguage} Songs` : "Search Results"}</h2>



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



                /* ---------------------------------------

                   SONG-SPECIFIC VALUES

                --------------------------------------- */



                const {

                  primary: primaryTitle,

                  secondary: secondaryTitle,

                } = getSongTitles(song);



                const current =

                  String(currentSong?.id ?? "") ===

                  String(song?.id ?? "");



                const playing =

                  current && isPlaying;



                const menuOpen =

                  String(openMenuId ?? "") ===

                  String(song?.id ?? "");



                const liked = songIsLiked(song);



                const cover = getSongCover(song);



                /* ---------------------------------------

                   SONG CARD

                --------------------------------------- */



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

                      onClick={() =>

                        handlePlaySong(song)

                      }

                      aria-label={`${

                        playing ? "Pause" : "Play"

                      } ${primaryTitle}`}

                      title={

                        playing ? "Pause" : "Play"

                      }

                    >

                      {playing ? (

                        <FaPause />

                      ) : (

                        <FaPlay />

                      )}

                    </button>



                    {/* SONG COVER */}



                    <button

                      type="button"

                      className="search-song-cover-button"

                      onClick={() =>

                        handlePlaySong(song)

                      }

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

                          event.currentTarget.style.opacity = "0";

                        }}

                      />

                    </button>



                    {/* SONG DETAILS */}



                    <div className="search-song-info">



                      <h3 title={primaryTitle}>

                        <button

                          type="button"

                          className="search-song-title-button"

                          onClick={() =>

                            handlePlaySong(song)

                          }

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

                        {getArtistName(song, artistsById)}

                      </p>



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

                            String(previous ?? "") ===

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

                              handleMenuAction(

                                "play",

                                song

                              )

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

                                handleMenuAction(

                                  "next",

                                  song

                                )

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

                              handleMenuAction(

                                "queue",

                                song

                              )

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

                              handleMenuAction(

                                "like",

                                song

                              )

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

                              handleMenuAction(

                                "playlist",

                                song

                              )

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



      {!loading && !error && !query.trim() && !browseLanguage && (

        <section className="search-state-card search-empty">



          <div

            className="search-empty-icon"

            aria-hidden="true"

          >

            <FaSearch />

          </div>



          <h2>Find Your Favourite Worship Songs</h2>



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

              {query.trim()}". Try another spelling,

              artist name, language, or lyric.

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
