import { EVENTS } from "../core/event-bus.js";

function getNodeTone(nodeId, graphNodes) {
  const node = graphNodes.find((item) => item.id === nodeId);
  return node?.tone || null;
}

export function createEasterEggEngine({ store, bus, config, graphNodes }) {
  const unlocked = new Set();

  let selectionTrail = [];
  let toneTrail = [];

  function init() {
    bus.on(EVENTS.NODE_SELECTED, ({ nodeId }) => {
      if (!nodeId) return;

      registerSelection(nodeId);
      evaluateSequences();
      evaluateTriuneBridge();
      evaluateDeepCartography();
      evaluateSilentCartographer();
    });

    bus.on(EVENTS.VIEW_CHANGED, () => {
      evaluateDeepCartography();
      evaluateSilentCartographer();
    });

    bus.on(EVENTS.HINTS_TOGGLED, () => {
      evaluateSilentCartographer();
    });

    bus.on(EVENTS.MEMORY_UPDATED, () => {
      evaluateSilentCartographer();
    });
  }

  function unlock(kind, title, text) {
    if (unlocked.has(kind)) return;

    unlocked.add(kind);

    bus.emit(EVENTS.EASTER_EGG_UNLOCKED, {
      kind,
      title,
      text
    });

    bus.emit(EVENTS.SECRET_CONDITION_MET, {
      kind,
      title,
      text
    });
  }

  function registerSelection(nodeId) {
    const now = Date.now();

    selectionTrail = selectionTrail
      .filter((entry) => now - entry.at <= config.easterEggs.sequenceOverallWindowMs)
      .concat([{ nodeId, at: now }]);

    const tone = getNodeTone(nodeId, graphNodes);

    toneTrail = toneTrail
      .filter((entry) => now - entry.at <= config.easterEggs.triuneWindowMs)
      .concat([{ tone, at: now }]);
  }

  function matchesSequence(sequence) {
    let sequenceIndex = 0;
    let previousTimestamp = null;

    for (const entry of selectionTrail) {
      if (entry.nodeId !== sequence[sequenceIndex]) continue;

      if (
        previousTimestamp !== null &&
        entry.at - previousTimestamp > config.easterEggs.sequenceMaxGapMs
      ) {
        return false;
      }

      previousTimestamp = entry.at;
      sequenceIndex += 1;

      if (sequenceIndex === sequence.length) {
        return true;
      }
    }

    return false;
  }

  function evaluateSequences() {
    if (
      matchesSequence(["meaning", "language", "symbol", "ritual", "threshold"])
    ) {
      unlock(
        "semantic-descent",
        "Semantic descent unlocked.",
        "You crossed from meaning into naming, symbolism, ritual and finally threshold."
      );
    }

    if (
      matchesSequence(["entropy", "emergence", "pattern", "becoming"])
    ) {
      unlock(
        "emergent-loop",
        "Emergent loop formed.",
        "You traced a path from disorder into self-organization, recurrence and transformation."
      );
    }
  }

  function evaluateTriuneBridge() {
    const recentTones = [...new Set(toneTrail.map((entry) => entry.tone).filter(Boolean))];

    if (
      recentTones.includes("cyan") &&
      recentTones.includes("violet") &&
      recentTones.includes("gold")
    ) {
      unlock(
        "triune-bridge",
        "Triune bridge awakened.",
        "You aligned perception, transformation and value into a single exploratory arc."
      );
    }
  }

  function evaluateDeepCartography() {
    const state = store.getState();
    if (state.view.zoom < config.easterEggs.deepZoomThreshold) return;
    if (!state.memory.lastSelectedNodeId) return;

    unlock(
      "deep-cartography",
      "Deep cartography unlocked.",
      "You descended far enough into the field for the map itself to acknowledge your depth."
    );
  }

  function evaluateSilentCartographer() {
    const state = store.getState();

    if (state.ui.hintsVisible) return;
    if (state.app.uiMode !== "minimal") return;
    if (state.memory.visitedNodeCount < config.easterEggs.silentCartographerVisitedThreshold) return;
    if (state.memory.maxZoomReached < config.easterEggs.silentCartographerZoomThreshold) return;

    unlock(
      "silent-cartographer",
      "Silent cartographer recognized.",
      "You explored deeply with reduced guidance and a restrained interface. The field noticed your discipline."
    );
  }

  function destroy() {
    selectionTrail = [];
    toneTrail = [];
    unlocked.clear();
  }

  return Object.freeze({
    init,
    destroy
  });
}