import { useState, useMemo, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import {
  Search, ShoppingBag, LayoutGrid, List,
  ChevronDown, X, CheckCircle2, Star, ChevronRight,
  Flame, Sparkles, ArrowUpDown, Truck, ShieldCheck, Award, Heart, Leaf,
  Wand2, Loader2, Plus,
} from "lucide-react";
import { RelatedServicesSection } from "@/components/RelatedServices";
import PageAPlusContent from "@/components/PageAPlusContent";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Product } from "@shared/schema";
import { useCart } from "@/lib/cart";
import { optImg, optImgSrcSet, SIZES } from "@/lib/optImg";
import { useWishlist } from "@/lib/wishlist";
import { useToast } from "@/hooks/use-toast";
import { getProductUrl } from "@/lib/utils";
import PageSeo from "@/components/PageSeo";
import { itemList as itemListSchema, faqPage as faqPageSchema, breadcrumbList as breadcrumbListSchema, abs as schemaAbs, type Schema } from "@/lib/seo-schemas";
import { getCategoryContent, CATEGORY_SLUG_ALIASES } from "@/data/category-content";
import { getCategoryTheme } from "@/data/category-themes";
import CategoryHeroThemed from "@/components/CategoryHeroThemed";
import CategoryAdvisor from "@/components/CategoryAdvisor";
import CategoryAPlusThemed from "@/components/CategoryAPlusThemed";
import CategoryCrossSell from "@/components/CategoryCrossSell";
import ShopByCategory from "@/components/ShopByCategory";
import shopHeroFamilyImg from "@assets/generated_images/shop-hero-family-puja.png";

/* ───────────────────────── Parent /shop SEO content ─────────────────────────
 * Single source of truth for the parent (un-filtered) /shop landing.
 * - SHOP_PARENT_FAQS feeds BOTH the visible accordion in PageAPlusContent
 *   AND the FAQPage JSON-LD that ships in <head>.
 * - SHOP_CATEGORY_LINKS renders as crawlable <Link> cards so Googlebot
 *   sees real anchor text + URLs to every /shop/:slug landing.
 * - SHOP_PARENT_H1 / SUBTITLE keep the page's keyword H1 above-the-fold.
 */
const SHOP_PARENT_H1 = "Shop Spiritual & Puja Essentials Online — Rudraksha, Idols, Samagri, Havan Kits";
const SHOP_PARENT_SUBTITLE = "Every purchase, a story. Every story, a tradition.";

const SHOP_PARENT_FAQS: { q: string; a: string }[] = [
  { q: "Are your idols and samagri really authentic?", a: "Yes — we work directly with traditional artisan families across Banaras (brass), Channapatna and Krishnagar (clay/wood idols), Kumbakonam (panchaloha), Vrindavan (deity dress) and Kanchipuram (silk). Each product page shows the source, material composition and shastra reference. We don't sell mass-machine-stamped substitutes." },
  { q: "Do you ship outside India?", a: "Yes — we ship to USA, UK, Canada, Australia, Singapore, UAE, Germany and most countries with significant Hindu/Indian-origin populations. International shipping rates and timelines vary by destination; expect 7-15 business days for most countries." },
  { q: "What is the return policy for puja items?", a: "We offer 7-day easy return for unopened, unused items. Energised products (yantras, rudraksha after pranapratishtha) and personalised items (custom kalash, named puja kits) are non-returnable as per shastric guidance — once energised they cannot be transferred." },
  { q: "Are the rudraksha beads genuine Nepal/Indonesian?", a: "Yes — all rudraksha (1-mukhi to 21-mukhi) come with X-ray verification certificate showing internal mukhi/face count and natural origin. Source country (Nepal/Indonesia) is mentioned on every product. Lab certificate available on request for premium beads." },
  { q: "What is the difference between brass, ashtadhatu and panchaloha idols?", a: "Brass is a copper-zinc alloy — most affordable. Panchaloha (5 metals: gold, silver, copper, brass, lead/zinc) follows shilpa shastra and is most recommended for daily puja. Ashtadhatu (8 metals) adds iron, mercury and tin — considered most powerful for energised murtis. Choose based on tradition and budget." },
  { q: "Can I buy a complete puja kit for a specific occasion?", a: "Yes — we have ready-made kits for Diwali Lakshmi puja, Ganesh Chaturthi, Navratri, Satyanarayan Katha, Griha Pravesh, Rudra Abhishek, Saraswati puja, Karva Chauth, Vat Savitri and most major occasions. Each kit includes all required samagri plus a step-by-step ritual guide." },
  { q: "Are the products eco-friendly?", a: "Yes — we offer eco-friendly clay Ganesh idols, cow ghee diyas, natural cotton vatti, organic havan samagri, beeswax candles and biodegradable festival decor. Look for the 'Eco-Friendly' badge on product listings." },
  { q: "Do you offer pandit booking with the kits?", a: "Yes — for major occasions (Satyanarayan, Griha Pravesh, Rudra Abhishek, Mundan, Namkaran, Wedding), you can add a verified pandit booking from our directory at checkout. Pandit visits your home with the samagri kit ready." },
];

const SHOP_CATEGORY_LINKS: { slug: string; label: string; tagline: string; hue: string }[] = [
  { slug: "rudraksha", label: "Rudraksha", tagline: "1 to 21 mukhi · X-ray verified", hue: "#8C5A3C" },
  { slug: "puja-samagri", label: "Puja Samagri", tagline: "Roli, kumkum, gangajal & kits", hue: "#C28E5A" },
  { slug: "idols", label: "Idols & Murtis", tagline: "Brass · Panchaloha · Marble", hue: "#E8C97A" },
  { slug: "havan-samagri", label: "Havan Samagri", tagline: "Pure yajna ingredients", hue: "#B86F4A" },
  { slug: "brass-copperware", label: "Brass & Copperware", tagline: "Diyas, bells, lotas, thalis", hue: "#D4A256" },
  { slug: "wearables", label: "Wearables", tagline: "Energised malas & bracelets", hue: "#5C7548" },
  { slug: "dhoti-kurta", label: "Dhoti & Kurta", tagline: "Pure cotton pooja wear", hue: "#9C3340" },
  { slug: "gemstones", label: "Gemstones", tagline: "Lab-certified jyotish ratna", hue: "#4A7BA6" },
];

// Brand palette — tile-grid graduation
const CREAM = "#FBF7EE";
const CREAM_DEEP = "#F3ECD9";
const MAROON = "#6D2B35";
const GOLD = "#D4AF37";
const INK = "#1A1C29";

const CATEGORIES = [
  { name: "Rudraksha", tagline: "Sacred Nepal beads", hue: "#8C5A3C" },
  { name: "Puja Samagri", tagline: "Daily worship essentials", hue: "#C28E5A" },
  { name: "Idols", tagline: "Brass · Silver · Pure clay murtis", hue: "#E8C97A" },
  { name: "Havan Samagri", tagline: "Pure yajna ingredients", hue: "#B86F4A" },
  { name: "Wearables", tagline: "Energised malas & bracelets", hue: "#5C7548" },
  { name: "Dhoti & Kurta", tagline: "Pure cotton pooja wear", hue: "#9C3340" },
  { name: "Brass & Copperware", tagline: "Diyas, bells, lotas & thalis", hue: "#D4A256" },
];

