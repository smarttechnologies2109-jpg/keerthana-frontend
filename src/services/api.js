import axios from "axios";

const API = axios.create({
  baseURL:
    "https://ke-de4d85674ebd473184155d3a955db0ba.ecs.ap-south-1.on.aws/api",
});

/* =========================================================
   AUTH TOKEN INTERCEPTOR
========================================================= */

API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(
      "keerthana_token"
    );

    if (token) {
      config.headers = config.headers || {};

      config.headers.Authorization =
        `Bearer ${token}`;
    }

    return config;
  },

  (error) => {
    return Promise.reject(error);
  }
);

export default API;