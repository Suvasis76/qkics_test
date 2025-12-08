// src/components/utils/axiosSecure.js
import axios from "axios";
import { API_BASE_URL } from "../../config/api";
import { navigateTo } from "./navigation";
import { getAccessToken, setAccessToken } from "../../redux/store/tokenManager";

const axiosSecure = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

/* -------------------------------------------------------
    GLOBAL REFRESH STATE
------------------------------------------------------- */
let isRefreshing = false;
let queue = [];

const addToQueue = () =>
  new Promise((resolve, reject) => queue.push({ resolve, reject }));

const runQueue = (error, token) => {
  queue.forEach((p) => (error ? p.reject(error) : p.resolve(token)));
  queue = [];
};

/* -------------------------------------------------------
    REQUEST INTERCEPTOR
------------------------------------------------------- */
axiosSecure.interceptors.request.use(
  (config) => {
    const token = getAccessToken();

    // Do NOT attach token if custom flag is set
    if (token && !config._noAuth) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (err) => Promise.reject(err)
);

/* -------------------------------------------------------
    RESPONSE INTERCEPTOR + REFRESH LOGIC
------------------------------------------------------- */
axiosSecure.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (!error.response) return Promise.reject(error);

    const original = error.config;

    // If not 401 → normal error
    if (error.response.status !== 401) return Promise.reject(error);

    // Avoid infinite loop
    if (original._retry) return Promise.reject(error);
    original._retry = true;

    /* ------------------------------
        Already refreshing? Queue it.
    ------------------------------ */
    if (isRefreshing) {
      try {
        const newToken = await addToQueue();

        // Apply new token to queued request
        if (!original.headers) original.headers = {};
        original.headers.Authorization = `Bearer ${newToken}`;

        return axiosSecure(original);
      } catch (e) {
        return Promise.reject(e);
      }
    }

    /* ------------------------------
        Start refresh process
    ------------------------------ */
    isRefreshing = true;

    try {
      console.log("🔥 401 INTERCEPTOR TRIGGERED");

      const refreshResponse = await axiosSecure.post(
        "/v1/auth/token/refresh/",
        {},
        { _noAuth: true } // prevents sending old token
      );

      console.log("🔥 REFRESH RESPONSE:", refreshResponse.data);

      const newToken = refreshResponse?.data?.access;
      console.log("🔥 NEW TOKEN FROM SERVER:", newToken);

      if (!newToken) throw new Error("No new access token from refresh");

      // Save token to memory
      setAccessToken(newToken);
      console.log("🔥 STORED TOKEN IN MEMORY:", getAccessToken());

      // Resolve queued requests
      runQueue(null, newToken);

      /* -------------------------------------------------
          MOST IMPORTANT FIX 🔥🔥🔥
          FORCE CLEAR OLD TOKENS AND APPLY NEW ONE
      -------------------------------------------------- */
      if (!original.headers) original.headers = {};

      original.headers.Authorization = `Bearer ${newToken}`;

      // Remove outdated Axios header caches
      if (original.headers.common?.Authorization)
        delete original.headers.common.Authorization;

      if (original.headers.get?.Authorization)
        delete original.headers.get.Authorization;

      if (original.headers.post?.Authorization)
        delete original.headers.post.Authorization;

      return axiosSecure(original);
    } catch (refreshErr) {
      // Refresh failed → clear token + reject queue
      setAccessToken(null);
      runQueue(refreshErr, null);

      navigateTo("/login");

      return Promise.reject(refreshErr);
    } finally {
      isRefreshing = false;
    }
  }
);

export default axiosSecure;
