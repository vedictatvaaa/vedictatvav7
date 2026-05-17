import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, CheckCircle, Type, RefreshCw, Sparkles } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { sanitizeHtml } from "@/lib/sanitize-html";

import { Input } from "@/components/ui/input";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";

import { Select } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { Product } from "@shared/schema";


function AplusListingsTab({ adminToken }: { adminToken?: string }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [generatedHtml, setGeneratedHtml] = useState<string>("");
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
    queryFn: () => fetch("/api/products", { headers: { "x-admin-token": adminToken || "" } }).then(r => r.json()),
  });

  const filtered = (products || []).filter(p =>
    !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleGenerate = async () => {
    if (!selectedProduct) return;
    setGenerating(true);
    setGeneratedHtml("");
    setPreviewMode(false);
    try {
      const res = await fetch("/api/admin/generate-aplus-html", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-token": adminToken || "" },
        body: JSON.stringify({
          name: selectedProduct.name,
          category: selectedProduct.category,
          price: selectedProduct.price,
          description: selectedProduct.description,
          highlights: selectedProduct.highlights || [],
          features: selectedProduct.features || [],
        }),
      });
      if (!res.ok) throw new Error((await res.json()).message);
      const data = await res.json();
      setGeneratedHtml(data.html || "");
      setPreviewMode(true);
      toast({ title: "A+ Content Generated!", description: "Review the HTML below and save when ready." });
    } catch (err: any) {
      toast({ title: "Generation Failed", description: err.message, variant: "destructive" });
    }
    setGenerating(false);
  };

  const handleSave = async () => {
    if (!selectedProduct || !generatedHtml) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/products/${selectedProduct.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-admin-token": adminToken || "" },
        body: JSON.stringify({ richDescription: generatedHtml, aplusEnabled: true }),
      });
      if (!res.ok) throw new Error("Save failed");
      await queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "A+ Listing Saved!", description: `${selectedProduct.name} now has A+ content enabled.` });
    } catch (err: any) {
      toast({ title: "Save Failed", description: err.message, variant: "destructive" });
    }
    setSaving(false);
  };

  const handleDisable = async (product: Product) => {
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-admin-token": adminToken || "" },
        body: JSON.stringify({ aplusEnabled: false }),
      });
      if (!res.ok) throw new Error("Update failed");
      await queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "A+ Disabled", description: `${product.name} A+ content turned off.` });
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif text-primary" data-testid="page-title-aplus">A+ Listings Generator</h1>
        <p className="text-sm text-muted-foreground/60 mt-1">Generate rich HTML A+ product content using AI — like Amazon Enhanced Brand Content</p>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-primary">Select a Product</CardTitle>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40" />
                <Input
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-9 text-sm h-9"
                  data-testid="input-aplus-search"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[480px] overflow-y-auto divide-y divide-primary/5">
                {isLoading ? (
                  Array(5).fill(0).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 p-3">
                      <Skeleton className="w-10 h-10 rounded-lg" />
                      <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-3.5 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  ))
                ) : filtered.map(p => (
                  <button
                    key={p.id}
                    onClick={() => { setSelectedProduct(p); setGeneratedHtml(""); setPreviewMode(false); }}
                    className={`w-full flex items-center gap-3 p-3 text-left transition-colors ${selectedProduct?.id === p.id ? "bg-primary/8 border-l-2 border-primary" : "hover:bg-primary/4"}`}
                    data-testid={`btn-select-product-${p.id}`}
                  >
                    <img src={p.image} alt={p.name} className="w-10 h-10 rounded-lg object-cover bg-muted flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground line-clamp-1">{p.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground/50">{p.category}</span>
                        {p.aplusEnabled && (
                          <span className="text-[10px] font-bold bg-secondary/20 text-primary px-1.5 py-0.5 rounded-full">A+</span>
                        )}
                      </div>
                    </div>
                    {p.aplusEnabled && (
                      <button
                        onClick={e => { e.stopPropagation(); handleDisable(p); }}
                        className="text-[10px] text-red-500 hover:text-red-700 px-2 py-1 rounded border border-red-200 hover:border-red-400 transition-colors flex-shrink-0"
                        data-testid={`btn-disable-aplus-${p.id}`}
                      >
                        Disable
                      </button>
                    )}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3 space-y-4">
          {!selectedProduct ? (
            <Card className="border-dashed border-primary/20">
              <CardContent className="py-16 text-center">
                <div className="w-14 h-14 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="h-7 w-7 text-secondary" />
                </div>
                <p className="text-muted-foreground/60 font-medium">Select a product to generate its A+ listing</p>
                <p className="text-muted-foreground/40 text-sm mt-1">AI will create a rich HTML content block with hero, highlights, specs, and more</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card>
                <CardHeader className="pb-3 flex flex-row items-start justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    <img src={selectedProduct.image} alt={selectedProduct.name} className="w-12 h-12 rounded-lg object-cover bg-muted" />
                    <div>
                      <CardTitle className="text-base text-primary line-clamp-1">{selectedProduct.name}</CardTitle>
                      <CardDescription className="text-xs">{selectedProduct.category} · ₹{selectedProduct.price.toLocaleString()}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={handleGenerate}
                      disabled={generating}
                      className="bg-gradient-to-r from-secondary to-secondary text-foreground font-bold gap-2"
                      data-testid="btn-generate-aplus-html"
                    >
                      {generating ? (
                        <><RefreshCw className="h-3.5 w-3.5 animate-spin" /> Generating...</>
                      ) : (
                        <><Sparkles className="h-3.5 w-3.5" /> {generatedHtml ? "Regenerate" : "Generate A+ HTML"}</>
                      )}
                    </Button>
                    {generatedHtml && (
                      <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-primary text-white gap-2"
                        data-testid="btn-save-aplus"
                      >
                        {saving ? <><RefreshCw className="h-3.5 w-3.5 animate-spin" /> Saving...</> : <><CheckCircle className="h-3.5 w-3.5" /> Save & Enable</>}
                      </Button>
                    )}
                  </div>
                </CardHeader>
              </Card>

              {generating && (
                <Card>
                  <CardContent className="py-12 text-center space-y-3">
                    <RefreshCw className="h-8 w-8 animate-spin text-secondary mx-auto" />
                    <p className="text-muted-foreground/60 font-medium">AI is crafting your A+ content...</p>
                    <p className="text-muted-foreground/40 text-sm">Generating hero banner, highlights, spiritual significance, specs, usage guide & brand story</p>
                  </CardContent>
                </Card>
              )}

              {generatedHtml && !generating && (
                <Card>
                  <CardHeader className="pb-0">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <CardTitle className="text-base text-primary">
                        {previewMode ? "Live Preview" : "Generated HTML"}
                      </CardTitle>
                      <div className="flex items-center bg-muted rounded-lg p-0.5 gap-0.5">
                        <button
                          onClick={() => setPreviewMode(true)}
                          className={`text-xs px-3 py-1.5 rounded-md transition-all ${previewMode ? "bg-card text-primary font-semibold shadow-sm" : "text-muted-foreground/60 hover:text-muted-foreground"}`}
                          data-testid="btn-preview-mode"
                        >
                          Preview
                        </button>
                        <button
                          onClick={() => setPreviewMode(false)}
                          className={`text-xs px-3 py-1.5 rounded-md transition-all ${!previewMode ? "bg-card text-primary font-semibold shadow-sm" : "text-muted-foreground/60 hover:text-muted-foreground"}`}
                          data-testid="btn-html-mode"
                        >
                          HTML
                        </button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    {previewMode ? (
                      <div
                        className="border border-primary/10 rounded-lg overflow-hidden"
                        dangerouslySetInnerHTML={{ __html: sanitizeHtml(generatedHtml) }}
                        data-testid="aplus-preview"
                      />
                    ) : (
                      <div className="relative">
                        <Textarea
                          value={generatedHtml}
                          onChange={e => setGeneratedHtml(e.target.value)}
                          className="font-mono text-xs min-h-[400px] resize-y bg-foreground text-green-400 border-[#333]"
                          data-testid="textarea-aplus-html"
                        />
                        <p className="text-xs text-muted-foreground/40 mt-1.5">You can edit the HTML directly before saving</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}


export default AplusListingsTab;
