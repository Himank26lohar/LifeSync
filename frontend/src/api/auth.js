/**
 * Purpose:
 * Wrap the authentication endpoints and keep browser session storage in sync with API responses.
 */
import client, { clearStoredSession, setStoredSession } from "./client";

const BASE = "/api/auth";

export const signup = async (credentials) => {
  const res = await client.post(`${BASE}/signup`, credentials);
  setStoredSession(res.data);
  return res.data;
};

export const login = async (credentials) => {
  const res = await client.post(`${BASE}/login`, credentials);
  setStoredSession(res.data);
  return res.data;
};

export const me = async () => {
  const res = await client.get(`${BASE}/me`);
  return res.data;
};

export const logout = async () => {
  try {
    await client.post(`${BASE}/logout`);
  } finally {
    clearStoredSession();
  }
};
