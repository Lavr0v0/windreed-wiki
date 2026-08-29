import {
  listEditorAccounts,
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
    return Response.json({ editors: await listEditorAccounts() });
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
    };
    return Response.json({ editors: await saveEditorAccount(body) });
  } catch (error) {
    return jsonError(error);
  }
}
