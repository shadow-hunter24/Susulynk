import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// ── Base URL ──────────────────────────────────────────────
// Your machine's local Wi-Fi IP — phone and PC must be on the same network.
// If your IP changes, update this value and restart the Expo dev server.
// Android emulator alternative: 'http://10.0.2.2:3000/api'
export const BASE_URL = 'http://10.98.101.16:3000/api';

export const TOKEN_KEY = 'susulynk_token';
export const USER_KEY = 'susulynk_user';
export const GROUP_KEY = 'susulynk_group';

// ── Axios instance ────────────────────────────────────────
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
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

// ── Response interceptor — normalise errors ───────────────
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      'Something went wrong';
    return Promise.reject(new Error(message));
  }
);

export default api;
