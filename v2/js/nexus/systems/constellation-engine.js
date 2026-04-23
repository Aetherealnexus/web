import { EVENTS } from "../core/event-bus.js";

export function createConstellationEngine({ bus, neuralMap, mapContainer, config }) {
  let container = null;
  let clearTimeoutId = null;

  function init() {
    ensureContainer();

    bus.on(EVENTS.PATHWAY_DISCOVERED, (payload) => {
      renderConstellation(payload, "pathway");
    });

    bus.on(EVENTS.EASTER_EGG_UNLOCKED, (payload) => {
      if (payload?.nodes?.length) {
        renderConstellation(payload, "easter");
      }
    });

    bus.on(EVENTS.RITUAL_COMPLETED, (payload) => {
      if (payload?.nodes?.length) {
        renderConstellation(payload, "easter");
      }
    });
  }

  function destroy() {
    window.clearTimeout(clearTimeoutId);
    if (container) {
      container.innerHTML = "";
    }
  }

  function ensureContainer() {
    if (container) return container;

    container = mapContainer.querySelector("#nexusConstellations");

    if (!container) {
      container = document.createElement("div");
      container.id = "nexusConstellations";
      container.className = "nexus-map__constellations";
      mapContainer.appendChild(container);
    }

    return container;
  }

  function renderConstellation(payload, variant = "pathway") {
    const mount = ensureContainer();
    mount.innerHTML = "";

    const points = (payload.nodes || [])
      .map((nodeId) => ({
        nodeId,
        point: neuralMap.getWorldPointForNode(nodeId)
      }))
      .filter((item) => item.point);

    if (points.length < 2) return;

    const wrapper = document.createElement("div");
    wrapper.className = `nx-constellation nx-constellation--${variant}`;

    for (let i = 0; i < points.length - 1; i += 1) {
      const source = points[i].point;
      const target = points[i + 1].point;
      const dx = target.x - source.x;
      const dy = target.y - source.y;
      const length = Math.hypot(dx, dy);
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);

      const line = document.createElement("div");
      line.className = "nx-constellation__line";
      line.style.width = `${length}px`;
      line.style.transform = `translate3d(${source.x}px, ${source.y}px, 0) rotate(${angle}deg)`;
      wrapper.appendChild(line);
    }

    points.forEach((entry, index) => {
      const orb = document.createElement("div");
      orb.className = `nx-constellation__orb ${index === 0 ? "nx-constellation__orb--anchor" : ""}`;
      orb.style.setProperty("--orb-x", `${entry.point.x}px`);
      orb.style.setProperty("--orb-y", `${entry.point.y}px`);
      orb.style.setProperty("--orb-scale", index === 0 ? "1.16" : "1");
      wrapper.appendChild(orb);
    });

    const centroid = getCentroid(points.map((item) => item.point));
    const label = document.createElement("div");
    label.className = "nx-constellation__label";
    label.style.setProperty("--label-x", `${centroid.x}px`);
    label.style.setProperty("--label-y", `${centroid.y - 42}px`);
    label.textContent = payload.title || "Constellation";
    wrapper.appendChild(label);

    mount.appendChild(wrapper);

    requestAnimationFrame(() => {
      wrapper.classList.add("is-visible");
    });

    window.clearTimeout(clearTimeoutId);
    clearTimeoutId = window.setTimeout(() => {
      wrapper.classList.remove("is-visible");
      window.setTimeout(() => {
        if (wrapper.parentNode) {
          wrapper.parentNode.removeChild(wrapper);
        }
      }, 260);
    }, payload.durationMs || config.constellations.durationMs);

    bus.emit(EVENTS.CONSTELLATION_RENDERED, {
      kind: payload.kind,
      nodes: payload.nodes || []
    });
  }

  function getCentroid(points) {
    const sum = points.reduce(
      (acc, point) => {
        acc.x += point.x;
        acc.y += point.y;
        return acc;
      },
      { x: 0, y: 0 }
    );

    return {
      x: sum.x / points.length,
      y: sum.y / points.length
    };
  }

  return Object.freeze({
    init,
    destroy
  });
}