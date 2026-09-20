export type FooterDestination = {
  href: string;
  testid: string;
};

export const FOOTER_DESTINATIONS = {
  shop: [
    { href: "/online-puja-store", testid: "footer-cat-puja-store" },
    { href: "/rudraksha-collection", testid: "footer-cat-rudraksha" },
    { href: "/rudraksha-mala", testid: "footer-cat-rudraksha-mala" },
    { href: "/havan-samagri", testid: "footer-cat-havan" },
    { href: "/puja-kits", testid: "footer-cat-puja-kits" },
    { href: "/brass-diyas", testid: "footer-cat-brass" },
    { href: "/spiritual-jewelry", testid: "footer-cat-jewelry" },
    { href: "/temple-decor", testid: "footer-cat-temple-decor" },
  ] satisfies FooterDestination[],
  services: [
    { href: "/book-pandit-online", testid: "footer-link-pandits" },
    { href: "/online-puja-booking", testid: "footer-link-puja" },
    { href: "/virtual-puja", testid: "footer-link-virtual-puja" },
    { href: "/astrology", testid: "footer-link-astrology" },
    { href: "/donations", testid: "footer-link-donations" },
  ] satisfies FooterDestination[],
  tools: [
    { href: "/today-panchang", testid: "footer-link-panchang" },
    { href: "/muhurat-finder", testid: "footer-link-muhurat" },
    { href: "/vastu-compass", testid: "footer-link-vastu" },
    { href: "/kathas", testid: "footer-link-kathas" },
    { href: "/digital-japa-counter", testid: "footer-link-japa" },
    { href: "/ai-kundli", testid: "footer-link-ai-kundli" },
    { href: "/blog", testid: "footer-link-blog" },
    { href: "/track-order", testid: "footer-link-track-order" },
    { href: "/return-ticket", testid: "footer-link-returns" },
  ] satisfies FooterDestination[],
  company: [
    { href: "/about", testid: "footer-link-about" },
    { href: "/contact", testid: "footer-link-contact" },
    { href: "/careers", testid: "footer-link-careers" },
    { href: "/franchise", testid: "footer-link-franchise" },
    { href: "/pandit/signup", testid: "footer-link-become-pandit" },
    { href: "/become-astrologer", testid: "footer-link-become-astrologer" },
  ] satisfies FooterDestination[],
  policies: [
    { href: "/terms-conditions", testid: "footer-link-terms" },
    { href: "/privacy-policy", testid: "footer-link-privacy" },
    { href: "/refund-policy", testid: "footer-link-refund" },
    { href: "/shipping-policy", testid: "footer-link-shipping" },
    { href: "/accessibility", testid: "footer-link-accessibility" },
  ] satisfies FooterDestination[],
} as const;

export const FOOTER_INTERNAL_HREFS = Array.from(
  new Set(Object.values(FOOTER_DESTINATIONS).flat().map(({ href }) => href)),
);