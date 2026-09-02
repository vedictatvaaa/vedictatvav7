import fs from "fs";
import path from "path";

export type ProfilePhotoKind = "jpeg" | "png" | "gif" | "webp";

export function profilePhotoKind(bytes: Buffer): ProfilePhotoKind | null {
  if (bytes.length < 3) return null;
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpeg";
  if (bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return "png";
  if (bytes.subarray(0, 3).toString("ascii") === "GIF") return "gif";
  if (bytes.length >= 12 && bytes.subarray(0, 4).toString("ascii") === "RIFF"
    && bytes.subarray(8, 12).toString("ascii") === "WEBP") return "webp";
  return null;
}

function extensionKind(filename: string): ProfilePhotoKind | null {
  const ext = path.extname(filename).toLowerCase();
  return ext === ".jpg" || ext === ".jpeg" ? "jpeg"
    : ext === ".png" ? "png" : ext === ".gif" ? "gif" : ext === ".webp" ? "webp" : null;
}

export function isValidStoredProfilePhoto(value: unknown, uploadsDir: string): value is string {
  if (typeof value !== "string" || value.trim() !== value || !value) return false;
  if (value.startsWith("/uploads/")) {
    const relative = value.slice("/uploads/".length);
    if (!relative || relative.includes("..") || path.isAbsolute(relative)) return false;
    const root = path.resolve(uploadsDir);
    const filePath = path.resolve(root, relative);
    if (!filePath.startsWith(root + path.sep)) return false;
    try {
      const stat = fs.statSync(filePath);
      if (!stat.isFile() || stat.size < 3 || stat.size > 10 * 1024 * 1024) return false;
      const kind = extensionKind(filePath);
      if (!kind) return false;
      const descriptor = fs.openSync(filePath, "r");
      try {
        const header = Buffer.alloc(Math.min(12, stat.size));
        fs.readSync(descriptor, header, 0, header.length, 0);
        return profilePhotoKind(header) === kind;
      } finally {
        fs.closeSync(descriptor);
      }
    } catch {
      return false;
    }
  }
  const match = /^data:image\/(jpeg|png|gif|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(value);
  if (!match || match[2].length > 14 * 1024 * 1024) return false;
  try {
    const bytes = Buffer.from(match[2], "base64");
    if (bytes.length < 3 || bytes.length > 10 * 1024 * 1024
      || bytes.toString("base64").replace(/=+$/, "") !== match[2].replace(/=+$/, "")) return false;
    return profilePhotoKind(bytes) === match[1];
  } catch {
    return false;
  }
}