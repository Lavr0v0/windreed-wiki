import { ENTRY_SECTIONS, type EntryPayload, type TiptapMark, type TiptapNode } from "./types";

const allowedNodeTypes = new Set([
  "doc",
  "paragraph",
  "text",
  "heading",
  "bulletList",
  "orderedList",
  "listItem",
  "blockquote",
  "horizontalRule",
  "hardBreak",
]);

const allowedMarkTypes = new Set(["bold", "italic", "strike", "code", "link"]);

const publicationBlockers = [
  { pattern: /ChatGPT/iu, label: "ChatGPT" },
  { pattern: /(?:^|\s)AI(?:\s|$)/iu, label: "AI" },
  { pattern: /问卷|答卷/u, label: "问卷或答卷" },
  { pattern: /待定|待补|TODO/iu, label: "待定或待补" },
  { pattern: /工作记录|对话记录|检查报告/u, label: "内部工作记录" },
  { pattern: /候选地名|备选名/u, label: "候选名称" },
  { pattern: /作者尚未|现有资料|现有档案/u, label: "编辑口吻" },
  { pattern: /原始表格|原始文件/u, label: "原始工作附件" },
];

function cleanString(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function cleanStringArray(value: unknown, maxItems = 30) {
  if (!Array.isArray(value)) return [];
  return Array.from(
    new Set(value.map((item) => cleanString(item, 120)).filter(Boolean)),
  ).slice(0, maxItems);
}

function cleanMarks(value: unknown): TiptapMark[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const marks = value.flatMap((candidate): TiptapMark[] => {
    if (!candidate || typeof candidate !== "object") return [];
    const mark = candidate as TiptapMark;
    if (!allowedMarkTypes.has(mark.type)) return [];
    if (mark.type !== "link") return [{ type: mark.type }];
    const href = cleanString(mark.attrs?.href, 500);
    if (!isSafeLink(href)) return [];
    return [{ type: "link", attrs: { href, target: null, rel: "noopener noreferrer nofollow" } }];
  });
  return marks.length ? marks : undefined;
}

function cleanNode(value: unknown, depth = 0): TiptapNode {
  if (!value || typeof value !== "object" || depth > 20) return { type: "paragraph" };
  const candidate = value as TiptapNode;
  const type = allowedNodeTypes.has(candidate.type) ? candidate.type : "paragraph";
  const node: TiptapNode = { type };

  if (type === "text") {
    node.text = typeof candidate.text === "string" ? candidate.text.slice(0, 100_000) : "";
    node.marks = cleanMarks(candidate.marks);
    return node;
  }

  if (type === "heading") {
    const level = Number(candidate.attrs?.level);
    node.attrs = { level: level === 3 ? 3 : 2 };
  } else if (type === "orderedList") {
    const start = Number(candidate.attrs?.start);
    node.attrs = { start: Number.isFinite(start) && start > 0 ? Math.floor(start) : 1 };
  }

  if (Array.isArray(candidate.content)) {
    node.content = candidate.content.slice(0, 5000).map((child) => cleanNode(child, depth + 1));
  }
  return node;
}

function isSafeLink(href: string) {
  if (!href) return false;
  if (href.startsWith("/") && !href.startsWith("//")) return true;
  try {
    const url = new URL(href);
    return url.protocol === "https:" || url.protocol === "http:" || url.protocol === "mailto:";
  } catch {
    return false;
  }
}

function canonicalCharacterPage(href: string) {
  const legacy = /^\/DnD\/([^/]+)\/?$/i.exec(href);
  return legacy ? `/characters/${legacy[1].toLowerCase()}/` : href;
}

export function sanitizeEntryPayload(value: unknown): EntryPayload {
  if (!value || typeof value !== "object") throw new Error("词条内容格式无效。");
  const input = value as Partial<EntryPayload>;
  const category = ["characters", "world", "history"].includes(input.category ?? "")
    ? input.category as EntryPayload["category"]
    : "world";
  const requestedSection = cleanString(input.section, 40);
  const section = ENTRY_SECTIONS.some((candidate) => candidate.value === requestedSection)
    ? requestedSection
    : ENTRY_SECTIONS.find((candidate) => candidate.category === category)?.value ?? "lore";
  const title = cleanString(input.title, 120);
  const slug = cleanString(input.slug, 80).toLowerCase();
  const summary = cleanString(input.summary, 500);

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new Error("URL 路径（slug）只能使用小写英文字母、数字和连字符。");
  }
  if (!title) throw new Error("请填写中文标题。");
  if (!summary) throw new Error("请填写公开摘要。");
  if (JSON.stringify(input.body ?? {}).length > 600_000) throw new Error("正文过长，暂时无法保存。");

  const accent = cleanString(input.accent, 20);
  const presentation = input.presentation === "glossary" ? "glossary" : "archive";
  const characterRole = input.characterRole === "member" || input.characterRole === "associate"
    ? input.characterRole
    : "";

  return {
    slug,
    category,
    section,
    title,
    englishTitle: cleanString(input.englishTitle, 120),
    aliases: cleanStringArray(input.aliases),
    summary,
    monogram: cleanString(input.monogram, 4) || title.slice(0, 1),
    accent: /^#[0-9a-f]{6}$/i.test(accent) ? accent : "#76917f",
    characterRole,
    personalPage: (() => {
      const href = canonicalCharacterPage(cleanString(input.personalPage, 300));
      return href && isSafeLink(href) ? href : "";
    })(),
    presentation,
    facts: Array.isArray(input.facts)
      ? input.facts.slice(0, 20).flatMap((fact) => {
          const label = cleanString(fact?.label, 40);
          const factValue = cleanString(fact?.value, 160);
          return label && factValue ? [{ label, value: factValue }] : [];
        })
      : [],
    relatedSlugs: cleanStringArray(input.relatedSlugs, 30)
      .map((item) => item.toLowerCase())
      .filter((item) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item) && item !== slug),
    sourceLabel: cleanString(input.sourceLabel, 120) || "在线档案",
    body: cleanNode(input.body),
  };
}