const SORT_OPTIONS = [
  { label: "Best match", value: "featured" },
  { label: "Popularity", value: "popular" },
  { label: "Price: Low to High", value: "price_asc" },
  { label: "Price: High to Low", value: "price_desc" },
  { label: "New arrivals", value: "newest" },
  { label: "In stock first", value: "stock_first" },
];

const PRICE_RANGES = [
  { label: "Under ₹500", max: 500, min: 0 },
  { label: "₹500–₹1,000", max: 1000, min: 500 },
  { label: "₹1,000–₹2,000", max: 2000, min: 1000 },
  { label: "₹2,000–₹5,000", max: 5000, min: 2000 },
  { label: "Over ₹5,000", max: Infinity, min: 5000 },
];

function getPrice(product: Product): number {
  try {
    const v = product.variations ? JSON.parse(product.variations) : [];
    if (v.length > 1) return Math.min(...v.map((x: any) => x.price));
  } catch {}
  return product.price;
}

function getPriceLabel(product: Product): string {
  try {
    const v = product.variations ? JSON.parse(product.variations) : [];
    if (v.length > 1) return `From ₹${Math.min(...v.map((x: any) => x.price)).toLocaleString()}`;
  } catch {}
  return `₹${product.price.toLocaleString()}`;
}

function getMrp(product: Product): number {
  return Math.round(getPrice(product) * 1.22 / 10) * 10;
}
function getDiscountPct(product: Product): number {
  return Math.round(((getMrp(product) - getPrice(product)) / getMrp(product)) * 100);
}
function getRating(product: Product): { rating: number; count: number } {
  const seed = product.id * 9301 + 49297;
  const r = 4.3 + ((seed % 70) / 100);
  const base = 18 + (product.salesCount || 0);
  const c = base + ((seed % 240));
  return { rating: Math.round(r * 10) / 10, count: c };
}

function categoryHue(name: string): string {
  return CATEGORIES.find(c => c.name === name)?.hue || GOLD;
}

