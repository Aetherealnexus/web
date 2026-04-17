export function initReadingMobileFocus() {
  const mainContent = document.getElementById("main-content");
  const readingLayer = document.getElementById("readingLayer");
  const readingPanel = document.getElementById("readingPanel");
  const readingScroll = document.getElementById("readingScroll");

  if (!mainContent || !readingLayer || !readingPanel || !readingScroll) {
    return () => {};
  }

  const mobileQuery = window.matchMedia("(max-width: 768px)");
  const COMPACT_AT = 36;
  const EXPAND_AT = 6;

  let rafPending = false;
  let rafId = 0;
  let compactState = false;

  const isReadingOpen = () => {
    return (
      mainContent.classList.contains("is-reading") &&
      readingLayer.getAttribute("aria-hidden") !== "true"
    );
  };

  const setCompactState = (shouldCompact) => {
    const nextState = Boolean(shouldCompact);

    if (compactState === nextState) {
      return;
    }

    compactState = nextState;
    readingPanel.classList.toggle("is-mobile-reading-compact", compactState);
  };

  const evaluateCompactState = () => {
    rafPending = false;
    rafId = 0;

    if (!mobileQuery.matches || !isReadingOpen()) {
      setCompactState(false);
      return;
    }

    const scrollTop = readingScroll.scrollTop;

    if (scrollTop > COMPACT_AT) {
      setCompactState(true);
      return;
    }

    if (scrollTop <= EXPAND_AT) {
      setCompactState(false);
    }
  };

  const requestEvaluation = () => {
    if (rafPending) return;

    rafPending = true;
    rafId = window.requestAnimationFrame(evaluateCompactState);
  };

  const resetCompactMode = () => {
    setCompactState(false);
  };

  const handleScroll = () => {
    requestEvaluation();
  };

  readingScroll.addEventListener("scroll", handleScroll, { passive: true });

  const stateObserver = new MutationObserver(() => {
    if (!isReadingOpen()) {
      resetCompactMode();
      readingScroll.scrollTop = 0;
      return;
    }

    requestEvaluation();
  });

  stateObserver.observe(mainContent, {
    attributes: true,
    attributeFilter: ["class"]
  });

  stateObserver.observe(readingLayer, {
    attributes: true,
    attributeFilter: ["aria-hidden"]
  });

  const handleViewportChange = () => {
    if (!mobileQuery.matches) {
      resetCompactMode();
      return;
    }

    requestEvaluation();
  };

  const supportsModernMediaListener =
    typeof mobileQuery.addEventListener === "function";

  if (supportsModernMediaListener) {
    mobileQuery.addEventListener("change", handleViewportChange);
  } else if (typeof mobileQuery.addListener === "function") {
    mobileQuery.addListener(handleViewportChange);
  }

  requestEvaluation();

  return function cleanupReadingMobileFocus() {
    readingScroll.removeEventListener("scroll", handleScroll);

    stateObserver.disconnect();

    if (rafId) {
      window.cancelAnimationFrame(rafId);
    }

    rafPending = false;
    rafId = 0;

    if (supportsModernMediaListener) {
      mobileQuery.removeEventListener("change", handleViewportChange);
    } else if (typeof mobileQuery.removeListener === "function") {
      mobileQuery.removeListener(handleViewportChange);
    }

    resetCompactMode();
  };
}