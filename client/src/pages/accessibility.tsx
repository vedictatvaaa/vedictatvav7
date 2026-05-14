import { useEffect } from "react";
import { Link } from "wouter";
import { ShieldCheck, Keyboard, Eye, Volume2, Mail } from "lucide-react";

export default function Accessibility() {
  useEffect(() => {
    document.title = "Accessibility Statement | Vedic Tatva";
    const desc = "Vedic Tatva is committed to WCAG 2.1 Level AA accessibility — keyboard navigation, screen reader support, color contrast, and an open feedback channel.";
    let m = document.querySelector('meta[name="description"]');
    if (!m) { m = document.createElement("meta"); m.setAttribute("name", "description"); document.head.appendChild(m); }
    m.setAttribute("content", desc);
  }, []);

  const features = [
    { Icon: Keyboard, title: "Keyboard navigation", body: "Every interactive element on Vedic Tatva is reachable using a keyboard alone. Tab moves forward, Shift+Tab moves back, Enter/Space activates, and Esc closes dialogs." },
    { Icon: Eye, title: "Visible focus indicators", body: "All buttons, links and form controls show a clearly visible focus ring (a gold outline on dark surfaces, maroon on light) so the active element is always obvious." },
    { Icon: Volume2, title: "Screen reader friendly", body: "We use semantic HTML landmarks (header, nav, main, footer), descriptive alt text on imagery, accessible labels on icon buttons, and ARIA only where native HTML cannot do the job." },
    { Icon: ShieldCheck, title: "Colour & contrast", body: "Body text meets at least a 4.5:1 contrast ratio against its background; large text and UI components meet 3:1, in line with WCAG 2.1 Level AA." },
  ];

  return (
    <div className="min-h-screen bg-[#FBF7EE]" data-testid="page-accessibility">
      <div className="container mx-auto px-4 py-12 md:py-16 max-w-3xl">
        <header className="mb-10">
          <p className="text-[11px] uppercase tracking-[0.22em] font-semibold text-[#D4AF37] mb-2">Vedic Tatva</p>
          <h1 className="font-serif text-3xl md:text-4xl text-[#6D2B35] mb-3" data-testid="heading-accessibility">Accessibility Statement</h1>
          <p className="text-[#5a4a3a] leading-relaxed">
            We believe sacred resources should be available to everyone. Vedic Tatva is built and tested to meet the
            <strong> Web Content Accessibility Guidelines (WCAG) 2.1 Level AA</strong>, and we keep improving as we learn from the community.
          </p>
        </header>

        <section className="grid sm:grid-cols-2 gap-4 mb-12" aria-label="Accessibility features">
          {features.map(({ Icon, title, body }) => (
            <div key={title} className="bg-white border border-[#EAD9B7] rounded-md p-5" data-testid={`a11y-card-${title.toLowerCase().replace(/[^a-z]+/g, "-")}`}>
              <div className="w-9 h-9 rounded-md bg-[#FBF7EE] border border-[#D4AF37]/40 flex items-center justify-center mb-3">
                <Icon className="w-4 h-4 text-[#6D2B35]" aria-hidden="true" />
              </div>
              <h2 className="font-serif text-lg text-[#6D2B35] mb-1.5">{title}</h2>
              <p className="text-sm text-[#5a4a3a] leading-relaxed">{body}</p>
            </div>
          ))}
        </section>

        <section className="mb-10">
          <h2 className="font-serif text-2xl text-[#6D2B35] mb-3">What we test for</h2>
          <ul className="space-y-2 text-[#5a4a3a] list-disc pl-5 leading-relaxed">
            <li>Automated accessibility checks (axe-core) on every major page during development.</li>
            <li>Manual keyboard-only walkthroughs of the cart, checkout, account and puja booking flows.</li>
            <li>Screen reader smoke tests using VoiceOver (macOS / iOS) and NVDA (Windows).</li>
            <li>Colour contrast verified against WCAG 2.1 AA thresholds (4.5:1 for body text, 3:1 for large text and UI).</li>
            <li>Forms include explicit labels, error messages associated with their fields, and never rely on colour alone.</li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="font-serif text-2xl text-[#6D2B35] mb-3">Known limitations</h2>
          <p className="text-[#5a4a3a] leading-relaxed mb-2">
            We are continually improving and are honest about where we still have work to do:
          </p>
          <ul className="space-y-2 text-[#5a4a3a] list-disc pl-5 leading-relaxed">
            <li>A small number of legacy long-form articles may use decorative emoji or images without descriptive alt text — we are auditing and fixing these.</li>
            <li>Some embedded third-party widgets (live chat, payment gateway) follow their own accessibility roadmaps that we cannot directly control.</li>
            <li>Hindi/regional language coverage is being expanded; some pages currently fall back to English.</li>
          </ul>
        </section>

        <section className="bg-white border border-[#EAD9B7] rounded-md p-6 mb-10">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-md bg-[#6D2B35] flex items-center justify-center flex-shrink-0">
              <Mail className="w-4 h-4 text-[#D4AF37]" aria-hidden="true" />
            </div>
            <div>
              <h2 className="font-serif text-xl text-[#6D2B35] mb-1.5">Tell us how we can do better</h2>
              <p className="text-sm text-[#5a4a3a] leading-relaxed mb-2">
                Found something hard to use, read, or hear? We want to know. Email
                {" "}
                <a className="text-[#6D2B35] font-semibold underline underline-offset-2" href="mailto:ecom@vedictatva.com" data-testid="link-a11y-email">ecom@vedictatva.com</a>
                {" "}or call <a className="text-[#6D2B35] font-semibold underline underline-offset-2" href="tel:+918447844702">8447-8447-02</a>. We aim to respond within 3 working days.
              </p>
              <p className="text-sm text-[#5a4a3a] leading-relaxed">
                You can also <Link href="/contact" className="text-[#6D2B35] font-semibold underline underline-offset-2" data-testid="link-a11y-contact">use our contact form</Link>; please mention "Accessibility" in the subject so it reaches the right team.
              </p>
            </div>
          </div>
        </section>

        <p className="text-xs text-[#5a4a3a]/70">
          Last reviewed: {new Date().toLocaleDateString("en-IN", { year: "numeric", month: "long" })}.
          Conformance target: WCAG 2.1 Level AA.
        </p>
      </div>
    </div>
  );
}
