
import { useEffect, useRef, useState } from "react";

import {
  FaBars,
  FaBell,
  FaChevronDown,
  FaChevronLeft,
  FaChevronRight,
  FaMusic,
  FaSignInAlt,
  FaSignOutAlt,
  FaUserCircle,
} from "react-icons/fa";

import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { getMediaUrl } from "../utils/media";
import { useNotifications } from "../context/NotificationsContext";

import "../assets/css/header.css";

// =====================================================
// PAGE TITLES
// =====================================================

const PAGE_TITLES = [
  { paths: ["/", "/home"], title: "Home", exact: true },
  { paths: ["/search"], title: "Explore" },
  { paths: ["/library"], title: "Your Library" },
  { paths: ["/liked-songs"], title: "Liked Songs" },
  { paths: ["/favorites"], title: "Favorites" },
  { paths: ["/playlists"], title: "Playlists" },
  { paths: ["/history"], title: "Listening History" },

  { paths: ["/pricing"], title: "Pricing" },
  { paths: ["/about-us"], title: "About Us" },
  { paths: ["/contact-us"], title: "Contact Us" },
  {
    paths: ["/terms-and-conditions"],
    title: "Terms & Conditions",
  },
  { paths: ["/privacy-policy"], title: "Privacy Policy" },
  {
    paths: ["/refund-cancellation"],
    title: "Refund & Cancellation",
  },
  {
    paths: ["/copyright-policy"],
    title: "Copyright & Music Licensing",
  },
  { paths: ["/donations"], title: "Support Our Ministry" },
  { paths: ["/profile"], title: "Profile" },
  {
    paths: ["/offline-songs", "/downloads"],
    title: "Offline Songs",
  },
  { paths: ["/notifications"], title: "Notifications" },
  { paths: ["/song", "/songs"], title: "Songs" },
  { paths: ["/artist", "/artists"], title: "Artists" },
  { paths: ["/album", "/albums"], title: "Albums" },
  { paths: ["/ministries"], title: "Ministries" },
  { paths: ["/mood-playlists"], title: "Mood Playlists" },
  { paths: ["/statistics"], title: "Statistics" },
  { paths: ["/keerthana-ai"], title: "Keerthana AI" },
];

// =====================================================
// GET CURRENT PAGE TITLE
// =====================================================

function getPageTitle(pathname) {
  const page = PAGE_TITLES.find(({ paths, exact }) =>
    paths.some((path) =>
      exact
        ? pathname === path
        : pathname === path || pathname.startsWith(`${path}/`)
    )
  );

  return page?.title || "KEERTHANA";
}

// =====================================================
// HEADER COMPONENT
// =====================================================

