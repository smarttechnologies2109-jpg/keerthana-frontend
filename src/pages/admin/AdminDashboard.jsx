
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  FaMusic,
  FaMicrophone,
  FaCompactDisc,
  FaTags,
  FaArrowRight,
  FaPrayingHands,
  FaFlag,
} from "react-icons/fa";

import API from "../../services/api";
import "../../assets/css/admin/adminDashboard.css";

const DEFAULT_STATS = {
  songs: 0,
  artists: 0,
  albums: 0,
  categories: 0,
  ministries: 0,
  songReports: 0,
  users: 0,
};

function AdminDashboard() {
  const navigate = useNavigate();

  const [stats, setStats] = useState(DEFAULT_STATS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* =========================================
     LOAD DASHBOARD STATISTICS
  ========================================= */

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await API.get("/admin/dashboard");

      if (!response.data?.success || !response.data?.stats) {
        throw new Error("Invalid dashboard response from server");
      }

      const serverStats = response.data.stats;

      setStats({
        ...DEFAULT_STATS,
        ...serverStats,
        songs: Number(serverStats.songs || 0),
        artists: Number(serverStats.artists || 0),
        albums: Number(serverStats.albums || 0),
        categories: Number(serverStats.categories || 0),
        ministries: Number(serverStats.ministries || 0),
        songReports: Number(serverStats.songReports || 0),
        users: Number(serverStats.users || 0),
      });
    } catch (err) {
      console.error("Admin dashboard error:", err);

      setError(
        err.response?.data?.message ||
        err.message ||
        "Unable to load admin dashboard"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  /* =========================================
     LOADING
  ========================================= */

  if (loading) {
    return (
      <div className="admin-dashboard-page">
        <div className="dashboard-loading">
          <div className="dashboard-loader" />
          <span>Loading Dashboard...</span>
        </div>
      </div>
    );
  }

  /* =========================================
     DASHBOARD UI
  ========================================= */

  return (
    <div className="admin-dashboard-page">

      {/* ERROR */}

      {error && (
        <div className="dashboard-error">
          {error}
          <button
            type="button"
            onClick={loadDashboard}
            style={{ marginLeft: "12px" }}
          >
            Retry
          </button>
        </div>
      )}

      {/* OVERVIEW */}

      <div className="dashboard-section-header">
        <div>
          <span className="dashboard-section-label">
            OVERVIEW
          </span>

          <h2>Platform Statistics</h2>
        </div>

        <p>Current content and user totals</p>
      </div>

      {/* STATISTICS */}

      <section className="dashboard-stats">

        <StatCard
          icon={<FaMusic />}
          title="Songs"
          value={stats.songs}
          type="songs"
        />

        <StatCard
          icon={<FaMicrophone />}
          title="Artists"
          value={stats.artists}
          type="artists"
        />

        <StatCard
          icon={<FaCompactDisc />}
          title="Albums"
          value={stats.albums}
          type="albums"
        />

        <StatCard
          icon={<FaTags />}
          title="Categories"
          value={stats.categories}
          type="categories"
        />

        {/* MINISTRIES STATISTICS */}

        <StatCard
          icon={<FaPrayingHands />}
          title="Ministries"
          value={stats.ministries}
          type="ministries"
        />

        {/* SONG REPORTS STATISTICS */}

        <StatCard
          icon={<FaFlag />}
          title="Song Reports"
          value={stats.songReports}
          type="reports"
        />

      </section>

      {/* MANAGEMENT */}

      <section className="dashboard-management">

        <div className="dashboard-section-header">
          <div>
            <span className="dashboard-section-label">
              MANAGEMENT
            </span>

            <h2>Manage KEERTHANA</h2>
          </div>

          <p>Control your complete music platform</p>
        </div>

        <div className="dashboard-management-grid">

          {/* SONGS */}

          <ManagementCard
            icon={<FaMusic />}
            title="Songs"
            description="Upload, edit and manage your Christian music library."
            count={`${stats.songs} Songs`}
            buttonText="Manage Songs"
            type="songs"
            onClick={() => navigate("/admin/songs")}
          />

          {/* ARTISTS */}

          <ManagementCard
            icon={<FaMicrophone />}
            title="Artists"
            description="Create artist profiles and manage artist information."
            count={`${stats.artists} Artists`}
            buttonText="Manage Artists"
            type="artists"
            onClick={() => navigate("/admin/artists")}
          />

          {/* ALBUMS */}

          <ManagementCard
            icon={<FaCompactDisc />}
            title="Albums"
            description="Organize songs into albums and manage releases."
            count={`${stats.albums} Albums`}
            buttonText="Manage Albums"
            type="albums"
            onClick={() => navigate("/admin/albums")}
          />

          {/* CATEGORIES */}

          <ManagementCard
            icon={<FaTags />}
            title="Categories"
            description="Organize worship songs into meaningful categories."
            count={`${stats.categories} Categories`}
            buttonText="Manage Categories"
            type="categories"
            onClick={() => navigate("/admin/categories")}
          />

          {/* MINISTRIES */}

          <ManagementCard
            icon={<FaPrayingHands />}
            title="Ministries"
            description="Create, edit and manage Telugu Christian ministries and their information."
            count={`${stats.ministries} Ministries`}
            buttonText="Manage Ministries"
            type="ministries"
            onClick={() => navigate("/admin/ministries")}
          />

          {/* SONG REPORTS */}

          <ManagementCard
            icon={<FaFlag />}
            title="Song Reports"
            description="Review reported songs, investigate issues and manage report status."
            count={`${stats.songReports} Reports`}
            buttonText="Manage Song Reports"
            type="reports"
            onClick={() => navigate("/admin/songs/reports")}
          />

        </div>
      </section>
    </div>
  );
}

/* =========================================
   STAT CARD
========================================= */

function StatCard({ icon, title, value, type }) {
  return (
    <div className={`dashboard-stat-card ${type}`}>

      <div className="dashboard-stat-top">

        <div className="dashboard-stat-icon">
          {icon}
        </div>

        <span className="dashboard-stat-label">
          {title}
        </span>

      </div>

      <div className="dashboard-stat-value">
        {Number(value || 0).toLocaleString()}
      </div>

      <div className="dashboard-stat-bottom">
        <span>Total {title}</span>
        <span className="dashboard-stat-dot" />
      </div>

    </div>
  );
}

/* =========================================
   MANAGEMENT CARD
========================================= */

function ManagementCard({
  icon,
  title,
  description,
  count,
  buttonText,
  onClick,
  type,
}) {
  return (
    <article className={`dashboard-management-card ${type}`}>

      <div className="dashboard-management-top">

        <div className="dashboard-management-icon">
          {icon}
        </div>

        <span className="dashboard-count">
          {count}
        </span>

      </div>

      <div className="dashboard-management-content">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>

      <button type="button" onClick={onClick}>
        <span>{buttonText}</span>

        <span className="management-arrow">
          <FaArrowRight />
        </span>
      </button>

    </article>
  );
}

export default AdminDashboard;
