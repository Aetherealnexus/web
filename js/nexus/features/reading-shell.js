import { getDisciplineByKey } from "../core/utils.js";

export function createReadingShell({
  dom,
  state,
  disciplines,
  total,
  FALLBACK_SVG,
  getUi,
  getLocalizedDiscipline,
  applyDisciplineMeta,
  updateStaticUiLanguage
}) {
  const {
    readingLayer,
    readingSigil,
    readingEyebrow,
    readingTitle,
    readingPronounced,
    readingDiscipline,
    readingIntersection,
    readingConclusion,
    readingScroll
  } = dom;

  function applyReadingShell(item) {
    const localized = getLocalizedDiscipline(item, state.currentLang, getUi);
    const index = disciplines.findIndex((entry) => entry.key === item.key) + 1;
    const hue = Math.round((360 / total) * (index - 1));
    const svgMarkup =
      typeof item.svg === "string" && item.svg.trim() ? item.svg : FALLBACK_SVG;
    const ui = getUi(state.currentLang);

    document.documentElement.style.setProperty("--discipline-hue", String(hue));

    if (readingLayer) {
      readingLayer.setAttribute("aria-hidden", "false");
    }

    if (readingSigil) {
      readingSigil.innerHTML = svgMarkup;
    }

    if (readingEyebrow) {
      readingEyebrow.textContent = `${ui.eyebrow} ${String(index).padStart(2, "0")}`;
    }

    if (readingTitle) {
      readingTitle.textContent = localized.title;
    }

    if (readingPronounced) {
      readingPronounced.textContent = localized.pronounced;
    }

    if (readingDiscipline) {
      readingDiscipline.textContent = localized.discipline;
    }

    if (readingIntersection) {
      readingIntersection.textContent = localized.intersection;
    }

    if (readingConclusion) {
      readingConclusion.textContent = localized.conclusion;
    }

    if (readingScroll) {
      readingScroll.scrollTop = 0;
    }

    applyDisciplineMeta(item);
    updateStaticUiLanguage();
  }

  function getCurrentItem() {
    if (!state.currentOpenDisciplineKey) return null;
    return getDisciplineByKey(disciplines, state.currentOpenDisciplineKey);
  }

  function hideReadingShell() {
    if (readingLayer) {
      readingLayer.setAttribute("aria-hidden", "true");
    }
  }

  return {
    applyReadingShell,
    getCurrentItem,
    hideReadingShell
  };
}