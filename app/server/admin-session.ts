import { branches } from "../catalog";
import { runtimeSessionSecret } from "./security";

const COOKIE_NAME = "puffy_branch_session";
const SESSION_VERSION = 2;
const OWNER_SESSION_SECONDS = 30 * 60;
const BRANCH_SESSION_SECONDS = 12 * 60 * 60;
const encoder = new TextEncoder();
let runtimeAccessConfig: Record<string, string | undefined> = {};

export function setRuntimeAccessConfig(values: Record<string, string | undefined>) {
  runtimeAccessConfig = { ...values };
}

export const VERIFIED_ADMIN_ROLE_HEADER = "x-puffy-verified-admin-role";
export const VERIFIED_ADMIN_BRANCH_HEADER = "x-puffy-verified-admin-branch";
export const VERIFIED_ADMIN_EXPIRES_HEADER = "x-puffy-verified-admin-expires";

export type AdminIdentity =
  | { role: "branch"; branchId: string }
  | { role: "owner" };

async function config() {
  // The public Worker injects its bindings before the app router runs. Keeping
  // this bridge explicit avoids a dynamic cloudflare:workers import inside the
  // compiled route bundle, which broke native-app login in some deployments.
  return { ...process.env, ...runtimeAccessConfig, ADMIN_SESSION_SECRET: runtimeSessionSecret() ?? runtimeAccessConfig.ADMIN_SESSION_SECRET ?? process.env.ADMIN_SESSION_SECRET } as Record<string, string | undefined>;
}

function branchCodeHashKey(branchId: string) {
  return `ADMIN_CODE_HASH_${branchId.toUpperCase().replace(/-/g, "_")}`;
}

function constantTimeEqual(left: string, right: string) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}

async function accessCodeHash(scope: string, code: string) {
  const normalized = code.trim().toUpperCase();
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(`puffy-pops:${scope}:${normalized}`));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function base64Url(value: Uint8Array | string) {
  const bytes = typeof value === "string" ? encoder.encode(value) : value;
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(value: string) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  return atob(base64);
}

async function signature(payload: string, secretOverride?: string) {
  const secret = secretOverride ?? (await config()).ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 24) throw new Error("ADMIN_SESSION_SECRET must contain at least 24 characters.");
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return base64Url(new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(payload))));
}

export async function resolveAccessFromCode(code: string): Promise<AdminIdentity | null> {
  if (!code.trim()) return null;
  const values = await config();
  let matched: AdminIdentity | null = null;

  const ownerExpected = values.OWNER_CODE_HASH?.trim().toLowerCase() ?? "";
  const ownerProvided = await accessCodeHash("owner", code);
  if (ownerExpected.length === 64 && constantTimeEqual(ownerExpected, ownerProvided)) matched = { role: "owner" };

  for (const branch of branches) {
    const expected = values[branchCodeHashKey(branch.id)]?.trim().toLowerCase() ?? "";
    const provided = await accessCodeHash(branch.id, code);
    if (expected.length === 64 && constantTimeEqual(expected, provided)) matched = { role: "branch", branchId: branch.id };
  }

  return matched;
}

export async function createSession(identity: AdminIdentity) {
  const maxAge = identity.role === "owner" ? OWNER_SESSION_SECONDS : BRANCH_SESSION_SECONDS;
  const payload = base64Url(JSON.stringify({ ...identity, version: SESSION_VERSION, expires: Date.now() + maxAge * 1000 }));
  return `${payload}.${await signature(payload)}`;
}

export function sessionMaxAge(identity: AdminIdentity) {
  return identity.role === "owner" ? OWNER_SESSION_SECONDS : BRANCH_SESSION_SECONDS;
}

export async function verifySession(request: Request, secretOverride?: string, trustWorkerHeaders = true) {
  try {
    if (trustWorkerHeaders) {
      const verifiedRole = request.headers.get(VERIFIED_ADMIN_ROLE_HEADER);
      const verifiedBranch = request.headers.get(VERIFIED_ADMIN_BRANCH_HEADER);
      const verifiedExpires = Number(request.headers.get(VERIFIED_ADMIN_EXPIRES_HEADER));
      if (verifiedRole === "owner" && verifiedExpires > Date.now()) return { role: "owner" as const, expires: verifiedExpires };
      if (verifiedRole === "branch" && verifiedBranch && verifiedExpires > Date.now() && branches.some((branch) => branch.id === verifiedBranch)) {
        return { role: "branch" as const, branchId: verifiedBranch, expires: verifiedExpires };
      }
    }
    const rawCookie = request.headers.get("cookie") ?? "";
    const bearer = request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim();
    const token = bearer ?? rawCookie.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${COOKIE_NAME}=`))?.slice(COOKIE_NAME.length + 1);
    if (!token) return null;
    const [payload, provided] = token.split(".");
    if (!payload || !provided || !constantTimeEqual(provided, await signature(payload, secretOverride))) return null;
    const parsed = JSON.parse(fromBase64Url(payload)) as { role?: string; branchId?: string; version?: number; expires: number };
    if (parsed.version !== SESSION_VERSION || parsed.expires < Date.now()) return null;
    if (parsed.role === "owner") return { role: "owner" as const, expires: parsed.expires };
    if ((parsed.role === "branch" || !parsed.role) && parsed.branchId && branches.some((branch) => branch.id === parsed.branchId)) {
      return { role: "branch" as const, branchId: parsed.branchId, expires: parsed.expires };
    }
    return null;
  } catch {
    return null;
  }
}

export const sessionCookie = {
  name: COOKIE_NAME,
  options: { httpOnly: true, sameSite: "lax" as const, secure: true, path: "/" },
};
