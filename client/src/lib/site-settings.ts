import { useQuery } from "@tanstack/react-query";
import type { SiteSettings } from "@shared/schema";

// Small shared hook so Navbar, Footer, and other presentational components
// can pull from /api/site-settings without each re-declaring the query key
// or fallback logic. Caches for 5 minutes — changes in the admin require a
// reload to propagate anyway (or the cache invalidation the admin already
// triggers on save).
export function useSiteSettings() {
  const { data } = useQuery<SiteSettings>({
    queryKey: ["/api/site-settings"],
    queryFn: () => fetch("/api/site-settings").then((r) => r.ok ? r.json() : null),
    staleTime: 5 * 60 * 1000,
  });
  return data;
}
