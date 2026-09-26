import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  FaEdit,
  FaMusic,
  FaPlus,
  FaSearch,
  FaTrash,
} from "react-icons/fa";

import {
  useNavigate,
} from "react-router-dom";

import API
  from "../../services/api";

import {
  getMediaUrl,
} from "../../utils/media";

import "../../assets/css/admin/manageSongs.css";

function ManageSongs() {

  const navigate =
    useNavigate();


  /* =====================================================
     STATE
  ===================================================== */

  const [
    songs,
    setSongs,
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
    success,
    setSuccess,
  ] = useState("");

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    deletingId,
    setDeletingId,
  ] = useState(null);


  /* =====================================================
     LOAD SONGS
  ===================================================== */

  const loadSongs = async () => {

    try {

      setLoading(true);

      setError("");


      const response =
        await API.get(
          "/songs"
        );


      console.log(
        "Admin songs:",
        response.data
      );


      setSongs(
        response.data.songs ||
        []
      );


    } catch (error) {

      console.error(
        "Load songs error:",
        error
      );


      setError(
        error.response
          ?.data
          ?.message ||
        "Unable to load songs."
      );


    } finally {

      setLoading(false);

    }

  };


  useEffect(() => {

    loadSongs();

  }, []);


  /* =====================================================
     SEARCH
  ===================================================== */

  const filteredSongs =
    useMemo(() => {

      const query =
        search
          .trim()
          .toLowerCase();


      if (!query) {

        return songs;

      }


      return songs.filter(
        (song) => {

          const values = [

            song.title,

            song.title_english,

            song.artist_name,

            song.artist,

            song.album_title,

            song.album,

            song.category_name,

            song.category,

          ];


          return values
            .filter(Boolean)
            .some(
              (value) =>
                String(value)
                  .toLowerCase()
                  .includes(
                    query
                  )
            );

        }
      );

    }, [
      songs,
      search,
    ]);


  /* =====================================================
     DELETE SONG
  ===================================================== */

  const handleDelete = async (
    song
  ) => {

    const confirmed =
      window.confirm(
        `Delete "${song.title}"?`
      );


    if (!confirmed) {

      return;

    }


    try {

      setDeletingId(
        song.id
      );

      setError("");

      setSuccess("");


      /*
        IMPORTANT:

        This expects:

        DELETE
        /api/admin/songs/:id
      */

      await API.delete(
        `/admin/songs/${song.id}`
      );


      setSongs(
        (previous) =>
          previous.filter(
            (item) =>
              item.id !==
              song.id
          )
      );


      setSuccess(
        `"${song.title}" deleted successfully.`
      );


    } catch (error) {

      console.error(
        "Delete song error:",
        error
      );


      setError(
        error.response
          ?.data
          ?.message ||
        "Unable to delete song."
      );


    } finally {

      setDeletingId(null);

    }

  };


  /* =====================================================
     COVER URL
  ===================================================== */

  const getCover = (
    song
  ) => {

    if (!song.cover_url) {

      return null;

    }


    if (
      song.cover_url.startsWith(
        "http://"
      ) ||
      song.cover_url.startsWith(
        "https://"
      )
    ) {

      return song.cover_url;

    }


    return getMediaUrl(
      song.cover_url
    );

  };


  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {

    return (

      <div className="admin-page">

        <div className="admin-loading">

          Loading Songs...

        </div>

      </div>

    );

  }


  /* =====================================================
     PAGE
  ===================================================== */

  return (

    <div className="admin-page">


      {/* =================================================
          HEADER
      ================================================= */}

      <div className="admin-header">


        <div>

          <span>
            KEERTHANA ADMIN
          </span>


          <h1>
            Manage Songs
          </h1>


          <p>
            Add, edit and manage
            songs in KEERTHANA.
          </p>

        </div>


        <button
          type="button"

          className="admin-primary-button"

          onClick={() =>
            navigate(
              "/admin/songs/add"
            )
          }
        >

          <FaPlus />

          Add Song

        </button>


      </div>


      {/* =================================================
          MESSAGES
      ================================================= */}

      {error && (

        <div className="admin-error">

          {error}

        </div>

      )}


      {success && (

        <div className="admin-success">

          {success}

        </div>

      )}


      {/* =================================================
          TOOLBAR
      ================================================= */}

      <div className="admin-song-toolbar">


        <div className="admin-song-search">

          <FaSearch />


          <input
            type="text"

            value={
              search
            }

            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }

            placeholder="Search songs, artists, albums..."
          />

        </div>


        <div className="admin-song-count">

          <FaMusic />

          <span>

            {filteredSongs.length}

            {" "}

            {filteredSongs.length === 1
              ? "Song"
              : "Songs"}

          </span>

        </div>


      </div>


      {/* =================================================
          EMPTY
      ================================================= */}

      {filteredSongs.length ===
        0 ? (

        <div className="admin-empty-state">


          <FaMusic />


          <h2>

            {search
              ? "No Songs Found"
              : "No Songs Yet"}

          </h2>


          <p>

            {search
              ? "Try another search."
              : "Add your first song to KEERTHANA."}

          </p>


          {!search && (

            <button
              type="button"

              className="admin-primary-button"

              onClick={() =>
                navigate(
                  "/admin/songs/add"
                )
              }
            >

              <FaPlus />

              Add Song

            </button>

          )}


        </div>

      ) : (

        /* =================================================
           TABLE
        ================================================= */

        <div className="admin-table-wrapper">


          <table className="admin-song-table">


            <thead>

              <tr>

                <th>
                  Song
                </th>

                <th>
                  Artist
                </th>

                <th>
                  Album
                </th>

                <th>
                  Category
                </th>

                <th>
                  Actions
                </th>

              </tr>

            </thead>


            <tbody>


              {filteredSongs.map(
                (song) => {

                  const cover =
                    getCover(
                      song
                    );


                  return (

                    <tr
                      key={
                        song.id
                      }
                    >


                      {/* =================================
                          SONG
                      ================================= */}

                      <td>

                        <div className="admin-song-cell">


                          <div className="admin-song-cover">


                            {cover ? (

                              <img
                                src={
                                  cover
                                }

                                alt={
                                  song.title
                                }

                                onError={(
                                  event
                                ) => {

                                  event.currentTarget
                                    .style
                                    .display =
                                    "none";

                                }}
                              />

                            ) : (

                              <FaMusic />

                            )}


                          </div>


                          <div className="admin-song-info">


                            <strong>

                              {song.title ||
                                "Untitled Song"}

                            </strong>


                            {song.title_english && (

                              <span>

                                {song.title_english}

                              </span>

                            )}


                          </div>


                        </div>

                      </td>


                      {/* =================================
                          ARTIST
                      ================================= */}

                      <td>

                        {song.artist_name ||
                          song.artist ||
                          "—"}

                      </td>


                      {/* =================================
                          ALBUM
                      ================================= */}

                      <td>

                        {song.album_title ||
                          song.album ||
                          "—"}

                      </td>


                      {/* =================================
                          CATEGORY
                      ================================= */}

                      <td>

                        {song.category_name ||
                          song.category ||
                          "—"}

                      </td>


                      {/* =================================
                          ACTIONS
                      ================================= */}

                      <td>


                        <div className="admin-table-actions">


                          {/* EDIT */}

                          <button
                            type="button"

                            className="admin-action-button edit"

                            title="Edit Song"

                            onClick={() =>
                              navigate(
                                `/admin/songs/${song.id}/edit`
                              )
                            }
                          >

                            <FaEdit />

                          </button>


                          {/* DELETE */}

                          <button
                            type="button"

                            className="admin-action-button delete"

                            title="Delete Song"

                            disabled={
                              deletingId ===
                              song.id
                            }

                            onClick={() =>
                              handleDelete(
                                song
                              )
                            }
                          >

                            <FaTrash />

                          </button>


                        </div>


                      </td>


                    </tr>

                  );

                }
              )}


            </tbody>


          </table>


        </div>

      )}


    </div>

  );

}


export default ManageSongs;