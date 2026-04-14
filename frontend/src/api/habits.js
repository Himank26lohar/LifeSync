import client from "./client";

const BASE = "/api/habits";

export const getHabits = async () => {
  const res = await client.get(BASE);
  return res.data;
};

export const createHabit = async (habit) => {
  const res = await client.post(BASE, habit);
  return res.data;
};

export const updateHabit = async (id, updates) => {
  const res = await client.put(`${BASE}/${id}`, updates);
  return res.data;
};

export const deleteHabit = async (id) => {
  const res = await client.delete(`${BASE}/${id}`);
  return res.data;
};
