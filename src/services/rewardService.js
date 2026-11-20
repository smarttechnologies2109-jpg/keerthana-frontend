
import API from "./api";

// =====================================================
// REWARDED AD SERVICE
// =====================================================

// Prepare a new rewarded ad session.
// Backend returns customData and adUnitId.
export const prepareReward = async () => {
  const response = await API.post(
    "/rewards/ad-free/prepare"
  );

  return response.data;
};

// Get the current user's ad-free reward status.
export const getAdFreeStatus = async () => {
  const response = await API.get(
    "/rewards/ad-free/status"
  );

  return response.data;
};
