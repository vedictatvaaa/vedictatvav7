#!/usr/bin/env node
// One-shot color rewrite for client/src/pages/admin.tsx — replaces the
// parallel custom palettes (vedic-custom maroon/cream/brown + Amazon
// orange/navy) with semantic shadcn tokens (primary, secondary, muted,
// accent, border, foreground, muted-foreground).
//
// Run via: node scripts/admin-color-unify.mjs

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const FILE = resolve(process.cwd(), "client/src/pages/admin.tsx");

// Hex (lowercase canonical) → semantic token name (no utility prefix).
// `text-`, `bg-`, `border-`, etc. prefixes are added per match.
const TOKEN = {
  // Brown text shades
  "5a4a3a": "muted-foreground",
  "6b5a4a": "muted-foreground",
  // Dark heading text
  "2a1a0a": "foreground",
  // Admin maroon + Amazon dark navy → primary
  "8b1a1a": "primary",
  "232f3e": "primary",
  // Canonical primary maroon
  "6d2b35": "primary",
  // Admin gold + canonical secondary
  "8b6914": "secondary",
  "d4af37": "secondary",
  // Amazon orange CTAs (primary action color)
  "ff9900": "primary",
  "e68a00": "primary",
  // Cream backgrounds → muted
  "f5f0e8": "muted",
  "faf7f2": "muted",
  "fdf6ee": "muted",
  "fdf6e3": "muted",
  "f8f5ef": "muted",
  "f5f0e6": "muted",
  "ece7da": "muted",
  // Cream / light gray dividers → border
  "e8dfd0": "border",
  "d5d9d9": "border",
  // Second-pass: variants missed in first pass
  "a02020": "primary",       // admin maroon hover variant
  "5a2330": "primary",       // dark maroon
  "37475a": "primary",       // Amazon navy variant
  "e8d5a8": "secondary",     // pale gold accent
  "ffb347": "secondary",     // orange variant
  "ffa726": "secondary",     // orange variant
  "c9a22e": "secondary",     // gold variant
  "f5d76e": "secondary",     // pale gold
  "fff8ee": "muted",         // pale cream
  "fff8e7": "muted",
  "fff8e1": "muted",
  "f5efe3": "muted",
  "f0ebe0": "muted",
  "faf7f0": "muted",
  "f5e9d4": "muted",
  "3a2a1a": "foreground",    // dark brown headings
  "1a1a1a": "foreground",    // near-black
};

// Tailwind palette → semantic token replacements.
// Status colors (emerald/red/amber/yellow/blue) carry meaning and stay,
// but neutral grays/whites should use the semantic tokens.
const PALETTE_MAP = {
  "text-gray-400": "text-muted-foreground/60",
  "text-gray-500": "text-muted-foreground",
  "text-gray-600": "text-muted-foreground",
  "text-gray-700": "text-foreground",
  "text-gray-800": "text-foreground",
  "text-gray-900": "text-foreground",
  "bg-gray-50":  "bg-muted/50",
  "bg-gray-100": "bg-muted",
  "bg-gray-200": "bg-muted",
  "border-gray-100": "border-border",
  "border-gray-200": "border-border",
  "border-gray-300": "border-border",
  "bg-white": "bg-card",
  "border-white": "border-card",
};

// When a utility expects a foreground-paired token (e.g. `bg-primary`
// implies surrounding text should be `text-primary-foreground`), this
// expansion is left to manual review; the bulk script just maps colors.

const UTIL_PREFIXES = [
  "text", "bg", "border", "from", "to", "via",
  "ring", "fill", "stroke", "placeholder", "divide",
  "outline", "accent", "decoration", "shadow",
  // border-side variants
  "border-t", "border-b", "border-l", "border-r",
  "border-x", "border-y",
];

let src = readFileSync(FILE, "utf8");
const original = src;
const stats = {};
const bump = (key) => { stats[key] = (stats[key] || 0) + 1; };

