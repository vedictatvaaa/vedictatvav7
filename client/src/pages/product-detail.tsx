import { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Minus, Plus, ShoppingCart, ChevronRight, Package, AlertTriangle, Star, Check, ThumbsUp, Shield, Truck, RotateCcw, Lock, Share2, MessageCircle, Copy, Heart, RefreshCw, CalendarClock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import type { Product, ProductReview, SocialProofSettings, BoostEvent } from "@shared/schema";
import { useCart } from "@/lib/cart";
import { useWishlist } from "@/lib/wishlist";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { getProductUrl } from "@/lib/utils";
import { getDisplayRating } from "@/lib/displayRating";
import { optImg, optImgSrcSet, SIZES } from "@/lib/optImg";
import { trackViewItem } from "@/lib/analytics";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ProductQAWidget } from "@/components/ProductQAWidget";
import { PersistentProductQA } from "@/components/PersistentProductQA";
import { ReviewSubmitForm } from "@/components/ReviewSubmitForm";
import { Label } from "@/components/ui/label";
import { ProductRelatedServices } from "@/components/RelatedServices";
import RelatedBlogPosts from "@/components/RelatedBlogPosts";
import PincodeChecker from "@/components/PincodeChecker";
import DeliveryEtaInline from "@/components/DeliveryEtaInline";
import { sanitizeHtml } from "@/lib/sanitize-html";
import PageSeo from "@/components/PageSeo";
import { product as productSchemaBuilder, breadcrumbList, faqPage, abs } from "@/lib/seo-schemas";

const TIME_AGO_OPTIONS = ["2 min ago", "5 min ago", "8 min ago", "12 min ago", "18 min ago", "25 min ago", "1 hour ago"];

// Category-specific FAQs — Vedic Tatva spiritual ecommerce
function getCategoryFAQs(product: Product): { q: string; a: string }[] {
  const cat = (product.category || "").toLowerCase();
  const name = product.name;

  const universal = [
    { q: "How long does delivery take?", a: "Metro cities: 2–4 business days. Other Indian cities: 4–7 business days. Free shipping on orders above ₹499. Cash on Delivery available pan-India for orders below ₹5,000. International shipping available — please contact support for a quote." },
    { q: "What is your return & refund policy?", a: "7-day easy returns on unused, unopened items. For energised/consecrated items, returns are accepted only in case of damage, manufacturing defect, or quality issues. Refunds are processed within 5–7 business days to the original payment method." },
    { q: "Can I gift this for a special occasion?", a: "Absolutely. We offer free gift-wrapping with a hand-written Sanskrit blessing card. Choose 'Gift Wrap' at checkout and add a personal message. Perfect for housewarmings, weddings, birthdays, or auspicious days like Diwali, Navratri, and Akshaya Tritiya." },
  ];

  if (cat.includes("rudraksha")) {
    return [
      { q: `Is this ${name} 100% natural and authentic?`, a: "Yes — every Vedic Tatva Rudraksha is hand-picked from authentic sources in Nepal/Indonesia, X-ray verified for natural mukhi (faces), and ships with a Lab Authenticity Certificate from a NABL-accredited gemological lab. We never sell synthetic, glued, or laser-carved beads." },
      { q: "Has the Rudraksha been energised before shipping?", a: "Yes. Each bead undergoes a Prana Pratishtha (energising) ceremony at our Vedic Center in Varanasi — including 108 chants of the prescribed beej-mantra (e.g. 'Om Hreem Namah' for Panchmukhi), Ganga-jal abhishekam, and Rudrabhishek puja before dispatch." },
      { q: "How should I wear and care for my Rudraksha?", a: "Start on a Monday morning after a bath, facing east, while chanting 108 times. Wear it touching the skin (chest or wrist). Avoid contact with chemicals, perfume, and meat/alcohol. Apply mustard or coconut oil monthly to keep beads hydrated. Remove before bathing or sleeping with a partner." },
      { q: "Which mukhi (face) is right for me?", a: "Different mukhis serve different purposes — 1-mukhi for moksha, 5-mukhi for peace and Guru blessings, 7-mukhi for wealth (Lakshmi), 9-mukhi for Durga shakti, etc. Our pandits offer free WhatsApp consultations to recommend the ideal mukhi based on your goals and birth chart." },
      { q: "Can women and children wear Rudraksha?", a: "Yes — Rudraksha can be worn by anyone regardless of gender, age, or religion. There are no restrictions in the Shiva Purana. Women may avoid wearing during menstruation as a personal practice, but this is optional." },
      ...universal,
    ];
  }

  if (cat.includes("gemstone") || cat.includes("ratna") || cat.includes("stone")) {
    return [
      { q: `Is this ${name} a natural, untreated gemstone?`, a: "Yes — every Vedic Tatva gemstone is 100% natural, untreated, and ships with a government-approved lab certificate (GIA/IGI/GTL) confirming origin, weight (in carats and ratti), and clarity grade." },
      { q: "Should the gemstone be energised before wearing?", a: "Yes. We perform the prescribed energisation ritual — including beej-mantra chanting (108 times for the ruling planet), milk and Ganga-jal abhishekam, and dhoop-deep aarti — before shipping. You'll also receive instructions to perform a final pranic-activation at home on your chosen day." },
      { q: "Which finger and metal should I wear it in?", a: "Each gemstone has a prescribed finger and metal — e.g. Ruby (Sun) in ring finger in gold/copper, Pearl (Moon) in little finger in silver, Yellow Sapphire (Jupiter) in index finger in gold. Detailed wearing vidhi is included in your package." },
      { q: "Will this gemstone suit my horoscope?", a: "Gemstones should be selected based on your birth chart — wearing the wrong stone can have adverse effects. Our certified Vedic astrologers offer free WhatsApp consultations to confirm gemstone compatibility before you wear it." },
      { q: "How do I care for my gemstone jewellery?", a: "Clean weekly with raw cow milk or Ganga-jal, then dry with a soft cotton cloth. Re-energise during eclipses, Sankranti, or your gemstone's planetary day. Avoid harsh chemicals, ultrasonic cleaners, and physical impact." },
      ...universal,
    ];
  }

  if (cat.includes("yantra")) {
    return [
      { q: `Is this ${name} energised and ready for installation?`, a: "Yes — every Vedic Tatva Yantra is engraved on shuddha (pure) copper/brass/silver per shastric specifications, then consecrated through Prana Pratishtha at our Varanasi center with the prescribed beej-mantra chants (108 times) and Saptarishi-jal abhishekam." },
      { q: "Where and how should I install the Yantra at home?", a: "Place the Yantra on a clean cloth in your puja room or mandir, facing east or northeast. Ensure it's elevated (not on the floor), and offer fresh flowers, incense, and light a diya every morning. Detailed Sthapana Vidhi (installation ritual) is included in your package." },
      { q: "Which mantra should I chant in front of this Yantra?", a: "Each Yantra has a specific beej-mantra — e.g. Sri Yantra: 'Om Shreem Hreem Shreem Mahalakshmiyei Namah'; Kuber Yantra: 'Om Yakshaya Kuberaya Vaishravanaya Dhanadhanyadhi Pataye…'. The exact mantra and recommended chant count is included in your package." },
      { q: "Can I keep the Yantra in my office or wallet?", a: "Yes — pocket-size Yantras are designed for wallets, lockers, vehicles, and office desks. Larger Yantras are meant for home/office puja sthal. Avoid placing in bathrooms, bedrooms (above the head), or near footwear." },
      { q: "How do I maintain and re-energise the Yantra?", a: "Clean with a dry cotton cloth weekly. For metal yantras, apply lemon-salt paste monthly to remove tarnish, then rinse with Ganga-jal. Re-energise on your Yantra's planetary day, on full-moon nights, or during spiritually significant occasions like Navratri or Diwali." },
      ...universal,
    ];
  }

  if (cat.includes("puja") || cat.includes("samagri") || cat.includes("hawan")) {
    return [
      { q: `Is this ${name} pure and shastra-compliant?`, a: "Yes — all our Puja Samagri is sourced from temple-approved suppliers and tested for purity. Hawan ingredients are 100% natural, chemical-free, and prepared in the precise proportions prescribed in the Puranas. Each pack ships with a Vedic Vidhi card." },
      { q: "Is this kit suitable for which pujas / hawans?", a: "This samagri set is suitable for daily puja, Satyanarayan katha, Navratri puja, Diwali Lakshmi puja, Griha Pravesh, and most major hawans/yajnas. A full puja-procedure guide (in Hindi & English) is included in the package." },
      { q: "What items are included in this kit?", a: "The complete contents are listed in the product description above. Typical kits include kumkum, haldi, akshat, agarbatti, dhoop, ghee, samidha (havan wood), navagraha samidha, ghee, kapur, til, jau, panchmeva, and a detailed Puja Vidhi pamphlet." },
      { q: "How long does the puja samagri stay fresh?", a: "Most items have a shelf life of 12–18 months when stored in a cool, dry place. Ghee, dhoop, and oils should be used within 6 months of opening. Hawan samidha and dry herbs can be stored for up to 2 years." },
      { q: "Do you provide a pandit for the puja?", a: "Yes — Vedic Tatva offers Book-a-Pandit service in 50+ Indian cities. Verified, qualified pandits perform pujas at your home as per regional traditions (North Indian, South Indian, Bengali, Maharashtrian). Visit our 'Book Pandit' section to schedule." },
      ...universal,
    ];
  }

  if (cat.includes("mala") || cat.includes("bead")) {
    return [
      { q: `Is this ${name} hand-strung and energised?`, a: "Yes — every mala is hand-strung in our workshop with 108 + 1 (sumeru) beads as prescribed in the scriptures, energised through 108 mantra chants, and blessed at our Varanasi center before dispatch." },
      { q: "How do I use this mala for jaap (mantra meditation)?", a: "Hold the mala in your right hand, draped over the middle finger, and rotate beads using your thumb (never the index finger). Start at the bead next to the sumeru and chant your mantra once per bead. When you reach the sumeru, do not cross it — reverse direction for the next round." },
      { q: "Which mantra should I chant on this mala?", a: "Universal mantras include 'Om Namah Shivaya', 'Om Mani Padme Hum', or 'Hare Krishna Mahamantra'. For specific malas (Tulsi → Vishnu mantras; Rudraksha → Shiva mantras; Sphatik → Lakshmi mantras), prescribed chants are included in your package." },
      { q: "Can I wear this mala instead of using it for chanting?", a: "Yes — most malas can be worn around the neck or wrist as a sacred ornament. However, Tulsi malas are traditionally only worn (not used for chanting), while Rudraksha malas can be both worn and used for jaap." },
      { q: "How do I care for my mala?", a: "Avoid water, perfume, and chemicals. Wipe with a dry cotton cloth weekly. Store in a clean cloth pouch or wooden box when not in use. Re-energise monthly by chanting your mantra 108 times while holding the mala." },
      ...universal,
    ];
  }

  return [
    { q: `Is this ${name} authentic?`, a: `Yes — every Vedic Tatva ${product.category.toLowerCase()} item is sourced and verified by our in-house priests. Each piece is lab-tested where applicable, ethically sourced, and ships with a Certificate of Authenticity from a NABL-accredited facility.` },
    { q: "Is this product energised before shipping?", a: "Yes. Our pandits perform the prescribed beej-mantra chanting (108 times) and Ganga-jal abhishekam at our Vedic Center in Varanasi before dispatching every order. You'll also receive a Vedic Vidhi card to perform a final pranic activation at home." },
    { q: "How should I use this product?", a: "Detailed usage instructions are included in the Vedic Vidhi card inside your package — including the auspicious day to start, ideal mantra, and direction to face. Most spiritual items are best activated on Monday mornings, after a bath, while facing east." },
    { q: "Which mantra is recommended with this product?", a: "Universal mantras like 'Om Namah Shivaya' (for peace) and 'Om Gam Ganapataye Namah' (for new beginnings) work well with most spiritual items. Specific mantras for this product are printed on the Vedic Vidhi card included in your package." },
    { q: "Can I get personal guidance before purchasing?", a: "Yes — our certified pandits and Vedic astrologers offer free WhatsApp consultations to help you choose the right product based on your birth chart, intentions, and spiritual goals." },
    ...universal,
  ];
}

function useViewerCount(settings: SocialProofSettings | undefined) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!settings) return;
    const { viewMin, viewMax } = settings;
    // Pick a stable starting value seeded from the current hour so it doesn't
    // jump erratically on every render or page refresh.
    const hourSeed = new Date().getHours();
    const range = Math.max(1, viewMax - viewMin);
    const stable = viewMin + (hourSeed % range);
    setCount(stable);

    // Drift by at most ±1 every 90 seconds, and only when the tab is visible.
    const interval = setInterval(() => {
      if (document.hidden) return;
      setCount(prev => {
        const delta = Math.random() < 0.5 ? 1 : -1;
        return Math.max(viewMin, Math.min(viewMax, prev + delta));
      });
    }, 90_000);

    return () => clearInterval(interval);
  }, [settings]);

  return count;
}

