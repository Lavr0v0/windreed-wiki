import { jsonError, requireEditorIdentity } from "@/app/editor/lib/server";
import { getRuntimeEnv } from "@/db";

export async function GET() {
  try {
    return Response.json({
      identity: await requireEditorIdentity(),
      publicSiteConnected: getRuntimeEnv().WINDREED_PUBLIC_DOMAIN_ENABLED === "1",
    });
  } catch (error) {
    return jsonError(error);
  }
}
