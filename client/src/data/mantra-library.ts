// Re-export shim — canonical source lives in shared/ so the server-side
// OG card resolver can build per-mantra share cards without crossing the
// client/server boundary.
export * from "@shared/mantra-library";
