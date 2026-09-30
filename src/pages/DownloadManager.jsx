import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  FaDownload,
  FaMusic,
  FaTrash,
  FaDatabase,
  FaSyncAlt,
  FaExclamationTriangle,
  FaPlay,
  FaPause,
} from "react-icons/fa";

import {
  usePlayer,
} from "../context/usePlayer";

import "../assets/css/download-manager.css";

import Sidebar from "../components/Sidebar";

import Header from "../components/Header";


function DownloadManager() {

  const {
    offlineSongs,
    offlineLoading,
    removeOfflineSong,
    refreshOfflineSongs,

    /* PLAYER */
    currentSong,
    isPlaying,
    playSong,
    togglePlay,

  } = usePlayer();


  const [
    removingId,
    setRemovingId,
  ] = useState(null);


  const [
    removingAll,
    setRemovingAll,
  ] = useState(false);


  /* =========================================================
     REFRESH DOWNLOADS
  ========================================================= */

  useEffect(() => {

    if (
      typeof refreshOfflineSongs ===
      "function"
    ) {

      refreshOfflineSongs();

    }

  }, [refreshOfflineSongs]);


  /* =========================================================
     SONG LIST
  ========================================================= */

  const downloadedSongs =
    Array.isArray(offlineSongs)
      ? offlineSongs
      : [];


  /* =========================================================
     STORAGE SIZE
  ========================================================= */

  const totalBytes =
    useMemo(() => {

      return downloadedSongs.reduce(
        (
          total,
          song
        ) => {

          const size =
            Number(
              song?.size ||
              song?.fileSize ||
              song?.audioSize ||
              0
            );


          return total + size;

        },
        0
      );

    }, [
      downloadedSongs,
    ]);


  /* =========================================================
     FORMAT STORAGE
  ========================================================= */

  const formatStorage =
    (bytes) => {

      const value =
        Number(bytes) || 0;


      if (value <= 0) {

        return "0 MB";

      }


      const units = [
        "Bytes",
        "KB",
        "MB",
        "GB",
      ];


      const index =
        Math.floor(
          Math.log(value) /
          Math.log(1024)
        );


      const safeIndex =
        Math.min(
          index,
          units.length - 1
        );


      const result =
        value /
        Math.pow(
          1024,
          safeIndex
        );


      return `${result.toFixed(
        safeIndex === 0
          ? 0
          : 2
      )} ${units[safeIndex]}`;

    };


  /* =========================================================
     PLAY / PAUSE DOWNLOADED SONG
  ========================================================= */

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

          if (
            typeof togglePlay ===
            "function"
          ) {

            await togglePlay();

          }

          return;

        }


        /* -----------------------------------------------
           DIFFERENT SONG
        ------------------------------------------------ */

        if (
          typeof playSong ===
          "function"
        ) {

          await playSong(
            song,
            downloadedSongs
          );

        }

      } catch (error) {

        console.error(
          "Play downloaded song error:",
          error
        );

      }

    };


  /* =========================================================
     REMOVE SONG
  ========================================================= */

  const handleRemove =
    async (song) => {

      if (!song) {

        return;

      }


      const id =
        song.id;


      if (
        id === undefined ||
        id === null
      ) {

        return;

      }


      try {

        setRemovingId(
          id
        );


        await removeOfflineSong(
          id
        );


        if (
          typeof refreshOfflineSongs ===
          "function"
        ) {

          await refreshOfflineSongs();

        }

      } catch (error) {

        console.error(
          "Failed to remove download:",
          error
        );

      } finally {

        setRemovingId(
          null
        );

      }

    };


  /* =========================================================
     REMOVE ALL
  ========================================================= */

  const handleRemoveAll =
    async () => {

      if (
        downloadedSongs.length ===
        0
      ) {

        return;

      }


      const confirmed =
        window.confirm(
          "Remove all downloaded songs from this device?"
        );


      if (!confirmed) {

        return;

      }


      try {

        setRemovingAll(
          true
        );


        for (
          const song of
          downloadedSongs
        ) {

          if (
            song?.id !==
              undefined &&
            song?.id !==
              null
          ) {

            await removeOfflineSong(
              song.id
            );

          }

        }


        if (
          typeof refreshOfflineSongs ===
          "function"
        ) {

          await refreshOfflineSongs();

        }

      } catch (error) {

        console.error(
          "Failed to remove downloads:",
          error
        );

      } finally {

        setRemovingAll(
          false
        );

      }

    };


  /* =========================================================
     REFRESH
  ========================================================= */

  const handleRefresh =
    async () => {

      if (
        typeof refreshOfflineSongs !==
        "function"
      ) {

        return;

      }


      try {

        await refreshOfflineSongs();

      } catch (error) {

        console.error(
          "Failed to refresh downloads:",
          error
        );

      }

    };


  /* =========================================================
     LOADING
  ========================================================= */

  if (
    offlineLoading &&
    downloadedSongs.length ===
      0
  ) {

    return (

      <div className="download-manager">

        <div className="download-manager-loading">

          <FaDownload />

          <p>
            Loading downloaded songs...
          </p>

        </div>

      </div>

    );

  }


  /* =========================================================
     PAGE
  ========================================================= */

  return (

    <div className="download-manager">


      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <Sidebar />


      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="download-manager-header">

        <div>

          {/* <Header /> */}


          <div className="download-manager-title">

            <span className="download-manager-title-icon">

              <FaDownload />

            </span>


            <div>

              <h1>
                Download Manager
              </h1>


              <p>
                Manage your downloaded songs
              </p>

            </div>

          </div>

        </div>


        <button
          type="button"
          className="download-refresh-button"
          onClick={
            handleRefresh
          }
          disabled={
            offlineLoading
          }
        >

          <FaSyncAlt
            className={
              offlineLoading
                ? "download-refresh-spin"
                : ""
            }
          />

          <span>
            Refresh
          </span>

        </button>

      </div>


      {/* =====================================================
          STORAGE CARD
      ===================================================== */}

      <div className="download-storage-card">

        <div className="download-storage-icon">

          <FaDatabase />

        </div>


        <div className="download-storage-info">

          <span>
            Downloaded songs
          </span>


          <strong>
            {
              downloadedSongs.length
            }
          </strong>

        </div>


        <div className="download-storage-divider" />


        <div className="download-storage-info">

          <span>
            Storage used
          </span>


          <strong>
            {
              formatStorage(
                totalBytes
              )
            }
          </strong>

        </div>


        {downloadedSongs.length >
          0 && (

          <button
            type="button"
            className="download-remove-all"
            onClick={
              handleRemoveAll
            }
            disabled={
              removingAll
            }
          >

            <FaTrash />

            <span>

              {
                removingAll
                  ? "Removing..."
                  : "Remove All"
              }

            </span>

          </button>

        )}

      </div>


      {/* =====================================================
          EMPTY STATE
      ===================================================== */}

      {downloadedSongs.length ===
      0 ? (

        <div className="download-empty">

          <div className="download-empty-icon">

            <FaDownload />

          </div>


          <h2>
            No downloaded songs
          </h2>


          <p>
            Songs you download for offline
            listening will appear here.
          </p>

        </div>

      ) : (

        /* ===================================================
           DOWNLOADED SONGS
        =================================================== */

        <div className="download-list">

          <div className="download-list-header">

            <div>

              <h2>
                Downloaded Songs
              </h2>


              <p>
                Available for offline listening
              </p>

            </div>


            <span>
              {
                downloadedSongs.length
              }
            </span>

          </div>


          <div className="download-song-list">

            {downloadedSongs.map(
              (
                song,
                index
              ) => {

                const songId =
                  song?.id;


                const title =
                  song?.title ||
                  song?.name ||
                  "Unknown Song";


                const artist =
                  song?.artist_name ||
                  song?.artist ||
                  "KEERTHANA";


                const size =
                  song?.size ||
                  song?.fileSize ||
                  song?.audioSize ||
                  0;


                const isRemoving =
                  removingId ===
                  songId;


                const isCurrent =
                  Number(
                    currentSong?.id
                  ) ===
                  Number(
                    songId
                  );


                const isCurrentPlaying =
                  isCurrent &&
                  isPlaying;


                return (

                  <div
                    className={
                      isCurrent
                        ? "download-song current"
                        : "download-song"
                    }
                    key={
                      songId ??
                      `download-${index}`
                    }
                  >


                    {/* COVER */}

                    <div className="download-song-cover">

                      <FaMusic />

                    </div>


                    {/* INFORMATION */}

                    <div className="download-song-info">

                      <strong>
                        {title}
                      </strong>


                      <span>
                        {artist}
                      </span>


                      {Number(size) >
                        0 && (

                        <small>
                          {
                            formatStorage(
                              size
                            )
                          }
                        </small>

                      )}


                      {isCurrent && (

                        <em className="download-playing-status">

                          {
                            isPlaying
                              ? "Now Playing"
                              : "Paused"
                          }

                        </em>

                      )}

                    </div>


                    {/* DOWNLOADED STATUS */}

                    <div className="download-status">

                      <FaDownload />

                      <span>
                        Offline
                      </span>

                    </div>


                    {/* PLAY / PAUSE */}

                    <button
                      type="button"
                      className={
                        isCurrentPlaying
                          ? "download-play-button playing"
                          : "download-play-button"
                      }
                      onClick={() =>
                        handlePlay(
                          song
                        )
                      }
                      disabled={
                        isRemoving ||
                        removingAll
                      }
                      aria-label={
                        isCurrentPlaying
                          ? `Pause ${title}`
                          : `Play ${title}`
                      }
                      title={
                        isCurrentPlaying
                          ? "Pause"
                          : "Play offline"
                      }
                    >

                      {isCurrentPlaying ? (

                        <FaPause />

                      ) : (

                        <FaPlay />

                      )}

                    </button>


                    {/* REMOVE */}

                    <button
                      type="button"
                      className="download-delete-button"
                      onClick={() =>
                        handleRemove(
                          song
                        )
                      }
                      disabled={
                        isRemoving ||
                        removingAll
                      }
                      aria-label={
                        `Remove ${title}`
                      }
                      title="Remove download"
                    >

                      {isRemoving ? (

                        <FaSyncAlt
                          className="download-refresh-spin"
                        />

                      ) : (

                        <FaTrash />

                      )}

                    </button>

                  </div>

                );

              }
            )}

          </div>

        </div>

      )}


      {/* =====================================================
          INFO
      ===================================================== */}

      <div className="download-manager-note">

        <FaExclamationTriangle />

        <p>
          Downloaded songs are stored on
          this device and can be played
          without an internet connection.
        </p>

      </div>

    </div>

  );

}


export default DownloadManager;