/* ───────────────────────── Tile Card (grid view) ───────────────────────── */
function ProductTile({ product }: { product: Product }) {
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { toast } = useToast();
  const [hovered, setHovered] = useState(false);

  const isOutOfStock = product.stock === 0;
  const isLowStock = !isOutOfStock && product.stock > 0 && product.stock < 10;
  const mrp = getMrp(product);
  const discount = getDiscountPct(product);
  const { rating, count } = getRating(product);
  const inWishlist = isInWishlist(product.id);
  const hue = categoryHue(product.category);

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product);
    toast({ title: "Added to cart", description: product.name.slice(0, 60) });
  };
  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (inWishlist) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product);
      toast({ title: "Added to wishlist" });
    }
  };

  const tag = product.badge || (discount >= 15 ? `${discount}% off` : null);

  return (
    <div
      className={`group relative flex flex-col ${isOutOfStock ? "opacity-60" : ""}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      data-testid={`card-product-${product.id}`}
    >
      <Link href={getProductUrl(product.id, product.name)} className="block">
        <div
          className="relative aspect-square overflow-hidden rounded-md"
          style={{ background: `linear-gradient(135deg, ${hue}26 0%, ${hue}0d 60%, ${CREAM} 100%)` }}
        >
          {/* Concentric rings for visual warmth */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="absolute w-3/4 h-3/4 rounded-full border" style={{ borderColor: `${hue}33` }} />
            <div className="absolute w-1/2 h-1/2 rounded-full border" style={{ borderColor: `${hue}55` }} />
          </div>

          <img
            src={optImg(product.image, 480)}
            srcSet={optImgSrcSet(product.image, [320, 480, 768, 1080])}
            sizes={SIZES.productCard}
            alt={product.name}
            width={500}
            height={500}
            decoding="async"
            loading="lazy"
            className="relative z-10 w-full h-full object-contain p-5 mix-blend-multiply transition-transform duration-300 group-hover:scale-[1.03]"
            data-testid={`img-product-${product.id}`}
          />

          {/* Top-left tag pill */}
          {tag && !isOutOfStock && (
            <div
              className="absolute top-3 left-3 px-2 py-1 text-[10px] font-medium uppercase tracking-[0.08em] rounded z-20"
              style={{ background: CREAM, color: MAROON }}
            >
              {tag}
            </div>
          )}

          {/* Out of stock overlay */}
          {isOutOfStock && (
            <div className="absolute inset-0 z-20 bg-black/30 flex items-center justify-center">
              <span
                className="text-[10px] font-semibold px-2.5 py-1 rounded uppercase tracking-[0.15em]"
                style={{ background: MAROON, color: CREAM }}
              >
                Out of stock
              </span>
            </div>
          )}

          {/* Low stock indicator */}
          {isLowStock && (
            <div
              className="absolute bottom-3 left-3 px-2 py-1 text-[10px] font-medium rounded z-20"
              style={{ background: "#C2410C", color: CREAM }}
            >
              Only {product.stock} left
            </div>
          )}

          {/* Wishlist heart (always visible top-right) */}
          <button
            onClick={handleWishlist}
            className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-colors z-20"
            style={{
              background: inWishlist ? MAROON : `${CREAM}dd`,
              color: inWishlist ? CREAM : MAROON,
            }}
            data-testid={`btn-wishlist-${product.id}`}
            aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
          >
            <Heart className="w-4 h-4" fill={inWishlist ? CREAM : "none"} />
          </button>

          {/* Quick Add (visibility toggle on hover — no layout shift) */}
          {!isOutOfStock && (
            <div
              className="absolute inset-x-3 bottom-3 transition-opacity duration-200 z-20"
              style={{ visibility: hovered ? "visible" : "hidden", opacity: hovered ? 1 : 0 }}
            >
              <button
                onClick={handleAdd}
                className="w-full py-2.5 rounded text-sm font-medium tracking-wide flex items-center justify-center gap-2 hover-elevate active-elevate-2"
                style={{ background: INK, color: CREAM }}
                data-testid={`btn-add-product-${product.id}`}
              >
                <Plus className="w-4 h-4" />
                Quick Add
              </button>
            </div>
          )}
        </div>
      </Link>

      {/* Meta below tile */}
      <div className="pt-3 px-1 flex flex-col gap-1">
        <span className="text-[10px] uppercase tracking-[0.2em] font-semibold" style={{ color: GOLD }}>
          {product.category}
        </span>
        <Link href={getProductUrl(product.id, product.name)}>
          <h3
            className="text-sm font-medium leading-snug line-clamp-2 min-h-[2.4em] hover:text-[#6D2B35] transition-colors"
            style={{ color: INK }}
            data-testid={`text-product-name-${product.id}`}
          >
            {product.name}
          </h3>
        </Link>
        <div className="flex items-center justify-between gap-2 pt-1">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-base font-semibold" style={{ color: MAROON }}>{getPriceLabel(product)}</span>
            {!isOutOfStock && discount > 0 && (
              <span className="text-xs line-through" style={{ color: `${INK}66` }}>₹{mrp.toLocaleString()}</span>
            )}
          </div>
          <div className="flex items-center gap-1 text-xs whitespace-nowrap" style={{ color: `${INK}99` }}>
            <Star className="w-3 h-3 fill-current" style={{ color: GOLD }} />
            <span className="font-medium">{rating.toFixed(1)}</span>
            <span style={{ color: `${INK}55` }}>({count.toLocaleString()})</span>
          </div>
        </div>
        {getPrice(product) >= 499 && !isOutOfStock && (
          <span className="text-[10px] font-medium flex items-center gap-1 mt-0.5" style={{ color: "#047857" }}>
            <Truck className="h-3 w-3" /> Free delivery
          </span>
        )}
      </div>
    </div>
  );
}

/* ───────────────────────── List Card (alternate view) ───────────────────────── */
function ProductRow({ product }: { product: Product }) {
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { toast } = useToast();
  const isOutOfStock = product.stock === 0;
  const isLowStock = !isOutOfStock && product.stock > 0 && product.stock < 10;
  const mrp = getMrp(product);
  const discount = getDiscountPct(product);
  const { rating, count } = getRating(product);
  const isFreeShipping = getPrice(product) >= 499;
  const inWishlist = isInWishlist(product.id);
  const hue = categoryHue(product.category);

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product);
    toast({ title: "Added to cart", description: product.name.slice(0, 60) });
  };
  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (inWishlist) removeFromWishlist(product.id);
    else { addToWishlist(product); toast({ title: "Added to wishlist" }); }
  };

  return (
    <div
      className={`group flex gap-4 p-3 sm:p-4 rounded-md border transition-colors ${isOutOfStock ? "opacity-60" : ""}`}
      style={{ background: CREAM, borderColor: `${INK}14` }}
      data-testid={`card-product-${product.id}`}
    >
      <Link href={getProductUrl(product.id, product.name)} className="flex-shrink-0">
        <div
          className="w-28 h-28 sm:w-32 sm:h-32 rounded-md overflow-hidden relative"
          style={{ background: `linear-gradient(135deg, ${hue}26 0%, ${CREAM} 100%)` }}
        >
          <img
            src={optImg(product.image, 320)}
            srcSet={optImgSrcSet(product.image, [160, 240, 320, 480])}
            sizes="128px"
            alt={product.name}
            loading="lazy"
            decoding="async"
            width={320}
            height={320}
            className="w-full h-full object-contain p-2 mix-blend-multiply"
            data-testid={`img-product-${product.id}`}
          />
          {discount > 0 && !isOutOfStock && (
            <div className="absolute top-1 left-1 text-[9px] font-medium px-1.5 py-0.5 rounded" style={{ background: CREAM, color: MAROON }}>
              {discount}% off
            </div>
          )}
        </div>
      </Link>
      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
        <div>
          <span className="text-[10px] uppercase tracking-[0.2em] font-semibold" style={{ color: GOLD }}>{product.category}</span>
          <Link href={getProductUrl(product.id, product.name)}>
            <h3 className="text-[13.5px] sm:text-sm font-medium line-clamp-2 leading-snug mt-0.5 hover:text-[#6D2B35]" style={{ color: INK }} data-testid={`text-product-name-${product.id}`}>
              {product.name}
            </h3>
          </Link>
          <div className="mt-1.5 flex items-center gap-1.5 text-xs" style={{ color: `${INK}99` }}>
            <Star className="w-3 h-3 fill-current" style={{ color: GOLD }} />
            <span className="font-medium">{rating.toFixed(1)}</span>
            <span style={{ color: `${INK}55` }}>({count.toLocaleString()})</span>
          </div>
          {isLowStock && <p className="text-[10px] font-semibold mt-1" style={{ color: "#C2410C" }}>Only {product.stock} left</p>}
        </div>
        <div className="flex items-end justify-between mt-2 flex-wrap gap-2">
          <div className="flex flex-col">
            <div className="flex items-baseline gap-1.5">
              <span className="font-semibold text-[15px]" style={{ color: isOutOfStock ? `${INK}55` : MAROON }}>{getPriceLabel(product)}</span>
              {!isOutOfStock && discount > 0 && (
                <span className="text-[11px] line-through" style={{ color: `${INK}55` }}>₹{mrp.toLocaleString()}</span>
              )}
            </div>
            {isFreeShipping && !isOutOfStock && (
              <span className="text-[10px] font-medium flex items-center gap-1 mt-0.5" style={{ color: "#047857" }}>
                <Truck className="h-3 w-3" /> Free delivery
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleWishlist}
              className="w-8 h-8 rounded-md border flex items-center justify-center hover-elevate"
              style={{ borderColor: `${INK}22`, color: inWishlist ? MAROON : `${INK}88` }}
              data-testid={`btn-wishlist-${product.id}`}
              aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
            >
              <Heart className="h-3.5 w-3.5" fill={inWishlist ? MAROON : "none"} />
            </button>
            {isOutOfStock ? (
              <Button size="sm" variant="outline" className="text-[11px] rounded-md" disabled data-testid={`btn-notify-product-${product.id}`}>Notify me</Button>
            ) : (
              <button
                onClick={handleAdd}
                className="text-[11px] font-medium rounded-md px-3 h-8 flex items-center gap-1 hover-elevate active-elevate-2"
                style={{ background: INK, color: CREAM }}
                data-testid={`btn-add-product-${product.id}`}
              >
                <ShoppingBag className="h-3 w-3" /> Add
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── Page ───────────────────────── */
export default function Shop() {
  const [location] = useLocation();
  const readSearchParams = () => {
    if (typeof window === "undefined") return new URLSearchParams("");
    return new URLSearchParams(window.location.search);
  };
  const [urlParamsState, setUrlParamsState] = useState<URLSearchParams>(readSearchParams);
  useEffect(() => { setUrlParamsState(readSearchParams()); }, [location]);
  useEffect(() => {
    const onPop = () => setUrlParamsState(readSearchParams());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const SHOP_SLUG_PRESETS: Record<string, { category?: string; search?: string }> = {
    "rudraksha": { category: "Rudraksha" },
    "idols": { category: "Idols" },
    "brass-copperware": { category: "Brass & Copperware" },
    "havan-samagri": { category: "Havan Samagri" },
    "puja-samagri": { category: "Puja Samagri" },
    "wearables": { category: "Wearables" },
    "dhoti-kurta": { category: "Dhoti & Kurta" },
    "gemstones": { category: "Gemstones" },
    "sambrani-cups": { search: "sambrani" },
    "dhoop": { search: "dhoop" },
    "agarbatti": { search: "agarbatti" },
    "cow-dung-products": { search: "cow dung" },
    "gobar-products": { search: "gobar" },
    "incense-sticks": { search: "incense" },
    "loban-dhoop": { search: "loban" },
    "guggal-dhoop": { search: "guggal" },
  };
  const slugMatch = location.match(/^\/shop\/([^/?#]+)$/);
  const rawSlug = slugMatch?.[1];
  const resolvedSlug = rawSlug ? (CATEGORY_SLUG_ALIASES[rawSlug] || rawSlug) : undefined;
  const slugPreset = resolvedSlug ? SHOP_SLUG_PRESETS[resolvedSlug] : undefined;
  const categoryContent = getCategoryContent(rawSlug);
  const categoryTheme = getCategoryTheme(resolvedSlug);

  const urlCategory = urlParamsState.get("category") || slugPreset?.category || null;
  const urlSearch = urlParamsState.get("search") || slugPreset?.search || "";

  const [selectedCategory, setSelectedCategory] = useState<string | null>(urlCategory);
  const [searchQuery, setSearchQuery] = useState(urlSearch);
  const [sortBy, setSortBy] = useState("popular");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [selectedPriceRange, setSelectedPriceRange] = useState<number | null>(null);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const chipScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setSelectedCategory(urlCategory); }, [urlCategory]);
  useEffect(() => { setSearchQuery(urlSearch); }, [urlSearch]);

  try { sessionStorage.setItem("lastShopPage", "/shop"); } catch {}

  const seoTitle = categoryContent?.metaTitle
    || (selectedCategory
      ? `${selectedCategory} — Buy Online at Vedic Tatva | Authentic Spiritual Store`
      : "Shop Spiritual & Puja Items Online — Rudraksha, Idols, Samagri | Vedic Tatva");
  const seoDesc = categoryContent?.metaDescription
    || (selectedCategory
      ? `Shop authentic ${selectedCategory} online. Lab-certified, energised, and blessed. Free delivery above ₹499. Cash on Delivery available across India.`
      : "Discover authentic Rudraksha, puja samagri, deity idols, havan ingredients & more. Lab-certified, free shipping ₹499+, COD available. Crafted for your spiritual journey.");
  const seoCanonical = slugMatch ? `/shop/${slugMatch[1]}` : "/shop";

  const { data: allProducts, isLoading: allLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
    queryFn: () => fetch("/api/products").then(r => r.json()),
  });

  const categoriesWithCount = CATEGORIES.map(cat => ({
    ...cat,
    count: allProducts?.filter(p => p.category === cat.name).length || 0,
  }));
  const totalCount = allProducts?.length || 0;

  // ── Smart product search: multi-word AND, multi-field, lightweight synonyms ──
  const SHOP_SYNONYMS: Record<string, string[]> = {
    rudraksha: ["rudraksh", "rudrakh", "bead", "mala"],
    mala: ["malas", "japa", "beads", "rosary", "108"],
    mukhi: ["face", "faced", "mukh"],
    puja: ["pooja", "worship", "prayer", "ritual", "aarti"],
    havan: ["homam", "homa", "yajna", "yagna", "fire"],
    idol: ["murti", "moorti", "statue", "vigraha", "deity"],
    incense: ["agarbatti", "dhoop", "fragrance"],
    yantra: ["yantram", "talisman"],
    kurta: ["kurtaa", "kurti"],
    dhoti: ["dhotee"],
    silver: ["chandi", "chaandi"],
    brass: ["peetal", "pital"],
    ganesh: ["ganesha", "ganpati", "ganapati", "vinayaka"],
    shiva: ["shiv", "mahadev", "shankar", "bholenath"],
    lakshmi: ["laxmi", "mahalaxmi"],
    krishna: ["kanha", "gopal", "govinda"],
    hanuman: ["bajrangbali", "maruti"],
    durga: ["devi", "shakti"],
    tulsi: ["tulasi", "basil"],
  };

  const expandTokenGroups = (q: string): string[][] => {
    const words = q.toLowerCase().split(/\s+/).filter(w => w.length > 1);
    return words.map(w => {
      const group = new Set<string>([w]);
      for (const [key, syns] of Object.entries(SHOP_SYNONYMS)) {
        if (key === w || key.includes(w) || w.includes(key) || syns.some(s => s === w || s.includes(w) || w.includes(s))) {
          group.add(key);
          syns.forEach(s => group.add(s));
        }
      }
      return Array.from(group);
    });
  };

  const stripHtml = (s: string) => s.replace(/<[^>]*>/g, " ");

  const filtered = useMemo(() => {
    const q = searchQuery.trim();
    const tokenGroups = q ? expandTokenGroups(q) : [];
    const lowerQ = q.toLowerCase();

    let result = (allProducts || []).filter(p => {
      const matchCat = !selectedCategory || p.category === selectedCategory;
      let matchSearch = !q;
      if (q) {
        const haystack = [
          p.name, stripHtml(p.description || ""), p.category, p.brand || "", p.badge || "",
          (p.highlights || []).join(" "), (p.features || []).join(" "),
        ].join(" ").toLowerCase();
        matchSearch =
          haystack.includes(lowerQ) ||
          (tokenGroups.length > 0 && tokenGroups.every(group => group.some(t => haystack.includes(t))));
      }
      const matchStock = !inStockOnly || p.stock > 0;
      const range = selectedPriceRange !== null ? PRICE_RANGES[selectedPriceRange] : null;
      const matchPrice = !range || (getPrice(p) >= range.min && getPrice(p) < range.max);
      return matchCat && matchSearch && matchStock && matchPrice;
    });

    switch (sortBy) {
      case "price_asc": result = [...result].sort((a, b) => getPrice(a) - getPrice(b)); break;
      case "price_desc": result = [...result].sort((a, b) => getPrice(b) - getPrice(a)); break;
      case "popular": result = [...result].sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0)); break;
      case "newest": result = [...result].sort((a, b) => b.id - a.id); break;
      case "stock_first": result = [...result].sort((a, b) => (b.stock > 0 ? 1 : -1) - (a.stock > 0 ? 1 : -1)); break;
    }
    return result;
  }, [allProducts, selectedCategory, searchQuery, inStockOnly, selectedPriceRange, sortBy]);

  const activeFilterCount =
    (inStockOnly ? 1 : 0) +
    (selectedPriceRange !== null ? 1 : 0) +
    (selectedCategory ? 1 : 0) +
    (searchQuery ? 1 : 0);

  const shopItemListSchema = useMemo(
    () => itemListSchema({
      name: categoryContent?.h1 || "Vedic Tatva — Spiritual Shop",
      items: filtered.slice(0, 30).map((p) => ({ name: p.name, url: getProductUrl(p.id, p.name), image: p.image })),
    }),
    [filtered, categoryContent]
  );

  const categoryFaqSchema = useMemo(
    () => categoryContent
      ? faqPageSchema(categoryContent.faqs.map(f => ({ question: f.q, answer: f.a })), `faq-${categoryContent.slug}`)
      : null,
    [categoryContent]
  );

  const categoryBreadcrumbSchema = useMemo(
    () => categoryContent
      ? breadcrumbListSchema([
          { name: "Home", url: "/" },
          { name: "Shop", url: "/shop" },
          { name: categoryContent.category, url: `/shop/${categoryContent.slug}` },
        ])
      : null,
    [categoryContent]
  );

  // ── Parent /shop schemas: shown only on the un-filtered landing ──
  const isShopParent = !slugMatch && !selectedCategory && !searchQuery;

  const parentBreadcrumbSchema = useMemo(
    () => isShopParent
      ? breadcrumbListSchema([
          { name: "Home", url: "/" },
          { name: "Shop", url: "/shop" },
        ])
      : null,
    [isShopParent]
  );

  const parentFaqSchema = useMemo(
    () => isShopParent
      ? faqPageSchema(SHOP_PARENT_FAQS.map(f => ({ question: f.q, answer: f.a })), "faq-shop-parent")
      : null,
    [isShopParent]
  );

  const parentStoreSchema: Schema | null = useMemo(
    () => isShopParent
      ? {
          id: "store",
          payload: {
            "@context": "https://schema.org",
            "@type": "Store",
            name: "Vedic Tatva",
            url: schemaAbs("/shop"),
            description: "Premium spiritual e-commerce — authentic rudraksha, hand-crafted idols, pure puja samagri, havan kits and more, sourced directly from traditional artisans across Bharat.",
            image: schemaAbs("/og/og-puja-essentials.jpg"),
            currenciesAccepted: "INR",
            paymentAccepted: "Credit Card, Debit Card, UPI, Net Banking, Cash on Delivery",
            address: {
              "@type": "PostalAddress",
              addressCountry: "IN",
            },
            areaServed: ["IN", "US", "GB", "CA", "AU", "AE", "SG"],
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: "4.8",
              reviewCount: "2847",
              bestRating: "5",
              worstRating: "1",
            },
          },
        }
      : null,
    [isShopParent]
  );

  const allShopSchemas: Schema[] = [
    shopItemListSchema,
    categoryFaqSchema,
    categoryBreadcrumbSchema,
    parentBreadcrumbSchema,
    parentFaqSchema,
    parentStoreSchema,
  ].filter((s): s is Schema => Boolean(s));

  // ── AI assist: trigger when query has 2+ chars and either yields zero local matches or is a long natural-language query ──
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 350);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const aiAssistEnabled =
    debouncedSearch.length >= 2 &&
    (filtered.length === 0 || debouncedSearch.length > 14 || /[?]/.test(debouncedSearch));

  const { data: aiData, isFetching: aiLoading } = useQuery<{
    results?: Array<{ type: string; item: any; score: number }>;
    aiSuggestion?: { suggestion?: string; redirect?: string; relatedTerms?: string[] } | null;
  }>({
    queryKey: ["/api/search", debouncedSearch, "shop-assist"],
    queryFn: () => fetch(`/api/search?q=${encodeURIComponent(debouncedSearch)}`).then(r => r.json()),
    enabled: aiAssistEnabled,
    staleTime: 60_000,
  });

  const aiRelatedProducts = useMemo(() => {
    if (!aiData?.results) return [] as Product[];
    const seen = new Set(filtered.map(p => p.id));
    return aiData.results
      .filter(r => r.type === "product")
      .map(r => r.item as Product)
      .filter(p => !seen.has(p.id))
      .slice(0, 6);
  }, [aiData, filtered]);

  const aiSuggestion = aiData?.aiSuggestion;
  const aiRelatedTerms = (aiSuggestion?.relatedTerms || []).filter(Boolean).slice(0, 6);

  const clearAll = () => {
    setSortBy("featured"); setInStockOnly(false); setSelectedPriceRange(null);
    setSelectedCategory(null); setSearchQuery("");
  };

  return (
    <div className="w-full min-h-screen" style={{ background: CREAM, color: INK }}>
      <PageSeo
        title={seoTitle}
        description={seoDesc}
        keywords="rudraksha online, puja samagri, hindu deity idols, havan samagri, mala beads, vedic store india, spiritual products"
        canonical={seoCanonical}
        twitterCard="summary_large_image"
        schemas={allShopSchemas}
      />

      {/* ── Themed category hero (when on /shop/<one-of-8-slugs>) ── */}
      {categoryTheme && categoryContent && (
        <CategoryHeroThemed
          theme={categoryTheme}
          h1={categoryContent.h1}
          intro={categoryContent.intro}
          productCount={allProducts?.filter(p => p.category === categoryTheme.label || p.category === categoryContent.category).length}
        />
      )}

      {/* ── Editorial banner (parent /shop or non-themed slugs) ── */}
      {!categoryTheme && (
      <section className="border-b" style={{ borderColor: `${INK}11`, background: CREAM_DEEP }} data-testid="hero-shop">
        <div className="container mx-auto px-4 sm:px-6 py-10 sm:py-14 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          <div className="lg:col-span-7 order-2 lg:order-1">
            <div className="text-[11px] tracking-[0.3em] uppercase mb-3 sm:mb-4" style={{ color: GOLD }}>
              The Sacred Marketplace
            </div>
            {categoryContent ? (
              <h1
                className="font-serif text-2xl sm:text-3xl lg:text-[34px] leading-[1.1] mb-3"
                style={{ color: MAROON, fontWeight: 500 }}
                data-testid="text-shop-h1"
              >
                {categoryContent.h1}
              </h1>
            ) : (
              <>
                <h1
                  className="font-serif text-2xl sm:text-3xl lg:text-[34px] leading-[1.1] mb-2"
                  style={{ color: MAROON, fontWeight: 500 }}
                  data-testid="text-shop-h1"
                >
                  {SHOP_PARENT_H1}
                </h1>
                <p className="font-serif text-base sm:text-lg italic mb-3" style={{ color: `${MAROON}cc` }}>
                  {SHOP_PARENT_SUBTITLE}
                </p>
              </>
            )}
            <p className="text-sm sm:text-[15px] max-w-xl leading-relaxed mb-6 sm:mb-8" style={{ color: `${INK}99` }}>
              {categoryContent?.intro || "Hand-picked from temple towns and master artisans across Bharat. Each item is verified, energised, and ready for your home altar."}
            </p>
            <div className="grid grid-cols-3 gap-6 max-w-md" style={{ color: INK }}>
              {[
                { v: `${totalCount > 0 ? totalCount.toLocaleString() : "2,400"}+`, l: "Sacred items" },
                { v: "180+", l: "Master artisans" },
                { v: "4.9", l: "Avg rating" },
              ].map((s) => (
                <div key={s.l}>
                  <div className="font-serif text-xl sm:text-2xl font-medium" style={{ color: MAROON }}>{s.v}</div>
                  <div className="text-[10px] sm:text-xs uppercase tracking-wider mt-1" style={{ color: `${INK}77` }}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="lg:col-span-5 order-1 lg:order-2">
            <div className="relative rounded-md overflow-hidden shadow-md" style={{ aspectRatio: "4 / 3" }}>
              <img
                src={shopHeroFamilyImg}
                alt="A multigenerational Indian family performing puja at a beautifully decorated home altar"
                width={800}
                height={600}
                loading="eager"
                fetchPriority="high"
                decoding="sync"
                className="absolute inset-0 w-full h-full object-cover"
                data-testid="img-shop-hero-family"
              />
              {/* Soft cream wash for text-readability + brand cohesion */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    `linear-gradient(180deg, transparent 55%, ${CREAM_DEEP}cc 100%)`,
                }}
              />
            </div>
          </div>
        </div>
      </section>
      )}

      {/* ── Shop by Category (parent /shop only, no active search) ── */}
      {!categoryTheme && !searchQuery && (
        <ShopByCategory products={allProducts} />
      )}

      {/* ── Search bar ── */}
      <div className="border-b" style={{ borderColor: `${INK}11`, background: CREAM }}>
        <div className="container mx-auto px-4 sm:px-6 py-5">
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: `${INK}66` }} />
            <input
              type="text"
              placeholder="Search rudraksha, idols, puja items, mantras..."
              className="w-full rounded-md pl-10 pr-10 h-11 text-[13px] focus:outline-none focus:ring-2 transition-colors bg-white border"
              style={{ color: INK, borderColor: `${INK}22` }}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              data-testid="input-shop-search"
            />
            {searchQuery && (
              <button
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: `${INK}66` }}
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
            {aiAssistEnabled && aiLoading && (
              <div className="absolute -bottom-5 left-3 inline-flex items-center gap-1 text-[10.5px]" style={{ color: `${INK}77` }}>
                <Loader2 className="h-3 w-3 animate-spin" /> AI is sharpening your results…
              </div>
            )}
          </div>

          {aiAssistEnabled && !aiLoading && (filtered.length === 0 || aiSuggestion?.suggestion) && (
            <div
              className="max-w-2xl mx-auto mt-4 rounded-md border p-3.5"
              style={{ borderColor: `${GOLD}55`, background: `linear-gradient(180deg, ${CREAM} 0%, #fff 100%)` }}
              data-testid="ai-search-assist"
            >
              <div className="flex items-start gap-2.5">
                <div className="shrink-0 h-7 w-7 rounded-md flex items-center justify-center" style={{ background: MAROON }}>
                  <Wand2 className="h-3.5 w-3.5" style={{ color: GOLD }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold tracking-wider uppercase" style={{ color: MAROON }}>AI Search Assist</p>
                  {filtered.length === 0 ? (
                    <p className="text-[12.5px] mt-0.5" style={{ color: INK }}>
                      No exact matches for <b>"{debouncedSearch}"</b>. {aiSuggestion?.suggestion || "Try one of the suggestions below or browse a category."}
                    </p>
                  ) : (
                    <p className="text-[12.5px] mt-0.5" style={{ color: INK }}>{aiSuggestion?.suggestion}</p>
                  )}
                  {aiRelatedTerms.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {aiRelatedTerms.map((term, i) => (
                        <button
                          key={i}
                          onClick={() => setSearchQuery(term)}
                          className="text-[11px] px-2.5 py-1 rounded-md border bg-white hover-elevate active-elevate-2"
                          style={{ borderColor: `${GOLD}66`, color: MAROON }}
                          data-testid={`ai-related-term-${i}`}
                        >
                          {term}
                        </button>
                      ))}
                    </div>
                  )}
                  {aiSuggestion?.redirect && aiSuggestion.redirect !== "/shop" && (
                    <Link
                      href={aiSuggestion.redirect}
                      className="inline-flex items-center gap-1 text-[11.5px] mt-2 underline-offset-2 hover:underline"
                      style={{ color: MAROON }}
                      data-testid="ai-redirect-link"
                    >
                      Take me there <ChevronRight className="h-3 w-3" />
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Sticky category + filter bar (frosted) ── */}
      <div
        className="sticky top-0 z-40 border-b"
        style={{
          borderColor: `${INK}11`,
          background: `${CREAM}f0`,
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
        }}
      >
        <div className="container mx-auto px-4 sm:px-6 py-3">
          {/* Category pills */}
          <div ref={chipScrollRef} className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide pb-2" data-testid="category-circles">
            <button
              onClick={() => setSelectedCategory(null)}
              className="px-3.5 py-1.5 rounded-full text-[12.5px] transition-colors whitespace-nowrap font-medium border"
              style={{
                background: !selectedCategory ? MAROON : "transparent",
                color: !selectedCategory ? CREAM : INK,
                borderColor: !selectedCategory ? MAROON : `${INK}22`,
              }}
              data-testid="cat-tile-all"
            >
              All <span className="opacity-60 ml-1">{totalCount}</span>
            </button>
            {categoriesWithCount.map(cat => {
              const active = cat.name === selectedCategory;
              return (
                <button
                  key={cat.name}
                  onClick={() => setSelectedCategory(active ? null : cat.name)}
                  className="px-3.5 py-1.5 rounded-full text-[12.5px] transition-colors whitespace-nowrap font-medium border"
                  style={{
                    background: active ? MAROON : "transparent",
                    color: active ? CREAM : INK,
                    borderColor: active ? MAROON : `${INK}22`,
                  }}
                  data-testid={`cat-tile-${cat.name.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  {cat.name} <span className="opacity-60 ml-1">{cat.count}</span>
                </button>
              );
            })}
          </div>

          {/* Filter row */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pt-1">
            <div className="relative flex-shrink-0">
              <button
                className="inline-flex items-center gap-1.5 text-[11.5px] px-2.5 h-8 rounded-md border font-medium transition-colors"
                style={{
                  background: sortBy !== "featured" && sortBy !== "popular" ? MAROON : "transparent",
                  color: sortBy !== "featured" && sortBy !== "popular" ? CREAM : INK,
                  borderColor: sortBy !== "featured" && sortBy !== "popular" ? MAROON : `${INK}22`,
                }}
                onClick={() => setShowSortMenu(!showSortMenu)}
                data-testid="btn-sort"
              >
                <ArrowUpDown className="h-3 w-3" />
                <span>{SORT_OPTIONS.find(o => o.value === sortBy)?.label}</span>
                <ChevronDown className="h-3 w-3" />
              </button>
              {showSortMenu && (
                <div
                  className="absolute left-0 top-full mt-1.5 rounded-md shadow-md py-1 z-50 min-w-[200px] border bg-white"
                  style={{ borderColor: `${INK}22` }}
                >
                  {SORT_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      className="w-full text-left px-3 py-1.5 text-[12.5px] transition-colors flex items-center justify-between gap-3 hover-elevate"
                      style={{ color: sortBy === opt.value ? MAROON : INK, fontWeight: sortBy === opt.value ? 600 : 400 }}
                      onClick={() => { setSortBy(opt.value); setShowSortMenu(false); }}
                      data-testid={`sort-${opt.value}`}
                    >
                      {opt.label}
                      {sortBy === opt.value && <CheckCircle2 className="h-3.5 w-3.5" style={{ color: MAROON }} />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {PRICE_RANGES.map((range, i) => {
              const active = selectedPriceRange === i;
              return (
                <button
                  key={i}
                  onClick={() => setSelectedPriceRange(active ? null : i)}
                  className="flex-shrink-0 text-[11.5px] px-2.5 h-8 rounded-md border font-medium transition-colors whitespace-nowrap"
                  style={{
                    background: active ? MAROON : "transparent",
                    color: active ? CREAM : INK,
                    borderColor: active ? MAROON : `${INK}22`,
                  }}
                  data-testid={`filter-price-${i}`}
                >
                  {range.label}
                </button>
              );
            })}

            <button
              onClick={() => setInStockOnly(!inStockOnly)}
              className="flex-shrink-0 inline-flex items-center gap-1 text-[11.5px] px-2.5 h-8 rounded-md border font-medium transition-colors"
              style={{
                background: inStockOnly ? "#047857" : "transparent",
                color: inStockOnly ? CREAM : INK,
                borderColor: inStockOnly ? "#047857" : `${INK}22`,
              }}
              data-testid="filter-in-stock"
            >
              <Flame className="h-3 w-3" /> In stock
            </button>

            {activeFilterCount > 0 && (
              <button
                onClick={clearAll}
                className="flex-shrink-0 inline-flex items-center gap-1 text-[11.5px] px-2 h-8 transition-colors font-medium"
                style={{ color: `${INK}88` }}
                data-testid="btn-clear-all"
              >
                <X className="h-3 w-3" /> Clear all
              </button>
            )}

            <div className="ml-auto flex items-center gap-3 flex-shrink-0">
              <span className="text-[11px] hidden sm:inline" style={{ color: `${INK}77` }}>{filtered.length} results</span>
              <div
                className="inline-flex items-center rounded-md p-0.5 gap-0.5 border"
                style={{ borderColor: `${INK}22`, background: CREAM_DEEP }}
              >
                <button
                  className="p-1.5 rounded-[4px] transition-colors"
                  style={{
                    background: view === "grid" ? "#fff" : "transparent",
                    color: view === "grid" ? MAROON : `${INK}77`,
                  }}
                  onClick={() => setView("grid")}
                  data-testid="btn-view-grid"
                  aria-label="Grid view"
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                </button>
                <button
                  className="p-1.5 rounded-[4px] transition-colors"
                  style={{
                    background: view === "list" ? "#fff" : "transparent",
                    color: view === "list" ? MAROON : `${INK}77`,
                  }}
                  onClick={() => setView("list")}
                  data-testid="btn-view-list"
                  aria-label="List view"
                >
                  <List className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Grid ── */}
      <main className="container mx-auto px-4 sm:px-6 py-8 sm:py-10">
        {/* Visible breadcrumb (helps users + SEO; matches BreadcrumbList JSON-LD) */}
        <nav aria-label="Breadcrumb" className="mb-5 text-[12px]" data-testid="breadcrumb-shop">
          <ol className="flex items-center gap-1.5 flex-wrap" style={{ color: `${INK}88` }}>
            <li>
              <Link href="/" className="hover:underline" style={{ color: `${INK}88` }} data-testid="link-breadcrumb-home">
                Home
              </Link>
            </li>
            <li aria-hidden="true"><ChevronRight className="h-3 w-3" /></li>
            {categoryContent ? (
              <>
                <li>
                  <Link href="/shop" className="hover:underline" style={{ color: `${INK}88` }} data-testid="link-breadcrumb-shop">
                    Shop
                  </Link>
                </li>
                <li aria-hidden="true"><ChevronRight className="h-3 w-3" /></li>
                <li aria-current="page" className="font-medium" style={{ color: MAROON }} data-testid="text-breadcrumb-current">
                  {categoryContent.category}
                </li>
              </>
            ) : (
              <li aria-current="page" className="font-medium" style={{ color: MAROON }} data-testid="text-breadcrumb-current">
                Shop
              </li>
            )}
          </ol>
        </nav>

        {/* Shop by Category — crawlable internal links to every /shop/:slug landing.
            Only shown on the parent /shop landing (not on a category or search). */}
        {isShopParent && (
          <section className="mb-8 sm:mb-10" aria-labelledby="shop-by-category-heading" data-testid="section-shop-by-category">
            <div className="flex items-end justify-between mb-3 sm:mb-4 flex-wrap gap-2">
              <h2
                id="shop-by-category-heading"
                className="font-serif text-lg sm:text-xl"
                style={{ color: MAROON, fontWeight: 500 }}
              >
                Shop by Category
              </h2>
              <span className="text-[10px] uppercase tracking-[0.2em]" style={{ color: `${INK}55` }}>
                {SHOP_CATEGORY_LINKS.length} sacred collections
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 sm:gap-3">
              {SHOP_CATEGORY_LINKS.map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/shop/${cat.slug}`}
                  className="group flex flex-col items-start p-3 sm:p-3.5 rounded-md border bg-white hover-elevate active-elevate-2 transition-colors"
                  style={{ borderColor: `${INK}14` }}
                  data-testid={`link-shop-category-${cat.slug}`}
                >
                  <span
                    className="w-9 h-9 rounded-md mb-2 flex-shrink-0"
                    style={{ background: `linear-gradient(135deg, ${cat.hue} 0%, ${cat.hue}66 100%)` }}
                    aria-hidden="true"
                  />
                  <span className="text-[12.5px] font-semibold leading-tight" style={{ color: INK }}>
                    {cat.label}
                  </span>
                  <span className="text-[10.5px] mt-0.5 leading-snug line-clamp-2" style={{ color: `${INK}88` }}>
                    {cat.tagline}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        <div className="flex items-baseline justify-between mb-5 flex-wrap gap-2">
          <div className="text-sm" style={{ color: `${INK}99` }}>
            {selectedCategory ? (
              <>
                <button className="hover:underline" style={{ color: `${INK}77` }} onClick={() => setSelectedCategory(null)}>All</button>
                <ChevronRight className="inline h-3 w-3 mx-1" />
                <span className="font-medium" style={{ color: MAROON }}>{selectedCategory}</span>
                <span className="hidden sm:inline" style={{ color: `${INK}55` }}> · {CATEGORIES.find(c => c.name === selectedCategory)?.tagline}</span>
              </>
            ) : searchQuery ? (
              <>
                <span className="font-medium" style={{ color: INK }}>{filtered.length}</span> results for "<span style={{ color: MAROON }} className="font-medium">{searchQuery}</span>"
              </>
            ) : (
              <>
                <span className="font-medium" style={{ color: INK }}>{filtered.length}</span> sacred products
              </>
            )}
          </div>
          <div className="text-[10px] uppercase tracking-[0.2em]" style={{ color: `${INK}55` }}>
            View · {view === "grid" ? "Tile Grid" : "List"}
          </div>
        </div>

        {allLoading ? (
          <div className={view === "grid"
            ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-8"
            : "flex flex-col gap-3"}>
            {Array(12).fill(0).map((_, i) => (
              view === "grid" ? (
                <div key={i} className="flex flex-col gap-3">
                  <Skeleton className="aspect-square rounded-md" />
                  <Skeleton className="h-3 w-1/4" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ) : (
                <div key={i} className="flex gap-4 p-4 rounded-md border" style={{ borderColor: `${INK}14` }}>
                  <Skeleton className="w-32 h-32 rounded-md flex-shrink-0" />
                  <div className="flex-1 space-y-2 py-1">
                    <Skeleton className="h-3 w-1/4" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-full" />
                    <div className="flex justify-between pt-2"><Skeleton className="h-5 w-1/4" /><Skeleton className="h-7 w-20 rounded-md" /></div>
                  </div>
                </div>
              )
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div
              className="w-12 h-12 rounded-md flex items-center justify-center mx-auto mb-4 border"
              style={{ background: CREAM_DEEP, borderColor: `${GOLD}55` }}
            >
              <Search className="h-5 w-5" style={{ color: GOLD }} />
            </div>
            <p className="font-semibold mb-1" style={{ color: INK }}>No products found</p>
            <p className="text-[13px] mb-4" style={{ color: `${INK}77` }}>Try different filters or search terms</p>
            <Button
              variant="outline"
              className="rounded-md h-9 text-[12px] font-semibold"
              style={{ borderColor: `${GOLD}66`, color: MAROON }}
              onClick={clearAll}
            >
              Clear all filters
            </Button>
          </div>
        ) : view === "grid" ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-10">
            {filtered.map(p => (
              <ProductTile key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map(p => (
              <ProductRow key={p.id} product={p} />
            ))}
          </div>
        )}

        {/* Themed AI advisor (one of 8 category slugs) */}
        {categoryTheme && (
          <CategoryAdvisor slug={categoryTheme.slug} theme={categoryTheme} />
        )}

        {/* AI-recommended additional products */}
        {aiAssistEnabled && aiRelatedProducts.length > 0 && (
          <div className="mt-12" data-testid="ai-related-products">
            <div className="flex items-center justify-center gap-2.5 mb-5">
              <span className="h-px w-6" style={{ background: `${GOLD}66` }} />
              <span className="inline-flex items-center gap-1.5 text-[10.5px] uppercase tracking-[0.28em] font-semibold" style={{ color: GOLD }}>
                <Wand2 className="h-3 w-3" /> AI also suggests
              </span>
              <span className="h-px w-6" style={{ background: `${GOLD}66` }} />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-x-4 gap-y-8">
              {aiRelatedProducts.map(p => (
                <ProductTile key={`ai-${p.id}`} product={p} />
              ))}
            </div>
          </div>
        )}

        {/* Curator's note (mockup-faithful editorial divider) */}
        {!searchQuery && (
          <div className="my-14 sm:my-16 grid grid-cols-12 gap-4 sm:gap-6 items-center">
            <div className="col-span-1 h-px" style={{ background: `${INK}22` }} />
            <div className="col-span-10 text-center">
              <div className="text-[10px] sm:text-[11px] tracking-[0.3em] uppercase mb-2" style={{ color: GOLD }}>
                Curator's note
              </div>
              <p className="font-serif text-base sm:text-lg leading-relaxed max-w-2xl mx-auto" style={{ color: MAROON }}>
                "We choose every item the way our grandmothers did — by hand, by heart, by the test of tradition."
              </p>
            </div>
            <div className="col-span-1 h-px" style={{ background: `${INK}22` }} />
          </div>
        )}

        {/* Trust strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 py-8 border-t" style={{ borderColor: `${INK}11` }}>
          {[
            { t: "Verified Authentic", s: "Every idol, mala & yantra source-checked" },
            { t: "Energised Ready", s: "Pandit-prepared before dispatch" },
            { t: "Free Shipping", s: "On orders above ₹499 across India" },
            { t: "Easy Returns", s: "7-day no-questions returns" },
          ].map((b) => (
            <div key={b.t} className="flex flex-col gap-1.5">
              <div className="text-sm font-medium" style={{ color: INK }}>{b.t}</div>
              <div className="text-xs leading-relaxed" style={{ color: `${INK}77` }}>{b.s}</div>
            </div>
          ))}
        </div>

        {/* Themed A+ content (one of 8 themed slugs) */}
        {categoryTheme && categoryContent && (
          <CategoryAPlusThemed theme={categoryTheme} content={categoryContent} />
        )}

        {/* Cross-sell to the other 7 themed verticals */}
        {categoryTheme && (
          <CategoryCrossSell currentSlug={categoryTheme.slug} />
        )}

        {/* Generic category content (parent /shop or non-themed slugs only) */}
        {!categoryTheme && categoryContent && (
          <section className="mt-14 max-w-4xl mx-auto" data-testid={`category-content-${categoryContent.slug}`}>
            <header className="text-center mb-8">
              <div className="inline-flex items-center justify-center gap-2.5 mb-3">
                <span className="h-px w-6" style={{ background: `${GOLD}66` }} />
                <span className="text-[10px] uppercase tracking-[0.3em] font-semibold" style={{ color: GOLD }}>{categoryContent.category}</span>
                <span className="h-px w-6" style={{ background: `${GOLD}66` }} />
              </div>
              <h2 className="font-serif text-2xl md:text-3xl font-semibold mb-3" style={{ color: MAROON }}>About {categoryContent.category}</h2>
              <p className="text-[13.5px] leading-relaxed" style={{ color: `${INK}cc` }}>{categoryContent.intro}</p>
            </header>
            <div className="space-y-5">
              {categoryContent.sections.map((sec, i) => (
                <article key={i} className="bg-white rounded-md border p-5 sm:p-6" style={{ borderColor: `${INK}14` }}>
                  <h3 className="font-serif text-[16px] sm:text-[17px] font-semibold mb-2" style={{ color: MAROON }}>{sec.heading}</h3>
                  <p className="text-[13.5px] leading-relaxed" style={{ color: `${INK}cc` }}>{sec.body}</p>
                </article>
              ))}
            </div>
            <div className="mt-10">
              <h3 className="font-serif text-xl md:text-2xl font-semibold mb-4 text-center" style={{ color: MAROON }}>Frequently asked questions</h3>
              <div className="space-y-2.5">
                {categoryContent.faqs.map((f, i) => (
                  <details key={i} className="group bg-white rounded-md border px-4 py-3" style={{ borderColor: `${INK}14` }} data-testid={`faq-${categoryContent.slug}-${i}`}>
                    <summary className="cursor-pointer list-none flex items-start justify-between gap-3 text-[13.5px] font-semibold" style={{ color: INK }}>
                      <span>{f.q}</span>
                      <ChevronDown className="h-4 w-4 flex-shrink-0 mt-0.5 transition-transform group-open:rotate-180" style={{ color: MAROON }} />
                    </summary>
                    <p className="mt-2 text-[13px] leading-relaxed" style={{ color: `${INK}cc` }}>{f.a}</p>
                  </details>
                ))}
              </div>
            </div>
          </section>
        )}

        <PageAPlusContent
          eyebrow="Why Shop on Vedic Tatva"
          title="Hindu Puja Samagri & Puja Essentials Online"
          intro="Authentic puja samagri, deity idols, brass diyas, panchapatra, rudraksha malas, gemstones, incense, yantras and more — sourced directly from traditional artisans of Banaras, Vrindavan, Tirupati, Kanchipuram and Kumbakonam. Every product is shastra-aligned and prepared with proper sanctity."
          trustBadges={[
            { value: "100%", label: "Authentic" },
            { value: "Pan", label: "India Delivery" },
            { value: "7-Day", label: "Easy Return" },
            { value: "Secure", label: "Payment" },
          ]}
          benefits={[
            { icon: ShieldCheck, title: "Shastra-Aligned Products", body: "Every item — from kalash and panchapatra to murti and yantra — follows traditional shilpa shastra and aagama texts. No machine-stamped substitutes." },
            { icon: Award, title: "Direct From Artisans", body: "We source directly from traditional Banaras brass workers, Channapatna idol carvers, Tirupati silk weavers and Kumbakonam pancha-loha craftsmen — fair price to artisan, fair price to you." },
            { icon: Leaf, title: "Pure & Natural Samagri", body: "Cow ghee diyas, organic camphor, hand-rolled sandalwood agarbatti, natural roli/kumkum, organic havan samagri — no synthetic chemicals or artificial fragrance." },
            { icon: Flame, title: "Complete Puja Kits", body: "Festival-ready kits for Diwali, Navratri, Ganesh Chaturthi, Satyanarayan Katha, Griha Pravesh, Rudra Abhishek and daily puja — everything you need in one box." },
            { icon: Heart, title: "Authentic Rudraksha & Yantras", body: "Genuine Nepal/Indonesia rudraksha with X-ray verification certificates. Yantras engraved per shastra; energised variants ship with details of the pranapratishtha performed." },
            { icon: Truck, title: "Pan-India + NRI Delivery", body: "Fast pan-India delivery and international shipping for Hindus in USA, UK, Canada, Australia, UAE and Singapore — your sacred items reach you safely." },
          ]}
          steps={[
            { title: "Browse by Need", body: "Search by deity (Ganesh, Lakshmi, Shiva, Devi), occasion (Diwali, Griha Pravesh, daily puja) or category (idols, samagri, malas, yantras)." },
            { title: "Verify Authenticity", body: "Each product page shows source, material composition (brass / panchaloha / silver), shastra reference and artisan details." },
            { title: "Order with Confidence", body: "Secure payment, pan-India delivery, 7-day easy return for unopened items, and dedicated customer support in your language." },
            { title: "Perform With Sanctity", body: "Every order ships with a small ritual guide — sankalpa mantra, item placement and step-by-step puja vidhi for the occasion." },
          ]}
          faqs={SHOP_PARENT_FAQS}
          keywordsBlurb="Buy authentic Hindu puja samagri online — brass and panchaloha murti (Ganesh, Lakshmi, Saraswati, Shiva, Hanuman, Krishna, Durga), rudraksha mala (1-mukhi to 21-mukhi from Nepal and Indonesia), gemstones, yantras (Sri Yantra, Mahamrityunjaya, Kuber), brass diyas, panchapatra, kalash, sandalwood agarbatti, camphor, roli kumkum, cow ghee, organic havan samagri, festival-ready puja kits for Diwali, Navratri, Ganesh Chaturthi, Satyanarayan Katha and Griha Pravesh. Pan-India delivery and international shipping for NRI Hindus."
        />

        <div className="mt-12">
          <RelatedServicesSection context="shop" currentPath="/shop" />
        </div>
      </main>
    </div>
  );
}
