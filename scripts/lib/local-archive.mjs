import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";

const root = process.cwd();

function transpile(source, fileName) {
  const result = ts.transpileModule(source, {
    fileName,
    compilerOptions: {
      module: ts.ModuleKind.ES2022,
      target: ts.ScriptTarget.ES2022,
      importsNotUsedAsValues: ts.ImportsNotUsedAsValues.Remove,
    },
    reportDiagnostics: true,
  });
  const errors = (result.diagnostics ?? []).filter((diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error);
  if (errors.length) {
    throw new Error(ts.formatDiagnostics(errors, {
      getCanonicalFileName: (name) => name,
      getCurrentDirectory: () => root,
      getNewLine: () => "\n",
    }));
  }
  return result.outputText;
}

async function replaceRawImports(source, sourcePath) {
  const imports = Array.from(source.matchAll(/^import\s+(\w+)\s+from\s+"([^"]+)\?raw";\s*$/gm));
  let transformed = source;
  for (const match of imports) {
    const [, identifier, relativePath] = match;
    const raw = await readFile(resolve(dirname(sourcePath), relativePath), "utf8");
    transformed = transformed.replace(match[0], `const ${identifier} = ${JSON.stringify(raw)};`);
  }
  return transformed;
}

async function writeRuntimeModule(runtimeDir, sourcePath, outputName, replacements = []) {
  let source = await readFile(sourcePath, "utf8");
  if (sourcePath.endsWith("archive-content.server.ts")) source = await replaceRawImports(source, sourcePath);
  let output = transpile(source, sourcePath);
  for (const [from, to] of replacements) output = output.replaceAll(from, to);
  const outputPath = resolve(runtimeDir, outputName);
  await writeFile(outputPath, output, "utf8");
  return outputPath;
}

async function loadRuntimeModules() {
  const runtimeDir = resolve(root, ".windreed-sync", "runtime", String(process.pid));
  await mkdir(runtimeDir, { recursive: true });

  await writeRuntimeModule(runtimeDir, resolve(root, "app", "editor", "lib", "types.ts"), "types.mjs");
  const contentPath = await writeRuntimeModule(
    runtimeDir,
    resolve(root, "app", "editor", "lib", "content.ts"),
    "content.mjs",
    [["\"./types\"", "\"./types.mjs\""]],
  );
  await writeRuntimeModule(runtimeDir, resolve(root, "app", "archive-manifest.ts"), "archive-manifest.mjs");
  const archivePath = await writeRuntimeModule(
    runtimeDir,
    resolve(root, "app", "archive-content.server.ts"),
    "archive-content.mjs",
    [["\"./archive-manifest\"", "\"./archive-manifest.mjs\""]],
  );

  return Promise.all([
    import(pathToFileURL(archivePath).href),
    import(pathToFileURL(resolve(runtimeDir, "archive-manifest.mjs")).href),
    import(pathToFileURL(contentPath).href),
  ]);
}

export async function loadLocalArchive() {
  const [{ getArchiveEntries }, { archiveManifest }, content] = await loadRuntimeModules();
  const manifestBySlug = new Map(archiveManifest.map((entry) => [entry.slug, entry]));
  const entries = [];

  for (const source of getArchiveEntries()) {
    const manifest = manifestBySlug.get(source.slug);
    if (!manifest) continue;
    const payload = content.sanitizeEntryPayload({
      slug: manifest.slug,
      category: manifest.category,
      section: manifest.section,
      title: manifest.title,
      englishTitle: manifest.englishTitle ?? "",
      aliases: manifest.aliases,
      summary: manifest.summary,
      monogram: manifest.monogram,
      accent: manifest.accent,
      characterRole: manifest.characterRole ?? "",
      personalPage: manifest.personalPage ?? "",
      presentation: manifest.presentation ?? "archive",
      facts: manifest.facts ?? [],
      relatedSlugs: [],
      sourceLabel: "公开档案迁移",
      body: content.markdownDocument(source.body),
    });
    const issues = content.publicationIssues(payload);
    if (issues.length) {
      throw new Error(`${payload.slug} 未通过公开检查：${issues.join("；")}`);
    }
    entries.push({
      payload,
      markdown: content.documentToMarkdown(payload.body),
    });
  }

  return {
    entries,
    toMarkdown: content.documentToMarkdown,
    toPlainText: content.plainTextFromDocument,
  };
}
