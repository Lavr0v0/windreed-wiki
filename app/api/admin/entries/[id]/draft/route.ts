import { saveDraft } from "@/app/editor/lib/repository.server";
import {
  assertEditorRequest,
  jsonError,
  requireEditorIdentity,
} from "@/app/editor/lib/server";

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await assertEditorRequest();
    const identity = await requireEditorIdentity();
    const { id } = await context.params;
    const body = await request.json() as {
      expectedRevision?: number;
      payload?: unknown;
      note?: string;
    };
    const entry = await saveDraft(
      identity,
      id,
      Number(body.expectedRevision),
      body.payload,
      body.note,
    );
    return Response.json({ entry });
  } catch (error) {
    return jsonError(error);
  }
}
