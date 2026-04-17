import { createContentCache } from "./content-cache.js";
import { createContentLoader } from "./content-loader.js";
import { createContentRenderer } from "./content-renderer.js";

export function createContentService({
  state,
  disciplines,
  AEN_PERF,
  getUi,
  getLocalizedDiscipline,
  DEFAULT_LANG = "en"
}) {
  const cache = createContentCache();

  const loader = createContentLoader({
    cache,
    getUi,
    getLocalizedDiscipline,
    defaultLang: DEFAULT_LANG
  });

  const renderer = createContentRenderer({
    state,
    disciplines,
    AEN_PERF,
    loader,
    getUi,
    defaultLang: DEFAULT_LANG
  });

  return {
    ...loader,
    ...renderer,
    cache
  };
}