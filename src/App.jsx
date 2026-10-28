
import React from "react";
import {
  Navigate,
  Routes,
  Route,
} from "react-router-dom";

/* =========================================================
   PLAYER
========================================================= */

import { PlayerProvider } from "./context/PlayerContext";

/* =========================================================
   LIKED SONGS
========================================================= */

import { LikedSongsProvider } from "./context/LikedSongsContext";

/* =========================================================
   NOTIFICATIONS
========================================================= */

import { NotificationsProvider } from "./context/NotificationsContext";

/* =========================================================
   AUTH
========================================================= */

import { useAuth } from "./context/AuthContext";

/* =========================================================
   LAYOUTS
========================================================= */

import AppLayout from "./components/AppLayout";
import AdminLayout from "./components/admin/AdminLayout";
import AdminRoute from "./components/admin/AdminRoute";
import OwnerRoute from "./components/businessOwner/OwnerRoute";

/* =========================================================
   AUTH PAGES
========================================================= */

import Login from "./pages/Login";
import Register from "./pages/Register";
import AdminLogin from "./pages/admin/AdminLogin";

/* =========================================================
   USER PAGES
========================================================= */

import Home from "./pages/Home";
import Search from "./pages/Search";
import Library from "./pages/Library";
import LikedSongs from "./pages/LikedSongs";
import Playlists from "./pages/Playlists";
import PlaylistDetails from "./pages/PlaylistDetails";
import Artists from "./pages/Artists";
import ArtistDetails from "./pages/ArtistDetails";
import Albums from "./pages/Albums";
import AlbumDetails from "./pages/AlbumDetails";
import SongDetails from "./pages/SongDetails";
import Premium from "./pages/Premium";
import History from "./pages/History";
import Profile from "./pages/Profile";
import KeerthanaAIPage from "./pages/KeerthanaAI";
import MoodPlaylists from "./pages/MoodPlaylists";
import MoodSongs from "./pages/MoodSongs";
import Statistics from "./pages/Statistics";
import Ministries from "./pages/Ministries";
import MinistryDetails from "./pages/MinistryDetails";
import Categories from "./pages/Categories";
import DownloadManager from "./pages/DownloadManager";
import AllSongs from "./pages/AllSongs";
import Notifications from "./pages/Notifications";
import Favorites from "./pages/Favorites";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import RecentlyAdded from "./pages/RecentlyAdded";

/* =========================================================
   ADMIN PAGES
========================================================= */

import AdminDashboard from "./pages/admin/AdminDashboard";
import ManageSongs from "./pages/admin/ManageSongs";
import AddSong from "./pages/admin/AddSong";
import EditSong from "./pages/admin/EditSong";
import ManageArtists from "./pages/admin/ManageArtists";
import ManageAlbums from "./pages/admin/ManageAlbums";
import ManageCategories from "./pages/admin/ManageCategories";
import ManageUsers from "./pages/admin/ManageUsers";
import ManageMinistries from "./pages/admin/ManageMinistries";
import AdminForgotPassword from "./pages/admin/AdminForgotPassword";
import AdminSongReports from "./pages/admin/AdminSongReports";

/* =========================================================
   BUSINESS OWNER PAGES
========================================================= */

import BusinessOwnerLogin from "./pages/businessOwner/BusinessOwnerLogin";
import BusinessOwnerDashboard from "./pages/businessOwner/BusinessOwnerDashboard";
import BusinessOwnerUsers from "./pages/businessOwner/BusinessOwnerUsers";
import BusinessOwnerStatistics from "./pages/businessOwner/BusinessOwnerStatistics";
import BusinessOwnerMusic from "./pages/businessOwner/BusinessOwnerMusic";
import BusinessOwnerSongs from "./pages/businessOwner/BusinessOwnerSongs";
import BusinessOwnerAlbums from "./pages/businessOwner/BusinessOwnerAlbums";
import BusinessOwnerArtists from "./pages/businessOwner/BusinessOwnerArtists";
import BusinessOwnerCategories from "./pages/businessOwner/BusinessOwnerCategories";
import BusinessOwnerMinistries from "./pages/businessOwner/BusinessOwnerMinistries";
import BusinessOwnerForgotPassword from "./pages/businessOwner/BusinessOwnerForgotPassword";
import CategoryDetails from "./pages/CategoryDetails";

/* =========================================================
   ANDROID BACK BUTTON
========================================================= */

import useAndroidBackButton from "./hooks/useAndroidBackButton";

function AndroidBackButtonHandler() {
  useAndroidBackButton();
  return null;
}

/* =========================================================
   USER HOME REDIRECT

   "/" -> "/login" when logged out
   "/" -> "/home" when logged in
========================================================= */

function UserHomeRedirect() {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (user) {
    return <Navigate to="/home" replace />;
  }

  return <Navigate to="/login" replace />;
}

/* =========================================================
   APP
========================================================= */

