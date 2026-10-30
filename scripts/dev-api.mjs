import http from "node:http";
import { handler } from "../netlify/functions/api.mjs";

const port = Number(process.env.API_PORT || 8787);

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type, X-Telegram-Init-Data",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    });
    res.end();
    return;
  }

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const body = Buffer.concat(chunks).toString("utf8");

  const url = new URL(req.url, `http://127.0.0.1:${port}`);
  const suffix = url.pathname.replace(/^\/api\/?/, "");
  const event = {
    httpMethod: req.method,
    path: `/.netlify/functions/api/${suffix}`,
    headers: req.headers,
    body: body || null,
  };

  const result = await handler(event);
  res.writeHead(result.statusCode, result.headers);
  res.end(result.body || "");
});

server.listen(port, () => {
  console.log(`Local API http://127.0.0.1:${port}/api`);
});
