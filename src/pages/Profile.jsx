import {
  useEffect,
  useRef,
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
  FaCamera,
  FaGlobe,
} from "react-icons/fa";

import {
  useNavigate,
} from "react-router-dom";

import {
  useAuth,
} from "../context/AuthContext";

import API from "../services/api";

import {
  getMediaUrl,
} from "../utils/media";

import "../assets/css/profile.css";


/* =========================================================
   LANGUAGES
========================================================= */

const LANGUAGES = [
  {
    value: "Telugu",
    label: "తెలుగు",
  },
  {
    value: "Hindi",
    label: "हिन्दी",
  },
  {
    value: "English",
    label: "English",
  },
  {
    value: "Malayalam",
    label: "മലയാളം",
  },
  {
    value: "Kannada",
    label: "ಕನ್ನಡ",
  },
  {
    value: "Tamil",
    label: "தமிழ்",
  },
];


/* =========================================================
   PROFILE PAGE
========================================================= */

function Profile() {

  const navigate = useNavigate();

  const {
    user,
    logout,
    updateUser,
  } = useAuth();


  /* =======================================================
     FILE INPUT
  ======================================================= */

  const fileInputRef = useRef(null);


  /* =======================================================
     STATE
  ======================================================= */

  const [
    profile,
    setProfile,
  ] = useState(null);


  const [
    stats,
    setStats,
  ] = useState({
    likedSongs: 0,
    playlists: 0,
    history: 0,
  });


  const [
    name,
    setName,
  ] = useState("");


  const [
    language,
    setLanguage,
  ] = useState("Telugu");


  const [
    profileImage,
    setProfileImage,
  ] = useState("");


  const [
    selectedImage,
    setSelectedImage,
  ] = useState(null);


  const [
    imagePreview,
    setImagePreview,
  ] = useState("");


  /* =======================================================
     POPUP
  ======================================================= */

  const [
    editing,
    setEditing,
  ] = useState(false);


  const [
    loading,
    setLoading,
  ] = useState(true);


  const [
    saving,
    setSaving,
  ] = useState(false);


  const [
    error,
    setError,
  ] = useState("");


  const [
    message,
    setMessage,
  ] = useState("");


  /* =======================================================
     LOAD PROFILE
  ======================================================= */

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


    const loadProfile = async () => {

      try {

        setLoading(true);
        setError("");


        /* ===============================================
           PROFILE
        =============================================== */

        try {

          const response =
            await API.get(
              "/users/profile"
            );


          const profileData =
            response.data?.user ||
            response.data?.profile ||
            response.data;


          setProfile(
            profileData
          );


          setName(
            profileData?.name ||
            user?.name ||
            ""
          );


          setLanguage(
            profileData?.language ||
            user?.language ||
            "Telugu"
          );


          setProfileImage(
            profileData?.profile_image ||
            user?.profile_image ||
            ""
          );

        } catch (profileError) {

          console.log(
            "Using AuthContext profile:",
            profileError
          );


          setProfile(
            user
          );


          setName(
            user?.name ||
            ""
          );


          setLanguage(
            user?.language ||
            "Telugu"
          );


          setProfileImage(
            user?.profile_image ||
            ""
          );
        }


        /* ===============================================
           STATS
        =============================================== */

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
              ?
                (
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
              ?
                (
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
              ?
                (
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

      } catch (loadError) {

        console.error(
          "Profile load error:",
          loadError
        );


        setError(
          "Unable to load profile."
        );

      } finally {

        setLoading(false);

      }

    };


    loadProfile();

  }, [
    user,
    navigate,
  ]);


  /* =======================================================
     IMAGE URL
  ======================================================= */

  const getProfileImage = () => {

    if (imagePreview) {

      return imagePreview;

    }


    if (profileImage) {

      return getMediaUrl(
        profileImage
      );

    }


    return "";

  };


  /* =======================================================
     IMAGE SELECT
  ======================================================= */

  const handleImageChange = (
    event
  ) => {

    const file =
      event.target.files?.[0];


    if (!file) {

      return;

    }


    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/jpg",
    ];


    if (
      !allowedTypes.includes(
        file.type
      )
    ) {

      setError(
        "Please select a JPG, PNG, or WebP image."
      );

      return;

    }


    const maxSize =
      5 * 1024 * 1024;


    if (
      file.size > maxSize
    ) {

      setError(
        "Profile image must be smaller than 5MB."
      );

      return;

    }


    setError("");

    setSelectedImage(
      file
    );


    const reader =
      new FileReader();


    reader.onload = () => {

      setImagePreview(
        reader.result
      );

    };


    reader.readAsDataURL(
      file
    );

  };


  /* =======================================================
     OPEN EDIT PROFILE
  ======================================================= */

  const handleOpenEdit = () => {

    setName(
      profile?.name ||
      user?.name ||
      ""
    );


    setLanguage(
      profile?.language ||
      user?.language ||
      "Telugu"
    );


    setProfileImage(
      profile?.profile_image ||
      user?.profile_image ||
      ""
    );


    setSelectedImage(null);

    setImagePreview("");

    setError("");

    setMessage("");

    setEditing(true);

  };


  /* =======================================================
     CLOSE EDIT PROFILE
  ======================================================= */

  const handleCloseEdit = () => {

    if (saving) {

      return;

    }


    setName(
      profile?.name ||
      user?.name ||
      ""
    );


    setLanguage(
      profile?.language ||
      user?.language ||
      "Telugu"
    );


    setProfileImage(
      profile?.profile_image ||
      user?.profile_image ||
      ""
    );


    setSelectedImage(null);

    setImagePreview("");

    setError("");

    setEditing(false);

  };


  /* =======================================================
     SAVE PROFILE
  ======================================================= */

  const handleSave = async () => {

    const cleanName =
      name.trim();


    if (!cleanName) {

      setError(
        "Name cannot be empty."
      );

      return;

    }


    if (!language) {

      setError(
        "Please select your language."
      );

      return;

    }


    try {

      setSaving(true);

      setError("");

      setMessage("");


      /* ===============================================
         FORM DATA
      =============================================== */

      const formData =
        new FormData();


      formData.append(
        "name",
        cleanName
      );


      formData.append(
        "language",
        language
      );


      if (selectedImage) {

        formData.append(
          "profile_image",
          selectedImage
        );

      }


      /* ===============================================
         API
      =============================================== */

      const response =
        await API.put(
          "/users/profile",
          formData,
          {
            headers: {
              "Content-Type":
                "multipart/form-data",
            },
          }
        );


      const updatedUser =
        response.data?.user ||
        {
          ...profile,
          name: cleanName,
          language,
        };


      /* ===============================================
         UPDATE PROFILE STATE
      =============================================== */

      setProfile(
        updatedUser
      );


      setName(
        updatedUser.name ||
        cleanName
      );


      setLanguage(
        updatedUser.language ||
        language
      );


      setProfileImage(
        updatedUser.profile_image ||
        profileImage
      );


      /* ===============================================
         IMPORTANT
         UPDATE AUTH CONTEXT
      =============================================== */

      if (
        typeof updateUser ===
        "function"
      ) {

        updateUser(
          updatedUser
        );

      }


      /* ===============================================
         CLEAR IMAGE STATE
      =============================================== */

      setSelectedImage(null);

      setImagePreview("");


      /* ===============================================
         CLOSE POPUP
      =============================================== */

      setEditing(false);


      setMessage(
        "Profile updated successfully."
      );


    } catch (saveError) {

      console.error(
        "Update profile error:",
        saveError
      );


      setError(
        saveError
          .response
          ?.data
          ?.message ||
        "Unable to update profile."
      );

    } finally {

      setSaving(false);

    }

  };


  /* =======================================================
     LOGOUT
  ======================================================= */

  const handleLogout = () => {

    logout();

    navigate(
      "/login",
      {
        replace: true,
      }
    );

  };


  /* =======================================================
     DATE
  ======================================================= */

  const formatDate = (
    date
  ) => {

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
          day: "numeric",
          month: "long",
          year: "numeric",
        }
      );

  };


  /* =======================================================
     LOADING
  ======================================================= */

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


  /* =======================================================
     NO USER
  ======================================================= */

  if (!user) {

    return null;

  }


  const displayUser =
    profile ||
    user;


  const firstLetter =
    displayUser
      ?.name
      ?.charAt(0)
      ?.toUpperCase() ||
    "U";


  const isPremium =
    displayUser?.is_premium === true ||
    displayUser?.is_premium === 1 ||
    displayUser?.plan === "premium" ||
    displayUser?.subscription_status ===
      "active";


  const currentImage =
    getProfileImage();


  const currentLanguage =
    displayUser?.language ||
    "Telugu";


  const languageLabel =
    LANGUAGES.find(
      (item) =>
        item.value ===
        currentLanguage
    )?.label ||
    currentLanguage;


  /* =======================================================
     UI
  ======================================================= */

  return (

    <div className="profile-page">


      {/* =================================================
          HERO
      ================================================= */}

      <section className="profile-hero">

        <div className="profile-hero-glow" />


        {/* ===============================================
            PROFILE PHOTO
        =============================================== */}

        <div className="profile-avatar">

          {currentImage ? (

            <img
              src={currentImage}
              alt={
                displayUser?.name ||
                "Profile"
              }
              onError={(event) => {

                event.currentTarget.style.display =
                  "none";

              }}
            />

          ) : (

            <span>
              {firstLetter}
            </span>

          )}

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


            {(
              String(
                displayUser?.role ||
                ""
              ).toUpperCase() ===
              "ADMIN"
            ) && (

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


        {/* ===============================================
            EDIT BUTTON
        =============================================== */}

        <button
          type="button"
          className="profile-edit-button"
          onClick={
            handleOpenEdit
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


      {error && !editing && (

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


            <button
              type="button"
              onClick={
                handleOpenEdit
              }
            >

              <FaEdit />

              Edit

            </button>


          </div>


          <div className="profile-details">


            {/* =========================================
                NAME
            ========================================= */}

            <div className="profile-detail-row">

              <div className="profile-detail-icon">

                <FaUser />

              </div>


              <div className="profile-detail-content">

                <span>
                  Name
                </span>

                <strong>

                  {displayUser?.name ||
                    "KEERTHANA User"}

                </strong>

              </div>

            </div>


            {/* =========================================
                EMAIL
            ========================================= */}

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

                <small className="profile-readonly-text">

                  Email cannot be changed here.

                </small>

              </div>

            </div>


            {/* =========================================
                LANGUAGE
            ========================================= */}

            <div className="profile-detail-row">

              <div className="profile-detail-icon">

                <FaGlobe />

              </div>


              <div className="profile-detail-content">

                <span>
                  Preferred Language
                </span>

                <strong>
                  {languageLabel}
                </strong>

              </div>

            </div>


            {/* =========================================
                ROLE
            ========================================= */}

            <div className="profile-detail-row">

              <div className="profile-detail-icon">

                <FaShieldAlt />

              </div>


              <div className="profile-detail-content">

                <span>
                  Account Role
                </span>

                <strong>

                  {String(
                    displayUser?.role ||
                    ""
                  ).toUpperCase() ===
                  "ADMIN"
                    ? "Administrator"
                    : "Listener"}

                </strong>

              </div>

            </div>


            {/* =========================================
                MEMBER SINCE
            ========================================= */}

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


      {/* =================================================
          EDIT PROFILE MODAL
      ================================================= */}

      {editing && (

        <div
          className="profile-modal-overlay"
          onMouseDown={(event) => {

            if (
              event.target ===
              event.currentTarget
            ) {

              handleCloseEdit();

            }

          }}
        >

          <div className="profile-modal">


            {/* =========================================
                MODAL HEADER
            ========================================= */}

            <div className="profile-modal-header">

              <div>

                <span>
                  KEERTHANA ACCOUNT
                </span>

                <h2>
                  Edit Profile
                </h2>

              </div>


              <button
                type="button"
                className="profile-modal-close"
                onClick={
                  handleCloseEdit
                }
                disabled={saving}
                aria-label="Close"
              >

                <FaTimes />

              </button>

            </div>


            {/* =========================================
                MODAL BODY
            ========================================= */}

            <div className="profile-modal-body">


              {/* =======================================
                  PROFILE PHOTO
              ======================================= */}

              <div className="profile-modal-photo-section">

                <div
                  className="profile-modal-avatar"
                  onClick={() => {

                    if (!saving) {

                      fileInputRef.current?.click();

                    }

                  }}
                >

                  {imagePreview ? (

                    <img
                      src={imagePreview}
                      alt="Preview"
                    />

                  ) : profileImage ? (

                    <img
                      src={getMediaUrl(
                        profileImage
                      )}
                      alt="Profile"
                      onError={(event) => {

                        event.currentTarget.style.display =
                          "none";

                      }}
                    />

                  ) : (

                    <span>
                      {(
                        name ||
                        "U"
                      )
                        .charAt(0)
                        .toUpperCase()}
                    </span>

                  )}


                  <div className="profile-modal-camera">

                    <FaCamera />

                  </div>

                </div>


                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="profile-image-input"
                  onChange={
                    handleImageChange
                  }
                />


                <button
                  type="button"
                  className="profile-change-photo-button"
                  onClick={() =>
                    fileInputRef.current?.click()
                  }
                  disabled={saving}
                >

                  <FaCamera />

                  Change Photo

                </button>


                <small>
                  JPG, PNG or WebP • Maximum 5MB
                </small>

              </div>


              {/* =======================================
                  ERROR
              ======================================= */}

              {error && (

                <div className="profile-modal-error">

                  {error}

                </div>

              )}


              {/* =======================================
                  NAME
              ======================================= */}

              <div className="profile-modal-field">

                <label>

                  <FaUser />

                  Name

                </label>


                <input
                  type="text"
                  value={name}
                  onChange={(event) =>
                    setName(
                      event.target.value
                    )
                  }
                  placeholder="Enter your name"
                  maxLength={100}
                  disabled={saving}
                />

              </div>


              {/* =======================================
                  EMAIL
              ======================================= */}

              <div className="profile-modal-field">

                <label>

                  <FaEnvelope />

                  Email Address

                </label>


                <input
                  type="email"
                  value={
                    displayUser?.email ||
                    ""
                  }
                  disabled
                  readOnly
                />


                <small>
                  Email cannot be changed here.
                </small>

              </div>


              {/* =======================================
                  LANGUAGE
              ======================================= */}

              <div className="profile-modal-field">

                <label>

                  <FaGlobe />

                  Preferred Language

                </label>


                <select
                  value={language}
                  onChange={(event) =>
                    setLanguage(
                      event.target.value
                    )
                  }
                  disabled={saving}
                >

                  {LANGUAGES.map(
                    (item) => (

                      <option
                        key={
                          item.value
                        }
                        value={
                          item.value
                        }
                      >

                        {item.label}

                      </option>

                    )
                  )}

                </select>


                <small>

                  Your music will be filtered according to this language.

                </small>

              </div>


            </div>


            {/* =========================================
                MODAL FOOTER
            ========================================= */}

            <div className="profile-modal-footer">


              <button
                type="button"
                className="profile-modal-cancel"
                onClick={
                  handleCloseEdit
                }
                disabled={saving}
              >

                <FaTimes />

                Cancel

              </button>


              <button
                type="button"
                className="profile-modal-save"
                onClick={
                  handleSave
                }
                disabled={saving}
              >

                <FaSave />

                {saving
                  ? "Saving..."
                  : "Save Changes"}

              </button>


            </div>


          </div>

        </div>

      )}

    </div>

  );

}


export default Profile;