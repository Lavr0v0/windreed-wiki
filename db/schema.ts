import { sql } from "drizzle-orm";
import {
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const editors = sqliteTable(
  "editors",
  {
    email: text("email").primaryKey(),
    displayName: text("display_name"),
    role: text("role", { enum: ["admin", "editor"] }).notNull().default("editor"),
    active: integer("active", { mode: "boolean" }).notNull().default(true),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (table) => [index("editors_role_idx").on(table.role)],
);

export const entries = sqliteTable(
  "entries",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull(),
    category: text("category", { enum: ["characters", "world", "history"] }).notNull(),
    section: text("section").notNull(),
    status: text("status", { enum: ["draft", "published"] }).notNull().default("draft"),
    currentRevision: integer("current_revision").notNull().default(0),
    publishedRevision: integer("published_revision"),
    createdBy: text("created_by").notNull(),
    updatedBy: text("updated_by").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
    publishedAt: integer("published_at", { mode: "timestamp_ms" }),
  },
  (table) => [
    uniqueIndex("entries_slug_idx").on(table.slug),
    index("entries_category_idx").on(table.category),
    index("entries_section_idx").on(table.section),
    index("entries_status_idx").on(table.status),
  ],
);

export const entryRevisions = sqliteTable(
  "entry_revisions",
  {
    id: text("id").primaryKey(),
    entryId: text("entry_id")
      .notNull()
      .references(() => entries.id, { onDelete: "cascade" }),
    revision: integer("revision").notNull(),
    payload: text("payload").notNull(),
    plainText: text("plain_text").notNull(),
    note: text("note"),
    createdBy: text("created_by").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (table) => [
    uniqueIndex("entry_revisions_entry_revision_idx").on(table.entryId, table.revision),
    index("entry_revisions_entry_idx").on(table.entryId),
  ],
);

export const entryPermissions = sqliteTable(
  "entry_permissions",
  {
    entryId: text("entry_id")
      .notNull()
      .references(() => entries.id, { onDelete: "cascade" }),
    editorEmail: text("editor_email")
      .notNull()
      .references(() => editors.email, { onDelete: "cascade" }),
    canPublish: integer("can_publish", { mode: "boolean" }).notNull().default(true),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (table) => [
    primaryKey({ columns: [table.entryId, table.editorEmail] }),
    index("entry_permissions_editor_idx").on(table.editorEmail),
  ],
);

export const siteSettings = sqliteTable("site_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedBy: text("updated_by").notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

export type EditorRow = typeof editors.$inferSelect;
export type EntryRow = typeof entries.$inferSelect;
export type EntryRevisionRow = typeof entryRevisions.$inferSelect;
