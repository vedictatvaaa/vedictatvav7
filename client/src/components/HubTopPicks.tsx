import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight, ShoppingBag } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { Product } from "@shared/schema";
import { CATEGORY_THEMES, ORDERED_THEME_SLUGS } from "@/data/category-themes";
import { CATEGORY_CONTENT } from "@/data/category-content";
import { optImg, optImgSrcSet, SIZES } from "@/lib/optImg";
import { getProductUrl } from "@/lib/utils";

// Mirrors shop.tsx getPrice — handles variated products where the top-level
// price field may be 0/null and the real prices live inside `variations`.
function safePrice(product: Product): number {
  try {
    const v = product.variations ? JSON.parse(product.variations) : [];
    if (Array.isArray(v) && v.length > 0) {
      const prices = v.map((x: any) => Number(x?.price)).filter((n) => Number.isFinite(n) && n > 0);
      if (prices.length > 0) return Math.min(...prices);
    }
  } catch {}
  const p = Number(product.price);
  return Number.isFinite(p) ? p : 0;
}
function safeSalePrice(product: Product): number | null {
  const sp = product.salePrice == null ? null : Number(product.salePrice);
  return sp != null && Number.isFinite(sp) && sp > 0 ? sp : null;
}

const MAROON = "#5A1F22";
const GOLD = "#B8860B";
const INK = "#2C1F0E";

export default function HubTopPicks() {
  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  // For each of the 8 themed categories, pick the top product (featured first, else newest in stock)
  const picks = ORDERED_THEME_SLUGS.map((slug) => {
    const theme = CATEGORY_THEMES[slug];
    const content = CATEGORY_CONTENT[slug];
    if (!theme || !content || !products) return null;
    const inCat = products.filter(
      (p) => p.category === content.category && (p.stock ?? 0) > 0,
    );
    const featured = inCat.find((p) => p.featured);
    const product = featured || inCat[0];
    return product ? { theme, content, product } : null;
  }).filter((x): x is NonNullable<typeof x> => x !== null);

  return (
    <section className="container mx-auto px-4 py-14 sm:py-20" data-testid="section-hub-top-picks">
      <div className="text-center mb-10 sm:mb-12">
        <div className="inline-flex items-center gap-2.5 mb-3">
          <span className="h-px w-8" style={{ background: `${GOLD}66` }} />
          <span className="text-[11px] uppercase tracking-[0.3em] font-semibold" style={{ color: GOLD }}>
            Curator's Top Picks
          </span>
          <span className="h-px w-8" style={{ background: `${GOLD}66` }} />
        </div>
        <h2 className="font-serif text-3xl sm:text-4xl mb-3" style={{ color: MAROON }}>
          One sacred treasure from each vertical
        </h2>
        <p className="text-sm sm:text-base max-w-2xl mx-auto leading-relaxed" style={{ color: `${INK}cc` }}>
          A curated entry point — the bestselling, most-loved item from each of our eight categories.
          Tap to explore the rest within that tradition.
        </p>
      </div>

      {isLoading || !products ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[3/4] rounded-md" />
          ))}
        </div>
      ) : picks.length === 0 ? (
        <p className="text-center text-sm" style={{ color: `${INK}99` }}>
          New picks are being curated. Check back soon.
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
          {picks.map(({ theme, product }, i) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.4, delay: i * 0.04 }}
            >
              <Link
                href={getProductUrl(product.id, product.name)}
                className="block group rounded-md overflow-hidden border-2 hover-elevate active-elevate-2 bg-white h-full"
                style={{ borderColor: `${theme.palette.accent}33` }}
                data-testid={`pick-${theme.slug}`}
              >
                <div className="relative aspect-[4/5] overflow-hidden"
                  style={{ background: `linear-gradient(135deg, ${theme.palette.bgFrom}11, ${theme.palette.bgTo}11)` }}>
                  {product.image ? (
                    <img
                      src={optImg(product.image, 400)}
                      srcSet={optImgSrcSet(product.image, [200, 300, 400, 600])}
                      sizes={SIZES.tile}
                      alt={product.name}
                      width={400}
                      height={500}
                      loading="lazy"
                      decoding="async"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-6xl opacity-40 select-none">
                      {theme.motifEmoji}
                    </div>
                  )}
                  <span
                    className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 text-[9.5px] uppercase tracking-[0.16em] font-semibold px-2 py-1 rounded backdrop-blur-sm"
                    style={{
                      background: `${theme.palette.bgFrom}D9`,
                      color: theme.palette.accent,
                      border: `1px solid ${theme.palette.accent}55`,
                    }}
                  >
                    {theme.label}
                  </span>
                  {product.featured && (
                    <span
                      className="absolute top-2.5 right-2.5 text-[9.5px] uppercase tracking-[0.14em] font-semibold px-2 py-1 rounded"
                      style={{ background: GOLD, color: "white" }}
                    >
                      Top Pick
                    </span>
                  )}
                </div>
                <div className="p-3 sm:p-4">
                  <h3 className="font-serif text-sm sm:text-base leading-tight line-clamp-2 mb-1.5" style={{ color: INK }}>
                    {product.name}
                  </h3>
                  <div className="flex items-end justify-between gap-2">
                    <div className="flex items-baseline gap-1.5">
                      {(() => {
                        const base = safePrice(product);
                        const sale = safeSalePrice(product);
                        const display = sale ?? base;
                        return (
                          <>
                            <span className="font-semibold text-base sm:text-lg" style={{ color: MAROON }}>
                              ₹{display.toLocaleString("en-IN")}
                            </span>
                            {sale && sale < base && (
                              <span className="text-xs line-through" style={{ color: `${INK}66` }}>
                                ₹{base.toLocaleString("en-IN")}
                              </span>
                            )}
                          </>
                        );
                      })()}
                    </div>
                    <ArrowRight
                      className="w-4 h-4 transition-transform group-hover:translate-x-0.5"
                      style={{ color: theme.palette.bgVia }}
                    />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}

      <div className="text-center mt-10">
        <Link
          href="/shop"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md font-semibold text-sm hover-elevate active-elevate-2"
          style={{ background: MAROON, color: "white" }}
          data-testid="link-browse-all-shop"
        >
          <ShoppingBag className="w-4 h-4" />
          Browse the full catalogue
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
}
