import { APP_CONFIG } from "./core/config.js";
import { createEventBus, EVENTS } from "./core/event-bus.js";
import { createInitialState, createStateStore } from "./core/state-store.js";
import { detectFeatures, getPreferredRenderMode } from "./core/feature-detect.js";

import { createStage } from "./engine/stage.js";
import { createPostFxController } from "./engine/postfx.js";

import { createGestureController } from "./interaction/gestures.js";

import { createNeuralMap } from "./systems/neural-map.js";
import { createEmotionEngine } from "./systems/emotion-engine.js";
import { createMemoryEngine } from "./systems/memory-engine.js";
import { createRevealEngine } from "./systems/reveal-engine.js";
import { createEasterEggEngine } from "./systems/easter-eggs.js";
import { createFieldIntelligence } from "./systems/field-intelligence.js";
import { createNodeDynamics } from "./systems/node-dynamics.js";
import { createAmbientAudioEngine } from "./systems/ambient-audio.js";
import { createAdaptiveHintsEngine } from "./systems/adaptive-hints.js";
import { createPathwaysEngine } from "./systems/pathways-engine.js";
import { createConstellationEngine } from "./systems/constellation-engine.js";
import { createSymbolicWeatherEngine } from "./systems/symbolic-weather.js";
import { createTemporalPresenceEngine } from "./systems/temporal-presence.js";
import { createRitualEngine } from "./systems/ritual-engine.js";
import { createObserverEngine } from "./systems/observer-engine.js";
import { createMythEngine } from "./systems/myth-engine.js";
import { createGravityWellsEngine } from "./systems/gravity-wells.js";

import { createHudController } from "./ui/hud.js";
import { createLensController } from "./ui/lens.js";
import { createCommandPaletteController } from "./ui/command-palette.js";
import { createMinimapController } from "./ui/minimap.js";
import { createInsightFragmentsController } from "./ui/insight-fragments.js";
import { createFocusAuraController } from "./ui/focus-aura.js";
import { createOracleWhispersController } from "./ui/oracle-whispers.js";

import { GRAPH_SEED } from "./content/graph-data.js";

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function safeLocalStorageGet(key, fallbackValue) {
  try {
    const value = window.localStorage.getItem(key);
    return value === null ? fallbackValue : value;
  } catch (error) {
    return fallbackValue;
  }
}

function safeLocalStorageSet(key, value) {
  try {
    window.localStorage.setItem(key, value);
  } catch (error) {
    // ignore
  }
}

function getDomRefs() {
  return {
    body: document.body,
    root: document.getElementById("nexusRoot"),
    stage: document.getElementById("nexusStage"),
    stageWrap: document.getElementById("nexusStageWrap"),
    stageFallback: document.getElementById("nexusStageFallback"),
    atmosphere: document.getElementById("nexusAtmosphere"),

    interactionPlane: document.getElementById("interactionPlane"),
    nexusMap: document.getElementById("nexusMap"),
    nexusMapNodes: document.getElementById("nexusMapNodes"),
    nexusMapLabels: document.getElementById("nexusMapLabels"),
    nexusMapIntersections: document.getElementById("nexusMapIntersections"),

    core: document.getElementById("nexusCore"),
    coreSigil: document.getElementById("nexusCoreSigil"),

    hints: document.getElementById("nexusHints"),
    hintsText: document.getElementById("nexusHintsText"),

    init: document.getElementById("nexusInit"),
    initStatus: document.getElementById("nexusInitStatus"),

    lens: document.getElementById("nexusLens"),
    lensEyebrow: document.getElementById("lensEyebrow"),
    lensTitle: document.getElementById("lensTitle"),
    lensMeta: document.getElementById("lensMeta"),
    lensEssence: document.getElementById("lensEssence"),
    lensConnections: document.getElementById("lensConnections"),
    lensTensions: document.getElementById("lensTensions"),
    lensIntersections: document.getElementById("lensIntersections"),
    pinLensBtn: document.getElementById("pinLensBtn"),
    closeLensBtn: document.getElementById("closeLensBtn"),

    minimapBody: document.getElementById("nexusMinimapBody"),

    zoomChipValue: document.getElementById("zoomChipValue"),
    modeChipValue: document.getElementById("modeChipValue"),
    focusChipValue: document.getElementById("focusChipValue"),

    openCommandPaletteBtn: document.getElementById("openCommandPaletteBtn"),
    resetViewBtn: document.getElementById("resetViewBtn"),
    toggleHintsBtn: document.getElementById("toggleHintsBtn"),
    toggleAudioBtn: document.getElementById("toggleAudioBtn"),
    zoomInBtn: document.getElementById("zoomInBtn"),
    zoomOutBtn: document.getElementById("zoomOutBtn"),

    commandPalette: document.getElementById("nexusCommandPalette"),
    commandPaletteBackdrop: document.getElementById("commandPaletteBackdrop"),
    commandPaletteInput: document.getElementById("commandPaletteInput"),
    commandPaletteResults: document.getElementById("commandPaletteResults"),
    closeCommandPaletteBtn: document.getElementById("closeCommandPaletteBtn"),

    langButtons: Array.from(document.querySelectorAll(".lang-flag")),

    secretLayer: document.getElementById("nexusSecretLayer"),
    secretLayerTitle: document.getElementById("secretLayerTitle"),
    secretLayerText: document.getElementById("secretLayerText")
  };
}

