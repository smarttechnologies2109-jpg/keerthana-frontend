import React from "react";

import {
  NavLink,
  useNavigate,
} from "react-router-dom";

import {
  FaHome,
  FaSearch,
  FaBookOpen,
  FaMusic,
  FaHeart,
  FaBookmark,
  FaRegBookmark,
  FaSignInAlt,
  FaSignOutAlt,
  FaCompactDisc,
  FaMicrophone,
  FaChurch,
  FaCrown,
  FaHistory,
  FaTimes,
  FaListUl,
  FaRobot,
  FaChartBar,
  FaDownload,
  FaBell,
  FaChevronRight,
} from "react-icons/fa";

import { useAuth } from "../context/AuthContext";

import "../assets/css/sidebar.css";

function Sidebar({
  isOpen,
  onToggle,
}) {
  const navigate = useNavigate();

  const {
    user,
    logout,
  } = useAuth();

  /* =========================================================
     NAVIGATION CLASS
  ========================================================= */

  const navClass = ({
    isActive,
  }) =>
    `sidebar-nav-item ${
      isActive ? "active" : ""
    }`;

  /* =========================================================
     LOGOUT
  ========================================================= */

  const handleLogout = () => {
    logout();

    onToggle?.();

    navigate("/login", {
      replace: true,
    });
  };

  /* =========================================================
     MOBILE NAVIGATION
  ========================================================= */

  const handleNavigation = () => {
    if (window.innerWidth <= 700) {
      onToggle?.();
    }
  };

  /* =========================================================
     PROFILE
  ========================================================= */

  const handleProfile = () => {
    navigate("/profile");
    handleNavigation();
  };

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <>
      {/* =====================================================
          MOBILE OVERLAY
      ===================================================== */}

      <div
        className={`sidebar-overlay ${
          isOpen
            ? "sidebar-overlay-visible"
            : ""
        }`}
        onClick={onToggle}
        aria-hidden="true"
      />

      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <aside
        className={`sidebar ${
          isOpen
            ? "sidebar-open"
            : "sidebar-closed"
        }`}
      >

        {/* ===================================================
            MOBILE CLOSE
        =================================================== */}

        <button
          type="button"
          className="sidebar-mobile-close"
          onClick={onToggle}
          aria-label="Close menu"
          title="Close menu"
        >
          <FaTimes />
        </button>


        {/* ===================================================
            BRAND
        =================================================== */}

        <button
          type="button"
          className="sidebar-brand"
          onClick={() => {
            navigate("/home");
            handleNavigation();
          }}
          aria-label="Go to home"
        >

          <div className="sidebar-brand-logo">
            <FaMusic />
          </div>

          <div className="sidebar-brand-text">

            <h1>
              KEERTHANA
            </h1>

            <span>
              Christian Music
            </span>

          </div>

        </button>


        {/* ===================================================
            SIDEBAR CONTENT
        =================================================== */}

        <div className="sidebar-content">


          {/* =================================================
              EXPLORE
          ================================================= */}

          <section className="sidebar-section">

            <div className="sidebar-section-heading">
              <span>
                EXPLORE
              </span>
            </div>


            <nav className="sidebar-nav">

              {/* HOME */}

              <NavLink
                to="/"
                className={navClass}
                onClick={handleNavigation}
              >

                <span className="sidebar-icon">
                  <FaHome />
                </span>

                <span className="sidebar-label">
                  Home
                </span>

                <FaChevronRight className="sidebar-item-arrow" />

              </NavLink>


              {/* ALL SONGS */}

              <NavLink
                to="/songs"
                className={navClass}
                onClick={handleNavigation}
              >

                <span className="sidebar-icon">
                  <FaMusic />
                </span>

                <span className="sidebar-label">
                  All Songs
                </span>

                <FaChevronRight className="sidebar-item-arrow" />

              </NavLink>


              {/* SEARCH */}

              <NavLink
                to="/search"
                className={navClass}
                onClick={handleNavigation}
              >

                <span className="sidebar-icon">
                  <FaSearch />
                </span>

                <span className="sidebar-label">
                  Search
                </span>

                <FaChevronRight className="sidebar-item-arrow" />

              </NavLink>


              {/* LIBRARY */}

              <NavLink
                to="/library"
                className={navClass}
                onClick={handleNavigation}
              >

                <span className="sidebar-icon">
                  <FaBookOpen />
                </span>

                <span className="sidebar-label">
                  Your Library
                </span>

                <FaChevronRight className="sidebar-item-arrow" />

              </NavLink>


              {/* ARTISTS */}

              <NavLink
                to="/artists"
                className={navClass}
                onClick={handleNavigation}
              >

                <span className="sidebar-icon">
                  <FaMicrophone />
                </span>

                <span className="sidebar-label">
                  Artists
                </span>

                <FaChevronRight className="sidebar-item-arrow" />

              </NavLink>


              {/* ALBUMS */}

              <NavLink
                to="/albums"
                className={navClass}
                onClick={handleNavigation}
              >

                <span className="sidebar-icon">
                  <FaCompactDisc />
                </span>

                <span className="sidebar-label">
                  Albums
                </span>

                <FaChevronRight className="sidebar-item-arrow" />

              </NavLink>


              {/* MINISTRIES */}

              <NavLink
                to="/ministries"
                className={navClass}
                onClick={handleNavigation}
              >

                <span className="sidebar-icon">
                  <FaChurch />
                </span>

                <span className="sidebar-label">
                  Ministries
                </span>

                <FaChevronRight className="sidebar-item-arrow" />

              </NavLink>


              {/* MOOD PLAYLISTS */}

              <NavLink
                to="/mood-playlists"
                className={navClass}
                onClick={handleNavigation}
              >

                <span className="sidebar-icon">
                  <FaMusic />
                </span>

                <span className="sidebar-label">
                  Mood Playlists
                </span>

                <FaChevronRight className="sidebar-item-arrow" />

              </NavLink>

            </nav>

          </section>


          {/* =================================================
              YOUR MUSIC
          ================================================= */}

          <section className="sidebar-section">

            <div className="sidebar-section-heading">
              <span>
                YOUR MUSIC
              </span>
            </div>


            <nav className="sidebar-nav">


              {/* LIKED SONGS */}

              <NavLink
                to="/liked-songs"
                className={navClass}
                onClick={handleNavigation}
              >

                <span className="sidebar-icon sidebar-heart-icon">
                  <FaHeart />
                </span>

                <span className="sidebar-label">
                  Liked Songs
                </span>

                <FaChevronRight className="sidebar-item-arrow" />

              </NavLink>


              {/* FAVORITES */}

              <NavLink
                to="/favorites"
                className={navClass}
                onClick={handleNavigation}
              >

                <span className="sidebar-icon sidebar-favorite-icon">
                  <FaBookmark />
                </span>

                <span className="sidebar-label">
                  Favorites
                </span>

                <FaChevronRight className="sidebar-item-arrow" />

              </NavLink>


              {/* DOWNLOADS */}

              <NavLink
                to="/downloads"
                className={navClass}
                onClick={handleNavigation}
              >

                <span className="sidebar-icon">
                  <FaDownload />
                </span>

                <span className="sidebar-label">
                  Downloads
                </span>

                <FaChevronRight className="sidebar-item-arrow" />

              </NavLink>


              {/* PLAYLISTS */}

              <NavLink
                to="/playlists"
                className={navClass}
                onClick={handleNavigation}
              >

                <span className="sidebar-icon">
                  <FaListUl />
                </span>

                <span className="sidebar-label">
                  Playlists
                </span>

                <FaChevronRight className="sidebar-item-arrow" />

              </NavLink>


              {/* HISTORY */}

              <NavLink
                to="/history"
                className={navClass}
                onClick={handleNavigation}
              >

                <span className="sidebar-icon">
                  <FaHistory />
                </span>

                <span className="sidebar-label">
                  Listening History
                </span>

                <FaChevronRight className="sidebar-item-arrow" />

              </NavLink>


              {/* STATISTICS */}

              <NavLink
                to="/statistics"
                className={navClass}
                onClick={handleNavigation}
              >

                <span className="sidebar-icon">
                  <FaChartBar />
                </span>

                <span className="sidebar-label">
                  Statistics
                </span>

                <FaChevronRight className="sidebar-item-arrow" />

              </NavLink>


              {/* NOTIFICATIONS */}

              <NavLink
                to="/notifications"
                className={navClass}
                onClick={handleNavigation}
              >

                <span className="sidebar-icon">
                  <FaBell />
                </span>

                <span className="sidebar-label">
                  Notifications
                </span>

                <FaChevronRight className="sidebar-item-arrow" />

              </NavLink>


              {/* KEERTHANA AI */}

              <NavLink
                to="/keerthana-ai"
                className={navClass}
                onClick={handleNavigation}
              >

                <span className="sidebar-icon">
                  <FaRobot />
                </span>

                <span className="sidebar-label">
                  Keerthana AI
                </span>

                <FaChevronRight className="sidebar-item-arrow" />

              </NavLink>

            </nav>

          </section>

        </div>


        {/* =====================================================
            SIDEBAR BOTTOM
        ===================================================== */}

        <div className="sidebar-bottom">


          {/* =================================================
              PREMIUM
          ================================================= */}

          <NavLink
            to="/premium"
            className="sidebar-premium"
            onClick={handleNavigation}
          >

            <div className="premium-icon">
              <FaCrown />
            </div>

            <div className="premium-text">

              <strong>
                Premium
              </strong>

              <span>
                Enjoy more music
              </span>

            </div>

            <FaChevronRight className="premium-arrow" />

          </NavLink>


          {/* =================================================
              USER
          ================================================= */}

          {user ? (
            <>

              {/* PROFILE */}

              <button
                type="button"
                className="sidebar-user-card"
                onClick={handleProfile}
              >

                <div className="sidebar-user-avatar">

                  {user?.name
                    ? user.name
                        .charAt(0)
                        .toUpperCase()
                    : "U"}

                </div>

                <div className="sidebar-user-info">

                  <strong>
                    {user?.name || "User"}
                  </strong>

                  <span>
                    My Profile
                  </span>

                </div>

                <FaChevronRight className="sidebar-user-arrow" />

              </button>


              {/* LOGOUT */}

              <button
                type="button"
                className="sidebar-logout"
                onClick={handleLogout}
              >

                <FaSignOutAlt />

                <span>
                  Logout
                </span>

              </button>

            </>
          ) : (

            /* LOGIN */

            <NavLink
              to="/login"
              className="sidebar-login"
              onClick={handleNavigation}
            >

              <FaSignInAlt />

              <span>
                Login
              </span>

            </NavLink>

          )}


          {/* FOOTER */}

          <div className="sidebar-footer">

            <span>
              © {new Date().getFullYear()} KEERTHANA
            </span>

          </div>

        </div>

      </aside>
    </>
  );
}

export default Sidebar;