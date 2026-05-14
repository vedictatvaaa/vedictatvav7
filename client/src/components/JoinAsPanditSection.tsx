import { useState, useMemo } from "react";
import { Link } from "wouter";
import { ArrowRight, ShieldCheck, Calendar, IndianRupee, Users, MapPin, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { useI18n } from "@/lib/i18n";

// Average puja value (after platform commission) by city tier.
// Conservative figures sourced from current pandit-portal payouts; the
// number we surface to a prospective karmkandi must be defensible — we
// quote the **net to pandit** (after the 15 % platform commission) so the
// figure on this card matches what they'd see in their first payout.
const CITY_TIERS = [
  { id: "metro", labelEn: "Metro (Delhi, Mumbai, Bengaluru…)", labelHi: "महानगर (दिल्ली, मुंबई, बेंगलुरु…)", net: 2125 },
  { id: "tier2", labelEn: "Tier-2 (Pune, Lucknow, Indore…)",   labelHi: "श्रेणी-2 (पुणे, लखनऊ, इंदौर…)",       net: 1275 },
  { id: "tier3", labelEn: "Tier-3 city / town",                labelHi: "श्रेणी-3 शहर / कस्बा",                net: 680  },
] as const;

type TierId = typeof CITY_TIERS[number]["id"];

export function JoinAsPanditSection() {
  const { language } = useI18n();
  const isHi = language === "hi";

  const [tier, setTier] = useState<TierId>("metro");
  const [pujasPerWeek, setPujasPerWeek] = useState<number>(4);

  const tierObj = CITY_TIERS.find((t) => t.id === tier)!;
  const monthly = useMemo(() => tierObj.net * pujasPerWeek * 4, [tierObj, pujasPerWeek]);
  const yearly = monthly * 12;

  const t = (en: string, hi: string) => (isHi ? hi : en);

  return (
    <section className="py-12 md:py-16 bg-gradient-to-br from-[#FFFAEC] via-[#FBF7EE] to-[#FBF1D8] border-t border-[#D4AF37]/15" data-testid="section-join-as-pandit">
      <div className="container mx-auto px-4">
        {/* Heading */}
        <div className="text-center max-w-2xl mx-auto mb-8 md:mb-10">
          <p className="text-[10px] md:text-xs uppercase tracking-[0.32em] text-[#D4AF37] font-semibold mb-1.5">
            {t("For verified Vedic pandits", "वैदिक पंडितों के लिए")}
          </p>
          <h2 className="font-serif text-2xl md:text-4xl font-bold text-[#3A1018] mb-3 leading-tight">
            {t("Earn with dignity. Serve with shastra.", "गरिमा से अर्जन करें। शास्त्र से सेवा करें।")}
          </h2>
          <p className="text-sm md:text-base text-[#5a4a3a]/80 leading-relaxed">
            {t(
              "Join 500+ karmkandi pandits already earning a steady income on Vedic Tatva. We bring the bookings, payment, and verified yajmans — you bring the shastra.",
              "वैदिक तत्व पर पहले से अर्जन कर रहे 500+ कर्मकांडी पंडितों के साथ जुड़ें। हम बुकिंग, भुगतान एवं सत्यापित यजमान लाते हैं — आप शास्त्र लाते हैं।"
            )}
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 max-w-6xl mx-auto">
          {/* Left — calculator */}
          <Card className="p-5 sm:p-7 border-[#D4AF37]/40 bg-white">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-full bg-[#6D2B35] flex items-center justify-center">
                <IndianRupee className="w-4 h-4 text-[#D4AF37]" />
              </div>
              <p className="text-[10px] uppercase tracking-[0.32em] text-[#6D2B35] font-bold">
                {t("Earnings calculator", "अर्जन कैलकुलेटर")}
              </p>
            </div>
            <h3 className="font-serif text-lg sm:text-xl text-[#3A1018] font-bold mb-5">
              {t("How much can you earn on Vedic Tatva?", "वैदिक तत्व पर आप कितना अर्जित कर सकते हैं?")}
            </h3>

            {/* City tier */}
            <div className="mb-5">
              <label className="block text-xs font-semibold text-[#3A1018] mb-2">
                {t("Your city", "आपका शहर")}
              </label>
              <div className="flex flex-wrap gap-2">
                {CITY_TIERS.map((c) => {
                  const active = c.id === tier;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setTier(c.id)}
                      className={`text-xs px-3 py-2 rounded-md border transition-colors ${active ? "bg-[#6D2B35] text-white border-[#6D2B35]" : "bg-white text-[#3A1018] border-[#D4AF37]/40 hover-elevate"}`}
                      data-testid={`button-tier-${c.id}`}
                    >
                      {isHi ? c.labelHi : c.labelEn}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Pujas per week */}
            <div className="mb-6">
              <div className="flex items-baseline justify-between mb-2">
                <label className="text-xs font-semibold text-[#3A1018]">
                  {t("Pujas per week", "प्रति सप्ताह पूजाएँ")}
                </label>
                <span className="text-sm font-bold text-[#6D2B35]" data-testid="text-pujas-per-week">
                  {pujasPerWeek}
                </span>
              </div>
              <Slider
                value={[pujasPerWeek]}
                onValueChange={(v) => setPujasPerWeek(v[0])}
                min={1}
                max={15}
                step={1}
                data-testid="slider-pujas"
              />
              <div className="flex justify-between text-[10px] text-[#5a4a3a]/60 mt-1.5">
                <span>1 {t("light", "हल्का")}</span>
                <span>5 {t("active", "सक्रिय")}</span>
                <span>15 {t("full-time", "पूर्णकालिक")}</span>
              </div>
            </div>

            {/* Result */}
            <div className="rounded-xl bg-gradient-to-br from-[#3a0d18] via-[#6D2B35] to-[#3a0d18] text-white p-5 mb-3">
              <p className="text-[10px] uppercase tracking-[0.28em] font-semibold text-[#D4AF37] mb-1">
                {t("Estimated monthly net", "अनुमानित मासिक शुद्ध आय")}
              </p>
              <p className="font-serif text-3xl sm:text-4xl font-bold mb-1" data-testid="text-monthly-earnings">
                ₹{monthly.toLocaleString("en-IN")}
              </p>
              <p className="text-xs text-white/70">
                ≈ ₹{yearly.toLocaleString("en-IN")} {t("per year", "प्रति वर्ष")}
                {" · "}
                <span className="text-white/50">{t("after 15% platform fee", "15% प्लेटफॉर्म शुल्क के पश्चात")}</span>
              </p>
            </div>

            <p className="text-[11px] text-[#5a4a3a]/60 leading-relaxed">
              {t(
                "Indicative net payout based on average yajman ticket size in your city tier. Actual earnings depend on availability, ratings and additional services (online pujas, online consultation).",
                "आपके शहर श्रेणी में औसत यजमान टिकट आकार पर आधारित संकेतक शुद्ध भुगतान। वास्तविक आय उपलब्धता, रेटिंग एवं अतिरिक्त सेवाओं (ऑनलाइन पूजा, ऑनलाइन परामर्श) पर निर्भर करती है।"
              )}
            </p>
          </Card>

          {/* Right — value props + CTA */}
          <div className="flex flex-col gap-4">
            <Card className="p-5 sm:p-6 border-[#D4AF37]/40 bg-white">
              <h3 className="font-serif text-lg text-[#3A1018] font-bold mb-4">
                {t("What you get on Vedic Tatva", "वैदिक तत्व पर आपको क्या मिलता है")}
              </h3>
              <ul className="space-y-3.5 text-sm">
                {[
                  { Icon: Calendar, en: "Verified yajman bookings, delivered to your phone — accept what fits your day.", hi: "सत्यापित यजमान बुकिंग — जो आपके दिन में सटे, स्वीकार करें।" },
                  { Icon: IndianRupee, en: "Payment held by Vedic Tatva, released to you within 24 hrs of puja completion. No bargaining.", hi: "भुगतान वैदिक तत्व के पास सुरक्षित — पूजा पूर्ण होने के 24 घंटे में आपको प्राप्त। कोई मोलभाव नहीं।" },
                  { Icon: ShieldCheck, en: "Verified pandit badge after document check. Builds yajman trust and unlocks higher-paying premium bookings.", hi: "दस्तावेज़ जाँच के बाद सत्यापित पंडित बैज — यजमान का विश्वास एवं उच्च-भुगतान वाली बुकिंग।" },
                  { Icon: Video, en: "Optional online puja & consultation slots — earn from yajmans across India and abroad.", hi: "वैकल्पिक ऑनलाइन पूजा एवं परामर्श स्लॉट — भारत एवं विदेश से अर्जन।" },
                  { Icon: MapPin, en: "Travel reimbursement built into the booking price for at-home pujas beyond your base radius.", hi: "घर पर पूजा के लिए आधार त्रिज्या से परे यात्रा भत्ता बुकिंग मूल्य में सम्मिलित।" },
                  { Icon: Users, en: "Direct yajman reviews build your reputation — top-rated pandits get featured on city pages.", hi: "प्रत्यक्ष यजमान समीक्षा से प्रतिष्ठा बनती है — उच्च-रेटेड पंडित शहर पृष्ठों पर प्रदर्शित होते हैं।" },
                ].map(({ Icon, en, hi }, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-[#FBF1D8] border border-[#D4AF37]/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Icon className="w-3.5 h-3.5 text-[#6D2B35]" />
                    </div>
                    <span className="text-[#3A1018] leading-relaxed">{isHi ? hi : en}</span>
                  </li>
                ))}
              </ul>
            </Card>

            <Card className="p-5 sm:p-6 border-0 bg-gradient-to-br from-[#3a0d18] via-[#6D2B35] to-[#a8497a] text-white">
              <h3 className="font-serif text-xl font-bold mb-1">
                {t("Apply to become a Vedic Tatva pandit", "वैदिक तत्व पंडित बनने हेतु आवेदन करें")}
              </h3>
              <p className="text-sm text-white/80 mb-4">
                {t(
                  "5-minute application · KYC check in 48 hrs · First booking within 2 weeks for most cities.",
                  "5 मिनट का आवेदन · 48 घंटे में KYC जाँच · अधिकांश शहरों में 2 सप्ताह में पहली बुकिंग।"
                )}
              </p>
              <div className="flex flex-wrap gap-2">
                <Link href="/become-pandit">
                  <Button size="lg" className="bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-[#4a1a22] font-bold border-0" data-testid="button-apply-pandit">
                    {t("Apply now", "अभी आवेदन करें")}
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
                <Link href="/pandit/login">
                  <Button size="lg" variant="outline" className="bg-white/10 backdrop-blur border-white/30 text-white hover:bg-white/20" data-testid="button-pandit-login">
                    {t("Already a pandit? Sign in", "पहले से पंडित हैं? साइन-इन")}
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
