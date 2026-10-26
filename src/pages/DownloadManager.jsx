import React, {
  useCallback,
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
  FaSearch,
  FaTimes,
} from "react-icons/fa";

import { usePlayer } from "../context/usePlayer";
import Sidebar from "../components/Sidebar";
import VoiceSearch from "../components/VoiceSearch";

import "../assets/css/download-manager.css";

function DownloadManager() {
  const {
    offlineSongs,
    offlineLoading,
    removeOfflineSong,
    refreshOfflineSongs,
    currentSong,
    isPlaying,
    playSong,
    togglePlay,
  } = usePlayer();

  const [removingId, setRemovingId] = useState(null);
  const [removingAll, setRemovingAll] = useState(false);
  const [playAllActive, setPlayAllActive] = useState(false);

  const [searchText, setSearchText] = useState("");
  const [voiceLanguage, setVoiceLanguage] = useState("te-IN");

  /* =========================================================
     REFRESH DOWNLOADS
  ========================================================= */

  useEffect(() => {
    if (typeof refreshOfflineSongs === "function") {
      refreshOfflineSongs();
    }
  }, [refreshOfflineSongs]);

  /* =========================================================
     VOICE SEARCH
  ========================================================= */

  const handleVoiceSearch = useCallback((text) => {
    setSearchText(text);
  }, []);

  /* =========================================================
     NORMALIZE DOWNLOADED SONGS
  ========================================================= */

  const downloadedSongs = useMemo(
    () => (Array.isArray(offlineSongs) ? offlineSongs : []),
    [offlineSongs]
  );

  const playableSongs = useMemo(
    () =>
      downloadedSongs.filter(
        (song) => Boolean(song?.audio_url)
      ),
    [downloadedSongs]
  );

  /* =========================================================
     SEARCH DOWNLOADED SONGS
  ========================================================= */

  const filteredSongs = useMemo(() => {
    const query = searchText.trim().toLowerCase();

    if (!query) return downloadedSongs;

    return downloadedSongs.filter((song) => {
      const searchableFields = [
        song?.title,
        song?.title_english,
        song?.titleEnglish,
        song?.name,
        song?.artist_name,
        song?.artistName,
        song?.artist?.name,
        typeof song?.artist === "string"
          ? song.artist
          : "",
        song?.album_name,
        song?.album_title,
        song?.album?.title,
        song?.album?.name,
        song?.language,
        song?.category_name,
        song?.category?.name,
      ];

      return searchableFields.some((field) =>
        String(field || "").toLowerCase().includes(query)
      );
    });
  }, [downloadedSongs, searchText]);

  const currentIsDownloaded = downloadedSongs.some(
    (song) =>
      song?.id != null &&
      currentSong?.id != null &&
      String(song.id) === String(currentSong.id)
  );

  const isPlayAllPaused =
    playAllActive && currentIsDownloaded && !isPlaying;

  const isPlayAllPlaying =
    playAllActive && currentIsDownloaded && isPlaying;

  /* =========================================================
     STORAGE SIZE
  ========================================================= */

  const totalBytes = useMemo(() => {
    return downloadedSongs.reduce((total, song) => {
      const rawSize =
        song?.size ??
        song?.fileSize ??
        song?.audioSize ??
        0;

      const size = Number(rawSize);

      return total + (
        Number.isFinite(size) && size > 0 ? size : 0
      );
    }, 0);
  }, [downloadedSongs]);

  /* =========================================================
     FORMAT STORAGE
  ========================================================= */

  const formatStorage = useCallback((bytes) => {
    const value = Number(bytes) || 0;

    if (value <= 0) return "0 MB";

    const units = ["Bytes", "KB", "MB", "GB", "TB"];

    const index = Math.min(
      Math.floor(Math.log(value) / Math.log(1024)),
      units.length - 1
    );

    const result = value / Math.pow(1024, index);

    return `${result.toFixed(index === 0 ? 0 : 2)} ${units[index]}`;
  }, []);

  /* =========================================================
     PLAY / PAUSE ALL DOWNLOADED SONGS
  ========================================================= */

  const handlePlayAll = async () => {
    if (
      removingAll ||
      playableSongs.length === 0 ||
      typeof playSong !== "function"
    ) {
      return;
    }

    try {
      // Resume or pause the active downloaded-song queue.
      if (
        playAllActive &&
        currentIsDownloaded &&
        typeof togglePlay === "function"
      ) {
        await togglePlay();
        return;
      }

      const firstSong = playableSongs[0];

      const firstIndex = downloadedSongs.findIndex(
        (song) =>
          song?.id != null &&
          String(song.id) === String(firstSong.id)
      );

      setPlayAllActive(true);

      await playSong(
        firstSong,
        downloadedSongs,
        firstIndex >= 0 ? firstIndex : 0
      );
    } catch (error) {
      console.error(
        "Failed to play downloaded songs:",
        error
      );

      setPlayAllActive(false);
    }
  };

  /* =========================================================
     PLAY / PAUSE ONE DOWNLOADED SONG
  ========================================================= */

  const handlePlay = async (song) => {
    if (!song || removingAll) return;

    const isCurrent =
      currentSong?.id != null &&
      song?.id != null &&
      String(currentSong.id) === String(song.id);

    try {
      if (isCurrent) {
        if (typeof togglePlay === "function") {
          await togglePlay();
        }

        return;
      }

      // Individual playback takes over from Play All.
      setPlayAllActive(false);

      if (typeof playSong !== "function") return;

      const index = downloadedSongs.findIndex(
        (item) =>
          item?.id != null &&
          song?.id != null &&
          String(item.id) === String(song.id)
      );

      await playSong(
        song,
        downloadedSongs,
        index >= 0 ? index : 0
      );
    } catch (error) {
      console.error(
        "Failed to play downloaded song:",
        error
      );
    }
  };

  /* =========================================================
     REMOVE ONE DOWNLOAD
  ========================================================= */

  const handleRemove = async (song) => {
    if (
      !song ||
      song.id == null ||
      removingAll ||
      removingId !== null
    ) {
      return;
    }

    const confirmed = window.confirm(
      `Remove "${song.title || song.name || "this song"}" from downloads?`
    );

    if (!confirmed) return;

    try {
      setRemovingId(song.id);

      await removeOfflineSong(song.id);

      if (typeof refreshOfflineSongs === "function") {
        await refreshOfflineSongs();
      }

      if (downloadedSongs.length <= 1) {
        setPlayAllActive(false);
      }
    } catch (error) {
      console.error("Failed to remove download:", error);

      window.alert(
        "Unable to remove this download. Please try again."
      );
    } finally {
      setRemovingId(null);
    }
  };

  /* =========================================================
     REMOVE ALL DOWNLOADS
  ========================================================= */

  const handleRemoveAll = async () => {
    if (
      downloadedSongs.length === 0 ||
      removingAll ||
      removingId !== null
    ) {
      return;
    }

    const confirmed = window.confirm(
      "Remove all downloaded songs from this device?"
    );

    if (!confirmed) return;

    try {
      setRemovingAll(true);
      setPlayAllActive(false);

      for (const song of downloadedSongs) {
        if (song?.id != null) {
          await removeOfflineSong(song.id);
        }
      }

      if (typeof refreshOfflineSongs === "function") {
        await refreshOfflineSongs();
      }

      setSearchText("");
    } catch (error) {
      console.error("Failed to remove downloads:", error);

      window.alert(
        "Some downloads could not be removed. Please refresh and try again."
      );

      if (typeof refreshOfflineSongs === "function") {
        await refreshOfflineSongs();
      }
    } finally {
      setRemovingAll(false);
    }
  };

  /* =========================================================
     REFRESH BUTTON
  ========================================================= */

  const handleRefresh = async () => {
    if (
      typeof refreshOfflineSongs !== "function" ||
      offlineLoading ||
      removingAll
    ) {
      return;
    }

    try {
      await refreshOfflineSongs();
    } catch (error) {
      console.error("Failed to refresh downloads:", error);
    }
  };

  /* =========================================================
     LOADING STATE
  ========================================================= */

  if (offlineLoading && downloadedSongs.length === 0) {
    return (
      <div className="download-manager">
        <Sidebar />

        <main className="download-manager-main">
          <div className="download-manager-loading">
            <span className="download-loading-icon">
              <FaDownload aria-hidden="true" />
            </span>

            <h2>Preparing your music</h2>
            <p>Loading downloaded songs...</p>

            <span
              className="download-loading-spinner"
              aria-hidden="true"
            />
          </div>
        </main>
      </div>
    );
  }

  /* =========================================================
     MAIN PAGE
  ========================================================= */

  return (
    <div className="download-manager">
      <Sidebar />

      <main className="download-manager-main">
        {/* PAGE HEADER */}

        <header className="download-manager-header">
          <div className="download-manager-title">
            <span className="download-manager-title-icon">
              <FaDownload aria-hidden="true" />
            </span>

            <div>
              <span className="download-manager-eyebrow">
                YOUR OFFLINE LIBRARY
              </span>

              <h1>Download Manager</h1>

              <p>Your music, ready to play anytime.</p>
            </div>
          </div>

          <button
            type="button"
            className="download-refresh-button"
            onClick={handleRefresh}
            disabled={offlineLoading || removingAll}
          >
            <FaSyncAlt
              className={
                offlineLoading ? "download-refresh-spin" : ""
              }
              aria-hidden="true"
            />

            <span>
              {offlineLoading ? "Refreshing..." : "Refresh"}
            </span>
          </button>
        </header>

        {/* STORAGE SUMMARY */}

        <section
          className="download-storage-card"
          aria-label="Download storage summary"
        >
          <div className="download-storage-icon">
            <FaDatabase aria-hidden="true" />
          </div>

          <div className="download-storage-info">
            <span>Downloaded songs</span>
            <strong>{downloadedSongs.length}</strong>
          </div>

          <div
            className="download-storage-divider"
            aria-hidden="true"
          />

          <div className="download-storage-info">
            <span>Storage used</span>
            <strong>{formatStorage(totalBytes)}</strong>
          </div>
        </section>

        {/* EMPTY LIBRARY STATE */}

        {downloadedSongs.length === 0 ? (
          <section className="download-empty">
            <div className="download-empty-icon">
              <FaDownload aria-hidden="true" />
            </div>

            <span className="download-empty-eyebrow">
              YOUR MUSIC COLLECTION
            </span>

            <h2>No downloaded songs yet</h2>

            <p>
              Songs you download for offline listening will
              appear here, ready whenever you need them.
            </p>
          </section>
        ) : (
          <section className="download-list">
            {/* SEARCH DOWNLOADED SONGS */}

            <div className="download-search-section">
              <div className="download-search-heading">
                <div>
                  <h2>Your Downloads</h2>

                  <p>
                    {searchText.trim()
                      ? `${filteredSongs.length} of ${downloadedSongs.length} songs found`
                      : `${downloadedSongs.length} ${
                          downloadedSongs.length === 1
                            ? "song"
                            : "songs"
                        } available offline`}
                  </p>
                </div>
              </div>

              {/* VOICE + TEXT SEARCH */}

              <div className="download-voice-search-section">
                <VoiceSearch
                  value={searchText}
                  onChange={setSearchText}
                  onSearch={handleVoiceSearch}
                  language={voiceLanguage}
                  onLanguageChange={setVoiceLanguage}
                  placeholder="Search downloaded songs, artists or albums..."
                  ariaLabel="Search downloaded songs by voice or text"
                />
              </div>
            </div>

            {/* PLAY ALL AND REMOVE ALL */}

            <div className="download-play-all-row">
              <button
                type="button"
                className={
                  isPlayAllPlaying
                    ? "download-play-all-button is-playing"
                    : isPlayAllPaused
                      ? "download-play-all-button is-paused"
                      : "download-play-all-button"
                }
                onClick={handlePlayAll}
                disabled={
                  removingAll ||
                  playableSongs.length === 0
                }
              >
                <span className="download-play-all-icon">
                  {isPlayAllPlaying ? (
                    <FaPause aria-hidden="true" />
                  ) : (
                    <FaPlay aria-hidden="true" />
                  )}
                </span>

                <span className="download-play-all-label">
                  {isPlayAllPlaying
                    ? "Pause All"
                    : isPlayAllPaused
                      ? "Resume All"
                      : "Play All"}
                </span>
              </button>

              <button
                type="button"
                className="download-remove-all"
                onClick={handleRemoveAll}
                disabled={
                  removingAll ||
                  removingId !== null ||
                  downloadedSongs.length === 0
                }
              >
                {removingAll ? (
                  <FaSyncAlt
                    className="download-refresh-spin"
                    aria-hidden="true"
                  />
                ) : (
                  <FaTrash aria-hidden="true" />
                )}

                <span>
                  {removingAll ? "Removing..." : "Remove All"}
                </span>
              </button>
            </div>

            {/* FILTERED SONG LIST */}

            {filteredSongs.length > 0 ? (
              <div className="download-song-list">
                {filteredSongs.map((song, index) => {
                  const songId = song?.id;

                  const title =
                    song?.title ||
                    song?.name ||
                    "Unknown Song";

                  const artist =
                    song?.artist_name ||
                    song?.artist?.name ||
                    song?.artist ||
                    song?.artistName ||
                    "KEERTHANA";

                  const rawSize =
                    song?.size ??
                    song?.fileSize ??
                    song?.audioSize ??
                    0;

                  const size = Number(rawSize) || 0;

                  const isRemoving =
                    removingId !== null &&
                    String(removingId) === String(songId);

                  const isCurrent =
                    currentSong?.id != null &&
                    songId != null &&
                    String(currentSong.id) === String(songId);

                  const isCurrentPlaying =
                    isCurrent && isPlaying;

                  const cover =
                    song?.cover_url ||
                    song?.coverUrl ||
                    song?.image ||
                    "";

                  return (
                    <article
                      className={[
                        "download-song",
                        isCurrent ? "current" : "",
                        isCurrentPlaying ? "is-playing" : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      key={songId ?? `download-${index}`}
                    >
                      {/* SONG COVER */}

                      <button
                        type="button"
                        className="download-song-cover"
                        onClick={() => handlePlay(song)}
                        disabled={
                          isRemoving ||
                          removingAll ||
                          !song?.audio_url
                        }
                        aria-label={
                          isCurrentPlaying
                            ? `Pause ${title}`
                            : `Play ${title}`
                        }
                      >
                        {cover ? (
                          <img
                            src={cover}
                            alt=""
                            loading="lazy"
                            onError={(event) => {
                              event.currentTarget.style.display =
                                "none";
                            }}
                          />
                        ) : (
                          <FaMusic aria-hidden="true" />
                        )}

                        <span className="download-cover-play">
                          {isCurrentPlaying ? (
                            <FaPause aria-hidden="true" />
                          ) : (
                            <FaPlay aria-hidden="true" />
                          )}
                        </span>
                      </button>

                      {/* SONG DETAILS */}

                      <div className="download-song-info">
                        <button
                          type="button"
                          className="download-song-title"
                          title={`Play ${title}`}
                          onClick={() => handlePlay(song)}
                          disabled={
                            isRemoving ||
                            removingAll ||
                            !song?.audio_url
                          }
                        >
                          {title}
                        </button>

                        <span
                          className="download-song-artist"
                          title={String(artist)}
                        >
                          {artist}
                        </span>

                        <div className="download-song-meta">
                          {size > 0 && (
                            <span>{formatStorage(size)}</span>
                          )}

                          {isCurrent && (
                            <em className="download-playing-status">
                              {isPlaying ? "Now Playing" : "Paused"}
                            </em>
                          )}
                        </div>
                      </div>

                      {/* OFFLINE STATUS */}

                      <div className="download-status">
                        <span className="download-status-dot" />
                        <FaDownload aria-hidden="true" />
                        <span>Offline</span>
                      </div>

                      {/* REMOVE DOWNLOAD */}

                      <button
                        type="button"
                        className="download-delete-button"
                        onClick={() => handleRemove(song)}
                        disabled={
                          isRemoving ||
                          removingAll ||
                          removingId !== null
                        }
                        aria-label={`Remove ${title} download`}
                        title="Remove download"
                      >
                        {isRemoving ? (
                          <FaSyncAlt
                            className="download-refresh-spin"
                            aria-hidden="true"
                          />
                        ) : (
                          <FaTrash aria-hidden="true" />
                        )}
                      </button>
                    </article>
                  );
                })}
              </div>
            ) : (
              /* SEARCH HAS NO MATCHES */

              <div className="download-search-empty">
                <div className="download-search-empty-icon">
                  <FaSearch aria-hidden="true" />
                </div>

                <h3>No matching downloads</h3>

                <p>
                  Try another song title, artist, album or language.
                </p>

                <button
                  type="button"
                  className="download-search-reset"
                  onClick={() => setSearchText("")}
                >
                  Clear Search
                </button>
              </div>
            )}
          </section>
        )}

        {/* INFORMATION NOTE */}

        <aside className="download-manager-note">
          <span className="download-note-icon">
            <FaExclamationTriangle aria-hidden="true" />
          </span>

          <p>
            Downloaded songs are stored on this device and
            can be played without an internet connection,
            provided their offline audio files are available.
          </p>
        </aside>
      </main>
    </div>
  );
}

export default DownloadManager;