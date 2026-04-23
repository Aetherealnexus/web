import { EVENTS } from "../core/event-bus.js";

export function createMythEngine({ store, bus, config, neuralMap }) {
  let currentMyth = null;
  let lastWhisperAt = 0;

  function init() {
    store.subscribe(() => {
      evaluate(false);
    }, { fireImmediately: true });

    bus.on(EVENTS.RITUAL_COMPLETED, (payload) => {
      requestWhisper({
        variant: "ritual",
        eyebrow: "MYTHIC EVENT",
        text: payload.title
      });
    });

    bus.on(EVENTS.SECRET_REVEALED, (payload) => {
      requestWhisper({
        variant: "myth",
        eyebrow: "FIELD MEMORY",
        text: payload.title || "A threshold has been remembered."
      });
    });
  }

  function determineMyth(state) {
    const profile = state.app.observerProfile;
    const weather = state.app.weatherState;
    const phase = state.app.temporalPhase;

    if (state.memory.ritualCount >= 1 && (weather === "cathedral" || state.ui.secretOpen)) {
      return "threshold-liturgy";
    }

    if (weather === "eclipse" || phase === "deep-night") {
      return "eclipse-vigil";
    }

    if (weather === "ion-storm") {
      return "storm-script";
    }

    if (weather === "veil" && (profile === "witness" || profile === "diver")) {
      return "veilwalking";
    }

    if (profile === "ritualist") {
      return "threshold-liturgy";
    }

    if (profile === "diver") {
      return "descent-archive";
    }

    if (profile === "cartographer") {
      return "cartography-of-light";
    }

    if (profile === "witness") {
      return "witness-of-forms";
    }

    if (phase === "dawn") {
      return "first-light";
    }

    return "first-awakening";
  }

  function getMythDescription(myth, state) {
    const selectedNodeId = state.memory.lastSelectedNodeId;
    const selectedNode = selectedNodeId ? neuralMap.getNodeById(selectedNodeId) : null;
    const nodeName = selectedNode?.label || "the field";

    switch (myth) {
      case "threshold-liturgy":
        return `The map now reads you as someone who does not merely explore ${nodeName}, but consecrates crossings inside it.`;
      case "eclipse-vigil":
        return `A darker vigil has formed. ${nodeName} is no longer just content; it is becoming watchful space.`;
      case "storm-script":
        return `The field is interpreting your movement as kinetic scripture. Motion itself is becoming meaning.`;
      case "veilwalking":
        return `You are moving inside the veil, where direct clarity weakens and symbolic intuition becomes stronger.`;
      case "descent-archive":
        return `The system now frames your path as descent: each zoom is treated like a deeper page in a hidden archive.`;
      case "cartography-of-light":
        return `Your behavior is no longer random to the field. It is reading you as a mapper of luminous structure.`;
      case "witness-of-forms":
        return `Stillness has changed the narrative. The field regards you as a witness rather than a consumer.`;
      case "first-light":
        return `Temporal presence is shaping the myth. The field is tilted toward emergence and first coherence.`;
      default:
        return `The nexus remains in its first awakening: open, unreadable, and waiting for a stronger pattern of intent.`;
    }
  }

  function evaluate(force) {
    const state = store.getState();
    const nextMyth = determineMyth(state);

    if (!force && nextMyth === currentMyth) {
      return;
    }

    currentMyth = nextMyth;

    store.setState({
      app: {
        mythState: nextMyth
      }
    }, "myth/set-state");

    const description = getMythDescription(nextMyth, state);

    bus.emit(EVENTS.MYTH_STATE_CHANGED, {
      myth: nextMyth,
      description
    });

    requestWhisper({
      variant: "myth",
      eyebrow: "MYTHIC STATE",
      text: description
    });
  }

  function requestWhisper(payload) {
    const now = Date.now();

    if (now - lastWhisperAt < config.myth.whisperCooldownMs) {
      return;
    }

    lastWhisperAt = now;
    bus.emit(EVENTS.ORACLE_WHISPER_REQUESTED, payload);
  }

  return Object.freeze({
    init
  });
}