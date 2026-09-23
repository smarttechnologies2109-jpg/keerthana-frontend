
import {
  useEffect,
  useState,
} from "react";

import {
  FaCompactDisc,
} from "react-icons/fa";

import {
  useNavigate,
} from "react-router-dom";

import API from "../services/api";

import {
  getAlbumCover,
  DEFAULT_ALBUM,
} from "../utils/media";

import "../assets/css/albums.css";


function Albums() {

  const navigate =
    useNavigate();


  const [albums, setAlbums] =
    useState([]);


  const [loading, setLoading] =
    useState(true);


  const [error, setError] =
    useState("");


  /* =====================================================
     FETCH ALBUMS
  ===================================================== */

  useEffect(() => {

    const fetchAlbums = async () => {

      try {

        setLoading(true);

        setError("");


        const response =
          await API.get("/albums");


        console.log(
          "Albums:",
          response.data
        );


        setAlbums(
          response.data.albums || []
        );


      } catch (error) {

        console.error(
          "Unable to load albums:",
          error
        );


        setError(
          "Unable to load albums"
        );


      } finally {

        setLoading(false);

      }

    };


    fetchAlbums();

  }, []);


  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {

    return (

      <div className="albums-page">

        Loading albums...

      </div>

    );

  }


  return (

    <div className="albums-page">


      {/* =================================================
          HEADER
      ================================================= */}

      <section className="albums-header">

        <p>
          KEERTHANA
        </p>


        <h1>
          Albums
        </h1>


        <span>
          Christian Music Collections
        </span>

      </section>



      {/* =================================================
          ERROR
      ================================================= */}

      {error && (

        <div className="albums-error">

          {error}

        </div>

      )}



      {/* =================================================
          EMPTY
      ================================================= */}

      {!error &&
        albums.length === 0 && (

          <div className="albums-empty">

            <FaCompactDisc />

            <h2>
              No Albums Available
            </h2>

            <p>
              Albums will appear here.
            </p>

          </div>

        )}



      {/* =================================================
          ALBUM GRID
      ================================================= */}

      <div className="albums-grid">

        {albums.map((album) => {

          /*
           * getAlbumCover()
           *
           * If album.cover_url exists:
           *     → backend album image
           *
           * If album.cover_url is missing:
           *     → /images/default-album.png
           */

          const coverUrl =
            getAlbumCover(album);


          return (

            <div
              className="album-card"
              key={album.id}

              onClick={() =>
                navigate(
                  `/albums/${album.id}`
                )
              }
            >


              {/* =========================================
                  ALBUM COVER
              ========================================= */}

              <div className="album-card-cover">

                <img
                  src={coverUrl}
                  alt={
                    album.title ||
                    "Album"
                  }

                  /*
                   * If the database contains an
                   * invalid/deleted image URL,
                   * automatically use default album image.
                   */

                  onError={(event) => {

                    event.currentTarget.src =
                      DEFAULT_ALBUM;

                  }}
                />

              </div>



              {/* =========================================
                  ALBUM INFORMATION
              ========================================= */}

              <div className="album-card-info">


                <h3>

                  {album.title}

                </h3>


                <p>

                  {album.artist_name ||
                    "KEERTHANA"}

                </p>


                <span>

                  {album.song_count || 0}

                  {" "}

                  {Number(
                    album.song_count
                  ) === 1
                    ? "Song"
                    : "Songs"}

                </span>


              </div>


            </div>

          );

        })}

      </div>


    </div>

  );

}


export default Albums;