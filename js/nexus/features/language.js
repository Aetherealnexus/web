export function createLanguageController({
  state,
  dom,
  SUPPORTED_LANGS,
  ui,
  setDocumentLang,
  setButtonLabel,
  shareController,
  syncUrlState,
  analyticsService
}) {
  const {
    readingBackBtn,
    readingBackBtnText,
    langButtons
  } = dom;

  let rerenderCurrentDiscipline = () => null;

  function setRerenderHandler(handler) {
    rerenderCurrentDiscipline =
      typeof handler === "function" ? handler : () => null;
  }

  function updateLanguageButtons() {
    langButtons.forEach((button) => {
      button.classList.toggle("is-active", button.dataset.lang === state.currentLang);
    });
  }

  function updateStaticUiLanguage() {
    const currentUi = ui(state.currentLang);

    setDocumentLang(state.currentLang);
    updateLanguageButtons();

    setButtonLabel(readingBackBtn, readingBackBtnText, currentUi.back);

    const summaryLabels = document.querySelectorAll(".reading-summary__label");
    if (summaryLabels[0]) summaryLabels[0].textContent = currentUi.disciplineLabel;
    if (summaryLabels[1]) summaryLabels[1].textContent = currentUi.intersectionLabel;
    if (summaryLabels[2]) summaryLabels[2].textContent = currentUi.conclusionLabel;

    shareController.refreshUi();
  }

  function setLanguage(lang, options = {}) {
    if (!SUPPORTED_LANGS.includes(lang)) return null;

    const {
      emitAnalytics = true,
      syncUrl = true,
      replaceHistory = false
    } = options;

    const previousLang = state.currentLang;
    state.currentLang = lang;
    localStorage.setItem("aen_lang", lang);

    updateStaticUiLanguage();

    const currentItem = rerenderCurrentDiscipline();

    if (syncUrl) {
      syncUrlState({
        disciplineKey: state.currentOpenDisciplineKey,
        language: lang,
        replace: replaceHistory
      });
    }

    if (emitAnalytics && previousLang !== lang) {
      analyticsService.trackLanguageChange(lang, currentItem);

      if (!currentItem) {
        analyticsService.trackHomeView(lang);
      }
    }

    return currentItem;
  }

  return {
    setRerenderHandler,
    updateLanguageButtons,
    updateStaticUiLanguage,
    setLanguage
  };
}