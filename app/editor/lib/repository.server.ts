import "server-only";

import { getRuntimeEnv } from "@/db";
import type {
  EditorAccount,
  EditorIdentity,
  EntryListItem,
  EntryPayload,
  RevisionItem,
} from "./types";
import {
  markdownDocument,
  plainTextFromDocument,
  publicationIssues,
  sanitizeEntryPayload,
} from "./content";
import { ApiError } from "./server";
import { invalidatePublicArchiveCache } from "@/app/public-archive-cache.server";

type D1Row = Record<string, unknown>;

export type PublishedEntrySummary = Pick<
  EntryPayload,
  | "slug"
  | "category"
  | "section"
  | "title"
  | "englishTitle"
  | "aliases"
  | "summary"
  | "monogram"
  | "accent"
  | "characterRole"
  | "personalPage"
  | "presentation"
  | "facts"
>;

function database() {
  const db = getRuntimeEnv().DB;
  if (!db) throw new ApiError(503, "档案数据库尚未连接。");
  return db;
}

function publicDatabase() {
  const db = database();
  return typeof db.withSession === "function"
    ? db.withSession("first-unconstrained")
    : db;
}

function id(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}`;
}

function isoDate(value: unknown) {
  const timestamp = Number(value);
  return new Date(Number.isFinite(timestamp) ? timestamp : Date.now()).toISOString();
}

function payloadFromRow(row: D1Row): EntryPayload {
  try {
    return sanitizeEntryPayload(JSON.parse(String(row.payload)));
  } catch {
    throw new ApiError(500, "数据库中的词条内容已经损坏。");
  }
}

function listItemFromRow(row: D1Row): EntryListItem {
  return {
    id: String(row.id),
    slug: String(row.slug),
    category: String(row.category) as EntryListItem["category"],
    section: String(row.section),
    status: String(row.status) as EntryListItem["status"],
    currentRevision: Number(row.current_revision),
    publishedRevision: row.published_revision === null ? null : Number(row.published_revision),
    updatedAt: isoDate(row.updated_at),
    updatedBy: String(row.updated_by),
    canPublish: Boolean(row.can_publish),
    payload: payloadFromRow(row),
  };
}

function jsonArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (typeof value !== "string" || !value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed as T[] : [];
  } catch {
    return [];
  }
}

function publishedSummaryFromRow(row: D1Row): PublishedEntrySummary {
  return {
    slug: String(row.slug),
    category: String(row.category) as EntryPayload["category"],
    section: String(row.section),
    title: String(row.title),
    englishTitle: String(row.english_title ?? ""),
    aliases: jsonArray<string>(row.aliases),
    summary: String(row.summary),
    monogram: String(row.monogram),
    accent: String(row.accent),
    characterRole: String(row.character_role ?? "") as EntryPayload["characterRole"],
    personalPage: String(row.personal_page ?? ""),
    presentation: row.presentation === "glossary" ? "glossary" : "archive",
    facts: jsonArray<EntryPayload["facts"][number]>(row.facts),
  };
}

const publishedSummaryColumns = `
  e.slug,
  e.category,
  e.section,
  json_extract(r.payload, '$.title') AS title,
  json_extract(r.payload, '$.englishTitle') AS english_title,
  json_extract(r.payload, '$.aliases') AS aliases,
  json_extract(r.payload, '$.summary') AS summary,
  json_extract(r.payload, '$.monogram') AS monogram,
  json_extract(r.payload, '$.accent') AS accent,
  json_extract(r.payload, '$.characterRole') AS character_role,
  json_extract(r.payload, '$.personalPage') AS personal_page,
  json_extract(r.payload, '$.presentation') AS presentation,
  json_extract(r.payload, '$.facts') AS facts
