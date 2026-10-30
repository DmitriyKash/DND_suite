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

function indexUser(bucket, userId, code) {
  const key = String(userId);
  const list = bucket.byUser.get(key) || [];
  if (!list.includes(code)) {
    bucket.byUser.set(key, [...list, code]);
  }
}

export async function getRoomStore() {
  const bucket = memoryBucket();
  return {
    async get(code) {
      return bucket.rooms.get(String(code).toUpperCase()) || null;
    },
    async set(code, room) {
      const key = String(code).toUpperCase();
      bucket.rooms.set(key, room);
      indexUser(bucket, room.master.id, key);
      for (const player of room.players) {
        indexUser(bucket, player.id, key);
      }
    },
    async listUserRooms(userId) {
      const codes = bucket.byUser.get(String(userId)) || [];
      return codes.map((code) => bucket.rooms.get(code)).filter(Boolean);
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
