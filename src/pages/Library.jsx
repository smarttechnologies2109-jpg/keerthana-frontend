
import React from "react";
import { useNavigate } from "react-router-dom";

import {
  FaMusic,
  FaPlus,
  FaHistory,
  FaArrowRight,
  FaHeart,
  FaBookmark,
  FaDownload,
  FaChartBar,
  FaBell,
  FaGift,
  FaHandsHelping,
  FaListUl,
} from "react-icons/fa";

import "../assets/css/library.css";

function Library() {
  const navigate = useNavigate();

  const openCreatePlaylist = () => {
    navigate("/playlists?create=true");
  };

  const libraryCards = [
    {
      id: "playlists",
      number: "01",
      title: "Your Playlists",
      description:
        "Explore, play, and manage your personal collections of worship songs, praise, and Christian music.",
      action: "Explore playlists",
      icon: <FaMusic />,
      className: "library-card-playlists",
      path: "/playlists",
    },
    {
      id: "liked-songs",
      number: "02",
      title: "Liked Songs",
      description:
        "All the worship songs you have liked, gathered in one place.",
      action: "View liked songs",
      icon: <FaHeart />,
      className: "library-card-liked",
      path: "/liked-songs",
    },
    {
      id: "favorites",
      number: "03",
      title: "Favorites",
      description:
        "Quickly access your favourite songs and saved music collections.",
      action: "View favorites",
      icon: <FaBookmark />,
      className: "library-card-favorites",
      path: "/favorites",
    },
    {
      id: "downloads",
      number: "04",
      title: "Downloads",
      description:
        "Access your downloaded worship songs and enjoy music offline.",
      action: "View downloads",
      icon: <FaDownload />,
      className: "library-card-downloads",
      path: "/downloads",
    },
    {
      id: "history",
      number: "05",
      title: "Listening History",
      description:
        "Return to songs you have listened to and continue your worship experience.",
      action: "View listening history",
      icon: <FaHistory />,
      className: "library-card-history",
      path: "/history",
    },
    {
      id: "statistics",
      number: "06",
      title: "Your Statistics",
      description:
        "Discover your listening activity and personal music statistics.",
      action: "View statistics",
      icon: <FaChartBar />,
      className: "library-card-statistics",
      path: "/statistics",
    },
  ];

  const quickLinks = [
    {
      id: "notifications",
      title: "Notifications",
      description: "Stay updated with KEERTHANA.",
      icon: <FaBell />,
      path: "/notifications",
    },
    {
      id: "ad-free",
      title: "30 Minutes Ad-Free",
      description: "Watch a rewarded video and enjoy uninterrupted music.",
      icon: <FaGift />,
      path: "/ad-free-reward",
    },
    {
      id: "support",
      title: "Support Our Ministry",
      description: "Support the KEERTHANA ministry.",
      icon: <FaHandsHelping />,
      path: "/donations",
    },
  ];

  return (
    <main className="library-page">
      <div className="library-main">
        <section className="library-content">

          {/* HEADER */}
          <div className="library-section-heading">
            <div className="library-section-copy">
              <span className="library-section-eyebrow">
                YOUR COLLECTIONS
              </span>

              <h2>Your music, your way</h2>

              <p>
                Everything you love, gathered in one place.
              </p>
            </div>

            <button
              type="button"
              className="library-primary-button"
              onClick={openCreatePlaylist}
            >
              <FaPlus />
              <span>Create playlist</span>
            </button>
          </div>

          {/* MAIN LIBRARY CARDS */}
          <div className="library-grid">
            {libraryCards.map((card) => (
              <button
                key={card.id}
                type="button"
                className={`library-card ${card.className}`}
                onClick={() => navigate(card.path)}
              >
                <span className="library-card-top">
                  <span className="library-card-icon">
                    {card.icon}
                  </span>

                  <span className="library-card-number">
                    {card.number}
                  </span>
                </span>

                <span className="library-card-content">
                  <span className="library-card-title">
                    {card.title}
                  </span>

                  <span className="library-card-description">
                    {card.description}
                  </span>
                </span>

                <span className="library-card-action">
                  <span>{card.action}</span>

                  <span className="library-card-arrow-wrap">
                    <FaArrowRight className="library-card-arrow" />
                  </span>
                </span>
              </button>
            ))}
          </div>

          {/* QUICK ACCESS */}
          <section className="library-quick-section">
            <div className="library-quick-heading">
              <div>
                <span className="library-section-eyebrow">
                  QUICK ACCESS
                </span>

                <h2>More from KEERTHANA</h2>

                <p>
                  Important features, just one tap away.
                </p>
              </div>
            </div>

            <div className="library-quick-grid">
              {quickLinks.map((link) => (
                <button
                  key={link.id}
                  type="button"
                  className="library-quick-card"
                  onClick={() => navigate(link.path)}
                >
                  <span className="library-quick-icon">
                    {link.icon}
                  </span>

                  <span className="library-quick-info">
                    <strong>{link.title}</strong>
                    <small>{link.description}</small>
                  </span>

                  <FaArrowRight className="library-quick-arrow" />
                </button>
              ))}
            </div>
          </section>

          {/* FOOTER */}
          <div className="library-footer-note">
            <span className="library-footer-icon">
              <FaMusic />
            </span>

            <div>
              <strong>
                Let the music lead your heart.
              </strong>

              <p>
                A place for praise, prayer, peace, and worship.
              </p>
            </div>

            <span
              className="library-footer-decoration"
              aria-hidden="true"
            >
              ♪
            </span>
          </div>

        </section>
      </div>
    </main>
  );
}

export default Library;
