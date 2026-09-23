import {
  useCallback,
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
  FaPlay,
  FaPlus,
  FaTrash,
  FaTimes,
} from "react-icons/fa";

import API from "../services/api";

import {
  usePlayer,
} from "../context/PlayerContext";

import {
  getMediaUrl,
} from "../utils/media";

import "../assets/css/playlistDetails.css";


function PlaylistDetails() {
  const { id } = useParams();

  const navigate = useNavigate();

  const { playSong } = usePlayer();

  const [playlist, setPlaylist] =
    useState(null);

  const [allSongs, setAllSongs] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [showAddSongs, setShowAddSongs] =
    useState(false);

  const [actionLoading, setActionLoading] =
    useState(false);


  /* =========================================
     LOAD PLAYLIST
  ========================================= */

  const fetchPlaylist =
    useCallback(async () => {
      try {
        setLoading(true);

        setError("");

        const response =
          await API.get(
            `/playlists/${id}`
          );

        setPlaylist(
          response.data.playlist
        );
      } catch (error) {
        console.error(
          "Load playlist error:",
          error
        );

        setError(
          error.response?.data?.message ||
          "Unable to load playlist"
        );
      } finally {
        setLoading(false);
      }
    }, [id]);


  useEffect(() => {
    fetchPlaylist();
  }, [fetchPlaylist]);


  /* =========================================
     LOAD ALL SONGS
  ========================================= */

  const fetchAllSongs =
    async () => {
      try {
        const response =
          await API.get("/songs");

        setAllSongs(
          response.data.songs || []
        );
      } catch (error) {
        console.error(
          "Unable to load songs:",
          error
        );
      }
    };


  /* =========================================
     OPEN ADD SONG MODAL
  ========================================= */

  const openAddSongs = async () => {
    await fetchAllSongs();

    setShowAddSongs(true);
  };


  /* =========================================
     ADD SONG
  ========================================= */

  const addSong = async (songId) => {
    try {
      setActionLoading(true);

      await API.post(
        `/playlists/${id}/songs/${songId}`
      );

      await fetchPlaylist();
    } catch (error) {
      console.error(
        "Add song error:",
        error
      );

      alert(
        error.response?.data?.message ||
        "Unable to add song"
      );
    } finally {
      setActionLoading(false);
    }
  };


  /* =========================================
     REMOVE SONG
  ========================================= */

  const removeSong =
    async (songId) => {
      try {
        await API.delete(
          `/playlists/${id}/songs/${songId}`
        );

        await fetchPlaylist();
      } catch (error) {
        console.error(
          "Remove song error:",
          error
        );

        alert(
          error.response?.data?.message ||
          "Unable to remove song"
        );
      }
    };


  /* =========================================
     DELETE PLAYLIST
  ========================================= */

  const deletePlaylist =
    async () => {
      const confirmed =
        window.confirm(
          `Delete "${playlist.name}"?`
        );

      if (!confirmed) {
        return;
      }

      try {
        await API.delete(
          `/playlists/${id}`
        );

        navigate("/playlists");
      } catch (error) {
        console.error(
          "Delete playlist error:",
          error
        );

        alert(
          error.response?.data?.message ||
          "Unable to delete playlist"
        );
      }
    };


  /* =========================================
     PLAY ALL
  ========================================= */

  const playPlaylist = () => {
    if (
      !playlist?.songs ||
      playlist.songs.length === 0
    ) {
      return;
    }

    playSong(
      playlist.songs[0],
      playlist.songs
    );
  };


  /* =========================================
     CHECK SONG
  ========================================= */

  const songExistsInPlaylist =
    (songId) => {
      return playlist?.songs?.some(
        (song) =>
          Number(song.id) ===
          Number(songId)
      );
    };


  /* =========================================
     LOADING
  ========================================= */

  if (loading) {
    return (
      <div className="playlist-details-page">
        <div className="playlist-loading">
          Loading playlist...
        </div>
      </div>
    );
  }


  /* =========================================
     ERROR
  ========================================= */

  if (error || !playlist) {
    return (
      <div className="playlist-details-page">

        <button
          className="playlist-back-button"
          onClick={() =>
            navigate("/playlists")
          }
        >
          <FaArrowLeft />

          Back
        </button>

        <div className="playlist-error">
          {error ||
            "Playlist not found"}
        </div>

      </div>
    );
  }


  return (
    <div className="playlist-details-page">


      {/* =====================================
          BACK
      ===================================== */}

      <button
        type="button"
        className="playlist-back-button"
        onClick={() =>
          navigate("/playlists")
        }
      >
        <FaArrowLeft />

        Back to Playlists
      </button>


      {/* =====================================
          PLAYLIST HEADER
      ===================================== */}

      <section className="playlist-hero">

        <div className="playlist-large-cover">

          {playlist.cover_url ? (

            <img
              src={getMediaUrl(
                playlist.cover_url
              )}
              alt={playlist.name}
            />

          ) : (

            <FaMusic />

          )}

        </div>


        <div className="playlist-hero-info">

          <span className="playlist-label">
            PLAYLIST
          </span>

          <h1>
            {playlist.name}
          </h1>

          {playlist.description && (
            <p>
              {playlist.description}
            </p>
          )}

          <div className="playlist-meta">

            <strong>
              KEERTHANA
            </strong>

            <span>•</span>

            <span>
              {playlist.song_count || 0}
              {" "}
              {
                playlist.song_count === 1
                  ? "song"
                  : "songs"
              }
            </span>

          </div>

        </div>

      </section>


      {/* =====================================
          ACTION BUTTONS
      ===================================== */}

      <section className="playlist-actions">

        <button
          type="button"
          className="playlist-main-play"
          onClick={playPlaylist}
          disabled={
            !playlist.songs?.length
          }
          title="Play playlist"
        >
          <FaPlay />
        </button>


        <button
          type="button"
          className="playlist-add-button"
          onClick={openAddSongs}
        >
          <FaPlus />

          Add Songs
        </button>


        <button
          type="button"
          className="playlist-delete-button"
          onClick={deletePlaylist}
        >
          <FaTrash />

          Delete
        </button>

      </section>


      {/* =====================================
          EMPTY PLAYLIST
      ===================================== */}

      {playlist.songs?.length === 0 ? (

        <div className="playlist-empty-state">

          <FaMusic />

          <h2>
            Your playlist is empty
          </h2>

          <p>
            Add Christian songs to
            start listening.
          </p>

          <button
            type="button"
            onClick={openAddSongs}
          >
            <FaPlus />

            Add Songs
          </button>

        </div>

      ) : (

        /* =================================
           SONG TABLE
        ================================= */

        <div className="playlist-song-list">

          <div className="playlist-table-header">

            <span>#</span>

            <span>
              TITLE
            </span>

            <span>
              CATEGORY
            </span>

            <span />

          </div>


          {playlist.songs.map(
            (song, index) => {

              const cover =
                song.cover_url
                  ? getMediaUrl(
                      song.cover_url
                    )
                  : "/images/default-cover.png";

              return (

                <div
                  className="playlist-song-row"
                  key={song.id}
                >

                  <div className="playlist-song-number">

                    <span>
                      {index + 1}
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        playSong(
                          song,
                          playlist.songs
                        )
                      }
                    >
                      <FaPlay />
                    </button>

                  </div>


                  <div className="playlist-song-title">

                    <img
                      src={cover}
                      alt={song.title}
                    />

                    <div>

                      <strong>
                        {song.title}
                      </strong>

                      <span>
                        {song.artist_name ||
                          "KEERTHANA"}
                      </span>

                    </div>

                  </div>


                  <div className="playlist-song-category">

                    {song.category_name ||
                      "Christian Music"}

                  </div>


                  <button
                    type="button"
                    className="playlist-remove-song"
                    onClick={() =>
                      removeSong(song.id)
                    }
                    title="Remove song"
                  >
                    <FaTimes />
                  </button>

                </div>

              );

            }
          )}

        </div>

      )}


      {/* =====================================
          ADD SONG MODAL
      ===================================== */}

      {showAddSongs && (

        <div
          className="add-song-overlay"
          onClick={() =>
            setShowAddSongs(false)
          }
        >

          <div
            className="add-song-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div className="add-song-header">

              <div>

                <span>
                  KEERTHANA
                </span>

                <h2>
                  Add Songs
                </h2>

              </div>


              <button
                type="button"
                onClick={() =>
                  setShowAddSongs(false)
                }
              >
                <FaTimes />
              </button>

            </div>


            <div className="add-song-list">

              {allSongs.map((song) => {

                const alreadyAdded =
                  songExistsInPlaylist(
                    song.id
                  );

                const cover =
                  song.cover_url
                    ? getMediaUrl(
                        song.cover_url
                      )
                    : "/images/default-cover.png";

                return (

                  <div
                    className="add-song-row"
                    key={song.id}
                  >

                    <img
                      src={cover}
                      alt={song.title}
                    />


                    <div className="add-song-info">

                      <strong>
                        {song.title}
                      </strong>

                      <span>
                        {song.artist_name ||
                          "KEERTHANA"}
                      </span>

                    </div>


                    <button
                      type="button"
                      disabled={
                        alreadyAdded ||
                        actionLoading
                      }
                      onClick={() =>
                        addSong(song.id)
                      }
                    >

                      {alreadyAdded
                        ? "Added"
                        : "Add"}

                    </button>

                  </div>

                );

              })}

            </div>

          </div>

        </div>

      )}

    </div>
  );
}


export default PlaylistDetails;