(() => {
  const body = document.body;
  const bgMode = (body?.dataset?.bgMode || "fx").toLowerCase();
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  const backgrounds = Array.isArray(window.AEN_BACKGROUNDS) ? window.AEN_BACKGROUNDS : [];
  const pageBg = document.getElementById("pageBg");
  const pageBgCanvas = document.getElementById("pageBgCanvas");

  const disciplines = Array.isArray(window.NEXUS_DISCIPLINES) ? window.NEXUS_DISCIPLINES : [];
  const orbit = document.getElementById("discipline-orbit");
  const screen = document.querySelector(".orbit-screen");
  const pointerMode = window.matchMedia("(hover: none), (pointer: coarse)");

  const readingLayer = document.getElementById("readingLayer");
  const readingPanel = document.getElementById("readingPanel");
  const readingBackBtn = document.getElementById("readingBackBtn");
  const readingBackBtnText = document.getElementById("readingBackBtnText");

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

  const langSwitcher = document.getElementById("langSwitcher");
  const langButtons = Array.from(document.querySelectorAll(".lang-flag"));

  const SUPPORTED_LANGS = ["en", "pt", "fr"];
  const DEFAULT_LANG = "en";

  const UI_TRANSLATIONS = {
    en: {
      back: "Go Back",
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
        "This is the scrollable area intended for your real research corpus. You can later replace this default text by adding a new field such as <strong>readingHtml</strong> inside the corresponding object in <strong>disciplines-data.js</strong>.",
      readingZoneTextB:
        "You can place essays, nested sections, source notes, structured arguments, ontological maps, historical context, equations, symbolic interpretations, or any other long-form material here.",
      researchInProgress: "Research in progress",
      unfolding: "UNFOLDING",
      researchPlaceholderText:
        "This discipline is currently under active development. The investigation is ongoing, but this section of the Aethereal Nexus is not yet publicly available."
    },
    pt: {
      back: "Voltar",
      eyebrow: "DISCIPLINA",
      disciplineLabel: "Disciplina",
      intersectionLabel: "Interseção",
      conclusionLabel: "Conclusão",
      orientationTitle: "Orientação",
      currentDefinitionTitle: "Definição Atual",
      readingZoneTitle: "Zona de Leitura",
      orientationTextA:
        "<strong>{title}</strong> é a gateway ativa. Esta câmara de leitura está agora pronta para receber as tuas investigações, notas, frameworks, citações, hipóteses e reflexões de longo formato.",
      orientationTextB:
        "O sistema visual mantém-se igual ao estado de entrada para que a disciplina pareça nascer do mesmo mundo simbólico e não como algo desligado dele.",
      readingZoneTextA:
        "Esta é a área com scroll destinada ao teu corpus real de investigação. Mais tarde, podes substituir este texto por defeito adicionando um novo campo como <strong>readingHtml</strong> dentro do objeto correspondente em <strong>disciplines-data.js</strong>.",
      readingZoneTextB:
        "Podes colocar aqui ensaios, secções aninhadas, notas de fontes, argumentos estruturados, mapas ontológicos, contexto histórico, equações, interpretações simbólicas ou qualquer outro material de longo formato.",
      researchInProgress: "Investigação em curso",
      unfolding: "EM DESENVOLVIMENTO",
      researchPlaceholderText:
        "Esta disciplina encontra-se atualmente em desenvolvimento ativo. A investigação está a decorrer, mas esta secção do Aethereal Nexus ainda não está publicamente disponível."
    },
    fr: {
      back: "Retour",
      eyebrow: "DISCIPLINE",
      disciplineLabel: "Discipline",
      intersectionLabel: "Intersection",
      conclusionLabel: "Conclusion",
      orientationTitle: "Orientation",
      currentDefinitionTitle: "Définition Actuelle",
      readingZoneTitle: "Zone de Lecture",
      orientationTextA:
        "<strong>{title}</strong> est la passerelle active. Cette chambre de lecture est maintenant prête à recevoir vos recherches, notes, cadres, citations, hypothèses et réflexions longues.",
      orientationTextB:
        "Le système visuel reste identique à l’état d’entrée afin que la discipline semble née du même monde symbolique plutôt que détachée de celui-ci.",
      readingZoneTextA:
        "Il s’agit de la zone défilante destinée à votre véritable corpus de recherche. Vous pourrez plus tard remplacer ce texte par défaut en ajoutant un nouveau champ comme <strong>readingHtml</strong> dans l’objet correspondant de <strong>disciplines-data.js</strong>.",
      readingZoneTextB:
        "Vous pouvez y placer des essais, des sections imbriquées, des notes de sources, des arguments structurés, des cartes ontologiques, du contexte historique, des équations, des interprétations symboliques ou tout autre matériau long format.",
      researchInProgress: "Recherche en cours",
      unfolding: "EN DÉPLOIEMENT",
      researchPlaceholderText:
        "Cette discipline est actuellement en développement actif. La recherche est en cours, mais cette section de l’Aethereal Nexus n’est pas encore publiquement disponible."
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
  const total = disciplines.length;

  let currentLang = (() => {
    const saved = localStorage.getItem("aen_lang");
    return SUPPORTED_LANGS.includes(saved) ? saved : DEFAULT_LANG;
  })();

  let currentOpenDisciplineKey = null;
  let clearStateTimer = null;

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
    if (!pageBgCanvas) return;

    const ctx = pageBgCanvas.getContext("2d");
    if (!ctx) return;

    const state = {
      width: 0,
      height: 0,
      dpr: 1,
      particles: [],
      rafId: 0
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

      if (!staticOnly && !prefersReducedMotion.matches) {
        state.rafId = window.requestAnimationFrame(renderFrame);
      }
    }

    function start() {
      cancelAnimationFrame(state.rafId);
      resizeCanvas();

      if (!prefersReducedMotion.matches) {
        state.rafId = window.requestAnimationFrame(renderFrame);
      }
    }

    function stop() {
      cancelAnimationFrame(state.rafId);
    }

    window.addEventListener("resize", start, { passive: true });
    prefersReducedMotion.addEventListener?.("change", start);
    window.addEventListener("beforeunload", stop, { passive: true });

    start();
  }

  if (bgMode === "image") {
    initImageBackgroundMode();
  } else {
    initFxBackgroundMode();
  }

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
      readingHtml: localized.readingHtml || item.readingHtml || "",
      placeholderWord: localized.placeholderWord || item.placeholderWord || ui.unfolding,
      placeholderLabel: localized.placeholderLabel || item.placeholderLabel || ui.researchInProgress,
      placeholderText: localized.placeholderText || item.placeholderText || ui.researchPlaceholderText
    };
  }

  function updateLanguageButtons() {
    langButtons.forEach((button) => {
      button.classList.toggle("is-active", button.dataset.lang === currentLang);
    });
  }

  function updateStaticUiLanguage() {
    const ui = getUi(currentLang);

    setDocumentLang(currentLang);
    updateLanguageButtons();

    if (readingBackBtnText) {
      readingBackBtnText.textContent = ui.back;
    }

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

  function getReadingMarkup(item) {
    const localized = getLocalizedDiscipline(item, currentLang);

    if (item.status === "research_in_progress") {
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

    if (typeof localized.readingHtml === "string" && localized.readingHtml.trim()) {
      return localized.readingHtml;
    }

    return buildDefaultReadingMarkup(item, localized);
  }

  function applyReadingContent(item) {
    const localized = getLocalizedDiscipline(item, currentLang);
    const ui = getUi(currentLang);

    const index = disciplines.findIndex((entry) => entry.key === item.key) + 1;
    const hue = Math.round((360 / total) * (index - 1));
    const svgMarkup = typeof item.svg === "string" && item.svg.trim() ? item.svg : fallbackSvg;

    document.documentElement.style.setProperty("--discipline-hue", String(hue));

    if (readingLayer) readingLayer.setAttribute("aria-hidden", "false");
    if (readingSigil) readingSigil.innerHTML = svgMarkup;
    if (readingEyebrow) readingEyebrow.textContent = `${ui.eyebrow} ${String(index).padStart(2, "0")}`;
    if (readingTitle) readingTitle.textContent = localized.title;
    if (readingPronounced) readingPronounced.textContent = localized.pronounced;
    if (readingDiscipline) readingDiscipline.textContent = localized.discipline;
    if (readingIntersection) readingIntersection.textContent = localized.intersection;
    if (readingConclusion) readingConclusion.textContent = localized.conclusion;
    if (readingArticle) readingArticle.innerHTML = getReadingMarkup(item);
    if (readingScroll) readingScroll.scrollTop = 0;

    document.title = `${localized.title} – Aethereal Nexus`;
    if (metaDescription) {
      metaDescription.setAttribute(
        "content",
        `${localized.title}. ${localized.discipline}. ${localized.conclusion}`
      );
    }

    updateStaticUiLanguage();
  }

  function restoreBaseMeta() {
    document.title = baseTitle;
    if (metaDescription) {
      metaDescription.setAttribute("content", baseDescription);
    }
  }

  function openDiscipline(key) {
    const item = getDisciplineByKey(key);
    if (!item) return;

    currentOpenDisciplineKey = key;
    clearTimeout(clearStateTimer);

    const selectedNode = nodes.find((node) => node.dataset.key === key);

    nodes.forEach((node) => {
      const isSelected = node === selectedNode;
      node.classList.toggle("is-selected", isSelected);
      node.classList.toggle("is-active", isSelected);
    });

    orbit.classList.add("is-hovering");
    applyReadingContent(item);

    requestAnimationFrame(() => {
      screen.classList.add("is-reading");
    });
  }

  function closeDiscipline() {
    currentOpenDisciplineKey = null;
    screen.classList.remove("is-reading");

    if (readingLayer) {
      readingLayer.setAttribute("aria-hidden", "true");
    }

    restoreBaseMeta();
    updateStaticUiLanguage();

    clearTimeout(clearStateTimer);
    clearStateTimer = window.setTimeout(() => {
      nodes.forEach((node) => {
        node.classList.remove("is-selected");
        node.classList.remove("is-active");
      });
      orbit.classList.remove("is-hovering");
    }, 520);
  }

  function setLanguage(lang) {
    if (!SUPPORTED_LANGS.includes(lang)) return;

    currentLang = lang;
    localStorage.setItem("aen_lang", lang);
    updateStaticUiLanguage();

    if (currentOpenDisciplineKey) {
      const item = getDisciplineByKey(currentOpenDisciplineKey);
      if (item) {
        applyReadingContent(item);
      }
    }
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

  const nodes = Array.from(orbit.querySelectorAll(".orbit-node"));

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
      openDiscipline(node.dataset.key);
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
      closeDiscipline();
    });
  }

  if (langSwitcher) {
    langSwitcher.addEventListener("click", (event) => {
      const button = event.target.closest(".lang-flag");
      if (!button) return;
      setLanguage(button.dataset.lang);
    });
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && screen.classList.contains("is-reading")) {
      closeDiscipline();
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
  setLanguage(currentLang);
})();