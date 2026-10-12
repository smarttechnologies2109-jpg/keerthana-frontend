
import axios from "axios";

const API = axios.create({
  baseURL:
    "https://ke-de4d85674ebd473184155d3a955db0ba.ecs.ap-south-1.on.aws/api",

  timeout: 60000,

  headers: {
    Accept: "application/json",
  },
});

/* AUTH TOKEN + CONTENT TYPE INTERCEPTOR */
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("keerthana_token");

    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Let the browser/Axios set the multipart boundary for FormData.
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

/* API ERROR HANDLING */
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === "ECONNABORTED") {
      console.error(
        "API request timed out:",
        error.config?.url
      );
    } else if (!error.response) {
      console.error(
        "API network error:",
        error.message,
        error.config?.url
      );
    } else {
      console.error(
        "API response error:",
        error.response.status,
        error.config?.url,
        error.response.data
      );
    }

    return Promise.reject(error);
  }
);

export default API;
