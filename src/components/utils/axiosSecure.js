import axios from "axios";
import { API_BASE_URL } from "../../config/api";
import { navigateTo } from "./navigation";

const axiosSecure = axios.create({
  baseURL: API_BASE_URL,  // MUST be "/api/"
  withCredentials: true,
});

let isRefreshing = false;
let queue = [];

const addToQueue = () =>
  new Promise((resolve, reject) => queue.push({ resolve, reject }));

const runQueue = (error, token) => {
  queue.forEach((p) => (error ? p.reject(error) : p.resolve(token)));
  queue = [];
};

/* ------------------------------------------
    REQUEST INTERCEPTOR
------------------------------------------- */
axiosSecure.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (err) => Promise.reject(err)
);

/* ------------------------------------------
    RESPONSE INTERCEPTOR + REFRESH LOGIC
------------------------------------------- */
axiosSecure.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;

    if (!error.response) return Promise.reject(error);
    if (error.response.status !== 401) return Promise.reject(error);
    if (original._retry) return Promise.reject(error);

    original._retry = true;

    // If already refreshing → queue request
    if (isRefreshing) {
      try {
        const token = await addToQueue();
        original.headers.Authorization = `Bearer ${token}`;
        return axiosSecure(original);
      } catch (err) {
        return Promise.reject(err);
      }
    }

    // Start refresh
    isRefreshing = true;

    try {
      const { data } = await axiosSecure.post("v1/auth/token/refresh/", {});

      const newToken = data?.access;
      if (!newToken) throw new Error("Refresh failed: no token");

      localStorage.setItem("access", newToken);

      runQueue(null, newToken);

      original.headers.Authorization = `Bearer ${newToken}`;
      return axiosSecure(original);
    } catch (refreshErr) {
      localStorage.removeItem("access");
      runQueue(refreshErr, null);
      navigateTo("/login");
      return Promise.reject(refreshErr);
    } finally {
      isRefreshing = false;
    }
  }
);

export default axiosSecure;
