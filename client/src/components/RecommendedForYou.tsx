import { useEffect, useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import { useCurrency } from "@/lib/currency";

interface Product {
  id: number;
  name: string;
  slug: string;
  price: number;
  imageUrl?: string | null;
  category?: string;
}

export function RecommendedForYou({ limit = 8 }: { limit?: number }) {
  const { user } = useAuth();
  const [items, setItems] = useState<Product[] | null>(null);
  const [source, setSource] = useState<"personalized" | "trending" | null>(null);
  const { format } = useCurrency();

  useEffect(() => {
    const url = user
      ? `/api/recommendations/${user.id}?email=${encodeURIComponent(user.email)}&limit=${limit}`
      : `/api/recommendations/trending?limit=${limit}`;
    fetch(url)
      .then((r) => r.ok ? r.json() : { products: [], source: "trending" })
      .then((d) => { setItems(d.products || []); setSource(d.source || "trending"); })
      .catch(() => setItems([]));
  }, [user, limit]);

  if (!items || items.length === 0) return null;

  return (
    <section className="py-12 md:py-16 bg-[#FBF7EE] border-t border-[#D4AF37]/15" data-testid="section-recommended">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-5 w-5 text-[#D4AF37]" />
          <h2 className="font-serif text-2xl font-bold text-[#4a1a22]">
            {source === "personalized" ? "Curated For You" : "Trending Now"}
          </h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((p) => (
            <Link key={p.id} href={`/product/${p.slug}`}>
              <Card className="hover-elevate cursor-pointer h-full" data-testid={`card-recommended-${p.id}`}>
                <CardContent className="p-3">
                  {p.imageUrl && (
                    <div className="aspect-square overflow-hidden rounded-md mb-3 bg-muted">
                      <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" loading="lazy" />
                    </div>
                  )}
                  <div className="text-sm font-medium text-[#4a1a22] line-clamp-2 min-h-[2.5rem]" data-testid={`text-recommended-name-${p.id}`}>{p.name}</div>
                  <div className="text-base font-bold text-[#6D2B35] mt-1" data-testid={`text-recommended-price-${p.id}`}>{format(p.price)}</div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
