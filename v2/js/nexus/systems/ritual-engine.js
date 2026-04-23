import { EVENTS } from "../core/event-bus.js";

function now() {
  return Date.now();
}

export function createRitualEngine({ store, bus, config, neuralMap }) {
  let attunementWindowStartedAt = 0;
  let attunementHoldStartedAt = 0;

  let triuneWindow = null;
  let thresholdWindow = null;

  let unsubscribe = null;
  let tickId = null;

  function init() {
    bus.on(EVENTS.GESTURE_CORE_TAP, () => {
      const t = now();

      attunementWindowStartedAt = t;
      triuneWindow = {
        startedAt: t,
        stepIndex: 0,
        nodes: ["core"]
      };

      emitProgress(
        "Core invoked.",
        "The core has opened a ritual window. Hold presence or cross tones in sequence."
      );
    });

    bus.on(EVENTS.NODE_SELECTED, ({ nodeId }) => {
      if (!nodeId) return;

      handleTriuneSelection(nodeId);
      handleThresholdSelection(nodeId);
    });

    bus.on(EVENTS.GESTURE_LONG_PRESS, () => {
      const state = store.getState();
      const sourceNodeId = state.memory.lastSelectedNodeId;

      if (!sourceNodeId) return;
      if (state.view.zoom < 2.12) return;

      thresholdWindow = {
        startedAt: now(),
        sourceNodeId
      };

      emitProgress(
        "Threshold window opened.",
        `A deep press near ${sourceNodeId} has destabilized the field. Select Threshold to seal the rite.`
      );
    });

    unsubscribe = store.subscribe(() => {
      evaluateAttunement();
    }, { fireImmediately: true });

    tick();
  }

  function destroy() {
    unsubscribe?.();
    unsubscribe = null;

    if (tickId) {
      window.clearTimeout(tickId);
      tickId = null;
    }
  }

  function tick() {
    cleanupWindows();
    tickId = window.setTimeout(tick, 220);
  }

  function cleanupWindows() {
    const t = now();

    if (triuneWindow && t - triuneWindow.startedAt > config.ritual.invocationWindowMs) {
      triuneWindow = null;
    }

    if (thresholdWindow && t - thresholdWindow.startedAt > config.ritual.thresholdWindowMs) {
      thresholdWindow = null;
    }

    if (attunementWindowStartedAt && t - attunementWindowStartedAt > config.ritual.invocationWindowMs) {
      attunementWindowStartedAt = 0;
      attunementHoldStartedAt = 0;
    }
  }

  function evaluateAttunement() {
    const state = store.getState();
    const t = now();

    if (!attunementWindowStartedAt) return;
    if (t - attunementWindowStartedAt > config.ritual.invocationWindowMs) {
      attunementWindowStartedAt = 0;
      attunementHoldStartedAt = 0;
      return;
    }

    const onCore = state.ui.focusLabel === "Core";
    const attuned = state.app.emotionState === "attune";
    const stable = !state.interaction.dragging && state.interaction.speed < 1.2;

    if (onCore && attuned && stable) {
      if (!attunementHoldStartedAt) {
        attunementHoldStartedAt = t;

        emitProgress(
          "Stillness rite forming.",
          "Remain with the core. Do not drag. Let the field consolidate around silence."
        );
      }

      if (t - attunementHoldStartedAt >= config.ritual.attunementMs) {
        completeRitual({
          kind: "core-attunement",
          title: "Core attunement completed.",
          text: "Stillness at the core condensed the field into a coherent ritual state.",
          nodes: ["core"]
        });

        attunementWindowStartedAt = 0;
        attunementHoldStartedAt = 0;
      }
    } else {
      attunementHoldStartedAt = 0;
    }
  }

  function handleTriuneSelection(nodeId) {
    if (!triuneWindow) return;

    const t = now();
    if (t - triuneWindow.startedAt > config.ritual.invocationWindowMs) {
      triuneWindow = null;
      return;
    }

    const node = neuralMap.getNodeById(nodeId);
    if (!node) return;

    const expectedTones = ["cyan", "violet", "gold"];
    const expectedTone = expectedTones[triuneWindow.stepIndex];

    if (node.tone !== expectedTone) {
      return;
    }

    triuneWindow.nodes.push(nodeId);
    triuneWindow.stepIndex += 1;

    if (triuneWindow.stepIndex < expectedTones.length) {
      emitProgress(
        "Triune crossing progressing.",
        `Tone ${triuneWindow.stepIndex} aligned. Continue the sequence toward ${expectedTones[triuneWindow.stepIndex]}.`
      );
      return;
    }

    completeRitual({
      kind: "triune-invocation",
      title: "Triune invocation completed.",
      text: "You crossed cyan, violet and gold under an active core window. The field accepted the sequence.",
      nodes: [...triuneWindow.nodes]
    });

    triuneWindow = null;
  }

  function handleThresholdSelection(nodeId) {
    if (!thresholdWindow) return;

    const t = now();
    if (t - thresholdWindow.startedAt > config.ritual.thresholdWindowMs) {
      thresholdWindow = null;
      return;
    }

    if (nodeId !== "threshold") {
      return;
    }

    completeRitual({
      kind: "threshold-seal",
      title: "Threshold seal completed.",
      text: "A deep descent followed by a charged press has sealed a threshold rite.",
      nodes: [thresholdWindow.sourceNodeId, "threshold"]
    });

    thresholdWindow = null;
  }

  function emitProgress(title, text) {
    bus.emit(EVENTS.RITUAL_PROGRESS, {
      title,
      text,
      durationMs: config.ritual.progressHintMs
    });
  }

  function completeRitual(payload) {
    const state = store.getState();

    store.setState({
      memory: {
        ritualCount: (state.memory.ritualCount || 0) + 1
      }
    }, "ritual/complete");

    bus.emit(EVENTS.RITUAL_COMPLETED, payload);
    bus.emit(EVENTS.SECRET_CONDITION_MET, payload);
  }

  return Object.freeze({
    init,
    destroy
  });
}