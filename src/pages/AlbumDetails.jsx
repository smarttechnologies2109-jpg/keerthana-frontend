import {
  useEffect,
  useState,
} from "react";

import {
  FaArrowLeft,
  FaCompactDisc,
  FaPlay,
} from "react-icons/fa";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import API
  from "../services/api";

import {
  usePlayer,
} from "../context/PlayerContext";

import {
  getAlbumCover,
  DEFAULT_COVER,
} from "../utils/media";

import "../assets/css/albumDetails.css";


function AlbumDetails() {

  const { id } =
    useParams();

  const navigate =
    useNavigate();

  const {
    playSong,
  } = usePlayer();


  const [album, setAlbum] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  useEffect(() => {

    const loadAlbum =
      async () => {

        try {

          const response =
            await API.get(
              `/albums/${id}`
            );

          setAlbum(
            response.data.album
          );

        } catch (error) {

          console.error(
            "Album error:",
            error
          );

          setError(
            error.response?.data?.message ||
            "Unable to load album"
          );

        } finally {

          setLoading(false);

        }

      };


    loadAlbum();

  }, [id]);


  if (loading) {

    return (
      <div className="album-page">
        Loading album...
      </div>
    );

  }


  if (
    error ||
    !album
  ) {

    return (
      <div className="album-page">
        {error}
      </div>
    );

  }


 const cover =
  getAlbumCover(album);


  const playAlbum = () => {

    if (!album.songs?.length) {
      return;
    }

    playSong(
      album.songs[0],
      album.songs
    );

  };


  return (

    <div className="album-page">


      <button
        type="button"

        className="album-back"

        onClick={() =>
          navigate(-1)
        }
      >

        <FaArrowLeft />

        Back

      </button>


      <section className="album-hero">

        <div className="album-cover">

          {cover ? (

           <img
  src={cover}

  alt={
    album.title ||
    "Album cover"
  }

  onError={(event) => {

    if (
      !event.currentTarget.src.includes(
        "default-cover.png"
      )
    ) {

      event.currentTarget.src =
        DEFAULT_COVER;

    }

  }}
/>

          ) : (

            <FaCompactDisc />

          )}

        </div>


        <div className="album-info">

          <span>
            ALBUM
          </span>

          <h1>
            {album.title}
          </h1>


          <button
            type="button"

            className="album-artist-link"

            onClick={() => {

              if (album.artist_id) {

                navigate(
                  `/artists/${album.artist_id}`
                );

              }

            }}
          >

            {album.artist_name ||
              "KEERTHANA"}

          </button>


          <p>
            {album.song_count}
            {" "}
            {
              album.song_count === 1
                ? "song"
                : "songs"
            }
          </p>

        </div>

      </section>


      <div className="album-actions">

        <button
          type="button"

          onClick={playAlbum}

          disabled={
            !album.songs?.length
          }
        >

          <FaPlay />

        </button>

      </div>


      <div className="album-song-list">

        {album.songs?.map(
          (song, index) => (

            <div
              className="album-song-row"
              key={song.id}
            >

              <span>
                {index + 1}
              </span>


              <div>

                <strong>
                  {song.title}
                </strong>

                <span>
                  {song.artist_name ||
                    album.artist_name}
                </span>

              </div>


              <span className="album-category">

                {song.category_name ||
                  "Christian Music"}

              </span>


              <button
                type="button"

                onClick={() =>
                  playSong(
                    song,
                    album.songs
                  )
                }
              >

                <FaPlay />

              </button>

            </div>

          )
        )}

      </div>


    </div>

  );

}


export default AlbumDetails;