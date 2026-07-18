/**
 * @param {string} markdown
 */
function coreInfoRange(markdown) {
  const lines = markdown.split("\n");
  const start = lines.findIndex((line) =>
    /^>\s*\[!info\]\s*核心信息\s*$/.test(line.trim()),
  );
  if (start < 0) return null;

  let end = start + 1;
  while (end < lines.length && lines[end].trim().startsWith(">")) end += 1;
  return { lines, start, end };
}

/**
 * Keeps character metadata consistent even when an older published database
 * revision omitted the core-information callout.
 *
 * @param {string} body
 * @param {string | undefined} canonicalBody
 */
export function mergeCanonicalCoreInfo(body, canonicalBody) {
  if (!canonicalBody) return body;
  const canonicalRange = coreInfoRange(canonicalBody);
  if (!canonicalRange) return body;

  const coreInfo = canonicalRange.lines
    .slice(canonicalRange.start, canonicalRange.end)
    .join("\n");
  const publishedRange = coreInfoRange(body);
  const publishedBody = publishedRange
    ? [
        ...publishedRange.lines.slice(0, publishedRange.start),
        ...publishedRange.lines.slice(publishedRange.end),
      ].join("\n")
    : body;

  return `${coreInfo}\n\n${publishedBody.trim()}`.trim();
}
