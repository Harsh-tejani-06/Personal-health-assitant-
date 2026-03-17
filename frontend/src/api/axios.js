import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api"
});

// Attach token to every request
API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

// Handle 401 responses — token expired or invalid
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Don't redirect if already on auth page (avoids infinite redirect loop)
      if (!window.location.pathname.includes("/auth")) {
        localStorage.removeItem("token");
        window.location.href = "/auth";
      }
    }
    return Promise.reject(error);
  }
);

export default API;
