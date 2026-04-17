export function createUrlStateController({
  state,
  disciplines,
  SUPPORTED_LANGS,
  DEFAULT_LANG,
  getLanguageFromUrl,
  getDisciplineKeyFromUrl,
  getDisciplineByKey,
  languageController,
  readingController,
  metaService,
  analyticsService
}) {
  function applyUrlState(options = {}) {
    const { analyticsMode = "full" } = options;

    const targetLang =
      getLanguageFromUrl(SUPPORTED_LANGS) || state.currentLang || DEFAULT_LANG;

    const targetDisciplineKey = getDisciplineKeyFromUrl(disciplines);

    const langChanged = targetLang !== state.currentLang;
    const disciplineChanged =
      targetDisciplineKey !== state.currentOpenDisciplineKey;

    if (!langChanged && !disciplineChanged) return;

    if (langChanged) {
      languageController.setLanguage(targetLang, {
        emitAnalytics: false,
        syncUrl: false
      });
    }

    if (targetDisciplineKey) {
      if (disciplineChanged) {
        readingController.openDiscipline(targetDisciplineKey, {
          syncUrl: false,
          analyticsMode
        });
      } else if (langChanged && analyticsMode === "full") {
        const item = getDisciplineByKey(disciplines, targetDisciplineKey);
        if (item) {
          analyticsService.trackLanguageChange(targetLang, item);
        }
      }
      return;
    }

    if (disciplineChanged && state.currentOpenDisciplineKey) {
      readingController.closeDiscipline({
        syncUrl: false,
        analyticsMode
      });
      return;
    }

    metaService.restoreBaseMeta();
    languageController.updateStaticUiLanguage();

    if (langChanged && analyticsMode === "full") {
      analyticsService.trackHomeView(state.currentLang);
    }
  }

  function scheduleApply(analyticsMode = "full") {
    cancelAnimationFrame(state.stateApplyFrame);
    state.stateApplyFrame = window.requestAnimationFrame(() => {
      applyUrlState({ analyticsMode });
    });
  }

  return {
    applyUrlState,
    scheduleApply
  };
}