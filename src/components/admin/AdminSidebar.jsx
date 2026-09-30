
import {
  FaCompactDisc,
  FaHome,
  FaMicrophone,
  FaMusic,
  FaFlag,
  FaSignOutAlt,
  FaTags,
  FaChurch,
} from "react-icons/fa";

import {
  NavLink,
  useNavigate,
} from "react-router-dom";

import {
  useAuth,
} from "../../context/AuthContext";

import "../../assets/css/admin/adminSidebar.css";


function AdminSidebar() {

  const {
    logout,
  } = useAuth();


  const navigate =
    useNavigate();


  /* =====================================================
     LOGOUT
  ===================================================== */

  const handleLogout = () => {

    logout();

    navigate(
      "/admin/login",
      {
        replace: true,
      }
    );

  };


  /* =====================================================
     NAV CLASS
  ===================================================== */

  const navClass = ({
    isActive,
  }) => {

    return isActive
      ? "admin-nav-item active"
      : "admin-nav-item";

  };


  return (

    <aside className="admin-sidebar">


      {/* =================================================
          BRAND
      ================================================= */}

      <div className="admin-sidebar-brand">

        <div className="admin-brand-icon">

          ♪

        </div>


        <div>

          <h1>
            KEERTHANA
          </h1>

          <span>
            ADMIN PANEL
          </span>

        </div>


      </div>


      {/* =================================================
          NAVIGATION
      ================================================= */}

      <nav className="admin-sidebar-nav">


        {/* =================================================
            OVERVIEW
        ================================================= */}

        <p className="admin-nav-title">

          OVERVIEW

        </p>


        {/* DASHBOARD */}

        <NavLink
          to="/admin"
          end
          className={navClass}
        >

          <FaHome />

          <span>
            Dashboard
          </span>

        </NavLink>


        {/* =================================================
            MANAGEMENT
        ================================================= */}

        <p className="admin-nav-title admin-nav-title-space">

          MANAGEMENT

        </p>


        {/* SONGS */}

        <NavLink
          to="/admin/songs"
          className={navClass}
        >

          <FaMusic />

          <span>
            Songs
          </span>

        </NavLink>


        {/* SONG REPORTS */}

        <NavLink
          to="/admin/songs/reports"
          className={navClass}
        >

          <FaFlag />

          <span>
            Song Reports
          </span>

        </NavLink>


        {/* ARTISTS */}

        <NavLink
          to="/admin/artists"
          className={navClass}
        >

          <FaMicrophone />

          <span>
            Artists
          </span>

        </NavLink>


        {/* ALBUMS */}

        <NavLink
          to="/admin/albums"
          className={navClass}
        >

          <FaCompactDisc />

          <span>
            Albums
          </span>

        </NavLink>


        {/* CATEGORIES */}

        <NavLink
          to="/admin/categories"
          className={navClass}
        >

          <FaTags />

          <span>
            Categories
          </span>

        </NavLink>


        {/* =================================================
            MINISTRIES
        ================================================= */}

        <NavLink
          to="/admin/ministries"
          className={navClass}
        >

          <FaChurch />

          <span>
            Ministries
          </span>

        </NavLink>


      </nav>


      {/* =================================================
          BOTTOM
      ================================================= */}

      <div className="admin-sidebar-bottom">


        {/* LOGOUT */}

        <button
          type="button"
          className="admin-logout-button"
          onClick={handleLogout}
        >

          <FaSignOutAlt />

          <span>
            Logout
          </span>

        </button>


      </div>


    </aside>

  );

}


export default AdminSidebar;

