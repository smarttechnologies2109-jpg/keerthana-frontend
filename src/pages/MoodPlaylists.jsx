
import React, { useState } from "react";

import {
  FaSmile,
  FaHeart,
  FaHandsHelping,
  FaSun,
  FaCloudSun,
  FaStar,
  FaArrowRight,
  FaSearch,
} from "react-icons/fa";

import { useNavigate } from "react-router-dom";

import "../assets/css/MoodPlaylists.css";

import Sidebar from "../components/Sidebar";
import MusicPlayer from "../components/MusicPlayer";
import VoiceSearch from "../components/VoiceSearch";

/* =========================================================
   MOODS
========================================================= */

const moods = [
  {
    id: "worship",
    name: "Worship",
    icon: <FaHeart />,
    description: "Songs to praise and worship God",
  },
  {
    id: "praise",
    name: "Praise",
    icon: <FaSmile />,
    description: "Joyful songs celebrating God's goodness",
  },
  {
    id: "prayer",
    name: "Prayer",
    icon: <FaHandsHelping />,
    description: "Peaceful songs for prayer and devotion",
  },
  {
    id: "hope",
    name: "Hope & Faith",
    icon: <FaSun />,
    description: "Songs that strengthen faith and bring hope",
  },
  {
    id: "peace",
    name: "Peace & Comfort",
    icon: <FaCloudSun />,
    description: "Calm songs for comfort and inner peace",
  },
  {
    id: "thanksgiving",
    name: "Thanksgiving",
    icon: <FaStar />,
    description: "Songs of gratitude and thanksgiving to God",
  },
];

/* =========================================================
   COMPONENT
========================================================= */

const MoodPlaylists = () => {
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [voiceLanguage, setVoiceLanguage] = useState("te-IN");

  /* =======================================================
     VOICE SEARCH
  ======================================================= */

  const handleVoiceSearch = (recognizedText) => {
    setSearch(recognizedText);
  };

  /* =======================================================
     FILTER MOODS
  ======================================================= */

  const searchText = search.trim().toLowerCase();

  const filteredMoods = moods.filter((mood) => {
    if (!searchText) {
      return true;
    }

    return (
      mood.name.toLowerCase().includes(searchText) ||
      mood.description.toLowerCase().includes(searchText) ||
      mood.id.toLowerCase().includes(searchText)
    );
  });

  /* =======================================================
     OPEN MOOD
  ======================================================= */

  const handleExploreMood = (moodId) => {
    navigate(`/moods/${moodId}`);
  };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="mood-page">
      {/* SIDEBAR */}

      <Sidebar />

      {/* MAIN CONTENT */}

      <main className="mood-main">
        {/* PAGE HERO */}

        <header className="mood-page-header">
          <span className="mood-label">
            🎧 KEERTHANA
          </span>

          <h1>
            Music for Every <span>Mood</span>
          </h1>

          <p>
            Choose your mood and discover Christian songs
            that inspire, encourage, and strengthen your faith.
          </p>
        </header>

        {/* MOODS CONTENT */}

        <section
          className="mood-content"
          aria-label="Discover moods"
        >
          {/* VOICE SEARCH */}

          <div
            className="mood-voice-search-section"
            aria-label="Search moods"
          >
            <VoiceSearch
              value={search}
              onChange={setSearch}
              onSearch={handleVoiceSearch}
              language={voiceLanguage}
              onLanguageChange={setVoiceLanguage}
              placeholder="Search moods, worship, prayer, hope..."
              ariaLabel="Search moods"
            />
          </div>

          {/* MOOD TRACKER */}

          <div className="mood-section-heading">
            <div>
              <h2>Discover Your Mood</h2>

              <p>
                {filteredMoods.length}{" "}
                {filteredMoods.length === 1
                  ? "mood"
                  : "moods"}{" "}
                available
              </p>
            </div>
          </div>

          {/* MOOD GRID / EMPTY STATE */}

          {filteredMoods.length === 0 ? (
            <div className="mood-empty-state">
              <div className="mood-empty-icon">
                <FaSearch />
              </div>

              <h2>No moods found</h2>

              <p>
                No moods match "{search.trim()}". Try
                searching for worship, prayer, praise, or hope.
              </p>

              <button
                type="button"
                className="mood-clear-search-btn"
                onClick={() => setSearch("")}
              >
                Clear Search
              </button>
            </div>
          ) : (
            <div
              className="mood-grid"
              aria-label="Explore music by mood"
            >
              {filteredMoods.map((mood) => (
                <article
                  className="mood-card"
                  key={mood.id}
                  role="link"
                  tabIndex={0}
                  aria-label={`Explore ${mood.name} songs`}
                  onClick={() =>
                    handleExploreMood(mood.id)
                  }
                  onKeyDown={(event) => {
                    if (
                      event.key === "Enter" ||
                      event.key === " "
                    ) {
                      event.preventDefault();
                      handleExploreMood(mood.id);
                    }
                  }}
                >
                  <div
                    className="mood-icon"
                    aria-hidden="true"
                  >
                    {mood.icon}
                  </div>

                  <h2>{mood.name}</h2>

                  <p>{mood.description}</p>

                  <button
                    type="button"
                    className="mood-btn"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleExploreMood(mood.id);
                    }}
                  >
                    Explore Songs
                    <FaArrowRight aria-hidden="true" />
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* MUSIC PLAYER */}

      <MusicPlayer />
    </div>
  );
};

export default MoodPlaylists;
