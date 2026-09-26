import React from "react";
import { useNavigate } from "react-router-dom";

import {
  FaStore,
  FaMusic,
  FaUsers,
  FaChartBar,
  FaSignOutAlt,
  FaArrowRight,
} from "react-icons/fa";

import "../../assets/css/businessOwner/BusinessOwnerDashboard.css";

const BusinessOwnerDashboard = () => {
  const navigate = useNavigate();

  const user = JSON.parse(
    localStorage.getItem("user") || "null"
  );

  const handleLogout = () => {
    localStorage.removeItem("keerthana_token");
    localStorage.removeItem("user");

    navigate("/owner/login");
  };

  return (
    <div className="owner-dashboard-page">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="owner-dashboard-header">

        <div className="owner-dashboard-header-content">

          <div className="owner-dashboard-title">

            <div className="owner-dashboard-title-icon">
              <FaStore />
            </div>

            <div>
              <h1>Business Owner Dashboard</h1>

              <p>
                Welcome, {user?.name || "Business Owner"}
              </p>
            </div>

          </div>

          <button
            type="button"
            className="owner-logout-btn"
            onClick={handleLogout}
          >
            <FaSignOutAlt />
            <span>Logout</span>
          </button>

        </div>

      </header>


      {/* =====================================================
          MAIN
      ===================================================== */}

      <main className="owner-dashboard-main">

        {/* ===================================================
            BUSINESS INFO
        =================================================== */}

        <section className="owner-business-info">

          <div className="business-info-icon">
            <FaStore />
          </div>

          <div className="business-info-content">

            <h2>
              {user?.name || "Smart Technologies"}
            </h2>

            <p>
              {user?.email || "Business Owner"}
            </p>

          </div>

        </section>


        {/* ===================================================
            DASHBOARD CARDS
        =================================================== */}

        <section className="owner-dashboard-grid">

        {/* =================================================
              MUSIC
          ================================================= */}

             {/*<div
            className="owner-dashboard-card music-card"
            onClick={() => navigate("/owner/music")}
          >

            <div className="dashboard-card-icon">
              <FaMusic />
            </div>

            <div className="dashboard-card-content">

              <h3>
                Music Management
              </h3>

              <p>
                Add, edit and manage your music content.
              </p>

            </div>

            <button
              type="button"
              className="dashboard-card-btn"
              onClick={(event) => {
                event.stopPropagation();
                navigate("/owner/music");
              }}
            >
              Manage Music
              <FaArrowRight />
            </button>

          </div> */}


          {/* =================================================
              USERS
          ================================================= */}

          <div
            className="owner-dashboard-card users-card"
            onClick={() => navigate("/owner/users")}
          >

            <div className="dashboard-card-icon">
              <FaUsers />
            </div>

            <div className="dashboard-card-content">

              <h3>
                User Management
              </h3>

              <p>
                View and manage registered users.
              </p>

            </div>

            <button
              type="button"
              className="dashboard-card-btn"
              onClick={(event) => {
                event.stopPropagation();
                navigate("/owner/users");
              }}
            >
              Manage Users
              <FaArrowRight />
            </button>

          </div>


          {/* =================================================
              STATISTICS
          ================================================= */}

          <div
            className="owner-dashboard-card statistics-card"
            onClick={() =>
              navigate("/owner/statistics")
            }
          >

            <div className="dashboard-card-icon">
              <FaChartBar />
            </div>

            <div className="dashboard-card-content">

              <h3>
                Statistics
              </h3>

              <p>
                View users, music and platform statistics.
              </p>

            </div>

            <button
              type="button"
              className="dashboard-card-btn"
              onClick={(event) => {
                event.stopPropagation();
                navigate("/owner/statistics");
              }}
            >
              View Statistics
              <FaArrowRight />
            </button>

          </div>

        </section>

      </main>

    </div>
  );
};

export default BusinessOwnerDashboard;