export function plainTextFromDocument(document: TiptapNode) {
  const pieces: string[] = [];
  function visit(node: TiptapNode) {
    if (node.type === "text" && node.text) pieces.push(node.text);
    node.content?.forEach(visit);
    if (["paragraph", "heading", "listItem", "blockquote"].includes(node.type)) pieces.push("\n");
  }
  visit(document);
  return pieces.join(" ").replace(/\s+/g, " ").trim();
}

export function publicationIssues(payload: EntryPayload) {
  const searchable = [
    payload.title,
    payload.englishTitle,
    payload.aliases.join(" "),
    payload.summary,
    plainTextFromDocument(payload.body),
  ].join("\n");
  return publicationBlockers
    .filter(({ pattern }) => pattern.test(searchable))
    .map(({ label }) => `检测到不宜公开的内容：${label}`);
}

export function textDocument(text: string): TiptapNode {
  const paragraphs = text
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => ({
      type: "paragraph",
      content: [{ type: "text", text: part.replace(/\s*\n\s*/g, " ") }],
    }));
  return { type: "doc", content: paragraphs.length ? paragraphs : [{ type: "paragraph" }] };
}

function markdownInline(text: string): TiptapNode[] {
  const nodes: TiptapNode[] = [];
  const tokens = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
  let cursor = 0;
  let match: RegExpExecArray | null;

  function pushText(value: string, marks?: TiptapMark[]) {
    if (value) nodes.push({ type: "text", text: value, ...(marks?.length ? { marks } : {}) });
  }

  while ((match = tokens.exec(text))) {
    pushText(text.slice(cursor, match.index));
    const token = match[0];
    if (token.startsWith("**")) {
      pushText(token.slice(2, -2), [{ type: "bold" }]);
    } else if (token.startsWith("*")) {
      pushText(token.slice(1, -1), [{ type: "italic" }]);
    } else if (token.startsWith("`")) {
      pushText(token.slice(1, -1), [{ type: "code" }]);
    } else {
      const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(token);
      if (link && isSafeLink(link[2])) {
        pushText(link[1], [{ type: "link", attrs: { href: link[2] } }]);
      } else {
        pushText(link?.[1] ?? token);
      }
    }
    cursor = match.index + token.length;
  }
  pushText(text.slice(cursor));
  return nodes;
}

