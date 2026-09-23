import {
  FaHeart,
  FaMusic,
  FaPlus,
} from "react-icons/fa";

import {
  useNavigate,
} from "react-router-dom";

import "../assets/css/library.css";




function Library() {

  const navigate =
    useNavigate();


  /* =====================================================
     KEYBOARD NAVIGATION
  ===================================================== */

  const handleKeyDown =
    (event, path) => {

      if (
        event.key === "Enter" ||
        event.key === " "
      ) {

        event.preventDefault();

        navigate(path);

      }

    };


  return (

    <div className="library-page">


      {/* =================================================
          HEADER
      ================================================= */}

      <header className="library-header">

        <p className="library-eyebrow">
          KEERTHANA
        </p>

        <h1>
          Your Library
        </h1>

        <span>
          Your saved music,
          favourites and playlists
        </span>

      </header>


      {/* =================================================
          ADVERTISEMENT
      ================================================= */}

      <div className="library-ad-section">

        {/* <AdBanner
          placement="library"
        /> */}

      </div>


      {/* =================================================
          SECTION HEADING
      ================================================= */}

      <section className="library-content">


        <div className="library-section-heading">

          <div>

            <span>
              YOUR MUSIC
            </span>

            <h2>
              Listen Your Way
            </h2>

            <p>
              Access your favourite songs
              and personal playlists.
            </p>

          </div>

        </div>


        {/* ===============================================
            LIBRARY GRID
        =============================================== */}

        <div className="library-grid">


          {/* =============================================
              LIKED SONGS
          ============================================= */}

          <div
            className="library-card library-liked-card"

            onClick={() =>
              navigate("/liked-songs")
            }

            onKeyDown={(event) =>
              handleKeyDown(
                event,
                "/liked-songs"
              )
            }

            role="button"

            tabIndex={0}
          >

            <div className="library-card-top">

              <div className="library-card-icon">

                <FaHeart />

              </div>


              <span className="library-card-number">
                01
              </span>

            </div>


            <div className="library-card-content">

              <h3>
                Liked Songs
              </h3>

              <p>
                Your favourite songs
                in one place.
              </p>

            </div>


            <div className="library-card-action">

              <span>
                Open Collection
              </span>

              <span className="library-arrow">
                →
              </span>

            </div>

          </div>


          {/* =============================================
              PLAYLISTS
          ============================================= */}

          <div
            className="library-card"

            onClick={() =>
              navigate("/playlists")
            }

            onKeyDown={(event) =>
              handleKeyDown(
                event,
                "/playlists"
              )
            }

            role="button"

            tabIndex={0}
          >

            <div className="library-card-top">

              <div className="library-card-icon">

                <FaMusic />

              </div>


              <span className="library-card-number">
                02
              </span>

            </div>


            <div className="library-card-content">

              <h3>
                Playlists
              </h3>

              <p>
                Listen to your personal
                worship playlists.
              </p>

            </div>


            <div className="library-card-action">

              <span>
                View Playlists
              </span>

              <span className="library-arrow">
                →
              </span>

            </div>

          </div>


          {/* =============================================
              CREATE PLAYLIST
          ============================================= */}

          <div
            className="library-card library-create-card"

            onClick={() =>
              navigate("/playlists")
            }

            onKeyDown={(event) =>
              handleKeyDown(
                event,
                "/playlists"
              )
            }

            role="button"

            tabIndex={0}
          >

            <div className="library-card-top">

              <div className="library-card-icon">

                <FaPlus />

              </div>


              <span className="library-card-number">
                03
              </span>

            </div>


            <div className="library-card-content">

              <h3>
                Create Playlist
              </h3>

              <p>
                Build your own worship
                music collection.
              </p>

            </div>


            <div className="library-card-action">

              <span>
                Create Playlist
              </span>

              <span className="library-arrow">
                +
              </span>

            </div>

          </div>


        </div>

      </section>


    </div>

  );

}


export default Library;