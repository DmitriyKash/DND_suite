export default function GameSession({ room, user, busy, onRefresh }) {
  const isMaster = Number(room.master.id) === Number(user?.id);

  return (
    <>
      <header className="hero">
        <p className="eyebrow">Игра · {room.code}</p>
        <h1>{room.title}</h1>
        <p className="lead">
          {isMaster
            ? "Игра запущена. Вы ведёте сессию как мастер."
            : "Мастер начал игру. Ожидайте его повествования."}
        </p>
      </header>

      <section className="card">
        <div className="row-between">
          <h2>Участники ({room.players.length})</h2>
          <button className="ghost small" disabled={busy} onClick={onRefresh}>
            Обновить
          </button>
        </div>
        <ul className="players">
          {room.players.map((player) => (
            <li key={player.id}>
              <div>
                <strong>{player.first_name}</strong>
                {player.username ? <span className="muted"> @{player.username}</span> : null}
              </div>
              <span className={`badge ${player.role === "master" ? "master" : ""}`}>
                {player.role === "master" ? "Мастер" : "Игрок"}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="card">
        <h2>Сцена</h2>
        <p className="muted">
          Сессия активна для всех в комнате. Следующие ходы и бой добавим на следующем шаге.
        </p>
      </section>
    </>
  );
}
