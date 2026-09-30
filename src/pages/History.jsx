import {
  useEffect,
  useState,
} from "react";

import {
  FaClock,
  FaHistory,
  FaPlay,
  FaPause,
  FaTrash,
} from "react-icons/fa";

import API from "../services/api";

import {
  usePlayer,
} from "../context/usePlayer";

import {
  getMediaUrl,
} from "../utils/media";

import "../assets/css/history.css";


/* =========================================================
   FORMAT DATE
========================================================= */

function formatPlayedDate(dateValue) {

  if (!dateValue) {
    return "";
  }


  const date =
    new Date(dateValue);


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }


  return date.toLocaleString(
    undefined,
    {
      dateStyle: "medium",
      timeStyle: "short",
    }
  );

}


/* =========================================================
   HISTORY PAGE
========================================================= */

function History() {


  /* =======================================================
     PLAYER
  ======================================================= */

  const {
    currentSong,
    isPlaying,
    playSong,
    togglePlay,
  } = usePlayer();


  /* =======================================================
     STATE
  ======================================================= */

  const [
    history,
    setHistory,
  ] = useState([]);


  const [
    loading,
    setLoading,
  ] = useState(true);


  const [
    error,
    setError,
  ] = useState("");


  const [
    clearingHistory,
    setClearingHistory,
  ] = useState(false);


  /* =======================================================
     LOAD HISTORY
  ======================================================= */

  useEffect(() => {

    let active = true;


    const loadHistory =
      async () => {

        try {

          setLoading(true);

          setError("");


          const response =
            await API.get(
              "/history"
            );


          /*
            Supported response shapes:

            {
              history: [...]
            }

            OR

            {
              songs: [...]
            }

            OR

            {
              recently_played: [...]
            }
          */

          const historyData =
            response.data?.history ||
            response.data?.songs ||
            response.data?.recently_played ||
            [];


          /* =================================================
             NORMALIZE HISTORY
          ================================================= */

          const normalized =
            historyData
              .map((item) => {

                /*
                  Some APIs return:

                  {
                    played_at: "...",
                    song: {
                      id: 1,
                      title: "..."
                    }
                  }
                */

                if (
                  item?.song &&
                  typeof item.song ===
                    "object"
                ) {

                  return {

                    ...item.song,

                    history_id:
                      item.history_id ||
                      item.id ||
                      item.song.history_id ||
                      null,

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


                /*
                  Backend can also return
                  song information directly.
                */

                return item;

              })
              .filter(
                (song) =>
                  song &&
                  song.id
              );


          /*
            Remove duplicate songs.

            First/newest occurrence is preserved.
          */

          const uniqueHistory =
            Array.from(
              new Map(
                normalized.map(
                  (song) => [
                    song.id,
                    song,
                  ]
                )
              ).values()
            );


          if (active) {

            setHistory(
              uniqueHistory
            );

          }


        } catch (error) {

          console.error(
            "History loading error:",
            error
          );


          if (active) {

            setError(
              error.response
                ?.data
                ?.message ||
              "Unable to load listening history."
            );

          }


        } finally {

          if (active) {

            setLoading(false);

          }

        }

      };


    loadHistory();


    return () => {

      active = false;

    };

  }, []);


  /* =======================================================
     CHECK CURRENT SONG
  ======================================================= */

  const isCurrentSong =
    (song) => {

      return (
        String(
          currentSong?.id
        ) ===
        String(
          song?.id
        )
      );

    };


  /* =======================================================
     CHECK PLAYING SONG
  ======================================================= */

  const isSongPlaying =
    (song) => {

      return (
        isCurrentSong(song) &&
        isPlaying
      );

    };


  /* =======================================================
     PLAY / PAUSE HISTORY SONG
  ======================================================= */

  const handlePlay =
    (song) => {

      if (!song) {
        return;
      }


      /*
        If this is the currently loaded song,
        toggle Play / Pause.
      */

      if (
        isCurrentSong(song)
      ) {

        togglePlay();

        return;

      }


      /*
        Different song:
        start that song and use history
        as the queue.
      */

      if (!song.audio_url) {

        window.alert(
          "Audio is not available for this song."
        );

        return;

      }


      playSong(
        song,
        history
      );

    };


  /* =======================================================
     CLEAR HISTORY
  ======================================================= */

  const handleClearHistory =
    async () => {

      if (
        clearingHistory ||
        history.length === 0
      ) {
        return;
      }


      const confirmed =
        window.confirm(
          "Are you sure you want to clear your entire listening history?"
        );


      if (!confirmed) {
        return;
      }


      try {

        setClearingHistory(
          true
        );

        setError("");


        await API.delete(
          "/history"
        );


        setHistory([]);


      } catch (error) {

        console.error(
          "Clear history error:",
          error
        );


        const message =
          error.response
            ?.data
            ?.message ||
          "Unable to clear listening history.";


        setError(
          message
        );


        window.alert(
          message
        );


      } finally {

        setClearingHistory(
          false
        );

      }

    };


  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {

    return (

      <div className="history-page">

        <div className="history-loading">

          <FaHistory />

          <h2>
            Loading History...
          </h2>

          <p>
            Finding your recently
            played music.
          </p>

        </div>

      </div>

    );

  }


  /* =======================================================
     PAGE
  ======================================================= */

  return (

    <div className="history-page">


      {/* =================================================
          HEADER
      ================================================= */}

      <header className="history-header">


        {/* LEFT */}

        <div className="history-header-main">

          <div className="history-header-icon">

            <FaHistory />

          </div>


          <div className="history-header-content">

            <span className="history-eyebrow">

              YOUR MUSIC

            </span>


            <h1>

              Listening History

            </h1>


            <p>

              Songs you've recently
              played on KEERTHANA.

            </p>

          </div>

        </div>


        {/* CLEAR HISTORY */}

        {history.length > 0 && (

          <button
            type="button"
            className="history-clear-button"
            onClick={
              handleClearHistory
            }
            disabled={
              clearingHistory
            }
          >

            <FaTrash />

            <span>

              {
                clearingHistory
                  ? "Clearing..."
                  : "Clear History"
              }

            </span>

          </button>

        )}


      </header>


      {/* =================================================
          ERROR
      ================================================= */}

      {error && (

        <div className="history-error">

          {error}

        </div>

      )}


      {/* =================================================
          EMPTY
      ================================================= */}

      {!error &&
        history.length === 0 && (

          <div className="history-empty">

            <FaClock />


            <h2>

              No listening
              history yet

            </h2>


            <p>

              Songs you listen to
              will appear here.

            </p>

          </div>

        )}


      {/* =================================================
          HISTORY LIST
      ================================================= */}

      {history.length > 0 && (

        <div className="history-list">


          {/* TABLE HEADER */}

          <div className="history-list-header">

            <span>
              #
            </span>


            <span>
              Song
            </span>


            <span>
              Album
            </span>


            <span>
              Last Played
            </span>


            <span />

          </div>


          {/* SONGS */}

          {history.map(
            (song, index) => {

              /* =========================================
                 COVER
              ========================================= */

              const cover =
                song.cover_url
                  ? getMediaUrl(
                      song.cover_url
                    )
                  : "/images/default-cover.png";


              const current =
                isCurrentSong(song);


              const playing =
                isSongPlaying(song);


              return (

                <div
                  className={
                    `history-row ${
                      current
                        ? "is-current"
                        : ""
                    } ${
                      playing
                        ? "is-playing"
                        : ""
                    }`
                  }
                  key={
                    `${song.id}-${
                      song.played_at ||
                      index
                    }`
                  }
                >


                  {/* ===================================
                     NUMBER
                  =================================== */}

                  <span className="history-number">

                    {!current &&
                      index + 1}

                  </span>


                  {/* ===================================
                     SONG
                  =================================== */}

                  <div className="history-song">


                    {/* COVER */}

                    <div
                      className={
                        `history-cover ${
                          current
                            ? "is-current"
                            : ""
                        }`
                      }
                    >

                      <img
                        src={cover}
                        alt={
                          song.title ||
                          "Song cover"
                        }
                        onError={(event) => {

                          if (
                            !event
                              .currentTarget
                              .src
                              .endsWith(
                                "/images/default-cover.png"
                              )
                          ) {

                            event
                              .currentTarget
                              .src =
                              "/images/default-cover.png";

                          }

                        }}
                      />


                      {/* COVER PLAY / PAUSE */}

                      <button
                        type="button"
                        className={
                          playing
                            ? "is-playing"
                            : ""
                        }
                        onClick={() =>
                          handlePlay(song)
                        }
                        disabled={
                          !song.audio_url
                        }
                        aria-label={
                          playing
                            ? `Pause ${
                                song.title ||
                                "song"
                              }`
                            : `Play ${
                                song.title ||
                                "song"
                              }`
                        }
                      >

                        {playing ? (

                          <FaPause />

                        ) : (

                          <FaPlay />

                        )}

                      </button>

                    </div>


                    {/* SONG INFO */}

                    <div className="history-song-info">

                      <strong>

                        {song.title ||
                          "Unknown Song"}

                      </strong>


                      {song.title_english && (

                        <span>

                          {song.title_english}

                        </span>

                      )}


                      <small>

                        {song.artist_name ||
                          "KEERTHANA"}

                      </small>

                    </div>

                  </div>


                  {/* ===================================
                     ALBUM
                  =================================== */}

                  <span className="history-album">

                    {song.album_title ||
                      song.category_name ||
                      "Christian Music"}

                  </span>


                  {/* ===================================
                     LAST PLAYED
                  =================================== */}

                  <span className="history-date">

                    <FaClock />


                    <span>

                      {
                        formatPlayedDate(
                          song.played_at ||
                          song.updated_at ||
                          song.created_at
                        ) ||
                        "Recently"
                      }

                    </span>

                  </span>


                  {/* ===================================
                     PLAY / PAUSE BUTTON
                  =================================== */}

                  <button
                    type="button"
                    className={
                      `history-play-button ${
                        playing
                          ? "is-playing"
                          : ""
                      }`
                    }
                    onClick={() =>
                      handlePlay(song)
                    }
                    disabled={
                      !song.audio_url
                    }
                    aria-label={
                      playing
                        ? `Pause ${
                            song.title ||
                            "song"
                          }`
                        : `Play ${
                            song.title ||
                            "song"
                          }`
                    }
                    title={
                      playing
                        ? "Pause"
                        : "Play"
                    }
                  >

                    {playing ? (

                      <FaPause />

                    ) : (

                      <FaPlay />

                    )}

                  </button>


                </div>

              );

            }
          )}


        </div>

      )}


    </div>

  );

}


export default History;