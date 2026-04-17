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

  function clearActiveStreaming() {
    if (state.readingStreamRaf) {
      window.cancelAnimationFrame(state.readingStreamRaf);
      state.readingStreamRaf = 0;
    }

    if (typeof state.readingStreamCleanup === "function") {
      state.readingStreamCleanup();
    }

    state.readingStreamCleanup = null;
    state.readingStreamPending = false;
  }

  function getScrollContainer(readingArticle) {
    return readingArticle?.closest("#readingScroll") || readingArticle?.parentElement || null;
  }

  function getStreamingProfile() {
    const isTouchOrSmallViewport =
      window.matchMedia("(max-width: 768px), (hover: none), (pointer: coarse)").matches;

    const optimized = AEN_PERF.isOptimized();

    if (optimized && isTouchOrSmallViewport) {
      return {
        immediateCount: 8,
        batchSize: 4,
        rootMargin: "0px 0px 900px 0px",
        scrollThreshold: 900,
        observerBurst: 2
      };
    }

    if (optimized) {
      return {
        immediateCount: 6,
        batchSize: 3,
        rootMargin: "0px 0px 700px 0px",
        scrollThreshold: 700,
        observerBurst: 2
      };
    }

    if (isTouchOrSmallViewport) {
      return {
        immediateCount: 4,
        batchSize: 3,
        rootMargin: "0px 0px 650px 0px",
        scrollThreshold: 650,
        observerBurst: 2
      };
    }

    return {
      immediateCount: 3,
      batchSize: 2,
      rootMargin: "0px 0px 420px 0px",
      scrollThreshold: 420,
      observerBurst: 1
    };
  }

  async function renderReadingContentInPhases({
    item,
    lang = defaultLang,
    token,
    startTime,
    readingArticle
  }) {
    if (!readingArticle) return;

    clearActiveStreaming();
    setReadingLoadingState(readingArticle, true);
    readingArticle.innerHTML = createReadingLoadingMarkup(lang);

    try {
      const payload = await loader.prepareReadingPayload(item, lang);

      if (token !== state.readingRenderToken) return;

      const chunks = payload.chunks || [];
      const profile = getStreamingProfile();

      readingArticle.innerHTML = "";

      const immediateCount = Math.min(profile.immediateCount, chunks.length);
      const immediateChunks = chunks.slice(0, immediateCount);

      if (immediateChunks.length > 0) {
        readingArticle.insertAdjacentHTML("beforeend", immediateChunks.join(""));
      }

      let index = immediateCount;
      const hasMore = index < chunks.length;

      if (hasMore) {
        readingArticle.insertAdjacentHTML("beforeend", createStreamingTailMarkup());
      }

      const scrollContainer = getScrollContainer(readingArticle);
      const cleanupFns = [];

      const cleanupStreamingForThisRender = () => {
        cleanupFns.forEach((fn) => fn());
        cleanupFns.length = 0;
      };

      state.readingStreamCleanup = cleanupStreamingForThisRender;
      state.readingStreamPending = false;

      const finishStreaming = () => {
        if (token !== state.readingRenderToken) return;

        const tail = readingArticle.querySelector(".reading-streaming-tail");
        tail?.remove();

        if (state.readingStreamRaf) {
          window.cancelAnimationFrame(state.readingStreamRaf);
          state.readingStreamRaf = 0;
        }

        cleanupStreamingForThisRender();

        if (state.readingStreamCleanup === cleanupStreamingForThisRender) {
          state.readingStreamCleanup = null;
        }

        state.readingStreamPending = false;
        setReadingLoadingState(readingArticle, false);
        prefetchRelatedDisciplines(item, lang);
      };

      const appendNextBatches = (burstCount = 1) => {
        if (token !== state.readingRenderToken) return;
        if (state.readingStreamPending) return;

        state.readingStreamPending = true;

        let burstsDone = 0;

        while (burstsDone < burstCount && index < chunks.length) {
          const batch = chunks.slice(index, index + profile.batchSize);
          const tail = readingArticle.querySelector(".reading-streaming-tail");

          if (!batch.length) break;

          const html = batch.join("");

          if (tail) {
            tail.insertAdjacentHTML("beforebegin", html);
          } else {
            readingArticle.insertAdjacentHTML("beforeend", html);
          }

          index += batch.length;
          burstsDone += 1;
        }

        state.readingStreamPending = false;

        if (index >= chunks.length) {
          finishStreaming();
        }
      };

      const scheduleAppend = (burstCount = 1) => {
        if (token !== state.readingRenderToken) return;
        if (state.readingStreamRaf) return;

        state.readingStreamRaf = window.requestAnimationFrame(() => {
          state.readingStreamRaf = 0;
          appendNextBatches(burstCount);
        });
      };

      const installIntersectionStreaming = () => {
        const tail = readingArticle.querySelector(".reading-streaming-tail");
        if (!tail || typeof IntersectionObserver !== "function") return false;

        const observer = new IntersectionObserver(
          (entries) => {
            const entry = entries[0];
            if (!entry?.isIntersecting) return;

            scheduleAppend(profile.observerBurst);
          },
          {
            root: scrollContainer instanceof Element ? scrollContainer : null,
            rootMargin: profile.rootMargin,
            threshold: 0
          }
        );

        observer.observe(tail);
        cleanupFns.push(() => observer.disconnect());

        return true;
      };

      const installScrollFallback = () => {
        if (!scrollContainer || !(scrollContainer instanceof Element)) return;

        const onScroll = () => {
          if (token !== state.readingRenderToken) return;
          if (index >= chunks.length) return;

          const remaining =
            scrollContainer.scrollHeight -
            scrollContainer.clientHeight -
            scrollContainer.scrollTop;

          if (remaining <= profile.scrollThreshold) {
            scheduleAppend(1);
          }
        };

        scrollContainer.addEventListener("scroll", onScroll, { passive: true });
        cleanupFns.push(() => {
          scrollContainer.removeEventListener("scroll", onScroll);
        });
      };

      AEN_PERF.afterPaint(() => {
        if (token !== state.readingRenderToken) return;

        AEN_PERF.measureDisciplineOpen(startTime);

        if (!hasMore) {
          setReadingLoadingState(readingArticle, false);
          prefetchRelatedDisciplines(item, lang);
          return;
        }

        const hasIntersectionStreaming = installIntersectionStreaming();

        if (!hasIntersectionStreaming) {
          installScrollFallback();
        } else {
          installScrollFallback();
        }

        scheduleAppend(1);
      });
    } catch {
      if (token !== state.readingRenderToken) return;

      clearActiveStreaming();
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