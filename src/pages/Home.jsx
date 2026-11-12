
import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  FaPlay,
  FaPause,
  FaMusic,
  FaChevronRight,
  FaCompactDisc,
  FaMicrophone,
  FaPrayingHands,
  FaHeart,
  FaGlobe,
  FaListUl,
  FaExclamationCircle,
  FaBookOpen,
} from "react-icons/fa";

import API from "../services/api";
import { usePlayer } from "../context/usePlayer";
import { useLikedSongs } from "../context/LikedSongsContext";

import {
  getSongCover,
  getAlbumCover,
  getArtistImage,
  getCategoryImage,
} from "../utils/media";

import "../assets/css/home.css";

/* =========================================================
   KEERTHANA MUSIC — PREMIUM HOME
   Midnight Navy • Royal Blue • Champagne Gold
========================================================= */


const LANGUAGES = [
  "Telugu",
  "Hindi",
  "English",
  "Malayalam",
  "Kannada",
  "Tamil",
];

/* =========================================================
   DAILY BIBLE VERSES
   Public-domain KJV wording
========================================================= */

const DAILY_VERSES = [
  {
    text: "The LORD is my shepherd; I shall not want.",
    reference: "Psalm 23:1",
  },
  {
    text: "I can do all things through Christ which strengtheneth me.",
    reference: "Philippians 4:13",
  },
  {
    text: "Be still, and know that I am God.",
    reference: "Psalm 46:10",
  },
  {
    text: "The LORD is my light and my salvation; whom shall I fear?",
    reference: "Psalm 27:1",
  },
  {
    text: "Trust in the LORD with all thine heart.",
    reference: "Proverbs 3:5",
  },
  {
    text: "With God all things are possible.",
    reference: "Matthew 19:26",
  },
  {
    text: "Rejoice evermore.",
    reference: "1 Thessalonians 5:16",
  },
  {
    text: "The joy of the LORD is your strength.",
    reference: "Nehemiah 8:10",
  },
  {
    text: "God is our refuge and strength, a very present help in trouble.",
    reference: "Psalm 46:1",
  },
  {
    text: "Let everything that hath breath praise the LORD.",
    reference: "Psalm 150:6",
  },
  {
    text: "The LORD is good to all: and his tender mercies are over all his works.",
    reference: "Psalm 145:9",
  },
  {
    text: "Pray without ceasing.",
    reference: "1 Thessalonians 5:17",
  },
];

/* =========================================================
   RESPONSE HELPERS
========================================================= */

function getArray(response) {
  const data = response?.data;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.songs)) return data.songs;
  if (Array.isArray(data?.artists)) return data.artists;
  if (Array.isArray(data?.albums)) return data.albums;
  if (Array.isArray(data?.categories)) return data.categories;
  if (Array.isArray(data?.ministries)) return data.ministries;
  if (Array.isArray(data?.history)) return data.history;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.data)) return data.data;

  return [];
}

function getId(item) {
  return item?.id ?? item?.song_id ?? item?.song?.id;
}

function getSongTitle(song) {
  return (
    song?.title ||
    song?.title_english ||
    song?.name ||
    "Untitled Song"
  );
}

function getArtistName(song) {
  if (typeof song?.artist === "string") {
    return song.artist;
  }

  return (
    song?.artist_name ||
    song?.artist?.name ||
    "Unknown Artist"
  );
}

function getEntityName(item) {
  return (
    item?.name ||
    item?.title ||
    item?.category_name ||
    "Untitled"
  );
}

function normalizeText(value) {
  return String(value || "").trim().toLowerCase();
}

function getSongLanguage(song) {
  return normalizeText(song?.language || "Telugu");
}

function getSongMoods(song) {
  const moods = song?.moods;

  if (Array.isArray(moods)) {
    return moods.map(normalizeText);
  }

  if (typeof moods === "string") {
    return moods.split(",").map(normalizeText);
  }

  return [];
}

function sortNewestFirst(items) {
  return [...items].sort((a, b) => {
    const dateA = new Date(
      a?.created_at || a?.createdAt || 0
    ).getTime();

    const dateB = new Date(
      b?.created_at || b?.createdAt || 0
    ).getTime();

    if (dateA && dateB && dateA !== dateB) {
      return dateB - dateA;
    }

    return Number(getId(b) || 0) - Number(getId(a) || 0);
  });
}

