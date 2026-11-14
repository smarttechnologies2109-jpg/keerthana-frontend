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

  // Scroll the page content to the top whenever the route changes.
  useEffect(() => {
    const mainContent = document.querySelector(".main-content");

    if (mainContent) {
      mainContent.scrollTo({
        top: 0,
        left: 0,
        behavior: "auto",
      });
    }

    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "auto",
    });
  }, [location.pathname]);

  return (
    <div className="app keerthana-app-layout">
      <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />

      <div className="app-body">
        <Header onToggleSidebar={toggleSidebar} />

        <main className="main-content">
          <Outlet />
        </main>

        <Footer />
      </div>

      {/* Persistent player remains mounted while navigating between pages. */}
      <MusicPlayer />

      {/* Keep mobile navigation mounted above both player modes. */}
      <BottomNav />
    </div>
  );
}

export default AppLayout;
