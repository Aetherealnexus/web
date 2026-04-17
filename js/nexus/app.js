import { bootstrapNexusApp } from "./bootstrap.js";
import { disciplines } from "./data/disciplines.js";
import { backgrounds } from "./data/backgrounds.js";
import { initReadingMobileFocus } from "./features/reading-mobile-focus.js";

function startNexusApp() {
  if (window.AEN_APP && typeof window.AEN_APP.cleanup === "function") {
    window.AEN_APP.cleanup();
  }

  const app = bootstrapNexusApp({
    disciplines,
    backgrounds
  }) || {};

  const cleanupReadingMobileFocus = initReadingMobileFocus();

  window.AEN_APP = {
    ...app,
    cleanup() {
      if (typeof cleanupReadingMobileFocus === "function") {
        cleanupReadingMobileFocus();
      }

      if (typeof app.cleanup === "function") {
        app.cleanup();
      }
    }
  };

  return window.AEN_APP;
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", startNexusApp, { once: true });
} else {
  startNexusApp();
}