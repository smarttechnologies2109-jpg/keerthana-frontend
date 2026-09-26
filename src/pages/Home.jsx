import {
  useEffect,
  useState,
} from "react";

import {
  FaPlay,
  FaMicrophone,
  FaCompactDisc,
  FaChevronRight,
  FaMusic,
} from "react-icons/fa";

import {
  useNavigate,
} from "react-router-dom";

import API from "../services/api";

import {
  usePlayer,
} from "../context/PlayerContext";

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

  /* =====================================================
     NAVIGATION
  ===================================================== */

  const navigate = useNavigate();


  /* =====================================================
     PLAYER
  ===================================================== */

  const {
    playSong,
  } = usePlayer();


  /* =====================================================
     STATE
  ===================================================== */

  const [songs, setSongs] =
    useState([]);

  const [artists, setArtists] =
    useState([]);

  const [albums, setAlbums] =
    useState([]);

  const [
    recentlyPlayed,
    setRecentlyPlayed,
  ] =
    useState([]);

  const [
    continueListening,
    setContinueListening,
  ] =
    useState([]);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    error,
    setError,
  ] =
    useState("");


  /* =====================================================
     LOAD HOME DATA
  ===================================================== */

  useEffect(() => {

    let active = true;


    /* ===================================================
       NORMALIZE HISTORY SONGS
    =================================================== */

    const normalizeHistorySongs = (
      items = []
    ) => {

      return items

        .map((item) => {

          if (
            item?.song &&
            typeof item.song === "object"
          ) {

            return {

              ...item.song,

              played_at:
                item.played_at ||
                item.updated_at ||
                item.song.played_at ||
                null,

            };

          }

          return item;

        })

        .filter(
          (song) =>
            song &&
            song.id
        );

    };


    /* ===================================================
       DEDUPE SONGS
    =================================================== */

    const dedupeSongs = (
      items = [],
      limit = 6
    ) => {

      const unique =
        new Map();


      for (
        const song of items
      ) {

        if (
          song?.id &&
          !unique.has(
            song.id
          )
        ) {

          unique.set(
            song.id,
            song
          );

        }

      }


      return Array
        .from(
          unique.values()
        )
        .slice(
          0,
          limit
        );

    };


    /* ===================================================
       LOAD HOME
    =================================================== */

    const loadHome = async ({
      showLoader = false,
    } = {}) => {

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
        ] =
          await Promise.all([

            API.get(
              "/songs"
            ),

            API.get(
              "/artists"
            ),

            API.get(
              "/albums"
            ),

            API.get(
              "/history"
            ).catch(() => ({

              data: {
                history: [],
              },

            })),

            API.get(
              "/history/continue"
            ).catch(() => ({

              data: {
                songs: [],
              },

            })),

          ]);


        if (!active) {

          return;

        }


        /* ===============================================
           SONGS
        =============================================== */

        setSongs(
          songsResponse
            .data
            .songs || []
        );


        /* ===============================================
           ARTISTS
        =============================================== */

        setArtists(
          artistsResponse
            .data
            .artists || []
        );


        /* ===============================================
           ALBUMS
        =============================================== */

        setAlbums(
          albumsResponse
            .data
            .albums || []
        );


        /* ===============================================
           HISTORY
        =============================================== */

        const historyData =
          historyResponse
            .data
            .history ||

          historyResponse
            .data
            .songs ||

          historyResponse
            .data
            .recently_played ||

          [];


        setRecentlyPlayed(

          dedupeSongs(

            normalizeHistorySongs(
              historyData
            ),

            6

          )

        );


        /* ===============================================
           CONTINUE LISTENING
        =============================================== */

        const continueData =
          continueResponse
            .data
            .songs ||

          continueResponse
            .data
            .history ||

          continueResponse
            .data
            .continue_listening ||

          [];


        const validContinueSongs =
          normalizeHistorySongs(
            continueData
          )
            .filter(
              (song) => {

                const progress =
                  Number(
                    song.progress_seconds
                  ) || 0;


                const songDuration =
                  Number(
                    song.duration
                  ) || 0;


                return (

                  song.completed !==
                  true &&

                  progress > 5 &&

                  (
                    songDuration <= 0 ||

                    progress <
                      songDuration
                  )

                );

              }
            );


        setContinueListening(

          dedupeSongs(

            validContinueSongs,

            6

          )

        );

      } catch (error) {

        if (!active) {

          return;

        }


        console.error(
          "Home loading error:",
          error
        );


        setError(
          "Unable to load KEERTHANA"
        );

      } finally {

        if (
          active &&
          showLoader
        ) {

          setLoading(false);

        }

      }

    };


    /* ===================================================
       INITIAL LOAD
    =================================================== */

    loadHome({
      showLoader: true,
    });


    /* ===================================================
       REFRESH ON WINDOW FOCUS
    =================================================== */

    const handleWindowFocus =
      () => {

        loadHome();

      };


    /* ===================================================
       REFRESH ON VISIBILITY
    =================================================== */

    const handleVisibilityChange =
      () => {

        if (
          document.visibilityState ===
          "visible"
        ) {

          loadHome();

        }

      };


    window.addEventListener(
      "focus",
      handleWindowFocus
    );


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

  const latestSongs =
    songs.slice(
      0,
      8
    );


  const featuredSongs =
    songs.filter(
      (song) =>
        song.featured === true
    );


  const displayFeatured =
    featuredSongs.length > 0

      ? featuredSongs.slice(
          0,
          6
        )

      : songs.slice(
          0,
          6
        );


  const homeArtists =
    artists.slice(
      0,
      6
    );


  const homeAlbums =
    albums.slice(
      0,
      6
    );


  /* =====================================================
     CATEGORIES

     IMPORTANT:
     Backend should return:

     category_id
     category_name
     category_image_url

     or:

     category_image
  ===================================================== */

  const categoryMap =
    new Map();


  songs.forEach(
    (song) => {

      if (
        !song.category_id ||
        !song.category_name
      ) {

        return;

      }


      if (
        !categoryMap.has(
          song.category_id
        )
      ) {

        categoryMap.set(

          song.category_id,

          {

            id:
              song.category_id,

            name:
              song.category_name,

            image_url:
              song.category_image_url ||
              song.category_image ||
              null,

          }

        );

      }

    }
  );


  const categories =
    Array
      .from(
        categoryMap.values()
      )
      .slice(
        0,
        8
      );


  /* =====================================================
     PLAY FIRST SONG
  ===================================================== */

  const handleHeroPlay =
    () => {

      if (
        songs.length === 0
      ) {

        return;

      }


      playSong(
        songs[0],
        songs
      );

    };


  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {

    return (

      <div className="home-page">

        <div className="home-loading">

          <div className="loading-logo">

            ♪

          </div>


          <h2>

            KEERTHANA

          </h2>


          <p>

            Loading Christian Music...

          </p>

        </div>

      </div>

    );

  }


  /* =====================================================
     HOME PAGE
  ===================================================== */

  return (

    <div className="home-page">


      {/* =================================================
          HERO
      ================================================= */}

      <section className="keerthana-hero">


        <div className="hero-content">


          <span className="hero-small">

            WELCOME TO

          </span>


          <h1>

            KEERTHANA

          </h1>


          <h2>

            Christian Music

          </h2>


          <p>

            Worship • Praise • Listen

          </p>


          {songs.length > 0 && (

            <button
              type="button"

              className="hero-play"

              onClick={
                handleHeroPlay
              }
            >

              <FaPlay />

              Play Music

            </button>

          )}


        </div>


        <div className="hero-decoration">

          <div className="hero-circle">

            <FaMusic />

          </div>

        </div>


      </section>


      {/* =================================================
          ERROR
      ================================================= */}

      {error && (

        <div className="home-error">

          {error}

        </div>

      )}


      {/* =================================================
          FEATURED WORSHIP
      ================================================= */}

      {displayFeatured.length > 0 && (

        <HomeSection

          title="Featured Worship"

          subtitle="Songs selected for you"

        >

          <div className="home-card-grid">

            {displayFeatured.map(
              (song) => (

                <SongCard

                  key={song.id}

                  song={song}

                  queue={
                    displayFeatured
                  }

                  playSong={
                    playSong
                  }

                  navigate={
                    navigate
                  }

                />

              )
            )}

          </div>

        </HomeSection>

      )}


      {/* =================================================
          RECENTLY PLAYED
      ================================================= */}

      {recentlyPlayed.length > 0 && (

        <HomeSection

          title="Recently Played"

          subtitle="Continue with songs you listened to recently"

        >

          <div className="home-card-grid">

            {recentlyPlayed.map(
              (song) => (

                <SongCard

                  key={
                    `recent-${song.id}`
                  }

                  song={song}

                  queue={
                    recentlyPlayed
                  }

                  playSong={
                    playSong
                  }

                  navigate={
                    navigate
                  }

                />

              )
            )}

          </div>

        </HomeSection>

      )}


      {/* =================================================
          CONTINUE LISTENING
      ================================================= */}

      {continueListening.length > 0 && (

        <HomeSection

          title="Continue Listening"

          subtitle="Pick up where you left off"

        >

          <div className="continue-listening-grid">

            {continueListening.map(
              (song) => (

                <ContinueListeningCard

                  key={
                    `continue-${song.id}`
                  }

                  song={song}

                  queue={
                    continueListening
                  }

                  playSong={
                    playSong
                  }

                  navigate={
                    navigate
                  }

                />

              )
            )}

          </div>

        </HomeSection>

      )}


      {/* =================================================
          LATEST SONGS
      ================================================= */}

      {latestSongs.length > 0 && (

        <HomeSection

          title="Latest Songs"

          subtitle="New music on KEERTHANA"

          action={() =>
            navigate(
              "/search"
            )
          }

        >

          <div className="latest-song-list">

            {latestSongs.map(
              (song, index) => (

                <LatestSongRow

                  key={song.id}

                  song={song}

                  index={index}

                  songs={
                    latestSongs
                  }

                  playSong={
                    playSong
                  }

                  navigate={
                    navigate
                  }

                />

              )
            )}

          </div>

        </HomeSection>

      )}


      {/* =================================================
          ARTISTS
      ================================================= */}

      {homeArtists.length > 0 && (

        <HomeSection

          title="Popular Artists"

          subtitle="Christian worship artists"

          action={() =>
            navigate(
              "/artists"
            )
          }

        >

          <div className="home-artist-grid">

            {homeArtists.map(
              (artist) => {

                const image =
                  getArtistImage(
                    artist
                  );


                return (

                  <button

                    type="button"

                    className="home-artist-card"

                    key={
                      artist.id
                    }

                    onClick={() =>
                      navigate(
                        `/artists/${artist.id}`
                      )
                    }

                  >

                    <div className="home-artist-image">

                      <img
                        src={image}

                        alt={
                          artist.name
                        }

                        onError={(event) => {

                          event.currentTarget.onerror =
                            null;

                          event.currentTarget.src =
                            "/images/default-artist.png";

                        }}

                      />

                    </div>


                    <h3>

                      {artist.name}

                    </h3>


                    <span>

                      Artist

                    </span>


                  </button>

                );

              }
            )}

          </div>

        </HomeSection>

      )}


      {/* =================================================
          ALBUMS
      ================================================= */}

      {homeAlbums.length > 0 && (

        <HomeSection

          title="Albums"

          subtitle="Christian music collections"

          action={() =>
            navigate(
              "/albums"
            )
          }

        >

          <div className="home-card-grid">

            {homeAlbums.map(
              (album) => {

                const cover =
                  getAlbumCover(
                    album
                  );


                return (

                  <button

                    type="button"

                    className="home-album-card"

                    key={
                      album.id
                    }

                    onClick={() =>
                      navigate(
                        `/albums/${album.id}`
                      )
                    }

                  >

                    <div className="home-album-cover">

                      <img

                        src={cover}

                        alt={
                          album.title
                        }

                        onError={(event) => {

                          event.currentTarget.onerror =
                            null;

                          event.currentTarget.src =
                            "/images/default-album.png";

                        }}

                      />

                    </div>


                    <h3>

                      {album.title}

                    </h3>


                    <p>

                      {album.artist_name ||
                        "KEERTHANA"}

                    </p>


                    <span>

                      {album.song_count || 0}

                      {" "}

                      Songs

                    </span>


                  </button>

                );

              }
            )}

          </div>

        </HomeSection>

      )}


      {/* =================================================
          CATEGORIES
      ================================================= */}

      {categories.length > 0 && (

        <HomeSection

          title="Browse Categories"

          subtitle="Find music for every moment"

        >

          <div className="category-grid">

            {categories.map(
              (category) => {

                const image =
                  getCategoryImage(
                    category
                  );


                return (

                  <button

                    type="button"

                    className="category-card"

                    key={
                      category.id
                    }

                    onClick={() =>
                      navigate(
                        `/search?q=${encodeURIComponent(
                          category.name
                        )}`
                      )
                    }

                  >

                    {/* CATEGORY IMAGE */}

                    <div className="category-image">

                      <img

                        src={image}

                        alt={
                          category.name
                        }

                        onError={(event) => {

                          event.currentTarget.onerror =
                            null;

                          event.currentTarget.src =
                            "/images/default-category.png";

                        }}

                      />

                    </div>


                    <strong>

                      {category.name}

                    </strong>


                    <span>

                      Explore

                    </span>


                  </button>

                );

              }
            )}

          </div>

        </HomeSection>

      )}


      {/* =================================================
          EMPTY DATABASE
      ================================================= */}

      {!error &&

        songs.length === 0 &&

        artists.length === 0 &&

        albums.length === 0 && (

          <div className="home-empty">

            <FaMusic />

            <h2>

              Welcome to KEERTHANA

            </h2>

            <p>

              Add songs, artists and albums
              to start your Christian music
              library.

            </p>

          </div>

        )}

    </div>

  );

}


