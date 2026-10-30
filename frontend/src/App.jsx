import { useEffect, useState } from "react";
import { api } from "./api.js";
import { getStartParam, initMiniApp } from "./telegram.js";
import Home from "./components/Home.jsx";
import RoomLobby from "./components/RoomLobby.jsx";
import GameSession from "./components/GameSession.jsx";
import HeroCreation from "./components/HeroCreation.jsx";

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
          setWebappUrl(config.webappUrl || window.location.origin);
        }
      } catch {
        if (!cancelled) setWebappUrl(window.location.origin);
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

  useEffect(() => {
    if (!room?.code) return undefined;

    let cancelled = false;
    const timer = setInterval(async () => {
      try {
        const data = await api.getRoom(room.code);
        if (!cancelled) setRoom(data.room);
      } catch {
        /* keep last known room while polling */
      }
    }, 2000);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [room?.code]);

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

  const inGame = room?.status === "playing" || room?.status === "adventure";
  const me = room?.players?.find((p) => Number(p.id) === Number(app.user?.id));
  const isMaster = Number(room?.master?.id) === Number(app.user?.id);
  const needsHero = room?.status === "playing" && !isMaster && me && !me.hero;

  return (
    <main className="page">
      {error ? <p className="error">{error}</p> : null}

      {needsHero ? (
        <HeroCreation
          busy={busy}
          onSubmit={(hero) =>
            run(async () => {
              const data = await api.saveHero(room.code, hero);
              setRoom(data.room);
            })
          }
        />
      ) : null}

      {room && inGame && !needsHero ? (
        <GameSession
          room={room}
          user={app.user}
          busy={busy}
          onRefresh={() =>
            run(async () => {
              const data = await api.getRoom(room.code);
              setRoom(data.room);
            })
          }
          onBegin={() =>
            run(async () => {
              const data = await api.beginAdventure(room.code);
              setRoom(data.room);
            })
          }
          onRollInitiative={() =>
            run(async () => {
              const data = await api.rollInitiative(room.code);
              setRoom(data.room);
            })
          }
          onStartTurns={() =>
            run(async () => {
              const data = await api.startTurns(room.code);
              setRoom(data.room);
            })
          }
        />
      ) : null}

      {room && !inGame ? (
        <RoomLobby
          room={room}
          user={app.user}
          botUsername={botUsername}
          webappUrl={webappUrl || window.location.origin}
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
          onStart={() =>
            run(async () => {
              const data = await api.startRoom(room.code);
              setRoom(data.room);
            })
          }
        />
      ) : null}

      {!room ? (
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
      ) : null}

      {!app.ready ? (
        <p className="muted">Открой из Telegram для полного initData.</p>
      ) : null}
    </main>
  );
}
