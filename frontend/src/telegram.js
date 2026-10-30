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
