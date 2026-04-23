import { EVENTS } from "../core/event-bus.js";

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function diffSignature(a, b) {
  if (!a || !b) return 1;

  return Math.max(
    Math.abs((a.coherence || 0) - (b.coherence || 0)),
    Math.abs((a.turbulence || 0) - (b.turbulence || 0)),
    Math.abs((a.anticipation || 0) - (b.anticipation || 0)),
    Math.abs((a.gravity || 0) - (b.gravity || 0)),
    Math.abs((a.radiance || 0) - (b.radiance || 0))
  );
}

function computeSignature(state, config) {
  const inactivityMs = Date.now() - state.session.lastInteractionAt;
  const emotion = state.app.emotionState;
  const speedNorm = clamp(state.interaction.speed / 14, 0, 1);
  const zoomNorm = clamp(
    (state.view.zoom - state.view.minZoom) / Math.max(state.view.maxZoom - state.view.minZoom, 0.0001),
    0,
    1
  );

  const focusNorm =
    state.ui.focusLabel === "Core"
      ? 0.72
      : state.ui.focusLabel === "Node"
      ? 0.92
      : state.ui.focusLabel !== "Field"
      ? 0.78
      : 0.12;

  const turbulence = clamp(
    speedNorm * 0.72 +
      (state.interaction.dragging ? 0.22 : 0) +
      (emotion === "surge" ? 0.22 : 0) +
      (emotion === "revelation" ? 0.08 : 0) -
      (emotion === "attune" ? 0.16 : 0) -
      (emotion === "dormant" ? 0.24 : 0),
    0,
    1
  );

  const coherence = clamp(
    0.42 +
      (state.ui.lensOpen ? 0.18 : 0) +
      focusNorm * 0.18 +
      (emotion === "attune" ? 0.22 : 0) +
      (emotion === "converge" ? 0.18 : 0) +
      (emotion === "descent" ? 0.1 : 0) -
      turbulence * 0.28,
    0,
    1
  );

  const anticipation = clamp(
    (state.ui.commandOpen ? 0.42 : 0) +
      (state.ui.secretOpen ? 0.7 : 0) +
      (inactivityMs >= config.emotion.idleAfterMs ? 0.2 : 0) +
      (emotion === "dormant" ? 0.24 : 0) +
      (state.memory.secretCount > 0 ? 0.08 : 0) +
      (state.memory.commandCount > 1 ? 0.04 : 0),
    0,
    1
  );

  const gravity = clamp(
    zoomNorm * 0.58 +
      focusNorm * 0.26 +
      coherence * 0.16,
    0,
    1
  );

  const radiance = clamp(
    coherence * 0.38 +
      turbulence * 0.22 +
      anticipation * 0.18 +
      (state.ui.audioActive ? 0.08 : 0) +
      (emotion === "revelation" ? 0.22 : 0) +
      (emotion === "command" ? 0.06 : 0),
    0,
    1
  );

  return {
    emotion,
    coherence,
    turbulence,
    anticipation,
    gravity,
    radiance
  };
}

export function createFieldIntelligence({ store, bus, dom, config }) {
  let frameId = 0;
  let lastSignature = null;
  let lastEmitAt = 0;

  function init() {
    tick();
  }

  function destroy() {
    cancelAnimationFrame(frameId);
  }

  function tick() {
    const state = store.getState();
    const signature = computeSignature(state, config);

    applyCssVariables(signature);
    emitIfNeeded(signature);

    frameId = requestAnimationFrame(tick);
  }

  function applyCssVariables(signature) {
    dom.body.style.setProperty("--nx-field-coherence", signature.coherence.toFixed(3));
    dom.body.style.setProperty("--nx-field-turbulence", signature.turbulence.toFixed(3));
    dom.body.style.setProperty("--nx-field-anticipation", signature.anticipation.toFixed(3));
    dom.body.style.setProperty("--nx-field-gravity", signature.gravity.toFixed(3));
    dom.body.style.setProperty("--nx-field-radiance", signature.radiance.toFixed(3));
  }

  function emitIfNeeded(signature) {
    const now = performance.now();
    const delta = diffSignature(lastSignature, signature);
    const emotionChanged = !lastSignature || lastSignature.emotion !== signature.emotion;
    const silentTooLong = now - lastEmitAt >= config.field.emitMaxSilenceMs;

    if (
      !lastSignature ||
      delta >= config.field.signatureMinDelta ||
      emotionChanged ||
      silentTooLong
    ) {
      lastSignature = signature;
      lastEmitAt = now;
      bus.emit(EVENTS.FIELD_SIGNATURE_CHANGED, signature);
    }
  }

  return Object.freeze({
    init,
    destroy
  });
}