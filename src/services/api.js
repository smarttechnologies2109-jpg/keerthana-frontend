
import axios from "axios";

const BASE_URL =
  "https://ke-de4d85674ebd473184155d3a955db0ba.ecs.ap-south-1.on.aws/api";

const API = axios.create({
  baseURL: BASE_URL,
  timeout: 60000,
  headers: {
    Accept: "application/json",
  },
});

// Separate instance: refresh requests do not enter API interceptors.
const refreshAPI = axios.create({
  baseURL: BASE_URL,
  timeout: 60000,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

let refreshPromise = null;

function clearUserSession() {
  localStorage.removeItem("keerthana_token");
  localStorage.removeItem("keerthana_refresh_token");
  localStorage.removeItem("user");

  window.dispatchEvent(
    new Event("keerthana:session-expired")
  );
}

function saveTokens(accessToken, refreshToken) {
  if (!accessToken || !refreshToken) {
    throw new Error(
      "Refresh response did not contain both tokens."
    );
  }

  localStorage.setItem("keerthana_token", accessToken);
  localStorage.setItem(
    "keerthana_refresh_token",
    refreshToken
  );
}

export async function refreshAccessToken() {
  const refreshToken = localStorage.getItem(
    "keerthana_refresh_token"
  );

  if (!refreshToken) {
    const error = new Error("Refresh token not found.");
    error.code = "NO_REFRESH_TOKEN";
    throw error;
  }

  const response = await refreshAPI.post("/auth/refresh", {
    refreshToken,
  });

  const data = response.data || {};

  const accessToken = data.accessToken || data.token;
  const newRefreshToken = data.refreshToken;

  saveTokens(accessToken, newRefreshToken);

  return accessToken;
}

export async function getFreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = refreshAccessToken().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

// Attach the current access token to API requests.
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("keerthana_token");

    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Let the browser set the multipart boundary for FormData.
    if (config.data instanceof FormData) {
      if (config.headers?.delete) {
        config.headers.delete("Content-Type");
      } else if (config.headers) {
        delete config.headers["Content-Type"];
        delete config.headers["content-type"];
      }
    } else if (config.data !== undefined) {
      config.headers = config.headers || {};

      if (config.headers?.set) {
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

// Automatically refresh access tokens after a 401 response.
API.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    if (!originalRequest) {
      return Promise.reject(error);
    }

    if (error.code === "ECONNABORTED") {
      console.error(
        "API request timed out:",
        originalRequest.url
      );
      return Promise.reject(error);
    }

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

    const isRefreshRequest =
      originalRequest.url?.includes("/auth/refresh");

    const isAuthRequest =
      /\/auth\/(login|register|admin\/login|owner\/login)/.test(
        originalRequest.url || ""
      );

    // Refresh only after an eligible 401 response.
    if (
      status !== 401 ||
      originalRequest._retry ||
      isRefreshRequest ||
      isAuthRequest
    ) {
      return Promise.reject(error);
    }

    // Admin/owner legacy sessions have no refresh token.
    // Do not try to refresh or clear their session here.
    const existingRefreshToken = localStorage.getItem(
      "keerthana_refresh_token"
    );

    if (!existingRefreshToken) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
  

      const newAccessToken = await refreshPromise;

      originalRequest.headers =
        originalRequest.headers || {};

      originalRequest.headers.Authorization =
        `Bearer ${newAccessToken}`;

      // Retry the original request exactly once.
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

      // Only a definitive 401 from the refresh endpoint
      // means the refresh session is invalid.
      if (refreshStatus === 401) {
        clearUserSession();
      }

      // For 500, 503, network errors and timeouts:
      // preserve both tokens and the cached user.
      return Promise.reject(refreshError);
    }
  }
);

export default API;
