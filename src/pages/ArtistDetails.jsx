import {
  useEffect,
  useState,
} from "react";

import {
  FaArrowLeft,
  FaMicrophone,
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
  getMediaUrl,
} from "../utils/media";

import "../assets/css/artistDetails.css";


function ArtistDetails() {

  const { id } =
    useParams();

  const navigate =
    useNavigate();

  const {
    playSong,
  } = usePlayer();


  const [artist, setArtist] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  useEffect(() => {

    const loadArtist =
      async () => {

        try {

          setLoading(true);

          const response =
            await API.get(
              `/artists/${id}`
            );

          setArtist(
            response.data.artist
          );

        } catch (error) {

          console.error(error);

          setError(
            error.response?.data?.message ||
            "Unable to load artist"
          );

        } finally {

          setLoading(false);

        }

      };


    loadArtist();

  }, [id]);


  if (loading) {

    return (
      <div className="artist-details-page">
        Loading artist...
      </div>
    );

  }


  if (
    error ||
    !artist
  ) {

    return (
      <div className="artist-details-page">

        <button
          className="artist-back"
          onClick={() =>
            navigate("/artists")
          }
        >
          <FaArrowLeft />
          Back
        </button>

        <p>
          {error}
        </p>

      </div>
    );

  }


  const artistImage =
    artist.image_url
      ? getMediaUrl(
          artist.image_url
        )
      : null;


  const playAll = () => {

    if (!artist.songs?.length) {
      return;
    }

    playSong(
      artist.songs[0],
      artist.songs
    );

  };


  return (

    <div className="artist-details-page">


      <button
        type="button"

        className="artist-back"

        onClick={() =>
          navigate(-1)
        }
      >
        <FaArrowLeft />

        Back
      </button>


      {/* HERO */}

      <section className="artist-hero">

        <div className="artist-hero-image">

          {artistImage ? (

            <img
              src={artistImage}
              alt={artist.name}
            />

          ) : (

            <FaMicrophone />

          )}

        </div>


        <div>

          <span>
            ARTIST
          </span>

          <h1>
            {artist.name}
          </h1>

          <p>
            {artist.song_count}
            {" "}
            songs
            {" • "}
            {artist.album_count}
            {" "}
            albums
          </p>

        </div>

      </section>


      {/* PLAY */}

      <div className="artist-actions">

        <button
          type="button"
          onClick={playAll}
          disabled={
            !artist.songs?.length
          }
        >
          <FaPlay />
        </button>

      </div>


      {/* SONGS */}

      <section>

        <h2>
          Popular Songs
        </h2>


        <div className="artist-song-list">

          {artist.songs?.map(
            (song, index) => {

              const cover =
                song.cover_url
                  ? getMediaUrl(
                      song.cover_url
                    )
                  : "/images/default-cover.png";


              return (

                <div
                  className="artist-song-row"
                  key={song.id}
                >

                  <span>
                    {index + 1}
                  </span>


                  <img
                    src={cover}
                    alt={song.title}
                  />


                  <div>

                    <strong>
                      {song.title}
                    </strong>

                    <span>
                      {song.album_title ||
                        artist.name}
                    </span>

                  </div>


                  <button
                    type="button"

                    onClick={() =>
                      playSong(
                        song,
                        artist.songs
                      )
                    }
                  >
                    <FaPlay />
                  </button>

                </div>

              );

            }
          )}

        </div>

      </section>


      {/* ALBUMS */}

      {artist.albums?.length > 0 && (

        <section className="artist-albums">

          <h2>
            Albums
          </h2>


          <div className="artist-album-grid">

            {artist.albums.map(
              (album) => {

                const cover =
                  album.cover_url
                    ? getMediaUrl(
                        album.cover_url
                      )
                    : null;


                return (

                  <button
                    type="button"

                    className="artist-album-card"

                    key={album.id}

                    onClick={() =>
                      navigate(
                        `/albums/${album.id}`
                      )
                    }
                  >

                    <div>

                      {cover ? (

                        <img
                          src={cover}
                          alt={album.title}
                        />

                      ) : (

                        <FaMicrophone />

                      )}

                    </div>


                    <h3>
                      {album.title}
                    </h3>


                    <span>
                      {album.song_count}
                      {" "}
                      songs
                    </span>

                  </button>

                );

              }
            )}

          </div>

        </section>

      )}


    </div>

  );

}


export default ArtistDetails;