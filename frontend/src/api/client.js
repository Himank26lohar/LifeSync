import axios from "axios";

const BASE_URL = "http://localhost:8000";
const SESSION_KEY = "lifesync_session";

export const sessionStorageKey = SESSION_KEY;

export function getStoredSession() {
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredSession(session) {
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearStoredSession() {
  window.localStorage.removeItem(SESSION_KEY);
}

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

client.interceptors.request.use((config) => {
  const session = getStoredSession();
  if (session?.token) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${session.token}`,
    };
  }
  return config;
});

export default client;
