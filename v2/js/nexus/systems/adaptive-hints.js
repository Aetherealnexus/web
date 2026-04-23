import { EVENTS } from "../core/event-bus.js";

export function createAdaptiveHintsEngine({ store, bus, config, neuralMap }) {
  let temporaryHint = null;
  let temporaryExpiresAt = 0;
  let unsubscribe = null;

  function init() {
    unsubscribe = store.subscribe(() => {
      evaluate();
    }, { fireImmediately: true });

    bus.on(EVENTS.PATHWAY_DISCOVERED, (payload) => {
      setTemporaryHint(payload.fragmentText || payload.text, config.hints.temporaryMs);
    });

    bus.on(EVENTS.EASTER_EGG_UNLOCKED, (payload) => {
      setTemporaryHint(`Unlocked: ${payload.title}`, config.hints.celebrateMs);
    });

    bus.on(EVENTS.REVEAL_STARTED, (payload) => {
      setTemporaryHint(payload.text, Math.max(config.hints.temporaryMs, payload.durationMs || 0));
    });

    bus.on(EVENTS.RITUAL_PROGRESS, (payload) => {
      setTemporaryHint(payload.text, payload.durationMs || config.hints.temporaryMs);
    });

    bus.on(EVENTS.RITUAL_COMPLETED, (payload) => {
      setTemporaryHint(payload.title, config.hints.celebrateMs);
    });

    bus.on(EVENTS.COMMAND_OPENED, () => {
      evaluate(true);
    });
  }

  function destroy() {
    unsubscribe?.();
    unsubscribe = null;
  }

  function setTemporaryHint(text, ttlMs) {
    if (!text) return;

    temporaryHint = text;
    temporaryExpiresAt = Date.now() + ttlMs;
    evaluate(true);
  }

  function evaluate(force = false) {
    const state = store.getState();
    const nextHint = computeHint(state);
    const currentHint = state.ui.dynamicHint || "";

    if (!force && nextHint === currentHint) {
      return;
    }

    store.setState({
      ui: {
        dynamicHint: nextHint
      }
    }, "hint/update");

    bus.emit(EVENTS.HINT_UPDATED, {
      hint: nextHint
    });
  }

  function computeHint(state) {
    if (temporaryHint && Date.now() < temporaryExpiresAt) {
      return temporaryHint;
    }

    temporaryHint = null;

    if (state.ui.commandOpen) {
      return "Invoke a direction or press Esc to dissolve the palette back into the field.";
    }

    if (state.ui.secretOpen) {
      return "Hold the revelation for a moment. Moving too quickly dissipates the threshold.";
    }

    if (state.app.weatherState === "ion-storm") {
      return "The symbolic weather is unstable. Fast crossings may force rare alignments.";
    }

    if (state.app.weatherState === "veil") {
      return "The field is veiled. Slow selection reveals more than rapid movement.";
    }

    if (state.app.weatherState === "cathedral") {
      return "The atmosphere is coherent. Select a node and let its local architecture deepen.";
    }

    if (state.app.temporalPhase === "dawn") {
      return "Dawn is thinning the field. Early coherence often reveals cleaner pathways.";
    }

    if (state.app.temporalPhase === "deep-night") {
      return "Deep night favors quieter rites. Minimal UI and stillness may unlock rarer states.";
    }

    if (state.app.emotionState === "dormant") {
      return "The field is dimming. A single gesture will wake dormant structures.";
    }

    if (!state.memory.lastSelectedNodeId && state.memory.visitedNodeCount === 0) {
      return "Select any luminous node to anchor your first conceptual path.";
    }

    if (!state.memory.lastSelectedNodeId && state.view.zoom > 1.7) {
      return "Depth without anchor produces drift. Select a node to condense the map.";
    }

    if (state.memory.ritualCount > 0) {
      return "A ritual mark remains in the field. Try the core again or descend deeply before pressing.";
    }

    if (state.memory.lastSelectedNodeId) {
      const visits = state.memory.nodeVisits[state.memory.lastSelectedNodeId] || 0;
      const currentNode = neuralMap.getNodeById(state.memory.lastSelectedNodeId);

      if (visits >= 2 && currentNode) {
        return `${currentNode.label} remembers you. Cross into a distant cluster to force a new pathway.`;
      }

      if (state.view.zoom >= 2 && currentNode) {
        return `You are deep inside ${currentNode.label}. Follow a pathway or zoom out to restore global structure.`;
      }
    }

    if (state.app.uiMode === "minimal") {
      return "Minimal mode sharpens signal. Use the minimap or a command to navigate with precision.";
    }

    if (state.app.emotionState === "attune") {
      return config.ui.deepFocusHint;
    }

    if (state.app.emotionState === "surge") {
      return "Velocity is bending the field. Cross clusters fast to provoke unstable pathways.";
    }

    if (state.memory.visitedNodeCount >= 4 && !state.ui.audioActive) {
      return "The map is already listening to you visually. Activate audio to let it answer sonically.";
    }

    return config.ui.hintMessage;
  }

  return Object.freeze({
    init,
    destroy
  });
}