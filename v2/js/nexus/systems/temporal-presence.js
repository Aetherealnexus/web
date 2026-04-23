import { EVENTS } from "../core/event-bus.js";

export function createTemporalPresenceEngine({ store, bus, dom, config }) {
  let currentPhase = null;
  let intervalId = null;

  function init() {
    evaluate(true);

    intervalId = window.setInterval(() => {
      evaluate(false);
    }, config.temporal.tickMs);
  }

  function destroy() {
    if (intervalId) {
      window.clearInterval(intervalId);
      intervalId = null;
    }
  }

  function evaluate(force) {
    const now = new Date();
    const nextPhase = determinePhase(now);

    if (!force && nextPhase === currentPhase) {
      applyVars(nextPhase, now);
      return;
    }

    currentPhase = nextPhase;

    store.setState({
      app: {
        temporalPhase: nextPhase
      }
    }, "temporal/set-phase");

    applyVars(nextPhase, now);

    bus.emit(EVENTS.TEMPORAL_PHASE_CHANGED, {
      phase: nextPhase,
      date: now.toISOString()
    });
  }

  function determinePhase(date) {
    const hour = date.getHours();

    if (hour >= 5 && hour < 8) return "dawn";
    if (hour >= 8 && hour < 17) return "day";
    if (hour >= 17 && hour < 20) return "dusk";
    if (hour >= 20 || hour < 1) return "night";
    return "deep-night";
  }

  function applyVars(phase, now) {
    if (!dom.body) return;

    const minutes = now.getMinutes() / 60;
    let lux = 1;
    let vignette = 0;
    let core = 0;

    if (phase === "dawn") {
      lux = 1.018 + minutes * 0.01;
      vignette = -0.03;
      core = 0.12;
    } else if (phase === "day") {
      lux = 1;
      vignette = -0.01;
      core = 0.02;
    } else if (phase === "dusk") {
      lux = 0.99;
      vignette = 0.05;
      core = 0.08;
    } else if (phase === "night") {
      lux = 0.97;
      vignette = 0.06;
      core = 0.04;
    } else if (phase === "deep-night") {
      lux = 0.94;
      vignette = 0.12;
      core = -0.02;
    }

    dom.body.style.setProperty("--nx-temporal-lux", lux.toFixed(3));
    dom.body.style.setProperty("--nx-temporal-vignette-bias", vignette.toFixed(3));
    dom.body.style.setProperty("--nx-temporal-core-bias", core.toFixed(3));
    dom.body.dataset.temporalPhase = phase;
  }

  return Object.freeze({
    init,
    destroy
  });
}