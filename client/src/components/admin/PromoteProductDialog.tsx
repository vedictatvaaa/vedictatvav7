import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2, Megaphone, ExternalLink, Copy, CheckCircle2, AlertTriangle,
  ShoppingBag, TrendingUp, Search, Zap, Linkedin as SiLinkedin,
} from "lucide-react";
import { SiWhatsapp, SiX, SiFacebook, SiPinterest, SiTelegram, SiGmail } from "react-icons/si";

interface Props {
  productId: number;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  adminToken?: string;
}

async function adminFetch(adminToken: string | undefined, url: string, init: RequestInit = {}) {
  const headers: Record<string, string> = {
    ...(init.headers as Record<string, string> | undefined),
    ...(adminToken ? { "x-admin-token": adminToken } : {}),
  };
  if (init.body && !headers["Content-Type"]) headers["Content-Type"] = "application/json";
  const r = await fetch(url, { ...init, headers });
  if (!r.ok) {
    const text = await r.text().catch(() => "");
    throw new Error(text || `Request failed (${r.status})`);
  }
  return r.json();
}

export function PromoteProductDialog({ productId, open, onOpenChange, adminToken }: Props) {
  const { toast } = useToast();
  const [copied, setCopied] = useState<string | null>(null);

  const linksQ = useQuery<any>({
    queryKey: ["/api/admin/products", productId, "promote-links"],
    queryFn: () => adminFetch(adminToken, `/api/admin/products/${productId}/promote-links`),
    enabled: open,
  });

  const promoteMut = useMutation({
    mutationFn: () => adminFetch(adminToken, `/api/admin/products/${productId}/promote`, { method: "POST" }),
    onSuccess: (data: any) => {
      toast({
        title: data.merchantPushed ? "Pushed to Google Merchant Center" : "Indexed by search engines",
        description: data.message || "Promotion submitted.",
      });
    },
    onError: (e: any) => toast({ title: "Promotion failed", description: e?.message || "", variant: "destructive" }),
  });

  const data = linksQ.data;

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 1500);
    toast({ title: "Copied", description: label });
  };

  const shareItems = data ? [
    { key: "whatsapp", label: "WhatsApp", url: data.share.whatsapp, icon: SiWhatsapp, color: "text-[#25D366]" },
    { key: "twitter", label: "X (Twitter)", url: data.share.twitter, icon: SiX, color: "text-foreground" },
    { key: "facebook", label: "Facebook", url: data.share.facebook, icon: SiFacebook, color: "text-[#1877F2]" },
    { key: "pinterest", label: "Pinterest", url: data.share.pinterest, icon: SiPinterest, color: "text-[#E60023]" },
    { key: "telegram", label: "Telegram", url: data.share.telegram, icon: SiTelegram, color: "text-[#229ED9]" },
    { key: "linkedin", label: "LinkedIn", url: data.share.linkedin, icon: SiLinkedin, color: "text-[#0A66C2]" },
    { key: "email", label: "Email", url: data.share.email, icon: SiGmail, color: "text-[#EA4335]" },
  ] : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto" data-testid="dialog-promote-product">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-[#6D2B35]" />
            Promote on Google &amp; Social
          </DialogTitle>
          <DialogDescription>
            Push this product to Google Merchant Center, ping IndexNow for instant re-crawl, and share to all major channels.
          </DialogDescription>
        </DialogHeader>

        {!data ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Product summary */}
            <Card>
              <CardContent className="p-3 flex gap-3 items-center">
                {data.product.image && (
                  <img src={data.product.image} alt={data.product.name} className="h-14 w-14 object-cover rounded-md" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate" data-testid="text-promote-product-name">{data.product.name}</p>
                  <p className="text-xs text-muted-foreground">₹{data.product.price} · Stock: {data.product.stock}</p>
                </div>
              </CardContent>
            </Card>

            {/* Readiness */}
            {!data.readiness.ready && (
              <div className="rounded-md border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-950/20 p-3 text-sm">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-amber-900 dark:text-amber-200">Pre-flight notes</p>
                    <ul className="mt-1 list-disc pl-4 text-amber-800 dark:text-amber-300/90 space-y-0.5">
                      {data.readiness.issues.map((i: string) => <li key={i}>{i}</li>)}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Primary action */}
            <div className="rounded-md border bg-gradient-to-br from-amber-50/40 to-rose-50/30 dark:from-amber-950/20 dark:to-rose-950/10 p-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold flex items-center gap-1.5"><Zap className="h-4 w-4 text-[#D4AF37]" /> One-click promote</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Pings IndexNow {data.merchantApiConfigured ? "+ pushes to Google Merchant Center" : "(configure Merchant Center for direct push)"}</p>
                </div>
                <Button
                  onClick={() => promoteMut.mutate()}
                  disabled={promoteMut.isPending || !data.publicSiteUrlSet}
                  className="bg-[#6D2B35] hover:bg-[#6D2B35]/90 text-white"
                  data-testid="button-promote-now"
                >
                  {promoteMut.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Megaphone className="h-4 w-4 mr-2" />}
                  Promote now
                </Button>
              </div>
              {!data.publicSiteUrlSet && (
                <p className="text-xs text-amber-700 dark:text-amber-400">Set the PUBLIC_SITE_URL environment variable to your real domain before promoting.</p>
              )}
            </div>

            {/* Product URL */}
            <div>
              <label className="text-xs font-medium text-muted-foreground">Public product URL</label>
              <div className="flex gap-2 mt-1">
                <input
                  readOnly
                  value={data.productUrl}
                  className="flex-1 text-xs font-mono px-2 py-1.5 border rounded bg-muted"
                  data-testid="input-product-url"
                />
                <Button size="sm" variant="outline" onClick={() => copy(data.productUrl, "URL")} data-testid="button-copy-url">
                  {copied === "URL" ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* Google deep links */}
            <div>
              <p className="text-sm font-medium mb-2">Google tools</p>
              <div className="grid grid-cols-2 gap-2">
                <a href={data.merchantCenter} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="w-full justify-start gap-2 h-auto py-2" data-testid="link-merchant-center">
                    <ShoppingBag className="h-4 w-4 text-[#4285F4]" />
                    <span className="text-xs">Merchant Center</span>
                    <ExternalLink className="h-3 w-3 ml-auto" />
                  </Button>
                </a>
                <a href={data.googleAdsCampaign} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="w-full justify-start gap-2 h-auto py-2" data-testid="link-google-ads">
                    <TrendingUp className="h-4 w-4 text-[#34A853]" />
                    <span className="text-xs">Create Ads Campaign</span>
                    <ExternalLink className="h-3 w-3 ml-auto" />
                  </Button>
                </a>
                <a href={data.googleSearchPreview} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="w-full justify-start gap-2 h-auto py-2" data-testid="link-search-preview">
                    <Search className="h-4 w-4 text-[#EA4335]" />
                    <span className="text-xs">Preview in Google</span>
                    <ExternalLink className="h-3 w-3 ml-auto" />
                  </Button>
                </a>
                <a href={data.googleTrendsExplore} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="w-full justify-start gap-2 h-auto py-2" data-testid="link-trends">
                    <TrendingUp className="h-4 w-4 text-[#FBBC04]" />
                    <span className="text-xs">Explore on Trends</span>
                    <ExternalLink className="h-3 w-3 ml-auto" />
                  </Button>
                </a>
              </div>
            </div>

            {/* Share */}
            <div>
              <p className="text-sm font-medium mb-2">Share to social</p>
              <div className="flex flex-wrap gap-2">
                {shareItems.map((s) => (
                  <a key={s.key} href={s.url} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" variant="outline" className="gap-1.5" data-testid={`share-${s.key}`}>
                      <s.icon className={`h-3.5 w-3.5 ${s.color}`} />
                      <span className="text-xs">{s.label}</span>
                    </Button>
                  </a>
                ))}
              </div>
            </div>

            {/* Status badges */}
            <div className="flex flex-wrap gap-2 pt-2 border-t">
              <Badge variant={data.merchantApiConfigured ? "default" : "secondary"}>
                Merchant API: {data.merchantApiConfigured ? "Connected" : "Not configured"}
              </Badge>
              <Badge variant={data.publicSiteUrlSet ? "default" : "secondary"}>
                PUBLIC_SITE_URL: {data.publicSiteUrlSet ? "Set" : "Not set"}
              </Badge>
              <Badge variant={data.readiness.ready ? "default" : "secondary"}>
                Feed ready: {data.readiness.ready ? "Yes" : `${data.readiness.issues.length} issue(s)`}
              </Badge>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
