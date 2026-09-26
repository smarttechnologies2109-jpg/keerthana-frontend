import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  FaArrowLeft,
  FaChartBar,
  FaUsers,
  FaMusic,
  FaPlay,
  FaHeart,
} from "react-icons/fa";

import API from "../../services/api";
import "../../assets/css/businessOwner/BusinessOwnerStatistics.css";

const BusinessOwnerStatistics = () => {
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    totalUsers: 0,
    totalMusic: 0,
    totalPlays: 0,
    totalLikes: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await API.get("/owner/statistics");

      /*
        Backend structure:
        statistics.users.total
        statistics.music.totalSongs
        statistics.listening.totalPlays
        statistics.likes.totalLikes
      */

      const statistics = response.data?.statistics || {};

      setStats({
        totalUsers: statistics.users?.total || 0,
        totalMusic: statistics.music?.totalSongs || 0,
        totalPlays: statistics.listening?.totalPlays || 0,
        totalLikes: statistics.likes?.totalLikes || 0,
      });
    } catch (error) {
      console.error("Statistics error:", error);

      setError(
        error.response?.data?.message ||
          "Unable to load statistics."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="owner-statistics-page">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="owner-statistics-header">

        <div className="statistics-header-left">

          <div className="statistics-title-icon">
            <FaChartBar />
          </div>

          <div>
            <h1>Statistics</h1>

            <p>
              Business platform statistics
            </p>
          </div>

        </div>

        <button
          type="button"
          className="statistics-dashboard-btn"
          onClick={() =>
            navigate("/owner/dashboard")
          }
        >
          <FaArrowLeft />
          <span>Dashboard</span>
        </button>

      </header>

      {/* =====================================================
          MAIN
      ===================================================== */}

      <main className="owner-statistics-main">

        {/* ERROR */}

        {error && (
          <div className="statistics-error">
            <span>!</span>
            <p>{error}</p>
          </div>
        )}

        {/* ===================================================
            LOADING
        =================================================== */}

        {loading ? (

          <div className="statistics-loading">

            <div className="statistics-spinner"></div>

            <p>
              Loading statistics...
            </p>

          </div>

        ) : (

          <>

            {/* =================================================
                STAT CARDS
            ================================================= */}

            <section className="statistics-grid">

              {/* USERS */}

              <StatCard
                icon={<FaUsers />}
                title="Total Users"
                value={stats.totalUsers}
                type="users"
              />

              {/* MUSIC */}

              <StatCard
                icon={<FaMusic />}
                title="Total Music"
                value={stats.totalMusic}
                type="music"
              />

              {/* PLAYS */}

              <StatCard
                icon={<FaPlay />}
                title="Total Plays"
                value={stats.totalPlays}
                type="plays"
              />

              {/* LIKES */}

              <StatCard
                icon={<FaHeart />}
                title="Total Likes"
                value={stats.totalLikes}
                type="likes"
              />

            </section>

            {/* =================================================
                SUMMARY
            ================================================= */}

            <section className="statistics-summary">

              <div className="summary-header">

                <div className="summary-icon">
                  <FaChartBar />
                </div>

                <div>
                  <h2>
                    Platform Summary
                  </h2>

                  <p>
                    Current platform statistics
                  </p>
                </div>

              </div>

              <div className="summary-content">

                <div className="summary-item">
                  <span>Total Users</span>
                  <strong>
                    {stats.totalUsers.toLocaleString()}
                  </strong>
                </div>

                <div className="summary-item">
                  <span>Total Music</span>
                  <strong>
                    {stats.totalMusic.toLocaleString()}
                  </strong>
                </div>

                <div className="summary-item">
                  <span>Total Plays</span>
                  <strong>
                    {stats.totalPlays.toLocaleString()}
                  </strong>
                </div>

                <div className="summary-item">
                  <span>Total Likes</span>
                  <strong>
                    {stats.totalLikes.toLocaleString()}
                  </strong>
                </div>

              </div>

            </section>

          </>

        )}

      </main>

    </div>
  );
};


/* =========================================================
   STAT CARD
========================================================= */

const StatCard = ({
  icon,
  title,
  value,
  type,
}) => {

  return (
    <div className={`statistics-card statistics-card-${type}`}>

      <div className="statistics-card-top">

        <div className="statistics-card-icon">
          {icon}
        </div>

      </div>

      <div className="statistics-card-content">

        <p>
          {title}
        </p>

        <h2>
          {Number(value || 0).toLocaleString()}
        </h2>

      </div>

    </div>
  );
};

export default BusinessOwnerStatistics;