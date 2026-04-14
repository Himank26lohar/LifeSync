import client from "./client";

const BASE = "/api/tasks";

// Get all tasks
export const getTasks = async () => {
  const res = await client.get(BASE);
  return res.data;
};

// Create a new task
export const createTask = async (task) => {
  const res = await client.post(BASE, task);
  return res.data;
};

// Update task (e.g. mark complete)
export const updateTask = async (id, updates) => {
  const res = await client.put(`${BASE}/${id}`, updates);
  return res.data;
};

// Delete a task
export const deleteTask = async (id) => {
  const res = await client.delete(`${BASE}/${id}`);
  return res.data;
};
