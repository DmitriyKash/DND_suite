import crypto from "node:crypto";

const INITDATA_MAX_AGE_SEC = Number(process.env.INITDATA_MAX_AGE_SEC || 86400);
const ALLOW_UNVERIFIED = process.env.ALLOW_UNVERIFIED === "1";

function secretKey(botToken) {
  return crypto.createHmac("sha256", "WebAppData").update(botToken).digest();
}

export function validateInitData(initData, botToken) {
  if (!initData) {
    const err = new Error("Отсутствует initData");
    err.status = 401;
    throw err;
  }

  const params = new URLSearchParams(initData);
  const receivedHash = params.get("hash");
  if (!receivedHash) {
    const err = new Error("Нет hash в initData");
    err.status = 401;
    throw err;
  }

  const pairs = [];
  for (const [key, value] of params.entries()) {
    if (key === "hash") continue;
    pairs.push(`${key}=${value}`);
  }
  pairs.sort();
  const dataCheckString = pairs.join("\n");
  const calculated = crypto
    .createHmac("sha256", secretKey(botToken))
    .update(dataCheckString)
    .digest("hex");

  if (calculated !== receivedHash) {
    const err = new Error("Невалидный initData");
    err.status = 401;
    throw err;
  }

  const authDate = Number(params.get("auth_date") || 0);
  if (authDate && Date.now() / 1000 - authDate > INITDATA_MAX_AGE_SEC) {
    const err = new Error("initData истёк");
    err.status = 401;
    throw err;
  }

  const userRaw = params.get("user");
  const user = userRaw ? JSON.parse(userRaw) : {};
  if (!user.id) {
    const err = new Error("В initData нет user.id");
    err.status = 401;
    throw err;
  }
  return user;
}

export function getUser(event) {
  const botToken = process.env.BOT_TOKEN || "";
  const initData =
    event.headers["x-telegram-init-data"] ||
    event.headers["X-Telegram-Init-Data"] ||
    "";

  if (!botToken) {
    if (ALLOW_UNVERIFIED) {
      return { id: 0, first_name: "Dev", username: "dev" };
    }
    const err = new Error("BOT_TOKEN не задан на Netlify");
    err.status = 500;
    throw err;
  }

  if (!initData) {
    if (ALLOW_UNVERIFIED) {
      return { id: 0, first_name: "Dev", username: "dev" };
    }
    const err = new Error("Нужен заголовок X-Telegram-Init-Data");
    err.status = 401;
    throw err;
  }

  return validateInitData(initData, botToken);
}

export function json(status, body) {
  return {
    statusCode: status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type, X-Telegram-Init-Data",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    },
    body: JSON.stringify(body),
  };
}

export function publicUser(user) {
  return {
    id: user.id,
    first_name: user.first_name || "Игрок",
    last_name: user.last_name || "",
    username: user.username || "",
  };
}
