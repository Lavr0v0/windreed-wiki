import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export type WindreedRuntimeEnv = {
  DB?: D1Database;
  PUBLIC_ARCHIVE_CACHE?: KVNamespace;
  WINDREED_ADMIN_EMAILS?: string;
  WINDREED_EDITOR_HOST?: string;
  WINDREED_PUBLIC_DOMAIN_ENABLED?: string;
};

const runtime = globalThis as typeof globalThis & {
  __WINDREED_RUNTIME_ENV__?: WindreedRuntimeEnv;
};

export function getDb() {
  const runtimeEnv = getRuntimeEnv();
  if (!runtimeEnv.DB) {
    throw new Error(
      "Cloudflare D1 binding `DB` is unavailable. Set the `d1` field in .openai/hosting.json to `DB` or let your control plane inject the real binding values before using the database."
    );
  }

  return drizzle(runtimeEnv.DB, { schema });
}

export function getRuntimeEnv() {
  return runtime.__WINDREED_RUNTIME_ENV__ ?? {};
}

export function setRuntimeEnv(env: WindreedRuntimeEnv) {
  runtime.__WINDREED_RUNTIME_ENV__ = env;
}
