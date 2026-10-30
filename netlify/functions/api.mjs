import { getUser, json, publicUser } from "./_telegram.mjs";
import { getRoomStore, makeRoomCode } from "./_rooms.mjs";

function pathParts(event) {
  const raw = event.path || event.rawUrl || "";
  let cleaned = raw;
  try {
    cleaned = new URL(raw, "http://localhost").pathname;
  } catch {
    cleaned = raw;
  }
  cleaned = cleaned
    .replace(/^\/.netlify\/functions\/api\/?/, "")
    .replace(/^\/api\/?/, "")
    .replace(/^\//, "");
  return cleaned.split("/").filter(Boolean);
}

export async function handler(event) {
  if (event.httpMethod === "OPTIONS") {
    return json(204, {});
  }

  try {
    const parts = pathParts(event);

    if (event.httpMethod === "GET" && parts[0] === "config") {
      return json(200, {
        botUsername: process.env.BOT_USERNAME || "",
        webappUrl: process.env.WEBAPP_URL || "",
      });
    }

    const store = await getRoomStore();
    const user = getUser(event);
    const me = publicUser(user);

    if (event.httpMethod === "GET" && parts[0] === "rooms" && !parts[1]) {
      const rooms = await store.listUserRooms(me.id);
      return json(200, { rooms });
    }

    if (event.httpMethod === "POST" && parts[0] === "rooms" && !parts[1]) {
      const body = event.body ? JSON.parse(event.body) : {};
      const title = String(body.title || "Комната D&D").trim().slice(0, 60) || "Комната D&D";
      let code = makeRoomCode();
      for (let i = 0; i < 5; i += 1) {
        if (!(await store.get(code))) break;
        code = makeRoomCode();
      }

      const room = {
        code,
        title,
        master: me,
        players: [{ ...me, role: "master" }],
        created_at: new Date().toISOString(),
      };
      await store.set(code, room);
      return json(201, { room });
    }

    if (event.httpMethod === "GET" && parts[0] === "rooms" && parts[1]) {
      const room = await store.get(parts[1].toUpperCase());
      if (!room) return json(404, { detail: "Комната не найдена" });
      return json(200, { room });
    }

    if (event.httpMethod === "POST" && parts[0] === "rooms" && parts[1] && parts[2] === "join") {
      const code = parts[1].toUpperCase();
      const room = await store.get(code);
      if (!room) return json(404, { detail: "Комната не найдена" });

      const already = room.players.some((p) => p.id === me.id);
      if (!already) {
        if (room.players.length >= 8) {
          return json(400, { detail: "Комната заполнена (макс. 8)" });
        }
        room.players.push({ ...me, role: "player" });
        await store.set(code, room);
      }
      return json(200, { room });
    }

    return json(404, { detail: "Not found" });
  } catch (err) {
    return json(err.status || 500, { detail: err.message || "Server error" });
  }
}
