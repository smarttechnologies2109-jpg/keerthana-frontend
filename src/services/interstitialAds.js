
import { Capacitor } from "@capacitor/core";
import {
  AdMob,
  InterstitialAdPluginEvents,
} from "@capacitor-community/admob";

// KEERTHANA production interstitial ad unit.
const INTERSTITIAL_AD_ID = "ca-app-pub-4269202427991524/2814621082";

let isLoading = false;
let isLoaded = false;
let isShowing = false;

let listenersInitialized = false;
let listenersPromise = null;

let loadingPromise = null;
let resolveLoadingPromise = null;
let pendingShowResolve = null;

let loadTimeout = null;
let showTimeout = null;

const DEBUG = "[KEERTHANA_AD_DEBUG]";

const logInfo = (message, details) => {
  if (details === undefined) {
    console.info(`${DEBUG} ${message}`);
    return;
  }
  console.info(`${DEBUG} ${message}: ${JSON.stringify(details)}`);
};

const logWarn = (message, details) => {
  if (details === undefined) {
    console.warn(`${DEBUG} ${message}`);
    return;
  }
  console.warn(`${DEBUG} ${message}: ${JSON.stringify(details)}`);
};

const logError = (message, error) => {
  console.error(`${DEBUG} ${message}:`, error);
};

const isAndroidNative = () =>
  Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";

function finishLoading(success) {
  if (loadTimeout) {
    clearTimeout(loadTimeout);
    loadTimeout = null;
  }

  isLoading = false;
  isLoaded = Boolean(success);

  const resolve = resolveLoadingPromise;
  resolveLoadingPromise = null;

  logInfo("Interstitial load finished", {
    success: Boolean(success),
    isLoaded,
  });

  resolve?.(Boolean(success));
}

function finishShowing(success) {
  if (showTimeout) {
    clearTimeout(showTimeout);
    showTimeout = null;
  }

  isShowing = false;
  isLoaded = false;

  const resolve = pendingShowResolve;
  pendingShowResolve = null;

  logInfo("Interstitial show finished", { success: Boolean(success) });
  resolve?.(Boolean(success));

  // Prepare the next ad after this ad has closed or failed.
  // The shared loadingPromise prevents duplicate prepareInterstitial calls.
  if (isAndroidNative()) {
    preloadInterstitialAd().catch((error) => {
      logError("Next interstitial preload failed", error);
    });
  }
}

async function registerInterstitialListeners() {
  if (listenersInitialized) return true;
  if (listenersPromise) return listenersPromise;

  listenersPromise = (async () => {
    try {
      logInfo("Registering interstitial listeners");

      await AdMob.addListener(
        InterstitialAdPluginEvents.Loaded,
        (info) => {
          logInfo("Interstitial LOADED event", info);
          finishLoading(true);
        }
      );

      await AdMob.addListener(
        InterstitialAdPluginEvents.FailedToLoad,
        (error) => {
          logError("Interstitial FAILED_TO_LOAD event", error);
          finishLoading(false);
        }
      );

      await AdMob.addListener(
        InterstitialAdPluginEvents.Dismissed,
        () => {
          logInfo("Interstitial DISMISSED event received");
          finishShowing(true);
        }
      );

      await AdMob.addListener(
        InterstitialAdPluginEvents.FailedToShow,
        (error) => {
          logError("Interstitial FAILED_TO_SHOW event", error);
          finishShowing(false);
        }
      );

      listenersInitialized = true;
      logInfo("Interstitial listeners registered");
      return true;
    } catch (error) {
      listenersPromise = null;
      logError("Could not register interstitial listeners", error);
      throw error;
    }
  })();

  return listenersPromise;
}

export function preloadInterstitialAd() {
  logInfo("preloadInterstitialAd called", {
    isAndroidNative: isAndroidNative(),
    isLoading,
    isLoaded,
    isShowing,
    hasLoadingPromise: Boolean(loadingPromise),
  });

  if (!isAndroidNative()) {
    logWarn("Interstitial preload skipped: not Android native");
    return Promise.resolve(false);
  }

  if (isLoaded) {
    logInfo("Interstitial already loaded");
    return Promise.resolve(true);
  }

  // Every caller shares the exact same in-flight promise.
  // This prevents two simultaneous calls from preparing two ads and
  // overwriting each other's timeout/resolver.
  if (loadingPromise) {
    logInfo("Interstitial load already in progress; reusing existing promise");
    return loadingPromise;
  }

  let task;

  task = (async () => {
    try {
      await registerInterstitialListeners();

      if (isLoaded) return true;

      isLoading = true;
      logInfo("Preparing interstitial with AdMob", {
        adUnitId: INTERSTITIAL_AD_ID,
        isTesting: false,
      });

      const eventResult = new Promise((resolve) => {
        resolveLoadingPromise = resolve;

        loadTimeout = setTimeout(() => {
          logError("Interstitial load timed out", {
            timeoutMs: 20000,
          });
          finishLoading(false);
        }, 20000);
      });

      await AdMob.prepareInterstitial({
        adId: INTERSTITIAL_AD_ID,
        isTesting: false,
      });

      logInfo(
        "prepareInterstitial request accepted; waiting for Loaded/FailedToLoad event"
      );

      const loaded = await eventResult;
      logInfo("Interstitial preload result", { loaded, isLoaded });
      return loaded;
    } catch (error) {
      logError("Interstitial prepare failed", error);
      finishLoading(false);
      return false;
    } finally {
      isLoading = false;
      if (loadingPromise === task) {
        loadingPromise = null;
      }
    }
  })();

  loadingPromise = task;
  return task;
}

export async function showInterstitialAd() {
  logInfo("showInterstitialAd called", {
    isAndroidNative: isAndroidNative(),
    isLoaded,
    isLoading,
    isShowing,
  });

  if (!isAndroidNative()) {
    logWarn("Show skipped: not Android native");
    return false;
  }

  if (isShowing) {
    logWarn("Show skipped: an interstitial is already showing");
    return false;
  }

  if (!isLoaded) {
    logInfo("No preloaded ad; trying to preload now");
    const loaded = await preloadInterstitialAd();

    if (!loaded || !isLoaded) {
      logWarn("No interstitial available; continuing without ad", {
        loaded,
        isLoaded,
      });
      return false;
    }
  }

  await registerInterstitialListeners();

  isShowing = true;
  isLoaded = false;

  const dismissedPromise = new Promise((resolve) => {
    pendingShowResolve = resolve;

    // Never block music indefinitely if the SDK does not send a callback.
    showTimeout = setTimeout(() => {
      logError("Interstitial show timed out; playback will resume", {
        timeoutMs: 60000,
      });
      finishShowing(false);
    }, 60000);
  });

  try {
    logInfo("Calling AdMob.showInterstitial");
    await AdMob.showInterstitial();

    logInfo(
      "AdMob show request returned; waiting for Dismissed/FailedToShow event"
    );

    const shown = await dismissedPromise;
    logInfo("Interstitial show flow resolved", { shown });
    return shown;
  } catch (error) {
    logError("Interstitial show failed", error);
    finishShowing(false);
    return false;
  }
}

export function isInterstitialShowing() {
  return isShowing;
}
