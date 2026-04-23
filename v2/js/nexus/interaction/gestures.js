import { EVENTS } from "../core/event-bus.js";

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function distance(x1, y1, x2, y2) {
  return Math.hypot(x2 - x1, y2 - y1);
}

function lerp(start, end, alpha) {
  return start + (end - start) * alpha;
}

function now() {
  return performance.now();
}

export function createGestureController({ plane, store, bus, config }) {
  const pointerState = {
    isDown: false,
    activePointers: new Map(),
    dragStartX: 0,
    dragStartY: 0,
    viewStartX: 0,
    viewStartY: 0,
    lastMoveAt: 0,
    lastX: 0,
    lastY: 0,
    longPressTimer: null,
    pinchStartDistance: 0,
    pinchStartZoom: 1,
    lastTapAt: 0
  };

  function init() {
    if (!plane) return;

    plane.addEventListener("pointerdown", onPointerDown);
    plane.addEventListener("pointermove", onPointerMove);
    plane.addEventListener("pointerup", onPointerUp);
    plane.addEventListener("pointercancel", onPointerUp);
    plane.addEventListener("pointerleave", onPointerLeave);
    plane.addEventListener("wheel", onWheel, { passive: false });
    plane.addEventListener("dblclick", onDoubleClick);
  }

  function destroy() {
    if (!plane) return;

    plane.removeEventListener("pointerdown", onPointerDown);
    plane.removeEventListener("pointermove", onPointerMove);
    plane.removeEventListener("pointerup", onPointerUp);
    plane.removeEventListener("pointercancel", onPointerUp);
    plane.removeEventListener("pointerleave", onPointerLeave);
    plane.removeEventListener("wheel", onWheel);
    plane.removeEventListener("dblclick", onDoubleClick);
  }

  function onPointerDown(event) {
    plane.setPointerCapture?.(event.pointerId);

    pointerState.isDown = true;
    pointerState.activePointers.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY
    });

    const state = store.getState();

    pointerState.dragStartX = event.clientX;
    pointerState.dragStartY = event.clientY;
    pointerState.viewStartX = state.view.x;
    pointerState.viewStartY = state.view.y;
    pointerState.lastX = event.clientX;
    pointerState.lastY = event.clientY;

    if (pointerState.activePointers.size === 2) {
      const [a, b] = [...pointerState.activePointers.values()];
      pointerState.pinchStartDistance = distance(a.x, a.y, b.x, b.y);
      pointerState.pinchStartZoom = state.view.zoom;
    }

    window.clearTimeout(pointerState.longPressTimer);
    pointerState.longPressTimer = window.setTimeout(() => {
      if (!pointerState.isDown) return;

      const moved = distance(
        pointerState.dragStartX,
        pointerState.dragStartY,
        pointerState.lastX,
        pointerState.lastY
      );

      if (moved <= config.interaction.dragActivationDistance) {
        bus.emit(EVENTS.GESTURE_LONG_PRESS, {
          clientX: event.clientX,
          clientY: event.clientY
        });
      }
    }, config.interaction.longPressMs);

    store.setState({
      interaction: {
        active: true,
        pressure: event.pressure || 0,
        pointerCount: pointerState.activePointers.size
      },
      session: {
        lastInteractionAt: Date.now(),
        interactionCount: state.session.interactionCount + 1
      }
    }, "gesture/pointer-down");
  }

  function onPointerMove(event) {
    const rect = plane.getBoundingClientRect();
    const pointerRecord = pointerState.activePointers.get(event.pointerId);

    if (pointerRecord) {
      pointerRecord.x = event.clientX;
      pointerRecord.y = event.clientY;
    }

    const state = store.getState();
    const timestamp = now();
    const dt = Math.max(timestamp - (pointerState.lastMoveAt || timestamp), 1);
    const dx = event.clientX - pointerState.lastX;
    const dy = event.clientY - pointerState.lastY;
    const rawSpeed = Math.hypot(dx, dy) / dt * 16.6667;
    const smoothedSpeed = lerp(state.interaction.speed, rawSpeed, config.interaction.speedSmoothing);

    pointerState.lastMoveAt = timestamp;
    pointerState.lastX = event.clientX;
    pointerState.lastY = event.clientY;

    let patch = {
      interaction: {
        pointer: {
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
          nx: clamp((event.clientX - rect.left) / rect.width, 0, 1),
          ny: clamp((event.clientY - rect.top) / rect.height, 0, 1)
        },
        speed: smoothedSpeed,
        pressure: event.pressure || 0,
        pointerCount: pointerState.activePointers.size
      },
      session: {
        lastInteractionAt: Date.now()
      }
    };

    if (pointerState.activePointers.size === 2) {
      const [a, b] = [...pointerState.activePointers.values()];
      const currentDistance = distance(a.x, a.y, b.x, b.y);
      const ratio = currentDistance / Math.max(pointerState.pinchStartDistance, 1);
      const nextZoom = clamp(
        pointerState.pinchStartZoom * ratio,
        state.view.minZoom,
        state.view.maxZoom
      );

      patch = {
        ...patch,
        interaction: {
          ...patch.interaction,
          pinchDistance: currentDistance
        },
        view: {
          zoom: lerp(state.view.zoom, nextZoom, config.interaction.pinchSmoothing)
        },
        ui: {
          modeLabel: "Resonance"
        }
      };
    } else if (pointerState.isDown) {
      const moved = distance(
        pointerState.dragStartX,
        pointerState.dragStartY,
        event.clientX,
        event.clientY
      );

      const dragging = moved > config.interaction.dragActivationDistance;

      if (dragging) {
        window.clearTimeout(pointerState.longPressTimer);

        patch = {
          ...patch,
          interaction: {
            ...patch.interaction,
            dragging: true
          },
          view: {
            x: pointerState.viewStartX + (event.clientX - pointerState.dragStartX),
            y: pointerState.viewStartY + (event.clientY - pointerState.dragStartY)
          },
          ui: {
            modeLabel: "Navigate",
            focusLabel: "Field"
          }
        };

        if (!state.interaction.dragging) {
          bus.emit(EVENTS.GESTURE_DRAG_START, {
            clientX: event.clientX,
            clientY: event.clientY
          });
        }
      }
    } else {
      const centerX = rect.width * 0.5;
      const centerY = rect.height * 0.5;
      const pointerToCore = distance(
        event.clientX - rect.left,
        event.clientY - rect.top,
        centerX,
        centerY
      );

      patch = {
        ...patch,
        ui: {
          modeLabel: smoothedSpeed < 1.2 ? "Listen" : "Explore",
          focusLabel: pointerToCore <= config.interaction.coreFocusRadius ? "Core" : "Field"
        }
      };
    }

    store.setState(patch, "gesture/pointer-move");
    bus.emit(EVENTS.POINTER_UPDATED, store.getState().interaction);
  }

  function onPointerUp(event) {
    const rect = plane.getBoundingClientRect();
    const state = store.getState();

    pointerState.activePointers.delete(event.pointerId);
    pointerState.isDown = pointerState.activePointers.size > 0;

    window.clearTimeout(pointerState.longPressTimer);

    const localX = event.clientX - rect.left;
    const localY = event.clientY - rect.top;
    const centerX = rect.width * 0.5;
    const centerY = rect.height * 0.5;
    const coreDistance = distance(localX, localY, centerX, centerY);

    const tapNow = Date.now();
    const isDoubleTap = tapNow - pointerState.lastTapAt <= config.interaction.doubleTapMs;
    pointerState.lastTapAt = tapNow;

    if (!state.interaction.dragging && coreDistance <= config.interaction.coreFocusRadius) {
      bus.emit(EVENTS.GESTURE_CORE_TAP, {
        clientX: event.clientX,
        clientY: event.clientY,
        localX,
        localY
      });
    }

    if (!state.interaction.dragging && isDoubleTap) {
      bus.emit(EVENTS.GESTURE_DOUBLE_TAP, {
        clientX: event.clientX,
        clientY: event.clientY,
        localX,
        localY
      });
    }

    if (state.interaction.dragging) {
      bus.emit(EVENTS.GESTURE_DRAG_END, {
        clientX: event.clientX,
        clientY: event.clientY
      });
    }

    store.setState({
      interaction: {
        active: pointerState.isDown,
        dragging: false,
        pressure: 0,
        pointerCount: pointerState.activePointers.size,
        pinchDistance: 0
      },
      ui: {
        modeLabel: "Explore"
      }
    }, "gesture/pointer-up");
  }

  function onPointerLeave() {
    window.clearTimeout(pointerState.longPressTimer);

    pointerState.activePointers.clear();
    pointerState.isDown = false;

    store.setState({
      interaction: {
        active: false,
        dragging: false,
        speed: 0,
        pressure: 0,
        pointerCount: 0,
        pinchDistance: 0
      },
      ui: {
        modeLabel: "Explore",
        focusLabel: "Field"
      }
    }, "gesture/pointer-leave");
  }

  function onWheel(event) {
    event.preventDefault();

    const state = store.getState();
    const delta = -event.deltaY * config.interaction.wheelZoomIntensity;
    const nextZoom = clamp(
      state.view.zoom * (1 + delta),
      state.view.minZoom,
      state.view.maxZoom
    );

    const rect = plane.getBoundingClientRect();
    const offsetX = event.clientX - rect.left - rect.width / 2 - state.view.x;
    const offsetY = event.clientY - rect.top - rect.height / 2 - state.view.y;
    const zoomFactor = nextZoom / state.view.zoom;

    store.setState({
      view: {
        zoom: nextZoom,
        x: state.view.x - offsetX * (zoomFactor - 1),
        y: state.view.y - offsetY * (zoomFactor - 1)
      }
    }, "gesture/wheel-zoom");

    bus.emit(EVENTS.VIEW_CHANGED, store.getState().view);
  }

  function onDoubleClick(event) {
    event.preventDefault();

    const state = store.getState();
    const nextZoom = clamp(
      state.view.zoom + config.interaction.zoomStep * 2,
      state.view.minZoom,
      state.view.maxZoom
    );

    const rect = plane.getBoundingClientRect();
    const offsetX = event.clientX - rect.left - rect.width / 2 - state.view.x;
    const offsetY = event.clientY - rect.top - rect.height / 2 - state.view.y;
    const zoomFactor = nextZoom / state.view.zoom;

    store.setState({
      view: {
        zoom: nextZoom,
        x: state.view.x - offsetX * (zoomFactor - 1),
        y: state.view.y - offsetY * (zoomFactor - 1)
      }
    }, "gesture/double-click-zoom");

    bus.emit(EVENTS.VIEW_CHANGED, store.getState().view);
  }

  return Object.freeze({
    init,
    destroy
  });
}