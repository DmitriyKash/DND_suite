export function getWebApp() {
  return window.Telegram?.WebApp ?? null;
}

function isInsideTelegram(app) {
  if (!app) return false;
  if (app.initData) return true;
  const platform = app.platform;
  return Boolean(platform && platform !== "unknown");
}

export function initMiniApp() {
  const app = getWebApp();
  const ready = isInsideTelegram(app);

  if (ready) {
    app.ready();
    app.expand();
    if (app.setHeaderColor) {
      app.setHeaderColor("secondary_bg_color");
    }
    if (app.setBackgroundColor) {
      app.setBackgroundColor("bg_color");
    }
  }

  return {
    ready,
    user: app?.initDataUnsafe?.user ?? null,
  };
}

export function getInitData() {
  return getWebApp()?.initData || "";
}

export function getStartParam() {
  return getWebApp()?.initDataUnsafe?.start_param || "";
}

export function inviteFromContacts({ botUsername, webappUrl, code }) {
  const app = getWebApp();
  const invite = botUsername
    ? `https://t.me/${botUsername}?start=join_${code}`
    : `${String(webappUrl || "").replace(/\/$/, "")}/?room=${code}`;
  const share =
    `https://t.me/share/url?url=${encodeURIComponent(invite)}` +
    `&text=${encodeURIComponent("Присоединяйся к комнате D&D!")}`;

  if (app?.openTelegramLink) {
    app.openTelegramLink(share);
    return;
  }
  window.open(share, "_blank");
}
