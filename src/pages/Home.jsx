import { useEffect, useState } from "react";
import {
  FaPlay,
  FaPause,
  FaChevronRight,
  FaMusic,
  FaPlus,
  FaHandPointer,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

import API from "../services/api";
import { usePlayer } from "../context/usePlayer";

import {
  getSongCover,
  getAlbumCover,
  getArtistImage,
  getCategoryImage,
} from "../utils/media";

import "../assets/css/home.css";

/* =====================================================
   HOME
===================================================== */

function Home() {
  const navigate = useNavigate();

  /* =====================================================
     PLAYER
  ===================================================== */

  const {
    currentSong,
    isPlaying,
    playSong,
    togglePlay,
    queue,
    addToQueue,
    removeFromQueue,
  } = usePlayer();

  /* =====================================================
     STATE
  ===================================================== */

  const [songs, setSongs] = useState([]);
  const [artists, setArtists] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [worshipSongs, setWorshipSongs] = useState([]);
  const [recentlyPlayed, setRecentlyPlayed] = useState([]);
  const [continueListening, setContinueListening] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* =====================================================
     LOAD HOME DATA
  ===================================================== */

  useEffect(() => {
    let active = true;

    /* Normalize history response into song objects */
    const normalizeHistorySongs = (items = []) => {
      return items
        .map((item) => {
          if (item?.song && typeof item.song === "object") {
            return {
              ...item.song,
              progress_seconds:
                item.progress_seconds ??
                item.song.progress_seconds ??
                0,
              completed:
                item.completed ??
                item.song.completed ??
                false,
              played_at:
                item.played_at ||
                item.updated_at ||
                item.song.played_at ||
                null,
            };
          }

          return item;
        })
        .filter((song) => song && song.id);
    };

    /* Remove duplicate songs */
    const dedupeSongs = (items = [], limit = 6) => {
      const unique = new Map();

      for (const song of items) {
        if (song?.id && !unique.has(String(song.id))) {
          unique.set(String(song.id), song);
        }
      }

      return Array.from(unique.values()).slice(0, limit);
    };

    /* Load all homepage sections */
    const loadHome = async ({ showLoader = false } = {}) => {
      try {
        if (showLoader) {
          setLoading(true);
        }

        setError("");

        const [
          songsResponse,
          artistsResponse,
          albumsResponse,
          historyResponse,
          continueResponse,
          worshipResponse,
        ] = await Promise.all([
          API.get("/songs"),

          API.get("/artists"),

          API.get("/albums"),

          API.get("/history").catch((err) => {
            console.error(
              "Unable to load listening history:",
              err.response?.data || err.message
            );

            return {
              data: {
                history: [],
                songs: [],
              },
            };
          }),

          API.get("/history/continue").catch((err) => {
            console.error(
              "Unable to load Continue Listening:",
              err.response?.data || err.message
            );

            return {
              data: {
                songs: [],
              },
            };
          }),

          /* NEW: Load songs assigned to the Worship mood */
          API.get("/moods/worship/songs").catch((err) => {
            console.error(
              "Unable to load Worship mood songs:",
              err.response?.data || err.message
            );

            return {
              data: {
                songs: [],
              },
            };
          }),
        ]);

        if (!active) {
          return;
        }

        /* ===============================================
           ALL SONGS
        =============================================== */

        const allSongs = Array.isArray(songsResponse?.data?.songs)
          ? songsResponse.data.songs
          : [];

        setSongs(allSongs);

        /* ===============================================
           ARTISTS
        =============================================== */

        const allArtists = Array.isArray(artistsResponse?.data?.artists)
          ? artistsResponse.data.artists
          : [];

        setArtists(allArtists);

        /* ===============================================
           ALBUMS
        =============================================== */

        const allAlbums = Array.isArray(albumsResponse?.data?.albums)
          ? albumsResponse.data.albums
          : [];

        setAlbums(allAlbums);

        /* ===============================================
           WORSHIP MOOD SONGS
        =============================================== */

        const moodSongs = Array.isArray(worshipResponse?.data?.songs)
          ? worshipResponse.data.songs
          : [];

        setWorshipSongs(moodSongs);

        /* ===============================================
           RECENTLY PLAYED
        =============================================== */

        const historyData =
          historyResponse?.data?.history ||
          historyResponse?.data?.songs ||
          historyResponse?.data?.recently_played ||
          [];

        setRecentlyPlayed(
          dedupeSongs(normalizeHistorySongs(historyData), 6)
        );

        /* ===============================================
           CONTINUE LISTENING
        =============================================== */

        const continueData =
          continueResponse?.data?.songs ||
          continueResponse?.data?.history ||
          continueResponse?.data?.continue_listening ||
          [];

        const validContinueSongs = normalizeHistorySongs(continueData).filter(
          (song) => {
            const progress = Number(song.progress_seconds) || 0;
            const songDuration = Number(song.duration) || 0;

            return (
              song.completed !== true &&
              progress > 5 &&
              (songDuration <= 0 || progress < songDuration)
            );
          }
        );

        setContinueListening(
          dedupeSongs(validContinueSongs, 6)
        );
      } catch (err) {
        if (!active) {
          return;
        }

        console.error(
          "KEERTHANA Home loading error:",
          err.response?.data || err
        );

        setError("Unable to load KEERTHANA. Please try again.");
      } finally {
        if (active && showLoader) {
          setLoading(false);
        }
      }
    };

    /* Initial load */
    loadHome({ showLoader: true });

    /* Refresh when user returns to the window */
    const handleWindowFocus = () => {
      loadHome();
    };

    /* Refresh when the tab becomes visible */
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        loadHome();
      }
    };

    window.addEventListener("focus", handleWindowFocus);

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    return () => {
      active = false;

      window.removeEventListener(
        "focus",
        handleWindowFocus
      );

      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );
    };
  }, []);

  /* =====================================================
     DERIVED DATA
  ===================================================== */

  const latestSongs = songs.slice(0, 8);

  const featuredSongs = songs.filter(
    (song) => song.featured === true
  );

  const displayFeatured =
    featuredSongs.length > 0
      ? featuredSongs.slice(0, 6)
      : songs.slice(0, 6);

  const homeArtists = artists.slice(0, 6);
  const homeAlbums = albums.slice(0, 6);

  /* =====================================================
     CATEGORIES
  ===================================================== */

  const categoryMap = new Map();

  songs.forEach((song) => {
    if (!song.category_id || !song.category_name) {
      return;
    }

    if (!categoryMap.has(song.category_id)) {
      categoryMap.set(song.category_id, {
        id: song.category_id,
        name: song.category_name,
        image_url:
          song.category_image_url ||
          song.category_image ||
          null,
      });
    }
  });

  const categories = Array.from(categoryMap.values()).slice(0, 8);

  /* =====================================================
     HERO PLAY BUTTON
  ===================================================== */

  const handleHeroPlay = () => {
    if (songs.length === 0) {
      return;
    }

    const isCurrent =
      Number(currentSong?.id) === Number(songs[0]?.id);

    if (isCurrent) {
      togglePlay();
      return;
    }

    playSong(songs[0], songs);
  };

  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {
    return (
      <div className="home-page">
        <div className="home-loading">
          <div className="loading-logo">♪</div>

          <h2>KEERTHANA</h2>

          <p>Loading Christian Music...</p>
        </div>
      </div>
    );
  }

  /* =====================================================
     HOME PAGE
  ===================================================== */

  return (
    <div className="home-page">
      {/* ===============================================
          HERO
      =============================================== */}

      <section className="keerthana-hero">
        <div className="hero-content">
          <span className="hero-small">WELCOME TO</span>

          <h1>KEERTHANA</h1>

          <h2>Christian Music</h2>

          <p>Worship deeply. Praise freely. Find peace in every song.</p>

          {songs.length > 0 && (
            <button
              type="button"
              className="hero-play"
              onClick={handleHeroPlay}
            >
              {Number(currentSong?.id) === Number(songs[0]?.id) &&
              isPlaying ? (
                <FaPause />
              ) : (
                <FaPlay />
              )}

              {Number(currentSong?.id) === Number(songs[0]?.id) &&
              isPlaying
                ? "Pause Music"
                : "Play Music"}
            </button>
          )}
        </div>

        <div className="hero-decoration">
          <div className="hero-circle">
            <FaMusic />
          </div>
        </div>
      </section>

      {/* ===============================================
          QUICK DISCOVERY — new visual section only
      =============================================== */}

      <section className="home-discovery-strip" aria-label="Discover Christian music">
        <div className="home-discovery-intro">
          <span className="home-eyebrow">YOUR DAILY SOUNDTRACK</span>
          <h2>Find music for this moment</h2>
          <p>Choose a mood and spend a moment in worship.</p>
        </div>
        <div className="home-mood-pills">
          {[
            { label: "Worship", emoji: "🙏", path: "/moods/worship" },
            { label: "Praise", emoji: "🙌", path: "/moods/praise" },
            { label: "Prayer", emoji: "🕊️", path: "/moods/prayer" },
            { label: "Hope", emoji: "✨", path: "/moods/hope" },
            { label: "Peace", emoji: "🌿", path: "/moods/peace" },
            { label: "Thanksgiving", emoji: "🤍", path: "/moods/thanksgiving" },
          ].map((mood) => (
            <button
              type="button"
              className="home-mood-pill"
              key={mood.label}
              onClick={() => navigate(mood.path)}
            >
              <span aria-hidden="true">{mood.emoji}</span>
              {mood.label}
              <FaChevronRight aria-hidden="true" />
            </button>
          ))}
        </div>
      </section>

      <section className="home-language-section" aria-label="Browse music by language">
        <div className="home-language-heading">
          <div>
            <span className="home-eyebrow">MUSIC THAT SPEAKS TO YOU</span>
            <h2>Browse by language</h2>
          </div>
          <span className="home-language-note">Your favourite Christian songs, in your language.</span>
        </div>
        <div className="home-language-grid">
          {[
            { label: "Telugu", code: "తె", tone: "telugu" },
            { label: "Hindi", code: "हि", tone: "hindi" },
            { label: "English", code: "EN", tone: "english" },
            { label: "Malayalam", code: "മ", tone: "malayalam" },
            { label: "Kannada", code: "ಕ", tone: "kannada" },
            { label: "Tamil", code: "த", tone: "tamil" },
          ].map((language) => (
            <button
              type="button"
              className={`home-language-card ${language.tone}`}
              key={language.label}
              onClick={() => navigate(`/search?q=${encodeURIComponent(language.label)}`)}
              aria-label={`Explore ${language.label} Christian songs`}
            >
              <span className="home-language-symbol" aria-hidden="true">{language.code}</span>
              <span className="home-language-name">{language.label}</span>
              <span className="home-language-action">Explore music <FaChevronRight aria-hidden="true" /></span>
            </button>
          ))}
        </div>
      </section>

      {/* ===============================================
          ERROR
      =============================================== */}

      {error && (
        <div className="home-error" role="alert">
          {error}
        </div>
      )}

      {/* ===============================================
          FEATURED WORSHIP
      =============================================== */}

      {displayFeatured.length > 0 && (
        <HomeSection
          title="Featured Worship"
          subtitle="Songs selected for you"
        >
          <div className="home-card-grid">
            {displayFeatured.map((song) => (
              <SongCard
                key={song.id}
                song={song}
                queue={queue}
                playerQueue={displayFeatured}
                playSong={playSong}
                togglePlay={togglePlay}
                currentSong={currentSong}
                isPlaying={isPlaying}
                addToQueue={addToQueue}
                navigate={navigate}
              />
            ))}
          </div>
        </HomeSection>
      )}

      {/* ===============================================
          NEW: WORSHIP MOOD SONGS
      =============================================== */}

      <HomeSection
        title="Worship"
        subtitle="Songs assigned to your Worship mood"
        action={() => navigate("/moods/worship")}
      >
        {worshipSongs.length > 0 ? (
          <div className="home-card-grid">
            {worshipSongs.slice(0, 6).map((song) => (
              <SongCard
                key={`worship-${song.id}`}
                song={song}
                queue={queue}
                playerQueue={worshipSongs}
                playSong={playSong}
                togglePlay={togglePlay}
                currentSong={currentSong}
                isPlaying={isPlaying}
                addToQueue={addToQueue}
                navigate={navigate}
              />
            ))}
          </div>
        ) : (
          <div className="home-mood-empty">
            <FaMusic className="home-mood-empty-icon" />

            <div className="home-mood-empty-content">
              <h3>No Worship songs yet</h3>

              <p>
                Songs assigned to the Worship mood will appear here.
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate("/moods/worship")}
            >
              Explore Worship
              <FaChevronRight />
            </button>
          </div>
        )}
      </HomeSection>

      {/* ===============================================
          RECENTLY PLAYED
      =============================================== */}

      {recentlyPlayed.length > 0 && (
        <HomeSection
          title="Recently Played"
          subtitle="Continue with songs you listened to recently"
        >
          <div className="home-card-grid">
            {recentlyPlayed.map((song) => (
              <SongCard
                key={`recent-${song.id}`}
                song={song}
                queue={queue}
                playerQueue={recentlyPlayed}
                playSong={playSong}
                togglePlay={togglePlay}
                currentSong={currentSong}
                isPlaying={isPlaying}
                addToQueue={addToQueue}
                navigate={navigate}
              />
            ))}
          </div>
        </HomeSection>
      )}

      {/* ===============================================
          CONTINUE LISTENING
      =============================================== */}

      {continueListening.length > 0 && (
        <HomeSection
          title="Continue Listening"
          subtitle="Pick up where you left off"
        >
          <div className="continue-listening-grid">
            {continueListening.map((song) => (
              <ContinueListeningCard
                key={`continue-${song.id}`}
                song={song}
                queue={queue}
                playQueue={continueListening}
                playSong={playSong}
                togglePlay={togglePlay}
                currentSong={currentSong}
                isPlaying={isPlaying}
                addToQueue={addToQueue}
                navigate={navigate}
              />
            ))}
          </div>
        </HomeSection>
      )}

      {/* ===============================================
          LATEST SONGS
      =============================================== */}

      {latestSongs.length > 0 && (
        <HomeSection
          title="Latest Songs"
          subtitle="New music on KEERTHANA"
          action={() => navigate("/search")}
        >
          <div className="latest-song-list">
            {latestSongs.map((song, index) => (
              <LatestSongRow
                key={song.id}
                song={song}
                index={index}
                songs={latestSongs}
                queue={queue}
                currentSong={currentSong}
                isPlaying={isPlaying}
                playSong={playSong}
                togglePlay={togglePlay}
                addToQueue={addToQueue}
                removeFromQueue={removeFromQueue}
                navigate={navigate}
              />
            ))}
          </div>
        </HomeSection>
      )}

      {/* ===============================================
          ARTISTS
      =============================================== */}

      {homeArtists.length > 0 && (
        <HomeSection
          title="Popular Artists"
          subtitle="Christian worship artists"
          action={() => navigate("/artists")}
        >
          <div className="home-artist-grid">
            {homeArtists.map((artist) => {
              const image = getArtistImage(artist);

              return (
                <button
                  type="button"
                  className="home-artist-card"
                  key={artist.id}
                  onClick={() =>
                    navigate(`/artists/${artist.id}`)
                  }
                >
                  <div className="home-artist-image">
                    <img
                      src={image}
                      alt={artist.name}
                      onError={(event) => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src =
                          "/images/default-artist.png";
                      }}
                    />
                  </div>

                  <h3>{artist.name}</h3>

                  <span>Artist</span>
                </button>
              );
            })}
          </div>
        </HomeSection>
      )}

      {/* ===============================================
          ALBUMS
      =============================================== */}

      {homeAlbums.length > 0 && (
        <HomeSection
          title="Albums"
          subtitle="Christian music collections"
          action={() => navigate("/albums")}
        >
          <div className="home-card-grid">
            {homeAlbums.map((album) => {
              const cover = getAlbumCover(album);

              return (
                <button
                  type="button"
                  className="home-album-card"
                  key={album.id}
                  onClick={() =>
                    navigate(`/albums/${album.id}`)
                  }
                >
                  <div className="home-album-cover">
                    <img
                      src={cover}
                      alt={album.title}
                      onError={(event) => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src =
                          "/images/default-album.png";
                      }}
                    />
                  </div>

                  <h3>{album.title}</h3>

                  <p>{album.artist_name || "KEERTHANA"}</p>

                  <span>{album.song_count || 0} Songs</span>
                </button>
              );
            })}
          </div>
        </HomeSection>
      )}

      {/* ===============================================
          CATEGORIES
      =============================================== */}

      {categories.length > 0 && (
        <HomeSection
          title="Browse Categories"
          subtitle="Find music for every moment"
        >
          <div className="category-grid">
            {categories.map((category) => {
              const image = getCategoryImage(category);

              return (
                <button
                  type="button"
                  className="category-card"
                  key={category.id}
                  onClick={() =>
                    navigate(
                      `/search?q=${encodeURIComponent(category.name)}`
                    )
                  }
                >
                  <div className="category-image">
                    <img
                      src={image}
                      alt={category.name}
                      onError={(event) => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src =
                          "/images/default-category.png";
                      }}
                    />
                  </div>

                  <strong>{category.name}</strong>

                  <span>Explore</span>
                </button>
              );
            })}
          </div>
        </HomeSection>
      )}

      {/* ===============================================
          EMPTY DATABASE
      =============================================== */}

      {!error &&
        songs.length === 0 &&
        artists.length === 0 &&
        albums.length === 0 && (
          <div className="home-empty">
            <FaMusic />

            <h2>Welcome to KEERTHANA</h2>

            <p>
              Add songs, artists and albums to start your
              Christian music library.
            </p>
          </div>
        )}
    </div>
  );
}

