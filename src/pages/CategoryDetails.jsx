
import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { useNavigate, useParams } from "react-router-dom";

import {
  FaArrowLeft,
  FaMusic,
  FaRedo,
  FaThLarge,
  FaPlay,
  FaPause,
  FaEllipsisV,
  FaPlus,
  FaListUl,
  FaTimes,
} from "react-icons/fa";

import API from "../services/api";
import Sidebar from "../components/Sidebar";
import { usePlayer } from "../context/usePlayer";
import { getMediaUrl } from "../utils/media";

import "../assets/css/categoryDetails.css";

/* =========================================================
   KEERTHANA MUSIC — CATEGORY DETAILS

   API:
   GET /api/categories/:id
   GET /api/songs

   Features:
   - Loads category information and actual song records
   - Filters songs using category_id
   - Displays horizontal song rows
   - Plays songs through the shared player
   - Supports queue and playlist actions
   - Shows loading, error and empty states
========================================================= */

function CategoryDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const menuRef = useRef(null);

  const {
    playSong,
    togglePlay,
    currentSong,
    isPlaying,
    addToQueue,
  } = usePlayer();

  const [category, setCategory] = useState(null);
  const [songs, setSongs] = useState([]);

  const [loading, setLoading] = useState(true);
  const [songsLoading, setSongsLoading] = useState(true);

  const [error, setError] = useState("");
  const [songsError, setSongsError] = useState("");

  const [activeMenu, setActiveMenu] = useState(null);
  const [notice, setNotice] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  /* =========================================================
     LOAD CATEGORY DETAILS
  ========================================================= */

  const loadCategory = useCallback(async () => {
    if (!id) {
      setCategory(null);
      setError("A category ID was not provided.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");
      setCategory(null);

      const response = await API.get(
        `/categories/${encodeURIComponent(id)}`
      );

      const data = response.data;

      if (data?.success === false) {
        throw new Error(
          data?.message || "Unable to load category."
        );
      }

      const categoryData =
        data?.category ||
        data?.data?.category ||
        data?.data ||
        null;

      if (
        !categoryData ||
        categoryData.id === undefined ||
        categoryData.id === null
      ) {
        throw new Error("Category details were not found.");
      }

      setCategory(categoryData);
    } catch (err) {
      console.error("Load category details error:", err);

      setCategory(null);

      setError(
        err?.response?.status === 404
          ? "This category could not be found."
          : err?.response?.data?.message ||
              err?.message ||
              "Unable to load this category. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadCategory();
  }, [loadCategory]);

  /* =========================================================
     LOAD SONGS FOR THIS CATEGORY

     Fetch actual songs rather than relying only on the
     category's song_count field.
  ========================================================= */

  const loadCategorySongs = useCallback(async () => {
    if (!id) {
      setSongs([]);
      setSongsError("");
      setSongsLoading(false);
      return;
    }

    try {
      setSongsLoading(true);
      setSongsError("");

      const response = await API.get("/songs");
      const data = response.data;

      const allSongs = Array.isArray(data?.songs)
        ? data.songs
        : Array.isArray(data?.data?.songs)
          ? data.data.songs
          : Array.isArray(data?.data)
            ? data.data
            : Array.isArray(data)
              ? data
              : [];

      const categorySongs = allSongs.filter((song) => {
        return (
          String(song?.category_id) === String(id)
        );
      });

      setSongs(categorySongs);

      console.log(
        `[CategoryDetails] Category ${id}:`,
        {
          categoryName: category?.name || "",
          totalSongsFromAPI: allSongs.length,
          matchingSongs: categorySongs.length,
          songs: categorySongs.map((song) => ({
            id: song.id,
            title: song.title,
            title_english: song.title_english,
            category_id: song.category_id,
            audio_url: song.audio_url,
            cover_url: song.cover_url,
          })),
        }
      );
    } catch (err) {
      console.error(
        "Load category songs error:",
        err
      );

      setSongs([]);
      setSongsError(
        err?.response?.data?.message ||
          "Unable to load this category's songs. Please try again."
      );
    } finally {
      setSongsLoading(false);
    }
  }, [id, category?.name]);

  useEffect(() => {
    loadCategorySongs();
  }, [loadCategorySongs]);

  /* =========================================================
     CLOSE MENU ON OUTSIDE CLICK / ESCAPE
  ========================================================= */

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target)
      ) {
        setActiveMenu(null);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setActiveMenu(null);
      }
    };

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
      document.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, []);

  /* =========================================================
     SEARCH
  ========================================================= */

  const query = searchQuery.trim().toLowerCase();

  const filteredSongs = songs.filter((song) => {
    if (!query) return true;

    const title = String(song.title || "").toLowerCase();
    const englishTitle = String(
      song.title_english || ""
    ).toLowerCase();

    const language = String(
      song.language || "Telugu"
    ).toLowerCase();

    const artistName = String(
      song.artist_name || ""
    ).toLowerCase();

    return (
      title.includes(query) ||
      englishTitle.includes(query) ||
      language.includes(query) ||
      artistName.includes(query)
    );
  });

  /* =========================================================
     CURRENT SONG HELPERS
  ========================================================= */

  const isCurrentSong = (song) =>
    currentSong?.id != null &&
    song?.id != null &&
    String(currentSong.id) === String(song.id);

  const categoryHasCurrentSong = songs.some(
    isCurrentSong
  );

  const categoryIsPlaying =
    categoryHasCurrentSong && Boolean(isPlaying);

  /* =========================================================
     PLAY / PAUSE SONG
  ========================================================= */

  const handleSongPlayPause = async (song) => {
    if (!song?.audio_url) {
      setNotice(
        "Audio is not available for this song."
      );
      return;
    }

    setActiveMenu(null);
    setNotice("");

    try {
      if (isCurrentSong(song)) {
        await togglePlay();
      } else {
        await playSong(song, songs);
      }
    } catch (err) {
      console.error("Song playback error:", err);

      setNotice(
        "Unable to play this song. Please try again."
      );
    }
  };

  /* =========================================================
     PLAY ALL CATEGORY SONGS
  ========================================================= */

  const handleCategoryPlayPause = async () => {
    const playableSongs = songs.filter(
      (song) => song?.audio_url
    );

    if (!playableSongs.length) {
      setNotice("No playable songs are available.");
      return;
    }

    setNotice("");

    try {
      if (categoryHasCurrentSong) {
        await togglePlay();
      } else {
        await playSong(
          playableSongs[0],
          playableSongs
        );
      }
    } catch (err) {
      console.error("Category playback error:", err);

      setNotice(
        "Unable to play these songs. Please try again."
      );
    }
  };

  /* =========================================================
     ADD TO QUEUE
  ========================================================= */

  const handleAddToQueue = (song) => {
    setActiveMenu(null);
    setNotice("");

    if (typeof addToQueue !== "function") {
      setNotice(
        "Queue is not available in the current player."
      );
      return;
    }

    try {
      addToQueue(song);

      setNotice(
        `Added "${song.title || "Song"}" to your queue.`
      );
    } catch (err) {
      console.error("Add to queue error:", err);

      setNotice(
        "Unable to add this song to the queue."
      );
    }
  };

  /* =========================================================
     ADD TO PLAYLIST
  ========================================================= */

  const handleAddToPlaylist = (song) => {
    setActiveMenu(null);

    navigate("/playlists", {
      state: {
        selectedSong: song,
        action: "add-song",
      },
    });
  };

  /* =========================================================
     BACK NAVIGATION
  ========================================================= */

  const goBack = () => {
    navigate("/categories");
  };

  /* =========================================================
     SONG COUNT

     Use actual fetched song records, not the database
     count alone, to represent the displayed collection.
  ========================================================= */

  const songCount = songs.length;

  /* =========================================================
     LOADING STATE
  ========================================================= */

  if (loading) {
    return (
      <div className="category-details-layout">
        <Sidebar />

        <main className="category-details-page">
          <button
            type="button"
            className="category-back-button"
            onClick={goBack}
          >
            <FaArrowLeft aria-hidden="true" />
            Back
          </button>

          <section
            className="categories-status"
            role="status"
            aria-live="polite"
          >
            <span className="categories-spinner" />
            <h2>Loading category</h2>
            <p>
              Getting your music category details...
            </p>
          </section>
        </main>
      </div>
    );
  }

  /* =========================================================
     ERROR STATE
  ========================================================= */

  if (error || !category) {
    return (
      <div className="category-details-layout">
        <Sidebar />

        <main className="category-details-page">
          <button
            type="button"
            className="category-back-button"
            onClick={goBack}
          >
            <FaArrowLeft aria-hidden="true" />
            Back
          </button>

          <section
            className="categories-status categories-error"
            role="alert"
          >
            <div className="categories-status-icon">
              <FaThLarge aria-hidden="true" />
            </div>

            <h2>Unable to open category</h2>
            <p>{error || "Category not found."}</p>

            <button
              type="button"
              className="categories-primary-button"
              onClick={loadCategory}
            >
              <FaRedo aria-hidden="true" />
              Try Again
            </button>
          </section>
        </main>
      </div>
    );
  }

  /* =========================================================
     PAGE
  ========================================================= */

  return (
    <div className="category-details-layout">
      <Sidebar />

      <main className="category-details-page">
        {/* BACK BUTTON */}

        <button
          type="button"
          className="category-back-button"
          onClick={goBack}
        >
          <FaArrowLeft aria-hidden="true" />
          Back
        </button>

        {/* CATEGORY PROFILE */}

        <section className="category-detail-card">
          <div className="category-detail-art">
            <FaMusic aria-hidden="true" />
          </div>

          <span className="categories-eyebrow">
            DISCOVER YOUR WORSHIP
          </span>

          <h1>
            {category.name || "Music Category"}
          </h1>

          {category.description && (
            <p className="category-detail-description">
              {category.description}
            </p>
          )}

          <div
            className={`category-detail-count ${
              songCount === 0
                ? "category-detail-count-empty"
                : ""
            }`}
            aria-live="polite"
          >
            <FaMusic aria-hidden="true" />

            <span>
              {songsLoading
                ? "Loading songs..."
                : `${songCount} ${
                    songCount === 1 ? "song" : "songs"
                  }`}
            </span>
          </div>

          {!songsLoading &&
            !songsError &&
            songCount === 0 && (
              <p className="category-detail-empty-message">
                No songs are currently available in this
                category.
              </p>
            )}
        </section>

        {/* SONG COLLECTION */}

        <section className="artist-songs-section category-songs-section">
          <div className="artist-songs-header">
            <div>
              <span className="artist-songs-overline">
                EXPLORE THIS CATEGORY
              </span>

              <h2>
                {query ? "Search Results" : "Songs"}
              </h2>
            </div>

            <span className="artist-track-count">
              {String(
                query
                  ? filteredSongs.length
                  : songCount
              ).padStart(2, "0")}{" "}
              {query
                ? filteredSongs.length === 1
                  ? "match"
                  : "matches"
                : "tracks"}
            </span>
          </div>

          {/* PLAY ALL */}

          <div className="category-play-all-bar">
            <button
              type="button"
              className="artist-profile-play"
              onClick={handleCategoryPlayPause}
              disabled={
                songsLoading ||
                !songs.some((song) => song?.audio_url)
              }
              aria-label={
                categoryIsPlaying
                  ? "Pause category songs"
                  : "Play all category songs"
              }
            >
              {categoryIsPlaying ? (
                <FaPause />
              ) : (
                <FaPlay />
              )}

              <span>
                {categoryIsPlaying
                  ? "Pause"
                  : "Play all"}
              </span>
            </button>
          </div>

          {/* STATUS MESSAGE */}

          {notice && (
            <div
              className="artist-notice"
              role="status"
              aria-live="polite"
            >
              <FaMusic />
              <span>{notice}</span>

              <button
                type="button"
                aria-label="Dismiss message"
                onClick={() => setNotice("")}
              >
                ×
              </button>
            </div>
          )}

          {/* SEARCH */}

          <div className="category-song-search">
            <input
              type="search"
              value={searchQuery}
              onChange={(event) =>
                setSearchQuery(event.target.value)
              }
              placeholder="Search songs in this category..."
              aria-label="Search songs in this category"
            />

            {searchQuery && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => setSearchQuery("")}
              >
                <FaTimes />
              </button>
            )}
          </div>

          {/* SONGS LOADING */}

          {songsLoading && (
            <div
              className="categories-status"
              role="status"
              aria-live="polite"
            >
              <span className="categories-spinner" />
              <h2>Loading songs</h2>
              <p>
                Finding songs in this category...
              </p>
            </div>
          )}

          {/* SONG FETCH ERROR */}

          {!songsLoading && songsError && (
            <div
              className="categories-status categories-error"
              role="alert"
            >
              <h2>Unable to load songs</h2>
              <p>{songsError}</p>

              <button
                type="button"
                className="categories-primary-button"
                onClick={loadCategorySongs}
              >
                <FaRedo aria-hidden="true" />
                Try Again
              </button>
            </div>
          )}

          {/* SONG ROWS */}

          {!songsLoading &&
            !songsError &&
            filteredSongs.length > 0 && (
              <div
                className="artist-song-list category-song-list"
                id="category-song-list"
              >
                {filteredSongs.map((song, index) => {
                  const cover = song.cover_url
                    ? getMediaUrl(song.cover_url)
                    : "/images/default-cover.png";

                  const isCurrent = isCurrentSong(song);
                  const isSongPlaying =
                    isCurrent && isPlaying;

                  const menuOpen =
                    activeMenu === song.id;

                  const songTitle =
                    song.title ||
                    song.title_english ||
                    "Untitled song";

                  return (
                    <article
                      key={song.id}
                      className={`artist-track-row ${
                        isCurrent ? "is-current" : ""
                      }`}
                    >
                      <span className="artist-track-index">
                        {isSongPlaying ? (
                          <span
                            className="artist-track-equalizer"
                            aria-label="Currently playing"
                          >
                            <i />
                            <i />
                            <i />
                          </span>
                        ) : (
                          <span className="artist-track-number">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                        )}
                      </span>

                      <div className="artist-track-artwork">
                        <img
                          src={cover}
                          alt={`${songTitle} cover`}
                          loading="lazy"
                          onError={(event) => {
                            event.currentTarget.onerror = null;
                            event.currentTarget.src =
                              "/images/default-cover.png";
                          }}
                        />
                      </div>

                      <button
                        type="button"
                        className="artist-track-details"
                        onClick={() =>
                          handleSongPlayPause(song)
                        }
                        disabled={!song?.audio_url}
                        aria-label={
                          isSongPlaying
                            ? `Pause ${songTitle}`
                            : `Play ${songTitle}`
                        }
                        title={
                          isSongPlaying
                            ? `Pause ${songTitle}`
                            : `Play ${songTitle}`
                        }
                      >
                        <strong
                          className={
                            isCurrent
                              ? "is-playing-title"
                              : ""
                          }
                        >
                          {songTitle}
                        </strong>

                        <span>
                          {song.artist_name || "Unknown artist"}
                        </span>
                      </button>

                      <span className="artist-track-language">
                        {song.language || "Telugu"}
                      </span>

                      <div
                        className="artist-track-actions"
                        ref={menuOpen ? menuRef : null}
                      >
                        <button
                          type="button"
                          className={`artist-track-more ${
                            menuOpen ? "is-open" : ""
                          }`}
                          aria-label={`More options for ${songTitle}`}
                          aria-haspopup="menu"
                          aria-expanded={menuOpen}
                          onClick={(event) => {
                            event.stopPropagation();

                            setActiveMenu(
                              menuOpen ? null : song.id
                            );
                          }}
                        >
                          <FaEllipsisV />
                        </button>

                        {menuOpen && (
                          <div
                            className="artist-track-menu"
                            role="menu"
                          >
                            <button
                              type="button"
                              role="menuitem"
                              onClick={() =>
                                handleSongPlayPause(song)
                              }
                              disabled={!song?.audio_url}
                            >
                              {isSongPlaying ? (
                                <FaPause />
                              ) : (
                                <FaPlay />
                              )}

                              <span>
                                {isSongPlaying
                                  ? "Pause"
                                  : "Play"}
                              </span>
                            </button>

                            <button
                              type="button"
                              role="menuitem"
                              onClick={() =>
                                handleAddToQueue(song)
                              }
                            >
                              <FaPlus />
                              <span>Add to queue</span>
                            </button>

                            <button
                              type="button"
                              role="menuitem"
                              onClick={() =>
                                handleAddToPlaylist(song)
                              }
                            >
                              <FaListUl />
                              <span>Add to playlist</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

          {/* EMPTY SEARCH / EMPTY CATEGORY */}

          {!songsLoading &&
            !songsError &&
            filteredSongs.length === 0 && (
              <div className="artist-songs-empty">
                <span className="artist-empty-icon">
                  <FaMusic />
                </span>

                <h3>
                  {query
                    ? "No matching songs"
                    : "No songs available"}
                </h3>

                <p>
                  {query
                    ? "Try another song title or clear your search."
                    : `Songs in ${
                        category.name || "this category"
                      } will appear here when they are available.`}
                </p>

                {query && (
                  <button
                    type="button"
                    className="artist-details-reset-search"
                    onClick={() => setSearchQuery("")}
                  >
                    <FaTimes />
                    Clear search
                  </button>
                )}
              </div>
            )}
        </section>
      </main>
    </div>
  );
}

export default CategoryDetails;
