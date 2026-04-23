import { EVENTS } from "../core/event-bus.js";

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function createFocusAuraController({ dom, store, bus, neuralMap, config }) {
  let mount = null;
  let ring = null;
  let pulse = null;
  let sigil = null;
  let label = null;

  let latestSignature = {
    coherence: 0.4,
    turbulence: 0.2,
    anticipation: 0.1,
    gravity: 0.2,
    radiance: 0.2
  };

  let frameId = 0;

  function init() {
    ensureDom();

    bus.on(EVENTS.FIELD_SIGNATURE_CHANGED, (signature) => {
      latestSignature = signature;
    });

    tick();
  }

  function destroy() {
    cancelAnimationFrame(frameId);
  }

  function ensureDom() {
    mount = dom.root.querySelector("#nexusFocusAura");

    if (!mount) {
      mount = document.createElement("div");
      mount.id = "nexusFocusAura";
      mount.className = "nexus-focus-aura";

      ring = document.createElement("div");
      ring.className = "nx-focus-aura__ring";

      pulse = document.createElement("div");
      pulse.className = "nx-focus-aura__pulse";

      sigil = document.createElement("div");
      sigil.className = "nx-focus-aura__sigil";

      label = document.createElement("div");
      label.className = "nx-focus-aura__label";

      mount.appendChild(pulse);
      mount.appendChild(ring);
      mount.appendChild(sigil);
      mount.appendChild(label);

      dom.root.appendChild(mount);
    } else {
      ring = mount.querySelector(".nx-focus-aura__ring");
      pulse = mount.querySelector(".nx-focus-aura__pulse");
      sigil = mount.querySelector(".nx-focus-aura__sigil");
      label = mount.querySelector(".nx-focus-aura__label");
    }
  }

  function tick() {
    update();
    frameId = requestAnimationFrame(tick);
  }

  function update() {
    const target = resolveTarget();

    if (!target) {
      mount.classList.remove("is-visible");
      return;
    }

    mount.classList.add("is-visible");
    mount.dataset.focusTone = target.tone || "cyan";

    const energy = clamp(
      latestSignature.coherence * 0.38 +
        latestSignature.radiance * 0.34 +
        latestSignature.anticipation * 0.22 +
        (target.kind === "core" ? 0.08 : 0),
      0,
      1
    );

    const size =
      config.focusAura.baseSize +
      energy * 58 +
      (target.kind === "core" ? 26 : 0);

    const scale = 1 + energy * 0.06;
    const pulseScale = 1 + energy * 0.12;
    const rot = `${(performance.now() * 0.012) % 360}deg`;

    mount.style.setProperty("--focus-x", `${target.x.toFixed(2)}px`);
    mount.style.setProperty("--focus-y", `${target.y.toFixed(2)}px`);
    mount.style.setProperty("--focus-size", `${size.toFixed(2)}px`);
    mount.style.setProperty("--focus-scale", scale.toFixed(3));
    mount.style.setProperty("--focus-pulse-scale", pulseScale.toFixed(3));
    mount.style.setProperty("--focus-rot", rot);
    mount.style.setProperty("--focus-energy", energy.toFixed(3));
    mount.style.setProperty("--focus-label-y", `${size * 0.62}px`);

    label.textContent = target.label;

    bus.emit(EVENTS.FOCUS_AURA_UPDATED, {
      kind: target.kind,
      label: target.label,
      x: target.x,
      y: target.y
    });
  }

  function resolveTarget() {
    const state = store.getState();
    const rect = dom.interactionPlane?.getBoundingClientRect();

    if (!rect) return null;

    const selectedId = neuralMap.getSelectedNodeId();
    const hoveredId = neuralMap.getHoveredNodeId();

    if (selectedId) {
      return makeNodeTarget(selectedId, rect, state, "selected");
    }

    if (hoveredId) {
      return makeNodeTarget(hoveredId, rect, state, "hovered");
    }

    if (state.ui.focusLabel === "Core" || state.lens.title === "Aethereal Field Core") {
      return {
        kind: "core",
        label: "Core Focus",
        tone: "cyan",
        x: rect.left + rect.width * 0.5,
        y: rect.top + rect.height * 0.5
      };
    }

    return null;
  }

  function makeNodeTarget(nodeId, rect, state, kind) {
    const point = neuralMap.getWorldPointForNode(nodeId);
    const node = neuralMap.getNodeById(nodeId);

    if (!point || !node) return null;

    return {
      kind,
      label: node.label,
      tone: node.tone,
      x: rect.left + rect.width * 0.5 + state.view.x + point.x * state.view.zoom,
      y: rect.top + rect.height * 0.5 + state.view.y + point.y * state.view.zoom
    };
  }

  return Object.freeze({
    init,
    destroy
  });
}