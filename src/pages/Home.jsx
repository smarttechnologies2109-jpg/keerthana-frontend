
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
  FaSun,
  FaDove,
  FaHandsHelping,
  FaGlobe,
  FaListUl,
  FaExclamationCircle,
  FaHeadphones,
  FaArrowRight,
} from "react-icons/fa";

import API from "../services/api";
import { usePlayer } from "../context/usePlayer";
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

const MOODS = [
  { name: "Worship", icon: FaPrayingHands, color: "mood-worship" },
  { name: "Praise", icon: FaHeart, color: "mood-praise" },
  { name: "Prayer", icon: FaHandsHelping, color: "mood-prayer" },
  { name: "Hope", icon: FaSun, color: "mood-hope" },
  { name: "Peace", icon: FaDove, color: "mood-peace" },
  {
    name: "Thanksgiving",
    icon: FaHeart,
    color: "mood-thanksgiving",
  },
];

const LANGUAGES = [
  "Telugu",
  "Hindi",
  "English",
  "Malayalam",
  "Kannada",
  "Tamil",
];

/* =========================================================
   RESPONSE HELPERS
========================================================= */

function getArray(response) {
  const data = response?.data;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.songs)) return data.songs;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.artists)) return data.artists;
  if (Array.isArray(data?.albums)) return data.albums;
  if (Array.isArray(data?.categories)) return data.categories;
  if (Array.isArray(data?.history)) return data.history;

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

  const [songs, setSongs] = useState([]);
  const [artists, setArtists] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [categories, setCategories] = useState([]);
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
        API.get("/history"),
        API.get("/moods/worship/songs"),
      ]);

      const [
        songsResult,
        artistsResult,
        albumsResult,
        categoriesResult,
        historyResult,
        worshipResult,
      ] = results;

      if (songsResult.status === "fulfilled") {
        setSongs(getArray(songsResult.value));
      } else {
        setError("Unable to load songs. Please try again.");
      }

      if (artistsResult.status === "fulfilled") {
        setArtists(getArray(artistsResult.value));
      } else {
        setArtists([]);
      }

      if (albumsResult.status === "fulfilled") {
        setAlbums(getArray(albumsResult.value));
      } else {
        setAlbums([]);
      }

      if (categoriesResult.status === "fulfilled") {
        setCategories(getArray(categoriesResult.value));
      } else {
        setCategories([]);
      }

      if (historyResult.status === "fulfilled") {
        const history = getArray(historyResult.value);

        const historySongs = history
          .map((item) => item?.song || item)
          .filter((song) => getId(song));

        const uniqueSongs = [];
        const seen = new Set();

        for (const song of historySongs) {
          const id = String(getId(song));

          if (!seen.has(id)) {
            seen.add(id);
            uniqueSongs.push(song);
          }
        }

        setRecentlyPlayed(uniqueSongs);
      } else {
        setRecentlyPlayed([]);
      }

      if (worshipResult.status === "fulfilled") {
        setWorshipSongs(getArray(worshipResult.value));
      } else {
        setWorshipSongs([]);
      }
    } catch {
      setError("Something went wrong while loading your music.");
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
    () => artists.slice(0, 12),
    [artists]
  );

  const popularAlbums = useMemo(
    () => albums.slice(0, 12),
    [albums]
  );

  /* =======================================================
     PLAYBACK
  ======================================================= */

  
const handlePlaySong = useCallback(
  (song, list = songs) => {
    if (!song || !getId(song)) return;

    const songId = String(getId(song));
    const currentId = String(getId(currentSong) ?? "");

    // Clicking the currently playing song toggles playback.
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

      // If the song is paused, use the player's resume method
      // when available to preserve its current position.
      if (typeof player.resumeSong === "function") {
        player.resumeSong();
        return;
      }

      if (typeof player.resume === "function") {
        player.resume();
        return;
      }

      // Fall through to playSong if no resume method is exposed.
    }

    // A different song was selected: start that song.
    if (typeof playSong === "function") {
      playSong(song, list);
    }
  },
  [songs, currentSong, isPlaying, player, playSong]
);


  const handleStartListening = useCallback(() => {
    const firstSong =
      recentlyPlayed[0] ||
      featuredSongs[0] ||
      newestSongs[0];

    if (firstSong) {
      const playList = recentlyPlayed.length
        ? recentlyPlayed
        : featuredSongs.length
          ? featuredSongs
          : newestSongs;

      handlePlaySong(firstSong, playList);
      return;
    }

    navigate("/search");
  }, [
    recentlyPlayed,
    featuredSongs,
    newestSongs,
    handlePlaySong,
    navigate,
  ]);

  /* =======================================================
     NAVIGATION
  ======================================================= */

  const openSong = useCallback(
    (song) => {
      const id = getId(song);

      if (id) navigate(`/songs/${id}`);
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

  const openCategory = (category) => {
  const categoryId = category?.id;

  if (!categoryId) {
    console.error("Category ID is missing:", category);
    return;
  }

  navigate(`/categories/${categoryId}`);
};

  const openLanguage = useCallback(
    (language) => {
      navigate(`/search?q=${encodeURIComponent(language)}`);
    },
    [navigate]
  );

  const openMood = useCallback(
    (mood) => {
      navigate(`/moods/${mood.toLowerCase()}`);
    },
    [navigate]
  );

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

      

       

        {/* 1. RECENTLY PLAYED */}

       
{/* 1. RECENTLY PLAYED */}

{/* =========================================================
    1. RECENTLY PLAYED
========================================================= */}

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
          showPlayButton
        />
      ))}
    </div>
  ) : (
    <EmptySection message="Your listening history will appear here after you play some songs." />
  )}
