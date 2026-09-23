import {
  useEffect,
  useState,
} from "react";

import {
  FaPlus,
  FaPlay,
  FaPen,
  FaTrash,
  FaMusic,
} from "react-icons/fa";

import {
  useNavigate,
} from "react-router-dom";

import API
  from "../../services/api";

import {
  getMediaUrl,
} from "../../utils/media";

import "../../assets/css/adminSongs.css";


function AdminSongs() {

  const navigate =
    useNavigate();

  const [songs, setSongs] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  /* =========================================
     LOAD SONGS
  ========================================= */

  const loadSongs = async () => {

    try {

      setLoading(true);
      setError("");

      const response =
        await API.get("/songs");

      setSongs(
        response.data.songs || []
      );

    } catch (error) {

      console.error(
        "Admin songs error:",
        error
      );

      setError(
        "Unable to load songs"
      );

    } finally {

      setLoading(false);

    }

  };


  useEffect(() => {

    loadSongs();

  }, []);


  /* =========================================
     DELETE SONG
  ========================================= */

  const handleDelete =
    async (song) => {

      const confirmed =
        window.confirm(
          `Delete "${song.title}"?`
        );

      if (!confirmed) {
        return;
      }


      try {

        await API.delete(
          `/admin/songs/${song.id}`
        );


        setSongs(
          (currentSongs) =>
            currentSongs.filter(
              (item) =>
                item.id !== song.id
            )
        );

      } catch (error) {

        console.error(
          "Delete song error:",
          error
        );

        alert(
          error.response?.data?.message ||
          "Unable to delete song"
        );

      }

    };


  /* =========================================
     LOADING
  ========================================= */

  if (loading) {

    return (

      <div className="admin-songs-page">

        <p>
          Loading songs...
        </p>

      </div>

    );

  }


  return (

    <div className="admin-songs-page">


      {/* HEADER */}

      <div className="admin-songs-header">

        <div>

          <span className="admin-label">
            KEERTHANA ADMIN
          </span>

          <h1>
            Manage Songs
          </h1>

          <p>
            Add, edit and manage
            KEERTHANA songs.
          </p>

        </div>


        <button
          type="button"
          className="admin-add-button"

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


      {/* ERROR */}

      {error && (

        <div className="admin-songs-error">

          {error}

        </div>

      )}


      {/* SONG COUNT */}

      <div className="admin-song-summary">

        <FaMusic />

        <div>

          <strong>
            {songs.length}
          </strong>

          <span>
            Total Songs
          </span>

        </div>

      </div>


      {/* EMPTY */}

      {!error &&
        songs.length === 0 && (

          <div className="admin-empty-songs">

            <FaMusic />

            <h2>
              No Songs
            </h2>

            <p>
              Add your first song
              to KEERTHANA.
            </p>

            <button
              type="button"
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

        )}


      {/* TABLE */}

      {songs.length > 0 && (

        <div className="admin-song-table-wrapper">

          <table className="admin-song-table">

            <thead>

              <tr>

                <th>
                  #
                </th>

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
                  Language
                </th>

                <th>
                  Actions
                </th>

              </tr>

            </thead>


            <tbody>

              {songs.map(
                (song, index) => {

                  const cover =
                    song.cover_url
                      ? getMediaUrl(
                          song.cover_url
                        )
                      : "/images/default-cover.png";


                  return (

                    <tr key={song.id}>

                      <td>
                        {index + 1}
                      </td>


                      <td>

                        <div className="admin-song-name">

                          <img
                            src={cover}
                            alt={song.title}
                          />

                          <div>

                            <strong>
                              {song.title}
                            </strong>

                            {song.title_english && (

                              <span>
                                {
                                  song.title_english
                                }
                              </span>

                            )}

                          </div>

                        </div>

                      </td>


                      <td>

                        {song.artist_name ||
                          "—"}

                      </td>


                      <td>

                        {song.album_title ||
                          "—"}

                      </td>


                      <td>

                        {song.category_name ||
                          "—"}

                      </td>


                      <td>

                        {song.language ||
                          "—"}

                      </td>


                      <td>

                        <div className="admin-song-actions">


                          {/* VIEW */}

                          <button
                            type="button"
                            className="admin-action view"

                            title="View song"

                            onClick={() =>
                              navigate(
                                `/songs/${song.id}`
                              )
                            }
                          >

                            <FaPlay />

                          </button>


                          {/* EDIT */}

                          <button
                            type="button"
                            className="admin-action edit"

                            title="Edit song"

                            onClick={() =>
                              navigate(
                                `/admin/songs/${song.id}/edit`
                              )
                            }
                          >

                            <FaPen />

                          </button>


                          {/* DELETE */}

                          <button
                            type="button"
                            className="admin-action delete"

                            title="Delete song"

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


export default AdminSongs;