import { EVENTS } from "../core/event-bus.js";

function safeLocalStorageGet(key, fallbackValue) {
  try {
    const value = window.localStorage.getItem(key);
    return value === null ? fallbackValue : JSON.parse(value);
  } catch (error) {
    return fallbackValue;
  }
}

function safeLocalStorageSet(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    // ignore
  }
}

export function createMemoryEngine({ store, bus, config }) {
  let hoverSession = null;
  let rapidSelectionTrail = [];
  let unsubscribe = null;

  function restoreSnapshot() {
    const snapshot = safeLocalStorageGet(config.storage.memoryKey, null);
    if (!snapshot || typeof snapshot !== "object") return;

    store.setState({
      memory: {
        visitedNodeCount: snapshot.visitedNodeCount || 0,
        lastSelectedNodeId: snapshot.lastSelectedNodeId || null,
        lastSelectedAt: snapshot.lastSelectedAt || 0,
        maxZoomReached: snapshot.maxZoomReached || config.interaction.defaultZoom,
        secretCount: snapshot.secretCount || 0,
        coreTapCount: snapshot.coreTapCount || 0,
        commandCount: snapshot.commandCount || 0,
        nodeVisits: snapshot.nodeVisits || {},
        hoverDwellMs: snapshot.hoverDwellMs || {},
        uniqueNodeOrder: snapshot.uniqueNodeOrder || []
      }
    }, "memory/restore-snapshot");
  }

  function persistSnapshot() {
    const { memory } = store.getState();
    safeLocalStorageSet(config.storage.memoryKey, memory);
  }

  function emitMemoryUpdate() {
    const snapshot = store.getState().memory;
    bus.emit(EVENTS.MEMORY_UPDATED, snapshot);
  }

  function patchMemory(partial, action) {
    store.setState({
      memory: partial
    }, action);

    persistSnapshot();
    emitMemoryUpdate();
  }

  function beginHover(nodeId) {
    if (hoverSession?.nodeId === nodeId) return;

    flushHover();
    hoverSession = {
      nodeId,
      startedAt: Date.now()
    };
  }

  function flushHover() {
    if (!hoverSession) return;

    const state = store.getState();
    const nodeId = hoverSession.nodeId;
    const elapsed = Math.max(0, Date.now() - hoverSession.startedAt);
    const current = state.memory.hoverDwellMs[nodeId] || 0;

    patchMemory({
      hoverDwellMs: {
        ...state.memory.hoverDwellMs,
        [nodeId]: current + elapsed
      }
    }, "memory/hover-dwell");

    hoverSession = null;
  }

  function registerSelection(nodeId) {
    const state = store.getState();
    const now = Date.now();

    const currentVisits = state.memory.nodeVisits[nodeId] || 0;
    const uniqueOrder = state.memory.uniqueNodeOrder.includes(nodeId)
      ? state.memory.uniqueNodeOrder
      : [...state.memory.uniqueNodeOrder, nodeId];

    patchMemory({
      visitedNodeCount: uniqueOrder.length,
      lastSelectedNodeId: nodeId,
      lastSelectedAt: now,
      nodeVisits: {
        ...state.memory.nodeVisits,
        [nodeId]: currentVisits + 1
      },
      uniqueNodeOrder: uniqueOrder
    }, "memory/node-selected");

    rapidSelectionTrail = rapidSelectionTrail
      .filter((entry) => now - entry.at <= config.memory.rapidSelectionWindowMs)
      .concat([{ nodeId, at: now }]);

    const uniqueRecentNodes = [...new Set(rapidSelectionTrail.map((entry) => entry.nodeId))];

    if (uniqueRecentNodes.length >= config.memory.rapidSelectionUniqueThreshold) {
      bus.emit(EVENTS.SECRET_CONDITION_MET, {
        kind: "rapid-constellation",
        title: "Rapid constellation formed.",
        text: "You crossed multiple conceptual thresholds in a compressed span of time."
      });

      rapidSelectionTrail = [];
    }
  }

  function registerCoreTap() {
    const state = store.getState();
    const nextCount = state.memory.coreTapCount + 1;

    patchMemory({
      coreTapCount: nextCount
    }, "memory/core-tap");

    if (nextCount >= config.memory.coreTapSecretThreshold) {
      bus.emit(EVENTS.SECRET_CONDITION_MET, {
        kind: "core-echo",
        title: "Core echo unlocked.",
        text: "Repeated invocation of the core has destabilized the boundary of the field."
      });

      patchMemory({
        coreTapCount: 0
      }, "memory/core-tap-reset");
    }
  }

  function registerCommand() {
    const state = store.getState();

    patchMemory({
      commandCount: state.memory.commandCount + 1
    }, "memory/command-count");
  }

  function registerZoom(view) {
    const state = store.getState();
    if (view.zoom <= state.memory.maxZoomReached) return;

    patchMemory({
      maxZoomReached: view.zoom
    }, "memory/max-zoom");
  }

  function registerSecretReveal() {
    const state = store.getState();

    patchMemory({
      secretCount: state.memory.secretCount + 1
    }, "memory/secret-count");
  }

  function init() {
    restoreSnapshot();

    unsubscribe = store.subscribe((state, previousState) => {
      if (state.view.zoom !== previousState.view.zoom) {
        registerZoom(state.view);
      }
    });

    bus.on(EVENTS.NODE_HOVERED, ({ nodeId }) => {
      if (!nodeId) return;
      beginHover(nodeId);
    });

    bus.on(EVENTS.NODE_UNHOVERED, () => {
      flushHover();
    });

    bus.on(EVENTS.NODE_SELECTED, ({ nodeId }) => {
      if (!nodeId) return;
      registerSelection(nodeId);
    });

    bus.on(EVENTS.GESTURE_CORE_TAP, () => {
      registerCoreTap();
    });

    bus.on(EVENTS.COMMAND_EXECUTED, () => {
      registerCommand();
    });

    bus.on(EVENTS.SECRET_REVEALED, () => {
      registerSecretReveal();
    });
  }

  function destroy() {
    flushHover();
    unsubscribe?.();
    unsubscribe = null;
  }

  return Object.freeze({
    init,
    destroy
  });
}