import { useMemo, useState, useEffect } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { useQuery } from "@tanstack/react-query";
import PageSeo from "@/components/PageSeo";
import { ArrowRight, Sparkles, ShoppingBag, ChevronLeft, Check, ChevronRight, Music, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DEITY_KITS, DEITY_KIT_LIST, getDeityKit, type DeityKit } from "@/lib/puja-kits";
import type { Product } from "@shared/schema";
import { useCart } from "@/lib/cart";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";

// Read ?deity=xxx from the URL so the page is deep-linkable from the
// homepage, the festival page, or anywhere we want to pre-select a deity.
function useDeityParam(): string | null {
  const search = useSearch();
  const params = new URLSearchParams(search);
  return params.get("deity");
}

export default function PujaKitPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const cart = useCart();
  const { language } = useI18n();
  const isHi = language === "hi";

  const deityParam = useDeityParam();
  const [selectedId, setSelectedId] = useState<string | null>(deityParam);
  // The user can deselect items they don't want before "add all" — checked
  // is a Set of product slugs. Defaults to "all checked" whenever the
  // selected deity changes.
  const [checked, setChecked] = useState<Set<string>>(new Set());

  const kit = useMemo(() => (selectedId ? getDeityKit(selectedId) : null), [selectedId]);

  // Keep the URL in sync so refresh / share preserves the chosen deity.
  useEffect(() => {
    if (selectedId) {
      const url = new URL(window.location.href);
      url.searchParams.set("deity", selectedId);
      window.history.replaceState(null, "", url.toString());
    }
  }, [selectedId]);

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
    enabled: !!kit,
  });

  const kitProducts = useMemo(() => {
    if (!kit) return [];
    const bySlug = new Map(products.map((p) => [p.slug || "", p]));
    return kit.productSlugs
      .map((s) => bySlug.get(s))
      .filter((p): p is Product => !!p);
  }, [products, kit]);

  // Reset selection set whenever the deity OR the resolved product list
  // changes — every kit item starts checked.
  useEffect(() => {
    setChecked(new Set(kitProducts.map((p) => p.slug || String(p.id))));
  }, [kit?.id, kitProducts.length]);

  const toggleItem = (key: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const selectedProducts = useMemo(
    () => kitProducts.filter((p) => checked.has(p.slug || String(p.id))),
    [kitProducts, checked]
  );
  const selectedTotal = selectedProducts.reduce((sum, p) => sum + Number(p.price || 0), 0);

  function addSelectedToCart() {
    if (selectedProducts.length === 0) {
      toast({ title: isHi ? "कोई वस्तु चयनित नहीं" : "Nothing selected", description: isHi ? "कम से कम एक वस्तु चुनें।" : "Pick at least one item to add.", variant: "destructive" });
      return;
    }
    let added = 0;
    for (const p of selectedProducts) {
      try { cart.addToCart(p, 1); added++; } catch { /* ignore */ }
    }
    toast({
      title: isHi ? `${added} वस्तुएँ जोड़ी गईं` : `${added} item${added === 1 ? "" : "s"} added`,
      description: isHi ? "चेकआउट जारी रखने के लिए कार्ट देखें।" : "View your cart to continue to checkout.",
    });
  }

  // ===== Step 1 — pick a deity =====
  if (!kit) {
    return (
      <div className="min-h-screen bg-[#FBF7EE]" data-testid="page-puja-kit">
        <PageSeo
          title={isHi ? "अपनी पूजा किट बनाएँ · वैदिक तत्व" : "Build Your Puja Kit · Vedic Tatva"}
          description={isHi
            ? "अपने आराध्य देव को चुनें — दीप, हवन सामग्री, अखंड ज्योति एवं और सब कुछ एक क्लिक में कार्ट में जोड़ें।"
            : "Pick your deity — get a curated kit of diyas, hawan samagri, akhand jot and everything you need, added to cart in one click."}
          canonical="/puja-kit"
        />

        <section className="relative overflow-hidden bg-gradient-to-br from-[#3a0d18] via-[#6D2B35] to-[#a8497a] text-white">
          <div className="absolute inset-0 bg-black/30" />
          <div className="container mx-auto px-4 py-12 sm:py-16 relative">
            <Link href="/" className="inline-flex items-center gap-1 text-xs text-white/80 hover:text-white mb-4" data-testid="link-back-home">
              <ChevronLeft className="w-3.5 h-3.5" /> {isHi ? "मुख पृष्ठ" : "Home"}
            </Link>
            <p className="text-xs uppercase tracking-[0.32em] text-[#FFD56B] mb-2 font-semibold">
              {isHi ? "एक क्लिक में पूरी पूजा किट" : "Your puja kit in one click"}
            </p>
            <h1 className="font-serif text-3xl sm:text-5xl font-bold mb-3 max-w-2xl">
              {isHi ? "अपने आराध्य देव को चुनें" : "Choose your deity"}
            </h1>
            <p className="text-sm sm:text-base text-white/85 max-w-xl leading-relaxed">
              {isHi
                ? "हम सही दीप, हवन सामग्री, अखंड ज्योति एवं सब आवश्यक वस्तुएँ क्यूरेट करते हैं। आप एक क्लिक में कार्ट में जोड़ सकते हैं।"
                : "We curate the right diyas, hawan samagri, akhand jot and every essential. You add the entire kit to cart in a single click."}
            </p>
          </div>
        </section>

        <section className="container mx-auto px-4 py-10">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {DEITY_KIT_LIST.map((d) => (
              <button
                key={d.id}
                onClick={() => setSelectedId(d.id)}
                className="group text-left rounded-xl overflow-hidden border border-[#D4AF37]/30 bg-white hover-elevate active-elevate-2"
                data-testid={`button-pick-deity-${d.id}`}
              >
                <div
                  className="h-32 sm:h-40 relative flex items-center justify-center"
                  style={{ background: `linear-gradient(135deg, ${d.palette.from} 0%, ${d.palette.via} 50%, ${d.palette.to} 100%)` }}
                >
                  <div className="absolute inset-0 bg-black/20" />
                  <div className="relative text-center">
                    <div className="font-serif text-2xl sm:text-3xl text-white" lang="sa">{d.nameHi}</div>
                    <div className="mt-1 text-[10px] uppercase tracking-[0.32em] text-white/85 font-semibold">{d.name}</div>
                  </div>
                </div>
                <div className="p-3">
                  <p className="text-xs text-[#5a4a3a]/80 leading-snug line-clamp-2">
                    {isHi ? d.taglineHi : d.tagline}
                  </p>
                  <p className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-[#6D2B35] group-hover:text-[#D4AF37]">
                    {isHi ? "किट देखें" : "Build kit"} <ChevronRight className="w-3 h-3" />
                  </p>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="container mx-auto px-4 pb-16">
          <Card className="p-5 sm:p-6 bg-gradient-to-br from-[#FFFAEC] to-[#FBF1D8] border-[#D4AF37]/40">
            <p className="text-[10px] uppercase tracking-[0.32em] text-[#D4AF37] font-semibold mb-1">
              {isHi ? "त्योहार आने वाले हैं?" : "Festival coming up?"}
            </p>
            <h3 className="font-serif text-xl text-[#3A1018] mb-2">
              {isHi ? "त्योहार-विशिष्ट किट देखें" : "Browse festival-specific kits"}
            </h3>
            <p className="text-xs text-[#5a4a3a]/70 mb-3 max-w-xl">
              {isHi
                ? "दीपावली, नवरात्रि, गणेश चतुर्थी, महाशिवरात्रि आदि के लिए विशेष किट उपलब्ध हैं।"
                : "Diwali, Navratri, Ganesh Chaturthi, Mahashivratri and more — each comes with its own curated kit."}
            </p>
            <Link href="/festival/diwali">
              <Button size="sm" className="bg-[#6D2B35] hover:bg-[#6D2B35]/90 text-white" data-testid="button-browse-festivals">
                {isHi ? "त्योहार किट देखें" : "Browse festival kits"} <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>
          </Card>
        </section>
      </div>
    );
  }

  // ===== Step 2 — show kit for chosen deity =====
  const heroBg = `linear-gradient(135deg, ${kit.palette.from} 0%, ${kit.palette.via} 50%, ${kit.palette.to} 100%)`;

  return (
    <div className="min-h-screen bg-[#FBF7EE]" data-testid={`page-puja-kit-${kit.id}`}>
      <PageSeo
        title={isHi
          ? `${kit.nameHi} पूजा किट · वैदिक तत्व`
          : `${kit.name} Puja Kit · Vedic Tatva`}
        description={isHi ? kit.blurbHi : kit.blurb}
        canonical={`/puja-kit?deity=${kit.id}`}
      />

      <section className="relative overflow-hidden text-white" style={{ background: heroBg }}>
        <div className="absolute inset-0 bg-black/30" />
        <div className="container mx-auto px-4 py-10 sm:py-14 relative">
          <button
            onClick={() => setSelectedId(null)}
            className="inline-flex items-center gap-1 text-xs text-white/80 hover:text-white mb-4"
            data-testid="link-back-deity-list"
          >
            <ChevronLeft className="w-3.5 h-3.5" /> {isHi ? "अन्य देव" : "Other deities"}
          </button>
          <div className="grid md:grid-cols-2 gap-8 items-end">
            <div>
              <p className="text-xs uppercase tracking-[0.32em] mb-2 font-semibold" style={{ color: kit.palette.accent }}>
                {isHi ? "पूजा किट" : "Puja kit"}
              </p>
              <h1 className="font-serif text-3xl sm:text-5xl font-bold mb-1" data-testid="text-deity-name">
                {isHi ? kit.nameHi : kit.name}
              </h1>
              <p className="text-base sm:text-lg mb-3" style={{ color: kit.palette.accent }}>
                {isHi ? kit.taglineHi : kit.tagline}
              </p>
              <p className="text-sm sm:text-base text-white/85 max-w-xl leading-relaxed">
                {isHi ? kit.blurbHi : kit.blurb}
              </p>
            </div>
            <div className="md:justify-self-end w-full md:max-w-xs">
              <div className="rounded-xl p-5 backdrop-blur" style={{ background: "rgba(0,0,0,0.3)", border: `1px solid ${kit.palette.accent}55` }}>
                <p className="text-[10px] uppercase tracking-[0.28em] mb-1 font-semibold" style={{ color: kit.palette.accent }}>
                  {isHi ? "चयनित" : "Selected"}
                </p>
                <p className="font-serif text-3xl text-white" data-testid="text-selected-total">
                  ₹{selectedTotal.toLocaleString("en-IN")}
                </p>
                <p className="text-xs text-white/70 mb-3">
                  {selectedProducts.length} {isHi ? "वस्तु" : `item${selectedProducts.length === 1 ? "" : "s"}`}
                </p>
                <Button
                  onClick={addSelectedToCart}
                  disabled={selectedProducts.length === 0}
                  className="w-full font-bold border-0"
                  style={{ background: kit.palette.accent, color: "#1a1a1a" }}
                  data-testid="button-add-kit-to-cart"
                >
                  <ShoppingBag className="w-4 h-4 mr-1" />
                  {isHi ? "कार्ट में जोड़ें" : "Add to cart"}
                </Button>
                {kit.mantraId && (
                  <Link href={`/japa?mantra=${kit.mantraId}`}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-2 bg-white/10 backdrop-blur border-white/30 text-white hover:bg-white/20"
                      data-testid="button-go-japa"
                    >
                      <Music className="w-3.5 h-3.5 mr-1" />
                      {isHi ? "जाप शुरू करें" : "Begin japa"}
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-10">
        <div className="flex items-end justify-between gap-4 mb-5 flex-wrap">
          <div>
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#3A1018]">
              {isHi ? "क्यूरेटेड किट" : "The curated kit"}
            </h2>
            <p className="text-sm text-[#5a4a3a]/70">
              {isHi
                ? "जो वस्तुएँ आप नहीं चाहते उन्हें अनचेक करें, फिर एक क्लिक में कार्ट में जोड़ें।"
                : "Uncheck anything you don't need, then add the rest to cart in one click."}
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-72 rounded-md bg-[#F5F0E6] animate-pulse" />
            ))}
          </div>
        ) : kitProducts.length === 0 ? (
          <Card className="p-6 text-sm text-[#5a4a3a]/70" data-testid="text-kit-empty">
            {isHi
              ? "इस किट की वस्तुएँ शीघ्र ही उपलब्ध होंगी। तब तक, हमारी पूरी दुकान देखें।"
              : "This kit's items are coming soon. In the meantime, browse our full shop."}
            <Link href="/shop" className="ml-2 text-[#6D2B35] font-bold underline">
              {isHi ? "दुकान खोलें" : "Open shop"}
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {kitProducts.map((p) => {
              const key = p.slug || String(p.id);
              const isChecked = checked.has(key);
              return (
                <Card
                  key={p.id}
                  className={`overflow-hidden transition-all ${isChecked ? "ring-2 ring-[#D4AF37]" : "opacity-60"}`}
                  data-testid={`kit-card-${p.id}`}
                >
                  <button
                    type="button"
                    onClick={() => toggleItem(key)}
                    className="block w-full text-left hover-elevate active-elevate-2"
                    data-testid={`button-toggle-${p.id}`}
                  >
                    <div className="aspect-square bg-[#F5F0E6] overflow-hidden relative">
                      {p.image && <img src={p.image} alt={p.name} className="w-full h-full object-cover" loading="lazy" />}
                      <div className={`absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center border-2 ${isChecked ? "bg-[#D4AF37] border-[#D4AF37]" : "bg-white/90 border-[#D4AF37]/40"}`}>
                        {isChecked && <Check className="w-4 h-4 text-[#4a1a22]" strokeWidth={3} />}
                      </div>
                    </div>
                    <div className="p-3">
                      <p className="text-xs font-semibold text-[#3A1018] line-clamp-2 min-h-[2.5rem]">{p.name}</p>
                      <p className="text-sm font-bold text-[#6D2B35] mt-1">₹{Number(p.price).toLocaleString("en-IN")}</p>
                    </div>
                  </button>
                  <div className="px-3 pb-3 -mt-1">
                    <Link href={`/product/${p.slug || p.id}`} className="text-[10px] text-[#5a4a3a]/60 hover:text-[#6D2B35] underline" data-testid={`link-product-detail-${p.id}`}>
                      {isHi ? "विस्तार से देखें" : "View details"}
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Sticky footer add-all bar — visible on scroll for long lists */}
        {kitProducts.length > 0 && (
          <div className="mt-6 rounded-xl border border-[#D4AF37]/40 bg-white p-4 flex items-center justify-between gap-3 flex-wrap">
            <div className="text-sm">
              <span className="font-bold text-[#3A1018]">
                {selectedProducts.length}/{kitProducts.length} {isHi ? "वस्तुएँ चयनित" : "items selected"}
              </span>
              <span className="text-[#5a4a3a]/70 ml-2">· ₹{selectedTotal.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setChecked(new Set(kitProducts.map((p) => p.slug || String(p.id))))}
                data-testid="button-select-all"
              >
                {isHi ? "सभी चुनें" : "Select all"}
              </Button>
              <Button
                size="sm"
                onClick={addSelectedToCart}
                disabled={selectedProducts.length === 0}
                className="bg-[#6D2B35] hover:bg-[#6D2B35]/90 text-white"
                data-testid="button-add-selected-bottom"
              >
                <ShoppingBag className="w-4 h-4 mr-1" />
                {isHi ? "कार्ट में जोड़ें" : "Add to cart"}
              </Button>
            </div>
          </div>
        )}
      </section>

      {kit.services.length > 0 && (
        <section className="container mx-auto px-4 pb-12">
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#3A1018] mb-5 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#D4AF37]" />
            {isHi ? "सुझाई गई सेवाएँ" : "Suggested services"}
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {kit.services.map((s, i) => (
              <Link key={i} href={s.href} data-testid={`link-service-${i}`}>
                <Card className="p-5 hover-elevate h-full">
                  <p className="text-sm font-bold text-[#6D2B35] mb-1.5">{s.label}</p>
                  <p className="text-xs text-[#5a4a3a]/70 leading-relaxed mb-3">{s.description}</p>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#D4AF37]">
                    {isHi ? "जारी रखें" : "Continue"} <ArrowRight className="w-3 h-3" />
                  </span>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {kit.mantraId && (
        <section className="container mx-auto px-4 pb-12">
          <Card className="p-5 sm:p-6 bg-gradient-to-br from-[#3a0d18] via-[#6D2B35] to-[#3a0d18] text-white border-0">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <p className="text-[10px] uppercase tracking-[0.32em] text-[#D4AF37] font-semibold mb-1">
                  {isHi ? "जाप का अभ्यास करें" : "Practice the chant"}
                </p>
                <h3 className="font-serif text-xl mb-1">
                  {isHi
                    ? `${kit.nameHi} मंत्र · 108 बार जाप`
                    : `${kit.name} mantra · 108 chants`}
                </h3>
                <p className="text-sm text-white/80 max-w-xl">
                  {isHi
                    ? "दीप जलाने के बाद, मन को शांत करें और हमारे मिस्टिक काउंटर पर जाप करें — हर मनके के साथ टैप करें।"
                    : "After lighting the diya, settle the mind and chant on our Mystic Counter — tap once per bead."}
                </p>
              </div>
              <Link href={`/japa?mantra=${kit.mantraId}`}>
                <Button className="bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-[#4a1a22] font-bold" data-testid="button-japa-cta">
                  <Music className="w-4 h-4 mr-1" />
                  {isHi ? "अभी जाप करें" : "Begin japa now"}
                </Button>
              </Link>
            </div>
          </Card>
        </section>
      )}

      {/* Other deities nav */}
      <section className="container mx-auto px-4 pb-16">
        <h3 className="text-sm font-bold uppercase tracking-widest text-[#5a4a3a]/60 mb-3">
          {isHi ? "अन्य आराध्य देव" : "Other deities"}
        </h3>
        <div className="flex flex-wrap gap-2">
          {DEITY_KIT_LIST.filter((d) => d.id !== kit.id).map((d) => (
            <button
              key={d.id}
              onClick={() => setSelectedId(d.id)}
              data-testid={`link-other-deity-${d.id}`}
            >
              <Badge variant="outline" className="cursor-pointer" style={{ borderColor: `${d.palette.via}55`, color: d.palette.via }}>
                {isHi ? d.nameHi : d.name}
              </Badge>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