</HomeSection>

{/* =========================================================
    2. RECENTLY ADDED
========================================================= */}

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
          showPlayButton
        />
      ))}
    </div>
  ) : (
    <EmptySection message="New songs will appear here when available." />
  )}
</HomeSection>


        {/* 3. BROWSE MOODS */}

        <HomeSection
          title="Browse Moods"
          subtitle="Find the right song for every moment"
          icon={<FaHeart />}
        >
          <div className="home-card-grid home-mood-grid">
            {MOODS.map((mood, index) => {
              const MoodIcon = mood.icon;

              return (
                <button
                  type="button"
                  key={mood.name}
                  className={`home-entity-card home-mood-card ${mood.color}`}
                  onClick={() => openMood(mood.name)}
                  aria-label={`Browse ${mood.name} songs`}
                  style={{ "--mood-index": index }}
                >
                  <div className="home-mood-art">
                    <span className="home-mood-number">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <MoodIcon />
                    <span className="home-mood-glow" />
                  </div>

                  <div className="home-entity-info">
                    <h3>{mood.name}</h3>
                    <p>Explore songs</p>
                  </div>

                  <span className="home-card-arrow">
                    <FaChevronRight />
                  </span>
                </button>
              );
            })}
          </div>
        </HomeSection>

        {/* 4. FEATURED WORSHIP */}

        <HomeSection
          title="Featured Worship"
          subtitle="Songs selected to lift your heart"
          icon={<FaPrayingHands />}
          onViewAll={() => navigate("/moods/worship")}
        >
          {featuredSongs.length > 0 ? (
            <div className="home-card-grid home-song-grid home-featured-grid">
              {featuredSongs.map((song) => (
                <SongCard
                  key={getId(song)}
                  song={song}
                  songs={featuredSongs}
                  onPlay={handlePlaySong}
                  onOpen={openSong}
                  currentSong={currentSong}
                  isPlaying={isPlaying}
                  clickToPlay
                />
              ))}
            </div>
          ) : (
            <EmptySection message="Featured songs will appear here when selected by your admin." />
          )}
        </HomeSection>

        {/* 5. POPULAR ARTISTS */}

        <HomeSection
          title="Artists to discover"
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

        {/* 6. POPULAR ALBUMS */}

        <HomeSection
          title="Albums for your playlist"
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

        {/* 7. BROWSE BY LANGUAGE */}

        <HomeSection
          title="Music in your language"
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

        {/* 8. BROWSE CATEGORIES */}

        <HomeSection
          title="Explore categories"
          subtitle="Find music by collection and theme"
          icon={<FaListUl />}
          onViewAll={() => navigate("/categories")}
         >
          {categories.length > 0 ? (
            <div className="home-card-grid home-category-grid">
              {categories.map((category, index) => (
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
   SONG ROW
========================================================= */

function SongCard({
  song,
  songs,
  onPlay,
  onOpen,
  currentSong,
  isPlaying,
  clickToPlay = false,
  showPlayButton = true,
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



    if (activeSong && isPlaying) {
      if (typeof playerPauseFallback === "function") {
        playerPauseFallback();
      }
      return;
    }

    onPlay(song, songs);
  };

  /*
   * Playback pause behavior belongs to the existing player context.
   * This row uses the existing playSong callback without assuming
   * a pause method name that may not exist in your context.
   */
  const playerPauseFallback = null;

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
    activeSong && isPlaying
      ? `Pause ${title}`
      : `Play ${title}`
  }
>
  {playingThisSong ? <FaPause /> : <FaPlay />}
</button>


        {activeSong && (
          <span
            className="home-song-active-indicator"
            aria-label={playingThisSong ? "Now playing" : "Selected song"}
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
   ARTIST / ALBUM / CATEGORY CARD
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
