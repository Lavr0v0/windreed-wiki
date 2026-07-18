import { getEntry } from "@/app/editor/lib/repository.server";
import { jsonError, requireEditorIdentity } from "@/app/editor/lib/server";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const identity = await requireEditorIdentity();
    const { id } = await context.params;
    return Response.json({ entry: await getEntry(identity, id) });
  } catch (error) {
    return jsonError(error);
  }
}