export function markdownDocument(markdown: string): TiptapNode {
  const lines = markdown.replace(/\r/g, "").split("\n");
  const content: TiptapNode[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index].trim();
    if (!line) {
      index += 1;
      continue;
    }

    const heading = /^(#{2,3})\s+(.+)$/.exec(line);
    if (heading) {
      content.push({
        type: "heading",
        attrs: { level: heading[1].length },
        content: markdownInline(heading[2]),
      });
      index += 1;
      continue;
    }

    if (/^---+$/.test(line)) {
      content.push({ type: "horizontalRule" });
      index += 1;
      continue;
    }

    if (/^>/.test(line)) {
      const parts: string[] = [];
      while (index < lines.length && /^>/.test(lines[index].trim())) {
        parts.push(lines[index].trim().replace(/^>\s?/, ""));
        index += 1;
      }
      const quoteContent: TiptapNode[] = [];
      let partIndex = 0;
      while (partIndex < parts.length) {
        const part = parts[partIndex];
        if (!part) {
          partIndex += 1;
          continue;
        }
        if (/^[-*]\s+/.test(part)) {
          const items: TiptapNode[] = [];
          while (partIndex < parts.length) {
            const bullet = /^[-*]\s+(.+)$/.exec(parts[partIndex]);
            if (!bullet) break;
            items.push({
              type: "listItem",
              content: [{ type: "paragraph", content: markdownInline(bullet[1]) }],
            });
            partIndex += 1;
          }
          quoteContent.push({ type: "bulletList", content: items });
          continue;
        }
        quoteContent.push({ type: "paragraph", content: markdownInline(part) });
        partIndex += 1;
      }
      content.push({
        type: "blockquote",
        content: quoteContent.length ? quoteContent : [{ type: "paragraph" }],
      });
      continue;
    }

    if (/^[-*]\s+/.test(line)) {
      const items: TiptapNode[] = [];
      while (index < lines.length) {
        const match = /^[-*]\s+(.+)$/.exec(lines[index].trim());
        if (!match) break;
        items.push({
          type: "listItem",
          content: [{ type: "paragraph", content: markdownInline(match[1]) }],
        });
        index += 1;
      }
      content.push({ type: "bulletList", content: items });
      continue;
    }

    const ordered = /^(\d+)\.\s+(.+)$/.exec(line);
    if (ordered) {
      const items: TiptapNode[] = [];
      const start = Number(ordered[1]);
      while (index < lines.length) {
        const match = /^\d+\.\s+(.+)$/.exec(lines[index].trim());
        if (!match) break;
        items.push({
          type: "listItem",
          content: [{ type: "paragraph", content: markdownInline(match[1]) }],
        });
        index += 1;
      }
      content.push({ type: "orderedList", attrs: { start }, content: items });
      continue;
    }

    const paragraph = [line];
    index += 1;
    while (
      index < lines.length &&
      lines[index].trim() &&
      !/^(#{2,3})\s+|^>|^[-*]\s+|^\d+\.\s+|^---+$/.test(lines[index].trim())
    ) {
      paragraph.push(lines[index].trim());
      index += 1;
    }
    content.push({ type: "paragraph", content: markdownInline(paragraph.join(" ")) });
  }

  return { type: "doc", content: content.length ? content : [{ type: "paragraph" }] };
}

function markdownText(node: TiptapNode) {
  let value = node.text ?? "";
  for (const mark of node.marks ?? []) {
    if (mark.type === "bold") value = `**${value}**`;
    if (mark.type === "italic") value = `*${value}*`;
    if (mark.type === "code") value = `\`${value}\``;
    if (mark.type === "link" && typeof mark.attrs?.href === "string") {
      value = `[${value}](${mark.attrs.href})`;
    }
  }
  return value;
}

function inlineMarkdown(node: TiptapNode) {
  return (node.content ?? []).map((child) => child.type === "text" ? markdownText(child) : "").join("");
}

function blockMarkdown(node: TiptapNode, depth = 0): string {
  if (node.type === "paragraph") return inlineMarkdown(node);
  if (node.type === "heading") {
    const level = Number(node.attrs?.level) === 3 ? 3 : 2;
    return `${"#".repeat(level)} ${inlineMarkdown(node)}`;
  }
  if (node.type === "horizontalRule") return "---";
  if (node.type === "blockquote") {
    return (node.content ?? [])
      .map((child) => blockMarkdown(child, depth + 1).split("\n").map((line) => `> ${line}`).join("\n"))
      .join("\n");
  }
  if (node.type === "bulletList" || node.type === "orderedList") {
    const start = Number(node.attrs?.start) || 1;
    return (node.content ?? []).map((item, index) => {
      const marker = node.type === "orderedList" ? `${start + index}.` : "-";
      const body = (item.content ?? []).map((child) => blockMarkdown(child, depth + 1)).join(" ");
      return `${marker} ${body}`;
    }).join("\n");
  }
  if (node.type === "hardBreak") return "  \n";
  return (node.content ?? []).map((child) => blockMarkdown(child, depth + 1)).join("\n\n");
}

export function documentToMarkdown(document: TiptapNode) {
  return (document.content ?? []).map((node) => blockMarkdown(node)).filter(Boolean).join("\n\n");
}
