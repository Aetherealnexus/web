import { getDisciplineByKey } from "../core/utils.js";
import { createReadingShell } from "./reading-shell.js";
import { createReadingNavigation } from "./reading-navigation.js";

export function createReadingController({
  dom,
  state,
  disciplines,
  total,
  FALLBACK_SVG,
  getUi,
  getLocalizedDiscipline,
  contentService,
  orbitController,
  applyDisciplineMeta,
  restoreBaseMeta,
  updateStaticUiLanguage,
  fxController,
  syncUrlState,
  sendDisciplineAnalytics,
  sendHomeAnalytics,
  AEN_PERF,
  onResetFeedback
}) {
  const shell = createReadingShell({
    dom,
    state,
    disciplines,
    total,
    FALLBACK_SVG,
    getUi,
    getLocalizedDiscipline,
    applyDisciplineMeta,
    updateStaticUiLanguage
  });

  const navigation = createReadingNavigation({
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
  });

  function openDiscipline(key, options = {}) {
    const item = getDisciplineByKey(disciplines, key);
    if (!item) return;
    navigation.openDiscipline(item, options);
  }

  return {
    applyReadingShell: shell.applyReadingShell,
    getCurrentItem: shell.getCurrentItem,
    openDiscipline,
    closeDiscipline: navigation.closeDiscipline,
    rerenderCurrentDiscipline: navigation.rerenderCurrentDiscipline
  };
}