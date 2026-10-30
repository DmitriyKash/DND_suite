export default function GameSession({ room, user, busy, onRefresh, onBegin }) {
  const isMaster = Number(room.master.id) === Number(user?.id);
  const heroes = room.players.filter((p) => p.role === "player" && p.hero);
  const waiting = room.players.filter((p) => p.role === "player" && !p.hero);
  const allReady = waiting.length === 0 && heroes.length > 0;
  const inAdventure = room.status === "adventure";

  if (inAdventure) {
    return (
      <>
        <header className="hero">
          <p className="eyebrow">Приключение · {room.code}</p>
          <h1>{room.title}</h1>
          <p className="lead">
            {isMaster
              ? "Сессия началась. Ведите историю для партии."
              : "Мастер начал приключение. Следите за сценой."}
          </p>
        </header>

        <section className="card">
          <div className="row-between">
            <h2>Партия ({heroes.length})</h2>
            <button className="ghost small" disabled={busy} onClick={onRefresh}>
              Обновить
            </button>
          </div>
          <ul className="hero-cards">
            {heroes.map((player) => (
              <li key={player.id}>
                {player.hero.image ? (
                  <img src={player.hero.image} alt={player.hero.name} />
                ) : (
                  <div className="hero-placeholder">{player.hero.name.slice(0, 1)}</div>
                )}
                <div>
                  <strong>{player.hero.name}</strong>
                  <div className="muted">
                    {player.hero.profession} · {player.first_name}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="card">
          <h2>Сцена</h2>
          <p className="muted">Приключение запущено. Дальше добавим ходы, проверки и бой.</p>
        </section>
      </>
    );
  }

  return (
    <>
      <header className="hero">
        <p className="eyebrow">Игра · {room.code}</p>
        <h1>{room.title}</h1>
        <p className="lead">
          {isMaster
            ? allReady
              ? "Все герои готовы. Можно начинать приключение."
              : "Игроки создают героев. Ниже — кто уже готов."
            : "Герой сохранён. Ждите, пока мастер нажмёт «Старт»."}
        </p>
      </header>

      <section className="card">
        <div className="row-between">
          <h2>Герои ({heroes.length})</h2>
          <button className="ghost small" disabled={busy} onClick={onRefresh}>
            Обновить
          </button>
        </div>

        {heroes.length ? (
          <ul className="hero-cards">
            {heroes.map((player) => (
              <li key={player.id}>
                {player.hero.image ? (
                  <img src={player.hero.image} alt={player.hero.name} />
                ) : (
                  <div className="hero-placeholder">{player.hero.name.slice(0, 1)}</div>
                )}
                <div>
                  <strong>{player.hero.name}</strong>
                  <div className="muted">
                    {player.hero.profession} · {player.first_name}
                  </div>
                  <p className="story">{player.hero.story}</p>
                  <div className="stats-mini">
                    {Object.entries(player.hero.stats || {}).map(([key, value]) => (
                      <span key={key}>
                        {key.toUpperCase()} {value}
                      </span>
                    ))}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">Пока никто не создал героя.</p>
        )}
      </section>

      {isMaster && waiting.length ? (
        <section className="card">
          <h2>Ещё создают</h2>
          <ul className="players">
            {waiting.map((player) => (
              <li key={player.id}>
                <strong>{player.first_name}</strong>
                <span className="badge">ждёт</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {isMaster && allReady ? (
        <section className="card">
          <h2>Готово к старту</h2>
          <p className="muted">Все игроки создали героев. Запустите приключение для всей партии.</p>
          <button disabled={busy} onClick={onBegin}>
            {busy ? "Запуск..." : "Старт"}
          </button>
        </section>
      ) : null}
    </>
  );
}
