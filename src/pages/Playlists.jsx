import {
  useEffect,
  useState,
} from "react";

import {
  FaMusic,
  FaPlus,
} from "react-icons/fa";

import {
  useNavigate,
} from "react-router-dom";

import API
  from "../services/api";

import "../assets/css/playlists.css";


function Playlists() {

  const navigate =
    useNavigate();


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


  /* =====================================
     FETCH PLAYLISTS
  ===================================== */

  const fetchPlaylists =
    async () => {

      try {

        setLoading(true);


        const response =
          await API.get(
            "/playlists"
          );


        setPlaylists(
          response.data.playlists ||
          []
        );

      } catch (error) {

        console.error(
          "Playlist error:",
          error
        );

      } finally {

        setLoading(false);

      }

    };


  useEffect(() => {

    fetchPlaylists();

  }, []);


  /* =====================================
     CREATE
  ===================================== */

  const handleCreate = async (event) => {
  event.preventDefault();

  const cleanName = name.trim();
  const cleanDescription = description.trim();

  if (!cleanName) {
    alert("Please enter playlist name");
    return;
  }

  try {
    setCreating(true);

    console.log("Creating playlist:", {
      name: cleanName,
      description: cleanDescription,
    });

    const response = await API.post(
      "/playlists",
      {
        name: cleanName,
        description: cleanDescription,
      }
    );

    console.log(
      "Create playlist response:",
      response.data
    );

    if (!response.data?.success) {
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

    /* Add new playlist immediately */
    setPlaylists((current) => [
      {
        ...newPlaylist,
        song_count: 0,
      },
      ...current,
    ]);

    setName("");
    setDescription("");
    setShowCreate(false);

    alert("Playlist created successfully!");

    /*
      IMPORTANT:
      Don't navigate to /playlists/:id yet.

      We will add PlaylistDetails page next.
    */

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


  return (

    <div className="playlists-page">


      <div className="playlists-header">

        <div>

          <p>
            YOUR MUSIC
          </p>

          <h1>
            Playlists
          </h1>

        </div>


        <button
          type="button"

          className="create-playlist-button"

          onClick={() =>
            setShowCreate(true)
          }
        >

          <FaPlus />

          Create Playlist

        </button>

      </div>


      {loading ? (

        <div className="playlist-message">

          Loading playlists...

        </div>

      ) : playlists.length === 0 ? (

        <div className="playlist-empty">

          <FaMusic />

          <h2>
            Create your first playlist
          </h2>

          <p>
            Organize your favourite
            Christian songs.
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

        <div className="playlist-grid">


          {playlists.map(
            (playlist) => (

              <button
                type="button"

                className="playlist-card"

                key={playlist.id}

                onClick={() =>
                  navigate(
                    `/playlists/${playlist.id}`
                  )
                }
              >

                <div
                  className=
                    "playlist-cover-placeholder"
                >

                  <FaMusic />

                </div>


                <h3>

                  {playlist.name}

                </h3>


                <p>

                  {playlist.song_count}
                  {" "}
                  {
                    playlist.song_count === 1
                      ? "song"
                      : "songs"
                  }

                </p>

              </button>

            )
          )}


        </div>

      )}


      {/* CREATE MODAL */}

      {showCreate && (

        <div
          className="playlist-modal-backdrop"

          onClick={() =>
            setShowCreate(false)
          }
        >

          <div
            className="playlist-modal"

            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <h2>
              Create Playlist
            </h2>


            <form
              onSubmit={handleCreate}
            >

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

                placeholder=
                  "My Worship Playlist"

                autoFocus
              />


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

                placeholder=
                  "Add an optional description"
              />


              <div
                className=
                  "playlist-modal-actions"
              >

                <button
                  type="button"

                  className="cancel-button"

                  onClick={() =>
                    setShowCreate(false)
                  }
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

                  {
                    creating
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