function isFeatured(song) {
  return (
    song?.featured === true ||
    song?.featured === 1 ||
    song?.featured === "true"
  );
}

function unwrapSong(item) {
  return item?.song || item;
}

function uniqueSongs(items) {
  const seen = new Set();

  return items.filter((song) => {
    const id = getId(song);

    if (id == null) return false;

    const key = String(id);

    if (seen.has(key)) return false;

    seen.add(key);
    return true;
  });
}

/* =========================================================
   MADE FOR YOU RECOMMENDATION ENGINE
   Frontend only — no new backend endpoint required
========================================================= */

function buildRecommendations(
  allSongs,
  likedSongs,
  recentlyPlayed
) {
  const liked = likedSongs.map(unwrapSong);
  const history = recentlyPlayed.map(unwrapSong);

  const preferenceSongs = [...liked, ...history];

  if (!preferenceSongs.length) {
    return sortNewestFirst(allSongs)
      .filter((song) => !isFeatured(song))
      .slice(0, 12);
  }

  const preferredLanguages = new Set(
    preferenceSongs.map(getSongLanguage)
  );

  const preferredArtists = new Set(
    preferenceSongs.map((song) =>
      normalizeText(getArtistName(song))
    )
  );

  const preferredMoods = new Set(
    preferenceSongs.flatMap(getSongMoods)
  );

  const preferredCategories = new Set(
    preferenceSongs.map((song) =>
      normalizeText(
        song?.category_name || song?.category?.name
      )
    ).filter(Boolean)
  );

  const excludedIds = new Set(
    preferenceSongs.map((song) => String(getId(song)))
  );

  return allSongs
    .filter((song) => {
      const id = getId(song);
      return id != null && !excludedIds.has(String(id));
    })
    .map((song) => {
      let score = 0;

      if (preferredLanguages.has(getSongLanguage(song))) {
        score += 3;
      }

      if (
        preferredArtists.has(
          normalizeText(getArtistName(song))
        )
      ) {
        score += 2;
      }

      if (
        preferredCategories.has(
          normalizeText(
            song?.category_name || song?.category?.name
          )
        )
      ) {
        score += 2;
      }

      const songMoods = getSongMoods(song);

      if (
        songMoods.some((mood) => preferredMoods.has(mood))
      ) {
        score += 3;
      }

      if (isFeatured(song)) {
        score += 1;
      }

      return { song, score };
    })
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      return (
        new Date(b.song?.created_at || 0).getTime() -
        new Date(a.song?.created_at || 0).getTime()
      );
    })
    .slice(0, 12)
    .map((item) => item.song);
}

/* =========================================================
   HOME COMPONENT
========================================================= */