function Header({ onToggleSidebar }) {
  const navigate = useNavigate();
  const location = useLocation();

  const profileMenuRef = useRef(null);

  const { user, logout } = useAuth();
  const { unreadCount = 0 } = useNotifications();

  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const pageTitle = getPageTitle(location.pathname);

  const displayName =
    user?.name?.trim() ||
    user?.email?.trim() ||
    "My Account";

  const avatarLetter = displayName.charAt(0).toUpperCase();

  const profileImage = user?.profile_image || "";
  const profileImageUrl = profileImage
    ? getMediaUrl(profileImage)
    : "";

  // ===================================================
  // CLOSE PROFILE MENU ON OUTSIDE CLICK OR ESCAPE
  // ===================================================

  useEffect(() => {
    if (!profileMenuOpen) return undefined;

    const handlePointerDown = (event) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target)
      ) {
        setProfileMenuOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setProfileMenuOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [profileMenuOpen]);

  // ===================================================
  // CLOSE DROPDOWN WHEN NAVIGATING
  // ===================================================

  useEffect(() => {
    setProfileMenuOpen(false);
  }, [location.pathname]);

  // ===================================================
  // LOGOUT
  // ===================================================

  const handleLogout = () => {
    setProfileMenuOpen(false);
    logout();
    navigate("/login", { replace: true });
  };

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <header className="keerthana-header">

      {/* LEFT SECTION */}

      <div className="keerthana-header-left">

        <button
          type="button"
          className="header-menu-button"
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
          title="Menu"
        >
          <FaBars />
        </button>

        {/* BACK AND FORWARD */}

        <div className="header-history-buttons">

          <button
            type="button"
            className="header-circle-button"
            onClick={() => navigate(-1)}
            aria-label="Go back"
            title="Go back"
          >
            <FaChevronLeft />
          </button>

          <button
            type="button"
            className="header-circle-button"
            onClick={() => navigate(1)}
            aria-label="Go forward"
            title="Go forward"
          >
            <FaChevronRight />
          </button>

        </div>

        {/* BRAND */}

        <Link
          to="/home"
          className="header-brand"
          aria-label="KEERTHANA home"
        >
          <span className="header-brand-mark">
            <FaMusic />
          </span>

          <span className="header-brand-copy">
            <strong>KEERTHANA</strong>
            <small>CHRISTIAN MUSIC</small>
          </span>
        </Link>

        {/* PAGE TITLE */}

        <div className="header-page-info" aria-live="polite">
          <span>NOW EXPLORING</span>
          <h2>{pageTitle}</h2>
        </div>

      </div>

      {/* RIGHT SECTION */}

      <div className="keerthana-header-right">

        {/* NOTIFICATIONS */}

        <Link
          to="/notifications"
          className="header-notification-button"
          title="Notifications"
          aria-label={`Notifications${
            unreadCount > 0
              ? `, ${unreadCount} unread`
              : ""
          }`}
        >
          <FaBell />

          {unreadCount > 0 && (
            <span className="header-notification-badge">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Link>

        {/* PROFILE */}

        {user ? (
          <div
            className="header-profile"
            ref={profileMenuRef}
          >

            <button
              type="button"
              className={`header-profile-trigger ${
                profileMenuOpen
                  ? "header-profile-trigger-open"
                  : ""
              }`}
              onClick={() =>
                setProfileMenuOpen((open) => !open)
              }
              aria-expanded={profileMenuOpen}
              aria-haspopup="menu"
              aria-label={`Open account menu for ${displayName}`}
            >
              <span className="header-profile-avatar">
                {profileImageUrl ? (
                  <img
                    src={profileImageUrl}
                    alt={displayName}
                    style={{
                      width: "100%",
                      height: "100%",
                      display: "block",
                      objectFit: "cover",
                      borderRadius: "50%",
                    }}
                    onError={(event) => {
                      event.currentTarget.parentElement.textContent = avatarLetter;
                    }}
                  />
                ) : (
                  avatarLetter
                )}
              </span>

              <span className="header-profile-name">
                {displayName}
              </span>

              <FaChevronDown className="header-profile-chevron" />
            </button>

            {/* CLEAN PROFILE DROPDOWN */}

            {profileMenuOpen && (
              <div
                className="header-profile-dropdown"
                role="menu"
                aria-label="Account menu"
              >

                {/* ACCOUNT DETAILS */}

                <div className="header-profile-dropdown-heading">

                  <span className="header-profile-avatar header-profile-avatar-large">
                    {profileImageUrl ? (
                      <img
                        src={profileImageUrl}
                        alt={displayName}
                        style={{
                          width: "100%",
                          height: "100%",
                          display: "block",
                          objectFit: "cover",
                          borderRadius: "50%",
                        }}
                        onError={(event) => {
                          event.currentTarget.parentElement.textContent = avatarLetter;
                        }}
                      />
                    ) : (
                      avatarLetter
                    )}
                  </span>

                  <span className="header-profile-heading-copy">
                    <strong>{displayName}</strong>
                    <small>KEERTHANA account</small>
                  </span>

                </div>

                <div className="header-profile-divider" />

                {/* VIEW PROFILE */}

                <Link
                  to="/profile"
                  className="header-profile-menu-item"
                  role="menuitem"
                  onClick={() => setProfileMenuOpen(false)}
                >
                  <FaUserCircle />
                  <span>View Profile</span>
                  <FaChevronRight className="header-profile-item-arrow" />
                </Link>

                <div className="header-profile-divider" />

                {/* LOGOUT */}

                <button
                  type="button"
                  className="header-profile-menu-item header-profile-logout"
                  role="menuitem"
                  onClick={handleLogout}
                >
                  <FaSignOutAlt />
                  <span>Logout</span>
                </button>

              </div>
            )}

          </div>
        ) : (
          <button
            type="button"
            className="header-login-button"
            onClick={() => navigate("/login")}
          >
            <FaSignInAlt />
            <span>Login</span>
          </button>
        )}

      </div>
    </header>
  );
}

export default Header;
