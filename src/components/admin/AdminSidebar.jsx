import {
  FaArrowLeft,
  FaCompactDisc,
  FaHome,
  FaMicrophone,
  FaMusic,
  FaSignOutAlt,
  FaTags,
  FaUser,
  FaUsers,
} from "react-icons/fa";

import {
  NavLink,
  useNavigate,
} from "react-router-dom";

import {
  useAuth,
} from "../../context/AuthContext";

import "../../assets/css/adminSidebar.css";


function AdminSidebar() {

  const {
    user,
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
          ADMIN USER
      ================================================= */}

      <div className="admin-sidebar-user">


        <div className="admin-sidebar-avatar">

          <FaUser />

        </div>


        <div>

          <strong>

            {user?.name ||
              "Administrator"}

          </strong>


          <span>

            {user?.email ||
              "KEERTHANA Admin"}

          </span>

        </div>


      </div>


      {/* =================================================
          NAVIGATION
      ================================================= */}

      <nav className="admin-sidebar-nav">


        <p className="admin-nav-title">

          OVERVIEW

        </p>


        <NavLink
          to="/admin"
          end
          className={
            navClass
          }
        >

          <FaHome />

          <span>
            Dashboard
          </span>

        </NavLink>


        <p className="admin-nav-title admin-nav-title-space">

          MANAGEMENT

        </p>


        {/* SONGS */}

        <NavLink
          to="/admin/songs"
          className={
            navClass
          }
        >

          <FaMusic />

          <span>
            Songs
          </span>

        </NavLink>


        {/* ARTISTS */}

        <NavLink
          to="/admin/artists"
          className={
            navClass
          }
        >

          <FaMicrophone />

          <span>
            Artists
          </span>

        </NavLink>


        {/* ALBUMS */}

        <NavLink
          to="/admin/albums"
          className={
            navClass
          }
        >

          <FaCompactDisc />

          <span>
            Albums
          </span>

        </NavLink>


        {/* CATEGORIES */}

        <NavLink
          to="/admin/categories"
          className={
            navClass
          }
        >

          <FaTags />

          <span>
            Categories
          </span>

        </NavLink>


        {/* USERS */}

        <NavLink
          to="/admin/users"
          className={
            navClass
          }
        >

          <FaUsers />

          <span>
            Users
          </span>

        </NavLink>


      </nav>


      {/* =================================================
          BOTTOM
      ================================================= */}

      <div className="admin-sidebar-bottom">


        {/* <NavLink
          to="/"
          className="admin-back-link"
        >

          <FaArrowLeft />

          <span>
            Back to KEERTHANA
          </span>

        </NavLink> */}


        <button
          type="button"

          className="admin-logout-button"

          onClick={
            handleLogout
          }
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