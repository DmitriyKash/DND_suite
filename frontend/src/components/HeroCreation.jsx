import { useMemo, useState } from "react";

const PROFESSIONS = [
  "Воин",
  "Следопыт",
  "Плут",
  "Маг",
  "Жрец",
  "Бард",
  "Варвар",
  "Паладин",
];

const STAT_LABELS = {
  str: "Сила",
  dex: "Ловкость",
  con: "Телосложение",
  int: "Интеллект",
  wis: "Мудрость",
  cha: "Харизма",
};

const DEFAULT_STATS = { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 };
const POOL = 27;

function costOf(value) {
  // Simple point-buy style relative to 8 baseline
  if (value <= 13) return value - 8;
  if (value === 14) return 7;
  return 9; // 15
}

function poolUsed(stats) {
  return Object.values(stats).reduce((acc, v) => acc + costOf(v), 0);
}

async function compressImage(file) {
  const bitmap = await createImageBitmap(file);
  const maxSide = 512;
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(bitmap, 0, 0, width, height);
  return canvas.toDataURL("image/jpeg", 0.72);
}

export default function HeroCreation({ busy, onSubmit }) {
  const [name, setName] = useState("");
  const [gender, setGender] = useState("M");
  const [profession, setProfession] = useState(PROFESSIONS[0]);
  const [story, setStory] = useState("");
  const [stats, setStats] = useState(DEFAULT_STATS);
  const [image, setImage] = useState("");
  const [localError, setLocalError] = useState("");

  const used = useMemo(() => poolUsed(stats), [stats]);
  const remaining = POOL - used;

  function changeStat(key, delta) {
    setStats((prev) => {
      const nextValue = prev[key] + delta;
      if (nextValue < 8 || nextValue > 15) return prev;
      const next = { ...prev, [key]: nextValue };
      if (poolUsed(next) > POOL) return prev;
      return next;
    });
  }

  async function onPickImage(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setLocalError("Нужен файл изображения");
      return;
    }
    try {
      const dataUrl = await compressImage(file);
      if (dataUrl.length > 350_000) {
        setLocalError("Картинка слишком большая, выберите другое фото");
        return;
      }
      setImage(dataUrl);
      setLocalError("");
    } catch {
      setLocalError("Не удалось обработать изображение");
    }
  }

  function submit() {
    if (name.trim().length < 2) {
      setLocalError("Укажите имя героя");
      return;
    }
    if (story.trim().length < 10) {
      setLocalError("Добавьте короткую историю (хотя бы пару предложений)");
      return;
    }
    if (remaining < 0) {
      setLocalError("Превышен пул очков характеристик");
      return;
    }
    setLocalError("");
    onSubmit({
      name: name.trim(),
      gender,
      profession,
      story: story.trim(),
      stats,
      image: image || null,
    });
  }

  return (
    <>
      <header className="hero">
        <p className="eyebrow">Создание героя</p>
        <h1>Ваш персонаж</h1>
        <p className="lead">
          Заполните характеристики, профессию и историю. Можно добавить портрет.
        </p>
      </header>

      {localError ? <p className="error">{localError}</p> : null}

      <section className="card">
        <h2>Основное</h2>
        <label>
          Имя
          <input value={name} maxLength={40} onChange={(e) => setName(e.target.value)} />
        </label>
        <div>
          <span className="field-label">Пол</span>
          <div className="row gender-row">
            <label className={`gender-option ${gender === "M" ? "active" : ""}`}>
              <input
                type="radio"
                name="gender"
                value="M"
                checked={gender === "M"}
                onChange={() => setGender("M")}
              />
              М
            </label>
            <label className={`gender-option ${gender === "F" ? "active" : ""}`}>
              <input
                type="radio"
                name="gender"
                value="F"
                checked={gender === "F"}
                onChange={() => setGender("F")}
              />
              Ж
            </label>
          </div>
        </div>
        <label>
          Профессия
          <select value={profession} onChange={(e) => setProfession(e.target.value)}>
            {PROFESSIONS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <label>
          Короткая история
          <textarea
            rows={4}
            maxLength={500}
            value={story}
            onChange={(e) => setStory(e.target.value)}
            placeholder="Откуда герой, чего хочет, какой у него порок..."
          />
        </label>
      </section>

      <section className="card">
        <div className="row-between">
          <h2>Характеристики</h2>
          <span className="muted">Очки: {remaining}/{POOL}</span>
        </div>
        <div className="stats-grid">
          {Object.keys(STAT_LABELS).map((key) => (
            <div className="stat-row" key={key}>
              <span>{STAT_LABELS[key]}</span>
              <div className="row">
                <button
                  type="button"
                  className="ghost small"
                  disabled={busy || stats[key] <= 8}
                  onClick={() => changeStat(key, -1)}
                >
                  −
                </button>
                <strong className="stat-value">{stats[key]}</strong>
                <button
                  type="button"
                  className="ghost small"
                  disabled={busy || stats[key] >= 15 || remaining <= 0}
                  onClick={() => changeStat(key, 1)}
                >
                  +
                </button>
              </div>
            </div>
          ))}
        </div>
        <p className="muted">База 10. Диапазон 8–15, пул {POOL} очков.</p>
      </section>

      <section className="card">
        <h2>Портрет</h2>
        {image ? (
          <img className="hero-portrait" src={image} alt="Портрет героя" />
        ) : (
          <p className="muted">Картинка необязательна, но поможет мастеру.</p>
        )}
        <label className="file-label">
          Загрузить картинку
          <input type="file" accept="image/*" onChange={onPickImage} />
        </label>
      </section>

      <button disabled={busy} onClick={submit}>
        {busy ? "Сохранение..." : "Готово, войти в игру"}
      </button>
    </>
  );
}
