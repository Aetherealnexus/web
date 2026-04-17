export function createContentRenderer({
  state,
  disciplines,
  AEN_PERF,
  loader,
  getUi,
  defaultLang = "en"
}) {
  function createReadingLoadingMarkup(lang = defaultLang) {
    const ui = getUi(lang);

    return `
      <section class="reading-loading">
        <div class="reading-loading__pill"></div>
        <div class="reading-loading__title"></div>
        <div class="reading-loading__line"></div>
        <div class="reading-loading__line reading-loading__line--wide"></div>
      </section>

      <section class="reading-block reading-block--skeleton">
        <div class="reading-skeleton reading-skeleton--eyebrow"></div>
        <div class="reading-skeleton reading-skeleton--title"></div>
        <div class="reading-skeleton reading-skeleton--text"></div>
        <div class="reading-skeleton reading-skeleton--text reading-skeleton--wide"></div>
        <p class="reading-loading__caption">${ui.loadingText}</p>
      </section>

      <section class="reading-block reading-block--skeleton">
        <div class="reading-skeleton reading-skeleton--section"></div>
        <div class="reading-skeleton reading-skeleton--text"></div>
        <div class="reading-skeleton reading-skeleton--text"></div>
        <div class="reading-skeleton reading-skeleton--text reading-skeleton--wide"></div>
      </section>
    `;
  }

  function createStreamingTailMarkup() {
    return `
      <div class="reading-streaming-tail" aria-hidden="true">
        <div class="reading-streaming-tail__line"></div>
        <div class="reading-streaming-tail__line reading-streaming-tail__line--wide"></div>
      </div>
    `;
  }

  function setReadingLoadingState(readingArticle, isLoading) {
    if (!readingArticle) return;

    readingArticle.classList.toggle("is-loading-content", Boolean(isLoading));
    readingArticle.setAttribute("aria-busy", isLoading ? "true" : "false");
  }

  function prefetchRelatedDisciplines(item, lang = defaultLang) {
    if (AEN_PERF.isOptimized()) return;

    const currentIndex = disciplines.findIndex((entry) => entry.key === item.key);
    if (currentIndex < 0) return;

    const candidates = [
      disciplines[currentIndex + 1],
      disciplines[currentIndex - 1]
    ].filter(Boolean);

    AEN_PERF.nonCritical(() => {
      candidates.forEach((candidate) => {
        if (!candidate || candidate.status === "research_in_progress") return;
        loader.prepareReadingPayload(candidate, lang).catch(() => {});
      });
    }, 1400);
  }

  async function renderReadingContentInPhases({
    item,
    lang = defaultLang,
    token,
    startTime,
    readingArticle
  }) {
    if (!readingArticle) return;

    setReadingLoadingState(readingArticle, true);
    readingArticle.innerHTML = createReadingLoadingMarkup(lang);

    try {
      const payload = await loader.prepareReadingPayload(item, lang);

      if (token !== state.readingRenderToken) return;

      const chunks = payload.chunks || [];
      readingArticle.innerHTML = "";

      const immediateCount = AEN_PERF.isOptimized() ? 1 : Math.min(2, chunks.length);
      const immediateChunks = chunks.slice(0, immediateCount);

      if (immediateChunks.length > 0) {
        readingArticle.insertAdjacentHTML("beforeend", immediateChunks.join(""));
      }

      const hasMore = chunks.length > immediateCount;

      if (hasMore) {
        readingArticle.insertAdjacentHTML("beforeend", createStreamingTailMarkup());
      }

      AEN_PERF.afterPaint(() => {
        if (token !== state.readingRenderToken) return;

        AEN_PERF.measureDisciplineOpen(startTime);

        if (!hasMore) {
          setReadingLoadingState(readingArticle, false);
          prefetchRelatedDisciplines(item, lang);
          return;
        }

        let index = immediateCount;

        const pump = () => {
          if (token !== state.readingRenderToken) return;

          const batchSize = AEN_PERF.isOptimized() ? 1 : 2;
          const batch = chunks.slice(index, index + batchSize);

          if (batch.length === 0) {
            const tail = readingArticle.querySelector(".reading-streaming-tail");
            tail?.remove();
            setReadingLoadingState(readingArticle, false);
            prefetchRelatedDisciplines(item, lang);
            return;
          }

          const tail = readingArticle.querySelector(".reading-streaming-tail");
          const html = batch.join("");

          if (tail) {
            tail.insertAdjacentHTML("beforebegin", html);
          } else {
            readingArticle.insertAdjacentHTML("beforeend", html);
          }

          index += batch.length;

          if (index < chunks.length) {
            AEN_PERF.nonCritical(pump, 700);
          } else {
            const finalTail = readingArticle.querySelector(".reading-streaming-tail");
            finalTail?.remove();
            setReadingLoadingState(readingArticle, false);
            prefetchRelatedDisciplines(item, lang);
          }
        };

        AEN_PERF.nonCritical(pump, 500);
      });
    } catch {
      if (token !== state.readingRenderToken) return;

      readingArticle.innerHTML = loader.buildFallbackHtml(item, lang);
      setReadingLoadingState(readingArticle, false);
    }
  }

  return {
    createReadingLoadingMarkup,
    createStreamingTailMarkup,
    setReadingLoadingState,
    prefetchRelatedDisciplines,
    renderReadingContentInPhases
  };
}