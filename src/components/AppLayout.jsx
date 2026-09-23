import { useState } from "react";
import { Outlet } from "react-router-dom";

import Sidebar from "./Sidebar";
import Header from "./Header";
import BottomNav from "./BottomNav";
import MusicPlayer from "./MusicPlayer";

import "../assets/css/appLayout.css";

function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen((previous) => !previous);
  };

  return (
    <div className="app">

      {/* =========================================
          SIDEBAR
      ========================================= */}

      <Sidebar
        isOpen={sidebarOpen}
        onToggle={toggleSidebar}
      />


      {/* =========================================
          APPLICATION AREA
      ========================================= */}

      <div className="app-body">

        {/* =====================================
            HEADER
        ===================================== */}

        <Header
          onToggleSidebar={toggleSidebar}
        />


        {/* =====================================
            PAGE CONTENT
        ===================================== */}

        <main className="main-content">
          <Outlet />
        </main>

      </div>


      {/* =========================================
          MUSIC PLAYER
      ========================================= */}

      <MusicPlayer />


      {/* =========================================
          MOBILE BOTTOM NAVIGATION
      ========================================= */}

      <BottomNav />

    </div>
  );
}

export default AppLayout;