class NexusApp {
  constructor({ config, bus, store, dom }) {
    this.config = config;
    this.bus = bus;
    this.store = store;
    this.dom = dom;

    this.stage = null;
    this.postFx = null;
    this.gestures = null;
    this.neuralMap = null;
    this.emotionEngine = null;
    this.memoryEngine = null;
    this.revealEngine = null;
    this.easterEggEngine = null;
    this.fieldIntelligence = null;
    this.nodeDynamics = null;
    this.audioEngine = null;
    this.adaptiveHints = null;
    this.pathwaysEngine = null;
    this.constellationEngine = null;
    this.insightFragments = null;
    this.symbolicWeather = null;
    this.temporalPresence = null;
    this.ritualEngine = null;
    this.focusAura = null;
    this.observerEngine = null;
    this.mythEngine = null;
    this.gravityWells = null;
    this.oracleWhispers = null;

    this.hud = createHudController({
      dom: this.dom,
      config: this.config
    });

    this.lensController = createLensController({
      dom: this.dom,
      store: this.store,
      bus: this.bus
    });

    this.commandPalette = createCommandPaletteController({
      dom: this.dom,
      onExecute: (commandId) => this.executeCommand(commandId)
    });

    this.minimap = createMinimapController({
      dom: this.dom,
      config: this.config,
      onNavigate: ({ x, y }) => {
        this.store.setState({
          view: { x, y }
        }, "minimap/navigate");

        this.bus.emit(EVENTS.VIEW_CHANGED, { ...this.store.getState().view });
      }
    });

    this.oracleWhispersController = createOracleWhispersController({
      dom: this.dom,
      bus: this.bus,
      config: this.config
    });

    this.commands = [];

    this.handleStoreChange = this.handleStoreChange.bind(this);
    this.handleKeydown = this.handleKeydown.bind(this);
    this.handleResize = this.handleResize.bind(this);
    this.handleCommandCloseRequest = this.handleCommandCloseRequest.bind(this);
  }

  async init() {
    this.bus.emit(EVENTS.APP_BEFORE_INIT, { at: Date.now() });

    this.restorePreferences();
    this.commands = this.buildCommands();

    this.store.subscribe(this.handleStoreChange, { fireImmediately: true });

    this.bindUiEvents();
    this.bindGlobalEvents();
    this.bindBusEvents();

    const features = await detectFeatures();
    const requestedMode = this.dom.body.dataset.renderMode || this.config.render.defaultMode;
    const resolvedRenderMode = getPreferredRenderMode(features, requestedMode);

    this.store.setState({
      app: {
        initialized: true,
        renderMode: resolvedRenderMode
      },
      features
    }, "app/init-features");

    this.bus.emit(EVENTS.FEATURES_READY, features);

    this.bootstrapSystems();
    this.commandPalette.setCommands(this.commands);
    this.updateInitStatus("Awakening the neural field...");

    window.setTimeout(() => {
      this.store.setState({
        app: {
          initComplete: true
        }
      }, "app/init-complete");

      this.bus.emit(EVENTS.INIT_COMPLETED, { at: Date.now() });
    }, this.config.ui.initHideDelayMs);

    this.bus.emit(EVENTS.APP_READY, {
      version: this.config.meta.version,
      mode: resolvedRenderMode
    });
  }

