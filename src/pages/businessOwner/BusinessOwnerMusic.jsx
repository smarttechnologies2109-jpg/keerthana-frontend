import React from "react";
import { useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaMusic,
  FaCompactDisc,
  FaUsers,
  FaFolderOpen,
  FaChurch,
} from "react-icons/fa";
import "../../assets/css/businessowner/BusinessOwnerMusic.css";

/* =========================================================
   BUSINESS OWNER MUSIC
   Music management navigation only.
   Language-wise collection section removed.
========================================================= */

const BusinessOwnerMusic = () => {
  const navigate = useNavigate();

  const musicSections = [
    {
      key: "songs",
      title: "Songs",
      description: "View all songs in the KEERTHANA collection.",
      icon: <FaMusic />,
      path: "/owner/music/songs",
    },
    {
      key: "albums",
      title: "Albums",
      description: "View all albums available in the KEERTHANA collection.",
      icon: <FaCompactDisc />,
      path: "/owner/music/albums",
    },
    {
      key: "artists",
      title: "Artists",
      description: "View artists and their music collection.",
      icon: <FaUsers />,
      path: "/owner/music/artists",
    },
    {
      key: "categories",
      title: "Categories",
      description: "View music categories used in KEERTHANA.",
      icon: <FaFolderOpen />,
      path: "/owner/music/categories",
    },
    {
      key: "ministries",
      title: "Ministries",
      description: "View ministries and their songs.",
      icon: <FaChurch />,
      path: "/owner/music/ministries",
    },
  ];

  return (
    <div className="owner-music-page">
      <header className="owner-music-header">
        <button
          type="button"
          className="owner-music-back-button"
          onClick={() => navigate("/owner/dashboard")}
        >
          <FaArrowLeft />
          <span>Dashboard</span>
        </button>

        <div className="owner-music-heading">
          <div className="owner-music-heading-icon">
            <FaMusic />
          </div>
          <div>
            <h1>Music Collection</h1>
            <p>Manage and explore the KEERTHANA music collection.</p>
          </div>
        </div>
      </header>

      <main className="owner-music-content">
        <section className="owner-music-management-section">
          <div className="owner-music-section-heading owner-music-management-heading">
            <div>
              <span className="owner-music-eyebrow">MANAGEMENT</span>
              <h2>Explore Music Collection</h2>
              <p>Browse the songs, albums, artists, categories and ministries.</p>
            </div>
          </div>

          <div className="owner-music-grid">
            {musicSections.map((section) => (
              <button
                type="button"
                key={section.key}
                className="owner-music-section-card"
                onClick={() => navigate(section.path)}
              >
                <div className="owner-music-section-icon">{section.icon}</div>
                <div className="owner-music-section-content">
                  <h2>{section.title}</h2>
                  <p>{section.description}</p>
                </div>
                <div className="owner-music-section-arrow">→</div>
              </button>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default BusinessOwnerMusic;
