const TRACKER_KEY = "vedic_tatva_interactions";

export interface UserInteraction {
  type: "page_visit" | "product_view" | "service_used" | "search_query" | "booking" | "purchase";
  category: string;
  label: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface InteractionSummary {
  totalVisits: number;
  topCategories: { category: string; count: number }[];
  recentSearches: string[];
  servicesUsed: string[];
  productsViewed: { name: string; category: string; count: number }[];
  bookingTypes: string[];
  frequentPages: { page: string; count: number }[];
  activeHours: number[];
  daysSinceFirstVisit: number;
}

function loadInteractions(): UserInteraction[] {
  try {
    const raw = localStorage.getItem(TRACKER_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function saveInteractions(interactions: UserInteraction[]) {
  const trimmed = interactions.slice(-500);
  localStorage.setItem(TRACKER_KEY, JSON.stringify(trimmed));
}

export function trackInteraction(interaction: Omit<UserInteraction, "timestamp">) {
  const interactions = loadInteractions();
  interactions.push({ ...interaction, timestamp: Date.now() });
  saveInteractions(interactions);
}

export function trackPageVisit(page: string, category: string = "general") {
  trackInteraction({ type: "page_visit", category, label: page });
}

export function trackProductView(productName: string, category: string) {
  trackInteraction({ type: "product_view", category, label: productName });
}

export function trackServiceUsed(service: string) {
  trackInteraction({ type: "service_used", category: "service", label: service });
}

export function trackSearchQuery(query: string) {
  trackInteraction({ type: "search_query", category: "search", label: query });
}

export function getRecentSearches(limit = 6): string[] {
  const interactions = loadInteractions();
  const seen = new Set<string>();
  const out: string[] = [];
  for (let i = interactions.length - 1; i >= 0 && out.length < limit; i--) {
    if (interactions[i].type !== "search_query") continue;
    const q = (interactions[i].label || "").trim();
    if (!q || q.length < 2) continue;
    const k = q.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(q);
  }
  return out;
}

export function clearRecentSearches() {
  const interactions = loadInteractions().filter((i) => i.type !== "search_query");
  saveInteractions(interactions);
}

export function getInteractionSummary(): InteractionSummary {
  const interactions = loadInteractions();
  const now = Date.now();

  const categoryMap: Record<string, number> = {};
  const pageMap: Record<string, number> = {};
  const productMap: Record<string, { name: string; category: string; count: number }> = {};
  const searches: string[] = [];
  const services = new Set<string>();
  const bookings = new Set<string>();
  const hours: number[] = [];

  let firstTimestamp = now;

  interactions.forEach(i => {
    if (i.timestamp < firstTimestamp) firstTimestamp = i.timestamp;
    hours.push(new Date(i.timestamp).getHours());

    if (i.category && i.category !== "general") {
      categoryMap[i.category] = (categoryMap[i.category] || 0) + 1;
    }

    switch (i.type) {
      case "page_visit":
        pageMap[i.label] = (pageMap[i.label] || 0) + 1;
        break;
      case "product_view":
        if (!productMap[i.label]) {
          productMap[i.label] = { name: i.label, category: i.category, count: 0 };
        }
        productMap[i.label].count++;
        break;
      case "search_query":
        if (!searches.includes(i.label)) searches.push(i.label);
        break;
      case "service_used":
        services.add(i.label);
        break;
      case "booking":
        bookings.add(i.label);
        break;
    }
  });

  return {
    totalVisits: interactions.filter(i => i.type === "page_visit").length,
    topCategories: Object.entries(categoryMap)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10),
    recentSearches: searches.slice(-10).reverse(),
    servicesUsed: Array.from(services),
    productsViewed: Object.values(productMap).sort((a, b) => b.count - a.count).slice(0, 15),
    bookingTypes: Array.from(bookings),
    frequentPages: Object.entries(pageMap)
      .map(([page, count]) => ({ page, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10),
    activeHours: hours,
    daysSinceFirstVisit: Math.max(1, Math.ceil((now - firstTimestamp) / (1000 * 60 * 60 * 24))),
  };
}

export function getJourneyDataForAI(): any {
  try {
    const raw = localStorage.getItem("vedic_tatva_spiritual_journey");
    if (raw) {
      const data = JSON.parse(raw);
      return {
        profile: data.profile,
        totalLogs: data.logs?.length || 0,
        recentLogs: (data.logs || []).slice(-7),
        achievements: data.achievements || [],
        goals: data.profile?.goals || [],
      };
    }
  } catch {}
  return null;
}
