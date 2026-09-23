import {
  useEffect,
  useState,
} from "react";

import {
  FaMicrophone,
} from "react-icons/fa";

import {
  useNavigate,
} from "react-router-dom";

import API
  from "../services/api";

import {
  getMediaUrl,
} from "../utils/media";

import "../assets/css/artists.css";


function Artists() {

  const navigate =
    useNavigate();

  const [artists, setArtists] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  useEffect(() => {

    const loadArtists =
      async () => {

        try {

          setLoading(true);
          setError("");

          const response =
            await API.get(
              "/artists"
            );

          setArtists(
            response.data.artists ||
            []
          );

        } catch (error) {

          console.error(
            "Artists error:",
            error
          );

          setError(
            "Unable to load artists"
          );

        } finally {

          setLoading(false);

        }

      };


    loadArtists();

  }, []);


  if (loading) {

    return (
      <div className="artists-page">
        Loading artists...
      </div>
    );

  }


  return (

    <div className="artists-page">

      <header className="artists-header">

        <p>
          KEERTHANA
        </p>

        <h1>
          Artists
        </h1>

        <span>
          Christian singers and
          worship artists
        </span>

      </header>


      {error && (

        <div className="artists-error">
          {error}
        </div>

      )}


      <div className="artists-grid">

        {artists.map(
          (artist) => {

            const image =
              artist.image_url
                ? getMediaUrl(
                    artist.image_url
                  )
                : null;


            return (

              <button
                type="button"

                className="artist-card"

                key={artist.id}

                onClick={() =>
                  navigate(
                    `/artists/${artist.id}`
                  )
                }
              >

                <div className="artist-image">

                  {image ? (

                    <img
                      src={image}
                      alt={artist.name}
                    />

                  ) : (

                    <FaMicrophone />

                  )}

                </div>


                <h3>
                  {artist.name}
                </h3>


                <p>
                  Artist
                </p>


                <span>
                  {artist.song_count}
                  {" "}
                  songs
                </span>

              </button>

            );

          }
        )}

      </div>

    </div>

  );

}


export default Artists;