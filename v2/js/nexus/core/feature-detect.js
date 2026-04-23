async function detectWebGPU() {
  if (!("gpu" in navigator) || !window.isSecureContext) {
    return false;
  }

  try {
    const adapter = await navigator.gpu.requestAdapter();
    return Boolean(adapter);
  } catch (error) {
    return false;
  }
}

function detectWebGL() {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(
      canvas.getContext("webgl2") ||
      canvas.getContext("webgl") ||
      canvas.getContext("experimental-webgl")
    );
  } catch (error) {
    return false;
  }
}

function detectViewTransitions() {
  return typeof document !== "undefined" && "startViewTransition" in document;
}

function detectNavigationApi() {
  return typeof window !== "undefined" && "navigation" in window;
}

function detectOffscreenCanvas() {
  return typeof window !== "undefined" && "OffscreenCanvas" in window;
}

function detectPointerEvents() {
  return typeof window !== "undefined" && "PointerEvent" in window;
}

function detectTouch() {
  return (
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0 ||
    navigator.msMaxTouchPoints > 0
  );
}

function detectReducedMotion() {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
}

function detectQualityTier(deviceMemory, hardwareConcurrency) {
  const memory = Number(deviceMemory || 0);
  const cores = Number(hardwareConcurrency || 0);

  if (memory >= 8 && cores >= 8) {
    return "high";
  }

  if (memory > 0 && memory <= 2) {
    return "low";
  }

  if (cores > 0 && cores <= 2) {
    return "low";
  }

  return "standard";
}

export async function detectFeatures() {
  const [
    webgpu
  ] = await Promise.all([
    detectWebGPU()
  ]);

  const webgl = detectWebGL();
  const offscreenCanvas = detectOffscreenCanvas();
  const pointerEvents = detectPointerEvents();
  const touch = detectTouch();
  const viewTransitions = detectViewTransitions();
  const navigationApi = detectNavigationApi();
  const reducedMotion = detectReducedMotion();
  const audio = typeof window !== "undefined" && ("AudioContext" in window || "webkitAudioContext" in window);

  const deviceMemory = navigator.deviceMemory ?? null;
  const hardwareConcurrency = navigator.hardwareConcurrency ?? null;
  const qualityTier = detectQualityTier(deviceMemory, hardwareConcurrency);

  return {
    webgpu,
    webgl,
    offscreenCanvas,
    pointerEvents,
    viewTransitions,
    navigationApi,
    touch,
    audio,
    deviceMemory,
    hardwareConcurrency,
    reducedMotion,
    qualityTier
  };
}

export function getPreferredRenderMode(features, requestedMode = "auto") {
  if (requestedMode && requestedMode !== "auto") {
    return requestedMode;
  }

  if (features.webgpu) {
    return "webgpu";
  }

  if (features.webgl) {
    return "webgl";
  }

  return "fallback";
}