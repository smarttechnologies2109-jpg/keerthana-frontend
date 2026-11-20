
import { Capacitor } from "@capacitor/core";
import { AdMob } from "@capacitor-community/admob";

import {
  prepareReward,
} from "./rewardService";

// =====================================================
// KEERTHANA MUSIC — REWARDED AD CONFIGURATION
// =====================================================

const REWARDED_AD_UNIT_ID =
  "ca-app-pub-4269202427991524/8878973150";

// =====================================================
// PREPARE REWARDED AD
// =====================================================

export async function prepareRewardedAd() {
  if (
    !Capacitor.isNativePlatform() ||
    Capacitor.getPlatform() !== "android"
  ) {
    throw new Error(
      "Rewarded Ads are available only in the Android app."
    );
  }

  // Get a unique SSV customData value from the backend.
  const response = await prepareReward();

  const customData =
    response?.customData ||
    response?.data?.customData;

  if (!customData) {
    throw new Error(
      "Backend did not return reward verification data."
    );
  }

  // Prepare the Google Rewarded Ad.
  await AdMob.prepareRewardVideoAd({
    adId: REWARDED_AD_UNIT_ID,
    isTesting: false,
    ssv: {
      customData,
    },
  });

  return {
    customData,
    adUnitId: REWARDED_AD_UNIT_ID,
  };
}

// =====================================================
// SHOW REWARDED AD
// =====================================================

export async function showRewardedAd() {
  if (!Capacitor.isNativePlatform()) {
    throw new Error(
      "Rewarded Ads require the Android app."
    );
  }

  // The ad must be prepared before showing.
  const reward = await AdMob.showRewardVideoAd();

  return reward;
}
