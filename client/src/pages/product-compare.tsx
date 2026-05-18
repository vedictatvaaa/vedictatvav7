import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Plus, X, ShoppingCart, Check, Sparkles } from "lucide-react";
import type { Product } from "@shared/schema";
import { useCart } from "@/lib/cart";
import { useToast } from "@/hooks/use-toast";
import { getProductUrl } from "@/lib/utils";
import PageSeo from "@/components/PageSeo";

type ProductAny = Product & Record<string, any>;

export default function ProductCompare() {
  const { toast } = useToast();
  const { addToCart } = useCart();
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: products } = useQuery<Product[]>({
    queryKey: ["/api/products"],
    queryFn: () => fetch("/api/products").then(r => r.json()),
  });

  const selectedProducts = products?.filter(p => selectedIds.includes(p.id)) || [];

  const addProduct = (id: number) => {
    if (selectedIds.length >= 4) {
      toast({ title: "Maximum 4 products", description: "You can compare up to 4 products at a time.", variant: "destructive" });
      return;
    }
    if (!selectedIds.includes(id)) {
      setSelectedIds(prev => [...prev, id]);
    }
    setShowPicker(false);
    setSearchQuery("");
  };

  const removeProduct = (id: number) => {
    setSelectedIds(prev => prev.filter(i => i !== id));
  };

  const filteredProducts = products?.filter(p =>
    !selectedIds.includes(p.id) &&
    (p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
     p.category.toLowerCase().includes(searchQuery.toLowerCase()))
  ) || [];

  const attributes = [
    { key: "price", label: "Price", render: (p: ProductAny) => `₹${p.price}` },
    { key: "category", label: "Category", render: (p: ProductAny) => p.category },
    { key: "badge", label: "Badge", render: (p: ProductAny) => p.badge || "—" },
    { key: "stock", label: "Availability", render: (p: ProductAny) => p.stock > 0 ? `In Stock (${p.stock})` : "Out of Stock" },
    { key: "salesCount", label: "Popularity", render: (p: ProductAny) => `${p.salesCount || 0} sold` },
    { key: "highlights", label: "Highlights", render: (p: ProductAny) => (p.highlights && p.highlights.length > 0) ? p.highlights.slice(0, 3).join(", ") : "—" },
    { key: "description", label: "Description", render: (p: ProductAny) => p.description.length > 120 ? p.description.substring(0, 120) + "..." : p.description },
  ];

  return (
    <div className="min-h-screen bg-white">
      <PageSeo
        title="Compare Sacred Puja Products Side-by-Side | Vedic Tatva"
        description="Compare up to 4 sacred Vedic Tatva products side-by-side — price, category, highlights, availability and more. Make informed choices for your puja and home."
        canonical="/compare"
      />
      {/* Slim hero — solid maroon */}
      <div className="bg-[#6D2B35] border-b border-[#D4AF37]/30 text-white py-10 sm:py-12">
        <div className="container mx-auto px-4">
          <Link href="/puja-samagri-online" className="inline-flex items-center gap-1.5 text-[#D4AF37] hover:text-white text-[11px] uppercase tracking-[0.3em] font-semibold mb-3 transition-colors" data-testid="link-back-shop">
            <ArrowLeft className="h-3 w-3" /> Back to Shop
          </Link>
          <div className="flex items-center gap-2.5 mb-2">
            <span className="h-px w-6 bg-[#D4AF37]/60" />
            <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.3em] text-[#D4AF37] font-semibold">
              <Sparkles className="w-3 h-3" /> Side-by-Side
            </span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight mb-2" data-testid="text-compare-title">
            Compare Products
          </h1>
          <p className="text-white/70 max-w-lg text-sm sm:text-[15px] leading-relaxed">
            Select up to 4 products to compare side by side. Make informed decisions about your spiritual purchases.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {selectedProducts.length === 0 ? (
          <div className="text-center py-12 sm:py-14 px-4 bg-[#FBF7EE] border border-[#D4AF37]/25 rounded-md">
            <div className="w-14 h-14 rounded-md bg-white border border-[#D4AF37]/30 flex items-center justify-center mx-auto mb-4">
              <Plus className="h-6 w-6 text-[#6D2B35]/50" strokeWidth={1.6} />
            </div>
            <h2 className="font-serif text-xl font-semibold text-[#6D2B35] mb-2 tracking-tight">No Products Selected</h2>
            <p className="text-[#5a4a3a]/65 text-sm mb-6">Add products to start comparing. You can compare up to 4 products.</p>
            <button
              onClick={() => setShowPicker(true)}
              className="px-5 h-10 bg-[#6D2B35] text-[#D4AF37] rounded-md text-[13px] font-semibold hover:bg-[#5a1f29] transition-colors inline-flex items-center"
              data-testid="btn-add-first"
            >
              <Plus className="h-4 w-4 inline mr-2" /> Add Products to Compare
            </button>

            {(() => {
              const suggestions = (products || [])
                .slice()
                .sort((a, b) => ((b as any).salesCount || 0) - ((a as any).salesCount || 0))
                .slice(0, 3);
              if (suggestions.length === 0) return null;
              return (
                <div className="mt-8 max-w-xl mx-auto">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-[#D4AF37] font-semibold mb-3">Quick start with bestsellers</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {suggestions.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => addProduct(p.id)}
                        className="group bg-white border border-[#D4AF37]/25 rounded-md p-3 text-left hover:border-[#D4AF37]/55 transition-colors flex items-center gap-2.5"
                        data-testid={`btn-suggest-${p.id}`}
                      >
                        <img src={p.image} alt="" className="w-10 h-10 rounded-md object-cover border border-[#D4AF37]/20 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-[12px] font-semibold text-[#6D2B35] truncate">{p.name}</p>
                          <p className="text-[10px] text-[#5a4a3a]/60">₹{p.price}</p>
                        </div>
                        <Plus className="h-3.5 w-3.5 text-[#D4AF37] flex-shrink-0 group-hover:text-[#6D2B35]" />
                      </button>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto rounded-md border border-[#D4AF37]/25">
              <table className="w-full min-w-[600px] border-collapse">
                <thead>
                  <tr>
                    <th className="text-left p-3 w-40 bg-[#FBF7EE] border-b border-[#D4AF37]/25 text-xs font-bold text-[#6D2B35] uppercase tracking-wider">Feature</th>
                    {selectedProducts.map(p => (
                      <th key={p.id} className="p-3 bg-white border-b border-l border-[#D4AF37]/25 min-w-[200px]">
                        <div className="relative">
                          <button
                            onClick={() => removeProduct(p.id)}
                            className="absolute -top-1 -right-1 w-6 h-6 rounded-md bg-rose-50 border border-rose-200 text-rose-700 flex items-center justify-center hover:bg-rose-100 transition-colors"
                            data-testid={`btn-remove-${p.id}`}
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                          <Link href={getProductUrl(p.id, p.name)}>
                            <img src={p.image} alt={p.name} className="w-20 h-20 object-cover rounded-md mx-auto mb-2 border border-[#D4AF37]/20" />
                          </Link>
                          <Link href={getProductUrl(p.id, p.name)} className="text-sm font-semibold text-[#6D2B35] hover:text-[#D4AF37] transition-colors block text-center" data-testid={`product-name-${p.id}`}>
                            {p.name}
                          </Link>
                        </div>
                      </th>
                    ))}
                    {selectedIds.length < 4 && (
                      <th className="p-3 bg-white border-b border-l border-[#D4AF37]/25 min-w-[160px]">
                        <button
                          onClick={() => setShowPicker(true)}
                          className="w-full h-24 flex flex-col items-center justify-center gap-2 text-[#5a4a3a]/50 hover:text-[#6D2B35] border border-dashed border-[#D4AF37]/40 hover:border-[#D4AF37] rounded-md transition-colors"
                          data-testid="btn-add-product"
                        >
                          <Plus className="h-5 w-5" />
                          <span className="text-xs font-semibold">Add Product</span>
                        </button>
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {attributes.map((attr, i) => (
                    <tr key={attr.key} className={i % 2 === 0 ? "bg-white" : "bg-[#FBF7EE]/40"}>
                      <td className="p-3 border-b border-[#D4AF37]/20 text-sm font-semibold text-[#6D2B35]">{attr.label}</td>
                      {selectedProducts.map(p => {
                        const value = attr.render(p);
                        const isBest = attr.key === "price"
                          ? p.price === Math.min(...selectedProducts.map(sp => sp.price))
                          : attr.key === "salesCount"
                          ? (p.salesCount || 0) === Math.max(...selectedProducts.map(sp => sp.salesCount || 0))
                          : false;
                        return (
                          <td key={p.id} className={`p-3 border-b border-l border-[#D4AF37]/20 text-sm text-[#5a4a3a] text-center ${isBest && selectedProducts.length > 1 ? "bg-emerald-50 font-semibold text-emerald-800" : ""}`} data-testid={`cell-${attr.key}-${p.id}`}>
                            {isBest && selectedProducts.length > 1 && <Check className="h-3 w-3 inline mr-1 text-emerald-700" />}
                            {value}
                          </td>
                        );
                      })}
                      {selectedIds.length < 4 && <td className="border-b border-l border-[#D4AF37]/20" />}
                    </tr>
                  ))}
                  <tr className="bg-white">
                    <td className="p-3 text-sm font-semibold text-[#6D2B35]">Action</td>
                    {selectedProducts.map(p => (
                      <td key={p.id} className="p-3 border-l border-[#D4AF37]/20 text-center">
                        <button
                          onClick={() => {
                            addToCart(p);
                            toast({ title: "Added to Cart", description: `${p.name} added to your cart.` });
                          }}
                          disabled={p.stock <= 0}
                          className="px-4 h-9 bg-[#6D2B35] text-[#D4AF37] rounded-md text-[13px] font-semibold hover:bg-[#5a1f29] transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
                          data-testid={`btn-add-cart-${p.id}`}
                        >
                          <ShoppingCart className="h-3.5 w-3.5" /> Add to Cart
                        </button>
                      </td>
                    ))}
                    {selectedIds.length < 4 && <td className="border-l border-[#D4AF37]/20" />}
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-6 flex gap-3 justify-center">
              <button onClick={() => setShowPicker(true)} disabled={selectedIds.length >= 4} className="px-4 h-10 bg-white border border-[#D4AF37]/30 text-[#6D2B35] rounded-md text-[13px] font-semibold hover:bg-[#FBF7EE] transition-colors disabled:opacity-40 inline-flex items-center" data-testid="btn-add-more">
                <Plus className="h-4 w-4 inline mr-1" /> Add Product
              </button>
              <button onClick={() => setSelectedIds([])} className="px-4 h-10 bg-white border border-rose-200 text-rose-700 rounded-md text-[13px] font-semibold hover:bg-rose-50 transition-colors" data-testid="btn-clear-all">
                Clear All
              </button>
            </div>
          </>
        )}
      </div>

      {showPicker && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => { setShowPicker(false); setSearchQuery(""); }} />
          <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-lg mx-auto bg-white rounded-md border border-[#D4AF37]/30 z-50 overflow-hidden max-h-[70vh] flex flex-col" data-testid="product-picker">
            <div className="p-4 border-b border-[#D4AF37]/25 flex-shrink-0">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-serif text-lg font-semibold text-[#6D2B35] tracking-tight">Select Product</h3>
                <button onClick={() => { setShowPicker(false); setSearchQuery(""); }} className="w-8 h-8 rounded-md bg-[#FBF7EE] border border-[#D4AF37]/30 flex items-center justify-center hover:bg-white" data-testid="btn-close-picker">
                  <X className="h-4 w-4 text-[#6D2B35]" />
                </button>
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full px-4 py-2.5 rounded-md border border-[#D4AF37]/30 bg-[#FBF7EE]/50 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/30 focus:border-[#D4AF37]/50 text-[#5a4a3a]"
                autoFocus
                data-testid="input-search-compare"
              />
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {filteredProducts.length === 0 ? (
                <p className="text-center text-sm text-[#5a4a3a]/55 py-8">No products found</p>
              ) : (
                filteredProducts.map(p => (
                  <button
                    key={p.id}
                    onClick={() => addProduct(p.id)}
                    className="w-full flex items-center gap-3 p-3 rounded-md hover:bg-[#FBF7EE] transition-colors text-left"
                    data-testid={`picker-product-${p.id}`}
                  >
                    <img src={p.image} alt="" className="w-12 h-12 rounded-md object-cover flex-shrink-0 border border-[#D4AF37]/20" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#6D2B35] truncate">{p.name}</p>
                      <p className="text-xs text-[#5a4a3a]/55">{p.category} · ₹{p.price}</p>
                    </div>
                    <Plus className="h-4 w-4 text-[#6D2B35] flex-shrink-0" />
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
