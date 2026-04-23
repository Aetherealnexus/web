import { EVENTS } from "../core/event-bus.js";

export function createRevealEngine({ store, bus, config, dom }) {
  const queue = [];
  const seenQueueKeys = new Set();

  let active = false;
  let revealTimeoutId = null;
  let cooldownTimeoutId = null;

  function init() {
    bus.on(EVENTS.GESTURE_LONG_PRESS, () => {
      queueReveal({
        kind: "long-press-threshold",
        title: "Threshold recognized.",
        text: config.ui.secretRevealText
      });
    });

    bus.on(EVENTS.SECRET_CONDITION_MET, (payload) => {
      queueReveal(payload);
    });

    bus.on(EVENTS.COMMAND_EXECUTED, ({ commandId }) => {
      if (commandId === "reveal-threshold") {
        queueReveal({
          kind: "manual-threshold",
          title: "Manual threshold invoked.",
          text: "The field opened because you explicitly asked it to do so."
        });
      }
    });
  }

  function queueReveal(payload) {
    if (!payload || typeof payload !== "object") return;

    const normalized = {
      kind: payload.kind || "generic",
      title: payload.title || "Revelation",
      text: payload.text || config.ui.secretRevealText,
      durationMs: payload.durationMs || config.reveal.defaultDurationMs
    };

    const queueKey = `${normalized.kind}:${normalized.title}:${normalized.text}`;

    if (active || queue.length > 0) {
      if (seenQueueKeys.has(queueKey)) {
        return;
      }
    }

    seenQueueKeys.add(queueKey);

    if (queue.length >= config.reveal.maxQueueSize) {
      queue.shift();
    }

    queue.push(normalized);

    bus.emit(EVENTS.REVEAL_QUEUED, normalized);

    if (!active) {
      consumeNext();
    }
  }

  function consumeNext() {
    if (active) return;

    const next = queue.shift();
    if (!next) return;

    active = true;
    seenQueueKeys.delete(`${next.kind}:${next.title}:${next.text}`);

    openSecret(next);

    revealTimeoutId = window.setTimeout(() => {
      closeSecret();
      cooldownTimeoutId = window.setTimeout(() => {
        active = false;
        consumeNext();
      }, config.reveal.cooldownMs);
    }, next.durationMs);
  }

  function openSecret(reveal) {
    store.setState({
      ui: {
        secretOpen: true,
        modeLabel: "Revelation"
      }
    }, "reveal/open");

    if (dom.secretLayerTitle) dom.secretLayerTitle.textContent = reveal.title;
    if (dom.secretLayerText) dom.secretLayerText.textContent = reveal.text;

    bus.emit(EVENTS.REVEAL_STARTED, reveal);
    bus.emit(EVENTS.SECRET_REVEALED, reveal);

    if (typeof window.trackSecretReveal === "function") {
      window.trackSecretReveal(reveal.kind || reveal.title);
    }
  }

  function closeSecret() {
    const state = store.getState();
    const fallbackMode = state.ui.commandOpen
      ? "Command"
      : state.interaction.dragging
      ? "Navigate"
      : "Explore";

    store.setState({
      ui: {
        secretOpen: false,
        modeLabel: fallbackMode
      }
    }, "reveal/close");

    bus.emit(EVENTS.REVEAL_ENDED, {
      at: Date.now()
    });
  }

  function destroy() {
    window.clearTimeout(revealTimeoutId);
    window.clearTimeout(cooldownTimeoutId);
  }

  return Object.freeze({
    init,
    destroy,
    queueReveal
  });
}