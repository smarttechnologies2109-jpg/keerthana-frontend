
import { Capacitor } from "@capacitor/core";

import {
  AdMob,
  InterstitialAdPluginEvents,
} from "@capacitor-community/admob";

// =============================================
// KEERTHANA MUSIC - PRODUCTION INTERSTITIAL AD
// =============================================

const INTERSTITIAL_AD_ID =
  "ca-app-pub-4269202427991524/2814621082";

let isLoading = false;
let isLoaded = false;
let isShowing = false;
let isPreparingAgain = false;

let listenersInitialized = false;
let listenersPromise = null;

let loadedListener;
let failedListener;
let dismissedListener;
let failedShowListener;

// =============================================
// CHECK ANDROID NATIVE PLATFORM
// =============================================

function isAndroidNative() {
  return (
    Capacitor.isNativePlatform() &&
    Capacitor.getPlatform() === "android"
  );
}

// =============================================
// REGISTER AD EVENT LISTENERS
// =============================================

async function registerInterstitialListeners() {
  if (listenersInitialized) return;

  if (listenersPromise) {
    return listenersPromise;
  }

  listenersPromise = (async () => {
    try {
      loadedListener = await AdMob.addListener(
        InterstitialAdPluginEvents.Loaded,
        (info) => {
          isLoaded = true;
          isLoading = false;

          console.info(
            "[KEERTHANA Interstitial] Production ad loaded:",
            info
          );
        }
      );

      failedListener = await AdMob.addListener(
        InterstitialAdPluginEvents.FailedToLoad,
        (error) => {
          isLoaded = false;
          isLoading = false;

          console.error(
            "[KEERTHANA Interstitial] Production ad loading failed:",
            error
          );
        }
      );

      dismissedListener = await AdMob.addListener(
        InterstitialAdPluginEvents.Dismissed,
        () => {
          isShowing = false;
          isLoaded = false;

          console.info(
            "[KEERTHANA Interstitial] Production ad dismissed."
          );

          prepareNextInterstitial();
        }
      );

      failedShowListener = await AdMob.addListener(
        InterstitialAdPluginEvents.FailedToShow,
        (error) => {
          isShowing = false;
          isLoaded = false;

          console.error(
            "[KEERTHANA Interstitial] Production ad display failed:",
            error
          );

          prepareNextInterstitial();
        }
      );

      listenersInitialized = true;

      console.info(
        "[KEERTHANA Interstitial] Production listeners registered."
      );
    } catch (error) {
      listenersPromise = null;

      console.error(
        "[KEERTHANA Interstitial] Listener registration failed:",
        error
      );

      throw error;
    }
  })();

  return listenersPromise;
}

// =============================================
// PRELOAD PRODUCTION INTERSTITIAL
// =============================================

export async function preloadInterstitialAd() {
  if (!isAndroidNative()) {
    console.info(
      "[KEERTHANA Interstitial] Android native platform not detected."
    );

    return false;
  }

  if (isLoaded || isLoading) {
    return isLoaded;
  }

  isLoading = true;

  try {
    await registerInterstitialListeners();

    console.info(
      "[KEERTHANA Interstitial] Loading production ad..."
    );

    await AdMob.prepareInterstitial({
      adId: INTERSTITIAL_AD_ID,
      isTesting: false,
    });

    isLoaded = true;
    isLoading = false;

    console.info(
      "[KEERTHANA Interstitial] Production ad prepared successfully."
    );

    return true;
  } catch (error) {
    isLoaded = false;
    isLoading = false;

    console.error(
      "[KEERTHANA Interstitial] Production prepare error:",
      error
    );

    return false;
  }
}

// =============================================
// PREPARE NEXT AD AFTER DISMISSAL
// =============================================

async function prepareNextInterstitial() {
  if (isPreparingAgain) return;

  isPreparingAgain = true;

  try {
    await preloadInterstitialAd();
  } finally {
    isPreparingAgain = false;
  }
}

// =============================================
// SHOW PRODUCTION INTERSTITIAL
// =============================================

export async function showInterstitialAd() {
  if (!isAndroidNative()) {
    return false;
  }

  if (isShowing) {
    console.info(
      "[KEERTHANA Interstitial] Another ad is already showing."
    );

    return false;
  }

  if (!isLoaded) {
    const loaded = await preloadInterstitialAd();

    if (!loaded) {
      console.warn(
        "[KEERTHANA Interstitial] No production ad available."
      );

      return false;
    }
  }

  isShowing = true;
  isLoaded = false;

  try {
    console.info(
      "[KEERTHANA Interstitial] Showing production ad..."
    );

    await AdMob.showInterstitial();

    console.info(
      "[KEERTHANA Interstitial] Production show request completed."
    );

    return true;
  } catch (error) {
    isShowing = false;

    console.error(
      "[KEERTHANA Interstitial] Production show error:",
      error
    );

    prepareNextInterstitial();

    return false;
  }
}
