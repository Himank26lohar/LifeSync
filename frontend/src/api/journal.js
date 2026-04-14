import client from "./client";

const BASE = "/api/journal";

export const getEntries = async () => {
  const res = await client.get(BASE);
  return res.data;
};

export const getEntryByDate = async (date) => {
  const res = await client.get(`${BASE}/date/${date}`);
  return res.data;
};

export const createEntry = async (entry) => {
  const res = await client.post(BASE, entry);
  return res.data;
};

export const updateEntry = async (id, updates) => {
  const res = await client.put(`${BASE}/${id}`, updates);
  return res.data;
};

export const deleteEntry = async (id) => {
  const res = await client.delete(`${BASE}/${id}`);
  return res.data;
};
