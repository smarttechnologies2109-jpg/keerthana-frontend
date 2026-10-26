
import React, { useCallback } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  FaBell,
  FaBookOpen,
  FaChartBar,
  FaChevronRight,
  FaChurch,
  FaCompactDisc,
  FaDownload,
  FaHeart,
  FaHistory,
  FaHome,
  FaListUl,
  FaMusic,
  FaRobot,
  FaSearch,
  FaTimes,
  FaMicrophone,
  FaBookmark,
} from "react-icons/fa";

import "../assets/css/sidebar.css";

/* =========================================================
   KEERTHANA MUSIC — EXPLORE NAVIGATION
========================================================= */

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

/* =========================================================
   KEERTHANA MUSIC — YOUR MUSIC NAVIGATION
========================================================= */

const MUSIC_LINKS = [
  {
    to: "/liked-songs",
    label: "Liked Songs",
    Icon: FaHeart,
    iconClass: "sidebar-heart-icon",
  },
  {
    to: "/favorites",
    label: "Favorites",
    Icon: FaBookmark,
    iconClass: "sidebar-favorite-icon",
  },
  {
    to: "/downloads",
    label: "Downloads",
    Icon: FaDownload,
  },
  {
    to: "/playlists",
    label: "Playlists",
    Icon: FaListUl,
  },
  {
    to: "/history",
    label: "Listening History",
    Icon: FaHistory,
  },
  {
    to: "/statistics",
    label: "Statistics",
    Icon: FaChartBar,
  },
  {
    to: "/notifications",
    label: "Notifications",
    Icon: FaBell,
  },
  {
    to: "/keerthana-ai",
    label: "Keerthana AI",
    Icon: FaRobot,
  },
];

/* =========================================================
   SIDEBAR NAVIGATION LINK
========================================================= */

function SidebarLink({
  to,
  label,
  Icon,
  iconClass = "",
  end = false,
  onNavigate,
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `sidebar-nav-item${isActive ? " active" : ""}`
      }
      onClick={onNavigate}
    >
      <span className={`sidebar-icon ${iconClass}`.trim()}>
        <Icon aria-hidden="true" />
      </span>

      <span className="sidebar-label">{label}</span>

      <FaChevronRight
        className="sidebar-item-arrow"
        aria-hidden="true"
      />
    </NavLink>
  );
}

/* =========================================================
   SIDEBAR SECTION
========================================================= */

function SidebarSection({ title, links, onNavigate }) {
  return (
    <section className="sidebar-section" aria-label={title}>
      <div className="sidebar-section-heading">
        <span>{title}</span>
      </div>

      <nav className="sidebar-nav" aria-label={title}>
        {links.map((link) => (
          <SidebarLink
            key={link.to}
            {...link}
            onNavigate={onNavigate}
          />
        ))}
      </nav>
    </section>
  );
}

/* =========================================================
   KEERTHANA MUSIC — MAIN SIDEBAR
   Profile, Premium and Logout are handled in Header.jsx
========================================================= */

function Sidebar({ isOpen, onToggle }) {
  const navigate = useNavigate();

  /* Close the sidebar after navigation on mobile */
  const handleNavigation = useCallback(() => {
    if (window.innerWidth <= 700) {
      onToggle?.();
    }
  }, [onToggle]);

  return (
    <>
      {/* Mobile backdrop */}
      <button
        type="button"
        className={`sidebar-overlay${
          isOpen ? " sidebar-overlay-visible" : ""
        }`}
        onClick={onToggle}
        aria-label="Close navigation menu"
        aria-hidden={!isOpen}
        tabIndex={isOpen ? 0 : -1}
      />

      {/* Main sidebar */}
      <aside
        className={`sidebar ${
          isOpen ? "sidebar-open" : "sidebar-closed"
        }`}
        aria-label="Main sidebar"
      >
        {/* Mobile close button */}
        <button
          type="button"
          className="sidebar-mobile-close"
          onClick={onToggle}
          aria-label="Close menu"
        >
          <FaTimes aria-hidden="true" />
        </button>

        {/* Brand */}
        <button
          type="button"
          className="sidebar-brand"
          onClick={() => {
            navigate("/home");
            handleNavigation();
          }}
          aria-label="Go to KEERTHANA home"
        >
          <span className="sidebar-brand-logo" aria-hidden="true">
            <FaMusic />
          </span>

          <span className="sidebar-brand-text">
            <strong>KEERTHANA</strong>
            <small>Christian Music</small>
          </span>
        </button>

        {/* Navigation */}
        <div className="sidebar-content">
          <SidebarSection
            title="EXPLORE"
            links={EXPLORE_LINKS}
            onNavigate={handleNavigation}
          />

          <SidebarSection
            title="YOUR MUSIC"
            links={MUSIC_LINKS}
            onNavigate={handleNavigation}
          />
        </div>

        {/* Footer only — account actions are in the header */}
        <div className="sidebar-bottom">
          <footer className="sidebar-footer">
            <span>
              © {new Date().getFullYear()} KEERTHANA
            </span>
          </footer>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
