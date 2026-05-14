/**
 * Cloud backup destinations for Vedic Tatva.
 *
 * One provider is active at a time, chosen by BACKUP_CLOUD_PROVIDER:
 *   - "r2"  Cloudflare R2 (S3-compatible, recommended — no egress fees)
 *   - "b2"  Backblaze B2 (S3-compatible)
 *   - "s3"  AWS S3
 *   - "gcs" Google Cloud Storage
 *   - ""    disabled (default)
 *
 * Required env vars by provider:
 *   r2 / b2 / s3:
 *     BACKUP_S3_BUCKET
 *     BACKUP_S3_REGION         (auto for r2, e.g. us-east-1 for s3)
 *     BACKUP_S3_ENDPOINT       (required for r2 + b2, blank for s3)
 *     BACKUP_S3_ACCESS_KEY_ID
 *     BACKUP_S3_SECRET_ACCESS_KEY
 *     BACKUP_S3_PREFIX         (optional, default "vedictatva-backups/")
 *
 *   gcs:
 *     BACKUP_GCS_BUCKET
 *     GOOGLE_SERVICE_ACCOUNT_JSON   (the entire JSON key, single line)
 *     BACKUP_GCS_PREFIX        (optional, default "vedictatva-backups/")
 *
 * Best-effort: a cloud failure must never block the local pg_dump or the
 * request loop. Every public function returns {ok, ...} and never throws.
 */

import fs from "fs";
import path from "path";

export type CloudProviderId = "r2" | "b2" | "s3" | "gcs" | "";

export type CloudObject = {
  key: string;
  size: number;
  mtime: string;
};

export type CloudStatus = {
  provider: CloudProviderId;
  label: string;
  configured: boolean;
  bucket?: string;
  prefix?: string;
  reason?: string;
};

const PROVIDER_LABELS: Record<Exclude<CloudProviderId, "">, string> = {
  r2: "Cloudflare R2",
  b2: "Backblaze B2",
  s3: "AWS S3",
  gcs: "Google Cloud Storage",
};

function readProvider(): CloudProviderId {
  const raw = String(process.env.BACKUP_CLOUD_PROVIDER || "").toLowerCase().trim();
  if (raw === "r2" || raw === "b2" || raw === "s3" || raw === "gcs") return raw;
  return "";
}

function s3Prefix(): string {
  const raw = String(process.env.BACKUP_S3_PREFIX || "vedictatva-backups/");
  return raw.endsWith("/") ? raw : raw + "/";
}

function gcsPrefix(): string {
  const raw = String(process.env.BACKUP_GCS_PREFIX || "vedictatva-backups/");
  return raw.endsWith("/") ? raw : raw + "/";
}

export function getCloudStatus(): CloudStatus {
  const provider = readProvider();
  if (!provider) {
    return {
      provider: "",
      label: "Cloud backups disabled",
      configured: false,
      reason: "Set BACKUP_CLOUD_PROVIDER to r2, b2, s3, or gcs.",
    };
  }
  const label = PROVIDER_LABELS[provider];
  if (provider === "gcs") {
    const bucket = process.env.BACKUP_GCS_BUCKET;
    const json = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
    if (!bucket || !json) {
      return {
        provider,
        label,
        configured: false,
        reason: "Missing BACKUP_GCS_BUCKET or GOOGLE_SERVICE_ACCOUNT_JSON.",
      };
    }
    // Validate JSON shape now so the status card doesn't show "Active"
    // while uploads silently fail. Required fields per Google service-account key.
    try {
      const parsed = JSON.parse(json);
      if (!parsed.client_email || !parsed.private_key || !parsed.project_id) {
        return {
          provider,
          label,
          configured: false,
          reason: "GOOGLE_SERVICE_ACCOUNT_JSON missing client_email / private_key / project_id.",
        };
      }
    } catch {
      return {
        provider,
        label,
        configured: false,
        reason: "GOOGLE_SERVICE_ACCOUNT_JSON is not valid JSON.",
      };
    }
    return { provider, label, configured: true, bucket, prefix: gcsPrefix() };
  }
  // s3-compatible
  const bucket = process.env.BACKUP_S3_BUCKET;
  const accessKey = process.env.BACKUP_S3_ACCESS_KEY_ID;
  const secretKey = process.env.BACKUP_S3_SECRET_ACCESS_KEY;
  const endpoint = process.env.BACKUP_S3_ENDPOINT;
  const missing: string[] = [];
  if (!bucket) missing.push("BACKUP_S3_BUCKET");
  if (!accessKey) missing.push("BACKUP_S3_ACCESS_KEY_ID");
  if (!secretKey) missing.push("BACKUP_S3_SECRET_ACCESS_KEY");
  if ((provider === "r2" || provider === "b2") && !endpoint) missing.push("BACKUP_S3_ENDPOINT");
  if (missing.length) {
    return {
      provider,
      label,
      configured: false,
      reason: "Missing: " + missing.join(", "),
    };
  }
  return { provider, label, configured: true, bucket, prefix: s3Prefix() };
}

