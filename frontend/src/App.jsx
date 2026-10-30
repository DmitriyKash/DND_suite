import { useEffect, useState } from "react";
import { initMiniApp } from "./telegram.js";

export default function App() {
  const [app, setApp] = useState({ ready: false, user: null });

  useEffect(() => {
    setApp(initMiniApp());
  }, []);

  const name = app.user?.first_name || "странник";

  return (
    <main className="page">
      <header className="hero">
        <p className="eyebrow">Telegram Mini App</p>
        <h1>Главная</h1>
        <p className="lead">
          {app.ready
            ? `Привет, ${name}. Приложение инициализировано.`
            : "Открой эту страницу из Telegram, чтобы Mini App инициализировался."}
        </p>
      </header>

      <section className="card">
        <h2>Статус</h2>
        <p>{app.ready ? "WebApp ready" : "Вне Telegram (браузер)"}</p>
        {app.user ? (
          <p>
            Пользователь: {app.user.first_name}
            {app.user.username ? ` (@${app.user.username})` : ""}
          </p>
        ) : null}
      </section>
    </main>
  );
}