/* =====================================================
   HOME SECTION
===================================================== */

function HomeSection({ title, subtitle, action, children }) {
  return (
    <section className="home-section">
      <div className="home-section-heading">
        <div>
          <h2>{title}</h2>

          {subtitle && <p>{subtitle}</p>}
        </div>

        {action && (
          <button type="button" onClick={action}>
            Show All
            <FaChevronRight />
          </button>
        )}
      </div>

      {children}
    </section>
  );
}

/* =====================================================
   SONG CARD
===================================================== */

function SongCard({
  song,
  queue = [],
  playerQueue = [],
  playSong,
  togglePlay,
  currentSong,
  isPlaying,
  addToQueue,
  navigate,
}) {
  const cover = getSongCover(song);

  const isCurrent =
    Number(currentSong?.id) === Number(song?.id);

  const isCurrentPlaying = isCurrent && isPlaying;

  const isInQueue =
    Array.isArray(queue) &&
    queue.some(
      (item) => Number(item?.id) === Number(song?.id)
    );

  const openSongDetails = () => {
    navigate(`/songs/${song.id}`);
  };

  const handlePlay = (event) => {
    event.stopPropagation();

    if (isCurrent) {
      togglePlay();
      return;
    }

    playSong(song, playerQueue);
  };

  const handleAddToQueue = (event) => {
    event.stopPropagation();

    if (!addToQueue || isInQueue) {
      return;
    }

    addToQueue(song);
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openSongDetails();
    }
  };

  return (
    <div
      className="home-song-card"
      onClick={openSongDetails}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
    >
      <div className="home-song-cover">
        <img
          src={cover}
          alt={song.title}
          onError={(event) => {
            event.currentTarget.onerror = null;
            event.currentTarget.src =
              "/images/default-cover.png";
          }}
        />

        <button
          type="button"
          className={
            isCurrentPlaying
              ? "home-card-play playing"
              : "home-card-play"
          }
          onClick={handlePlay}
          aria-label={
            isCurrentPlaying
              ? `Pause ${song.title}`
              : `Play ${song.title}`
          }
          title={isCurrentPlaying ? "Pause" : "Play"}
        >
          {isCurrentPlaying ? <FaPause /> : <FaPlay />}
        </button>

        <button
          type="button"
          className={
            isInQueue
              ? "latest-queue added"
              : "latest-queue"
          }
          onClick={handleAddToQueue}
          disabled={isInQueue}
          aria-label={
            isInQueue
              ? `${song.title} is already in queue`
              : `Add ${song.title} to queue`
          }
          title={isInQueue ? "Already in queue" : "Add to queue"}
        >
          {isInQueue ? (
            <>
              <FaHandPointer />
              <span>Queued</span>
            </>
          ) : (
            <>
              <FaPlus />
              <span>Queue</span>
            </>
          )}
        </button>
      </div>

      <div className="home-song-info">
        <h3>{song.title}</h3>

        {song.title_english && (
          <p className="home-english-title">
            {song.title_english}
          </p>
        )}

        <p className="home-song-artist">
          {song.artist_name || "KEERTHANA"}
        </p>

        {song.category_name && (
          <span className="home-song-category">
            {song.category_name}
          </span>
        )}

        {isCurrent && (
          <small className="home-song-playing-status">
            {isPlaying ? "Now Playing" : "Paused"}
          </small>
        )}
      </div>
    </div>
  );
}

