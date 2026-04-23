import { EVENTS } from "../core/event-bus.js";

function determineEmotion(state, config) {
  const inactivityMs = Date.now() - state.session.lastInteractionAt;

  if (state.ui.secretOpen) return "revelation";
  if (state.ui.commandOpen) return "command";
  if (inactivityMs >= config.emotion.dormantAfterMs) return "dormant";
  if (state.interaction.dragging || state.interaction.speed > 9) return "surge";
  if (state.ui.lensOpen && state.ui.focusLabel !== "Field") return "converge";
  if (state.view.zoom >= 1.75) return "descent";
  if (state.ui.focusLabel === "Core" && state.interaction.speed < 1.2) return "attune";
  if (inactivityMs >= config.emotion.idleAfterMs) return "attune";

  return "explore";
}

function getHintForEmotion(emotion, config) {
  switch (emotion) {
    case "attune":
      return config.ui.deepFocusHint;
    case "surge":
      return "Velocity bends the field. Drag, cross and destabilize the map.";
    case "descent":
      return "Depth is opening. Zoom reveals denser relations.";
    case "converge":
      return "A local intelligence is forming around your current focus.";
    case "revelation":
      return "The field has answered. Remain inside the threshold.";
    case "dormant":
      return "The field is waiting. Any gesture will wake it.";
    case "command":
      return "Summon a direction. The nexus is listening for intent.";
    default:
      return config.ui.hintMessage;
  }
}

export function createEmotionEngine({ store, bus, config }) {
  let currentEmotion = null;
  let intervalId = null;
  let unsubscribe = null;

  function applyEmotion(nextEmotion) {
    const state = store.getState();
    if (state.app.emotionState === nextEmotion && currentEmotion === nextEmotion) {
      return;
    }

    currentEmotion = nextEmotion;

    store.setState({
      app: {
        emotionState: nextEmotion
      },
      ui: {
        dynamicHint: getHintForEmotion(nextEmotion, config)
      }
    }, "emotion/apply");

    bus.emit(EVENTS.EMOTION_CHANGED, {
      emotion: nextEmotion
    });
  }

  function evaluate() {
    const state = store.getState();
    const nextEmotion = determineEmotion(state, config);
    applyEmotion(nextEmotion);
  }

  function init() {
    unsubscribe = store.subscribe(() => {
      evaluate();
    }, { fireImmediately: true });

    intervalId = window.setInterval(() => {
      evaluate();
    }, config.emotion.tickMs);
  }

  function destroy() {
    unsubscribe?.();
    unsubscribe = null;

    if (intervalId) {
      window.clearInterval(intervalId);
      intervalId = null;
    }
  }

  return Object.freeze({
    init,
    destroy
  });
}