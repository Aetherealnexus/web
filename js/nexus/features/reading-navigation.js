export function createReadingNavigation({
  dom,
  state,
  orbitController,
  shell,
  contentService,
  restoreBaseMeta,
  updateStaticUiLanguage,
  fxController,
  syncUrlState,
  sendDisciplineAnalytics,
  sendHomeAnalytics,
  AEN_PERF,
  onResetFeedback
}) {
  const {
    screen,
    readingArticle
  } = dom;

  function openDiscipline(item, options = {}) {
    const {
      syncUrl = true,
      analyticsMode = "full",
      replaceHistory = false
    } = options;

    if (!item) return;

    const startTime = performance.now();

    state.currentOpenDisciplineKey = item.key;
    state.readingRenderToken += 1;

    clearTimeout(state.clearStateTimer);

    if (typeof onResetFeedback === "function") {
      onResetFeedback();
    }

    orbitController.selectKey(item.key);
    shell.applyReadingShell(item);

    requestAnimationFrame(() => {
      screen?.classList.add("is-reading");
    });

    if (fxController && typeof fxController.pause === "function") {
      fxController.pause();
    }

    if (syncUrl) {
      syncUrlState({
        disciplineKey: item.key,
        language: state.currentLang,
        replace: replaceHistory
      });
    }

    if (analyticsMode === "full") {
      sendDisciplineAnalytics(item, state.currentLang, { includePageView: true });
    } else if (analyticsMode === "event-only") {
      sendDisciplineAnalytics(item, state.currentLang, { includePageView: false });
    }

    contentService.renderReadingContentInPhases({
      item,
      lang: state.currentLang,
      token: state.readingRenderToken,
      startTime,
      readingArticle
    });
  }

  function closeDiscipline(options = {}) {
    const {
      syncUrl = true,
      analyticsMode = "full",
      replaceHistory = false
    } = options;

    const hadOpenDiscipline = Boolean(state.currentOpenDisciplineKey);

    state.currentOpenDisciplineKey = null;
    state.readingRenderToken += 1;

    screen?.classList.remove("is-reading");

    if (typeof onResetFeedback === "function") {
      onResetFeedback();
    }

    if (typeof contentService.clearActiveStreaming === "function") {
      contentService.clearActiveStreaming();
    }

    shell.hideReadingShell();

    if (readingArticle) {
      readingArticle.innerHTML = "";
      contentService.setReadingLoadingState(readingArticle, false);
    }

    restoreBaseMeta();
    updateStaticUiLanguage();

    if (fxController && typeof fxController.resume === "function") {
      fxController.resume();
    }

    if (syncUrl) {
      syncUrlState({
        disciplineKey: null,
        language: state.currentLang,
        replace: replaceHistory
      });
    }

    if (analyticsMode === "full" && hadOpenDiscipline) {
      sendHomeAnalytics(state.currentLang);
    }

    clearTimeout(state.clearStateTimer);
    state.clearStateTimer = window.setTimeout(() => {
      orbitController.clearSelection();
    }, 520);
  }

  function rerenderCurrentDiscipline() {
    const currentItem = shell.getCurrentItem();
    if (!currentItem) return null;

    const startTime = performance.now();

    shell.applyReadingShell(currentItem);
    state.readingRenderToken += 1;

    contentService.renderReadingContentInPhases({
      item: currentItem,
      lang: state.currentLang,
      token: state.readingRenderToken,
      startTime,
      readingArticle
    });

    return currentItem;
  }

  return {
    openDiscipline,
    closeDiscipline,
    rerenderCurrentDiscipline
  };
}