export function createMetaService({
  state,
  metaElements,
  baseMeta,
  localizeDiscipline,
  buildAbsoluteStateUrl,
  setMetaContent
}) {
  const {
    metaDescription,
    canonicalUrl,
    metaOgTitle,
    metaOgDescription,
    metaOgUrl,
    metaTwitterTitle,
    metaTwitterDescription
  } = metaElements;

  function applyDisciplineMeta(item) {
    const localized = localizeDiscipline(item, state.currentLang);

    const disciplineUrl = buildAbsoluteStateUrl({
      disciplineKey: item.key,
      language: state.currentLang
    });

    const title = `${localized.title} – Aethereal Nexus`;
    const description = `${localized.title}. ${localized.discipline}. ${localized.conclusion}`;

    document.title = title;

    if (metaDescription) {
      metaDescription.setAttribute("content", description);
    }

    if (canonicalUrl) {
      canonicalUrl.setAttribute("href", disciplineUrl);
    }

    setMetaContent(metaOgTitle, title);
    setMetaContent(metaOgDescription, description);
    setMetaContent(metaOgUrl, disciplineUrl);
    setMetaContent(metaTwitterTitle, title);
    setMetaContent(metaTwitterDescription, description);
  }

  function restoreBaseMeta() {
    document.title = baseMeta.title;

    if (metaDescription) {
      metaDescription.setAttribute("content", baseMeta.description);
    }

    if (canonicalUrl) {
      canonicalUrl.setAttribute("href", baseMeta.canonical);
    }

    setMetaContent(metaOgTitle, baseMeta.ogTitle);
    setMetaContent(metaOgDescription, baseMeta.ogDescription);
    setMetaContent(metaOgUrl, baseMeta.ogUrl);
    setMetaContent(metaTwitterTitle, baseMeta.twitterTitle);
    setMetaContent(metaTwitterDescription, baseMeta.twitterDescription);
  }

  return {
    applyDisciplineMeta,
    restoreBaseMeta
  };
}