  bootstrapSystems() {
    this.commandPalette.init();
    this.minimap.init();
    this.oracleWhispersController.init();

    this.temporalPresence = createTemporalPresenceEngine({
      store: this.store,
      bus: this.bus,
      dom: this.dom,
      config: this.config
    });
    this.temporalPresence.init();

    this.stage = createStage({
      canvas: this.dom.stage,
      store: this.store,
      config: this.config
    });
    this.stage.init();

    this.postFx = createPostFxController({
      dom: this.dom,
      store: this.store,
      bus: this.bus
    });
    this.postFx.init();

    this.neuralMap = createNeuralMap({
      containers: {
        map: this.dom.nexusMap,
        nodes: this.dom.nexusMapNodes,
        labels: this.dom.nexusMapLabels,
        intersections: this.dom.nexusMapIntersections
      },
      store: this.store,
      bus: this.bus
    });
    this.neuralMap.init();

    this.gestures = createGestureController({
      plane: this.dom.interactionPlane,
      store: this.store,
      bus: this.bus,
      config: this.config
    });
    this.gestures.init();

    this.emotionEngine = createEmotionEngine({
      store: this.store,
      bus: this.bus,
      config: this.config
    });
    this.emotionEngine.init();

    this.memoryEngine = createMemoryEngine({
      store: this.store,
      bus: this.bus,
      config: this.config
    });
    this.memoryEngine.init();

    this.revealEngine = createRevealEngine({
      store: this.store,
      bus: this.bus,
      config: this.config,
      dom: this.dom
    });
    this.revealEngine.init();

    this.easterEggEngine = createEasterEggEngine({
      store: this.store,
      bus: this.bus,
      config: this.config,
      graphNodes: GRAPH_SEED.nodes
    });
    this.easterEggEngine.init();

    this.fieldIntelligence = createFieldIntelligence({
      store: this.store,
      bus: this.bus,
      dom: this.dom,
      config: this.config
    });
    this.fieldIntelligence.init();

    this.symbolicWeather = createSymbolicWeatherEngine({
      store: this.store,
      bus: this.bus,
      dom: this.dom,
      config: this.config
    });
    this.symbolicWeather.init();

    this.nodeDynamics = createNodeDynamics({
      store: this.store,
      neuralMap: this.neuralMap,
      plane: this.dom.interactionPlane
    });
    this.nodeDynamics.init();

    this.audioEngine = createAmbientAudioEngine({
      store: this.store,
      bus: this.bus,
      config: this.config
    });
    this.audioEngine.init();

    this.pathwaysEngine = createPathwaysEngine({
      store: this.store,
      bus: this.bus,
      config: this.config,
      graphNodes: GRAPH_SEED.nodes,
      graphEdges: GRAPH_SEED.edges
    });
    this.pathwaysEngine.init();

    this.constellationEngine = createConstellationEngine({
      bus: this.bus,
      neuralMap: this.neuralMap,
      mapContainer: this.dom.nexusMap,
      config: this.config
    });
    this.constellationEngine.init();

    this.adaptiveHints = createAdaptiveHintsEngine({
      store: this.store,
      bus: this.bus,
      config: this.config,
      neuralMap: this.neuralMap
    });
    this.adaptiveHints.init();

    this.insightFragments = createInsightFragmentsController({
      dom: this.dom,
      store: this.store,
      bus: this.bus,
      neuralMap: this.neuralMap,
      config: this.config
    });
    this.insightFragments.init();

    this.ritualEngine = createRitualEngine({
      store: this.store,
      bus: this.bus,
      config: this.config,
      neuralMap: this.neuralMap
    });
    this.ritualEngine.init();

    this.focusAura = createFocusAuraController({
      dom: this.dom,
      store: this.store,
      bus: this.bus,
      neuralMap: this.neuralMap,
      config: this.config
    });
    this.focusAura.init();

    this.observerEngine = createObserverEngine({
      store: this.store,
      bus: this.bus,
      config: this.config
    });
    this.observerEngine.init();

    this.mythEngine = createMythEngine({
      store: this.store,
      bus: this.bus,
      config: this.config,
      neuralMap: this.neuralMap
    });
    this.mythEngine.init();

    this.gravityWells = createGravityWellsEngine({
      bus: this.bus,
      neuralMap: this.neuralMap,
      mapContainer: this.dom.nexusMap,
      config: this.config,
      store: this.store
    });
    this.gravityWells.init();
  }

