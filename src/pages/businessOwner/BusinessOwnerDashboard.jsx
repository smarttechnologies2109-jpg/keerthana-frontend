import React from "react";
import { useNavigate } from "react-router-dom";

import {
  FaStore,
  FaMusic,
  FaUsers,
  FaChartBar,
  FaSignOutAlt,
  FaArrowRight,
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

  // Dashboard contains only the three requested management modules.
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
      title: "Platform Statistics",
      description: "View users, music and platform performance.",
      button: "Manage Statistics",
      icon: <FaChartBar />,
      className: "statistics-card",
      path: "/owner/statistics",
    },
    {
      title: "Music Management",
      description: "Manage songs, albums, artists and music collections.",
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
              <p>Manage your KEERTHANA platform services.</p>
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
