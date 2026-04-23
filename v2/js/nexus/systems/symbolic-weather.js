import { EVENTS } from "../core/event-bus.js";

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function createSymbolicWeatherEngine({ store, bus, dom, config }) {
  let currentWeather = null;
  let lastSignature = {
    coherence: 0.4,
    turbulence: 0.2,
    anticipation: 0.1,
    gravity: 0.2,
    radiance: 0.2
  };
  let lastChangeAt = 0;
  let intervalId = null;

  function init() {
    bus.on(EVENTS.FIELD_SIGNATURE_CHANGED, (signature) => {
      lastSignature = signature;
      evaluate(true);
    });

    bus.on(EVENTS.EMOTION_CHANGED, () => {
      evaluate(true);
    });

    bus.on(EVENTS.TEMPORAL_PHASE_CHANGED, () => {
      evaluate(true);
    });

    intervalId = window.setInterval(() => {
      evaluate(false);
    }, config.symbolicWeather.tickMs);

    evaluate(true);
  }

  function destroy() {
    if (intervalId) {
      window.clearInterval(intervalId);
      intervalId = null;
    }
  }

  function evaluate(force) {
    const state = store.getState();
    const next = determineWeather(state, lastSignature);

    if (!force && next === currentWeather) {
      applyVars(next, lastSignature);
      return;
    }

    const now = Date.now();
    if (!force && currentWeather && next !== currentWeather) {
      if (now - lastChangeAt < config.symbolicWeather.minChangeGapMs) {
        applyVars(currentWeather, lastSignature);
        return;
      }
    }

    if (next !== currentWeather) {
      currentWeather = next;
      lastChangeAt = now;

      store.setState({
        app: {
          weatherState: next
        }
      }, "weather/set-state");

      bus.emit(EVENTS.SYMBOLIC_WEATHER_CHANGED, {
        weather: next,
        signature: lastSignature
      });
    }

    applyVars(currentWeather, lastSignature);
  }

  function determineWeather(state, signature) {
    const emotion = state.app.emotionState;
    const phase = state.app.temporalPhase;

    if (emotion === "revelation") return "ember";
    if (emotion === "surge" || signature.turbulence >= 0.74) return "ion-storm";
    if (emotion === "dormant" && (phase === "night" || phase === "deep-night")) return "eclipse";
    if (signature.anticipation >= 0.54 || state.ui.secretOpen) return "veil";
    if (signature.coherence >= 0.72 && (state.ui.lensOpen || state.ui.focusLabel === "Node")) return "cathedral";
    if ((phase === "dawn" || phase === "dusk") && signature.radiance >= 0.34) return "ember";
    return "lucid";
  }

  function applyVars(weather, signature) {
    if (!dom.body) return;

    const intensity = clamp(
      signature.radiance * 0.45 +
        signature.turbulence * 0.28 +
        signature.anticipation * 0.22,
      0,
      1
    );

    let coreBias = 0;
    let atmoBias = 0;

    if (weather === "ion-storm") {
      coreBias = 0.16 + intensity * 0.18;
      atmoBias = 0.22 + intensity * 0.22;
    } else if (weather === "veil") {
      coreBias = 0.08 + intensity * 0.08;
      atmoBias = 0.18 + intensity * 0.14;
    } else if (weather === "cathedral") {
      coreBias = 0.22 + intensity * 0.16;
      atmoBias = 0.1 + intensity * 0.08;
    } else if (weather === "ember") {
      coreBias = 0.18 + intensity * 0.14;
      atmoBias = 0.12 + intensity * 0.1;
    } else if (weather === "eclipse") {
      coreBias = -0.08;
      atmoBias = -0.06;
    }

    dom.body.style.setProperty("--nx-weather-intensity", intensity.toFixed(3));
    dom.body.style.setProperty("--nx-weather-core-bias", coreBias.toFixed(3));
    dom.body.style.setProperty("--nx-weather-atmo-bias", atmoBias.toFixed(3));
    dom.body.dataset.weatherState = weather || "lucid";
  }

  return Object.freeze({
    init,
    destroy
  });
}