import { useEffect } from "react";

import { App as CapacitorApp } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";

import { useLocation, useNavigate } from "react-router-dom";

import {
  collapseFullPlayerIfOpen,
} from "../utils/playerBackHandler";

export default function useAndroidBackButton() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
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

            // 1. Full Player open అయితే ముందుగా Mini Player‌కు రావాలి.
            const playerCollapsed = collapseFullPlayerIfOpen();

            if (playerCollapsed) {
              return;
            }

            const currentPath = location.pathname;

            // 2. Previous page‌కు navigate చేయాలి.
            if (
              canGoBack &&
              window.history.state?.idx > 0
            ) {
              navigate(-1);
              return;
            }

            // 3. Home కాకపోతే Home‌కు వెళ్లాలి.
            if (currentPath !== "/home") {
              navigate("/home", { replace: true });
              return;
            }

            // 4. Home‌లో కూడా Full Player లేకపోతే మాత్రమే exit.
            CapacitorApp.exitApp();
          }
        );

        listenerHandle = handle;

        if (!isActive) {
          await handle.remove();
        }
      } catch (error) {
        console.error(
          "[KEERTHANA] Android Back button error:",
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