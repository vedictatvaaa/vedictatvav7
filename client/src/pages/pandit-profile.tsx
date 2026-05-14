import { useEffect, useMemo, useRef, useState } from "react";
import { useRoute, Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import PageSeo from "@/components/PageSeo";
import { person as personSchema } from "@/lib/seo-schemas";
import {
  ArrowLeft, MapPin, Star, Clock, Globe, BookOpen,
  Shield, Award, Share2, Calendar, ChevronRight, Crown, Copy, Check, BadgeCheck, TimerReset, MessageCircle, Sparkles, Lock, Paperclip, Send, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import type { Pandit, PanditReview, PanditChat } from "@shared/schema";

export default function PanditProfile() {
  const [, paramsId] = useRoute("/pandit/:id");
  const [, paramsSlug] = useRoute("/p/:slug");
  const slug = paramsSlug?.slug;
  const { toast } = useToast();
  const { user, requireAuth } = useAuth();
  const [, setLocation] = useLocation();
  const [copied, setCopied] = useState(false);
  const [messageDraft, setMessageDraft] = useState("");
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Resolve pandit either by slug (/p/:slug) or by id (/pandit/:id).
  const { data: pandit, isLoading } = useQuery<Pandit>({
    queryKey: slug ? ["/api/pandits/public", slug] : ["/api/pandits", paramsId?.id],
    queryFn: async () => {
      const url = slug
        ? `/api/pandits/public/${encodeURIComponent(slug)}`
        : `/api/pandits/${paramsId?.id}`;
      const r = await fetch(url);
      if (!r.ok) throw new Error("Not found");
      return r.json();
    },
    enabled: !!(slug || paramsId?.id),
  });

  const panditId = pandit?.id ?? 0;

  const { data: reviews } = useQuery<PanditReview[]>({
    queryKey: ["/api/pandit-reviews", panditId],
    queryFn: () => fetch(`/api/pandit-reviews/${panditId}`).then(r => r.json()),
    enabled: panditId > 0,
  });

  // Live private chat — polls every 5s while authenticated and viewing.
  const { data: chats = [] } = useQuery<PanditChat[]>({
    queryKey: ["/api/pandit-profile/messages", panditId, user?.email],
    queryFn: async () => {
      const r = await fetch(`/api/pandit-profile/${panditId}/messages?email=${encodeURIComponent(user!.email)}`, {
        headers: { "x-user-email": user!.email },
      });
      if (!r.ok) return [];
      return r.json();
    },
    enabled: panditId > 0 && !!user?.email,
    refetchInterval: 5000,
  });

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [chats.length]);

  const profileUrl = typeof window !== "undefined"
    ? `${window.location.origin}${pandit?.slug ? `/p/${pandit.slug}` : `/pandit/${panditId}`}`
    : "";

  const keywords = useMemo(() => [
    pandit?.name,
    pandit?.city && `${pandit.city} pandit`,
    pandit?.specialization,
    pandit?.regionalOrigin && `${pandit.regionalOrigin} pandit`,
    "book pandit online",
    "verified pandit",
    "Vedic Tatva",
  ].filter(Boolean).join(", "), [pandit]);

  const shareLinks = {
    whatsapp: `https://wa.me/?text=${encodeURIComponent(`Book ${pandit?.name || "Pandit"} on Vedic Tatva for puja services: ${profileUrl}`)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(profileUrl)}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(`Book ${pandit?.name || "Pandit"} for authentic Vedic puja services on @VedicTatva`)}&url=${encodeURIComponent(profileUrl)}`,
  };

  const handleSendMessage = async () => {
    if (!messageDraft.trim() || !user?.email) return;
    setSending(true);
    try {
      const res = await fetch(`/api/pandit-profile/${panditId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-email": user.email },
        body: JSON.stringify({
          message: messageDraft,
          attachmentUrl: attachmentUrl || undefined,
          identityEmail: user.email,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Message failed");
      setMessageDraft("");
      setAttachmentUrl("");
      queryClient.invalidateQueries({ queryKey: ["/api/pandit-profile/messages", panditId, user.email] });
      if (data.sanitized) {
        toast({
          title: "Contact details hidden",
          description: "Phone numbers, emails and links are removed automatically. Please use in-app booking and chat.",
        });
      } else {
        toast({ title: "Message sent", description: "Your message is delivered privately." });
      }
    } catch (e: any) {
      toast({ title: "Could not send", description: e?.message || "Please try again.", variant: "destructive" });
    } finally {
      setSending(false);
    }
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

  if (!pandit || !pandit.verified) {
    return (
      <div className="min-h-screen bg-[#F5F0E6] flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-serif text-2xl text-[#6D2B35] mb-2">Pandit Not Found</h1>
          <p className="text-[#5a4a3a]/50 mb-4">This profile may have been removed or is no longer available.</p>
          <Link href="/pandits">
            <Button className="bg-[#6D2B35] text-white">Browse Pandits</Button>
          </Link>
        </div>
      </div>
    );
  }

  const isBoosted = pandit.boostActive && pandit.boostEndDate && new Date(pandit.boostEndDate) > new Date();
  const trustSignals = [
    { icon: Shield, label: "Verified" },
    { icon: BadgeCheck, label: "Profile reviewed" },
    { icon: TimerReset, label: "Fast response" },
    { icon: Lock, label: "Private chat" },
  ];
  const highlights = [
    "Transparent pricing",
    "Language matched",
    "Booked 100% in-app",
    "Contact details stay private",
  ];

  return (
    <div className="min-h-screen bg-white">
      <PageSeo
        title={`${pandit.name} — Verified Pandit in ${pandit.city} | Book Puja, Havan & Samskara | Vedic Tatva`}
        description={`Book ${pandit.name}, a verified Vedic pandit in ${pandit.city}, for puja, havan, griha pravesh, wedding, pind daan, and samskara ceremonies through Vedic Tatva.`}
        ogType="profile"
        ogImage={pandit.image || undefined}
        canonical={pandit?.slug ? `/p/${pandit.slug}` : `/pandit/${pandit.id}`}
        schemas={[
          personSchema({
            name: pandit.name,
            jobTitle: "Vedic Pandit",
            description: pandit.bio || `Verified Vedic pandit based in ${pandit.city}. Book for puja, havan, griha pravesh, wedding, pind daan, and samskara services.`,
            image: pandit.image || undefined,
            url: pandit?.slug ? `/p/${pandit.slug}` : `/pandit/${pandit.id}`,
            worksFor: "Vedic Tatva",
          }),
        ]}
      />
      <div className="bg-[#6D2B35] text-white py-8 sm:py-10 relative">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-transparent" />
        <div className="container mx-auto px-4">
          <Link href="/pandits" className="inline-flex items-center gap-1.5 text-white/65 hover:text-white text-[12px] mb-5 transition-colors" data-testid="link-back-pandits">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to pandit directory
          </Link>

          <div className="flex flex-col sm:flex-row items-start gap-5">
            <div className="relative">
              {pandit.image ? (
                <img src={pandit.image} alt={pandit.name} className="w-24 h-24 sm:w-28 sm:h-28 rounded-md object-cover border border-[#D4AF37]/40" />
              ) : (
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-md bg-white/8 border border-[#D4AF37]/40 flex items-center justify-center">
                  <span className="text-3xl sm:text-4xl font-serif font-semibold text-white/70">{pandit.name.charAt(0)}</span>
                </div>
              )}
              {isBoosted && (
                <div className="absolute -top-1.5 -right-1.5 bg-[#D4AF37] text-[#6D2B35] rounded-md p-1">
                  <Crown className="w-3 h-3" />
                </div>
              )}
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
                <h1 className="font-serif text-2xl sm:text-3xl font-semibold leading-tight" data-testid="text-pandit-name">{pandit.name}</h1>
                {pandit.verified && (
                  <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.18em] font-semibold text-emerald-300 border border-emerald-400/30 bg-emerald-500/10 rounded-md px-2 py-0.5">
                    <Shield className="w-3 h-3" /> Verified
                  </span>
                )}
                {isBoosted && (
                  <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.18em] font-semibold text-[#D4AF37] border border-[#D4AF37]/40 bg-[#D4AF37]/10 rounded-md px-2 py-0.5">
                    <Crown className="w-3 h-3" /> Premium
                  </span>
                )}
              </div>

              <p className="text-white/60 flex items-center gap-1.5 text-[13px] mb-3">
                <MapPin className="w-3.5 h-3.5" /> {pandit.city}
              </p>

              <div className="flex items-center gap-2 mb-3 text-[12px]">
                <span className="inline-flex items-center gap-1 bg-white/8 border border-white/10 rounded-md px-2.5 py-1">
                  <Star className="w-3.5 h-3.5 text-[#D4AF37] fill-[#D4AF37]" />
                  <span className="font-semibold">{(pandit.rating ?? 0).toFixed(1)}</span>
                  <span className="text-white/50">({pandit.reviewCount ?? 0})</span>
                </span>
                <span className="inline-flex items-center gap-1 bg-white/8 border border-white/10 rounded-md px-2.5 py-1">
                  <Clock className="w-3.5 h-3.5 text-white/60" />
                  {pandit.experience} yrs
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {pandit.specialization.split(",").map((s, i) => (
                  <span key={i} className="bg-white/8 text-white/75 px-2.5 py-0.5 rounded-md text-[11px] border border-white/10">{s.trim()}</span>
                ))}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {trustSignals.map(({ icon: Icon, label }) => (
                  <span key={label} className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/8 px-3 h-8 text-[11px] font-semibold text-white/80">
                    <Icon className="h-3.5 w-3.5 text-[#D4AF37]" />
                    {label}
                  </span>
                ))}
              </div>
              <p className="mt-3 text-[12px] text-white/60 max-w-2xl leading-relaxed">
                {pandit.name} is listed for {pandit.city} puja services with secure in-app booking and a private chat that hides personal contact details.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-4">
            {pandit.bio && (
              <Card className="rounded-lg border border-[#D4AF37]/20 bg-white shadow-none">
                <CardContent className="p-5">
                  <h2 className="font-serif text-base font-semibold text-[#6D2B35] mb-3 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-[#D4AF37]" /> About
                  </h2>
                  <p className="text-[13px] text-[#5a4a3a]/75 leading-relaxed">{pandit.bio}</p>
                </CardContent>
              </Card>
            )}

            <Card className="rounded-lg border border-[#D4AF37]/20 bg-white shadow-none">
              <CardContent className="p-5">
                <h2 className="font-serif text-base font-semibold text-[#6D2B35] mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#D4AF37]" /> Why book this pandit
                </h2>
                <div className="grid sm:grid-cols-2 gap-2">
                  {highlights.map((item) => (
                    <div key={item} className="rounded-md border border-[#D4AF37]/15 bg-[#FBF7EE] px-3 py-2 text-[12px] text-[#5a4a3a]/75">
                      {item}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

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
                      <p className="text-[13px] font-semibold text-[#5a4a3a]">{pandit.languages}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-white">
                    <Clock className="w-4 h-4 text-[#6D2B35]/70" />
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.18em] text-[#5a4a3a]/55">Experience</p>
                      <p className="text-[13px] font-semibold text-[#5a4a3a]">{pandit.experience} years</p>
                    </div>
                  </div>
                  {pandit.education && (
                    <div className="flex items-center gap-3 p-3 bg-white">
                      <BookOpen className="w-4 h-4 text-[#6D2B35]/70" />
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.18em] text-[#5a4a3a]/55">Education</p>
                        <p className="text-[13px] font-semibold text-[#5a4a3a]">{pandit.education}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-3 p-3 bg-white">
                    <MapPin className="w-4 h-4 text-[#6D2B35]/70" />
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.18em] text-[#5a4a3a]/55">City</p>
                      <p className="text-[13px] font-semibold text-[#5a4a3a]">{pandit.city}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {(reviews || []).length > 0 && (
              <Card className="rounded-lg border border-[#D4AF37]/20 bg-white shadow-none">
                <CardContent className="p-5">
                  <h2 className="font-serif text-base font-semibold text-[#6D2B35] mb-4 flex items-center gap-2">
                    <Star className="w-4 h-4 text-[#D4AF37]" /> Reviews ({reviews?.length})
                  </h2>
                  <div className="space-y-3">
                    {(reviews || []).slice(0, 10).map((review) => (
                      <div key={review.id} className="border-b border-[#D4AF37]/15 pb-3 last:border-0">
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-[13px] text-[#6D2B35]">{review.reviewerName}</span>
                            {review.serviceType && <span className="text-[10px] uppercase tracking-[0.15em] bg-[#FBF7EE] border border-[#D4AF37]/20 text-[#5a4a3a]/65 px-1.5 py-0.5 rounded-md">{review.serviceType}</span>}
                          </div>
                          <div className="flex items-center gap-0.5">
                            {[1,2,3,4,5].map(s => (
                              <Star key={s} className={`w-3 h-3 ${s <= review.rating ? "fill-[#D4AF37] text-[#D4AF37]" : "text-[#5a4a3a]/20"}`} />
                            ))}
                          </div>
                        </div>
                        {review.comment && <p className="text-[12.5px] text-[#5a4a3a]/70 leading-relaxed">{review.comment}</p>}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-4">
            <Card className="rounded-lg border border-[#D4AF37]/30 bg-white shadow-none sticky top-4">
              <CardContent className="p-5">
                <div className="text-center mb-4 pb-4 border-b border-[#D4AF37]/15">
                  <p className="text-[10px] uppercase tracking-[0.3em] font-semibold text-[#D4AF37] mb-1">Starting from</p>
                  <p className="text-3xl font-serif font-semibold text-[#6D2B35] leading-none">₹{pandit.fees?.toLocaleString()}</p>
                  <p className="text-[11px] text-[#5a4a3a]/55 mt-1">per puja service</p>
                </div>
                <div className="mb-4 rounded-md border border-[#D4AF37]/15 bg-[#FBF7EE] px-3 py-2 text-[11px] text-[#5a4a3a]/70 leading-relaxed">
                  Book directly from this profile. Schedule, payment and chat all stay inside Vedic Tatva — personal contact details are never shared.
                </div>

                <Button
                  className="w-full bg-[#6D2B35] hover:bg-[#5a2430] text-white rounded-md h-10 text-[13px] font-semibold gap-1.5"
                  data-testid="btn-book-pandit"
                  onClick={() => requireAuth(
                    () => setLocation(`/puja?pandit=${pandit.id}`),
                    { title: "Sign in to book", description: "Please sign in to book this pandit" }
                  )}
                >
                  <Calendar className="w-3.5 h-3.5" /> Book now
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </CardContent>
            </Card>

            <Card className="rounded-lg border border-[#D4AF37]/20 bg-white shadow-none">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-serif text-base font-semibold text-[#6D2B35] flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-[#D4AF37]" /> Private chat
                  </h2>
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-1.5 py-0.5">
                    <Lock className="w-3 h-3" /> Anonymous
                  </span>
                </div>
                <p className="text-[11px] text-[#5a4a3a]/65 mb-3 leading-relaxed">
                  Phone numbers, emails and external links are removed automatically. Use in-app booking to confirm services.
                </p>

                {user ? (
                  <>
                    <div
                      ref={scrollRef}
                      className="rounded-md border border-[#D4AF37]/15 bg-[#FBF7EE] p-2.5 mb-3 max-h-56 overflow-y-auto space-y-2"
                      data-testid="chat-thread"
                    >
                      {chats.length === 0 && (
                        <p className="text-[11px] text-[#5a4a3a]/55 text-center py-4">Start the conversation. Your message reaches the pandit privately.</p>
                      )}
                      {chats.map((m) => (
                        <div key={m.id} className={`text-[12px] leading-snug rounded-md px-2.5 py-1.5 max-w-[85%] ${m.senderType === "user" ? "ml-auto bg-[#6D2B35] text-white" : "bg-white border border-[#D4AF37]/20 text-[#5a4a3a]"}`}>
                          {m.message}
                          {m.attachmentUrl && (
                            <a href={m.attachmentUrl} target="_blank" rel="noopener noreferrer" className={`mt-1 flex items-center gap-1 text-[10px] underline ${m.senderType === "user" ? "text-white/80" : "text-[#6D2B35]"}`}>
                              <Paperclip className="w-3 h-3" /> Attachment
                            </a>
                          )}
                          {m.sanitized && (
                            <p className={`mt-1 text-[10px] italic ${m.senderType === "user" ? "text-white/70" : "text-[#5a4a3a]/55"}`}>
                              Contact details removed
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                    <Input value={attachmentUrl} onChange={(e) => setAttachmentUrl(e.target.value)} placeholder="Attachment URL (optional)" className="mb-2" data-testid="input-chat-attachment" />
                    <Textarea value={messageDraft} onChange={(e) => setMessageDraft(e.target.value)} placeholder="Write your message..." className="min-h-20 mb-3" data-testid="textarea-chat-message" />
                    <Button
                      className="w-full bg-[#6D2B35] text-white gap-1.5"
                      onClick={handleSendMessage}
                      disabled={sending || !messageDraft.trim()}
                      data-testid="btn-send-chat"
                    >
                      {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                      Send message
                    </Button>
                  </>
                ) : (
                  <Button
                    className="w-full bg-[#6D2B35] text-white"
                    onClick={() => requireAuth(() => {}, { title: "Sign in to chat", description: "Please sign in to message this pandit." })}
                    data-testid="btn-signin-chat"
                  >
                    Sign in to chat privately
                  </Button>
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

            <Card className="rounded-lg border border-[#D4AF37]/20 bg-white shadow-none">
              <CardContent className="p-4">
                <h3 className="font-serif text-[13px] font-semibold text-[#6D2B35] mb-2">SEO keywords</h3>
                <p className="text-[11px] text-[#5a4a3a]/70 leading-relaxed">{keywords}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