export default function Home() {
  const navigate = useNavigate();
  const player = usePlayer();

  const {
    playSong,
    currentSong,
    isPlaying,
  } = player;

  const {
    likedSongs = [],
    loading: likedLoading = false,
  } = useLikedSongs();

  const [songs, setSongs] = useState([]);
  const [artists, setArtists] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [categories, setCategories] = useState([]);
  const [ministries, setMinistries] = useState([]);

  const [ministriesError, setMinistriesError] = useState("");
  const [recentlyPlayed, setRecentlyPlayed] = useState([]);
  const [worshipSongs, setWorshipSongs] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* =======================================================
     LOAD HOMEPAGE DATA
  ======================================================= */

  const loadHomeData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const results = await Promise.allSettled([
        API.get("/songs"),
        API.get("/artists"),
        API.get("/albums"),
        API.get("/categories"),
        API.get("/ministries"),
        API.get("/history"),
        API.get("/moods/worship/songs"),
      ]);

      const [
        songsResult,
        artistsResult,
        albumsResult,
        categoriesResult,
        ministriesResult,
        historyResult,
        worshipResult,
      ] = results;

      /* SONGS */

      if (songsResult.status === "fulfilled") {
        setSongs(getArray(songsResult.value));
      } else {
        console.error("Songs API error:", songsResult.reason);
        setSongs([]);
        setError("Unable to load songs. Please try again.");
      }

      /* ARTISTS */

      if (artistsResult.status === "fulfilled") {
        setArtists(getArray(artistsResult.value));
      } else {
        console.error("Artists API error:", artistsResult.reason);
        setArtists([]);
      }

      /* ALBUMS */

      if (albumsResult.status === "fulfilled") {
        setAlbums(getArray(albumsResult.value));
      } else {
        console.error("Albums API error:", albumsResult.reason);
        setAlbums([]);
      }

      /* CATEGORIES */

      if (categoriesResult.status === "fulfilled") {
        setCategories(getArray(categoriesResult.value));
      } else {
        console.error(
          "Categories API error:",
          categoriesResult.reason
        );
        setCategories([]);
      }

      /* MINISTRIES */

      if (ministriesResult.status === "fulfilled") {
        const ministryData = getArray(ministriesResult.value);

        setMinistries(ministryData);
        setMinistriesError("");

        console.log("Ministries loaded:", ministryData);
      } else {
        console.error(
          "Ministries API error:",
          ministriesResult.reason
        );

        setMinistries([]);
        setMinistriesError("Unable to load ministries.");
      }

      /* LISTENING HISTORY */

      if (historyResult.status === "fulfilled") {
        const history = getArray(historyResult.value);

        const historySongs = history
          .map(unwrapSong)
          .filter((song) => getId(song));

        setRecentlyPlayed(uniqueSongs(historySongs));
      } else {
        console.error(
          "History API error:",
          historyResult.reason
        );

        setRecentlyPlayed([]);
      }

      /* WORSHIP SONGS */

      if (worshipResult.status === "fulfilled") {
        setWorshipSongs(getArray(worshipResult.value));
      } else {
        console.error(
          "Worship API error:",
          worshipResult.reason
        );

        setWorshipSongs([]);
      }
    } catch (err) {
      console.error("Home loading error:", err);

      setError(
        "Something went wrong while loading your music."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHomeData();
  }, [loadHomeData]);

  /* =======================================================
     DERIVED DATA
  ======================================================= */

  const newestSongs = useMemo(
    () => sortNewestFirst(songs),
    [songs]
  );

  const recentlyAdded = useMemo(
    () => newestSongs.slice(0, 12),
    [newestSongs]
  );

  const featuredSongs = useMemo(
    () => newestSongs.filter(isFeatured).slice(0, 12),
    [newestSongs]
  );

  const popularArtists = useMemo(
    () => artists.slice(0, 8),
    [artists]
  );

  const popularAlbums = useMemo(
    () => albums.slice(0, 8),
    [albums]
  );

  const likedSongList = useMemo(
    () =>
      uniqueSongs(
        likedSongs
          .map(unwrapSong)
          .filter((song) => getId(song))
      ),
    [likedSongs]
  );

  const madeForYou = useMemo(
    () =>
      buildRecommendations(
        newestSongs,
        likedSongList,
        recentlyPlayed
      ),
    [newestSongs, likedSongList, recentlyPlayed]
  );

  const dailyWorshipSongs = useMemo(() => {
    const source =
      worshipSongs.length > 0
        ? worshipSongs
        : featuredSongs;

    return uniqueSongs(source).slice(0, 12);
  }, [worshipSongs, featuredSongs]);

  const dailyVerse = useMemo(() => {
    const today = new Date();

    const dayNumber = Math.floor(
      Date.UTC(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
      ) / 86400000
    );

    return DAILY_VERSES[
      dayNumber % DAILY_VERSES.length
    ];
  }, []);

  /* =======================================================
     PLAYBACK
  ======================================================= */

  const handlePlaySong = useCallback(
    (song, list = songs) => {
      if (!song || !getId(song)) return;

      const songId = String(getId(song));
      const currentId = String(getId(currentSong) ?? "");

      if (songId === currentId) {
        if (typeof player.togglePlayPause === "function") {
          player.togglePlayPause();
          return;
        }

        if (isPlaying) {
          if (typeof player.pauseSong === "function") {
            player.pauseSong();
            return;
          }

          if (typeof player.pause === "function") {
            player.pause();
            return;
          }

          if (typeof player.togglePlayback === "function") {
            player.togglePlayback();
            return;
          }

          return;
        }

        if (typeof player.resumeSong === "function") {
          player.resumeSong();
          return;
        }

        if (typeof player.resume === "function") {
          player.resume();
          return;
        }
      }

      if (typeof playSong === "function") {
        playSong(song, list);
      }
    },
    [songs, currentSong, isPlaying, player, playSong]
  );

  /* =======================================================
     NAVIGATION
  ======================================================= */

  const openSong = useCallback(
    (song) => {
      const id = getId(song);

      if (id) {
        navigate(`/songs/${id}`);
      }
    },
    [navigate]
  );

  const openArtist = useCallback(
    (artist) => {
      if (artist?.id) {
        navigate(`/artists/${artist.id}`);
      } else {
        navigate(
          `/search?q=${encodeURIComponent(getEntityName(artist))}`
        );
      }
    },
    [navigate]
  );

  const openAlbum = useCallback(
    (album) => {
      if (album?.id) {
        navigate(`/albums/${album.id}`);
      } else {
        navigate(
          `/search?q=${encodeURIComponent(getEntityName(album))}`
        );
      }
    },
    [navigate]
  );

  const openCategory = useCallback(
    (category) => {
      const id = category?.id;

      if (!id) {
        console.error("Category ID is missing:", category);
        return;
      }

      navigate(`/categories/${id}`);
    },
    [navigate]
  );

  const openMinistry = useCallback(
    (ministry) => {
      const id = ministry?.id ?? ministry?.ministry_id;

      if (!id) {
        console.error("Ministry ID missing:", ministry);
        return;
      }

      navigate(`/ministries/${id}`);
    },
    [navigate]
  );

  const openLanguage = useCallback(
    (language) => {
      navigate(`/search?q=${encodeURIComponent(language)}`);
    },
    [navigate]
  );


  const handleStartListening = useCallback(() => {
    const firstSong =
      recentlyPlayed[0] ||
      likedSongList[0] ||
      madeForYou[0] ||
      newestSongs[0];

    if (!firstSong) {
      navigate("/search");
      return;
    }

    const list = recentlyPlayed.length
      ? recentlyPlayed
      : likedSongList.length
        ? likedSongList
        : madeForYou.length
          ? madeForYou
          : newestSongs;

    handlePlaySong(firstSong, list);
  }, [
    recentlyPlayed,
    likedSongList,
    madeForYou,
    newestSongs,
    handlePlaySong,
    navigate,
  ]);

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <main className="home-page">
        <div className="home-loading" role="status">
          <div className="home-loading-orbit">
            <div className="home-loading-spinner" />
            <FaMusic className="home-loading-note" />
          </div>

          <h2>Preparing your worship experience</h2>
          <p>Getting your music ready...</p>
        </div>
      </main>
    );
  }

  /* =======================================================
     HOMEPAGE
  ======================================================= */

  return (
    <main className="home-page">
      <div className="home-content">

        {error && (
          <div className="home-error" role="alert">
            <FaExclamationCircle />
            <span>{error}</span>

            <button type="button" onClick={loadHomeData}>
              Retry
            </button>
          </div>
        )}

   
 
{/* ================================================
    PUBLIC WELCOME BANNER
================================================ */}

<section className="home-welcome-banner">
  <div className="home-welcome-content">
    <span className="home-welcome-eyebrow">
      TELUGU CHRISTIAN MUSIC • PRAISE • WORSHIP
    </span>

    <h1>
      Welcome to KEERTHANA MUSIC
    </h1>

    <p>
      Discover Christian songs, worship, praise and
      inspiring music in Telugu and other languages.
      Find songs that encourage faith, bring hope
      and help you spend meaningful moments in worship.
    </p>

    <button
      type="button"
      className="home-welcome-button"
      onClick={() => navigate("/all-songs")}
    >
      <FaPlay />
      Explore Songs
      <FaChevronRight />
    </button>
  </div>

  <div className="home-welcome-art" aria-hidden="true">
    <FaMusic />
    <FaPrayingHands />
  </div>
</section>

{/* ================================================
    DAILY BIBLE VERSE
================================================ */}

<section
  className="home-bible-card"
  aria-labelledby="home-bible-heading"
>
  <div className="home-bible-content">
    <span
      className="home-bible-label"
      id="home-bible-heading"
    >
      DAILY WORD OF GOD
    </span>

    <blockquote>
      “{dailyVerse.text}”
    </blockquote>

    <p className="home-bible-reference">
      — {dailyVerse.reference}
    </p>

    <button
      type="button"
      className="home-bible-button"
      onClick={() => navigate("/about-us")}
    >
      <FaBookOpen />
      Grow in Faith
      <FaChevronRight />
    </button>
  </div>

  <FaBookOpen
    className="home-bible-decoration"
    aria-hidden="true"
  />
</section>

        {/* =================================================
            1. RECENTLY PLAYED
        ================================================= */}

        <HomeSection
          title="Recently Played"
          subtitle="Return to the songs that stay with you"
          icon={<FaMusic />}
          onViewAll={() => navigate("/history")}
        >
          {recentlyPlayed.length > 0 ? (
            <div className="home-square-song-grid">
              {recentlyPlayed.slice(0, 12).map((song, index) => (
                <SongCard
                  key={getId(song) ?? `recent-${index}`}
                  song={song}
                  songs={recentlyPlayed}
                  onPlay={handlePlaySong}
                  onOpen={openSong}
                  currentSong={currentSong}
                  isPlaying={isPlaying}
                  clickToPlay
                />
              ))}
            </div>
          ) : (
            <EmptySection message="Your listening history will appear here after you play some songs." />
          )}
        </HomeSection>

        {/* =================================================
            2. LIKED SONGS
        ================================================= */}

        <HomeSection
          title="Your Liked Songs"
          subtitle="The worship songs you love"
          icon={<FaHeart />}
          onViewAll={() => navigate("/liked-songs")}
        >
          {likedSongList.length > 0 ? (
            <div className="home-square-song-grid">
              {likedSongList.slice(0, 12).map((song, index) => (
                <SongCard
                  key={getId(song) ?? `liked-${index}`}
                  song={song}
                  songs={likedSongList}
                  onPlay={handlePlaySong}
                  onOpen={openSong}
                  currentSong={currentSong}
                  isPlaying={isPlaying}
                  clickToPlay
                />
              ))}
            </div>
          ) : (
            <EmptySection
              message={
                likedLoading
                  ? "Loading your liked songs..."
                  : "Songs you like will appear here. Explore music and tap the heart icon."
              }
            />
          )}
        </HomeSection>

        {/* =================================================
            3. MADE FOR YOU
        ================================================= */}

        <HomeSection
          title="Made for You"
          subtitle="Music inspired by your listening taste"
          icon={<FaHeart />}
          onViewAll={() => navigate("/search")}
        >
          {madeForYou.length > 0 ? (
            <div className="home-square-song-grid">
              {madeForYou.map((song, index) => (
                <SongCard
                  key={getId(song) ?? `recommended-${index}`}
                  song={song}
                  songs={madeForYou}
                  onPlay={handlePlaySong}
                  onOpen={openSong}
                  currentSong={currentSong}
                  isPlaying={isPlaying}
                  clickToPlay
                />
              ))}
            </div>
          ) : (
            <EmptySection message="More personalized recommendations will appear as you listen to music." />
          )}
        </HomeSection>

      

        {/* =================================================
            5. RECENTLY ADDED
        ================================================= */}

        <HomeSection
          title="Recently Added"
          subtitle="Fresh additions to your music collection"
          icon={<FaCompactDisc />}
          onViewAll={() => navigate("/recently-added")}
        >
          {recentlyAdded.length > 0 ? (
            <div className="home-square-song-grid">
              {recentlyAdded.map((song, index) => (
                <SongCard
                  key={getId(song) ?? `added-${index}`}
                  song={song}
                  songs={newestSongs}
                  onPlay={handlePlaySong}
                  onOpen={openSong}
                  currentSong={currentSong}
                  isPlaying={isPlaying}
                  clickToPlay
                />
              ))}
            </div>
          ) : (
            <EmptySection message="New songs will appear here when available." />
          )}
        </HomeSection>

       
        {/* =================================================
            7. ARTISTS
        ================================================= */}

        <HomeSection
          title="Artists to Discover"
          subtitle="Voices behind the songs you love"
          icon={<FaMicrophone />}
          onViewAll={() => navigate("/artists")}
        >
          {popularArtists.length > 0 ? (
            <div className="home-card-grid home-artist-grid">
              {popularArtists.map((artist, index) => (
                <EntityCard
                  key={artist.id ?? `artist-${index}`}
                  title={getEntityName(artist)}
                  subtitle="View artist"
                  image={getArtistImage(artist)}
                  fallbackIcon={<FaMicrophone />}
                  className="home-artist-card"
                  onClick={() => openArtist(artist)}
                />
              ))}
            </div>
          ) : (
            <EmptySection message="Artists will appear here when available." />
          )}
        </HomeSection>

        {/* =================================================
            8. ALBUMS
        ================================================= */}

        <HomeSection
          title="Albums for Your Playlist"
          subtitle="Discover collections of Christian music"
          icon={<FaCompactDisc />}
          onViewAll={() => navigate("/albums")}
        >
          {popularAlbums.length > 0 ? (
            <div className="home-card-grid home-album-grid">
              {popularAlbums.map((album, index) => (
                <EntityCard
                  key={album.id ?? `album-${index}`}
                  title={getEntityName(album)}
                  subtitle={
                    album.artist_name ||
                    album.artist?.name ||
                    "Open album"
                  }
                  image={getAlbumCover(album)}
                  fallbackIcon={<FaCompactDisc />}
                  className="home-album-card"
                  onClick={() => openAlbum(album)}
                />
              ))}
            </div>
          ) : (
            <EmptySection message="Albums will appear here when available." />
          )}
        </HomeSection>

        {/* =================================================
            9. EXPLORE MINISTRIES
        ================================================= */}

        <HomeSection
          title="Explore Ministries"
          subtitle="Discover Christian music from different ministries"
          icon={<FaPrayingHands />}
          onViewAll={() => navigate("/ministries")}
        >
          {ministriesError ? (
            <div className="home-empty" role="alert">
              <p>{ministriesError}</p>

              <button
                type="button"
                onClick={loadHomeData}
                className="home-view-all"
              >
                Retry
              </button>
            </div>
          ) : ministries.length > 0 ? (
            <div className="home-card-grid home-category-grid">
              {ministries.slice(0, 8).map((ministry, index) => {
                const image =
                  ministry?.image_url ||
                  ministry?.image ||
                  ministry?.logo ||
                  ministry?.profile_image ||
                  null;

                return (
                  <EntityCard
                    key={
                      ministry?.id ??
                      ministry?.ministry_id ??
                      `ministry-${index}`
                    }
                    title={
                      ministry?.name ||
                      ministry?.title ||
                      "Unnamed Ministry"
                    }
                    subtitle="Explore music"
                    image={image}
                    fallbackIcon={<FaPrayingHands />}
                    className="home-ministry-card"
                    onClick={() => openMinistry(ministry)}
                  />
                );
              })}
            </div>
          ) : (
            <EmptySection message="No ministries have been added yet." />
          )}
        </HomeSection>

        {/* =================================================
            10. CATEGORIES
        ================================================= */}

        <HomeSection
          title="Explore Categories"
          subtitle="Find music by collection and theme"
          icon={<FaListUl />}
          onViewAll={() => navigate("/categories")}
        >
          {categories.length > 0 ? (
            <div className="home-card-grid home-category-grid">
              {categories.slice(0, 8).map((category, index) => (
                <EntityCard
                  key={category.id ?? `category-${index}`}
                  title={getEntityName(category)}
                  subtitle="Explore collection"
                  image={getCategoryImage(category)}
                  fallbackIcon={<FaMusic />}
                  className="home-category-card"
                  onClick={() => openCategory(category)}
                />
              ))}
            </div>
          ) : (
            <EmptySection message="Categories will appear here when available." />
          )}
        </HomeSection>

        {/* =================================================
            11. LANGUAGES
        ================================================= */}

        <HomeSection
          title="Music in Your Language"
          subtitle="Explore worship from across languages"
          icon={<FaGlobe />}
        >
          <div className="home-card-grid home-language-grid">
            {LANGUAGES.map((language, index) => (
              <button
                type="button"
                key={language}
                className="home-entity-card home-language-card"
                onClick={() => openLanguage(language)}
                style={{ "--language-index": index }}
              >
                <div className="home-language-art">
                  <span className="home-language-symbol">
                    {language === "Telugu"
                      ? "తె"
                      : language === "Hindi"
                        ? "हि"
                        : language === "Malayalam"
                          ? "മ"
                          : language === "Kannada"
                            ? "ಕ"
                            : language === "Tamil"
                              ? "த"
                              : "Aa"}
                  </span>

                  <FaGlobe className="home-language-globe" />
                </div>

                <div className="home-entity-info">
                  <h3>{language}</h3>
                  <p>Explore music</p>
                </div>

                <span className="home-card-arrow">
                  <FaChevronRight />
                </span>
              </button>
            ))}
          </div>
        </HomeSection>

      </div>
    </main>
  );
}

