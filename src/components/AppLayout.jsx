
import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";

import Sidebar from "./Sidebar";
import Header from "./Header";
import BottomNav from "./BottomNav";
import MusicPlayer from "./MusicPlayer";
import Footer from "./Footer";

import "../assets/css/appLayout.css";

function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const toggleSidebar = () => {
    setSidebarOpen((previous) => !previous);
  };

  // Scroll to top whenever the route changes
  useEffect(() => {
    // Scroll the main content area, if it has its own scrollbar
    const mainContent = document.querySelector(".main-content");

    if (mainContent) {
      mainContent.scrollTo({
        top: 0,
        left: 0,
        behavior: "auto",
      });
    }

    // Also scroll the browser window to the top
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "auto",
    });
  }, [location.pathname]);

  return (
    <div className="app">

      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={toggleSidebar}
      />

      <div className="app-body">

        {/* Header */}
        <Header onToggleSidebar={toggleSidebar} />

        {/* Page Content */}
        <main className="main-content">
          <Outlet />
        </main>

        {/* Public Footer */}
        <Footer />

      </div>

      {/* Persistent Music Player */}
      <MusicPlayer />

      {/* Mobile Navigation */}
      <BottomNav />

    </div>
  );
}

export default AppLayout;
