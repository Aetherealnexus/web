function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function distance(x1, y1, x2, y2) {
  return Math.hypot(x2 - x1, y2 - y1);
}

class CanvasEntropyStage {
  constructor({ canvas, store, config }) {
    this.canvas = canvas;
    this.store = store;
    this.config = config;

    this.ctx = null;
    this.width = 0;
    this.height = 0;
    this.dpr = 1;
    this.frameId = 0;
    this.lastFrameAt = 0;

    this.particles = [];
    this.noiseSeeds = [];

    this.handleResize = this.handleResize.bind(this);
    this.tick = this.tick.bind(this);
  }

  init() {
    if (!this.canvas) return;

    this.ctx =
      this.canvas.getContext("2d", {
        alpha: true,
        desynchronized: true
      }) || this.canvas.getContext("2d");

    if (!this.ctx) return;

    this.createParticles();
    this.handleResize();

    window.addEventListener("resize", this.handleResize, { passive: true });
    this.frameId = requestAnimationFrame(this.tick);
  }

  destroy() {
    cancelAnimationFrame(this.frameId);
    window.removeEventListener("resize", this.handleResize);
  }

  handleResize() {
    const rect = this.canvas.getBoundingClientRect();
    this.width = Math.max(1, Math.floor(rect.width));
    this.height = Math.max(1, Math.floor(rect.height));
    this.dpr = Math.min(window.devicePixelRatio || 1, this.config.render.pixelRatioCap);

    this.canvas.width = Math.floor(this.width * this.dpr);
    this.canvas.height = Math.floor(this.height * this.dpr);

    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    this.noiseSeeds = Array.from({ length: 40 }, () => ({
      x: Math.random() * this.width,
      y: Math.random() * this.height,
      r: Math.random() * 140 + 60,
      a: Math.random() * 0.07 + 0.01
    }));
  }

  createParticles() {
    const count = this.config.render.fallbackParticleCount;

    this.particles = Array.from({ length: count }, (_, index) => ({
      id: index,
      x: Math.random(),
      y: Math.random(),
      vx: (Math.random() - 0.5) * this.config.render.baseParticleSpeed,
      vy: (Math.random() - 0.5) * this.config.render.baseParticleSpeed,
      size: Math.random() * 1.6 + 0.65,
      alpha: Math.random() * 0.5 + 0.08,
      hueBand: index % 4,
      phase: Math.random() * Math.PI * 2
    }));
  }

  tick(timestamp) {
    const dt = this.lastFrameAt ? Math.min((timestamp - this.lastFrameAt) / 16.6667, 2.2) : 1;
    this.lastFrameAt = timestamp;

    this.render(dt, timestamp * 0.001);

    this.frameId = requestAnimationFrame(this.tick);
  }

  render(dt, timeSeconds) {
    if (!this.ctx) return;

    const state = this.store.getState();
    const { pointer, speed } = state.interaction;
    const zoom = state.view.zoom;
    const uiMode = state.app.uiMode;
    const fieldEnergy = clamp(speed / 14, 0, 1);

    const centerX = this.width * 0.5;
    const centerY = this.height * 0.5;
    const pointerX = Number.isFinite(pointer.x) ? pointer.x : centerX;
    const pointerY = Number.isFinite(pointer.y) ? pointer.y : centerY;

    this.ctx.clearRect(0, 0, this.width, this.height);

    this.drawBackgroundWash(centerX, centerY, pointerX, pointerY, fieldEnergy, zoom, timeSeconds);
    this.drawFloatingNoise(timeSeconds, fieldEnergy);
    this.drawParticles(pointerX, pointerY, centerX, centerY, dt, fieldEnergy, zoom, uiMode);
    this.drawCorePulse(centerX, centerY, fieldEnergy, zoom, timeSeconds);
  }

