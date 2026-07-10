import axios from "axios";

const API = axios.create({
  baseURL: `http://${window.location.hostname}:8000`,
});

// ── Auto-attach admin JWT to every request ──────────────────────
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("adminToken");
  if (token && !config.headers["Authorization"]) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 Unauthorized globally
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && error.response?.data?.detail === "Invalid token") {
      localStorage.removeItem("adminToken");
      window.location.href = "/admin-login";
    }
    return Promise.reject(error);
  }
);

export default API;