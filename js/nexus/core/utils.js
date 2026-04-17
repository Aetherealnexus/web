import { DEFAULT_LANG, UI_TRANSLATIONS } from "./config.js";

export function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function getUi(lang) {
  return UI_TRANSLATIONS[lang] || UI_TRANSLATIONS[DEFAULT_LANG];
}

export function setDocumentLang(lang) {
  const htmlLang = lang === "pt" ? "pt-PT" : lang === "fr" ? "fr" : "en";
  document.documentElement.lang = htmlLang;
}

export function setButtonLabel(button, textNode, label) {
  if (textNode) {
    textNode.textContent = label;
  }

  if (button) {
    button.setAttribute("aria-label", label);
    button.setAttribute("title", label);
  }
}

export function getDisciplineByKey(disciplines, key) {
  return disciplines.find((item) => item.key === key) || null;
}

export function getLocalizedDiscipline(item, lang, getUiFn = getUi) {
  const localized = item?.translations?.[lang] || {};
  const ui = getUiFn(lang);

  return {
    title: localized.title || item.title,
    pronounced: localized.pronounced || item.pronounced,
    discipline: localized.discipline || item.discipline,
    intersection: localized.intersection || item.intersection,
    conclusion: localized.conclusion || item.conclusion,
    placeholderWord: localized.placeholderWord || item.placeholderWord || ui.unfolding,
    placeholderLabel: localized.placeholderLabel || item.placeholderLabel || ui.researchInProgress,
    placeholderText: localized.placeholderText || item.placeholderText || ui.researchPlaceholderText
  };
}

export function getLanguageFromUrl(supportedLangs) {
  const url = new URL(window.location.href);
  const lang = url.searchParams.get("lang");
  return supportedLangs.includes(lang) ? lang : null;
}

export function getDisciplineKeyFromUrl(disciplines) {
  const rawHash = window.location.hash.replace(/^#/, "").trim();
  if (!rawHash) return null;

  const decodedKey = decodeURIComponent(rawHash);
  return getDisciplineByKey(disciplines, decodedKey) ? decodedKey : null;
}

export function buildStateUrl({ disciplineKey, language }) {
  const url = new URL(window.location.href);

  if (language && language !== DEFAULT_LANG) {
    url.searchParams.set("lang", language);
  } else {
    url.searchParams.delete("lang");
  }

  url.hash = disciplineKey ? encodeURIComponent(disciplineKey) : "";

  return `${url.pathname}${url.search}${url.hash}`;
}

export function buildAbsoluteStateUrl({ disciplineKey, language }) {
  return `${window.location.origin}${buildStateUrl({ disciplineKey, language })}`;
}

export function syncUrlState({ disciplineKey, language, replace = false }) {
  const nextUrl = buildStateUrl({ disciplineKey, language });
  const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;

  if (nextUrl === currentUrl) return;

  const method = replace ? "replaceState" : "pushState";
  window.history[method](
    {
      disciplineKey: disciplineKey || null,
      language: language || DEFAULT_LANG
    },
    "",
    nextUrl
  );
}

export function setMetaContent(metaEl, value) {
  if (!metaEl) return;
  metaEl.setAttribute("content", value || "");
}

export function extractInlineReadingHtml(item, lang) {
  if (!item) return "";

  const localizedHtml = item?.translations?.[lang]?.readingHtml;
  if (typeof localizedHtml === "string" && localizedHtml.trim()) {
    return localizedHtml.trim();
  }

  if (lang !== DEFAULT_LANG) {
    const defaultLangHtml = item?.translations?.[DEFAULT_LANG]?.readingHtml;
    if (typeof defaultLangHtml === "string" && defaultLangHtml.trim()) {
      return defaultLangHtml.trim();
    }
  }

  if (typeof item.readingHtml === "string" && item.readingHtml.trim()) {
    return item.readingHtml.trim();
  }

  return "";
}