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
      const count = Math.max(
        16,
        Math.min(38, Math.round(Math.min(fxState.width, fxState.height) / 42))
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
      const maxDistance = Math.min(fxState.width, fxState.height) * 0.16;

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
        const particle = fxState.particles[index];
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
      ctx.clearRect(0, 0, fxState.width, fxState.height);

      drawCoreGlow();

      const positions = fxState.particles.map((particle) => getParticlePosition(particle, time));
      drawConnections(positions);
      drawParticles(positions, time);

      if (!staticOnly && !prefersReducedMotion.matches && !fxState.isPaused) {
        fxState.rafId = window.requestAnimationFrame(renderFrame);
      }
    }

    function resizeCanvas() {
      const rect = pageBgCanvas.getBoundingClientRect();
      fxState.dpr = Math.min(window.devicePixelRatio || 1, 2);
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

      if (!prefersReducedMotion.matches && !fxState.isPaused) {
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

      if (!prefersReducedMotion.matches) {
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