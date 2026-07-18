import { bootstrapPublicArchive } from "@/app/editor/lib/repository.server";
import {
  assertEditorRequest,
  jsonError,
  requireAdmin,
  requireEditorIdentity,
} from "@/app/editor/lib/server";

export async function POST() {
  try {
    await assertEditorRequest();
    const identity = await requireEditorIdentity();
    requireAdmin(identity);
    return Response.json(await bootstrapPublicArchive(identity));
  } catch (error) {
    return jsonError(error);
  }
}
