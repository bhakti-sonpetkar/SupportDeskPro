import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");

    /*
     * Login and registration are public endpoints.
     * Do not send an old/expired JWT token with them.
     */
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