import {
  useEffect,
  useState,
} from "react";

import {
  FaMusic,
  FaMicrophone,
  FaCompactDisc,
  FaTags,
  FaUsers,
  FaPlus,
  FaArrowRight,
  FaChartLine,
} from "react-icons/fa";

import {
  useNavigate,
} from "react-router-dom";

import API
  from "../../services/api";

import "../../assets/css/admin/adminDashboard.css";


function AdminDashboard() {

  const navigate =
    useNavigate();


  const [stats, setStats] =
    useState({
      songs: 0,
      artists: 0,
      albums: 0,
      categories: 0,
      users: 0,
    });


  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  /* =====================================================
     LOAD DASHBOARD
  ===================================================== */

  useEffect(() => {

    const loadDashboard =
      async () => {

        try {

          setLoading(true);
          setError("");


          const response =
            await API.get(
              "/admin/dashboard"
            );


          setStats(
            response.data.stats || {
              songs: 0,
              artists: 0,
              albums: 0,
              categories: 0,
              users: 0,
            }
          );

        } catch (error) {

          console.error(
            "Admin dashboard error:",
            error
          );


          setError(
            error.response
              ?.data
              ?.message ||
            "Unable to load admin dashboard"
          );

        } finally {

          setLoading(false);

        }

      };


    loadDashboard();

  }, []);


  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {

    return (

      <div className="admin-dashboard-page">

        <div className="dashboard-loading">

          <div className="dashboard-loader" />

          <span>
            Loading Dashboard...
          </span>

        </div>

      </div>

    );

  }


  /* =====================================================
     UI
  ===================================================== */

  return (

    <div className="admin-dashboard-page">


      {/* =================================================
          HERO / HEADER
      ================================================= */}

      <section className="dashboard-hero">


        <div className="dashboard-hero-glow" />


        <div className="dashboard-hero-content">


          <div className="dashboard-heading">


            <div className="dashboard-eyebrow">

              <FaChartLine />

              <span>
                KEERTHANA ADMIN
              </span>

            </div>


            <h1>
              Dashboard
            </h1>


            <p>
              Manage your Christian music
              library, artists, albums,
              categories and listeners from
              one place.
            </p>


          </div>


          <button
            type="button"

            className="dashboard-add-song"

            onClick={() =>
              navigate(
                "/admin/songs/add"
              )
            }
          >

            <span className="dashboard-add-icon">
              <FaPlus />
            </span>

            <span>
              Add New Song
            </span>

          </button>


        </div>


        <div className="dashboard-hero-footer">

          <span>
            MUSIC LIBRARY
          </span>

          <div />

          <span>
            WORSHIP • PRAISE • LISTEN
          </span>

        </div>


      </section>


      {/* =================================================
          ERROR
      ================================================= */}

      {error && (

        <div className="dashboard-error">

          {error}

        </div>

      )}


      {/* =================================================
          OVERVIEW
      ================================================= */}

      <div className="dashboard-section-header">

        <div>

          <span className="dashboard-section-label">
            OVERVIEW
          </span>

          <h2>
            Platform Statistics
          </h2>

        </div>

        <p>
          Current content and user totals
        </p>

      </div>


      {/* =================================================
          STATISTICS
      ================================================= */}

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

{/* 
        <StatCard
          icon={<FaUsers />}
          title="Users"
          value={stats.users}
          type="users"
        /> */}


      </section>


      {/* =================================================
          MANAGEMENT
      ================================================= */}

      <section className="dashboard-management">


        <div className="dashboard-section-header">

          <div>

            <span className="dashboard-section-label">
              MANAGEMENT
            </span>

            <h2>
              Manage KEERTHANA
            </h2>

          </div>


          <p>
            Control your complete music
            platform
          </p>

        </div>


        <div className="dashboard-management-grid">


          <ManagementCard
            icon={<FaMusic />}
            title="Songs"
            description="Upload, edit and manage your Christian music library."
            count={`${stats.songs} Songs`}
            buttonText="Manage Songs"
            type="songs"

            onClick={() =>
              navigate(
                "/admin/songs"
              )
            }
          />


          <ManagementCard
            icon={<FaMicrophone />}
            title="Artists"
            description="Create artist profiles and manage artist information."
            count={`${stats.artists} Artists`}
            buttonText="Manage Artists"
            type="artists"

            onClick={() =>
              navigate(
                "/admin/artists"
              )
            }
          />


          <ManagementCard
            icon={<FaCompactDisc />}
            title="Albums"
            description="Organize songs into albums and manage releases."
            count={`${stats.albums} Albums`}
            buttonText="Manage Albums"
            type="albums"

            onClick={() =>
              navigate(
                "/admin/albums"
              )
            }
          />


          <ManagementCard
            icon={<FaTags />}
            title="Categories"
            description="Organize worship songs into meaningful categories."
            count={`${stats.categories} Categories`}
            buttonText="Manage Categories"
            type="categories"

            onClick={() =>
              navigate(
                "/admin/categories"
              )
            }
          />


          {/* <ManagementCard
            icon={<FaUsers />}
            title="Users"
            description="View registered listeners and manage account roles."
            count={`${stats.users} Users`}
            buttonText="Manage Users"
            type="users"

            onClick={() =>
              navigate(
                "/admin/users"
              )
            }
          /> */}


        </div>


      </section>


    </div>

  );

}


/* =====================================================
   STAT CARD
===================================================== */

function StatCard({
  icon,
  title,
  value,
  type,
}) {

  return (

    <div
      className={
        `dashboard-stat-card ${type}`
      }
    >


      <div className="dashboard-stat-top">


        <div className="dashboard-stat-icon">

          {icon}

        </div>


        <span className="dashboard-stat-label">

          {title}

        </span>


      </div>


      <div className="dashboard-stat-value">

        {Number(value || 0)
          .toLocaleString()}

      </div>


      <div className="dashboard-stat-bottom">

        <span>
          Total {title}
        </span>

        <span className="dashboard-stat-dot" />

      </div>


    </div>

  );

}


/* =====================================================
   MANAGEMENT CARD
===================================================== */

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

    <article
      className={
        `dashboard-management-card ${type}`
      }
    >


      <div className="dashboard-management-top">


        <div className="dashboard-management-icon">

          {icon}

        </div>


        <span className="dashboard-count">

          {count}

        </span>


      </div>


      <div className="dashboard-management-content">

        <h3>
          {title}
        </h3>

        <p>
          {description}
        </p>

      </div>


      <button
        type="button"

        onClick={onClick}
      >

        <span>
          {buttonText}
        </span>

        <span className="management-arrow">

          <FaArrowRight />

        </span>

      </button>


    </article>

  );

}


export default AdminDashboard;