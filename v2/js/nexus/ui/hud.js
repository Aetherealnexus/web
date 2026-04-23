export function createHudController({ dom, config }) {
  function sync(state) {
    if (dom.zoomChipValue) {
      dom.zoomChipValue.textContent = `${Math.round(state.view.zoom * 100)}%`;
    }

    if (dom.modeChipValue) {
      dom.modeChipValue.textContent = state.ui.modeLabel;
    }

    if (dom.focusChipValue) {
      dom.focusChipValue.textContent = state.ui.focusLabel;
    }

    if (dom.hintsText) {
      dom.hintsText.textContent = state.ui.dynamicHint || config.ui.hintMessage;
    }

    if (dom.toggleHintsBtn) {
      dom.toggleHintsBtn.setAttribute("aria-pressed", String(state.ui.hintsVisible));
    }

    if (dom.toggleAudioBtn) {
      dom.toggleAudioBtn.setAttribute("aria-pressed", String(state.ui.audioActive));
    }

    dom.langButtons.forEach((button) => {
      button.classList.toggle("is-active", button.dataset.lang === state.app.currentLanguage);
    });

    document.documentElement.lang = state.app.currentLanguage;
  }

  return Object.freeze({
    sync
  });
}