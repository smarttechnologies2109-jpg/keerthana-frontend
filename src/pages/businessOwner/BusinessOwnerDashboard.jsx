import React from "react";
import { useNavigate } from "react-router-dom";

import {
  FaStore,
  FaMusic,
  FaUsers,
  FaChartBar,
  FaSignOutAlt,
  FaArrowRight,
  FaChurch,
  FaTags,
  FaGlobe,
  FaHeadphones,
  FaCrown,
} from "react-icons/fa";

import "../../assets/css/businessowner/BusinessOwnerDashboard.css";

const BusinessOwnerDashboard = () => {
  const navigate = useNavigate();

  let user = null;

  try {
    user = JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    user = null;
  }

  const handleLogout = () => {
    localStorage.removeItem("keerthana_token");
    localStorage.removeItem("user");
    navigate("/owner/login", { replace: true });
  };

  // Supported KEERTHANA languages
  const languages = [
    { name: "Telugu", code: "TE", native: "తెలుగు" },
    { name: "Hindi", code: "HI", native: "हिन्दी" },
    { name: "English", code: "EN", native: "English" },
    { name: "Malayalam", code: "ML", native: "മലയാളം" },
    { name: "Kannada", code: "KN", native: "ಕನ್ನಡ" },
    { name: "Tamil", code: "TA", native: "தமிழ்" },
  ];

  /*
   * IMPORTANT:
   * These paths must match the routes declared in App.jsx.
   * Categories and Ministries are nested under /owner/music.
   * There is no standalone /owner/languages route, so the
   * language card opens Music Collection where language-wise
   * browsing is available.
   */
  const dashboardCards = [
    {
      title: "User Management",
      description: "View and manage registered KEERTHANA users.",
      button: "Manage Users",
      icon: <FaUsers />,
      className: "users-card",
      path: "/owner/users",
    },
    {
      title: "Ministry Management",
      description: "View ministries and their Christian music content.",
      button: "View Ministries",
      icon: <FaChurch />,
      className: "ministries-card",
      path: "/owner/music/ministries",
    },
    {
      title: "Category Management",
      description: "View and organize KEERTHANA music categories.",
      button: "View Categories",
      icon: <FaTags />,
      className: "categories-card",
      path: "/owner/music/categories",
    },
    {
      title: "Language Management",
      description: "Browse songs, albums, artists and collections by language.",
      button: "Explore Languages",
      icon: <FaGlobe />,
      className: "languages-card",
      path: "/owner/music",
    },
    {
      title: "Platform Statistics",
      description: "View users, music and platform performance.",
      button: "View Statistics",
      icon: <FaChartBar />,
      className: "statistics-card",
      path: "/owner/statistics",
    },
    {
      title: "Music Management",
      description: "Explore songs, albums, artists, categories and ministries.",
      button: "Manage Music",
      icon: <FaMusic />,
      className: "music-card",
      path: "/owner/music",
    },
  ];

  return (
    <div className="owner-dashboard-page">
      {/* HEADER */}
      <header className="owner-dashboard-header">
        <div className="owner-dashboard-header-content">
          <div className="owner-dashboard-title">
            <div className="owner-dashboard-title-icon">
              <FaStore />
            </div>

            <div>
              <h1>KEERTHANA</h1>
              <p>Business Owner Dashboard</p>
            </div>
          </div>

          <button
            type="button"
            className="owner-logout-btn"
            onClick={handleLogout}
          >
            <FaSignOutAlt />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* MAIN */}
      <main className="owner-dashboard-main">
        {/* WELCOME BANNER */}
        <section className="owner-welcome-banner">
          <div className="owner-welcome-content">
            <span className="owner-welcome-label">
              <FaCrown /> BUSINESS OWNER PORTAL
            </span>

            <h2>
              Welcome Back, {user?.name || "Business Owner"}!
            </h2>

            <p>
              Manage your KEERTHANA Music platform from one
              powerful dashboard.
            </p>
          </div>

          <div className="owner-welcome-icon">
            <FaHeadphones />
          </div>
        </section>

        {/* BUSINESS INFORMATION */}
        <section className="owner-business-info">
          <div className="business-info-icon">
            <FaStore />
          </div>

          <div className="business-info-content">
            <h2>{user?.name || "Smart Technologies"}</h2>
            <p>{user?.email || "Business Owner"}</p>
          </div>

          <div className="owner-account-status">
            <span className="owner-status-dot"></span>
            Active Account
          </div>
        </section>

        {/* MANAGEMENT SECTION */}
        <section className="owner-dashboard-section">
          <div className="owner-section-heading">
            <div>
              <h2>Platform Management</h2>
              <p>Manage all your KEERTHANA platform services.</p>
            </div>

            <span className="owner-section-count">
              {dashboardCards.length} Modules
            </span>
          </div>

          <div className="owner-dashboard-grid">
            {dashboardCards.map((card) => (
              <div
                key={card.title}
                className={`owner-dashboard-card ${card.className}`}
              >
                <div className="dashboard-card-top">
                  <div className="dashboard-card-icon">
                    {card.icon}
                  </div>

                  <span className="dashboard-card-arrow">
                    <FaArrowRight />
                  </span>
                </div>

                <div className="dashboard-card-content">
                  <h3>{card.title}</h3>
                  <p>{card.description}</p>
                </div>

                <button
                  type="button"
                  className="dashboard-card-btn"
                  onClick={() => navigate(card.path)}
                >
                  {card.button}
                  <FaArrowRight />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* LANGUAGE SECTION */}
        <section className="owner-languages-section">
          <div className="owner-section-heading">
            <div>
              <h2>
                <FaGlobe /> Supported Languages
              </h2>

              <p>Languages available in KEERTHANA Music.</p>
            </div>

            <span className="owner-section-count">
              {languages.length} Languages
            </span>
          </div>

          <div className="owner-languages-grid">
            {languages.map((language) => (
              <div
                key={language.code}
                className="owner-language-card"
              >
                <div className="owner-language-code">
                  {language.code}
                </div>

                <div className="owner-language-info">
                  <h3>{language.name}</h3>
                  <p>{language.native}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* FOOTER */}
        <footer className="owner-dashboard-footer">
          <FaMusic />
          <span>
            KEERTHANA MUSIC — Praise • Worship • Christian Music
          </span>
        </footer>
      </main>
    </div>
  );
};

export default BusinessOwnerDashboard;
