import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { CATEGORY_THEMES, ORDERED_THEME_SLUGS } from "@/data/category-themes";
import { CATEGORY_CONTENT } from "@/data/category-content";
import type { Product } from "@shared/schema";

import { CATEGORY_IMAGE } from "@/data/category-images";

const MAROON = "#5A1F22";
const GOLD = "#B8860B";
const INK = "#2C1F0E";

type Props = {
  products?: Product[];
};

export default function ShopByCategory({ products }: Props) {
  return (
    <section
      className="container mx-auto px-4 py-10 sm:py-14"
      data-testid="section-shop-by-category"
    >
      {/* Section header */}
      <div className="text-center mb-8 sm:mb-10">
        <div className="inline-flex items-center gap-2.5 mb-3">
          <span className="h-px w-8" style={{ background: `${GOLD}66` }} />
          <span
            className="text-[11px] uppercase tracking-[0.3em] font-semibold"
            style={{ color: GOLD }}
          >
            Shop by Category
          </span>
          <span className="h-px w-8" style={{ background: `${GOLD}66` }} />
        </div>
        <h2
          className="font-serif text-2xl sm:text-3xl lg:text-4xl mb-2.5"
          style={{ color: MAROON }}
        >
          Eight sacred verticals — pick where to begin
        </h2>
        <p
          className="text-sm sm:text-[15px] max-w-2xl mx-auto leading-relaxed"
          style={{ color: `${INK}aa` }}
        >
          From X-ray verified Rudraksha to GIA-certified gemstones, every category
          carries its own AI advisor and shastra-aligned curation.
        </p>
      </div>

      {/* Grid: 2 col mobile → 3 col tablet → 4 col desktop */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        {ORDERED_THEME_SLUGS.map((slug, i) => {
          const theme = CATEGORY_THEMES[slug];
          const content = CATEGORY_CONTENT[slug];
          const img = CATEGORY_IMAGE[slug];
          if (!theme || !content) return null;
          const count = products?.filter((p) => p.category === content.category && (p.stock ?? 0) > 0).length;
          const Icon = theme.icon;

          return (
            <motion.div
              key={slug}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4, delay: i * 0.04 }}
            >
              <Link
                href={`/shop/${slug}`}
                className="group relative block rounded-md overflow-hidden border-2 hover-elevate active-elevate-2 h-full"
                style={{ borderColor: `${theme.palette.accent}33` }}
                data-testid={`category-card-${slug}`}
              >
                {/* Image hero with themed gradient backdrop */}
                <div
                  className="relative aspect-[4/3] overflow-hidden"
                  style={{
                    background: `linear-gradient(135deg, ${theme.palette.bgFrom} 0%, ${theme.palette.bgVia} 60%, ${theme.palette.bgTo} 100%)`,
                  }}
                >
                  {/* Motif emoji watermark */}
                  <div
                    aria-hidden="true"
                    className="absolute -bottom-6 -right-3 text-[140px] sm:text-[180px] opacity-[0.08] leading-none select-none pointer-events-none font-serif"
                    style={{ color: "white" }}
                  >
                    {theme.motifEmoji}
                  </div>
                  {/* Representative image — purpose-shot for each category, fills the card */}
                  {img && (
                    <img
                      src={img}
                      alt={`${theme.label} — ${theme.tagline}`}
                      width={400}
                      height={300}
                      loading="lazy"
                      decoding="async"
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                    />
                  )}
                  {/* Bottom scrim for label readability */}
                  <div
                    aria-hidden="true"
                    className="absolute inset-x-0 bottom-0 h-1/2 pointer-events-none"
                    style={{
                      background:
                        "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.55) 100%)",
                    }}
                  />
                  {/* In-stock count pill */}
                  {typeof count === "number" && count > 0 && (
                    <span
                      className="absolute top-2.5 right-2.5 text-[9.5px] uppercase tracking-[0.14em] font-semibold px-2 py-1 rounded backdrop-blur-sm"
                      style={{
                        background: "rgba(255,255,255,0.92)",
                        color: theme.palette.bgFrom,
                      }}
                    >
                      {count} in stock
                    </span>
                  )}
                </div>

                {/* Label strip */}
                <div
                  className="px-3 sm:px-4 py-3 sm:py-3.5 flex items-center justify-between gap-2 bg-white"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="inline-flex items-center justify-center w-7 h-7 rounded-full flex-shrink-0"
                      style={{
                        background: `${theme.palette.bgFrom}12`,
                        color: theme.palette.bgVia,
                      }}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </span>
                    <div className="min-w-0">
                      <div
                        className="font-serif text-[13.5px] sm:text-[15px] font-semibold leading-tight truncate"
                        style={{ color: theme.palette.bgFrom }}
                      >
                        {theme.label}
                      </div>
                      <div
                        className="text-[10.5px] sm:text-[11px] uppercase tracking-wider truncate"
                        style={{ color: `${INK}77` }}
                      >
                        {theme.tagline}
                      </div>
                    </div>
                  </div>
                  <ArrowRight
                    className="w-4 h-4 flex-shrink-0 transition-transform group-hover:translate-x-0.5"
                    style={{ color: theme.palette.bgVia }}
                  />
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
