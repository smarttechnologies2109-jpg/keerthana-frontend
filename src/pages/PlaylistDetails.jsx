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
  FaPause,
  FaPlus,
  FaTrash,
  FaTimes,
} from "react-icons/fa";

import API from "../services/api";

import {
  usePlayer,
} from "../context/usePlayer";

import {
  getMediaUrl,
} from "../utils/media";

import "../assets/css/playlistDetails.css";


function PlaylistDetails() {

  const { id } = useParams();

  const navigate = useNavigate();


  /* =========================================================
     GLOBAL PLAYER
  ========================================================= */

  const {
    currentSong,
    isPlaying,
    playSong,
    togglePlay,
  } = usePlayer();


  /* =========================================================
     STATE
  ========================================================= */

  const [
    playlist,
    setPlaylist,
  ] = useState(null);


  const [
    allSongs,
    setAllSongs,
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
    showAddSongs,
    setShowAddSongs,
  ] = useState(false);


  const [
    actionLoading,
    setActionLoading,
  ] = useState(false);


  /* =========================================================
     LOAD PLAYLIST
  ========================================================= */

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
          response.data?.playlist
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


  /* =========================================================
     LOAD ALL SONGS
  ========================================================= */

  const fetchAllSongs =
    async () => {

      try {

        const response =
          await API.get(
            "/songs"
          );


        setAllSongs(
          response.data?.songs ||
          []
        );


      } catch (error) {

        console.error(
          "Unable to load songs:",
          error
        );

      }

    };


  /* =========================================================
     OPEN ADD SONG MODAL
  ========================================================= */

  const openAddSongs =
    async () => {

      await fetchAllSongs();

      setShowAddSongs(true);

    };


  /* =========================================================
     ADD SONG
  ========================================================= */

  const addSong =
    async (songId) => {

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


  /* =========================================================
     REMOVE SONG
  ========================================================= */

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


  /* =========================================================
     DELETE PLAYLIST
  ========================================================= */

  const deletePlaylist =
    async () => {

      if (!playlist) {
        return;
      }


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


  /* =========================================================
     CHECK IF SONG IS CURRENTLY PLAYING
  ========================================================= */

  const isCurrentSong =
    (song) => {

      return (
        String(currentSong?.id) ===
        String(song?.id)
      );

    };


  /* =========================================================
     CHECK IF SONG IS PLAYING
  ========================================================= */

  const isSongPlaying =
    (song) => {

      return (
        isCurrentSong(song) &&
        isPlaying
      );

    };


  /* =========================================================
     PLAY / PAUSE SINGLE SONG
  ========================================================= */

  const handleSongPlayPause =
    (song) => {

      if (!song?.audio_url) {

        alert(
          "Audio is not available for this song."
        );

        return;

      }


      /*
        Same song:
        toggle Play / Pause.
      */

      if (isCurrentSong(song)) {

        togglePlay();

        return;

      }


      /*
        Different song:
        start new song and use
        playlist songs as queue.
      */

      playSong(
        song,
        playlist?.songs || []
      );

    };


  /* =========================================================
     PLAY / PAUSE WHOLE PLAYLIST
  ========================================================= */

  const handlePlaylistPlayPause =
    () => {

      const songs =
        playlist?.songs || [];


      if (songs.length === 0) {
        return;
      }


      /*
        If current song belongs to
        this playlist, toggle it.
      */

      const currentBelongsToPlaylist =
        songs.some(
          (song) =>
            String(song?.id) ===
            String(currentSong?.id)
        );


      if (currentBelongsToPlaylist) {

        togglePlay();

        return;

      }


      /*
        Otherwise start first playable song.
      */

      const firstPlayableSong =
        songs.find(
          (song) =>
            song?.audio_url
        );


      if (!firstPlayableSong) {

        alert(
          "No playable songs in this playlist."
        );

        return;

      }


      playSong(
        firstPlayableSong,
        songs
      );

    };


  /* =========================================================
     CHECK SONG EXISTS
  ========================================================= */

  const songExistsInPlaylist =
    (songId) => {

      return (
        playlist?.songs?.some(
          (song) =>
            Number(song.id) ===
            Number(songId)
        ) || false
      );

    };


  /* =========================================================
     GET PLAYLIST PLAYING STATE
  ========================================================= */

  const playlistIsPlaying =
    () => {

      if (
        !playlist?.songs?.length ||
        !currentSong
      ) {
        return false;
      }


      const exists =
        playlist.songs.some(
          (song) =>
            String(song.id) ===
            String(currentSong.id)
        );


      return exists && isPlaying;

    };


  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {

    return (

      <div className="playlist-details-page">

        <div className="playlist-loading">

          <FaMusic />

          <span>
            Loading playlist...
          </span>

        </div>

      </div>

    );

  }


  /* =========================================================
     ERROR
  ========================================================= */

  if (error || !playlist) {

    return (

      <div className="playlist-details-page">

        <button
          type="button"
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


  const playlistPlaying =
    playlistIsPlaying();


  /* =========================================================
     RENDER
  ========================================================= */

  return (

    <div className="playlist-details-page">


      {/* =====================================================
          BACK
      ===================================================== */}

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


      {/* =====================================================
          PLAYLIST HEADER
      ===================================================== */}

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

            <span>
              •
            </span>

            <span>

              {playlist.song_count || 0}

              {" "}

              {
                Number(
                  playlist.song_count
                ) === 1
                  ? "song"
                  : "songs"
              }

            </span>

          </div>

        </div>

      </section>


      {/* =====================================================
          ACTION BUTTONS
      ===================================================== */}

      <section className="playlist-actions">


        {/* PLAY / PAUSE PLAYLIST */}

        <button
          type="button"
          className={
            `playlist-main-play ${
              playlistPlaying
                ? "is-playing"
                : ""
            }`
          }
          onClick={
            handlePlaylistPlayPause
          }
          disabled={
            !playlist.songs?.length
          }
          title={
            playlistPlaying
              ? "Pause playlist"
              : "Play playlist"
          }
        >

          {playlistPlaying ? (

            <FaPause />

          ) : (

            <FaPlay />

          )}

        </button>


        {/* ADD SONGS */}

        <button
          type="button"
          className="playlist-add-button"
          onClick={openAddSongs}
        >

          <FaPlus />

          Add Songs

        </button>


        {/* DELETE */}

        <button
          type="button"
          className="playlist-delete-button"
          onClick={deletePlaylist}
        >

          <FaTrash />

          Delete

        </button>

      </section>


      {/* =====================================================
          EMPTY PLAYLIST
      ===================================================== */}

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

        /* ===================================================
           SONG LIST
        =================================================== */

        <div className="playlist-song-list">


          <div className="playlist-table-header">

            <span>
              #
            </span>

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


              const current =
                isCurrentSong(song);


              const playing =
                isSongPlaying(song);


              return (

                <div
                  className={
                    `playlist-song-row ${
                      current
                        ? "is-current"
                        : ""
                    } ${
                      playing
                        ? "is-playing"
                        : ""
                    }`
                  }
                  key={song.id}
                >


                  {/* NUMBER / PLAY BUTTON */}

                  <div className="playlist-song-number">


                    <span className="song-number">

                      {!current &&
                        index + 1}

                    </span>


                    <button
                      type="button"
                      className={
                        `playlist-song-play ${
                          playing
                            ? "is-playing"
                            : ""
                        }`
                      }
                      onClick={() =>
                        handleSongPlayPause(
                          song
                        )
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

                      {playing ? (

                        <FaPause />

                      ) : (

                        <FaPlay />

                      )}

                    </button>

                  </div>


                  {/* SONG */}

                  <div className="playlist-song-title">

                    <img
                      src={cover}
                      alt={song.title}
                    />


                    <div>

                      <strong>
                        {song.title}
                      </strong>


                      {song.title_english && (

                        <small>
                          {song.title_english}
                        </small>

                      )}


                      <span>
                        {song.artist_name ||
                          "KEERTHANA"}
                      </span>

                    </div>

                  </div>


                  {/* CATEGORY */}

                  <div className="playlist-song-category">

                    {song.category_name ||
                      "Christian Music"}

                  </div>


                  {/* REMOVE */}

                  <button
                    type="button"
                    className="playlist-remove-song"
                    onClick={() =>
                      removeSong(
                        song.id
                      )
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


      {/* =====================================================
          ADD SONG MODAL
      ===================================================== */}

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


            {/* HEADER */}

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


            {/* SONG LIST */}

            <div className="add-song-list">


              {allSongs.length === 0 ? (

                <div className="add-song-empty">

                  <FaMusic />

                  <p>
                    No songs available.
                  </p>

                </div>

              ) : (

                allSongs.map(
                  (song) => {

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


                          {song.title_english && (

                            <small>
                              {song.title_english}
                            </small>

                          )}


                          <span>
                            {song.artist_name ||
                              "KEERTHANA"}
                          </span>

                        </div>


                        <button
                          type="button"
                          className={
                            alreadyAdded
                              ? "song-added"
                              : ""
                          }
                          disabled={
                            alreadyAdded ||
                            actionLoading
                          }
                          onClick={() =>
                            addSong(
                              song.id
                            )
                          }
                        >

                          {alreadyAdded
                            ? "Added"
                            : "Add"}

                        </button>

                      </div>

                    );

                  }
                )

              )}

            </div>

          </div>

        </div>

      )}

    </div>

  );

}


export default PlaylistDetails;