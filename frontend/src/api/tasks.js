/**
 * Purpose:
 * Provide task CRUD helpers used by the frontend pages.
 */
import client from "./client";

const BASE = "/api/tasks";

export const getTasks = async () => {
  const res = await client.get(BASE);
  return res.data;
};

export const createTask = async (task) => {
  const res = await client.post(BASE, task);
  return res.data;
};

export const updateTask = async (id, updates) => {
  const res = await client.put(`${BASE}/${id}`, updates);
  return res.data;
};

export const deleteTask = async (id) => {
  const res = await client.delete(`${BASE}/${id}`);
  return res.data;
};
