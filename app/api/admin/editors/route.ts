import {
  listEditorAccounts,
  listEntries,
  saveEditorAccount,
} from "@/app/editor/lib/repository.server";
import {
  assertEditorRequest,
  jsonError,
  requireAdmin,
  requireEditorIdentity,
} from "@/app/editor/lib/server";

export async function GET() {
  try {
    const identity = await requireEditorIdentity();
    requireAdmin(identity);
    const [editors, entries] = await Promise.all([
      listEditorAccounts(),
      listEntries(identity),
    ]);
    return Response.json({ editors, entries });
  } catch (error) {
    return jsonError(error);
  }
}

export async function PUT(request: Request) {
  try {
    await assertEditorRequest();
    const identity = await requireEditorIdentity();
    requireAdmin(identity);
    const body = await request.json() as {
      email: string;
      displayName?: string;
      active?: boolean;
      entryIds?: string[];
    };
    return Response.json({ editors: await saveEditorAccount(body) });
  } catch (error) {
    return jsonError(error);
  }
}
