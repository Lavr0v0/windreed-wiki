import { editorEntrySections, type ArchiveCategory } from "../../archive-taxonomy";

export type EditorRole = "admin" | "editor";
export type EntryStatus = "draft" | "published";
export type EntryCategory = ArchiveCategory;

export type TiptapMark = {
  type: string;
  attrs?: Record<string, unknown>;
};

export type TiptapNode = {
  type: string;
  attrs?: Record<string, unknown>;
  content?: TiptapNode[];
  marks?: TiptapMark[];
  text?: string;
};

export type EntryFact = {
  label: string;
  value: string;
};

export type EntryPayload = {
  slug: string;
  category: EntryCategory;
  section: string;
  title: string;
  englishTitle: string;
  aliases: string[];
  summary: string;
  monogram: string;
  accent: string;
  characterRole: "" | "member" | "associate";
  personalPage: string;
  presentation: "archive" | "glossary";
  facts: EntryFact[];
  relatedSlugs: string[];
  sourceLabel: string;
  body: TiptapNode;
};

export type EntryListItem = {
  id: string;
  slug: string;
  category: EntryCategory;
  section: string;
  status: EntryStatus;
  currentRevision: number;
  publishedRevision: number | null;
  updatedAt: string;
  updatedBy: string;
  canPublish: boolean;
  payload: EntryPayload;
};

export type RevisionItem = {
  revision: number;
  createdAt: string;
  createdBy: string;
  note: string | null;
  isCurrent: boolean;
  isPublished: boolean;
};

export type EditorIdentity = {
  email: string;
  displayName: string;
  role: EditorRole;
};

export type EditorAccount = EditorIdentity & {
  active: boolean;
};

export const CONTENT_SYNC_FORMAT = "windreed-content-sync";

export type ContentSyncEntry = {
  baseRevision: number | null;
  payload: EntryPayload;
};

export type ContentSyncPackage = {
  format: typeof CONTENT_SYNC_FORMAT;
  version: 1;
  generatedAt: string;
  source: "online" | "local";
  entries: ContentSyncEntry[];
};

export type ContentSyncConflict = {
  slug: string;
  localBaseRevision: number | null;
  onlineRevision: number | null;
  reason: string;
};

export type ContentSyncImportResult = {
  created: string[];
  updated: string[];
  unchanged: string[];
  conflicts: ContentSyncConflict[];
};

export const ENTRY_CATEGORIES: Array<{
  value: EntryCategory;
  label: string;
}> = [
  { value: "characters", label: "人物" },
  { value: "world", label: "世界" },
  { value: "history", label: "故事" },
];

export const ENTRY_SECTIONS = editorEntrySections;

export const EMPTY_DOCUMENT: TiptapNode = {
  type: "doc",
  content: [{ type: "paragraph" }],
};

export const EMPTY_ENTRY: EntryPayload = {
  slug: "",
  category: "world",
  section: "lore",
  title: "",
  englishTitle: "",
  aliases: [],
  summary: "",
  monogram: "",
  accent: "#76917f",
  characterRole: "",
  personalPage: "",
  presentation: "archive",
  facts: [],
  relatedSlugs: [],
  sourceLabel: "在线档案",
  body: EMPTY_DOCUMENT,
};
