
import {
  useState,
  useEffect,
  useRef,
} from "react";

import {
  Outlet,
  useLocation,
} from "react-router-dom";

import Sidebar from "./Sidebar";
import Header from "./Header";
import BottomNav from "./BottomNav";
import MusicPlayer from "./MusicPlayer";
import Footer from "./Footer";
import AdMobBanner from "./AdMobBanner";

import { usePlayer } from "../context/usePlayer";

import {
  preloadInterstitialAd,
  showInterstitialAd,
} from "../services/interstitialAds";

import "../assets/css/appLayout.css";

const INTERSTITIAL_PAGE_LIMIT = 4;
const INTERSTITIAL_COOLDOWN = 5 * 60 * 1000;

function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const location = useLocation();

  const { currentSong } = usePlayer();

  const previousPathRef = useRef(null);
  const navigationCountRef = useRef(0);
  const lastAdTimeRef = useRef(0);
  const showingAdRef = useRef(false);

  const toggleSidebar = () => {
    setSidebarOpen((previous) => !previous);
  };

  // =====================================================
  // PRELOAD INTERSTITIAL AD
  // =====================================================

  useEffect(() => {
    preloadInterstitialAd().catch((error) => {
      console.error(
        "[KEERTHANA Interstitial] Preload error:",
        error
      );
    });
  }, []);

  // =====================================================
  // PAGE NAVIGATION AND INTERSTITIAL FREQUENCY
  // =====================================================

  useEffect(() => {
    const mainContent =
      document.querySelector(".main-content");

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

    // Skip initial page load.
    if (previousPathRef.current === null) {
      previousPathRef.current = location.pathname;
      return;
    }

    // Ignore repeated route.
    if (previousPathRef.current === location.pathname) {
      return;
    }

    previousPathRef.current = location.pathname;

    // Count actual page transitions.
    navigationCountRef.current += 1;

    console.info(
      "[KEERTHANA Interstitial] Navigation count:",
      navigationCountRef.current
    );

    // Show only after every four page transitions.
    if (
      navigationCountRef.current %
        INTERSTITIAL_PAGE_LIMIT !==
      0
    ) {
      return;
    }

    // Never interrupt music playback or a loaded player.
    if (currentSong) {
      console.info(
        "[KEERTHANA Interstitial] Skipped because a song is loaded."
      );
      return;
    }

    // Prevent overlapping ads.
    if (showingAdRef.current) {
      return;
    }

    // Apply five-minute cooldown.
    const now = Date.now();

    if (
      now - lastAdTimeRef.current <
      INTERSTITIAL_COOLDOWN
    ) {
      console.info(
        "[KEERTHANA Interstitial] Skipped because of cooldown."
      );
      return;
    }

    showingAdRef.current = true;
    lastAdTimeRef.current = now;

    showInterstitialAd()
      .catch((error) => {
        console.error(
          "[KEERTHANA Interstitial] Display error:",
          error
        );
      })
      .finally(() => {
        showingAdRef.current = false;
      });

  }, [location.pathname, currentSong]);

  // =====================================================
  // APP LAYOUT
  // =====================================================

  return (
    <div className="app keerthana-app-layout">

      <Sidebar
        isOpen={sidebarOpen}
        onToggle={toggleSidebar}
      />

      <div className="app-body">

        <Header
          onToggleSidebar={toggleSidebar}
        />

        <main className="main-content">
          <Outlet />
        </main>

        <Footer />

      </div>

      {/* Native Android Banner Advertisement */}
      <AdMobBanner
        hasMiniPlayer={Boolean(currentSong)}
      />

      {/* Persistent Music Player */}
      <MusicPlayer />

      {/* Mobile Bottom Navigation */}
      <BottomNav />

    </div>
  );
}

export default AppLayout;
