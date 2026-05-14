import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Loader2, ShieldCheck, AlertCircle } from "lucide-react";
import { ReviewSubmitForm } from "@/components/ReviewSubmitForm";

interface TokenContext {
  ok: boolean;
  orderId?: number;
  customerEmail?: string;
  customerName?: string;
  products?: Array<{ id: number; name: string; image?: string | null }>;
  message?: string;
}

function getTokenFromLocation(): string {
  try {
    const q = new URLSearchParams(window.location.search);
    return q.get("token") || "";
  } catch { return ""; }
}

export default function ReviewsSubmit() {
  const [token] = useState<string>(() => getTokenFromLocation());

  useEffect(() => {
    document.title = "Share your review | Vedic Tatva";
  }, []);

  const { data, isLoading, isError } = useQuery<TokenContext>({
    queryKey: ["/api/reviews/by-token", token],
    queryFn: () => fetch(`/api/reviews/by-token?token=${encodeURIComponent(token)}`).then((r) => r.json()),
    enabled: !!token,
    retry: false,
  });

  const products = useMemo(() => data?.products ?? [], [data]);
  const [activeProduct, setActiveProduct] = useState<number | null>(null);
  useEffect(() => {
    if (!activeProduct && products.length > 0) setActiveProduct(products[0].id);
  }, [products, activeProduct]);

  if (!token) {
    return <Shell><Notice icon={<AlertCircle className="w-5 h-5" />} title="Missing review link">
      The review link is missing its security token. Please use the link from the email we sent after delivery.
    </Notice></Shell>;
  }

  if (isLoading) {
    return <Shell><div className="flex items-center justify-center py-16 text-[#6D2B35]" data-testid="reviews-submit-loading">
      <Loader2 className="w-6 h-6 animate-spin" />
    </div></Shell>;
  }

  if (isError || !data?.ok) {
    return <Shell><Notice icon={<AlertCircle className="w-5 h-5" />} title="This link is no longer valid">
      {data?.message || "Review links expire 60 days after delivery."} If you'd still like to leave a review,
      open the product page and use the form there.
    </Notice></Shell>;
  }

  const active = products.find((p) => p.id === activeProduct) || products[0];

  return (
    <Shell>
      <div className="bg-white border border-[#EAD9B7] rounded-md px-5 py-4 mb-6 flex items-start gap-3" data-testid="reviews-submit-verified">
        <div className="w-9 h-9 rounded-md bg-[#FBF7EE] border border-[#D4AF37]/40 flex items-center justify-center flex-shrink-0">
          <ShieldCheck className="w-4 h-4 text-[#6D2B35]" aria-hidden="true" />
        </div>
        <div>
          <p className="font-serif text-lg text-[#6D2B35]">Verified purchase, order #{data.orderId}</p>
          <p className="text-sm text-[#5a4a3a]">
            Thank you for your order, {data.customerName || "devotee"}. Your review will be marked as a
            verified purchase automatically.
          </p>
        </div>
      </div>

      {products.length > 1 ? (
        <div className="mb-6" role="tablist" aria-label="Choose a product to review">
          <p className="text-xs uppercase tracking-[0.2em] text-[#6D2B35] font-semibold mb-2">Choose a product</p>
          <div className="flex flex-wrap gap-2">
            {products.map((p) => (
              <button
                key={p.id}
                type="button"
                role="tab"
                aria-selected={activeProduct === p.id}
                onClick={() => setActiveProduct(p.id)}
                className={`text-sm px-3 py-2 rounded-md border transition-colors ${
                  activeProduct === p.id
                    ? "bg-[#6D2B35] text-white border-[#6D2B35]"
                    : "bg-white text-[#6D2B35] border-[#EAD9B7] hover-elevate"
                }`}
                data-testid={`tab-review-product-${p.id}`}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {active ? (
        <div data-testid={`review-form-for-${active.id}`}>
          <h2 className="font-serif text-2xl text-[#6D2B35] mb-1">Reviewing: {active.name}</h2>
          <p className="text-sm text-[#5a4a3a] mb-4">
            Your honest experience helps fellow devotees choose with confidence.
          </p>
          <ReviewSubmitForm
            productId={active.id}
            defaultEmail={data.customerEmail}
            defaultName={data.customerName || undefined}
            token={token}
          />
        </div>
      ) : null}

      <p className="mt-8 text-xs text-[#5a4a3a]/70">
        We never publish your email address. Reviews appear after a brief moderation check.
        See our <Link href="/privacy-policy" className="underline underline-offset-2">privacy policy</Link>.
      </p>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#FBF7EE]" data-testid="page-reviews-submit">
      <div className="container mx-auto px-4 py-12 md:py-16 max-w-2xl">
        <header className="mb-8">
          <p className="text-[11px] uppercase tracking-[0.22em] font-semibold text-[#D4AF37] mb-2">Vedic Tatva</p>
          <h1 className="font-serif text-3xl md:text-4xl text-[#6D2B35]" data-testid="heading-reviews-submit">Share your experience</h1>
        </header>
        {children}
      </div>
    </div>
  );
}

function Notice({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-[#EAD9B7] rounded-md p-6" data-testid="reviews-submit-notice">
      <div className="flex items-start gap-3">
        <div className="text-[#6D2B35] mt-0.5">{icon}</div>
        <div>
          <h2 className="font-serif text-xl text-[#6D2B35] mb-1.5">{title}</h2>
          <p className="text-sm text-[#5a4a3a] leading-relaxed">{children}</p>
        </div>
      </div>
    </div>
  );
}
