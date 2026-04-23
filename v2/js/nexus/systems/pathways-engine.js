import { EVENTS } from "../core/event-bus.js";

function distance(x1, y1, x2, y2) {
  return Math.hypot(x2 - x1, y2 - y1);
}

export function createPathwaysEngine({ store, bus, config, graphNodes, graphEdges }) {
  const emittedAt = new Map();
  let recentSelections = [];

  const sequenceDefinitions = [
    {
      kind: "semantic-pathway",
      title: "Semantic descent formed.",
      text: "You moved from meaning into naming, symbol, ritual and threshold.",
      fragmentText: "Meaning is collapsing into threshold.",
      nodes: ["meaning", "language", "symbol", "ritual", "threshold"]
    },
    {
      kind: "emergent-pathway",
      title: "Emergent pathway formed.",
      text: "You traced instability into novelty, recurrence and becoming.",
      fragmentText: "Disorder is organizing itself.",
      nodes: ["entropy", "emergence", "pattern", "becoming"]
    },
    {
      kind: "observer-pathway",
      title: "Observer arc formed.",
      text: "You crossed matter, perception, consciousness and meaning in sequence.",
      fragmentText: "Substrate is climbing toward significance.",
      nodes: ["matter", "perception", "consciousness", "meaning"]
    }
  ];

  function init() {
    bus.on(EVENTS.NODE_SELECTED, ({ nodeId }) => {
      if (!nodeId) return;

      registerSelection(nodeId);
      emitSuggestedPath(nodeId);
      evaluateSequences();
      evaluateDeepNodeRoute(nodeId);
    });

    bus.on(EVENTS.VIEW_CHANGED, () => {
      const selected = store.getState().memory.lastSelectedNodeId;
      if (!selected) return;
      evaluateDeepNodeRoute(selected);
    });
  }

  function destroy() {
    recentSelections = [];
    emittedAt.clear();
  }

  function registerSelection(nodeId) {
    const now = Date.now();

    recentSelections = recentSelections
      .filter((entry) => now - entry.at <= config.easterEggs.sequenceOverallWindowMs)
      .concat([{ nodeId, at: now }]);
  }

  function emitPathway(payload) {
    const key = `${payload.kind}:${payload.nodes.join(">")}`;
    const now = Date.now();
    const last = emittedAt.get(key) || 0;

    if (now - last < config.pathways.emitCooldownMs) {
      return;
    }

    emittedAt.set(key, now);
    bus.emit(EVENTS.PATHWAY_DISCOVERED, payload);
  }

  function getNode(nodeId) {
    return graphNodes.find((node) => node.id === nodeId) || null;
  }

  function getNeighbors(nodeId) {
    const memory = store.getState().memory;

    const neighbors = graphEdges
      .filter((edge) => edge.source === nodeId || edge.target === nodeId)
      .map((edge) => {
        const neighborId = edge.source === nodeId ? edge.target : edge.source;
        const neighbor = getNode(neighborId);

        return {
          edge,
          neighbor,
          visits: memory.nodeVisits[neighborId] || 0
        };
      })
      .filter((item) => item.neighbor);

    neighbors.sort((a, b) => {
      if (a.visits !== b.visits) return a.visits - b.visits;
      return b.edge.weight - a.edge.weight;
    });

    return neighbors;
  }

  function emitSuggestedPath(nodeId) {
    const sourceNode = getNode(nodeId);
    if (!sourceNode) return;

    const neighbors = getNeighbors(nodeId).slice(0, config.pathways.suggestionNeighborCount);
    if (!neighbors.length) return;

    const nodes = [nodeId, ...neighbors.map((item) => item.neighbor.id)];
    const labels = neighbors.map((item) => item.neighbor.label);

    emitPathway({
      kind: "suggested-pathway",
      title: `Pathway opening from ${sourceNode.label}.`,
      text: `${sourceNode.label} is bending toward ${labels.join(" and ")}.`,
      fragmentText: `${sourceNode.label} is pulling toward ${labels[0]}.`,
      nodes,
      durationMs: config.constellations.durationMs
    });
  }

  function evaluateSequences() {
    for (const sequence of sequenceDefinitions) {
      if (matchesSequence(sequence.nodes)) {
        emitPathway({
          ...sequence,
          durationMs: config.constellations.durationMs + 500
        });
      }
    }
  }

  function matchesSequence(sequence) {
    let index = 0;
    let previousAt = null;

    for (const entry of recentSelections) {
      if (entry.nodeId !== sequence[index]) continue;

      if (
        previousAt !== null &&
        entry.at - previousAt > config.easterEggs.sequenceMaxGapMs
      ) {
        return false;
      }

      previousAt = entry.at;
      index += 1;

      if (index === sequence.length) {
        return true;
      }
    }

    return false;
  }

  function evaluateDeepNodeRoute(nodeId) {
    const state = store.getState();
    if (state.view.zoom < config.pathways.depthZoomThreshold) return;

    const sourceNode = getNode(nodeId);
    if (!sourceNode) return;

    const neighbors = getNeighbors(nodeId).slice(0, 1);
    if (!neighbors.length) return;

    const targetNode = neighbors[0].neighbor;
    const dist = distance(sourceNode.x, sourceNode.y, targetNode.x, targetNode.y);

    emitPathway({
      kind: "deep-route",
      title: `Local depth route opened near ${sourceNode.label}.`,
      text: `At this zoom level, the field is exposing a tight local bridge toward ${targetNode.label}.`,
      fragmentText: `${sourceNode.label} is narrowing into ${targetNode.label}.`,
      nodes: [sourceNode.id, targetNode.id],
      distance: dist,
      durationMs: config.constellations.durationMs
    });
  }

  return Object.freeze({
    init,
    destroy
  });
}