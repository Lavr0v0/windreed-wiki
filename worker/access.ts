export type AccessEnv = {
  CF_ACCESS_TEAM_DOMAIN?: string;
  CF_ACCESS_AUD?: string;
};

type AccessPayload = {
  aud?: string | string[];
  email?: string;
  exp?: number;
  iss?: string;
  nbf?: number;
  sub?: string;
};

type JsonWebKeyWithKid = JsonWebKey & { kid?: string };

const keyCache = new Map<string, { expiresAt: number; keys: JsonWebKeyWithKid[] }>();

function normalizedTeamDomain(value: string) {
  return value.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

function decodeBase64Url(value: string) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(base64);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function decodeJson<T>(value: string): T {
  return JSON.parse(new TextDecoder().decode(decodeBase64Url(value))) as T;
}

async function accessKeys(teamDomain: string) {
  const cached = keyCache.get(teamDomain);
  if (cached && cached.expiresAt > Date.now()) return cached.keys;

  const response = await fetch(`https://${teamDomain}/cdn-cgi/access/certs`, {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error("Unable to load Cloudflare Access signing keys.");
  const body = await response.json() as { keys?: JsonWebKeyWithKid[] };
  const keys = Array.isArray(body.keys) ? body.keys : [];
  if (!keys.length) throw new Error("Cloudflare Access returned no signing keys.");
  keyCache.set(teamDomain, { expiresAt: Date.now() + 60 * 60 * 1000, keys });
  return keys;
}

export async function verifiedAccessEmail(request: Request, env: AccessEnv) {
  const token = request.headers.get("cf-access-jwt-assertion");
  const teamDomain = env.CF_ACCESS_TEAM_DOMAIN
    ? normalizedTeamDomain(env.CF_ACCESS_TEAM_DOMAIN)
    : "";
  const audience = env.CF_ACCESS_AUD?.trim();
  if (!token || !teamDomain || !audience) return null;

  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const header = decodeJson<{ alg?: string; kid?: string }>(parts[0]);
  const payload = decodeJson<AccessPayload>(parts[1]);
  if (header.alg !== "RS256" || !header.kid || !payload.email) return null;

  const now = Math.floor(Date.now() / 1000);
  if (!payload.exp || payload.exp <= now || (payload.nbf && payload.nbf > now + 30)) return null;
  if (payload.iss !== `https://${teamDomain}`) return null;
  const audiences = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
  if (!audiences.includes(audience)) return null;

  const jwk = (await accessKeys(teamDomain)).find((key) => key.kid === header.kid);
  if (!jwk) return null;
  const key = await crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"],
  );
  const valid = await crypto.subtle.verify(
    "RSASSA-PKCS1-v1_5",
    key,
    decodeBase64Url(parts[2]),
    new TextEncoder().encode(`${parts[0]}.${parts[1]}`),
  );
  return valid ? payload.email.trim().toLowerCase() : null;
}
