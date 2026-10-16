
import { useEffect } from "react";
import { App as CapacitorApp } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { useLocation, useNavigate } from "react-router-dom";

export default function useAndroidBackButton() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Only handle the Android hardware Back button.
    if (Capacitor.getPlatform() !== "android") {
      return;
    }

    let isActive = true;
    let listenerHandle = null;

    const registerBackButton = async () => {
      try {
        const handle = await CapacitorApp.addListener(
          "backButton",
          ({ canGoBack }) => {
            if (!isActive) return;

            const currentPath = location.pathname;

            // Navigate to the previous page when possible.
            if (canGoBack && window.history.state?.idx > 0) {
              navigate(-1);
              return;
            }

            // Return to Home from other pages.
            if (currentPath !== "/home") {
              navigate("/home", { replace: true });
              return;
            }

            // Exit only when already on Home.
            CapacitorApp.exitApp();
          }
        );

        listenerHandle = handle;

        // Handles cleanup if the effect unmounts before registration finishes.
        if (!isActive) {
          await handle.remove();
        }
      } catch (error) {
        console.error(
          "Failed to register Android Back button:",
          error
        );
      }
    };

    registerBackButton();

    return () => {
      isActive = false;

      if (listenerHandle) {
        listenerHandle.remove();
        listenerHandle = null;
      }
    };
  }, [location.pathname, navigate]);
}
