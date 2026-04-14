/**
 * Purpose:
 * Provide focus-session and time-block API helpers for scheduling features.
 */
import client from "./client";
const BASE = "/api/time";

export const getFocusSessions = () => client.get(`${BASE}/focus`).then(r => r.data);
export const createFocusSession = (data) => client.post(`${BASE}/focus`, data).then(r => r.data);
export const deleteFocusSession = (id) => client.delete(`${BASE}/focus/${id}`).then(r => r.data);

export const getBlocks = () => client.get(`${BASE}/blocks`).then(r => r.data);
export const createBlock = (data) => client.post(`${BASE}/blocks`, data).then(r => r.data);
export const deleteBlock = (id) => client.delete(`${BASE}/blocks/${id}`).then(r => r.data);
