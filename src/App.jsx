
import React from "react";

import {
  Navigate,
  Routes,
  Route,
} from "react-router-dom";


/* =========================================================
   PLAYER
========================================================= */

import {
  PlayerProvider,
} from "./context/PlayerContext";


/* =========================================================
   LIKED SONGS
========================================================= */

import {
  LikedSongsProvider,
} from "./context/LikedSongsContext";


/* =========================================================
   NOTIFICATIONS
========================================================= */

import {
  NotificationsProvider,
} from "./context/NotificationsContext";


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

import AdminLayout
  from "./components/admin/AdminLayout";

import AdminRoute
  from "./components/admin/AdminRoute";

import OwnerRoute
  from "./components/businessOwner/OwnerRoute";


/* =========================================================
   AUTH PAGES
========================================================= */

import Login
  from "./pages/Login";

import Register
  from "./pages/Register";

import AdminLogin
  from "./pages/admin/AdminLogin";


/* =========================================================
   USER PAGES
========================================================= */

import Home
  from "./pages/Home";

import Search
  from "./pages/Search";

import Library
  from "./pages/Library";

import LikedSongs
  from "./pages/LikedSongs";

import Playlists
  from "./pages/Playlists";

import PlaylistDetails
  from "./pages/PlaylistDetails";

import Artists
  from "./pages/Artists";

import ArtistDetails
  from "./pages/ArtistDetails";

import Albums
  from "./pages/Albums";

import AlbumDetails
  from "./pages/AlbumDetails";

import SongDetails
  from "./pages/SongDetails";

import Premium
  from "./pages/Premium";

import History
  from "./pages/History";

import Profile
  from "./pages/Profile";

import KeerthanaAIPage
  from "./pages/KeerthanaAI";

import MoodPlaylists
  from "./pages/MoodPlaylists";

import MoodSongs
  from "./pages/MoodSongs";

import Statistics
  from "./pages/Statistics";

import Ministries
  from "./pages/Ministries";

import MinistryDetails
  from "./pages/MinistryDetails";

import DownloadManager
  from "./pages/DownloadManager";

import AllSongs
  from "./pages/AllSongs";

import Notifications
  from "./pages/Notifications";

import Favorites
  from "./pages/Favorites";


/* =========================================================
   ADMIN PAGES
========================================================= */

import AdminDashboard
  from "./pages/admin/AdminDashboard";

import ManageSongs
  from "./pages/admin/ManageSongs";

import AddSong
  from "./pages/admin/AddSong";

import EditSong
  from "./pages/admin/EditSong";

import ManageArtists
  from "./pages/admin/ManageArtists";

import ManageAlbums
  from "./pages/admin/ManageAlbums";

import ManageCategories
  from "./pages/admin/ManageCategories";

import ManageUsers
  from "./pages/admin/ManageUsers";

import ManageMinistries
  from "./pages/admin/ManageMinistries";

import AdminForgotPassword
  from "./pages/admin/AdminForgotPassword";

import AdminSongReports
  from "./pages/admin/AdminSongReports";


/* =========================================================
   BUSINESS OWNER PAGES
========================================================= */

import BusinessOwnerLogin
  from "./pages/businessOwner/BusinessOwnerLogin";

import BusinessOwnerDashboard
  from "./pages/businessOwner/BusinessOwnerDashboard";

import BusinessOwnerUsers
  from "./pages/businessOwner/BusinessOwnerUsers";

import BusinessOwnerStatistics
  from "./pages/businessOwner/BusinessOwnerStatistics";

import BusinessOwnerMusic
  from "./pages/businessOwner/BusinessOwnerMusic";

import BusinessOwnerSongs
  from "./pages/businessOwner/BusinessOwnerSongs";

import BusinessOwnerAlbums
  from "./pages/businessOwner/BusinessOwnerAlbums";

import BusinessOwnerArtists
  from "./pages/businessOwner/BusinessOwnerArtists";

import BusinessOwnerCategories
  from "./pages/businessOwner/BusinessOwnerCategories";

import BusinessOwnerMinistries
  from "./pages/businessOwner/BusinessOwnerMinistries";

import BusinessOwnerForgotPassword
  from "./pages/businessOwner/BusinessOwnerForgotPassword";


