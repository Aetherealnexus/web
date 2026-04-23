export const GRAPH_SEED = Object.freeze({
  nodes: [
    {
      id: "core",
      label: "Aethereal Core",
      type: "anchor",
      tone: "cyan",
      x: 0,
      y: 0,
      scale: 1.3,
      eyebrow: "CORE",
      meta: "Primary attractor · central resonance",
      essence:
        "The core is the stabilizing heart of the field. It does not contain all meaning, but it shapes how meaning coheres around attention.",
      connections: ["Signal", "Memory", "Entropy", "Threshold"],
      tensions: ["Stillness vs. movement", "Order vs. emergence"],
      intersections: ["presence", "coherence", "attractor"]
    },
    {
      id: "entropy",
      label: "Entropy",
      type: "gateway",
      tone: "violet",
      x: -420,
      y: -90,
      scale: 1.04,
      eyebrow: "FIELD FORCE",
      meta: "Dispersion · instability · variation",
      essence:
        "Entropy is not mere decay. It is the pressure by which the field prevents false finality and keeps the universe of ideas open to transformation.",
      connections: ["Emergence", "Pattern", "Time"],
      tensions: ["Noise vs. signal", "Dispersion vs. coherence"],
      intersections: ["drift", "variation", "pressure"]
    },
    {
      id: "meaning",
      label: "Meaning",
      type: "gateway",
      tone: "gold",
      x: 420,
      y: -60,
      scale: 1.06,
      eyebrow: "VALUE CLUSTER",
      meta: "Orientation · coherence · significance",
      essence:
        "Meaning is the local compression of significance. It appears where relation, memory and consequence gather into direction.",
      connections: ["Language", "Ethics", "Memory"],
      tensions: ["Meaning vs. projection", "Purpose vs. illusion"],
      intersections: ["value", "orientation", "sense-making"]
    },
    {
      id: "consciousness",
      label: "Consciousness",
      type: "gateway",
      tone: "cyan",
      x: -220,
      y: -320,
      scale: 1.08,
      eyebrow: "OBSERVER CLUSTER",
      meta: "Awareness · interiority · witness",
      essence:
        "Consciousness is the living aperture through which reality becomes present, felt and reportable from within.",
      connections: ["Perception", "Time", "Meaning"],
      tensions: ["Subjective immediacy vs. explanatory reduction"],
      intersections: ["qualia", "awareness", "attention"]
    },
    {
      id: "language",
      label: "Language",
      type: "gateway",
      tone: "blue",
      x: 250,
      y: -300,
      scale: 1,
      eyebrow: "SYMBOLIC LAYER",
      meta: "Naming · structure · representation",
      essence:
        "Language is the symbolic infrastructure by which the field can be partitioned, described, negotiated and transmitted.",
      connections: ["Meaning", "Symbol", "Memory"],
      tensions: ["Precision vs. distortion", "Naming vs. reality"],
      intersections: ["logic", "representation", "speech"]
    },
    {
      id: "emergence",
      label: "Emergence",
      type: "gateway",
      tone: "violet",
      x: -560,
      y: 180,
      scale: 0.98,
      eyebrow: "SYSTEMIC LAYER",
      meta: "Novelty · collective behavior · pattern birth",
      essence:
        "Emergence marks the birth of higher-order form from local interactions. It is how the field surprises itself.",
      connections: ["Entropy", "Pattern", "Cybernetics"],
      tensions: ["Bottom-up novelty vs. top-down control"],
      intersections: ["complexity", "self-organization", "novelty"]
    },
    {
      id: "memory",
      label: "Memory",
      type: "gateway",
      tone: "cyan",
      x: 320,
      y: 250,
      scale: 1.02,
      eyebrow: "TEMPORAL RESERVOIR",
      meta: "Retention · trace · recurrence",
      essence:
        "Memory is the residue of passage. It allows the field to resist total reset and gives continuity to significance.",
      connections: ["Meaning", "Signal", "Time"],
      tensions: ["Retention vs. revision", "Identity vs. mutation"],
      intersections: ["trace", "recall", "continuity"]
    },
    {
      id: "signal",
      label: "Signal",
      type: "idea",
      tone: "blue",
      x: 130,
      y: 110,
      scale: 0.9,
      eyebrow: "INFORMATIVE FORCE",
      meta: "Discrimination · salience · transfer",
      essence:
        "A signal is a difference that survives noise long enough to matter.",
      connections: ["Pattern", "Memory", "Cybernetics"],
      tensions: ["Signal vs. static"],
      intersections: ["salience", "transmission", "difference"]
    },
    {
      id: "pattern",
      label: "Pattern",
      type: "idea",
      tone: "violet",
      x: -170,
      y: 220,
      scale: 0.9,
      eyebrow: "FORMAL CLUSTER",
      meta: "Recurrence · symmetry · recognizability",
      essence:
        "Pattern is the repetition that invites compression. It is how structure becomes discoverable.",
      connections: ["Emergence", "Signal", "Meaning"],
      tensions: ["Pattern vs. randomness"],
      intersections: ["symmetry", "motif", "regularity"]
    },
    {
      id: "symbol",
      label: "Symbol",
      type: "idea",
      tone: "gold",
      x: 520,
      y: -240,
      scale: 0.92,
      eyebrow: "SEMANTIC NODE",
      meta: "Condensation · metaphor · cultural transfer",
      essence:
        "Symbols compress worlds into forms. They are not mere decorations; they are carriers of layered intelligibility.",
      connections: ["Language", "Meaning", "Ritual"],
      tensions: ["Literal clarity vs. symbolic depth"],
      intersections: ["metaphor", "condensation", "mythic transport"]
    },
    {
      id: "perception",
      label: "Perception",
      type: "idea",
      tone: "cyan",
      x: -80,
      y: -470,
      scale: 0.92,
      eyebrow: "SENSORY APERTURE",
      meta: "Selection · filtering · world contact",
      essence:
        "Perception is the shaped contact with reality, never purely passive and never fully complete.",
      connections: ["Consciousness", "Signal", "Matter"],
      tensions: ["Direct realism vs. constructed interpretation"],
      intersections: ["filtering", "contact", "sensation"]
    },
    {
      id: "time",
      label: "Time",
      type: "idea",
      tone: "blue",
      x: -360,
      y: -360,
      scale: 0.94,
      eyebrow: "TEMPORAL AXIS",
      meta: "Passage · sequence · irreversible transformation",
      essence:
        "Time is the condition that turns potential relation into lived unfolding.",
      connections: ["Memory", "Consciousness", "Entropy"],
      tensions: ["Flow vs. measurement"],
      intersections: ["sequence", "duration", "irreversibility"]
    },
    {
      id: "ethics",
      label: "Ethics",
      type: "gateway",
      tone: "gold",
      x: 580,
      y: 150,
      scale: 0.98,
      eyebrow: "VALUATION LAYER",
      meta: "Care · consequence · constraint",
      essence:
        "Ethics enters wherever intelligence can affect vulnerability. It is the structure of consequence under conditions of power.",
      connections: ["Meaning", "Intelligence", "Ritual"],
      tensions: ["Power vs. care", "Efficiency vs. dignity"],
      intersections: ["responsibility", "harm", "goodness"]
    },
    {
      id: "intelligence",
      label: "Intelligence",
      type: "gateway",
      tone: "blue",
      x: 700,
      y: -40,
      scale: 1,
      eyebrow: "ADAPTIVE CLUSTER",
      meta: "Inference · adaptation · compression",
      essence:
        "Intelligence is the capacity to model, select and transform under pressure.",
      connections: ["Signal", "Cybernetics", "Ethics"],
      tensions: ["Optimization vs. wisdom"],
      intersections: ["inference", "adaptation", "strategy"]
    },
    {
      id: "cybernetics",
      label: "Cybernetics",
      type: "idea",
      tone: "blue",
      x: 180,
      y: 430,
      scale: 0.9,
      eyebrow: "FEEDBACK LAYER",
      meta: "Control · recursion · adaptation",
      essence:
        "Cybernetics studies how systems remain coherent through feedback, error and correction.",
      connections: ["Emergence", "Signal", "Intelligence"],
      tensions: ["Control vs. runaway complexity"],
      intersections: ["feedback", "recursion", "regulation"]
    },
    {
      id: "ritual",
      label: "Ritual",
      type: "idea",
      tone: "gold",
      x: 730,
      y: 340,
      scale: 0.88,
      eyebrow: "THRESHOLD FORM",
      meta: "Repetition · entry · transformation",
      essence:
        "Ritual is structured passage. It turns behavior into threshold and expectation into charged transition.",
      connections: ["Symbol", "Ethics", "Threshold"],
      tensions: ["Depth vs. empty performance"],
      intersections: ["gesture", "consecration", "threshold"]
    },
    {
      id: "matter",
      label: "Matter",
      type: "idea",
      tone: "cyan",
      x: -650,
      y: -260,
      scale: 0.9,
      eyebrow: "ONTIC SUBSTRATE",
      meta: "Embodiment · structure · resistance",
      essence:
        "Matter is the stubbornness of the real, the resistance that keeps concepts from floating free of consequence.",
      connections: ["Perception", "Entropy", "Becoming"],
      tensions: ["Form vs. inertia"],
      intersections: ["resistance", "substrate", "embodiment"]
    },
    {
      id: "becoming",
      label: "Becoming",
      type: "idea",
      tone: "violet",
      x: -320,
      y: 470,
      scale: 0.92,
      eyebrow: "TRANSFORMATION NODE",
      meta: "Process · mutation · unfinishedness",
      essence:
        "Becoming is the refusal of closure. It names the fact that reality is often more verb than noun.",
      connections: ["Emergence", "Time", "Meaning"],
      tensions: ["Identity vs. transformation"],
      intersections: ["process", "transition", "mutation"]
    },
    {
      id: "threshold",
      label: "Threshold",
      type: "tension",
      tone: "gold",
      x: 880,
      y: 60,
      scale: 0.82,
      eyebrow: "HIDDEN TENSION",
      meta: "Entry · crossing · revelation",
      essence:
        "Thresholds are not places; they are charged transitions where one mode of being gives way to another.",
      connections: ["Ritual", "Core", "Meaning"],
      tensions: ["Known vs. unknown"],
      intersections: ["crossing", "reveal", "edge"]
    }
  ],

  edges: [
    { id: "e-core-signal", source: "core", target: "signal", type: "resonance", weight: 1 },
    { id: "e-core-memory", source: "core", target: "memory", type: "resonance", weight: 0.9 },
    { id: "e-core-entropy", source: "core", target: "entropy", type: "resonance", weight: 0.9 },
    { id: "e-core-meaning", source: "core", target: "meaning", type: "resonance", weight: 0.95 },
    { id: "e-core-consciousness", source: "core", target: "consciousness", type: "bridge", weight: 0.72 },
    { id: "e-core-language", source: "core", target: "language", type: "bridge", weight: 0.72 },

    { id: "e-entropy-emergence", source: "entropy", target: "emergence", type: "resonance", weight: 0.86 },
    { id: "e-entropy-time", source: "entropy", target: "time", type: "tension", weight: 0.8 },
    { id: "e-entropy-pattern", source: "entropy", target: "pattern", type: "bridge", weight: 0.68 },

    { id: "e-meaning-language", source: "meaning", target: "language", type: "resonance", weight: 0.82 },
    { id: "e-meaning-memory", source: "meaning", target: "memory", type: "resonance", weight: 0.84 },
    { id: "e-meaning-ethics", source: "meaning", target: "ethics", type: "bridge", weight: 0.78 },

    { id: "e-consciousness-perception", source: "consciousness", target: "perception", type: "resonance", weight: 0.82 },
    { id: "e-consciousness-time", source: "consciousness", target: "time", type: "bridge", weight: 0.68 },

    { id: "e-language-symbol", source: "language", target: "symbol", type: "resonance", weight: 0.88 },
    { id: "e-symbol-ritual", source: "symbol", target: "ritual", type: "bridge", weight: 0.76 },
    { id: "e-ritual-threshold", source: "ritual", target: "threshold", type: "resonance", weight: 0.8 },

    { id: "e-signal-cybernetics", source: "signal", target: "cybernetics", type: "bridge", weight: 0.78 },
    { id: "e-signal-intelligence", source: "signal", target: "intelligence", type: "bridge", weight: 0.8 },
    { id: "e-intelligence-ethics", source: "intelligence", target: "ethics", type: "tension", weight: 0.86 },

    { id: "e-pattern-emergence", source: "pattern", target: "emergence", type: "resonance", weight: 0.82 },
    { id: "e-pattern-becoming", source: "pattern", target: "becoming", type: "bridge", weight: 0.72 },

    { id: "e-memory-time", source: "memory", target: "time", type: "resonance", weight: 0.86 },
    { id: "e-becoming-time", source: "becoming", target: "time", type: "tension", weight: 0.76 },
    { id: "e-matter-perception", source: "matter", target: "perception", type: "bridge", weight: 0.78 },

    { id: "e-cybernetics-intelligence", source: "cybernetics", target: "intelligence", type: "resonance", weight: 0.82 },
    { id: "e-threshold-meaning", source: "threshold", target: "meaning", type: "bridge", weight: 0.64 }
  ]
});