/* =====================================================
   CONTINUE LISTENING CARD
===================================================== */

function ContinueListeningCard({
  song,
  queue = [],
  playQueue = [],
  playSong,
  togglePlay,
  currentSong,
  isPlaying,
  addToQueue,
  navigate,
}) {
  const cover = getSongCover(song);

  const progress = Math.max(
    0,
    Number(song.progress_seconds) || 0
  );

  const songDuration = Math.max(
    0,
    Number(song.duration) || 0
  );

  const progressPercent =
    songDuration > 0
      ? Math.min(100, (progress / songDuration) * 100)
      : 0;

  const formatProgressTime = (seconds) => {
    const safeSeconds = Math.max(
      0,
      Math.floor(Number(seconds) || 0)
    );

    const minutes = Math.floor(safeSeconds / 60);
    const remainingSeconds = safeSeconds % 60;

    return `${minutes}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  };

  const isCurrent =
    Number(currentSong?.id) === Number(song?.id);

  const isCurrentPlaying = isCurrent && isPlaying;

  const openSong = () => {
    navigate(`/songs/${song.id}`);
  };

  const handleContinue = (event) => {
    event.stopPropagation();

    if (isCurrent) {
      togglePlay();
      return;
    }

    playSong(song, playQueue, progress);
  };

  const isInQueue =
    Array.isArray(queue) &&
    queue.some(
      (item) => Number(item?.id) === Number(song?.id)
    );

  const handleAddToQueue = (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (!addToQueue || isInQueue) {
      return;
    }

    addToQueue(song);
  };

  return (
    <div
      className={
        isCurrent
          ? "continue-card current"
          : "continue-card"
      }
      onClick={openSong}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openSong();
        }
      }}
      role="button"
      tabIndex={0}
    >
      <div className="continue-cover">
        <img
          src={cover}
          alt={song.title || "Song cover"}
          onError={(event) => {
            event.currentTarget.onerror = null;
            event.currentTarget.src =
              "/images/default-cover.png";
          }}
        />

        <button
          type="button"
          className={
            isCurrentPlaying
              ? "continue-play playing"
              : "continue-play"
          }
          onClick={handleContinue}
          aria-label={
            isCurrentPlaying
              ? `Pause ${song.title || "song"}`
              : `Play ${song.title || "song"}`
          }
          title={
            isCurrentPlaying
              ? "Pause"
              : "Continue listening"
          }
        >
          {isCurrentPlaying ? <FaPause /> : <FaPlay />}
        </button>

        <button
          type="button"
          className={
            isInQueue
              ? "latest-queue added"
              : "latest-queue"
          }
          onClick={handleAddToQueue}
          disabled={isInQueue}
          aria-label={
            isInQueue
              ? `${song.title} is already in queue`
              : `Add ${song.title} to queue`
          }
          title={isInQueue ? "Already in queue" : "Add to queue"}
        >
          {isInQueue ? (
            <>
              <FaHandPointer />
              <span>Queued</span>
            </>
          ) : (
            <>
              <FaPlus />
              <span>Queue</span>
            </>
          )}
        </button>
      </div>

      <div className="continue-info">
        <h3>{song.title || "Unknown Song"}</h3>

        {song.title_english && (
          <p className="continue-english-title">
            {song.title_english}
          </p>
        )}

        <p className="continue-artist">
          {song.artist_name || "KEERTHANA"}
        </p>

        <div className="continue-progress">
          <div className="continue-progress-track">
            <div
              className="continue-progress-fill"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="continue-progress-time">
            <span>{formatProgressTime(progress)}</span>

            <span>
              {songDuration > 0
                ? formatProgressTime(songDuration)
                : "--:--"}
            </span>
          </div>
        </div>

        <button
          type="button"
          className={
            isCurrentPlaying
              ? "continue-button playing"
              : "continue-button"
          }
          onClick={handleContinue}
        >
          {isCurrentPlaying ? <FaPause /> : <FaPlay />}

          <span>
            {isCurrentPlaying ? "Pause" : "Continue"}
          </span>
        </button>
      </div>
    </div>
  );
}

/* =====================================================
   LATEST SONG ROW
===================================================== */

function LatestSongRow({
  song,
  index,
  songs,
  queue = [],
  currentSong,
  isPlaying,
  playSong,
  togglePlay,
  addToQueue,
  removeFromQueue,
  navigate,
}) {
  const cover = getSongCover(song);

  const isCurrent =
    Number(currentSong?.id) === Number(song?.id);

  const isCurrentPlaying = isCurrent && isPlaying;

  const openSong = () => {
    navigate(`/songs/${song.id}`);
  };

  const handlePlay = (event) => {
    event.stopPropagation();

    if (isCurrent) {
      togglePlay();
      return;
    }

    playSong(song, songs);
  };

  const isInQueue =
    Array.isArray(queue) &&
    queue.some(
      (item) => Number(item?.id) === Number(song?.id)
    );

  const handleQueueClick = (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (isInQueue) {
      if (removeFromQueue) {
        removeFromQueue(song.id);
      }

      return;
    }

    if (addToQueue) {
      addToQueue(song);
    }
  };

  return (
    <div
      className={
        isCurrent
          ? "latest-song-row current"
          : "latest-song-row"
      }
      onClick={openSong}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openSong();
        }
      }}
    >
      <span className="latest-number">{index + 1}</span>

      <div className="latest-cover">
        <img
          src={cover}
          alt={song.title}
          onError={(event) => {
            event.currentTarget.onerror = null;
            event.currentTarget.src =
              "/images/default-cover.png";
          }}
        />

        <button
          type="button"
          className={isCurrentPlaying ? "playing" : ""}
          onClick={handlePlay}
          aria-label={
            isCurrentPlaying
              ? `Pause ${song.title}`
              : `Play ${song.title}`
          }
        >
          {isCurrentPlaying ? <FaPause /> : <FaPlay />}
        </button>
      </div>

      <div className="latest-info">
        <strong>{song.title}</strong>

        {song.title_english && (
          <span className="latest-english-title">
            {song.title_english}
          </span>
        )}

        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();

            if (song.artist_id) {
              navigate(`/artists/${song.artist_id}`);
            }
          }}
        >
          {song.artist_name || "KEERTHANA"}
        </button>

        {isCurrent && (
          <small className="latest-playing-status">
            {isPlaying ? "Now Playing" : "Paused"}
          </small>
        )}
      </div>

      <button
        type="button"
        className="latest-album"
        onClick={(event) => {
          event.stopPropagation();

          if (song.album_id) {
            navigate(`/albums/${song.album_id}`);
          }
        }}
      >
        {song.album_title ||
          song.category_name ||
          "Christian Music"}
      </button>

      <button
        type="button"
        className={
          isInQueue
            ? "latest-queue added"
            : "latest-queue"
        }
        onClick={handleQueueClick}
        aria-label={
          isInQueue
            ? `Remove ${song.title} from queue`
            : `Add ${song.title} to queue`
        }
        title={
          isInQueue
            ? "Remove from queue"
            : "Add to queue"
        }
      >
        {isInQueue ? (
          <>
            <FaHandPointer />
            <span>Queued</span>
          </>
        ) : (
          <>
            <FaPlus />
            <span>Queue</span>
          </>
        )}
      </button>

      <button
        type="button"
        className={
          isCurrentPlaying
            ? "latest-play playing"
            : "latest-play"
        }
        onClick={handlePlay}
        aria-label={
          isCurrentPlaying
            ? `Pause ${song.title}`
            : `Play ${song.title}`
        }
        title={isCurrentPlaying ? "Pause" : "Play"}
      >
        {isCurrentPlaying ? <FaPause /> : <FaPlay />}
      </button>
    </div>
  );
}

export default Home;