/* =========================================================
   USER HOME REDIRECT
=========================================================

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
     WAIT FOR AUTH
  ------------------------------------------------------- */

  if (loading) {

    return null;

  }


  /* -------------------------------------------------------
     LOGGED IN
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
     NOT LOGGED IN
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

    <PlayerProvider>

      <LikedSongsProvider>

        <NotificationsProvider>

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

                OUTSIDE AdminRoute
            ================================================= */}

            <Route
              path="/admin/login"
              element={
                <AdminLogin />
              }
            />


            {/* =================================================
                NORMAL KEERTHANA APP
            ================================================= */}

            <Route
              element={
                <AppLayout />
              }
            >


              {/* =================================================
                  ROOT
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
                  ALL SONGS
              ================================================= */}

              <Route
                path="/songs"
                element={
                  <AllSongs />
                }
              />


              {/* =================================================
                  SEARCH
              ================================================= */}

              <Route
                path="/search"
                element={
                  <Search />
                }
              />


              {/* =================================================
                  FAVORITES
              ================================================= */}

              <Route
                path="/favorites"
                element={
                  <Favorites />
                }
              />


              {/* =================================================
                  LIBRARY
              ================================================= */}

              <Route
                path="/library"
                element={
                  <Library />
                }
              />


              {/* =================================================
                  LIKED SONGS
              ================================================= */}

              <Route
                path="/liked-songs"
                element={
                  <LikedSongs />
                }
              />


              {/* =================================================
                  PLAYLISTS
              ================================================= */}

              <Route
                path="/playlists"
                element={
                  <Playlists />
                }
              />

              <Route
                path="/playlists/:id"
                element={
                  <PlaylistDetails />
                }
              />


              {/* =================================================
                  DOWNLOAD MANAGER
              ================================================= */}

              <Route
                path="/downloads"
                element={
                  <DownloadManager />
                }
              />


              {/* =================================================
                  ARTISTS
              ================================================= */}

              <Route
                path="/artists"
                element={
                  <Artists />
                }
              />

              <Route
                path="/artists/:id"
                element={
                  <ArtistDetails />
                }
              />


              {/* =================================================
                  ALBUMS
              ================================================= */}

              <Route
                path="/albums"
                element={
                  <Albums />
                }
              />

              <Route
                path="/albums/:id"
                element={
                  <AlbumDetails />
                }
              />


              {/* =================================================
                  SONG DETAILS
              ================================================= */}

              <Route
                path="/songs/:id"
                element={
                  <SongDetails />
                }
              />


              {/* =================================================
                  PREMIUM
              ================================================= */}

              <Route
                path="/premium"
                element={
                  <Premium />
                }
              />


              {/* =================================================
                  HISTORY
              ================================================= */}

              <Route
                path="/history"
                element={
                  <History />
                }
              />


              {/* =================================================
                  PROFILE
              ================================================= */}

              <Route
                path="/profile"
                element={
                  <Profile />
                }
              />


              {/* =================================================
                  NOTIFICATIONS
              ================================================= */}

              <Route
                path="/notifications"
                element={
                  <Notifications />
                }
              />


              {/* =================================================
                  KEERTHANA AI
              ================================================= */}

              <Route
                path="/keerthana-ai"
                element={
                  <KeerthanaAIPage />
                }
              />


              {/* =================================================
                  MOOD PLAYLISTS
              ================================================= */}

              <Route
                path="/mood-playlists"
                element={
                  <MoodPlaylists />
                }
              />


              {/* =================================================
                  MOOD SONGS
              ================================================= */}

              <Route
                path="/moods/:mood"
                element={
                  <MoodSongs />
                }
              />


              {/* =================================================
                  USER STATISTICS
              ================================================= */}

              <Route
                path="/statistics"
                element={
                  <Statistics />
                }
              />


              {/* =================================================
                  USER MINISTRIES
              ================================================= */}

              <Route
                path="/ministries"
                element={
                  <Ministries />
                }
              />

              <Route
                path="/ministries/:id"
                element={
                  <MinistryDetails />
                }
              />

            </Route>


            {/* =================================================
                PROTECTED ADMIN AREA
            ================================================= */}

            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminLayout />
                </AdminRoute>
              }
            >


              {/* =================================================
                  ADMIN DASHBOARD
              ================================================= */}

              <Route
                index
                element={
                  <AdminDashboard />
                }
              />


              {/* =================================================
                  ADMIN SONGS
              ================================================= */}

              <Route
                path="songs"
                element={
                  <ManageSongs />
                }
              />


              {/* =================================================
                  ADD SONG
              ================================================= */}

              <Route
                path="songs/add"
                element={
                  <AddSong />
                }
              />


              {/* =================================================
                  EDIT SONG
              ================================================= */}

              <Route
                path="songs/:id/edit"
                element={
                  <EditSong />
                }
              />


              {/* =================================================
                  ADMIN SONG REPORTS
              ================================================= */}

              <Route
                path="songs/reports"
                element={
                  <AdminSongReports />
                }
              />


              {/* =================================================
                  ADMIN ARTISTS
              ================================================= */}

              <Route
                path="artists"
                element={
                  <ManageArtists />
                }
              />


              {/* =================================================
                  ADMIN ALBUMS
              ================================================= */}

              <Route
                path="albums"
                element={
                  <ManageAlbums />
                }
              />


              {/* =================================================
                  ADMIN CATEGORIES
              ================================================= */}

              <Route
                path="categories"
                element={
                  <ManageCategories />
                }
              />


              {/* =================================================
                  ADMIN USERS
              ================================================= */}

              <Route
                path="users"
                element={
                  <ManageUsers />
                }
              />


              {/* =================================================
                  ADMIN MINISTRIES
              ================================================= */}

              <Route
                path="ministries"
                element={
                  <ManageMinistries />
                }
              />

            </Route>


            {/* =================================================
                ADMIN FORGOT PASSWORD

                OUTSIDE AdminRoute
            ================================================= */}

            <Route
              path="/admin/forgot-password"
              element={
                <AdminForgotPassword />
              }
            />


            {/* =================================================
                BUSINESS OWNER LOGIN

                OUTSIDE OwnerRoute
            ================================================= */}

            <Route
              path="/owner/login"
              element={
                <BusinessOwnerLogin />
              }
            />


            {/* =================================================
                BUSINESS OWNER FORGOT PASSWORD

                OUTSIDE OwnerRoute
            ================================================= */}

            <Route
              path="/owner/forgot-password"
              element={
                <BusinessOwnerForgotPassword />
              }
            />


            {/* =================================================
                BUSINESS OWNER DASHBOARD
            ================================================= */}

            <Route
              path="/owner/dashboard"
              element={
                <OwnerRoute>
                  <BusinessOwnerDashboard />
                </OwnerRoute>
              }
            />


            {/* =================================================
                BUSINESS OWNER USERS
            ================================================= */}

            <Route
              path="/owner/users"
              element={
                <OwnerRoute>
                  <BusinessOwnerUsers />
                </OwnerRoute>
              }
            />


            {/* =================================================
                BUSINESS OWNER STATISTICS
            ================================================= */}

            <Route
              path="/owner/statistics"
              element={
                <OwnerRoute>
                  <BusinessOwnerStatistics />
                </OwnerRoute>
              }
            />


            {/* =================================================
                BUSINESS OWNER MUSIC HOME
            ================================================= */}

            <Route
              path="/owner/music"
              element={
                <OwnerRoute>
                  <BusinessOwnerMusic />
                </OwnerRoute>
              }
            />


            {/* =================================================
                BUSINESS OWNER SONGS
            ================================================= */}

            <Route
              path="/owner/music/songs"
              element={
                <OwnerRoute>
                  <BusinessOwnerSongs />
                </OwnerRoute>
              }
            />


            {/* =================================================
                BUSINESS OWNER ALBUMS
            ================================================= */}

            <Route
              path="/owner/music/albums"
              element={
                <OwnerRoute>
                  <BusinessOwnerAlbums />
                </OwnerRoute>
              }
            />


            {/* =================================================
                BUSINESS OWNER ARTISTS
            ================================================= */}

            <Route
              path="/owner/music/artists"
              element={
                <OwnerRoute>
                  <BusinessOwnerArtists />
                </OwnerRoute>
              }
            />


            {/* =================================================
                BUSINESS OWNER CATEGORIES
            ================================================= */}

            <Route
              path="/owner/music/categories"
              element={
                <OwnerRoute>
                  <BusinessOwnerCategories />
                </OwnerRoute>
              }
            />


            {/* =================================================
                BUSINESS OWNER MINISTRIES
            ================================================= */}

            <Route
              path="/owner/music/ministries"
              element={
                <OwnerRoute>
                  <BusinessOwnerMinistries />
                </OwnerRoute>
              }
            />


          </Routes>

        </NotificationsProvider>

      </LikedSongsProvider>

    </PlayerProvider>

  );

}


export default App;

