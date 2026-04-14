/**
 * Purpose:
 * Provide profile fetch/save helpers for the frontend.
 */
import client from "./client";

const BASE = "/api/profile";

export const getProfile = async () => {
  const res = await client.get(BASE);
  return res.data;
};

export const saveProfile = async (profile) => {
  const res = await client.put(BASE, profile);
  return res.data;
};
