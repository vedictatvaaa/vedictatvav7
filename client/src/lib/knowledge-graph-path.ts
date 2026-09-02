const CANONICAL_PATH = /^(?:\/(?:puja|pandit|tirth|temple|product|blog|tirth-yatra)\/[a-z0-9]+(?:-[a-z0-9]+)*|\/pandit\/city\/[a-z0-9]+(?:-[a-z0-9]+)*)$/;
const BASE = "https://vedic-tatva.invalid";

/** Browser-independent defensive mirror of the public projection URL grammar. */
export function isSafeKnowledgeGraphPath(url: unknown): url is string {
  if (typeof url !== "string" || !CANONICAL_PATH.test(url) || url.includes("\\") || /%[0-9a-f]{2}/i.test(url)) return false;
  try {
    const parsed = new URL(url, BASE);
    return parsed.origin === BASE && parsed.pathname === url && !parsed.search && !parsed.hash;
  } catch { return false; }
}