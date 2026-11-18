
import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";

import {
  AdMob,
  AdmobConsentStatus,
  BannerAdPosition,
  BannerAdPluginEvents,
  BannerAdSize,
} from "@capacitor-community/admob";

// =====================================================
// KEERTHANA MUSIC — PRODUCTION ADMOB BANNER
// =====================================================

// Your real KEERTHANA production banner unit ID
const PRODUCTION_BANNER_ID =
  "ca-app-pub-4269202427991524/8170074879";

let initializationPromise = null;

// =====================================================
// INITIALIZE ADMOB ONCE
// =====================================================

function initializeAdMobOnce() {
  if (!initializationPromise) {
    initializationPromise = AdMob.initialize().catch((error) => {
      initializationPromise = null;
      throw error;
    });
  }

  return initializationPromise;
}

// =====================================================
// UPDATE BANNER HEIGHT
// =====================================================

function setBannerHeight(height) {
  const value = Number.isFinite(Number(height))
    ? Math.max(0, Number(height))
    : 0;

  document.documentElement.style.setProperty(
    "--keerthana-admob-banner-height",
    `${value}px`
  );
}

// =====================================================
// ADMOB COMPONENT
// =====================================================

export default function AdMobBanner({
  hasMiniPlayer = false,
}) {
  const [adReady, setAdReady] = useState(false);

  // ===================================================
  // PLATFORM CHECK + CONSENT + INITIALIZATION
  // ===================================================

  useEffect(() => {
    console.log(
      "[KEERTHANA AdMob] Platform:",
      JSON.stringify({
        platform: Capacitor.getPlatform(),
        native: Capacitor.isNativePlatform(),
        admobPlugin: !!AdMob,
      })
    );

    if (
      !Capacitor.isNativePlatform() ||
      Capacitor.getPlatform() !== "android"
    ) {
      console.info(
        "[KEERTHANA AdMob] Android native platform not detected. Skipping banner."
      );

      return undefined;
    }

    let active = true;

    let sizeListener;
    let loadedListener;
    let failedListener;

    const initialize = async () => {
      try {
        // ---------------------------------------------
        // REGISTER BANNER EVENTS
        // ---------------------------------------------

        console.info(
          "[KEERTHANA AdMob] Registering listeners..."
        );

        sizeListener = await AdMob.addListener(
          BannerAdPluginEvents.SizeChanged,
          (size) => {
            console.info(
              "[KEERTHANA AdMob] Banner size:",
              JSON.stringify(size)
            );

            if (active) {
              setBannerHeight(size?.height);
            }
          }
        );

        loadedListener = await AdMob.addListener(
          BannerAdPluginEvents.Loaded,
          () => {
            console.info(
              "[KEERTHANA AdMob] Production banner loaded successfully."
            );
          }
        );

        failedListener = await AdMob.addListener(
          BannerAdPluginEvents.FailedToLoad,
          (error) => {
            console.error(
              "[KEERTHANA AdMob] Production banner failed:",
              error
            );
          }
        );

        // ---------------------------------------------
        // REQUEST USER CONSENT
        // ---------------------------------------------

        console.info(
          "[KEERTHANA AdMob] Requesting consent information..."
        );

        let consentInfo =
          await AdMob.requestConsentInfo();

        console.info(
          "[KEERTHANA AdMob] Consent information:",
          JSON.stringify(consentInfo)
        );

        if (
          consentInfo?.isConsentFormAvailable &&
          consentInfo?.status === AdmobConsentStatus.REQUIRED
        ) {
          console.info(
            "[KEERTHANA AdMob] Showing GDPR consent form..."
          );

          consentInfo = await AdMob.showConsentForm();
        }

        if (!active) return;

        if (!consentInfo?.canRequestAds) {
          console.warn(
            "[KEERTHANA AdMob] Ads cannot be requested because consent is not ready."
          );

          return;
        }

        // ---------------------------------------------
        // INITIALIZE GOOGLE MOBILE ADS
        // ---------------------------------------------

        console.info(
          "[KEERTHANA AdMob] Initializing Google Mobile Ads..."
        );

        await initializeAdMobOnce();

        if (!active) return;

        console.info(
          "[KEERTHANA AdMob] Production initialization successful."
        );

        setAdReady(true);
      } catch (error) {
        console.error(
          "[KEERTHANA AdMob] Initialization error:",
          error
        );
      }
    };

    initialize();

    // =================================================
    // CLEANUP
    // =================================================

    return () => {
      active = false;

      const cleanup = async () => {
        try {
          await Promise.all(
            [
              sizeListener,
              loadedListener,
              failedListener,
            ]
              .filter(Boolean)
              .map((listener) => listener.remove())
          );

          await AdMob.removeBanner();

          console.info(
            "[KEERTHANA AdMob] Banner removed."
          );
        } catch (error) {
          console.warn(
            "[KEERTHANA AdMob] Cleanup warning:",
            error
          );
        }

        setBannerHeight(0);
      };

      cleanup();
    };
  }, []);

  // ===================================================
  // SHOW PRODUCTION BANNER
  // ===================================================

  useEffect(() => {
    if (!adReady) return undefined;

    let active = true;

    const showProductionBanner = async () => {
      try {
        console.info(
          "[KEERTHANA AdMob] Requesting production banner..."
        );

        await AdMob.showBanner({
          adId: PRODUCTION_BANNER_ID,
          adSize: BannerAdSize.ADAPTIVE_BANNER,
          position: BannerAdPosition.BOTTOM_CENTER,

          // Keep the banner above the player and navigation.
          margin: hasMiniPlayer ? 210 : 82,

          // Real production ads, not test ads.
          isTesting: false,
        });

        if (active) {
          console.info(
            "[KEERTHANA AdMob] Production banner display requested successfully."
          );
        }
      } catch (error) {
        console.error(
          "[KEERTHANA AdMob] Production banner display error:",
          error
        );
      }
    };

    showProductionBanner();

    return () => {
      active = false;
    };
  }, [adReady, hasMiniPlayer]);

  return null;
}