function useUrgencyTimer() {
  const [remaining, setRemaining] = useState("");

  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      const twoHours = 2 * 60 * 60 * 1000;
      const left = twoHours - (now % twoHours);
      const h = Math.floor(left / 3600000);
      const m = Math.floor((left % 3600000) / 60000);
      const s = Math.floor((left % 60000) / 1000);
      setRemaining(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return remaining;
}

function StarRating({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          className={i <= rating ? "text-amber-400 fill-amber-400" : "text-gray-300"}
          style={{ width: size, height: size }}
        />
      ))}
    </div>
  );
}

// Slim hairline divider
function Hairline() {
  return <div className="h-px bg-[#D4AF37]/25" aria-hidden="true" />;
}

export default function ProductDetail() {
  const params = useParams<{ id: string }>();
  const id = params.id?.match(/-(\d+)$/)?.[1] || params.id;
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { toast } = useToast();
  const { requireAuth, user } = useAuth();
  const [quantity, setQuantity] = useState(1);
  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [selectedVariationIndex, setSelectedVariationIndex] = useState(0);
  const [reviewFilterPhotos, setReviewFilterPhotos] = useState(false);
  const [reviewFilterVerified, setReviewFilterVerified] = useState(false);
  const [reviewSort, setReviewSort] = useState<"helpful" | "newest" | "highest" | "lowest">("helpful");
  const [reviewLightbox, setReviewLightbox] = useState<{ images: string[]; index: number } | null>(null);

  const shopBackPath = (() => {
    try {
      const stored = sessionStorage.getItem("lastShopPage");
      if (stored === "/spiritual-essentials" || stored === "/shop") return stored;
    } catch {}
    return "/shop";
  })();
  const shopBackLabel = shopBackPath === "/spiritual-essentials" ? "Puja Essentials" : "Shop";

  const { data: product, isLoading } = useQuery<Product>({
    queryKey: ["/api/products", id],
    queryFn: () => {
      const url = /^\d+$/.test(String(id))
        ? `/api/products/${id}`
        : `/api/products/slug/${id}`;
      return fetch(url).then(r => r.json());
    },
    enabled: !!id,
  });

  // Fire a GA4 view_item event once the product is loaded.
  useEffect(() => {
    if (product && product.id) trackViewItem(product);
  }, [product?.id]);

  // Inject high-priority preload for the product gallery LCP image.
  useEffect(() => {
    if (typeof document === "undefined" || !product?.image) return;
    const widths = [320, 480, 768, 1080, 1440];
    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "image";
    link.href = `/api/img?src=${encodeURIComponent(product.image)}&w=768&fmt=webp&q=75`;
    link.setAttribute(
      "imagesrcset",
      widths.map(w => `/api/img?src=${encodeURIComponent(product.image)}&w=${w}&fmt=webp&q=75 ${w}w`).join(", ")
    );
    link.setAttribute("imagesizes", "(min-width: 1024px) 50vw, 100vw");
    link.setAttribute("fetchpriority", "high");
    link.setAttribute("data-route-preload", "1");
    document.head.appendChild(link);
    return () => { if (link.parentNode) link.parentNode.removeChild(link); };
  }, [product?.image]);

  const { data: allProducts } = useQuery<Product[]>({
    queryKey: ["/api/products"],
    queryFn: () => fetch("/api/products").then(r => r.json()),
  });

  const { data: socialSettings } = useQuery<SocialProofSettings>({
    queryKey: ["/api/social-proof/settings"],
    queryFn: () => fetch("/api/social-proof/settings").then(r => r.json()),
  });

  const { data: boostEvents } = useQuery<BoostEvent[]>({
    queryKey: ["/api/social-proof/events"],
    queryFn: () => fetch("/api/social-proof/events").then(r => r.json()),
  });

  const { data: reviews } = useQuery<ProductReview[]>({
    queryKey: ["/api/reviews", product?.id],
    queryFn: () => fetch(`/api/reviews/${product!.id}`).then(r => r.json()),
    enabled: !!product?.id,
  });

  const voterKey = useMemo(() => {
    const userKey = user?.id ? `u-${user.id}` : "";
    if (userKey) return userKey;
    try {
      const stored = localStorage.getItem("vt-review-voter-key");
      if (stored && stored.length >= 6) return stored;
      const fresh = `a-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
      localStorage.setItem("vt-review-voter-key", fresh);
      return fresh;
    } catch {
      return `a-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
    }
  }, [user?.id]);

  const votedStorageKey = `vt-helpful-voted:${voterKey}`;
  const [votedReviewIds, setVotedReviewIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    try {
      const raw = localStorage.getItem(votedStorageKey);
      if (!raw) { setVotedReviewIds(new Set()); return; }
      const arr = JSON.parse(raw);
      setVotedReviewIds(new Set(Array.isArray(arr) ? arr.filter((n) => typeof n === "number") : []));
    } catch {
      setVotedReviewIds(new Set());
    }
  }, [votedStorageKey]);

  const persistVoted = (next: Set<number>) => {
    try { localStorage.setItem(votedStorageKey, JSON.stringify(Array.from(next))); } catch {}
  };

  const helpfulMutation = useMutation({
    mutationFn: async (reviewId: number) => {
      const res = await apiRequest("POST", `/api/reviews/${reviewId}/helpful`, { voterKey });
      return (await res.json()) as { helpful: number; alreadyVoted: boolean };
    },
    onMutate: async (reviewId: number) => {
      const queryKey = ["/api/reviews", product?.id];
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<ProductReview[]>(queryKey);
      queryClient.setQueryData<ProductReview[]>(queryKey, (old) =>
        Array.isArray(old)
          ? old.map((r) => (r.id === reviewId ? { ...r, helpful: (r.helpful ?? 0) + 1 } : r))
          : old,
      );
      const next = new Set(votedReviewIds);
      next.add(reviewId);
      setVotedReviewIds(next);
      persistVoted(next);
      return { previous };
    },
    onError: (_err, reviewId, ctx) => {
      const queryKey = ["/api/reviews", product?.id];
      if (ctx?.previous) queryClient.setQueryData(queryKey, ctx.previous);
      const next = new Set(votedReviewIds);
      next.delete(reviewId);
      setVotedReviewIds(next);
      persistVoted(next);
      toast({ title: "Could not record your vote", description: "Please try again in a moment.", variant: "destructive" });
    },
    onSuccess: (data, reviewId) => {
      const queryKey = ["/api/reviews", product?.id];
      queryClient.setQueryData<ProductReview[]>(queryKey, (old) =>
        Array.isArray(old)
          ? old.map((r) => (r.id === reviewId ? { ...r, helpful: data.helpful } : r))
          : old,
      );
    },
  });

  useEffect(() => {
    if (product) {
      import("@/lib/spiritual-tracker").then(({ trackProductView }) => {
        trackProductView(product.name, product.category);
      });
    }
  }, [product?.id]);

  // SEO — centralized via PageSeo
  const seoData = useMemo(() => {
    if (!product) return null;
    const cleanDesc = (product.description || "")
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 160);
    const title = `${product.name} — Buy Online at ₹${product.price.toLocaleString()} | Vedic Tatva`;
    const description = cleanDesc || `Buy ${product.name} online at Vedic Tatva. Authentic, lab-certified, energised. Free shipping above ₹999. Cash on Delivery available.`;
    const path = `/product/${product.id}`;
    const imgUrl = product.image?.startsWith("http") ? product.image : abs(product.image || "");
    const avg = reviews && reviews.length > 0
      ? reviews.reduce((s, r: any) => s + (r.rating || 0), 0) / reviews.length
      : undefined;
    return {
      title,
      description,
      cleanDesc,
      path,
      imgUrl,
      avg,
    };
  }, [product?.id, product?.name, product?.price, product?.stock, product?.image, product?.description, product?.category, reviews?.length]);

  const seoSchemas = useMemo(() => {
    if (!product || !seoData) return [];
    return [
      productSchemaBuilder({
        name: product.name,
        description: seoData.cleanDesc,
        image: [seoData.imgUrl],
        sku: product.id,
        brand: product.brand || "Vedic Tatva",
        category: product.category,
        price: product.price,
        availability: product.stock > 0 ? "InStock" : "OutOfStock",
        url: seoData.path,
        // Only expose AggregateRating + Review items to search engines once
        // we have a credible base of approved verified-purchase reviews.
        // Google's Review Snippet policy requires authentic, first-party
        // ratings; we use ≥3 verified+approved reviews as the threshold and
        // derive ratingValue, reviewCount and Review[] from the same subset
        // for internal consistency.
        ...(() => {
          const eligible = (reviews || []).filter(
            (r: any) => r?.verified && r?.status === "approved"
          );
          if (eligible.length < 3) return {};
          const avg =
            eligible.reduce((s: number, r: any) => s + (r.rating || 0), 0) /
            eligible.length;
          return {
            ratingValue: Number(avg.toFixed(1)),
            reviewCount: eligible.length,
            reviews: eligible.slice(0, 5).map((r: any) => ({
              author: r.reviewerName || r.customerName || "Verified Buyer",
              rating: Number(r.rating) || 5,
              body: (r.body || r.review || r.comment || r.title || "")
                .toString()
                .slice(0, 500),
              datePublished: r.createdAt
                ? new Date(r.createdAt).toISOString().slice(0, 10)
                : undefined,
            })),
          };
        })(),
      }),
      breadcrumbList([
        { name: "Home", url: "/" },
        { name: "Shop", url: "/shop" },
        { name: product.category, url: `/shop?category=${encodeURIComponent(product.category)}` },
        { name: product.name, url: seoData.path },
      ]),
      faqPage(getCategoryFAQs(product).map(f => ({ question: f.q, answer: f.a }))),
    ];
  }, [product?.id, product?.name, product?.price, product?.stock, product?.image, product?.description, product?.category, product?.brand, reviews?.length, seoData]);

  const seoExtraMeta = useMemo(() => {
    if (!product) return [];
    return [
      { name: "product:price:amount", content: String(product.price), property: true },
      { name: "product:price:currency", content: "INR", property: true },
      { name: "product:availability", content: product.stock > 0 ? "in stock" : "out of stock", property: true },
    ];
  }, [product?.price, product?.stock]);

  const viewerCount = useViewerCount(socialSettings);
  const urgencyTimer = useUrgencyTimer();

  const relevantEvents = useMemo(() => {
    if (!boostEvents || !product) return [];
    return boostEvents.filter(e => e.productId === product.id || e.type === product.category);
  }, [boostEvents, product]);

  useEffect(() => {
    if (relevantEvents.length <= 1) return;
    const id = setInterval(() => {
      setCurrentEventIndex(prev => (prev + 1) % relevantEvents.length);
    }, 5000);
    return () => clearInterval(id);
  }, [relevantEvents.length]);

  const relatedProducts = allProducts
    ?.filter(p => p.category === product?.category && p.id !== product?.id)
    .slice(0, 8) || [];

  // Frequently Bought Together — mined from real order history with category fallback
  const { data: fbtData } = useQuery<{ products: Product[]; source: string; supportingOrders?: number }>({
    queryKey: ["/api/products", product?.id, "frequently-bought-together"],
    enabled: !!product?.id,
  });

  const fbtFallback = useMemo(() => {
    if (!allProducts || !product) return [];
    const sameCategory = allProducts.filter(p => p.category === product.category && p.id !== product.id && p.stock > 0);
    const crossCategory = allProducts.filter(p => p.category !== product.category && p.id !== product.id && p.stock > 0);
    const picks: Product[] = [];
    if (sameCategory.length) picks.push(sameCategory.sort((a, b) => Math.abs(a.price - product.price) - Math.abs(b.price - product.price))[0]);
    if (crossCategory.length) {
      const ranked = [...crossCategory].sort((a, b) => {
        const score = (p: Product) => (["Puja Samagri", "Havan Samagri", "Wearables"].includes(p.category) ? 0 : 1);
        return score(a) - score(b);
      });
      picks.push(ranked[0]);
    }
    return picks;
  }, [allProducts, product]);

  const fbtProducts: Product[] = (fbtData?.products && fbtData.products.length > 0) ? fbtData.products : fbtFallback;
  const fbtFromHistory = fbtData?.source === "history" || fbtData?.source === "mixed";

  const fbtBundleTotal = product ? product.price + fbtProducts.reduce((s, p) => s + p.price, 0) : 0;
  const fbtBundleDiscounted = Math.round(fbtBundleTotal * 0.92);
  const fbtSavings = fbtBundleTotal - fbtBundleDiscounted;

  const isOutOfStock = product?.stock === 0;
  const isLowStock = product ? product.stock > 0 && product.stock < 10 : false;

  const sortedReviews = useMemo(() => {
    if (!reviews) return [];
    let list = [...reviews];
    if (reviewFilterVerified) list = list.filter(r => r.verified);
    if (reviewFilterPhotos) list = list.filter(r => Array.isArray(r.images) && r.images.length > 0);
    list.sort((a, b) => {
      if (reviewSort === "newest") {
        const ad = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bd = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bd - ad;
      }
      if (reviewSort === "highest") return (b.rating ?? 0) - (a.rating ?? 0);
      if (reviewSort === "lowest") return (a.rating ?? 0) - (b.rating ?? 0);
      if (a.verified !== b.verified) return a.verified ? -1 : 1;
      return (b.helpful ?? 0) - (a.helpful ?? 0);
    });
    return list;
  }, [reviews, reviewFilterPhotos, reviewFilterVerified, reviewSort]);

  const reviewPhotoCount = useMemo(
    () => (reviews || []).filter(r => Array.isArray(r.images) && r.images.length > 0).length,
    [reviews]
  );
  const reviewPhotoStrip = useMemo(() => {
    const items: { src: string; images: string[]; index: number; reviewId: number }[] = [];
    for (const r of reviews || []) {
      if (!Array.isArray(r.images)) continue;
      r.images.forEach((src, idx) => {
        items.push({ src, images: r.images as string[], index: idx, reviewId: r.id });
      });
    }
    return items;
  }, [reviews]);
  const reviewVerifiedCount = useMemo(
    () => (reviews || []).filter(r => r.verified).length,
    [reviews]
  );

  const reviewStats = useMemo(() => {
    if (!reviews || reviews.length === 0) return null;
    const total = reviews.length;
    const sum = reviews.reduce((s, r) => s + r.rating, 0);
    const avg = sum / total;
    const dist = [5, 4, 3, 2, 1].map(star => ({
      star,
      count: reviews.filter(r => r.rating === star).length,
      pct: Math.round((reviews.filter(r => r.rating === star).length / total) * 100),
    }));
    const recommend = Math.round((reviews.filter(r => r.rating >= 4).length / total) * 100);
    return { total, avg, dist, recommend };
  }, [reviews]);

  const displayStats = useMemo(() => {
    if (!product) return null;
    const real = reviewStats ? { avg: reviewStats.avg, count: reviewStats.total } : null;
    const dr = getDisplayRating(product.id, real);
    const dist = reviewStats?.dist ?? [
      { star: 5, count: 0, pct: 72 },
      { star: 4, count: 0, pct: 21 },
      { star: 3, count: 0, pct: 5 },
      { star: 2, count: 0, pct: 1 },
      { star: 1, count: 0, pct: 1 },
    ];
    const recommend = reviewStats?.recommend ?? 96;
    return { total: dr.count, avg: dr.avg, dist, recommend };
  }, [product, reviewStats]);

  function handleAddToCart() {
    if (!product || isOutOfStock) return;
    const parsedVars: { label: string; price: number }[] = product.variations ? JSON.parse(product.variations) : [];
    const hasVars = parsedVars.length > 1;
    const selectedVar = hasVars ? parsedVars[selectedVariationIndex] : null;
    const cartProduct = selectedVar ? { ...product, price: selectedVar.price } : product;
    const varLabel = selectedVar ? selectedVar.label : undefined;
    addToCart(cartProduct, quantity, varLabel);
    toast({
      title: "Added to cart",
      description: `${quantity}x ${product.name}${varLabel ? ` (${varLabel})` : ''} has been added to your cart.`,
    });
  }

  if (isLoading) {
    return (
      <div className="w-full pb-20">
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-6 w-64 mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <Skeleton className="aspect-square rounded-md" />
            <div className="space-y-4">
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-12 w-48" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-3xl font-serif text-[#6D2B35] mb-4" data-testid="text-product-not-found">Product Not Found</h1>
          <Link href={shopBackPath}>
            <Button variant="outline" className="rounded-md" data-testid="link-back-to-shop">Back to {shopBackLabel}</Button>
          </Link>
        </div>
      </div>
    );
  }

  const currentEvent = relevantEvents[currentEventIndex];
  const randomTimeAgo = TIME_AGO_OPTIONS[currentEventIndex % TIME_AGO_OPTIONS.length];

  return (
    <div className="w-full pb-36 lg:pb-20 bg-white">
      {seoData && (
        <PageSeo
          title={seoData.title}
          description={seoData.description}
          keywords={`${product.name}, ${product.category}, buy online, vedic, spiritual, puja, india`}
          ogType="product"
          ogImage={seoData.imgUrl}
          twitterCard="summary_large_image"
          canonical={seoData.path}
          schemas={seoSchemas}
          extraMeta={seoExtraMeta}
        />
      )}
      <div className="container mx-auto px-4 py-6 lg:py-10">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs lg:text-sm mb-6 flex-wrap" data-testid="breadcrumb-nav">
          <Link href="/" className="text-[#5a4a3a]/70 hover:text-[#6D2B35] transition-colors font-medium" data-testid="breadcrumb-home">Home</Link>
          <ChevronRight className="h-3 w-3 text-[#D4AF37]" />
          <Link href={shopBackPath} className="text-[#5a4a3a]/70 hover:text-[#6D2B35] transition-colors font-medium" data-testid="breadcrumb-essentials">{shopBackLabel}</Link>
          <ChevronRight className="h-3 w-3 text-[#D4AF37]" />
          <Link href={shopBackPath} className="text-[#5a4a3a]/70 hover:text-[#6D2B35] transition-colors font-medium" data-testid="breadcrumb-category">{product.category}</Link>
          <ChevronRight className="h-3 w-3 text-[#D4AF37]" />
          <span className="text-[#6D2B35] font-semibold truncate max-w-[60%] lg:max-w-md" data-testid="breadcrumb-product">{product.name}</span>
        </nav>

        {/* Product Info Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12">
          {/* Image Gallery */}
          {(() => {
            const allImages = [product.image, ...(product.images || [])].filter(Boolean);
            return (
              <div className="flex flex-col gap-3" data-testid="product-gallery">
                <div
                  className="aspect-square bg-[#FBF7EE] rounded-lg overflow-hidden relative cursor-zoom-in border border-[#D4AF37]/25"
                  onClick={() => setIsLightboxOpen(true)}
                  data-testid="img-product-main"
                >
                  <img
                    src={optImg(allImages[selectedImageIndex] || product.image, 1080)}
                    srcSet={optImgSrcSet(allImages[selectedImageIndex] || product.image, [320, 480, 768, 1080, 1440])}
                    sizes={SIZES.productHero}
                    alt={product.imageAlts?.[selectedImageIndex] || `${product.name} – ${product.category}`}
                    width={800}
                    height={800}
                    // The product hero is the LCP element on /product/:id —
                    // hint the browser to fetch it ahead of below-the-fold work.
                    fetchPriority={selectedImageIndex === 0 ? "high" : undefined}
                    loading={selectedImageIndex === 0 ? "eager" : "lazy"}
                    decoding="async"
                    className="relative w-full h-full object-contain mix-blend-multiply p-4 lg:p-8"
                  />
                  {product.badge && (
                    <div
                      className="absolute top-3 left-3 z-10 inline-flex items-center gap-1.5 bg-[#6D2B35] text-[#D4AF37] text-[10px] lg:text-xs font-bold px-3 py-1 uppercase tracking-widest rounded-md"
                      data-testid="badge-product"
                    >
                      <Sparkles className="h-3 w-3" />
                      {product.badge}
                    </div>
                  )}
                  <div className="absolute bottom-3 left-3 z-10 hidden sm:inline-flex items-center gap-1.5 bg-white border border-[#D4AF37]/40 px-2.5 py-1 rounded-md">
                    <Shield className="h-3 w-3 text-[#6D2B35]" />
                    <span className="text-[10px] font-semibold text-[#6D2B35] tracking-wider">VEDIC CERTIFIED</span>
                  </div>
                  {isOutOfStock && (
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                      <span className="bg-[#6D2B35] text-white text-base font-bold px-5 py-2.5 rounded-md uppercase tracking-wider">
                        Out of Stock
                      </span>
                    </div>
                  )}
                  {allImages.length > 1 && (
                    <div className="absolute bottom-3 right-3 bg-[#6D2B35] text-[#FDF8F0] text-[10px] font-medium px-2 py-0.5 rounded-md">
                      {selectedImageIndex + 1} / {allImages.length}
                    </div>
                  )}
                </div>

                {allImages.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto py-1 scrollbar-hide" data-testid="thumb-scroll">
                    {allImages.map((img, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedImageIndex(i)}
                        className={`flex-shrink-0 w-16 h-16 lg:w-20 lg:h-20 rounded-md overflow-hidden border transition-all bg-[#FBF7EE] ${
                          selectedImageIndex === i ? "border-[#6D2B35]" : "border-[#D4AF37]/25 hover:border-[#D4AF37]/60"
                        }`}
                        data-testid={`thumb-image-${i}`}
                      >
                        <img src={optImg(img, 160)} srcSet={optImgSrcSet(img, [80, 120, 160, 240])} sizes={SIZES.thumbnail} alt={product.imageAlts?.[i] || `${product.name} - view ${i + 1}`} loading="lazy" decoding="async" width={80} height={80} className="w-full h-full object-contain p-1 mix-blend-multiply" />
                      </button>
                    ))}
                  </div>
                )}

                {isLightboxOpen && (
                  <div
                    className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
                    onClick={() => setIsLightboxOpen(false)}
                    data-testid="image-lightbox"
                  >
                    <div className="relative max-w-4xl max-h-[90vh] w-full" onClick={(e) => e.stopPropagation()}>
                      <img
                        src={optImg(allImages[selectedImageIndex] || product.image, 1600)}
                        srcSet={optImgSrcSet(allImages[selectedImageIndex] || product.image, [768, 1080, 1440, 1920])}
                        sizes="100vw"
                        alt={product.name}
                        decoding="async"
                        className="w-full h-full object-contain rounded-md"
                      />
                      <button
                        onClick={() => setIsLightboxOpen(false)}
                        className="absolute top-2 right-2 bg-white/20 hover:bg-white/40 text-white w-10 h-10 rounded-md flex items-center justify-center text-xl"
                        data-testid="btn-close-lightbox"
                      >
                        ✕
                      </button>
                      {allImages.length > 1 && (
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                          {allImages.map((_, i) => (
                            <button
                              key={i}
                              onClick={() => setSelectedImageIndex(i)}
                              className={`w-2.5 h-2.5 rounded-full transition-all ${
                                selectedImageIndex === i ? "bg-[#D4AF37]" : "bg-white/50 hover:bg-white/80"
                              }`}
                              data-testid={`lightbox-dot-${i}`}
                            />
                          ))}
                        </div>
                      )}
                      {allImages.length > 1 && selectedImageIndex > 0 && (
                        <button
                          onClick={() => setSelectedImageIndex(i => i - 1)}
                          className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white w-10 h-10 rounded-md flex items-center justify-center text-xl"
                          data-testid="btn-lightbox-prev"
                        >
                          ‹
                        </button>
                      )}
                      {allImages.length > 1 && selectedImageIndex < allImages.length - 1 && (
                        <button
                          onClick={() => setSelectedImageIndex(i => i + 1)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white w-10 h-10 rounded-md flex items-center justify-center text-xl"
                          data-testid="btn-lightbox-next"
                        >
                          ›
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Right Column */}
          {(() => {
            const parsedVariations: { label: string; price: number }[] = product.variations ? JSON.parse(product.variations) : [];
            const hasVariations = parsedVariations.length > 1;
            const activePrice = hasVariations ? parsedVariations[selectedVariationIndex]?.price || product.price : product.price;
            const mrp = Math.round(activePrice * 1.22 / 10) * 10;
            const discountPct = Math.round(((mrp - activePrice) / mrp) * 100);
            const rating = displayStats?.avg ?? 4.6;
            const reviewCount = displayStats?.total ?? 338;
            return (
              <div className="flex flex-col gap-5">
                {/* Title block */}
                <div>
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <Link
                      href={shopBackPath}
                      className="inline-flex items-center gap-1.5 bg-[#6D2B35] text-[#D4AF37] text-[11px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider hover-elevate"
                      data-testid="badge-category"
                    >
                      <span className="w-1 h-1 rounded-full bg-[#D4AF37]" />
                      {product.category}
                    </Link>
                    <span className="inline-flex items-center gap-1 bg-[#FBF7EE] border border-[#D4AF37]/40 text-[#6D2B35] text-[10px] font-semibold px-2 py-1 rounded-md uppercase tracking-wider" data-testid="badge-energised">
                      <Sparkles className="h-3 w-3" /> Energised by Pandits
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <h1 className="text-2xl md:text-3xl lg:text-[2rem] font-serif text-[#6D2B35] leading-tight tracking-tight flex-1" data-testid="text-product-name">
                      {product.name}
                    </h1>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`flex-shrink-0 ${isInWishlist(product.id) ? 'text-rose-500' : 'text-[#5a4a3a]/60'} hover:text-rose-500`}
                      onClick={() => {
                        if (isInWishlist(product.id)) {
                          removeFromWishlist(product.id);
                          toast({ title: "Removed from wishlist" });
                        } else {
                          addToWishlist(product);
                          toast({ title: "Added to wishlist", description: `${product.name} has been added to your wishlist.` });
                        }
                      }}
                      data-testid="btn-wishlist-toggle"
                    >
                      <Heart className={`h-5 w-5 ${isInWishlist(product.id) ? 'fill-current' : ''}`} />
                    </Button>
                  </div>

                  {/* Rating + sold row */}
                  <div className="flex items-center gap-3 mt-3 flex-wrap" data-testid="rating-sold-row">
                    <div className="flex items-center gap-1 bg-emerald-600 text-white px-2 py-0.5 rounded-md text-xs font-bold">
                      <span>{rating.toFixed(1)}</span>
                      <Star className="h-3 w-3 fill-white" />
                    </div>
                    <span className="text-xs text-[#5a4a3a]/70 font-medium">
                      <span className="text-[#6D2B35] font-semibold">{reviewCount.toLocaleString()}</span> Ratings & Reviews
                    </span>
                    {product.salesCount > 50 && (
                      <>
                        <span className="text-[#D4AF37]">·</span>
                        <span className="text-xs text-emerald-700 font-semibold" data-testid="text-sales-count">
                          {product.salesCount.toLocaleString()}+ devotees blessed
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <Hairline />

                {/* Price block */}
                <div className="rounded-md border border-[#D4AF37]/30 bg-[#FBF7EE] px-4 py-4" data-testid="price-block">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-[#5a4a3a]/60 font-semibold mb-1.5">Sacred Offering Price</p>
                  <div className="flex items-end gap-3 flex-wrap" data-testid="text-product-price">
                    <span className="text-3xl md:text-[2rem] font-bold text-[#6D2B35] leading-none">
                      ₹{activePrice.toLocaleString()}
                    </span>
                    {discountPct > 0 && mrp > activePrice && (
                      <>
                        <span className="text-base text-[#5a4a3a]/50 line-through font-medium" data-testid="text-mrp">
                          ₹{mrp.toLocaleString()}
                        </span>
                        <span className="bg-[#D4AF37] text-[#6D2B35] text-xs font-bold px-2 py-0.5 rounded-md" data-testid="text-discount">
                          {discountPct}% OFF
                        </span>
                      </>
                    )}
                  </div>
                  {hasVariations && parsedVariations[0].price !== parsedVariations[parsedVariations.length - 1].price && (
                    <p className="text-xs text-[#5a4a3a]/70 mt-1">
                      Range: ₹{Math.min(...parsedVariations.map(v => v.price)).toLocaleString()} – ₹{Math.max(...parsedVariations.map(v => v.price)).toLocaleString()}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-2.5 text-[11px] text-[#5a4a3a]/70 flex-wrap">
                    <span className="inline-flex items-center gap-1"><Truck className="h-3.5 w-3.5 text-emerald-600" /> Free delivery on ₹499+</span>
                    <span className="text-[#D4AF37]">·</span>
                    <span>Inclusive of all taxes</span>
                  </div>
                </div>

                {/* Variations */}
                {hasVariations && (
                  <div className="space-y-2" data-testid="product-variations">
                    <p className="text-xs font-bold text-[#6D2B35] uppercase tracking-wider">Choose Variant</p>
                    <div className="flex flex-wrap gap-2">
                      {parsedVariations.map((v, idx) => (
                        <button
                          key={idx}
                          onClick={() => setSelectedVariationIndex(idx)}
                          className={`px-4 h-10 rounded-md border text-sm font-medium transition-all hover-elevate ${
                            idx === selectedVariationIndex
                              ? "border-[#6D2B35] bg-[#6D2B35] text-[#D4AF37]"
                              : "border-[#D4AF37]/40 bg-white text-[#6D2B35]"
                          }`}
                          data-testid={`btn-variation-${idx}`}
                        >
                          {v.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Stock + Viewers */}
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2" data-testid="text-stock-status">
                    {isOutOfStock ? (
                      <>
                        <AlertTriangle className="h-4 w-4 text-rose-600" />
                        <span className="text-rose-600 text-sm font-semibold">Out of Stock</span>
                      </>
                    ) : isLowStock ? (
                      <>
                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                        <span className="text-amber-700 text-sm font-semibold">Only {product.stock} left — hurry</span>
                      </>
                    ) : (
                      <>
                        <span className="relative flex h-2 w-2">
                          <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
                        </span>
                        <span className="text-emerald-700 text-sm font-semibold">In Stock · Ships in 24h</span>
                      </>
                    )}
                  </div>
                  {socialSettings && viewerCount > 0 && (
                    <div className="inline-flex items-center gap-1.5 text-xs text-[#5a4a3a]/80" data-testid="fomo-viewers">
                      <span className="text-amber-600">👁</span>
                      <span><span className="font-bold text-[#6D2B35]" data-testid="text-viewer-count">{viewerCount}</span> devotees viewing</span>
                    </div>
                  )}
                </div>

                {/* Trust grid — hairline gap-px pattern */}
                <div
                  className="grid grid-cols-2 gap-px rounded-md overflow-hidden border border-[#D4AF37]/25 bg-[#D4AF37]/20"
                  data-testid="trust-badges-main"
                >
                  {[
                    { icon: Shield, label: "Lab Certified", sub: "100% Authentic" },
                    { icon: Truck, label: "Free Shipping", sub: "Orders ₹499+" },
                    { icon: RotateCcw, label: "7-Day Returns", sub: "Easy & free" },
                    { icon: Lock, label: "Secure Checkout", sub: "256-bit SSL" },
                  ].map((t, i) => (
                    <div key={i} className="flex items-center gap-2.5 bg-white px-3 py-2.5" data-testid={`trust-tile-${i}`}>
                      <div className="w-8 h-8 rounded-md bg-[#FBF7EE] border border-[#D4AF37]/30 flex items-center justify-center flex-shrink-0">
                        <t.icon className="h-4 w-4 text-[#6D2B35]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#6D2B35] leading-tight">{t.label}</p>
                        <p className="text-[10px] text-[#5a4a3a]/60 leading-tight">{t.sub}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <Hairline />

                {/* CTA block */}
                {!isOutOfStock && (
                  <div className="space-y-3" data-testid="cta-block">
                    <div className="flex items-stretch gap-3">
                      <div className="flex items-center bg-white border border-[#D4AF37]/40 rounded-md overflow-hidden flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="rounded-none h-10 w-10 text-[#6D2B35]"
                          onClick={() => setQuantity(q => Math.max(1, q - 1))}
                          disabled={quantity <= 1}
                          data-testid="btn-quantity-decrease"
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-10 text-center font-bold text-[#6D2B35]" data-testid="text-quantity">{quantity}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="rounded-none h-10 w-10 text-[#6D2B35]"
                          onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}
                          disabled={quantity >= product.stock}
                          data-testid="btn-quantity-increase"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <Button
                        className="flex-1 bg-[#6D2B35] hover:bg-[#5a1f29] text-[#D4AF37] rounded-md h-10 gap-2 font-semibold tracking-wide text-[13px]"
                        onClick={handleAddToCart}
                        data-testid="btn-add-to-cart"
                      >
                        <ShoppingCart className="h-4 w-4" />
                        Add to Cart
                      </Button>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full bg-[#D4AF37] hover:bg-[#C19F2E] text-[#6D2B35] border border-[#D4AF37] rounded-md h-10 font-semibold tracking-wide text-[13px]"
                      onClick={() => requireAuth(
                        () => { handleAddToCart(); window.location.href = "/checkout"; },
                        { title: "Sign in to buy", description: "Please sign in to complete your purchase" }
                      )}
                      data-testid="btn-buy-now"
                    >
                      Buy Now
                    </Button>
                    <SubscribeDialog product={product} quantity={quantity} />
                  </div>
                )}

                {/* Inline ETA from stored pincode (auto-resolves) */}
                <DeliveryEtaInline weightKg={Math.max(0.1, (product as any).weightKg || 0.5)} />

                {/* Smart Checkout: live pincode delivery + COD checker */}
                <PincodeChecker weightKg={Math.max(0.1, (product as any).weightKg || 0.5)} />


                {/* Mantra ribbon — slim hairline */}
                <div className="text-center border-y border-[#D4AF37]/25 py-3" data-testid="mantra-ribbon">
                  <p className="text-[#6D2B35] font-serif italic text-sm">ॐ नमः शिवाय · Om Namah Shivaya</p>
                  <p className="text-[10px] text-[#5a4a3a]/60 tracking-[0.2em] uppercase mt-0.5">May this sacred offering bring divine blessings</p>
                </div>

                {/* Brief description */}
                {product.description && (
                  <div className="rounded-md border border-[#D4AF37]/20 bg-white p-4" data-testid="text-product-description">
                    {product.description.includes("<") ? (
                      <div className="text-sm text-[#3a2a1a] leading-relaxed prose prose-sm max-w-none [&_b]:text-[#6D2B35] [&_strong]:text-[#6D2B35]"
                        dangerouslySetInnerHTML={{ __html: sanitizeHtml(product.description) }}
                      />
                    ) : (
                      <p className="text-sm text-[#3a2a1a] leading-relaxed">{product.description}</p>
                    )}
                  </div>
                )}

                {/* FOMO elements */}
                <div className="space-y-2">
                  {product.salesCount > 100 && (
                    <div
                      className="inline-flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-md bg-[#FBF7EE] text-[#6D2B35] border border-[#D4AF37]/40"
                      data-testid="fomo-hot-selling"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-[#D4AF37]" />
                      Most Sought-After · {product.salesCount.toLocaleString()}+ devotees
                    </div>
                  )}

                  {relevantEvents.length > 0 && currentEvent && (
                    <div
                      key={currentEventIndex}
                      className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-3 py-2 rounded-md"
                      data-testid="fomo-recent-purchase"
                    >
                      <ShoppingCart className="h-3.5 w-3.5 text-emerald-700" />
                      <span>
                        <span className="font-semibold">{currentEvent.name}</span> from{" "}
                        <span className="font-semibold">{currentEvent.city}</span> blessed their home with this{" "}
                        <span className="text-emerald-700 font-medium">{randomTimeAgo}</span>
                      </span>
                    </div>
                  )}

                  {product.stock < 20 && product.stock > 0 && (
                    <div
                      className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-800 text-xs px-3 py-2 rounded-md"
                      data-testid="fomo-urgency-timer"
                    >
                      <CalendarClock className="h-3.5 w-3.5 text-rose-600" />
                      Limited blessing — order in{" "}
                      <span className="font-mono font-bold text-rose-700" data-testid="text-countdown">{urgencyTimer}</span>{" "}
                      for fastest delivery
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </div>

        {/* Tabs */}
        {(() => {
          const allImages = [product.image, ...(product.images || []), ...(product.aplusImages || [])].filter(Boolean);
          const heroImg = allImages[0] || product.image;
          const hasStory = !!(product.aplusEnabled && (product.highlights?.length || product.features?.length || product.richDescription || (product.aplusImages?.length ?? 0) > 0));
          const hasReviews = !!displayStats;
          return (
            <section className="mt-14" data-testid="product-tabs-section">
              <Tabs defaultValue={hasStory ? "story" : "description"} className="w-full">
                <div className="sticky top-16 z-30 mb-6 bg-white/95 backdrop-blur-sm border-b border-[#D4AF37]/30">
                  <TabsList className="bg-transparent h-auto p-0 w-full justify-start gap-1 sm:gap-2 overflow-x-auto scrollbar-hide rounded-none">
                    <TabsTrigger value="description" data-testid="tab-description" className="relative font-serif text-sm sm:text-base text-[#5a4a3a]/60 data-[state=active]:text-[#6D2B35] data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none px-3 sm:px-5 py-3 border-b-2 border-transparent data-[state=active]:border-[#D4AF37] whitespace-nowrap hover-elevate">
                      Description
                    </TabsTrigger>
                    {hasStory && (
                      <TabsTrigger value="story" data-testid="tab-story" className="relative font-serif text-sm sm:text-base text-[#5a4a3a]/60 data-[state=active]:text-[#6D2B35] data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none px-3 sm:px-5 py-3 border-b-2 border-transparent data-[state=active]:border-[#D4AF37] whitespace-nowrap hover-elevate">
                        <Sparkles className="w-3.5 h-3.5 mr-1.5 inline -mt-0.5" />The Sacred Story
                      </TabsTrigger>
                    )}
                    <TabsTrigger value="reviews" data-testid="tab-reviews" className="relative font-serif text-sm sm:text-base text-[#5a4a3a]/60 data-[state=active]:text-[#6D2B35] data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none px-3 sm:px-5 py-3 border-b-2 border-transparent data-[state=active]:border-[#D4AF37] whitespace-nowrap hover-elevate">
                      Reviews{hasReviews ? ` (${displayStats!.total.toLocaleString("en-IN")})` : ""}
                    </TabsTrigger>
                  </TabsList>
                </div>

                {/* DESCRIPTION TAB */}
                <TabsContent value="description" data-testid="content-description" className="mt-0 focus-visible:outline-none">
                  <div className="grid lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                      {product.description && (
                        <div className="bg-white border border-[#D4AF37]/25 rounded-md p-6 sm:p-7" data-testid="desc-summary">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-1 h-6 bg-[#6D2B35]" />
                            <h3 className="text-xl font-serif text-[#6D2B35]">About this product</h3>
                          </div>
                          {product.description.includes("<") ? (
                            <div className="text-sm text-[#3a2a1a] leading-relaxed prose prose-sm max-w-none [&_b]:text-[#6D2B35] [&_strong]:text-[#6D2B35]" dangerouslySetInnerHTML={{ __html: sanitizeHtml(product.description) }} />
                          ) : (
                            <p className="text-[#3a2a1a] leading-relaxed whitespace-pre-line">{product.description}</p>
                          )}
                        </div>
                      )}
                      {product.highlights && product.highlights.length > 0 && (
                        <div className="bg-white border border-[#D4AF37]/25 rounded-md p-6 sm:p-7" data-testid="desc-highlights">
                          <div className="flex items-center gap-3 mb-5">
                            <div className="w-1 h-6 bg-[#D4AF37]" />
                            <h3 className="text-xl font-serif text-[#6D2B35]">Key Highlights</h3>
                          </div>
                          <ul className="grid sm:grid-cols-2 gap-3">
                            {product.highlights.map((h, i) => {
                              const parts = h.split(":");
                              const title = parts.length > 1 ? parts[0].trim() : "";
                              const desc = parts.length > 1 ? parts.slice(1).join(":").trim() : h;
                              return (
                                <li key={i} className="flex items-start gap-3" data-testid={`desc-highlight-${i}`}>
                                  <div className="w-5 h-5 rounded-md bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <Check className="h-3 w-3 text-[#6D2B35]" />
                                  </div>
                                  <div className="text-sm text-[#3a2a1a] leading-relaxed">
                                    {title && <span className="font-semibold text-[#6D2B35]">{title}: </span>}{desc}
                                  </div>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      )}
                    </div>
                    <div className="lg:col-span-1">
                      <div className="bg-[#FBF7EE] border border-[#D4AF37]/30 rounded-md p-5 lg:sticky lg:top-40" data-testid="desc-specs">
                        <div className="flex items-center gap-2 mb-4">
                          <Package className="w-4 h-4 text-[#6D2B35]" />
                          <h4 className="font-serif text-[#6D2B35] text-base">Specifications</h4>
                        </div>
                        <dl className="divide-y divide-[#D4AF37]/20 text-sm">
                          <div className="flex justify-between py-2.5">
                            <dt className="text-[#5a4a3a]/70">Category</dt>
                            <dd className="text-[#3a2a1a] font-medium">{product.category}</dd>
                          </div>
                          {product.features && product.features.slice(0, 8).map((f, i) => {
                            const parts = f.split(":");
                            if (parts.length < 2) return null;
                            return (
                              <div key={i} className="flex justify-between py-2.5 gap-3" data-testid={`spec-${i}`}>
                                <dt className="text-[#5a4a3a]/70 flex-shrink-0">{parts[0].trim()}</dt>
                                <dd className="text-[#3a2a1a] font-medium text-right">{parts.slice(1).join(":").trim()}</dd>
                              </div>
                            );
                          })}
                          <div className="flex justify-between py-2.5">
                            <dt className="text-[#5a4a3a]/70">Country of Origin</dt>
                            <dd className="text-[#3a2a1a] font-medium">India</dd>
                          </div>
                        </dl>
                        <div className="mt-4 pt-4 border-t border-[#D4AF37]/20 grid grid-cols-2 gap-2 text-center">
                          <div className="p-2 rounded-md bg-white border border-[#D4AF37]/20">
                            <Shield className="w-4 h-4 text-[#6D2B35] mx-auto mb-1" />
                            <p className="text-[10px] text-[#5a4a3a] font-medium">Lab Certified</p>
                          </div>
                          <div className="p-2 rounded-md bg-white border border-[#D4AF37]/20">
                            <Truck className="w-4 h-4 text-[#6D2B35] mx-auto mb-1" />
                            <p className="text-[10px] text-[#5a4a3a] font-medium">Free Shipping</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* SACRED STORY (A+) TAB */}
                {hasStory && (
                  <TabsContent value="story" data-testid="content-story" className="mt-0 focus-visible:outline-none space-y-6">
                    {/* Brand banner — slim maroon */}
                    <div className="rounded-md overflow-hidden border border-[#D4AF37]/30 bg-[#6D2B35] text-white" data-testid="aplus-brand-banner">
                      <div className="grid md:grid-cols-2 gap-0">
                        <div className="p-6 md:p-8 flex flex-col justify-center">
                          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#D4AF37]/20 border border-[#D4AF37]/40 mb-4 w-fit">
                            <Shield className="w-3.5 h-3.5 text-[#D4AF37]" />
                            <span className="text-[10px] font-semibold text-[#D4AF37] tracking-wider uppercase">Vedic Tatva Certified</span>
                          </div>
                          <h2 className="text-2xl md:text-3xl font-serif text-white mb-3" data-testid="text-aplus-heading">
                            {product.name}
                          </h2>
                          <p className="text-white/75 text-sm leading-relaxed">
                            Crafted with devotion, rooted in tradition. Made with authentic, natural ingredients following ancient Vedic formulations to enhance your spiritual practice.
                          </p>
                          <div className="flex gap-3 mt-5">
                            {[
                              { v: "100%", l: "Natural" },
                              { v: "Vedic", l: "Formula" },
                              { v: "Pure", l: "Ingredients" },
                            ].map((s, i) => (
                              <div key={i} className="text-center px-3 py-1.5 rounded-md bg-white/5 border border-white/10">
                                <span className="text-base font-bold text-[#D4AF37]">{s.v}</span>
                                <p className="text-[10px] text-white/60 uppercase tracking-wider">{s.l}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="hidden md:flex items-center justify-center bg-[#5a1f29] p-8">
                          <div className="w-48 h-48 rounded-md bg-white/5 border border-[#D4AF37]/30 flex items-center justify-center p-4">
                            <img src={optImg(heroImg, 480)} srcSet={optImgSrcSet(heroImg, [240, 360, 480, 768])} sizes="192px" alt={product.name} loading="lazy" decoding="async" width={400} height={400} className="w-full h-full object-contain" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Rich Description */}
                    {product.richDescription && (
                      <div className="rounded-md overflow-hidden border border-[#D4AF37]/25" data-testid="aplus-rich-description">
                        <div className="grid md:grid-cols-5 gap-px bg-[#D4AF37]/20">
                          <div className="md:col-span-2 bg-[#FBF7EE] p-6 flex items-center justify-center min-h-[240px]">
                            <img src={optImg(allImages[1] || heroImg, 480)} srcSet={optImgSrcSet(allImages[1] || heroImg, [240, 360, 480, 768])} sizes="(min-width: 768px) 40vw, 100vw" alt={product.name} loading="lazy" decoding="async" className="max-w-full max-h-[240px] object-contain mix-blend-multiply" />
                          </div>
                          <div className="md:col-span-3 bg-white p-6 md:p-8">
                            <div className="flex items-center gap-2 mb-5">
                              <div className="w-8 h-8 rounded-md bg-[#6D2B35] flex items-center justify-center">
                                <Package className="w-4 h-4 text-white" />
                              </div>
                              <div>
                                <h3 className="text-lg font-serif text-[#6D2B35]">About This Product</h3>
                                <p className="text-[10px] text-[#5a4a3a]/60 uppercase tracking-wider">Enhanced Brand Content</p>
                              </div>
                            </div>
                            {(() => {
                              try {
                                const aplusContent = JSON.parse(product.richDescription);
                                return (
                                  <div className="space-y-5" data-testid="rich-description-aplus">
                                    {aplusContent.brandStory && (
                                      <p className="text-[#3a2a1a] leading-relaxed italic border-l-2 border-[#D4AF37] pl-4">{aplusContent.brandStory}</p>
                                    )}
                                    {aplusContent.sections?.map((section: any, idx: number) => (
                                      <div key={idx}>
                                        {section.heading && <h4 className="text-base font-semibold text-[#6D2B35] mb-2">{section.heading}</h4>}
                                        {section.text && <p className="text-[#3a2a1a] leading-relaxed text-sm">{section.text}</p>}
                                        {section.items && (
                                          <div className="grid grid-cols-2 gap-2 mt-3">
                                            {section.items.map((item: any, i: number) => (
                                              <div key={i} className="bg-[#FBF7EE] rounded-md p-3 border border-[#D4AF37]/20">
                                                <p className="font-medium text-[#6D2B35] text-sm">{item.title}</p>
                                                <p className="text-xs text-[#5a4a3a] mt-1">{item.description}</p>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                        {section.rows && (
                                          <div className="mt-3 border border-[#D4AF37]/20 rounded-md overflow-hidden">
                                            {section.rows.map((row: any, i: number) => (
                                              <div key={i} className={`flex text-sm ${i % 2 === 0 ? "bg-white" : "bg-[#FBF7EE]"}`}>
                                                <span className="font-medium text-[#6D2B35] px-3 py-2 w-1/3 border-r border-[#D4AF37]/20">{row.label}</span>
                                                <span className="text-[#3a2a1a] px-3 py-2 flex-1">{row.value}</span>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                        {section.steps && (
                                          <ol className="mt-3 space-y-2">
                                            {section.steps.map((step: string, i: number) => (
                                              <li key={i} className="flex gap-2 text-sm text-[#3a2a1a]">
                                                <span className="font-bold text-[#D4AF37]">{i + 1}.</span> {step}
                                              </li>
                                            ))}
                                          </ol>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                );
                              } catch {
                                return product.richDescription.includes("<") ? (
                                  <div
                                    className="text-[#3a2a1a] leading-relaxed prose prose-base max-w-none [&_b]:text-[#6D2B35] [&_strong]:text-[#6D2B35] [&_i]:text-[#5a4a3a] [&_ul]:mt-3 [&_ul]:space-y-1.5 [&_li]:text-[#3a2a1a] [&_br]:mb-2"
                                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(product.richDescription) }}
                                    data-testid="rich-description-html"
                                  />
                                ) : (
                                  <div className="text-[#3a2a1a] leading-relaxed whitespace-pre-line text-sm" data-testid="rich-description-text">
                                    {product.richDescription}
                                  </div>
                                );
                              }
                            })()}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Highlights */}
                    {product.highlights && product.highlights.length > 0 && (
                      <div data-testid="aplus-highlights">
                        <div className="flex items-center gap-3 mb-5">
                          <div className="w-1 h-6 bg-[#D4AF37]" />
                          <h3 className="text-xl font-serif text-[#6D2B35]">Why Choose This Product</h3>
                        </div>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px rounded-md overflow-hidden border border-[#D4AF37]/25 bg-[#D4AF37]/20">
                          {product.highlights.map((h, i) => {
                            const parts = h.split(":");
                            const title = parts.length > 1 ? parts[0].trim() : "";
                            const desc = parts.length > 1 ? parts.slice(1).join(":").trim() : h;
                            return (
                              <div key={i} className="bg-white p-4" data-testid={`highlight-item-${i}`}>
                                {title && (
                                  <div className="flex items-center gap-2 mb-2">
                                    <div className="w-6 h-6 rounded-md bg-[#6D2B35] flex items-center justify-center flex-shrink-0">
                                      <Check className="h-3 w-3 text-[#D4AF37]" />
                                    </div>
                                    <span className="text-sm font-bold text-[#6D2B35]">{title}</span>
                                  </div>
                                )}
                                <p className="text-xs text-[#5a4a3a]/80 leading-relaxed pl-8">{desc}</p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Features / specs */}
                    {product.features && product.features.length > 0 && (
                      <div data-testid="aplus-features">
                        <div className="flex items-center gap-3 mb-5">
                          <div className="w-1 h-6 bg-[#6D2B35]" />
                          <h3 className="text-xl font-serif text-[#6D2B35]">Product Facts &amp; Specifications</h3>
                        </div>
                        <div className="rounded-md overflow-hidden border border-[#D4AF37]/25">
                          <div className="divide-y divide-[#D4AF37]/15">
                            {product.features.map((f, i) => {
                              const parts = f.split(":");
                              const label = parts.length > 1 ? parts[0].trim() : `Feature ${i + 1}`;
                              const value = parts.length > 1 ? parts.slice(1).join(":").trim() : f;
                              return (
                                <div key={i} className={`flex items-center gap-4 px-5 py-3 ${i % 2 === 0 ? "bg-[#FBF7EE]" : "bg-white"}`} data-testid={`feature-card-${i}`}>
                                  <div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] flex-shrink-0" />
                                  <span className="text-sm font-semibold text-[#6D2B35] min-w-[120px]">{label}</span>
                                  <span className="text-sm text-[#5a4a3a]">{value}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Image collage */}
                    {allImages.length >= 2 && (
                      <div data-testid="aplus-collage">
                        <div className="grid grid-cols-3 md:grid-cols-5 gap-px rounded-md overflow-hidden bg-[#D4AF37]/20 border border-[#D4AF37]/25">
                          {allImages.slice(0, 5).map((img, i) => (
                            <div key={i} className={`relative bg-[#FBF7EE] overflow-hidden ${i === 0 ? 'col-span-2 row-span-2' : ''}`}>
                              <div className="aspect-square">
                                <img src={optImg(img, 480)} srcSet={optImgSrcSet(img, [240, 360, 480, 768])} sizes="(min-width: 768px) 20vw, 33vw" alt={`${product.name} - view ${i + 1}`} loading="lazy" decoding="async" className="w-full h-full object-contain p-2 mix-blend-multiply" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Trust badges strip */}
                    <div className="rounded-md overflow-hidden border border-[#D4AF37]/25 grid grid-cols-2 md:grid-cols-4 gap-px bg-[#D4AF37]/20" data-testid="aplus-trust-badges">
                      {[
                        { icon: Sparkles, title: "100% Natural", desc: "No chemicals or additives" },
                        { icon: Shield, title: "Lab Tested", desc: "Quality certified" },
                        { icon: Package, title: "Secure Pack", desc: "Tamper-proof sealed" },
                        { icon: Check, title: "Made in India", desc: "Supporting artisans" },
                      ].map((badge, i) => (
                        <div key={i} className="bg-white text-center p-4" data-testid={`trust-badge-${i}`}>
                          <div className="w-9 h-9 mx-auto rounded-md bg-[#FBF7EE] border border-[#D4AF37]/30 flex items-center justify-center mb-2">
                            <badge.icon className="w-4 h-4 text-[#6D2B35]" />
                          </div>
                          <p className="text-xs font-semibold text-[#6D2B35]">{badge.title}</p>
                          <p className="text-[10px] text-[#5a4a3a]/60 mt-0.5">{badge.desc}</p>
                        </div>
                      ))}
                    </div>

                    {/* A+ Gallery */}
                    {product.aplusImages && product.aplusImages.length > 0 && (
                      <div data-testid="aplus-gallery">
                        <div className="flex items-center gap-3 mb-5">
                          <div className="w-1 h-6 bg-[#6D2B35]" />
                          <h3 className="text-xl font-serif text-[#6D2B35]">Product Gallery</h3>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {product.aplusImages.map((img, i) => (
                            <div key={i} className="aspect-square rounded-md overflow-hidden bg-[#FBF7EE] border border-[#D4AF37]/25" data-testid={`aplus-image-${i}`}>
                              <img src={optImg(img, 480)} srcSet={optImgSrcSet(img, [240, 360, 480, 768])} sizes="(min-width: 768px) 33vw, 50vw" alt={`${product.name} - ${i + 1}`} loading="lazy" decoding="async" className="w-full h-full object-contain p-3 mix-blend-multiply" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Brand footer */}
                    <div className="text-center py-5 border-t border-[#D4AF37]/20">
                      <p className="text-xs text-[#5a4a3a]/50 font-serif italic">Vedic Tatva — Heritage of Nature Wellness & Purity</p>
                      <p className="text-[10px] text-[#5a4a3a]/30 mt-1">Vedic Tatva Private Limited • vedictatva.com</p>
                    </div>
                  </TabsContent>
                )}

                {/* REVIEWS TAB */}
                <TabsContent value="reviews" data-testid="content-reviews" className="mt-0 focus-visible:outline-none">
                  {hasReviews ? (
                    <div>
                      <div className="text-center mb-8">
                        <h2 className="text-2xl sm:text-3xl font-serif text-[#6D2B35]" data-testid="text-reviews-heading">
                          Customer Reviews
                        </h2>
                        <div className="w-16 h-px mx-auto mt-3 bg-[#D4AF37]" />
                      </div>

                      <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
                        <span className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium px-3 h-8 rounded-md" data-testid="badge-recommend">
                          <ThumbsUp className="w-3.5 h-3.5" /> {displayStats!.recommend}% recommend
                        </span>
                        <span className="inline-flex items-center bg-[#FBF7EE] border border-[#D4AF37]/30 text-[#6D2B35] text-xs font-medium px-3 h-8 rounded-md" data-testid="badge-total-reviews">
                          {displayStats!.total.toLocaleString("en-IN")} Customer Ratings
                        </span>
                      </div>

                      {reviewPhotoStrip.length > 0 && (
                        <div className="mb-6" data-testid="review-photo-strip">
                          <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="h-4 w-4 text-[#D4AF37]" />
                            <h3 className="text-sm font-semibold text-[#6D2B35]" data-testid="text-photo-strip-heading">
                              Customer Photos ({reviewPhotoStrip.length})
                            </h3>
                          </div>
                          <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
                            {reviewPhotoStrip.map((p, i) => (
                              <button
                                key={`${p.reviewId}-${p.index}-${i}`}
                                type="button"
                                onClick={() => setReviewLightbox({ images: p.images, index: p.index })}
                                className="flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-md overflow-hidden border border-[#D4AF37]/30 hover-elevate active-elevate-2"
                                data-testid={`button-photo-strip-${p.reviewId}-${p.index}`}
                                aria-label="Open customer photo"
                              >
                                <img src={p.src} alt="customer review" loading="lazy" className="w-full h-full object-cover" />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Rating Summary */}
                        <div className="lg:col-span-1" data-testid="rating-summary">
                          <div className="border border-[#D4AF37]/25 rounded-md bg-[#FBF7EE] lg:sticky lg:top-32">
                            <div className="p-6">
                              <div className="text-center mb-4">
                                <div className="text-5xl font-bold text-[#6D2B35]" data-testid="text-avg-rating">
                                  {displayStats!.avg.toFixed(1)}
                                </div>
                                <div className="mt-2 flex justify-center">
                                  <StarRating rating={Math.round(displayStats!.avg)} size={20} />
                                </div>
                                <p className="text-sm text-[#5a4a3a]/70 mt-1" data-testid="text-total-reviews">
                                  Based on {displayStats!.total.toLocaleString("en-IN")} ratings
                                </p>
                              </div>
                              <div className="space-y-2">
                                {displayStats!.dist.map(d => (
                                  <div key={d.star} className="flex items-center gap-2" data-testid={`rating-bar-${d.star}`}>
                                    <span className="text-xs w-10 text-[#5a4a3a]/70">{d.star} star</span>
                                    <div className="flex-1 h-2 bg-white border border-[#D4AF37]/20 rounded-md overflow-hidden">
                                      <div className="h-full transition-all" style={{ width: `${d.pct}%`, backgroundColor: "#D4AF37" }} />
                                    </div>
                                    <span className="text-xs text-[#5a4a3a]/70 w-9 text-right">{d.pct}%</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Review Cards */}
                        <div className="lg:col-span-2 space-y-3" data-testid="review-cards">
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-1" data-testid="review-controls">
                            <div className="flex flex-wrap items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setReviewFilterPhotos(v => !v)}
                                className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 h-8 rounded-md border hover-elevate toggle-elevate ${reviewFilterPhotos ? "toggle-elevated bg-[#FBF7EE] border-[#D4AF37] text-[#6D2B35]" : "bg-white border-[#D4AF37]/30 text-[#5a4a3a]/80"}`}
                                data-testid="filter-photos-only"
                                aria-pressed={reviewFilterPhotos}
                                disabled={reviewPhotoCount === 0}
                              >
                                <Sparkles className="h-3.5 w-3.5" /> Photos only ({reviewPhotoCount})
                              </button>
                              <button
                                type="button"
                                onClick={() => setReviewFilterVerified(v => !v)}
                                className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 h-8 rounded-md border hover-elevate toggle-elevate ${reviewFilterVerified ? "toggle-elevated bg-emerald-50 border-emerald-300 text-emerald-700" : "bg-white border-[#D4AF37]/30 text-[#5a4a3a]/80"}`}
                                data-testid="filter-verified-only"
                                aria-pressed={reviewFilterVerified}
                                disabled={reviewVerifiedCount === 0}
                              >
                                <Shield className="h-3.5 w-3.5" /> Verified only ({reviewVerifiedCount})
                              </button>
                            </div>
                            <label className="inline-flex items-center gap-2 text-xs text-[#5a4a3a]/70">
                              <span>Sort</span>
                              <select
                                value={reviewSort}
                                onChange={(e) => {
                                  const v = e.target.value;
                                  if (v === "helpful" || v === "newest" || v === "highest" || v === "lowest") {
                                    setReviewSort(v);
                                  }
                                }}
                                className="h-8 rounded-md border border-[#D4AF37]/30 bg-white px-2 text-xs text-[#3a2a1a] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                                data-testid="select-review-sort"
                              >
                                <option value="helpful">Most helpful</option>
                                <option value="newest">Newest</option>
                                <option value="highest">Highest rated</option>
                                <option value="lowest">Lowest rated</option>
                              </select>
                            </label>
                          </div>
                          {sortedReviews.length === 0 && (
                            <div className="border border-dashed border-[#D4AF37]/30 rounded-md bg-white p-6 text-center text-sm text-[#5a4a3a]/70" data-testid="reviews-filtered-empty">
                              No reviews match the selected filters.
                            </div>
                          )}
                          {sortedReviews.map(review => (
                            <div key={review.id} className="border border-[#D4AF37]/25 rounded-md bg-white p-5" data-testid={`review-card-${review.id}`}>
                              <div className="flex items-start justify-between mb-2 flex-wrap gap-2">
                                <div>
                                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                                    <span className="font-semibold text-[#3a2a1a]" data-testid={`text-reviewer-name-${review.id}`}>
                                      {review.reviewerName}
                                    </span>
                                    {review.reviewerCity && (
                                      <span className="text-xs text-[#5a4a3a]/60">from {review.reviewerCity}</span>
                                    )}
                                    {review.verified && (
                                      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md" data-testid={`badge-verified-${review.id}`}>
                                        <Shield className="h-3 w-3" /> Verified Buyer
                                      </span>
                                    )}
                                  </div>
                                  <StarRating rating={review.rating} size={14} />
                                </div>
                                {review.createdAt && (
                                  <span className="text-xs text-[#5a4a3a]/60" data-testid={`text-review-date-${review.id}`}>
                                    {new Date(review.createdAt).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" })}
                                  </span>
                                )}
                              </div>
                              <h4 className="font-medium text-[#3a2a1a] mt-2 mb-1" data-testid={`text-review-title-${review.id}`}>
                                {review.title}
                              </h4>
                              <p className="text-sm text-[#5a4a3a]/80 leading-relaxed" data-testid={`text-review-body-${review.id}`}>
                                {review.body}
                              </p>
                              {(() => {
                                const reviewImages = review.images;
                                if (!Array.isArray(reviewImages) || reviewImages.length === 0) return null;
                                return (
                                <div className="mt-3 flex flex-wrap gap-2" data-testid={`review-images-${review.id}`}>
                                  {reviewImages.map((src, idx) => (
                                    <button
                                      key={src + idx}
                                      type="button"
                                      onClick={() => setReviewLightbox({ images: reviewImages, index: idx })}
                                      className="block w-20 h-20 rounded-md overflow-hidden border border-[#D4AF37]/30 hover-elevate active-elevate-2"
                                      data-testid={`review-image-${review.id}-${idx}`}
                                      aria-label="Open customer photo"
                                    >
                                      <img src={src} alt="customer review" loading="lazy" className="w-full h-full object-cover" />
                                    </button>
                                  ))}
                                </div>
                                );
                              })()}
                              <div className="mt-3 pt-3 border-t border-[#D4AF37]/15 flex items-center justify-between flex-wrap gap-2">
                                {(() => {
                                  const hasVoted = votedReviewIds.has(review.id);
                                  const isPending = helpfulMutation.isPending && helpfulMutation.variables === review.id;
                                  return (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (hasVoted || isPending) return;
                                        helpfulMutation.mutate(review.id);
                                      }}
                                      disabled={hasVoted || isPending}
                                      className={`inline-flex items-center gap-1.5 text-xs transition-colors disabled:cursor-not-allowed ${
                                        hasVoted
                                          ? "text-[#6D2B35] font-medium"
                                          : "text-[#5a4a3a]/70 hover:text-[#6D2B35]"
                                      }`}
                                      data-testid={`btn-helpful-${review.id}`}
                                      aria-pressed={hasVoted}
                                    >
                                      <ThumbsUp className={`h-3.5 w-3.5 ${hasVoted ? "fill-current" : ""}`} />
                                      {hasVoted ? "Marked helpful" : "Was this helpful?"} ({review.helpful ?? 0})
                                    </button>
                                  );
                                })()}
                                <div className="flex items-center gap-1" data-testid={`share-buttons-${review.id}`}>
                                  <span className="text-xs text-[#5a4a3a]/60 mr-1 flex items-center gap-1">
                                    <Share2 className="h-3 w-3" /> Share
                                  </span>
                                  <button
                                    className="inline-flex items-center gap-1 text-xs text-[#5a4a3a]/70 hover:text-emerald-600 transition-colors px-1.5 py-1 rounded-md"
                                    data-testid={`btn-share-whatsapp-${review.id}`}
                                    onClick={() => {
                                      const shareText = `Check out this review of ${product.name} on Vedic Tatva: "${review.title}" - ${review.rating} stars`;
                                      const shareUrl = `${window.location.origin}${getProductUrl(product.id, product.name)}`;
                                      window.open(`https://wa.me/?text=${encodeURIComponent(shareText + " " + shareUrl)}`, "_blank");
                                    }}
                                  >
                                    <MessageCircle className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    className="inline-flex items-center gap-1 text-xs text-[#5a4a3a]/70 hover:text-blue-600 transition-colors px-1.5 py-1 rounded-md"
                                    data-testid={`btn-share-facebook-${review.id}`}
                                    onClick={() => {
                                      const shareUrl = `${window.location.origin}${getProductUrl(product.id, product.name)}`;
                                      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, "_blank");
                                    }}
                                  >
                                    <span className="text-[11px] font-medium">f</span>
                                  </button>
                                  <button
                                    className="inline-flex items-center gap-1 text-xs text-[#5a4a3a]/70 hover:text-sky-500 transition-colors px-1.5 py-1 rounded-md"
                                    data-testid={`btn-share-twitter-${review.id}`}
                                    onClick={() => {
                                      const shareText = `Check out this review of ${product.name} on Vedic Tatva: "${review.title}" - ${review.rating} stars`;
                                      const shareUrl = `${window.location.origin}${getProductUrl(product.id, product.name)}`;
                                      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`, "_blank");
                                    }}
                                  >
                                    <span className="text-[11px] font-medium">𝕏</span>
                                  </button>
                                  <button
                                    className="inline-flex items-center gap-1 text-xs text-[#5a4a3a]/70 hover:text-[#6D2B35] transition-colors px-1.5 py-1 rounded-md"
                                    data-testid={`btn-share-copy-${review.id}`}
                                    onClick={() => {
                                      const shareUrl = `${window.location.origin}${getProductUrl(product.id, product.name)}`;
                                      navigator.clipboard.writeText(shareUrl).then(() => {
                                        toast({ title: "Link copied!", description: "Product link has been copied to clipboard." });
                                      });
                                    }}
                                  >
                                    <Copy className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-14 bg-white border border-[#D4AF37]/25 rounded-md" data-testid="reviews-empty">
                      <Star className="w-10 h-10 text-[#D4AF37]/40 mx-auto mb-4" />
                      <h3 className="text-xl font-serif text-[#6D2B35] mb-2">Be the first to share your experience</h3>
                      <p className="text-sm text-[#5a4a3a]/70 max-w-md mx-auto">No reviews yet for this sacred item. Once you receive and energise your purchase, your honest review helps fellow devotees on their spiritual journey.</p>
                    </div>
                  )}

                  <div className="mt-8" data-testid="review-form-section">
                    <ReviewSubmitForm
                      productId={product.id}
                      defaultEmail={user?.email}
                      defaultName={user?.name}
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </section>
          );
        })()}

        {/* FAQ Section — slim, category-aware */}
        {(() => {
          const faqs = getCategoryFAQs(product);
          return (
            <section className="mt-14" data-testid="section-faqs">
              {/* Slim section header */}
              <div className="text-center mb-8">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <div className="h-px w-12 sm:w-16 bg-[#D4AF37]/60" />
                  <span className="text-[10px] uppercase tracking-[0.3em] text-[#6D2B35] font-bold">Sacred Guidance</span>
                  <div className="h-px w-12 sm:w-16 bg-[#D4AF37]/60" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-serif text-[#6D2B35] tracking-tight" data-testid="text-faq-heading">
                  Frequently Asked Questions
                </h2>
                <p className="text-sm text-[#5a4a3a]/70 mt-2 max-w-2xl mx-auto">
                  Everything you need to know about <span className="font-semibold text-[#6D2B35]">{product.name}</span> — authenticity, energising, usage, and delivery.
                </p>
              </div>

              <div className="grid lg:grid-cols-3 gap-6">
                {/* WhatsApp support card */}
                <aside className="lg:col-span-1">
                  <div className="bg-[#6D2B35] rounded-md p-6 text-white lg:sticky lg:top-32 border border-[#D4AF37]/30" data-testid="faq-side">
                    <div className="w-12 h-12 rounded-md bg-[#D4AF37]/15 border border-[#D4AF37]/40 flex items-center justify-center mb-4">
                      <MessageCircle className="w-5 h-5 text-[#D4AF37]" />
                    </div>
                    <h3 className="text-xl font-serif mb-2">Have a question?</h3>
                    <p className="text-white/75 text-sm leading-relaxed mb-5">
                      Our pandits and customer care team are here to guide you on authenticity, energising rituals, mantras, and delivery.
                    </p>
                    <a
                      href="https://wa.me/918447844702"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 w-full bg-[#D4AF37] text-[#6D2B35] font-semibold text-[13px] px-4 h-10 rounded-md hover-elevate active-elevate-2"
                      data-testid="link-whatsapp-support"
                    >
                      <MessageCircle className="w-4 h-4" /> Chat on WhatsApp
                    </a>
                    <div className="mt-5 pt-4 border-t border-[#D4AF37]/20 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between text-white/70">
                        <span>Support hours</span>
                        <span className="text-[#D4AF37] font-semibold">Mon–Sat · 9am–9pm IST</span>
                      </div>
                      <div className="flex items-center justify-between text-white/70">
                        <span>Avg. response</span>
                        <span className="text-[#D4AF37] font-semibold">Under 5 minutes</span>
                      </div>
                      <div className="flex items-center justify-between text-white/70">
                        <span>Languages</span>
                        <span className="text-[#D4AF37] font-semibold">EN · हिंदी</span>
                      </div>
                    </div>
                  </div>
                </aside>

                {/* FAQ accordion */}
                <div className="lg:col-span-2">
                  <div className="bg-white border border-[#D4AF37]/25 rounded-md p-2 sm:p-4" data-testid="faq-list">
                    <Accordion type="single" collapsible defaultValue="faq-0" className="w-full">
                      {faqs.map((item, i) => (
                        <AccordionItem
                          key={i}
                          value={`faq-${i}`}
                          className="border-b border-[#D4AF37]/15 last:border-0 px-2 sm:px-3"
                        >
                          <AccordionTrigger
                            className="text-left hover:no-underline py-4 [&[data-state=open]>span>span:first-child]:bg-[#6D2B35] [&[data-state=open]>span>span:first-child]:text-[#D4AF37] [&[data-state=open]>span>span:first-child]:border-[#6D2B35]"
                            data-testid={`faq-trigger-${i}`}
                          >
                            <span className="flex items-start gap-3 pr-4 flex-1">
                              <span className="flex-shrink-0 w-7 h-7 rounded-md bg-[#FBF7EE] border border-[#D4AF37]/40 text-[#6D2B35] text-xs font-bold flex items-center justify-center mt-0.5 transition-colors">
                                Q
                              </span>
                              <span className="text-sm sm:text-base font-semibold text-[#6D2B35] font-serif leading-snug pt-0.5">
                                {item.q}
                              </span>
                            </span>
                          </AccordionTrigger>
                          <AccordionContent className="pb-5 pl-10 pr-2 text-sm text-[#3a2a1a] leading-relaxed" data-testid={`faq-answer-${i}`}>
                            <div className="flex items-start gap-3 -ml-10">
                              <span className="flex-shrink-0 w-7 h-7 rounded-md bg-[#6D2B35] border border-[#D4AF37]/40 text-[#D4AF37] text-xs font-bold flex items-center justify-center mt-0.5">
                                A
                              </span>
                              <span className="flex-1 pt-0.5">{item.a}</span>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </div>

                  <p className="text-center text-xs text-[#5a4a3a]/60 mt-4 italic">
                    Didn't find what you were looking for? <a href="https://wa.me/918447844702" target="_blank" rel="noopener noreferrer" className="text-[#6D2B35] font-semibold hover:underline">Reach out on WhatsApp</a> — our pandits respond within minutes.
                  </p>
                </div>
              </div>
            </section>
          );
        })()}

        {/* Frequently Bought Together */}
        {fbtProducts.length > 0 && (
          <section className="mt-14 bg-[#FBF7EE] border border-[#D4AF37]/25 rounded-md p-5 sm:p-6" data-testid="section-fbt">
            <div className="flex items-center gap-2 mb-5">
              <Sparkles className="h-5 w-5 text-[#D4AF37]" />
              <h2 className="text-xl sm:text-2xl font-serif text-[#6D2B35]" data-testid="text-fbt-heading">Frequently Bought Together</h2>
              {fbtFromHistory && (
                <span className="text-[10px] uppercase tracking-wider font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md" data-testid="badge-fbt-from-orders">
                  From real orders
                </span>
              )}
            </div>

            <div className="flex flex-col lg:flex-row items-stretch gap-4">
              <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap flex-1">
                <div className="flex flex-col items-center text-center w-24 sm:w-28">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 bg-white rounded-md border border-[#6D2B35] overflow-hidden p-1">
                    <img src={optImg(product.image, 600)} srcSet={optImgSrcSet(product.image, [240, 360, 480, 720])} sizes={SIZES.productCard} alt={product.name} loading="lazy" decoding="async" className="w-full h-full object-contain mix-blend-multiply" />
                  </div>
                  <p className="text-[10px] text-[#6D2B35] font-semibold mt-1.5 line-clamp-2 leading-tight">This Item</p>
                  <p className="text-xs font-bold mt-0.5 text-[#3a2a1a]">₹{product.price.toLocaleString()}</p>
                </div>

                {fbtProducts.map((fp) => (
                  <div key={fp.id} className="flex items-center gap-2 sm:gap-3">
                    <span className="text-2xl text-[#D4AF37] font-light">+</span>
                    <Link href={getProductUrl(fp.id, fp.name)} className="flex flex-col items-center text-center w-24 sm:w-28 hover-elevate rounded-md p-1" data-testid={`fbt-item-${fp.id}`}>
                      <div className="w-24 h-24 sm:w-28 sm:h-28 bg-white rounded-md border border-[#D4AF37]/30 overflow-hidden p-1">
                        <img src={optImg(fp.image, 400)} srcSet={optImgSrcSet(fp.image, [200, 320, 400, 600])} sizes={SIZES.productCard} alt={fp.name} loading="lazy" decoding="async" className="w-full h-full object-contain mix-blend-multiply" />
                      </div>
                      <p className="text-[10px] text-[#5a4a3a] font-medium mt-1.5 line-clamp-2 leading-tight">{fp.name}</p>
                      <p className="text-xs font-bold mt-0.5 text-[#3a2a1a]">₹{fp.price.toLocaleString()}</p>
                    </Link>
                  </div>
                ))}
              </div>

              <div className="lg:w-64 flex flex-col justify-center bg-white rounded-md p-4 border border-[#D4AF37]/30">
                <p className="text-xs text-[#5a4a3a]/70 mb-1">Bundle Price ({fbtProducts.length + 1} items)</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-[#6D2B35]" data-testid="text-fbt-bundle-price">₹{fbtBundleDiscounted.toLocaleString()}</span>
                  <span className="text-sm text-[#5a4a3a]/50 line-through">₹{fbtBundleTotal.toLocaleString()}</span>
                </div>
                <p className="text-xs text-emerald-700 font-semibold mt-0.5">You save ₹{fbtSavings.toLocaleString()} (8% off)</p>
                <Button
                  className="w-full mt-3 bg-[#D4AF37] hover:bg-[#C19F2E] text-[#6D2B35] font-semibold rounded-md h-10 text-[13px]"
                  onClick={() => {
                    addToCart(product);
                    fbtProducts.forEach(fp => addToCart(fp));
                    toast({ title: "Bundle added to cart", description: `${fbtProducts.length + 1} items added with bundle savings.` });
                  }}
                  data-testid="btn-fbt-add-bundle"
                >
                  <ShoppingCart className="h-4 w-4 mr-1.5" /> Add Bundle to Cart
                </Button>
                <p className="text-[10px] text-[#5a4a3a]/60 text-center mt-2">Save more with this divine combo</p>
              </div>
            </div>
          </section>
        )}

        {/* AI Product Q&A */}
        <section className="mt-14" data-testid="section-product-qa">
          <ProductQAWidget slug={product.slug || String(product.id)} />
        </section>

        {/* Persistent Customer Q&A */}
        <section className="mt-8" data-testid="section-customer-qa">
          <PersistentProductQA productId={product.id} defaultName={user?.name} defaultEmail={user?.email} />
        </section>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className="mt-14">
            <div className="flex items-end justify-between mb-5">
              <h2 className="text-xl sm:text-2xl font-serif text-[#6D2B35]" data-testid="text-related-products-heading">Devotees Also Bought</h2>
              <Link href={`/shop?category=${encodeURIComponent(product.category)}`} className="text-xs sm:text-sm text-[#6D2B35] hover:underline font-semibold flex items-center gap-1">
                View all in {product.category} <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
              {relatedProducts.map((rp) => {
                const rpMrp = Math.round(rp.price * 1.22 / 10) * 10;
                const rpDisc = Math.round(((rpMrp - rp.price) / rpMrp) * 100);
                const seed = rp.id * 9301 + 49297;
                const rpRating = Math.round((4.3 + ((seed % 70) / 100)) * 10) / 10;
                const rpCount = 18 + (rp.salesCount || 0) + (seed % 240);
                return (
                  <Link key={rp.id} href={getProductUrl(rp.id, rp.name)}>
                    <div className="bg-white rounded-md border border-[#D4AF37]/25 hover:border-[#D4AF37]/55 transition-colors flex flex-col overflow-hidden h-full" data-testid={`card-related-product-${rp.id}`}>
                      <div className="aspect-square bg-[#FBF7EE] overflow-hidden relative">
                        <img src={optImg(rp.image, 400)} srcSet={optImgSrcSet(rp.image, [200, 320, 400, 600])} sizes={SIZES.productCard} alt={rp.name} loading="lazy" decoding="async" className="w-full h-full object-contain p-2 mix-blend-multiply" />
                        {rpDisc > 0 && (
                          <div className="absolute top-2 left-2 bg-[#6D2B35] text-white text-[10px] font-bold px-2 py-0.5 rounded-md">{rpDisc}% OFF</div>
                        )}
                        {rp.badge && (
                          <div className={`absolute top-2 right-2 text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wide ${rp.badge === "Amazon Choice" ? "bg-[#232F3E] text-[#FF9900]" : "bg-[#D4AF37] text-[#1a1118]"}`}>
                            {rp.badge === "Amazon Choice" ? "Editor's Pick" : rp.badge}
                          </div>
                        )}
                      </div>
                      <div className="p-3 flex flex-col flex-1">
                        <span className="text-[10px] text-[#6D2B35]/70 uppercase tracking-wider font-semibold">{rp.category}</span>
                        <h3 className="text-xs sm:text-sm font-medium text-[#3a2a1a] line-clamp-2 leading-snug mt-0.5 min-h-[2.4em]">{rp.name}</h3>
                        <div className="flex items-center gap-1 mt-1.5">
                          <span className="flex items-center gap-0.5 bg-emerald-600 text-white px-1.5 py-0.5 rounded-md text-[10px] font-bold">
                            {rpRating.toFixed(1)} <Star className="h-2 w-2 fill-white" />
                          </span>
                          <span className="text-[10px] text-[#5a4a3a]/70 font-medium">({rpCount.toLocaleString()})</span>
                        </div>
                        <div className="mt-1.5 flex items-baseline gap-1.5">
                          <span className="font-bold text-base text-[#3a2a1a]">₹{rp.price.toLocaleString()}</span>
                          {rpDisc > 0 && <span className="text-[11px] text-[#5a4a3a]/50 line-through">₹{rpMrp.toLocaleString()}</span>}
                        </div>
                        {rp.price >= 499 && (
                          <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1 mt-0.5"><Truck className="h-3 w-3" /> Free Delivery</span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        <ProductRelatedServices category={product.category} />

        <RelatedBlogPosts category={product.category} productName={product.name} limit={3} />
      </div>

      {/* Sticky mobile Buy Bar — sits above the global mobile bottom nav (58px) */}
      {!isOutOfStock && (() => {
        const parsedVars: { label: string; price: number }[] = product.variations ? JSON.parse(product.variations) : [];
        const activePrice = parsedVars.length > 1 ? (parsedVars[selectedVariationIndex]?.price ?? product.price) : product.price;
        const mrp = product.mrp || 0;
        const discPct = mrp > activePrice ? Math.round(((mrp - activePrice) / mrp) * 100) : 0;
        return (
          <div
            className="fixed bottom-[58px] left-0 right-0 z-40 lg:hidden bg-white border-t border-[#D4AF37]/30 shadow-[0_-2px_12px_rgba(109,43,53,0.08)]"
            style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
            data-testid="mobile-buy-bar"
          >
            <div className="flex items-center gap-2 px-3 py-2">
              <div className="flex-shrink-0 min-w-0">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-lg font-bold text-[#6D2B35]" data-testid="mobile-buy-price">₹{activePrice.toLocaleString()}</span>
                  {discPct > 0 && (
                    <>
                      <span className="text-[10px] text-[#5a4a3a]/50 line-through">₹{mrp.toLocaleString()}</span>
                      <span className="text-[10px] text-emerald-700 font-semibold">{discPct}% off</span>
                    </>
                  )}
                </div>
                <div className="text-[10px] text-[#5a4a3a]/70 leading-tight truncate max-w-[140px]">Qty: {quantity}</div>
              </div>
              <Button
                onClick={handleAddToCart}
                variant="outline"
                className="flex-1 h-11 border-[#6D2B35] text-[#6D2B35] hover:bg-[#6D2B35]/5 rounded-md font-semibold tracking-wide text-[12px] gap-1.5"
                data-testid="mobile-buy-add"
              >
                <ShoppingCart className="h-4 w-4" />
                Add
              </Button>
              <Button
                onClick={() => requireAuth(
                  () => { handleAddToCart(); window.location.href = "/checkout"; },
                  { title: "Sign in to buy", description: "Please sign in to complete your purchase" }
                )}
                className="flex-1 h-11 bg-[#D4AF37] hover:bg-[#C19F2E] text-[#6D2B35] rounded-md font-semibold tracking-wide text-[12px]"
                data-testid="mobile-buy-now"
              >
                Buy Now
              </Button>
            </div>
          </div>
        );
      })()}

      {reviewLightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setReviewLightbox(null)}
          data-testid="review-image-lightbox"
        >
          <div className="relative max-w-3xl max-h-[90vh] w-full" onClick={(e) => e.stopPropagation()}>
            <img
              src={reviewLightbox.images[reviewLightbox.index]}
              alt="Customer review photo"
              className="w-full h-full object-contain rounded-md"
              data-testid="review-lightbox-img"
            />
            <button
              onClick={() => setReviewLightbox(null)}
              className="absolute top-2 right-2 bg-white/20 hover:bg-white/40 text-white w-10 h-10 rounded-md flex items-center justify-center text-xl"
              data-testid="btn-close-review-lightbox"
              aria-label="Close"
            >
              ✕
            </button>
            {reviewLightbox.images.length > 1 && reviewLightbox.index > 0 && (
              <button
                onClick={() => setReviewLightbox(lb => lb ? { ...lb, index: lb.index - 1 } : lb)}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white w-10 h-10 rounded-md flex items-center justify-center text-xl"
                data-testid="btn-review-lightbox-prev"
                aria-label="Previous photo"
              >
                ‹
              </button>
            )}
            {reviewLightbox.images.length > 1 && reviewLightbox.index < reviewLightbox.images.length - 1 && (
              <button
                onClick={() => setReviewLightbox(lb => lb ? { ...lb, index: lb.index + 1 } : lb)}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white w-10 h-10 rounded-md flex items-center justify-center text-xl"
                data-testid="btn-review-lightbox-next"
                aria-label="Next photo"
              >
                ›
              </button>
            )}
            {reviewLightbox.images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {reviewLightbox.images.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setReviewLightbox(lb => lb ? { ...lb, index: i } : lb)}
                    className={`w-2.5 h-2.5 rounded-full transition-all ${
                      reviewLightbox.index === i ? "bg-[#D4AF37]" : "bg-white/50 hover:bg-white/80"
                    }`}
                    data-testid={`review-lightbox-dot-${i}`}
                    aria-label={`Photo ${i + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function SubscribeDialog({ product, quantity }: { product: Product; quantity: number }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [frequency, setFrequency] = useState("monthly");
  const [submitting, setSubmitting] = useState(false);
  const [subForm, setSubForm] = useState({
    name: "", email: "", phone: "", address: "", city: "", state: "", pincode: "",
  });

  const subscriptionDiscount = frequency === "weekly" ? 15 : frequency === "biweekly" ? 12 : frequency === "monthly" ? 10 : 5;
  const subscriptionPrice = Math.round(product.price * quantity * (1 - subscriptionDiscount / 100));

  async function handleSubscribe() {
    if (!subForm.name || !subForm.email) {
      toast({ title: "Error", description: "Name and email are required", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const nextDelivery = new Date();
      if (frequency === "weekly") nextDelivery.setDate(nextDelivery.getDate() + 7);
      else if (frequency === "biweekly") nextDelivery.setDate(nextDelivery.getDate() + 14);
      else if (frequency === "monthly") nextDelivery.setMonth(nextDelivery.getMonth() + 1);
      else nextDelivery.setMonth(nextDelivery.getMonth() + 3);

      const res = await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: subForm.name,
          customerEmail: subForm.email,
          customerPhone: subForm.phone || null,
          productId: product.id,
          productName: product.name,
          quantity,
          frequency,
          price: subscriptionPrice,
          address: subForm.address || null,
          city: subForm.city || null,
          state: subForm.state || null,
          pincode: subForm.pincode || null,
          nextDelivery: nextDelivery.toISOString(),
        }),
      });
      if (res.ok) {
        toast({ title: "Subscription Created!", description: `You'll receive ${product.name} ${frequency}. Save ${subscriptionDiscount}% on every order!` });
        setOpen(false);
      } else {
        toast({ title: "Error", description: "Failed to create subscription", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Something went wrong", variant: "destructive" });
    }
    setSubmitting(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          className="w-full mt-1 flex items-center justify-between border border-dashed border-[#D4AF37] rounded-md p-3 hover:bg-[#D4AF37]/5 transition-colors text-left"
          data-testid="btn-subscribe-save"
        >
          <div className="flex items-center gap-3">
            <CalendarClock className="h-5 w-5 text-[#D4AF37]" />
            <div>
              <span className="font-semibold text-[#6D2B35] text-sm">Subscribe & Save up to 15%</span>
              <p className="text-xs text-[#5a4a3a]/70">Get regular deliveries at a discounted price</p>
            </div>
          </div>
          <RefreshCw className="h-4 w-4 text-[#D4AF37]" />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[#6D2B35] font-serif text-xl">Subscribe & Save</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="flex items-center gap-4 bg-[#FBF7EE] rounded-md p-3 border border-[#D4AF37]/20">
            <img src={optImg(product.image, 128)} srcSet={optImgSrcSet(product.image, [64, 96, 128, 192])} sizes="64px" alt={product.name} loading="lazy" decoding="async" className="w-16 h-16 rounded-md object-cover" />
            <div>
              <p className="font-medium text-[#6D2B35]">{product.name}</p>
              <p className="text-sm text-[#5a4a3a]/70">Qty: {quantity}</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Delivery Frequency</Label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: "weekly", label: "Weekly", save: "15%" },
                { value: "biweekly", label: "Every 2 Weeks", save: "12%" },
                { value: "monthly", label: "Monthly", save: "10%" },
                { value: "quarterly", label: "Every 3 Months", save: "5%" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setFrequency(opt.value)}
                  className={`p-3 rounded-md border text-left transition-all ${
                    frequency === opt.value
                      ? "border-[#D4AF37] bg-[#D4AF37]/10"
                      : "border-[#D4AF37]/25 hover:border-[#D4AF37]/55"
                  }`}
                  data-testid={`sub-freq-${opt.value}`}
                >
                  <span className="text-sm font-medium block text-[#3a2a1a]">{opt.label}</span>
                  <span className="text-xs text-emerald-700">Save {opt.save}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-md p-3 text-center">
            <p className="text-sm text-[#5a4a3a]/70 line-through">₹{(product.price * quantity).toLocaleString()}</p>
            <p className="text-2xl font-bold text-emerald-700">₹{subscriptionPrice.toLocaleString()}</p>
            <p className="text-sm text-emerald-700">You save ₹{(product.price * quantity - subscriptionPrice).toLocaleString()} ({subscriptionDiscount}% off)</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Full Name *</Label>
              <Input placeholder="Your name" value={subForm.name} onChange={(e) => setSubForm(p => ({ ...p, name: e.target.value }))} data-testid="sub-input-name" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Email *</Label>
              <Input type="email" placeholder="Email" value={subForm.email} onChange={(e) => setSubForm(p => ({ ...p, email: e.target.value }))} data-testid="sub-input-email" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Phone</Label>
              <Input placeholder="Phone" value={subForm.phone} onChange={(e) => setSubForm(p => ({ ...p, phone: e.target.value }))} data-testid="sub-input-phone" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">City</Label>
              <Input placeholder="City" value={subForm.city} onChange={(e) => setSubForm(p => ({ ...p, city: e.target.value }))} data-testid="sub-input-city" />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Delivery Address</Label>
            <Input placeholder="Full address" value={subForm.address} onChange={(e) => setSubForm(p => ({ ...p, address: e.target.value }))} data-testid="sub-input-address" />
          </div>

          <Button
            onClick={handleSubscribe}
            disabled={submitting}
            className="w-full bg-[#D4AF37] hover:bg-[#C19F2E] text-[#6D2B35] font-semibold h-10 rounded-md text-[13px]"
            data-testid="btn-confirm-subscribe"
          >
            {submitting ? "Creating..." : `Subscribe — ₹${subscriptionPrice.toLocaleString()}/${frequency === "quarterly" ? "quarter" : frequency === "biweekly" ? "2 weeks" : frequency}`}
          </Button>
          <p className="text-xs text-[#5a4a3a]/70 text-center">Cancel anytime. Manage from your subscriptions page.</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
