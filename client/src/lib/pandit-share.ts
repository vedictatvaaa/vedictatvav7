export type ShareAction = "native" | "whatsapp" | "facebook" | "copy" | "story_download" | "story_native";

const DEFAULT_PUBLIC_ORIGIN = "https://vedictatva.com";

export function canonicalShareUrl(value: string, origin = DEFAULT_PUBLIC_ORIGIN) {
  try {
    return new URL(value, origin || "https://vedic-tatva.example").toString();
  } catch {
    return value;
  }
}

export function whatsappShareUrl(url: string, title: string) {
  return `https://wa.me/?text=${encodeURIComponent(`${title} — ${url}`)}`;
}

export function facebookShareUrl(url: string) {
  return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
}

export async function shareUrl(url: string, title: string) {
  if (typeof navigator === "undefined" || typeof navigator.share !== "function") return false;
  try {
    await navigator.share({ title, text: `Discover ${title} on Vedic Tatva`, url });
    return true;
  } catch (error) {
    if ((error as DOMException)?.name === "AbortError") return false;
    throw error;
  }
}

export async function copyShareUrl(url: string) {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(url);
    return true;
  }
  if (typeof document === "undefined") return false;
  const input = document.createElement("textarea");
  input.value = url;
  input.setAttribute("readonly", "");
  input.style.position = "fixed";
  input.style.opacity = "0";
  document.body.appendChild(input);
  input.select();
  const copied = document.execCommand("copy");
  input.remove();
  return copied;
}

export async function fetchStoryFile(storyUrl: string, name = "vedic-tatva-story.jpg") {
  const response = await fetch(storyUrl, { credentials: "same-origin" });
  if (!response.ok) throw new Error("Story image could not be prepared.");
  const blob = await response.blob();
  return new File([blob], name, { type: blob.type || "image/jpeg" });
}

export function canShareStoryFile(file: File) {
  return typeof navigator !== "undefined" && typeof navigator.canShare === "function" && navigator.canShare({ files: [file] });
}

export async function shareStoryFile(file: File, title: string): Promise<"shared" | "cancelled" | "unsupported"> {
  if (!canShareStoryFile(file) || typeof navigator.share !== "function") return "unsupported";
  try {
    await navigator.share({ title, files: [file] });
    return "shared";
  } catch (error) {
    if ((error as DOMException)?.name === "AbortError") return "cancelled";
    throw error;
  }
}

export function downloadStoryFile(file: File) {
  if (typeof document === "undefined") return;
  const href = URL.createObjectURL(file);
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.download = file.name;
  anchor.rel = "noopener";
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(href), 1000);
}