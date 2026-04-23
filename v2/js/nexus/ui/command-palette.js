export function createCommandPaletteController({ dom, onExecute }) {
  let commands = [];

  function init() {
    dom.commandPaletteBackdrop?.addEventListener("click", closeRequest);
    dom.closeCommandPaletteBtn?.addEventListener("click", closeRequest);

    dom.commandPaletteInput?.addEventListener("input", (event) => {
      render(event.target.value);
    });

    dom.commandPaletteResults?.addEventListener("click", (event) => {
      const button = event.target.closest("[data-command-id]");
      if (!button) return;

      const commandId = button.dataset.commandId;
      if (!commandId) return;

      onExecute?.(commandId);
    });
  }

  function setCommands(nextCommands) {
    commands = Array.isArray(nextCommands) ? [...nextCommands] : [];
    render("");
  }

  function render(query = "") {
    if (!dom.commandPaletteResults) return;

    const normalizedQuery = String(query || "").trim().toLowerCase();

    const filtered = commands.filter((command) => {
      if (!normalizedQuery) return true;

      const haystack = [
        command.label,
        command.meta,
        ...(command.keywords || [])
      ].join(" ").toLowerCase();

      return haystack.includes(normalizedQuery);
    });

    dom.commandPaletteResults.innerHTML = filtered.length
      ? filtered.map((command) => `
          <button type="button" class="nexus-command-item" data-command-id="${command.id}">
            <span class="nexus-command-item__title">${command.label}</span>
            <span class="nexus-command-item__meta">${command.meta}</span>
          </button>
        `).join("")
      : `
        <div class="nexus-command-item">
          <span class="nexus-command-item__title">No results found</span>
          <span class="nexus-command-item__meta">Refine query</span>
        </div>
      `;
  }

  function sync(state) {
    if (!dom.commandPalette) return;

    const open = state.ui.commandOpen;
    dom.commandPalette.hidden = !open;
    dom.commandPalette.setAttribute("aria-hidden", String(!open));

    if (open && dom.commandPaletteInput) {
      queueMicrotask(() => {
        dom.commandPaletteInput.focus();
        dom.commandPaletteInput.select();
      });
    }
  }

  function closeRequest() {
    document.dispatchEvent(new CustomEvent("anx:command-palette-close-request"));
  }

  function getQuery() {
    return dom.commandPaletteInput?.value || "";
  }

  return Object.freeze({
    init,
    setCommands,
    render,
    sync,
    getQuery
  });
}