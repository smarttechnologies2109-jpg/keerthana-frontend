
import {
  Routes,
  Route,
} from "react-router-dom";


/* =========================================================
   LAYOUTS
========================================================= */

import AppLayout
  from "./components/AppLayout";

import AdminLayout
  from "./components/admin/AdminLayout";

import AdminRoute
  from "./components/admin/AdminRoute";


/* =========================================================
   AUTH
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

  import KeerthanaAIPage from "./pages/KeerthanaAI";

  import MoodPlaylists from "./pages/MoodPlaylists";

import Statistics from "./pages/Statistics";
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
          This MUST be OUTSIDE AdminRoute.
          Otherwise unauthenticated admins will be
          redirected to the normal user login.
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

        <Route
          path="/"
          element={
            <Home />
          }
        />

        <Route
          path="/search"
          element={
            <Search />
          }
        />

        <Route
          path="/library"
          element={
            <Library />
          }
        />

        <Route
          path="/liked-songs"
          element={
            <LikedSongs />
          }
        />

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

        <Route
          path="/songs/:id"
          element={
            <SongDetails />
          }
        />

        <Route
          path="/premium"
          element={
            <Premium />
          }
        />

        <Route
          path="/history"
          element={
            <History />
          }
        />

        <Route
          path="/profile"
          element={
            <Profile />
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

        {/* ==============================
            DASHBOARD
        ============================== */}

        <Route
          index
          element={
            <AdminDashboard />
          }
        />


        {/* ==============================
            SONGS
        ============================== */}

        <Route
          path="songs"
          element={
            <ManageSongs />
          }
        />

        <Route
          path="songs/add"
          element={
            <AddSong />
          }
        />

        <Route
          path="songs/:id/edit"
          element={
            <EditSong />
          }
        />


        {/* ==============================
            ARTISTS
        ============================== */}

        <Route
          path="artists"
          element={
            <ManageArtists />
          }
        />


        {/* ==============================
            ALBUMS
        ============================== */}

        <Route
          path="albums"
          element={
            <ManageAlbums />
          }
        />


        {/* ==============================
            CATEGORIES
        ============================== */}

        <Route
          path="categories"
          element={
            <ManageCategories />
          }
        />


        {/* ==============================
            USERS
        ============================== */}

        <Route
          path="users"
          element={
            <ManageUsers />
          }
        />

      </Route>
<Route
  path="/keerthana-ai"
  element={<KeerthanaAIPage />}
/>
<Route
  path="/mood-playlists"
  element={<MoodPlaylists />}
/>



<Route
  path="/statistics"
  element={<Statistics />}
/>

    </Routes>

  );

}


export default App;

