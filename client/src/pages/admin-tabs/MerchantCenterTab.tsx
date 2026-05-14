import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Settings, Users, Search, Image, RotateCcw } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Button } from "@/components/ui/button";

import { Badge } from "@/components/ui/badge";

import { useToast } from "@/hooks/use-toast";
import type { Product } from "@shared/schema";

import { createFetcher } from "../admin-shared";

// ============================================================
interface MerchantStatus {
  siteUrl: string;
  feedUrl: string;
  sitemapUrl: string;
  robotsUrl: string;
  productCount: number;
  inStockCount: number;
  readyCount: number;
  warnings: { missingGtin: number; missingMrp: number; missingBrand: number; missingImage: number };
  apiConfigured: boolean;
  merchantId: string | null;
  publicSiteUrlSet: boolean;
}

function MerchantCenterTab({ adminToken }: { adminToken?: string }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fetcher = createFetcher(adminToken);
  const { data: status, isLoading, refetch } = useQuery<MerchantStatus>({
    queryKey: ["/api/admin/merchant-center/status"],
    queryFn: () => fetcher("/api/admin/merchant-center/status"),
  });

  // Load persisted last-sync result from siteSettings so it survives a refresh.
  const { data: settings } = useQuery<any>({ queryKey: ["/api/site-settings"] });
  const [syncResult, setSyncResult] = useState<any>(null);
  useEffect(() => {
    if (!syncResult && settings?.lastMerchantSyncResult) {
      setSyncResult({
        ...settings.lastMerchantSyncResult,
        syncedAt: settings.lastMerchantSyncAt || settings.lastMerchantSyncResult.syncedAt,
      });
    }
  }, [settings, syncResult]);
  const syncMut = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/merchant-center/sync", {
        method: "POST",
        headers: { "x-admin-token": adminToken || "" },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Sync failed");
      return data;
    },
    onSuccess: (data) => {
      setSyncResult(data);
      queryClient.invalidateQueries({ queryKey: ["/api/site-settings"] });
      toast({ title: "Push complete", description: `${data.succeeded}/${data.sent} products synced` });
    },
    onError: (err: any) => {
      toast({ title: "Sync failed", description: err.message, variant: "destructive" });
    },
  });

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: `${label} copied` });
  };

  if (isLoading || !status) {
    return <div className="p-6 text-muted-foreground" data-testid="merchant-loading">Loading Merchant Center status…</div>;
  }

  const warningTotal = status.warnings.missingGtin + status.warnings.missingMrp + status.warnings.missingBrand + status.warnings.missingImage;

  return (
    <div className="space-y-6" data-testid="merchant-center-tab">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-primary">Google Merchant Center</h1>
          <p className="text-sm text-muted-foreground mt-1">Set up your product feed for Google Shopping & free listings.</p>
        </div>
        <Button variant="outline" onClick={() => refetch()} data-testid="button-refresh-merchant">
          <RotateCcw className="w-4 h-4 mr-2" /> Refresh
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="p-4"><div className="text-xs text-secondary uppercase tracking-wide">Total Products</div><div className="text-2xl font-bold text-primary mt-1" data-testid="stat-total">{status.productCount}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-secondary uppercase tracking-wide">In Stock</div><div className="text-2xl font-bold text-emerald-700 mt-1" data-testid="stat-instock">{status.inStockCount}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-secondary uppercase tracking-wide">Feed-Ready</div><div className="text-2xl font-bold text-blue-700 mt-1" data-testid="stat-ready">{status.readyCount}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-secondary uppercase tracking-wide">Data Warnings</div><div className="text-2xl font-bold text-amber-700 mt-1" data-testid="stat-warnings">{warningTotal}</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-primary">Feed URLs</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {!status.publicSiteUrlSet && (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900" data-testid="warning-public-url">
              <strong>Heads up:</strong> <code>PUBLIC_SITE_URL</code> is not set. URLs below use the request host. After deploying, add a secret <code>PUBLIC_SITE_URL=https://yourdomain.com</code> so Google sees stable URLs.
            </div>
          )}
          {[
            { label: "Product Feed (XML)", url: status.feedUrl, testid: "feed-url" },
            { label: "Sitemap", url: status.sitemapUrl, testid: "sitemap-url" },
            { label: "robots.txt", url: status.robotsUrl, testid: "robots-url" },
          ].map((row) => (
            <div key={row.label} className="flex items-center gap-2 flex-wrap">
              <div className="text-sm font-medium text-muted-foreground w-40 shrink-0">{row.label}</div>
              <code className="flex-1 min-w-0 truncate text-xs bg-muted border border-border rounded-md px-2 py-1.5 text-muted-foreground" data-testid={`text-${row.testid}`}>{row.url}</code>
              <Button size="sm" variant="outline" onClick={() => copy(row.url, row.label)} data-testid={`button-copy-${row.testid}`}>Copy</Button>
              <Button size="sm" variant="outline" asChild>
                <a href={row.url} target="_blank" rel="noopener noreferrer" data-testid={`link-open-${row.testid}`}>Open</a>
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-primary">Setup: Scheduled Feed (Recommended)</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <ol className="list-decimal pl-5 space-y-2">
            <li>Open <a className="text-primary underline" href="https://merchants.google.com/" target="_blank" rel="noopener noreferrer">Google Merchant Center</a> and create / select your account.</li>
            <li>Verify and claim your website domain (in <em>Business information → Website</em>).</li>
            <li>Go to <em>Products → Feeds → Add primary feed</em>. Choose Country = India, Language = English, Destination = Shopping ads + Free listings.</li>
            <li>Name it (e.g. "Vedic Tradition Main Feed"), choose <strong>Scheduled fetch</strong>.</li>
            <li>Paste the <strong>Product Feed URL</strong> above. Set fetch frequency = Daily.</li>
            <li>Click <em>Create feed</em> → <em>Fetch now</em>. Initial review usually takes 3–7 days.</li>
          </ol>
          <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-xs text-blue-900 mt-2">
            Tip: Submit the <strong>Sitemap URL</strong> in Google Search Console too — this helps Free Listings discover product pages faster.
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-primary flex items-center gap-2">
            Direct API Push (Optional)
            {status.apiConfigured ? (
              <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">Configured</Badge>
            ) : (
              <Badge className="bg-muted text-foreground border-border">Not Configured</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          {status.apiConfigured ? (
            <>
              <div>Merchant ID: <code className="text-primary">{status.merchantId}</code></div>
              <p>Push the first 250 in-stock products directly via Google Content API. Useful for testing or instant updates between scheduled fetches.</p>
              <Button onClick={() => syncMut.mutate()} disabled={syncMut.isPending} data-testid="button-sync-merchant">
                {syncMut.isPending ? "Pushing…" : "Push Products Now"}
              </Button>
              {syncResult && (
                <div className="mt-3 rounded-md border border-border bg-muted p-3 text-xs space-y-2" data-testid="sync-result">
                  {syncResult.syncedAt && (
                    <div className="text-secondary">Last push: <strong>{new Date(syncResult.syncedAt).toLocaleString()}</strong></div>
                  )}
                  <div>Sent: <strong>{syncResult.sent}</strong> · Succeeded: <strong className="text-emerald-700">{syncResult.succeeded}</strong> · Failed: <strong className="text-red-700">{syncResult.failed}</strong>{typeof syncResult.skipped === "number" && syncResult.skipped > 0 ? <> · Skipped (over 250 batch cap): <strong>{syncResult.skipped}</strong></> : null}</div>
                  {syncResult.sampleErrors?.length > 0 && (
                    <details>
                      <summary className="cursor-pointer text-amber-700 font-medium">Per-product errors ({syncResult.sampleErrors.length})</summary>
                      <div className="mt-2 space-y-1">
                        {syncResult.sampleErrors.map((e: any, idx: number) => (
                          <div key={idx} className="rounded bg-card border border-amber-200 p-2">
                            <div className="font-medium text-amber-900">Batch #{e.batchId}</div>
                            <ul className="list-disc pl-5 mt-1 space-y-0.5 text-muted-foreground">
                              {(e.errors || []).map((er: any, i: number) => (
                                <li key={i}><strong>{er.reason || er.code}:</strong> {er.message}</li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </details>
                  )}
                </div>
              )}
            </>
          ) : (
            <>
              <p>To push products directly (instead of waiting for scheduled fetch), add these secrets:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><code>GOOGLE_MERCHANT_ID</code> — your numeric Merchant Center ID</li>
                <li><code>GOOGLE_SERVICE_ACCOUNT_JSON</code> — full JSON key of a service account with Content API access (added to your Merchant Center under <em>Settings → Users → Add user → Service account</em>)</li>
              </ul>
              <p className="text-xs text-secondary">Once added and the server restarts, this panel will enable a one-click push.</p>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-primary">Catalog Data Quality</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          {[
            { label: "Missing GTIN/UPC/EAN", value: status.warnings.missingGtin, hint: "Required only for branded mass-produced items. Ok to skip for handmade." },
            { label: "Missing MRP (sale price benefit)", value: status.warnings.missingMrp, hint: "Add MRP > price to display strikethrough discount in Shopping ads." },
            { label: "Missing Brand", value: status.warnings.missingBrand, hint: "Set brand or use 'Vedic Tradition' as default." },
            { label: "Missing Image", value: status.warnings.missingImage, hint: "Critical — products without images are disapproved." },
          ].map((row) => (
            <div key={row.label} className="flex items-start justify-between gap-3 py-1.5 border-b border-border last:border-0" data-testid={`warning-${row.label.replace(/\s+/g, "-").toLowerCase()}`}>
              <div className="flex-1">
                <div className="font-medium text-muted-foreground">{row.label}</div>
                <div className="text-xs text-secondary mt-0.5">{row.hint}</div>
              </div>
              <Badge className={row.value === 0 ? "bg-emerald-100 text-emerald-800 border-emerald-200" : "bg-amber-100 text-amber-800 border-amber-200"}>{row.value}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}


export default MerchantCenterTab;
