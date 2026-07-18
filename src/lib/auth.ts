export const SESSION_COOKIE = "tt_session";

async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Deterministic token derived from the shared household PIN — never store the PIN itself in the cookie. */
export async function expectedSessionToken(): Promise<string> {
  const pin = process.env.THERAPYTRACK_PIN;
  const secret = process.env.THERAPYTRACK_SESSION_SECRET ?? "therapytrack-dev-secret";
  if (!pin) throw new Error("THERAPYTRACK_PIN no esta configurado");
  return sha256Hex(`${pin}:${secret}`);
}

export function verifyPin(candidate: string): boolean {
  const pin = process.env.THERAPYTRACK_PIN;
  return Boolean(pin) && candidate === pin;
}
