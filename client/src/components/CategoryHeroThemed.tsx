import { motion } from "framer-motion";
import { Link } from "wouter";
import { ChevronRight, Home } from "lucide-react";
import type { CategoryTheme } from "@/data/category-themes";

type Props = {
  theme: CategoryTheme;
  h1: string;
  intro: string;
  productCount?: number;
};

export default function CategoryHeroThemed({ theme, h1, intro, productCount }: Props) {
  const Icon = theme.icon;
  return (
    <section
      className="relative overflow-hidden text-white"
      style={{ background: `linear-gradient(135deg, ${theme.palette.bgFrom} 0%, ${theme.palette.bgVia} 55%, ${theme.palette.bgTo} 100%)` }}
      data-testid="section-category-hero"
    >
      {/* Decorative motif background */}
      <div
        aria-hidden="true"
        className="absolute -right-10 -bottom-20 sm:-right-20 sm:-bottom-32 text-[260px] sm:text-[420px] opacity-[0.07] leading-none select-none pointer-events-none font-serif"
      >
        {theme.motifEmoji}
      </div>
      <div
        aria-hidden="true"
        className="absolute -left-20 -top-20 w-72 h-72 rounded-full blur-3xl opacity-30"
        style={{ background: theme.palette.accent }}
      />
      {/* Dark scrim under hero text so white text passes WCAG AA even on lighter gradients */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{ background: "linear-gradient(95deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.25) 45%, rgba(0,0,0,0) 75%)" }}
      />

      <div className="container mx-auto px-4 py-10 sm:py-16 lg:py-20 relative z-10">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-5 sm:mb-7">
          <ol className="flex items-center gap-1.5 text-xs sm:text-sm text-white/70 flex-wrap">
            <li>
              <Link href="/" className="hover:text-white transition-colors flex items-center gap-1" data-testid="link-breadcrumb-home">
                <Home className="w-3.5 h-3.5" />
                Home
              </Link>
            </li>
            <ChevronRight className="w-3.5 h-3.5 opacity-50" />
            <li>
              <Link href="/spiritual-essentials" className="hover:text-white transition-colors" data-testid="link-breadcrumb-essentials">
                Puja Essentials
              </Link>
            </li>
            <ChevronRight className="w-3.5 h-3.5 opacity-50" />
            <li className="text-white font-medium">{theme.label}</li>
          </ol>
        </nav>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl"
        >
          <span
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] sm:text-xs uppercase tracking-[0.18em] font-semibold mb-4 sm:mb-5"
            style={{ background: theme.palette.chip, color: theme.palette.accent, border: `1px solid ${theme.palette.accent}55` }}
          >
            <Icon className="w-3.5 h-3.5" />
            {theme.label}
          </span>

          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl xl:text-6xl leading-[1.1] mb-4 sm:mb-5">
            {h1}
          </h1>

          <p className="text-base sm:text-lg text-white/85 leading-relaxed max-w-2xl">
            {intro}
          </p>

          {typeof productCount === "number" && productCount > 0 && (
            <div className="mt-5 sm:mt-6 inline-flex items-center gap-2 text-sm">
              <span
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ background: theme.palette.accent }}
              />
              <span className="text-white/80">
                <strong className="text-white">{productCount}</strong> products in stock
              </span>
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
