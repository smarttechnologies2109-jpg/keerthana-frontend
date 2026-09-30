import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  FaMusic,
  FaPlay,
  FaPause,
  FaSearch,
} from "react-icons/fa";

import {
  useNavigate,
} from "react-router-dom";

import API from "../services/api";

import {
  usePlayer,
} from "../context/usePlayer";

import {
  getSongCover,
  DEFAULT_COVER,
} from "../utils/media";

import "../assets/css/allSongs.css";


function AllSongs() {

  const navigate =
    useNavigate();


  /* =====================================================
     PLAYER
  ===================================================== */

  const {
    currentSong,
    isPlaying,
    playSong,
    togglePlay,
  } = usePlayer();


  /* =====================================================
     STATE
  ===================================================== */

  const [songs, setSongs] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [search, setSearch] =
    useState("");

  const [error, setError] =
    useState("");


  /* =====================================================
     LOAD ALL SONGS
  ===================================================== */

  useEffect(() => {

    const loadSongs =
      async () => {

        try {

          setLoading(true);

          setError("");


          const response =
            await API.get("/songs");


          const data =
            response?.data;


          const songList =
            Array.isArray(data)
              ? data
              : Array.isArray(data?.songs)
                ? data.songs
                : Array.isArray(data?.data)
                  ? data.data
                  : [];


          setSongs(
            songList
          );


        } catch (err) {

          console.error(
            "Load all songs error:",
            err
          );


          setSongs([]);


          setError(
            "Unable to load songs. Please try again."
          );


        } finally {

          setLoading(false);

        }

      };


    loadSongs();

  }, []);


  /* =====================================================
     SEARCH
  ===================================================== */

  const filteredSongs =
    useMemo(() => {

      const value =
        search
          .trim()
          .toLowerCase();


      if (!value) {

        return songs;

      }


      return songs.filter(
        (song) => {

          const title =
            String(
              song?.title ||
              ""
            ).toLowerCase();


          const englishTitle =
            String(
              song?.titleEnglish ||
              ""
            ).toLowerCase();


          const artist =
            String(
              song?.artist_name ||
              song?.artist ||
              ""
            ).toLowerCase();


          const number =
            String(
              song?.number ||
              ""
            ).toLowerCase();


          return (
            title.includes(value) ||
            englishTitle.includes(value) ||
            artist.includes(value) ||
            number.includes(value)
          );

        }
      );

    }, [
      songs,
      search,
    ]);


  /* =====================================================
     PLAY / PAUSE SONG
  ===================================================== */

  const handlePlay =
    async (song) => {

      if (!song) {
        return;
      }


      const isCurrent =
        Number(
          currentSong?.id
        ) ===
        Number(
          song?.id
        );


      try {

        /* -----------------------------------------------
           SAME SONG
        ------------------------------------------------ */

        if (isCurrent) {

          await togglePlay();

          return;

        }


        /* -----------------------------------------------
           DIFFERENT SONG
        ------------------------------------------------ */

        await playSong(
          song,
          songs
        );


      } catch (err) {

        console.error(
          "Play song error:",
          err
        );

      }

    };


  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {

    return (

      <div className="all-songs-page">

        <div className="all-songs-loading">

          <FaMusic />

          <h2>
            Loading Songs...
          </h2>

          <p>
            Loading your complete music library.
          </p>

        </div>

      </div>

    );

  }


  /* =====================================================
     PAGE
  ===================================================== */

  return (

    <div className="all-songs-page">


      {/* =================================================
          HEADER
      ================================================= */}

      <div className="all-songs-header">


        <div className="all-songs-title-area">


          <div className="all-songs-icon">

            <FaMusic />

          </div>


          <div>

            <span className="all-songs-overline">
              YOUR MUSIC
            </span>


            <h1>
              All Songs
            </h1>


            <p>
              Browse and play all available songs.
            </p>

          </div>


        </div>


        {/* <div className="all-songs-count">

          {/* <strong>
            {songs.length}
          </strong> */}


          {/* <span>

            {songs.length === 1
              ? "Song"
              : "Songs"}

          </span> 

        </div> */}


      </div>


      {/* =================================================
          SEARCH
      ================================================= */}

      <div className="all-songs-search">

        <FaSearch />


        <input
          type="text"
          value={search}
          onChange={(event) =>
            setSearch(
              event.target.value
            )
          }
          placeholder="Search songs..."
        />

      </div>


      {/* =================================================
          ERROR
      ================================================= */}

      {error && (

        <div className="all-songs-error">

          {error}

        </div>

      )}


      {/* =================================================
          EMPTY
      ================================================= */}

      {!error &&
        filteredSongs.length === 0 && (

          <div className="all-songs-empty">


            <div className="all-songs-empty-icon">

              <FaMusic />

            </div>


            <h2>
              No Songs Found
            </h2>


            <p>

              {search
                ? "Try a different search."
                : "There are no songs available right now."}

            </p>


          </div>

        )}


      {/* =================================================
          SONG LIST
      ================================================= */}

      {filteredSongs.length > 0 && (

        <div className="all-songs-list">


          {filteredSongs.map(
            (song, index) => {


              const cover =
                getSongCover(
                  song
                );


              const isCurrent =
                Number(
                  currentSong?.id
                ) ===
                Number(
                  song?.id
                );


              const isCurrentPlaying =
                isCurrent &&
                isPlaying;


              return (

                <article
                  key={
                    song?.id ??
                    `${song?.number}-${index}`
                  }
                  className={
                    isCurrent
                      ? "all-song-card current"
                      : "all-song-card"
                  }
                >


                  {/* ===================================
                      NUMBER
                  =================================== */}

                  <div className="all-song-number">

                    {song?.number ||
                      String(
                        index + 1
                      ).padStart(
                        3,
                        "0"
                      )}

                  </div>


                  {/* ===================================
                      COVER
                  =================================== */}

                  <button
                    type="button"
                    className="all-song-cover"
                    onClick={() =>
                      navigate(
                        `/songs/${song.id}`
                      )
                    }
                  >

                    <img
                      src={
                        cover ||
                        DEFAULT_COVER
                      }
                      alt={
                        song?.title ||
                        "Song"
                      }
                      onError={(
                        event
                      ) => {

                        event.currentTarget.onerror =
                          null;

                        event.currentTarget.src =
                          DEFAULT_COVER;

                      }}
                    />

                  </button>


                  {/* ===================================
                      SONG INFO
                  =================================== */}

                  <button
                    type="button"
                    className="all-song-info"
                    onClick={() =>
                      navigate(
                        `/songs/${song.id}`
                      )
                    }
                  >

                    <strong>

                      {song?.title ||
                        song?.titleEnglish ||
                        "Unknown Song"}

                    </strong>


                    {song?.titleEnglish &&
                      song?.title &&
                      song.titleEnglish !==
                        song.title && (

                        <span className="all-song-english-title">

                          {song.titleEnglish}

                        </span>

                      )}


                    <span className="all-song-artist">

                      {song?.artist_name ||
                        song?.artist ||
                        "KEERTHANA"}

                    </span>


                    {isCurrent && (

                      <small>

                        {isPlaying
                          ? "Now Playing"
                          : "Paused"}

                      </small>

                    )}

                  </button>


                  {/* ===================================
                      PLAY / PAUSE
                  =================================== */}

                  <button
                    type="button"
                    className={
                      isCurrentPlaying
                        ? "all-song-play-button playing"
                        : "all-song-play-button"
                    }
                    onClick={() =>
                      handlePlay(
                        song
                      )
                    }
                    title={
                      isCurrentPlaying
                        ? "Pause"
                        : "Play"
                    }
                  >

                    {isCurrentPlaying ? (

                      <FaPause />

                    ) : (

                      <FaPlay />

                    )}

                  </button>


                </article>

              );

            }
          )}

        </div>

      )}

    </div>

  );

}


export default AllSongs;