import { EVENTS } from "../core/event-bus.js";

export function createGravityWellsEngine({ bus, neuralMap, mapContainer, config, store }) {
  let container = null;
  const active = [];

  function init() {
    ensureContainer();

    bus.on(EVENTS.PATHWAY_DISCOVERED, (payload) => {
      const nodes = payload.nodes || [];
      if (!nodes.length) return;

      createWellForNode(nodes[0], {
        kind: "pathway",
        label: "Pathway Anchor"
      });

      if (nodes.length > 1) {
        createWellForNode(nodes[nodes.length - 1], {
          kind: "pathway",
          label: "Pathway Pull"
        });
      }
    });

    bus.on(EVENTS.RITUAL_COMPLETED, (payload) => {
      const ritualNodes = payload.nodes || [];
      ritualNodes.slice(0, 3).forEach((nodeId, index) => {
        createWellForNode(nodeId, {
          kind: "ritual",
          label: index === 0 ? "Ritual Core" : "Ritual Echo",
          durationMs: config.gravityWells.defaultDurationMs + 700
        });
      });
    });

    bus.on(EVENTS.MYTH_STATE_CHANGED, () => {
      const lastNodeId = store.getState().memory.lastSelectedNodeId;
      if (!lastNodeId) return;

      createWellForNode(lastNodeId, {
        kind: "myth",
        label: "Mythic Weight",
        durationMs: config.gravityWells.defaultDurationMs + 500
      });
    });

    bus.on(EVENTS.EASTER_EGG_UNLOCKED, () => {
      const lastNodeId = store.getState().memory.lastSelectedNodeId;
      if (!lastNodeId) return;

      createWellForNode(lastNodeId, {
        kind: "myth",
        label: "Unlocked Gravity",
        durationMs: config.gravityWells.defaultDurationMs + 900
      });
    });
  }

  function destroy() {
    active.splice(0).forEach((item) => item.cleanup?.());
  }

  function ensureContainer() {
    if (container) return container;

    container = mapContainer.querySelector("#nexusGravityWells");

    if (!container) {
      container = document.createElement("div");
      container.id = "nexusGravityWells";
      container.className = "nexus-gravity-wells";
      mapContainer.appendChild(container);
    }

    return container;
  }

  function createWellForNode(nodeId, options = {}) {
    const point = neuralMap.getWorldPointForNode(nodeId);
    const node = neuralMap.getNodeById(nodeId);

    if (!point || !node) return;

    const mount = ensureContainer();

    while (active.length >= config.gravityWells.maxActive) {
      const oldest = active.shift();
      oldest?.cleanup?.();
    }

    const well = document.createElement("div");
    well.className = `nx-gravity-well nx-gravity-well--${options.kind || "pathway"}`;
    well.dataset.tone = node.tone || "cyan";
    well.style.setProperty("--well-x", `${point.x}px`);
    well.style.setProperty("--well-y", `${point.y}px`);
    well.style.setProperty("--well-size", `${node.type === "anchor" ? 220 : 180}px`);
    well.style.setProperty("--well-energy", `${node.type === "anchor" ? 0.94 : 0.72}`);

    well.innerHTML = `
      <div class="nx-gravity-well__field"></div>
      <div class="nx-gravity-well__ring"></div>
      <div class="nx-gravity-well__core"></div>
      <div class="nx-gravity-well__label">${options.label || "Gravity Well"}</div>
    `;

    mount.appendChild(well);

    requestAnimationFrame(() => {
      well.classList.add("is-visible");
    });

    const ttl = options.durationMs || config.gravityWells.defaultDurationMs;

    const exitTimer = window.setTimeout(() => {
      well.classList.remove("is-visible");
    }, Math.max(300, ttl - 260));

    const removeTimer = window.setTimeout(() => {
      cleanup();
    }, ttl);

    function cleanup() {
      window.clearTimeout(exitTimer);
      window.clearTimeout(removeTimer);

      const index = active.findIndex((item) => item.el === well);
      if (index >= 0) {
        active.splice(index, 1);
      }

      if (well.parentNode) {
        well.parentNode.removeChild(well);
      }

      bus.emit(EVENTS.GRAVITY_WELL_ENDED, {
        nodeId
      });
    }

    active.push({
      el: well,
      cleanup
    });

    bus.emit(EVENTS.GRAVITY_WELL_CREATED, {
      nodeId,
      tone: node.tone,
      kind: options.kind || "pathway"
    });
  }

  return Object.freeze({
    init,
    destroy
  });
}