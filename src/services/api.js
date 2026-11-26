
import axios from "axios";

// =====================================================
// KEERTHANA API CONFIGURATION
// Website + Capacitor Android
// =====================================================

const BASE_URL =
  "https://ke-de4d85674ebd473184155d3a955db0ba.ecs.ap-south-1.on.aws/api";

const ACCESS_TOKEN_KEY = "keerthana_token";
const REFRESH_TOKEN_KEY = "keerthana_refresh_token";
const USER_KEY = "user";

const REFRESH_EARLY_MS = 60 * 1000;
const RETRY_REFRESH_MS = 30 * 1000;

const API = axios.create({
  baseURL: BASE_URL,
  timeout: 60000,
  headers: {
    Accept: "application/json",
  },
});

// Separate API for refreshing tokens.
// Prevents infinite interceptor loops.

const refreshAPI = axios.create({
  baseURL: BASE_URL,
  timeout: 60000,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

// =====================================================
// REFRESH STATE
// =====================================================

let refreshPromise = null;
let refreshTimer = null;

// =====================================================
// TOKEN STORAGE
// =====================================================

const getStoredAccessToken = () =>
  localStorage.getItem(ACCESS_TOKEN_KEY);

const getStoredRefreshToken = () =>
  localStorage.getItem(REFRESH_TOKEN_KEY);

// =====================================================
// JWT EXPIRY
// =====================================================

function decodeJwtPayload(token) {
  try {
    const payloadPart = token.split(".")[1];

    if (!payloadPart) return null;

    const base64 = payloadPart
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const padded = base64.padEnd(
      Math.ceil(base64.length / 4) * 4,
      "="
    );

    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

function getAccessTokenExpiryMs(
  token = getStoredAccessToken()
) {
  if (!token) return null;

  const payload = decodeJwtPayload(token);

  return Number.isFinite(payload?.exp)
    ? payload.exp * 1000
    : null;
}

// =====================================================
// STOP REFRESH TIMER
// =====================================================

function stopRefreshTimer() {
  if (refreshTimer) {
    clearTimeout(refreshTimer);
    refreshTimer = null;
  }
}

// =====================================================
// CLEAR SESSION
// =====================================================

function clearUserSession() {
  stopRefreshTimer();

  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new Event("keerthana:session-expired")
    );
  }
}

// =====================================================
// SCHEDULE AUTOMATIC TOKEN REFRESH
// =====================================================

function scheduleTokenRefresh() {
  stopRefreshTimer();

  if (!getStoredRefreshToken()) return;

  const expiryMs = getAccessTokenExpiryMs();

  if (!expiryMs) {
    refreshTimer = setTimeout(
      refreshIfNeeded,
      1000
    );
    return;
  }

  const delay = Math.max(
    1000,
    expiryMs - Date.now() - REFRESH_EARLY_MS
  );

  refreshTimer = setTimeout(
    refreshIfNeeded,
    delay
  );
}

// Export this function for AuthContext.
// Call it immediately after login/session restoration.

export function startTokenRefresh() {
  scheduleTokenRefresh();
}

// =====================================================
// SAVE NEW TOKENS
// =====================================================

function saveTokens(accessToken, refreshToken) {
  if (!accessToken || !refreshToken) {
    throw new Error(
      "Refresh response did not contain both tokens."
    );
  }

  localStorage.setItem(
    ACCESS_TOKEN_KEY,
    accessToken
  );

  localStorage.setItem(
    REFRESH_TOKEN_KEY,
    refreshToken
  );

  scheduleTokenRefresh();
}

// =====================================================
// REFRESH ACCESS TOKEN
// =====================================================

export async function refreshAccessToken() {
  const usedRefreshToken =
    getStoredRefreshToken();

  if (!usedRefreshToken) {
    const error = new Error(
      "Refresh token not found."
    );

    error.code = "NO_REFRESH_TOKEN";

    throw error;
  }

  try {
    const response = await refreshAPI.post(
      "/auth/refresh",
      {
        refreshToken: usedRefreshToken,
      }
    );

    const data = response.data || {};

    const accessToken =
      data.accessToken || data.token;

    const newRefreshToken =
      data.refreshToken;

    saveTokens(
      accessToken,
      newRefreshToken
    );

    return accessToken;

  } catch (error) {

    // Handle refresh-token rotation from
    // another browser tab.

    if (error.response?.status === 401) {
      const latestRefreshToken =
        getStoredRefreshToken();

      const latestAccessToken =
        getStoredAccessToken();

      if (
        latestRefreshToken &&
        latestRefreshToken !== usedRefreshToken &&
        latestAccessToken
      ) {
        scheduleTokenRefresh();

        return latestAccessToken;
      }
    }

    throw error;
  }
}

// =====================================================
// SINGLE REFRESH REQUEST
// Prevent multiple simultaneous refresh requests.
// =====================================================

export async function getFreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = refreshAccessToken()
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

// =====================================================
// CHECK IF TOKEN NEEDS REFRESHING
// =====================================================

async function refreshIfNeeded() {
  const refreshToken =
    getStoredRefreshToken();

  if (!refreshToken) return;

  const accessToken =
    getStoredAccessToken();

  const expiryMs =
    getAccessTokenExpiryMs(accessToken);

  const shouldRefresh =
    !accessToken ||
    !expiryMs ||
    expiryMs - Date.now() <= REFRESH_EARLY_MS;

  if (!shouldRefresh) {
    scheduleTokenRefresh();
    return;
  }

  try {
    await getFreshAccessToken();

    console.log(
      "KEERTHANA session automatically renewed."
    );

  } catch (error) {
    const status = error.response?.status;

    console.error(
      "Scheduled token refresh failed:",
      status || error.code || error.message
    );

    // Only invalidate a definitively rejected session.

    if (status === 401) {
      clearUserSession();
      return;
    }

    // Network/server failures are temporary.
    // Preserve the session and try again.

    if (getStoredRefreshToken()) {
      stopRefreshTimer();

      refreshTimer = setTimeout(
        refreshIfNeeded,
        RETRY_REFRESH_MS
      );
    }
  }
}

// =====================================================
// APP RESUME HANDLING
// Website + Android
// =====================================================

function handleAppResume() {
  refreshIfNeeded();
}

if (typeof window !== "undefined") {
  window.addEventListener(
    "focus",
    handleAppResume
  );

  window.addEventListener(
    "pageshow",
    handleAppResume
  );

  window.addEventListener(
    "storage",
    (event) => {
      if (
        event.key === ACCESS_TOKEN_KEY ||
        event.key === REFRESH_TOKEN_KEY
      ) {
        scheduleTokenRefresh();
      }
    }
  );
}

if (typeof document !== "undefined") {
  document.addEventListener(
    "visibilitychange",
    () => {
      if (
        document.visibilityState === "visible"
      ) {
        handleAppResume();
      }
    }
  );
}

// Restore timer when API module loads.

if (typeof window !== "undefined") {
  scheduleTokenRefresh();
}

// =====================================================
// REQUEST INTERCEPTOR
// Attach current access token automatically.
// =====================================================

API.interceptors.request.use(
  (config) => {
    const token = getStoredAccessToken();

    config.headers = config.headers || {};

    if (token) {
      config._keerthanaHadAuthToken = true;

      if (
        typeof config.headers.set === "function"
      ) {
        config.headers.set(
          "Authorization",
          `Bearer ${token}`
        );
      } else {
        config.headers.Authorization =
          `Bearer ${token}`;
      }
    }

    // Start/recheck timer after login or session save.
    if (getStoredRefreshToken()) {
      scheduleTokenRefresh();
    }

    // =================================================
    // MULTIPART FORM DATA
    // Important for S3 image uploads.
    // =================================================

    const isFormData =
      typeof FormData !== "undefined" &&
      config.data instanceof FormData;

    if (isFormData) {
      if (
        typeof config.headers.delete === "function"
      ) {
        config.headers.delete("Content-Type");
      } else {
        delete config.headers["Content-Type"];
        delete config.headers["content-type"];
      }
    }

    // =================================================
    // JSON REQUESTS
    // =================================================

    else if (config.data !== undefined) {
      if (
        typeof config.headers.set === "function"
      ) {
        config.headers.set(
          "Content-Type",
          "application/json"
        );
      } else {
        config.headers["Content-Type"] =
          "application/json";
      }
    }

    return config;
  },

  (error) => Promise.reject(error)
);

// =====================================================
// RESPONSE INTERCEPTOR
// Automatic refresh + API retry.
// =====================================================

API.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    if (!originalRequest) {
      return Promise.reject(error);
    }

    // =================================================
    // TIMEOUT / NETWORK ERRORS
    // =================================================

    if (
      error.code === "ECONNABORTED" ||
      !error.response
    ) {
      console.error(
        "KEERTHANA API network/timeout error:",
        originalRequest.url,
        error.message
      );

      return Promise.reject(error);
    }

    const status = error.response.status;

    const requestUrl =
      originalRequest.url || "";

    const isRefreshRequest =
      requestUrl.includes("/auth/refresh");

    const isAuthRequest =
      /\/auth\/(login|register|admin\/login|owner\/login)/i
        .test(requestUrl);

    // =================================================
    // ONLY HANDLE ELIGIBLE 401 RESPONSES
    // =================================================

    if (
      status !== 401 ||
      originalRequest._retry ||
      isRefreshRequest ||
      isAuthRequest ||
      !originalRequest._keerthanaHadAuthToken
    ) {
      return Promise.reject(error);
    }

    const existingRefreshToken =
      getStoredRefreshToken();

    if (!existingRefreshToken) {
      clearUserSession();

      return Promise.reject(error);
    }

    // Prevent infinite retries.

    originalRequest._retry = true;

    try {
      const newAccessToken =
        await getFreshAccessToken();

      originalRequest.headers =
        originalRequest.headers || {};

      if (
        typeof originalRequest.headers.set === "function"
      ) {
        originalRequest.headers.set(
          "Authorization",
          `Bearer ${newAccessToken}`
        );
      } else {
        originalRequest.headers.Authorization =
          `Bearer ${newAccessToken}`;
      }

      // Retry the original API request once.

      return API(originalRequest);

    } catch (refreshError) {
      const refreshStatus =
        refreshError.response?.status;

      console.error(
        "Automatic refresh failed:",
        refreshStatus || refreshError.code || "",
        refreshError.response?.data ||
          refreshError.message
      );

      // Clear only when refresh token is rejected.

      if (refreshStatus === 401) {
        clearUserSession();
      }

      return Promise.reject(refreshError);
    }
  }
);

// =====================================================
// EXPORT
// =====================================================

export default API;