  restorePreferences() {
    const savedLanguage = safeLocalStorageGet(this.config.storage.languageKey, "en");
    const savedAudio = safeLocalStorageGet(this.config.storage.audioKey, "false") === "true";
    const savedHints = safeLocalStorageGet(this.config.storage.hintsKey, "true") === "true";
    const savedUiMode = safeLocalStorageGet(this.config.storage.uiModeKey, this.config.ui.defaultMode);

    this.store.setState({
      app: {
        currentLanguage: savedLanguage,
        uiMode: savedUiMode
      },
      ui: {
        audioActive: savedAudio,
        hintsVisible: savedHints
      }
    }, "app/restore-preferences");
  }

  buildCommands() {
    return this.config.commands.map((command) => ({ ...command }));
  }

  bindUiEvents() {
    this.dom.openCommandPaletteBtn?.addEventListener("click", () => this.openCommandPalette());
    this.dom.resetViewBtn?.addEventListener("click", () => this.resetView());
    this.dom.toggleHintsBtn?.addEventListener("click", () => this.toggleHints());
    this.dom.toggleAudioBtn?.addEventListener("click", () => this.toggleAudio());

    this.dom.zoomInBtn?.addEventListener("click", () => this.zoomBy(this.config.interaction.zoomStep));
    this.dom.zoomOutBtn?.addEventListener("click", () => this.zoomBy(-this.config.interaction.zoomStep));

    this.dom.pinLensBtn?.addEventListener("click", () => {
      const state = this.store.getState();
      this.store.setState({
        lens: {
          pinned: !state.lens.pinned
        }
      }, "lens/toggle-pin");
    });

    this.dom.closeLensBtn?.addEventListener("click", () => this.closeLens());

    this.dom.langButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const lang = button.dataset.lang;
        if (!lang) return;
        this.setLanguage(lang);
      });
    });
  }

  bindGlobalEvents() {
    window.addEventListener("keydown", this.handleKeydown);
    window.addEventListener("resize", this.handleResize, { passive: true });
    document.addEventListener("anx:command-palette-close-request", this.handleCommandCloseRequest);
  }

  bindBusEvents() {
    this.bus.on(EVENTS.NODE_HOVERED, (payload) => {
      const state = this.store.getState();
      if (state.interaction.dragging) return;
      this.openLens(payload, { preservePin: true });
    });

    this.bus.on(EVENTS.NODE_UNHOVERED, () => {
      const state = this.store.getState();
      if (!state.lens.pinned && !this.neuralMap?.getSelectedNodeId()) {
        this.closeLens(false);
      }
    });

    this.bus.on(EVENTS.NODE_SELECTED, (payload) => {
      this.openLens(payload, { preservePin: true });
      this.focusOnNode(payload.nodeId);
    });

    this.bus.on(EVENTS.NODE_DESELECTED, () => {
      const state = this.store.getState();
      if (!state.lens.pinned) {
        this.closeLens(false);
      }

      this.store.setState({
        ui: {
          focusLabel: "Field"
        }
      }, "node/deselected-focus-reset");
    });

    this.bus.on(EVENTS.GESTURE_CORE_TAP, () => {
      this.openCoreLens();
    });

    this.bus.on(EVENTS.GESTURE_DOUBLE_TAP, ({ clientX, clientY }) => {
      const state = this.store.getState();
      this.zoomTowardsPoint(state.view.zoom + this.config.interaction.zoomStep, clientX, clientY);
    });

    this.bus.on(EVENTS.GESTURE_DRAG_START, () => {
      this.store.setState({
        ui: {
          modeLabel: "Navigate",
          focusLabel: "Field"
        }
      }, "gesture/drag-start-ui");
    });

    this.bus.on(EVENTS.GESTURE_DRAG_END, () => {
      this.store.setState({
        ui: {
          modeLabel: "Explore"
        }
      }, "gesture/drag-end-ui");
    });
  }

  handleStoreChange(state, previousState, action) {
    this.syncBodyState(state);
    this.hud.sync(state);
    this.lensController.sync(state);
    this.commandPalette.sync(state);
    this.syncMapTransform(state);
    this.syncCoreState(state);
    this.minimap.sync(state);
    this.persistState(state);

    this.bus.emit(EVENTS.STATE_CHANGED, { state, previousState, action });
  }

  syncBodyState(state) {
    this.dom.body.dataset.renderMode = state.app.renderMode;
    this.dom.body.dataset.uiMode = state.app.uiMode;
    this.dom.body.dataset.mapMode = state.app.mapMode;
    this.dom.body.dataset.emotionState = state.app.emotionState;
    this.dom.body.dataset.weatherState = state.app.weatherState;
    this.dom.body.dataset.temporalPhase = state.app.temporalPhase;
    this.dom.body.dataset.observerProfile = state.app.observerProfile;
    this.dom.body.dataset.mythState = state.app.mythState;

    this.dom.body.classList.toggle("is-command-open", state.ui.commandOpen);
    this.dom.body.classList.toggle("is-lens-open", state.ui.lensOpen);
    this.dom.body.classList.toggle("is-secret-open", state.ui.secretOpen);
    this.dom.body.classList.toggle("is-init-complete", state.app.initComplete);
    this.dom.body.classList.toggle("is-hints-hidden", !state.ui.hintsVisible);
    this.dom.body.classList.toggle("is-audio-active", state.ui.audioActive);
    this.dom.body.classList.toggle("is-zoomed", Math.abs(state.view.zoom - 1) > 0.03);
    this.dom.body.classList.toggle("is-focus-deep", state.ui.focusLabel !== "Field");

    this.dom.body.style.setProperty("--nx-pointer-x", `${state.interaction.pointer.x}px`);
    this.dom.body.style.setProperty("--nx-pointer-y", `${state.interaction.pointer.y}px`);
    this.dom.body.style.setProperty("--nx-view-x", `${state.view.x}px`);
    this.dom.body.style.setProperty("--nx-view-y", `${state.view.y}px`);
    this.dom.body.style.setProperty("--nx-view-zoom", `${state.view.zoom}`);
  }

  syncMapTransform(state) {
    if (!this.dom.nexusMap) return;

    this.dom.nexusMap.style.transform = `translate3d(${state.view.x}px, ${state.view.y}px, 0) scale(${state.view.zoom})`;
  }

  syncCoreState(state) {
    if (!this.dom.core || !this.dom.interactionPlane) return;

    const rect = this.dom.interactionPlane.getBoundingClientRect();
    const dx = (state.interaction.pointer.x - rect.width * 0.5) / rect.width;
    const dy = (state.interaction.pointer.y - rect.height * 0.5) / rect.height;

    const offsetX = dx * 18;
    const offsetY = dy * 18;
    const scale = 1 + clamp(state.interaction.speed / 260, 0, 0.08);

    this.dom.core.style.transform = `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px)) scale(${scale})`;
  }

  persistState(state) {
    safeLocalStorageSet(this.config.storage.languageKey, state.app.currentLanguage);
    safeLocalStorageSet(this.config.storage.audioKey, String(state.ui.audioActive));
    safeLocalStorageSet(this.config.storage.hintsKey, String(state.ui.hintsVisible));
    safeLocalStorageSet(this.config.storage.uiModeKey, state.app.uiMode);
  }

  updateInitStatus(message) {
    if (this.dom.initStatus) {
      this.dom.initStatus.textContent = message;
    }
  }

  openCommandPalette() {
    this.store.setState({
      ui: {
        commandOpen: true,
        modeLabel: "Command"
      }
    }, "ui/open-command");

    this.commandPalette.render(this.commandPalette.getQuery());
    this.bus.emit(EVENTS.COMMAND_OPENED, { at: Date.now() });
  }

  closeCommandPalette() {
    this.store.setState((state) => ({
      ui: {
        commandOpen: false,
        modeLabel: state.interaction.dragging ? "Navigate" : "Explore"
      }
    }), "ui/close-command");

    this.bus.emit(EVENTS.COMMAND_CLOSED, { at: Date.now() });
  }

  executeCommand(commandId) {
    const commandMap = {
      "reset-view": () => this.resetView(),
      "toggle-hints": () => this.toggleHints(),
      "toggle-audio": () => this.toggleAudio(),
      "open-core-lens": () => this.openCoreLens(),
      "reveal-threshold": () => {
        this.bus.emit(EVENTS.SECRET_CONDITION_MET, {
          kind: "manual-threshold",
          title: "Manual threshold invoked.",
          text: "The field opened because you explicitly asked it to do so."
        });
      },
      "language-en": () => this.setLanguage("en"),
      "language-pt": () => this.setLanguage("pt"),
      "language-fr": () => this.setLanguage("fr"),
      "toggle-ui-mode": () => this.toggleUiMode()
    };

    commandMap[commandId]?.();

    if (typeof window.trackCommandUsed === "function") {
      window.trackCommandUsed(commandId);
    }

    this.bus.emit(EVENTS.COMMAND_EXECUTED, {
      commandId,
      at: Date.now()
    });

    this.closeCommandPalette();
  }

  setLanguage(language) {
    this.store.setState({
      app: {
        currentLanguage: language
      }
    }, "app/set-language");

    if (typeof window.trackLanguageChange === "function") {
      window.trackLanguageChange(language);
    }

    this.bus.emit(EVENTS.LANGUAGE_CHANGED, { language });
  }

  toggleHints() {
    const current = this.store.getState().ui.hintsVisible;

    this.store.setState({
      ui: {
        hintsVisible: !current
      }
    }, "ui/toggle-hints");

    this.bus.emit(EVENTS.HINTS_TOGGLED, { visible: !current });
  }

  toggleAudio() {
    const current = this.store.getState().ui.audioActive;

    this.store.setState({
      ui: {
        audioActive: !current
      }
    }, "ui/toggle-audio");

    this.bus.emit(EVENTS.AUDIO_TOGGLED, { active: !current });
  }

  toggleUiMode() {
    const current = this.store.getState().app.uiMode;
    const nextMode = current === "immersive" ? "minimal" : "immersive";

    this.store.setState({
      app: {
        uiMode: nextMode
      }
    }, "app/toggle-ui-mode");
  }

  resetView() {
    this.neuralMap?.clearSelection();

    this.store.setState({
      view: {
        x: 0,
        y: 0,
        zoom: this.config.interaction.defaultZoom
      },
      ui: {
        modeLabel: "Explore",
        focusLabel: "Field"
      }
    }, "view/reset");

    this.bus.emit(EVENTS.VIEW_CHANGED, { x: 0, y: 0, zoom: 1 });
  }

  zoomBy(amount) {
    const state = this.store.getState();
    const nextZoom = clamp(
      state.view.zoom + amount,
      state.view.minZoom,
      state.view.maxZoom
    );

    this.store.setState({
      view: {
        zoom: nextZoom
      }
    }, "view/zoom-by");

    if (typeof window.trackMapZoom === "function") {
      window.trackMapZoom(nextZoom);
    }

    this.bus.emit(EVENTS.VIEW_CHANGED, { ...this.store.getState().view });
  }

  zoomTowardsPoint(nextZoom, clientX, clientY) {
    const rect = this.dom.interactionPlane.getBoundingClientRect();
    const state = this.store.getState();

    const clampedZoom = clamp(nextZoom, state.view.minZoom, state.view.maxZoom);
    const zoomFactor = clampedZoom / state.view.zoom;

    const offsetX = clientX - rect.left - rect.width / 2 - state.view.x;
    const offsetY = clientY - rect.top - rect.height / 2 - state.view.y;

    this.store.setState({
      view: {
        zoom: clampedZoom,
        x: state.view.x - offsetX * (zoomFactor - 1),
        y: state.view.y - offsetY * (zoomFactor - 1)
      }
    }, "view/zoom-towards");

    if (typeof window.trackMapZoom === "function") {
      window.trackMapZoom(clampedZoom);
    }

    this.bus.emit(EVENTS.VIEW_CHANGED, { ...this.store.getState().view });
  }

  focusOnNode(nodeId) {
    if (!nodeId) return;

    this.store.setState({
      ui: {
        focusLabel: "Node"
      }
    }, "node/focus-label");
  }

  openLens(payload, options = {}) {
    this.lensController.open(payload, options);
  }

  closeLens(clearSelection = true) {
    const state = this.store.getState();
    if (state.lens.pinned) return;

    if (clearSelection) {
      this.neuralMap?.clearSelection();
    }

    this.lensController.close({ respectPin: true });
  }

  openCoreLens() {
    this.openLens({
      nodeId: "core",
      eyebrow: "CORE",
      title: "Aethereal Field Core",
      meta: "Primary attractor · central resonance",
      essence:
        "The core is not a destination but a stabilizer. It gathers drift, tension and wandering attention into a point of meaningful coherence.",
      connections: [
        "Resonance field",
        "Entropy gradients",
        "Attention memory",
        "Latent intersections"
      ],
      tensions: [
        "Structure vs. drift",
        "Meaning vs. dispersion"
      ],
      intersections: [
        "signal",
        "presence",
        "memory",
        "threshold"
      ]
    }, { preservePin: true });

    this.neuralMap?.focusNodeById("core");
  }

  handleKeydown(event) {
    const key = event.key.toLowerCase();

    if (key === "/" && !this.store.getState().ui.commandOpen) {
      event.preventDefault();
      this.openCommandPalette();
      return;
    }

    if (key === "escape") {
      event.preventDefault();

      if (this.store.getState().ui.commandOpen) {
        this.closeCommandPalette();
        return;
      }

      if (this.store.getState().ui.lensOpen && !this.store.getState().lens.pinned) {
        this.closeLens();
        return;
      }

      if (this.store.getState().ui.secretOpen) {
        this.store.setState({
          ui: {
            secretOpen: false,
            modeLabel: "Explore"
          }
        }, "secret/close-escape");
      }

      return;
    }

    if (key === "0") {
      event.preventDefault();
      this.resetView();
      return;
    }

    if (key === "=" || key === "+") {
      event.preventDefault();
      this.zoomBy(this.config.interaction.zoomStep);
      return;
    }

    if (key === "-") {
      event.preventDefault();
      this.zoomBy(-this.config.interaction.zoomStep);
      return;
    }

    if (key === "h") {
      event.preventDefault();
      this.toggleHints();
      return;
    }

    if (key === "m") {
      event.preventDefault();
      this.toggleUiMode();
      return;
    }

    if (key === "i") {
      event.preventDefault();
      this.openCoreLens();
      return;
    }

    const panStep = 22;
    const state = this.store.getState();

    if (key === "arrowup") {
      this.store.setState({ view: { y: state.view.y + panStep } }, "view/pan-up");
      this.bus.emit(EVENTS.VIEW_CHANGED, { ...this.store.getState().view });
    } else if (key === "arrowdown") {
      this.store.setState({ view: { y: state.view.y - panStep } }, "view/pan-down");
      this.bus.emit(EVENTS.VIEW_CHANGED, { ...this.store.getState().view });
    } else if (key === "arrowleft") {
      this.store.setState({ view: { x: state.view.x + panStep } }, "view/pan-left");
      this.bus.emit(EVENTS.VIEW_CHANGED, { ...this.store.getState().view });
    } else if (key === "arrowright") {
      this.store.setState({ view: { x: state.view.x - panStep } }, "view/pan-right");
      this.bus.emit(EVENTS.VIEW_CHANGED, { ...this.store.getState().view });
    }
  }

  handleResize() {
    const state = this.store.getState();

    if (
      Math.abs(state.view.zoom - 1) < 0.001 &&
      Math.abs(state.view.x) < 0.001 &&
      Math.abs(state.view.y) < 0.001
    ) {
      return;
    }

    this.store.setState({
      ui: {
        modeLabel: state.ui.commandOpen ? "Command" : "Explore"
      }
    }, "window/resize");
  }

  handleCommandCloseRequest() {
    this.closeCommandPalette();
  }
}

const dom = getDomRefs();

if (!dom.root) {
  throw new Error("[Aethereal Nexus] Root element '#nexusRoot' was not found.");
}

const bus = createEventBus();
const store = createStateStore(createInitialState(APP_CONFIG));
const app = new NexusApp({
  config: APP_CONFIG,
  bus,
  store,
  dom
});

app.init();