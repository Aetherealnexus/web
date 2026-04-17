export function createBackgroundController({
  bgMode,
  backgrounds,
  pageBg,
  pageBgCanvas,
  prefersReducedMotion
}) {
  function createNoopController() {
    return {
      pause() {},
      resume() {}
    };
  }

  function getFxProfile() {
    const isTouchLike = window.matchMedia("(hover: none), (pointer: coarse)").matches;
    const isSmallViewport = window.matchMedia("(max-width: 768px)").matches;

    const deviceMemory =
      typeof navigator.deviceMemory === "number" ? navigator.deviceMemory : null;

    const hardwareConcurrency =
      typeof navigator.hardwareConcurrency === "number"
        ? navigator.hardwareConcurrency
        : null;

    const saveData = navigator.connection?.saveData === true;
    const reducedMotion = prefersReducedMotion.matches;

    const weakDeviceHint =
      saveData ||
      (deviceMemory !== null && deviceMemory <= 4) ||
      (hardwareConcurrency !== null && hardwareConcurrency <= 4);

    const mediumDeviceHint =
      (deviceMemory !== null && deviceMemory <= 6) ||
      (hardwareConcurrency !== null && hardwareConcurrency <= 6);

    if (reducedMotion) {
      return {
        staticMode: true,
        dprCap: 1,
        minParticles: 8,
        maxParticles: 12,
        densityDivisor: 82,
        showConnections: false,
        connectionDistanceFactor: 0.12
      };
    }

    if (weakDeviceHint) {
      return {
        staticMode: true,
        dprCap: 1,
        minParticles: 8,
        maxParticles: 14,
        densityDivisor: 78,
        showConnections: false,
        connectionDistanceFactor: 0.12
      };
    }

    if (isTouchLike && isSmallViewport && mediumDeviceHint) {
      return {
        staticMode: false,
        dprCap: 1.2,
        minParticles: 12,
        maxParticles: 18,
        densityDivisor: 66,
        showConnections: false,
        connectionDistanceFactor: 0.13
      };
    }

    if (isTouchLike && isSmallViewport) {
      return {
        staticMode: false,
        dprCap: 1.4,
        minParticles: 18,
        maxParticles: 28,
        densityDivisor: 54,
        showConnections: true,
        connectionDistanceFactor: 0.15
      };
    }

    return {
      staticMode: false,
      dprCap: 1.8,
      minParticles: 22,
      maxParticles: 38,
      densityDivisor: 42,
      showConnections: true,
      connectionDistanceFactor: 0.16
    };
  }

  function initImageBackgroundMode() {
    if (!pageBg || !Array.isArray(backgrounds) || backgrounds.length === 0) {
      return createNoopController();
    }

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

    return createNoopController();
  }

  function initFxBackgroundMode() {
    if (!pageBgCanvas) {
      return createNoopController();
    }

    const ctx = pageBgCanvas.getContext("2d");
    if (!ctx) {
      return createNoopController();
    }

    const fxState = {
      width: 0,
      height: 0,
      dpr: 1,
      particles: [],
      rafId: 0,
      isPaused: false,
      profile: getFxProfile()
    };

    function createParticle(index, width, height, count) {
      const baseRadius = Math.min(width, height) * (0.14 + Math.random() * 0.22);
      const orbitStretch = 0.76 + Math.random() * 0.32;
      const profile = fxState.profile;

      return {
        angle: (Math.PI * 2 * index) / count + Math.random() * 0.8,
        speed: profile.staticMode ? 0 : 0.00008 + Math.random() * 0.00018,
        radiusX: baseRadius * (0.82 + Math.random() * 0.38),
        radiusY: baseRadius * orbitStretch,
        drift: profile.staticMode ? 0 : 0.22 + Math.random() * 0.58,
        driftSpeed: profile.staticMode ? 0 : 0.00018 + Math.random() * 0.00032,
        size: profile.staticMode ? 1 + Math.random() * 1.8 : 1.2 + Math.random() * 2.6,
        alpha: profile.staticMode ? 0.14 + Math.random() * 0.18 : 0.16 + Math.random() * 0.34,
        hue: 180 + Math.random() * 110,
        phase: Math.random() * Math.PI * 2
      };
    }

    function seedParticles() {
      const profile = fxState.profile;

      const count = Math.max(
        profile.minParticles,
        Math.min(
          profile.maxParticles,
          Math.round(Math.min(fxState.width, fxState.height) / profile.densityDivisor)
        )
      );

      fxState.particles = Array.from({ length: count }, (_, index) =>
        createParticle(index, fxState.width, fxState.height, count)
      );
    }

    function drawCoreGlow() {
      const cx = fxState.width * 0.5;
      const cy = fxState.height * 0.5;
      const radius = Math.min(fxState.width, fxState.height) * 0.22;

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
      const cx = fxState.width * 0.5;
      const cy = fxState.height * 0.5;
      const angle = particle.angle + time * particle.speed;
      const drift = Math.sin(time * particle.driftSpeed + particle.phase) * (18 * particle.drift);

      return {
        x: cx + Math.cos(angle) * (particle.radiusX + drift),
        y: cy + Math.sin(angle) * (particle.radiusY + drift * 0.6)
      };
    }

    function drawConnections(positions) {
      if (!fxState.profile.showConnections) return;

      const maxDistance =
        Math.min(fxState.width, fxState.height) * fxState.profile.connectionDistanceFactor;

      ctx.save();
      ctx.lineWidth = 0.8;
      ctx.globalCompositeOperation = "lighter";

      for (let i = 0; i < positions.length; i += 1) {
        for (let j = i + 1; j < positions.length; j += 1) {
          const dx = positions[j].x - positions[i].x;
          const dy = positions[j].y - positions[i].y;
          const distance = Math.hypot(dx, dy);

          if (distance > maxDistance) continue;

          const alpha = (1 - distance / maxDistance) * 0.09;
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
        const particle = fxState.particles[index];
        const pulse = fxState.profile.staticMode
          ? 1
          : 0.76 + 0.24 * Math.sin(time * 0.0012 + particle.phase);

        const radius = particle.size * pulse;

        const glowMultiplier = fxState.profile.staticMode ? 3.4 : 4.6;
        const gradient = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, radius * glowMultiplier);

        gradient.addColorStop(0, `hsla(${particle.hue}, 100%, 86%, ${particle.alpha})`);
        gradient.addColorStop(0.34, `hsla(${particle.hue}, 100%, 72%, ${particle.alpha * 0.42})`);
        gradient.addColorStop(1, `hsla(${particle.hue}, 100%, 68%, 0)`);

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, radius * glowMultiplier, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `hsla(${particle.hue}, 100%, 88%, ${Math.min(0.9, particle.alpha + 0.08)})`;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.restore();
    }

    function renderFrame(now, staticOnly = false) {
      const time = now || 0;

      ctx.clearRect(0, 0, fxState.width, fxState.height);

      drawCoreGlow();

      const positions = fxState.particles.map((particle) => getParticlePosition(particle, time));
      drawConnections(positions);
      drawParticles(positions, time);

      if (
        !staticOnly &&
        !fxState.profile.staticMode &&
        !prefersReducedMotion.matches &&
        !fxState.isPaused
      ) {
        fxState.rafId = window.requestAnimationFrame(renderFrame);
      }
    }

    function resizeCanvas() {
      const rect = pageBgCanvas.getBoundingClientRect();

      fxState.profile = getFxProfile();
      fxState.dpr = Math.min(window.devicePixelRatio || 1, fxState.profile.dprCap);
      fxState.width = Math.max(1, Math.floor(rect.width));
      fxState.height = Math.max(1, Math.floor(rect.height));

      pageBgCanvas.width = Math.floor(fxState.width * fxState.dpr);
      pageBgCanvas.height = Math.floor(fxState.height * fxState.dpr);

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(fxState.dpr, fxState.dpr);

      seedParticles();
      renderFrame(performance.now(), true);
    }

    function start() {
      cancelAnimationFrame(fxState.rafId);
      resizeCanvas();

      if (
        !fxState.profile.staticMode &&
        !prefersReducedMotion.matches &&
        !fxState.isPaused
      ) {
        fxState.rafId = window.requestAnimationFrame(renderFrame);
      }
    }

    function pause() {
      fxState.isPaused = true;
      cancelAnimationFrame(fxState.rafId);
      renderFrame(performance.now(), true);
    }

    function resume() {
      fxState.isPaused = false;
      cancelAnimationFrame(fxState.rafId);
      renderFrame(performance.now(), true);

      if (
        !fxState.profile.staticMode &&
        !prefersReducedMotion.matches
      ) {
        fxState.rafId = window.requestAnimationFrame(renderFrame);
      }
    }

    window.addEventListener("resize", start, { passive: true });
    prefersReducedMotion.addEventListener?.("change", start);
    window.addEventListener(
      "beforeunload",
      () => {
        cancelAnimationFrame(fxState.rafId);
      },
      { passive: true }
    );

    start();

    return {
      pause,
      resume
    };
  }

  return bgMode === "image" ? initImageBackgroundMode() : initFxBackgroundMode();
}