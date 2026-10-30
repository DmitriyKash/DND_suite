const globalKey = "__dnd_rooms_store__";

function memoryBucket() {
  if (!globalThis[globalKey]) {
    globalThis[globalKey] = {
      rooms: new Map(),
      byUser: new Map(),
    };
  }
  return globalThis[globalKey];
}

function memoryStore() {
  const bucket = memoryBucket();
  return {
    async get(code) {
      return bucket.rooms.get(String(code).toUpperCase()) || null;
    },
    async set(code, room) {
      const key = String(code).toUpperCase();
      bucket.rooms.set(key, room);
      const touch = (userId) => {
        const id = String(userId);
        const list = bucket.byUser.get(id) || [];
        if (!list.includes(key)) bucket.byUser.set(id, [...list, key]);
      };
      touch(room.master.id);
      for (const player of room.players) touch(player.id);
    },
    async listUserRooms(userId) {
      const codes = bucket.byUser.get(String(userId)) || [];
      return codes.map((code) => bucket.rooms.get(code)).filter(Boolean);
    },
  };
}

async function blobsStore() {
  const { getStore } = await import("@netlify/blobs");
  const store = getStore({ name: "dnd-rooms", consistency: "strong" });

  return {
    async get(code) {
      return (await store.get(String(code).toUpperCase(), { type: "json" })) || null;
    },
    async set(code, room) {
      const key = String(code).toUpperCase();
      await store.setJSON(key, room);
      const indexKey = `user:${room.master.id}`;
      const existing = (await store.get(indexKey, { type: "json" })) || [];
      if (!existing.includes(key)) {
        await store.setJSON(indexKey, [...existing, key]);
      }
      for (const player of room.players) {
        const userKey = `user:${player.id}`;
        const list = (await store.get(userKey, { type: "json" })) || [];
        if (!list.includes(key)) {
          await store.setJSON(userKey, [...list, key]);
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

export async function getRoomStore() {
  // Prefer Blobs on Netlify so all players see the same room/start state.
  if (process.env.NETLIFY || process.env.NETLIFY_BLOBS_CONTEXT) {
    try {
      return await blobsStore();
    } catch (err) {
      console.error("Netlify Blobs unavailable, fallback to memory:", err?.message || err);
    }
  }
  return memoryStore();
}

export function makeRoomCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return code;
}
