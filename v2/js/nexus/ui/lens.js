import { EVENTS } from "../core/event-bus.js";

export function createLensController({ dom, store, bus }) {
  function sync(state) {
    if (!dom.lens) return;

    dom.lens.classList.toggle("is-visible", state.ui.lensOpen);
    dom.lens.setAttribute("aria-hidden", String(!state.ui.lensOpen));

    if (dom.lensEyebrow) dom.lensEyebrow.textContent = state.lens.eyebrow;
    if (dom.lensTitle) dom.lensTitle.textContent = state.lens.title;
    if (dom.lensMeta) dom.lensMeta.textContent = state.lens.meta;
    if (dom.lensEssence) dom.lensEssence.textContent = state.lens.essence;

    if (dom.pinLensBtn) {
      dom.pinLensBtn.setAttribute("aria-pressed", String(state.lens.pinned));
    }

    if (dom.lensConnections) {
      dom.lensConnections.innerHTML = state.lens.connections
        .map((item) => `<li>${item}</li>`)
        .join("");
    }

    if (dom.lensTensions) {
      dom.lensTensions.innerHTML = state.lens.tensions
        .map((item) => `<li>${item}</li>`)
        .join("");
    }

    if (dom.lensIntersections) {
      dom.lensIntersections.innerHTML = state.lens.intersections.length
        ? state.lens.intersections.map((item) => `<span>${item}</span>`).join("")
        : "<span>None</span>";
    }
  }

  function open(payload, { preservePin = false } = {}) {
    const state = store.getState();

    store.setState({
      ui: {
        lensOpen: true,
        focusLabel: payload?.title || "Focus"
      },
      lens: {
        pinned: preservePin ? state.lens.pinned : false,
        eyebrow: payload?.eyebrow || "NODE",
        title: payload?.title || "Focus",
        meta: payload?.meta || "Awaiting resonance",
        essence: payload?.essence || "No essence provided.",
        connections: payload?.connections || ["No active connections"],
        tensions: payload?.tensions || ["No active tensions"],
        intersections: payload?.intersections || []
      }
    }, "lens/open");

    bus.emit(EVENTS.LENS_OPENED, payload);
  }

  function close({ respectPin = true } = {}) {
    const state = store.getState();

    if (respectPin && state.lens.pinned) {
      return;
    }

    store.setState({
      ui: {
        lensOpen: false,
        focusLabel: "Field"
      }
    }, "lens/close");

    bus.emit(EVENTS.LENS_CLOSED, { at: Date.now() });
  }

  return Object.freeze({
    sync,
    open,
    close
  });
}