/* =========================================================
   SECTION HEADER
========================================================= */

function HomeSection({
  title,
  subtitle,
  icon,
  onViewAll,
  children,
}) {
  return (
    <section className="home-section">
      <div className="home-section-header">
        <div className="home-section-heading">
          <span className="home-section-icon">{icon}</span>

          <div className="home-section-titles">
            <h2>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
        </div>

        {onViewAll && (
          <button
            type="button"
            className="home-view-all"
            onClick={onViewAll}
          >
            <span>View all</span>
            <FaChevronRight />
          </button>
        )}
      </div>

      {children}
    </section>
  );
}

/* =========================================================
   SONG CARD
========================================================= */

function SongCard({
  song,
  songs,
  onPlay,
  onOpen,
  currentSong,
  isPlaying,
  clickToPlay = false,
}) {
  const id = getId(song);
  const title = getSongTitle(song);
  const artist = getArtistName(song);

  const activeSong =
    String(getId(currentSong) ?? "") === String(id ?? "");

  const playingThisSong = activeSong && isPlaying;

  const handleCardClick = () => {
    if (clickToPlay) {
      onPlay(song, songs);
    } else {
      onOpen(song);
    }
  };

  const handlePlayClick = (event) => {
    event.stopPropagation();
    onPlay(song, songs);
  };

  return (
    <article
      className={`home-song-card ${activeSong ? "is-active" : ""}`}
      role="button"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={(event) => {
        if (event.target !== event.currentTarget) return;

        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          handleCardClick();
        }
      }}
      aria-label={`${clickToPlay ? "Play" : "Open"} ${title} by ${artist}`}
    >
      <div className="home-song-image">
        <img
          src={getSongCover(song)}
          alt=""
          loading="lazy"
          onError={(event) => {
            event.currentTarget.style.opacity = "0";
          }}
        />

        <button
          type="button"
          className="home-song-play"
          onClick={handlePlayClick}
          aria-label={
            playingThisSong
              ? `Pause ${title}`
              : `Play ${title}`
          }
        >
          {playingThisSong ? <FaPause /> : <FaPlay />}
        </button>

        {activeSong && (
          <span
            className="home-song-active-indicator"
            aria-label={
              playingThisSong ? "Now playing" : "Selected song"
            }
          >
            <span />
            <span />
            <span />
          </span>
        )}
      </div>

      <div className="home-song-info">
        <h3 title={title}>{title}</h3>
        <p title={artist}>{artist}</p>
      </div>

      <span className="home-song-row-arrow" aria-hidden="true">
        <FaChevronRight />
      </span>
    </article>
  );
}

/* =========================================================
   ARTIST / ALBUM / CATEGORY / MINISTRY CARD
========================================================= */

function EntityCard({
  title,
  subtitle,
  image,
  fallbackIcon,
  className = "",
  onClick,
}) {
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [image]);

  return (
    <button
      type="button"
      className={`home-entity-card ${className}`}
      onClick={onClick}
      aria-label={`${title}. ${subtitle || ""}`}
    >
      <div className="home-entity-image">
        {image && !imageFailed ? (
          <img
            src={image}
            alt=""
            loading="lazy"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <span className="home-entity-fallback">
            {fallbackIcon || <FaMusic />}
          </span>
        )}

        <span className="home-entity-image-glow" />
      </div>

      <div className="home-entity-info">
        <h3 title={title}>{title}</h3>
        <p title={subtitle}>{subtitle}</p>
      </div>

      <span className="home-card-arrow" aria-hidden="true">
        <FaChevronRight />
      </span>
    </button>
  );
}

/* =========================================================
   EMPTY STATE
========================================================= */

function EmptySection({ message }) {
  return (
    <div className="home-empty">
      <span className="home-empty-icon">
        <FaMusic />
      </span>

      <p>{message}</p>
    </div>
  );
}