// ---- S3 client (lazy) ----
let s3ClientCache: any = null;
let s3ClientKey = "";

async function getS3Client(): Promise<any> {
  const provider = readProvider();
  const region =
    process.env.BACKUP_S3_REGION ||
    (provider === "r2" ? "auto" : "us-east-1");
  const endpoint = process.env.BACKUP_S3_ENDPOINT || undefined;
  const accessKeyId = process.env.BACKUP_S3_ACCESS_KEY_ID || "";
  const secretAccessKey = process.env.BACKUP_S3_SECRET_ACCESS_KEY || "";
  const cacheKey = `${provider}|${region}|${endpoint}|${accessKeyId.slice(0, 6)}`;
  if (s3ClientCache && s3ClientKey === cacheKey) return s3ClientCache;
  const mod: any = await import("@aws-sdk/client-s3");
  s3ClientCache = new mod.S3Client({
    region,
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
    // R2 requires this to avoid checksum-related 400s on streamed uploads
    forcePathStyle: provider === "b2",
  });
  s3ClientKey = cacheKey;
  return s3ClientCache;
}

async function getS3Mod(): Promise<any> {
  return await import("@aws-sdk/client-s3");
}

// ---- GCS bucket (lazy) ----
let gcsBucketCache: any = null;

async function getGcsBucket(): Promise<any> {
  if (gcsBucketCache) return gcsBucketCache;
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON || "";
  let creds: any = null;
  try {
    creds = JSON.parse(raw);
  } catch {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON is not valid JSON");
  }
  const mod: any = await import("@google-cloud/storage");
  const storage = new mod.Storage({
    projectId: creds.project_id,
    credentials: {
      client_email: creds.client_email,
      private_key: creds.private_key,
    },
  });
  gcsBucketCache = storage.bucket(process.env.BACKUP_GCS_BUCKET || "");
  return gcsBucketCache;
}

// ---- Public API ----

export async function uploadBackupToCloud(
  localFilePath: string,
  filename: string,
): Promise<{ ok: boolean; key?: string; provider?: CloudProviderId; error?: string }> {
  const status = getCloudStatus();
  if (!status.configured) {
    return { ok: false, error: status.reason || "Cloud not configured" };
  }
  if (!fs.existsSync(localFilePath)) {
    return { ok: false, error: "Local file not found: " + localFilePath };
  }
  try {
    if (status.provider === "gcs") {
      const bucket = await getGcsBucket();
      const key = gcsPrefix() + filename;
      await bucket.upload(localFilePath, {
        destination: key,
        metadata: {
          contentType: "application/gzip",
          cacheControl: "private, max-age=0",
        },
        resumable: false,
      });
      return { ok: true, key, provider: status.provider };
    }
    // s3-compatible
    const client = await getS3Client();
    const mod = await getS3Mod();
    const key = s3Prefix() + filename;
    const stat = fs.statSync(localFilePath);
    const stream = fs.createReadStream(localFilePath);
    await client.send(
      new mod.PutObjectCommand({
        Bucket: process.env.BACKUP_S3_BUCKET,
        Key: key,
        Body: stream,
        ContentType: "application/gzip",
        ContentLength: stat.size,
      }),
    );
    return { ok: true, key, provider: status.provider };
  } catch (err: any) {
    const msg = err?.message || String(err);
    console.warn(`[backup-cloud] upload failed (${status.provider}): ${msg}`);
    return { ok: false, error: msg, provider: status.provider };
  }
}

