
import axios from "axios";

const api = axios.create({
  baseURL: "https://supportdesk-backend-qxcy.onrender.com/api",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");

    const publicEndpoints = [
      "/auth/login/",
      "/auth/register/",
    ];

    const isPublicEndpoint = publicEndpoints.some(
      (endpoint) => config.url === endpoint
    );

    if (token && !isPublicEndpoint) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;

