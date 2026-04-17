export const SUPPORTED_LANGS = ["en", "pt", "fr"];
export const DEFAULT_LANG = "en";

export const UI_TRANSLATIONS = {
  en: {
    back: "Go Back",
    copyLink: "Copy Link",
    shareNative: "Share",
    linkCopied: "Link Copied",
    linkCopyFailed: "Copy Failed",
    linkShared: "Shared",
    shareFailed: "Share Failed",
    eyebrow: "DISCIPLINE",
    disciplineLabel: "Discipline",
    intersectionLabel: "Intersection",
    conclusionLabel: "Conclusion",
    orientationTitle: "Orientation",
    currentDefinitionTitle: "Current Definition",
    readingZoneTitle: "Reading Zone",
    orientationTextA:
      "<strong>{title}</strong> is the active gateway. This reading chamber is now ready to receive your own investigations, notes, frameworks, citations, hypotheses, and long-form reflections.",
    orientationTextB:
      "The visual system remains the same as the entrance state so the discipline feels born from the same symbolic world rather than disconnected from it.",
    readingZoneTextA:
      "This is the scrollable area intended for your real research corpus.",
    readingZoneTextB:
      "Add long-form essays, nested sections, source notes, structured arguments, ontological maps, or any other deep material here.",
    researchInProgress: "Research in progress",
    unfolding: "UNFOLDING",
    researchPlaceholderText:
      "This discipline is currently under active development. The investigation is ongoing, but this section of the Aethereal Nexus is not yet publicly available.",
    loading: "Loading discipline",
    loadingText:
      "The reading shell opens immediately. The full text is being streamed in phases."
  },
  pt: {
    back: "Voltar",
    copyLink: "Copiar Link",
    shareNative: "Partilhar",
    linkCopied: "Link Copiado",
    linkCopyFailed: "Falha ao Copiar",
    linkShared: "Partilhado",
    shareFailed: "Falha ao Partilhar",
    eyebrow: "DISCIPLINA",
    disciplineLabel: "Disciplina",
    intersectionLabel: "Interseção",
    conclusionLabel: "Conclusão",
    orientationTitle: "Orientação",
    currentDefinitionTitle: "Definição Atual",
    readingZoneTitle: "Zona de Leitura",
    orientationTextA:
      "<strong>{title}</strong> é a gateway ativa. Esta câmara de leitura está pronta para receber investigação, notas, frameworks, citações, hipóteses e reflexão longa.",
    orientationTextB:
      "O sistema visual mantém-se igual ao estado de entrada para a disciplina continuar ligada ao mesmo mundo simbólico.",
    readingZoneTextA:
      "Esta é a área com scroll destinada ao teu corpus real de investigação.",
    readingZoneTextB:
      "Aqui podes colocar ensaios, secções aninhadas, notas de fontes, argumentos estruturados, mapas ontológicos e material longo.",
    researchInProgress: "Investigação em curso",
    unfolding: "EM DESENVOLVIMENTO",
    researchPlaceholderText:
      "Esta disciplina encontra-se em desenvolvimento ativo. A investigação está a decorrer, mas esta secção ainda não está publicamente disponível.",
    loading: "A carregar disciplina",
    loadingText:
      "O painel abre logo. O texto completo está a ser carregado por fases."
  },
  fr: {
    back: "Retour",
    copyLink: "Copier le Lien",
    shareNative: "Partager",
    linkCopied: "Lien Copié",
    linkCopyFailed: "Échec de Copie",
    linkShared: "Partagé",
    shareFailed: "Échec du Partage",
    eyebrow: "DISCIPLINE",
    disciplineLabel: "Discipline",
    intersectionLabel: "Intersection",
    conclusionLabel: "Conclusion",
    orientationTitle: "Orientation",
    currentDefinitionTitle: "Définition Actuelle",
    readingZoneTitle: "Zone de Lecture",
    orientationTextA:
      "<strong>{title}</strong> est la passerelle active. Cette chambre de lecture est prête à recevoir recherches, notes, cadres, citations, hypothèses et réflexions longues.",
    orientationTextB:
      "Le système visuel reste identique à l’état d’entrée afin que la discipline demeure liée au même monde symbolique.",
    readingZoneTextA:
      "Voici la zone défilante destinée à votre véritable corpus de recherche.",
    readingZoneTextB:
      "Vous pouvez y placer essais, sections imbriquées, notes de sources, arguments structurés, cartes ontologiques et matériaux longs.",
    researchInProgress: "Recherche en cours",
    unfolding: "EN DÉPLOIEMENT",
    researchPlaceholderText:
      "Cette discipline est actuellement en développement actif. La recherche est en cours, mais cette section n’est pas encore publiquement disponible.",
    loading: "Chargement de la discipline",
    loadingText:
      "Le panneau s’ouvre immédiatement. Le texte complet arrive par phases."
  }
};

export const FALLBACK_SVG = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="none" aria-hidden="true">
    <g stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="128" cy="128" r="84"/>
      <path d="M128 52V204"/>
      <path d="M52 128H204"/>
      <circle cx="128" cy="128" r="18"/>
    </g>
  </svg>
`;

export function getRuntimeGlobals() {
  const body = document.body;

  return {
    body,
    bgMode: (body?.dataset?.bgMode || "fx").toLowerCase(),
    supportsNativeShare: typeof navigator.share === "function"
  };
}