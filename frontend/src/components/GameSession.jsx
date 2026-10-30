function buildTurnQueue(room) {
  const byId = new Map(room.players.map((p) => [Number(p.id), p]));
  const orderedIds = Array.isArray(room.turn_order) ? room.turn_order : [];
  const queued = orderedIds.map((id) => byId.get(Number(id))).filter(Boolean);
  const waiting = room.players.filter(
    (p) => p.role === "player" && p.hero && !p.initiative,
  );
  return { queued, waiting };
}

function TurnOrder({ queued, waiting, highlightId }) {
  return (
    <section className="card">
      <h2>Очередь хода</h2>
      {queued.length ? (
        <ol className="turn-order">
          {queued.map((player, index) => (
            <li
              key={player.id}
              className={Number(player.id) === Number(highlightId) ? "current" : ""}
            >
              <span className="turn-pos">{index + 1}</span>
              <div>
                <strong>{player.hero?.name || player.first_name}</strong>
                <div className="muted">
                  {player.initiative.expr} = {player.initiative.total}
                  {" · "}
                  d20 {player.initiative.d20}
                  {player.initiative.mod >= 0 ? "+" : ""}
                  {player.initiative.mod}
                </div>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <p className="muted">Пока никто не бросил инициативу.</p>
      )}

      {waiting.length ? (
        <>
          <h2>Ещё не бросили</h2>
          <ul className="players">
            {waiting.map((player) => (
              <li key={player.id}>
                <strong>{player.hero?.name || player.first_name}</strong>
                <span className="badge">ждёт</span>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </section>
  );
}

export default function GameSession({
  room,
  user,
  busy,
  onRefresh,
  onBegin,
  onRollInitiative,
  onStartTurns,
}) {
  const isMaster = Number(room.master.id) === Number(user?.id);
  const heroes = room.players.filter((p) => p.role === "player" && p.hero);
  const waitingHeroes = room.players.filter((p) => p.role === "player" && !p.hero);
  const allReady = waitingHeroes.length === 0 && heroes.length > 0;
  const inAdventure = room.status === "adventure";
  const me = room.players.find((p) => Number(p.id) === Number(user?.id));
  const { queued, waiting } = buildTurnQueue(room);
  const initiativeReady = room.initiative?.status === "ready";
  const turnsActive = Boolean(room.turns?.active);
  const currentId = turnsActive
    ? room.turn_order?.[room.turns?.index || 0]
    : queued[0]?.id;

  if (inAdventure) {
    return (
      <>
        <header className="hero">
          <p className="eyebrow">Приключение · {room.code}</p>
          <h1>{room.title}</h1>
          <p className="lead">
            {isMaster
              ? turnsActive
                ? "Ходы начались. Следите за очередью."
                : initiativeReady
                  ? "Все бросили инициативу. Можно запускать ходы."
                  : "Игроки бросают кубик на очередь хода."
              : turnsActive
                ? "Ходы начались. Смотрите очередь."
                : me?.initiative
                  ? "Ваш бросок принят. Ждите старта от мастера."
                  : "Бросьте d20 на инициативу (с модификатором Ловкости)."}
          </p>
        </header>

        {!isMaster && me?.hero && !me.initiative ? (
          <section className="card">
            <h2>Инициатива</h2>
            <p className="muted">
              Бросок на сервере: 1d20 + модификатор Ловкости (
              {Math.floor(((me.hero.stats?.dex || 10) - 10) / 2) >= 0 ? "+" : ""}
              {Math.floor(((me.hero.stats?.dex || 10) - 10) / 2)}).
            </p>
            <button disabled={busy} onClick={onRollInitiative}>
              {busy ? "Бросок..." : "Бросить кубик"}
            </button>
          </section>
        ) : null}

        {!isMaster && me?.initiative && !turnsActive ? (
          <section className="card">
            <h2>Ваш результат</h2>
            <p>
              <strong>
                {me.initiative.expr} = {me.initiative.total}
              </strong>
            </p>
            <p className="muted">
              d20: {me.initiative.d20}, мод: {me.initiative.mod}
            </p>
          </section>
        ) : null}

        <TurnOrder queued={queued} waiting={waiting} highlightId={currentId} />

        {isMaster && initiativeReady && !turnsActive ? (
          <section className="card">
            <h2>Готово к старту</h2>
            <p className="muted">Все игроки бросили кубик. Запустите ходы по очереди.</p>
            <button disabled={busy} onClick={onStartTurns}>
              {busy ? "Запуск..." : "Старт"}
            </button>
          </section>
        ) : null}

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
                    {player.hero.gender === "F" ? "Ж" : "М"} · {player.hero.profession} ·{" "}
                    {player.first_name}
                    {player.initiative ? ` · иниц. ${player.initiative.total}` : ""}
                  </div>
                </div>
              </li>
            ))}
          </ul>
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
                    {player.hero.gender === "F" ? "Ж" : "М"} · {player.hero.profession} ·{" "}
                    {player.first_name}
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

      {isMaster && waitingHeroes.length ? (
        <section className="card">
          <h2>Ещё создают</h2>
          <ul className="players">
            {waitingHeroes.map((player) => (
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
          <p className="muted">
            Все игроки создали героев. После старта они бросят кубик на очередь хода.
          </p>
          <button disabled={busy} onClick={onBegin}>
            {busy ? "Запуск..." : "Старт"}
          </button>
        </section>
      ) : null}
    </>
  );
}
