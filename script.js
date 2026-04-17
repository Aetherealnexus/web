(() => {
  const AEN_PERF = (() => {
    const url = new URL(window.location.href);
    const forcedMode = url.searchParams.get("perf");
    const storedMode = localStorage.getItem("aen_perf_mode");

    const weakDeviceHint =
      (typeof navigator.deviceMemory === "number" && navigator.deviceMemory <= 4) ||
      (typeof navigator.hardwareConcurrency === "number" && navigator.hardwareConcurrency <= 4) ||
      navigator.connection?.saveData === true;

    let optimized =
      forcedMode === "optimized" ||
      (forcedMode !== "normal" && (storedMode === "optimized" || weakDeviceHint));

    let slowOpenCount = 0;

    document.documentElement.dataset.performance = optimized ? "optimized" : "normal";

    function setOptimized(value, persist = true) {
      optimized = Boolean(value);
      document.documentElement.dataset.performance = optimized ? "optimized" : "normal";

      if (!persist) return;

      if (optimized) {
        localStorage.setItem("aen_perf_mode", "optimized");
      } else {
        localStorage.removeItem("aen_perf_mode");
      }
    }

    function isOptimized() {
      return optimized;
    }

    function measureDisciplineOpen(startTime) {
      const elapsed = performance.now() - startTime;

      if (elapsed > 220) {
        slowOpenCount += 1;

        if (!optimized && slowOpenCount >= 2) {
          setOptimized(true, true);
        }
      }

      return elapsed;
    }

    function idle(callback, timeout = 900) {
      if ("requestIdleCallback" in window) {
        return window.requestIdleCallback(callback, { timeout });
      }

      return window.setTimeout(() => {
        callback({
          didTimeout: true,
          timeRemaining: () => 8
        });
      }, 16);
    }

    function nonCritical(callback, timeout = 1200) {
      return idle(() => callback(), timeout);
    }

    function afterPaint(callback) {
      requestAnimationFrame(() => {
        requestAnimationFrame(callback);
      });
    }

    return {
      isOptimized,
      setOptimized,
      measureDisciplineOpen,
      idle,
      nonCritical,
      afterPaint
    };
  })();

  function sendDisciplineAnalytics(discipline, language = "en", options = {}) {
    const { includePageView = true } = options;
    if (!discipline || !discipline.key) return;

    const localized = getLocalizedDiscipline(discipline, language);
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

  function sendLanguageAnalytics(language = "en", discipline = null) {
    const safeLanguage = language || document.documentElement.lang || "en";

    if (typeof window.trackLanguageChange === "function") {
      window.trackLanguageChange(safeLanguage);
    }

    if (discipline && typeof window.gtag === "function") {
      const localized = getLocalizedDiscipline(discipline, safeLanguage);
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

  function sendHomeAnalytics(language = "en") {
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

  function sendShareAnalytics(method, discipline, language = "en") {
    if (!discipline || typeof window.gtag !== "function") return;

    const localized = getLocalizedDiscipline(discipline, language);

    window.gtag("event", "discipline_share", {
      share_method: method || "copy_link",
      discipline_key: discipline.key || "",
      discipline_title: localized.title || discipline.title || "",
      language_selected: language || document.documentElement.lang || "en"
    });
  }

  const body = document.body;
  const bgMode = (body?.dataset?.bgMode || "fx").toLowerCase();
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  const backgrounds = Array.isArray(window.AEN_BACKGROUNDS) ? window.AEN_BACKGROUNDS : [];
  const pageBg = document.getElementById("pageBg");
  const pageBgCanvas = document.getElementById("pageBgCanvas");

  const disciplinesFull = Array.isArray(window.NEXUS_DISCIPLINES)
    ? window.NEXUS_DISCIPLINES
    : [];

  const disciplinesMeta = Array.isArray(window.NEXUS_DISCIPLINES_META)
    ? window.NEXUS_DISCIPLINES_META
    : [];

  const disciplines = disciplinesFull.length > 0 ? disciplinesFull : disciplinesMeta;

  const orbit = document.getElementById("discipline-orbit");
  const screen = document.querySelector(".orbit-screen");
  const pointerMode = window.matchMedia("(hover: none), (pointer: coarse)");

  const readingLayer = document.getElementById("readingLayer");
  const readingPanel = document.getElementById("readingPanel");
  const readingBackBtn = document.getElementById("readingBackBtn");
  const readingBackBtnText = document.getElementById("readingBackBtnText");
  const readingCopyBtn = document.getElementById("readingCopyBtn");
  const readingCopyBtnText = document.getElementById("readingCopyBtnText");
  const readingNativeShareBtn = document.getElementById("readingNativeShareBtn");
  const readingNativeShareBtnText = document.getElementById("readingNativeShareBtnText");

  const readingSigil = document.getElementById("readingSigil");
  const readingEyebrow = document.getElementById("readingEyebrow");
  const readingTitle = document.querySelector(".reading-head__title");
  const readingPronounced = document.getElementById("readingPronounced");

  const readingDiscipline = document.getElementById("readingDiscipline");
  const readingIntersection = document.getElementById("readingIntersection");
  const readingConclusion = document.getElementById("readingConclusion");

  const readingArticle = document.getElementById("readingArticle");
  const readingScroll = document.getElementById("readingScroll");

  const metaDescription = document.querySelector('meta[name="description"]');
  const canonicalUrl = document.querySelector('link[rel="canonical"]');
  const metaOgTitle = document.querySelector('meta[property="og:title"]');
  const metaOgDescription = document.querySelector('meta[property="og:description"]');
  const metaOgUrl = document.querySelector('meta[property="og:url"]');
  const metaTwitterTitle = document.querySelector('meta[name="twitter:title"]');
  const metaTwitterDescription = document.querySelector('meta[name="twitter:description"]');

  const langSwitcher = document.getElementById("langSwitcher");
  const langButtons = Array.from(document.querySelectorAll(".lang-flag"));

  const SUPPORTED_LANGS = ["en", "pt", "fr"];
  const DEFAULT_LANG = "en";
  const supportsNativeShare = typeof navigator.share === "function";

  const UI_TRANSLATIONS = {
    en: {
      back: "Go Back",
      copyLink: "Copy Link",
      shareNative: "Share",
      linkCopied: "Link Copied",
      linkCopyFailed: "Copy Failed",
      linkShared: "Shared",
      shareFailed: "Share Failed",
      eyebrow: "DISCIPLINE",
      disciplineLabel: "Discipline",
      intersectionLabel: "Intersection",
      conclusionLabel: "Conclusion",
      orientationTitle: "Orientation",
      currentDefinitionTitle: "Current Definition",
      readingZoneTitle: "Reading Zone",
      orientationTextA:
        "<strong>{title}</strong> is the active gateway. This reading chamber is now ready to receive your own investigations, notes, frameworks, citations, hypotheses, and long-form reflections.",
      orientationTextB:
        "The visual system remains the same as the entrance state so the discipline feels born from the same symbolic world rather than disconnected from it.",
      readingZoneTextA:
        "This is the scrollable area intended for your real research corpus.",
      readingZoneTextB:
        "Add long-form essays, nested sections, source notes, structured arguments, ontological maps, or any other deep material here.",
      researchInProgress: "Research in progress",
      unfolding: "UNFOLDING",
      researchPlaceholderText:
        "This discipline is currently under active development. The investigation is ongoing, but this section of the Aethereal Nexus is not yet publicly available.",
      loading: "Loading discipline",
      loadingText:
        "The reading shell opens immediately. The full text is being streamed in phases."
    },
    pt: {
      back: "Voltar",
      copyLink: "Copiar Link",
      shareNative: "Partilhar",
      linkCopied: "Link Copiado",
      linkCopyFailed: "Falha ao Copiar",
      linkShared: "Partilhado",
      shareFailed: "Falha ao Partilhar",
      eyebrow: "DISCIPLINA",
      disciplineLabel: "Disciplina",
      intersectionLabel: "Interseção",
      conclusionLabel: "Conclusão",
      orientationTitle: "Orientação",
      currentDefinitionTitle: "Definição Atual",
      readingZoneTitle: "Zona de Leitura",
      orientationTextA:
        "<strong>{title}</strong> é a gateway ativa. Esta câmara de leitura está pronta para receber investigação, notas, frameworks, citações, hipóteses e reflexão longa.",
      orientationTextB:
        "O sistema visual mantém-se igual ao estado de entrada para a disciplina continuar ligada ao mesmo mundo simbólico.",
      readingZoneTextA:
        "Esta é a área com scroll destinada ao teu corpus real de investigação.",
      readingZoneTextB:
        "Aqui podes colocar ensaios, secções aninhadas, notas de fontes, argumentos estruturados, mapas ontológicos e material longo.",
      researchInProgress: "Investigação em curso",
      unfolding: "EM DESENVOLVIMENTO",
      researchPlaceholderText:
        "Esta disciplina encontra-se em desenvolvimento ativo. A investigação está a decorrer, mas esta secção ainda não está publicamente disponível.",
      loading: "A carregar disciplina",
      loadingText:
        "O painel abre logo. O texto completo está a ser carregado por fases."
    },
    fr: {
      back: "Retour",
      copyLink: "Copier le Lien",
      shareNative: "Partager",
      linkCopied: "Lien Copié",
      linkCopyFailed: "Échec de Copie",
      linkShared: "Partagé",
      shareFailed: "Échec du Partage",
      eyebrow: "DISCIPLINE",
      disciplineLabel: "Discipline",
      intersectionLabel: "Intersection",
      conclusionLabel: "Conclusion",
      orientationTitle: "Orientation",
      currentDefinitionTitle: "Définition Actuelle",
      readingZoneTitle: "Zone de Lecture",
      orientationTextA:
        "<strong>{title}</strong> est la passerelle active. Cette chambre de lecture est prête à recevoir recherches, notes, cadres, citations, hypothèses et réflexions longues.",
      orientationTextB:
        "Le système visuel reste identique à l’état d’entrée afin que la discipline demeure liée au même monde symbolique.",
      readingZoneTextA:
        "Voici la zone défilante destinée à votre véritable corpus de recherche.",
      readingZoneTextB:
        "Vous pouvez y placer essais, sections imbriquées, notes de sources, arguments structurés, cartes ontologiques et matériaux longs.",
      researchInProgress: "Recherche en cours",
      unfolding: "EN DÉPLOIEMENT",
      researchPlaceholderText:
        "Cette discipline est actuellement en développement actif. La recherche est en cours, mais cette section n’est pas encore publiquement disponible.",
      loading: "Chargement de la discipline",
      loadingText:
        "Le panneau s’ouvre immédiatement. Le texte complet arrive par phases."
    }
  };

  const fallbackSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="none" aria-hidden="true">
      <g stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="128" cy="128" r="84"/>
        <path d="M128 52V204"/>
        <path d="M52 128H204"/>
        <circle cx="128" cy="128" r="18"/>
      </g>
    </svg>
  `;

  const baseTitle = document.title;
  const baseDescription = metaDescription ? metaDescription.getAttribute("content") || "" : "";
  const baseCanonical = canonicalUrl ? canonicalUrl.getAttribute("href") || "" : "";
  const baseOgTitle = metaOgTitle ? metaOgTitle.getAttribute("content") || "" : "";
  const baseOgDescription = metaOgDescription ? metaOgDescription.getAttribute("content") || "" : "";
  const baseOgUrl = metaOgUrl ? metaOgUrl.getAttribute("content") || "" : "";
  const baseTwitterTitle = metaTwitterTitle ? metaTwitterTitle.getAttribute("content") || "" : "";
  const baseTwitterDescription = metaTwitterDescription ? metaTwitterDescription.getAttribute("content") || "" : "";
  const total = disciplines.length;

  let currentLang = (() => {
    const url = new URL(window.location.href);
    const langFromUrl = url.searchParams.get("lang");
    if (SUPPORTED_LANGS.includes(langFromUrl)) return langFromUrl;

    const saved = localStorage.getItem("aen_lang");
    return SUPPORTED_LANGS.includes(saved) ? saved : DEFAULT_LANG;
  })();

  let currentOpenDisciplineKey = null;
  let clearStateTimer = null;
  let copyFeedbackTimer = null;
  let shareFeedbackTimer = null;
  let copyFeedbackState = "default";
  let nativeShareFeedbackState = "default";
  let stateApplyFrame = 0;
  let readingRenderToken = 0;
  let nodes = [];

  const readingPayloadCache = new Map();

  function initImageBackgroundMode() {
    if (!pageBg || backgrounds.length === 0) return;

    const randomIndex = Math.floor(Math.random() * backgrounds.length);
    const selectedBackground = backgrounds[randomIndex];
    const img = new Image();

    img.onload = () => {
      pageBg.style.backgroundImage = `url("${selectedBackground}")`;
    };

    img.onerror = () => {
      pageBg.style.backgroundImage = 'url("images/background/1%20(1).png")';
    };

    img.src = selectedBackground;
  }

  function initFxBackgroundMode() {
    if (!pageBgCanvas) {
      return {
        pause() {},
        resume() {}
      };
    }

    const ctx = pageBgCanvas.getContext("2d");
    if (!ctx) {
      return {
        pause() {},
        resume() {}
      };
    }

    const state = {
      width: 0,
      height: 0,
      dpr: 1,
      particles: [],
      rafId: 0,
      isPaused: false
    };

    function createParticle(index, width, height, count) {
      const baseRadius = Math.min(width, height) * (0.14 + Math.random() * 0.26);
      const orbitStretch = 0.72 + Math.random() * 0.48;

      return {
        angle: (Math.PI * 2 * index) / count + Math.random() * 0.8,
        speed: 0.00008 + Math.random() * 0.00022,
        radiusX: baseRadius * (0.78 + Math.random() * 0.54),
        radiusY: baseRadius * orbitStretch,
        drift: 0.3 + Math.random() * 0.9,
        driftSpeed: 0.00018 + Math.random() * 0.00045,
        size: 1.2 + Math.random() * 3.1,
        alpha: 0.16 + Math.random() * 0.42,
        hue: 180 + Math.random() * 110,
        phase: Math.random() * Math.PI * 2
      };
    }

    function seedParticles() {
      const count = Math.max(16, Math.min(38, Math.round(Math.min(state.width, state.height) / 42)));
      state.particles = Array.from({ length: count }, (_, index) =>
        createParticle(index, state.width, state.height, count)
      );
    }

    function resizeCanvas() {
      const rect = pageBgCanvas.getBoundingClientRect();
      state.dpr = Math.min(window.devicePixelRatio || 1, 2);
      state.width = Math.max(1, Math.floor(rect.width));
      state.height = Math.max(1, Math.floor(rect.height));

      pageBgCanvas.width = Math.floor(state.width * state.dpr);
      pageBgCanvas.height = Math.floor(state.height * state.dpr);

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(state.dpr, state.dpr);

      seedParticles();
      renderFrame(performance.now(), true);
    }

    function drawCoreGlow() {
      const cx = state.width * 0.5;
      const cy = state.height * 0.5;
      const radius = Math.min(state.width, state.height) * 0.22;

      const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
      gradient.addColorStop(0, "rgba(210, 230, 255, 0.080)");
      gradient.addColorStop(0.22, "rgba(150, 190, 255, 0.055)");
      gradient.addColorStop(0.48, "rgba(90, 130, 255, 0.025)");
      gradient.addColorStop(1, "rgba(0, 0, 0, 0)");

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    function getParticlePosition(particle, time) {
      const cx = state.width * 0.5;
      const cy = state.height * 0.5;
      const angle = particle.angle + time * particle.speed;
      const drift = Math.sin(time * particle.driftSpeed + particle.phase) * (18 * particle.drift);

      return {
        x: cx + Math.cos(angle) * (particle.radiusX + drift),
        y: cy + Math.sin(angle) * (particle.radiusY + drift * 0.6)
      };
    }

    function drawConnections(positions) {
      const maxDistance = Math.min(state.width, state.height) * 0.16;

      ctx.save();
      ctx.lineWidth = 0.85;
      ctx.globalCompositeOperation = "lighter";

      for (let i = 0; i < positions.length; i += 1) {
        for (let j = i + 1; j < positions.length; j += 1) {
          const dx = positions[j].x - positions[i].x;
          const dy = positions[j].y - positions[i].y;
          const distance = Math.hypot(dx, dy);

          if (distance > maxDistance) continue;

          const alpha = (1 - distance / maxDistance) * 0.12;
          ctx.strokeStyle = `rgba(170, 205, 255, ${alpha.toFixed(4)})`;
          ctx.beginPath();
          ctx.moveTo(positions[i].x, positions[i].y);
          ctx.lineTo(positions[j].x, positions[j].y);
          ctx.stroke();
        }
      }

      ctx.restore();
    }

    function drawParticles(positions, time) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";

      positions.forEach((pos, index) => {
        const particle = state.particles[index];
        const pulse = 0.72 + 0.28 * Math.sin(time * 0.0012 + particle.phase);
        const radius = particle.size * pulse;

        const gradient = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, radius * 5.2);
        gradient.addColorStop(0, `hsla(${particle.hue}, 100%, 86%, ${particle.alpha})`);
        gradient.addColorStop(0.34, `hsla(${particle.hue}, 100%, 72%, ${particle.alpha * 0.46})`);
        gradient.addColorStop(1, `hsla(${particle.hue}, 100%, 68%, 0)`);

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, radius * 5.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `hsla(${particle.hue}, 100%, 88%, ${Math.min(0.95, particle.alpha + 0.12)})`;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.restore();
    }

    function renderFrame(now, staticOnly = false) {
      const time = now || 0;
      ctx.clearRect(0, 0, state.width, state.height);

      drawCoreGlow();

      const positions = state.particles.map((particle) => getParticlePosition(particle, time));
      drawConnections(positions);
      drawParticles(positions, time);

      if (!staticOnly && !prefersReducedMotion.matches && !state.isPaused) {
        state.rafId = window.requestAnimationFrame(renderFrame);
      }
    }

    function start() {
      cancelAnimationFrame(state.rafId);
      resizeCanvas();

      if (!prefersReducedMotion.matches && !state.isPaused) {
        state.rafId = window.requestAnimationFrame(renderFrame);
      }
    }

    function pause() {
      state.isPaused = true;
      cancelAnimationFrame(state.rafId);
      renderFrame(performance.now(), true);
    }

    function resume() {
      state.isPaused = false;
      cancelAnimationFrame(state.rafId);
      renderFrame(performance.now(), true);

      if (!prefersReducedMotion.matches) {
        state.rafId = window.requestAnimationFrame(renderFrame);
      }
    }

    window.addEventListener("resize", start, { passive: true });
    prefersReducedMotion.addEventListener?.("change", start);
    window.addEventListener(
      "beforeunload",
      () => {
        cancelAnimationFrame(state.rafId);
      },
      { passive: true }
    );

    start();

    return {
      pause,
      resume
    };
  }

  const fxController =
    bgMode === "image"
      ? (initImageBackgroundMode(), { pause() {}, resume() {} })
      : initFxBackgroundMode();

  if (!orbit || !screen || total === 0) return;

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function getUi(lang = currentLang) {
    return UI_TRANSLATIONS[lang] || UI_TRANSLATIONS[DEFAULT_LANG];
  }

  function setDocumentLang(lang) {
    const htmlLang = lang === "pt" ? "pt-PT" : lang === "fr" ? "fr" : "en";
    document.documentElement.lang = htmlLang;
  }

  function getDisciplineByKey(key) {
    return disciplines.find((item) => item.key === key) || null;
  }

  function getLocalizedDiscipline(item, lang = currentLang) {
    const localized = item?.translations?.[lang] || {};
    const ui = getUi(lang);

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

  function extractInlineReadingHtml(item, lang = currentLang) {
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

  function getLanguageFromUrl() {
    const url = new URL(window.location.href);
    const lang = url.searchParams.get("lang");
    return SUPPORTED_LANGS.includes(lang) ? lang : null;
  }

  function getDisciplineKeyFromUrl() {
    const rawHash = window.location.hash.replace(/^#/, "").trim();
    if (!rawHash) return null;

    const decodedKey = decodeURIComponent(rawHash);
    return getDisciplineByKey(decodedKey) ? decodedKey : null;
  }

  function buildStateUrl({
    disciplineKey = currentOpenDisciplineKey,
    language = currentLang
  } = {}) {
    const url = new URL(window.location.href);

    if (language && language !== DEFAULT_LANG) {
      url.searchParams.set("lang", language);
    } else {
      url.searchParams.delete("lang");
    }

    url.hash = disciplineKey ? encodeURIComponent(disciplineKey) : "";

    return `${url.pathname}${url.search}${url.hash}`;
  }

  function buildAbsoluteStateUrl({
    disciplineKey = currentOpenDisciplineKey,
    language = currentLang
  } = {}) {
    return `${window.location.origin}${buildStateUrl({ disciplineKey, language })}`;
  }

  function syncUrlState({
    disciplineKey = currentOpenDisciplineKey,
    language = currentLang,
    replace = false
  } = {}) {
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

  function setMetaContent(metaEl, value) {
    if (!metaEl) return;
    metaEl.setAttribute("content", value || "");
  }

  function setCanonicalValue(value) {
    if (!canonicalUrl) return;
    canonicalUrl.setAttribute("href", value || "");
  }

  function applyDisciplineMeta(item) {
    const localized = getLocalizedDiscipline(item, currentLang);
    const disciplineUrl = buildAbsoluteStateUrl({
      disciplineKey: item.key,
      language: currentLang
    });

    const title = `${localized.title} – Aethereal Nexus`;
    const description = `${localized.title}. ${localized.discipline}. ${localized.conclusion}`;

    document.title = title;

    if (metaDescription) {
      metaDescription.setAttribute("content", description);
    }

    setCanonicalValue(disciplineUrl);
    setMetaContent(metaOgTitle, title);
    setMetaContent(metaOgDescription, description);
    setMetaContent(metaOgUrl, disciplineUrl);
    setMetaContent(metaTwitterTitle, title);
    setMetaContent(metaTwitterDescription, description);
  }

  function restoreBaseMeta() {
    document.title = baseTitle;

    if (metaDescription) {
      metaDescription.setAttribute("content", baseDescription);
    }

    setCanonicalValue(baseCanonical);
    setMetaContent(metaOgTitle, baseOgTitle);
    setMetaContent(metaOgDescription, baseOgDescription);
    setMetaContent(metaOgUrl, baseOgUrl);
    setMetaContent(metaTwitterTitle, baseTwitterTitle);
    setMetaContent(metaTwitterDescription, baseTwitterDescription);
  }

  function setButtonLabel(button, textNode, label) {
    if (textNode) {
      textNode.textContent = label;
    }

    if (button) {
      button.setAttribute("aria-label", label);
      button.setAttribute("title", label);
    }
  }

  function updateLanguageButtons() {
    langButtons.forEach((button) => {
      button.classList.toggle("is-active", button.dataset.lang === currentLang);
    });
  }

  function setCopyButtonState(state = "default", options = {}) {
    const { autoReset = true } = options;
    const ui = getUi(currentLang);
    copyFeedbackState = state;

    if (!readingCopyBtn) return;

    clearTimeout(copyFeedbackTimer);

    let label = ui.copyLink;
    if (state === "copied") label = ui.linkCopied;
    if (state === "error") label = ui.linkCopyFailed;

    setButtonLabel(readingCopyBtn, readingCopyBtnText, label);
    readingCopyBtn.classList.toggle("is-success", state === "copied");
    readingCopyBtn.classList.toggle("is-error", state === "error");

    if (autoReset && state !== "default") {
      copyFeedbackTimer = window.setTimeout(() => {
        setCopyButtonState("default", { autoReset: false });
      }, 1800);
    }
  }

  function setNativeShareButtonState(state = "default", options = {}) {
    const { autoReset = true } = options;
    const ui = getUi(currentLang);
    nativeShareFeedbackState = state;

    if (!readingNativeShareBtn) return;

    clearTimeout(shareFeedbackTimer);

    let label = ui.shareNative;
    if (state === "shared") label = ui.linkShared;
    if (state === "error") label = ui.shareFailed;

    setButtonLabel(readingNativeShareBtn, readingNativeShareBtnText, label);
    readingNativeShareBtn.classList.toggle("is-success", state === "shared");
    readingNativeShareBtn.classList.toggle("is-error", state === "error");

    if (autoReset && state !== "default") {
      shareFeedbackTimer = window.setTimeout(() => {
        setNativeShareButtonState("default", { autoReset: false });
      }, 1800);
    }
  }

  function updateStaticUiLanguage() {
    const ui = getUi(currentLang);

    setDocumentLang(currentLang);
    updateLanguageButtons();

    setButtonLabel(readingBackBtn, readingBackBtnText, ui.back);

    if (readingCopyBtn) {
      readingCopyBtn.disabled = !currentOpenDisciplineKey;
    }

    if (readingNativeShareBtn) {
      readingNativeShareBtn.hidden = !supportsNativeShare;
      readingNativeShareBtn.disabled = !currentOpenDisciplineKey || !supportsNativeShare;
    }

    setCopyButtonState(copyFeedbackState, { autoReset: false });
    setNativeShareButtonState(nativeShareFeedbackState, { autoReset: false });

    const summaryLabels = document.querySelectorAll(".reading-summary__label");
    if (summaryLabels[0]) summaryLabels[0].textContent = ui.disciplineLabel;
    if (summaryLabels[1]) summaryLabels[1].textContent = ui.intersectionLabel;
    if (summaryLabels[2]) summaryLabels[2].textContent = ui.conclusionLabel;
  }

  function setHoverActive(targetNode) {
    if (screen.classList.contains("is-reading")) return;

    nodes.forEach((node) => {
      node.classList.toggle("is-active", node === targetNode);
    });

    orbit.classList.add("is-hovering");
  }

  function clearHoverActive() {
    if (screen.classList.contains("is-reading")) return;

    nodes.forEach((node) => node.classList.remove("is-active"));
    orbit.classList.remove("is-hovering");
  }

  function buildDefaultReadingMarkup(item, localized) {
    const ui = getUi(currentLang);
    const orientationTextA = ui.orientationTextA.replace("{title}", escapeHtml(localized.title));

    return `
      <section class="reading-block">
        <h2 class="reading-block__title">${escapeHtml(ui.orientationTitle)}</h2>
        <p class="reading-block__text">${orientationTextA}</p>
        <p class="reading-block__text">${ui.orientationTextB}</p>
      </section>

      <section class="reading-block">
        <h2 class="reading-block__title">${escapeHtml(ui.currentDefinitionTitle)}</h2>
        <p class="reading-block__text">
          <strong>${escapeHtml(ui.disciplineLabel)}:</strong> ${escapeHtml(localized.discipline)}
        </p>
        <p class="reading-block__text">
          <strong>${escapeHtml(ui.intersectionLabel)}:</strong> ${escapeHtml(localized.intersection)}
        </p>
        <p class="reading-block__text">
          <strong>${escapeHtml(ui.conclusionLabel)}:</strong> ${escapeHtml(localized.conclusion)}
        </p>
      </section>

      <section class="reading-block">
        <h2 class="reading-block__title">${escapeHtml(ui.readingZoneTitle)}</h2>
        <p class="reading-block__text">${ui.readingZoneTextA}</p>
        <p class="reading-block__text">${ui.readingZoneTextB}</p>
      </section>
    `;
  }

  function getResearchPlaceholderMarkup(item) {
    const localized = getLocalizedDiscipline(item, currentLang);

    return `
      <section class="reading-placeholder">
        <div class="reading-placeholder__core">
          <p class="reading-placeholder__label">${escapeHtml(localized.placeholderLabel)}</p>
          <div class="reading-placeholder__word">${escapeHtml(localized.placeholderWord)}</div>
          <p class="reading-placeholder__text">${escapeHtml(localized.placeholderText)}</p>
        </div>
      </section>
    `;
  }

  function createReadingLoadingMarkup() {
    const ui = getUi(currentLang);

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
        <p class="reading-loading__caption">${escapeHtml(ui.loadingText)}</p>
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

  function setReadingLoadingState(isLoading) {
    if (!readingArticle) return;
    readingArticle.classList.toggle("is-loading-content", Boolean(isLoading));
    readingArticle.setAttribute("aria-busy", isLoading ? "true" : "false");
  }

  function applyReadingShell(item) {
    const localized = getLocalizedDiscipline(item, currentLang);

    const index = disciplines.findIndex((entry) => entry.key === item.key) + 1;
    const hue = Math.round((360 / total) * (index - 1));
    const svgMarkup = typeof item.svg === "string" && item.svg.trim() ? item.svg : fallbackSvg;
    const ui = getUi(currentLang);

    document.documentElement.style.setProperty("--discipline-hue", String(hue));

    if (readingLayer) readingLayer.setAttribute("aria-hidden", "false");
    if (readingSigil) readingSigil.innerHTML = svgMarkup;
    if (readingEyebrow) readingEyebrow.textContent = `${ui.eyebrow} ${String(index).padStart(2, "0")}`;
    if (readingTitle) readingTitle.textContent = localized.title;
    if (readingPronounced) readingPronounced.textContent = localized.pronounced;
    if (readingDiscipline) readingDiscipline.textContent = localized.discipline;
    if (readingIntersection) readingIntersection.textContent = localized.intersection;
    if (readingConclusion) readingConclusion.textContent = localized.conclusion;

    if (readingScroll) {
      readingScroll.scrollTop = 0;
    }

    applyDisciplineMeta(item);
    updateStaticUiLanguage();
  }

  function getCacheKey(key, lang) {
    return `${lang}::${key}`;
  }

  function buildContentUrl(key, lang) {
    return `content/${lang}/${encodeURIComponent(key)}.html`;
  }

  async function fetchContentText(url) {
    const response = await fetch(url, {
      cache: "force-cache"
    });

    if (!response.ok) {
      throw new Error(`Failed to load content: ${url}`);
    }

    return response.text();
  }

  function chunkReadingHtml(html) {
    const template = document.createElement("template");
    template.innerHTML = html.trim();

    const nodesInTemplate = Array.from(template.content.childNodes).filter((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        return node.textContent.trim().length > 0;
      }

      return true;
    });

    const chunks = nodesInTemplate
      .map((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          return node.outerHTML;
        }

        const text = node.textContent.trim();
        return text
          ? `<section class="reading-block"><p class="reading-block__text">${escapeHtml(text)}</p></section>`
          : "";
      })
      .filter(Boolean);

    return chunks.length > 0 ? chunks : [html];
  }

  async function prepareReadingPayload(item, lang = currentLang) {
    const cacheKey = getCacheKey(item.key, lang);
    const cached = readingPayloadCache.get(cacheKey);

    if (cached) {
      return cached instanceof Promise ? cached : Promise.resolve(cached);
    }

    const promise = (async () => {
      if (item.status === "research_in_progress") {
        const placeholderHtml = getResearchPlaceholderMarkup(item);
        const placeholderPayload = {
          html: placeholderHtml,
          chunks: chunkReadingHtml(placeholderHtml)
        };
        readingPayloadCache.set(cacheKey, placeholderPayload);
        return placeholderPayload;
      }

      const localized = getLocalizedDiscipline(item, lang);

      const inlineHtml = extractInlineReadingHtml(item, lang);
      if (inlineHtml) {
        const payload = {
          html: inlineHtml,
          chunks: chunkReadingHtml(inlineHtml)
        };
        readingPayloadCache.set(cacheKey, payload);
        return payload;
      }

      let html = "";

      const candidates = [
        buildContentUrl(item.key, lang),
        ...(lang !== DEFAULT_LANG ? [buildContentUrl(item.key, DEFAULT_LANG)] : [])
      ];

      for (const url of candidates) {
        try {
          html = (await fetchContentText(url)).trim();
          if (html) break;
        } catch {
          // tenta a próxima opção
        }
      }

      if (!html) {
        html = buildDefaultReadingMarkup(item, localized);
      }

      const payload = {
        html,
        chunks: chunkReadingHtml(html)
      };

      readingPayloadCache.set(cacheKey, payload);
      return payload;
    })();

    readingPayloadCache.set(cacheKey, promise);

    try {
      return await promise;
    } catch (error) {
      readingPayloadCache.delete(cacheKey);
      throw error;
    }
  }

  function prefetchRelatedDisciplines(item, lang = currentLang) {
    if (AEN_PERF.isOptimized()) return;

    const currentIndex = disciplines.findIndex((entry) => entry.key === item.key);
    if (currentIndex < 0) return;

    const candidates = [disciplines[currentIndex + 1], disciplines[currentIndex - 1]].filter(Boolean);

    AEN_PERF.nonCritical(() => {
      candidates.forEach((candidate) => {
        if (!candidate || candidate.status === "research_in_progress") return;
        prepareReadingPayload(candidate, lang).catch(() => {});
      });
    }, 1400);
  }

  async function renderReadingContentInPhases(item, lang, token, startTime) {
    if (!readingArticle) return;

    setReadingLoadingState(true);
    readingArticle.innerHTML = createReadingLoadingMarkup();

    try {
      const payload = await prepareReadingPayload(item, lang);
      if (token !== readingRenderToken) return;

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
        if (token !== readingRenderToken) return;

        AEN_PERF.measureDisciplineOpen(startTime);

        if (!hasMore) {
          setReadingLoadingState(false);
          prefetchRelatedDisciplines(item, lang);
          return;
        }

        let index = immediateCount;

        const pump = () => {
          if (token !== readingRenderToken) return;

          const batchSize = AEN_PERF.isOptimized() ? 1 : 2;
          const batch = chunks.slice(index, index + batchSize);

          if (batch.length === 0) {
            const tail = readingArticle.querySelector(".reading-streaming-tail");
            tail?.remove();
            setReadingLoadingState(false);
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
            setReadingLoadingState(false);
            prefetchRelatedDisciplines(item, lang);
          }
        };

        AEN_PERF.nonCritical(pump, 500);
      });
    } catch {
      if (token !== readingRenderToken) return;

      const localized = getLocalizedDiscipline(item, lang);
      readingArticle.innerHTML = buildDefaultReadingMarkup(item, localized);
      setReadingLoadingState(false);
    }
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
    if (!currentOpenDisciplineKey) return;

    const item = getDisciplineByKey(currentOpenDisciplineKey);
    if (!item) return;

    const shareUrl = buildAbsoluteStateUrl({
      disciplineKey: item.key,
      language: currentLang
    });

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        fallbackCopyText(shareUrl);
      }

      setCopyButtonState("copied");
      sendShareAnalytics("copy_link", item, currentLang);
    } catch {
      try {
        fallbackCopyText(shareUrl);
        setCopyButtonState("copied");
        sendShareAnalytics("copy_link", item, currentLang);
      } catch {
        setCopyButtonState("error");
      }
    }
  }

  async function handleNativeShareAction() {
    if (!supportsNativeShare || !currentOpenDisciplineKey) return;

    const item = getDisciplineByKey(currentOpenDisciplineKey);
    if (!item) return;

    const localized = getLocalizedDiscipline(item, currentLang);
    const shareUrl = buildAbsoluteStateUrl({
      disciplineKey: item.key,
      language: currentLang
    });

    try {
      await navigator.share({
        title: `${localized.title} – Aethereal Nexus`,
        text: localized.conclusion || localized.discipline || "",
        url: shareUrl
      });

      setNativeShareButtonState("shared");
      sendShareAnalytics("native_share", item, currentLang);
    } catch (error) {
      if (error && error.name === "AbortError") return;
      setNativeShareButtonState("error");
    }
  }

  function openDiscipline(key, options = {}) {
    const { syncUrl = true, analyticsMode = "full", replaceHistory = false } = options;

    const item = getDisciplineByKey(key);
    if (!item) return;

    const startTime = performance.now();

    currentOpenDisciplineKey = key;
    readingRenderToken += 1;

    clearTimeout(clearStateTimer);

    setCopyButtonState("default", { autoReset: false });
    setNativeShareButtonState("default", { autoReset: false });

    const selectedNode = nodes.find((node) => node.dataset.key === key);

    nodes.forEach((node) => {
      const isSelected = node === selectedNode;
      node.classList.toggle("is-selected", isSelected);
      node.classList.toggle("is-active", isSelected);
    });

    orbit.classList.add("is-hovering");
    applyReadingShell(item);

    if (readingArticle) {
      setReadingLoadingState(true);
      readingArticle.innerHTML = createReadingLoadingMarkup();
    }

    requestAnimationFrame(() => {
      screen.classList.add("is-reading");
    });

    if (AEN_PERF.isOptimized()) {
      fxController.pause();
    }

    if (syncUrl) {
      syncUrlState({
        disciplineKey: key,
        language: currentLang,
        replace: replaceHistory
      });
    }

    if (analyticsMode === "full") {
      sendDisciplineAnalytics(item, currentLang, { includePageView: true });
    } else if (analyticsMode === "event-only") {
      sendDisciplineAnalytics(item, currentLang, { includePageView: false });
    }

    renderReadingContentInPhases(item, currentLang, readingRenderToken, startTime);
  }

  function closeDiscipline(options = {}) {
    const { syncUrl = true, analyticsMode = "full", replaceHistory = false } = options;

    const hadOpenDiscipline = Boolean(currentOpenDisciplineKey);

    currentOpenDisciplineKey = null;
    readingRenderToken += 1;
    screen.classList.remove("is-reading");

    setCopyButtonState("default", { autoReset: false });
    setNativeShareButtonState("default", { autoReset: false });

    if (readingLayer) {
      readingLayer.setAttribute("aria-hidden", "true");
    }

    if (readingArticle) {
      readingArticle.innerHTML = "";
      setReadingLoadingState(false);
    }

    restoreBaseMeta();
    updateStaticUiLanguage();

    fxController.resume();

    if (syncUrl) {
      syncUrlState({
        disciplineKey: null,
        language: currentLang,
        replace: replaceHistory
      });
    }

    if (analyticsMode === "full" && hadOpenDiscipline) {
      sendHomeAnalytics(currentLang);
    }

    clearTimeout(clearStateTimer);
    clearStateTimer = window.setTimeout(() => {
      nodes.forEach((node) => {
        node.classList.remove("is-selected");
        node.classList.remove("is-active");
      });
      orbit.classList.remove("is-hovering");
    }, 520);
  }

  function setLanguage(lang, options = {}) {
    if (!SUPPORTED_LANGS.includes(lang)) return;

    const { emitAnalytics = true, syncUrl = true, replaceHistory = false } = options;

    const previousLang = currentLang;
    currentLang = lang;
    localStorage.setItem("aen_lang", lang);
    updateStaticUiLanguage();

    let currentItem = null;

    if (currentOpenDisciplineKey) {
      currentItem = getDisciplineByKey(currentOpenDisciplineKey);

      if (currentItem) {
        const startTime = performance.now();
        applyReadingShell(currentItem);
        readingRenderToken += 1;
        renderReadingContentInPhases(currentItem, currentLang, readingRenderToken, startTime);
      }
    }

    if (syncUrl) {
      syncUrlState({
        disciplineKey: currentOpenDisciplineKey,
        language: lang,
        replace: replaceHistory
      });
    }

    if (emitAnalytics && previousLang !== lang) {
      sendLanguageAnalytics(lang, currentItem);

      if (!currentItem) {
        sendHomeAnalytics(lang);
      }
    }
  }

  function applyUrlState(options = {}) {
    const { analyticsMode = "full" } = options;

    const targetLang = getLanguageFromUrl() || currentLang || DEFAULT_LANG;
    const targetDisciplineKey = getDisciplineKeyFromUrl();

    const langChanged = targetLang !== currentLang;
    const disciplineChanged = targetDisciplineKey !== currentOpenDisciplineKey;

    if (!langChanged && !disciplineChanged) return;

    if (langChanged) {
      setLanguage(targetLang, {
        emitAnalytics: false,
        syncUrl: false
      });
    }

    if (targetDisciplineKey) {
      if (disciplineChanged) {
        openDiscipline(targetDisciplineKey, {
          syncUrl: false,
          analyticsMode
        });
      } else if (langChanged && analyticsMode === "full") {
        const item = getDisciplineByKey(targetDisciplineKey);
        if (item) {
          sendLanguageAnalytics(targetLang, item);
        }
      }
      return;
    }

    if (disciplineChanged && currentOpenDisciplineKey) {
      closeDiscipline({
        syncUrl: false,
        analyticsMode
      });
      return;
    }

    restoreBaseMeta();
    updateStaticUiLanguage();

    if (langChanged && analyticsMode === "full") {
      sendHomeAnalytics(currentLang);
    }
  }

  function scheduleUrlStateApply(analyticsMode = "full") {
    cancelAnimationFrame(stateApplyFrame);
    stateApplyFrame = window.requestAnimationFrame(() => {
      applyUrlState({ analyticsMode });
    });
  }

  orbit.innerHTML = disciplines
    .map((item, index) => {
      const order = String(index + 1).padStart(2, "0");
      const hue = Math.round((360 / total) * index);
      const svgMarkup = typeof item.svg === "string" && item.svg.trim() ? item.svg : fallbackSvg;

      return `
        <a
          class="orbit-node"
          href="#${encodeURIComponent(item.key)}"
          style="--i:${index}; --total:${total}; --node-hue:${hue};"
          data-key="${item.key}"
          aria-label="Open ${escapeHtml(item.title)}"
        >
          <span class="orbit-node__inner">
            <span class="orbit-node__index">${order}</span>

            <span class="orbit-node__sigil" aria-hidden="true">
              ${svgMarkup}
            </span>

            <span class="orbit-node__title">${escapeHtml(item.title)}</span>

            <span class="sr-only">
              ${escapeHtml(item.title)}. ${escapeHtml(item.discipline)}. ${escapeHtml(item.conclusion)}
            </span>
          </span>
        </a>
      `;
    })
    .join("");

  nodes = Array.from(orbit.querySelectorAll(".orbit-node"));

  nodes.forEach((node) => {
    node.addEventListener("pointerenter", () => {
      if (!pointerMode.matches) {
        setHoverActive(node);
      }
    });

    node.addEventListener("focus", () => {
      if (!screen.classList.contains("is-reading")) {
        setHoverActive(node);
      }
    });

    node.addEventListener("click", (event) => {
      event.preventDefault();
      openDiscipline(node.dataset.key, {
        syncUrl: true,
        analyticsMode: "full"
      });
    });
  });

  orbit.addEventListener("pointerleave", () => {
    clearHoverActive();
  });

  orbit.addEventListener("focusout", (event) => {
    if (!orbit.contains(event.relatedTarget)) {
      clearHoverActive();
    }
  });

  if (readingBackBtn) {
    readingBackBtn.addEventListener("click", () => {
      closeDiscipline({
        syncUrl: true,
        analyticsMode: "full"
      });
    });
  }

  if (readingCopyBtn) {
    readingCopyBtn.addEventListener("click", () => {
      handleCopyLinkAction();
    });
  }

  if (readingNativeShareBtn) {
    readingNativeShareBtn.addEventListener("click", () => {
      handleNativeShareAction();
    });
  }

  if (langSwitcher) {
    langSwitcher.addEventListener("click", (event) => {
      const button = event.target.closest(".lang-flag");
      if (!button) return;

      setLanguage(button.dataset.lang, {
        syncUrl: true,
        emitAnalytics: true
      });
    });
  }

  window.addEventListener("popstate", () => {
    scheduleUrlStateApply("full");
  });

  window.addEventListener("hashchange", () => {
    scheduleUrlStateApply("full");
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && screen.classList.contains("is-reading")) {
      closeDiscipline({
        syncUrl: true,
        analyticsMode: "full"
      });
    }
  });

  const resetTilt = () => {
    document.documentElement.style.setProperty("--tilt-x", "0");
    document.documentElement.style.setProperty("--tilt-y", "0");
    document.documentElement.style.setProperty("--glow-x", "50%");
    document.documentElement.style.setProperty("--glow-y", "50%");
  };

  screen.addEventListener("pointermove", (event) => {
    if (pointerMode.matches) return;

    const rect = screen.getBoundingClientRect();
    const relativeX = (event.clientX - rect.left) / rect.width;
    const relativeY = (event.clientY - rect.top) / rect.height;

    const tiltX = (relativeX - 0.5) * 10;
    const tiltY = (relativeY - 0.5) * 10;

    document.documentElement.style.setProperty("--tilt-x", tiltX.toFixed(2));
    document.documentElement.style.setProperty("--tilt-y", tiltY.toFixed(2));
    document.documentElement.style.setProperty("--glow-x", `${(relativeX * 100).toFixed(2)}%`);
    document.documentElement.style.setProperty("--glow-y", `${(relativeY * 100).toFixed(2)}%`);
  });

  screen.addEventListener("pointerleave", resetTilt);
  resetTilt();

  if (readingPanel) {
    readingPanel.addEventListener("click", (event) => {
      event.stopPropagation();
    });
  }

  updateStaticUiLanguage();

  setLanguage(currentLang, {
    emitAnalytics: false,
    syncUrl: false
  });

  if (readingCopyBtn) {
    readingCopyBtn.disabled = true;
    setCopyButtonState("default", { autoReset: false });
  }

  if (readingNativeShareBtn) {
    readingNativeShareBtn.hidden = !supportsNativeShare;
    readingNativeShareBtn.disabled = true;
    setNativeShareButtonState("default", { autoReset: false });
  }

  applyUrlState({
    analyticsMode: getDisciplineKeyFromUrl() ? "event-only" : "none"
  });
})();