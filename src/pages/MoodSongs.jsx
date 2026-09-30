
import React, {
  useEffect,
  useState,
} from "react";


import {
  useNavigate,
  useParams,
} from "react-router-dom";


import {
  FaArrowLeft,
  FaMusic,
  FaPause,
  FaPlay,
  FaPlus,
  FaCheck,
  FaTrash,
  FaSearch,
  FaTimes,
} from "react-icons/fa";


import API from "../services/api";


import {
  usePlayer,
} from "../context/usePlayer";


import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import MusicPlayer from "../components/MusicPlayer";


import "../assets/css/MoodSongs.css";


/* =========================================================
   MOOD INFORMATION
========================================================= */

const moodInformation = {

  worship: {
    name: "Worship",
    description:
      "Songs to praise and worship God",
  },

  praise: {
    name: "Praise",
    description:
      "Joyful songs celebrating God's goodness",
  },

  prayer: {
    name: "Prayer",
    description:
      "Peaceful songs for prayer and devotion",
  },

  hope: {
    name: "Hope & Faith",
    description:
      "Songs that strengthen faith and bring hope",
  },

  peace: {
    name: "Peace & Comfort",
    description:
      "Calm songs for comfort and inner peace",
  },

  thanksgiving: {
    name: "Thanksgiving",
    description:
      "Songs of gratitude and thanksgiving to God",
  },

};


/* =========================================================
   COMPONENT
========================================================= */

