import { useEffect, useState } from "react";
import { api } from "./api.js";
import { getStartParam, initMiniApp } from "./telegram.js";
import Home from "./components/Home.jsx";
import RoomLobby from "./components/RoomLobby.jsx";

function roomFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const fromQuery = params.get("room");
  if (fromQuery) return fromQuery.toUpperCase();

  const start = getStartParam();
  if (start?.startsWith("join_")) {
    return start.replace(/^join_/i, "").toUpperCase();
  }
  return "";
}

export default function App() {
  const [app, setApp] = useState({ ready: false, user: null });
  const [botUsername, setBotUsername] = useState("");
  const [webappUrl, setWebappUrl] = useState("");
  const [room, setRoom] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setApp(initMiniApp());
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      try {
        const config = await api.config();
        if (!cancelled) {
          setBotUsername(config.botUsername || "");
          setWebappUrl(config.webappUrl || "");
        }
      } catch {
        /* config optional at boot */
      }

      const code = roomFromUrl();
      if (!code) return;
      setBusy(true);
      setError("");
      try {
        const data = await api.joinRoom(code);
        if (!cancelled) setRoom(data.room);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setBusy(false);
      }
    }

    boot();
    return () => {
      cancelled = true;
    };
  }, []);

  async function run(fn) {
    setBusy(true);
    setError("");
    try {
      await fn();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="page">
      {error ? <p className="error">{error}</p> : null}

      {room ? (
        <RoomLobby
          room={room}
          user={app.user}
          botUsername={botUsername}
          webappUrl={webappUrl}
          busy={busy}
          onLeave={() => {
            setRoom(null);
            const url = new URL(window.location.href);
            url.searchParams.delete("room");
            window.history.replaceState({}, "", url.pathname);
          }}
          onRefresh={() =>
            run(async () => {
              const data = await api.getRoom(room.code);
              setRoom(data.room);
            })
          }
        />
      ) : (
        <Home
          user={app.user}
          busy={busy}
          onCreate={(title) =>
            run(async () => {
              const data = await api.createRoom(title);
              setRoom(data.room);
            })
          }
          onJoin={(code) =>
            run(async () => {
              const data = await api.joinRoom(code);
              setRoom(data.room);
            })
          }
        />
      )}

      {!app.ready ? (
        <p className="muted">Открой из Telegram для полного initData.</p>
      ) : null}
    </main>
  );
}
