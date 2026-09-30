
import React from "react";

import {
  FaSmile,
  FaHeart,
  FaHandsHelping,
  FaSun,
  FaCloudSun,
  FaStar,
} from "react-icons/fa";

import {
  useNavigate,
} from "react-router-dom";

import "../assets/css/MoodPlaylists.css";

import Sidebar from "../components/Sidebar";
import MusicPlayer from "../components/MusicPlayer";
import Header from "../components/Header";


/* =========================================================
   MOODS
========================================================= */

const moods = [
  {
    id: "worship",
    name: "Worship",
    icon: <FaHeart />,
    description:
      "Songs to praise and worship God",
  },

  {
    id: "praise",
    name: "Praise",
    icon: <FaSmile />,
    description:
      "Joyful songs celebrating God's goodness",
  },

  {
    id: "prayer",
    name: "Prayer",
    icon: <FaHandsHelping />,
    description:
      "Peaceful songs for prayer and devotion",
  },

  {
    id: "hope",
    name: "Hope & Faith",
    icon: <FaSun />,
    description:
      "Songs that strengthen faith and bring hope",
  },

  {
    id: "peace",
    name: "Peace & Comfort",
    icon: <FaCloudSun />,
    description:
      "Calm songs for comfort and inner peace",
  },

  {
    id: "thanksgiving",
    name: "Thanksgiving",
    icon: <FaStar />,
    description:
      "Songs of gratitude and thanksgiving to God",
  },
];


/* =========================================================
   COMPONENT
========================================================= */

const MoodPlaylists = () => {

  const navigate = useNavigate();


  /* =======================================================
     EXPLORE MOOD
  ======================================================= */

  const handleExploreMood = (moodId) => {

    navigate(`/moods/${moodId}`);

  };


  /* =======================================================
     RENDER
  ======================================================= */

  return (

    <div className="mood-page">

      {/* =================================================
         SIDEBAR
      ================================================= */}

      <Sidebar />


      {/* =================================================
         HEADER
      ================================================= */}

      {/* <Header /> */}


      {/* =================================================
         PAGE HEADER
      ================================================= */}

      <div className="mood-page-header">

        <span className="mood-label">
          🎧 KEERTHANA
        </span>


        <h1>
          Music for Every <span>Mood</span>
        </h1>


        <p>
          Choose your mood and discover Christian
          songs that inspire, encourage, and
          strengthen your faith.
        </p>

      </div>


      {/* =================================================
         MOOD GRID
      ================================================= */}

      <div className="mood-grid">

        {moods.map((mood) => (

          <div
            className="mood-card"
            key={mood.id}
          >

            {/* ---------------------------------------------
               ICON
            --------------------------------------------- */}

            <div className="mood-icon">

              {mood.icon}

            </div>


            {/* ---------------------------------------------
               TITLE
            --------------------------------------------- */}

            <h2>
              {mood.name}
            </h2>


            {/* ---------------------------------------------
               DESCRIPTION
            --------------------------------------------- */}

            <p>
              {mood.description}
            </p>


            {/* ---------------------------------------------
               EXPLORE BUTTON
            --------------------------------------------- */}

            <button
              type="button"
              className="mood-btn"
              onClick={() =>
                handleExploreMood(mood.id)
              }
            >

              Explore Songs

            </button>

          </div>

        ))}

      </div>


      {/* =================================================
         MUSIC PLAYER
      ================================================= */}

      <MusicPlayer />

    </div>

  );

};


export default MoodPlaylists;