// 1) Replace `prefix-[#HEX]` (with optional /opacity suffix and optional
//    hover:/focus:/active:/dark:/group-hover: state prefixes).
//    Also handles uppercase hex.
for (const [hexLower, token] of Object.entries(TOKEN)) {
  for (const prefix of UTIL_PREFIXES) {
    // Build a regex like:
    //   \b(?:hover:|focus:|active:|dark:|group-hover:|md:|lg:|sm:)*text-\[#FF9900\](\/\d+)?
    const hexAlt = `[${hexLower[0]}${hexLower[0].toUpperCase()}]` +
      `[${hexLower[1]}${hexLower[1].toUpperCase()}]` +
      `[${hexLower[2]}${hexLower[2].toUpperCase()}]` +
      `[${hexLower[3]}${hexLower[3].toUpperCase()}]` +
      `[${hexLower[4]}${hexLower[4].toUpperCase()}]` +
      `[${hexLower[5]}${hexLower[5].toUpperCase()}]`;
    const re = new RegExp(
      `(?<state>(?:hover:|focus:|active:|dark:|group-hover:|md:|lg:|sm:|xl:)*)` +
      `${prefix}-\\[#${hexAlt}\\](?<op>\\/\\d+)?`,
      "g",
    );
    src = src.replace(re, (_m, state, op) => {
      const key = `${prefix}-[#${hexLower}]${op || ""}`;
      bump(`${state || ""}${key} -> ${state || ""}${prefix}-${token}${op || ""}`);
      return `${state || ""}${prefix}-${token}${op || ""}`;
    });
  }
}

// 1b) Tailwind palette → semantic token (whole-class replacement,
//      preserving any state prefix like hover:/dark:/etc).
for (const [from, to] of Object.entries(PALETTE_MAP)) {
  const re = new RegExp(
    `(?<state>(?:hover:|focus:|active:|dark:|group-hover:|md:|lg:|sm:|xl:)*)` +
    from.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&") +
    `\\b`,
    "g",
  );
  src = src.replace(re, (_m, state) => {
    bump(`${state || ""}${from} -> ${state || ""}${to}`);
    return `${state || ""}${to}`;
  });
}

// 2) Inline style values: `"#HEX"`. Map color/borderColor/background/etc.
//    Replace ": \"#HEX\"" with ": \"hsl(var(--token))\"" .
for (const [hexLower, token] of Object.entries(TOKEN)) {
  const hexAlt = hexLower.split("").map((c) => /[a-f]/.test(c) ? `[${c}${c.toUpperCase()}]` : c).join("");
  const re = new RegExp(`"#${hexAlt}"`, "g");
  src = src.replace(re, () => {
    bump(`inline #${hexLower} -> var(--${token})`);
    return `"hsl(var(--${token}))"`;
  });
}

// 3) Backgrounds: `style={{ backgroundColor: "#HEX" }}` already handled
//    by the inline-style step above.

// 4) Sanity: warn about unmapped hex colors that remain
const remaining = new Set();
const hexRe = /#[0-9a-fA-F]{6}\b/g;
let m;
while ((m = hexRe.exec(src)) !== null) remaining.add(m[0].toLowerCase());

writeFileSync(FILE, src, "utf8");

const before = (original.match(/#[0-9a-fA-F]{6}\b/g) || []).length;
const after = (src.match(/#[0-9a-fA-F]{6}\b/g) || []).length;

console.log(`\n=== Color unify report ===`);
console.log(`Hex literals before: ${before}`);
console.log(`Hex literals after:  ${after}`);
console.log(`Removed: ${before - after}`);
console.log(`\n=== Top transformations ===`);
const sorted = Object.entries(stats).sort((a, b) => b[1] - a[1]).slice(0, 25);
for (const [key, count] of sorted) console.log(`  ${count.toString().padStart(4)}  ${key}`);

if (remaining.size > 0) {
  console.log(`\n=== Remaining hex literals (manual review) ===`);
  for (const hex of remaining) console.log(`  ${hex}`);
}
