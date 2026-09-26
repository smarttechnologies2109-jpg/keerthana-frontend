import React from "react";

import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";


/* =========================================================
   AUTH
========================================================= */

import {
  useAuth,
} from "./context/AuthContext";


/* =========================================================
   LAYOUTS
========================================================= */

import AppLayout
  from "./components/AppLayout";


/* =========================================================
   NORMAL USER AUTH
========================================================= */

import Login
  from "./pages/Login";

import Register
  from "./pages/Register";


/* =========================================================
   ADMIN AUTH
========================================================= */

import AdminLogin
  from "./pages/admin/AdminLogin";


/* =========================================================
   NORMAL USER PAGES
========================================================= */

import Home
  from "./pages/Home";


/* =========================================================
   USER ROOT REDIRECT

   "/" behavior:

   NOT LOGGED IN
        ↓
     /login

   LOGGED IN
        ↓
     /home
========================================================= */

function UserHomeRedirect() {

  const {
    user,
    loading,
  } = useAuth();


  /* -------------------------------------------------------
     Wait until AuthContext finishes checking localStorage
     and /auth/me
  ------------------------------------------------------- */

  if (loading) {

    return null;

  }


  /* -------------------------------------------------------
     USER ALREADY LOGGED IN
  ------------------------------------------------------- */

  if (user) {

    return (
      <Navigate
        to="/home"
        replace
      />
    );

  }


  /* -------------------------------------------------------
     USER NOT LOGGED IN
  ------------------------------------------------------- */

  return (
    <Navigate
      to="/login"
      replace
    />
  );

}


/* =========================================================
   APP
========================================================= */

function App() {

  return (

    <Routes>


      {/* =================================================
          NORMAL USER AUTH
      ================================================= */}

      <Route
        path="/login"
        element={
          <Login />
        }
      />


      <Route
        path="/register"
        element={
          <Register />
        }
      />


      {/* =================================================
          ADMIN LOGIN

          IMPORTANT:
          This remains completely separate from
          normal user login.
      ================================================= */}

      <Route
        path="/admin/login"
        element={
          <AdminLogin />
        }
      />


      {/* =================================================
          NORMAL KEERTHANA APP

          AppLayout contains the normal user application.
      ================================================= */}

      <Route
        element={
          <AppLayout />
        }
      >


        {/* =================================================
            ROOT ROUTE

            "/" automatically decides:

            Logged in     → /home
            Not logged in → /login
        ================================================= */}

        <Route
          path="/"
          element={
            <UserHomeRedirect />
          }
        />


        {/* =================================================
            HOME
        ================================================= */}

        <Route
          path="/home"
          element={
            <Home />
          }
        />


        {/* =================================================
            PUT YOUR OTHER NORMAL USER ROUTES HERE

            Example:

            <Route
              path="/search"
              element={
                <Search />
              }
            />

            <Route
              path="/liked-songs"
              element={
                <LikedSongs />
              }
            />
        ================================================= */}


      </Route>


      {/* =================================================
          UNKNOWN ROUTE

          Optional fallback.
      ================================================= */}

      <Route
        path="*"
        element={
          <Navigate
            to="/"
            replace
          />
        }
      />


    </Routes>

  );

}


export default App;