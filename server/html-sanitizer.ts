export function sanitizeRichHtml(html: string): string {
  if (typeof html !== "string" || !html) return "";
  let out = html;
  out = out.replace(/<\s*(script|style|iframe|object|embed|link|meta|form|input|button|svg)[\s\S]*?<\s*\/\s*\1\s*>/gi, "");
  out = out.replace(/<\s*(script|style|iframe|object|embed|link|meta|form|input|button|svg)\b[^>]*\/?>/gi, "");
  out = out.replace(/\s+on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "");
  out = out.replace(/(href|src|xlink:href)\s*=\s*("|')\s*(javascript|vbscript|data)\s*:[^"']*\2/gi, "$1=$2#$2");
  out = out.replace(/\s+srcset\s*=\s*("[^"]*"|'[^']*')/gi, "");
  out = out.replace(/\s+style\s*=\s*("[^"]*"|'[^']*')/gi, "");
  return out;
}
