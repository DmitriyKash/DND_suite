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
        status: "lobby",
        master: me,
        players: [{ ...me, role: "master" }],
        created_at: new Date().toISOString(),
        started_at: null,
      };
      await store.set(code, room);
      return json(201, { room });
    }

    if (event.httpMethod === "GET" && parts[0] === "rooms" && parts[1] && !parts[2]) {
      const room = await store.get(parts[1].toUpperCase());
      if (!room) return json(404, { detail: "Комната не найдена" });
      return json(200, { room });
    }

    if (event.httpMethod === "POST" && parts[0] === "rooms" && parts[1] && parts[2] === "join") {
      const code = parts[1].toUpperCase();
      const room = await store.get(code);
      if (!room) return json(404, { detail: "Комната не найдена" });
      if (room.status === "playing" || room.status === "adventure") {
        const member = room.players.some((p) => Number(p.id) === Number(me.id));
        if (!member) {
          return json(400, { detail: "Игра уже началась" });
        }
        return json(200, { room });
      }

      const already = room.players.some((p) => Number(p.id) === Number(me.id));
      if (!already) {
        if (room.players.length >= 8) {
          return json(400, { detail: "Комната заполнена (макс. 8)" });
        }
        room.players.push({ ...me, role: "player" });
        await store.set(code, room);
      }
      return json(200, { room });
    }

    if (event.httpMethod === "POST" && parts[0] === "rooms" && parts[1] && parts[2] === "start") {
      const code = parts[1].toUpperCase();
      const room = await store.get(code);
      if (!room) return json(404, { detail: "Комната не найдена" });
      if (Number(room.master.id) !== Number(me.id)) {
        return json(403, { detail: "Только мастер может начать игру" });
      }
      if (room.status === "lobby") {
        room.status = "playing";
        room.started_at = new Date().toISOString();
        await store.set(code, room);
      }
      return json(200, { room });
    }

    if (event.httpMethod === "POST" && parts[0] === "rooms" && parts[1] && parts[2] === "begin") {
      const code = parts[1].toUpperCase();
      const room = await store.get(code);
      if (!room) return json(404, { detail: "Комната не найдена" });
      if (Number(room.master.id) !== Number(me.id)) {
        return json(403, { detail: "Только мастер может нажать Старт" });
      }
      if (room.status !== "playing") {
        return json(400, { detail: "Сначала начните игру и дождитесь героев" });
      }

      const party = room.players.filter((p) => p.role === "player");
      if (!party.length) {
        return json(400, { detail: "Нужен хотя бы один игрок с героем" });
      }
      const notReady = party.filter((p) => !p.hero);
      if (notReady.length) {
        return json(400, { detail: "Не все игроки создали героя" });
      }

      room.status = "adventure";
      room.adventure_started_at = new Date().toISOString();
      room.initiative = { status: "rolling" };
      room.turn_order = [];
      for (const player of room.players) {
        if (player.role === "player") {
          player.initiative = null;
        }
      }
      await store.set(code, room);
      return json(200, { room });
    }

    if (event.httpMethod === "POST" && parts[0] === "rooms" && parts[1] && parts[2] === "initiative") {
      const code = parts[1].toUpperCase();
      const room = await store.get(code);
      if (!room) return json(404, { detail: "Комната не найдена" });
      if (room.status !== "adventure") {
        return json(400, { detail: "Инициатива доступна после старта приключения" });
      }
      if (room.turns?.active) {
        return json(400, { detail: "Ходы уже начались" });
      }

      const player = room.players.find((p) => Number(p.id) === Number(me.id));
      if (!player || player.role !== "player" || !player.hero) {
        return json(403, { detail: "Только игроки с героем бросают инициативу" });
      }
      if (player.initiative) {
        return json(400, { detail: "Вы уже бросили инициативу" });
      }

      const dex = Number(player.hero.stats?.dex || 10);
      const mod = Math.floor((dex - 10) / 2);
      const d20 = 1 + Math.floor(Math.random() * 20);
      const total = d20 + mod;
      player.initiative = {
        d20,
        mod,
        total,
        expr: mod >= 0 ? `1d20+${mod}` : `1d20${mod}`,
        rolled_at: new Date().toISOString(),
      };

      const party = room.players.filter((p) => p.role === "player" && p.hero);
      const rolled = party.filter((p) => p.initiative);
      room.turn_order = [...rolled]
        .sort((a, b) => {
          if (b.initiative.total !== a.initiative.total) {
            return b.initiative.total - a.initiative.total;
          }
          if (b.initiative.d20 !== a.initiative.d20) {
            return b.initiative.d20 - a.initiative.d20;
          }
          return String(a.hero.name).localeCompare(String(b.hero.name), "ru");
        })
        .map((p) => p.id);

      room.initiative = {
        status: rolled.length === party.length ? "ready" : "rolling",
      };
      await store.set(code, room);
      return json(200, { room });
    }

    if (
      event.httpMethod === "POST" &&
      parts[0] === "rooms" &&
      parts[1] &&
      parts[2] === "turns" &&
      parts[3] === "start"
    ) {
      const code = parts[1].toUpperCase();
      const room = await store.get(code);
      if (!room) return json(404, { detail: "Комната не найдена" });
      if (Number(room.master.id) !== Number(me.id)) {
        return json(403, { detail: "Только мастер может нажать Старт" });
      }
      if (room.status !== "adventure") {
        return json(400, { detail: "Приключение ещё не начато" });
      }
      if (room.initiative?.status !== "ready") {
        return json(400, { detail: "Дождитесь бросков инициативы всех игроков" });
      }
      if (!Array.isArray(room.turn_order) || !room.turn_order.length) {
        return json(400, { detail: "Очередь хода пуста" });
      }

      room.turns = {
        active: true,
        index: 0,
        started_at: new Date().toISOString(),
      };
      room.initiative = { ...(room.initiative || {}), status: "started" };
      await store.set(code, room);
      return json(200, { room });
    }

    if (event.httpMethod === "POST" && parts[0] === "rooms" && parts[1] && parts[2] === "hero") {
      const code = parts[1].toUpperCase();
      const room = await store.get(code);
      if (!room) return json(404, { detail: "Комната не найдена" });
      if (room.status !== "playing") {
        return json(400, { detail: "Сейчас нельзя создать героя" });
      }

      const player = room.players.find((p) => Number(p.id) === Number(me.id));
      if (!player) return json(403, { detail: "Вы не в этой комнате" });
      if (player.role === "master") {
        return json(400, { detail: "Мастер не создаёт игрового героя" });
      }

      const body = event.body ? JSON.parse(event.body) : {};
      const heroIn = body.hero || {};
      const name = String(heroIn.name || "").trim().slice(0, 40);
      const profession = String(heroIn.profession || "").trim().slice(0, 40);
      const story = String(heroIn.story || "").trim().slice(0, 500);
      const statsIn = heroIn.stats || {};
      const keys = ["str", "dex", "con", "int", "wis", "cha"];
      const stats = {};
      for (const key of keys) {
        const value = Number(statsIn[key]);
        if (!Number.isFinite(value) || value < 8 || value > 15) {
          return json(400, { detail: `Некорректная характеристика ${key}` });
        }
        stats[key] = Math.round(value);
      }

      let image = null;
      if (typeof heroIn.image === "string" && heroIn.image.startsWith("data:image/")) {
        if (heroIn.image.length > 400_000) {
          return json(400, { detail: "Изображение слишком большое" });
        }
        image = heroIn.image;
      }

      if (name.length < 2) return json(400, { detail: "Укажите имя героя" });
      if (profession.length < 2) return json(400, { detail: "Укажите профессию" });
      if (story.length < 10) return json(400, { detail: "Слишком короткая история" });

      player.hero = {
        name,
        profession,
        story,
        stats,
        image,
        created_at: new Date().toISOString(),
      };
      await store.set(code, room);
      return json(200, { room });
    }

    return json(404, { detail: "Not found" });
  } catch (err) {
    return json(err.status || 500, { detail: err.message || "Server error" });
  }
}
