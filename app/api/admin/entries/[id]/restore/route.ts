import { restoreRevision } from "@/app/editor/lib/repository.server";
import {
  assertEditorRequest,
  jsonError,
  requireEditorIdentity,
} from "@/app/editor/lib/server";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await assertEditorRequest();
    const identity = await requireEditorIdentity();
    const { id } = await context.params;
    const body = await request.json() as { revision?: number; expectedRevision?: number };
    return Response.json({
      entry: await restoreRevision(
        identity,
        id,
        Number(body.revision),
        Number(body.expectedRevision),
      ),
    });
  } catch (error) {
    return jsonError(error);
  }
}
