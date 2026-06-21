// Баннер установки PWA для сайта Lady Sugar
// Показывает плавающую кнопку «Установить приложение» с определением платформы.

(function () {
  "use strict";

  const CONFIG = {
    appName: "Lady Sugar",
    appUrl: window.location.origin, // текущий сайт
    themeColor: "#B08D74",
    showAfterSeconds: 3,       // показать через N секунд
    dismissDays: 7,            // после закрытия не показывать N дней
    storageKey: "ladysugar_pwa_banner_dismissed",
    installedKey: "ladysugar_pwa_installed",  // флаг: PWA уже установлено
  };

  // Уже установлен как PWA? — не показываем баннер никогда
  if (window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true) {
    try { localStorage.setItem(CONFIG.installedKey, "1"); } catch (e) {}
    return;
  }

  // Ранее уже устанавливали PWA? — не показываем баннер
  try {
    if (localStorage.getItem(CONFIG.installedKey) === "1") return;
  } catch (e) {}

  // Не показываем, если недавно закрыли
  try {
    const dismissed = localStorage.getItem(CONFIG.storageKey);
    if (dismissed) {
      const days = (Date.now() - parseInt(dismissed, 10)) / 86400000;
      if (days < CONFIG.dismissDays) return;
    }
  } catch (e) {}

  // Определяем платформу
  const ua = navigator.userAgent.toLowerCase();
  const isIOS = /iphone|ipad|ipod/.test(ua) && !window.MSStream;
  const isAndroid = /android/.test(ua);

  // Перехватываем beforeinstallprompt (Chrome/Android)
  let deferredPrompt = null;
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
  });

  // При установке PWA — скрываем баннер мгновенно и ставим флаг
  window.addEventListener("appinstalled", () => {
    try { localStorage.setItem(CONFIG.installedKey, "1"); } catch (e) {}
    const banner = document.getElementById("pwa-install-banner");
    if (banner) {
      banner.classList.remove("show");
      setTimeout(() => banner.remove(), 400);
    }
  });

  // Регистрируем service worker
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }

  // Создаём баннер
  function createBanner() {
    const banner = document.createElement("div");
    banner.id = "pwa-install-banner";

    const subtitle = isIOS
      ? "Добавьте на главный экран — будет как приложение"
      : isAndroid
      ? "Быстрый доступ с главного экрана"
      : "Установите как приложение";

    banner.innerHTML = `
      <div class="banner-icon">🪒</div>
      <div class="banner-text">
        <div class="banner-title">${CONFIG.appName}</div>
        <div class="banner-subtitle">${subtitle}</div>
      </div>
      <div class="banner-actions">
        <button class="btn-install">Установить</button>
        <button class="btn-dismiss" aria-label="Закрыть">×</button>
      </div>
    `;
    document.body.appendChild(banner);

    // Показать с анимацией
    setTimeout(() => banner.classList.add("show"), 100);

    // Кнопка «Установить»
    banner.querySelector(".btn-install").addEventListener("click", async () => {
      if (isIOS) {
        showIOSModal();
      } else if (deferredPrompt) {
        // Chrome/Android — нативный диалог установки
        deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === "accepted") {
          // Событие appinstalled сработает само, но подстрахуемся
          try { localStorage.setItem(CONFIG.installedKey, "1"); } catch (e) {}
          banner.classList.remove("show");
          setTimeout(() => banner.remove(), 400);
        }
        deferredPrompt = null;
      } else {
        // Фолбэк — просто перезагружаем (на десктопе)
        window.location.reload();
      }
    });

    // Кнопка «Закрыть»
    banner.querySelector(".btn-dismiss").addEventListener("click", () => {
      banner.classList.remove("show");
      setTimeout(() => banner.remove(), 400);
      try {
        localStorage.setItem(CONFIG.storageKey, String(Date.now()));
      } catch (e) {}
    });

    return banner;
  }

  // Модальное окно с инструкцией для iOS
  function showIOSModal() {
    let modal = document.getElementById("pwa-ios-modal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "pwa-ios-modal";
      modal.innerHTML = `
        <div class="modal-content">
          <div class="modal-icon">📱</div>
          <h3>Установка на iPhone</h3>
          <div class="step">
            <span class="step-num">1</span>
            <span>Нажмите кнопку <strong>«Поделиться»</strong> <span style="font-size:18px">⬆️</span> внизу Safari</span>
          </div>
          <div class="step">
            <span class="step-num">2</span>
            <span>Выберите <strong>«На экран Домой»</strong></span>
          </div>
          <div class="step">
            <span class="step-num">3</span>
            <span>Нажмите <strong>«Добавить»</strong></span>
          </div>
          <p>Иконка Lady Sugar появится на главном экране и будет открываться как приложение.</p>
          <button class="btn-close-modal">Понятно</button>
        </div>
      `;
      document.body.appendChild(modal);
      modal.querySelector(".btn-close-modal").addEventListener("click", () => {
        modal.classList.remove("show");
      });
      modal.addEventListener("click", (e) => {
        if (e.target === modal) modal.classList.remove("show");
      });
    }
    modal.classList.add("show");
  }

  // Показать баннер через N секунд (после загрузки страницы)
  if (document.readyState === "complete") {
    setTimeout(createBanner, CONFIG.showAfterSeconds * 1000);
  } else {
    window.addEventListener("load", () => {
      setTimeout(createBanner, CONFIG.showAfterSeconds * 1000);
    });
  }

  // Если сработал beforeinstallprompt — показываем баннер сразу
  window.addEventListener("beforeinstallprompt", () => {
    setTimeout(createBanner, 500);
  });
})();
