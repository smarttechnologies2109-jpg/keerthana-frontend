import {
  useEffect,
  useState,
} from "react";

import {
  FaMusic,
  FaPlus,
  FaPlay,
  FaPause,
  FaTimes,
} from "react-icons/fa";

import {
  useNavigate,
} from "react-router-dom";

import API
  from "../services/api";

import {
  usePlayer,
} from "../context/usePlayer";

import "../assets/css/playlists.css";


function Playlists() {

  const navigate =
    useNavigate();


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
    playlists,
    setPlaylists,
  ] = useState([]);


  const [
    loading,
    setLoading,
  ] = useState(true);


  const [
    showCreate,
    setShowCreate,
  ] = useState(false);


  const [
    name,
    setName,
  ] = useState("");


  const [
    description,
    setDescription,
  ] = useState("");


  const [
    creating,
    setCreating,
  ] = useState(false);


  const [
    playingPlaylistId,
    setPlayingPlaylistId,
  ] = useState(null);


  const [
    loadingPlaylistId,
    setLoadingPlaylistId,
  ] = useState(null);


  const [
    error,
    setError,
  ] = useState("");


  /* =========================================================
     FETCH PLAYLISTS
  ========================================================= */

  const fetchPlaylists =
    async () => {

      try {

        setLoading(true);

        setError("");


        const response =
          await API.get(
            "/playlists"
          );


        const playlistData =
          response.data?.playlists ||
          response.data?.data ||
          [];


        setPlaylists(
          Array.isArray(playlistData)
            ? playlistData
            : []
        );


      } catch (error) {

        console.error(
          "Playlist error:",
          error
        );


        setError(
          error.response?.data?.message ||
          "Unable to load playlists."
        );


      } finally {

        setLoading(false);

      }

    };


  useEffect(() => {

    fetchPlaylists();

  }, []);


  /* =========================================================
     CHECK WHETHER CURRENT SONG BELONGS TO PLAYLIST
  ========================================================= */

  const playlistContainsCurrentSong =
    (playlist) => {

      if (!playlist || !currentSong) {
        return false;
      }


      const songs =
        getPlaylistSongs(
          playlist
        );


      if (
        !Array.isArray(songs) ||
        songs.length === 0
      ) {
        return false;
      }


      return songs.some(
        (song) =>
          String(song?.id) ===
          String(currentSong?.id)
      );

    };


  /* =========================================================
     GET PLAYLIST SONGS
  ========================================================= */

  const getPlaylistSongs =
    (playlist) => {

      if (!playlist) {
        return [];
      }


      if (
        Array.isArray(
          playlist.songs
        )
      ) {
        return playlist.songs;
      }


      if (
        Array.isArray(
          playlist.playlist_songs
        )
      ) {
        return playlist.playlist_songs;
      }


      if (
        Array.isArray(
          playlist.items
        )
      ) {
        return playlist.items;
      }


      if (
        Array.isArray(
          playlist.data?.songs
        )
      ) {
        return playlist.data.songs;
      }


      return [];

    };


  /* =========================================================
     FETCH SINGLE PLAYLIST
  ========================================================= */

  const fetchPlaylistDetails =
    async (playlistId) => {

      const response =
        await API.get(
          `/playlists/${playlistId}`
        );


      const data =
        response.data;


      /*
        Support different backend response formats.
      */

      if (data?.playlist) {
        return data.playlist;
      }


      if (data?.data) {
        return data.data;
      }


      return data;

    };


  /* =========================================================
     PLAY / PAUSE PLAYLIST
  ========================================================= */

  const handlePlaylistPlayPause =
    async (
      event,
      playlist
    ) => {

      /*
        Prevent card navigation.
      */

      event.stopPropagation();


      const playlistId =
        playlist?.id;


      if (!playlistId) {
        return;
      }


      /*
        If this playlist is currently playing,
        pause the global player.
      */

      if (
        playingPlaylistId ===
          playlistId &&
        isPlaying
      ) {

        togglePlay();

        return;

      }


      /*
        If current song belongs to this playlist
        but the player is paused, simply resume.
      */

      if (
        playlistContainsCurrentSong(
          playlist
        ) &&
        !isPlaying
      ) {

        setPlayingPlaylistId(
          playlistId
        );

        togglePlay();

        return;

      }


      try {

        setLoadingPlaylistId(
          playlistId
        );


        /*
          Fetch complete playlist because
          the playlist list normally only has
          song_count.
        */

        const fullPlaylist =
          await fetchPlaylistDetails(
            playlistId
          );


        const songs =
          getPlaylistSongs(
            fullPlaylist
          );


        /*
          Some APIs return songs directly.
        */

        let playlistSongs =
          songs;


        if (
          (!playlistSongs ||
            playlistSongs.length === 0) &&
          Array.isArray(
            fullPlaylist?.playlistSongs
          )
        ) {

          playlistSongs =
            fullPlaylist.playlistSongs;

        }


        /*
          Filter songs which have audio.
        */

        playlistSongs =
          Array.isArray(
            playlistSongs
          )
            ? playlistSongs.filter(
                (song) =>
                  song &&
                  song.audio_url
              )
            : [];


        if (
          playlistSongs.length === 0
        ) {

          alert(
            "This playlist does not have any playable songs yet."
          );

          return;

        }


        /*
          Start playlist from first song.
        */

        playSong(
          playlistSongs[0],
          playlistSongs
        );


        setPlayingPlaylistId(
          playlistId
        );


      } catch (error) {

        console.error(
          "PLAYLIST PLAY ERROR:",
          error
        );


        alert(
          error.response?.data?.message ||
          "Unable to play this playlist."
        );


      } finally {

        setLoadingPlaylistId(
          null
        );

      }

    };


  /* =========================================================
     CREATE PLAYLIST
  ========================================================= */

  const handleCreate =
    async (event) => {

      event.preventDefault();


      const cleanName =
        name.trim();


      const cleanDescription =
        description.trim();


      if (!cleanName) {

        alert(
          "Please enter playlist name"
        );

        return;

      }


      try {

        setCreating(true);


        console.log(
          "Creating playlist:",
          {
            name: cleanName,
            description:
              cleanDescription,
          }
        );


        const response =
          await API.post(
            "/playlists",
            {
              name: cleanName,
              description:
                cleanDescription,
            }
          );


        console.log(
          "Create playlist response:",
          response.data
        );


        if (
          !response.data?.success
        ) {

          throw new Error(
            response.data?.message ||
            "Unable to create playlist"
          );

        }


        const newPlaylist =
          response.data.playlist;


        if (!newPlaylist?.id) {

          throw new Error(
            "Backend did not return playlist ID"
          );

        }


        /*
          Add playlist immediately.
        */

        setPlaylists(
          (current) => [
            {
              ...newPlaylist,
              song_count: 0,
              songs: [],
            },
            ...current,
          ]
        );


        setName("");

        setDescription("");

        setShowCreate(false);


        alert(
          "Playlist created successfully!"
        );


      } catch (error) {

        console.error(
          "CREATE PLAYLIST ERROR:",
          error
        );


        console.error(
          "Backend response:",
          error.response?.data
        );


        console.error(
          "HTTP status:",
          error.response?.status
        );


        alert(
          error.response?.data?.message ||
          error.message ||
          "Unable to create playlist"
        );


      } finally {

        setCreating(false);

      }

    };


  /* =========================================================
     CLOSE CREATE MODAL
  ========================================================= */

  const closeCreateModal =
    () => {

      if (creating) {
        return;
      }


      setShowCreate(false);

      setName("");

      setDescription("");

    };


  /* =========================================================
     RENDER
  ========================================================= */

  return (

    <div className="playlists-page">


      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="playlists-header">

        <div className="playlists-header-content">

          <p className="playlists-eyebrow">
            YOUR MUSIC
          </p>


          <h1>
            Playlists
          </h1>


          <span className="playlists-subtitle">
            Create and enjoy your favourite
            Christian music collections.
          </span>

        </div>


        <button
          type="button"
          className="create-playlist-button"
          onClick={() =>
            setShowCreate(true)
          }
        >

          <FaPlus />

          <span>
            Create Playlist
          </span>

        </button>

      </div>


      {/* =====================================================
          ERROR
      ===================================================== */}

      {error && (

        <div className="playlist-error">

          {error}

        </div>

      )}


      {/* =====================================================
          LOADING
      ===================================================== */}

      {loading ? (

        <div className="playlist-message">

          <div className="playlist-loading-icon">

            <FaMusic />

          </div>

          <p>
            Loading playlists...
          </p>

        </div>

      ) : playlists.length === 0 ? (

        /* ===================================================
           EMPTY
        =================================================== */

        <div className="playlist-empty">

          <div className="playlist-empty-icon">

            <FaMusic />

          </div>


          <h2>
            Create your first playlist
          </h2>


          <p>
            Organize your favourite
            Christian songs into playlists.
          </p>


          <button
            type="button"
            onClick={() =>
              setShowCreate(true)
            }
          >

            <FaPlus />

            Create Playlist

          </button>

        </div>

      ) : (

        /* ===================================================
           PLAYLIST GRID
        =================================================== */

        <div className="playlist-grid">

          {playlists.map(
            (playlist) => {

              const isCurrentPlaylist =
                playingPlaylistId ===
                playlist.id;


              const containsCurrentSong =
                playlistContainsCurrentSong(
                  playlist
                );


              const isActive =
                isCurrentPlaylist ||
                containsCurrentSong;


              const isLoading =
                loadingPlaylistId ===
                playlist.id;


              return (

                <div
                  className={
                    `playlist-card-wrapper ${
                      isActive
                        ? "playlist-card-active"
                        : ""
                    }`
                  }
                  key={playlist.id}
                >

                  {/* =========================================
                      CARD
                  ========================================= */}

                  <button
                    type="button"
                    className="playlist-card"
                    onClick={() =>
                      navigate(
                        `/playlists/${playlist.id}`
                      )
                    }
                  >

                    {/* COVER */}

                    <div className="playlist-cover">

                      <div className="playlist-cover-placeholder">

                        <FaMusic />

                      </div>


                      {/* PLAY BUTTON */}

                      <button
                        type="button"
                        className={
                          `playlist-play-button ${
                            isActive &&
                            isPlaying
                              ? "is-playing"
                              : ""
                          }`
                        }
                        onClick={(event) =>
                          handlePlaylistPlayPause(
                            event,
                            playlist
                          )
                        }
                        disabled={isLoading}
                        aria-label={
                          isActive &&
                          isPlaying
                            ? "Pause playlist"
                            : "Play playlist"
                        }
                      >

                        {isLoading ? (

                          <span className="playlist-spinner">
                            <FaMusic />
                          </span>

                        ) : isActive &&
                          isPlaying ? (

                          <FaPause />

                        ) : (

                          <FaPlay />

                        )}

                      </button>

                    </div>


                    {/* INFORMATION */}

                    <div className="playlist-card-info">

                      <h3>
                        {playlist.name}
                      </h3>


                      {playlist.description && (

                        <p className="playlist-description">

                          {playlist.description}

                        </p>

                      )}


                      <p className="playlist-song-count">

                        {playlist.song_count || 0}

                        {" "}

                        {
                          Number(
                            playlist.song_count
                          ) === 1
                            ? "song"
                            : "songs"
                        }

                      </p>

                    </div>

                  </button>


                  {/* ACTIVE LABEL */}

                  {isActive && isPlaying && (

                    <div className="playlist-playing-label">

                      <span className="playing-dot"></span>

                      Playing

                    </div>

                  )}

                </div>

              );

            }
          )}

        </div>

      )}


      {/* =====================================================
          CREATE MODAL
      ===================================================== */}

      {showCreate && (

        <div
          className="playlist-modal-backdrop"
          onClick={closeCreateModal}
        >

          <div
            className="playlist-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            {/* MODAL HEADER */}

            <div className="playlist-modal-header">

              <div>

                <p>
                  YOUR MUSIC
                </p>

                <h2>
                  Create Playlist
                </h2>

              </div>


              <button
                type="button"
                className="playlist-modal-close"
                onClick={closeCreateModal}
                disabled={creating}
                aria-label="Close"
              >

                <FaTimes />

              </button>

            </div>


            {/* FORM */}

            <form
              onSubmit={handleCreate}
            >

              {/* NAME */}

              <div className="playlist-form-group">

                <label>
                  Playlist Name
                </label>


                <input
                  type="text"
                  value={name}
                  onChange={(event) =>
                    setName(
                      event.target.value
                    )
                  }
                  placeholder="My Worship Playlist"
                  autoFocus
                  maxLength={100}
                />

              </div>


              {/* DESCRIPTION */}

              <div className="playlist-form-group">

                <label>
                  Description
                </label>


                <textarea
                  value={description}
                  onChange={(event) =>
                    setDescription(
                      event.target.value
                    )
                  }
                  placeholder="Add an optional description"
                  maxLength={500}
                  rows={4}
                />

              </div>


              {/* ACTIONS */}

              <div className="playlist-modal-actions">

                <button
                  type="button"
                  className="cancel-button"
                  onClick={closeCreateModal}
                  disabled={creating}
                >

                  Cancel

                </button>


                <button
                  type="submit"
                  className="save-button"
                  disabled={
                    creating ||
                    !name.trim()
                  }
                >

                  {creating
                    ? "Creating..."
                    : "Create"
                  }

                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>

  );

}


export default Playlists;