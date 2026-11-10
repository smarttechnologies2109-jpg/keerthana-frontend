
import axios from "axios";

// =====================================================
// API CONFIGURATION
// =====================================================

const BASE_URL =
  "https://ke-de4d85674ebd473184155d3a955db0ba.ecs.ap-south-1.on.aws/api";

const API = axios.create({
  baseURL: BASE_URL,
  timeout: 60000,
  headers: {
    Accept: "application/json",
  },
});

// Separate instance for refresh requests.
// Prevents refresh requests from entering API interceptors.
const refreshAPI = axios.create({
  baseURL: BASE_URL,
  timeout: 60000,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

// =====================================================
// REFRESH PROMISE
// =====================================================

let refreshPromise = null;

// =====================================================
// CLEAR USER SESSION
// =====================================================

function clearUserSession() {
  localStorage.removeItem("keerthana_token");
  localStorage.removeItem("keerthana_refresh_token");
  localStorage.removeItem("user");

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new Event("keerthana:session-expired")
    );
  }
}

// =====================================================
// SAVE TOKENS
// =====================================================

function saveTokens(accessToken, refreshToken) {
  if (!accessToken || !refreshToken) {
    throw new Error(
      "Refresh response did not contain both tokens."
    );
  }

  localStorage.setItem(
    "keerthana_token",
    accessToken
  );

  localStorage.setItem(
    "keerthana_refresh_token",
    refreshToken
  );
}

// =====================================================
// REFRESH ACCESS TOKEN
// =====================================================

export async function refreshAccessToken() {
  const refreshToken = localStorage.getItem(
    "keerthana_refresh_token"
  );

  if (!refreshToken) {
    const error = new Error(
      "Refresh token not found."
    );

    error.code = "NO_REFRESH_TOKEN";

    throw error;
  }

  const response = await refreshAPI.post(
    "/auth/refresh",
    {
      refreshToken,
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
}

// =====================================================
// GET FRESH ACCESS TOKEN
// PREVENTS MULTIPLE SIMULTANEOUS REFRESH REQUESTS
// =====================================================

export async function getFreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = refreshAccessToken().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

// =====================================================
// REQUEST INTERCEPTOR
// ATTACH TOKEN + HANDLE FORM DATA
// =====================================================

API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(
      "keerthana_token"
    );

    config.headers = config.headers || {};

    // Attach access token.
    if (token) {
      if (typeof config.headers.set === "function") {
        config.headers.set(
          "Authorization",
          `Bearer ${token}`
        );
      } else {
        config.headers.Authorization =
          `Bearer ${token}`;
      }
    }

    // -------------------------------------------------
    // MULTIPART FORM DATA
    // IMPORTANT FOR S3 IMAGE UPLOADS
    // -------------------------------------------------

    const isFormData =
      typeof FormData !== "undefined" &&
      config.data instanceof FormData;

    if (isFormData) {
      // Browser/Axios must generate the multipart boundary.
      if (typeof config.headers.delete === "function") {
        config.headers.delete("Content-Type");
      } else {
        delete config.headers["Content-Type"];
        delete config.headers["content-type"];
      }
    }

    // -------------------------------------------------
    // JSON REQUESTS
    // -------------------------------------------------

    else if (config.data !== undefined) {
      if (typeof config.headers.set === "function") {
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
// AUTOMATIC TOKEN REFRESH
// =====================================================

API.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    if (!originalRequest) {
      return Promise.reject(error);
    }

    // -------------------------------------------------
    // TIMEOUT ERROR
    // -------------------------------------------------

    if (error.code === "ECONNABORTED") {
      console.error(
        "API request timed out:",
        originalRequest.url
      );

      return Promise.reject(error);
    }

    // -------------------------------------------------
    // NETWORK ERROR
    // -------------------------------------------------

    if (!error.response) {
      console.error(
        "API network error:",
        error.message,
        originalRequest.url
      );

      return Promise.reject(error);
    }

    const status = error.response.status;

    console.error(
      "API response error:",
      status,
      originalRequest.url,
      error.response.data
    );

    // -------------------------------------------------
    // CHECK AUTH REQUESTS
    // -------------------------------------------------

    const requestUrl = originalRequest.url || "";

    const isRefreshRequest =
      requestUrl.includes("/auth/refresh");

    const isAuthRequest =
      /\/auth\/(login|register|admin\/login|owner\/login)/i.test(
        requestUrl
      );

    // -------------------------------------------------
    // ONLY REFRESH ELIGIBLE 401 REQUESTS
    // -------------------------------------------------

    if (
      status !== 401 ||
      originalRequest._retry ||
      isRefreshRequest ||
      isAuthRequest
    ) {
      return Promise.reject(error);
    }

    // -------------------------------------------------
    // CHECK REFRESH TOKEN
    // -------------------------------------------------

    const existingRefreshToken =
      localStorage.getItem(
        "keerthana_refresh_token"
      );

    // Admin/owner legacy sessions may not have
    // refresh tokens. Preserve their session.
    if (!existingRefreshToken) {
      return Promise.reject(error);
    }

    // Prevent infinite retry loops.
    originalRequest._retry = true;

    try {
      // IMPORTANT:
      // Call getFreshAccessToken(), not refreshPromise.
      // This creates the refresh request when necessary
      // and shares it across simultaneous 401 responses.

      const newAccessToken =
        await getFreshAccessToken();

      // Update original request authorization.
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

      // Retry original request exactly once.
      return API(originalRequest);

    } catch (refreshError) {
      const refreshStatus =
        refreshError.response?.status;

      console.error(
        "Automatic token refresh failed:",
        refreshStatus || refreshError.code || "",
        refreshError.response?.data ||
          refreshError.message
      );

      // Clear session only when refresh token
      // is definitively rejected.
      if (refreshStatus === 401) {
        clearUserSession();
      }

      // Preserve tokens on network errors,
      // server errors and timeouts.
      return Promise.reject(refreshError);
    }
  }
);

// =====================================================
// EXPORT
// =====================================================

export default API;
