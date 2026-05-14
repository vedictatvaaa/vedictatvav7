import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Settings, Type, X } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";

import { useToast } from "@/hooks/use-toast";
import type { SocialProofSettings } from "@shared/schema";

import { createFetcher } from "../admin-shared";

function SocialProofTab() {
  const adminToken = typeof window !== "undefined" ? localStorage.getItem("adminToken") || "" : "";
  const fetcher = createFetcher(adminToken);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: spSettings } = useQuery<SocialProofSettings>({
    queryKey: ["/api/social-proof/settings"],
    queryFn: () => fetcher("/api/social-proof/settings"),
  });

  const [realRatio, setRealRatio] = useState<number>(60);
  const [viewMin, setViewMin] = useState<number>(12);
  const [viewMax, setViewMax] = useState<number>(45);
  const [salesBoost, setSalesBoost] = useState<number>(15);
  const [urgencyEnabled, setUrgencyEnabled] = useState(true);
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    if (spSettings) {
      setRealRatio(spSettings.realRatio);
      setViewMin(spSettings.viewMin);
      setViewMax(spSettings.viewMax);
      setSalesBoost(spSettings.salesBoostPercent);
      setUrgencyEnabled(spSettings.urgencyEnabled);
      setEnabled(spSettings.enabled);
    }
  }, [spSettings]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/social-proof/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          realRatio,
          boostRatio: 100 - realRatio,
          viewMin,
          viewMax,
          salesBoostPercent: salesBoost,
          urgencyEnabled,
          enabled,
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/social-proof/settings"] });
      toast({ title: "Settings Saved", description: "Social proof engine settings have been updated." });
    },
    onError: () => toast({ title: "Error", description: "Failed to save settings.", variant: "destructive" }),
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-serif text-primary" data-testid="page-title-social-proof">Social Proof Engine</h1>
        <p className="text-sm text-muted-foreground">Control the hybrid social proof notification system</p>
      </div>

      <Card className="bg-card border-border">
        <CardHeader><CardTitle className="text-lg text-primary font-serif">Master Toggle</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center space-x-3">
            <Switch id="engine-enabled" checked={enabled} onCheckedChange={setEnabled} data-testid="switch-engine-enabled" />
            <Label htmlFor="engine-enabled" className="text-foreground">Enable Hybrid Social Proof Engine</Label>
          </div>
          <p className="text-sm text-muted-foreground mt-2">When disabled, popup notifications will stop showing.</p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-card border-border">
          <CardHeader><CardTitle className="text-lg text-primary font-serif">Real vs Boosted Ratio</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-between text-sm font-medium">
              <span className="text-emerald-600">Real Data ({realRatio}%)</span>
              <span className="text-primary">Boosted Data ({100 - realRatio}%)</span>
            </div>
            <Slider value={[realRatio]} onValueChange={([v]) => setRealRatio(v)} max={100} step={5} className="py-2" data-testid="slider-real-ratio" />
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader><CardTitle className="text-lg text-primary font-serif">Viewer Count Multiplier</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Min. Artificial Viewers</Label>
              <Input type="number" value={viewMin} onChange={(e) => setViewMin(Number(e.target.value))} data-testid="input-view-min" />
            </div>
            <div className="space-y-2">
              <Label>Max. Artificial Viewers</Label>
              <Input type="number" value={viewMax} onChange={(e) => setViewMax(Number(e.target.value))} data-testid="input-view-max" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border">
        <CardHeader><CardTitle className="text-lg text-primary font-serif">Sales Boost & Urgency Override</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Global Sales Inflator (%)</Label>
              <Input type="number" value={salesBoost} onChange={(e) => setSalesBoost(Number(e.target.value))} data-testid="input-sales-boost" />
              <p className="text-xs text-muted-foreground">Increases "bought in last 30 days" numbers.</p>
            </div>
            <div className="space-y-2 pt-6">
              <div className="flex items-center space-x-3">
                <Switch id="urgency-override" checked={urgencyEnabled} onCheckedChange={setUrgencyEnabled} data-testid="switch-urgency" />
                <Label htmlFor="urgency-override">Low Stock Urgency Trigger</Label>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Force display "Only X left" when stock below 10.</p>
            </div>
          </div>
          <div className="pt-4 border-t border-border flex justify-end">
            <Button className="bg-primary text-white gap-2" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} data-testid="btn-save-social-proof">
              {saveMutation.isPending ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


export default SocialProofTab;