/* =====================================================
   HOME SECTION
===================================================== */

function HomeSection({
  title,
  subtitle,
  action,
  children,
}) {

  return (

    <section className="home-section">

      <div className="home-section-heading">

        <div>

          <h2>

            {title}

          </h2>


          {subtitle && (

            <p>

              {subtitle}

            </p>

          )}

        </div>


        {action && (

          <button

            type="button"

            onClick={
              action
            }

          >

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
  queue,
  playSong,
  navigate,
}) {

  const cover =
    getSongCover(
      song
    );


  const openSongDetails =
    () => {

      navigate(
        `/songs/${song.id}`
      );

    };


  const handlePlay =
    (event) => {

      event.stopPropagation();


      playSong(
        song,
        queue
      );

    };


  const handleKeyDown =
    (event) => {

      if (
        event.key === "Enter" ||
        event.key === " "
      ) {

        event.preventDefault();

        openSongDetails();

      }

    };


  return (

    <div

      className="home-song-card"

      onClick={
        openSongDetails
      }

      onKeyDown={
        handleKeyDown
      }

      role="button"

      tabIndex={0}

    >

      <div className="home-song-cover">

        <img

          src={cover}

          alt={
            song.title
          }

          onError={(event) => {

            event.currentTarget.onerror =
              null;

            event.currentTarget.src =
              "/images/default-cover.png";

          }}

        />


        <button

          type="button"

          className="home-card-play"

          onClick={
            handlePlay
          }

          aria-label={
            `Play ${song.title}`
          }

        >

          <FaPlay />

        </button>

      </div>


      <div className="home-song-info">

        <h3>

          {song.title}

        </h3>


        {song.title_english && (

          <p className="home-english-title">

            {song.title_english}

          </p>

        )}


        <p className="home-song-artist">

          {song.artist_name ||
            "KEERTHANA"}

        </p>


        {song.category_name && (

          <span className="home-song-category">

            {song.category_name}

          </span>

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
  queue,
  playSong,
  navigate,
}) {

  const cover =
    getSongCover(
      song
    );


  const progress =
    Math.max(
      0,
      Number(
        song.progress_seconds
      ) || 0
    );


  const songDuration =
    Math.max(
      0,
      Number(
        song.duration
      ) || 0
    );


  const progressPercent =
    songDuration > 0

      ? Math.min(
          100,
          Math.max(
            0,
            (
              progress /
              songDuration
            ) * 100
          )
        )

      : 0;


  const formatProgressTime =
    (seconds) => {

      const safeSeconds =
        Math.max(
          0,
          Math.floor(
            Number(
              seconds
            ) || 0
          )
        );


      const minutes =
        Math.floor(
          safeSeconds / 60
        );


      const remainingSeconds =
        safeSeconds % 60;


      return `${minutes}:${remainingSeconds
        .toString()
        .padStart(
          2,
          "0"
        )}`;

    };


  const openSong =
    () => {

      navigate(
        `/songs/${song.id}`
      );

    };


  const handleContinue =
    (event) => {

      event.stopPropagation();


      playSong(
        song,
        queue,
        progress
      );

    };


  return (

    <div

      className="continue-card"

      onClick={
        openSong
      }

      onKeyDown={(event) => {

        if (
          event.key === "Enter" ||
          event.key === " "
        ) {

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

          alt={
            song.title ||
            "Song cover"
          }

          onError={(event) => {

            event.currentTarget.onerror =
              null;

            event.currentTarget.src =
              "/images/default-cover.png";

          }}

        />


        <button

          type="button"

          className="continue-play"

          onClick={
            handleContinue
          }

          aria-label={
            `Continue ${
              song.title ||
              "song"
            }`
          }

          title="Continue listening"

        >

          <FaPlay />

        </button>

      </div>


      <div className="continue-info">

        <h3>

          {song.title ||
            "Unknown Song"}

        </h3>


        {song.title_english && (

          <p className="continue-english-title">

            {song.title_english}

          </p>

        )}


        <p className="continue-artist">

          {song.artist_name ||
            "KEERTHANA"}

        </p>


        <div className="continue-progress">

          <div className="continue-progress-track">

            <div

              className="continue-progress-fill"

              style={{
                width:
                  `${progressPercent}%`,
              }}

            />

          </div>


          <div className="continue-progress-time">

            <span>

              {
                formatProgressTime(
                  progress
                )
              }

            </span>


            <span>

              {

                songDuration > 0

                  ? formatProgressTime(
                      songDuration
                    )

                  : "--:--"

              }

            </span>

          </div>

        </div>


        <button

          type="button"

          className="continue-button"

          onClick={
            handleContinue
          }

        >

          <FaPlay />

          <span>

            Continue

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
  playSong,
  navigate,
}) {

  const cover =
    getSongCover(
      song
    );


  const openSong =
    () => {

      navigate(
        `/songs/${song.id}`
      );

    };


  const handlePlay =
    (event) => {

      event.stopPropagation();


      playSong(
        song,
        songs
      );

    };


  return (

    <div

      className="latest-song-row"

      onClick={
        openSong
      }

      role="button"

      tabIndex={0}

      onKeyDown={(event) => {

        if (
          event.key === "Enter" ||
          event.key === " "
        ) {

          event.preventDefault();

          openSong();

        }

      }}

    >

      {/* NUMBER */}

      <span className="latest-number">

        {index + 1}

      </span>


      {/* COVER */}

      <div className="latest-cover">

        <img

          src={cover}

          alt={
            song.title
          }

          onError={(event) => {

            event.currentTarget.onerror =
              null;

            event.currentTarget.src =
              "/images/default-cover.png";

          }}

        />


        <button

          type="button"

          onClick={
            handlePlay
          }

          aria-label={
            `Play ${song.title}`
          }

        >

          <FaPlay />

        </button>

      </div>


      {/* SONG INFO */}

      <div className="latest-info">

        <strong>

          {song.title}

        </strong>


        {song.title_english && (

          <span className="latest-english-title">

            {song.title_english}

          </span>

        )}


        <button

          type="button"

          onClick={(event) => {

            event.stopPropagation();


            if (
              song.artist_id
            ) {

              navigate(
                `/artists/${song.artist_id}`
              );

            }

          }}

        >

          {song.artist_name ||
            "KEERTHANA"}

        </button>

      </div>


      {/* ALBUM */}

      <button

        type="button"

        className="latest-album"

        onClick={(event) => {

          event.stopPropagation();


          if (
            song.album_id
          ) {

            navigate(
              `/albums/${song.album_id}`
            );

          }

        }}

      >

        {song.album_title ||

          song.category_name ||

          "Christian Music"}

      </button>


      {/* PLAY */}

      <button

        type="button"

        className="latest-play"

        onClick={
          handlePlay
        }

        aria-label={
          `Play ${song.title}`
        }

      >

        <FaPlay />

      </button>

    </div>

  );

}


export default Home;