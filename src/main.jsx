import React from "react";
import ReactDOM from "react-dom/client";

import {
  BrowserRouter,
} from "react-router-dom";

import App from "./App";

import {
  AuthProvider,
} from "./context/AuthContext";

import {
  LikedSongsProvider,
} from "./context/LikedSongsContext";

import {
  PlayerProvider,
} from "./context/PlayerContext";




ReactDOM.createRoot(
  document.getElementById("root")
).render(

  <React.StrictMode>

    <BrowserRouter>

      <AuthProvider>

        <LikedSongsProvider>

          <PlayerProvider>

            <App />

          </PlayerProvider>

        </LikedSongsProvider>

      </AuthProvider>

    </BrowserRouter>

  </React.StrictMode>

);