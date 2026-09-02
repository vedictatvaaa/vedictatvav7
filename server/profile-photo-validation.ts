import fs from "fs";
import path from "path";
import sharp from "sharp";

export type ProfilePhotoKind = "jpeg" | "png" | "gif" | "webp";
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const MAX_DIMENSION = 10_000;
const MAX_PIXELS = 40_000_000;

function extensionKind(filename: string): ProfilePhotoKind | null {
  const ext = path.extname(filename).toLowerCase();
  return ext === ".jpg" || ext === ".jpeg" ? "jpeg"
    : ext === ".png" ? "png" : ext === ".gif" ? "gif" : ext === ".webp" ? "webp" : null;
}

function hasNoTrailingJunk(bytes: Buffer, kind: ProfilePhotoKind): boolean {
  if (kind === "jpeg") return bytes.length >= 2 && bytes.subarray(-2).equals(Buffer.from([0xff, 0xd9]));
  if (kind === "png") return bytes.length >= 12
    && bytes.subarray(-12).equals(Buffer.from([0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130]));
  if (kind === "gif") return bytes.length >= 1 && bytes[bytes.length - 1] === 0x3b;
  return bytes.length >= 12 && bytes.subarray(0, 4).toString("ascii") === "RIFF"
    && bytes.readUInt32LE(4) + 8 === bytes.length
    && bytes.subarray(8, 12).toString("ascii") === "WEBP";
}

async function isValidImage(bytes: Buffer, expected: ProfilePhotoKind): Promise<boolean> {
  if (bytes.length < 3 || bytes.length > MAX_FILE_BYTES || !hasNoTrailingJunk(bytes, expected)) return false;
  try {
    const image = sharp(bytes, { failOn: "error", limitInputPixels: MAX_PIXELS });
    const metadata = await image.metadata();
    if (metadata.format !== expected || !metadata.width || !metadata.height
      || metadata.width > MAX_DIMENSION || metadata.height > MAX_DIMENSION
      || metadata.width * metadata.height > MAX_PIXELS) return false;
    // Force a full decoder pass rather than trusting a magic prefix/metadata.
    await image.rotate().toBuffer();
    return true;
  } catch {
    return false;
  }
}

export async function isValidStoredProfilePhoto(value: unknown, uploadsDir: string): Promise<boolean> {
  if (typeof value !== "string" || value.trim() !== value || !value) return false;
  if (value.startsWith("/uploads/")) {
    const relative = value.slice("/uploads/".length);
    if (!relative || relative.includes("..") || path.isAbsolute(relative)) return false;
    const root = path.resolve(uploadsDir);
    const filePath = path.resolve(root, relative);
    if (!filePath.startsWith(root + path.sep)) return false;
    try {
      const stat = fs.statSync(filePath);
      if (!stat.isFile() || stat.size < 3 || stat.size > MAX_FILE_BYTES) return false;
      const kind = extensionKind(filePath);
      if (!kind) return false;
      return isValidImage(fs.readFileSync(filePath), kind);
    } catch {
      return false;
    }
  }
  const match = /^data:image\/(jpeg|png|gif|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(value);
  if (!match || match[2].length > 14 * 1024 * 1024) return false;
  try {
    const bytes = Buffer.from(match[2], "base64");
    if (bytes.length < 3 || bytes.length > MAX_FILE_BYTES
      || bytes.toString("base64").replace(/=+$/, "") !== match[2].replace(/=+$/, "")) return false;
    return isValidImage(bytes, match[1] as ProfilePhotoKind);
  } catch {
    return false;
  }
}