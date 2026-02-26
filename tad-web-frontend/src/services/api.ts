import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn("Session expired. Please sign in again.");
      // Optional: force redirect to login
      // window.location.href = "/hub/login";
    }
    return Promise.reject(error);
  }
);

export default api;