export async function listCloudBackups(): Promise<{
  ok: boolean;
  files: CloudObject[];
  totalBytes: number;
  error?: string;
}> {
  const status = getCloudStatus();
  if (!status.configured) {
    return { ok: false, files: [], totalBytes: 0, error: status.reason };
  }
  try {
    if (status.provider === "gcs") {
      const bucket = await getGcsBucket();
      const [files] = await bucket.getFiles({ prefix: gcsPrefix() });
      const out: CloudObject[] = files
        .map((f: any) => ({
          key: f.name,
          size: Number(f.metadata?.size || 0),
          mtime: f.metadata?.updated || f.metadata?.timeCreated || new Date(0).toISOString(),
        }))
        .filter((o: CloudObject) => o.key.endsWith(".sql.gz"))
        .sort((a: CloudObject, b: CloudObject) => (a.mtime < b.mtime ? 1 : -1));
      return { ok: true, files: out, totalBytes: out.reduce((s, o) => s + o.size, 0) };
    }
    const client = await getS3Client();
    const mod = await getS3Mod();
    const out: CloudObject[] = [];
    let token: string | undefined;
    // Paginate but cap defensively
    for (let i = 0; i < 10; i++) {
      const resp: any = await client.send(
        new mod.ListObjectsV2Command({
          Bucket: process.env.BACKUP_S3_BUCKET,
          Prefix: s3Prefix(),
          ContinuationToken: token,
          MaxKeys: 1000,
        }),
      );
      for (const item of resp.Contents || []) {
        if (!item.Key || !item.Key.endsWith(".sql.gz")) continue;
        out.push({
          key: item.Key,
          size: Number(item.Size || 0),
          mtime: (item.LastModified instanceof Date ? item.LastModified : new Date()).toISOString(),
        });
      }
      if (!resp.IsTruncated) break;
      token = resp.NextContinuationToken;
    }
    out.sort((a, b) => (a.mtime < b.mtime ? 1 : -1));
    return { ok: true, files: out, totalBytes: out.reduce((s, o) => s + o.size, 0) };
  } catch (err: any) {
    const msg = err?.message || String(err);
    console.warn(`[backup-cloud] list failed: ${msg}`);
    return { ok: false, files: [], totalBytes: 0, error: msg };
  }
}

/**
 * Returns a Node.js Readable stream for a cloud-stored backup file.
 * Caller is responsible for path validation BEFORE calling — only invoke
 * with a key returned from listCloudBackups() (key is matched against the
 * configured prefix and a strict suffix check).
 */
export async function streamCloudBackup(
  key: string,
): Promise<{ ok: boolean; stream?: NodeJS.ReadableStream; size?: number; error?: string }> {
  const status = getCloudStatus();
  if (!status.configured) return { ok: false, error: status.reason };
  // Defense-in-depth: key must be inside our prefix and end with .sql.gz
  const pfx = status.provider === "gcs" ? gcsPrefix() : s3Prefix();
  if (!key.startsWith(pfx) || !key.endsWith(".sql.gz")) {
    return { ok: false, error: "Invalid backup key" };
  }
  // No path separators beyond the prefix dir
  const tail = key.slice(pfx.length);
  if (tail.includes("/") || tail.includes("\\") || tail.includes("..")) {
    return { ok: false, error: "Invalid backup key" };
  }
  try {
    if (status.provider === "gcs") {
      const bucket = await getGcsBucket();
      const file = bucket.file(key);
      const [meta] = await file.getMetadata();
      return { ok: true, stream: file.createReadStream(), size: Number(meta.size || 0) };
    }
    const client = await getS3Client();
    const mod = await getS3Mod();
    const resp: any = await client.send(
      new mod.GetObjectCommand({
        Bucket: process.env.BACKUP_S3_BUCKET,
        Key: key,
      }),
    );
    return { ok: true, stream: resp.Body as NodeJS.ReadableStream, size: Number(resp.ContentLength || 0) };
  } catch (err: any) {
    const msg = err?.message || String(err);
    return { ok: false, error: msg };
  }
}

/**
 * Best-effort: returns immediately while upload happens in the background.
 * Used by the daily scheduler so a cloud hang never blocks the next tick.
 */
export function uploadBackupInBackground(localFilePath: string, filename: string): void {
  if (!getCloudStatus().configured) return;
  // Defer to next tick so the caller's logging completes first.
  setImmediate(() => {
    uploadBackupToCloud(localFilePath, filename)
      .then((r) => {
        if (r.ok) {
          // eslint-disable-next-line no-console
          console.log(`[backup-cloud] uploaded ${filename} -> ${r.provider}:${r.key}`);
        }
      })
      .catch(() => {
        /* swallow — already logged in uploadBackupToCloud */
      });
  });
}
