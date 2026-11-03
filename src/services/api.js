
import axios from "axios";

const API = axios.create({
  baseURL:
    "https://ke-de4d85674ebd473184155d3a955db0ba.ecs.ap-south-1.on.aws/api",
  timeout: 60000,
  headers: {
    Accept: "application/json",
  },
});

// Separate Axios instance prevents refresh requests from
// entering the normal API interceptors.
const refreshAPI = axios.create({
  baseURL:
    "https://ke-de4d85674ebd473184155d3a955db0ba.ecs.ap-south-1.on.aws/api",
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

  window.dispatchEvent(new Event("keerthana:session-expired"));
}

function saveTokens(accessToken, refreshToken) {
  if (!accessToken || !refreshToken) {
    throw new Error("Refresh response did not contain both tokens.");
  }

  localStorage.setItem("keerthana_token", accessToken);
  localStorage.setItem("keerthana_refresh_token", refreshToken);
}

async function refreshAccessToken() {
  const refreshToken = localStorage.getItem(
    "keerthana_refresh_token"
  );

  if (!refreshToken) {
    throw new Error("Refresh token not found.");
  }

  const response = await refreshAPI.post("/auth/refresh", {
    refreshToken,
  });

  const data = response.data;

  const accessToken = data.accessToken || data.token;
  const newRefreshToken = data.refreshToken;

  saveTokens(accessToken, newRefreshToken);

  return accessToken;
}

/* REQUEST INTERCEPTOR */
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("keerthana_token");

    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }

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

/* RESPONSE INTERCEPTOR: AUTOMATIC TOKEN REFRESH */
API.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    if (error.code === "ECONNABORTED") {
      console.error(
        "API request timed out:",
        originalRequest?.url
      );
      return Promise.reject(error);
    }

    if (!error.response) {
      console.error(
        "API network error:",
        error.message,
        originalRequest?.url
      );
      return Promise.reject(error);
    }

    console.error(
      "API response error:",
      error.response.status,
      originalRequest?.url,
      error.response.data
    );

    const isUnauthorized = error.response.status === 401;

    const isRefreshRequest =
      originalRequest?.url?.includes("/auth/refresh");

    const isAuthRequest =
      /\/auth\/(login|register|admin\/login|owner\/login)/.test(
        originalRequest?.url || ""
      );

    if (
      !isUnauthorized ||
      !originalRequest ||
      originalRequest._retry ||
      isRefreshRequest ||
      isAuthRequest
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      if (!refreshPromise) {
        refreshPromise = refreshAccessToken().finally(() => {
          refreshPromise = null;
        });
      }

      const newAccessToken = await refreshPromise;

      originalRequest.headers =
        originalRequest.headers || {};

      originalRequest.headers.Authorization =
        `Bearer ${newAccessToken}`;

      return API(originalRequest);
    } catch (refreshError) {
      console.error(
        "Automatic token refresh failed:",
        refreshError.response?.data || refreshError.message
      );

      clearUserSession();

      return Promise.reject(refreshError);
    }
  }
);

export default API;
