import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Database, Download, Play, RefreshCw, HardDrive, Cloud, CloudOff, UploadCloud, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { createFetcher } from "../admin-shared";

type BackupFile = { filename: string; size: number; mtime: string };
type BackupListResponse = { dir: string; files: BackupFile[]; totalBytes: number };

type CloudProviderId = "" | "r2" | "b2" | "s3" | "gcs";
type CloudStatus = {
  provider: CloudProviderId;
  label: string;
  configured: boolean;
  bucket?: string;
  prefix?: string;
  reason?: string;
};
type CloudObject = { key: string; size: number; mtime: string };
type CloudListResponse = CloudStatus & {
  files: CloudObject[];
  totalBytes: number;
  error?: string;
};

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

function formatWhen(iso: string): string {
  const d = new Date(iso);
  const diffMs = Date.now() - d.getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  return d.toLocaleString();
}

function AdminBackupsTab({ adminToken }: { adminToken?: string }) {
  const { toast } = useToast();
  const fetcher = createFetcher(adminToken);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [pushing, setPushing] = useState<string | null>(null);
  const [downloadingCloud, setDownloadingCloud] = useState<string | null>(null);

  const { data, isLoading, refetch, isFetching } = useQuery<BackupListResponse>({
    queryKey: ["/api/admin/backups"],
    queryFn: () => fetcher("/api/admin/backups"),
    staleTime: 15_000,
  });

  const { data: cloud, isFetching: isCloudFetching, refetch: refetchCloud } = useQuery<CloudListResponse>({
    queryKey: ["/api/admin/backups/cloud/list"],
    queryFn: () => fetcher("/api/admin/backups/cloud/list"),
    staleTime: 15_000,
  });

  const runMutation = useMutation<{ filename: string; size: number }>({
    mutationFn: async () => {
      const r = await fetch("/api/admin/backups/run", {
        method: "POST",
        headers: adminToken ? { "x-admin-token": adminToken } : {},
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j.message || `Request failed (${r.status})`);
      }
      return r.json();
    },
    onSuccess: (res) => {
      toast({
        title: "Backup created",
        description: cloud?.configured
          ? `${res.filename} \u00b7 ${formatBytes(res.size)} \u00b7 uploading to ${cloud.label}\u2026`
          : `${res.filename} \u00b7 ${formatBytes(res.size)}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/backups"] });
      // Refresh cloud list shortly after — upload runs in background
      if (cloud?.configured) {
        setTimeout(() => queryClient.invalidateQueries({ queryKey: ["/api/admin/backups/cloud/list"] }), 8000);
      }
    },
    onError: (err: any) => {
      toast({
        title: "Backup failed",
        description: err?.message || "pg_dump did not complete.",
        variant: "destructive",
      });
    },
  });

  const downloadFile = async (filename: string) => {
    setDownloading(filename);
    try {
      const r = await fetch(`/api/admin/backups/${encodeURIComponent(filename)}`, {
        headers: adminToken ? { "x-admin-token": adminToken } : {},
      });
      if (!r.ok) throw new Error(`Download failed (${r.status})`);
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      toast({
        title: "Download failed",
        description: err?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setDownloading(null);
    }
  };

  const pushToCloud = async (filename: string) => {
    setPushing(filename);
    try {
      const r = await fetch(`/api/admin/backups/${encodeURIComponent(filename)}/push`, {
        method: "POST",
        headers: adminToken ? { "x-admin-token": adminToken } : {},
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.ok) throw new Error(j.message || `Upload failed (${r.status})`);
      toast({
        title: "Uploaded to cloud",
        description: `${cloud?.label || "Cloud"} \u00b7 ${j.key}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/backups/cloud/list"] });
    } catch (err: any) {
      toast({
        title: "Cloud upload failed",
        description: err?.message || "Please verify cloud credentials.",
        variant: "destructive",
      });
    } finally {
      setPushing(null);
    }
  };

  const downloadCloud = async (key: string) => {
    setDownloadingCloud(key);
    try {
      const r = await fetch(`/api/admin/backups/cloud/download?key=${encodeURIComponent(key)}`, {
        headers: adminToken ? { "x-admin-token": adminToken } : {},
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j.message || `Download failed (${r.status})`);
      }
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = key.split("/").pop() || "backup.sql.gz";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      toast({
        title: "Cloud download failed",
        description: err?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setDownloadingCloud(null);
    }
  };

  const files = data?.files || [];
  const cloudFiles = cloud?.files || [];
  const cloudKeys = new Set(cloudFiles.map((f) => f.key.split("/").pop() || ""));

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-serif text-primary flex items-center gap-2" data-testid="page-title-backups">
            <Database className="w-7 h-7" />
            Database Backups
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl mt-1">
            Three layers of safety: <span className="font-medium text-foreground">server disk</span> (daily pg_dump,
            7-day rotation), <span className="font-medium text-foreground">file download</span> (off-site copy on your
            laptop), and <span className="font-medium text-foreground">cloud</span> (auto-pushed to your provider when
            configured).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => { refetch(); refetchCloud(); }}
            disabled={isFetching || isCloudFetching}
            data-testid="button-backups-refresh"
          >
            <RefreshCw className={`w-4 h-4 mr-1.5 ${isFetching || isCloudFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            onClick={() => runMutation.mutate()}
            disabled={runMutation.isPending}
            data-testid="button-backups-run"
          >
            <Play className="w-4 h-4 mr-1.5" />
            {runMutation.isPending ? "Running\u2026" : "Run backup now"}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Backups on disk</div>
              <div className="mt-1 text-2xl font-serif text-primary" data-testid="stat-backup-count">{files.length}</div>
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Total size</div>
              <div className="mt-1 text-2xl font-serif text-primary" data-testid="stat-backup-size">
                {formatBytes(data?.totalBytes || 0)}
              </div>
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Latest</div>
              <div className="mt-1 text-2xl font-serif text-primary" data-testid="stat-backup-latest">
                {files[0] ? formatWhen(files[0].mtime) : "\u2014"}
              </div>
            </div>
          </div>
          {data?.dir && (
            <div className="mt-3 pt-3 border-t border-border flex items-center gap-2 text-xs text-muted-foreground">
              <HardDrive className="w-3.5 h-3.5" />
              <span className="font-mono break-all" data-testid="text-backup-dir">{data.dir}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cloud provider status */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div className="flex items-start gap-3">
              {cloud?.configured ? (
                <Cloud className="w-5 h-5 text-primary mt-0.5" />
              ) : (
                <CloudOff className="w-5 h-5 text-muted-foreground mt-0.5" />
              )}
              <div>
                <div className="text-sm font-semibold text-foreground flex items-center gap-2">
                  {cloud?.label || "Cloud backups"}
                  {cloud?.configured && (
                    <Badge variant="secondary" className="text-[10px]" data-testid="badge-cloud-configured">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Active
                    </Badge>
                  )}
                </div>
                <div className="text-xs text-muted-foreground mt-1 max-w-xl" data-testid="text-cloud-status">
                  {cloud?.configured ? (
                    <>
                      Bucket <span className="font-mono">{cloud.bucket}</span>
                      {cloud.prefix && <> \u00b7 prefix <span className="font-mono">{cloud.prefix}</span></>}
                      <> \u00b7 {cloudFiles.length} file{cloudFiles.length === 1 ? "" : "s"} \u00b7 {formatBytes(cloud.totalBytes || 0)}</>
                    </>
                  ) : (
                    cloud?.reason || "Set BACKUP_CLOUD_PROVIDER and provider credentials to enable. New backups will then auto-upload."
                  )}
                </div>
              </div>
            </div>
            {!cloud?.configured && (
              <div className="text-[11px] text-muted-foreground max-w-md">
                Supported: Cloudflare R2 (recommended), Backblaze B2, AWS S3, Google Cloud Storage. See setup guide
                below.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Local backups table */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <HardDrive className="w-4 h-4" /> On the server
          </h2>
        </div>
        {isLoading ? (
          <Skeleton className="h-64 w-full rounded-md" />
        ) : files.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-sm text-muted-foreground">
              No backups yet. The first scheduled backup runs about 5 minutes after server boot, then every
              24 hours. Use <span className="font-medium text-foreground">Run backup now</span> to create one immediately.
            </CardContent>
          </Card>
        ) : (
          <div className="border rounded-md bg-card overflow-hidden">
            <div className="grid grid-cols-12 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground bg-muted px-4 py-2 gap-2">
              <div className="col-span-5">Filename</div>
              <div className="col-span-1 text-right">Size</div>
              <div className="col-span-2">Created</div>
              <div className="col-span-4 text-right">Actions</div>
            </div>
            <div className="divide-y divide-secondary/60 max-h-[60vh] overflow-auto">
              {files.map((f, idx) => {
                const inCloud = cloudKeys.has(f.filename);
                return (
                  <div
                    key={f.filename}
                    className="grid grid-cols-12 px-4 py-2.5 text-xs items-center gap-2"
                    data-testid={`backup-row-${idx}`}
                  >
                    <div className="col-span-5 font-mono text-foreground break-all">
                      {f.filename}
                      {idx === 0 && (
                        <Badge variant="secondary" className="ml-2 text-[10px]">latest</Badge>
                      )}
                      {inCloud && (
                        <Badge variant="secondary" className="ml-2 text-[10px]" data-testid={`badge-in-cloud-${idx}`}>
                          <Cloud className="w-3 h-3 mr-1" />
                          in cloud
                        </Badge>
                      )}
                    </div>
                    <div className="col-span-1 text-right font-mono text-muted-foreground">{formatBytes(f.size)}</div>
                    <div className="col-span-2 text-muted-foreground" title={new Date(f.mtime).toLocaleString()}>
                      {formatWhen(f.mtime)}
                    </div>
                    <div className="col-span-4 flex items-center justify-end gap-2 flex-wrap">
                      {cloud?.configured && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => pushToCloud(f.filename)}
                          disabled={pushing === f.filename}
                          data-testid={`button-push-cloud-${idx}`}
                        >
                          <UploadCloud className="w-3.5 h-3.5 mr-1" />
                          {pushing === f.filename ? "\u2026" : inCloud ? "Re-upload" : "Push"}
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadFile(f.filename)}
                        disabled={downloading === f.filename}
                        data-testid={`button-download-${idx}`}
                      >
                        <Download className="w-3.5 h-3.5 mr-1" />
                        {downloading === f.filename ? "\u2026" : "Download"}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Cloud backups table */}
      {cloud?.configured && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Cloud className="w-4 h-4" /> In {cloud.label}
            </h2>
          </div>
          {cloudFiles.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                No backups in the cloud yet. The next scheduled or on-demand backup will be auto-uploaded, or click
                <span className="font-medium text-foreground"> Push </span> next to a local file above.
              </CardContent>
            </Card>
          ) : (
            <div className="border rounded-md bg-card overflow-hidden">
              <div className="grid grid-cols-12 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground bg-muted px-4 py-2 gap-2">
                <div className="col-span-7">Object key</div>
                <div className="col-span-1 text-right">Size</div>
                <div className="col-span-2">Uploaded</div>
                <div className="col-span-2 text-right">Action</div>
              </div>
              <div className="divide-y divide-secondary/60 max-h-[60vh] overflow-auto">
                {cloudFiles.map((f, idx) => (
                  <div
                    key={f.key}
                    className="grid grid-cols-12 px-4 py-2.5 text-xs items-center gap-2"
                    data-testid={`cloud-row-${idx}`}
                  >
                    <div className="col-span-7 font-mono text-foreground break-all">{f.key}</div>
                    <div className="col-span-1 text-right font-mono text-muted-foreground">{formatBytes(f.size)}</div>
                    <div className="col-span-2 text-muted-foreground" title={new Date(f.mtime).toLocaleString()}>
                      {formatWhen(f.mtime)}
                    </div>
                    <div className="col-span-2 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadCloud(f.key)}
                        disabled={downloadingCloud === f.key}
                        data-testid={`button-cloud-download-${idx}`}
                      >
                        <Download className="w-3.5 h-3.5 mr-1" />
                        {downloadingCloud === f.key ? "\u2026" : "Download"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Setup + restore docs */}
      <Card>
        <CardContent className="p-4 text-xs text-muted-foreground space-y-3">
          <div>
            <div className="font-semibold text-foreground mb-1">Restore (manual)</div>
            <p>Download the .sql.gz file (from server or cloud), copy it to your VPS, then run:</p>
            <pre className="bg-muted p-2 rounded font-mono text-[11px] overflow-x-auto mt-1">
{`gunzip -c vedictatva-<timestamp>.sql.gz | psql "$DATABASE_URL"`}
            </pre>
          </div>

          <div>
            <div className="font-semibold text-foreground mb-1">Cloud setup</div>
            <p className="mb-2">
              Pick one provider and set the env vars below. Cloudflare R2 is recommended (10 GB free, no egress fees).
              Once set, every new backup auto-uploads.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div className="border rounded p-2">
                <div className="font-semibold text-foreground text-[11px]">Cloudflare R2 (default)</div>
                <pre className="font-mono text-[10.5px] mt-1 whitespace-pre-wrap break-all">{`BACKUP_CLOUD_PROVIDER=r2
BACKUP_S3_BUCKET=vedictatva-backups
BACKUP_S3_ENDPOINT=https://<accountid>.r2.cloudflarestorage.com
BACKUP_S3_ACCESS_KEY_ID=...
BACKUP_S3_SECRET_ACCESS_KEY=...`}</pre>
              </div>
              <div className="border rounded p-2">
                <div className="font-semibold text-foreground text-[11px]">Backblaze B2</div>
                <pre className="font-mono text-[10.5px] mt-1 whitespace-pre-wrap break-all">{`BACKUP_CLOUD_PROVIDER=b2
BACKUP_S3_BUCKET=vedictatva-backups
BACKUP_S3_REGION=us-east-005
BACKUP_S3_ENDPOINT=https://s3.us-east-005.backblazeb2.com
BACKUP_S3_ACCESS_KEY_ID=...
BACKUP_S3_SECRET_ACCESS_KEY=...`}</pre>
              </div>
              <div className="border rounded p-2">
                <div className="font-semibold text-foreground text-[11px]">AWS S3</div>
                <pre className="font-mono text-[10.5px] mt-1 whitespace-pre-wrap break-all">{`BACKUP_CLOUD_PROVIDER=s3
BACKUP_S3_BUCKET=vedictatva-backups
BACKUP_S3_REGION=ap-south-1
BACKUP_S3_ACCESS_KEY_ID=...
BACKUP_S3_SECRET_ACCESS_KEY=...`}</pre>
              </div>
              <div className="border rounded p-2">
                <div className="font-semibold text-foreground text-[11px]">Google Cloud Storage</div>
                <pre className="font-mono text-[10.5px] mt-1 whitespace-pre-wrap break-all">{`BACKUP_CLOUD_PROVIDER=gcs
BACKUP_GCS_BUCKET=vedictatva-backups
GOOGLE_SERVICE_ACCOUNT_JSON={...full JSON key...}`}</pre>
              </div>
            </div>
            <p className="mt-2">
              Local retention stays at 7 days (override with <span className="font-mono">BACKUP_RETENTION_DAYS</span>).
              The cloud copy is never auto-deleted by this app \u2014 set lifecycle rules in your provider console if you
              want long-term rotation.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default AdminBackupsTab;
