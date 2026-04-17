export function bindGlobalEvents({
  screen,
  readingPanel,
  langSwitcher,
  readingBackBtn,
  readingCopyBtn,
  readingNativeShareBtn,
  pointerMode,
  languageController,
  readingController,
  shareController,
  urlStateController
}) {
  const cleanups = [];

  function on(target, eventName, handler, options) {
    if (!target || typeof target.addEventListener !== "function") return;

    target.addEventListener(eventName, handler, options);
    cleanups.push(() => target.removeEventListener(eventName, handler, options));
  }

  function resetTilt() {
    document.documentElement.style.setProperty("--tilt-x", "0");
    document.documentElement.style.setProperty("--tilt-y", "0");
    document.documentElement.style.setProperty("--glow-x", "50%");
    document.documentElement.style.setProperty("--glow-y", "50%");
  }

  function handleScreenPointerMove(event) {
    if (!screen || pointerMode.matches) return;

    const rect = screen.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const relativeX = (event.clientX - rect.left) / rect.width;
    const relativeY = (event.clientY - rect.top) / rect.height;

    const tiltX = (relativeX - 0.5) * 10;
    const tiltY = (relativeY - 0.5) * 10;

    document.documentElement.style.setProperty("--tilt-x", tiltX.toFixed(2));
    document.documentElement.style.setProperty("--tilt-y", tiltY.toFixed(2));
    document.documentElement.style.setProperty(
      "--glow-x",
      `${(relativeX * 100).toFixed(2)}%`
    );
    document.documentElement.style.setProperty(
      "--glow-y",
      `${(relativeY * 100).toFixed(2)}%`
    );
  }

  function handleLangSwitcherClick(event) {
    const button = event.target.closest(".lang-flag");
    if (!button) return;

    languageController.setLanguage(button.dataset.lang, {
      syncUrl: true,
      emitAnalytics: true
    });
  }

  function handleEscapeClose(event) {
    if (event.key !== "Escape") return;
    if (!screen || !screen.classList.contains("is-reading")) return;

    readingController.closeDiscipline({
      syncUrl: true,
      analyticsMode: "full"
    });
  }

  on(readingBackBtn, "click", () => {
    readingController.closeDiscipline({
      syncUrl: true,
      analyticsMode: "full"
    });
  });

  on(readingCopyBtn, "click", () => {
    shareController.handleCopyLinkAction();
  });

  on(readingNativeShareBtn, "click", () => {
    shareController.handleNativeShareAction();
  });

  on(langSwitcher, "click", handleLangSwitcherClick);

  on(window, "popstate", () => {
    urlStateController.scheduleApply("full");
  });

  on(window, "hashchange", () => {
    urlStateController.scheduleApply("full");
  });

  on(document, "keydown", handleEscapeClose);

  on(screen, "pointermove", handleScreenPointerMove);
  on(screen, "pointerleave", resetTilt);
  on(pointerMode, "change", resetTilt);

  on(readingPanel, "click", (event) => {
    event.stopPropagation();
  });

  resetTilt();

  return function cleanupAllEvents() {
    cleanups.forEach((cleanup) => cleanup());
  };
}