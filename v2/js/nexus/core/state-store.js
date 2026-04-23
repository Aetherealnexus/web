function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function cloneValue(value) {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value));
}

function deepMerge(target, source) {
  if (!isPlainObject(target) || !isPlainObject(source)) {
    return cloneValue(source);
  }

  const output = { ...target };

  for (const [key, value] of Object.entries(source)) {
    if (Array.isArray(value)) {
      output[key] = [...value];
      continue;
    }

    if (isPlainObject(value)) {
      output[key] = deepMerge(isPlainObject(output[key]) ? output[key] : {}, value);
      continue;
    }

    output[key] = value;
  }

  return output;
}

export function createInitialState(config) {
  return {
    app: {
      initialized: false,
      initComplete: false,
      renderMode: config.render.defaultMode,
      uiMode: config.ui.defaultMode,
      mapMode: config.ui.mapMode,
      currentLanguage: "en",
      emotionState: "explore",
      weatherState: "lucid",
      temporalPhase: "day",
      observerProfile: "wanderer",
      mythState: "first-awakening"
    },

    ui: {
      commandOpen: false,
      lensOpen: false,
      hintsVisible: true,
      audioActive: false,
      secretOpen: false,
      modeLabel: "Explore",
      focusLabel: "Field",
      dynamicHint: config.ui.hintMessage
    },

    view: {
      x: 0,
      y: 0,
      zoom: config.interaction.defaultZoom,
      minZoom: config.interaction.minZoom,
      maxZoom: config.interaction.maxZoom
    },

    interaction: {
      pointer: {
        x: 0,
        y: 0,
        nx: 0.5,
        ny: 0.5
      },
      active: false,
      dragging: false,
      speed: 0,
      dwellMs: 0,
      pressure: 0,
      pointerCount: 0,
      pinchDistance: 0,
      lastTapAt: 0
    },

    lens: {
      pinned: false,
      eyebrow: "NODE",
      title: "No active focus",
      meta: "Awaiting resonance",
      essence: "Focus an idea, concept, symbol or intersection to reveal its local meaning.",
      connections: ["No active connections"],
      tensions: ["No active tensions"],
      intersections: []
    },

    memory: {
      visitedNodeCount: 0,
      lastSelectedNodeId: null,
      lastSelectedAt: 0,
      maxZoomReached: config.interaction.defaultZoom,
      secretCount: 0,
      coreTapCount: 0,
      commandCount: 0,
      ritualCount: 0,
      nodeVisits: {},
      hoverDwellMs: {},
      uniqueNodeOrder: []
    },

    features: {
      webgpu: false,
      webgl: false,
      offscreenCanvas: false,
      pointerEvents: false,
      viewTransitions: false,
      navigationApi: false,
      touch: false,
      audio: false,
      deviceMemory: null,
      hardwareConcurrency: null,
      reducedMotion: false,
      qualityTier: "standard"
    },

    session: {
      startedAt: Date.now(),
      lastInteractionAt: Date.now(),
      interactionCount: 0
    }
  };
}

export function createStateStore(initialState) {
  let state = cloneValue(initialState);
  const listeners = new Set();

  function getState() {
    return state;
  }

  function setState(nextStateOrUpdater, action = "anonymous") {
    const previousState = state;
    const nextValue =
      typeof nextStateOrUpdater === "function"
        ? nextStateOrUpdater(cloneValue(previousState))
        : nextStateOrUpdater;

    if (!isPlainObject(nextValue)) {
      throw new Error(`[StateStore] setState expected an object for action "${action}".`);
    }

    state = deepMerge(previousState, nextValue);

    for (const listener of listeners) {
      try {
        listener(state, previousState, action);
      } catch (error) {
        console.error(`[StateStore] Listener failed for action "${action}"`, error);
      }
    }

    return state;
  }

  function subscribe(listener, { fireImmediately = false } = {}) {
    listeners.add(listener);

    if (fireImmediately) {
      listener(state, state, "initial");
    }

    return () => {
      listeners.delete(listener);
    };
  }

  return Object.freeze({
    getState,
    setState,
    subscribe
  });
}