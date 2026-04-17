import {
  DEFAULT_LANG,
  SUPPORTED_LANGS,
  FALLBACK_SVG,
  getRuntimeGlobals
} from "./core/config.js";

import { getDomRefs } from "./core/dom.js";
import { createAppState } from "./core/state.js";

import {
  getUi,
  setDocumentLang,
  setButtonLabel,
  getDisciplineByKey,
  getLocalizedDiscipline,
  getLanguageFromUrl,
  getDisciplineKeyFromUrl,
  buildStateUrl,
  buildAbsoluteStateUrl,
  syncUrlState,
  setMetaContent,
  escapeHtml
} from "./core/utils.js";

import { bindGlobalEvents } from "./core/events.js";

import { createPerfController } from "./services/perf.js";
import { createBackgroundController } from "./services/background.js";
import { createContentService } from "./features/content.js";
import { createAnalyticsService } from "./services/analytics.js";
import { createMetaService } from "./services/meta.js";
import { createUrlStateController } from "./services/url-state.js";

import { createOrbitController } from "./features/orbit.js";
import { createReadingController } from "./features/reading.js";
import { createShareController } from "./features/share.js";
import { createLanguageController } from "./features/language.js";

export function bootstrapNexusApp({ disciplines = [], backgrounds = [] } = {}) {
  const runtime = getRuntimeGlobals();
  const dom = getDomRefs();
  const state = createAppState();
  const AEN_PERF = createPerfController();

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const pointerMode = window.matchMedia("(hover: none), (pointer: coarse)");

  const { bgMode, supportsNativeShare } = runtime;

  const {
    pageBg,
    pageBgCanvas,
    orbit,
    screen,
    readingPanel,
    readingBackBtn,
    readingCopyBtn,
    readingNativeShareBtn,
    metaDescription,
    canonicalUrl,
    metaOgTitle,
    metaOgDescription,
    metaOgUrl,
    metaTwitterTitle,
    metaTwitterDescription,
    langSwitcher,
    langButtons
  } = dom;

  if (!orbit || !screen || !Array.isArray(disciplines) || disciplines.length === 0) {
    return null;
  }

  const total = disciplines.length;

  const baseMeta = {
    title: document.title,
    description: metaDescription ? metaDescription.getAttribute("content") || "" : "",
    canonical: canonicalUrl ? canonicalUrl.getAttribute("href") || "" : "",
    ogTitle: metaOgTitle ? metaOgTitle.getAttribute("content") || "" : "",
    ogDescription: metaOgDescription ? metaOgDescription.getAttribute("content") || "" : "",
    ogUrl: metaOgUrl ? metaOgUrl.getAttribute("content") || "" : "",
    twitterTitle: metaTwitterTitle ? metaTwitterTitle.getAttribute("content") || "" : "",
    twitterDescription: metaTwitterDescription
      ? metaTwitterDescription.getAttribute("content") || ""
      : ""
  };

  const ui = (lang = state.currentLang) => getUi(lang);
  const localizeDiscipline = (item, lang = state.currentLang) =>
    getLocalizedDiscipline(item, lang, ui);

  const fxController = createBackgroundController({
    bgMode,
    backgrounds,
    pageBg,
    pageBgCanvas,
    prefersReducedMotion
  });

  const analyticsService = createAnalyticsService({
    baseTitle: baseMeta.title,
    localizeDiscipline,
    buildAbsoluteStateUrl,
    buildStateUrl
  });

  const metaService = createMetaService({
    state,
    metaElements: {
      metaDescription,
      canonicalUrl,
      metaOgTitle,
      metaOgDescription,
      metaOgUrl,
      metaTwitterTitle,
      metaTwitterDescription
    },
    baseMeta,
    localizeDiscipline,
    buildAbsoluteStateUrl,
    setMetaContent
  });

  const shareController = createShareController({
    state,
    dom,
    disciplines,
    supportsNativeShare,
    ui,
    localizeDiscipline,
    setButtonLabel,
    getDisciplineByKey,
    buildAbsoluteStateUrl,
    analyticsService
  });

  const languageController = createLanguageController({
    state,
    dom: {
      readingBackBtn,
      readingBackBtnText: dom.readingBackBtnText,
      langButtons
    },
    SUPPORTED_LANGS,
    ui,
    setDocumentLang,
    setButtonLabel,
    shareController,
    syncUrlState,
    analyticsService
  });

  const contentService = createContentService({
    disciplines,
    state,
    getUi: ui,
    getLocalizedDiscipline: localizeDiscipline,
    DEFAULT_LANG,
    AEN_PERF
  });

  const orbitController = createOrbitController({
    orbit,
    screen,
    disciplines,
    total,
    FALLBACK_SVG,
    escapeHtml,
    pointerMode
  });

  const readingController = createReadingController({
    dom,
    state,
    disciplines,
    total,
    FALLBACK_SVG,
    getUi: ui,
    getLocalizedDiscipline: localizeDiscipline,
    contentService,
    orbitController,
    applyDisciplineMeta: metaService.applyDisciplineMeta,
    restoreBaseMeta: metaService.restoreBaseMeta,
    updateStaticUiLanguage: languageController.updateStaticUiLanguage,
    fxController,
    syncUrlState,
    sendDisciplineAnalytics: analyticsService.trackDisciplineOpen,
    sendHomeAnalytics: analyticsService.trackHomeView,
    AEN_PERF,
    onResetFeedback: shareController.resetFeedback
  });

  const urlStateController = createUrlStateController({
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
  });

  languageController.setRerenderHandler(() => {
    return readingController.rerenderCurrentDiscipline();
  });

  orbitController.setOpenHandler((key) => {
    readingController.openDiscipline(key, {
      syncUrl: true,
      analyticsMode: "full"
    });
  });

  orbitController.init();

  const cleanupEvents = bindGlobalEvents({
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
  });

  languageController.updateStaticUiLanguage();

  urlStateController.applyUrlState({
    analyticsMode: getDisciplineKeyFromUrl(disciplines) ? "event-only" : "none"
  });

  return {
    state,
    dom,
    disciplines,
    services: {
      AEN_PERF,
      fxController,
      analyticsService,
      metaService,
      contentService,
      urlStateController
    },
    controllers: {
      orbitController,
      readingController,
      shareController,
      languageController
    },
    cleanup() {
      if (typeof cleanupEvents === "function") {
        cleanupEvents();
      }

      if (typeof orbitController.cleanup === "function") {
        orbitController.cleanup();
      }
    }
  };
}