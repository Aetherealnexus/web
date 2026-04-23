import { EVENTS } from "../core/event-bus.js";
import { GRAPH_SEED } from "../content/graph-data.js";

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function distance(x1, y1, x2, y2) {
  return Math.hypot(x2 - x1, y2 - y1);
}

function toneToColor(tone) {
  if (tone === "violet") return "rgba(182, 156, 255, 0.24)";
  if (tone === "blue") return "rgba(109, 168, 255, 0.24)";
  if (tone === "gold") return "rgba(255, 238, 186, 0.24)";
  return "rgba(139, 232, 255, 0.24)";
}

export function createNeuralMap({ containers, store, bus }) {
  const nodesById = new Map();
  const edgesById = new Map();

  let selectedNodeId = null;
  let hoveredNodeId = null;
  let unsubscribeState = null;

  function init() {
    render();
    unsubscribeState = store.subscribe(updateFieldResponse, { fireImmediately: true });
  }

  function destroy() {
    unsubscribeState?.();
    containers.nodes.innerHTML = "";
    containers.labels.innerHTML = "";
    containers.intersections.innerHTML = "";
    nodesById.clear();
    edgesById.clear();
  }

  function render() {
    containers.nodes.innerHTML = "";
    containers.labels.innerHTML = "";
    containers.intersections.innerHTML = "";

    renderEdges();
    renderNodes();
    renderLabels();
  }

  function renderEdges() {
    for (const edge of GRAPH_SEED.edges) {
      const source = GRAPH_SEED.nodes.find((node) => node.id === edge.source);
      const target = GRAPH_SEED.nodes.find((node) => node.id === edge.target);

      if (!source || !target) continue;

      const dx = target.x - source.x;
      const dy = target.y - source.y;
      const length = Math.hypot(dx, dy);
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);

      const el = document.createElement("div");
      el.className = "nexus-edge";
      el.dataset.edgeId = edge.id;
      el.dataset.edgeType = edge.type;
      el.style.width = `${length}px`;
      el.style.transform = `translate3d(${source.x}px, ${source.y}px, 0) rotate(${angle}deg)`;
      el.style.setProperty("--edge-opacity", String(0.08 + edge.weight * 0.12));
      el.style.setProperty("--edge-color", toneToColor(source.tone));

      containers.intersections.appendChild(el);

      edgesById.set(edge.id, {
        data: edge,
        el,
        sourceId: source.id,
        targetId: target.id
      });
    }
  }

  function renderNodes() {
    for (const node of GRAPH_SEED.nodes) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "nexus-node";
      button.dataset.nodeId = node.id;
      button.dataset.nodeType = node.type;
      button.dataset.nodeTone = node.tone;
      button.style.setProperty("--node-x", `${node.x}px`);
      button.style.setProperty("--node-y", `${node.y}px`);
      button.style.setProperty("--node-scale", String(node.scale || 1));

      const hit = document.createElement("span");
      hit.className = "nexus-node__hit";
      button.appendChild(hit);

      const label = document.createElement("span");
      label.className = "nexus-node__label";
      label.textContent = node.label;
      button.appendChild(label);

      button.addEventListener("pointerenter", () => handleNodeHover(node.id));
      button.addEventListener("pointerleave", () => handleNodeUnhover(node.id));
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        selectNode(node.id);
      });

      containers.nodes.appendChild(button);

      nodesById.set(node.id, {
        data: node,
        el: button
      });
    }

    containers.nodes.addEventListener("click", handleBackgroundClick);
  }

  function renderLabels() {
    for (const node of GRAPH_SEED.nodes) {
      const label = document.createElement("div");
      label.className = "nexus-map__label";
      label.dataset.labelFor = node.id;
      label.style.setProperty("--label-x", `${node.x}px`);
      label.style.setProperty("--label-y", `${node.y - 28}px`);
      label.textContent = node.eyebrow;

      containers.labels.appendChild(label);
    }
  }

  function handleBackgroundClick(event) {
    const clickedNode = event.target.closest(".nexus-node");
    if (clickedNode) return;
    clearSelection();
  }

  function handleNodeHover(nodeId) {
    hoveredNodeId = nodeId;
    updateNodeClasses();

    const node = nodesById.get(nodeId)?.data;
    if (!node) return;

    bus.emit(EVENTS.NODE_HOVERED, createLensPayload(node));
  }

  function handleNodeUnhover(nodeId) {
    if (hoveredNodeId === nodeId) {
      hoveredNodeId = null;
    }

    updateNodeClasses();
    bus.emit(EVENTS.NODE_UNHOVERED, { nodeId });
  }

  function selectNode(nodeId) {
    selectedNodeId = nodeId;
    updateNodeClasses();

    const node = nodesById.get(nodeId)?.data;
    if (!node) return;

    bus.emit(EVENTS.NODE_SELECTED, createLensPayload(node));
  }

  function clearSelection() {
    if (!selectedNodeId) return;

    selectedNodeId = null;
    updateNodeClasses();
    bus.emit(EVENTS.NODE_DESELECTED, {});
  }

  function focusNodeById(nodeId) {
    if (!nodesById.has(nodeId)) return;
    selectNode(nodeId);
  }

  function updateNodeClasses() {
    for (const [nodeId, record] of nodesById.entries()) {
      record.el.classList.toggle("is-hovered", hoveredNodeId === nodeId);
      record.el.classList.toggle("is-selected", selectedNodeId === nodeId);
    }

    const labels = containers.labels.querySelectorAll(".nexus-map__label");
    labels.forEach((label) => {
      const isActive =
        label.dataset.labelFor === hoveredNodeId ||
        label.dataset.labelFor === selectedNodeId;
      label.classList.toggle("is-active", isActive);
    });
  }

  function updateFieldResponse(state) {
    const rect = containers.map.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const pointerX = state.interaction.pointer.x;
    const pointerY = state.interaction.pointer.y;
    const worldX = (pointerX - rect.width * 0.5 - state.view.x) / state.view.zoom;
    const worldY = (pointerY - rect.height * 0.5 - state.view.y) / state.view.zoom;

    const nodeEnergies = new Map();

    for (const [nodeId, record] of nodesById.entries()) {
      const dist = distance(worldX, worldY, record.data.x, record.data.y);
      const energy = clamp(1 - dist / 260, 0, 1);
      const selectedBoost = selectedNodeId === nodeId ? 0.28 : 0;
      const hoveredBoost = hoveredNodeId === nodeId ? 0.18 : 0;
      const finalEnergy = clamp(energy + selectedBoost + hoveredBoost, 0, 1.4);

      record.el.style.setProperty("--node-energy", finalEnergy.toFixed(3));
      record.el.style.setProperty("--node-opacity", (0.72 + finalEnergy * 0.22).toFixed(3));
      nodeEnergies.set(nodeId, finalEnergy);
    }

    for (const [, edge] of edgesById.entries()) {
      const sourceEnergy = nodeEnergies.get(edge.sourceId) || 0;
      const targetEnergy = nodeEnergies.get(edge.targetId) || 0;
      const energy = Math.max(sourceEnergy, targetEnergy) * 0.92;

      edge.el.style.setProperty("--edge-energy", energy.toFixed(3));
      edge.el.classList.toggle(
        "is-active",
        energy > 0.2 || selectedNodeId === edge.sourceId || selectedNodeId === edge.targetId
      );
    }
  }

  function createLensPayload(node) {
    return {
      nodeId: node.id,
      eyebrow: node.eyebrow,
      title: node.label,
      meta: node.meta,
      essence: node.essence,
      connections: node.connections,
      tensions: node.tensions,
      intersections: node.intersections
    };
  }

  function getNodeRecords() {
    return Array.from(nodesById.values());
  }

  function getEdgeRecords() {
    return Array.from(edgesById.values());
  }

  function getSelectedNodeId() {
    return selectedNodeId;
  }

  function getHoveredNodeId() {
    return hoveredNodeId;
  }

  function getNodeById(nodeId) {
    return nodesById.get(nodeId)?.data || null;
  }

  function getWorldPointForNode(nodeId) {
    const node = nodesById.get(nodeId)?.data;
    if (!node) return null;

    return {
      x: node.x,
      y: node.y
    };
  }

  function getConnectedNodeIds(nodeId) {
    const ids = new Set();

    for (const edge of GRAPH_SEED.edges) {
      if (edge.source === nodeId) ids.add(edge.target);
      if (edge.target === nodeId) ids.add(edge.source);
    }

    return [...ids];
  }

  return Object.freeze({
    init,
    destroy,
    focusNodeById,
    clearSelection,
    getSelectedNodeId,
    getHoveredNodeId,
    getNodeRecords,
    getEdgeRecords,
    getNodeById,
    getWorldPointForNode,
    getConnectedNodeIds
  });
}