import { inviteFromContacts } from "../telegram.js";

export default function RoomLobby({
  room,
  user,
  botUsername,
  webappUrl,
  busy,
  onLeave,
  onRefresh,
}) {
  const isMaster = room.master.id === user?.id;
  const canInvite = Boolean(botUsername || webappUrl);

  return (
    <>
      <header className="hero">
        <p className="eyebrow">Код {room.code}</p>
        <h1>{room.title}</h1>
        <p className="lead">
          {isMaster
            ? "Вы мастер комнаты. Пригласите игроков из контактов Telegram."
            : `Мастер: ${room.master.first_name}${
                room.master.username ? ` (@${room.master.username})` : ""
              }`}
        </p>
      </header>

      <section className="card">
        <div className="row-between">
          <h2>Игроки ({room.players.length}/8)</h2>
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
          Откроется Telegram: выберите контакт или чат и отправьте ссылку на комнату.
        </p>
        <div className="row">
          <button
            disabled={!canInvite}
            onClick={() =>
              inviteFromContacts({ botUsername, webappUrl, code: room.code })
            }
          >
            Пригласить из контактов
          </button>
          <button className="ghost" onClick={onLeave}>
            На главную
          </button>
        </div>
      </section>
    </>
  );
}
