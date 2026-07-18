import { createEntry, listEntries } from "@/app/editor/lib/repository.server";
import {
  assertEditorRequest,
  jsonError,
  requireEditorIdentity,
} from "@/app/editor/lib/server";

export async function GET() {
  try {
    const identity = await requireEditorIdentity();
    return Response.json({ entries: await listEntries(identity) });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    await assertEditorRequest();
    const identity = await requireEditorIdentity();
    const body = await request.json() as { payload?: unknown };
    return Response.json({ entry: await createEntry(identity, body.payload) }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
