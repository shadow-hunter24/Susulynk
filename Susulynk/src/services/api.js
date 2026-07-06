import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// ── Base URL ──────────────────────────────────────────────
// Your machine's local Wi-Fi IP — phone and PC must be on the same network.
// If your IP changes, update this value and restart the Expo dev server.
// Android emulator alternative: 'http://10.0.2.2:3000/api'
export const BASE_URL = 'http://10.24.125.16:3000/api';

export const TOKEN_KEY = 'susulynk_token';
export const USER_KEY = 'susulynk_user';
export const GROUP_KEY = 'susulynk_group';

// ── Axios instance ────────────────────────────────────────
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 35000, // raised to 35s — Neon cold-starts can take up to ~30s
  headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor — attach JWT ─────────────────────
api.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor — normalise errors + retry on 503 ─
// Neon serverless databases sleep after inactivity. The first request after
// a cold-start returns a 503. We automatically retry once after 3 seconds
// so the user never sees a connection error during normal use.
api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const status = error.response?.status;
    const config = error.config;

    // Retry once on 503 (db waking up) or network timeout, but not on retried requests
    if ((status === 503 || error.code === 'ECONNABORTED') && !config._retried) {
      config._retried = true;
      await new Promise(resolve => setTimeout(resolve, 3000)); // wait 3s for Neon to wake
      return api(config);
    }

    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      'Something went wrong';
    return Promise.reject(new Error(message));
  }
);

export default api;
