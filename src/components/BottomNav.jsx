
import {
  FaHome,
  FaSearch,
  FaBookOpen,
  FaUser,
  FaGift,
} from "react-icons/fa";

import { NavLink } from "react-router-dom";

import "../assets/css/bottomNav.css";

function BottomNav() {
  const navClass = ({ isActive }) =>
    isActive
      ? "bottom-nav-item active"
      : "bottom-nav-item";

  return (
    <nav className="bottom-nav">

      <NavLink to="/home" className={navClass}>
        <div className="bottom-nav-icon">
          <FaHome />
        </div>
        <span>Home</span>
      </NavLink>

      <NavLink to="/search" className={navClass}>
        <div className="bottom-nav-icon">
          <FaSearch />
        </div>
        <span>Search</span>
      </NavLink>

      <NavLink to="/library" className={navClass}>
        <div className="bottom-nav-icon">
          <FaBookOpen />
        </div>
        <span>Library</span>
      </NavLink>

      <NavLink to="/ad-free-reward" className={navClass}>
        <div className="bottom-nav-icon">
          <FaGift />
        </div>
        <span>Ad-Free</span>
      </NavLink>

      <NavLink to="/profile" className={navClass}>
        <div className="bottom-nav-icon">
          <FaUser />
        </div>
        <span>Profile</span>
      </NavLink>

    </nav>
  );
}

export default BottomNav;
