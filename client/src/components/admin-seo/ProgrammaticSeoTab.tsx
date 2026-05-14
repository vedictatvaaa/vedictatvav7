import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Loader2, MapPin, Sparkles, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Props { adminFetch: (url: string, init?: RequestInit) => Promise<any> }

export function ProgrammaticSeoTab({ adminFetch }: Props) {
  const { toast } = useToast();
  const [includeNri, setIncludeNri] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [preview, setPreview] = useState<{ totalPlanned: number; sample: string[] } | null>(null);
  const [result, setResult] = useState<{ created: number; updated: number; totalPlanned: number } | null>(null);

  const runPreview = async () => {
    setPreviewing(true);
    try {
      const r = await adminFetch(`/api/admin/seo/programmatic/preview?nri=${includeNri ? 1 : 0}`);
      setPreview(r);
    } catch (e: any) {
      toast({ title: "Preview failed", description: e.message, variant: "destructive" });
    } finally {
      setPreviewing(false);
    }
  };

  const runGenerate = async () => {
    if (!confirm("Generate / refresh all programmatic landing page metadata? This will create or update SEO records for every city × category combination.")) return;
    setGenerating(true);
    try {
      const r = await adminFetch(`/api/admin/seo/programmatic/generate`, {
        method: "POST",
        body: JSON.stringify({ includeNri }),
      });
      setResult(r);
      toast({ title: "Generated", description: `${r.created} new, ${r.updated} updated, ${r.totalPlanned} total` });
    } catch (e: any) {
      toast({ title: "Generate failed", description: e.message, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5 text-[#6D2B35]" /> Programmatic Local SEO</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Generates city-specific landing pages for products (<code>/buy/category-in-city</code>) and services (<code>/book/service-in-city</code>) with optimized meta titles, descriptions, FAQ schema and product grids. Each generated page is automatically picked up by the sitemap and SeoHead.
          </p>

          <div className="flex items-center justify-between rounded-md border p-3">
            <div>
              <Label htmlFor="nri-toggle" className="font-medium">Include NRI markets</Label>
              <p className="text-xs text-muted-foreground">Adds USA, UK, Canada, Australia, UAE, Singapore + diaspora cities (London, Toronto, Dubai, etc.).</p>
            </div>
            <Switch id="nri-toggle" checked={includeNri} onCheckedChange={setIncludeNri} data-testid="switch-nri" />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={runPreview} variant="outline" disabled={previewing} data-testid="button-preview">
              {previewing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
              Preview
            </Button>
            <Button onClick={runGenerate} disabled={generating} className="bg-[#6D2B35] hover:bg-[#5a1f29] text-[#D4AF37]" data-testid="button-generate">
              {generating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <MapPin className="h-4 w-4 mr-2" />}
              Generate / Refresh All
            </Button>
          </div>

          {preview && (
            <div className="rounded-md border bg-[#FBF7EE] p-3" data-testid="preview-result">
              <div className="text-sm font-medium text-[#4a1a22]">{preview.totalPlanned} pages will be generated</div>
              <div className="mt-2 space-y-1">
                {preview.sample.map((p) => (
                  <a key={p} href={p} target="_blank" rel="noopener noreferrer" className="block text-xs text-[#6D2B35] hover:underline flex items-center gap-1">
                    <ExternalLink className="h-3 w-3" /> {p}
                  </a>
                ))}
              </div>
              <div className="text-xs text-muted-foreground mt-2">…and {preview.totalPlanned - preview.sample.length} more</div>
            </div>
          )}

          {result && (
            <div className="rounded-md border border-emerald-200 bg-emerald-50 dark:bg-emerald-950 dark:border-emerald-800 p-3" data-testid="generate-result">
              <div className="text-sm font-medium text-emerald-900 dark:text-emerald-100">
                {result.created} new pages created, {result.updated} refreshed
              </div>
              <div className="text-xs text-emerald-800 dark:text-emerald-200 mt-1">
                Total of {result.totalPlanned} programmatic landing pages now active. They will appear in the sitemap on next regeneration.
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
