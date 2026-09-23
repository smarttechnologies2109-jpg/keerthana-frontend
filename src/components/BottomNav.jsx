import {
  FaHome,
  FaSearch,
  FaBookOpen,
  FaUser,
} from "react-icons/fa";

import {
  NavLink,
} from "react-router-dom";

import "../assets/css/bottomNav.css";


function BottomNav() {


  /* =====================================================
     NAV CLASS
  ===================================================== */

  const navClass = ({
    isActive,
  }) => {

    return isActive
      ? "bottom-nav-item active"
      : "bottom-nav-item";

  };


  return (

    <nav className="bottom-nav">


      {/* =================================================
          HOME
      ================================================= */}

      <NavLink
        to="/"
        end
        className={navClass}
      >

        <div className="bottom-nav-icon">
          <FaHome />
        </div>

        <span>
          Home
        </span>

      </NavLink>


      {/* =================================================
          SEARCH
      ================================================= */}

      <NavLink
        to="/search"
        className={navClass}
      >

        <div className="bottom-nav-icon">
          <FaSearch />
        </div>

        <span>
          Search
        </span>

      </NavLink>


      {/* =================================================
          LIBRARY
      ================================================= */}

      <NavLink
        to="/library"
        className={navClass}
      >

        <div className="bottom-nav-icon">
          <FaBookOpen />
        </div>

        <span>
          Library
        </span>

      </NavLink>


      {/* =================================================
          PROFILE
      ================================================= */}

      <NavLink
        to="/profile"
        className={navClass}
      >

        <div className="bottom-nav-icon">
          <FaUser />
        </div>

        <span>
          Profile
        </span>

      </NavLink>


    </nav>

  );

}


export default BottomNav;