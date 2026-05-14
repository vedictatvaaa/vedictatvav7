import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ShoppingCart, Package, Search, Plus, Trash2, Edit, CheckCircle, Star, Image, Type, ArrowRight, BookOpen, RefreshCw, Upload, Sparkles, FileText, Layers, X, Wand2, Download, Megaphone } from "lucide-react";
import { PromoteProductDialog } from "@/components/admin/PromoteProductDialog";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

import { Checkbox } from "@/components/ui/checkbox";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { Product } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { createFetcher } from "../admin-shared";

// ============================================================
// Products Tab
// ============================================================
function ProductsTab() {
  const adminToken = typeof window !== "undefined" ? localStorage.getItem("adminToken") || "" : "";
  const fetcher = createFetcher(adminToken);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [showAddForm, setShowAddForm] = useState(false);
  const [showImportForm, setShowImportForm] = useState(false);
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [showOneClick, setShowOneClick] = useState(false);
  const [bulkMoveOpen, setBulkMoveOpen] = useState(false);
  const [bulkMoveCategory, setBulkMoveCategory] = useState("Puja Samagri");
  const [amazonUrl, setAmazonUrl] = useState("");
  const [importLoading, setImportLoading] = useState(false);
  const [importedProduct, setImportedProduct] = useState<any>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [promotingProductId, setPromotingProductId] = useState<number | null>(null);
  const [editStock, setEditStock] = useState<number>(0);
  const [editPrice, setEditPrice] = useState<number>(0);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkField, setBulkField] = useState<"price" | "salePrice" | "mrp" | "stock">("price");
  const [bulkOp, setBulkOp] = useState<"set" | "increase_pct" | "decrease_pct">("set");
  const [bulkValue, setBulkValue] = useState<number>(0);

  const toggleSelect = (id: number) => setSelectedIds((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]);

  const bulkUpdateMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/products/bulk-update", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-token": adminToken },
        body: JSON.stringify({ ids: selectedIds, field: bulkField, op: bulkOp, value: bulkValue }),
      });
      if (!res.ok) throw new Error((await res.json()).message || "Bulk update failed");
      return res.json();
    },
    onSuccess: (data: any) => {
      toast({ title: "Bulk update complete", description: `Updated ${data.updated} of ${selectedIds.length} products.` });
      setBulkOpen(false);
      setSelectedIds([]);
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
    },
    onError: (err: any) => toast({ title: "Bulk update failed", description: err.message, variant: "destructive" }),
  });

  const [newProduct, setNewProduct] = useState({
    name: "", description: "", price: 0, mrp: 0, salePrice: 0, dealPrice: 0, upcEan: "", weight: "", units: "", stock: 50, category: "Rudraksha", image: "", badge: "",
    highlights: [] as string[], features: [] as string[], richDescription: "", aplusEnabled: false,
    variationGroupId: "", variationLabel: "", variations: "",
    slug: "", brand: "", hsnCode: "", gstPercent: 18, productType: "product",
  });
  const [productImages, setProductImages] = useState<string[]>([]);
  const [productImageAlts, setProductImageAlts] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [newHighlight, setNewHighlight] = useState("");
  const [newFeature, setNewFeature] = useState("");
  const [aplusData, setAplusData] = useState<any>(null);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [altBackfillLoading, setAltBackfillLoading] = useState(false);
  const [aiTitleGenerating, setAiTitleGenerating] = useState(false);
  const [aiDescGenerating, setAiDescGenerating] = useState(false);
  const [formStep, setFormStep] = useState(0);

  const handleImportFetch = async () => {
    if (!amazonUrl.trim()) {
      toast({ title: "Error", description: "Please paste an Amazon product URL", variant: "destructive" });
      return;
    }
    setImportLoading(true);
    setImportedProduct(null);
    try {
      const res = await fetch("/api/admin/import-amazon", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-token": adminToken },
        body: JSON.stringify({ url: amazonUrl.trim() }),
      });
      const data = await res.json();
      if (!res.ok && !data.source) throw new Error(data.message);
      setImportedProduct(data);
      setNewProduct({
        name: data.name || "",
        description: data.description || "",
        price: data.price || 0,
        stock: 50,
        category: data.category || "Puja Items",
        image: data.image || "",
        badge: data.badge || "",
        highlights: data.highlights || [],
        features: [],
        richDescription: "",
        aplusEnabled: false,
      });
      if (data.images?.length > 0) {
        setProductImages(data.images);
        setProductImageAlts(data.images.map(() => ""));
      } else {
        setProductImages([]);
        setProductImageAlts([]);
      }
      setShowAddForm(true);
      setShowImportForm(false);
      if (data.source === "scraped") {
        toast({ title: "Product Fetched!", description: "Details extracted from Amazon. Review and save below." });
      } else if (data.source === "manual_required") {
        toast({ title: "Partial Import", description: data.message || "Amazon blocked the request. Please fill in details manually.", variant: "destructive" });
      } else {
        toast({ title: "Product Fetched!", description: "Some details may need manual entry." });
      }
    } catch (err: any) {
      toast({ title: "Import Failed", description: err.message, variant: "destructive" });
    }
    setImportLoading(false);
  };

  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
    queryFn: () => fetcher("/api/products"),
  });

  const categories = ["All", ...Array.from(new Set(products?.map((p) => p.category) || []))];

  const filtered = (products || []).filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === "All" || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Product> }) => {
      const res = await fetch(`/api/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-admin-token": adminToken || "" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Update failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: "Product Updated", description: "Product has been updated successfully." });
      setEditingId(null);
    },
    onError: () => toast({ title: "Error", description: "Failed to update product.", variant: "destructive" }),
  });

  const handleImageUpload = async (files: FileList) => {
    setUploading(true);
    try {
      const formData = new FormData();
      Array.from(files).forEach(f => formData.append("images", f));
      const res = await fetch("/api/admin/upload-images", {
        method: "POST",
        headers: { "x-admin-token": adminToken },
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      const urls = data.urls as string[];
      setProductImages(prev => [...prev, ...urls]);
      setProductImageAlts(prev => [...prev, ...urls.map(() => "")]);
      if (!newProduct.image && urls.length > 0) {
        setNewProduct(p => ({ ...p, image: urls[0] }));
      }
      toast({ title: "Images Uploaded", description: `${urls.length} image(s) uploaded successfully.` });
    } catch (err: any) {
      toast({ title: "Upload Failed", description: err.message, variant: "destructive" });
    }
    setUploading(false);
  };

  const handleAiGenerate = async () => {
    if (!newProduct.name) {
      toast({ title: "Name Required", description: "Please enter a product name first.", variant: "destructive" });
      return;
    }
    setAiGenerating(true);
    try {
      const res = await fetch("/api/admin/generate-aplus", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-token": adminToken },
        body: JSON.stringify({
          name: newProduct.name,
          category: newProduct.category,
          price: newProduct.price,
          description: newProduct.description,
          highlights: newProduct.highlights,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).message);
      const data = await res.json();
      setAplusData(data);
      setNewProduct(p => ({
        ...p,
        name: data.title || p.name,
        description: data.description || p.description,
        highlights: data.bulletPoints || p.highlights,
        features: data.features || p.features,
        richDescription: JSON.stringify(data.aplusContent || {}),
        aplusEnabled: true,
      }));
      toast({ title: "A+ Listing Generated!", description: "AI has created a premium product listing. Review below." });
    } catch (err: any) {
      toast({ title: "AI Generation Failed", description: err.message, variant: "destructive" });
    }
    setAiGenerating(false);
  };

  const handleAiTitle = async () => {
    if (!newProduct.name) {
      toast({ title: "Enter basic title", description: "Please enter a basic product name first.", variant: "destructive" });
      return;
    }
    setAiTitleGenerating(true);
    try {
      const res = await fetch("/api/admin/generate-seo-title", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-token": adminToken },
        body: JSON.stringify({ name: newProduct.name, category: newProduct.category }),
      });
      if (!res.ok) throw new Error((await res.json()).message);
      const data = await res.json();
      setNewProduct(p => ({ ...p, name: data.title || p.name }));
      toast({ title: "SEO Title Generated!", description: "AI has optimized your product title." });
    } catch (err: any) {
      toast({ title: "AI Title Failed", description: err.message, variant: "destructive" });
    }
    setAiTitleGenerating(false);
  };

  const handleAiDescription = async () => {
    if (!newProduct.name) {
      toast({ title: "Enter title first", description: "Please enter a product name first.", variant: "destructive" });
      return;
    }
    setAiDescGenerating(true);
    try {
      const res = await fetch("/api/admin/generate-seo-description", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-token": adminToken },
        body: JSON.stringify({ name: newProduct.name, category: newProduct.category, description: newProduct.description }),
      });
      if (!res.ok) throw new Error((await res.json()).message);
      const data = await res.json();
      setNewProduct(p => ({ ...p, description: data.description || p.description }));
      toast({ title: "SEO Description Generated!", description: "AI has created an optimized product description." });
    } catch (err: any) {
      toast({ title: "AI Description Failed", description: err.message, variant: "destructive" });
    }
    setAiDescGenerating(false);
  };

  const createMutation = useMutation({
    mutationFn: async (data: typeof newProduct) => {
      const payload = {
        ...data,
        price: data.salePrice || data.mrp || data.price,
        images: productImages.length > 0 ? productImages : undefined,
        imageAlts: productImageAlts.length > 0 ? productImageAlts : undefined,
        variationGroupId: data.variationGroupId || undefined,
        variationLabel: data.variationLabel || undefined,
        variations: data.variations || undefined,
      };
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-token": adminToken || "" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Create failed");
      return res.json();
    },
    onSuccess: async (product: any) => {
      if (importedProduct?.reviews?.length > 0 && product?.id && adminToken) {
        try {
          const reviewRes = await fetch("/api/admin/import-reviews", {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-admin-token": adminToken },
            body: JSON.stringify({ productId: product.id, reviews: importedProduct.reviews }),
          });
          if (reviewRes.ok) {
            const reviewData = await reviewRes.json();
            toast({ title: "Product Created with Reviews!", description: `Product added with ${reviewData.imported} Amazon reviews (3★ and above).` });
          } else {
            toast({ title: "Product Created", description: "Product added but reviews import failed." });
          }
        } catch {
          toast({ title: "Product Created", description: "Product added but reviews import failed." });
        }
      } else {
        toast({ title: "Product Created", description: "New product added successfully." });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      setShowAddForm(false);
      setImportedProduct(null);
      setProductImages([]);
      setAplusData(null);
      setFormStep(0);
      setNewProduct({ name: "", description: "", price: 0, mrp: 0, salePrice: 0, dealPrice: 0, upcEan: "", weight: "", units: "", stock: 50, category: "Rudraksha", image: "", badge: "", highlights: [], features: [], richDescription: "", aplusEnabled: false, variationGroupId: "", variationLabel: "", variations: "", slug: "", brand: "", hsnCode: "", gstPercent: 18, productType: "product" });
      setProductImageAlts([]);
    },
    onError: () => toast({ title: "Error", description: "Failed to create product.", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE", headers: { "x-admin-token": adminToken || "" } });
      if (!res.ok) throw new Error("Delete failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: "Product Deleted", description: "Product removed successfully." });
    },
    onError: () => toast({ title: "Error", description: "Failed to delete product.", variant: "destructive" }),
  });

  const [editVariationGroupId, setEditVariationGroupId] = useState("");
  const [editVariationLabel, setEditVariationLabel] = useState("");

  const startEdit = (p: Product) => {
    setEditingId(p.id);
    setEditStock(p.stock);
    setEditPrice(p.price);
    setEditVariationGroupId(p.variations || "");
    setEditVariationLabel("");
    setNewProduct({
      name: p.name,
      description: p.description || "",
      price: p.price,
      stock: p.stock,
      category: p.category,
      image: p.image || "",
      badge: p.badge || "",
      highlights: (p.highlights as string[]) || [],
      features: (p.features as string[]) || [],
      richDescription: p.richDescription || "",
      aplusEnabled: p.aplusEnabled || false,
      variationGroupId: "",
      variationLabel: "",
      variations: p.variations || "",
      slug: p.slug || "",
      brand: (p as any).brand || "",
      hsnCode: (p as any).hsnCode || "",
      gstPercent: (p as any).gstPercent ?? 18,
      productType: (p as any).productType || "product",
    });
    const imgs = (p.images as string[]) || (p.image ? [p.image] : []);
    setProductImages(imgs);
    const alts = (p.imageAlts as string[]) || [];
    setProductImageAlts(imgs.map((_, i) => alts[i] || ""));
    setFormStep(0);
    setShowAddForm(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif text-primary" data-testid="page-title-products">Products</h1>
          <p className="text-sm text-muted-foreground">Manage your product catalog</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setShowOneClick(true)} className="bg-gradient-to-r from-primary to-primary text-primary font-bold gap-2" data-testid="btn-one-click-listing">
            <Sparkles className="w-4 h-4" /> AI One-Click Listing
          </Button>
          <Button onClick={() => setShowQuickCreate(true)} className="bg-gradient-to-r from-primary to-primary text-white gap-2" data-testid="btn-quick-create-ai">
            <Wand2 className="w-4 h-4" /> Quick Create with AI
          </Button>
          <Button
            variant="outline"
            disabled={altBackfillLoading}
            onClick={async () => {
              const missingCount = (products || []).filter(p => !p.imageAlts || p.imageAlts.length === 0).length;
              if (missingCount === 0) {
                toast({ title: "All caught up", description: "Every product already has AI image alts." });
                return;
              }
              if (!confirm(`Generate AI image alts for ${missingCount} product${missingCount === 1 ? "" : "s"}? This may take ~${Math.ceil(missingCount * 1.5)}s.`)) return;
              setAltBackfillLoading(true);
              try {
                const res = await fetch("/api/admin/products/backfill-alts-all", {
                  method: "POST",
                  headers: { "Content-Type": "application/json", "x-admin-token": adminToken },
                  body: JSON.stringify({ onlyMissing: true }),
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.message || "Failed");
                queryClient.invalidateQueries({ queryKey: ["/api/products"] });
                toast({ title: "AI Alts Generated", description: `${data.processed} succeeded${data.failed ? `, ${data.failed} failed` : ""}${data.remaining ? ` — ${data.remaining} more remain, click again to continue.` : "."}` });
              } catch (err: any) {
                toast({ title: "Failed", description: err.message, variant: "destructive" });
              } finally {
                setAltBackfillLoading(false);
              }
            }}
            className="gap-2"
            data-testid="btn-backfill-alts"
          >
            <Wand2 className="w-4 h-4" /> {altBackfillLoading ? "Generating…" : "AI Backfill Alts"}
          </Button>
          <Button variant="outline" onClick={() => { setShowImportForm(!showImportForm); setShowAddForm(false); setImportedProduct(null); }} className="gap-2" data-testid="btn-import-amazon">
            <ShoppingCart className="w-4 h-4" /> Import from Amazon
          </Button>
          <Button
            variant="outline"
            onClick={async () => {
              try {
                const res = await fetch("/api/admin/products/export-csv", { headers: { "x-admin-token": adminToken } });
                if (!res.ok) throw new Error("Export failed");
                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url; a.download = `products-${Date.now()}.csv`; a.click();
                URL.revokeObjectURL(url);
                toast({ title: "Exported", description: "Products CSV downloaded." });
              } catch (e: any) {
                toast({ title: "Export failed", description: e.message, variant: "destructive" });
              }
            }}
            className="gap-2"
            data-testid="btn-export-products-csv"
          >
            <Download className="w-4 h-4" /> Export CSV
          </Button>
          <label className="inline-flex">
            <input
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              data-testid="input-import-products-csv"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                if (!confirm(`Import "${file.name}"? Rows with matching id/slug will UPDATE existing products; new rows require name+category+image+price.`)) {
                  e.target.value = "";
                  return;
                }
                const fd = new FormData();
                fd.append("file", file);
                try {
                  const res = await fetch("/api/admin/products/import-csv", {
                    method: "POST",
                    headers: { "x-admin-token": adminToken },
                    body: fd,
                  });
                  const data = await res.json();
                  if (!res.ok) throw new Error(data.message || "Import failed");
                  queryClient.invalidateQueries({ queryKey: ["/api/products"] });
                  queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
                  toast({
                    title: "Import Complete",
                    description: `Updated ${data.updated}, inserted ${data.inserted}, skipped ${data.skipped}.`,
                  });
                  if (data.errors?.length) console.warn("CSV import warnings:", data.errors);
                } catch (err: any) {
                  toast({ title: "Import failed", description: err.message, variant: "destructive" });
                } finally {
                  e.target.value = "";
                }
              }}
            />
            <span className="inline-flex items-center gap-2 h-9 px-4 rounded-md border bg-background text-sm font-medium hover-elevate active-elevate-2 cursor-pointer">
              <Upload className="w-4 h-4" /> Import CSV
            </span>
          </label>
          <Button variant="outline" onClick={() => { setShowAddForm(!showAddForm); setShowImportForm(false); setImportedProduct(null); setEditingId(null); setNewProduct({ name: "", description: "", price: 0, mrp: 0, salePrice: 0, dealPrice: 0, upcEan: "", weight: "", units: "", stock: 50, category: "Puja Samagri", image: "", badge: "", highlights: [], features: [], richDescription: "", aplusEnabled: false, variationGroupId: "", variationLabel: "", variations: "", slug: "", brand: "", hsnCode: "", gstPercent: 18, productType: "product" }); setProductImages([]); setProductImageAlts([]); setFormStep(0); }} className="gap-2" data-testid="btn-add-product">
            <Plus className="w-4 h-4" /> Advanced Form
          </Button>
        </div>
      </div>

      <QuickCreateProductDialog
        open={showQuickCreate}
        onClose={() => setShowQuickCreate(false)}
        adminToken={adminToken}
        onCreated={() => {
          queryClient.invalidateQueries({ queryKey: ["/api/products"] });
          queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
          setShowQuickCreate(false);
          toast({ title: "Product Created", description: "AI-generated listing saved successfully." });
        }}
      />

      <OneClickListingDialog
        open={showOneClick}
        onClose={() => setShowOneClick(false)}
        adminToken={adminToken}
        onCreated={() => {
          queryClient.invalidateQueries({ queryKey: ["/api/products"] });
          queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
          setShowOneClick(false);
          toast({ title: "Listing Created", description: "AI listing saved. Open it to fine-tune images and pricing." });
        }}
      />

      {showImportForm && (
        <Card className="bg-card border-primary/30 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-primary flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-primary" /> Import Product from Amazon
            </CardTitle>
            <CardDescription>Paste any Amazon product link below to automatically import product details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                value={amazonUrl}
                onChange={(e) => setAmazonUrl(e.target.value)}
                placeholder="https://www.amazon.in/dp/B0XXXXXXXX or full Amazon product URL..."
                className="flex-1 border-primary/30 focus:ring-primary"
                data-testid="input-amazon-url"
              />
              <Button
                onClick={handleImportFetch}
                disabled={importLoading}
                className="bg-primary hover:bg-primary text-primary font-bold gap-2 whitespace-nowrap"
                data-testid="btn-fetch-amazon"
              >
                {importLoading ? (
                  <><RefreshCw className="w-4 h-4 animate-spin" /> Fetching...</>
                ) : (
                  <><ArrowRight className="w-4 h-4" /> Fetch Details</>
                )}
              </Button>
            </div>

            {importedProduct && (
              <div className="mt-3 p-4 bg-muted rounded-lg border border-primary/20">
                <div className="flex items-start gap-4">
                  {importedProduct.image && (
                    <img src={importedProduct.image} alt={importedProduct.name} className="w-20 h-20 object-cover rounded-lg bg-card border" />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-primary text-sm">{importedProduct.name || "Product name not found"}</h3>
                    {importedProduct.price > 0 && <p className="text-primary font-bold mt-1">₹{importedProduct.price.toLocaleString()}</p>}
                    {importedProduct.rating && <p className="text-xs text-primary mt-1">{importedProduct.rating} {importedProduct.reviewCount && `(${importedProduct.reviewCount})`}</p>}
                    {importedProduct.badge && (
                      <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded bg-primary text-primary">★ {importedProduct.badge}</span>
                    )}
                    {importedProduct.source === "manual_required" && (
                      <p className="text-xs text-amber-600 mt-2">Some details couldn't be extracted. Please fill them in below.</p>
                    )}
                  </div>
                </div>
                {importedProduct.highlights?.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Key Features:</p>
                    <ul className="text-xs text-muted-foreground/70 space-y-1">
                      {importedProduct.highlights.slice(0, 4).map((h: string, i: number) => (
                        <li key={i} className="flex gap-1"><span className="text-primary">•</span> {h}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {importedProduct.reviews?.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      Amazon Reviews (3★+): <span className="text-primary font-bold">{importedProduct.reviews.length} found</span>
                    </p>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {importedProduct.reviews.map((r: any, i: number) => (
                        <div key={i} className="p-2 bg-card rounded border text-xs">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-primary">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>
                            <span className="font-medium text-muted-foreground">{r.reviewerName}</span>
                            {r.verified && <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1 rounded">Verified</span>}
                          </div>
                          {r.title && <p className="font-medium text-primary">{r.title}</p>}
                          {r.body && <p className="text-muted-foreground/70 line-clamp-2">{r.body}</p>}
                        </div>
                      ))}
                    </div>
                    <p className="text-[10px] text-muted-foreground/40 mt-1">These reviews will be automatically imported when you save the product</p>
                  </div>
                )}
                <p className="text-xs text-emerald-600 mt-3 font-medium">Product details loaded into the form below. Review and save!</p>
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => { setShowImportForm(false); setAmazonUrl(""); setImportedProduct(null); }} data-testid="btn-cancel-import">
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Amazon-Style Add Product Form */}
      {showAddForm && (
        <Card className="bg-card border-secondary/30 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-primary to-primary text-white rounded-t-lg">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl flex items-center gap-2"><Package className="w-5 h-5 text-primary" /> {editingId ? "Edit Product" : "Add New Product"}</CardTitle>
                <CardDescription className="text-gray-300 mt-1">{editingId ? "Update product details" : "Create an Amazon-style product listing"}</CardDescription>
              </div>
              <Button onClick={handleAiGenerate} disabled={aiGenerating || !newProduct.name} className="bg-gradient-to-r from-primary to-secondary text-primary font-bold gap-2 hover:from-primary hover:to-secondary" data-testid="btn-ai-generate">
                {aiGenerating ? <><RefreshCw className="w-4 h-4 animate-spin" /> Generating...</> : <><Wand2 className="w-4 h-4" /> AI Generate A+ Listing</>}
              </Button>
            </div>
            <div className="flex gap-1 mt-4">
              {["Basic Info", "Images", "Details", "A+ Content"].map((step, i) => (
                <button key={i} onClick={() => setFormStep(i)} className={`flex-1 py-2 px-3 text-xs font-medium rounded-t-lg transition-all ${formStep === i ? "bg-card text-primary" : "bg-card/10 text-white/70 hover:bg-card/20"}`} data-testid={`btn-step-${i}`}>
                  <span className="mr-1">{i + 1}.</span>{step}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="pt-6">

            {formStep === 0 && (
              <div className="space-y-5">
                <h3 className="font-semibold text-primary flex items-center gap-2 text-base"><FileText className="w-4 h-4 text-primary" /> Vital Info</h3>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Product Title <span className="text-red-500">*</span></Label>
                  <div className="flex gap-2">
                    <Input value={newProduct.name} onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })} placeholder="e.g. Pure Brass Puja Thali Set" className="border-border focus:ring-primary flex-1" data-testid="input-product-name" />
                    <Button type="button" onClick={handleAiTitle} disabled={aiTitleGenerating || !newProduct.name} className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white gap-1 px-3" data-testid="btn-ai-title">
                      {aiTitleGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />} AI Title
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">{newProduct.name.length}/200 characters. Enter basic title, then click AI to generate SEO-optimized title.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Category <span className="text-red-500">*</span></Label>
                    <Select value={newProduct.category} onValueChange={(v) => setNewProduct({ ...newProduct, category: v })}>
                      <SelectTrigger className="border-border" data-testid="input-product-category"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["Rudraksha", "Dhoti & Kurta", "Puja Samagri", "Havan Samagri", "Brass & Copperware", "Idols & Murtis", "Wearables", "Gemstones", "Sacred Threads", "Books & Scriptures", "Yantras", "Spiritual Clothing", "Ayurvedic Products", "Home Decor", "Gifts", "Other"].map(c => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Stock Quantity</Label>
                    <Input type="number" value={newProduct.stock} onChange={(e) => setNewProduct({ ...newProduct, stock: Number(e.target.value) })} className="border-border" data-testid="input-product-stock" />
                  </div>
                </div>

                {/* Pricing Section */}
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg space-y-3">
                  <Label className="text-sm font-bold text-emerald-800">Pricing</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">MRP (₹) <span className="text-red-500">*</span></Label>
                      <Input type="number" value={newProduct.mrp || ""} onChange={(e) => setNewProduct({ ...newProduct, mrp: Number(e.target.value), price: newProduct.salePrice || Number(e.target.value) })} placeholder="1999" className="border-border" data-testid="input-product-mrp" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Sale Price (₹) <span className="text-red-500">*</span></Label>
                      <Input type="number" value={newProduct.salePrice || ""} onChange={(e) => setNewProduct({ ...newProduct, salePrice: Number(e.target.value), price: Number(e.target.value) })} placeholder="999" className="border-border" data-testid="input-product-sale" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Deal Price (₹)</Label>
                      <Input type="number" value={newProduct.dealPrice || ""} onChange={(e) => setNewProduct({ ...newProduct, dealPrice: Number(e.target.value) })} placeholder="799" className="border-border" data-testid="input-product-deal" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Units</Label>
                      <Input value={newProduct.units} onChange={(e) => setNewProduct({ ...newProduct, units: e.target.value })} placeholder="e.g. 500g, 1L" className="border-border" data-testid="input-product-units" />
                    </div>
                  </div>
                </div>

                {/* Product Info Section */}
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-3">
                  <Label className="text-sm font-bold text-blue-800">Product Information</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">UPC/EAN No</Label>
                      <Input value={newProduct.upcEan} onChange={(e) => setNewProduct({ ...newProduct, upcEan: e.target.value })} placeholder="8901234567890" className="border-border" data-testid="input-product-upc" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Weight</Label>
                      <Input value={newProduct.weight} onChange={(e) => setNewProduct({ ...newProduct, weight: e.target.value })} placeholder="e.g. 250g, 1kg" className="border-border" data-testid="input-product-weight" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Badge</Label>
                      <Select value={newProduct.badge || "none"} onValueChange={(v) => setNewProduct({ ...newProduct, badge: v === "none" ? "" : v })}>
                        <SelectTrigger className="border-border h-9" data-testid="input-product-badge"><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="Best Seller">Best Seller</SelectItem>
                          <SelectItem value="Amazon Choice">Amazon Choice</SelectItem>
                          <SelectItem value="New Arrival">New Arrival</SelectItem>
                          <SelectItem value="Limited Edition">Limited Edition</SelectItem>
                          <SelectItem value="Premium">Premium</SelectItem>
                          <SelectItem value="Handcrafted">Handcrafted</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                {/* SEO, Brand & Tax Section */}
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg space-y-3">
                  <Label className="text-sm font-bold text-purple-800">SEO, Brand & Tax</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">URL Slug</Label>
                      <div className="flex gap-2">
                        <Input
                          value={newProduct.slug}
                          onChange={(e) => setNewProduct({ ...newProduct, slug: e.target.value })}
                          placeholder="auto-generated if empty"
                          className="border-border flex-1"
                          data-testid="input-product-slug"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const s = (newProduct.name || "")
                              .toLowerCase()
                              .trim()
                              .replace(/[^a-z0-9]+/g, "-")
                              .replace(/^-+|-+$/g, "");
                            setNewProduct({ ...newProduct, slug: s });
                          }}
                          disabled={!newProduct.name}
                          data-testid="btn-generate-slug"
                        >
                          From Name
                        </Button>
                      </div>
                      <p className="text-[10px] text-muted-foreground">URL: /products/{newProduct.slug || "auto-generated"}</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Brand</Label>
                      <Input
                        value={newProduct.brand}
                        onChange={(e) => setNewProduct({ ...newProduct, brand: e.target.value })}
                        placeholder="e.g. Vedic Tatva"
                        className="border-border"
                        data-testid="input-product-brand"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">HSN Code</Label>
                      <Input
                        value={newProduct.hsnCode}
                        onChange={(e) => setNewProduct({ ...newProduct, hsnCode: e.target.value })}
                        placeholder="e.g. 7117"
                        className="border-border"
                        data-testid="input-product-hsn"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">GST %</Label>
                      <Select
                        value={String(newProduct.gstPercent ?? 18)}
                        onValueChange={(v) => setNewProduct({ ...newProduct, gstPercent: Number(v) })}
                      >
                        <SelectTrigger className="border-border h-9" data-testid="input-product-gst"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">0% (Exempt)</SelectItem>
                          <SelectItem value="3">3% (Gold/Silver)</SelectItem>
                          <SelectItem value="5">5% (Wood/Samagri)</SelectItem>
                          <SelectItem value="12">12% (Metals)</SelectItem>
                          <SelectItem value="18">18% (Standard)</SelectItem>
                          <SelectItem value="28">28% (Luxury)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Product Type</Label>
                      <Select
                        value={newProduct.productType || "product"}
                        onValueChange={(v) => setNewProduct({ ...newProduct, productType: v })}
                      >
                        <SelectTrigger className="border-border h-9" data-testid="input-product-type"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="product">Physical Product</SelectItem>
                          <SelectItem value="service">Service / Consultation</SelectItem>
                          <SelectItem value="digital">Digital Download</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg space-y-3">
                  <Label className="text-sm font-bold text-amber-800">Product Variations (optional)</Label>
                  <p className="text-xs text-amber-600">Add variations as JSON. Each variation has a label and price. The base price above will be used if no variations are set.</p>
                  <textarea
                    value={newProduct.variations}
                    onChange={(e) => setNewProduct({ ...newProduct, variations: e.target.value })}
                    placeholder='[{"label":"Pack of 24","price":199},{"label":"Pack of 65","price":299}]'
                    className="w-full p-2 border border-border rounded text-sm font-mono h-20"
                    data-testid="input-variations"
                  />
                  <p className="text-[10px] text-amber-500">Format: [{"{"}"label":"Name","price":100{"}"}, ...] — Leave empty for single-variant products.</p>
                </div>
                <div className="flex justify-end pt-2">
                  <Button onClick={() => setFormStep(1)} className="bg-primary hover:bg-primary text-primary font-bold gap-2" data-testid="btn-next-step-1">Next: Images <ArrowRight className="w-4 h-4" /></Button>
                </div>
              </div>
            )}

            {formStep === 1 && (
              <div className="space-y-5">
                <h3 className="font-semibold text-primary flex items-center gap-2 text-base"><Image className="w-4 h-4 text-primary" /> Product Images</h3>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors">
                  <input type="file" multiple accept="image/*" onChange={(e) => e.target.files && handleImageUpload(e.target.files)} className="hidden" id="image-upload" data-testid="input-image-upload" />
                  <label htmlFor="image-upload" className="cursor-pointer">
                    <Upload className="w-10 h-10 text-primary mx-auto mb-3" />
                    <p className="text-sm font-medium text-primary">Click to upload product images</p>
                    <p className="text-xs text-muted-foreground mt-1">JPG, PNG, WebP up to 50MB each. Upload up to 10 images.</p>
                  </label>
                  {uploading && <p className="text-sm text-primary mt-3 animate-pulse">Uploading images...</p>}
                </div>

                {productImages.length > 0 && (
                  <div className="space-y-3">
                    <Label className="text-sm font-medium block">Uploaded Images & Alt Text ({productImages.length})</Label>
                    <p className="text-xs text-muted-foreground">Alt text helps SEO and accessibility. Describe each image in 5-15 words.</p>
                    <div className="space-y-3">
                      {productImages.map((img, i) => (
                        <div key={i} className={`flex gap-3 p-3 rounded-lg border-2 ${newProduct.image === img ? "border-primary bg-muted" : "border-border bg-card"}`}>
                          <div className="relative group shrink-0">
                            <img src={img} alt={`Product ${i + 1}`} className="w-24 h-24 object-cover rounded" />
                            {newProduct.image === img && <span className="absolute top-1 left-1 text-[8px] bg-primary text-white px-1.5 py-0.5 rounded font-bold">MAIN</span>}
                          </div>
                          <div className="flex-1 space-y-2">
                            <Input
                              value={productImageAlts[i] || ""}
                              onChange={(e) => {
                                const next = [...productImageAlts];
                                while (next.length < productImages.length) next.push("");
                                next[i] = e.target.value;
                                setProductImageAlts(next);
                              }}
                              placeholder={`Alt text for image ${i + 1} (e.g. "Front view of pure brass puja thali")`}
                              className="border-border text-sm"
                              data-testid={`input-image-alt-${i}`}
                            />
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                size="sm"
                                variant={newProduct.image === img ? "default" : "outline"}
                                onClick={() => setNewProduct(p => ({ ...p, image: img }))}
                                className="gap-1"
                                data-testid={`btn-set-main-${i}`}
                              >
                                <Star className="w-3 h-3" /> {newProduct.image === img ? "Main Image" : "Set as Main"}
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  const updated = productImages.filter((_, j) => j !== i);
                                  const updatedAlts = productImageAlts.filter((_, j) => j !== i);
                                  setProductImages(updated);
                                  setProductImageAlts(updatedAlts);
                                  if (newProduct.image === img) setNewProduct(p => ({ ...p, image: updated[0] || "" }));
                                }}
                                className="gap-1 text-red-600"
                                data-testid={`btn-remove-img-${i}`}
                              >
                                <X className="w-3 h-3" /> Remove
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Or paste image URL</Label>
                  <div className="flex gap-2">
                    <Input value={newProduct.image} onChange={(e) => setNewProduct({ ...newProduct, image: e.target.value })} placeholder="https://example.com/image.jpg" className="flex-1 border-border" data-testid="input-product-image" />
                    {newProduct.image && !productImages.includes(newProduct.image) && (
                      <Button size="sm" variant="outline" onClick={() => { setProductImages(prev => [...prev, newProduct.image]); setProductImageAlts(prev => [...prev, ""]); }} data-testid="btn-add-url-image">
                        <Plus className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>

                <div className="flex justify-between pt-2">
                  <Button variant="outline" onClick={() => setFormStep(0)} data-testid="btn-prev-step-1">Back</Button>
                  <Button onClick={() => setFormStep(2)} className="bg-primary hover:bg-primary text-primary font-bold gap-2" data-testid="btn-next-step-2">Next: Details <ArrowRight className="w-4 h-4" /></Button>
                </div>
              </div>
            )}

            {formStep === 2 && (
              <div className="space-y-5">
                <h3 className="font-semibold text-primary flex items-center gap-2 text-base"><Layers className="w-4 h-4 text-primary" /> Product Details</h3>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Product Description <span className="text-red-500">*</span></Label>
                    <Button type="button" size="sm" onClick={handleAiDescription} disabled={aiDescGenerating || !newProduct.name} className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white gap-1" data-testid="btn-ai-description">
                      {aiDescGenerating ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />} AI Description
                    </Button>
                  </div>
                  <Textarea value={newProduct.description} onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })} placeholder="Enter basic description or click AI to generate SEO-optimized description..." rows={4} className="border-border" data-testid="input-product-description" />
                  <p className="text-xs text-muted-foreground">HTML tags supported: &lt;b&gt;, &lt;br&gt;, &lt;ul&gt;, &lt;li&gt;. Click AI to generate SEO-optimized description.</p>
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-medium">Key Feature Bullet Points</Label>
                  <p className="text-xs text-muted-foreground">Amazon-style bullet points. Start each with a CAPS keyword (e.g., PREMIUM QUALITY:)</p>
                  {newProduct.highlights.map((h, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-primary font-bold text-sm">•</span>
                      <Input value={h} onChange={(e) => { const updated = [...newProduct.highlights]; updated[i] = e.target.value; setNewProduct({ ...newProduct, highlights: updated }); }} className="flex-1 border-border text-sm" data-testid={`input-highlight-${i}`} />
                      <button onClick={() => setNewProduct({ ...newProduct, highlights: newProduct.highlights.filter((_, j) => j !== i) })} className="p-1 text-red-400 hover:text-red-600" data-testid={`btn-remove-highlight-${i}`}>
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <Input value={newHighlight} onChange={(e) => setNewHighlight(e.target.value)} placeholder="PREMIUM QUALITY: Made from pure brass with gold plating..." className="flex-1 border-border text-sm" data-testid="input-new-highlight" onKeyDown={(e) => { if (e.key === "Enter" && newHighlight.trim()) { setNewProduct({ ...newProduct, highlights: [...newProduct.highlights, newHighlight.trim()] }); setNewHighlight(""); } }} />
                    <Button size="sm" variant="outline" onClick={() => { if (newHighlight.trim()) { setNewProduct({ ...newProduct, highlights: [...newProduct.highlights, newHighlight.trim()] }); setNewHighlight(""); } }} data-testid="btn-add-highlight"><Plus className="w-4 h-4" /></Button>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-medium">Technical Specifications</Label>
                  <p className="text-xs text-muted-foreground">Product specs like Material, Weight, Dimensions, etc.</p>
                  {newProduct.features.map((f, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-muted-foreground/60 text-sm">▸</span>
                      <Input value={f} onChange={(e) => { const updated = [...newProduct.features]; updated[i] = e.target.value; setNewProduct({ ...newProduct, features: updated }); }} className="flex-1 border-border text-sm" data-testid={`input-feature-${i}`} />
                      <button onClick={() => setNewProduct({ ...newProduct, features: newProduct.features.filter((_, j) => j !== i) })} className="p-1 text-red-400 hover:text-red-600" data-testid={`btn-remove-feature-${i}`}>
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <Input value={newFeature} onChange={(e) => setNewFeature(e.target.value)} placeholder="Material: Pure Brass" className="flex-1 border-border text-sm" data-testid="input-new-feature" onKeyDown={(e) => { if (e.key === "Enter" && newFeature.trim()) { setNewProduct({ ...newProduct, features: [...newProduct.features, newFeature.trim()] }); setNewFeature(""); } }} />
                    <Button size="sm" variant="outline" onClick={() => { if (newFeature.trim()) { setNewProduct({ ...newProduct, features: [...newProduct.features, newFeature.trim()] }); setNewFeature(""); } }} data-testid="btn-add-feature"><Plus className="w-4 h-4" /></Button>
                  </div>
                </div>

                <div className="flex justify-between pt-2">
                  <Button variant="outline" onClick={() => setFormStep(1)} data-testid="btn-prev-step-2">Back</Button>
                  <Button onClick={() => setFormStep(3)} className="bg-primary hover:bg-primary text-primary font-bold gap-2" data-testid="btn-next-step-3">Next: A+ Content <ArrowRight className="w-4 h-4" /></Button>
                </div>
              </div>
            )}

            {formStep === 3 && (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-primary flex items-center gap-2 text-base"><Sparkles className="w-4 h-4 text-primary" /> A+ Content</h3>
                  <div className="flex items-center gap-2">
                    <Label className="text-sm">Enable A+ Content</Label>
                    <Switch checked={newProduct.aplusEnabled} onCheckedChange={(v) => setNewProduct({ ...newProduct, aplusEnabled: v })} data-testid="switch-aplus" />
                  </div>
                </div>

                {!aplusData && !newProduct.aplusEnabled && (
                  <div className="text-center py-8 bg-gradient-to-b from-muted to-white rounded-lg border border-dashed border-secondary/40">
                    <Wand2 className="w-12 h-12 text-secondary mx-auto mb-3" />
                    <h4 className="text-lg font-serif text-primary">Generate A+ Content with AI</h4>
                    <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">Enter your product's basic info (name, category, price) and let AI create a premium A+ listing with brand story, feature grids, comparison tables, and spiritual significance sections.</p>
                    <Button onClick={handleAiGenerate} disabled={aiGenerating || !newProduct.name} className="mt-4 bg-gradient-to-r from-secondary to-secondary text-primary font-bold gap-2" data-testid="btn-ai-generate-aplus">
                      {aiGenerating ? <><RefreshCw className="w-4 h-4 animate-spin" /> Generating...</> : <><Wand2 className="w-4 h-4" /> Generate A+ Listing</>}
                    </Button>
                  </div>
                )}

                {(aplusData || newProduct.aplusEnabled) && (
                  <div className="space-y-4">
                    {aplusData?.aplusContent?.brandStory && (
                      <div className="p-4 bg-gradient-to-r from-muted to-muted rounded-lg border border-secondary/30">
                        <h4 className="text-sm font-bold text-primary mb-2 flex items-center gap-2"><BookOpen className="w-4 h-4" /> Brand Story</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">{aplusData.aplusContent.brandStory}</p>
                      </div>
                    )}

                    {aplusData?.aplusContent?.sections?.map((section: any, i: number) => (
                      <div key={i} className="p-4 bg-card rounded-lg border border-border">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[8px] font-bold uppercase bg-primary text-primary px-2 py-0.5 rounded">{section.type?.replace(/_/g, " ")}</span>
                          <h4 className="text-sm font-bold text-primary">{section.heading}</h4>
                        </div>
                        {section.text && <p className="text-sm text-muted-foreground">{section.text}</p>}
                        {section.items && (
                          <div className="grid grid-cols-2 gap-3 mt-2">
                            {section.items.map((item: any, j: number) => (
                              <div key={j} className="p-2 bg-muted rounded">
                                <p className="text-xs font-bold text-primary">{item.title}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                              </div>
                            ))}
                          </div>
                        )}
                        {section.rows && (
                          <div className="mt-2 border rounded overflow-hidden">
                            {section.rows.map((row: any, j: number) => (
                              <div key={j} className={`flex text-xs ${j % 2 === 0 ? "bg-muted/50" : "bg-card"}`}>
                                <span className="font-medium text-primary px-3 py-1.5 w-1/3 border-r">{row.label}</span>
                                <span className="text-muted-foreground px-3 py-1.5 flex-1">{row.value}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {section.steps && (
                          <ol className="mt-2 space-y-1">
                            {section.steps.map((step: string, j: number) => (
                              <li key={j} className="text-xs text-muted-foreground flex gap-2"><span className="font-bold text-primary">{j + 1}.</span> {step}</li>
                            ))}
                          </ol>
                        )}
                      </div>
                    ))}

                    {aplusData?.searchTerms && (
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <Label className="text-xs font-medium text-muted-foreground">SEO Search Terms</Label>
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          {aplusData.searchTerms.map((t: string, i: number) => (
                            <span key={i} className="text-xs bg-card border px-2 py-1 rounded-full text-muted-foreground">{t}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    <Button onClick={handleAiGenerate} disabled={aiGenerating} variant="outline" className="gap-2 w-full" data-testid="btn-regenerate-aplus">
                      {aiGenerating ? <><RefreshCw className="w-4 h-4 animate-spin" /> Regenerating...</> : <><RefreshCw className="w-4 h-4" /> Regenerate A+ Content</>}
                    </Button>
                  </div>
                )}

                <div className="flex justify-between pt-4 border-t">
                  <Button variant="outline" onClick={() => setFormStep(2)} data-testid="btn-prev-step-3">Back</Button>
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => { setShowAddForm(false); setFormStep(0); setAplusData(null); setProductImages([]); setEditingId(null); }} data-testid="btn-cancel-add-product">Cancel</Button>
                    {editingId ? (
                      <Button onClick={() => {
                        const payload: any = {
                          name: newProduct.name,
                          description: newProduct.description,
                          price: newProduct.price,
                          stock: newProduct.stock,
                          category: newProduct.category,
                          image: newProduct.image,
                          images: productImages.length > 0 ? productImages : undefined,
                          imageAlts: productImageAlts.length > 0 ? productImageAlts : undefined,
                          badge: newProduct.badge || null,
                          highlights: newProduct.highlights,
                          features: newProduct.features,
                          richDescription: newProduct.richDescription,
                          aplusEnabled: newProduct.aplusEnabled,
                          variations: newProduct.variations || undefined,
                          slug: newProduct.slug || undefined,
                          brand: newProduct.brand || undefined,
                          hsnCode: newProduct.hsnCode || undefined,
                          gstPercent: newProduct.gstPercent,
                          productType: newProduct.productType || undefined,
                        };
                        updateMutation.mutate({ id: editingId, data: payload });
                        setShowAddForm(false);
                        setEditingId(null);
                        setFormStep(0);
                        setAplusData(null);
                        setProductImages([]);
                      }} disabled={updateMutation.isPending || !newProduct.name || (!newProduct.salePrice && !newProduct.mrp && !newProduct.price)} className="bg-primary text-white font-bold gap-2 px-6" data-testid="btn-save-edit-product">
                        {updateMutation.isPending ? <><RefreshCw className="w-4 h-4 animate-spin" /> Updating...</> : <><CheckCircle className="w-4 h-4" /> Update Product</>}
                      </Button>
                    ) : (
                      <Button onClick={() => createMutation.mutate(newProduct)} disabled={createMutation.isPending || !newProduct.name || (!newProduct.salePrice && !newProduct.mrp)} className="bg-primary text-white font-bold gap-2 px-6" data-testid="btn-save-new-product">
                        {createMutation.isPending ? <><RefreshCw className="w-4 h-4 animate-spin" /> Creating...</> : <><CheckCircle className="w-4 h-4" /> Save & Publish Product</>}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}

          </CardContent>
        </Card>
      )}

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
          <Input
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
            data-testid="input-search-products"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[200px]" data-testid="select-category-filter">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Bulk action toolbar */}
      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between gap-3 p-3 rounded-md border border-primary/30 bg-muted" data-testid="bulk-action-bar">
          <div className="text-sm text-muted-foreground"><strong>{selectedIds.length}</strong> selected</div>
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => setSelectedIds(filtered.map((p) => p.id))} data-testid="button-select-all-filtered">Select all {filtered.length}</Button>
            <Button size="sm" variant="outline" onClick={() => setSelectedIds([])} data-testid="button-clear-selection">Clear</Button>
            <Button size="sm" variant="outline" onClick={() => setBulkMoveOpen(true)} data-testid="button-open-bulk-move">Move to category…</Button>
            <Button size="sm" className="bg-primary text-white" onClick={() => setBulkOpen(true)} data-testid="button-open-bulk-edit">Bulk edit…</Button>
          </div>
        </div>
      )}

      {/* Bulk move-to-category dialog */}
      <Dialog open={bulkMoveOpen} onOpenChange={setBulkMoveOpen}>
        <DialogContent data-testid="dialog-bulk-move-category">
          <DialogHeader>
            <DialogTitle>Move {selectedIds.length} products</DialogTitle>
            <DialogDescription>Transfer the selected products to a different category.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Target category</Label>
              <Select value={bulkMoveCategory} onValueChange={setBulkMoveCategory}>
                <SelectTrigger data-testid="select-bulk-move-category"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Puja Samagri","Havan Samagri","Idols & Murtis","Wearables","Brass & Copperware","Rudraksha","Gemstones","Yantras","Books & Scriptures","Spiritual Essentials"].map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkMoveOpen(false)} data-testid="button-cancel-bulk-move">Cancel</Button>
            <Button
              className="bg-primary text-white"
              data-testid="button-confirm-bulk-move"
              onClick={async () => {
                try {
                  const res = await fetch("/api/admin/products/transfer-category", {
                    method: "POST",
                    headers: { "Content-Type": "application/json", "x-admin-token": adminToken },
                    body: JSON.stringify({ productIds: selectedIds, targetCategory: bulkMoveCategory }),
                  });
                  const data = await res.json();
                  if (!res.ok) throw new Error(data?.message || "Move failed");
                  toast({ title: "Moved", description: `Transferred ${data.updated} products to ${data.targetCategory}.` });
                  setBulkMoveOpen(false);
                  setSelectedIds([]);
                  queryClient.invalidateQueries({ queryKey: ["/api/products"] });
                } catch (err: any) {
                  toast({ title: "Move failed", description: err?.message || "Could not transfer", variant: "destructive" });
                }
              }}
            >
              Move {selectedIds.length}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk edit dialog */}
      <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
        <DialogContent data-testid="dialog-bulk-edit">
          <DialogHeader>
            <DialogTitle>Bulk edit {selectedIds.length} products</DialogTitle>
            <DialogDescription>Apply a price or stock change to all selected products at once.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Field</Label>
              <Select value={bulkField} onValueChange={(v) => setBulkField(v as any)}>
                <SelectTrigger data-testid="select-bulk-field"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="price">Price</SelectItem>
                  <SelectItem value="salePrice">Sale price</SelectItem>
                  <SelectItem value="mrp">MRP</SelectItem>
                  <SelectItem value="stock">Stock</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Operation</Label>
              <Select value={bulkOp} onValueChange={(v) => setBulkOp(v as any)}>
                <SelectTrigger data-testid="select-bulk-op"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="set">Set to value</SelectItem>
                  {bulkField !== "stock" && <SelectItem value="increase_pct">Increase by %</SelectItem>}
                  {bulkField !== "stock" && <SelectItem value="decrease_pct">Decrease by %</SelectItem>}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{bulkOp === "set" ? "New value" : "Percent"}</Label>
              <Input type="number" min={0} value={bulkValue} onChange={(e) => setBulkValue(Number(e.target.value))} data-testid="input-bulk-value" />
              <p className="text-xs text-secondary mt-1">{bulkOp === "set" ? `All selected products will have ${bulkField} = ${bulkValue}.` : `All selected products' ${bulkField} will ${bulkOp === "increase_pct" ? "increase" : "decrease"} by ${bulkValue}%.`}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkOpen(false)}>Cancel</Button>
            <Button onClick={() => bulkUpdateMutation.mutate()} disabled={bulkUpdateMutation.isPending || !bulkValue} className="bg-primary text-white" data-testid="button-confirm-bulk-edit">
              {bulkUpdateMutation.isPending ? "Applying…" : "Apply"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Products Table */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((product) => (
            <Card key={product.id} className={`bg-card border-border ${selectedIds.includes(product.id) ? "ring-2 ring-primary" : ""}`} data-testid={`card-product-${product.id}`}>
              <CardContent className="py-4 flex items-center gap-4">
                <Checkbox checked={selectedIds.includes(product.id)} onCheckedChange={() => toggleSelect(product.id)} data-testid={`checkbox-product-${product.id}`} />
                <img src={product.image} alt={product.name} className="w-14 h-14 object-cover rounded-lg bg-muted" />
                <div className="flex-grow min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-primary truncate">{product.name}</h3>
                    {product.badge === "Amazon Choice" && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-primary text-primary whitespace-nowrap" data-testid={`badge-amazon-${product.id}`}>
                        ★ Amazon Choice
                      </span>
                    )}
                    {product.badge && product.badge !== "Amazon Choice" && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-secondary/10 text-secondary whitespace-nowrap">
                        {product.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {product.category}
                    {product.variations && (() => { try { const v = JSON.parse(product.variations); return v.length > 1 ? <span className="ml-2 text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded">{v.length} variations</span> : null; } catch { return null; } })()}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-bold text-foreground">₹{product.price.toLocaleString()}</p>
                      <p className={`text-xs ${product.stock === 0 ? "text-red-600 font-semibold" : "text-muted-foreground"}`}>
                        Stock: {product.stock}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setPromotingProductId(product.id)}
                        className="h-8 w-8 text-primary"
                        title="Promote on Google & Social"
                        data-testid={`btn-promote-product-${product.id}`}
                      >
                        <Megaphone className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => startEdit(product)} className="h-8 w-8 text-secondary" data-testid={`btn-edit-product-${product.id}`}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="icon" variant="ghost" className="text-destructive" data-testid={`btn-delete-product-${product.id}`}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete this product?</AlertDialogTitle>
                            <AlertDialogDescription>
                              "{product.name}" will be permanently removed from the catalog. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel data-testid={`btn-cancel-delete-product-${product.id}`}>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteMutation.mutate(product.id)}
                              className="bg-red-600 hover:bg-red-700 text-white"
                              data-testid={`btn-confirm-delete-product-${product.id}`}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
              </CardContent>
            </Card>
          ))}
          {filtered.length === 0 && (
            <p className="text-center text-muted-foreground py-8">No products found.</p>
          )}
        </div>
      )}

      <PromoteProductDialog
        productId={promotingProductId}
        open={promotingProductId !== null}
        onOpenChange={(o) => { if (!o) setPromotingProductId(null); }}
        adminToken={adminToken}
      />
    </div>
  );
}

