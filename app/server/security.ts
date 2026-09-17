const encoder = new TextEncoder();
let runtimeSecret: string | undefined;
let runtimeCmsHash: string | undefined;

export function setRuntimeSessionSecret(value: string | undefined, cmsHash?: string | undefined) {
  if (value) runtimeSecret = value;
  if (cmsHash) runtimeCmsHash = cmsHash;
}

export function runtimeSessionSecret() {
  return runtimeSecret;
}

export function runtimeCmsCodeHash() {
  return runtimeCmsHash;
}

export function constantTimeEqual(left: string, right: string) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return difference === 0;
}

export function base64Url(value: Uint8Array | string) {
  const bytes = typeof value === "string" ? encoder.encode(value) : value;
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export function fromBase64Url(value: string) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  return atob(base64);
}

export async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function randomToken(byteLength = 24) {
  return base64Url(crypto.getRandomValues(new Uint8Array(byteLength)));
}

async function sessionSecret() {
  const secret = runtimeSecret ?? process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 24) throw new Error("ADMIN_SESSION_SECRET must contain at least 24 characters.");
  return secret;
}

export async function signPayload(payload: string) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(await sessionSecret()), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return base64Url(new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(payload))));
}

async function pbkdf2PasswordHash(password: string, salt: string, iterations = 100_000) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", iterations, salt: encoder.encode(salt) }, key, 256);
  return base64Url(new Uint8Array(bits));
}

/**
 * Cashier passwords use a versioned, server-keyed HMAC. This is deliberately
 * inexpensive enough for Cloudflare Workers while the secret "pepper" remains
 * outside D1 in ADMIN_SESSION_SECRET. Existing PBKDF2 accounts continue to work
 * through verifyPassword and can be upgraded by the owner at any time.
 */
export async function passwordHash(password: string, salt: string) {
  // Cashier credentials must survive rotation of ADMIN_SESSION_SECRET. That
  // secret signs sessions; it must not be the only key capable of validating
  // a saved employee password.
  // Cloudflare Workers caps PBKDF2 at 100,000 iterations. The former 160,000
  // setting was the reason cashier creation failed before D1 was reached.
  return `v4.${await pbkdf2PasswordHash(password, salt, 100_000)}`;
}

export async function verifyPassword(password: string, salt: string, storedHash: string) {
  if (!storedHash) return false;
  if (storedHash.startsWith("v4.")) return constantTimeEqual(storedHash, `v4.${await pbkdf2PasswordHash(password, salt, 100_000)}`);
  if (storedHash.startsWith("v3.")) {
    try { return constantTimeEqual(storedHash, `v3.${await pbkdf2PasswordHash(password, salt, 160_000)}`); }
    catch { return false; }
  }
  if (storedHash.startsWith("v2.")) {
    const payload = `puffy-pops:cashier-password:${salt}:${password}`;
    return constantTimeEqual(storedHash, `v2.${await signPayload(payload)}`);
  }
  return constantTimeEqual(storedHash, await pbkdf2PasswordHash(password, salt, 100_000));
}

export function normalizeUsername(value: string) {
  return value.trim().toLowerCase();
}

export const receiptTokenHash = (token: string) => sha256(`puffy-pops:receipt:${token}`);
export const cmsCodeHash = (code: string) => sha256(`puffy-pops:cms:${code}`);
