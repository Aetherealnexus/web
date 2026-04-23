import { EVENTS } from "../core/event-bus.js";

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function sumObjectValues(obj) {
  return Object.values(obj || {}).reduce((acc, value) => acc + Number(value || 0), 0);
}

export function createObserverEngine({ store, bus, config }) {
  let currentProfile = null;
  let intervalId = null;

  function init() {
    evaluate(true);

    intervalId = window.setInterval(() => {
      evaluate(false);
    }, config.observer.tickMs);

    store.subscribe(() => {
      evaluate(false);
    });
  }

  function destroy() {
    if (intervalId) {
      window.clearInterval(intervalId);
      intervalId = null;
    }
  }

  function evaluate(force) {
    const state = store.getState();
    const nextProfile = determineProfile(state);

    if (!force && nextProfile === currentProfile) {
      return;
    }

    currentProfile = nextProfile;

    store.setState({
      app: {
        observerProfile: nextProfile
      }
    }, "observer/set-profile");

    bus.emit(EVENTS.OBSERVER_PROFILE_CHANGED, {
      profile: nextProfile
    });
  }

  function determineProfile(state) {
    const visited = state.memory.visitedNodeCount || 0;
    const maxZoom = state.memory.maxZoomReached || 1;
    const rituals = state.memory.ritualCount || 0;
    const secrets = state.memory.secretCount || 0;
    const speed = state.interaction.speed || 0;
    const hoverDwellTotal = sumObjectValues(state.memory.hoverDwellMs);
    const hoverDwellSeconds = hoverDwellTotal / 1000;
    const interactionCount = state.session.interactionCount || 0;

    if (rituals >= 2 || (rituals >= 1 && secrets >= 2)) {
      return "ritualist";
    }

    if (state.app.weatherState === "ion-storm" || speed >= 10 || interactionCount >= 24 && visited >= 4) {
      return "storm-chaser";
    }

    if (maxZoom >= 2.2 || (state.view.zoom >= 2 && state.memory.lastSelectedNodeId)) {
      return "diver";
    }

    if (hoverDwellSeconds >= 18 || state.app.emotionState === "attune") {
      return "witness";
    }

    if (visited >= 6 && maxZoom >= 1.45) {
      return "cartographer";
    }

    return "wanderer";
  }

  return Object.freeze({
    init,
    destroy
  });
}