// ============================================================
// AI One-Click Listing Dialog
// 4-step wizard: upload images → AI polish to white-bg hero →
// fill name/UPC/attributes → AI generates full listing → save.
// ============================================================
function OneClickListingDialog({
  open,
  onClose,
  adminToken,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  adminToken: string;
  onCreated: (product: any) => void;
}) {
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [rawImages, setRawImages] = useState<string[]>([]);
  const [polishedImages, setPolishedImages] = useState<string[]>([]);
  const [polishing, setPolishing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [name, setName] = useState("");
  const [upc, setUpc] = useState("");
  const [attributes, setAttributes] = useState("");
  const [hintPrice, setHintPrice] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [generating, setGenerating] = useState(false);
  const [listing, setListing] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setStep(0); setRawImages([]); setPolishedImages([]); setPolishing(false); setUploading(false);
    setName(""); setUpc(""); setAttributes(""); setHintPrice(""); setCategory("");
    setGenerating(false); setListing(null); setSaving(false);
  };
  const close = () => { reset(); onClose(); };

  const handleUpload = async (files: FileList) => {
    if (rawImages.length + files.length > 7) {
      toast({ title: "Max 7 images", description: "Please choose up to 7 images total.", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      Array.from(files).forEach(f => fd.append("images", f));
      const res = await fetch("/api/admin/upload-images", { method: "POST", headers: { "x-admin-token": adminToken }, body: fd });
      if (!res.ok) throw new Error("Upload failed");
      const { urls } = await res.json();
      setRawImages(prev => [...prev, ...urls]);
      setPolishedImages(prev => [...prev, ...urls]);
    } catch (e: any) {
      toast({ title: "Upload failed", description: e?.message || "Could not upload", variant: "destructive" });
    } finally { setUploading(false); }
  };

  const polishAll = async () => {
    if (rawImages.length === 0) {
      toast({ title: "Add images first", description: "Upload at least one image to polish.", variant: "destructive" });
      return;
    }
    setPolishing(true);
    const next: string[] = [];
    for (let i = 0; i < rawImages.length; i++) {
      try {
        const res = await fetch("/api/admin/ai/polish-image", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-admin-token": adminToken },
          body: JSON.stringify({ url: rawImages[i] }),
        });
        const data = await res.json();
        if (res.ok && data?.url) next.push(data.url);
        else { next.push(rawImages[i]); toast({ title: `Image ${i + 1} kept original`, description: data?.message || "AI polish skipped", variant: "destructive" }); }
      } catch {
        next.push(rawImages[i]);
      }
    }
    setPolishedImages(next);
    setPolishing(false);
    toast({ title: "Images polished", description: `${next.length} image(s) ready.` });
  };

  const generate = async () => {
    if (!name.trim()) { toast({ title: "Name required", variant: "destructive" }); return; }
    setGenerating(true);
    try {
      const res = await fetch("/api/admin/ai/one-click-listing", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-token": adminToken },
        body: JSON.stringify({
          name, upcEan: upc || undefined, attributes: attributes || undefined,
          category: category || undefined, hintPrice: hintPrice ? Number(hintPrice) : undefined,
          images: polishedImages,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "AI generation failed");
      setListing(data);
      setStep(3);
    } catch (e: any) {
      toast({ title: "Generation failed", description: e?.message || "Try again", variant: "destructive" });
    } finally { setGenerating(false); }
  };

  const save = async () => {
    if (!listing) return;
    setSaving(true);
    try {
      const payload: any = {
        name: listing.name || name,
        slug: listing.slug || undefined,
        category: listing.category || category || "Spiritual Essentials",
        brand: listing.brand || "Vedic Tatva",
        description: listing.description || "",
        highlights: listing.highlights || [],
        features: listing.features || [],
        hsnCode: listing.hsnCode || "",
        gstPercent: listing.gstPercent || 18,
        badge: listing.badge || "",
        upcEan: upc || "",
        price: hintPrice ? Number(hintPrice) : 999,
        stock: 50,
        image: polishedImages[0] || rawImages[0] || "",
        images: polishedImages.length > 0 ? polishedImages : rawImages,
        aplusEnabled: !!listing.aplusContent,
        richDescription: listing.aplusContent ? JSON.stringify({ aplusContent: listing.aplusContent }) : "",
        seoFocusKeyword: listing.focusKeyword || "",
        seoFaq: listing.faq || null,
        productType: "product",
      };
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-token": adminToken },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Save failed");
      onCreated(data);
      close();
    } catch (e: any) {
      toast({ title: "Save failed", description: e?.message || "Try again", variant: "destructive" });
    } finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && close()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" data-testid="dialog-one-click-listing">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary">
            <Sparkles className="w-5 h-5 text-primary" /> AI One-Click Listing
          </DialogTitle>
          <DialogDescription>
            Upload up to 7 images, polish them to Amazon-style white-background heroes, then let AI write the entire listing.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2 mb-4">
          {["Images", "Polish", "Details", "Preview"].map((label, i) => (
            <div key={label} className={`flex-1 text-center text-xs px-2 py-1 rounded-md border ${step === i ? "bg-primary text-primary font-bold border-primary" : "bg-card text-muted-foreground border-border"}`} data-testid={`step-indicator-${i}`}>
              {i + 1}. {label}
            </div>
          ))}
        </div>

        {/* Step 0: Upload images */}
        {step === 0 && (
          <div className="space-y-3">
            <Label>Upload 1–7 product photos</Label>
            <div className="border-2 border-dashed border-primary/40 rounded-md p-6 text-center bg-muted">
              <input type="file" multiple accept="image/*" id="oc-upload" className="hidden"
                onChange={(e) => e.target.files && handleUpload(e.target.files)} data-testid="input-oc-upload" />
              <label htmlFor="oc-upload" className="cursor-pointer inline-flex flex-col items-center gap-2">
                <Upload className="w-8 h-8 text-primary" />
                <span className="text-sm font-medium text-primary">{uploading ? "Uploading…" : "Click to choose images"}</span>
                <span className="text-xs text-muted-foreground">JPG, PNG, WebP up to 50MB each</span>
              </label>
            </div>
            {rawImages.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2" data-testid="oc-raw-grid">
                {rawImages.map((u, i) => (
                  <div key={i} className="relative aspect-square rounded-md overflow-hidden border border-border">
                    <img src={u} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => { setRawImages(rawImages.filter((_, j) => j !== i)); setPolishedImages(polishedImages.filter((_, j) => j !== i)); }}
                      className="absolute top-1 right-1 bg-card/90 rounded-full p-1 hover-elevate"
                      data-testid={`button-remove-raw-${i}`}
                      aria-label="Remove"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={close} data-testid="button-oc-cancel-0">Cancel</Button>
              <Button disabled={rawImages.length === 0} onClick={() => setStep(1)} className="bg-primary text-primary" data-testid="button-oc-next-0">
                Next: Polish images
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* Step 1: Polish */}
        {step === 1 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div>
                <p className="text-sm text-muted-foreground">AI will reshoot each image on a clean white background, Amazon hero style.</p>
              </div>
              <Button onClick={polishAll} disabled={polishing} className="bg-primary text-primary" data-testid="button-oc-polish-all">
                <Wand2 className="w-4 h-4 mr-2" /> {polishing ? "Polishing…" : "Polish all with AI"}
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" data-testid="oc-polish-grid">
              {rawImages.map((u, i) => (
                <div key={i} className="border border-border rounded-md p-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="text-[10px] uppercase text-muted-foreground mb-1">Original</div>
                      <img src={u} alt="" className="w-full aspect-square object-cover rounded-sm border border-border" />
                    </div>
                    <div>
                      <div className="text-[10px] uppercase text-muted-foreground mb-1">Polished</div>
                      <img src={polishedImages[i] || u} alt="" className="w-full aspect-square object-contain rounded-sm border border-border bg-card" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setStep(0)} data-testid="button-oc-back-1">Back</Button>
              <Button onClick={() => setStep(2)} className="bg-primary text-primary" data-testid="button-oc-next-1">Next: Details</Button>
            </DialogFooter>
          </div>
        )}

        {/* Step 2: Minimal details */}
        {step === 2 && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1 sm:col-span-2">
                <Label>Product name *</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Pure Brass Lakshmi Idol 6 inch" data-testid="input-oc-name" />
              </div>
              <div className="space-y-1">
                <Label>UPC / EAN (optional)</Label>
                <Input value={upc} onChange={(e) => setUpc(e.target.value)} placeholder="8901234567890" data-testid="input-oc-upc" />
              </div>
              <div className="space-y-1">
                <Label>Approximate price ₹ (optional)</Label>
                <Input value={hintPrice} onChange={(e) => setHintPrice(e.target.value)} placeholder="1499" data-testid="input-oc-price" />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label>Category (optional — AI will choose if blank)</Label>
                <Select value={category || "_auto"} onValueChange={(v) => setCategory(v === "_auto" ? "" : v)}>
                  <SelectTrigger data-testid="select-oc-category"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_auto">Let AI decide</SelectItem>
                    {["Puja Samagri","Havan Samagri","Idols & Murtis","Wearables","Brass & Copperware","Rudraksha","Gemstones","Yantras","Books & Scriptures","Spiritual Essentials"].map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label>Attributes (optional, free text)</Label>
                <Textarea
                  rows={3}
                  value={attributes}
                  onChange={(e) => setAttributes(e.target.value)}
                  placeholder="Material: Pure Brass; Weight: 350g; Height: 6 inch; Origin: Moradabad"
                  data-testid="input-oc-attributes"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setStep(1)} data-testid="button-oc-back-2">Back</Button>
              <Button disabled={!name.trim() || generating} onClick={generate} className="bg-gradient-to-r from-primary to-primary text-primary font-bold" data-testid="button-oc-generate">
                {generating ? "Generating listing…" : "Generate full listing"}
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* Step 3: Preview & save */}
        {step === 3 && listing && (
          <div className="space-y-3 text-sm" data-testid="oc-preview">
            <div className="flex items-start gap-3">
              {polishedImages[0] && <img src={polishedImages[0]} alt="" className="w-24 h-24 object-contain bg-card rounded-md border border-border" />}
              <div className="flex-1">
                <div className="font-bold text-primary" data-testid="oc-preview-name">{listing.name}</div>
                <div className="text-xs text-muted-foreground mt-1">{listing.category} · {listing.brand}</div>
                {listing.badge && <Badge className="mt-1 bg-amber-100 text-amber-800">{listing.badge}</Badge>}
              </div>
            </div>
            {listing.highlights?.length > 0 && (
              <div>
                <div className="font-semibold text-primary mb-1">Highlights</div>
                <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
                  {listing.highlights.map((h: string, i: number) => <li key={i}>{h}</li>)}
                </ul>
              </div>
            )}
            {listing.features?.length > 0 && (
              <div>
                <div className="font-semibold text-primary mb-1">Features</div>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-0.5 text-muted-foreground text-xs">
                  {listing.features.map((f: string, i: number) => <li key={i}>• {f}</li>)}
                </ul>
              </div>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div><span className="text-muted-foreground">HSN:</span> <strong>{listing.hsnCode || "-"}</strong></div>
              <div><span className="text-muted-foreground">GST:</span> <strong>{listing.gstPercent}%</strong></div>
              <div className="col-span-2"><span className="text-muted-foreground">Focus keyword:</span> <strong>{listing.focusKeyword || "-"}</strong></div>
            </div>
            {listing.aplusContent?.brandStory && (
              <div className="border border-border rounded-md p-2 bg-muted">
                <div className="text-xs font-semibold text-primary mb-1">A+ Brand Story</div>
                <p className="text-xs text-muted-foreground">{listing.aplusContent.brandStory}</p>
              </div>
            )}
            {listing.faq?.length > 0 && (
              <div>
                <div className="font-semibold text-primary mb-1">FAQ ({listing.faq.length})</div>
                <ul className="text-xs text-muted-foreground space-y-1">
                  {listing.faq.slice(0, 3).map((f: any, i: number) => <li key={i}><strong>Q:</strong> {f.q}</li>)}
                </ul>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setStep(2)} data-testid="button-oc-back-3">Back</Button>
              <Button onClick={save} disabled={saving} className="bg-primary text-white" data-testid="button-oc-save">
                {saving ? "Saving…" : "Save product"}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// Quick Create Product Dialog (AI-assisted)
// ============================================================
function QuickCreateProductDialog({
  open,
  onClose,
  adminToken,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  adminToken: string;
  onCreated: (product: any) => void;
}) {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [mrp, setMrp] = useState<string>("");
  const [sellingPrice, setSellingPrice] = useState<string>("");
  const [upc, setUpc] = useState("");
  const [variants, setVariants] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setTitle(""); setMrp(""); setSellingPrice(""); setUpc(""); setVariants(""); setImages([]);
  };

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const fd = new FormData();
      Array.from(files).forEach((f) => fd.append("images", f));
      const res = await fetch("/api/admin/upload-images", {
        method: "POST",
        headers: { "x-admin-token": adminToken },
        body: fd,
      });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      setImages((prev) => [...prev, ...(data.urls as string[])]);
    } catch (err: any) {
      toast({ title: "Upload Failed", description: err.message, variant: "destructive" });
    }
    setUploading(false);
  };

  const handleSubmit = async () => {
    if (!title.trim()) return toast({ title: "Title required", variant: "destructive" });
    if (!sellingPrice || Number(sellingPrice) <= 0) return toast({ title: "Selling price required", variant: "destructive" });
    if (images.length === 0) return toast({ title: "At least one image required", variant: "destructive" });
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/products/quick-create", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-token": adminToken },
        body: JSON.stringify({
          title: title.trim(),
          mrp: mrp ? Number(mrp) : undefined,
          sellingPrice: Number(sellingPrice),
          upc: upc.trim() || undefined,
          variants: variants.trim() || undefined,
          images,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed");
      reset();
      onCreated(data.product);
    } catch (err: any) {
      toast({ title: "Quick-create failed", description: err.message, variant: "destructive" });
    }
    setSubmitting(false);
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-start md:items-center justify-center p-3 overflow-y-auto" data-testid="quick-create-dialog">
      <div className="bg-card rounded-lg shadow-xl w-full max-w-2xl my-4">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-primary" />
            <div>
              <h2 className="text-lg font-serif text-primary">Quick Create with AI</h2>
              <p className="text-xs text-muted-foreground">Provide the basics — AI generates the full A+ listing.</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} data-testid="btn-close-quick-create"><X className="w-4 h-4" /></Button>
        </div>

        <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <Label className="text-xs text-muted-foreground">Product Title <span className="text-red-600">*</span></Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Pure Brass Diya Set with Engraving" data-testid="input-qc-title" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">MRP (₹)</Label>
              <Input type="number" value={mrp} onChange={(e) => setMrp(e.target.value)} placeholder="999" data-testid="input-qc-mrp" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Selling Price (₹) <span className="text-red-600">*</span></Label>
              <Input type="number" value={sellingPrice} onChange={(e) => setSellingPrice(e.target.value)} placeholder="599" data-testid="input-qc-price" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">UPC / EAN Code</Label>
              <Input value={upc} onChange={(e) => setUpc(e.target.value)} placeholder="8901234567890" data-testid="input-qc-upc" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Variants (optional)</Label>
              <Input value={variants} onChange={(e) => setVariants(e.target.value)} placeholder="Small, Medium, Large" data-testid="input-qc-variants" />
            </div>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Product Images <span className="text-red-600">*</span></Label>
            <div className="mt-1 border-2 border-dashed border-border rounded-lg p-4 text-center">
              <input
                type="file" accept="image/*" multiple
                onChange={(e) => handleUpload(e.target.files)}
                className="hidden" id="qc-image-upload"
                data-testid="input-qc-images"
              />
              <label htmlFor="qc-image-upload" className="cursor-pointer inline-flex items-center gap-2 text-sm text-primary font-medium">
                <Upload className="w-4 h-4" />
                {uploading ? "Uploading…" : "Click to upload images"}
              </label>
              {images.length > 0 && (
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mt-3">
                  {images.map((url, i) => (
                    <div key={i} className="relative group">
                      <img src={url} alt={`upload ${i + 1}`} className="w-full aspect-square object-cover rounded" />
                      <button
                        type="button"
                        onClick={() => setImages((p) => p.filter((_, idx) => idx !== i))}
                        className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                        data-testid={`btn-remove-qc-image-${i}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="bg-muted border border-border rounded-lg p-3 text-xs text-muted-foreground">
            <div className="flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div>
                <b>AI will auto-generate:</b> short description, rich A+ HTML description, 5 highlight bullets, 5 spec features, category, HSN code, GST %, image alt text, badge, and SEO keywords — all based on your title and price points.
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-border flex justify-end gap-2 bg-muted">
          <Button variant="outline" onClick={onClose} disabled={submitting} data-testid="btn-cancel-quick-create">Cancel</Button>
          <Button onClick={handleSubmit} disabled={submitting || uploading} className="bg-primary text-white gap-2" data-testid="btn-submit-quick-create">
            {submitting ? <><RefreshCw className="w-4 h-4 animate-spin" /> Generating…</> : <><Wand2 className="w-4 h-4" /> Generate & Save</>}
          </Button>
        </div>
      </div>
    </div>
  );
}


export default ProductsTab;
