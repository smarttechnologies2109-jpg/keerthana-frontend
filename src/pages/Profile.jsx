import {
  useEffect,
  useState,
} from "react";

import {
  FaUser,
  FaEnvelope,
  FaCrown,
  FaCalendarAlt,
  FaHeart,
  FaHistory,
  FaMusic,
  FaEdit,
  FaSave,
  FaTimes,
  FaSignOutAlt,
  FaShieldAlt,
} from "react-icons/fa";

import {
  useNavigate,
} from "react-router-dom";

import {
  useAuth,
} from "../context/AuthContext";

import API
  from "../services/api";

import "../assets/css/profile.css";


function Profile() {

  const navigate =
    useNavigate();


  const {
    user,
    logout,
  } = useAuth();


  /* =====================================================
     STATE
  ===================================================== */

  const [profile, setProfile] =
    useState(null);

  const [stats, setStats] =
    useState({
      likedSongs: 0,
      playlists: 0,
      history: 0,
    });

  const [name, setName] =
    useState("");

  const [editing, setEditing] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");


  /* =====================================================
     LOAD PROFILE
  ===================================================== */

  useEffect(() => {

    if (!user) {

      navigate(
        "/login",
        {
          replace: true,
        }
      );

      return;

    }


    const loadProfile =
      async () => {

        try {

          setLoading(true);

          setError("");


          /*
            First try profile API.

            If your backend doesn't have
            /users/profile yet, the page
            will still use AuthContext user.
          */

          try {

            const response =
              await API.get(
                "/users/profile"
              );


            const profileData =
              response.data.user ||
              response.data.profile ||
              response.data;


            setProfile(
              profileData
            );


            setName(
              profileData.name ||
              user.name ||
              ""
            );

          } catch (profileError) {

            console.log(
              "Using AuthContext profile:",
              profileError
            );


            setProfile(user);

            setName(
              user.name || ""
            );

          }


          /* =============================================
             LOAD PROFILE STATS
          ============================================= */

          const results =
            await Promise.allSettled([

              API.get(
                "/liked-songs"
              ),

              API.get(
                "/playlists"
              ),

              API.get(
                "/history"
              ),

            ]);


          const likedResponse =
            results[0];

          const playlistResponse =
            results[1];

          const historyResponse =
            results[2];


          setStats({

            likedSongs:
              likedResponse.status ===
              "fulfilled"
                ? (
                    likedResponse
                      .value
                      .data
                      .songs
                      ?.length || 0
                  )
                : 0,

            playlists:
              playlistResponse.status ===
              "fulfilled"
                ? (
                    playlistResponse
                      .value
                      .data
                      .playlists
                      ?.length || 0
                  )
                : 0,

            history:
              historyResponse.status ===
              "fulfilled"
                ? (
                    historyResponse
                      .value
                      .data
                      .history
                      ?.length ||
                    historyResponse
                      .value
                      .data
                      .songs
                      ?.length ||
                    0
                  )
                : 0,

          });


        } catch (error) {

          console.error(
            "Profile load error:",
            error
          );


          setError(
            "Unable to load profile"
          );

        } finally {

          setLoading(false);

        }

      };


    loadProfile();

  }, [user, navigate]);


  /* =====================================================
     SAVE PROFILE
  ===================================================== */

  const handleSave =
    async () => {

      const cleanName =
        name.trim();


      if (!cleanName) {

        setError(
          "Name cannot be empty."
        );

        return;

      }


      try {

        setSaving(true);

        setError("");

        setMessage("");


        /*
          Backend route expected:

          PUT /users/profile

          body:
          {
            name: "User Name"
          }
        */

        const response =
          await API.put(
            "/users/profile",
            {
              name:
                cleanName,
            }
          );


        const updatedUser =
          response.data.user ||
          {
            ...profile,
            name:
              cleanName,
          };


        setProfile(
          updatedUser
        );


        setName(
          updatedUser.name ||
          cleanName
        );


        setEditing(false);


        setMessage(
          "Profile updated successfully."
        );


      } catch (error) {

        console.error(
          "Update profile error:",
          error
        );


        setError(
          error.response
            ?.data
            ?.message ||
          "Unable to update profile."
        );

      } finally {

        setSaving(false);

      }

    };


  /* =====================================================
     CANCEL EDIT
  ===================================================== */

  const handleCancel =
    () => {

      setName(
        profile?.name ||
        user?.name ||
        ""
      );

      setEditing(false);

      setError("");

    };


  /* =====================================================
     LOGOUT
  ===================================================== */

  const handleLogout =
    () => {

      logout();

      navigate(
        "/login",
        {
          replace: true,
        }
      );

    };


  /* =====================================================
     DATE
  ===================================================== */

  const formatDate =
    (date) => {

      if (!date) {

        return "KEERTHANA Member";

      }


      const parsedDate =
        new Date(date);


      if (
        Number.isNaN(
          parsedDate.getTime()
        )
      ) {

        return "KEERTHANA Member";

      }


      return parsedDate
        .toLocaleDateString(
          "en-IN",
          {
            day:
              "numeric",

            month:
              "long",

            year:
              "numeric",
          }
        );

    };


  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {

    return (

      <div className="profile-page">

        <div className="profile-loading">

          <div className="profile-loading-avatar">

            <FaUser />

          </div>

          <h2>
            Loading Profile...
          </h2>

          <p>
            Preparing your KEERTHANA account
          </p>

        </div>

      </div>

    );

  }


  /* =====================================================
     NO USER
  ===================================================== */

  if (!user) {

    return null;

  }


  const displayUser =
    profile || user;


  const firstLetter =
    displayUser?.name
      ?.charAt(0)
      ?.toUpperCase() ||
    "U";


  const isPremium =
    displayUser?.is_premium === true ||
    displayUser?.is_premium === 1 ||
    displayUser?.plan === "premium" ||
    displayUser?.subscription_status ===
      "active";


  /* =====================================================
     UI
  ===================================================== */

  return (

    <div className="profile-page">


      {/* =================================================
          HERO
      ================================================= */}

      <section className="profile-hero">


        <div className="profile-hero-glow" />


        <div className="profile-avatar">

          {firstLetter}

        </div>


        <div className="profile-hero-info">


          <span className="profile-eyebrow">

            KEERTHANA ACCOUNT

          </span>


          <h1>

            {displayUser?.name ||
              "KEERTHANA User"}

          </h1>


          <div className="profile-email">

            <FaEnvelope />

            <span>

              {displayUser?.email ||
                "No email"}

            </span>

          </div>


          <div className="profile-badges">


            {displayUser?.role ===
              "admin" && (

              <span className="profile-admin-badge">

                <FaShieldAlt />

                Administrator

              </span>

            )}


            <span
              className={
                isPremium
                  ? "profile-plan-badge premium"
                  : "profile-plan-badge"
              }
            >

              <FaCrown />

              {isPremium
                ? "Premium Member"
                : "Free Member"}

            </span>


          </div>


        </div>


        <button
          type="button"

          className="profile-edit-button"

          onClick={() =>
            setEditing(true)
          }
        >

          <FaEdit />

          Edit Profile

        </button>


      </section>


      {/* =================================================
          MESSAGE
      ================================================= */}

      {message && (

        <div className="profile-message">

          {message}

        </div>

      )}


      {error && (

        <div className="profile-error">

          {error}

        </div>

      )}


      {/* =================================================
          STATS
      ================================================= */}

      <section className="profile-stats">


        <button
          type="button"

          className="profile-stat-card"

          onClick={() =>
            navigate(
              "/liked-songs"
            )
          }
        >

          <div className="profile-stat-icon heart">

            <FaHeart />

          </div>


          <div>

            <strong>
              {stats.likedSongs}
            </strong>

            <span>
              Liked Songs
            </span>

          </div>

        </button>


        <button
          type="button"

          className="profile-stat-card"

          onClick={() =>
            navigate(
              "/playlists"
            )
          }
        >

          <div className="profile-stat-icon music">

            <FaMusic />

          </div>


          <div>

            <strong>
              {stats.playlists}
            </strong>

            <span>
              Playlists
            </span>

          </div>

        </button>


        <button
          type="button"

          className="profile-stat-card"

          onClick={() =>
            navigate(
              "/history"
            )
          }
        >

          <div className="profile-stat-icon history">

            <FaHistory />

          </div>


          <div>

            <strong>
              {stats.history}
            </strong>

            <span>
              History
            </span>

          </div>

        </button>


      </section>


      {/* =================================================
          MAIN GRID
      ================================================= */}

      <div className="profile-content-grid">


        {/* ===============================================
            ACCOUNT DETAILS
        =============================================== */}

        <section className="profile-card">


          <div className="profile-card-heading">

            <div>

              <span>
                PROFILE
              </span>

              <h2>
                Account Details
              </h2>

            </div>


            {!editing && (

              <button
                type="button"

                onClick={() =>
                  setEditing(true)
                }
              >

                <FaEdit />

                Edit

              </button>

            )}

          </div>


          <div className="profile-details">


            {/* NAME */}

            <div className="profile-detail-row">

              <div className="profile-detail-icon">

                <FaUser />

              </div>


              <div className="profile-detail-content">

                <span>
                  Name
                </span>


                {editing ? (

                  <input
                    type="text"

                    value={name}

                    onChange={(event) =>
                      setName(
                        event.target.value
                      )
                    }

                    placeholder="Enter your name"
                  />

                ) : (

                  <strong>

                    {displayUser?.name ||
                      "KEERTHANA User"}

                  </strong>

                )}

              </div>

            </div>


            {/* EMAIL */}

            <div className="profile-detail-row">

              <div className="profile-detail-icon">

                <FaEnvelope />

              </div>


              <div className="profile-detail-content">

                <span>
                  Email Address
                </span>

                <strong>

                  {displayUser?.email ||
                    "—"}

                </strong>

              </div>

            </div>


            {/* ROLE */}

            <div className="profile-detail-row">

              <div className="profile-detail-icon">

                <FaShieldAlt />

              </div>


              <div className="profile-detail-content">

                <span>
                  Account Role
                </span>

                <strong>

                  {displayUser?.role ===
                  "admin"
                    ? "Administrator"
                    : "Listener"}

                </strong>

              </div>

            </div>


            {/* MEMBER SINCE */}

            <div className="profile-detail-row">

              <div className="profile-detail-icon">

                <FaCalendarAlt />

              </div>


              <div className="profile-detail-content">

                <span>
                  Member Since
                </span>

                <strong>

                  {formatDate(
                    displayUser?.created_at
                  )}

                </strong>

              </div>

            </div>


          </div>


          {/* =============================================
              EDIT ACTIONS
          ============================================= */}

          {editing && (

            <div className="profile-edit-actions">


              <button
                type="button"

                className="profile-cancel-button"

                onClick={
                  handleCancel
                }

                disabled={
                  saving
                }
              >

                <FaTimes />

                Cancel

              </button>


              <button
                type="button"

                className="profile-save-button"

                onClick={
                  handleSave
                }

                disabled={
                  saving
                }
              >

                <FaSave />

                {saving
                  ? "Saving..."
                  : "Save Changes"}

              </button>


            </div>

          )}


        </section>


        {/* ===============================================
            MEMBERSHIP
        =============================================== */}

        <section className="profile-card profile-membership-card">


          <div className="profile-card-heading">

            <div>

              <span>
                MEMBERSHIP
              </span>

              <h2>
                Your Plan
              </h2>

            </div>

          </div>


          <div className="profile-membership-icon">

            <FaCrown />

          </div>


          <h3>

            {isPremium
              ? "KEERTHANA Premium"
              : "KEERTHANA Free"}

          </h3>


          <p>

            {isPremium
              ? "Enjoy your premium KEERTHANA music experience."
              : "Upgrade to Premium for the complete KEERTHANA experience."}

          </p>


          <button
            type="button"

            onClick={() =>
              navigate(
                "/premium"
              )
            }
          >

            <FaCrown />

            {isPremium
              ? "Manage Premium"
              : "Explore Premium"}

          </button>


        </section>


      </div>


      {/* =================================================
          QUICK LINKS
      ================================================= */}

      <section className="profile-quick-section">


        <div className="profile-section-heading">

          <span>
            YOUR MUSIC
          </span>

          <h2>
            Quick Access
          </h2>

        </div>


        <div className="profile-quick-grid">


          <button
            type="button"

            onClick={() =>
              navigate(
                "/liked-songs"
              )
            }
          >

            <div>

              <FaHeart />

            </div>

            <strong>
              Liked Songs
            </strong>

            <span>
              Your favorite worship songs
            </span>

          </button>


          <button
            type="button"

            onClick={() =>
              navigate(
                "/playlists"
              )
            }
          >

            <div>

              <FaMusic />

            </div>

            <strong>
              Playlists
            </strong>

            <span>
              Your personal collections
            </span>

          </button>


          <button
            type="button"

            onClick={() =>
              navigate(
                "/history"
              )
            }
          >

            <div>

              <FaHistory />

            </div>

            <strong>
              Listening History
            </strong>

            <span>
              Recently played music
            </span>

          </button>


        </div>


      </section>


      {/* =================================================
          LOGOUT
      ================================================= */}

      <section className="profile-logout-section">


        <div>

          <strong>
            Sign out of KEERTHANA
          </strong>

          <span>
            You can sign back in anytime.
          </span>

        </div>


        <button
          type="button"

          onClick={
            handleLogout
          }
        >

          <FaSignOutAlt />

          Logout

        </button>


      </section>


    </div>

  );

}


export default Profile;