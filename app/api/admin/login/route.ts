import { createSession, resolveAccessFromCode, sessionCookie, sessionMaxAge } from "../../../server/admin-session";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({})) as { code?: string };
  const code = body.code?.trim() ?? "";
  const identity = await resolveAccessFromCode(code);
  if (!identity) return Response.json({ error: "That access code is incorrect." }, { status: 401 });
  try {
    const token = await createSession(identity);
    const secure = new URL(request.url).protocol === "https:";
    const cookie = `${sessionCookie.name}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${sessionMaxAge(identity)}${secure ? "; Secure" : ""}`;
    const destination = identity.role === "owner" ? "/admin/owner" : "/admin/dashboard";
    return new Response(JSON.stringify({ ok: true, role: identity.role, destination }), { status: 200, headers: { "content-type": "application/json", "set-cookie": cookie } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Admin session is not configured." }, { status: 503 });
  }
}

export async function DELETE(request: Request) {
  const secure = new URL(request.url).protocol === "https:";
  return new Response(JSON.stringify({ ok: true }), { headers: { "content-type": "application/json", "set-cookie": `${sessionCookie.name}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure ? "; Secure" : ""}` } });
}
