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
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={toggleSidebar}
      />

      <div className="app-body">
        <Header onToggleSidebar={toggleSidebar} />

        <main className="main-content">
          <Outlet />
        </main>
      </div>

      {/* Persistent player across normal user pages */}
      <MusicPlayer />

      {/* Mobile navigation */}
      <BottomNav />
    </div>
  );
}

export default AppLayout;