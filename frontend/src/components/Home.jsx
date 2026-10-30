import { useState } from "react";

export default function Home({ user, busy, onCreate, onJoin }) {
  const [title, setTitle] = useState("Вечерний поход");
  const [code, setCode] = useState("");

  return (
    <>
      <header className="hero">
        <p className="eyebrow">Telegram Mini App</p>
        <h1>Комнаты</h1>
        <p className="lead">
          Привет, {user?.first_name || "странник"}. Создай комнату как мастер или
          войди по коду приглашения.
        </p>
      </header>

      <section className="card">
        <h2>Создать комнату</h2>
        <label>
          Название
          <input
            value={title}
            maxLength={60}
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>
        <button
          disabled={busy || !title.trim()}
          onClick={() => onCreate(title.trim())}
        >
          {busy ? "Создание..." : "Стать мастером комнаты"}
        </button>
      </section>

      <section className="card">
        <h2>Войти в комнату</h2>
        <label>
          Код комнаты
          <input
            value={code}
            maxLength={8}
            placeholder="ABC123"
            onChange={(e) => setCode(e.target.value.toUpperCase())}
          />
        </label>
        <button
          className="ghost"
          disabled={busy || code.trim().length < 4}
          onClick={() => onJoin(code.trim())}
        >
          Присоединиться
        </button>
      </section>
    </>
  );
}
