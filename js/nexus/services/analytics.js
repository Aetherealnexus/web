export function createAnalyticsService({
  baseTitle,
  localizeDiscipline,
  buildAbsoluteStateUrl,
  buildStateUrl
}) {
  function trackDisciplineOpen(discipline, language = "en", options = {}) {
    const { includePageView = true } = options;
    if (!discipline || !discipline.key) return;

    const localized = localizeDiscipline(discipline, language);
    const safeLanguage = language || document.documentElement.lang || "en";

    if (typeof window.trackDisciplineOpen === "function") {
      window.trackDisciplineOpen(
        discipline.key,
        localized.title || discipline.title || "",
        safeLanguage
      );
    }

    if (includePageView && typeof window.gtag === "function") {
      const absoluteUrl = buildAbsoluteStateUrl({
        disciplineKey: discipline.key,
        language: safeLanguage
      });

      const relativeUrl = buildStateUrl({
        disciplineKey: discipline.key,
        language: safeLanguage
      });

      window.gtag("event", "page_view", {
        page_title: `${localized.title || discipline.title || discipline.key} – Aethereal Nexus`,
        page_location: absoluteUrl,
        page_path: relativeUrl,
        language: safeLanguage
      });
    }
  }

  function trackLanguageChange(language = "en", discipline = null) {
    const safeLanguage = language || document.documentElement.lang || "en";

    if (typeof window.trackLanguageChange === "function") {
      window.trackLanguageChange(safeLanguage);
    }

    if (discipline && typeof window.gtag === "function") {
      const localized = localizeDiscipline(discipline, safeLanguage);
      const absoluteUrl = buildAbsoluteStateUrl({
        disciplineKey: discipline.key,
        language: safeLanguage
      });

      const relativeUrl = buildStateUrl({
        disciplineKey: discipline.key,
        language: safeLanguage
      });

      window.gtag("event", "page_view", {
        page_title: `${localized.title || discipline.title || "Discipline"} – Aethereal Nexus (${safeLanguage.toUpperCase()})`,
        page_location: absoluteUrl,
        page_path: relativeUrl,
        language: safeLanguage
      });
    }
  }

  function trackHomeView(language = "en") {
    const safeLanguage = language || document.documentElement.lang || "en";

    const absoluteUrl = buildAbsoluteStateUrl({
      disciplineKey: null,
      language: safeLanguage
    });

    const relativeUrl = buildStateUrl({
      disciplineKey: null,
      language: safeLanguage
    });

    if (typeof window.gtag === "function") {
      window.gtag("event", "page_view", {
        page_title: baseTitle,
        page_location: absoluteUrl,
        page_path: relativeUrl,
        language: safeLanguage
      });
    }
  }

  function trackShare(method, discipline, language = "en") {
    if (!discipline || typeof window.gtag !== "function") return;

    const localized = localizeDiscipline(discipline, language);

    window.gtag("event", "discipline_share", {
      share_method: method || "copy_link",
      discipline_key: discipline.key || "",
      discipline_title: localized.title || discipline.title || "",
      language_selected: language || document.documentElement.lang || "en"
    });
  }

  return {
    trackDisciplineOpen,
    trackLanguageChange,
    trackHomeView,
    trackShare
  };
}