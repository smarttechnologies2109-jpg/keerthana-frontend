
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App";

import { AuthProvider } from "./context/AuthContext";

import "./assets/css/player-mobile-overrides.css";
import "./assets/css/admob-layout.css";
import "./assets/css/brand-experience.css";
import "./assets/css/app-responsive-polish.css";
import "./assets/css/player-alignment-fix.css";
import "./assets/css/portal-color-system.css";

ReactDOM.createRoot(
  document.getElementById("root")
).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
