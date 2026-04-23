import { EVENTS } from "../core/event-bus.js";

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function createInsightFragmentsController({ dom, store, bus, neuralMap, config }) {
  let container = null;
  const active = [];

  function init() {
    ensureContainer();

    bus.on(EVENTS.NODE_SELECTED, (payload) => {
      const point = getScreenPointForNode(payload.nodeId);
      if (!point) return;

      spawnFragment({
        variant: "node",
        eyebrow: payload.eyebrow || "NODE",
        text: payload.essence,
        x: point.x,
        y: point.y - 84
      });
    });

    bus.on(EVENTS.PATHWAY_DISCOVERED, (payload) => {
      const anchorNodeId = payload.nodes?.[payload.nodes.length - 1];
      const point = getScreenPointForNode(anchorNodeId);

      spawnFragment({
        variant: "pathway",
        eyebrow: "PATHWAY",
        text: payload.fragmentText || payload.text,
        x: point?.x ?? window.innerWidth * 0.5,
        y: point?.y ? point.y - 96 : window.innerHeight * 0.32
      });
    });

    bus.on(EVENTS.REVEAL_STARTED, (payload) => {
      spawnFragment({
        variant: "secret",
        eyebrow: "REVELATION",
        text: payload.text,
        x: window.innerWidth * 0.5,
        y: window.innerHeight * 0.26
      });
    });

    bus.on(EVENTS.EASTER_EGG_UNLOCKED, (payload) => {
      spawnFragment({
        variant: "secret",
        eyebrow: "UNLOCKED",
        text: payload.title,
        x: window.innerWidth * 0.5,
        y: window.innerHeight * 0.18
      });
    });

    bus.on(EVENTS.RITUAL_PROGRESS, (payload) => {
      spawnFragment({
        variant: "ambient",
        eyebrow: "RITUAL",
        text: payload.text,
        x: window.innerWidth * 0.5,
        y: window.innerHeight * 0.72,
        ttlMs: 2600
      });
    });

    bus.on(EVENTS.RITUAL_COMPLETED, (payload) => {
      spawnFragment({
        variant: "secret",
        eyebrow: "RITUAL COMPLETED",
        text: payload.title,
        x: window.innerWidth * 0.5,
        y: window.innerHeight * 0.2,
        ttlMs: 4400
      });
    });

    bus.on(EVENTS.SYMBOLIC_WEATHER_CHANGED, ({ weather }) => {
      if (!weather || weather === "lucid") return;

      const textMap = {
        "ion-storm": "A symbolic storm is crossing the field.",
        "veil": "The field is entering a veiled atmospheric state.",
        "cathedral": "The map is stabilizing into a cathedral-like coherence.",
        "ember": "A warmer symbolic charge is gathering near the core.",
        "eclipse": "The field is dimming into eclipse."
      };

      spawnFragment({
        variant: "ambient",
        eyebrow: "WEATHER",
        text: textMap[weather] || weather,
        x: window.innerWidth * 0.18,
        y: window.innerHeight * 0.16,
        ttlMs: 2600
      });
    });

    bus.on(EVENTS.TEMPORAL_PHASE_CHANGED, ({ phase }) => {
      const textMap = {
        "dawn": "Dawn is entering the field.",
        "day": "The field has opened into day.",
        "dusk": "Dusk is tinting the field toward threshold.",
        "night": "Night is deepening the symbolic layer.",
        "deep-night": "Deep night is concentrating the field."
      };

      spawnFragment({
        variant: "ambient",
        eyebrow: "TEMPORAL PRESENCE",
        text: textMap[phase] || phase,
        x: window.innerWidth * 0.82,
        y: window.innerHeight * 0.16,
        ttlMs: 2600
      });
    });

    bus.on(EVENTS.HINT_UPDATED, ({ hint }) => {
      const state = store.getState();
      if (!state.ui.hintsVisible) return;
      if (state.app.emotionState === "dormant") {
        spawnFragment({
          variant: "ambient",
          eyebrow: "FIELD",
          text: hint,
          x: window.innerWidth * 0.5,
          y: window.innerHeight * 0.78,
          ttlMs: 2400
        });
      }
    });
  }

  function destroy() {
    active.splice(0).forEach((item) => {
      item.cleanup?.();
    });
  }

  function ensureContainer() {
    if (container) return container;

    container = dom.root.querySelector("#nexusFragments");

    if (!container) {
      container = document.createElement("div");
      container.id = "nexusFragments";
      container.className = "nexus-fragments";
      dom.root.appendChild(container);
    }

    return container;
  }

  function getScreenPointForNode(nodeId) {
    const point = neuralMap.getWorldPointForNode(nodeId);
    if (!point || !dom.interactionPlane) return null;

    const rect = dom.interactionPlane.getBoundingClientRect();
    const state = store.getState();

    return {
      x: rect.left + rect.width * 0.5 + state.view.x + point.x * state.view.zoom,
      y: rect.top + rect.height * 0.5 + state.view.y + point.y * state.view.zoom
    };
  }

  function spawnFragment({
    variant = "ambient",
    eyebrow = "FIELD",
    text,
    x,
    y,
    ttlMs = config.fragments.ttlMs
  }) {
    if (!text) return;

    const mount = ensureContainer();

    while (active.length >= config.fragments.maxActive) {
      const oldest = active.shift();
      oldest?.cleanup?.();
    }

    const fragment = document.createElement("div");
    fragment.className = `nx-fragment nx-fragment--${variant}`;
    fragment.style.left = `${clamp(x, 24, window.innerWidth - 24)}px`;
    fragment.style.top = `${clamp(y, 24, window.innerHeight - 24)}px`;

    fragment.innerHTML = `
      <span class="nx-fragment__eyebrow">${eyebrow}</span>
      <span class="nx-fragment__text">${text}</span>
    `;

    mount.appendChild(fragment);

    requestAnimationFrame(() => {
      fragment.classList.add("is-visible");
    });

    const exitTimer = window.setTimeout(() => {
      fragment.classList.add("is-exit");
    }, Math.max(400, ttlMs - 280));

    const removeTimer = window.setTimeout(() => {
      cleanup();
    }, ttlMs);

    function cleanup() {
      window.clearTimeout(exitTimer);
      window.clearTimeout(removeTimer);

      const index = active.findIndex((item) => item.el === fragment);
      if (index >= 0) {
        active.splice(index, 1);
      }

      if (fragment.parentNode) {
        fragment.parentNode.removeChild(fragment);
      }
    }

    active.push({
      el: fragment,
      cleanup
    });

    bus.emit(EVENTS.INSIGHT_FRAGMENT_REQUESTED, {
      variant,
      text
    });
  }

  return Object.freeze({
    init,
    destroy
  });
}