import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import { CATEGORY_THEMES, ORDERED_THEME_SLUGS } from "@/data/category-themes";

const MAROON = "#5A1F22";
const GOLD = "#B8860B";
const INK = "#2C1F0E";

type Props = {
  currentSlug: string;
};

export default function CategoryCrossSell({ currentSlug }: Props) {
  const others = ORDERED_THEME_SLUGS
    .filter((s) => s !== currentSlug)
    .map((s) => CATEGORY_THEMES[s])
    .filter(Boolean);

  return (
    <section className="mt-16 sm:mt-20 max-w-6xl mx-auto px-4" data-testid="section-cross-sell">
      <div className="text-center mb-7 sm:mb-9">
        <div className="inline-flex items-center gap-2.5 mb-3">
          <span className="h-px w-7" style={{ background: `${GOLD}66` }} />
          <span className="text-[10.5px] uppercase tracking-[0.28em] font-semibold" style={{ color: GOLD }}>
            Also explore
          </span>
          <span className="h-px w-7" style={{ background: `${GOLD}66` }} />
        </div>
        <h3 className="font-serif text-xl sm:text-2xl mb-2" style={{ color: MAROON }}>
          Continue your sacred journey
        </h3>
        <p className="text-sm leading-relaxed max-w-xl mx-auto" style={{ color: `${INK}aa` }}>
          Seven more verticals — each with its own AI advisor and shastra-aligned curation.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2.5 sm:gap-3">
        {others.map((t) => {
          const Icon = t.icon;
          return (
            <Link
              key={t.slug}
              href={`/shop/${t.slug}`}
              className="group flex flex-col items-center text-center rounded-md p-3 sm:p-4 border hover-elevate active-elevate-2"
              style={{ borderColor: `${t.palette.accent}40`, background: `${t.palette.bgFrom}05` }}
              data-testid={`cross-sell-${t.slug}`}
            >
              <span
                className="inline-flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full mb-2"
                style={{ background: `${t.palette.bgFrom}`, color: t.palette.accent }}
              >
                <Icon className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
              </span>
              <span className="text-[11.5px] sm:text-xs font-semibold leading-tight" style={{ color: t.palette.bgFrom }}>
                {t.label}
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] mt-1.5 transition-all group-hover:gap-1.5" style={{ color: t.palette.bgVia }}>
                Explore <ArrowRight className="w-3 h-3" />
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
