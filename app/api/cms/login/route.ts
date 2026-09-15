import { cmsSessionCookie, createCmsSession } from "../../../server/cms-session";
import { cmsCodeHash, constantTimeEqual, runtimeCmsCodeHash } from "../../../server/security";

async function cmsHash() {
  return (runtimeCmsCodeHash() ?? process.env.CMS_CODE_HASH ?? "").trim().toLowerCase();
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({})) as { password?: string };
  const expected = await cmsHash();
  const provided = await cmsCodeHash(body.password ?? "");
  if (expected.length !== 64 || !constantTimeEqual(expected, provided)) return Response.json({ error: "Incorrect developer password." }, { status: 401 });
  const token = await createCmsSession();
  const secure = new URL(request.url).protocol === "https:";
  return new Response(JSON.stringify({ ok: true, token, role: "developer", expiresIn: cmsSessionCookie.maxAge }), { headers: { "content-type": "application/json", "cache-control": "no-store", "set-cookie": `${cmsSessionCookie.name}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${cmsSessionCookie.maxAge}${secure ? "; Secure" : ""}` } });
}

export async function DELETE(request: Request) {
  const secure = new URL(request.url).protocol === "https:";
  return new Response(JSON.stringify({ ok: true }), { headers: { "content-type": "application/json", "set-cookie": `${cmsSessionCookie.name}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secure ? "; Secure" : ""}` } });
}
