import { getInitData } from "./telegram.js";

async function request(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    "X-Telegram-Init-Data": getInitData(),
    ...(options.headers || {}),
  };

  const response = await fetch(`/api${path}`, { ...options, headers });
  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error(data?.detail || `${response.status}`);
  }
  return data;
}

export const api = {
  config: () => request("/config"),
  myRooms: () => request("/rooms"),
  getRoom: (code) => request(`/rooms/${encodeURIComponent(code)}`),
  createRoom: (title) =>
    request("/rooms", { method: "POST", body: JSON.stringify({ title }) }),
  joinRoom: (code) =>
    request(`/rooms/${encodeURIComponent(code)}/join`, {
      method: "POST",
      body: "{}",
    }),
  startRoom: (code) =>
    request(`/rooms/${encodeURIComponent(code)}/start`, {
      method: "POST",
      body: "{}",
    }),
  saveHero: (code, hero) =>
    request(`/rooms/${encodeURIComponent(code)}/hero`, {
      method: "POST",
      body: JSON.stringify({ hero }),
    }),
  beginAdventure: (code) =>
    request(`/rooms/${encodeURIComponent(code)}/begin`, {
      method: "POST",
      body: "{}",
    }),
};