const MoodSongs = () => {

  const {
    mood,
  } = useParams();


  const navigate =
    useNavigate();


  /* =======================================================
     PLAYER
  ======================================================= */

  const {
    playSong,
    togglePlay,
    currentSong,
    isPlaying,
  } = usePlayer();


  /* =======================================================
     STATE
  ======================================================= */

  const [
    songs,
    setSongs,
  ] = useState([]);


  const [
    browseSongs,
    setBrowseSongs,
  ] = useState([]);


  const [
    loading,
    setLoading,
  ] = useState(true);


  const [
    browseLoading,
    setBrowseLoading,
  ] = useState(false);


  const [
    addingId,
    setAddingId,
  ] = useState(null);


  const [
    removingId,
    setRemovingId,
  ] = useState(null);


  const [
    showBrowser,
    setShowBrowser,
  ] = useState(false);


  const [
    search,
    setSearch,
  ] = useState("");


  const [
    error,
    setError,
  ] = useState("");


  const [
    browseError,
    setBrowseError,
  ] = useState("");


  /* =======================================================
     CURRENT MOOD
  ======================================================= */

  const currentMood =
    moodInformation[mood];


  /* =======================================================
     LOAD MOOD SONGS
  ======================================================= */

  const loadMoodSongs =
    async () => {

      try {

        setLoading(true);

        setError("");


        const response =
          await API.get(
            `/songs/mood/${encodeURIComponent(
              mood
            )}`
          );


        const data =
          response?.data;


        if (
          Array.isArray(
            data?.songs
          )
        ) {

          setSongs(
            data.songs
          );

        } else {

          setSongs([]);

        }

      } catch (err) {

        console.error(
          "Load mood songs error:",
          err
        );


        setError(
          "Unable to load songs for this mood."
        );

      } finally {

        setLoading(false);

      }
    };


  /* =======================================================
     LOAD BROWSE SONGS
  ======================================================= */

  const loadBrowseSongs =
    async () => {

      try {

        setBrowseLoading(true);

        setBrowseError("");


        const response =
          await API.get(
            `/songs/mood/${encodeURIComponent(
              mood
            )}/browse`
          );


        const data =
          response?.data;


        if (
          Array.isArray(
            data?.songs
          )
        ) {

          setBrowseSongs(
            data.songs
          );

        } else {

          setBrowseSongs([]);

        }

      } catch (err) {

        console.error(
          "Browse songs error:",
          err
        );


        setBrowseError(
          "Unable to browse songs."
        );

      } finally {

        setBrowseLoading(false);

      }
    };


  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {

    if (
      mood &&
      currentMood
    ) {

      loadMoodSongs();

    } else {

      setLoading(false);

    }

  }, [
    mood,
  ]);


  /* =======================================================
     OPEN BROWSER
  ======================================================= */

  const handleOpenBrowser =
    async () => {

      setShowBrowser(true);

      await loadBrowseSongs();

    };


  /* =======================================================
     CLOSE BROWSER
  ======================================================= */

  const handleCloseBrowser =
    () => {

      setShowBrowser(false);

      setSearch("");

    };


  /* =======================================================
     ADD SONG TO MOOD
  ======================================================= */

  const handleAddSong =
    async (song) => {

      if (
        !song?.id ||
        addingId
      ) {
        return;
      }


      try {

        setAddingId(
          song.id
        );


        await API.post(
          `/songs/${song.id}/mood`,
          {
            mood,
          }
        );


        setBrowseSongs(
          (previous) =>
            previous.map(
              (item) =>
                item.id === song.id
                  ? {
                      ...item,
                      is_in_mood: true,
                      moods: Array.from(
                        new Set([
                          ...(Array.isArray(
                            item.moods
                          )
                            ? item.moods
                            : []),
                          mood,
                        ])
                      ),
                    }
                  : item
            )
        );


        await loadMoodSongs();

      } catch (err) {

        console.error(
          "Add song to mood error:",
          err
        );

        alert(
          err?.response?.data?.message ||
            "Unable to add song to mood."
        );

      } finally {

        setAddingId(null);

      }
    };


  /* =======================================================
     REMOVE SONG FROM MOOD
  ======================================================= */

  const handleRemoveSong =
    async (song) => {

      if (
        !song?.id ||
        removingId
      ) {
        return;
      }


      try {

        setRemovingId(
          song.id
        );


        await API.delete(
          `/songs/${song.id}/mood/${encodeURIComponent(
            mood
          )}`
        );


        setBrowseSongs(
          (previous) =>
            previous.map(
              (item) =>
                item.id === song.id
                  ? {
                      ...item,
                      is_in_mood: false,
                      moods: Array.isArray(
                        item.moods
                      )
                        ? item.moods.filter(
                            (itemMood) =>
                              itemMood !== mood
                          )
                        : [],
                    }
                  : item
            )
        );


        await loadMoodSongs();

      } catch (err) {

        console.error(
          "Remove song from mood error:",
          err
        );

        alert(
          err?.response?.data?.message ||
            "Unable to remove song from mood."
        );

      } finally {

        setRemovingId(null);

      }
    };


  /* =======================================================
     PLAY / PAUSE
  ======================================================= */

  const handleSongPlayPause =
    async (song) => {

      if (
        !song?.audio_url
      ) {
        return;
      }


      if (
        currentSong?.id === song.id
      ) {

        await togglePlay();

        return;
      }


      await playSong(
        song,
        songs
      );
    };


  /* =======================================================
     PLAY ALL
  ======================================================= */

  const handlePlayAll =
    async () => {

      if (
        songs.length === 0
      ) {
        return;
      }


      const currentBelongsToMood =
        currentSong &&
        songs.some(
          (song) =>
            song.id ===
            currentSong.id
        );


      if (
        currentBelongsToMood
      ) {

        await togglePlay();

        return;
      }


      await playSong(
        songs[0],
        songs
      );
    };


  /* =======================================================
     FILTER BROWSE SONGS
  ======================================================= */

  const filteredBrowseSongs =
    browseSongs.filter(
      (song) => {

        const value =
          search
            .trim()
            .toLowerCase();


        if (!value) {
          return true;
        }


        return (
          String(
            song.title || ""
          )
            .toLowerCase()
            .includes(value) ||

          String(
            song.title_english || ""
          )
            .toLowerCase()
            .includes(value) ||

          String(
            song.artist_name || ""
          )
            .toLowerCase()
            .includes(value) ||

          String(
            song.album_title || ""
          )
            .toLowerCase()
            .includes(value)
        );
      }
    );


  /* =======================================================
     UNKNOWN MOOD
  ======================================================= */

  if (
    !currentMood
  ) {

    return (

      <div className="mood-songs-page">

        <Sidebar />

        {/* <Header /> */}


        <main className="mood-songs-content">

          <button
            type="button"
            className="mood-back-btn"
            onClick={() =>
              navigate(
                "/mood-playlists"
              )
            }
          >

            <FaArrowLeft />

            Back to Moods

          </button>


          <div className="mood-empty">

            <FaMusic />

            <h2>
              Mood Not Found
            </h2>

            <p>
              The selected mood does not exist.
            </p>

          </div>

        </main>


        <MusicPlayer />

      </div>
    );
  }


  /* =======================================================
     MAIN PAGE
  ======================================================= */

  return (

    <div className="mood-songs-page">

      <Sidebar />

      {/* <Header /> */}


      <main className="mood-songs-content">


        {/* =================================================
            BACK
        ================================================= */}

        <button
          type="button"
          className="mood-back-btn"
          onClick={() =>
            navigate(
              "/mood-playlists"
            )
          }
        >

          <FaArrowLeft />

          Back to Moods

        </button>


        {/* =================================================
            HEADER
        ================================================= */}

        <section className="mood-songs-header">

          <div className="mood-songs-icon">

            <FaMusic />

          </div>


          <div className="mood-header-info">

            <span className="mood-small-label">
              KEERTHANA
            </span>


            <h1>
              {currentMood.name}
            </h1>


            <p>
              {currentMood.description}
            </p>

          </div>

        </section>


        {/* =================================================
            ACTIONS
        ================================================= */}

        <div className="mood-actions">

          <button
            type="button"
            className="mood-play-all-btn"
            onClick={
              handlePlayAll
            }
            disabled={
              songs.length === 0
            }
          >

            {currentSong &&
            songs.some(
              (song) =>
                song.id ===
                currentSong.id
            ) &&
            isPlaying ? (

              <FaPause />

            ) : (

              <FaPlay />

            )}


            {currentSong &&
            songs.some(
              (song) =>
                song.id ===
                currentSong.id
            ) &&
            isPlaying

              ? "Pause"

              : "Play All"}

          </button>


          <span className="mood-song-count">

            {songs.length}

            {" "}

            {songs.length === 1
              ? "Song"
              : "Songs"}

          </span>


          <button
            type="button"
            className="mood-add-songs-btn"
            onClick={
              handleOpenBrowser
            }
          >

            <FaPlus />

            Add Songs

          </button>

        </div>


        {/* =================================================
            LOADING
        ================================================= */}

        {loading && (

          <div className="mood-loading">

            <div className="mood-spinner"></div>

            <p>
              Loading songs...
            </p>

          </div>

        )}


        {/* =================================================
            ERROR
        ================================================= */}

        {!loading &&
        error && (

          <div className="mood-error">

            <FaMusic />

            <h2>
              Something went wrong
            </h2>

            <p>
              {error}
            </p>

          </div>
        )}


        {/* =================================================
            EMPTY
        ================================================= */}

        {!loading &&
        !error &&
        songs.length === 0 && (

          <div className="mood-empty">

            <FaMusic />

            <h2>
              No Songs in {currentMood.name}
            </h2>

            <p>
              Add songs to this mood to
              create your mood playlist.
            </p>


            <button
              type="button"
              onClick={
                handleOpenBrowser
              }
            >

              <FaPlus />

              Browse All Songs

            </button>

          </div>
        )}


        {/* =================================================
            SONG LIST
        ================================================= */}

        {!loading &&
        !error &&
        songs.length > 0 && (

          <section className="mood-song-list">

            {songs.map(
              (
                song,
                index
              ) => {

                const isCurrent =
                  currentSong?.id ===
                  song.id;


                const isCurrentPlaying =
                  isCurrent &&
                  isPlaying;


                return (

                  <div
                    key={
                      song.id ||
                      index
                    }
                    className={`mood-song-card ${
                      isCurrent
                        ? "is-current"
                        : ""
                    }`}
                  >

                    <div className="mood-song-number">
                      {index + 1}
                    </div>


                    <div className="mood-song-cover">

                      {song.cover_url ? (

                        <img
                          src={
                            song.cover_url
                          }
                          alt={
                            song.title ||
                            "Song"
                          }
                        />

                      ) : (

                        <FaMusic />

                      )}

                    </div>


                    <div
                      className="mood-song-info"
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


                      <p>
                        {song.artist_name ||
                          "Unknown Artist"}
                      </p>

                    </div>


                    <button
                      type="button"
                      className="mood-song-play"
                      onClick={() =>
                        handleSongPlayPause(
                          song
                        )
                      }
                    >

                      {isCurrentPlaying ? (

                        <FaPause />

                      ) : (

                        <FaPlay />

                      )}

                    </button>

                  </div>

                );
              }
            )}

          </section>
        )}


      </main>


      {/* =================================================
          BROWSE SONGS MODAL
      ================================================= */}

      {showBrowser && (

        <div
          className="mood-browser-overlay"
          onClick={
            handleCloseBrowser
          }
        >

          <div
            className="mood-browser"
            onClick={(event) =>
              event.stopPropagation()
            }
          >


            {/* =========================================
                BROWSER HEADER
            ========================================= */}

            <div className="mood-browser-header">

              <div>

                <span>
                  ADD SONGS
                </span>

                <h2>
                  Browse All Songs
                </h2>

                <p>
                  Add songs to{" "}
                  <strong>
                    {currentMood.name}
                  </strong>
                </p>

              </div>


              <button
                type="button"
                className="mood-browser-close"
                onClick={
                  handleCloseBrowser
                }
                aria-label="Close"
              >

                <FaTimes />

              </button>

            </div>


            {/* =========================================
                SEARCH
            ========================================= */}

            <div className="mood-browser-search">

              <FaSearch />

              <input
                type="text"
                placeholder="Search songs, artists or albums..."
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
              />

            </div>


            {/* =========================================
                BROWSER CONTENT
            ========================================= */}

            {browseLoading ? (

              <div className="mood-browser-loading">

                <div className="mood-spinner"></div>

                <p>
                  Loading all songs...
                </p>

              </div>

            ) : browseError ? (

              <div className="mood-browser-empty">

                <FaMusic />

                <h3>
                  Unable to load songs
                </h3>

                <p>
                  {browseError}
                </p>

              </div>

            ) : filteredBrowseSongs.length === 0 ? (

              <div className="mood-browser-empty">

                <FaMusic />

                <h3>
                  No songs found
                </h3>

                <p>
                  Try another search.
                </p>

              </div>

            ) : (

              <div className="mood-browser-list">

                {filteredBrowseSongs.map(
                  (song) => {

                    const alreadyAdded =
                      Boolean(
                        song.is_in_mood
                      );


                    const isAdding =
                      addingId ===
                      song.id;


                    const isRemoving =
                      removingId ===
                      song.id;


                    return (

                      <div
                        key={
                          song.id
                        }
                        className={`mood-browser-song ${
                          alreadyAdded
                            ? "already-added"
                            : ""
                        }`}
                      >

                        <div className="mood-browser-cover">

                          {song.cover_url ? (

                            <img
                              src={
                                song.cover_url
                              }
                              alt={
                                song.title ||
                                "Song"
                              }
                            />

                          ) : (

                            <FaMusic />

                          )}

                        </div>


                        <div className="mood-browser-info">

                          <h3>
                            {song.title ||
                              "Untitled Song"}
                          </h3>

                          <p>
                            {song.artist_name ||
                              "Unknown Artist"}
                          </p>

                          {song.language && (

                            <small>
                              {song.language}
                            </small>

                          )}

                        </div>


                        <div className="mood-browser-action">

                          {alreadyAdded ? (

                            <button
                              type="button"
                              className="mood-remove-btn"
                              disabled={
                                isRemoving
                              }
                              onClick={() =>
                                handleRemoveSong(
                                  song
                                )
                              }
                            >

                              {isRemoving ? (
                                "Removing..."
                              ) : (
                                <>
                                  <FaTrash />
                                  Remove
                                </>
                              )}

                            </button>

                          ) : (

                            <button
                              type="button"
                              className="mood-add-btn"
                              disabled={
                                isAdding
                              }
                              onClick={() =>
                                handleAddSong(
                                  song
                                )
                              }
                            >

                              {isAdding ? (

                                "Adding..."

                              ) : (

                                <>
                                  <FaPlus />
                                  Add
                                </>

                              )}

                            </button>

                          )}

                        </div>


                        {alreadyAdded && (

                          <div className="mood-added-badge">

                            <FaCheck />

                            Added

                          </div>

                        )}

                      </div>

                    );

                  }
                )}

              </div>

            )}


            {/* =========================================
                FOOTER
            ========================================= */}

            <div className="mood-browser-footer">

              <span>

                {filteredBrowseSongs.length}{" "}

                {filteredBrowseSongs.length === 1
                  ? "song"
                  : "songs"}

              </span>


              <button
                type="button"
                onClick={
                  handleCloseBrowser
                }
              >

                Done

              </button>

            </div>


          </div>

        </div>

      )}


      <MusicPlayer />

    </div>

  );
};


export default MoodSongs;
