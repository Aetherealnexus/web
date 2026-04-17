export function createOrbitController({
  orbit,
  screen,
  disciplines,
  total,
  FALLBACK_SVG,
  escapeHtml,
  pointerMode
}) {
  let openHandler = () => {};
  let nodes = [];
  let cleanups = [];

  function on(target, eventName, handler, options) {
    if (!target || typeof target.addEventListener !== "function") return;

    target.addEventListener(eventName, handler, options);
    cleanups.push(() => target.removeEventListener(eventName, handler, options));
  }

  function cleanup() {
    cleanups.forEach((dispose) => dispose());
    cleanups = [];
  }

  function setOpenHandler(handler) {
    openHandler = typeof handler === "function" ? handler : () => {};
  }

  function render() {
    if (!orbit) return;

    orbit.innerHTML = disciplines
      .map((item, index) => {
        const order = String(index + 1).padStart(2, "0");
        const hue = Math.round((360 / total) * index);
        const svgMarkup = typeof item.svg === "string" && item.svg.trim() ? item.svg : FALLBACK_SVG;

        return `
          <a
            class="orbit-node"
            href="#${encodeURIComponent(item.key)}"
            style="--i:${index}; --total:${total}; --node-hue:${hue};"
            data-key="${item.key}"
            aria-label="Open ${escapeHtml(item.title)}"
          >
            <span class="orbit-node__inner">
              <span class="orbit-node__index">${order}</span>

              <span class="orbit-node__sigil" aria-hidden="true">
                ${svgMarkup}
              </span>

              <span class="orbit-node__title">${escapeHtml(item.title)}</span>

              <span class="sr-only">
                ${escapeHtml(item.title)}. ${escapeHtml(item.discipline)}. ${escapeHtml(item.conclusion)}
              </span>
            </span>
          </a>
        `;
      })
      .join("");

    nodes = Array.from(orbit.querySelectorAll(".orbit-node"));
  }

  function getNodeFromTarget(target) {
    if (!target || typeof target.closest !== "function") return null;

    const node = target.closest(".orbit-node");
    if (!node || !orbit?.contains(node)) return null;

    return node;
  }

  function setHoverActive(targetNode) {
    if (screen?.classList.contains("is-reading")) return;

    nodes.forEach((node) => {
      node.classList.toggle("is-active", node === targetNode);
    });

    orbit?.classList.add("is-hovering");
  }

  function clearHoverActive() {
    if (screen?.classList.contains("is-reading")) return;

    nodes.forEach((node) => node.classList.remove("is-active"));
    orbit?.classList.remove("is-hovering");
  }

  function selectKey(key) {
    const selectedNode = nodes.find((node) => node.dataset.key === key);

    nodes.forEach((node) => {
      const isSelected = node === selectedNode;
      node.classList.toggle("is-selected", isSelected);
      node.classList.toggle("is-active", isSelected);
    });

    orbit?.classList.add("is-hovering");
  }

  function clearSelection() {
    nodes.forEach((node) => {
      node.classList.remove("is-selected");
      node.classList.remove("is-active");
    });

    orbit?.classList.remove("is-hovering");
  }

  function bindNodeEvents() {
    on(orbit, "pointerover", (event) => {
      if (pointerMode.matches) return;

      const node = getNodeFromTarget(event.target);
      if (!node) return;

      const previousNode = getNodeFromTarget(event.relatedTarget);
      if (previousNode === node) return;

      setHoverActive(node);
    });

    on(orbit, "pointerleave", () => {
      clearHoverActive();
    });

    on(orbit, "focusin", (event) => {
      const node = getNodeFromTarget(event.target);
      if (!node) return;

      if (!screen?.classList.contains("is-reading")) {
        setHoverActive(node);
      }
    });

    on(orbit, "focusout", (event) => {
      if (!orbit?.contains(event.relatedTarget)) {
        clearHoverActive();
      }
    });

    on(orbit, "click", (event) => {
      const node = getNodeFromTarget(event.target);
      if (!node) return;

      event.preventDefault();
      openHandler(node.dataset.key);
    });
  }

  function init() {
    cleanup();
    render();
    bindNodeEvents();
  }

  function getNodes() {
    return nodes;
  }

  return {
    init,
    render,
    getNodes,
    setOpenHandler,
    setHoverActive,
    clearHoverActive,
    selectKey,
    clearSelection,
    cleanup
  };
}