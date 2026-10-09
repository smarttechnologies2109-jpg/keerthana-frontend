import axios from "axios";

const API = axios.create({
baseURL:
"https://ke-de4d85674ebd473184155d3a955db0ba.ecs.ap-south-1.on.aws/api",

// Prevent Android requests from hanging indefinitely.
timeout: 20000,

headers: {
Accept: "application/json",
"Content-Type": "application/json",
},
});

/* AUTH TOKEN INTERCEPTOR */
API.interceptors.request.use(
(config) => {
const token = localStorage.getItem("keerthana_token");


if (token) {
  config.headers = config.headers || {};
  config.headers.Authorization = `Bearer ${token}`;
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
error.config?.url
);
}


return Promise.reject(error);

}
);

export default API;
