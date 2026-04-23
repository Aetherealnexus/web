export const APP_CONFIG = Object.freeze({
  meta: {
    appName: "Aethereal Nexus",
    version: "3.6.0-alpha",
    author: "Bruno Cerqueira"
  },

  render: {
    defaultMode: "auto",
    supportedModes: ["auto", "webgpu", "webgl", "fallback"],
    pixelRatioCap: 1.75,
    fallbackParticleCount: 140,
    connectionDistance: 120,
    baseParticleSpeed: 0.12,
    backgroundFadeAlpha: 0.12
  },

  ui: {
    defaultMode: "immersive",
    mapMode: "neural",
    initHideDelayMs: 900,
    hintMessage: "Move slowly. Pause. Trace. Zoom. Let the field answer.",
    deepFocusHint: "Stillness sharpens the field.",
    secretRevealText: "The field recognized a rare sequence of interaction."
  },

  interaction: {
    minZoom: 0.55,
    maxZoom: 3.2,
    defaultZoom: 1,
    zoomStep: 0.16,
    wheelZoomIntensity: 0.00125,
    dragActivationDistance: 5,
    longPressMs: 650,
    doubleTapMs: 260,
    pointerTrailSmoothing: 0.16,
    speedSmoothing: 0.14,
    pinchSmoothing: 0.18,
    coreFocusRadius: 120,
    hoverIntentRadius: 150
  },

  emotion: {
    tickMs: 360,
    idleAfterMs: 6500,
    dormantAfterMs: 14000
  },

  field: {
    signatureMinDelta: 0.03,
    emitMaxSilenceMs: 1200
  },

  hints: {
    temporaryMs: 4600,
    celebrateMs: 5200
  },

  pathways: {
    emitCooldownMs: 1400,
    suggestionNeighborCount: 2,
    depthZoomThreshold: 1.95
  },

  constellations: {
    durationMs: 3400
  },

  fragments: {
    maxActive: 6,
    ttlMs: 3800
  },

  ritual: {
    attunementMs: 5200,
    invocationWindowMs: 18000,
    thresholdWindowMs: 12000,
    progressHintMs: 4200
  },

  temporal: {
    tickMs: 60000
  },

  symbolicWeather: {
    tickMs: 900,
    minChangeGapMs: 1200
  },

  focusAura: {
    baseSize: 132,
    tickMs: 0
  },

  observer: {
    tickMs: 900
  },

  myth: {
    whisperCooldownMs: 5200
  },

  gravityWells: {
    defaultDurationMs: 3200,
    maxActive: 8
  },

  whispers: {
    ttlMs: 4200,
    queueMax: 8
  },

  memory: {
    coreTapSecretThreshold: 3,
    rapidSelectionWindowMs: 8500,
    rapidSelectionUniqueThreshold: 4
  },

  reveal: {
    defaultDurationMs: 2400,
    cooldownMs: 280,
    maxQueueSize: 6
  },

  minimap: {
    worldSpan: 2200
  },

  easterEggs: {
    sequenceMaxGapMs: 5200,
    sequenceOverallWindowMs: 26000,
    triuneWindowMs: 22000,
    deepZoomThreshold: 2.2,
    silentCartographerVisitedThreshold: 5,
    silentCartographerZoomThreshold: 1.4
  },

  audio: {
    masterBaseGain: 0.032,
    droneBaseA: 48,
    droneBaseB: 84,
    shimmerBase: 176,
    noiseFilterBase: 820,
    responseTime: 0.28
  },

  storage: {
    languageKey: "anx.language",
    audioKey: "anx.audioActive",
    hintsKey: "anx.hintsVisible",
    uiModeKey: "anx.uiMode",
    memoryKey: "anx.memorySnapshot"
  },

  languages: [
    { id: "en", label: "English" },
    { id: "pt", label: "Português" },
    { id: "fr", label: "Français" }
  ],

  commands: [
    {
      id: "reset-view",
      label: "Reset View",
      meta: "Action",
      keywords: ["reset", "view", "camera", "center", "origin"]
    },
    {
      id: "toggle-hints",
      label: "Toggle Hints",
      meta: "Interface",
      keywords: ["hints", "guide", "help", "tips"]
    },
    {
      id: "toggle-audio",
      label: "Toggle Audio",
      meta: "Interface",
      keywords: ["audio", "sound", "ambient", "music"]
    },
    {
      id: "open-core-lens",
      label: "Inspect Core",
      meta: "Focus",
      keywords: ["core", "lens", "focus", "field", "insight"]
    },
    {
      id: "reveal-threshold",
      label: "Reveal Threshold",
      meta: "Secret",
      keywords: ["secret", "threshold", "ritual", "reveal"]
    },
    {
      id: "language-en",
      label: "Switch Language: English",
      meta: "Language",
      keywords: ["english", "language", "en"]
    },
    {
      id: "language-pt",
      label: "Switch Language: Português",
      meta: "Language",
      keywords: ["portuguese", "português", "language", "pt"]
    },
    {
      id: "language-fr",
      label: "Switch Language: Français",
      meta: "Language",
      keywords: ["french", "français", "language", "fr"]
    },
    {
      id: "toggle-ui-mode",
      label: "Toggle UI Density",
      meta: "Interface",
      keywords: ["ui", "minimal", "immersive", "density"]
    }
  ]
});