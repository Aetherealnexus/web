function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function distance(x1, y1, x2, y2) {
  return Math.hypot(x2 - x1, y2 - y1);
}

function hashString(input) {
  let hash = 0;

  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }

  return Math.abs(hash);
}

function getEmotionAmplitude(emotion) {
  switch (emotion) {
    case "attune":
      return 2.2;
    case "surge":
      return 8.2;
    case "descent":
      return 3.2;
    case "converge":
      return 2.4;
    case "revelation":
      return 6.4;
    case "command":
      return 4.0;
    case "dormant":
      return 1.1;
    default:
      return 4.6;
  }
}

export function createNodeDynamics({ store, neuralMap, plane }) {
  let frameId = 0;

  function init() {
    tick();
  }

  function destroy() {
    cancelAnimationFrame(frameId);
  }

  function tick() {
    const state = store.getState();
    const nodeRecords = neuralMap.getNodeRecords();
    const edgeRecords = neuralMap.getEdgeRecords();

    if (!nodeRecords.length || !plane) {
      frameId = requestAnimationFrame(tick);
      return;
    }

    const rect = plane.getBoundingClientRect();
    const pointerWorldX = (state.interaction.pointer.x - rect.width * 0.5 - state.view.x) / state.view.zoom;
    const pointerWorldY = (state.interaction.pointer.y - rect.height * 0.5 - state.view.y) / state.view.zoom;

    const time = performance.now() * 0.001;
    const emotion = state.app.emotionState;
    const amplitude = getEmotionAmplitude(emotion);
    const speedNorm = clamp(state.interaction.speed / 14, 0, 1);

    const selectedId = neuralMap.getSelectedNodeId();
    const hoveredId = neuralMap.getHoveredNodeId();

    for (const record of nodeRecords) {
      const { data, el } = record;
      const seed = hashString(data.id);
      const phaseA = seed * 0.00073;
      const phaseB = seed * 0.00111;

      const baseDriftX =
        Math.sin(time * (0.55 + (seed % 7) * 0.035) + phaseA) * amplitude +
        Math.cos(time * 0.28 + phaseB) * amplitude * 0.34;

      const baseDriftY =
        Math.cos(time * (0.49 + (seed % 5) * 0.04) + phaseB) * amplitude +
        Math.sin(time * 0.31 + phaseA) * amplitude * 0.38;

      const distToPointer = distance(pointerWorldX, pointerWorldY, data.x, data.y);
      const attraction = clamp(1 - distToPointer / 240, 0, 1);

      const pullX =
        (pointerWorldX - data.x) *
        0.055 *
        attraction *
        (0.34 + speedNorm);

      const pullY =
        (pointerWorldY - data.y) *
        0.055 *
        attraction *
        (0.34 + speedNorm);

      const isSelected = selectedId === data.id;
      const isHovered = hoveredId === data.id;

      const selectedSuppression = isSelected ? 0.18 : 1;
      const hoveredSuppression = isHovered ? 0.56 : 1;
      const suppression = selectedSuppression * hoveredSuppression;

      const driftX = (baseDriftX + pullX) * suppression;
      const driftY = (baseDriftY + pullY) * suppression;

      const rot = Math.sin(time * 0.36 + phaseA) * amplitude * 0.45 * suppression;
      const scaleBias =
        (isSelected ? 0.12 : 0) +
        (isHovered ? 0.06 : 0) +
        attraction * 0.04;

      const glowExtra =
        attraction * 14 +
        (emotion === "revelation" ? 10 : 0) +
        (isSelected ? 8 : 0);

      el.style.setProperty("--node-drift-x", `${driftX.toFixed(2)}px`);
      el.style.setProperty("--node-drift-y", `${driftY.toFixed(2)}px`);
      el.style.setProperty("--node-rot", `${rot.toFixed(2)}deg`);
      el.style.setProperty("--node-scale-bias", scaleBias.toFixed(3));
      el.style.setProperty("--node-glow-extra", `${glowExtra.toFixed(2)}px`);
    }

    for (const record of edgeRecords) {
      const sourceActive = record.sourceId === selectedId || record.sourceId === hoveredId;
      const targetActive = record.targetId === selectedId || record.targetId === hoveredId;

      const bias =
        (sourceActive || targetActive ? 0.18 : 0) +
        (emotion === "surge" ? 0.04 : 0) +
        (emotion === "revelation" ? 0.08 : 0);

      record.el.style.setProperty("--edge-energy-bias", bias.toFixed(3));
    }

    frameId = requestAnimationFrame(tick);
  }

  return Object.freeze({
    init,
    destroy
  });
}