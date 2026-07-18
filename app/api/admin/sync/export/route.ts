import { listEntries } from "@/app/editor/lib/repository.server";
import { jsonError, requireAdmin, requireEditorIdentity } from "@/app/editor/lib/server";
import {
  CONTENT_SYNC_FORMAT,
  type ContentSyncPackage,
} from "@/app/editor/lib/types";

export async function GET() {
  try {
    const identity = await requireEditorIdentity();
    requireAdmin(identity);
    const entries = await listEntries(identity);
    const syncPackage: ContentSyncPackage = {
      format: CONTENT_SYNC_FORMAT,
      version: 1,
      generatedAt: new Date().toISOString(),
      source: "online",
      entries: entries.map((entry) => ({
        baseRevision: entry.currentRevision,
        payload: entry.payload,
      })),
    };
    const date = new Date().toISOString().slice(0, 10);
    return Response.json(syncPackage, {
      headers: {
        "Cache-Control": "no-store",
        "Content-Disposition": `attachment; filename="windreed-online-${date}.json"`,
      },
    });
  } catch (error) {
    return jsonError(error);
  }
}
