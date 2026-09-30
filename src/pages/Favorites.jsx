import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  FaHeart,
  FaPlay,
  FaPause,
  FaTrash,
  FaPlus,
  FaCheck,
  FaMusic,
  FaArrowLeft,
  FaSearch,
} from "react-icons/fa";

import {
  useNavigate,
} from "react-router-dom";

import {
  usePlayer,
} from "../context/usePlayer";

import {
  getFavorites,
  removeFavorite,
  addFavorite,
} from "../utils/favorites";

import {
  getSongCover,
} from "../utils/media";

import API from "../services/api";

import "../assets/css/favorites.css";


function Favorites() {

  const navigate = useNavigate();


  /* =====================================================
     GLOBAL PLAYER
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
     FAVORITES
  ===================================================== */

  const [
    favorites,
    setFavorites,
  ] = useState([]);


  /* =====================================================
     BROWSE SONGS
  ===================================================== */

  const [
    allSongs,
    setAllSongs,
  ] = useState([]);


  const [
    browseLoading,
    setBrowseLoading,
  ] = useState(false);


  const [
    browseError,
    setBrowseError,
  ] = useState("");


  const [
    searchText,
    setSearchText,
  ] = useState("");


  const [
    showBrowse,
    setShowBrowse,
  ] = useState(false);


  /* =====================================================
     LOAD FAVORITES
  ===================================================== */

  const loadFavorites = () => {

    setFavorites(
      getFavorites()
    );

  };


  /* =====================================================
     INITIAL LOAD
  ===================================================== */

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

  }, []);


  /* =====================================================
     LOAD ALL SONGS
  ===================================================== */

  const loadAllSongs = async () => {

    try {

      setBrowseLoading(true);

      setBrowseError("");


      const response =
        await API.get("/songs");


      const data =
        response.data;


      if (
        data &&
        Array.isArray(data.songs)
      ) {

        setAllSongs(
          data.songs
        );

      } else if (
        Array.isArray(data)
      ) {

        setAllSongs(
          data
        );

      } else {

        setAllSongs([]);

      }

    } catch (error) {

      console.error(
        "Load songs error:",
        error
      );


      setBrowseError(
        error?.response?.data?.message ||
        "Unable to load songs."
      );

    } finally {

      setBrowseLoading(false);

    }

  };


  /* =====================================================
     OPEN BROWSE SONGS
  ===================================================== */

  const handleBrowseSongs = async () => {

    setShowBrowse(true);

    await loadAllSongs();

  };


  /* =====================================================
     CHECK FAVORITE
  ===================================================== */

  const isFavorite = (songId) => {

    return favorites.some(
      (song) =>
        String(song.id) ===
        String(songId)
    );

  };


  /* =====================================================
     FAVORITE QUEUE
  ===================================================== */

  const favoriteQueue = useMemo(() => {

    return favorites;

  }, [favorites]);


  /* =====================================================
     PLAY / PAUSE
  ===================================================== */

  const handlePlay = (song) => {

    const isCurrent =
      String(currentSong?.id) ===
      String(song.id);


    /*
      SAME SONG

      Playing → Pause
      Paused → Play
    */

    if (isCurrent) {

      togglePlay();

      return;

    }


    /*
      DIFFERENT SONG

      Start selected song.
    */

    const queueSongs =
      showBrowse
        ? allSongs
        : favoriteQueue;


    playSong(
      song,
      queueSongs
    );

  };


  /* =====================================================
     ADD FAVORITE
  ===================================================== */

  const handleAddFavorite = (song) => {

    if (!song?.id) {
      return;
    }


    if (isFavorite(song.id)) {
      return;
    }


    try {

      addFavorite(song);

      loadFavorites();

    } catch (error) {

      console.error(
        "Add favorite error:",
        error
      );

    }

  };


  /* =====================================================
     REMOVE FAVORITE
  ===================================================== */

  const handleRemove = (song) => {

    if (!song?.id) {
      return;
    }


    removeFavorite(
      song.id
    );


    loadFavorites();

  };


  /* =====================================================
     CLEAR ALL
  ===================================================== */

  const handleClearAll = () => {

    if (favorites.length === 0) {
      return;
    }


    const confirmed =
      window.confirm(
        "Remove all favorite songs?"
      );


    if (!confirmed) {
      return;
    }


    favorites.forEach(
      (song) => {

        removeFavorite(
          song.id
        );

      }
    );


    loadFavorites();

  };


  /* =====================================================
     QUEUE
  ===================================================== */

  const isSongQueued = (songId) => {

    return queue?.some(
      (song) =>
        String(song.id) ===
        String(songId)
    );

  };


  const handleQueue = (song) => {

    if (
      isSongQueued(song.id)
    ) {

      removeFromQueue(
        song.id
      );

    } else {

      addToQueue(
        song
      );

    }

  };


  /* =====================================================
     FILTER BROWSE SONGS
  ===================================================== */

  const filteredSongs =
    useMemo(() => {

      const query =
        searchText
          .trim()
          .toLowerCase();


      if (!query) {
        return allSongs;
      }


      return allSongs.filter(
        (song) => {

          const title =
            String(
              song.title || ""
            ).toLowerCase();


          const englishTitle =
            String(
              song.title_english ||
              song.titleEnglish ||
              ""
            ).toLowerCase();


          const artist =
            String(
              song.artist_name ||
              song.artist?.name ||
              song.artist ||
              ""
            ).toLowerCase();


          return (
            title.includes(query) ||
            englishTitle.includes(query) ||
            artist.includes(query)
          );

        }
      );

    }, [
      allSongs,
      searchText,
    ]);


  /* =====================================================
     SONG ROW
  ===================================================== */

  const renderBrowseSong = (
    song,
    index
  ) => {

    const isCurrent =
      String(currentSong?.id) ===
      String(song.id);


    const playing =
      isCurrent &&
      isPlaying;


    const favorite =
      isFavorite(song.id);


    const queued =
      isSongQueued(song.id);


    const cover =
      getSongCover(song);


    return (

      <div
        className={`favorite-browse-row ${
          isCurrent
            ? "favorite-browse-current"
            : ""
        }`}
        key={
          song.id ||
          index
        }
      >


        {/* NUMBER */}

        <span className="favorite-browse-number">

          {index + 1}

        </span>


        {/* COVER */}

        <div
          className="favorite-browse-cover"
          onClick={() =>
            navigate(
              `/songs/${song.id}`
            )
          }
        >

          {cover ? (

            <img
              src={cover}
              alt={
                song.title ||
                "Song"
              }
            />

          ) : (

            <div className="favorite-browse-cover-placeholder">

              <FaMusic />

            </div>

          )}

        </div>


        {/* SONG INFO */}

        <div
          className="favorite-browse-info"
          onClick={() =>
            navigate(
              `/songs/${song.id}`
            )
          }
        >

          <h3>

            {song.title ||
              "Untitled Song"}

          </h3>


          {(
            song.title_english ||
            song.titleEnglish
          ) && (

            <p>

              {
                song.title_english ||
                song.titleEnglish
              }

            </p>

          )}


          <span>

            {
              song.artist_name ||
              song.artist?.name ||
              song.artist ||
              "Unknown Artist"
            }

          </span>

        </div>


        {/* LANGUAGE */}

        <span className="favorite-browse-language">

          {song.language || ""}

        </span>


        {/* PLAY */}

        <button
          type="button"
          className={`favorite-browse-play ${
            playing
              ? "is-playing"
              : ""
          }`}
          onClick={() =>
            handlePlay(song)
          }
          disabled={
            !song.audio_url
          }
          title={
            playing
              ? "Pause"
              : "Play"
          }
        >

          {playing
            ? <FaPause />
            : <FaPlay />
          }

        </button>


        {/* ADD / REMOVE FAVORITE */}

        {favorite ? (

          <button
            type="button"
            className="favorite-added-button"
            onClick={() =>
              handleRemove(song)
            }
            title="Remove from favorites"
          >

            <FaCheck />

          </button>

        ) : (

          <button
            type="button"
            className="favorite-add-button"
            onClick={() =>
              handleAddFavorite(song)
            }
            title="Add to favorites"
          >

            <FaPlus />

          </button>

        )}


      </div>

    );

  };


  /* =====================================================
     PAGE
  ===================================================== */

  return (

    <div className="favorites-page">


      {/* =================================================
         HEADER
      ================================================= */}

      <div className="favorites-header">


        <button
          type="button"
          className="favorites-back-button"
          onClick={() =>
            navigate(-1)
          }
          aria-label="Go back"
        >

          <FaArrowLeft />

        </button>


        <div className="favorites-title-wrapper">


          <div className="favorites-title-icon">

            <FaHeart />

          </div>


          <div>

            <h1>
              My Favorites
            </h1>


            <p>

              {favorites.length}

              {" "}

              {
                favorites.length === 1
                  ? "favorite song"
                  : "favorite songs"
              }

            </p>

          </div>

        </div>


        <div className="favorites-header-actions">


          <button
            type="button"
            className="favorites-browse-button"
            onClick={
              handleBrowseSongs
            }
          >

            <FaMusic />

            <span>
              Browse Songs
            </span>

          </button>


          {favorites.length > 0 && (

            <button
              type="button"
              className="favorites-clear-button"
              onClick={
                handleClearAll
              }
            >

              <FaTrash />

              <span>
                Clear All
              </span>

            </button>

          )}

        </div>


      </div>


      {/* =================================================
         BROWSE SONGS
      ================================================= */}

      {showBrowse && (

        <section className="favorites-browse-section">


          <div className="favorites-browse-header">


            <div>

              <h2>
                Browse Songs
              </h2>

              <p>
                Add songs to your favorites
              </p>

            </div>


            <button
              type="button"
              className="favorites-browse-close"
              onClick={() => {

                setShowBrowse(false);

                setSearchText("");

              }}
            >

              Close

            </button>

          </div>


          {/* SEARCH */}

          <div className="favorites-search">

            <FaSearch />

            <input
              type="text"
              placeholder="Search songs or artists..."
              value={searchText}
              onChange={(event) =>
                setSearchText(
                  event.target.value
                )
              }
            />

          </div>


          {/* LOADING */}

          {browseLoading && (

            <div className="favorites-browse-status">

              Loading songs...

            </div>

          )}


          {/* ERROR */}

          {!browseLoading &&
            browseError && (

            <div className="favorites-browse-error">

              {browseError}

            </div>

          )}


          {/* SONGS */}

          {!browseLoading &&
            !browseError &&
            filteredSongs.length > 0 && (

            <div className="favorites-browse-list">

              {filteredSongs.map(
                renderBrowseSong
              )}

            </div>

          )}


          {/* NO RESULTS */}

          {!browseLoading &&
            !browseError &&
            filteredSongs.length === 0 && (

            <div className="favorites-browse-empty">

              <FaMusic />

              <h3>
                No songs found
              </h3>

              <p>
                Try another song or artist.
              </p>

            </div>

          )}

        </section>

      )}


      {/* =================================================
         FAVORITE SONGS
      ================================================= */}

      {favorites.length === 0 ? (

        <div className="favorites-empty">


          <div className="favorites-empty-icon">

            <FaHeart />

          </div>


          <h2>
            No Favorite Songs Yet
          </h2>


          <p>
            Browse songs and tap the +
            button to add them to your favorites.
          </p>


          <button
            type="button"
            className="favorites-browse-button"
            onClick={
              handleBrowseSongs
            }
          >

            <FaMusic />

            Browse Songs

          </button>


        </div>

      ) : (

        <div className="favorites-list">


          {favorites.map(
            (song, index) => {

              const isCurrent =
                String(
                  currentSong?.id
                ) ===
                String(song.id);


              const playing =
                isCurrent &&
                isPlaying;


              const queued =
                isSongQueued(
                  song.id
                );


              const cover =
                getSongCover(
                  song
                );


              return (

                <div
                  className={`favorite-song ${
                    isCurrent
                      ? "favorite-song-current"
                      : ""
                  }`}
                  key={
                    song.id ||
                    index
                  }
                >


                  {/* COVER */}

                  <div
                    className="favorite-song-cover"
                    onClick={() =>
                      navigate(
                        `/songs/${song.id}`
                      )
                    }
                  >

                    {cover ? (

                      <img
                        src={cover}
                        alt={
                          song.titleEnglish ||
                          song.title ||
                          "Song"
                        }
                      />

                    ) : (

                      <div className="favorite-cover-placeholder">

                        <FaMusic />

                      </div>

                    )}


                    <button
                      type="button"
                      className={`favorite-cover-play ${
                        playing
                          ? "is-playing"
                          : ""
                      }`}
                      onClick={(event) => {

                        event.stopPropagation();

                        handlePlay(
                          song
                        );

                      }}
                      aria-label={
                        playing
                          ? "Pause"
                          : "Play"
                      }
                    >

                      {playing
                        ? <FaPause />
                        : <FaPlay />
                      }

                    </button>

                  </div>


                  {/* SONG INFORMATION */}

                  <div
                    className="favorite-song-info"
                    onClick={() =>
                      navigate(
                        `/songs/${song.id}`
                      )
                    }
                  >

                    <h3>

                      {
                        song.title ||
                        "Untitled Song"
                      }

                    </h3>


                    {(
                      song.titleEnglish ||
                      song.title_english
                    ) && (

                      <p className="favorite-song-english">

                        {
                          song.titleEnglish ||
                          song.title_english
                        }

                      </p>

                    )}


                    <p className="favorite-song-artist">

                      {
                        song.artist_name ||
                        song.artist?.name ||
                        song.artist ||
                        "Unknown Artist"
                      }

                    </p>


                    {song.category_name && (

                      <span className="favorite-song-category">

                        {
                          song.category_name
                        }

                      </span>

                    )}

                  </div>


                  {/* ACTIONS */}

                  <div className="favorite-song-actions">


                    {/* QUEUE */}

                    <button
                      type="button"
                      className={`favorite-queue-button ${
                        queued
                          ? "favorite-queue-active"
                          : ""
                      }`}
                      onClick={() =>
                        handleQueue(
                          song
                        )
                      }
                      title={
                        queued
                          ? "Remove from queue"
                          : "Add to queue"
                      }
                    >

                      {queued
                        ? <FaMusic />
                        : <FaPlus />
                      }

                    </button>


                    {/* REMOVE FAVORITE */}

                    <button
                      type="button"
                      className="favorite-remove-button"
                      onClick={() =>
                        handleRemove(
                          song
                        )
                      }
                      title="Remove from favorites"
                    >

                      <FaHeart />

                    </button>


                  </div>


                </div>

              );

            }
          )}

        </div>

      )}

    </div>

  );

}


export default Favorites;