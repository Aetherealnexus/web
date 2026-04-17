export function createPerfController() {
  const url = new URL(window.location.href);
  const forcedMode = url.searchParams.get("perf");
  const storedMode = localStorage.getItem("aen_perf_mode");

  const weakDeviceHint =
    (typeof navigator.deviceMemory === "number" && navigator.deviceMemory <= 4) ||
    (typeof navigator.hardwareConcurrency === "number" && navigator.hardwareConcurrency <= 4) ||
    navigator.connection?.saveData === true;

  let optimized =
    forcedMode === "optimized" ||
    (forcedMode !== "normal" && (storedMode === "optimized" || weakDeviceHint));

  let slowOpenCount = 0;

  document.documentElement.dataset.performance = optimized ? "optimized" : "normal";

  function setOptimized(value, persist = true) {
    optimized = Boolean(value);
    document.documentElement.dataset.performance = optimized ? "optimized" : "normal";

    if (!persist) return;

    if (optimized) {
      localStorage.setItem("aen_perf_mode", "optimized");
    } else {
      localStorage.removeItem("aen_perf_mode");
    }
  }

  function isOptimized() {
    return optimized;
  }

  function measureDisciplineOpen(startTime) {
    const elapsed = performance.now() - startTime;

    if (elapsed > 220) {
      slowOpenCount += 1;

      if (!optimized && slowOpenCount >= 2) {
        setOptimized(true, true);
      }
    }

    return elapsed;
  }

  function idle(callback, timeout = 900) {
    if ("requestIdleCallback" in window) {
      return window.requestIdleCallback(callback, { timeout });
    }

    return window.setTimeout(() => {
      callback({
        didTimeout: true,
        timeRemaining: () => 8
      });
    }, 16);
  }

  function nonCritical(callback, timeout = 1200) {
    return idle(() => callback(), timeout);
  }

  function afterPaint(callback) {
    requestAnimationFrame(() => {
      requestAnimationFrame(callback);
    });
  }

  return {
    isOptimized,
    setOptimized,
    measureDisciplineOpen,
    idle,
    nonCritical,
    afterPaint
  };
}