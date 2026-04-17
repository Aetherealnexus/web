function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function createContentLoader({
  cache,
  getUi,
  getLocalizedDiscipline,
  defaultLang = "en"
}) {
  function buildDefaultReadingMarkup(item, localized, lang = defaultLang) {
    const ui = getUi(lang);
    const orientationTextA = ui.orientationTextA.replace(
      "{title}",
      escapeHtml(localized.title)
    );

    return `
      <section class="reading-block">
        <h2 class="reading-block__title">${escapeHtml(ui.orientationTitle)}</h2>
        <p class="reading-block__text">${orientationTextA}</p>
        <p class="reading-block__text">${ui.orientationTextB}</p>
      </section>

      <section class="reading-block">
        <h2 class="reading-block__title">${escapeHtml(ui.currentDefinitionTitle)}</h2>
        <p class="reading-block__text">
          <strong>${escapeHtml(ui.disciplineLabel)}:</strong> ${escapeHtml(localized.discipline)}
        </p>
        <p class="reading-block__text">
          <strong>${escapeHtml(ui.intersectionLabel)}:</strong> ${escapeHtml(localized.intersection)}
        </p>
        <p class="reading-block__text">
          <strong>${escapeHtml(ui.conclusionLabel)}:</strong> ${escapeHtml(localized.conclusion)}
        </p>
      </section>

      <section class="reading-block">
        <h2 class="reading-block__title">${escapeHtml(ui.readingZoneTitle)}</h2>
        <p class="reading-block__text">${ui.readingZoneTextA}</p>
        <p class="reading-block__text">${ui.readingZoneTextB}</p>
      </section>
    `;
  }

  function getResearchPlaceholderMarkup(item, lang = defaultLang) {
    const localized = getLocalizedDiscipline(item, lang, getUi);

    return `
      <section class="reading-placeholder">
        <div class="reading-placeholder__core">
          <p class="reading-placeholder__label">${escapeHtml(localized.placeholderLabel)}</p>
          <div class="reading-placeholder__word">${escapeHtml(localized.placeholderWord)}</div>
          <p class="reading-placeholder__text">${escapeHtml(localized.placeholderText)}</p>
        </div>
      </section>
    `;
  }

  function buildContentUrl(key, lang) {
    return `content/${lang}/${encodeURIComponent(key)}.html`;
  }

  async function fetchContentText(url) {
    const response = await fetch(url, {
      cache: "force-cache"
    });

    if (!response.ok) {
      throw new Error(`Failed to load content: ${url}`);
    }

    return response.text();
  }

  function chunkReadingHtml(html) {
    const template = document.createElement("template");
    template.innerHTML = (html || "").trim();

    const nodes = Array.from(template.content.childNodes).filter((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        return node.textContent.trim().length > 0;
      }
      return true;
    });

    const chunks = nodes
      .map((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          return node.outerHTML;
        }

        const text = node.textContent.trim();
        return text
          ? `<section class="reading-block"><p class="reading-block__text">${escapeHtml(text)}</p></section>`
          : "";
      })
      .filter(Boolean);

    return chunks.length > 0 ? chunks : [html];
  }

  function getInlineReadingHtml(item, lang = defaultLang) {
    const exactTranslation = item?.translations?.[lang]?.readingHtml;
    const defaultTranslation = item?.translations?.[defaultLang]?.readingHtml;
    const rootReadingHtml = item?.readingHtml;

    if (typeof exactTranslation === "string" && exactTranslation.trim()) {
      return exactTranslation.trim();
    }

    if (typeof defaultTranslation === "string" && defaultTranslation.trim()) {
      return defaultTranslation.trim();
    }

    if (typeof rootReadingHtml === "string" && rootReadingHtml.trim()) {
      return rootReadingHtml.trim();
    }

    return "";
  }

  function buildFallbackHtml(item, lang = defaultLang) {
    const localized = getLocalizedDiscipline(item, lang, getUi);

    if (item.status === "research_in_progress") {
      return getResearchPlaceholderMarkup(item, lang);
    }

    const inlineHtml = getInlineReadingHtml(item, lang);
    if (inlineHtml) {
      return inlineHtml;
    }

    return buildDefaultReadingMarkup(item, localized, lang);
  }

  async function prepareReadingPayload(item, lang = defaultLang) {
    const cached = cache.get(item.key, lang);

    if (cached) {
      return cached instanceof Promise ? cached : Promise.resolve(cached);
    }

    const promise = (async () => {
      const fallbackHtml = buildFallbackHtml(item, lang);

      if (item.status === "research_in_progress") {
        const payload = {
          html: fallbackHtml,
          chunks: chunkReadingHtml(fallbackHtml)
        };
        cache.set(item.key, lang, payload);
        return payload;
      }

      let html = "";

      const candidates = [
        buildContentUrl(item.key, lang),
        ...(lang !== defaultLang ? [buildContentUrl(item.key, defaultLang)] : [])
      ];

      for (const url of candidates) {
        try {
          html = (await fetchContentText(url)).trim();
          if (html) break;
        } catch {
          // tenta a próxima opção
        }
      }

      if (!html) {
        html = fallbackHtml;
      }

      const payload = {
        html,
        chunks: chunkReadingHtml(html)
      };

      cache.set(item.key, lang, payload);
      return payload;
    })();

    cache.set(item.key, lang, promise);

    try {
      return await promise;
    } catch (error) {
      cache.remove(item.key, lang);
      throw error;
    }
  }

  return {
    buildContentUrl,
    fetchContentText,
    chunkReadingHtml,
    buildDefaultReadingMarkup,
    getResearchPlaceholderMarkup,
    getInlineReadingHtml,
    buildFallbackHtml,
    prepareReadingPayload
  };
}