`;

async function accessFor(identity: EditorIdentity, entryId: string) {
  if (identity.role === "admin") return { canEdit: true, canPublish: true };
  const row = await database()
    .prepare("SELECT can_publish FROM entry_permissions WHERE entry_id = ?1 AND editor_email = ?2")
    .bind(entryId, identity.email)
    .first<{ can_publish: number }>();
  return { canEdit: Boolean(row), canPublish: Boolean(row?.can_publish) };
}

export async function listEntries(identity: EditorIdentity) {
  const admin = identity.role === "admin" ? 1 : 0;
  const result = await database()
    .prepare(`
      SELECT e.*, r.payload,
        CASE WHEN ?1 = 1 THEN 1 ELSE COALESCE(p.can_publish, 0) END AS can_publish
      FROM entries e
      JOIN entry_revisions r
        ON r.entry_id = e.id AND r.revision = e.current_revision
      LEFT JOIN entry_permissions p
        ON p.entry_id = e.id AND p.editor_email = ?2
      WHERE ?1 = 1 OR p.editor_email IS NOT NULL
      ORDER BY e.updated_at DESC, e.slug ASC
    `)
    .bind(admin, identity.email)
    .all<D1Row>();
  return result.results.map(listItemFromRow);
}

export async function getEntry(identity: EditorIdentity, entryId: string) {
  const permission = await accessFor(identity, entryId);
  if (!permission.canEdit) throw new ApiError(403, "你没有编辑这个词条的权限。");
  const row = await database()
    .prepare(`
      SELECT e.*, r.payload, ?2 AS can_publish
      FROM entries e
      JOIN entry_revisions r ON r.entry_id = e.id AND r.revision = e.current_revision
      WHERE e.id = ?1
    `)
    .bind(entryId, permission.canPublish ? 1 : 0)
    .first<D1Row>();
  if (!row) throw new ApiError(404, "没有找到这个词条。");
  return listItemFromRow(row);
}

export async function createEntry(identity: EditorIdentity, rawPayload: unknown) {
  const payload = sanitizeEntryPayload(rawPayload);
  const entryId = id("entry");
  const revisionId = id("revision");
  const now = Date.now();
  const permissionStatement = identity.role === "editor"
    ? database().prepare(`
        INSERT INTO entry_permissions (entry_id, editor_email, can_publish, created_at)
        VALUES (?1, ?2, 0, ?3)
      `).bind(entryId, identity.email, now)
    : null;

  try {
    await database().batch([
      database().prepare(`
        INSERT INTO entries (
          id, slug, category, section, status, current_revision,
          created_by, updated_by, created_at, updated_at
        ) VALUES (?1, ?2, ?3, ?4, 'draft', 1, ?5, ?5, ?6, ?6)
      `).bind(entryId, payload.slug, payload.category, payload.section, identity.email, now),
      database().prepare(`
        INSERT INTO entry_revisions (
          id, entry_id, revision, payload, plain_text, note, created_by, created_at
        ) VALUES (?1, ?2, 1, ?3, ?4, '建立词条', ?5, ?6)
      `).bind(
        revisionId,
        entryId,
        JSON.stringify(payload),
        plainTextFromDocument(payload.body),
        identity.email,
        now,
      ),
      ...(permissionStatement ? [permissionStatement] : []),
    ]);
  } catch (error) {
    if (String(error).toLowerCase().includes("unique")) {
      throw new ApiError(409, "这个 URL 路径（slug）已经被其他词条使用。");
    }
    throw error;
  }
  return getEntry(identity, entryId);
}

export async function saveDraft(
  identity: EditorIdentity,
  entryId: string,
  expectedRevision: number,
  rawPayload: unknown,
  note?: string,
) {
  const permission = await accessFor(identity, entryId);
  if (!permission.canEdit) throw new ApiError(403, "你没有编辑这个词条的权限。");
  const payload = sanitizeEntryPayload(rawPayload);
  const current = await database()
    .prepare("SELECT current_revision FROM entries WHERE id = ?1")
    .bind(entryId)
    .first<{ current_revision: number }>();
  if (!current) throw new ApiError(404, "没有找到这个词条。");
  if (Number(current.current_revision) !== expectedRevision) {
    throw new ApiError(409, "这个词条刚刚被其他人更新了。请刷新后比较内容再保存。", {
      currentRevision: Number(current.current_revision),
    });
  }

  const nextRevision = expectedRevision + 1;
  const now = Date.now();
  try {
    await database().batch([
      database().prepare(`
        INSERT INTO entry_revisions (
          id, entry_id, revision, payload, plain_text, note, created_by, created_at
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
      `).bind(
        id("revision"),
        entryId,
        nextRevision,
        JSON.stringify(payload),
        plainTextFromDocument(payload.body),
        note?.trim().slice(0, 160) || "保存草稿",
        identity.email,
        now,
      ),
      database().prepare(`
        UPDATE entries
        SET slug = ?1, category = ?2, section = ?3, current_revision = ?4,
            updated_by = ?5, updated_at = ?6
        WHERE id = ?7 AND current_revision = ?8
      `).bind(
        payload.slug,
        payload.category,
        payload.section,
        nextRevision,
        identity.email,
        now,
        entryId,
        expectedRevision,
      ),
    ]);
  } catch (error) {
    const message = String(error).toLowerCase();
    if (message.includes("unique") && message.includes("slug")) {
      throw new ApiError(409, "这个 URL 路径（slug）已经被其他词条使用。");
    }
    if (message.includes("unique")) {
      throw new ApiError(409, "保存冲突：其他人已经先保存了新版本，请刷新页面。");
    }
    throw error;
  }
  return getEntry(identity, entryId);
}

export async function publishEntry(
  identity: EditorIdentity,
  entryId: string,
  expectedRevision: number,
) {
  const permission = await accessFor(identity, entryId);
  if (!permission.canPublish) throw new ApiError(403, "你可以编辑这个词条，但尚未获得发布权限。");
  const entry = await getEntry(identity, entryId);
  if (entry.currentRevision !== expectedRevision) {
    throw new ApiError(409, "发布前词条已经发生变化，请刷新后再试。");
  }
  const issues = publicationIssues(entry.payload);
  if (issues.length) throw new ApiError(422, "公开检查未通过。", { issues });

  const result = await database()
    .prepare(`
      UPDATE entries
      SET status = 'published', published_revision = current_revision,
          published_at = ?1, updated_by = ?2, updated_at = ?1
      WHERE id = ?3 AND current_revision = ?4
    `)
    .bind(Date.now(), identity.email, entryId, expectedRevision)
    .run();
  if (!result.meta.changes) throw new ApiError(409, "发布前词条已经发生变化，请刷新后再试。");
  await invalidatePublicArchiveCache();
  return getEntry(identity, entryId);
}

export async function listRevisions(identity: EditorIdentity, entryId: string) {
  const entry = await getEntry(identity, entryId);
  const result = await database()
    .prepare(`
      SELECT revision, created_at, created_by, note
      FROM entry_revisions WHERE entry_id = ?1 ORDER BY revision DESC LIMIT 100
    `)
    .bind(entryId)
    .all<D1Row>();
  return result.results.map((row: D1Row): RevisionItem => ({
    revision: Number(row.revision),
    createdAt: isoDate(row.created_at),
    createdBy: String(row.created_by),
    note: row.note ? String(row.note) : null,
    isCurrent: Number(row.revision) === entry.currentRevision,
    isPublished: Number(row.revision) === entry.publishedRevision,
  }));
}

export async function restoreRevision(
  identity: EditorIdentity,
  entryId: string,
  revision: number,
  expectedRevision: number,
) {
  await getEntry(identity, entryId);
  const source = await database()
    .prepare("SELECT payload FROM entry_revisions WHERE entry_id = ?1 AND revision = ?2")
    .bind(entryId, revision)
    .first<{ payload: string }>();
  if (!source) throw new ApiError(404, "没有找到这个历史版本。");
  return saveDraft(
    identity,
    entryId,
    expectedRevision,
    JSON.parse(source.payload),
    `恢复自版本 ${revision}`,
  );
}

export async function listPublishedEntries() {
  const result = await publicDatabase()
    .prepare(`
      SELECT e.*, r.payload, r.plain_text
      FROM entries e
      JOIN entry_revisions r
        ON r.entry_id = e.id AND r.revision = e.published_revision
      WHERE e.status = 'published' AND e.published_revision IS NOT NULL
      ORDER BY e.category, e.section, e.slug
    `)
    .all<D1Row>();
  return result.results.map((row: D1Row) => ({
    id: String(row.id),
    slug: String(row.slug),
    category: String(row.category),
    section: String(row.section),
    publishedRevision: Number(row.published_revision),
    publishedAt: isoDate(row.published_at),
    plainText: String(row.plain_text),
    payload: payloadFromRow(row),
  }));
}

export async function listPublishedEntrySummaries() {
  const result = await publicDatabase()
    .prepare(`
      SELECT ${publishedSummaryColumns}
      FROM entries e
      JOIN entry_revisions r
        ON r.entry_id = e.id AND r.revision = e.published_revision
      WHERE e.status = 'published' AND e.published_revision IS NOT NULL
      ORDER BY e.category, e.section, e.slug
    `)
    .all<D1Row>();
  return result.results.map(publishedSummaryFromRow);
}

export async function listPublishedSearchEntries() {
  const result = await publicDatabase()
    .prepare(`
      SELECT ${publishedSummaryColumns}, r.plain_text
      FROM entries e
      JOIN entry_revisions r
        ON r.entry_id = e.id AND r.revision = e.published_revision
      WHERE e.status = 'published' AND e.published_revision IS NOT NULL
      ORDER BY e.category, e.section, e.slug
    `)
    .all<D1Row>();
  return result.results.map((row) => ({
    ...publishedSummaryFromRow(row),
    plainText: String(row.plain_text ?? ""),
  }));
}

export async function getPublishedEntry(slug: string) {
  const row = await publicDatabase()
    .prepare(`
      SELECT e.*, r.payload, r.plain_text
      FROM entries e
      JOIN entry_revisions r
        ON r.entry_id = e.id AND r.revision = e.published_revision
      WHERE e.status = 'published' AND e.slug = ?1
    `)
    .bind(slug)
    .first<D1Row>();
  if (!row) return null;
  return {
    id: String(row.id),
    slug: String(row.slug),
    category: String(row.category),
    section: String(row.section),
    publishedRevision: Number(row.published_revision),
    publishedAt: isoDate(row.published_at),
    plainText: String(row.plain_text),
    payload: payloadFromRow(row),
  };
}

export async function listEditorAccounts(): Promise<EditorAccount[]> {
  const result = await database().prepare(`
    SELECT ed.email, ed.display_name, ed.role, ed.active,
           GROUP_CONCAT(ep.entry_id) AS entry_ids
    FROM editors ed
    LEFT JOIN entry_permissions ep ON ep.editor_email = ed.email
    GROUP BY ed.email
    ORDER BY ed.role, ed.email
  `).all<D1Row>();
  return result.results.map((row: D1Row) => ({
    email: String(row.email),
    displayName: row.display_name ? String(row.display_name) : String(row.email).split("@")[0],
    role: String(row.role) as EditorAccount["role"],
    active: Boolean(row.active),
    entryIds: row.entry_ids ? String(row.entry_ids).split(",") : [],
  }));
}

export async function saveEditorAccount(input: {
  email: string;
  displayName?: string;
  active?: boolean;
  entryIds?: string[];
}) {
  const email = input.email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new ApiError(400, "邮箱格式不正确。");
  const now = Date.now();
  const entryIds = Array.from(new Set(input.entryIds ?? []));
  const statements = [
    database().prepare(`
      INSERT INTO editors (email, display_name, role, active, created_at, updated_at)
      VALUES (?1, ?2, 'editor', ?3, ?4, ?4)
      ON CONFLICT(email) DO UPDATE SET
        display_name = excluded.display_name,
        active = excluded.active,
        updated_at = excluded.updated_at
    `).bind(email, input.displayName?.trim().slice(0, 80) || null, input.active === false ? 0 : 1, now),
    database().prepare("DELETE FROM entry_permissions WHERE editor_email = ?1").bind(email),
    ...entryIds.map((entryId) => database().prepare(`
      INSERT INTO entry_permissions (entry_id, editor_email, can_publish, created_at)
      VALUES (?1, ?2, 1, ?3)
    `).bind(entryId, email, now)),
  ];
  await database().batch(statements);
  return listEditorAccounts();
}

export async function bootstrapPublicArchive(identity: EditorIdentity) {
  if (identity.role !== "admin") throw new ApiError(403, "只有管理员可以初始化公开档案。");
  const [{ getArchiveEntries }, { archiveManifest }] = await Promise.all([
    import("@/app/archive-content.server"),
    import("@/app/archive-manifest"),
  ]);
  const existingResult = await database().prepare("SELECT slug FROM entries").all<{ slug: string }>();
  const existing = new Set(existingResult.results.map((row: { slug: string }) => row.slug));
  const manifestBySlug = new Map(archiveManifest.map((entry) => [entry.slug, entry]));
  const imported: string[] = [];
  const skipped: string[] = [];

  for (const source of getArchiveEntries()) {
    if (existing.has(source.slug)) {
      skipped.push(source.slug);
      continue;
    }
    const manifest = manifestBySlug.get(source.slug);
    if (!manifest) continue;
    const payload: EntryPayload = {
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
      body: markdownDocument(source.body),
    };
    const created = await createEntry(identity, payload);
    await publishEntry(identity, created.id, created.currentRevision);
    imported.push(source.slug);
  }

  return { imported, skipped };
}
