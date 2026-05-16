// =====================================================================
// Server-side mirror of pandit city + popular-puja data used by:
//   • sitemap-pages.xml emission (server/routes.ts)
//   • per-route OG share cards (server/og-meta.ts)
//
// Kept deliberately minimal — just slugs + display names. The rich
// content lives in client/src/data/pandit-cities.ts. If you add a new
// city or puja there, mirror the slug + display name here.
// =====================================================================

export function slugifyPuja(name: string): string {
  return name
    .toLowerCase()
    .replace(/\//g, " ")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export type PanditCitySummary = {
  slug: string;
  name: string;
  state: string;
  live: boolean;
  popularPujaNames: string[]; // display names — slugified at use site
};

export const PANDIT_CITY_SUMMARIES: PanditCitySummary[] = [
  {
    slug: "delhi-ncr",
    name: "Delhi NCR",
    state: "Delhi",
    live: true,
    popularPujaNames: [
      "Satyanarayan Katha",
      "Griha Pravesh",
      "Vivah / Wedding",
      "Mundan / Namkaran",
      "Rudrabhishek",
      "Mata ki Chowki / Jagran",
    ],
  },
  {
    slug: "mumbai",
    name: "Mumbai",
    state: "Maharashtra",
    live: false,
    popularPujaNames: [
      "Ganesh Chaturthi Sthapana",
      "Satyanarayan Puja",
      "Vastu Shanti",
      "Wedding (Vivah)",
      "Gauri-Ganpati",
      "Diwali Lakshmi Pujan",
    ],
  },
  {
    slug: "bangalore",
    name: "Bangalore",
    state: "Karnataka",
    live: false,
    popularPujaNames: [
      "Satyanarayan Puja",
      "Griha Pravesh",
      "Ayushya Homam",
      "Wedding (Kalyana)",
      "Navagraha Shanti",
      "Varalakshmi Vratam",
    ],
  },
  {
    slug: "chennai",
    name: "Chennai",
    state: "Tamil Nadu",
    live: false,
    popularPujaNames: [
      "Ayushya Homam",
      "Sashtiabdapurthi",
      "Bhimaratha Shanti",
      "Vivaha (Wedding)",
      "Gruhapravesha",
      "Sri Sukta Homa",
    ],
  },
  {
    slug: "kolkata",
    name: "Kolkata",
    state: "West Bengal",
    live: false,
    popularPujaNames: [
      "Durga Puja Anjali / Bodhon",
      "Saraswati Puja",
      "Lakshmi Puja",
      "Annaprashan",
      "Bivah (Wedding)",
      "Shradh / Tarpan",
    ],
  },
  {
    slug: "guwahati",
    name: "Guwahati",
    state: "Assam",
    live: false,
    popularPujaNames: [
      "Bihu Pujan",
      "Durga Puja",
      "Lakshmi Puja",
      "Naam-prasanga",
      "Griha Pravesh",
      "Vivaha",
    ],
  },
  {
    slug: "lucknow",
    name: "Lucknow",
    state: "Uttar Pradesh",
    live: false,
    popularPujaNames: [
      "Satyanarayan Katha",
      "Ramcharitmanas Path",
      "Griha Pravesh",
      "Vivaha",
      "Mundan / Namkaran",
      "Shradh / Pitru Tarpan",
    ],
  },
];

export const PANDIT_CITY_BY_SLUG: Record<string, PanditCitySummary> =
  Object.fromEntries(PANDIT_CITY_SUMMARIES.map((c) => [c.slug, c]));