  drawBackgroundWash(centerX, centerY, pointerX, pointerY, fieldEnergy, zoom, timeSeconds) {
    const baseGradient = this.ctx.createRadialGradient(
      centerX,
      centerY,
      0,
      centerX,
      centerY,
      Math.max(this.width, this.height) * 0.58
    );

    baseGradient.addColorStop(0, "rgba(88, 138, 255, 0.10)");
    baseGradient.addColorStop(0.22, "rgba(109, 168, 255, 0.045)");
    baseGradient.addColorStop(0.46, "rgba(139, 232, 255, 0.022)");
    baseGradient.addColorStop(1, "rgba(0, 0, 0, 0)");

    this.ctx.fillStyle = baseGradient;
    this.ctx.fillRect(0, 0, this.width, this.height);

    const orbitR = 120 + Math.sin(timeSeconds * 0.26) * 40;
    const orbitX = centerX + Math.cos(timeSeconds * 0.18) * orbitR;
    const orbitY = centerY + Math.sin(timeSeconds * 0.15) * orbitR * 0.55;

    const ambientGradient = this.ctx.createRadialGradient(
      orbitX,
      orbitY,
      0,
      orbitX,
      orbitY,
      220 + zoom * 24
    );

    ambientGradient.addColorStop(0, `rgba(182, 156, 255, ${0.04 + fieldEnergy * 0.03})`);
    ambientGradient.addColorStop(0.5, "rgba(139, 232, 255, 0.02)");
    ambientGradient.addColorStop(1, "rgba(0, 0, 0, 0)");

    this.ctx.fillStyle = ambientGradient;
    this.ctx.fillRect(0, 0, this.width, this.height);

    const pointerGradient = this.ctx.createRadialGradient(
      pointerX,
      pointerY,
      0,
      pointerX,
      pointerY,
      140 + fieldEnergy * 130 + zoom * 22
    );

    pointerGradient.addColorStop(0, `rgba(139, 232, 255, ${0.065 + fieldEnergy * 0.06})`);
    pointerGradient.addColorStop(0.35, `rgba(109, 168, 255, ${0.03 + fieldEnergy * 0.03})`);
    pointerGradient.addColorStop(1, "rgba(0, 0, 0, 0)");

    this.ctx.fillStyle = pointerGradient;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  drawFloatingNoise(timeSeconds, fieldEnergy) {
    for (let i = 0; i < this.noiseSeeds.length; i += 1) {
      const seed = this.noiseSeeds[i];
      const x = seed.x + Math.sin(timeSeconds * 0.2 + i) * 16;
      const y = seed.y + Math.cos(timeSeconds * 0.18 + i * 0.7) * 16;
      const r = seed.r + Math.sin(timeSeconds * 0.16 + i * 0.3) * 12;

      const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, r);
      gradient.addColorStop(0, `rgba(255,255,255,${seed.a * 0.16 + fieldEnergy * 0.01})`);
      gradient.addColorStop(1, "rgba(0,0,0,0)");

      this.ctx.fillStyle = gradient;
      this.ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
  }

  drawParticles(pointerX, pointerY, centerX, centerY, dt, fieldEnergy, zoom, uiMode) {
    const connectionDistance = this.config.render.connectionDistance + zoom * 12;

    for (let i = 0; i < this.particles.length; i += 1) {
      const p = this.particles[i];

      const px = p.x * this.width;
      const py = p.y * this.height;
      const pointerDist = distance(px, py, pointerX, pointerY);
      const centerDist = distance(px, py, centerX, centerY);

      let ax = Math.sin(p.phase + i * 0.18) * 0.0004;
      let ay = Math.cos(p.phase * 1.2 + i * 0.11) * 0.0004;

      if (pointerDist < 190) {
        const force = (190 - pointerDist) / 190;
        ax += ((pointerX - px) / this.width) * 0.009 * force * (0.3 + fieldEnergy);
        ay += ((pointerY - py) / this.height) * 0.009 * force * (0.3 + fieldEnergy);
      }

      if (centerDist < 260) {
        const pull = (260 - centerDist) / 260;
        ax += ((centerX - px) / this.width) * 0.0018 * pull;
        ay += ((centerY - py) / this.height) * 0.0018 * pull;
      }

      if (uiMode === "minimal") {
        ax *= 0.7;
        ay *= 0.7;
      }

      p.vx = (p.vx + ax * dt) * 0.992;
      p.vy = (p.vy + ay * dt) * 0.992;

      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.phase += 0.008 * dt;

      if (p.x < -0.06) p.x = 1.06;
      if (p.x > 1.06) p.x = -0.06;
      if (p.y < -0.06) p.y = 1.06;
      if (p.y > 1.06) p.y = -0.06;

      const x = p.x * this.width;
      const y = p.y * this.height;

      this.ctx.beginPath();
      this.ctx.arc(x, y, p.size + fieldEnergy * 0.7, 0, Math.PI * 2);

      if (p.hueBand === 0) {
        this.ctx.fillStyle = `rgba(139, 232, 255, ${p.alpha})`;
      } else if (p.hueBand === 1) {
        this.ctx.fillStyle = `rgba(109, 168, 255, ${p.alpha * 0.92})`;
      } else if (p.hueBand === 2) {
        this.ctx.fillStyle = `rgba(182, 156, 255, ${p.alpha * 0.82})`;
      } else {
        this.ctx.fillStyle = `rgba(255, 238, 186, ${p.alpha * 0.56})`;
      }

      this.ctx.fill();

      const next = this.particles[(i + 1) % this.particles.length];
      const nx = next.x * this.width;
      const ny = next.y * this.height;
      const dist = distance(x, y, nx, ny);

      if (dist < connectionDistance) {
        const alpha = (1 - dist / connectionDistance) * (0.08 + fieldEnergy * 0.08);
        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
        this.ctx.lineTo(nx, ny);
        this.ctx.strokeStyle = `rgba(165, 223, 255, ${alpha})`;
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
      }
    }
  }

  drawCorePulse(centerX, centerY, fieldEnergy, zoom, timeSeconds) {
    const pulseRadius = 72 + zoom * 10 + Math.sin(timeSeconds * 1.6) * 4;
    const gradient = this.ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, pulseRadius);

    gradient.addColorStop(0, `rgba(255,255,255,${0.04 + fieldEnergy * 0.02})`);
    gradient.addColorStop(0.18, `rgba(139,232,255,${0.09 + fieldEnergy * 0.04})`);
    gradient.addColorStop(0.52, "rgba(109,168,255,0.03)");
    gradient.addColorStop(1, "rgba(0,0,0,0)");

    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, pulseRadius, 0, Math.PI * 2);
    this.ctx.fillStyle = gradient;
    this.ctx.fill();
  }
}

export function createStage({ canvas, store, config }) {
  return new CanvasEntropyStage({ canvas, store, config });
}