import React, { useEffect } from "react";

import {
  FaChevronLeft,
  FaChevronRight,
  FaSignOutAlt,
  FaBars,
} from "react-icons/fa";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

import "../../assets/css/admin/adminHeader.css";


function AdminHeader({ onToggleSidebar }) {

  const navigate = useNavigate();
  const location = useLocation();

  const { user, logout } = useAuth();


  /* =========================================================
     PAGE TITLE
  ========================================================= */

  const getPageTitle = () => {

    const path = location.pathname;


    if (
      path === "/admin" ||
      path === "/admin/"
    ) {
      return "Dashboard";
    }


    if (
      path.startsWith("/admin/dashboard")
    ) {
      return "Dashboard";
    }


    if (
      path === "/admin/songs/add"
    ) {
      return "Add Song";
    }


    if (
      path.startsWith("/admin/songs/")
    ) {
      return "Edit Song";
    }


    if (
      path.startsWith("/admin/songs")
    ) {
      return "Manage Songs";
    }


    if (
      path === "/admin/artists/add"
    ) {
      return "Add Artist";
    }


    if (
      path.startsWith("/admin/artists/")
    ) {
      return "Edit Artist";
    }


    if (
      path.startsWith("/admin/artists")
    ) {
      return "Manage Artists";
    }


    if (
      path === "/admin/albums/add"
    ) {
      return "Add Album";
    }


    if (
      path.startsWith("/admin/albums/")
    ) {
      return "Edit Album";
    }


    if (
      path.startsWith("/admin/albums")
    ) {
      return "Manage Albums";
    }


    if (
      path.startsWith("/admin/categories")
    ) {
      return "Manage Categories";
    }


    if (
      path.startsWith("/admin/users")
    ) {
      return "Manage Users";
    }


    if (
      path.startsWith("/admin/analytics")
    ) {
      return "Analytics";
    }


    if (
      path.startsWith("/admin/profile")
    ) {
      return "Admin Profile";
    }


    return "Admin Panel";
  };


  /* =========================================================
     LOGOUT
  ========================================================= */

const handleLogout = () => {
  logout();

  navigate("/admin/login", {
    replace: true,
  });
};


  /* =========================================================
     ADMIN HOME
  ========================================================= */

  const handleLogoClick = () => {

    navigate("/admin");

  };


  /* =========================================================
     ADMIN PROFILE
  ========================================================= */

  const handleProfile = () => {

    navigate("/admin/profile");

  };


  /* =========================================================
     KEYBOARD SHORTCUT
  ========================================================= */

  useEffect(() => {

    const handleKeyDown = (event) => {

      if (
        event.key === "/" &&
        event.target.tagName !== "INPUT" &&
        event.target.tagName !== "TEXTAREA"
      ) {

        event.preventDefault();

        const searchInput =
          document.querySelector(
            ".admin-header-search-input"
          );

        if (searchInput) {
          searchInput.focus();
        }

      }

    };


    window.addEventListener(
      "keydown",
      handleKeyDown
    );


    return () => {

      window.removeEventListener(
        "keydown",
        handleKeyDown
      );

    };

  }, []);


  /* =========================================================
     RENDER
  ========================================================= */

  return (

    <header className="admin-header">

      {/* =====================================================
          LEFT SECTION
      ===================================================== */}

      <div className="admin-header-left">


        {/* MOBILE MENU */}

        <button
          type="button"
          className="admin-header-menu-button"
          onClick={onToggleSidebar}
          aria-label="Open admin menu"
          title="Open menu"
        >
          <FaBars />
        </button>


        {/* BACK / FORWARD */}

        <div className="admin-header-history">

          <button
            type="button"
            className="admin-header-circle-button"
            onClick={() => navigate(-1)}
            aria-label="Go back"
            title="Go back"
          >
            <FaChevronLeft />
          </button>


          <button
            type="button"
            className="admin-header-circle-button"
            onClick={() => navigate(1)}
            aria-label="Go forward"
            title="Go forward"
          >
            <FaChevronRight />
          </button>

        </div>


        {/* ADMIN BRAND */}

        <button
          type="button"
          className="admin-header-brand"
          onClick={handleLogoClick}
          aria-label="Go to admin dashboard"
        >

          <div className="admin-header-logo">
            ♪
          </div>


          <div className="admin-header-brand-text">

            <strong>
              KEERTHANA
            </strong>

            <span>
              Admin Panel
            </span>

          </div>

        </button>


        {/* PAGE TITLE */}

        <div className="admin-header-page-info">

          <span>
            KEERTHANA ADMIN
          </span>

          <h2>
            {getPageTitle()}
          </h2>

        </div>

      </div>


      {/* =====================================================
          RIGHT SECTION
      ===================================================== */}

      <div className="admin-header-right">


        {/* ADMIN STATUS */}

        <div className="admin-header-status">

          <span className="admin-status-dot"></span>

          <span>
            Administrator
          </span>

        </div>


        {/* PROFILE */}

        <button
          type="button"
          className="admin-header-profile"
          onClick={handleProfile}
          title="Admin Profile"
        >

          <div className="admin-header-avatar">

            {user?.name
              ? user.name
                  .charAt(0)
                  .toUpperCase()
              : "A"}

          </div>


          <div className="admin-header-user-info">

            <strong>
              {user?.name || "Administrator"}
            </strong>

            <span>
              Admin
            </span>

          </div>

        </button>


        {/* LOGOUT */}

        <button
          type="button"
          className="admin-header-logout"
          onClick={handleLogout}
          aria-label="Logout"
          title="Logout"
        >
          <FaSignOutAlt />
        </button>

      </div>

    </header>

  );

}


export default AdminHeader;