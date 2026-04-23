export const EVENTS = Object.freeze({
  APP_BEFORE_INIT: "app:before-init",
  APP_READY: "app:ready",
  FEATURES_READY: "features:ready",
  STATE_CHANGED: "state:changed",

  POINTER_UPDATED: "pointer:updated",
  VIEW_CHANGED: "view:changed",

  FIELD_SIGNATURE_CHANGED: "field-signature:changed",
  SYMBOLIC_WEATHER_CHANGED: "symbolic-weather:changed",
  TEMPORAL_PHASE_CHANGED: "temporal-phase:changed",
  FOCUS_AURA_UPDATED: "focus-aura:updated",

  OBSERVER_PROFILE_CHANGED: "observer-profile:changed",
  MYTH_STATE_CHANGED: "myth-state:changed",

  GRAVITY_WELL_CREATED: "gravity-well:created",
  GRAVITY_WELL_ENDED: "gravity-well:ended",

  ORACLE_WHISPER_REQUESTED: "oracle-whisper:requested",
  ORACLE_WHISPER_SHOWN: "oracle-whisper:shown",
  ORACLE_WHISPER_ENDED: "oracle-whisper:ended",

  COMMAND_OPENED: "command:opened",
  COMMAND_CLOSED: "command:closed",
  COMMAND_EXECUTED: "command:executed",

  LENS_OPENED: "lens:opened",
  LENS_CLOSED: "lens:closed",

  LANGUAGE_CHANGED: "language:changed",
  AUDIO_TOGGLED: "audio:toggled",
  AUDIO_READY: "audio:ready",
  AUDIO_FAILED: "audio:failed",
  HINTS_TOGGLED: "hints:toggled",
  HINT_UPDATED: "hint:updated",

  PATHWAY_DISCOVERED: "pathway:discovered",
  CONSTELLATION_RENDERED: "constellation:rendered",
  INSIGHT_FRAGMENT_REQUESTED: "insight-fragment:requested",

  RITUAL_PROGRESS: "ritual:progress",
  RITUAL_COMPLETED: "ritual:completed",

  SECRET_CONDITION_MET: "secret:condition-met",
  SECRET_REVEALED: "secret:revealed",

  REVEAL_QUEUED: "reveal:queued",
  REVEAL_STARTED: "reveal:started",
  REVEAL_ENDED: "reveal:ended",

  EASTER_EGG_UNLOCKED: "easter-egg:unlocked",

  INIT_COMPLETED: "init:completed",

  GESTURE_LONG_PRESS: "gesture:long-press",
  GESTURE_DOUBLE_TAP: "gesture:double-tap",
  GESTURE_CORE_TAP: "gesture:core-tap",
  GESTURE_DRAG_START: "gesture:drag-start",
  GESTURE_DRAG_END: "gesture:drag-end",

  NODE_HOVERED: "node:hovered",
  NODE_UNHOVERED: "node:unhovered",
  NODE_SELECTED: "node:selected",
  NODE_DESELECTED: "node:deselected",

  EMOTION_CHANGED: "emotion:changed",
  MEMORY_UPDATED: "memory:updated"
});

export function createEventBus() {
  const listeners = new Map();

  function on(eventName, handler) {
    if (!listeners.has(eventName)) {
      listeners.set(eventName, new Set());
    }

    listeners.get(eventName).add(handler);

    return () => off(eventName, handler);
  }

  function once(eventName, handler) {
    const unsubscribe = on(eventName, (payload) => {
      unsubscribe();
      handler(payload);
    });

    return unsubscribe;
  }

  function off(eventName, handler) {
    const bucket = listeners.get(eventName);
    if (!bucket) return;

    bucket.delete(handler);

    if (bucket.size === 0) {
      listeners.delete(eventName);
    }
  }

  function emit(eventName, payload) {
    const bucket = listeners.get(eventName);
    if (!bucket || bucket.size === 0) return;

    for (const handler of bucket) {
      try {
        handler(payload);
      } catch (error) {
        console.error(`[EventBus] Handler failed for "${eventName}"`, error);
      }
    }
  }

  function clear() {
    listeners.clear();
  }

  return Object.freeze({
    on,
    once,
    off,
    emit,
    clear
  });
}