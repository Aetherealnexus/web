export function createShareController({
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
}) {
  const {
    readingCopyBtn,
    readingCopyBtnText,
    readingNativeShareBtn,
    readingNativeShareBtnText
  } = dom;

  function setCopyButtonState(buttonState = "default", options = {}) {
    const { autoReset = true } = options;
    const currentUi = ui(state.currentLang);
    state.copyFeedbackState = buttonState;

    if (!readingCopyBtn) return;

    clearTimeout(state.copyFeedbackTimer);

    let label = currentUi.copyLink;
    if (buttonState === "copied") label = currentUi.linkCopied;
    if (buttonState === "error") label = currentUi.linkCopyFailed;

    setButtonLabel(readingCopyBtn, readingCopyBtnText, label);
    readingCopyBtn.classList.toggle("is-success", buttonState === "copied");
    readingCopyBtn.classList.toggle("is-error", buttonState === "error");

    if (autoReset && buttonState !== "default") {
      state.copyFeedbackTimer = window.setTimeout(() => {
        setCopyButtonState("default", { autoReset: false });
      }, 1800);
    }
  }

  function setNativeShareButtonState(buttonState = "default", options = {}) {
    const { autoReset = true } = options;
    const currentUi = ui(state.currentLang);
    state.nativeShareFeedbackState = buttonState;

    if (!readingNativeShareBtn) return;

    clearTimeout(state.shareFeedbackTimer);

    let label = currentUi.shareNative;
    if (buttonState === "shared") label = currentUi.linkShared;
    if (buttonState === "error") label = currentUi.shareFailed;

    setButtonLabel(readingNativeShareBtn, readingNativeShareBtnText, label);
    readingNativeShareBtn.classList.toggle("is-success", buttonState === "shared");
    readingNativeShareBtn.classList.toggle("is-error", buttonState === "error");

    if (autoReset && buttonState !== "default") {
      state.shareFeedbackTimer = window.setTimeout(() => {
        setNativeShareButtonState("default", { autoReset: false });
      }, 1800);
    }
  }

  function refreshUi() {
    if (readingCopyBtn) {
      readingCopyBtn.disabled = !state.currentOpenDisciplineKey;
    }

    if (readingNativeShareBtn) {
      readingNativeShareBtn.hidden = !supportsNativeShare;
      readingNativeShareBtn.disabled = !state.currentOpenDisciplineKey || !supportsNativeShare;
    }

    setCopyButtonState(state.copyFeedbackState, { autoReset: false });
    setNativeShareButtonState(state.nativeShareFeedbackState, { autoReset: false });
  }

  function resetFeedback() {
    setCopyButtonState("default", { autoReset: false });
    setNativeShareButtonState("default", { autoReset: false });
  }

  function fallbackCopyText(text) {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    textarea.style.pointerEvents = "none";
    textarea.style.left = "-9999px";

    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();

    const successful = document.execCommand("copy");
    document.body.removeChild(textarea);

    if (!successful) {
      throw new Error("Copy command failed");
    }
  }

  async function handleCopyLinkAction() {
    if (!state.currentOpenDisciplineKey) return;

    const item = getDisciplineByKey(disciplines, state.currentOpenDisciplineKey);
    if (!item) return;

    const shareUrl = buildAbsoluteStateUrl({
      disciplineKey: item.key,
      language: state.currentLang
    });

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        fallbackCopyText(shareUrl);
      }

      setCopyButtonState("copied");
      analyticsService.trackShare("copy_link", item, state.currentLang);
    } catch {
      try {
        fallbackCopyText(shareUrl);
        setCopyButtonState("copied");
        analyticsService.trackShare("copy_link", item, state.currentLang);
      } catch {
        setCopyButtonState("error");
      }
    }
  }

  async function handleNativeShareAction() {
    if (!supportsNativeShare || !state.currentOpenDisciplineKey) return;

    const item = getDisciplineByKey(disciplines, state.currentOpenDisciplineKey);
    if (!item) return;

    const localized = localizeDiscipline(item, state.currentLang);
    const shareUrl = buildAbsoluteStateUrl({
      disciplineKey: item.key,
      language: state.currentLang
    });

    try {
      await navigator.share({
        title: `${localized.title} – Aethereal Nexus`,
        text: localized.conclusion || localized.discipline || "",
        url: shareUrl
      });

      setNativeShareButtonState("shared");
      analyticsService.trackShare("native_share", item, state.currentLang);
    } catch (error) {
      if (error && error.name === "AbortError") return;
      setNativeShareButtonState("error");
    }
  }

  return {
    setCopyButtonState,
    setNativeShareButtonState,
    refreshUi,
    resetFeedback,
    handleCopyLinkAction,
    handleNativeShareAction
  };
}