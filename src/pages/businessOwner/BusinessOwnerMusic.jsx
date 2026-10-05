import React from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  FaArrowLeft,
  FaMusic,
  FaCompactDisc,
  FaUsers,
  FaFolderOpen,
  FaChurch,
} from "react-icons/fa";

import "../../assets/css/businessOwner/BusinessOwnerMusic.css";


/* =========================================================
   BUSINESS OWNER MUSIC
========================================================= */

const BusinessOwnerMusic = () => {

  const navigate = useNavigate();


  /* =======================================================
     MUSIC SECTIONS
  ======================================================= */

  const musicSections = [

    {
      key: "songs",

      title: "Songs",

      description:
        "View and manage all songs in the KEERTHANA collection.",

      icon: <FaMusic />,

      path: "/owner/music/songs",
    },


    {
      key: "albums",

      title: "Albums",

      description:
        "View all albums available in the KEERTHANA collection.",

      icon: <FaCompactDisc />,

      path: "/owner/music/albums",
    },


    {
      key: "artists",

      title: "Artists",

      description:
        "View artists and their music collection.",

      icon: <FaUsers />,

      path: "/owner/music/artists",
    },


    {
      key: "categories",

      title: "Categories",

      description:
        "View music categories used in KEERTHANA.",

      icon: <FaFolderOpen />,

      path: "/owner/music/categories",
    },


    {
      key: "ministries",

      title: "Ministries",

      description:
        "View ministries and their songs.",

      icon: <FaChurch />,

      path: "/owner/music/ministries",
    },

  ];


  /* =======================================================
     RENDER
  ======================================================= */

  return (

    <div className="owner-music-page">


      {/* ===================================================
          HEADER
      =================================================== */}

      <header className="owner-music-header">


        {/* BACK */}

        <button
          type="button"
          className="owner-music-back-button"
          onClick={() =>
            navigate(
              "/owner/dashboard"
            )
          }
        >

          <FaArrowLeft />

          <span>
            Dashboard
          </span>

        </button>


        {/* TITLE */}

        <div className="owner-music-heading">

          <div className="owner-music-heading-icon">

            <FaMusic />

          </div>


          <div>

            <h1>
              Music Collection
            </h1>

            <p>
              Manage and explore the KEERTHANA
              music collection.
            </p>

          </div>

        </div>

      </header>


      {/* ===================================================
          MUSIC SECTION GRID
      =================================================== */}

      <main className="owner-music-content">

        <div className="owner-music-grid">

          {musicSections.map(
            (section) => (

              <button
                type="button"
                key={section.key}
                className="owner-music-section-card"
                onClick={() =>
                  navigate(
                    section.path
                  )
                }
              >


                {/* ICON */}

                <div className="owner-music-section-icon">

                  {section.icon}

                </div>


                {/* CONTENT */}

                <div className="owner-music-section-content">

                  <h2>
                    {section.title}
                  </h2>

                  <p>
                    {section.description}
                  </p>

                </div>


                {/* ARROW */}

                <div className="owner-music-section-arrow">

                  →

                </div>

              </button>

            )
          )}

        </div>

      </main>

    </div>

  );

};


export default BusinessOwnerMusic;