import { getStore } from "@netlify/blobs";

const memory = new Map();

function useMemory() {
  return process.env.NETLIFY_BLOBS_CONTEXT == null && !process.env.NETLIFY;
}

export async function getRoomStore() {
  if (useMemory()) {
    return {
      async get(code) {
        return memory.get(code) || null;
      },
      async set(code, room) {
        memory.set(code, room);
      },
      async listUserRooms(userId) {
        return [...memory.values()].filter(
          (room) =>
            room.master.id === userId ||
            room.players.some((p) => p.id === userId),
        );
      },
    };
  }

  const store = getStore("dnd-rooms");
  return {
    async get(code) {
      return (await store.get(code, { type: "json" })) || null;
    },
    async set(code, room) {
      await store.setJSON(code, room);
      const indexKey = `user:${room.master.id}`;
      const existing = (await store.get(indexKey, { type: "json" })) || [];
      if (!existing.includes(code)) {
        await store.setJSON(indexKey, [...existing, code]);
      }
      for (const player of room.players) {
        const key = `user:${player.id}`;
        const list = (await store.get(key, { type: "json" })) || [];
        if (!list.includes(code)) {
          await store.setJSON(key, [...list, code]);
        }
      }
    },
    async listUserRooms(userId) {
      const codes = (await store.get(`user:${userId}`, { type: "json" })) || [];
      const rooms = [];
      for (const code of codes) {
        const room = await store.get(code, { type: "json" });
        if (room) rooms.push(room);
      }
      return rooms;
    },
  };
}

export function makeRoomCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return code;
}
