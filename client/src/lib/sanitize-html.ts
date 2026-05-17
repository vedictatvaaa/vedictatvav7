import DOMPurify, { type Config } from "dompurify";

const RICH_TEXT_CONFIG: Config = {
  ALLOWED_TAGS: [
    "p", "br", "hr", "span", "div",
    "b", "strong", "i", "em", "u", "s", "small", "sub", "sup", "mark",
    "h1", "h2", "h3", "h4", "h5", "h6",
    "ul", "ol", "li",
    "blockquote", "pre", "code",
    "a", "img",
    "table", "thead", "tbody", "tr", "th", "td",
  ],
  ALLOWED_ATTR: ["href", "title", "alt", "src", "target", "rel", "class", "id", "name", "width", "height"],
  ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):|[#/])/i,
  FORBID_TAGS: ["script", "style", "iframe", "object", "embed", "form", "input", "button", "textarea", "select"],
  FORBID_ATTR: ["style", "onerror", "onload", "onclick", "onmouseover", "onfocus", "onblur", "onchange", "onsubmit"],
  ADD_ATTR: ["target"],
};

export function sanitizeHtml(input: string | null | undefined): string {
  if (!input) return "";
  return DOMPurify.sanitize(String(input), RICH_TEXT_CONFIG) as unknown as string;
}

if (typeof window !== "undefined") {
  DOMPurify.addHook("afterSanitizeAttributes", (node) => {
    if (node.tagName === "A") {
      const href = node.getAttribute("href") || "";
      if (/^https?:\/\//i.test(href)) {
        node.setAttribute("rel", "noopener noreferrer nofollow");
        if (!node.getAttribute("target")) node.setAttribute("target", "_blank");
      }
    }
  });
}
