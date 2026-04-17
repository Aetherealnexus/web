export function getDomRefs() {
  return {
    pageBg: document.getElementById("pageBg"),
    pageBgCanvas: document.getElementById("pageBgCanvas"),

    orbit: document.getElementById("discipline-orbit"),
    screen: document.querySelector(".orbit-screen"),

    readingLayer: document.getElementById("readingLayer"),
    readingPanel: document.getElementById("readingPanel"),
    readingBackBtn: document.getElementById("readingBackBtn"),
    readingBackBtnText: document.getElementById("readingBackBtnText"),
    readingCopyBtn: document.getElementById("readingCopyBtn"),
    readingCopyBtnText: document.getElementById("readingCopyBtnText"),
    readingNativeShareBtn: document.getElementById("readingNativeShareBtn"),
    readingNativeShareBtnText: document.getElementById("readingNativeShareBtnText"),

    readingSigil: document.getElementById("readingSigil"),
    readingEyebrow: document.getElementById("readingEyebrow"),
    readingTitle: document.querySelector(".reading-head__title"),
    readingPronounced: document.getElementById("readingPronounced"),

    readingDiscipline: document.getElementById("readingDiscipline"),
    readingIntersection: document.getElementById("readingIntersection"),
    readingConclusion: document.getElementById("readingConclusion"),

    readingArticle: document.getElementById("readingArticle"),
    readingScroll: document.getElementById("readingScroll"),

    langSwitcher: document.getElementById("langSwitcher"),
    langButtons: Array.from(document.querySelectorAll(".lang-flag")),

    metaDescription: document.querySelector('meta[name="description"]'),
    canonicalUrl: document.querySelector('link[rel="canonical"]'),
    metaOgTitle: document.querySelector('meta[property="og:title"]'),
    metaOgDescription: document.querySelector('meta[property="og:description"]'),
    metaOgUrl: document.querySelector('meta[property="og:url"]'),
    metaTwitterTitle: document.querySelector('meta[name="twitter:title"]'),
    metaTwitterDescription: document.querySelector('meta[name="twitter:description"]')
  };
}