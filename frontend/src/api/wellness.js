import client from "./client";

const BASE = "/api/wellness";

export const getWellness = async () => {
  const res = await client.get(BASE);
  return res.data;
};

export const getRecentWellness = async () => {
  const res = await client.get(`${BASE}/recent`);
  return res.data;
};

export const logWellness = async (entry) => {
  const res = await client.post(BASE, entry);
  return res.data;
};

export const updateWellness = async (id, updates) => {
  const res = await client.put(`${BASE}/${id}`, updates);
  return res.data;
};

export const deleteWellness = async (id) => {
  const res = await client.delete(`${BASE}/${id}`);
  return res.data;
};
