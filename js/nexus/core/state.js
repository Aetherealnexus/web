import { DEFAULT_LANG, SUPPORTED_LANGS } from "./config.js";

export function resolveInitialLanguage() {
  const url = new URL(window.location.href);
  const langFromUrl = url.searchParams.get("lang");

  if (SUPPORTED_LANGS.includes(langFromUrl)) {
    return langFromUrl;
  }

  const saved = localStorage.getItem("aen_lang");
  return SUPPORTED_LANGS.includes(saved) ? saved : DEFAULT_LANG;
}

export function createAppState() {
  return {
    currentLang: resolveInitialLanguage(),
    currentOpenDisciplineKey: null,
    clearStateTimer: null,
    copyFeedbackTimer: null,
    shareFeedbackTimer: null,
    copyFeedbackState: "default",
    nativeShareFeedbackState: "default",
    stateApplyFrame: 0,
    readingRenderToken: 0,
    nodes: [],
    readingPayloadCache: new Map()
  };
}