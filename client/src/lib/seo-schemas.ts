export type Schema = { id: string; payload: Record<string, any> };

const CTX = "https://schema.org";

function origin(): string {
  return typeof window !== "undefined" ? window.location.origin : "";
}

export function abs(path: string): string {
  if (!path) return origin();
  if (/^https?:\/\//i.test(path)) return path;
  return `${origin()}${path.startsWith("/") ? "" : "/"}${path}`;
}

export function breadcrumbList(items: Array<{ name: string; url: string }>): Schema {
  return {
    id: "breadcrumb",
    payload: {
      "@context": CTX,
      "@type": "BreadcrumbList",
      itemListElement: items.map((it, idx) => ({
        "@type": "ListItem",
        position: idx + 1,
        name: it.name,
        item: abs(it.url),
      })),
    },
  };
}

export function faqPage(faqs: Array<{ question: string; answer: string }>, id = "faq"): Schema | null {
  const cleaned = faqs.filter((f) => f && f.question && f.answer);
  if (cleaned.length === 0) return null;
  return {
    id,
    payload: {
      "@context": CTX,
      "@type": "FAQPage",
      mainEntity: cleaned.map((f) => ({
        "@type": "Question",
        name: f.question,
        acceptedAnswer: { "@type": "Answer", text: f.answer },
      })),
    },
  };
}

export function product(args: {
  name: string;
  description?: string;
  image?: string | string[];
  sku?: string | number;
  brand?: string;
  price?: number | string;
  priceCurrency?: string;
  availability?: "InStock" | "OutOfStock" | "PreOrder";
  url?: string;
  ratingValue?: number;
  reviewCount?: number;
  category?: string;
  reviews?: Array<{
    author: string;
    rating: number;
    body?: string;
    datePublished?: string;
  }>;
}): Schema {
  const offers = args.price !== undefined
    ? {
        "@type": "Offer",
        price: String(args.price),
        priceCurrency: args.priceCurrency || "INR",
        availability: `https://schema.org/${args.availability || "InStock"}`,
        url: args.url ? abs(args.url) : undefined,
      }
    : undefined;
  const aggregateRating = args.ratingValue && args.reviewCount
    ? { "@type": "AggregateRating", ratingValue: args.ratingValue, reviewCount: args.reviewCount }
    : undefined;
  const reviewItems = args.reviews && args.reviews.length > 0
    ? args.reviews.map((r) => ({
        "@type": "Review",
        author: { "@type": "Person", name: r.author || "Verified Buyer" },
        reviewRating: {
          "@type": "Rating",
          ratingValue: r.rating,
          bestRating: 5,
          worstRating: 1,
        },
        reviewBody: r.body,
        datePublished: r.datePublished,
      }))
    : undefined;
  const payload: Record<string, any> = {
    "@context": CTX,
    "@type": "Product",
    name: args.name,
    description: args.description,
    image: args.image,
    sku: args.sku !== undefined ? String(args.sku) : undefined,
    category: args.category,
    brand: args.brand ? { "@type": "Brand", name: args.brand } : undefined,
    offers,
    aggregateRating,
    review: reviewItems,
  };
  Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);
  return { id: "product", payload };
}

export function blogPosting(args: {
  title: string;
  description?: string;
  url: string;
  image?: string;
  datePublished?: string;
  dateModified?: string;
  authorName?: string;
  publisherName?: string;
  publisherLogo?: string;
}): Schema {
  const payload: Record<string, any> = {
    "@context": CTX,
    "@type": "BlogPosting",
    headline: args.title,
    description: args.description,
    image: args.image ? [args.image] : undefined,
    mainEntityOfPage: { "@type": "WebPage", "@id": abs(args.url) },
    datePublished: args.datePublished,
    dateModified: args.dateModified || args.datePublished,
    author: args.authorName ? { "@type": "Person", name: args.authorName } : undefined,
    publisher: args.publisherName
      ? {
          "@type": "Organization",
          name: args.publisherName,
          logo: args.publisherLogo ? { "@type": "ImageObject", url: args.publisherLogo } : undefined,
        }
      : undefined,
  };
  Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);
  return { id: "article", payload };
}

export function blogListing(items: Array<{ title: string; url: string }>): Schema {
  return {
    id: "blog-list",
    payload: {
      "@context": CTX,
      "@type": "Blog",
      blogPost: items.map((it) => ({
        "@type": "BlogPosting",
        headline: it.title,
        url: abs(it.url),
      })),
    },
  };
}

