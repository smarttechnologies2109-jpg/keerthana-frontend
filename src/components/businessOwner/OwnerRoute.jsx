
import React from "react";

import {
  Navigate,
  useLocation,
} from "react-router-dom";

import {
  useAuth,
} from "../../context/AuthContext";


function OwnerRoute({
  children,
}) {

  const {
    user,
    loading,
  } = useAuth();

  const location =
    useLocation();


  /* =========================================================
     AUTH LOADING
  ========================================================= */

  if (loading) {

    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f5f6fa",
          fontSize: "18px",
          fontWeight: "600",
          color: "#333",
        }}
      >
        Checking Business Owner Access...
      </div>
    );

  }


  /* =========================================================
     NO USER
  ========================================================= */

  if (!user) {

    console.warn(
      "OwnerRoute: No logged-in user."
    );

    return (
      <Navigate
        to="/owner/login"
        state={{
          from: location.pathname,
        }}
        replace
      />
    );

  }


  /* =========================================================
     NORMALIZE ROLE
  ========================================================= */

  const role =
    String(
      user.role || ""
    )
      .trim()
      .toUpperCase();


  /* =========================================================
     DEBUG
  ========================================================= */

  console.log(
    "OwnerRoute:",
    {
      path:
        location.pathname,

      user:
        user,

      role:
        role,
    }
  );


  /* =========================================================
     BUSINESS OWNER ACCESS
  ========================================================= */

  if (
    role ===
    "BUSINESS_OWNER"
  ) {

    return children;

  }


  /* =========================================================
     ACCESS DENIED
  ========================================================= */

  console.warn(
    "OwnerRoute: Access denied.",
    {
      role:
        user.role,

      normalizedRole:
        role,
    }
  );


  return (
    <Navigate
      to="/"
      replace
    />
  );

}


export default OwnerRoute;