function App() {
  return (
    <PlayerProvider>
      <LikedSongsProvider>
        <NotificationsProvider>
          <AndroidBackButtonHandler />

          <Routes>
            {/* =============================================
                USER AUTHENTICATION
            ============================================= */}

            <Route
              path="/login"
              element={<Login />}
            />

            <Route
              path="/register"
              element={<Register />}
            />

            {/* =============================================
                ADMIN LOGIN
            ============================================= */}

            <Route
              path="/admin/login"
              element={<AdminLogin />}
            />

            {/* =============================================
                NORMAL KEERTHANA MUSIC APP
            ============================================= */}

            <Route element={<AppLayout />}>
              {/* ROOT */}

              <Route
                path="/"
                element={<UserHomeRedirect />}
              />

              {/* HOME */}

              <Route
                path="/home"
                element={<Home />}
              />

              {/* ALL SONGS */}

              <Route
                path="/songs"
                element={<AllSongs />}
              />

              {/* SONG DETAILS */}

              <Route
                path="/songs/:id"
                element={<SongDetails />}
              />

              {/* SEARCH */}

              <Route
                path="/search"
                element={<Search />}
              />

              {/* LIBRARY */}

              <Route
                path="/library"
                element={<Library />}
              />

              {/* LIKED SONGS */}

              <Route
                path="/liked-songs"
                element={<LikedSongs />}
              />

              {/* FAVORITES */}

              <Route
                path="/favorites"
                element={<Favorites />}
              />

              {/* PLAYLISTS */}

              <Route
                path="/playlists"
                element={<Playlists />}
              />

              <Route
                path="/playlists/:id"
                element={<PlaylistDetails />}
              />

              {/* DOWNLOADS */}

              <Route
                path="/downloads"
                element={<DownloadManager />}
              />

              {/* ARTISTS */}

              <Route
                path="/artists"
                element={<Artists />}
              />

              <Route
                path="/artists/:id"
                element={<ArtistDetails />}
              />

              {/* ALBUMS */}

              <Route
                path="/albums"
                element={<Albums />}
              />

              <Route
                path="/albums/:id"
                element={<AlbumDetails />}
              />

              {/* =============================================
                  MINISTRIES
              ============================================= */}

              <Route
                path="/ministries"
                element={<Ministries />}
              />

              <Route
                path="/ministries/:id"
                element={<MinistryDetails />}
              />

              {/* =============================================
                  CATEGORIES
                  Sidebar destination: /categories
              ============================================= */}

              <Route
                path="/categories"
                element={<Categories />}
              />
               
               <Route
  path="/categories/:id"
  element={<CategoryDetails />}
/>
              {/* RECENTLY ADDED */}

              <Route
                path="/recently-added"
                element={<RecentlyAdded />}
              />

              {/* MOOD PLAYLISTS */}

              <Route
                path="/mood-playlists"
                element={<MoodPlaylists />}
              />

              {/* MOOD SONGS */}

              <Route
                path="/moods/:mood"
                element={<MoodSongs />}
              />

              {/* HISTORY */}

              <Route
                path="/history"
                element={<History />}
              />

              {/* STATISTICS */}

              <Route
                path="/statistics"
                element={<Statistics />}
              />

              {/* NOTIFICATIONS */}

              <Route
                path="/notifications"
                element={<Notifications />}
              />

              {/* KEERTHANA AI */}

              <Route
                path="/keerthana-ai"
                element={<KeerthanaAIPage />}
              />

              {/* PROFILE */}

              <Route
                path="/profile"
                element={<Profile />}
              />

              {/* PREMIUM */}

              <Route
                path="/premium"
                element={<Premium />}
              />

              {/* PRIVACY POLICY */}

              <Route
                path="/privacy-policy"
                element={<PrivacyPolicy />}
              />
            </Route>

            {/* =============================================
                PROTECTED ADMIN AREA
            ============================================= */}

            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminLayout />
                </AdminRoute>
              }
            >
              <Route
                index
                element={<AdminDashboard />}
              />

              <Route
                path="songs"
                element={<ManageSongs />}
              />

              <Route
                path="songs/add"
                element={<AddSong />}
              />

              <Route
                path="songs/:id/edit"
                element={<EditSong />}
              />

              <Route
                path="songs/reports"
                element={<AdminSongReports />}
              />

              <Route
                path="artists"
                element={<ManageArtists />}
              />

              <Route
                path="albums"
                element={<ManageAlbums />}
              />

              <Route
                path="categories"
                element={<ManageCategories />}
              />

              <Route
                path="users"
                element={<ManageUsers />}
              />

              <Route
                path="ministries"
                element={<ManageMinistries />}
              />
            </Route>

            {/* ADMIN FORGOT PASSWORD */}

            <Route
              path="/admin/forgot-password"
              element={<AdminForgotPassword />}
            />

            {/* =============================================
                BUSINESS OWNER AUTHENTICATION
            ============================================= */}

            <Route
              path="/owner/login"
              element={<BusinessOwnerLogin />}
            />

            <Route
              path="/owner/forgot-password"
              element={<BusinessOwnerForgotPassword />}
            />

            {/* =============================================
                BUSINESS OWNER PROTECTED PAGES
            ============================================= */}

            <Route
              path="/owner/dashboard"
              element={
                <OwnerRoute>
                  <BusinessOwnerDashboard />
                </OwnerRoute>
              }
            />

            <Route
              path="/owner/users"
              element={
                <OwnerRoute>
                  <BusinessOwnerUsers />
                </OwnerRoute>
              }
            />

            <Route
              path="/owner/statistics"
              element={
                <OwnerRoute>
                  <BusinessOwnerStatistics />
                </OwnerRoute>
              }
            />

            <Route
              path="/owner/music"
              element={
                <OwnerRoute>
                  <BusinessOwnerMusic />
                </OwnerRoute>
              }
            />

            <Route
              path="/owner/music/songs"
              element={
                <OwnerRoute>
                  <BusinessOwnerSongs />
                </OwnerRoute>
              }
            />

            <Route
              path="/owner/music/albums"
              element={
                <OwnerRoute>
                  <BusinessOwnerAlbums />
                </OwnerRoute>
              }
            />

            <Route
              path="/owner/music/artists"
              element={
                <OwnerRoute>
                  <BusinessOwnerArtists />
                </OwnerRoute>
              }
            />

            <Route
              path="/owner/music/categories"
              element={
                <OwnerRoute>
                  <BusinessOwnerCategories />
                </OwnerRoute>
              }
            />

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
