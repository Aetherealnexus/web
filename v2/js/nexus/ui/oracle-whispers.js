import { EVENTS } from "../core/event-bus.js";

export function createOracleWhispersController({ dom, bus, config }) {
  let container = null;
  const queue = [];
  let active = false;

  function init() {
    ensureContainer();

    bus.on(EVENTS.ORACLE_WHISPER_REQUESTED, (payload) => {
      enqueue(payload);
    });

    bus.on(EVENTS.SYMBOLIC_WEATHER_CHANGED, ({ weather }) => {
      if (!weather || weather === "lucid") return;

      enqueue({
        variant: "weather",
        eyebrow: "SYMBOLIC WEATHER",
        text: `The field has entered ${weather.replace(/-/g, " ")}.`
      });
    });

    bus.on(EVENTS.OBSERVER_PROFILE_CHANGED, ({ profile }) => {
      enqueue({
        variant: "observer",
        eyebrow: "OBSERVER PROFILE",
        text: `The field is reading you as ${profile.replace(/-/g, " ")}.`
      });
    });

    bus.on(EVENTS.RITUAL_COMPLETED, (payload) => {
      enqueue({
        variant: "ritual",
        eyebrow: "RITUAL",
        text: payload.title
      });
    });
  }

  function ensureContainer() {
    if (container) return container;

    container = dom.root.querySelector("#nexusOracleWhispers");

    if (!container) {
      container = document.createElement("div");
      container.id = "nexusOracleWhispers";
      container.className = "nexus-oracle-whispers";
      dom.root.appendChild(container);
    }

    return container;
  }

  function enqueue(payload) {
    if (!payload?.text) return;

    if (queue.length >= config.whispers.queueMax) {
      queue.shift();
    }

    queue.push({
      variant: payload.variant || "myth",
      eyebrow: payload.eyebrow || "ORACLE",
      text: payload.text,
      ttlMs: payload.ttlMs || config.whispers.ttlMs
    });

    if (!active) {
      consume();
    }
  }

  function consume() {
    const next = queue.shift();
    if (!next) {
      active = false;
      return;
    }

    active = true;

    const mount = ensureContainer();
    const el = document.createElement("div");
    el.className = `nx-oracle-whisper nx-oracle-whisper--${next.variant}`;
    el.innerHTML = `
      <span class="nx-oracle-whisper__eyebrow">${next.eyebrow}</span>
      <span class="nx-oracle-whisper__text">${next.text}</span>
    `;

    mount.appendChild(el);

    requestAnimationFrame(() => {
      el.classList.add("is-visible");
    });

    bus.emit(EVENTS.ORACLE_WHISPER_SHOWN, {
      variant: next.variant,
      text: next.text
    });

    const exitTimer = window.setTimeout(() => {
      el.classList.add("is-exit");
    }, Math.max(400, next.ttlMs - 280));

    window.setTimeout(() => {
      window.clearTimeout(exitTimer);

      if (el.parentNode) {
        el.parentNode.removeChild(el);
      }

      bus.emit(EVENTS.ORACLE_WHISPER_ENDED, {
        variant: next.variant
      });

      active = false;
      consume();
    }, next.ttlMs);
  }

  return Object.freeze({
    init
  });
}