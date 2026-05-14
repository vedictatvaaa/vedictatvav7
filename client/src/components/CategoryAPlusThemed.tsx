import { motion } from "framer-motion";
import { ChevronDown, Sparkles } from "lucide-react";
import type { CategoryTheme } from "@/data/category-themes";
import type { CategoryContent } from "@/data/category-content";

type Props = {
  theme: CategoryTheme;
  content: CategoryContent;
};

// Themed counterpart to the generic categoryContent block in shop.tsx.
// Renders the SAME content (intro / sections / FAQs) — important for SEO
// (FAQPage JSON-LD on the server still references these Q&As) — but using
// the per-category palette so each landing has its own visual personality.
export default function CategoryAPlusThemed({ theme, content }: Props) {
  const Icon = theme.icon;
  return (
    <section
      className="mt-14 sm:mt-16"
      data-testid={`themed-category-content-${content.slug}`}
    >
      {/* About — themed eyebrow + intro */}
      <header className="text-center mb-9 sm:mb-11 max-w-3xl mx-auto px-4">
        <div className="inline-flex items-center gap-2.5 mb-3">
          <span className="h-px w-7" style={{ background: `${theme.palette.bgVia}66` }} />
          <span
            className="inline-flex items-center gap-1.5 text-[10.5px] uppercase tracking-[0.28em] font-semibold"
            style={{ color: theme.palette.bgVia }}
          >
            <Icon className="w-3 h-3" />
            About {theme.label}
          </span>
          <span className="h-px w-7" style={{ background: `${theme.palette.bgVia}66` }} />
        </div>
        <h2
          className="font-serif text-2xl sm:text-3xl font-semibold mb-3 leading-tight"
          style={{ color: theme.palette.bgFrom }}
        >
          The {theme.label} tradition, kept whole
        </h2>
        <p className="text-[14px] sm:text-[15px] leading-relaxed" style={{ color: "#2C1F0Ecc" }}>
          {content.intro}
        </p>
      </header>

      {/* Sections — themed cards in a 1col → 2col grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 max-w-5xl mx-auto px-4">
        {content.sections.map((sec, i) => (
          <motion.article
            key={i}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-30px" }}
            transition={{ duration: 0.4, delay: i * 0.05 }}
            className="rounded-md border-2 p-5 sm:p-6 bg-white relative overflow-hidden"
            style={{ borderColor: `${theme.palette.accent}33` }}
          >
            {/* Themed accent strip */}
            <div
              aria-hidden="true"
              className="absolute top-0 left-0 right-0 h-[3px]"
              style={{ background: `linear-gradient(90deg, ${theme.palette.bgFrom}, ${theme.palette.bgVia}, ${theme.palette.accent})` }}
            />
            <h3
              className="font-serif text-[16px] sm:text-[17px] font-semibold mb-2 leading-snug"
              style={{ color: theme.palette.bgFrom }}
            >
              {sec.heading}
            </h3>
            <p className="text-[13.5px] leading-relaxed" style={{ color: "#2C1F0Ecc" }}>
              {sec.body}
            </p>
          </motion.article>
        ))}
      </div>

      {/* FAQs — themed accordion */}
      <div className="mt-12 sm:mt-14 max-w-3xl mx-auto px-4">
        <div className="text-center mb-6">
          <span
            className="inline-flex items-center gap-1.5 text-[10.5px] uppercase tracking-[0.28em] font-semibold mb-2"
            style={{ color: theme.palette.bgVia }}
          >
            <Sparkles className="w-3 h-3" />
            Frequently Asked
          </span>
          <h3
            className="font-serif text-xl sm:text-2xl font-semibold leading-tight"
            style={{ color: theme.palette.bgFrom }}
          >
            Everything you wanted to ask about {theme.label.toLowerCase()}
          </h3>
        </div>
        <div className="space-y-2.5">
          {content.faqs.map((f, i) => (
            <details
              key={i}
              className="group rounded-md border bg-white px-4 py-3 transition-colors"
              style={{ borderColor: `${theme.palette.accent}40` }}
              data-testid={`themed-faq-${content.slug}-${i}`}
            >
              <summary
                className="cursor-pointer list-none flex items-start justify-between gap-3 text-[13.5px] font-semibold"
                style={{ color: "#2C1F0E" }}
              >
                <span>{f.q}</span>
                <ChevronDown
                  className="h-4 w-4 flex-shrink-0 mt-0.5 transition-transform group-open:rotate-180"
                  style={{ color: theme.palette.bgVia }}
                />
              </summary>
              <p className="mt-2 text-[13px] leading-relaxed" style={{ color: "#2C1F0Ecc" }}>
                {f.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
