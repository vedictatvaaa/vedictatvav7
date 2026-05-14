import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Search, Flame, Leaf, Star, ShoppingBag, Gem, HandMetal, ExternalLink, Heart, Award, ShieldCheck, Sparkles } from "lucide-react";
import PageAPlusContent from "@/components/PageAPlusContent";
import PageSeo from "@/components/PageSeo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import type { Product } from "@shared/schema";
import { useCart } from "@/lib/cart";
import { useWishlist } from "@/lib/wishlist";
import { useToast } from "@/hooks/use-toast";
import { getProductUrl } from "@/lib/utils";
import { IncenseSmoke } from "@/components/IncenseSmoke";

const categoryData = [
  { name: "Dhoti & Kurta", icon: Flame, color: "from-amber-500 to-orange-600", description: "Traditional spiritual clothing", image: "👔" },
  { name: "Puja Samagri", icon: HandMetal, color: "from-red-500 to-rose-600", description: "Complete puja kits & daily essentials", image: "🕉️" },
  { name: "Rudraksha", icon: Gem, color: "from-amber-700 to-yellow-600", description: "Certified natural Rudraksha beads", image: "📿" },
  { name: "Idols & Murtis", icon: Star, color: "from-yellow-500 to-amber-500", description: "Handcrafted brass & marble murtis", image: "🙏" },
  { name: "Wearables", icon: Leaf, color: "from-emerald-500 to-teal-600", description: "Yantras, malas & spiritual accessories", image: "🧿" },
  { name: "Havan Samagri", icon: Flame, color: "from-orange-600 to-red-500", description: "Sacred havan ingredients & kits", image: "🔥" },
  { name: "Brass & Copperware", icon: Star, color: "from-amber-600 to-yellow-700", description: "Pooja diyas, bells, lotas & thalis", image: "🪔" },
];

const categoryCards = [
  { name: "Rudraksha", image: "/attached_assets/category_cards/rudraksha.png", description: "Sacred seeds for spiritual energy & protection" },
  { name: "Dhoti & Kurta", image: "/attached_assets/category_cards/dhoti_kurta.png", description: "Traditional spiritual clothing" },
  { name: "Puja Samagri", image: "/attached_assets/category_cards/puja_samagri.png", description: "Complete essentials for daily rituals" },
  { name: "Havan Samagri", image: "/attached_assets/category_cards/havan_samagri.png", description: "Premium ingredients for sacred fire ceremonies" },
  { name: "Idols & Murtis", image: "/attached_assets/category_cards/idols.png", description: "Handcrafted divine statues & figurines" },
  { name: "Wearables", image: "/attached_assets/category_cards/wearables.png", description: "Spiritual bracelets, malas & accessories" },
  { name: "Brass & Copperware", image: "/attached_assets/category_cards/brass_copperware.png", description: "Pooja diyas, bells, lotas, thalis & more" },
];

