(() => {
  const disciplines = Array.isArray(window.NEXUS_DISCIPLINES) ? window.NEXUS_DISCIPLINES : [];
  if (disciplines.length === 0) return;

  const params = new URLSearchParams(window.location.search);
  const key = (params.get("key") || "").toLowerCase();

  const current = disciplines.find((item) => item.key === key) || disciplines[0];
  const index = disciplines.findIndex((item) => item.key === current.key) + 1;
  const indexLabel = String(index).padStart(2, "0");
  const hue = Math.round((360 / disciplines.length) * (index - 1));

  const fallbackSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="none" aria-hidden="true">
      <g stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="128" cy="128" r="84"/>
        <path d="M128 52V204"/>
        <path d="M52 128H204"/>
        <circle cx="128" cy="128" r="18"/>
      </g>
    </svg>
  `;

  const titleEl = document.getElementById("disciplineTitle");
  const kickerEl = document.getElementById("disciplineKicker");
  const pronouncedEl = document.getElementById("disciplinePronounced");
  const nameEl = document.getElementById("disciplineName");
  const intersectionEl = document.getElementById("disciplineIntersection");
  const conclusionEl = document.getElementById("disciplineConclusion");
  const sigilEl = document.getElementById("disciplineSigil");

  if (titleEl) titleEl.textContent = current.title;
  if (kickerEl) kickerEl.textContent = `DISCIPLINE ${indexLabel}`;
  if (pronouncedEl) pronouncedEl.textContent = current.pronounced;
  if (nameEl) nameEl.textContent = current.discipline;
  if (intersectionEl) intersectionEl.textContent = current.intersection;
  if (conclusionEl) conclusionEl.textContent = current.conclusion;

  if (sigilEl) {
    sigilEl.innerHTML = typeof current.svg === "string" && current.svg.trim()
      ? current.svg
      : fallbackSvg;
  }

  document.documentElement.style.setProperty("--discipline-hue", String(hue));
  document.title = `${current.title} – Aethereal Nexus`;

  const metaDescription = document.querySelector('meta[name="description"]');
  if (metaDescription) {
    metaDescription.setAttribute(
      "content",
      `${current.title}. ${current.discipline}. ${current.conclusion}`
    );
  }
})();