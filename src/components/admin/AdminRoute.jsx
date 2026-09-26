import {
  Navigate,
  useLocation,
} from "react-router-dom";

import {
  useAuth,
} from "../../context/AuthContext";

import "../../assets/css/admin/adminRoute.css";


function AdminRoute({ children }) {

  const {
    user,
    loading,
  } = useAuth();

  const location = useLocation();


  /* =====================================================
     AUTH CHECK STILL RUNNING
  ===================================================== */

  if (loading) {

    return (

      <div className="admin-auth-loading">

        <div className="admin-auth-loading-card">

          {/* Logo / Icon */}
          <div className="admin-auth-logo">
            <span>K</span>
          </div>


          {/* Loading Spinner */}
          <div className="admin-auth-spinner">
            <span></span>
          </div>


          {/* Text */}
          <div className="admin-auth-loading-text">

            <h2>KEERTHANA</h2>

            <p>Checking Admin Access...</p>

          </div>

        </div>

      </div>

    );

  }


  /* =====================================================
     NOT LOGGED IN
  ===================================================== */

  if (!user) {

    return (

      <Navigate
        to="/admin/login"
        state={{
          from: location.pathname,
        }}
        replace
      />

    );

  }


  /* =====================================================
     LOGGED IN BUT NOT ADMIN
  ===================================================== */

  if (user.role !== "ADMIN") {

    console.warn(
      "Admin access denied.",
      "Current role:",
      user.role
    );


    return (
      <Navigate
        to="/"
        replace
      />
    );

  }


  /* =====================================================
     ADMIN ACCESS GRANTED
  ===================================================== */

  return children;
}


export default AdminRoute;