import { useState } from "react";
import { useRoute, Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import PageSeo from "@/components/PageSeo";
import { person as personSchema } from "@/lib/seo-schemas";
import {
  ArrowLeft, MapPin, Phone, Mail, Star, Clock, Globe, BookOpen,
  Shield, Award, Share2, Calendar, ChevronRight, Copy, Check,
  MessageCircle, Wallet
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import type { Astrologer } from "@shared/schema";
import { getIdentity, identityFetch } from "@/lib/userIdentity";

export default function AstrologerProfile() {
  const [, params] = useRoute("/astrologer/:id");
  const [, setLocation] = useLocation();
  const astrologerId = params?.id ? parseInt(params.id) : 0;
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [startingChat, setStartingChat] = useState(false);

  async function startChat() {
    if (!getIdentity()) {
      toast({ title: "Please sign in to start a chat", variant: "destructive" });
      setLocation("/login");
      return;
    }
    setStartingChat(true);
    try {
      const r = await identityFetch<any>("/api/astrology-sessions", {
        method: "POST",
        body: JSON.stringify({ astrologerId, mode: "chat" }),
      });
      setLocation(`/astrology-session/${r.session.id}`);
    } catch (e: any) {
      if (String(e.message).toLowerCase().includes("recharge")) {
        toast({ title: "Wallet recharge needed", description: "Add funds to start the consultation.", variant: "destructive" });
        setLocation("/wallet");
      } else {
        toast({ title: "Could not start chat", description: e.message, variant: "destructive" });
      }
    } finally { setStartingChat(false); }
  }

  const { data: astrologer, isLoading } = useQuery<Astrologer>({
    queryKey: [`/api/astrologers/${astrologerId}`],
    queryFn: () => fetch(`/api/astrologers/${astrologerId}`).then(r => { if (!r.ok) throw new Error("Not found"); return r.json(); }),
    enabled: astrologerId > 0,
  });

  const profileUrl = typeof window !== "undefined" ? `${window.location.origin}/astrologer/${astrologerId}` : "";

  const shareLinks = {
    whatsapp: `https://wa.me/?text=${encodeURIComponent(`Consult ${astrologer?.name || "Astrologer"} on Vedic Tatva for astrology services: ${profileUrl}`)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(profileUrl)}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(`Get astrology consultation from ${astrologer?.name || "expert"} on @VedicTatva`)}&url=${encodeURIComponent(profileUrl)}`,
  };

  const copyLink = () => {
    navigator.clipboard.writeText(profileUrl);
    setCopied(true);
    toast({ title: "Link Copied!", description: "Profile link copied to clipboard." });
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F5F0E6] flex items-center justify-center">
        <div className="animate-pulse text-[#6D2B35] font-serif text-xl">Loading...</div>
      </div>
    );
  }

  if (!astrologer || !astrologer.verified) {
    return (
      <div className="min-h-screen bg-[#F5F0E6] flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-serif text-2xl text-[#6D2B35] mb-2">Astrologer Not Found</h1>
          <p className="text-[#5a4a3a]/50 mb-4">This profile may have been removed or is no longer available.</p>
          <Link href="/astrology">
            <Button className="bg-[#6D2B35] text-white">Browse Astrologers</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <PageSeo
        title={`${astrologer.name} — Verified Vedic Astrologer in ${astrologer.city} | Vedic Tatva`}
        description={`Consult ${astrologer.name}, a verified Vedic astrologer in ${astrologer.city}. Book authentic kundli, gemstone, vastu and remedy consultations on Vedic Tatva.`}
        ogType="profile"
        ogImage={astrologer.image || undefined}
        canonical={`/astrologer/${astrologer.id}`}
        schemas={[
          personSchema({
            name: astrologer.name,
            jobTitle: "Vedic Astrologer",
            description: astrologer.bio || `Verified Vedic astrologer based in ${astrologer.city}.`,
            image: astrologer.image || undefined,
            url: `/astrologer/${astrologer.id}`,
            worksFor: "Vedic Tatva",
          }),
        ]}
      />
      <div className="bg-[#1a1118] text-white py-8 sm:py-10 relative">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-transparent" />
        <div className="container mx-auto px-4">
          <Link href="/astrology" className="inline-flex items-center gap-1.5 text-white/65 hover:text-white text-[12px] mb-5 transition-colors" data-testid="link-back-astrology">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to astrology
          </Link>

          <div className="flex flex-col sm:flex-row items-start gap-5">
            <div className="relative">
              {astrologer.image ? (
                <img src={astrologer.image} alt={astrologer.name} className="w-24 h-24 sm:w-28 sm:h-28 rounded-md object-cover border border-[#D4AF37]/40" />
              ) : (
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-md bg-white/8 border border-[#D4AF37]/40 flex items-center justify-center">
                  <span className="text-3xl sm:text-4xl font-serif font-semibold text-white/70">{astrologer.name.charAt(0)}</span>
                </div>
              )}
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
                <h1 className="font-serif text-2xl sm:text-3xl font-semibold leading-tight" data-testid="text-astrologer-name">{astrologer.name}</h1>
                {astrologer.verified && (
                  <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.18em] font-semibold text-emerald-300 border border-emerald-400/30 bg-emerald-500/10 rounded-md px-2 py-0.5">
                    <Shield className="w-3 h-3" /> Verified
                  </span>
                )}
              </div>

              <p className="text-white/60 flex items-center gap-1.5 text-[13px] mb-3">
                <MapPin className="w-3.5 h-3.5" /> {astrologer.city}
              </p>

              <div className="flex items-center gap-2 mb-3 text-[12px]">
                <span className="inline-flex items-center gap-1 bg-white/8 border border-white/10 rounded-md px-2.5 py-1">
                  <Star className="w-3.5 h-3.5 text-[#D4AF37] fill-[#D4AF37]" />
                  <span className="font-semibold">{(astrologer.rating ?? 0).toFixed(1)}</span>
                  <span className="text-white/50">({astrologer.reviewCount ?? 0})</span>
                </span>
                <span className="inline-flex items-center gap-1 bg-white/8 border border-white/10 rounded-md px-2.5 py-1">
                  <Clock className="w-3.5 h-3.5 text-white/60" />
                  {astrologer.experience} yrs
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {astrologer.specialization.split(",").map((s, i) => (
                  <span key={i} className="bg-white/8 text-white/75 px-2.5 py-0.5 rounded-md text-[11px] border border-white/10">{s.trim()}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-4">
            {astrologer.bio && (
              <Card className="rounded-lg border border-[#D4AF37]/20 bg-white shadow-none">
                <CardContent className="p-5">
                  <h2 className="font-serif text-base font-semibold text-[#6D2B35] mb-3 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-[#D4AF37]" /> About
                  </h2>
                  <p className="text-[13px] text-[#5a4a3a]/75 leading-relaxed">{astrologer.bio}</p>
                </CardContent>
              </Card>
            )}

            <Card className="rounded-lg border border-[#D4AF37]/20 bg-white shadow-none">
              <CardContent className="p-5">
                <h2 className="font-serif text-base font-semibold text-[#6D2B35] mb-4 flex items-center gap-2">
                  <Award className="w-4 h-4 text-[#D4AF37]" /> Details
                </h2>
                <div className="grid sm:grid-cols-2 gap-px bg-[#D4AF37]/15 rounded-md overflow-hidden border border-[#D4AF37]/15">
                  <div className="flex items-center gap-3 p-3 bg-white">
                    <Globe className="w-4 h-4 text-[#6D2B35]/70" />
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.18em] text-[#5a4a3a]/55">Languages</p>
                      <p className="text-[13px] font-semibold text-[#5a4a3a]">{astrologer.languages}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-white">
                    <Clock className="w-4 h-4 text-[#6D2B35]/70" />
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.18em] text-[#5a4a3a]/55">Experience</p>
                      <p className="text-[13px] font-semibold text-[#5a4a3a]">{astrologer.experience} years</p>
                    </div>
                  </div>
                  {astrologer.certification && (
                    <div className="flex items-center gap-3 p-3 bg-white">
                      <Award className="w-4 h-4 text-[#6D2B35]/70" />
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.18em] text-[#5a4a3a]/55">Certification</p>
                        <p className="text-[13px] font-semibold text-[#5a4a3a]">{astrologer.certification}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-3 p-3 bg-white">
                    <Star className="w-4 h-4 text-[#6D2B35]/70" />
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.18em] text-[#5a4a3a]/55">Specializations</p>
                      <p className="text-[13px] font-semibold text-[#5a4a3a]">{astrologer.specialization}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card className="rounded-lg border border-[#D4AF37]/30 bg-white shadow-none sticky top-4">
              <CardContent className="p-5">
                <div className="text-center mb-4 pb-4 border-b border-[#D4AF37]/15">
                  <p className="text-[10px] uppercase tracking-[0.3em] font-semibold text-[#D4AF37] mb-1">Consultation fee</p>
                  <p className="text-3xl font-serif font-semibold text-[#6D2B35] leading-none">₹{astrologer.fees?.toLocaleString("en-IN")}</p>
                  <p className="text-[11px] text-[#5a4a3a]/55 mt-1">per session (~30 min)</p>
                  {astrologer.fees ? (
                    <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#FBF7EE] border border-[#D4AF37]/25">
                      <Clock className="w-3 h-3 text-[#6D2B35]/70" />
                      <span className="text-[11px] text-[#5a4a3a]/80">
                        Approx <span className="font-semibold text-[#6D2B35]">₹{Math.max(1, Math.round(astrologer.fees / 30)).toLocaleString("en-IN")}/min</span>
                      </span>
                    </div>
                  ) : null}
                </div>

                {/* Live consultation block */}
                <div className="mb-3 p-3 rounded-md bg-[#FBF7EE] border border-[#D4AF37]/30">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-[11px] uppercase tracking-[0.18em] font-semibold text-[#6D2B35]">Live consultation</div>
                    {(astrologer as any).online ? (
                      <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px] h-5 gap-1">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" /> Online
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] h-5 text-[#5a4a3a]">Offline</Badge>
                    )}
                  </div>
                  <Button
                    onClick={startChat}
                    disabled={startingChat || !(astrologer as any).online || !(astrologer as any).acceptingChat}
                    className="w-full bg-[#6D2B35] hover:bg-[#5a2430] text-white rounded-md h-10 text-[13px] font-semibold gap-1.5"
                    data-testid="btn-start-chat"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    {startingChat ? "Connecting..." : `Start Chat · ₹${(((astrologer as any).chatRatePaisePerMin ?? 1500) / 100).toFixed(0)}/min`}
                  </Button>
                  <Button
                    disabled
                    variant="outline"
                    className="w-full mt-2 rounded-md h-9 text-[12px] gap-1.5"
                    data-testid="btn-call-coming"
                  >
                    <Phone className="w-3.5 h-3.5" /> Voice call · launching soon
                  </Button>
                  <Link href="/wallet">
                    <button className="w-full mt-2 flex items-center justify-center gap-1 text-[11px] text-[#6D2B35] hover:underline" data-testid="link-wallet">
                      <Wallet className="w-3 h-3" /> Top up wallet
                    </button>
                  </Link>
                  <div className="text-[10px] text-[#5a4a3a] mt-2 text-center">First 5 minutes FREE for new users</div>
                </div>

                <Link href={`/astrology?astrologer=${astrologer.id}`}>
                  <Button variant="outline" className="w-full rounded-md h-9 text-[12px] font-semibold gap-1.5" data-testid="btn-book-astrologer">
                    <Calendar className="w-3.5 h-3.5" /> Or book scheduled session
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>

                {astrologer.phone && (
                  <a href={`tel:${astrologer.phone}`} className="mt-2.5 w-full flex items-center justify-center gap-1.5 h-9 border border-[#D4AF37]/30 rounded-md text-[12px] font-semibold text-[#6D2B35] hover:bg-[#FBF7EE] transition-colors" data-testid="btn-call-astrologer">
                    <Phone className="w-3.5 h-3.5" /> Call now
                  </a>
                )}

                {astrologer.email && (
                  <a href={`mailto:${astrologer.email}`} className="mt-2 w-full flex items-center justify-center gap-1.5 h-9 border border-[#D4AF37]/30 rounded-md text-[12px] font-semibold text-[#6D2B35] hover:bg-[#FBF7EE] transition-colors" data-testid="btn-email-astrologer">
                    <Mail className="w-3.5 h-3.5" /> Email
                  </a>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-lg border border-[#D4AF37]/20 bg-white shadow-none">
              <CardContent className="p-4">
                <h3 className="font-serif text-[13px] font-semibold text-[#6D2B35] mb-2.5 flex items-center gap-1.5">
                  <Share2 className="w-3.5 h-3.5 text-[#D4AF37]" /> Share profile
                </h3>
                <div className="grid grid-cols-2 gap-1.5">
                  <a href={shareLinks.whatsapp} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center h-8 border border-[#D4AF37]/20 text-[#5a4a3a] rounded-md text-[11px] font-semibold hover:bg-[#FBF7EE] transition-colors" data-testid="btn-share-whatsapp">WhatsApp</a>
                  <a href={shareLinks.facebook} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center h-8 border border-[#D4AF37]/20 text-[#5a4a3a] rounded-md text-[11px] font-semibold hover:bg-[#FBF7EE] transition-colors" data-testid="btn-share-facebook">Facebook</a>
                  <a href={shareLinks.twitter} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center h-8 border border-[#D4AF37]/20 text-[#5a4a3a] rounded-md text-[11px] font-semibold hover:bg-[#FBF7EE] transition-colors" data-testid="btn-share-twitter">X / Twitter</a>
                  <button onClick={copyLink} className="flex items-center justify-center gap-1 h-8 border border-[#D4AF37]/20 text-[#5a4a3a] rounded-md text-[11px] font-semibold hover:bg-[#FBF7EE] transition-colors" data-testid="btn-copy-link">
                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copied ? "Copied" : "Copy link"}
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
