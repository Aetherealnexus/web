import fs from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Estrutura esperada:
 * AEN/
 *   web/
 *     disciplines-data.js
 *     disciplines-data-legacy.js
 *     content/
 *     scripts/
 *       split-discipline-content.mjs
 */
const WEB_DIR = path.resolve(__dirname, "..");
const LIGHT_FILE = path.join(WEB_DIR, "disciplines-data.js");
const LEGACY_FILE = path.join(WEB_DIR, "disciplines-data-legacy.js");
const CONTENT_DIR = path.join(WEB_DIR, "content");

const SUPPORTED_LANGS = ["en", "pt", "fr"];

function ensureString(value) {
  return typeof value === "string" ? value : "";
}

function pickMetaFields(source = {}) {
  const out = {};

  for (const field of [
    "title",
    "pronounced",
    "discipline",
    "intersection",
    "conclusion",
    "placeholderWord",
    "placeholderLabel",
    "placeholderText"
  ]) {
    if (typeof source[field] === "string" && source[field].trim()) {
      out[field] = source[field];
    }
  }

  return out;
}

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function writeFileSafe(filePath, content) {
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, content, "utf8");
}

function buildLightMeta(disciplines) {
  return disciplines.map((item) => {
    const meta = {
      key: item.key,
      title: item.title,
      pronounced: item.pronounced,
      discipline: item.discipline,
      intersection: item.intersection,
      conclusion: item.conclusion,
      svg: item.svg
    };

    if (typeof item.status === "string" && item.status.trim()) {
      meta.status = item.status;
    }

    if (typeof item.placeholderWord === "string") {
      meta.placeholderWord = item.placeholderWord;
    }

    if (typeof item.placeholderLabel === "string") {
      meta.placeholderLabel = item.placeholderLabel;
    }

    if (typeof item.placeholderText === "string") {
      meta.placeholderText = item.placeholderText;
    }

    if (item.translations && typeof item.translations === "object") {
      const translations = {};

      for (const [lang, value] of Object.entries(item.translations)) {
        const cleaned = pickMetaFields(value);
        if (Object.keys(cleaned).length > 0) {
          translations[lang] = cleaned;
        }
      }

      if (Object.keys(translations).length > 0) {
        meta.translations = translations;
      }
    }

    return meta;
  });
}

async function writeReadingContentFiles(disciplines) {
  let writtenCount = 0;

  for (const item of disciplines) {
    const baseHtml = ensureString(item.readingHtml).trim();

    if (baseHtml) {
      const filePath = path.join(CONTENT_DIR, "en", `${item.key}.html`);
      await writeFileSafe(filePath, `${baseHtml}\n`);
      writtenCount += 1;
    }

    for (const lang of ["pt", "fr"]) {
      const translatedHtml = ensureString(item?.translations?.[lang]?.readingHtml).trim();

      if (!translatedHtml) continue;

      const filePath = path.join(CONTENT_DIR, lang, `${item.key}.html`);
      await writeFileSafe(filePath, `${translatedHtml}\n`);
      writtenCount += 1;
    }
  }

  return writtenCount;
}

async function resolveSourceFile() {
  const legacyExists = await fileExists(LEGACY_FILE);
  const lightExists = await fileExists(LIGHT_FILE);

  if (legacyExists) {
    return {
      sourceFile: LEGACY_FILE,
      sourceType: "legacy"
    };
  }

  if (lightExists) {
    return {
      sourceFile: LIGHT_FILE,
      sourceType: "light-current"
    };
  }

  throw new Error(
    `Não foi encontrado nenhum ficheiro fonte.\n` +
      `Esperado um destes:\n` +
      `- ${LEGACY_FILE}\n` +
      `- ${LIGHT_FILE}`
  );
}

async function backupIfNeeded(sourceFile, sourceType) {
  if (sourceType !== "light-current") return;

  const legacyExists = await fileExists(LEGACY_FILE);
  if (legacyExists) return;

  const currentContent = await fs.readFile(sourceFile, "utf8");
  await writeFileSafe(LEGACY_FILE, currentContent);

  console.log(`Backup criado automaticamente em: ${LEGACY_FILE}`);
}

async function main() {
  const { sourceFile, sourceType } = await resolveSourceFile();

  console.log(`Ficheiro fonte usado: ${sourceFile}`);

  await backupIfNeeded(sourceFile, sourceType);

  const source = await fs.readFile(sourceFile, "utf8");

  const sandbox = {
    window: {},
    console
  };

  vm.createContext(sandbox);
  vm.runInContext(source, sandbox, {
    filename: sourceFile,
    displayErrors: true
  });

  const disciplines =
    sandbox.window.NEXUS_DISCIPLINES ||
    sandbox.window.NEXUS_DISCIPLINES_META;

  if (!Array.isArray(disciplines)) {
    throw new Error(
      "Não foi possível encontrar window.NEXUS_DISCIPLINES no ficheiro fonte."
    );
  }

  const lightMeta = buildLightMeta(disciplines);

  const lightFileContent = `(() => {
  window.NEXUS_DISCIPLINES_META = ${JSON.stringify(lightMeta, null, 2)};
})();
`;

  await writeFileSafe(LIGHT_FILE, lightFileContent);

  const contentFilesWritten = await writeReadingContentFiles(disciplines);

  for (const lang of SUPPORTED_LANGS) {
    await ensureDir(path.join(CONTENT_DIR, lang));
  }

  console.log("Migração concluída com sucesso.");
  console.log(`Disciplinas meta geradas: ${lightMeta.length}`);
  console.log(`Ficheiros de conteúdo gerados: ${contentFilesWritten}`);
  console.log(`Ficheiro leve escrito em: ${LIGHT_FILE}`);
  console.log(`Conteúdos escritos em: ${CONTENT_DIR}`);
}

main().catch((error) => {
  console.error("Falha na migração:");
  console.error(error);
  process.exit(1);
});