export function itemList(args: {
  name: string;
  items: Array<{ name: string; url: string; image?: string }>;
  id?: string;
}): Schema {
  return {
    id: args.id || "item-list",
    payload: {
      "@context": CTX,
      "@type": "ItemList",
      name: args.name,
      itemListElement: args.items.map((it, idx) => ({
        "@type": "ListItem",
        position: idx + 1,
        name: it.name,
        url: abs(it.url),
        ...(it.image ? { image: it.image } : {}),
      })),
    },
  };
}

export function event(args: {
  name: string;
  startDate: string;
  endDate?: string;
  description?: string;
  url?: string;
  image?: string;
  locationName?: string;
  locationAddress?: string;
  performerName?: string;
  organizerName?: string;
  eventStatus?: "EventScheduled" | "EventPostponed" | "EventCancelled" | "EventRescheduled" | "EventMovedOnline";
}): Schema {
  const payload: Record<string, any> = {
    "@context": CTX,
    "@type": "Event",
    name: args.name,
    startDate: args.startDate,
    endDate: args.endDate,
    description: args.description,
    url: args.url ? abs(args.url) : undefined,
    image: args.image,
    eventStatus: args.eventStatus ? `https://schema.org/${args.eventStatus}` : undefined,
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: args.locationName
      ? {
          "@type": "Place",
          name: args.locationName,
          address: args.locationAddress,
        }
      : undefined,
    organizer: args.organizerName ? { "@type": "Organization", name: args.organizerName } : undefined,
    performer: args.performerName ? { "@type": "Person", name: args.performerName } : undefined,
  };
  Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);
  return { id: "event", payload };
}

export function softwareApplication(args: {
  name: string;
  description: string;
  url: string;
  applicationCategory?: string;
  operatingSystem?: string;
  offerPrice?: string;
  ratingValue?: number;
  reviewCount?: number;
}): Schema {
  const payload: Record<string, any> = {
    "@context": CTX,
    "@type": "SoftwareApplication",
    name: args.name,
    description: args.description,
    url: abs(args.url),
    applicationCategory: args.applicationCategory || "UtilitiesApplication",
    operatingSystem: args.operatingSystem || "Web",
    offers: { "@type": "Offer", price: args.offerPrice || "0", priceCurrency: "INR" },
    aggregateRating: args.ratingValue && args.reviewCount
      ? { "@type": "AggregateRating", ratingValue: args.ratingValue, reviewCount: args.reviewCount }
      : undefined,
  };
  Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);
  return { id: "software-app", payload };
}

export function service(args: {
  name: string;
  description: string;
  url: string;
  providerName?: string;
  areaServed?: string | string[];
  serviceType?: string;
  offerPrice?: string;
}): Schema {
  const payload: Record<string, any> = {
    "@context": CTX,
    "@type": "Service",
    name: args.name,
    description: args.description,
    url: abs(args.url),
    serviceType: args.serviceType,
    areaServed: args.areaServed,
    provider: args.providerName ? { "@type": "Organization", name: args.providerName } : undefined,
    offers: args.offerPrice
      ? { "@type": "Offer", price: args.offerPrice, priceCurrency: "INR" }
      : undefined,
  };
  Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);
  return { id: "service", payload };
}

export function person(args: {
  name: string;
  jobTitle?: string;
  description?: string;
  image?: string;
  url?: string;
  worksFor?: string;
  knowsLanguage?: string[];
}): Schema {
  const payload: Record<string, any> = {
    "@context": CTX,
    "@type": "Person",
    name: args.name,
    jobTitle: args.jobTitle,
    description: args.description,
    image: args.image,
    url: args.url ? abs(args.url) : undefined,
    knowsLanguage: args.knowsLanguage,
    worksFor: args.worksFor ? { "@type": "Organization", name: args.worksFor } : undefined,
  };
  Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);
  return { id: "person", payload };
}

export function localBusiness(args: {
  name: string;
  description: string;
  url: string;
  city: string;
  region?: string;
  country?: string;
  serviceType?: string;
  areaServed?: string;
}): Schema {
  return {
    id: "local-business",
    payload: {
      "@context": CTX,
      "@type": "LocalBusiness",
      name: args.name,
      description: args.description,
      url: abs(args.url),
      address: {
        "@type": "PostalAddress",
        addressLocality: args.city,
        addressRegion: args.region,
        addressCountry: args.country || "IN",
      },
      areaServed: args.areaServed || args.city,
    },
  };
}
