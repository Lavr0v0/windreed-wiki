import { createHash } from "node:crypto";
import { CONTENT_SYNC_FORMAT } from "./sync-format.mjs";

export const SYNC_FORMAT = CONTENT_SYNC_FORMAT;
export const SYNC_VERSION = 1;

export function payloadHash(payload) {
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

export function validateOnlinePackage(value) {
  if (!value || value.format !== SYNC_FORMAT || value.version !== SYNC_VERSION || value.source !== "online") {
    throw new Error("文件不是受支持的线上内容同步包。");
  }
  if (!Array.isArray(value.entries)) throw new Error("线上内容同步包缺少词条列表。");
  return value;
}

export function indexLocalEntries(entries) {
  return new Map(entries.map((entry) => [entry.payload.slug, entry]));
}

export function indexOnlineEntries(syncPackage) {
  return new Map(syncPackage.entries.map((entry) => [entry.payload.slug, entry]));
}

export function classifySync(localEntries, onlinePackage, baseState = { entries: {} }) {
  const local = indexLocalEntries(localEntries);
  const online = indexOnlineEntries(onlinePackage);
  const slugs = Array.from(new Set([...local.keys(), ...online.keys()])).sort();
  return slugs.map((slug) => {
    const localEntry = local.get(slug) ?? null;
    const onlineEntry = online.get(slug) ?? null;
    const base = baseState.entries?.[slug] ?? null;
    const localHash = localEntry ? payloadHash(localEntry.payload) : null;
    const onlineHash = onlineEntry ? payloadHash(onlineEntry.payload) : null;
    let status;

    if (localHash && onlineHash && localHash === onlineHash) status = "in-sync";
    else if (localEntry && !onlineEntry) status = "local-only";
    else if (!localEntry && onlineEntry) status = "online-only";
    else if (!base) status = "conflict";
    else {
      const localChanged = localHash !== base.hash;
      const onlineChanged = onlineHash !== base.hash || onlineEntry.baseRevision !== base.revision;
      if (localChanged && onlineChanged) status = "conflict";
      else if (localChanged) status = "local-changed";
      else if (onlineChanged) status = "online-changed";
      else status = "in-sync";
    }

    return { slug, status, localEntry, onlineEntry, localHash, onlineHash, base };
  });
}

export function createLocalPackage(classification) {
  const entries = [];
  const blocked = [];
  for (const item of classification) {
    if (item.status === "local-only") {
      entries.push({ baseRevision: null, payload: item.localEntry.payload });
    } else if (item.status === "local-changed") {
      entries.push({ baseRevision: item.onlineEntry.baseRevision, payload: item.localEntry.payload });
    } else if (["conflict", "online-changed"].includes(item.status)) {
      blocked.push(item.slug);
    }
  }
  return {
    syncPackage: {
      format: SYNC_FORMAT,
      version: SYNC_VERSION,
      generatedAt: new Date().toISOString(),
      source: "local",
      entries,
    },
    blocked,
  };
}

export function updateCommonBase(baseState, classification) {
  const next = {
    format: "windreed-content-sync-state",
    version: 1,
    updatedAt: new Date().toISOString(),
    entries: { ...(baseState.entries ?? {}) },
  };
  for (const item of classification) {
    if (item.status === "in-sync" && item.onlineEntry && item.onlineHash) {
      next.entries[item.slug] = {
        revision: item.onlineEntry.baseRevision,
        hash: item.onlineHash,
      };
    }
  }
  return next;
}
