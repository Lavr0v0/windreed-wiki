import {
  createEntry,
  listEntries,
  saveDraft,
} from "@/app/editor/lib/repository.server";
import { sanitizeEntryPayload } from "@/app/editor/lib/content";
import {
  ApiError,
  assertEditorRequest,
  jsonError,
  requireAdmin,
  requireEditorIdentity,
} from "@/app/editor/lib/server";
import {
  CONTENT_SYNC_FORMAT,
  type ContentSyncImportResult,
  type ContentSyncPackage,
} from "@/app/editor/lib/types";

export async function POST(request: Request) {
  try {
    await assertEditorRequest();
    const identity = await requireEditorIdentity();
    requireAdmin(identity);
    const body = await request.json() as Partial<ContentSyncPackage>;
    if (body.format !== CONTENT_SYNC_FORMAT || body.version !== 1 || body.source !== "local") {
      throw new ApiError(400, "这不是受支持的风芦内容同步包。");
    }
    if (!Array.isArray(body.entries) || body.entries.length > 200) {
      throw new ApiError(400, "同步包中的词条数量无效。");
    }

    const candidates = body.entries.map((entry) => ({
      baseRevision: Number.isInteger(entry?.baseRevision) && Number(entry.baseRevision) > 0
        ? Number(entry.baseRevision)
        : null,
      payload: sanitizeEntryPayload(entry?.payload),
    }));
    const slugs = candidates.map((entry) => entry.payload.slug);
    if (new Set(slugs).size !== slugs.length) {
      throw new ApiError(400, "同步包中存在重复的 URL slug。");
    }

    const onlineEntries = await listEntries(identity);
    const onlineBySlug = new Map(onlineEntries.map((entry) => [entry.slug, entry]));
    const result: ContentSyncImportResult = {
      created: [],
      updated: [],
      unchanged: [],
      conflicts: [],
    };

    for (const candidate of candidates) {
      const slug = candidate.payload.slug;
      const online = onlineBySlug.get(slug);
      if (!online) {
        if (candidate.baseRevision !== null) {
          result.conflicts.push({
            slug,
            localBaseRevision: candidate.baseRevision,
            onlineRevision: null,
            reason: "本地基于一个线上已不存在的版本，未自动重建。",
          });
          continue;
        }
        await createEntry(identity, candidate.payload);
        result.created.push(slug);
        continue;
      }

      if (candidate.baseRevision !== online.currentRevision) {
        result.conflicts.push({
          slug,
          localBaseRevision: candidate.baseRevision,
          onlineRevision: online.currentRevision,
          reason: "线上词条在本地导出后已经发生变化。",
        });
        continue;
      }
      if (JSON.stringify(candidate.payload) === JSON.stringify(online.payload)) {
        result.unchanged.push(slug);
        continue;
      }
      await saveDraft(
        identity,
        online.id,
        online.currentRevision,
        candidate.payload,
        "从本地内容同步包推送",
      );
      result.updated.push(slug);
    }

    return Response.json(result);
  } catch (error) {
    return jsonError(error);
  }
}
