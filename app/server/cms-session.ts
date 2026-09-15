import { base64Url, constantTimeEqual, fromBase64Url, signPayload } from "./security";

const COOKIE_NAME = "puffy_cms_session";
const SESSION_SECONDS = 60 * 60;

export const CMS_VERIFIED_HEADER = "x-puffy-cms-verified";

export async function createCmsSession() {
  const payload = base64Url(JSON.stringify({ role: "developer", version: 1, expires: Date.now() + SESSION_SECONDS * 1000 }));
  return `${payload}.${await signPayload(payload)}`;
}

export async function verifyCmsSession(request: Request) {
  try {
    const rawCookie = request.headers.get("cookie") ?? "";
    const bearer = request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim();
    const token = bearer ?? rawCookie.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${COOKIE_NAME}=`))?.slice(COOKIE_NAME.length + 1);
    if (!token) return null;
    const [payload, provided] = token.split(".");
    if (!payload || !provided || !constantTimeEqual(provided, await signPayload(payload))) return null;
    const parsed = JSON.parse(fromBase64Url(payload)) as { role?: string; version?: number; expires?: number };
    if (parsed.role !== "developer" || parsed.version !== 1 || !parsed.expires || parsed.expires < Date.now()) return null;
    return { role: "developer" as const, expires: parsed.expires };
  } catch {
    return null;
  }
}

export const cmsSessionCookie = { name: COOKIE_NAME, maxAge: SESSION_SECONDS };
