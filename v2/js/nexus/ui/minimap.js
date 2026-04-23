function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function createMinimapController({ dom, config, onNavigate }) {
  let viewportBox = null;

  function init() {
    dom.minimapBody?.addEventListener("click", handleClick);
  }

  function ensureViewportBox() {
    if (!dom.minimapBody) return null;
    if (viewportBox) return viewportBox;

    viewportBox = dom.minimapBody.querySelector(".nexus-minimap__viewport");

    if (!viewportBox) {
      viewportBox = document.createElement("div");
      viewportBox.className = "nexus-minimap__viewport";

      Object.assign(viewportBox.style, {
        position: "absolute",
        border: "1px solid rgba(139, 232, 255, 0.28)",
        borderRadius: "10px",
        boxShadow: "0 0 16px rgba(139, 232, 255, 0.08), inset 0 0 12px rgba(139, 232, 255, 0.05)",
        background: "rgba(139, 232, 255, 0.04)",
        pointerEvents: "none"
      });

      dom.minimapBody.appendChild(viewportBox);
    }

    return viewportBox;
  }

  function sync(state) {
    if (!dom.minimapBody) return;

    const x = clamp(50 + state.view.x * 0.05, 8, 92);
    const y = clamp(50 + state.view.y * 0.05, 8, 92);
    const w = clamp(36 / state.view.zoom, 12, 60);
    const h = clamp(24 / state.view.zoom, 10, 50);

    dom.minimapBody.style.setProperty(
      "background-position",
      `${state.view.x * 0.02}px ${state.view.y * 0.02}px`
    );

    const box = ensureViewportBox();
    if (!box) return;

    box.style.left = `${x - w * 0.5}%`;
    box.style.top = `${y - h * 0.5}%`;
    box.style.width = `${w}%`;
    box.style.height = `${h}%`;
  }

  function handleClick(event) {
    if (!dom.minimapBody) return;

    const rect = dom.minimapBody.getBoundingClientRect();
    const px = clamp((event.clientX - rect.left) / rect.width, 0, 1);
    const py = clamp((event.clientY - rect.top) / rect.height, 0, 1);

    const halfSpan = config.minimap.worldSpan * 0.5;
    const nextX = (0.5 - px) * config.minimap.worldSpan;
    const nextY = (0.5 - py) * config.minimap.worldSpan;

    onNavigate?.({
      x: clamp(nextX, -halfSpan, halfSpan),
      y: clamp(nextY, -halfSpan, halfSpan)
    });
  }

  return Object.freeze({
    init,
    sync
  });
}