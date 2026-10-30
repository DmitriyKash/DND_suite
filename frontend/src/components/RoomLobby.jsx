import { inviteFromContacts } from "../telegram.js";

export default function RoomLobby({
  room,
  user,
  botUsername,
  webappUrl,
  busy,
  onLeave,
  onRefresh,
  onStart,
}) {
  const isMaster = Number(room.master.id) === Number(user?.id);
  const playersCount = room.players.length;

  return (
    <>
      <header className="hero">
        <p className="eyebrow">Код {room.code}</p>
        <h1>{room.title}</h1>
        <p className="lead">
          {isMaster
            ? "Вы мастер комнаты. Когда все готовы — нажмите «Начать игру»."
            : `Мастер: ${room.master.first_name}${
                room.master.username ? ` (@${room.master.username})` : ""
              }. Ожидайте старта.`}
        </p>
      </header>

      <section className="card">
        <div className="row-between">
          <h2>Игроки ({playersCount}/8)</h2>
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
        <h2>Приглашение</h2>
        <p className="muted">
          Код комнаты: <strong>{room.code}</strong>. Можно отправить контактy в Telegram.
        </p>
        <div className="row">
          <button
            className="ghost"
            onClick={() =>
              inviteFromContacts({ botUsername, webappUrl, code: room.code })
            }
          >
            Пригласить из контактов
          </button>
          <button
            className="ghost"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(room.code);
              } catch {
                /* ignore */
              }
            }}
          >
            Копировать код
          </button>
        </div>
      </section>

      {isMaster ? (
        <section className="card">
          <h2>Старт</h2>
          <p className="muted">Игра сразу откроется у всех, кто сейчас в комнате.</p>
          <div className="row">
            <button disabled={busy} onClick={onStart}>
              {busy ? "Запуск..." : "Начать игру"}
            </button>
            <button className="ghost" onClick={onLeave}>
              На главную
            </button>
          </div>
        </section>
      ) : (
        <section className="card">
          <p className="muted">Ждём, пока мастер нажмёт «Начать игру»…</p>
          <button className="ghost" onClick={onLeave}>
            На главную
          </button>
        </section>
      )}
    </>
  );
}
