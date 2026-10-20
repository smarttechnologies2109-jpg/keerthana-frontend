import React, { useCallback } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  FaBell, FaBookOpen, FaChartBar, FaChevronRight, FaChurch,
  FaCompactDisc, FaCrown, FaDownload, FaHeart, FaHistory, FaHome,
  FaListUl, FaMusic, FaRobot, FaSearch, FaSignInAlt, FaSignOutAlt,
  FaTimes, FaMicrophone, FaBookmark,
} from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import "../assets/css/sidebar.css";

const EXPLORE_LINKS = [
  { to: "/", label: "Home", Icon: FaHome, end: true },
  { to: "/songs", label: "All Songs", Icon: FaMusic },
  { to: "/search", label: "Search", Icon: FaSearch },
  { to: "/library", label: "Your Library", Icon: FaBookOpen },
  { to: "/artists", label: "Artists", Icon: FaMicrophone },
  { to: "/albums", label: "Albums", Icon: FaCompactDisc },
  { to: "/ministries", label: "Ministries", Icon: FaChurch },
  { to: "/mood-playlists", label: "Mood Playlists", Icon: FaMusic },
];

const MUSIC_LINKS = [
  { to: "/liked-songs", label: "Liked Songs", Icon: FaHeart, iconClass: "sidebar-heart-icon" },
  { to: "/favorites", label: "Favorites", Icon: FaBookmark, iconClass: "sidebar-favorite-icon" },
  { to: "/downloads", label: "Downloads", Icon: FaDownload },
  { to: "/playlists", label: "Playlists", Icon: FaListUl },
  { to: "/history", label: "Listening History", Icon: FaHistory },
  { to: "/statistics", label: "Statistics", Icon: FaChartBar },
  { to: "/notifications", label: "Notifications", Icon: FaBell },
  { to: "/keerthana-ai", label: "Keerthana AI", Icon: FaRobot },
];

function SidebarLink({ to, label, Icon, iconClass = "", end = false, onNavigate }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) => `sidebar-nav-item${isActive ? " active" : ""}`}
      onClick={onNavigate}
    >
      <span className={`sidebar-icon ${iconClass}`.trim()}><Icon aria-hidden="true" /></span>
      <span className="sidebar-label">{label}</span>
      <FaChevronRight className="sidebar-item-arrow" aria-hidden="true" />
    </NavLink>
  );
}

function SidebarSection({ title, links, onNavigate }) {
  return (
    <section className="sidebar-section" aria-label={title}>
      <div className="sidebar-section-heading"><span>{title}</span></div>
      <nav className="sidebar-nav" aria-label={title}>
        {links.map((link) => <SidebarLink key={link.to} {...link} onNavigate={onNavigate} />)}
      </nav>
    </section>
  );
}

function Sidebar({ isOpen, onToggle }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleNavigation = useCallback(() => {
    if (window.innerWidth <= 700) onToggle?.();
  }, [onToggle]);

  const handleLogout = () => {
    logout();
    onToggle?.();
    navigate("/login", { replace: true });
  };

  return (
    <>
      <button
        type="button"
        className={`sidebar-overlay${isOpen ? " sidebar-overlay-visible" : ""}`}
        onClick={onToggle}
        aria-label="Close navigation menu"
        aria-hidden={!isOpen}
        tabIndex={isOpen ? 0 : -1}
      />
      <aside className={`sidebar ${isOpen ? "sidebar-open" : "sidebar-closed"}`} aria-label="Main sidebar">
        <button type="button" className="sidebar-mobile-close" onClick={onToggle} aria-label="Close menu">
          <FaTimes aria-hidden="true" />
        </button>

        <button
          type="button"
          className="sidebar-brand"
          onClick={() => { navigate("/home"); handleNavigation(); }}
          aria-label="Go to KEERTHANA home"
        >
          <span className="sidebar-brand-logo" aria-hidden="true"><FaMusic /></span>
          <span className="sidebar-brand-text">
            <strong>KEERTHANA</strong>
            <small>Christian Music</small>
          </span>
        </button>

        <div className="sidebar-content">
          <SidebarSection title="EXPLORE" links={EXPLORE_LINKS} onNavigate={handleNavigation} />
          <SidebarSection title="YOUR MUSIC" links={MUSIC_LINKS} onNavigate={handleNavigation} />
        </div>

        <div className="sidebar-bottom">
          <NavLink to="/premium" className={({ isActive }) => `sidebar-premium${isActive ? " active" : ""}`} onClick={handleNavigation}>
            <span className="premium-icon" aria-hidden="true"><FaCrown /></span>
            <span className="premium-text"><strong>Premium</strong><small>Enjoy more music</small></span>
            <FaChevronRight className="premium-arrow" aria-hidden="true" />
          </NavLink>

          {user ? (
            <>
              <button type="button" className="sidebar-user-card" onClick={() => { navigate("/profile"); handleNavigation(); }} aria-label="Open my profile">
                <span className="sidebar-user-avatar" aria-hidden="true">{(user?.name?.trim()?.charAt(0) || "U").toUpperCase()}</span>
                <span className="sidebar-user-info"><strong>{user?.name || "User"}</strong><small>My Profile</small></span>
                <FaChevronRight className="sidebar-user-arrow" aria-hidden="true" />
              </button>
              <button type="button" className="sidebar-logout" onClick={handleLogout}>
                <FaSignOutAlt aria-hidden="true" /><span>Logout</span>
              </button>
            </>
          ) : (
            <NavLink to="/login" className="sidebar-login" onClick={handleNavigation}>
              <FaSignInAlt aria-hidden="true" /><span>Login</span>
            </NavLink>
          )}

          <footer className="sidebar-footer"><span>© {new Date().getFullYear()} KEERTHANA</span></footer>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
