(() => {
  const mainContent = document.getElementById("main-content");
  const readingLayer = document.getElementById("readingLayer");
  const readingPanel = document.getElementById("readingPanel");
  const readingScroll = document.getElementById("readingScroll");
  const readingArticle = document.getElementById("readingArticle");
  const readingSummary = document.querySelector(".reading-summary");

  if (!mainContent || !readingLayer || !readingPanel || !readingScroll) return;

  const mobileQuery = window.matchMedia("(max-width: 768px)");
  const COMPACT_AT = 36;
  const EXPAND_AT = 6;

  let rafPending = false;

  const isReadingOpen = () => {
    return (
      mainContent.classList.contains("is-reading") &&
      readingLayer.getAttribute("aria-hidden") !== "true"
    );
  };

  const setCompactState = (shouldCompact) => {
    readingPanel.classList.toggle("is-mobile-reading-compact", Boolean(shouldCompact));
  };

  const evaluateCompactState = () => {
    rafPending = false;

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
    window.requestAnimationFrame(evaluateCompactState);
  };

  const resetCompactMode = () => {
    setCompactState(false);
  };

  readingScroll.addEventListener("scroll", requestEvaluation, { passive: true });

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

  const contentObserver = new MutationObserver(() => {
    requestEvaluation();
  });

  if (readingArticle) {
    contentObserver.observe(readingArticle, {
      childList: true,
      subtree: true
    });
  }

  if (readingSummary) {
    contentObserver.observe(readingSummary, {
      childList: true,
      subtree: true
    });
  }

  const handleViewportChange = () => {
    if (!mobileQuery.matches) {
      resetCompactMode();
      return;
    }

    requestEvaluation();
  };

  if (typeof mobileQuery.addEventListener === "function") {
    mobileQuery.addEventListener("change", handleViewportChange);
  } else if (typeof mobileQuery.addListener === "function") {
    mobileQuery.addListener(handleViewportChange);
  }

  requestEvaluation();
})();