export default function SpiritualEssentials() {
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { toast } = useToast();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  try { sessionStorage.setItem("lastShopPage", "/spiritual-essentials"); } catch {}

  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products", activeCategory],
    queryFn: () => fetch(`/api/products${activeCategory ? `?category=${encodeURIComponent(activeCategory)}` : ""}`).then(r => r.json()),
  });

  const filtered = products?.filter(p =>
    searchQuery === "" || p.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="w-full pb-20">
      <PageSeo
        title="Spiritual Essentials Online — Certified Rudraksha, Navaratna Gemstones, Malas, Yantras & Puja Samagri | Vedic Tatva"
        description="Buy authentic Hindu spiritual essentials online — X-ray certified rudraksha (1-mukhi to 14-mukhi from Nepal & Indonesia), lab-tested navaratna gemstones (Manik/Ruby, Moti/Pearl, Moonga/Coral, Panna/Emerald, Pukhraj/Yellow Sapphire, Neelam/Blue Sapphire, Gomed/Hessonite, Lehsuniya/Cat's Eye, Heera/Diamond), tulsi/sphatik/sandalwood japa malas, energised yantras (Sri Yantra, Mahamrityunjaya, Kuber), brass deepak, dakshinavarti shankha, ghanti, parad shivling, complete puja samagri & havan kits."
        keywords="buy rudraksha online, 1 mukhi rudraksha price, 5 mukhi rudraksha, gauri shankar rudraksha, nepali rudraksha, indonesian rudraksha, rudraksha mala 108 beads, x-ray certified rudraksha, navaratna gemstone, certified gemstone online, ruby manik online, pearl moti, red coral moonga, emerald panna, yellow sapphire pukhraj, blue sapphire neelam, hessonite gomed, cat's eye lehsuniya, lab certified gemstone, tulsi mala, sphatik mala, sandalwood japa mala, sri yantra, mahamrityunjaya yantra, kuber yantra, vyapar vridhi yantra, vastu yantra, navagraha yantra, energised yantra online, brass deepak, samai deepak, dakshinavarti shankha, vamavarti lakshmi shankha, puja ghanti, aarti thali, parad shivling, panchaloha murti, brass idols, marble murti, complete puja samagri kit, havan samagri online, dhoti kurta online, dharan vidhi"
        canonical="/spiritual-essentials"
        ogType="website"
        twitterCard="summary_large_image"
      />
      <div className="bg-gradient-to-br from-primary via-primary/95 to-primary/80 text-primary-foreground py-16 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-secondary/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl"></div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="text-secondary font-medium tracking-wider uppercase text-sm">Authentic & Premium</span>
            <h1 className="text-4xl md:text-5xl font-serif mt-3 mb-4">Spiritual Essentials</h1>
            <p className="text-primary-foreground/80 max-w-2xl mx-auto font-light text-lg">
              Curated collection of authentic spiritual products for your daily rituals and sacred ceremonies.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4">
        <div className="py-12">
          <h2 className="text-2xl font-serif text-primary mb-2 text-center">Browse by Category</h2>
          <p className="text-muted-foreground text-center mb-8">Choose a category to explore our collection</p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categoryData.map((cat, i) => (
              <motion.div key={cat.name} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                <Card 
                  className={`group cursor-pointer border transition-all duration-300 text-center p-5 flex flex-col items-center justify-center h-full hover:shadow-lg ${
                    activeCategory === cat.name 
                      ? "border-secondary bg-secondary/5 shadow-lg ring-2 ring-secondary/20" 
                      : "border-border/50 bg-white hover:border-secondary/30"
                  }`}
                  onClick={() => setActiveCategory(activeCategory === cat.name ? null : cat.name)}
                  data-testid={`card-category-${cat.name.toLowerCase().replace(/ & /g, "-").replace(/ /g, "-")}`}
                >
                  <div className={`relative w-14 h-14 rounded-full bg-gradient-to-br ${cat.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300 shadow-md overflow-hidden`}>
                    {cat.name === "Puja Samagri" ? (
                      <>
                        <img
                          src="/attached_assets/category_cards/puja_samagri.png"
                          alt="Puja Samagri"
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                        <IncenseSmoke />
                      </>
                    ) : (
                      <cat.icon className="h-7 w-7 text-[#6D2B35]" />
                    )}
                  </div>
                  <h3 className="font-serif text-sm text-primary font-semibold leading-tight">{cat.name}</h3>
                  <p className="text-muted-foreground text-[11px] mt-1 leading-tight hidden md:block">{cat.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-r from-[#232F3E] via-[#37475A] to-[#232F3E] rounded-2xl p-6 md:p-8 mb-12 shadow-xl">
          <div className="text-center mb-6">
            <h3 className="text-white text-xl md:text-2xl font-serif mb-2">Also Available On</h3>
            <p className="text-white/60 text-sm">Shop our products on your favourite platforms</p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10">
            <a href="https://amazon.in" target="_blank" rel="noopener noreferrer" className="group" data-testid="link-amazon">
              <div className="bg-white rounded-xl px-4 py-3 flex items-center gap-3 shadow-md hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                <img src="/images/logo-amazon.png" alt="Amazon India" className="h-10 w-auto object-contain" data-testid="img-logo-amazon" />
                <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-[#FF9900] transition-colors" />
              </div>
            </a>
            <a href="https://blinkit.com" target="_blank" rel="noopener noreferrer" className="group" data-testid="link-blinkit">
              <div className="bg-white rounded-xl px-4 py-3 flex items-center gap-3 shadow-md hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                <img src="/images/logo-blinkit.png" alt="Blinkit" className="h-10 w-auto object-contain" data-testid="img-logo-blinkit" />
                <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-[#F8C51C] transition-colors" />
              </div>
            </a>
            <a href="https://www.swiggy.com/instamart" target="_blank" rel="noopener noreferrer" className="group" data-testid="link-swiggy">
              <div className="bg-white rounded-xl px-4 py-3 flex items-center gap-3 shadow-md hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                <img src="/images/logo-swiggy-instamart.png" alt="Swiggy Instamart" className="h-10 w-auto object-contain" data-testid="img-logo-swiggy" />
                <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-[#FC8019] transition-colors" />
              </div>
            </a>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-serif text-primary">
              {activeCategory ? activeCategory : "All Products"}
            </h2>
            <p className="text-muted-foreground text-sm mt-1">
              {activeCategory 
                ? categoryData.find(c => c.name === activeCategory)?.description 
                : "Showing all spiritual essentials"}
            </p>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search products..." 
                className="pl-9 rounded-full bg-white border-border" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-testid="input-search-essentials" 
              />
            </div>
            {activeCategory && (
              <Button 
                variant="outline" 
                className="rounded-full border-secondary text-secondary hover:bg-secondary hover:text-primary"
                onClick={() => setActiveCategory(null)}
                data-testid="btn-clear-filter"
              >
                Clear
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
          {isLoading ? Array(8).fill(0).map((_, i) => (
            <div key={i} className="bg-white p-3 rounded-xl border border-border/50">
              <Skeleton className="aspect-square rounded-lg mb-4" />
              <Skeleton className="h-5 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2 mb-4" />
              <Skeleton className="h-8 w-full" />
            </div>
          )) : filtered.map((product) => {
            const isOutOfStock = product.stock === 0;
            return (
              <motion.div 
                key={product.id} 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }}
                className={`group cursor-pointer bg-white p-3 rounded-xl border border-border/50 subtle-shadow hover:shadow-lg transition-all duration-300 ${isOutOfStock ? "opacity-80" : ""}`}
                data-testid={`card-product-${product.id}`}
              >
                <Link href={getProductUrl(product.id, product.name)}>
                  <div className="aspect-square bg-muted rounded-lg overflow-hidden mb-4 relative">
                    <img 
                      src={product.image} 
                      alt={product.name} 
                      className={`w-full h-full object-cover mix-blend-multiply transition-transform duration-500 ${isOutOfStock ? "grayscale-[30%]" : "group-hover:scale-105"}`}
                      data-testid={`img-product-${product.id}`}
                    />
                    <button
                      className={`absolute top-2 right-2 p-1.5 rounded-full bg-white/80 hover:bg-white transition-colors z-10 ${isInWishlist(product.id) ? 'text-red-500' : 'text-gray-400'}`}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (isInWishlist(product.id)) {
                          removeFromWishlist(product.id);
                        } else {
                          addToWishlist(product);
                        }
                      }}
                      data-testid={`btn-wishlist-${product.id}`}
                    >
                      <Heart className={`h-4 w-4 ${isInWishlist(product.id) ? 'fill-current' : ''}`} />
                    </button>
                    {isOutOfStock && (
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <span className="bg-red-600 text-white text-sm font-bold px-4 py-2 rounded-lg uppercase tracking-wider shadow-lg" data-testid={`status-out-of-stock-${product.id}`}>
                          Out of Stock
                        </span>
                      </div>
                    )}
                    {product.badge && (
                      <div className={`absolute top-3 left-3 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider shadow-sm ${
                        product.badge === "Amazon Choice" 
                          ? "bg-[#232F3E] text-[#FF9900]" 
                          : "bg-secondary text-primary"
                      }`}>
                        {product.badge}
                      </div>
                    )}
                    {!isOutOfStock && product.stock > 0 && product.stock < 10 && (
                      <div className="absolute bottom-3 left-3 bg-destructive text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">
                        Only {product.stock} left
                      </div>
                    )}
                    <div className="absolute top-10 right-3 bg-white/90 backdrop-blur text-muted-foreground text-[10px] px-2 py-1 rounded-full">
                      {product.category}
                    </div>
                  </div>
                  <h3 className="font-serif text-lg text-primary mb-1 line-clamp-1" data-testid={`text-product-name-${product.id}`}>{product.name}</h3>
                </Link>
                <div className="px-2">
                  <p className="text-muted-foreground text-sm mb-3 line-clamp-2">{product.description}</p>
                  <div className="flex justify-between items-center mt-auto">
                    <span className={`font-bold text-lg ${isOutOfStock ? "text-muted-foreground line-through" : "text-foreground"}`}>₹{product.price.toLocaleString()}</span>
                    {isOutOfStock ? (
                      <Button size="sm" variant="outline" className="rounded-full border-muted-foreground/30 text-muted-foreground cursor-not-allowed" disabled data-testid={`btn-notify-product-${product.id}`}>
                        Notify Me
                      </Button>
                    ) : (
                      <Button size="sm" className="bg-primary text-white hover:bg-primary/90 rounded-full" data-testid={`btn-add-product-${product.id}`} onClick={() => { addToCart(product); toast({ title: "Added to cart", description: `${product.name} has been added to your cart.` }); }}>
                        Add to Cart
                      </Button>
                    )}
                  </div>
                  {product.salesCount > 50 && (
                    <p className="text-xs text-secondary mt-2 font-medium">{product.salesCount.toLocaleString()}+ sold</p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {!isLoading && filtered.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">
            <ShoppingBag className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg">No products found in this category.</p>
            <Button variant="outline" className="mt-4 rounded-full" onClick={() => { setActiveCategory(null); setSearchQuery(""); }}>
              Browse All Products
            </Button>
          </div>
        )}

        <div className="py-16 mt-8">
          <div className="text-center mb-10">
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="h-px w-8 bg-secondary" />
              <span className="text-secondary text-[11px] uppercase tracking-[0.3em] font-medium">Browse</span>
              <div className="h-px w-8 bg-secondary" />
            </div>
            <h2 className="text-2xl md:text-3xl font-serif text-primary">Also Available</h2>
            <p className="text-muted-foreground text-sm mt-2">Explore more categories from our collection</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-4 sm:gap-6 max-w-4xl mx-auto">
            {categoryCards.map((cat, i) => (
              <motion.div
                key={cat.name}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
                onClick={() => {
                  setActiveCategory(cat.name);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="group cursor-pointer"
                data-testid={`also-available-card-${cat.name.toLowerCase().replace(/ & /g, "-").replace(/ /g, "-")}`}
              >
                <div className="relative bg-white rounded-2xl overflow-hidden border border-border/50 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 hover:-translate-y-1">
                  <div className="aspect-square overflow-hidden relative bg-muted/30">
                    <img
                      src={cat.image}
                      alt={cat.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                    />
                    {cat.name === "Puja Samagri" && <IncenseSmoke />}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                  </div>
                  <div className="px-3 py-2.5 bg-white">
                    <h3 className="font-serif text-primary text-sm sm:text-base font-bold leading-tight">{cat.name}</h3>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-[10px] sm:text-xs text-muted-foreground line-clamp-1">{cat.description}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <PageAPlusContent
          eyebrow="Why Choose Vedic Tatva Spiritual Essentials"
          title="Curated Spiritual Essentials — Rudraksha, Gemstones, Malas & Sacred Items"
          intro="Beyond daily puja samagri, Vedic Tatva offers carefully curated spiritual essentials for sadhana — certified rudraksha, lab-tested gemstones (navaratna), tulsi and sphatik malas, energised yantras, conch (shankha), bell (ghanti), brass deepak and parad (mercury) items. Every essential is sourced for authenticity and prepared for serious sadhakas."
          trustBadges={[
            { value: "Lab", label: "Certified" },
            { value: "Energised", label: "Properly" },
            { value: "Shastra", label: "Compliant" },
            { value: "Trusted", label: "By Pandits" },
          ]}
          benefits={[
            { icon: Gem, title: "Lab-Certified Gemstones", body: "Navaratna (9 gems) and individual stones — ruby (Manik), pearl (Moti), red coral (Moonga), emerald (Panna), yellow sapphire (Pukhraj), diamond (Heera), blue sapphire (Neelam), hessonite (Gomed), cat's eye (Lehsuniya) — with lab certificate and shastra-correct dharan vidhi." },
            { icon: Award, title: "Authentic Rudraksha", body: "Curated rudraksha from Nepal and Indonesia (1-mukhi through higher mukhis as available), supplied with X-ray verification certificates. Each bead's mukhi count and origin documented — not coloured or painted lookalikes." },
            { icon: HandMetal, title: "Tulsi, Sphatik & Sandal Malas", body: "108-bead japa malas for mantra chanting — tulsi (Vaishnava), rudraksha (Shaiva), sphatik (Devi/clarity), sandalwood (calming), red coral (Mangal), with proper meru (head bead)." },
            { icon: Sparkles, title: "Energised Yantras", body: "Brass and copper yantras — Sri Yantra, Mahamrityunjaya, Kuber, Vyapar Vridhi, Vastu, Navagraha — energised with proper mantras and pranapratishtha before despatch." },
            { icon: Flame, title: "Brass Deepak, Shankha & Ghanti", body: "Traditional samai deepak, hanging diya, panchapatra, shankha (left-handed Lakshmi shankha), ghanti and aarti thali — solid brass with traditional finish." },
            { icon: ShieldCheck, title: "Sadhaka-Trusted Quality", body: "Items used and recommended by traditional pandits, sadhakas and acharyas — quality you can trust for serious daily sadhana, not décor." },
          ]}
          steps={[
            { title: "Identify Your Sadhana", body: "Choose by deity (Vishnu, Shiva, Devi, Ganesh, Hanuman), goal (peace, wealth, marriage, health) or specific mantra/sadhana you practise." },
            { title: "Pick Authenticated Items", body: "Filter by certified rudraksha, lab-tested gemstones, energised yantras or pure-metal puja items. Read the source and shastra reference on each product." },
            { title: "Receive With Care", body: "Items arrive carefully packed with care instructions, dharan vidhi (for malas/rudraksha/gemstones) and recommended mantras." },
            { title: "Begin Daily Practice", body: "Wear, install or chant as per the included guide. Reach out to our pandits if you need a personalised pranapratishtha or activation puja." },
          ]}
          faqs={[
            { q: "How do I know if my rudraksha is authentic?", a: "Authentic rudraksha has natural mukhis (faces) visible without colouring, sinks in water (most varieties), shows internal compartments equal to mukhi count on X-ray. Every rudraksha from Vedic Tatva includes an X-ray certificate showing the internal mukhi structure — the most reliable test for authenticity." },
            { q: "Are the gemstones real and certified?", a: "Yes — every gemstone (Manik/Ruby, Moti/Pearl, Moonga/Coral, Panna/Emerald, Pukhraj/Yellow Sapphire, Neelam/Blue Sapphire, Gomed/Hessonite, Lehsuniya/Cat's Eye, Heera/Diamond) comes with a lab certificate from a recognised gem testing laboratory specifying carat, treatment and natural origin." },
            { q: "Should I get my gemstone or rudraksha checked by an astrologer first?", a: "Strongly recommended — wearing wrong gemstones can cause more harm than benefit. Consult a Vedic Tatva astrologer with your kundli before purchasing planetary gemstones (especially Neelam, Pukhraj, Gomed). For rudraksha, certain mukhis suit specific birth nakshatras." },
            { q: "What is the difference between tulsi, rudraksha, sphatik and sandalwood mala?", a: "Tulsi mala — for Vaishnava (Vishnu, Krishna, Ram) mantras and devotion. Rudraksha mala — for Shaiva (Shiva, Mahamrityunjaya) mantras and meditation. Sphatik (crystal) — for Devi mantras, mental clarity and Saraswati sadhana. Sandalwood (chandan) — calming, for general japa. Red coral (Munga) — for Mangal Beej mantra." },
            { q: "How are your yantras prepared?", a: "Each yantra is engraved on copper or brass following dimensional precision from yantra shastra. Energised yantras are listed separately and ship with details of the pranapratishtha performed (mantra and repetitions). For maximum benefit, devotees are encouraged to perform a personal sthapana puja at home as well." },
            { q: "What is a left-handed Lakshmi shankha and is it real?", a: "A natural left-handed (Vamavarti) shankha is rare and considered very auspicious for Lakshmi puja and home prosperity. Most shankhas are right-handed (Dakshinavarti). We sell only natural shankhas with documentation — never resin or fibre lookalikes." },
            { q: "Do I need a special vidhi to start using a rudraksha or gemstone?", a: "Yes — both have proper dharan vidhi. Rudraksha is typically energised on a Monday (Shiva's day) with the Mahamrityunjaya or rudraksha bija mantra. Gemstones are worn on the day ruled by the corresponding planet (Yellow Sapphire on Thursday for Jupiter, etc.). Each product ships with detailed vidhi instructions." },
            { q: "Are these items suitable for daily home sadhana?", a: "Yes — every spiritual essential we curate is intended for active sadhana, not décor. Whether it's a 1-mukhi rudraksha, sphatik mala, Sri Yantra or pancha-loha murti — these are tools to support your daily japa, dhyana and puja practice with proper sanctity." },
          ]}
          keywordsBlurb="Curated Hindu spiritual essentials — certified rudraksha (1-mukhi, 5-mukhi, Gauri Shankar, 14-mukhi from Nepal and Indonesia with X-ray certificate), lab-tested navaratna gemstones (Manik, Moti, Moonga, Panna, Pukhraj, Heera, Neelam, Gomed, Lehsuniya), tulsi mala for Vaishnava sadhana, sphatik mala for Devi mantra, sandalwood japa mala. Energised yantras (Sri Yantra, Mahamrityunjaya, Kuber, Vyapar Vridhi, Navagraha, Vastu), brass and pancha-loha murtis, dakshinavarti and vamavarti shankha, samai deepak, ghanti, parad shivling. Authentic items for serious sadhakas, daily puja and dharan vidhi."
        />
      </div>
    </div>
  );
}
