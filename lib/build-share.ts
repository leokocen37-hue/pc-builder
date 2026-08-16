// Compact, URL-safe encoding of a configurator build for shareable links
// (?b=<encoded>). Encodes Shopify *handles*, not internal ids, so a link
// still resolves after a catalog refresh reassigns ids. Used by both
// Builder.tsx (client, encode + decode) and app/api/og/route.tsx (server,
// decode only) — must stay framework-agnostic (no client-only APIs).
export type BuildPartKey =
  | "cpu" | "mb" | "ram" | "gpu" | "gpu2" | "ssd" | "ssd2" | "hdd" | "hdd2"
  | "case" | "psu" | "cooler" | "os";

export const BUILD_PART_KEYS: BuildPartKey[] = [
  "cpu", "mb", "ram", "gpu", "gpu2", "ssd", "ssd2", "hdd", "hdd2", "case", "psu", "cooler", "os",
];

// Croatian label for each part, used in the "these parts changed" notice.
export const BUILD_PART_LABEL: Record<BuildPartKey, string> = {
  cpu: "Procesor",
  mb: "Matična ploča",
  ram: "Radna memorija",
  gpu: "Grafička kartica",
  gpu2: "2. grafička kartica",
  ssd: "Glavni SSD",
  ssd2: "Dodatni SSD",
  hdd: "Tvrdi disk",
  hdd2: "Dodatni tvrdi disk",
  case: "Kućište",
  psu: "Napajanje",
  cooler: "Hlađenje",
  os: "Operativni sustav",
};

// [handle, variantTitle?] — variantTitle omitted when it's the only/default variant
export type EncodedPart = [string] | [string, string];

export type EncodedBuild = {
  brand?: string;
  parts: Partial<Record<BuildPartKey, EncodedPart>>;
};

function toBase64Url(bytes: Uint8Array): string {
  let bin = "";
  bytes.forEach((byte) => { bin += String.fromCharCode(byte); });
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(s: string): Uint8Array {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  const pad = b64.length % 4 === 0 ? "" : "=".repeat(4 - (b64.length % 4));
  const bin = atob(b64 + pad);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

export function encodeBuild(build: EncodedBuild): string {
  return toBase64Url(new TextEncoder().encode(JSON.stringify(build)));
}

export function decodeBuild(encoded: string): EncodedBuild | null {
  try {
    const json = new TextDecoder().decode(fromBase64Url(encoded));
    const parsed = JSON.parse(json);
    if (!parsed || typeof parsed !== "object" || typeof parsed.parts !== "object") return null;
    return parsed as EncodedBuild;
  } catch {
    return null;
  }
}
