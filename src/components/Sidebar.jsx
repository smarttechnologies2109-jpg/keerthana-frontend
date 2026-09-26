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
} from "react-icons/fa";

import { useAuth } from "../context/AuthContext";

import "../assets/css/sidebar.css";


function Sidebar({
  isOpen,
  onToggle,
}) {

  const navigate =
    useNavigate();

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

    navigate(
      "/login",
      {
        replace: true,
      }
    );

  };


  /* =========================================================
     MOBILE NAVIGATION
  ========================================================= */

  const handleNavigation = () => {

    if (
      window.innerWidth <= 700
    ) {

      onToggle?.();

    }

  };


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
            MOBILE CLOSE BUTTON
        =================================================== */}

        <button
          type="button"
          className="sidebar-mobile-close"
          onClick={onToggle}
          aria-label="Close menu"
        >

          <FaTimes />

        </button>


        {/* ===================================================
            BRAND
        =================================================== */}

        <div className="sidebar-brand">

          <div className="sidebar-brand-logo">
            ♪
          </div>


          <div className="sidebar-brand-text">

            <h1>
              KEERTHANA
            </h1>

            <span>
              Christian Music
            </span>

          </div>

        </div>


        {/* ===================================================
            SIDEBAR CONTENT
        =================================================== */}

        <div className="sidebar-content">


          {/* =================================================
              EXPLORE
          ================================================= */}

          <div className="sidebar-section">

            <div className="sidebar-section-title">
              EXPLORE
            </div>


            <nav className="sidebar-nav">


              {/* =================================================
                  HOME
              ================================================= */}

              <NavLink
                to="/"
                className={navClass}
                onClick={
                  handleNavigation
                }
              >

                <span className="sidebar-icon">
                  <FaHome />
                </span>

                <span className="sidebar-label">
                  Home
                </span>

              </NavLink>


              {/* =================================================
                  SEARCH
              ================================================= */}

              <NavLink
                to="/search"
                className={navClass}
                onClick={
                  handleNavigation
                }
              >

                <span className="sidebar-icon">
                  <FaSearch />
                </span>

                <span className="sidebar-label">
                  Search
                </span>

              </NavLink>


              {/* =================================================
                  YOUR LIBRARY
              ================================================= */}

              <NavLink
                to="/library"
                className={navClass}
                onClick={
                  handleNavigation
                }
              >

                <span className="sidebar-icon">
                  <FaBookOpen />
                </span>

                <span className="sidebar-label">
                  Your Library
                </span>

              </NavLink>


              {/* =================================================
                  ARTISTS
              ================================================= */}

              <NavLink
                to="/artists"
                className={navClass}
                onClick={
                  handleNavigation
                }
              >

                <span className="sidebar-icon">
                  <FaMicrophone />
                </span>

                <span className="sidebar-label">
                  Artists
                </span>

              </NavLink>


              {/* =================================================
                  ALBUMS
              ================================================= */}

              <NavLink
                to="/albums"
                className={navClass}
                onClick={
                  handleNavigation
                }
              >

                <span className="sidebar-icon">
                  <FaCompactDisc />
                </span>

                <span className="sidebar-label">
                  Albums
                </span>

              </NavLink>


              {/* =================================================
                  MINISTRIES
              ================================================= */}

              <NavLink
                to="/ministries"
                className={navClass}
                onClick={
                  handleNavigation
                }
              >

                <span className="sidebar-icon">
                  <FaChurch />
                </span>

                <span className="sidebar-label">
                  Ministries
                </span>

              </NavLink>


              {/* =================================================
                  MOOD PLAYLISTS
              ================================================= */}

              <NavLink
                to="/mood-playlists"
                className={navClass}
                onClick={
                  handleNavigation
                }
              >

                <span className="sidebar-icon">
                  <FaMusic />
                </span>

                <span className="sidebar-label">
                  Mood Playlists
                </span>

              </NavLink>


            </nav>

          </div>


          {/* =================================================
              YOUR MUSIC
          ================================================= */}

          <div className="sidebar-section">

            <div className="sidebar-section-title">
              YOUR MUSIC
            </div>


            <nav className="sidebar-nav">


              {/* =================================================
                  LIKED SONGS
              ================================================= */}

              <NavLink
                to="/liked-songs"
                className={navClass}
                onClick={
                  handleNavigation
                }
              >

                <span className="sidebar-icon">
                  <FaHeart />
                </span>

                <span className="sidebar-label">
                  Liked Songs
                </span>

              </NavLink>


              {/* =================================================
                  PLAYLISTS
              ================================================= */}

              <NavLink
                to="/playlists"
                className={navClass}
                onClick={
                  handleNavigation
                }
              >

                <span className="sidebar-icon">
                  <FaListUl />
                </span>

                <span className="sidebar-label">
                  Playlists
                </span>

              </NavLink>


              {/* =================================================
                  LISTENING HISTORY
              ================================================= */}

              <NavLink
                to="/history"
                className={navClass}
                onClick={
                  handleNavigation
                }
              >

                <span className="sidebar-icon">
                  <FaHistory />
                </span>

                <span className="sidebar-label">
                  Listening History
                </span>

              </NavLink>


              {/* =================================================
                  LISTENING STATISTICS
              ================================================= */}

              <NavLink
                to="/statistics"
                className={navClass}
                onClick={
                  handleNavigation
                }
              >

                <span className="sidebar-icon">
                  <FaChartBar />
                </span>

                <span className="sidebar-label">
                  Statistics
                </span>

              </NavLink>


              {/* =================================================
                  KEERTHANA AI
              ================================================= */}

              <NavLink
                to="/keerthana-ai"
                className={navClass}
                onClick={
                  handleNavigation
                }
              >

                <span className="sidebar-icon">
                  <FaRobot />
                </span>

                <span className="sidebar-label">
                  Keerthana AI
                </span>

              </NavLink>


            </nav>

          </div>


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
            onClick={
              handleNavigation
            }
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

          </NavLink>


          {/* =================================================
              USER
          ================================================= */}

          {user ? (

            <>


              {/* =================================================
                  PROFILE
              ================================================= */}

              <button
                type="button"
                className="sidebar-user-card"
                onClick={() => {

                  navigate(
                    "/profile"
                  );

                  handleNavigation();

                }}
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
                    {user?.name ||
                      "User"}
                  </strong>

                  <span>
                    My Profile
                  </span>

                </div>

              </button>


              {/* =================================================
                  LOGOUT
              ================================================= */}

              <button
                type="button"
                className="sidebar-logout"
                onClick={
                  handleLogout
                }
              >

                <FaSignOutAlt />

                <span>
                  Logout
                </span>

              </button>


            </>

          ) : (

            /* =================================================
                LOGIN
            ================================================= */

            <NavLink
              to="/login"
              className="sidebar-login"
              onClick={
                handleNavigation
              }
            >

              <FaSignInAlt />

              <span>
                Login
              </span>

            </NavLink>

          )}


          {/* =================================================
              FOOTER
          ================================================= */}

          <div className="sidebar-footer">

            <span>
              ©{" "}
              {new Date().getFullYear()}{" "}
              KEERTHANA
            </span>

          </div>


        </div>


      </aside>

    </>
  );

}


export default Sidebar;