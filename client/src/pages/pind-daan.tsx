import { Link, useRoute } from "wouter";
import { useI18n } from "@/lib/i18n";
import PageSeo from "@/components/PageSeo";
import QuickAnswer from "@/components/QuickAnswer";
import { faqPage, breadcrumbList, abs } from "@/lib/seo-schemas";
import {
  Flame, Droplets, Mountain, BookOpen, Heart, ShieldCheck, Compass, Globe,
  Sparkles, Sun, Calendar, Users, MapPin, ChevronRight, ArrowRight, Waves,
  Video, Camera, Package, MessageCircle, Clock, Award, Bell, Calculator,
  Star, Wind, ScrollText,
} from "lucide-react";
import RelatedBlogPosts from "@/components/RelatedBlogPosts";
import { CompactTithiCalculator } from "@/components/CompactTithiCalculator";
import type { LucideIcon } from "lucide-react";
import PageAPlusContent, { type Benefit, type Step, type Faq, type TrustBadge } from "@/components/PageAPlusContent";
import NotFound from "@/pages/not-found";
import heroPindDaan from "@/assets/images/hero-scene-pind-daan.png";
import pindDaanHubCollage from "@/assets/images/pind-daan-hub-collage.png";
import gayaVishnupadImg from "@/assets/images/gaya-vishnupad-temple.png";
import gayaPhalguImg from "@/assets/images/gaya-phalgu-ritual.png";
import gayaAkshayavatImg from "@/assets/images/gaya-akshayavat.png";
import gayaHeroBanner from "@/assets/images/gaya-hero-banner.png";
import kashiHeroBanner from "@/assets/images/kashi-hero-banner.png";
import kashiManikarnikaImg from "@/assets/images/kashi-manikarnika.png";
import kashiPishachmochanImg from "@/assets/images/kashi-pishachmochan.png";
import kashiVishwanathImg from "@/assets/images/kashi-vishwanath.png";
import haridwarHeroBanner from "@/assets/images/haridwar-hero-banner.png";
import haridwarHarKiPauriImg from "@/assets/images/haridwar-har-ki-pauri.png";
import haridwarNarayaniShilaImg from "@/assets/images/haridwar-narayani-shila.png";
import haridwarDakshMahadevImg from "@/assets/images/haridwar-daksh-mahadev.png";

const WHATSAPP_URL = "https://wa.me/918447844702?text=" + encodeURIComponent("Namaste, I would like guidance on performing Pind Daan for my ancestors.");

const PRIMARY_BTN = "bg-[#D4AF37] text-[#6D2B35] hover:bg-[#c19f30] rounded-md h-10 px-5 text-[13px] font-bold tracking-wide transition-colors inline-flex items-center justify-center gap-2 leading-none";
const OUTLINE_BTN = "bg-[#FBF7EE] text-[#6D2B35] border border-[#D4AF37]/25 hover:bg-[#f4eedd] rounded-md h-10 px-5 text-[13px] font-semibold transition-colors inline-flex items-center justify-center gap-2";

function useT() {
  const { language } = useI18n();
  const isHi = language === "hi";
  return {
    isHi,
    t: <T,>(en: T, hi: T): T => (isHi ? hi : en),
  };
}

type PindDaanPage = {
  slug: string;
  pujaType: string;
  navTitle: string;
  navTagline: string;
  navIcon: LucideIcon;
  quickAnswer?: string;
  hero: {
    eyebrow: string;
    title: string;
    titleHi?: string;
    subtitle: string;
  };
  content: {
    eyebrow: string;
    title: string;
    intro: string;
    trustBadges?: TrustBadge[];
    benefits: Benefit[];
    steps: Step[];
    faqs: Faq[];
    keywordsBlurb: string;
  };
};

const PAGES: PindDaanPage[] = [
  {
    slug: "kashi",
    pujaType: "pind-daan-kashi",
    navTitle: "Pind Daan in Kashi",
    navTagline: "Manikarnika Ghat • Pishachmochan Kund",
    navIcon: Flame,
    quickAnswer: "Pind Daan in Kashi (Varanasi) is performed at Manikarnika Ghat on the Ganga and at Pishachmochan Kund (for Tripindi Shradh) by Kashi-trained Karmakandi Brahmins. You join the Sankalp via live video call, the pandit performs the ritual as your representative, and you receive photo and video proof, the Sankalp Patra, and Ganga jal prasad couriered to your home anywhere in the world.",
    hero: {
      eyebrow: "Kashi Kshetra",
      title: "Pind Daan in Kashi (Varanasi)",
      titleHi: "काशी में पिंडदान",
      subtitle:
        "Performed at Manikarnika Ghat and Pishachmochan Kund — the sacred land where Lord Vishweshwara grants moksha and ancestral souls find eternal peace.",
    },
    content: {
      eyebrow: "Moksha Nagari Kashi",
      title: "Pind Daan in Kashi — Liberation at the City of Lord Shiva",
      intro:
        "Kashi is called the 'Mahasmashan' — the great cremation ground of the cosmos. Pind Daan and Tarpan performed on the banks of the Ganga at Manikarnika Ghat, and Tripindi Shradh at Pishachmochan Kund, are believed to liberate ancestors from any lingering attachments and grant them sadgati (a higher spiritual destination).",
      trustBadges: [
        { value: "Manikarnika", label: "Sacred Ghat" },
        { value: "Vedic Vidhi", label: "Karmakandi Pandits" },
        { value: "Live Video", label: "Watch Remotely" },
        { value: "Prasad", label: "Couriered Home" },
      ],
      benefits: [
        { icon: Flame, title: "Manikarnika Ghat Ritual", body: "Pind Daan performed on the holiest cremation ghat, where it is believed Lord Shiva himself whispers the Tarak Mantra into the ear of the departed." },
        { icon: Droplets, title: "Ganga Snan & Tarpan", body: "Daily Ganga snan, Til-Tarpan and Jalanjali offered for up to three preceding generations on both paternal and maternal sides." },
        { icon: Sparkles, title: "Pishachmochan Tripindi", body: "Special Tripindi Shradh at Pishachmochan Kund for ancestors believed to be in pret or pishach yoni — a unique remedy available only in Kashi." },
        { icon: BookOpen, title: "Karmakandi Brahmins", body: "Performed by Kashi-based Tirth Purohits trained in the Garuda Purana and Pretmanjari, with Sankalp taken in your name and gotra." },
        { icon: Globe, title: "Performed on Your Behalf", body: "You do not need to travel — the pandit performs the rituals as your representative (pratinidhi) after a Sankalp video call with you." },
        { icon: ShieldCheck, title: "Recorded & Photographed", body: "Full ritual is recorded; you receive photos, a video clip, the Sankalp Patra and Tirth Purohit's seal as proof of completion." },
      ],
      steps: [
        { title: "Share Ancestor Details", body: "Provide name, gotra, date of passing (if known), and your relation. We accept up to three generations on both sides." },
        { title: "Pick the Tithi", body: "We suggest the most shastric tithi — Pitru Paksha, Amavasya, the death anniversary, or any Krishna Paksha day." },
        { title: "Sankalp via Video Call", body: "On the morning of the ritual you join a brief Sankalp call where the pandit takes the Sankalp in your name." },
        { title: "Ritual & Prasad Dispatch", body: "Pind Daan, Tarpan and Brahman Bhojan are performed; photos, video and prasad reach you within 5–7 days." },
      ],
      faqs: [
        { q: "Why is Kashi considered the most sacred place for Pind Daan?", a: "Kashi is the only city believed to grant moksha by mere death within its limits. Pind Daan here is said to free ancestors from rebirth and grant them direct sadgati. The Garuda Purana specifically prescribes Kashi for shradh." },
        { q: "Can Pind Daan in Kashi be done without me being physically present?", a: "Yes. The shastras allow pratinidhi (representative) shradh — our Tirth Purohit takes the Sankalp in your name and gotra over a brief video call, then performs the ritual on your behalf. This has been the accepted practice for centuries for those unable to travel." },
        { q: "What is the difference between Pind Daan at Manikarnika and at Pishachmochan?", a: "Manikarnika Ghat is for general Pind Daan and Tarpan for ancestors. Pishachmochan Kund is specifically for Tripindi Shradh — meant for ancestors who are believed to be wandering in lower yonis (pret/pishach) due to incomplete last rites or unnatural death." },
        { q: "What is the right time to perform Pind Daan in Kashi?", a: "Pitru Paksha (the 16-day dark fortnight in Bhadrapada/Ashwin) is most auspicious, but Amavasya of any month, the tithi of death, and Krishna Paksha days are also recommended. Our team will suggest the most aligned date." },
        { q: "What samagri is used?", a: "Pinda made of cooked rice, barley flour, black sesame (til), honey and ghee; kusha grass; sacred thread; til-jal for Tarpan; flowers, dhoop, ghee diya; and dakshina to Brahmins. All samagri is procured locally in Kashi." },
        { q: "Will I receive proof that the ritual was performed?", a: "Yes. You receive a Sankalp Patra signed and sealed by the Tirth Purohit, photographs of each stage of the ritual, a 2–3 minute video, and Ganga jal plus prasad couriered to your address." },
        { q: "How long does the entire ritual take on the day?", a: "The on-ghat ritual itself takes about 2–3 hours and is performed in the morning hours after Brahma Muhurat snan. Brahman Bhojan and dakshina follow." },
        { q: "Can NRIs and devotees abroad book this?", a: "Absolutely. We have hosted Sankalp calls from over 30 countries. Time slots are scheduled to suit your timezone." },
      ],
      keywordsBlurb:
        "Pind Daan in Kashi (Varanasi) at Manikarnika Ghat and Pishachmochan Kund — Tripindi Shradh, Tarpan, Brahman Bhojan and Sankalp performed by verified Kashi Tirth Purohits. Bookable from anywhere in India and abroad with live video Sankalp, photo and video proof, Sankalp Patra and Ganga jal prasad couriered to your home. Ideal during Pitru Paksha, Amavasya, and the death anniversary of departed ancestors.",
    },
  },
  {
    slug: "gaya",
    pujaType: "pind-daan-gaya",
    navTitle: "Pind Daan in Gaya",
    navTagline: "Vishnupad Mandir • Phalgu River • Akshayavat",
    navIcon: Mountain,
    quickAnswer: "Pind Daan in Gaya is the once-in-a-lifetime Shradh ritual performed at Vishnupad Mandir, the Phalgu river and Akshayavat by traditional Gayawal Tirth Purohits. As per Garuda Purana, Lord Vishnu blessed Gaya so that a single Shradh here liberates ancestors permanently. You join the Sankalp by live video call and receive full photo/video proof, Sankalp Patra and Akshayavat prasad at your home worldwide.",
    hero: {
      eyebrow: "Gaya Tirth",
      title: "Pind Daan in Gaya (Bihar)",
      titleHi: "गया में पिंडदान",
      subtitle:
        "Performed at Vishnupad Mandir, Phalgu River and Akshayavat — the holiest of Pitra-Tirths where Lord Vishnu himself blesses the departed with permanent liberation.",
    },
    content: {
      eyebrow: "Pitru Tirth Shiromani",
      title: "Pind Daan in Gaya — The Final Liberation of Ancestors",
      intro:
        "Gaya is called the 'Pitra Tirth Shiromani' — the foremost amongst all pilgrimage sites for ancestor rites. Vishnu Bhagwan personally promised liberation here. Pind Daan performed at Vishnupad, the dry Phalgu, and the eternal Akshayavat is believed to be the one ritual that ends the cycle of repeated shradh.",
      trustBadges: [
        { value: "Vishnupad", label: "Sacred Footprint" },
        { value: "Akshayavat", label: "Eternal Banyan" },
        { value: "Gayawal", label: "Lineage Pandits" },
        { value: "1–3 Day", label: "Full Ritual" },
      ],
      benefits: [
        { icon: Mountain, title: "Vishnupad Mandir Ritual", body: "Pind Daan offered before the sacred footprint of Lord Vishnu — the unique vedi where the deity himself accepts the offering." },
        { icon: Waves, title: "Phalgu River Tarpan", body: "Tarpan and pinda offered on the bed of the holy Phalgu, whose hidden current is said to carry the offerings directly to ancestors." },
        { icon: BookOpen, title: "Akshayavat Sankalp", body: "Final Sankalp under the eternal banyan tree where Mata Sita is said to have blessed Pind Daan as imperishable (akshay)." },
        { icon: ShieldCheck, title: "Gayawal Tirth Purohit", body: "Performed by traditional Gayawal pandits whose families have served pilgrims for centuries; full vidhi as per Vayu Purana." },
        { icon: Heart, title: "Frees the Doer Too", body: "Shastras say Gaya Shradh frees not only the ancestors but the performer from the obligation of further annual shradh — the ultimate completion." },
        { icon: Sparkles, title: "1-Day or 3-Day Vidhi", body: "Choose between the abridged 1-day Sankshipt vidhi or the complete 3-day shastric vidhi covering all 17 vedis and 45 vedis tirth-yatra." },
      ],
      steps: [
        { title: "Choose Vidhi Type", body: "1-day Sankshipt Vidhi (covers Vishnupad, Phalgu and Akshayavat) or full 3-day vidhi covering all major vedis of Gaya." },
        { title: "Submit Pitru Details", body: "Names, gotras, relations and tithi of departed for up to three generations. We accept father, mother, grandparents and other ancestors." },
        { title: "Sankalp & Pinda Daan", body: "Ritual begins at Phalgu snan, then pinda offered at Vishnupad and Akshayavat with full Sankalp in your name." },
        { title: "Brahman Bhojan & Proof", body: "Brahman Bhojan offered as the final samarpan; you receive photos, video, Sankalp Patra and Akshayavat prasad at home." },
      ],
      faqs: [
        { q: "Why does the Garuda Purana give Gaya the highest place for Pind Daan?", a: "Lord Vishnu himself granted Gaya the boon that any Pind Daan performed here would liberate ancestors permanently. The Garuda Purana, Vayu Purana and Mahabharata all describe Gaya Shradh as 'akshay' — imperishable in its merit." },
        { q: "Is Gaya Shradh a one-time ritual or done every year?", a: "Gaya Shradh is traditionally performed once in a lifetime by a son or descendant. After it is completed, the obligation of repeated annual shradh for those ancestors is considered fulfilled — though many families still observe annual Tarpan as bhakti." },
        { q: "Why do offerings at Phalgu work despite the river often being dry on the surface?", a: "Lord Rama is said to have cursed the Phalgu to flow underground after a misunderstanding with Mata Sita. The current still flows beneath the sand, and pinda placed on the dry bed is believed to be carried to the ancestors by this hidden Antar-vahini Phalgu." },
        { q: "What is the role of Akshayavat?", a: "Akshayavat is the eternal banyan tree where Mata Sita performed Pind Daan with her own hands. The final Sankalp of Gaya Shradh is taken here so the merit becomes 'akshay' — never-decaying." },
        { q: "Who are the Gayawal pandits?", a: "Gayawal Tirth Purohits are traditional Brahmin families of Gaya whose lineage has been serving pilgrims for over 1,000 years. Each yajman (host family) is historically tied to a specific Gayawal; we match you to the appropriate one." },
        { q: "Can I do Gaya Shradh remotely?", a: "Yes. The shastras allow a 'Pratinidhi Karta' — a representative who performs the karya on your behalf after Sankalp is taken in your name and gotra. We host the Sankalp via video call from anywhere in the world." },
        { q: "Should both parents be alive or departed for me to do this?", a: "Gaya Shradh is most often performed by sons after the death of their father, but it can be done for any departed ancestor — mother, grandparents, uncles, even those without descendants. Daughters too can perform it in the absence of male heirs." },
        { q: "Is there a special tithi for Gaya Shradh?", a: "Pitru Paksha is ideal but any Krishna Paksha day, especially Amavasya, is recommended. Even outside Pitru Paksha, Gaya Shradh remains effective at any time of year." },
      ],
      keywordsBlurb:
        "Pind Daan in Gaya at Vishnupad Mandir, Phalgu River and Akshayavat performed by traditional Gayawal Tirth Purohits. 1-day Sankshipt Vidhi or full 3-day shastric vidhi covering all vedis, with Sankalp via video call, photo-video proof, Sankalp Patra and Akshayavat prasad. Considered the highest Pitra Tirth in Sanatan Dharma — bookable from India and abroad during Pitru Paksha, Amavasya, or any time of year.",
    },
  },
  {
    slug: "haridwar",
    pujaType: "pind-daan-haridwar",
    navTitle: "Pind Daan in Haridwar",
    navTagline: "Narayani Shila • Har Ki Pauri • Kankhal",
    navIcon: Droplets,
    quickAnswer: "Pind Daan in Haridwar — Narayani Shila puja and Tarpan at Har Ki Pauri Brahmakund — is the prime scriptural remedy for Pitru Dosh shown in the kundli. Performed by registered Haridwar Tirth Purohits with live video Sankalp, full photo and video proof, Sankalp Patra and Ganga jal prasad couriered worldwide. Same-day booking is often available.",
    hero: {
      eyebrow: "Hari Ki Dwar",
      title: "Pind Daan in Haridwar",
      titleHi: "हरिद्वार में पिंडदान",
      subtitle:
        "Tarpan and Pind Daan performed at Narayani Shila and Har Ki Pauri on the banks of Mother Ganga where she descends from the Himalayas to bless the plains.",
    },
    content: {
      eyebrow: "Dwar of Lord Hari",
      title: "Pind Daan in Haridwar — Where Ganga Carries Your Offering to the Ancestors",
      intro:
        "Haridwar is the sacred 'gateway of Hari' where Mother Ganga first emerges into the plains. Pind Daan and Tarpan at Narayani Shila Temple, the eternal flow at Har Ki Pauri, and the Daksh Mahadev kshetra at Kankhal are particularly powerful for relieving Pitru Dosh and bringing peace to the souls of departed family members.",
      trustBadges: [
        { value: "Narayani Shila", label: "Pitru Dosh" },
        { value: "Har Ki Pauri", label: "Brahmakund" },
        { value: "Same Day", label: "Sankalp & Photos" },
        { value: "Ganga Jal", label: "Couriered" },
      ],
      benefits: [
        { icon: Sparkles, title: "Narayani Shila Puja", body: "Special Pitru Dosh nivaran puja at Narayani Shila — the sacred shila on which the navel of Lord Vishnu rested, considered the foremost remedy for Pitru Dosh." },
        { icon: Droplets, title: "Har Ki Pauri Tarpan", body: "Tarpan offered at Brahmakund where the divine Amrit is said to have fallen — the holiest spot in Haridwar for ancestral offerings." },
        { icon: Mountain, title: "Daksh Mahadev Kankhal", body: "Optional shradh at Kankhal — the seat of Daksh Prajapati and one of the original Pind Daan tirthas mentioned in the Skanda Purana." },
        { icon: BookOpen, title: "Verified Tirth Purohits", body: "Performed only by registered Tirth Purohits of Haridwar with traceable family registers (bahis) where your ancestral records are also maintained." },
        { icon: Calendar, title: "Same-Day Booking Available", body: "Many slots can be booked for the next morning — ideal for emergencies, Tithi-bound shradh, or last-minute Pitru Paksha bookings." },
        { icon: ShieldCheck, title: "Ancestral Bahi Update", body: "If your family has a generations-old register with the Tirth Purohits, your visit and ritual are recorded in the same Bahi for posterity." },
      ],
      steps: [
        { title: "Pick the Service", body: "Choose Pitru Dosh Nivaran at Narayani Shila, simple Tarpan at Har Ki Pauri, full shradh, or a combination." },
        { title: "Submit Pitru Details & Tithi", body: "Provide ancestor names, gotra, your details and the preferred tithi — our team confirms within an hour." },
        { title: "Sankalp & Ritual", body: "Sankalp is taken in your name via video call; ritual is then performed on the ghat / at Narayani Shila in the prescribed muhurat." },
        { title: "Receive Proof & Prasad", body: "Within 24 hours of ritual you receive photos, a video clip and the Sankalp Patra; Ganga jal and prasad arrive in 5–7 days." },
      ],
      faqs: [
        { q: "What is Pitru Dosh and how does Narayani Shila puja help?", a: "Pitru Dosh in a kundli indicates that ancestors are not at peace — symptoms include obstacles in marriage, childbirth or career. The Narayani Shila puja in Haridwar is specifically prescribed in shastra as the principal remedy because the shila itself is non-different from the body of Lord Vishnu." },
        { q: "Why is Har Ki Pauri so important for Tarpan?", a: "Har Ki Pauri houses Brahmakund, where a drop of Amrit is said to have fallen during the churning of the ocean. Tarpan offered into this stream is believed to reach the ancestors instantly because Mother Ganga herself carries the offering." },
        { q: "Do I need to come to Haridwar in person?", a: "No. Like all Pind Daan rituals, Haridwar shradh can be performed by the Tirth Purohit as your pratinidhi after a Sankalp video call. You receive full proof of completion." },
        { q: "What is the Bahi system in Haridwar?", a: "Tirth Purohits of Haridwar maintain hand-written registers (bahis) of pilgrim families going back many generations — sometimes 300–400 years. If your forefathers visited Haridwar, your family record may already exist; we can help search the bahi by your gotra and place of origin." },
        { q: "When should Haridwar Pind Daan be performed?", a: "Pitru Paksha is most auspicious. Other recommended days include Amavasya, the death anniversary, Somvati Amavasya, Mauni Amavasya and Kumbh / Ardh Kumbh periods. For Pitru Dosh, even ordinary Krishna Paksha days work." },
        { q: "Can Pind Daan be done before the first death anniversary?", a: "Yes — Tripakshik shradh (within the first 12 days), Maasik shradh (monthly for the first year), and Sapindikaran (12th-day ritual) can all be performed in Haridwar. Most families choose to do Sapindikaran or 1st-anniversary shradh here." },
        { q: "Is the Pind Daan effective for ancestors who died in unnatural circumstances?", a: "Yes. Combined Narayani Shila puja and Tripindi Shradh in Haridwar are specifically prescribed for those whose end was sudden, accidental or untimely, helping their souls move forward." },
      ],
      keywordsBlurb:
        "Pind Daan and Tarpan in Haridwar at Narayani Shila Temple, Har Ki Pauri Brahmakund and Kankhal Daksh Mahadev — the prime remedy for Pitru Dosh in Vedic astrology. Performed by registered Tirth Purohits of Haridwar with same-day Sankalp via video call, photo and video proof, Sankalp Patra and Ganga jal prasad couriered to your address anywhere in India or abroad.",
    },
  },
  {
    slug: "why-important",
    pujaType: "pind-daan-yearly-remote",
    navTitle: "Why Pind Daan Is Important",
    navTagline: "Shastric significance & spiritual benefits",
    navIcon: BookOpen,
    quickAnswer: "Sanatan Dharma teaches three rinas (debts) every soul carries — Deva Rina to the gods, Rishi Rina to the sages and Pitru Rina to the ancestors. Pind Daan, Tarpan and Shradh are the prescribed ways to repay Pitru Rina: they bring sadgati to departed souls, remove Pitru Dosh from the family kundli, and open the doors of prosperity, progeny and dharmic living for descendants.",
    hero: {
      eyebrow: "Shastric Wisdom",
      title: "Why Pind Daan Is So Important in Sanatan Dharma",
      titleHi: "पिंडदान का महत्व",
      subtitle:
        "An ancient duty (Pitru Rina) every Hindu owes to those who came before — explained through the Garuda Purana, Manusmriti and the lived tradition of Bharat.",
    },
    content: {
      eyebrow: "Pitru Rina — The Ancestral Debt",
      title: "Why Pind Daan Is the Highest Form of Devotion to Our Ancestors",
      intro:
        "Sanatan Dharma teaches that every soul is born with three rinas (debts) — Deva Rina to the gods, Rishi Rina to the sages, and Pitru Rina to the ancestors. Pind Daan, Tarpan and Shradh are the prescribed ways to repay Pitru Rina. Performing them brings peace to the departed, removes Pitru Dosh from the family kundli, and opens the doors of prosperity, progeny and dharmic living for the descendants.",
      trustBadges: [
        { value: "3 Rinas", label: "Pitru Debt" },
        { value: "Garuda Puran", label: "Primary Source" },
        { value: "16 Days", label: "Pitru Paksha" },
        { value: "All Yugas", label: "Unbroken" },
      ],
      benefits: [
        { icon: Heart, title: "Sadgati for Ancestors", body: "The pinda — symbolic body of food — sustains the subtle body of the departed soul on its journey, helping it move from preta-loka towards pitru-loka and beyond." },
        { icon: ShieldCheck, title: "Removes Pitru Dosh", body: "Pitru Dosh in a kundli indicates obstacles caused by unfulfilled ancestor obligations — manifesting as delays in marriage, fertility issues, financial stagnation or recurring family disputes." },
        { icon: Sparkles, title: "Family Prosperity", body: "Manusmriti states: 'When ancestors are pleased, all gods are pleased.' Their blessings (ashirvad) translate into health, wealth, dharma and good progeny in the descendants." },
        { icon: Users, title: "Strengthens Lineage Bond", body: "Tarpan keeps the unseen bond between living and departed alive — the lineage is not just biological but spiritual, and that thread must be honoured." },
        { icon: BookOpen, title: "Repays Pitru Rina", body: "It is one of the three primordial debts mentioned in shruti. Without performing shradh, even worship of devas is considered incomplete." },
        { icon: Sun, title: "Aligns with Cosmic Order", body: "Pitru Paksha falls when the Sun enters Kanya rashi — a window when the gateway to pitru-loka opens; performing shradh in this window has multiplied effect." },
      ],
      steps: [
        { title: "Understand the Pitru Rina", body: "Recognize that the body, name, gotra, samskara and lineage you carry is itself a gift from your ancestors — and that debt requires conscious repayment." },
        { title: "Identify Your Ancestors", body: "Up to three generations on both paternal and maternal sides — father, mother, grandfather, grandmother, great-grandfather, great-grandmother." },
        { title: "Choose the Right Tithi", body: "Pitru Paksha (most powerful), Amavasya of any month, the actual death tithi (shradh tithi), or a Krishna Paksha day in any month." },
        { title: "Engage a Karmakandi", body: "Pind Daan must be performed with correct Sanskrit mantras, gotra, vidhi and samagri — this is why a trained Tirth Purohit is essential." },
      ],
      faqs: [
        { q: "What exactly happens spiritually during Pind Daan?", a: "The cooked rice-based pinda is energised by Sanskrit mantras and offered to the subtle body of the ancestor. The Garuda Purana describes how this pinda nourishes the departed in the intermediate state and helps them progress towards higher lokas." },
        { q: "Is Pind Daan only for the dead — does it benefit the living too?", a: "Both. Ancestors receive sadgati and peace; the descendants receive blessings, removal of Pitru Dosh, removal of obstacles in marriage and progeny, and overall family well-being. The two are inseparable in shastra." },
        { q: "What is Pitru Dosh and how do I know if I have it?", a: "Pitru Dosh is shown in a kundli when malefic planets afflict the 9th house (father), Sun, or Rahu/Ketu in specific positions. Symptoms include unexplained obstacles in marriage, repeated miscarriages, financial stagnation, recurring family conflicts and severe health issues in male children." },
        { q: "Who can perform Pind Daan — only sons?", a: "Traditionally the eldest son performs it, but in absence of sons, daughters, grandsons, brothers, nephews or even a designated representative (pratinidhi) may do it. Mother Sita herself performed Pind Daan for King Dasharatha at Gaya." },
        { q: "What if I don't know much about my ancestors?", a: "Even partial information is enough — names you know, approximate generations, and your gotra. The Sankalp can be made for 'all known and unknown ancestors of my paternal and maternal lineage'." },
        { q: "Why is Pitru Paksha specifically the time for shradh?", a: "Pitru Paksha is the 16-day Krishna Paksha of Bhadrapada–Ashwin when the Sun enters Kanya rashi. Shastras say the gateway to pitru-loka opens during this period and ancestors descend to receive offerings — making any shradh done now multifold in effect." },
        { q: "Is it ever too late to do Pind Daan?", a: "Never. Even decades after a death, Pind Daan in Gaya, Kashi or Haridwar is fully effective. Many families perform it for great-grandparents whose names are barely remembered — the Sankalp covers them through the gotra." },
        { q: "Does Pind Daan have to be repeated every year?", a: "Annual Tarpan and Shradh on the death tithi is the daily-life observance. A one-time Gaya Shradh is considered to fulfil the eternal obligation. Many families combine the two — annual Tarpan + a one-time pilgrimage shradh." },
      ],
      keywordsBlurb:
        "Why Pind Daan and Tarpan are essential in Sanatan Dharma — shastric importance from the Garuda Purana, Manusmriti and Vayu Purana, the concept of Pitru Rina, the spiritual mechanics of the pinda, the role of Pitru Paksha, removal of Pitru Dosh from the kundli, blessings of ancestors for marriage, progeny, prosperity and family dharma. A complete primer on the meaning, benefits and timing of ancestral rites in Hindu tradition.",
    },
  },
  {
    slug: "sites-in-india",
    pujaType: "pind-daan-yearly-remote",
    navTitle: "Pind Daan Sites in India",
    navTagline: "Gaya, Kashi, Haridwar, Trimbakeshwar, Rameshwaram & more",
    navIcon: MapPin,
    quickAnswer: "The most sacred Pind Daan tirthas in India are Gaya (once-in-a-lifetime liberation at Vishnupad and Akshayavat), Kashi (Manikarnika Ghat and Tripindi Shradh at Pishachmochan), Haridwar (Narayani Shila for Pitru Dosh), Trimbakeshwar (Narayan Nagbali and Kalsarp Dosh), Rameshwaram (Agni Tirtham), Badrinath Brahma Kapal and Prayagraj/Pushkar/Kurukshetra. Each can be booked remotely with verified Tirth Purohits.",
    hero: {
      eyebrow: "Sacred Geography",
      title: "Must-Visit Pind Daan Sites Across Bharat",
      titleHi: "भारत के पिंडदान तीर्थ",
      subtitle:
        "From the eternal banyan of Gaya to the silver shores of Rameshwaram — the sacred map of ancestral liberation in the land of Sanatan Dharma.",
    },
    content: {
      eyebrow: "Bharat ke Pitru Tirth",
      title: "The Most Sacred Pind Daan and Tarpan Sites of India",
      intro:
        "Sanatan Dharma identifies a small handful of tirthas where ancestral rites carry exceptional spiritual potency. Each site has a unique association — Lord Vishnu's footprint at Gaya, Lord Shiva's whispered Tarak Mantra at Kashi, the Pitru Dosh nivaran at Haridwar's Narayani Shila, and the Tripindi Shradh at Trimbakeshwar. Choose any one — or visit them across a lifetime — to fulfil your Pitru Rina.",
      trustBadges: [
        { value: "7+", label: "Major Tirthas" },
        { value: "All Bharat", label: "North to South" },
        { value: "Verified", label: "Tirth Purohits" },
        { value: "Online", label: "Bookable Anywhere" },
      ],
      benefits: [
        { icon: Mountain, title: "Gaya (Bihar)", body: "Vishnupad, Phalgu, Akshayavat. The shiromani of all Pitra Tirthas — once-in-a-lifetime Pind Daan considered to permanently liberate ancestors." },
        { icon: Flame, title: "Kashi / Varanasi (UP)", body: "Manikarnika Ghat and Pishachmochan Kund. Pind Daan and Tripindi Shradh on the bank of Ganga in the city of Lord Vishweshwara." },
        { icon: Droplets, title: "Haridwar (Uttarakhand)", body: "Narayani Shila for Pitru Dosh nivaran, Har Ki Pauri Brahmakund for Tarpan, Kankhal for shradh — Mother Ganga herself carries the offering." },
        { icon: Compass, title: "Trimbakeshwar (Maharashtra)", body: "Source of the Godavari, one of the twelve Jyotirlingas. Famous for full Tripindi Shradh, Narayan Nagbali and Kalsarp Dosh nivaran." },
        { icon: Waves, title: "Rameshwaram (Tamil Nadu)", body: "Agni Tirtham and the 22 sacred kunds of the Ramnathaswamy temple. Sage-prescribed for shradh of ancestors who died at sea or far from home." },
        { icon: Sun, title: "Badrinath (Uttarakhand)", body: "Brahma Kapal Ghat in Badrinath is shastrically said to grant the same fruit as Gaya Shradh — performed at the height of the Himalayas." },
      ],
      steps: [
        { title: "Pick the Tirtha That Aligns", body: "Different tirthas suit different needs — Gaya for once-in-a-lifetime liberation, Haridwar for Pitru Dosh, Trimbakeshwar for Narayan Nagbali." },
        { title: "Confirm the Tithi", body: "Pitru Paksha is universally most auspicious. Otherwise, the death tithi or Amavasya works at every tirtha." },
        { title: "Book Through Verified Purohits", body: "Each tirtha has its own lineage of registered Tirth Purohits — we connect you only with verified, traceable practitioners." },
        { title: "Travel or Book Remotely", body: "Visit in person for full darshan and yatra, or book a remote Sankalp service if travel is not possible — the merit is identical." },
      ],
      faqs: [
        { q: "Which Pind Daan site is the most powerful?", a: "Gaya holds the highest position in shastra — Pind Daan there is considered 'akshay' (imperishable) and traditionally believed to fulfil the obligation permanently. Kashi follows for moksha-related shradh, and Haridwar specifically for Pitru Dosh nivaran." },
        { q: "Can I perform Pind Daan at multiple tirthas?", a: "Yes, and many devout families do — a one-time Gaya Shradh combined with annual Tarpan at Haridwar or the local river is a beautiful tradition. Each tirtha adds its own blessing." },
        { q: "What is special about Trimbakeshwar?", a: "Trimbakeshwar is one of the twelve Jyotirlingas and the source of the Godavari. It is uniquely prescribed for Narayan Nagbali (3-day vidhi for unnatural deaths) and Kalsarp Dosh nivaran in addition to standard Pind Daan." },
        { q: "Why is Rameshwaram important for ancestor rites?", a: "Lord Rama is said to have performed Tarpan at Agni Tirtham after the war. The 22 kunds of the Ramnathaswamy temple are each associated with a specific aspect of purification and shradh." },
        { q: "Is Brahma Kapal in Badrinath really equal to Gaya Shradh?", a: "Yes — Skanda Purana mentions that Brahma Kapal is one of the few sites where Pind Daan carries fruit equal to Gaya. The high-altitude location and the proximity of Lord Badri Vishal lend it exceptional power." },
        { q: "What if my ancestor was not Hindu by birth — is shradh still appropriate?", a: "Pind Daan is offered for the soul, not the religion. Many converts and inter-faith families perform shradh for departed elders out of love and gratitude — the Sanskrit Sankalp simply offers the merit to the named soul." },
        { q: "How do I choose between visiting and booking remotely?", a: "If you can travel, visiting in person allows full yatra, dakshin-yatra and personal Sankalp. If you cannot, remote pratinidhi shradh — accepted in shastra for centuries — gives identical fruit. Many NRIs combine annual remote Tarpan with a once-in-a-lifetime in-person Gaya yatra." },
      ],
      keywordsBlurb:
        "The most sacred Pind Daan and Tarpan sites in India — Gaya, Kashi (Varanasi), Haridwar, Trimbakeshwar, Rameshwaram, Badrinath Brahma Kapal, Pushkar, Prayagraj, Kurukshetra and more. Each tirtha's unique significance, ideal use case (Pitru Dosh, Narayan Nagbali, once-in-a-lifetime liberation, Tripindi Shradh), connected verified Tirth Purohits, and remote booking options for devotees in India and abroad.",
    },
  },
  {
    slug: "yearly-remote",
    pujaType: "pind-daan-yearly-remote",
    navTitle: "Yearly Remote Tarpan / Pind Daan",
    navTagline: "Performed every year on the death anniversary, anywhere in the world",
    navIcon: Globe,
    quickAnswer: "Yearly Remote Tarpan and Pind Daan is an annual subscription where verified Tirth Purohits at Kashi, Gaya or Haridwar perform the shradh on the correct death-anniversary tithi every year. You join the Sankalp via video call from any timezone, and each year receive photos, video, the Sankalp Patra, Ganga jal and prasad couriered worldwide. Tithi reminders are automatic; cancellation is free up to 7 days before.",
    hero: {
      eyebrow: "For NRIs & Busy Devotees",
      title: "Yearly Remote Tarpan & Pind Daan on Death Anniversary",
      titleHi: "वार्षिक श्राद्ध — कहीं से भी बुक करें",
      subtitle:
        "We perform the annual shradh of your departed loved one at a sacred tirth every year — on the exact tithi, with full vidhi, by verified pandits, while you watch live from anywhere in the world.",
    },
    content: {
      eyebrow: "Annual Pitru Seva",
      title: "Never Miss Your Ancestor's Shradh — Yearly Remote Service for Devotees Across the Globe",
      intro:
        "For NRIs, busy professionals and elderly parents who cannot travel — our yearly subscription ensures the annual Tarpan and Pind Daan of your departed loved one is performed every year on the correct tithi at a sacred tirth (Kashi, Gaya or Haridwar). You receive video, photos, the Sankalp Patra and prasad each year, never missing this most important Pitru duty.",
      trustBadges: [
        { value: "Auto", label: "Tithi Reminder" },
        { value: "Live", label: "Video Sankalp" },
        { value: "Choose", label: "Tirtha" },
        { value: "100%", label: "Refundable" },
      ],
      benefits: [
        { icon: Calendar, title: "Auto-Scheduled Annually", body: "Once you enrol, we calculate the correct shradh tithi each year by panchang and reach out 10 days in advance to confirm the date and slot." },
        { icon: Compass, title: "Choice of Sacred Tirth", body: "Pick where the ritual is performed each year — Kashi (Manikarnika), Gaya (Vishnupad), Haridwar (Har Ki Pauri / Narayani Shila), or rotate." },
        { icon: Users, title: "Verified Local Purohit", body: "Same family of Tirth Purohits services your booking each year, building continuity — your gotra and ancestor details are kept on record." },
        { icon: Globe, title: "Watch Live from Anywhere", body: "Sankalp via video call (Zoom / WhatsApp / Google Meet) at a time that works for your timezone — Sydney, Toronto, London, Dubai, San Francisco." },
        { icon: Heart, title: "Full Vidhi, Not Tokenistic", body: "Includes Sankalp, Tarpan, Pind Daan, Brahman Bhojan, Vastra Daan and Anna Daan — no shortcuts, full shastric procedure." },
        { icon: ShieldCheck, title: "Yearly Proof Pack", body: "Every year you receive: photographs, a video clip, the signed Sankalp Patra, Ganga jal, and prasad couriered to your address worldwide." },
      ],
      steps: [
        { title: "Enrol Your Ancestor", body: "Submit names, gotras and tithis of one or more departed loved ones. Choose your preferred tirth and language for the Sankalp call." },
        { title: "Pre-Tithi Reminder", body: "10 days before the shradh tithi each year, we email and call to confirm date, time slot and any updates to ancestor list." },
        { title: "Live Sankalp & Ritual", body: "On the day, you join a brief video call for Sankalp; the pandit then performs the full ritual on the ghat / vedi as your representative." },
        { title: "Receive Annual Proof Pack", body: "Photos and video within 24 hours; Sankalp Patra, Ganga jal and prasad couriered to your home address within 5–10 days." },
      ],
      faqs: [
        { q: "Is remote yearly shradh shastrically valid?", a: "Yes. The concept of pratinidhi karta (representative performer) is well established in dharma shastra — exactly what is done when a son cannot travel. The Sankalp is taken in your name and gotra, you participate via video, and the merit accrues fully to you and your ancestors." },
        { q: "Which tithi is used for the annual shradh?", a: "The traditional rule is the same Krishna Paksha tithi as the day of death (the death-tithi or shraddha-tithi), regardless of the English calendar date. We calculate this each year using authentic panchang." },
        { q: "Can I add multiple ancestors to one yearly subscription?", a: "Yes. Many families enrol both parents, grandparents and other departed elders. Each gets their own shradh on their own tithi, or several can be combined on Pitru Paksha Amavasya as 'Sarva Pitru Shradh'." },
        { q: "What if I miss the video Sankalp call due to timezone or schedule?", a: "We pre-record your Sankalp during the enrolment call and use it as backup. The pandit then performs the ritual referencing your name and gotra — proof is sent the same day." },
        { q: "Can I cancel or pause the subscription?", a: "Yes — fully refundable until 7 days before the next tithi, and you can pause for any year. There is no lock-in." },
        { q: "How is this different from a one-time Gaya Shradh?", a: "Gaya Shradh is the once-in-a-lifetime 'akshay' completion. Annual remote shradh is the ongoing yearly observance of the death tithi — many devout families do both." },
        { q: "Does the prasad courier reach abroad?", a: "Yes — we courier prasad and Ganga jal to over 60 countries via India Post International / DHL. Customs clearance is taken care of; arrival typically 7–14 days." },
        { q: "What is included in the price?", a: "Tirth Purohit dakshina, all samagri, Sankalp Patra, ritual photos and video, courier of prasad and Ganga jal worldwide, and ongoing tithi reminders. No hidden fees." },
        { q: "Can I attend in person if I happen to be in India that year?", a: "Of course — just let us know and we will host you at the ghat for the ritual. Many subscribers fly in for one of the years and continue remote thereafter." },
      ],
      keywordsBlurb:
        "Yearly remote Tarpan and Pind Daan service for NRIs and devotees abroad — annual shradh on the death anniversary tithi performed at Kashi, Gaya or Haridwar by verified Tirth Purohits, with live video Sankalp, photo and video proof, Sankalp Patra and Ganga jal prasad couriered worldwide. Auto-tithi reminders, multiple ancestors, choice of tirth, fully refundable, no lock-in. The most convenient way to never miss your departed loved one's annual shradh from anywhere in the world.",
    },
  },
];

const PAGES_BY_SLUG: Record<string, PindDaanPage> = Object.fromEntries(PAGES.map(p => [p.slug, p]));

// Display order on the hub — Gaya pushed first as the most powerful tirth for moksha of ancestors.
const HUB_ORDER = ["gaya", "kashi", "haridwar", "why-important", "sites-in-india", "yearly-remote"];
const PAGES_FOR_HUB = HUB_ORDER
  .map((slug) => PAGES_BY_SLUG[slug])
  .filter((p): p is PindDaanPage => Boolean(p));

const GAYA_TAGLINE = "Most powerful tirth for moksha of ancestors";

const HUB_FAQS: Faq[] = [
  { q: "Is remote Pind Daan accepted by shastra?", a: "Yes — the concept of pratinidhi (representative) shradh is centuries-old. As long as the Sankalp is taken correctly in your name and gotra, the merit accrues fully to you and your ancestors." },
  { q: "Which tirth should I choose?", a: "Gaya for once-in-a-lifetime liberation, Kashi for moksha-aligned shradh, Haridwar specifically for Pitru Dosh nivaran. Yearly remote service can rotate across these tirthas." },
  { q: "When is the best time to book?", a: "Pitru Paksha (16-day window in Bhadrapada-Ashwin) is most powerful, but Amavasya of any month, the death tithi, or any Krishna Paksha day are all auspicious." },
  { q: "Can daughters perform Pind Daan?", a: "Yes. While tradition emphasises sons, daughters, grandsons and even unrelated representatives can perform shradh with full validity. Mother Sita herself performed Pind Daan at Gaya." },
  { q: "Do you ship prasad outside India?", a: "Yes — we courier Ganga jal and prasad to 60+ countries via India Post International or DHL. Typical delivery 7–14 days; customs cleared." },
  { q: "What if I don't know all my ancestors' names?", a: "Even partial information works. The Sankalp can include 'all known and unknown ancestors of my paternal and maternal lineage' — the gotra carries the offering through." },
];

const HUB_KEYWORDS_BLURB = "Pind Daan, Tarpan and Shradh online — book at Kashi, Gaya, Haridwar, Trimbakeshwar or as a yearly remote service from anywhere in the world. Verified Tirth Purohits, full shastric vidhi as per Garuda Purana, live video Sankalp, photo and video proof, Sankalp Patra and Ganga jal prasad couriered worldwide. Ideal for Pitru Paksha, Amavasya, death anniversary and Pitru Dosh nivaran.";

const HUB_FAQS_HI: Faq[] = [
  { q: "क्या दूरस्थ पिंडदान शास्त्र-सम्मत है?", a: "हाँ — प्रतिनिधि श्राद्ध की अवधारणा सदियों पुरानी है। यदि संकल्प आपके नाम व गोत्र में सही प्रकार से लिया जाए, तो पूर्ण पुण्य आपको एवं आपके पितरों को प्राप्त होता है।" },
  { q: "मुझे कौन-सा तीर्थ चुनना चाहिए?", a: "एक बार आजीवन मुक्ति हेतु गया, मोक्ष-केंद्रित श्राद्ध हेतु काशी, और विशेष रूप से पितृ दोष निवारण हेतु हरिद्वार। वार्षिक दूरस्थ सेवा इन तीर्थों के बीच रोटेट हो सकती है।" },
  { q: "बुक करने का सर्वोत्तम समय कब है?", a: "पितृ पक्ष (भाद्रपद-अश्विन का 16-दिवसीय काल) सर्वाधिक प्रबल है, परंतु किसी भी मास की अमावस्या, मृत्यु तिथि, या कोई भी कृष्ण पक्ष का दिन भी शुभ है।" },
  { q: "क्या पुत्रियाँ पिंडदान कर सकती हैं?", a: "हाँ। यद्यपि परंपरा पुत्रों पर बल देती है, पुत्रियाँ, पौत्र एवं अन्य प्रतिनिधि भी पूर्ण मान्यता सहित श्राद्ध कर सकते हैं। स्वयं माता सीता ने गया में पिंडदान किया था।" },
  { q: "क्या आप भारत के बाहर प्रसाद भेजते हैं?", a: "हाँ — हम India Post International या DHL के माध्यम से 60+ देशों में गंगा जल व प्रसाद कूरियर करते हैं। सामान्य डिलीवरी 7–14 दिनों में; कस्टम क्लियरेंस सम्मिलित।" },
  { q: "यदि मुझे अपने सभी पितरों के नाम न ज्ञात हों तो?", a: "आंशिक जानकारी भी पर्याप्त है। संकल्प में 'मेरे पैतृक एवं मातृ वंश के समस्त ज्ञात व अज्ञात पितर' सम्मिलित किया जा सकता है — गोत्र अर्पण को आगे ले जाता है।" },
];

const HUB_KEYWORDS_BLURB_HI = "ऑनलाइन पिंडदान, तर्पण व श्राद्ध — काशी, गया, हरिद्वार, त्र्यंबकेश्वर पर बुक करें या कहीं से भी वार्षिक दूरस्थ सेवा लें। सत्यापित तीर्थ पुरोहित, गरुड़ पुराण के अनुसार पूर्ण शास्त्रीय विधि, लाइव वीडियो संकल्प, फोटो व वीडियो प्रमाण, संकल्प पत्र एवं गंगा जल प्रसाद विश्वव्यापी कूरियर। पितृ पक्ष, अमावस्या, मृत्यु तिथि एवं पितृ दोष निवारण हेतु आदर्श।";

function HeroSection({ eyebrow, title, titleHi, subtitle, ctaPujaType, icon: Icon }: { eyebrow: string; title: string; titleHi?: string; subtitle: string; ctaPujaType: string; icon?: LucideIcon }) {
  const HeroIcon = Icon || Flame;
  const { t } = useT();
  return (
    <div className="bg-[#6D2B35] text-white border-b border-[#D4AF37]/30">
      <div className="container mx-auto px-4 py-10 sm:py-14 max-w-4xl">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-px w-8 bg-[#D4AF37]/60" />
          <HeroIcon className="h-3.5 w-3.5 text-[#D4AF37]" />
          <span className="text-[#D4AF37] text-[11px] uppercase tracking-[0.25em] font-medium">{eyebrow}</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold leading-tight mb-2" data-testid="text-pind-daan-title">
          {title}
        </h1>
        {titleHi && (
          <p className="font-serif text-lg sm:text-xl text-[#D4AF37]/90 mb-3">{titleHi}</p>
        )}
        <p className="text-white/75 text-sm sm:text-base max-w-2xl leading-relaxed mb-6">
          {subtitle}
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href={`/puja?pujaType=${ctaPujaType}&mode=online`}>
            <button className={PRIMARY_BTN} data-testid="btn-book-seva-hero">
              <Flame className="w-4 h-4" /> {t("Book This Seva", "यह सेवा बुक करें")}
            </button>
          </Link>
          <Link href="/pind-daan">
            <button className="bg-transparent text-white border border-[#D4AF37]/40 hover:bg-white/10 rounded-md h-10 px-5 text-[13px] font-semibold transition-colors inline-flex items-center justify-center gap-2" data-testid="btn-explore-cluster">
              {t("All Pind Daan Services", "सभी पिंडदान सेवाएँ")} <ArrowRight className="w-4 h-4" />
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}

function BookSevaCallout({ pujaType, label }: { pujaType: string; label?: string }) {
  const { t } = useT();
  return (
    <div className="container mx-auto px-4 mt-10">
      <div className="max-w-3xl mx-auto bg-[#FBF7EE] border border-[#D4AF37]/25 rounded-md p-6 sm:p-8 text-center">
        <div className="w-11 h-11 rounded-md bg-white border border-[#D4AF37]/25 flex items-center justify-center mx-auto mb-3">
          <Flame className="w-5 h-5 text-[#6D2B35]" strokeWidth={1.6} />
        </div>
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="h-px w-6 bg-[#D4AF37]/60" />
          <span className="text-[#D4AF37] text-[10px] uppercase tracking-[0.25em] font-medium">{t("Pitru Seva", "पितृ सेवा")}</span>
          <div className="h-px w-6 bg-[#D4AF37]/60" />
        </div>
        <h3 className="font-serif text-xl sm:text-2xl text-[#6D2B35] font-bold mb-2">{t("Ready to Perform This Seva?", "यह सेवा सम्पन्न करने के लिए तैयार हैं?")}</h3>
        <p className="text-sm text-[#5a4a3a]/75 mb-5 max-w-xl mx-auto leading-relaxed">
          {t("Verified Tirth Purohits, full vidhi, live Sankalp via video call, photo + video proof and prasad couriered to your home — anywhere in the world.", "सत्यापित तीर्थ पुरोहित, पूर्ण विधि, वीडियो कॉल पर लाइव संकल्प, फोटो + वीडियो प्रमाण एवं प्रसाद आपके घर तक — विश्व में कहीं भी।")}
        </p>
        <Link href={`/puja?pujaType=${pujaType}&mode=online`}>
          <button className={PRIMARY_BTN} data-testid="btn-book-seva-bottom">
            {label || t("Book This Seva Now", "यह सेवा अभी बुक करें")} <ArrowRight className="w-4 h-4" />
          </button>
        </Link>
      </div>
    </div>
  );
}

function HubHero() {
  const { t } = useT();
  return (
    <div className="relative bg-[#1a0f10] text-white border-b border-[#D4AF37]/30 overflow-hidden">
      <img
        src={pindDaanHubCollage}
        alt="Sacred Pind Daan rituals at Gaya, Kashi and Haridwar — triptych of ghats and pandits performing shradh"
        className="absolute inset-0 w-full h-full object-cover"
        loading="eager"
        data-testid="img-pind-daan-hub-hero"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/15" aria-hidden="true" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/20" aria-hidden="true" />
      <div className="relative container mx-auto px-4 py-14 sm:py-20 max-w-4xl">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-px w-8 bg-[#D4AF37]/60" />
          <Flame className="h-3.5 w-3.5 text-[#D4AF37]" />
          <span className="text-[#D4AF37] text-[11px] uppercase tracking-[0.25em] font-medium">{t("Pitru Seva — Sacred Ancestor Rites", "पितृ सेवा — पवित्र पूर्वज अनुष्ठान")}</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold leading-tight mb-3" data-testid="text-pind-daan-title">
          {t("Online Pind Daan in Gaya, Kashi & Haridwar — Perform Shradh from Anywhere", "गया, काशी व हरिद्वार में ऑनलाइन पिंडदान — कहीं से भी करें श्राद्ध")}
        </h1>
        <p className="font-serif text-lg sm:text-xl text-[#D4AF37]/90 mb-3">पिंडदान | तर्पण | श्राद्ध</p>
        <p className="text-white/85 text-sm sm:text-base max-w-2xl leading-relaxed mb-3">
          {t("Perform sacred Pind Daan for your ancestors with verified Tirth Purohits. Live Sankalp via video call, full photo and video proof, Sankalp Patra and prasad delivered worldwide.", "सत्यापित तीर्थ पुरोहितों के साथ अपने पितरों के लिए पवित्र पिंडदान करवाएँ। वीडियो कॉल पर लाइव संकल्प, पूर्ण फोटो व वीडियो प्रमाण, संकल्प पत्र व प्रसाद विश्वव्यापी वितरण।")}
        </p>
        <p className="text-[#D4AF37]/95 text-sm sm:text-base max-w-2xl leading-relaxed mb-6 italic">
          {t("Fulfil your duty towards your ancestors and bring peace to their souls.", "अपने पितरों के प्रति कर्तव्य निभाएँ और उनकी आत्मा को शांति प्रदान करें।")}
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href="/puja?pujaType=pind-daan-gaya&mode=online">
            <button className={PRIMARY_BTN} data-testid="btn-book-pind-daan-hero">
              <Flame className="w-4 h-4" /> {t("Book Pind Daan Today", "आज पिंडदान बुक करें")}
            </button>
          </Link>
          <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
            <button className="bg-transparent text-white border border-[#D4AF37]/50 hover:bg-white/10 rounded-md h-10 px-5 text-[13px] font-semibold transition-colors inline-flex items-center justify-center gap-2" data-testid="btn-whatsapp-hero">
              <MessageCircle className="w-4 h-4" /> {t("Get Guidance Before Booking", "बुकिंग से पूर्व मार्गदर्शन प्राप्त करें")}
            </button>
          </a>
        </div>
      </div>
    </div>
  );
}

function WhyWithoutDelaySection() {
  const { t } = useT();
  return (
    <section className="container mx-auto px-4 mt-12">
      <div className="max-w-5xl mx-auto bg-[#FBF7EE] border border-[#D4AF37]/25 rounded-md overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
          <div className="relative min-h-[220px] md:min-h-[340px]">
            <img
              src={heroPindDaan}
              alt="Pind Daan ritual being performed at the ghat by a Tirth Purohit"
              className="absolute inset-0 w-full h-full object-cover"
              loading="lazy"
              data-testid="img-why-without-delay"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#6D2B35]/40 via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:via-transparent md:to-[#FBF7EE]/30" aria-hidden="true" />
          </div>
          <div className="p-6 sm:p-8">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-px w-6 bg-[#D4AF37]/60" />
              <Clock className="h-3.5 w-3.5 text-[#D4AF37]" />
              <span className="text-[#D4AF37] text-[10px] uppercase tracking-[0.25em] font-medium">{t("Pitru Rina", "पितृ ऋण")}</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl text-[#6D2B35] font-bold leading-tight mb-3" data-testid="text-why-without-delay-title">
              {t("Why Perform Pind Daan Without Delay", "विलंब किए बिना पिंडदान क्यों करें")}
            </h2>
            <p className="text-[#5a4a3a]/85 text-sm sm:text-[15px] leading-relaxed mb-2">
              {t("In Hindu dharma, Pind Daan is not just a ritual — it is a responsibility.", "हिंदू धर्म में पिंडदान केवल अनुष्ठान नहीं — यह एक उत्तरदायित्व है।")}
            </p>
            <p className="text-[#5a4a3a]/75 text-sm leading-relaxed mb-4">
              {t("It is believed that without proper shradh and pind daan, ancestral souls may remain unsatisfied.", "मान्यता है कि उचित श्राद्ध एवं पिंडदान के बिना पितरों की आत्माएँ असंतुष्ट रह सकती हैं।")}
            </p>
            <p className="text-[#6D2B35] text-sm font-semibold mb-2">{t("Performing this sacred ritual:", "यह पवित्र अनुष्ठान करने से:")}</p>
            <ul className="space-y-2.5">
              {[
                { icon: Heart, text: t("Brings peace to departed souls", "दिवंगत आत्माओं को शांति मिलती है") },
                { icon: ShieldCheck, text: t("Removes Pitru Dosh", "पितृ दोष का निवारण होता है") },
                { icon: Sparkles, text: t("Brings prosperity and harmony in life", "जीवन में समृद्धि एवं सौहार्द आता है") },
              ].map((item) => (
                <li key={item.text} className="flex items-start gap-2.5" data-testid={`item-without-delay-${item.text.toLowerCase().replace(/\s+/g, '-').slice(0, 30)}`}>
                  <span className="w-7 h-7 rounded-md bg-white border border-[#D4AF37]/25 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <item.icon className="w-3.5 h-3.5 text-[#6D2B35]" strokeWidth={1.8} />
                  </span>
                  <span className="text-[#5a4a3a] text-sm leading-relaxed">{item.text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

function PerformAnywhereSection() {
  const { t } = useT();
  const items = [
    { icon: Video, title: t("Live Sankalp via video call", "वीडियो कॉल पर लाइव संकल्प"), body: t("Join from any country at a time that suits your timezone.", "किसी भी देश से अपने टाइमज़ोन के अनुकूल समय पर जुड़ें।") },
    { icon: BookOpen, title: t("Ritual performed in your name & gotra", "आपके नाम व गोत्र में अनुष्ठान"), body: t("Full pratinidhi shradh — the merit accrues entirely to you.", "पूर्ण प्रतिनिधि श्राद्ध — पूर्ण पुण्य आपको प्राप्त होता है।") },
    { icon: Camera, title: t("Photos & video proof within 24 hours", "24 घंटे में फोटो व वीडियो प्रमाण"), body: t("See every stage of the ritual with the Sankalp Patra signed by the purohit.", "पुरोहित द्वारा हस्ताक्षरित संकल्प पत्र सहित अनुष्ठान का प्रत्येक चरण देखें।") },
    { icon: Package, title: t("Prasad & Ganga Jal delivered worldwide", "विश्वव्यापी प्रसाद व गंगा जल वितरण"), body: t("Couriered to 60+ countries via India Post International / DHL.", "India Post International / DHL के द्वारा 60+ देशों में कूरियर।") },
  ];
  return (
    <section className="container mx-auto px-4 mt-12">
      <div className="max-w-5xl mx-auto bg-[#6D2B35] text-white rounded-md p-6 sm:p-10 border border-[#D4AF37]/40">
        <div className="text-center mb-7">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="h-px w-6 bg-[#D4AF37]/60" />
            <Globe className="h-3.5 w-3.5 text-[#D4AF37]" />
            <span className="text-[#D4AF37] text-[10px] uppercase tracking-[0.25em] font-medium">{t("For NRIs & Devotees Abroad", "NRI एवं विदेश में भक्तों के लिए")}</span>
            <div className="h-px w-6 bg-[#D4AF37]/60" />
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl text-white font-bold leading-tight mb-2" data-testid="text-anywhere-title">
            {t("Perform Pind Daan from Anywhere in the World", "विश्व में कहीं से भी करें पिंडदान")}
          </h2>
          <p className="text-white/75 text-sm leading-relaxed max-w-2xl mx-auto">
            {t("You do not have to travel to Bharat. Our verified Tirth Purohits perform the full ritual on your behalf — you participate live, see every stage, and receive prasad at home.", "आपको भारत आने की आवश्यकता नहीं है। हमारे सत्यापित तीर्थ पुरोहित आपके निमित्त पूर्ण अनुष्ठान करते हैं — आप लाइव सम्मिलित होते हैं, प्रत्येक चरण देखते हैं, और प्रसाद घर पर प्राप्त करते हैं।")}
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-7">
          {items.map((item) => (
            <div
              key={item.title}
              className="bg-white/5 border border-[#D4AF37]/30 rounded-md p-4 flex items-start gap-3"
              data-testid={`item-anywhere-${item.title.toLowerCase().replace(/\s+/g, '-').slice(0, 30)}`}
            >
              <span className="w-9 h-9 rounded-md bg-[#D4AF37]/15 border border-[#D4AF37]/40 flex items-center justify-center flex-shrink-0">
                <item.icon className="w-4 h-4 text-[#D4AF37]" strokeWidth={1.8} />
              </span>
              <div>
                <h3 className="text-white font-semibold text-sm mb-1">{item.title}</h3>
                <p className="text-white/70 text-xs leading-relaxed">{item.body}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/puja?pujaType=pind-daan-gaya&mode=online">
            <button className="bg-[#D4AF37] text-[#6D2B35] hover:bg-[#c19f30] rounded-md h-10 px-5 text-[13px] font-semibold transition-colors inline-flex items-center justify-center gap-2" data-testid="btn-book-anywhere">
              <Flame className="w-4 h-4" /> {t("Book Pind Daan Today", "आज पिंडदान बुक करें")}
            </button>
          </Link>
          <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
            <button className="bg-transparent text-white border border-[#D4AF37]/50 hover:bg-white/10 rounded-md h-10 px-5 text-[13px] font-semibold transition-colors inline-flex items-center justify-center gap-2" data-testid="btn-whatsapp-anywhere">
              <MessageCircle className="w-4 h-4" /> {t("Get Guidance Before Booking", "बुकिंग से पूर्व मार्गदर्शन प्राप्त करें")}
            </button>
          </a>
        </div>
      </div>
    </section>
  );
}

function SeoFooterParagraph() {
  const { t } = useT();
  return (
    <section className="container mx-auto px-4 mt-12">
      <div className="max-w-4xl mx-auto bg-[#FBF7EE] border border-[#D4AF37]/25 rounded-md p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-2">
          <Award className="h-3.5 w-3.5 text-[#D4AF37]" />
          <span className="text-[#D4AF37] text-[10px] uppercase tracking-[0.25em] font-medium">{t("Verified Tirth Purohits • Worldwide Delivery", "सत्यापित तीर्थ पुरोहित • विश्वव्यापी वितरण")}</span>
        </div>
        <p className="text-[#5a4a3a]/85 text-sm leading-relaxed" data-testid="text-seo-footer">
          {t("Book online Pind Daan, Shradh, and Tarpan services in Gaya, Kashi, and Haridwar with verified Tirth Purohits. Vedic Tatva offers complete remote ritual services including live video Sankalp, photo and video proof, and worldwide prasad delivery. Ideal for NRIs looking to perform Hindu ancestor rituals from abroad.", "गया, काशी एवं हरिद्वार में सत्यापित तीर्थ पुरोहितों के साथ ऑनलाइन पिंडदान, श्राद्ध एवं तर्पण सेवाएँ बुक करें। वैदिक तत्व लाइव वीडियो संकल्प, फोटो व वीडियो प्रमाण एवं विश्वव्यापी प्रसाद वितरण सहित संपूर्ण दूरस्थ अनुष्ठान सेवाएँ प्रदान करता है। विदेश से हिंदू पूर्वज अनुष्ठान करने के इच्छुक NRI के लिए आदर्श।")}
        </p>
      </div>
    </section>
  );
}

export function PindDaanHub() {
  const { t, isHi } = useT();
  return (
    <div className="w-full pb-16 bg-white">
      <PageSeo
        title="Online Pind Daan, Tarpan & Shradh — Gaya, Kashi, Haridwar | Vedic Tatva"
        description="Book authentic Pind Daan, Tarpan and Shradh online at Gaya, Kashi, Haridwar or as a yearly remote service from anywhere. Verified Tirth Purohits, live video Sankalp, full proof and worldwide prasad delivery."
        canonical="/pind-daan"
        twitterCard="summary_large_image"
        schemas={[faqPage(HUB_FAQS.map((f) => ({ question: f.q, answer: f.a })))]}
      />
      <HubHero />

      <div className="container mx-auto px-4">
        <QuickAnswer
          text={t("Online Pind Daan is a remote Shradh ritual where verified Tirth Purohits at sacred ghats — Gaya, Kashi or Haridwar — perform Pind Daan, Tarpan and Shradh on your behalf for departed ancestors. You join the Sankalp via live video call, receive full photo and video proof and the Sankalp Patra, and prasad is couriered to your home anywhere in India or abroad.", "ऑनलाइन पिंडदान एक दूरस्थ श्राद्ध अनुष्ठान है, जिसमें गया, काशी या हरिद्वार के पवित्र घाटों पर सत्यापित तीर्थ पुरोहित आपके निमित्त पितरों के लिए पिंडदान, तर्पण व श्राद्ध सम्पन्न करते हैं। आप लाइव वीडियो कॉल पर संकल्प में सम्मिलित होते हैं, पूर्ण फोटो/वीडियो प्रमाण व संकल्प पत्र प्राप्त करते हैं, और प्रसाद भारत व विदेश में आपके घर पर कूरियर किया जाता है।")}
          testId="quick-answer-pind-daan-hub"
        />
      </div>

      <CompactTithiCalculator testIdPrefix="tithi-pind-daan-hub" />

      <WhyWithoutDelaySection />

      <div className="container mx-auto px-4 mt-12">
        <div className="max-w-3xl mx-auto text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="h-px w-6 bg-[#D4AF37]/60" />
            <Sparkles className="h-3.5 w-3.5 text-[#D4AF37]" />
            <span className="text-[#D4AF37] text-[10px] uppercase tracking-[0.25em] font-medium">{t("Sacred Tirthas", "पवित्र तीर्थ")}</span>
            <div className="h-px w-6 bg-[#D4AF37]/60" />
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl text-[#6D2B35] font-bold leading-tight mb-2" data-testid="text-services-title">
            {t("Book Pind Daan at Sacred Tirthas", "पवित्र तीर्थों पर पिंडदान बुक करें")}
          </h2>
          <p className="text-[#5a4a3a]/70 text-sm leading-relaxed">
            {t("From a one-time Gaya Shradh that liberates ancestors permanently, to yearly remote Tarpan you can book from abroad — every form of Pitru seva, performed authentically.", "गया श्राद्ध, जो पितरों को सदा के लिए मुक्ति प्रदान करता है, से लेकर विदेश से बुक की जा सकने वाली वार्षिक दूरस्थ तर्पण सेवा तक — प्रत्येक प्रकार की पितृ सेवा, प्रामाणिक विधि से।")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">
          {PAGES_FOR_HUB.map((p) => {
            const Icon = p.navIcon;
            const isGaya = p.slug === "gaya";
            const tagline = isGaya ? GAYA_TAGLINE : p.navTagline;
            // Use SEO-friendly alias URLs for the 3 core city pages so they get crawled & indexed independently.
            const seoAlias: Record<string, string> = {
              gaya: "/pind-daan-gaya",
              kashi: "/pind-daan-kashi",
              haridwar: "/pind-daan-haridwar",
            };
            const href = seoAlias[p.slug] || `/pind-daan/${p.slug}`;
            return (
              <Link
                key={p.slug}
                href={href}
                className={`block rounded-md border p-5 hover-elevate transition-all h-full ${isGaya ? "bg-[#FBF7EE] border-[#D4AF37]/55 ring-1 ring-[#D4AF37]/30" : "bg-white border-[#D4AF37]/25"}`}
                data-testid={`card-pind-daan-${p.slug}`}
              >
                <div className="flex items-start justify-between mb-3 gap-2">
                  <div className="w-10 h-10 rounded-md bg-white border border-[#D4AF37]/25 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-[#6D2B35]" strokeWidth={1.6} />
                  </div>
                  {isGaya && (
                    <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.18em] font-bold text-[#D4AF37] bg-[#6D2B35] px-2 h-6 rounded-md" data-testid="badge-gaya-most-important">
                      <Award className="w-3 h-3" /> {t("Most Important", "सर्वाधिक महत्वपूर्ण")}
                    </span>
                  )}
                </div>
                <h3 className="font-serif text-base text-[#6D2B35] font-bold mb-1 leading-snug">{p.navTitle}</h3>
                <p className="text-xs text-[#5a4a3a]/75 leading-relaxed mb-3">{tagline}</p>
                <span className="inline-flex items-center gap-1 text-[11px] text-[#D4AF37] uppercase tracking-[0.2em] font-medium">
                  {t("Read more", "और पढ़ें")} <ChevronRight className="w-3 h-3" />
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="container mx-auto px-4 mt-10">
        <div className="max-w-3xl mx-auto bg-gradient-to-br from-[#FBF7EE] to-white border border-[#D4AF37]/30 rounded-md p-5 sm:p-6" data-testid="card-tarpan-kit-crosssell">
          <div className="flex items-start gap-4 sm:gap-5">
            <div className="hidden sm:flex w-14 h-14 rounded-md bg-white border border-[#D4AF37]/30 items-center justify-center flex-shrink-0">
              <Droplets className="w-6 h-6 text-[#6D2B35]" strokeWidth={1.6} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] uppercase tracking-[0.25em] text-[#D4AF37] font-semibold mb-1.5">{t("Companion Service", "साथ की सेवा")}</p>
              <h3 className="font-serif text-base sm:text-lg text-[#6D2B35] font-bold mb-1.5 leading-snug">
                {t("Add a Home Tarpan Kit to your booking", "अपनी बुकिंग में घरेलू तर्पण किट जोड़ें")}
              </h3>
              <p className="text-xs sm:text-[13px] text-[#5a4a3a]/75 leading-relaxed mb-3">
                {t("Til, jau, kusha grass, kumkum, copper Tarpan vessel and a printed Sankalp vidhi — everything you need to perform daily Tarpan at home alongside the pandit's tirth ritual. Ships pan-India in 3–5 days.", "तिल, जौ, कुशा, कुमकुम, ताम्र तर्पण पात्र एवं मुद्रित संकल्प विधि — पुरोहित के तीर्थ अनुष्ठान के साथ घर पर दैनिक तर्पण हेतु आवश्यक सब कुछ। 3–5 दिन में पैन-इंडिया डिलीवरी।")}
              </p>
              <Link href="/spiritual-essentials?category=Puja+Samagri">
                <button className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#6D2B35] hover:text-[#D4AF37] transition-colors" data-testid="link-tarpan-kit">
                  {t("Browse Tarpan Kits", "तर्पण किट देखें")} <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <PerformAnywhereSection />

      <PageAPlusContent
        eyebrow={isHi ? "पिंडदान हेतु वैदिक तत्व क्यों" : "Why Vedic Tatva for Pind Daan"}
        title={isHi ? "प्रामाणिक पूर्वज अनुष्ठान — पूर्ण शास्त्रीय विधि से सम्पन्न" : "Authentic Ancestor Rites — Performed With Full Shastric Vidhi"}
        intro={isHi
          ? "हम प्रत्येक पवित्र स्थल पर केवल सत्यापित, परंपरा-प्रशिक्षित तीर्थ पुरोहितों के साथ कार्य करते हैं। प्रत्येक बुकिंग में लाइव वीडियो कॉल पर संकल्प, अनुष्ठान की पूर्ण फोटो व वीडियो क्लिप, पुरोहित द्वारा हस्ताक्षरित व मुहरबंद संकल्प पत्र, एवं गंगा जल व प्रसाद विश्व में कहीं भी आपके घर तक कूरियर सम्मिलित है।"
          : "We work only with verified, lineage-trained Tirth Purohits at each sacred site. Every booking includes Sankalp via live video call, full ritual photographs and a video clip, the Sankalp Patra signed and sealed by the purohit, and Ganga jal plus prasad couriered to your home anywhere in the world."}
        trustBadges={isHi ? [
          { value: "सत्यापित", label: "तीर्थ पुरोहित" },
          { value: "लाइव", label: "वीडियो संकल्प" },
          { value: "संकल्प पत्र", label: "हस्ताक्षरित प्रमाण" },
          { value: "विश्वव्यापी", label: "प्रसाद कूरियर" },
        ] : [
          { value: "Verified", label: "Tirth Purohits" },
          { value: "Live", label: "Video Sankalp" },
          { value: "Sankalp Patra", label: "Signed Proof" },
          { value: "Worldwide", label: "Prasad Courier" },
        ]}
        benefits={isHi ? [
          { icon: ShieldCheck, title: "सत्यापित तीर्थ पुरोहित", body: "प्रत्येक तीर्थ का अपना पंजीकृत पुरोहित वंश है — गया में गयावाल, मणिकर्णिका पर काशी-प्रशिक्षित कर्मकांडी, हरिद्वार के बही-रक्षक। हम केवल ट्रेसेबल, पंजीकृत परिवारों का चयन करते हैं।" },
          { icon: BookOpen, title: "प्रामाणिक शास्त्रीय विधि", body: "संकल्प, तर्पण, पिंड अर्पण, ब्राह्मण भोजन व अन्न दान — गरुड़ पुराण, वायु पुराण एवं स्थानीय स्थान-रिवाज के अनुसार पूर्ण विधि।" },
          { icon: Globe, title: "वास्तव में कहीं से भी बुक करें", body: "NRI एवं उन भक्तों के लिए जो यात्रा नहीं कर सकते — संकल्प कॉल आपके टाइमज़ोन के अनुसार, प्रसाद 60+ देशों में कूरियर।" },
          { icon: Sparkles, title: "पूर्ण प्रमाण पैक", body: "प्रत्येक चरण की फोटो, 2–3 मिनट का वीडियो क्लिप, पुरोहित की मुहर सहित संकल्प पत्र, एवं गंगा जल व प्रसाद — हर बार।" },
          { icon: Heart, title: "वार्षिक निरंतरता", body: "वही पुरोहित परिवार आपकी वार्षिक श्राद्ध सेवा प्रति वर्ष सम्पन्न करता है, आपके गोत्र व पितर रिकॉर्ड संरक्षित रखते हुए।" },
          { icon: Calendar, title: "आपके लिए तिथि गणना", body: "हम पंचांग द्वारा प्रतिवर्ष सही कृष्ण पक्ष तिथि की गणना करते हैं — आपको हिंदू कैलेंडर ट्रैक करने की आवश्यकता नहीं।" },
        ] : [
          { icon: ShieldCheck, title: "Verified Tirth Purohits", body: "Each tirth has its own lineage of registered purohits — Gayawal at Gaya, Kashi-trained karmakandi at Manikarnika, Haridwar Bahi-keepers. We use only traceable, registered families." },
          { icon: BookOpen, title: "Authentic Shastric Vidhi", body: "Sankalp, Tarpan, Pinda offering, Brahman Bhojan and Anna Daan — full vidhi as per Garuda Purana, Vayu Purana and the local sthaana rivaaj." },
          { icon: Globe, title: "Truly Bookable Anywhere", body: "Designed for NRIs and devotees who cannot travel — Sankalp call scheduled to your timezone, prasad couriered to 60+ countries." },
          { icon: Sparkles, title: "Full Proof Package", body: "Photos of every stage, 2–3 min video clip, Sankalp Patra with purohit's seal, plus Ganga jal and prasad — every single time." },
          { icon: Heart, title: "Annual Continuity", body: "Same family of purohits services your annual shradh year after year, keeping your gotra and ancestor records on file." },
          { icon: Calendar, title: "Tithi Calculated for You", body: "We calculate the correct Krishna Paksha tithi each year by panchang — no need to track the Hindu calendar yourself." },
        ]}
        steps={isHi ? [
          { title: "अपनी सेवा चुनें", body: "काशी, गया, हरिद्वार पिंडदान या वार्षिक दूरस्थ तर्पण चुनें। उपयुक्तता हेतु प्रत्येक पृष्ठ पढ़ें।" },
          { title: "पितृ विवरण भेजें", body: "दोनों पक्षों की तीन पीढ़ियों तक के नाम, गोत्र, देहत्याग की तिथि (यदि ज्ञात हो)।" },
          { title: "संकल्प व अनुष्ठान", body: "मुहूर्त समय पर संक्षिप्त वीडियो संकल्प; तत्पश्चात पुरोहित द्वारा पवित्र स्थल पर पूर्ण अनुष्ठान।" },
          { title: "प्रमाण व प्रसाद प्राप्त करें", body: "24 घंटे में फोटो व वीडियो; संकल्प पत्र, गंगा जल व प्रसाद आपके पते पर कूरियर।" },
        ] : [
          { title: "Pick Your Service", body: "Choose Kashi, Gaya, Haridwar Pind Daan or yearly remote Tarpan. Read each page for the right fit." },
          { title: "Submit Pitru Details", body: "Names, gotras, tithi of departure (if known) for up to three generations on both sides." },
          { title: "Sankalp & Ritual", body: "Brief video Sankalp at the muhurat hour; ritual then performed by the purohit at the sacred site." },
          { title: "Receive Proof & Prasad", body: "Photos and video within 24 hours; Sankalp Patra, Ganga jal and prasad couriered to your address." },
        ]}
        faqs={isHi ? HUB_FAQS_HI : HUB_FAQS}
        keywordsBlurb={isHi ? HUB_KEYWORDS_BLURB_HI : HUB_KEYWORDS_BLURB}
      />

      <div className="container mx-auto px-4 mt-10">
        <div className="max-w-3xl mx-auto bg-[#FBF7EE] border border-[#D4AF37]/25 rounded-md p-6 sm:p-8 text-center">
          <h3 className="font-serif text-xl sm:text-2xl text-[#6D2B35] font-bold mb-2">{t("Ready to Begin This Sacred Duty?", "यह पवित्र कर्तव्य आरंभ करने के लिए तैयार हैं?")}</h3>
          <p className="text-sm text-[#5a4a3a]/75 mb-5 max-w-xl mx-auto leading-relaxed">
            {t("Speak to our team for personal guidance, or book your Pind Daan now — fully refundable, no lock-in.", "वैयक्तिक मार्गदर्शन हेतु हमारी टीम से बात करें, या अभी अपना पिंडदान बुक करें — पूर्ण रिफंड योग्य, कोई बाध्यता नहीं।")}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/puja?pujaType=pind-daan-gaya&mode=online">
              <button className={PRIMARY_BTN} data-testid="btn-book-pind-daan-bottom">
                <Flame className="w-4 h-4" /> {t("Book Pind Daan Today", "आज पिंडदान बुक करें")}
              </button>
            </Link>
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
              <button className={OUTLINE_BTN} data-testid="btn-whatsapp-bottom">
                <MessageCircle className="w-4 h-4" /> {t("Get Guidance Before Booking", "बुकिंग से पूर्व मार्गदर्शन प्राप्त करें")}
              </button>
            </a>
          </div>
        </div>
      </div>

      <SeoFooterParagraph />
    </div>
  );
}

export function PindDaanDetail({ slugOverride }: { slugOverride?: string } = {}) {
  const [, params] = useRoute("/pind-daan/:slug");
  const slug = slugOverride || params?.slug || "";
  const page = PAGES_BY_SLUG[slug];

  if (!page) return <NotFound />;

  return (
    <div className="w-full pb-16 bg-white">
      <PageSeo
        title={`${page.hero.title} | Vedic Tatva`}
        description={page.hero.subtitle}
        canonical={`/pind-daan/${page.slug}`}
        twitterCard="summary_large_image"
        schemas={[faqPage(page.content.faqs.map((f) => ({ question: f.q, answer: f.a })))]}
      />
      <HeroSection
        eyebrow={page.hero.eyebrow}
        title={page.hero.title}
        titleHi={page.hero.titleHi}
        subtitle={page.hero.subtitle}
        ctaPujaType={page.pujaType}
        icon={page.navIcon}
      />

      {page.quickAnswer && (
        <div className="container mx-auto px-4">
          <QuickAnswer text={page.quickAnswer} testId={`quick-answer-${page.slug}`} />
        </div>
      )}

      <CompactTithiCalculator testIdPrefix={`tithi-pind-daan-${page.slug}`} />

      {/* Sub-page nav strip */}
      <div className="container mx-auto px-4 mt-5">
        <div className="max-w-5xl mx-auto flex items-center gap-2 overflow-x-auto pb-2">
          <Link
            href="/pind-daan"
            className="text-[11px] text-[#6D2B35] hover:text-[#5a1f29] whitespace-nowrap font-semibold uppercase tracking-[0.2em]"
            data-testid="link-pind-daan-hub"
          >
            ← All Services
          </Link>
          <span className="text-[#D4AF37]/40 mx-1">|</span>
          {PAGES.filter(p => p.slug !== slug).map((p) => (
            <Link
              key={p.slug}
              href={`/pind-daan/${p.slug}`}
              className="text-[11px] text-[#5a4a3a] hover:text-[#6D2B35] whitespace-nowrap px-2.5 h-7 inline-flex items-center rounded-md bg-[#FBF7EE] border border-[#D4AF37]/25 hover-elevate"
              data-testid={`link-related-${p.slug}`}
            >
              {p.navTitle}
            </Link>
          ))}
        </div>
      </div>

      <PageAPlusContent {...page.content} />

      <BookSevaCallout pujaType={page.pujaType} />
    </div>
  );
}

// ============================================================================
// City Pind Daan landing pages — Gaya, Kashi, Haridwar
// ============================================================================

type PindDaanPackage = {
  id: string;
  name: string;
  subtitle: string;
  icon: LucideIcon;
  price: number;
  originalPrice?: number;
  duration: string;
  vidhi: string;
  badge: string | null;
  tagline: string;
  ritual: string[];
  proof: string[];
  delivery: string[];
  cta: string;
};

type SacredSite = {
  icon: LucideIcon;
  name: string;
  note: string;
  image: string;
};

type CityConfig = {
  slug: "gaya" | "kashi" | "haridwar";
  cityName: string;
  cityNameHindi: string;
  pujaType: string;
  whatsappUrl: string;
  scriptureLabel: string;
  quickAnswer: string;
  hero: {
    eyebrow: string;
    h1: string;
    sub: string;
    emotional: string;
    image: string;
    bookCta: string;
    trustBadges: string[];
  };
  whyImportant: {
    title: string;
    intro: string;
    beliefs: string[];
    sites: SacredSite[];
    sitesIntro: string;
  };
  anywhere: {
    kicker: string;
    image: string;
    intro: string;
  };
  howSteps: { title: string; body: string }[];
  packages: PindDaanPackage[];
  packagesTitle: string;
  packagesIntro: string;
  whyChooseTitle: string;
  whyChooseIntro: string;
  whyChooseItems: { icon: LucideIcon; text: string }[];
  faqs: Faq[];
  finalCta: { title: string; sub: string };
};

const waUrl = (text: string) =>
  "https://wa.me/918447844702?text=" + encodeURIComponent(text);

const COMMON_ANYWHERE_ITEMS = [
  { icon: Video, text: "Sankalp is taken live via video call" },
  { icon: BookOpen, text: "Ritual is performed in your name & gotra" },
  { icon: Camera, text: "Full photo & video proof is shared" },
  { icon: Package, text: "Prasad & Ganga Jal delivered to your home" },
];

// ----------------------------------------------------------------------------
// GAYA
// ----------------------------------------------------------------------------

const GAYA_PACKAGES: PindDaanPackage[] = [
  {
    id: "basic",
    name: "Basic Sankshipt",
    subtitle: "संक्षिप्त विधि",
    icon: Droplets,
    price: 6999,
    duration: "1 Day",
    vidhi: "Vishnupad + Phalgu",
    badge: null,
    tagline: "Essential Pind Daan with traditional offerings — perfect for first-time bookings.",
    ritual: [
      "Pind Daan at Phalgu River & Vishnupad",
      "Standard pinda offerings (rice, jau, til)",
      "Sankalp in your name & gotra",
      "Tarpan with til-jal",
    ],
    proof: ["5–7 ritual photographs", "Sankalp acknowledgement"],
    delivery: ["Digital pack via email & WhatsApp"],
    cta: "Book Basic",
  },
  {
    id: "standard",
    name: "Standard Vidhi",
    subtitle: "मुख्य गया श्राद्ध",
    icon: Flame,
    price: 11000,
    originalPrice: 14500,
    duration: "1 Day",
    vidhi: "Vishnupad + Phalgu + Akshayavat",
    badge: "Most Booked",
    tagline: "Full traditional vidhi at all three sacred sites with premium-quality offerings.",
    ritual: [
      "Pind Daan at Vishnupad, Phalgu & Akshayavat",
      "Premium pinda offerings (pure ghee, kheer, fruits)",
      "Live video Sankalp with you",
      "Tarpan, dhoop, deep & flower archana",
    ],
    proof: ["20+ HD ritual photographs", "2–3 minute video highlight", "Signed Sankalp Patra"],
    delivery: ["Digital pack within 24 hours", "Akshayavat prasad to your home (India)"],
    cta: "Book Standard",
  },
  {
    id: "premium",
    name: "Premium Moksha",
    subtitle: "त्रिदिन शास्त्रोक्त विधि",
    icon: Sparkles,
    price: 21000,
    originalPrice: 28000,
    duration: "3 Days",
    vidhi: "All 16 Vedis of Gaya",
    badge: "Includes Bhandara",
    tagline: "Complete 3-day shastric vidhi with the finest offerings & a Brahman Bhandara in your name.",
    ritual: [
      "Full 3-day vidhi at all 16 vedis",
      "Finest pinda offerings (panchamrit, dry fruits, silver patra)",
      "Brahman Bhandara (feeding 11 Brahmans) in your name",
      "Vastra dakshina, gau-daan & anna-daan included",
      "Dedicated senior Gayawal Tirth Purohit",
    ],
    proof: ["50+ HD photographs", "Full HD video recording of all 3 days", "Hand-written Sankalp Patra on traditional paper"],
    delivery: ["Worldwide prasad courier (60+ countries)", "Akshayavat prasad + Ganga jal", "Priority WhatsApp support"],
    cta: "Book Premium",
  },
];

const GAYA_FAQS: Faq[] = [
  { q: "Can I perform Pind Daan online?", a: "Yes. Rituals are performed by a representative pandit (pratinidhi karta) at Gaya while you join a brief Sankalp via live video call. The merit accrues fully to you and your ancestors." },
  { q: "Why is Gaya important?", a: "According to the Garuda Purana and Vayu Purana, Pind Daan performed at Gaya grants moksha (liberation) to ancestors. Lord Vishnu himself blessed Gaya as the foremost Pitru Tirtha — the ritual here is considered 'akshay' (imperishable)." },
  { q: "Will I receive proof?", a: "Yes — you receive ritual photographs, a 2–3 minute video clip, and the Sankalp Patra signed and sealed by the Gayawal Tirth Purohit, typically within 24 hours of the ritual." },
  { q: "Do you deliver prasad abroad?", a: "Yes. We courier Akshayavat prasad and Ganga jal to 60+ countries via India Post International / DHL. Customs clearance is taken care of; arrival typically 7–14 days." },
  { q: "What if I don't know ancestor details?", a: "Even partial information works. The Sankalp can include 'all known and unknown ancestors of my paternal and maternal lineage' through your gotra. Our pandit will guide you on the call." },
];

const gayaCityConfig: CityConfig = {
  slug: "gaya",
  cityName: "Gaya",
  cityNameHindi: "गया में पिंडदान",
  pujaType: "pind-daan-gaya",
  whatsappUrl: waUrl("Namaste, I would like to book / get guidance on Gaya Pind Daan at Vishnupad and Phalgu."),
  scriptureLabel: "Garuda Purana • Vayu Purana",
  quickAnswer: "Online Pind Daan in Gaya is a remote Shradh ritual performed at Vishnupad Temple and the Phalgu river by verified Gayawal Pandits on your behalf. You join the Sankalp via live video call, receive full photo/video proof and the Sankalp Patra, and prasad is couriered to your home anywhere in India or abroad. As per Garuda Purana, a single Gaya Shradh liberates ancestors permanently.",
  hero: {
    eyebrow: "Gaya • Pitru Tirth Shiromani",
    h1: "Online Pind Daan in Gaya — Perform Sacred Shradh from Anywhere",
    sub: "Authentic Pind Daan at Vishnupad Temple & Phalgu River by verified Gayawal Pandits. Live Sankalp, full video proof & prasad delivered worldwide.",
    emotional: "Fulfil your duty towards your ancestors and bring peace to their souls.",
    image: gayaHeroBanner,
    bookCta: "Book Gaya Pind Daan Now",
    trustBadges: [
      "Verified Gayawal Pandits",
      "Live Video Sankalp",
      "Worldwide Prasad Delivery",
      "Trusted by NRI Families",
    ],
  },
  whyImportant: {
    title: "Why Gaya Is Most Important for Pind Daan",
    intro: "Gaya is considered the most sacred place in the world for performing Pind Daan. According to Hindu scriptures like the Garuda Purana:",
    beliefs: [
      "Pind Daan in Gaya grants moksha (liberation) to ancestors",
      "It is believed to free souls from the cycle of rebirth",
      "Rituals performed here are said to give eternal peace",
    ],
    sitesIntro: "Sacred Sites Covered",
    sites: [
      { icon: Mountain, name: "Vishnupad Temple", note: "Sacred footprint of Lord Vishnu", image: gayaVishnupadImg },
      { icon: Waves, name: "Phalgu River", note: "Antar-vahini sacred current", image: gayaPhalguImg },
      { icon: BookOpen, name: "Akshayavat", note: "Eternal banyan of imperishable merit", image: gayaAkshayavatImg },
    ],
  },
  anywhere: {
    kicker: "Designed for NRIs — USA, UK, Canada, Australia",
    image: gayaPhalguImg,
    intro: "You do not need to travel to India. With Vedic Tatva, the full ritual is performed at Gaya on your behalf — and you participate live.",
  },
  howSteps: [
    { title: "Book Your Slot", body: "Choose your preferred date & package." },
    { title: "Share Pitru Details", body: "Names, gotra, tithi (if known)." },
    { title: "Live Sankalp", body: "Join a short video call at the muhurat." },
    { title: "Ritual Performed in Gaya", body: "By experienced Gayawal Pandits at Vishnupad / Phalgu." },
    { title: "Receive Proof", body: "Photos, video & Sankalp Patra within 24 hours." },
  ],
  packages: GAYA_PACKAGES,
  packagesTitle: "Gaya Pind Daan Packages",
  packagesIntro: "Transparent pricing. No hidden fees. All Sankalps performed in your name & gotra by traditional Gayawal Tirth Purohits.",
  whyChooseTitle: "Why Choose Vedic Tatva",
  whyChooseIntro: "Real rituals performed at Gaya by verified pandits. Photos & videos shared with every booking.",
  whyChooseItems: [
    { icon: ShieldCheck, text: "Only verified Gayawal Pandits" },
    { icon: BookOpen, text: "Authentic shastric vidhi followed" },
    { icon: Camera, text: "Transparent process with proof" },
    { icon: Globe, text: "Trusted by families worldwide" },
    { icon: Users, text: "Dedicated support team" },
  ],
  faqs: GAYA_FAQS,
  finalCta: {
    title: "Don't Delay Your Pitru Dharma",
    sub: "Book your Gaya Pind Daan today and perform your sacred duty from anywhere in the world.",
  },
};

const GAYA_PACKAGES_HI: PindDaanPackage[] = GAYA_PACKAGES.map((p, i) => {
  const hi: Partial<PindDaanPackage>[] = [
    {
      name: "बेसिक संक्षिप्त",
      tagline: "पारंपरिक सामग्री के साथ आवश्यक पिंडदान — पहली बार बुकिंग के लिए उपयुक्त।",
      ritual: ["फल्गु नदी एवं विष्णुपद पर पिंडदान", "मानक पिंड (चावल, जौ, तिल)", "आपके नाम व गोत्र में संकल्प", "तिल-जल से तर्पण"],
      proof: ["5–7 अनुष्ठान चित्र", "संकल्प पुष्टि"],
      delivery: ["ईमेल व व्हाट्सऐप पर डिजिटल पैक"],
      cta: "बेसिक बुक करें",
      duration: "1 दिन",
    },
    {
      name: "स्टैंडर्ड विधि",
      tagline: "तीनों पवित्र स्थलों पर पूर्ण पारंपरिक विधि एवं उत्तम सामग्री।",
      ritual: ["विष्णुपद, फल्गु एवं अक्षयवट पर पिंडदान", "उत्तम पिंड (शुद्ध घी, खीर, फल)", "आपके साथ लाइव वीडियो संकल्प", "तर्पण, धूप, दीप एवं पुष्प अर्चना"],
      proof: ["20+ HD चित्र", "2–3 मिनट का वीडियो हाइलाइट", "हस्ताक्षरित संकल्प पत्र"],
      delivery: ["24 घंटे में डिजिटल पैक", "अक्षयवट प्रसाद आपके घर (भारत)"],
      cta: "स्टैंडर्ड बुक करें",
      badge: "सर्वाधिक बुक",
      duration: "1 दिन",
    },
    {
      name: "प्रीमियम मोक्ष",
      tagline: "तीन दिनों की पूर्ण शास्त्रोक्त विधि, उत्तम सामग्री एवं आपके नाम पर ब्राह्मण भंडारा।",
      ritual: ["सभी 16 वेदियों पर 3-दिवसीय विधि", "श्रेष्ठतम पिंड (पंचामृत, मेवे, चांदी पात्र)", "आपके नाम 11 ब्राह्मणों का भंडारा", "वस्त्र दक्षिणा, गौ-दान एवं अन्न-दान सम्मिलित", "वरिष्ठ गयावाल तीर्थ पुरोहित"],
      proof: ["50+ HD चित्र", "तीनों दिनों की पूर्ण HD वीडियो रिकॉर्डिंग", "पारंपरिक कागज पर हस्तलिखित संकल्प पत्र"],
      delivery: ["विश्वव्यापी प्रसाद कूरियर (60+ देश)", "अक्षयवट प्रसाद + गंगा जल", "प्राथमिकता व्हाट्सऐप सहायता"],
      cta: "प्रीमियम बुक करें",
      badge: "भंडारा सहित",
      duration: "3 दिन",
    },
  ];
  return { ...p, ...hi[i] };
});

const GAYA_FAQS_HI: Faq[] = [
  { q: "क्या मैं ऑनलाइन पिंडदान करवा सकता हूँ?", a: "हाँ। प्रतिनिधि पंडित गया में आपके निमित्त अनुष्ठान करते हैं और आप एक संक्षिप्त वीडियो कॉल पर संकल्प में सम्मिलित होते हैं। पुण्य पूर्णतः आपको और आपके पितरों को प्राप्त होता है।" },
  { q: "गया का महत्व क्यों है?", a: "गरुड़ पुराण व वायु पुराण के अनुसार गया में किया गया पिंडदान पितरों को मोक्ष प्रदान करता है। स्वयं भगवान विष्णु ने गया को सर्वप्रमुख पितृ तीर्थ के रूप में आशीर्वाद दिया है।" },
  { q: "क्या मुझे प्रमाण मिलेगा?", a: "हाँ — आपको अनुष्ठान के चित्र, 2–3 मिनट का वीडियो और गयावाल तीर्थ पुरोहित द्वारा हस्ताक्षरित व मुहरित संकल्प पत्र 24 घंटे में प्राप्त होगा।" },
  { q: "क्या आप विदेश में प्रसाद भेजते हैं?", a: "हाँ। हम 60+ देशों में अक्षयवट प्रसाद व गंगा जल India Post International / DHL से कूरियर करते हैं। पहुँचने में सामान्यतः 7–14 दिन लगते हैं।" },
  { q: "यदि मुझे पितरों का विवरण ज्ञात नहीं है?", a: "अधूरी जानकारी पर्याप्त है। संकल्प में 'पितृ-मातृ कुल के समस्त ज्ञात-अज्ञात पितर' आपके गोत्र के माध्यम से सम्मिलित किए जा सकते हैं। पंडित जी कॉल पर मार्गदर्शन देंगे।" },
];

const gayaCityConfigHi: CityConfig = {
  ...gayaCityConfig,
  cityName: "गया",
  scriptureLabel: "गरुड़ पुराण • वायु पुराण",
  quickAnswer: "गया में ऑनलाइन पिंडदान — विष्णुपद मंदिर एवं फल्गु नदी पर सत्यापित गयावाल पंडितों द्वारा आपके निमित्त किया जाने वाला श्राद्ध अनुष्ठान। आप लाइव वीडियो कॉल पर संकल्प में सम्मिलित होते हैं, संपूर्ण फोटो/वीडियो प्रमाण व संकल्प पत्र प्राप्त करते हैं, और प्रसाद विश्व में कहीं भी आपके घर पर कूरियर किया जाता है।",
  hero: {
    ...gayaCityConfig.hero,
    eyebrow: "गया • पितृ तीर्थ शिरोमणि",
    h1: "गया में ऑनलाइन पिंडदान — कहीं से भी सम्पन्न करें श्राद्ध",
    sub: "विष्णुपद मंदिर एवं फल्गु नदी पर सत्यापित गयावाल पंडितों द्वारा प्रामाणिक पिंडदान। लाइव संकल्प, पूर्ण वीडियो प्रमाण व विश्वव्यापी प्रसाद वितरण।",
    emotional: "अपने पितरों के प्रति कर्तव्य निभाएँ और उनकी आत्मा को शांति प्रदान करें।",
    bookCta: "गया पिंडदान अभी बुक करें",
    trustBadges: ["सत्यापित गयावाल पंडित", "लाइव वीडियो संकल्प", "विश्वव्यापी प्रसाद वितरण", "NRI परिवारों का विश्वास"],
  },
  whyImportant: {
    ...gayaCityConfig.whyImportant,
    title: "पिंडदान के लिए गया सर्वोपरि क्यों है",
    intro: "पिंडदान के लिए गया विश्व का सबसे पवित्र स्थान माना जाता है। गरुड़ पुराण के अनुसार:",
    beliefs: [
      "गया में पिंडदान पितरों को मोक्ष (मुक्ति) प्रदान करता है",
      "यह आत्मा को पुनर्जन्म चक्र से मुक्त करता है",
      "यहाँ किया गया अनुष्ठान शाश्वत शांति देता है",
    ],
    sitesIntro: "सम्मिलित पवित्र स्थल",
  },
  anywhere: {
    ...gayaCityConfig.anywhere,
    kicker: "NRI के लिए विशेष — USA, UK, Canada, Australia",
    intro: "आपको भारत आने की आवश्यकता नहीं है। वैदिक तत्व के साथ संपूर्ण अनुष्ठान गया में आपके निमित्त सम्पन्न होता है — और आप लाइव सम्मिलित होते हैं।",
  },
  howSteps: [
    { title: "अपना समय बुक करें", body: "अपनी इच्छित तिथि व पैकेज चुनें।" },
    { title: "पितृ विवरण साझा करें", body: "नाम, गोत्र, तिथि (यदि ज्ञात हो)।" },
    { title: "लाइव संकल्प", body: "मुहूर्त पर संक्षिप्त वीडियो कॉल पर सम्मिलित हों।" },
    { title: "गया में अनुष्ठान", body: "अनुभवी गयावाल पंडितों द्वारा विष्णुपद / फल्गु पर।" },
    { title: "प्रमाण प्राप्त करें", body: "24 घंटे में चित्र, वीडियो व संकल्प पत्र।" },
  ],
  packages: GAYA_PACKAGES_HI,
  packagesTitle: "गया पिंडदान पैकेज",
  packagesIntro: "पारदर्शी मूल्य। कोई छुपा शुल्क नहीं। सभी संकल्प परंपरागत गयावाल तीर्थ पुरोहितों द्वारा आपके नाम व गोत्र में।",
  whyChooseTitle: "वैदिक तत्व क्यों चुनें",
  whyChooseIntro: "गया में सत्यापित पंडितों द्वारा वास्तविक अनुष्ठान। प्रत्येक बुकिंग के साथ चित्र व वीडियो साझा।",
  whyChooseItems: [
    { icon: ShieldCheck, text: "केवल सत्यापित गयावाल पंडित" },
    { icon: BookOpen, text: "प्रामाणिक शास्त्रोक्त विधि" },
    { icon: Camera, text: "पूर्ण प्रमाण के साथ पारदर्शी प्रक्रिया" },
    { icon: Globe, text: "विश्व भर के परिवारों का विश्वास" },
    { icon: Users, text: "समर्पित सहायता टीम" },
  ],
  faqs: GAYA_FAQS_HI,
  finalCta: {
    title: "अपने पितृ धर्म में विलंब न करें",
    sub: "आज ही गया पिंडदान बुक करें और कहीं से भी अपना पवित्र कर्तव्य निभाएँ।",
  },
};

// ----------------------------------------------------------------------------
// KASHI (Varanasi)
// ----------------------------------------------------------------------------

const KASHI_PACKAGES: PindDaanPackage[] = [
  {
    id: "basic",
    name: "Basic Sankshipt",
    subtitle: "संक्षिप्त विधि",
    icon: Droplets,
    price: 6999,
    duration: "1 Day",
    vidhi: "Manikarnika Ghat Tarpan",
    badge: null,
    tagline: "Essential Tarpan & Pind Daan on the Ganga at Manikarnika — perfect for first-time shradh.",
    ritual: [
      "Pind Daan at Manikarnika Ghat",
      "Standard pinda offerings (rice, jau, til)",
      "Sankalp in your name & gotra",
      "Tarpan with til-jal in the Ganga",
    ],
    proof: ["5–7 ritual photographs", "Sankalp acknowledgement"],
    delivery: ["Digital pack via email & WhatsApp"],
    cta: "Book Basic",
  },
  {
    id: "standard",
    name: "Standard Vidhi",
    subtitle: "मुख्य काशी श्राद्ध",
    icon: Flame,
    price: 11000,
    originalPrice: 14500,
    duration: "1 Day",
    vidhi: "Manikarnika + Pishachmochan Tripindi",
    badge: "Most Booked",
    tagline: "Full Tripindi Shradh at Pishachmochan plus Pind Daan at Manikarnika with premium offerings.",
    ritual: [
      "Pind Daan at Manikarnika Ghat",
      "Tripindi Shradh at Pishachmochan Kund",
      "Premium pinda offerings (pure ghee, kheer, fruits)",
      "Live video Sankalp with you",
      "Tarpan, dhoop, deep & flower archana",
    ],
    proof: ["20+ HD ritual photographs", "2–3 minute video highlight", "Signed Sankalp Patra"],
    delivery: ["Digital pack within 24 hours", "Kashi Vishwanath prasad to your home (India)"],
    cta: "Book Standard",
  },
  {
    id: "premium",
    name: "Premium Moksha",
    subtitle: "त्रिदिन शास्त्रोक्त विधि",
    icon: Sparkles,
    price: 21000,
    originalPrice: 28000,
    duration: "3 Days",
    vidhi: "Tripindi + Narayan Bali + Bhandara",
    badge: "Includes Bhandara",
    tagline: "Complete 3-day shastric vidhi with Narayan Bali and a Brahman Bhandara in your name.",
    ritual: [
      "Full 3-day Tripindi & Narayan Bali shradh",
      "Pind Daan at Manikarnika, Pishachmochan & Asi Sangam",
      "Finest pinda offerings (panchamrit, dry fruits, silver patra)",
      "Brahman Bhandara (feeding 11 Brahmans) in your name",
      "Vastra dakshina, gau-daan & anna-daan included",
      "Dedicated senior Karmakandi Tirth Purohit",
    ],
    proof: ["50+ HD photographs", "Full HD video recording of all 3 days", "Hand-written Sankalp Patra on traditional paper"],
    delivery: ["Worldwide prasad courier (60+ countries)", "Kashi Vishwanath prasad + Ganga jal", "Priority WhatsApp support"],
    cta: "Book Premium",
  },
];

const KASHI_FAQS: Faq[] = [
  { q: "Why is Kashi considered the most sacred place for Pind Daan?", a: "Kashi is the only city believed to grant moksha by mere death within its limits. Pind Daan here is said to free ancestors from rebirth and grant them direct sadgati. The Garuda Purana specifically prescribes Kashi for shradh." },
  { q: "Can Pind Daan in Kashi be done without me being physically present?", a: "Yes. The shastras allow pratinidhi (representative) shradh — our Tirth Purohit takes the Sankalp in your name and gotra over a brief video call, then performs the ritual on your behalf. This has been the accepted practice for centuries for those unable to travel." },
  { q: "What is Tripindi Shradh and who needs it?", a: "Tripindi Shradh is a special ritual at Pishachmochan Kund for ancestors believed to be in pret or pishach yoni — typically those who died unnaturally, untimely, or whose final rites were incomplete. It is unique to Kashi and a powerful remedy." },
  { q: "What is the right time to perform Pind Daan in Kashi?", a: "Pitru Paksha (the 16-day dark fortnight in Bhadrapada/Ashwin) is most auspicious. Amavasya of any month, the tithi of death, and Krishna Paksha days are also recommended. Our team will suggest the most aligned date for you." },
  { q: "Will I receive proof and prasad?", a: "Yes — ritual photographs, a 2–3 minute video clip, and a sealed Sankalp Patra are sent within 24 hours. Kashi Vishwanath prasad and Ganga jal are couriered to your address in India or abroad." },
];

const kashiCityConfig: CityConfig = {
  slug: "kashi",
  cityName: "Kashi",
  cityNameHindi: "काशी में पिंडदान",
  pujaType: "pind-daan-kashi",
  whatsappUrl: waUrl("Namaste, I would like to book / get guidance on Kashi (Varanasi) Pind Daan at Manikarnika & Pishachmochan."),
  scriptureLabel: "Garuda Purana • Skanda Purana",
  quickAnswer: "Online Pind Daan in Kashi (Varanasi) is performed at Manikarnika Ghat and Pishachmochan Kund by Kashi-trained Karmakandi Brahmins. Tripindi Shradh is the recommended remedy for Pitru Dosh and three-generation moksha. You join Sankalp by live video, receive full proof and Sankalp Patra, and prasad is couriered worldwide.",
  hero: {
    eyebrow: "Kashi • Moksha Nagari",
    h1: "Online Pind Daan in Kashi — Liberation at the City of Lord Shiva",
    sub: "Authentic Pind Daan & Tripindi Shradh at Manikarnika Ghat and Pishachmochan Kund by Kashi-trained Karmakandi Brahmins. Live Sankalp, full video proof & prasad delivered worldwide.",
    emotional: "Free your ancestors from lingering attachments and grant them sadgati.",
    image: kashiHeroBanner,
    bookCta: "Book Kashi Pind Daan Now",
    trustBadges: [
      "Karmakandi Brahmins of Kashi",
      "Tripindi Shradh Specialists",
      "Live Video Sankalp",
      "Worldwide Prasad Delivery",
    ],
  },
  whyImportant: {
    title: "Why Kashi Grants Liberation to Ancestors",
    intro: "Kashi is called the Mahasmashan — the great cremation ground of the cosmos. The Garuda Purana describes Kashi as the foremost city of moksha. Performing shradh here is uniquely powerful because:",
    beliefs: [
      "Kashi alone is believed to grant moksha by mere presence",
      "Pind Daan here is said to free ancestors from any pret yoni",
      "Tripindi Shradh at Pishachmochan removes ancestral curses",
    ],
    sitesIntro: "Sacred Sites Covered",
    sites: [
      { icon: Flame, name: "Manikarnika Ghat", note: "The eternal cremation ghat on the Ganga", image: kashiManikarnikaImg },
      { icon: Sparkles, name: "Pishachmochan Kund", note: "Sacred kund for Tripindi Shradh", image: kashiPishachmochanImg },
      { icon: Mountain, name: "Kashi Vishwanath", note: "Jyotirlinga of Lord Shiva himself", image: kashiVishwanathImg },
    ],
  },
  anywhere: {
    kicker: "Designed for NRIs — USA, UK, Canada, Australia",
    image: kashiManikarnikaImg,
    intro: "You do not need to travel to India. With Vedic Tatva, the full ritual is performed at Kashi on your behalf — and you participate live.",
  },
  howSteps: [
    { title: "Book Your Slot", body: "Choose your preferred date & package." },
    { title: "Share Pitru Details", body: "Names, gotra, tithi (if known)." },
    { title: "Live Sankalp", body: "Join a short video call at the muhurat." },
    { title: "Ritual Performed in Kashi", body: "By Karmakandi Brahmins at Manikarnika / Pishachmochan." },
    { title: "Receive Proof", body: "Photos, video & Sankalp Patra within 24 hours." },
  ],
  packages: KASHI_PACKAGES,
  packagesTitle: "Kashi Pind Daan Packages",
  packagesIntro: "Transparent pricing. No hidden fees. All Sankalps performed in your name & gotra by Kashi-trained Karmakandi Brahmins.",
  whyChooseTitle: "Why Choose Vedic Tatva for Kashi",
  whyChooseIntro: "Real rituals performed at Kashi by verified Karmakandi pandits. Photos & videos shared with every booking.",
  whyChooseItems: [
    { icon: ShieldCheck, text: "Only verified Kashi Karmakandi pandits" },
    { icon: BookOpen, text: "Authentic Garuda Purana & Pretmanjari vidhi" },
    { icon: Camera, text: "Transparent process with proof" },
    { icon: Globe, text: "Trusted by families worldwide" },
    { icon: Users, text: "Dedicated support team" },
  ],
  faqs: KASHI_FAQS,
  finalCta: {
    title: "Don't Delay Your Pitru Dharma",
    sub: "Book your Kashi Pind Daan today and grant your ancestors the path to liberation.",
  },
};

const KASHI_PACKAGES_HI: PindDaanPackage[] = KASHI_PACKAGES.map((p, i) => {
  const hi: Partial<PindDaanPackage>[] = [
    {
      name: "बेसिक संक्षिप्त",
      tagline: "मणिकर्णिका पर गंगा तट पर आवश्यक तर्पण व पिंडदान — पहली बार श्राद्ध हेतु उपयुक्त।",
      ritual: ["मणिकर्णिका घाट पर पिंडदान", "मानक पिंड (चावल, जौ, तिल)", "आपके नाम व गोत्र में संकल्प", "गंगा में तिल-जल से तर्पण"],
      proof: ["5–7 अनुष्ठान चित्र", "संकल्प पुष्टि"],
      delivery: ["ईमेल व व्हाट्सऐप पर डिजिटल पैक"],
      cta: "बेसिक बुक करें",
      duration: "1 दिन",
    },
    {
      name: "स्टैंडर्ड विधि",
      tagline: "पिशाचमोचन पर पूर्ण त्रिपिंडी श्राद्ध एवं मणिकर्णिका पर पिंडदान, उत्तम सामग्री।",
      ritual: ["मणिकर्णिका घाट पर पिंडदान", "पिशाचमोचन कुंड पर त्रिपिंडी श्राद्ध", "उत्तम पिंड (शुद्ध घी, खीर, फल)", "आपके साथ लाइव वीडियो संकल्प", "तर्पण, धूप, दीप एवं पुष्प अर्चना"],
      proof: ["20+ HD चित्र", "2–3 मिनट का वीडियो हाइलाइट", "हस्ताक्षरित संकल्प पत्र"],
      delivery: ["24 घंटे में डिजिटल पैक", "काशी विश्वनाथ प्रसाद आपके घर (भारत)"],
      cta: "स्टैंडर्ड बुक करें",
      badge: "सर्वाधिक बुक",
      duration: "1 दिन",
    },
    {
      name: "प्रीमियम मोक्ष",
      tagline: "तीन दिवसीय शास्त्रोक्त विधि, नारायण बलि एवं आपके नाम ब्राह्मण भंडारा सहित।",
      ritual: ["3-दिवसीय त्रिपिंडी एवं नारायण बलि श्राद्ध", "मणिकर्णिका, पिशाचमोचन एवं असि संगम पर पिंडदान", "श्रेष्ठतम पिंड (पंचामृत, मेवे, चांदी पात्र)", "आपके नाम 11 ब्राह्मणों का भंडारा", "वस्त्र दक्षिणा, गौ-दान एवं अन्न-दान सम्मिलित", "वरिष्ठ कर्मकांडी तीर्थ पुरोहित"],
      proof: ["50+ HD चित्र", "तीनों दिनों की पूर्ण HD वीडियो रिकॉर्डिंग", "पारंपरिक कागज पर हस्तलिखित संकल्प पत्र"],
      delivery: ["विश्वव्यापी प्रसाद कूरियर (60+ देश)", "काशी विश्वनाथ प्रसाद + गंगा जल", "प्राथमिकता व्हाट्सऐप सहायता"],
      cta: "प्रीमियम बुक करें",
      badge: "भंडारा सहित",
      duration: "3 दिन",
    },
  ];
  return { ...p, ...hi[i] };
});

const KASHI_FAQS_HI: Faq[] = [
  { q: "पिंडदान के लिए काशी सर्वाधिक पवित्र क्यों मानी जाती है?", a: "काशी ही ऐसी नगरी है जहाँ देहांत मात्र से मोक्ष प्राप्ति की मान्यता है। यहाँ किया गया पिंडदान पितरों को पुनर्जन्म से मुक्त कर सीधे सद्गति प्रदान करता है। गरुड़ पुराण में काशी श्राद्ध का विशेष विधान है।" },
  { q: "क्या काशी में पिंडदान बिना उपस्थिति के सम्पन्न हो सकता है?", a: "हाँ। शास्त्र प्रतिनिधि श्राद्ध की अनुमति देते हैं — हमारे तीर्थ पुरोहित संक्षिप्त वीडियो कॉल पर आपके नाम व गोत्र में संकल्प लेकर आपके निमित्त अनुष्ठान सम्पन्न करते हैं। यह सदियों से मान्य परंपरा है।" },
  { q: "त्रिपिंडी श्राद्ध क्या है व किसे करना चाहिए?", a: "त्रिपिंडी श्राद्ध पिशाचमोचन कुंड पर किया जाने वाला विशेष अनुष्ठान है — उन पितरों के लिए जो प्रेत/पिशाच योनि में हों, अकाल मृत्यु हुई हो या अंतिम संस्कार अपूर्ण रहा हो। यह काशी की विशिष्टता एवं प्रबल उपाय है।" },
  { q: "काशी में पिंडदान का उत्तम समय क्या है?", a: "पितृ पक्ष (भाद्रपद/आश्विन का 16 दिवसीय कृष्ण पक्ष) सर्वाधिक शुभ है। किसी भी मास की अमावस्या, मृत्यु तिथि एवं कृष्ण पक्ष भी अनुशंसित हैं। हमारी टीम सबसे उपयुक्त तिथि सुझाएगी।" },
  { q: "क्या मुझे प्रमाण व प्रसाद प्राप्त होगा?", a: "हाँ — अनुष्ठान चित्र, 2–3 मिनट का वीडियो व मुहरित संकल्प पत्र 24 घंटे में भेजा जाता है। काशी विश्वनाथ प्रसाद व गंगा जल भारत व विदेश में आपके पते पर कूरियर किया जाता है।" },
];

const kashiCityConfigHi: CityConfig = {
  ...kashiCityConfig,
  cityName: "काशी",
  scriptureLabel: "गरुड़ पुराण • स्कन्द पुराण",
  quickAnswer: "काशी (वाराणसी) में ऑनलाइन पिंडदान — मणिकर्णिका घाट एवं पिशाचमोचन कुंड पर काशी-प्रशिक्षित कर्मकांडी ब्राह्मणों द्वारा सम्पन्न होता है। पितृ दोष व त्रि-पीढ़ी मोक्ष हेतु त्रिपिंडी श्राद्ध सर्वोत्तम उपाय है। आप लाइव वीडियो संकल्प में सम्मिलित होते हैं, पूर्ण प्रमाण व संकल्प पत्र प्राप्त करते हैं, और प्रसाद विश्वव्यापी कूरियर किया जाता है।",
  hero: {
    ...kashiCityConfig.hero,
    eyebrow: "काशी • मोक्ष नगरी",
    h1: "काशी में ऑनलाइन पिंडदान — भगवान शिव की नगरी से मुक्ति",
    sub: "मणिकर्णिका घाट एवं पिशाचमोचन कुंड पर काशी-प्रशिक्षित कर्मकांडी ब्राह्मणों द्वारा प्रामाणिक पिंडदान व त्रिपिंडी श्राद्ध। लाइव संकल्प, पूर्ण वीडियो प्रमाण व विश्वव्यापी प्रसाद वितरण।",
    emotional: "अपने पितरों को आसक्तियों से मुक्त कर उन्हें सद्गति प्रदान करें।",
    bookCta: "काशी पिंडदान अभी बुक करें",
    trustBadges: ["काशी के कर्मकांडी ब्राह्मण", "त्रिपिंडी श्राद्ध विशेषज्ञ", "लाइव वीडियो संकल्प", "विश्वव्यापी प्रसाद वितरण"],
  },
  whyImportant: {
    ...kashiCityConfig.whyImportant,
    title: "काशी पितरों को मुक्ति क्यों प्रदान करती है",
    intro: "काशी को महाश्मशान कहा जाता है — ब्रह्मांड का महान श्मशान। गरुड़ पुराण काशी को मोक्ष की प्रमुख नगरी बताता है। यहाँ श्राद्ध विशेष शक्तिशाली है क्योंकि:",
    beliefs: [
      "केवल काशी में उपस्थिति मात्र से मोक्ष प्राप्ति की मान्यता है",
      "यहाँ का पिंडदान पितरों को प्रेत योनि से मुक्त करता है",
      "पिशाचमोचन पर त्रिपिंडी श्राद्ध पैतृक श्रापों का निवारण करता है",
    ],
    sitesIntro: "सम्मिलित पवित्र स्थल",
  },
  anywhere: {
    ...kashiCityConfig.anywhere,
    kicker: "NRI के लिए विशेष — USA, UK, Canada, Australia",
    intro: "आपको भारत आने की आवश्यकता नहीं है। वैदिक तत्व के साथ संपूर्ण अनुष्ठान काशी में आपके निमित्त सम्पन्न होता है — और आप लाइव सम्मिलित होते हैं।",
  },
  howSteps: [
    { title: "अपना समय बुक करें", body: "अपनी इच्छित तिथि व पैकेज चुनें।" },
    { title: "पितृ विवरण साझा करें", body: "नाम, गोत्र, तिथि (यदि ज्ञात हो)।" },
    { title: "लाइव संकल्प", body: "मुहूर्त पर संक्षिप्त वीडियो कॉल पर सम्मिलित हों।" },
    { title: "काशी में अनुष्ठान", body: "मणिकर्णिका / पिशाचमोचन पर कर्मकांडी ब्राह्मणों द्वारा।" },
    { title: "प्रमाण प्राप्त करें", body: "24 घंटे में चित्र, वीडियो व संकल्प पत्र।" },
  ],
  packages: KASHI_PACKAGES_HI,
  packagesTitle: "काशी पिंडदान पैकेज",
  packagesIntro: "पारदर्शी मूल्य। कोई छुपा शुल्क नहीं। सभी संकल्प काशी-प्रशिक्षित कर्मकांडी ब्राह्मणों द्वारा आपके नाम व गोत्र में।",
  whyChooseTitle: "काशी हेतु वैदिक तत्व क्यों चुनें",
  whyChooseIntro: "काशी में सत्यापित कर्मकांडी पंडितों द्वारा वास्तविक अनुष्ठान। प्रत्येक बुकिंग के साथ चित्र व वीडियो साझा।",
  whyChooseItems: [
    { icon: ShieldCheck, text: "केवल सत्यापित काशी कर्मकांडी पंडित" },
    { icon: BookOpen, text: "प्रामाणिक गरुड़ पुराण व प्रेतमंजरी विधि" },
    { icon: Camera, text: "पूर्ण प्रमाण के साथ पारदर्शी प्रक्रिया" },
    { icon: Globe, text: "विश्व भर के परिवारों का विश्वास" },
    { icon: Users, text: "समर्पित सहायता टीम" },
  ],
  faqs: KASHI_FAQS_HI,
  finalCta: {
    title: "अपने पितृ धर्म में विलंब न करें",
    sub: "आज ही काशी पिंडदान बुक करें और अपने पितरों को मुक्ति का मार्ग प्रदान करें।",
  },
};

// ----------------------------------------------------------------------------
// HARIDWAR
// ----------------------------------------------------------------------------

const HARIDWAR_PACKAGES: PindDaanPackage[] = [
  {
    id: "basic",
    name: "Basic Sankshipt",
    subtitle: "संक्षिप्त विधि",
    icon: Droplets,
    price: 6999,
    duration: "1 Day",
    vidhi: "Har Ki Pauri Tarpan",
    badge: null,
    tagline: "Essential Tarpan & Pind Daan at Brahmakund — perfect for first-time shradh.",
    ritual: [
      "Pind Daan at Har Ki Pauri (Brahmakund)",
      "Standard pinda offerings (rice, jau, til)",
      "Sankalp in your name & gotra",
      "Tarpan with til-jal in the Ganga",
    ],
    proof: ["5–7 ritual photographs", "Sankalp acknowledgement"],
    delivery: ["Digital pack via email & WhatsApp"],
    cta: "Book Basic",
  },
  {
    id: "standard",
    name: "Standard Vidhi",
    subtitle: "नारायणी शिला पूजा",
    icon: Flame,
    price: 11000,
    originalPrice: 14500,
    duration: "1 Day",
    vidhi: "Narayani Shila + Har Ki Pauri",
    badge: "Most Booked",
    tagline: "Full Narayani Shila puja for Pitru Dosh nivaran plus Pind Daan at Brahmakund with premium offerings.",
    ritual: [
      "Narayani Shila Puja for Pitru Dosh nivaran",
      "Pind Daan at Har Ki Pauri (Brahmakund)",
      "Premium pinda offerings (pure ghee, kheer, fruits)",
      "Live video Sankalp with you",
      "Tarpan, dhoop, deep & flower archana",
    ],
    proof: ["20+ HD ritual photographs", "2–3 minute video highlight", "Signed Sankalp Patra"],
    delivery: ["Digital pack within 24 hours", "Har Ki Pauri prasad & Ganga jal to your home (India)"],
    cta: "Book Standard",
  },
  {
    id: "premium",
    name: "Premium Moksha",
    subtitle: "त्रिदिन शास्त्रोक्त विधि",
    icon: Sparkles,
    price: 21000,
    originalPrice: 28000,
    duration: "3 Days",
    vidhi: "Narayani Shila + Tripindi + Bhandara",
    badge: "Includes Bhandara",
    tagline: "Complete 3-day shastric vidhi with Tripindi Shradh and a Brahman Bhandara in your name.",
    ritual: [
      "Full 3-day Narayani Shila & Tripindi Shradh",
      "Pind Daan at Brahmakund and Daksh Mahadev (Kankhal)",
      "Finest pinda offerings (panchamrit, dry fruits, silver patra)",
      "Brahman Bhandara (feeding 11 Brahmans) in your name",
      "Vastra dakshina, gau-daan & anna-daan included",
      "Dedicated senior Haridwar Tirth Purohit (Bahi-keeper)",
    ],
    proof: ["50+ HD photographs", "Full HD video recording of all 3 days", "Hand-written Sankalp Patra on traditional paper"],
    delivery: ["Worldwide prasad courier (60+ countries)", "Har Ki Pauri prasad + Ganga jal", "Priority WhatsApp support"],
    cta: "Book Premium",
  },
];

const HARIDWAR_FAQS: Faq[] = [
  { q: "What is Pitru Dosh and how does Narayani Shila puja help?", a: "Pitru Dosh in a kundli indicates that ancestors are not at peace — symptoms include obstacles in marriage, childbirth or career. The Narayani Shila puja in Haridwar is specifically prescribed in shastra as the principal remedy because the shila itself is non-different from the body of Lord Vishnu." },
  { q: "Do I need to come to Haridwar in person?", a: "No. Like all Pind Daan rituals, Haridwar shradh can be performed by the Tirth Purohit as your pratinidhi after a Sankalp video call. You receive full proof of completion." },
  { q: "What is the Bahi system in Haridwar?", a: "Tirth Purohits of Haridwar maintain hand-written registers (bahis) of pilgrim families going back many generations — sometimes 300–400 years. If your forefathers visited Haridwar, your family record may already exist; we can help search the bahi by your gotra and place of origin." },
  { q: "When should Haridwar Pind Daan be performed?", a: "Pitru Paksha is most auspicious. Other recommended days include Amavasya, the death anniversary, Somvati Amavasya, Mauni Amavasya and Kumbh / Ardh Kumbh periods. For Pitru Dosh, even ordinary Krishna Paksha days work." },
  { q: "Is the puja effective for ancestors who died in unnatural circumstances?", a: "Yes. Combined Narayani Shila puja and Tripindi Shradh in Haridwar are specifically prescribed for those whose end was sudden, accidental or untimely, helping their souls move forward." },
];

const haridwarCityConfig: CityConfig = {
  slug: "haridwar",
  cityName: "Haridwar",
  cityNameHindi: "हरिद्वार में पिंडदान",
  pujaType: "pind-daan-haridwar",
  whatsappUrl: waUrl("Namaste, I would like to book / get guidance on Haridwar Pind Daan at Narayani Shila and Har Ki Pauri."),
  scriptureLabel: "Skanda Purana • Brahma Purana",
  quickAnswer: "Online Pind Daan at Haridwar — Narayani Shila puja and Pind Daan at Har Ki Pauri Brahmakund — is the prime scriptural remedy for Pitru Dosh shown in the kundli. The puja is conducted by registered Haridwar Tirth Purohits with live video Sankalp, full proof and worldwide prasad delivery.",
  hero: {
    eyebrow: "Haridwar • Gateway of Hari",
    h1: "Online Pind Daan in Haridwar — The Prime Remedy for Pitru Dosh",
    sub: "Authentic Narayani Shila puja and Pind Daan at Har Ki Pauri Brahmakund by registered Haridwar Tirth Purohits. Live Sankalp, full video proof & prasad delivered worldwide.",
    emotional: "Bring peace to your ancestors and remove Pitru Dosh from your kundli.",
    image: haridwarHeroBanner,
    bookCta: "Book Haridwar Pind Daan Now",
    trustBadges: [
      "Registered Haridwar Tirth Purohits",
      "Narayani Shila Specialists",
      "Live Video Sankalp",
      "Worldwide Prasad Delivery",
    ],
  },
  whyImportant: {
    title: "Why Haridwar Is the Pitru Dosh Remedy",
    intro: "Haridwar is the sacred 'gateway of Hari' where Mother Ganga first emerges into the plains. Shradh performed here is uniquely powerful because:",
    beliefs: [
      "Narayani Shila puja is the principal shastric remedy for Pitru Dosh",
      "The Ganga at Brahmakund carries offerings directly to the ancestors",
      "Haridwar Tirth Purohits maintain ancestral bahis for centuries",
    ],
    sitesIntro: "Sacred Sites Covered",
    sites: [
      { icon: Waves, name: "Har Ki Pauri (Brahmakund)", note: "Where Amrit fell — holiest spot for Tarpan", image: haridwarHarKiPauriImg },
      { icon: Mountain, name: "Narayani Shila", note: "Sacred shila for Pitru Dosh nivaran puja", image: haridwarNarayaniShilaImg },
      { icon: BookOpen, name: "Daksh Mahadev (Kankhal)", note: "Ancient kshetra of Lord Shiva", image: haridwarDakshMahadevImg },
    ],
  },
  anywhere: {
    kicker: "Designed for NRIs — USA, UK, Canada, Australia",
    image: haridwarHarKiPauriImg,
    intro: "You do not need to travel to India. With Vedic Tatva, the full ritual is performed at Haridwar on your behalf — and you participate live.",
  },
  howSteps: [
    { title: "Book Your Slot", body: "Choose your preferred date & package." },
    { title: "Share Pitru Details", body: "Names, gotra, tithi (if known)." },
    { title: "Live Sankalp", body: "Join a short video call at the muhurat." },
    { title: "Ritual Performed in Haridwar", body: "By registered Tirth Purohits at Brahmakund / Narayani Shila." },
    { title: "Receive Proof", body: "Photos, video & Sankalp Patra within 24 hours." },
  ],
  packages: HARIDWAR_PACKAGES,
  packagesTitle: "Haridwar Pind Daan Packages",
  packagesIntro: "Transparent pricing. No hidden fees. All Sankalps performed in your name & gotra by registered Haridwar Tirth Purohits.",
  whyChooseTitle: "Why Choose Vedic Tatva for Haridwar",
  whyChooseIntro: "Real rituals performed at Haridwar by registered Tirth Purohits with traceable family bahis. Photos & videos shared with every booking.",
  whyChooseItems: [
    { icon: ShieldCheck, text: "Only registered Haridwar Tirth Purohits" },
    { icon: BookOpen, text: "Bahi (family register) lookup available" },
    { icon: Camera, text: "Transparent process with proof" },
    { icon: Globe, text: "Trusted by families worldwide" },
    { icon: Users, text: "Dedicated support team" },
  ],
  faqs: HARIDWAR_FAQS,
  finalCta: {
    title: "Don't Delay Your Pitru Dharma",
    sub: "Book your Haridwar Pind Daan today and remove Pitru Dosh from your family's path.",
  },
};

const HARIDWAR_PACKAGES_HI: PindDaanPackage[] = HARIDWAR_PACKAGES.map((p, i) => {
  const hi: Partial<PindDaanPackage>[] = [
    {
      name: "बेसिक संक्षिप्त",
      tagline: "ब्रह्मकुंड पर आवश्यक तर्पण व पिंडदान — पहली बार श्राद्ध हेतु उपयुक्त।",
      ritual: ["हर की पौड़ी (ब्रह्मकुंड) पर पिंडदान", "मानक पिंड (चावल, जौ, तिल)", "आपके नाम व गोत्र में संकल्प", "गंगा में तिल-जल से तर्पण"],
      proof: ["5–7 अनुष्ठान चित्र", "संकल्प पुष्टि"],
      delivery: ["ईमेल व व्हाट्सऐप पर डिजिटल पैक"],
      cta: "बेसिक बुक करें",
      duration: "1 दिन",
    },
    {
      name: "स्टैंडर्ड विधि",
      tagline: "पितृ दोष निवारण हेतु पूर्ण नारायणी शिला पूजा एवं ब्रह्मकुंड पर पिंडदान।",
      ritual: ["पितृ दोष निवारण हेतु नारायणी शिला पूजा", "हर की पौड़ी (ब्रह्मकुंड) पर पिंडदान", "उत्तम पिंड (शुद्ध घी, खीर, फल)", "आपके साथ लाइव वीडियो संकल्प", "तर्पण, धूप, दीप एवं पुष्प अर्चना"],
      proof: ["20+ HD चित्र", "2–3 मिनट का वीडियो हाइलाइट", "हस्ताक्षरित संकल्प पत्र"],
      delivery: ["24 घंटे में डिजिटल पैक", "हर की पौड़ी प्रसाद व गंगा जल आपके घर (भारत)"],
      cta: "स्टैंडर्ड बुक करें",
      badge: "सर्वाधिक बुक",
      duration: "1 दिन",
    },
    {
      name: "प्रीमियम मोक्ष",
      tagline: "तीन दिवसीय शास्त्रोक्त विधि, त्रिपिंडी श्राद्ध एवं आपके नाम ब्राह्मण भंडारा सहित।",
      ritual: ["3-दिवसीय नारायणी शिला एवं त्रिपिंडी श्राद्ध", "ब्रह्मकुंड एवं दक्ष महादेव (कनखल) पर पिंडदान", "श्रेष्ठतम पिंड (पंचामृत, मेवे, चांदी पात्र)", "आपके नाम 11 ब्राह्मणों का भंडारा", "वस्त्र दक्षिणा, गौ-दान एवं अन्न-दान सम्मिलित", "वरिष्ठ हरिद्वार तीर्थ पुरोहित (बही-रक्षक)"],
      proof: ["50+ HD चित्र", "तीनों दिनों की पूर्ण HD वीडियो रिकॉर्डिंग", "पारंपरिक कागज पर हस्तलिखित संकल्प पत्र"],
      delivery: ["विश्वव्यापी प्रसाद कूरियर (60+ देश)", "हर की पौड़ी प्रसाद + गंगा जल", "प्राथमिकता व्हाट्सऐप सहायता"],
      cta: "प्रीमियम बुक करें",
      badge: "भंडारा सहित",
      duration: "3 दिन",
    },
  ];
  return { ...p, ...hi[i] };
});

const HARIDWAR_FAQS_HI: Faq[] = [
  { q: "पितृ दोष क्या है व नारायणी शिला पूजा कैसे सहायक है?", a: "कुंडली में पितृ दोष यह दर्शाता है कि पितर शांत नहीं हैं — विवाह, संतान या करियर में बाधाएँ इसके लक्षण हैं। हरिद्वार में नारायणी शिला पूजा शास्त्रों में मुख्य उपाय बताई गई है क्योंकि यह शिला स्वयं भगवान विष्णु के स्वरूप के रूप में मानी जाती है।" },
  { q: "क्या मुझे हरिद्वार स्वयं आना पड़ेगा?", a: "नहीं। अन्य पिंडदान अनुष्ठानों की भाँति हरिद्वार श्राद्ध भी संकल्प वीडियो कॉल के पश्चात तीर्थ पुरोहित आपके प्रतिनिधि के रूप में सम्पन्न करते हैं। आपको पूर्ण प्रमाण प्राप्त होता है।" },
  { q: "हरिद्वार में बही प्रथा क्या है?", a: "हरिद्वार के तीर्थ पुरोहित कई पीढ़ियों — कभी-कभी 300–400 वर्षों — के तीर्थयात्री परिवारों के हस्तलिखित बही रजिस्टर रखते हैं। यदि आपके पूर्वज हरिद्वार आए हों तो आपका पारिवारिक रिकॉर्ड पहले से उपलब्ध हो सकता है; हम गोत्र व मूल स्थान से बही खोज में सहायता कर सकते हैं।" },
  { q: "हरिद्वार पिंडदान कब करना चाहिए?", a: "पितृ पक्ष सर्वाधिक शुभ है। अमावस्या, मृत्यु तिथि, सोमवती अमावस्या, मौनी अमावस्या एवं कुंभ / अर्ध कुंभ काल भी अनुशंसित हैं। पितृ दोष हेतु सामान्य कृष्ण पक्ष भी उपयुक्त है।" },
  { q: "क्या यह पूजा अप्राकृतिक मृत्यु वाले पितरों हेतु प्रभावी है?", a: "हाँ। हरिद्वार में संयुक्त नारायणी शिला पूजा एवं त्रिपिंडी श्राद्ध विशेष रूप से अकस्मात, दुर्घटना या असमय मृत्यु वाले पितरों हेतु शास्त्र-निर्दिष्ट उपाय है, जो उनकी आत्माओं को आगे बढ़ने में सहायक है।" },
];

const haridwarCityConfigHi: CityConfig = {
  ...haridwarCityConfig,
  cityName: "हरिद्वार",
  scriptureLabel: "स्कन्द पुराण • ब्रह्म पुराण",
  quickAnswer: "हरिद्वार में ऑनलाइन पिंडदान — नारायणी शिला पूजा एवं हर की पौड़ी ब्रह्मकुंड पर पिंडदान — कुंडली में दिखाए गए पितृ दोष का प्रमुख शास्त्र-निर्दिष्ट उपाय है। यह पूजा पंजीकृत हरिद्वार तीर्थ पुरोहितों द्वारा लाइव वीडियो संकल्प, पूर्ण प्रमाण व विश्वव्यापी प्रसाद वितरण के साथ सम्पन्न की जाती है।",
  hero: {
    ...haridwarCityConfig.hero,
    eyebrow: "हरिद्वार • हरि का द्वार",
    h1: "हरिद्वार में ऑनलाइन पिंडदान — पितृ दोष का प्रमुख उपाय",
    sub: "हर की पौड़ी ब्रह्मकुंड पर पंजीकृत हरिद्वार तीर्थ पुरोहितों द्वारा प्रामाणिक नारायणी शिला पूजा एवं पिंडदान। लाइव संकल्प, पूर्ण वीडियो प्रमाण व विश्वव्यापी प्रसाद वितरण।",
    emotional: "अपने पितरों को शांति प्रदान करें और कुंडली से पितृ दोष का निवारण करें।",
    bookCta: "हरिद्वार पिंडदान अभी बुक करें",
    trustBadges: ["पंजीकृत हरिद्वार तीर्थ पुरोहित", "नारायणी शिला विशेषज्ञ", "लाइव वीडियो संकल्प", "विश्वव्यापी प्रसाद वितरण"],
  },
  whyImportant: {
    ...haridwarCityConfig.whyImportant,
    title: "हरिद्वार पितृ दोष का उपाय क्यों है",
    intro: "हरिद्वार पवित्र 'हरि का द्वार' है, जहाँ माँ गंगा मैदानों में प्रथमतः अवतरित होती हैं। यहाँ श्राद्ध विशेष शक्तिशाली है क्योंकि:",
    beliefs: [
      "नारायणी शिला पूजा पितृ दोष का प्रमुख शास्त्रोक्त उपाय है",
      "ब्रह्मकुंड पर गंगा अर्पण सीधे पितरों तक पहुँचाती हैं",
      "हरिद्वार तीर्थ पुरोहित सदियों से पैतृक बहियाँ रखते हैं",
    ],
    sitesIntro: "सम्मिलित पवित्र स्थल",
  },
  anywhere: {
    ...haridwarCityConfig.anywhere,
    kicker: "NRI के लिए विशेष — USA, UK, Canada, Australia",
    intro: "आपको भारत आने की आवश्यकता नहीं है। वैदिक तत्व के साथ संपूर्ण अनुष्ठान हरिद्वार में आपके निमित्त सम्पन्न होता है — और आप लाइव सम्मिलित होते हैं।",
  },
  howSteps: [
    { title: "अपना समय बुक करें", body: "अपनी इच्छित तिथि व पैकेज चुनें।" },
    { title: "पितृ विवरण साझा करें", body: "नाम, गोत्र, तिथि (यदि ज्ञात हो)।" },
    { title: "लाइव संकल्प", body: "मुहूर्त पर संक्षिप्त वीडियो कॉल पर सम्मिलित हों।" },
    { title: "हरिद्वार में अनुष्ठान", body: "ब्रह्मकुंड / नारायणी शिला पर पंजीकृत तीर्थ पुरोहितों द्वारा।" },
    { title: "प्रमाण प्राप्त करें", body: "24 घंटे में चित्र, वीडियो व संकल्प पत्र।" },
  ],
  packages: HARIDWAR_PACKAGES_HI,
  packagesTitle: "हरिद्वार पिंडदान पैकेज",
  packagesIntro: "पारदर्शी मूल्य। कोई छुपा शुल्क नहीं। सभी संकल्प पंजीकृत हरिद्वार तीर्थ पुरोहितों द्वारा आपके नाम व गोत्र में।",
  whyChooseTitle: "हरिद्वार हेतु वैदिक तत्व क्यों चुनें",
  whyChooseIntro: "हरिद्वार में पंजीकृत तीर्थ पुरोहितों द्वारा वास्तविक अनुष्ठान, ट्रेसेबल पारिवारिक बही सहित। प्रत्येक बुकिंग के साथ चित्र व वीडियो साझा।",
  whyChooseItems: [
    { icon: ShieldCheck, text: "केवल पंजीकृत हरिद्वार तीर्थ पुरोहित" },
    { icon: BookOpen, text: "बही (पारिवारिक रजिस्टर) खोज उपलब्ध" },
    { icon: Camera, text: "पूर्ण प्रमाण के साथ पारदर्शी प्रक्रिया" },
    { icon: Globe, text: "विश्व भर के परिवारों का विश्वास" },
    { icon: Users, text: "समर्पित सहायता टीम" },
  ],
  faqs: HARIDWAR_FAQS_HI,
  finalCta: {
    title: "अपने पितृ धर्म में विलंब न करें",
    sub: "आज ही हरिद्वार पिंडदान बुक करें और अपने परिवार के मार्ग से पितृ दोष हटाएँ।",
  },
};

// ----------------------------------------------------------------------------
// Generic City Landing components (driven by CityConfig)
// ----------------------------------------------------------------------------

function CityQuickAnswer({ cfg }: { cfg: CityConfig }) {
  return (
    <div className="container mx-auto px-4">
      <QuickAnswer text={cfg.quickAnswer} testId={`quick-answer-${cfg.slug}`} />
    </div>
  );
}

function CityHero({ cfg }: { cfg: CityConfig }) {
  const { t } = useT();
  return (
    <div className="relative text-white border-b border-[#D4AF37]/30 overflow-hidden">
      <img
        src={cfg.hero.image}
        alt={`Pind Daan ritual at ${cfg.cityName}`}
        className="absolute inset-0 w-full h-full object-cover object-center"
        data-testid={`img-${cfg.slug}-hero`}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/45 to-black/15" aria-hidden="true" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/10" aria-hidden="true" />
      <div className="relative container mx-auto px-4 py-14 sm:py-20 max-w-4xl">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-px w-8 bg-[#D4AF37]/60" />
          <Mountain className="h-3.5 w-3.5 text-[#D4AF37]" />
          <span className="text-[#D4AF37] text-[11px] uppercase tracking-[0.25em] font-medium">{cfg.hero.eyebrow}</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold leading-tight mb-3 drop-shadow-md" data-testid={`text-${cfg.slug}-h1`}>
          {cfg.hero.h1}
        </h1>
        <p className="font-serif text-lg sm:text-xl text-[#D4AF37]/95 mb-3">{cfg.cityNameHindi}</p>
        <p className="text-white/90 text-sm sm:text-base max-w-2xl leading-relaxed mb-3">
          {cfg.hero.sub}
        </p>
        <p className="text-[#D4AF37]/95 text-sm sm:text-base max-w-2xl leading-relaxed mb-6 italic">
          {cfg.hero.emotional}
        </p>
        <div className="flex flex-wrap gap-3 mb-6">
          <a href="#packages" className={PRIMARY_BTN} data-testid={`btn-${cfg.slug}-book-hero`}>
            <Flame className="w-4 h-4" /> {cfg.hero.bookCta}
          </a>
          <a
            href={cfg.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white/10 backdrop-blur-md text-white border border-white/70 hover:bg-white/20 rounded-md h-10 px-5 text-[13px] font-semibold transition-colors inline-flex items-center justify-center gap-2 leading-none"
            data-testid={`btn-${cfg.slug}-whatsapp-hero`}
          >
            <MessageCircle className="w-4 h-4" /> {t("Talk to a Pandit on WhatsApp", "व्हाट्सऐप पर पंडित से बात करें")}
          </a>
        </div>
        <div className="flex flex-wrap gap-2">
          {cfg.hero.trustBadges.map((tb) => (
            <span
              key={tb}
              className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.12em] font-semibold text-white bg-black/40 backdrop-blur-md border border-white/30 rounded-md px-2.5 h-7 leading-none"
              data-testid={`badge-${cfg.slug}-trust-${tb.toLowerCase().replace(/\s+/g, '-').slice(0, 30)}`}
            >
              <ShieldCheck className="w-3 h-3 text-[#D4AF37]" /> {tb}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function CityWhyImportant({ cfg }: { cfg: CityConfig }) {
  return (
    <section className="container mx-auto px-4 mt-12">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-7">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="h-px w-6 bg-[#D4AF37]/60" />
            <Award className="h-3.5 w-3.5 text-[#D4AF37]" />
            <span className="text-[#D4AF37] text-[10px] uppercase tracking-[0.25em] font-medium">{cfg.scriptureLabel}</span>
            <div className="h-px w-6 bg-[#D4AF37]/60" />
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl text-[#6D2B35] font-bold leading-tight mb-3" data-testid={`text-${cfg.slug}-why-title`}>
            {cfg.whyImportant.title}
          </h2>
          <p className="text-[#5a4a3a]/80 text-sm sm:text-[15px] leading-relaxed max-w-3xl mx-auto">
            {cfg.whyImportant.intro}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">
          {cfg.whyImportant.beliefs.map((b, i) => (
            <div
              key={i}
              className="bg-[#FBF7EE] border border-[#D4AF37]/25 rounded-md p-5"
              data-testid={`item-${cfg.slug}-belief-${i}`}
            >
              <span className="w-9 h-9 rounded-md bg-white border border-[#D4AF37]/25 flex items-center justify-center mb-3">
                <Sparkles className="w-4 h-4 text-[#6D2B35]" strokeWidth={1.8} />
              </span>
              <p className="text-[#5a4a3a] text-sm leading-relaxed">{b}</p>
            </div>
          ))}
        </div>

        <div className="bg-white border border-[#D4AF37]/25 rounded-md p-5 sm:p-6">
          <p className="text-center text-[#6D2B35] font-semibold text-sm uppercase tracking-[0.2em] mb-4">{cfg.whyImportant.sitesIntro}</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {cfg.whyImportant.sites.map((s) => (
              <div key={s.name} className="bg-[#FBF7EE] rounded-md border border-[#D4AF37]/20 overflow-hidden">
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img
                    src={s.image}
                    alt={`${s.name} at ${cfg.cityName}`}
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover"
                    data-testid={`img-${cfg.slug}-site-${s.name.toLowerCase().replace(/\s+/g, '-')}`}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#6D2B35]/55 via-[#6D2B35]/10 to-transparent" />
                  <span className="absolute top-2 left-2 w-8 h-8 rounded-md bg-white/90 border border-[#D4AF37]/30 flex items-center justify-center">
                    <s.icon className="w-4 h-4 text-[#6D2B35]" strokeWidth={1.8} />
                  </span>
                </div>
                <div className="p-3">
                  <p className="text-[#6D2B35] font-semibold text-sm">{s.name}</p>
                  <p className="text-[#5a4a3a]/75 text-xs leading-relaxed mt-0.5">{s.note}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function CityAnywhere({ cfg }: { cfg: CityConfig }) {
  const { t } = useT();
  const items = [
    { icon: Video, text: t("Sankalp is taken live via video call", "वीडियो कॉल पर लाइव संकल्प लिया जाता है") },
    { icon: BookOpen, text: t("Ritual is performed in your name & gotra", "अनुष्ठान आपके नाम व गोत्र में सम्पन्न होता है") },
    { icon: Camera, text: t("Full photo & video proof is shared", "पूर्ण फोटो व वीडियो प्रमाण साझा किए जाते हैं") },
    { icon: Package, text: t("Prasad & Ganga Jal delivered to your home", "प्रसाद व गंगा जल आपके घर पर वितरण") },
  ];
  return (
    <section className="container mx-auto px-4 mt-12">
      <div className="max-w-6xl mx-auto bg-[#6D2B35] text-white rounded-md overflow-hidden border border-[#D4AF37]/40 grid grid-cols-1 lg:grid-cols-5">
        <div className="relative lg:col-span-2 min-h-[260px] lg:min-h-0">
          <img
            src={cfg.anywhere.image}
            alt={`Tirth Purohit performing Pind Daan ritual at ${cfg.cityName}`}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover"
            data-testid={`img-${cfg.slug}-anywhere-ritual`}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-black/10 to-[#6D2B35]" />
        </div>
        <div className="lg:col-span-3 p-6 sm:p-10">
          <div className="mb-7">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-px w-6 bg-[#D4AF37]/60" />
              <Globe className="h-3.5 w-3.5 text-[#D4AF37]" />
              <span className="text-[#D4AF37] text-[10px] uppercase tracking-[0.25em] font-medium">{cfg.anywhere.kicker}</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl text-white font-bold leading-tight mb-2" data-testid={`text-${cfg.slug}-anywhere-title`}>
              {t("Perform Pind Daan from Anywhere in the World", "विश्व में कहीं से भी करें पिंडदान")}
            </h2>
            <p className="text-white/80 text-sm leading-relaxed">
              {cfg.anywhere.intro}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {items.map((it) => (
              <div
                key={it.text}
                className="bg-white/5 border border-[#D4AF37]/30 rounded-md p-4 flex items-start gap-3"
                data-testid={`item-${cfg.slug}-anywhere-${it.text.toLowerCase().replace(/\s+/g, '-').slice(0, 30)}`}
              >
                <span className="w-9 h-9 rounded-md bg-[#D4AF37]/15 border border-[#D4AF37]/40 flex items-center justify-center flex-shrink-0">
                  <it.icon className="w-4 h-4 text-[#D4AF37]" strokeWidth={1.8} />
                </span>
                <p className="text-white/90 text-sm leading-relaxed pt-1">{it.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function CityHowItWorks({ cfg }: { cfg: CityConfig }) {
  const { t } = useT();
  return (
    <section className="container mx-auto px-4 mt-12">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-7">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="h-px w-6 bg-[#D4AF37]/60" />
            <Compass className="h-3.5 w-3.5 text-[#D4AF37]" />
            <span className="text-[#D4AF37] text-[10px] uppercase tracking-[0.25em] font-medium">{t("Process", "प्रक्रिया")}</span>
            <div className="h-px w-6 bg-[#D4AF37]/60" />
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl text-[#6D2B35] font-bold leading-tight" data-testid={`text-${cfg.slug}-how-title`}>
            {t("How It Works", "यह कैसे कार्य करता है")}
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {cfg.howSteps.map((s, i) => (
            <div
              key={s.title}
              className="bg-white border border-[#D4AF37]/25 rounded-md p-4 hover-elevate"
              data-testid={`step-${cfg.slug}-${i + 1}`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="w-7 h-7 rounded-md bg-[#6D2B35] text-[#D4AF37] flex items-center justify-center text-xs font-bold">
                  {i + 1}
                </span>
                <h3 className="text-[#6D2B35] font-serif font-bold text-sm leading-snug">{s.title}</h3>
              </div>
              <p className="text-[#5a4a3a]/75 text-xs leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CityPackages({ cfg }: { cfg: CityConfig }) {
  const { t } = useT();
  const universal = [
    { icon: ShieldCheck, label: t("Verified Tirth Purohits", "सत्यापित तीर्थ पुरोहित") },
    { icon: Video, label: t("Live Video Sankalp", "लाइव वीडियो संकल्प") },
    { icon: Camera, label: t("Proof within 24 hours", "24 घंटे में प्रमाण") },
    { icon: Package, label: t("100% Secure Payment", "100% सुरक्षित भुगतान") },
  ];
  return (
    <section id="packages" className="bg-[#FBF7EE]/60 mt-12 py-12 sm:py-14 scroll-mt-24">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-9">
            <div className="flex items-center justify-center gap-2 mb-3">
              <div className="h-px w-6 bg-[#D4AF37]/60" />
              <Package className="h-3.5 w-3.5 text-[#D4AF37]" />
              <span className="text-[#D4AF37] text-[10px] uppercase tracking-[0.25em] font-medium">{t("Choose Your Sankalp", "अपना संकल्प चुनें")}</span>
              <div className="h-px w-6 bg-[#D4AF37]/60" />
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl text-[#6D2B35] font-bold leading-tight mb-2" data-testid={`text-${cfg.slug}-packages-title`}>
              {cfg.packagesTitle}
            </h2>
            <p className="text-[#5a4a3a]/75 text-sm sm:text-[15px] leading-relaxed max-w-2xl mx-auto">
              {cfg.packagesIntro}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6 items-stretch">
            {cfg.packages.map((pkg) => {
              const Icon = pkg.icon;
              const isFeatured = pkg.badge === "Most Booked";
              const savings = pkg.originalPrice ? pkg.originalPrice - pkg.price : 0;
              const sections: { title: string; icon: LucideIcon; items: string[] }[] = [
                { title: t("Ritual", "अनुष्ठान"), icon: Flame, items: pkg.ritual },
                { title: t("Proof", "प्रमाण"), icon: Camera, items: pkg.proof },
                { title: t("Delivery", "वितरण"), icon: Package, items: pkg.delivery },
              ];
              return (
                <div
                  key={pkg.id}
                  className={`relative rounded-lg border flex flex-col overflow-hidden ${
                    isFeatured
                      ? "bg-[#6D2B35] text-white border-[#D4AF37]/60 shadow-lg shadow-[#6D2B35]/20 md:-mt-4 md:mb-4"
                      : "bg-white text-[#5a4a3a] border-[#D4AF37]/25"
                  }`}
                  data-testid={`card-${cfg.slug}-package-${pkg.id}`}
                >
                  {pkg.badge && (
                    <div className="absolute top-0 right-0">
                      <span
                        className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.18em] font-bold text-[#6D2B35] bg-[#D4AF37] pl-2.5 pr-3 h-7 rounded-bl-lg"
                        data-testid={`badge-${cfg.slug}-package-${pkg.id}`}
                      >
                        <Award className="w-3 h-3" /> {pkg.badge}
                      </span>
                    </div>
                  )}

                  <div className={`p-5 sm:p-6 ${isFeatured ? "border-b border-[#D4AF37]/25" : "border-b border-[#D4AF37]/15"}`}>
                    <div className="flex items-start gap-3 mb-3">
                      <div className={`w-11 h-11 rounded-md flex items-center justify-center flex-shrink-0 ${isFeatured ? "bg-[#D4AF37]/15 border border-[#D4AF37]/40" : "bg-[#FBF7EE] border border-[#D4AF37]/25"}`}>
                        <Icon className={`w-5 h-5 ${isFeatured ? "text-[#D4AF37]" : "text-[#6D2B35]"}`} strokeWidth={1.6} />
                      </div>
                      <div className="min-w-0">
                        <h3 className={`font-serif font-bold text-lg leading-tight ${isFeatured ? "text-white" : "text-[#6D2B35]"}`}>
                          {pkg.name}
                        </h3>
                        <p className={`font-serif text-sm mt-0.5 ${isFeatured ? "text-[#D4AF37]/90" : "text-[#D4AF37]"}`}>{pkg.subtitle}</p>
                      </div>
                    </div>
                    <p className={`text-xs leading-relaxed mb-4 ${isFeatured ? "text-white/80" : "text-[#5a4a3a]/75"}`}>
                      {pkg.tagline}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      <span className={`inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.15em] font-semibold rounded px-2 h-6 ${isFeatured ? "bg-white/10 text-[#D4AF37] border border-[#D4AF37]/30" : "bg-[#FBF7EE] text-[#6D2B35] border border-[#D4AF37]/25"}`}>
                        <Clock className="w-3 h-3" /> {pkg.duration}
                      </span>
                      <span className={`inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.15em] font-semibold rounded px-2 h-6 ${isFeatured ? "bg-white/10 text-[#D4AF37] border border-[#D4AF37]/30" : "bg-[#FBF7EE] text-[#6D2B35] border border-[#D4AF37]/25"}`}>
                        <Mountain className="w-3 h-3" /> {pkg.vidhi}
                      </span>
                    </div>
                    <div className="flex items-end gap-2">
                      <p className={`font-serif text-3xl sm:text-4xl font-bold leading-none ${isFeatured ? "text-white" : "text-[#6D2B35]"}`} data-testid={`text-${cfg.slug}-price-${pkg.id}`}>
                        ₹{pkg.price.toLocaleString("en-IN")}
                      </p>
                      {pkg.originalPrice && (
                        <p className={`text-sm line-through pb-0.5 ${isFeatured ? "text-white/50" : "text-[#5a4a3a]/45"}`}>
                          ₹{pkg.originalPrice.toLocaleString("en-IN")}
                        </p>
                      )}
                    </div>
                    <p className={`text-[11px] mt-1 ${isFeatured ? "text-[#D4AF37]" : "text-[#5a4a3a]/60"}`}>
                      {savings > 0
                        ? t(`Save ₹${savings.toLocaleString("en-IN")} • all-inclusive`, `बचत ₹${savings.toLocaleString("en-IN")} • सर्व-समावेशी`)
                        : t("All-inclusive · no hidden fees", "सर्व-समावेशी · कोई छुपा शुल्क नहीं")}
                    </p>
                  </div>

                  <div className="p-5 sm:p-6 flex-1 flex flex-col">
                    <div className="space-y-4 flex-1">
                      {sections.map((sec) => (
                        <div key={sec.title}>
                          <p className={`text-[10px] uppercase tracking-[0.2em] font-semibold mb-2 flex items-center gap-1.5 ${isFeatured ? "text-[#D4AF37]" : "text-[#6D2B35]"}`}>
                            <sec.icon className="w-3 h-3" strokeWidth={2} /> {sec.title}
                          </p>
                          <ul className="space-y-1.5">
                            {sec.items.map((it) => (
                              <li key={it} className="flex items-start gap-2 text-[13px] leading-snug">
                                <ShieldCheck className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${isFeatured ? "text-[#D4AF37]" : "text-[#6D2B35]/80"}`} strokeWidth={2} />
                                <span className={isFeatured ? "text-white/90" : "text-[#5a4a3a]/90"}>{it}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>

                    <div className="mt-6">
                      <Link
                        href={`/puja?pujaType=${cfg.pujaType}&mode=online&package=${pkg.id}`}
                        className={
                          isFeatured
                            ? "w-full bg-[#D4AF37] text-[#6D2B35] hover:bg-[#c19f30] rounded-md h-11 px-5 text-[13px] font-bold tracking-wide transition-colors inline-flex items-center justify-center gap-2"
                            : "w-full bg-[#6D2B35] text-white hover:bg-[#5a232c] rounded-md h-11 px-5 text-[13px] font-bold tracking-wide transition-colors inline-flex items-center justify-center gap-2"
                        }
                        data-testid={`btn-${cfg.slug}-book-${pkg.id}`}
                      >
                        {pkg.cta} <ArrowRight className="w-4 h-4" />
                      </Link>
                      <p className={`text-[11px] text-center mt-2 flex items-center justify-center gap-1 ${isFeatured ? "text-white/70" : "text-[#5a4a3a]/60"}`}>
                        <ShieldCheck className="w-3 h-3" /> {t("Secure payment · 100% authentic vidhi", "सुरक्षित भुगतान · 100% प्रामाणिक विधि")}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-8 bg-white border border-[#D4AF37]/25 rounded-md p-4 sm:p-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {universal.map((u) => (
                <div key={u.label} className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-md bg-[#FBF7EE] border border-[#D4AF37]/25 flex items-center justify-center flex-shrink-0">
                    <u.icon className="w-4 h-4 text-[#6D2B35]" strokeWidth={1.8} />
                  </span>
                  <p className="text-[12px] sm:text-[13px] font-semibold text-[#5a4a3a] leading-tight">{u.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-center">
            <p className="text-sm text-[#5a4a3a]/80">
              {t("Not sure which package fits your need?", "किस पैकेज का चयन करें इस पर अनिश्चित हैं?")}
            </p>
            <a
              href={cfg.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              data-testid={`link-${cfg.slug}-package-help`}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#6D2B35] hover-elevate active-elevate-2 rounded-md px-2.5 h-8"
            >
              <MessageCircle className="w-4 h-4" /> {t("Talk to a Pandit on WhatsApp", "व्हाट्सऐप पर पंडित से बात करें")}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function CityWhyChoose({ cfg }: { cfg: CityConfig }) {
  const { t } = useT();
  return (
    <section className="container mx-auto px-4 mt-12">
      <div className="max-w-5xl mx-auto bg-[#FBF7EE] border border-[#D4AF37]/25 rounded-md p-6 sm:p-8">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="h-px w-6 bg-[#D4AF37]/60" />
            <Heart className="h-3.5 w-3.5 text-[#D4AF37]" />
            <span className="text-[#D4AF37] text-[10px] uppercase tracking-[0.25em] font-medium">{t("Holistic Ritual", "समग्र अनुष्ठान")}</span>
            <div className="h-px w-6 bg-[#D4AF37]/60" />
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl text-[#6D2B35] font-bold leading-tight mb-2" data-testid={`text-${cfg.slug}-why-choose-title`}>
            {cfg.whyChooseTitle}
          </h2>
          <p className="text-[#5a4a3a]/75 text-sm leading-relaxed max-w-2xl mx-auto">
            {cfg.whyChooseIntro}
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {cfg.whyChooseItems.map((it) => (
            <div
              key={it.text}
              className="bg-white border border-[#D4AF37]/20 rounded-md p-4 flex items-start gap-3"
              data-testid={`item-${cfg.slug}-why-${it.text.toLowerCase().replace(/\s+/g, '-').slice(0, 30)}`}
            >
              <span className="w-9 h-9 rounded-md bg-[#FBF7EE] border border-[#D4AF37]/25 flex items-center justify-center flex-shrink-0">
                <it.icon className="w-4 h-4 text-[#6D2B35]" strokeWidth={1.8} />
              </span>
              <p className="text-[#5a4a3a] text-sm leading-relaxed pt-1">{it.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CityFaqs({ cfg }: { cfg: CityConfig }) {
  const { t } = useT();
  return (
    <section className="container mx-auto px-4 mt-12">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="h-px w-6 bg-[#D4AF37]/60" />
            <BookOpen className="h-3.5 w-3.5 text-[#D4AF37]" />
            <span className="text-[#D4AF37] text-[10px] uppercase tracking-[0.25em] font-medium">{t("FAQ", "सामान्य प्रश्न")}</span>
            <div className="h-px w-6 bg-[#D4AF37]/60" />
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl text-[#6D2B35] font-bold leading-tight" data-testid={`text-${cfg.slug}-faq-title`}>
            {t("Frequently Asked Questions", "अक्सर पूछे जाने वाले प्रश्न")}
          </h2>
        </div>
        <div className="space-y-3">
          {cfg.faqs.map((f, i) => (
            <details
              key={i}
              className="bg-white border border-[#D4AF37]/25 rounded-md p-4 group"
              data-testid={`faq-${cfg.slug}-${i}`}
            >
              <summary className="cursor-pointer list-none flex items-start justify-between gap-3">
                <span className="font-serif text-[#6D2B35] font-bold text-[15px] leading-snug">{f.q}</span>
                <ChevronRight className="w-4 h-4 text-[#D4AF37] mt-1 flex-shrink-0 transition-transform group-open:rotate-90" />
              </summary>
              <p className="mt-3 text-[#5a4a3a]/85 text-sm leading-relaxed">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function CityFinalCta({ cfg }: { cfg: CityConfig }) {
  const { t } = useT();
  return (
    <section className="container mx-auto px-4 mt-12">
      <div className="max-w-4xl mx-auto bg-[#6D2B35] text-white rounded-md p-7 sm:p-10 text-center border border-[#D4AF37]/40">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="h-px w-6 bg-[#D4AF37]/60" />
          <Clock className="h-3.5 w-3.5 text-[#D4AF37]" />
          <span className="text-[#D4AF37] text-[10px] uppercase tracking-[0.25em] font-medium">{t("Pitru Dharma", "पितृ धर्म")}</span>
          <div className="h-px w-6 bg-[#D4AF37]/60" />
        </div>
        <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold leading-tight mb-3" data-testid={`text-${cfg.slug}-final-cta-title`}>
          {cfg.finalCta.title}
        </h2>
        <p className="text-white/80 text-sm sm:text-base max-w-2xl mx-auto mb-6 leading-relaxed">
          {cfg.finalCta.sub}
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <a
            href="#packages"
            className="bg-[#D4AF37] text-[#6D2B35] hover:bg-[#c19f30] rounded-md h-10 px-5 text-[13px] font-semibold transition-colors inline-flex items-center justify-center gap-2"
            data-testid={`btn-${cfg.slug}-final-book`}
          >
            <Flame className="w-4 h-4" /> {t("Book Now", "अभी बुक करें")}
          </a>
          <a
            href={cfg.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white/10 text-white border border-white/70 hover:bg-white/20 rounded-md h-10 px-5 text-[13px] font-semibold transition-colors inline-flex items-center justify-center gap-2 leading-none"
            data-testid={`btn-${cfg.slug}-final-whatsapp`}
          >
            <MessageCircle className="w-4 h-4" /> {t("Speak to Expert", "विशेषज्ञ से बात करें")}
          </a>
        </div>
      </div>
    </section>
  );
}

// ----------------------------------------------------------------------------
// SEO: per-city meta + JSON-LD (Service, Breadcrumb, FAQ, AggregateOffer)
// ----------------------------------------------------------------------------

const SITE_ORIGIN = "https://vedictatva.com";

function CitySeo({ cfg }: { cfg: CityConfig }) {
  const path = `/pind-daan-${cfg.slug}`;
  const cityCap = cfg.cityName;
  const title = `Online Pind Daan in ${cityCap} ${cfg.slug === "gaya" ? "— Moksha at Vishnupad & Phalgu" : cfg.slug === "kashi" ? "— Liberation at Manikarnika & Pishachmochan" : "— Shradh at Har Ki Pauri & Narayani Shila"} | Vedic Tatva`;
  const desc = `${cfg.hero.sub} Book authentic ${cityCap} Pind Daan from anywhere — verified Karmakandi pandits, live video sankalp, full ritual proof, prasad delivered worldwide. Packages from ₹${cfg.packages[0].price.toLocaleString("en-IN")}.`;
  const ogImage = cfg.hero.image ? abs(cfg.hero.image) : undefined;
  const minPrice = Math.min(...cfg.packages.map((p) => p.price));
  const maxPrice = Math.max(...cfg.packages.map((p) => p.price));

  return (
    <PageSeo
      title={title}
      description={desc}
      keywords={`pind daan ${cityCap.toLowerCase()}, online pind daan ${cityCap.toLowerCase()}, ${cityCap.toLowerCase()} shradh, pitru paksha ${cityCap.toLowerCase()}, tarpan, tripindi shradh, nri pind daan, pind daan from usa uk canada`}
      canonical={path}
      ogImage={ogImage}
      twitterCard="summary_large_image"
      extraMeta={[{ name: "og:site_name", content: "Vedic Tatva", property: true }]}
      schemas={[
        {
          id: `pd-service-${cfg.slug}`,
          payload: {
            "@context": "https://schema.org",
            "@type": "Service",
            name: `Online Pind Daan in ${cityCap}`,
            serviceType: "Pind Daan / Shradh Ritual",
            provider: { "@type": "Organization", name: "Vedic Tatva", url: SITE_ORIGIN },
            areaServed: { "@type": "Country", name: "Worldwide" },
            description: desc,
            url: abs(path),
            offers: {
              "@type": "AggregateOffer",
              priceCurrency: "INR",
              lowPrice: minPrice,
              highPrice: maxPrice,
              offerCount: cfg.packages.length,
              availability: "https://schema.org/InStock",
            },
          },
        },
        breadcrumbList([
          { name: "Home", url: "/" },
          { name: "Pind Daan", url: "/pind-daan" },
          { name: `Pind Daan in ${cityCap}`, url: path },
        ]),
        faqPage(cfg.faqs.map((f) => ({ question: f.q, answer: f.a }))),
      ]}
    />
  );
}

// ----------------------------------------------------------------------------
// Sister Tirths — cross-link strip between Gaya / Kashi / Haridwar + Hub
// ----------------------------------------------------------------------------

const SISTER_TIRTHS: Record<CityConfig["slug"], { slug: string; name: string; tagline: string; href: string; icon: LucideIcon }[]> = {
  gaya: [
    { slug: "kashi", name: "Pind Daan in Kashi", tagline: "Liberation at Manikarnika Ghat", href: "/pind-daan-kashi", icon: Flame },
    { slug: "haridwar", name: "Pind Daan in Haridwar", tagline: "Shradh at Har Ki Pauri & Narayani Shila", href: "/pind-daan-haridwar", icon: Mountain },
    { slug: "hub", name: "All Sacred Tirthas", tagline: "Compare every Pind Daan destination", href: "/pind-daan", icon: Compass },
  ],
  kashi: [
    { slug: "gaya", name: "Pind Daan in Gaya", tagline: "Moksha at Vishnupad & Phalgu", href: "/pind-daan-gaya", icon: Sparkles },
    { slug: "haridwar", name: "Pind Daan in Haridwar", tagline: "Shradh at Har Ki Pauri & Narayani Shila", href: "/pind-daan-haridwar", icon: Mountain },
    { slug: "hub", name: "All Sacred Tirthas", tagline: "Compare every Pind Daan destination", href: "/pind-daan", icon: Compass },
  ],
  haridwar: [
    { slug: "gaya", name: "Pind Daan in Gaya", tagline: "Moksha at Vishnupad & Phalgu", href: "/pind-daan-gaya", icon: Sparkles },
    { slug: "kashi", name: "Pind Daan in Kashi", tagline: "Liberation at Manikarnika Ghat", href: "/pind-daan-kashi", icon: Flame },
    { slug: "hub", name: "All Sacred Tirthas", tagline: "Compare every Pind Daan destination", href: "/pind-daan", icon: Compass },
  ],
};

function SisterTirths({ cfg }: { cfg: CityConfig }) {
  const { t } = useT();
  const items = SISTER_TIRTHS[cfg.slug];
  return (
    <section className="container mx-auto px-4 mt-14">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="h-px w-6 bg-[#D4AF37]/60" />
            <Globe className="h-3.5 w-3.5 text-[#D4AF37]" />
            <span className="text-[#D4AF37] text-[10px] uppercase tracking-[0.25em] font-medium">{t("Sister Tirthas", "अन्य तीर्थ")}</span>
            <div className="h-px w-6 bg-[#D4AF37]/60" />
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl text-[#6D2B35] font-bold leading-tight" data-testid={`text-${cfg.slug}-sister-title`}>
            {t("Other Sacred Pind Daan Destinations", "अन्य पवित्र पिंडदान स्थल")}
          </h2>
          <p className="text-[#5a4a3a]/75 text-sm max-w-2xl mx-auto mt-2">
            {t("Each tirth carries its own scriptural significance. Explore where else you may offer pind for your ancestors.", "प्रत्येक तीर्थ का अपना शास्त्रीय महत्व है। जानें अपने पितरों के लिए और कहाँ पिंड अर्पण कर सकते हैं।")}
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {items.map((it) => (
            <Link
              key={it.slug}
              href={it.href}
              className="group bg-white border border-[#D4AF37]/25 hover:border-[#D4AF37]/60 rounded-md p-5 transition-all hover-elevate"
              data-testid={`link-sister-${cfg.slug}-${it.slug}`}
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-md bg-[#FBF7EE] border border-[#D4AF37]/30 flex items-center justify-center flex-shrink-0">
                  <it.icon className="w-4 h-4 text-[#6D2B35]" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-serif text-[#6D2B35] font-bold text-base leading-snug">{it.name}</h3>
                  <p className="text-[#5a4a3a]/75 text-xs mt-1 leading-relaxed">{it.tagline}</p>
                  <span className="inline-flex items-center gap-1 mt-3 text-[11px] font-semibold text-[#D4AF37] group-hover:gap-2 transition-all">
                    {t("Explore", "देखें")} <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

// ----------------------------------------------------------------------------
// Recommended Rituals — cross-sell to related pujas / services
// ----------------------------------------------------------------------------

const recommendWa = (ritual: string) =>
  "https://wa.me/918447844702?text=" +
  encodeURIComponent(`Namaste, I would like guidance on performing ${ritual} for my ancestors.`);

const RECOMMENDED_RITUALS: { title: string; tagline: string; href: string; icon: LucideIcon; tag: string; external?: boolean }[] = [
  { title: "Tripindi Shradh", tagline: "For ancestors departed unnaturally or whose tithi is unknown.", href: recommendWa("Tripindi Shradh"), icon: ScrollText, tag: "Pitru Dosh", external: true },
  { title: "Narayan Bali Puja", tagline: "Liberation rite for souls who left through accident or untimely death.", href: recommendWa("Narayan Bali Puja"), icon: Sparkles, tag: "Moksha Vidhi", external: true },
  { title: "Pitru Dosh Nivaran", tagline: "Remedial puja for ancestral curses affecting career, marriage & progeny.", href: recommendWa("Pitru Dosh Nivaran Puja"), icon: ShieldCheck, tag: "Dosh Remedy", external: true },
  { title: "Rudrabhishek for Ancestors", tagline: "Lord Shiva worship dedicated to grant gati to departed souls.", href: "/puja", icon: Flame, tag: "Shaivite Rite" },
  { title: "Kala Sarp Dosh Puja", tagline: "Trimbakeshwar rite to dissolve serpent-curse passed through lineage.", href: recommendWa("Kala Sarp Dosh Puja"), icon: Wind, tag: "Graha Dosh", external: true },
  { title: "Tirth Yatra Packages", tagline: "Visit Gaya, Kashi & Haridwar in person with our pandit-led yatras.", href: "/tirth-yatra", icon: Mountain, tag: "Pilgrimage" },
];

function RecommendedRituals({ cfg }: { cfg: CityConfig }) {
  const { t } = useT();
  return (
    <section className="container mx-auto px-4 mt-14">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-7">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="h-px w-6 bg-[#D4AF37]/60" />
            <Star className="h-3.5 w-3.5 text-[#D4AF37]" />
            <span className="text-[#D4AF37] text-[10px] uppercase tracking-[0.25em] font-medium">{t("Recommended For You", "आपके लिए अनुशंसित")}</span>
            <div className="h-px w-6 bg-[#D4AF37]/60" />
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl text-[#6D2B35] font-bold leading-tight" data-testid={`text-${cfg.slug}-recommended-title`}>
            {t("Other Sacred Rites Often Performed With Pind Daan", "पिंडदान के साथ प्रायः किए जाने वाले अन्य पवित्र अनुष्ठान")}
          </h2>
          <p className="text-[#5a4a3a]/75 text-sm max-w-2xl mx-auto mt-2">
            {t("Many families combine Pind Daan with one of these complementary remedies, especially when there is suspected pitru dosh or a soul that left under unusual circumstances.", "कई परिवार पिंडदान के साथ इनमें से कोई पूरक उपाय भी करते हैं, विशेषतः जब पितृ दोष का संदेह हो या आत्मा असामान्य परिस्थितियों में देहत्याग की हो।")}
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {RECOMMENDED_RITUALS.map((r) => {
            const testId = `link-recommended-${cfg.slug}-${r.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
            const inner = (
              <>
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-md bg-white border border-[#D4AF37]/30 flex items-center justify-center flex-shrink-0">
                    <r.icon className="w-4 h-4 text-[#6D2B35]" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] uppercase tracking-[0.2em] text-[#D4AF37] font-semibold">{r.tag}</span>
                    <h3 className="font-serif text-[#6D2B35] font-bold text-base leading-snug mt-0.5">{r.title}</h3>
                  </div>
                </div>
                <p className="text-[#5a4a3a]/80 text-[13px] leading-relaxed">{r.tagline}</p>
                <span className="inline-flex items-center gap-1 mt-3 text-[11px] font-semibold text-[#6D2B35] group-hover:gap-2 transition-all">
                  {r.external ? (<><MessageCircle className="w-3 h-3" /> {t("Ask on WhatsApp", "व्हाट्सऐप पर पूछें")}</>) : (<>{t("Learn more", "और जानें")} <ArrowRight className="w-3 h-3" /></>)}
                </span>
              </>
            );
            const cls = "group bg-[#FBF7EE] border border-[#D4AF37]/20 hover:border-[#D4AF37]/55 rounded-md p-5 transition-all hover-elevate flex flex-col";
            return r.external ? (
              <a key={r.title} href={r.href} target="_blank" rel="noopener noreferrer" className={cls} data-testid={testId}>{inner}</a>
            ) : (
              <Link key={r.title} href={r.href} className={cls} data-testid={testId}>{inner}</Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ----------------------------------------------------------------------------
// Tithi Tool teaser — promises death-anniversary tithi calculator + reminders
// ----------------------------------------------------------------------------

function TithiToolTeaser({ cfg }: { cfg: CityConfig }) {
  const { t, isHi } = useT();
  return (
    <section className="container mx-auto px-4 mt-14">
      <div className="max-w-5xl mx-auto bg-gradient-to-br from-[#FBF7EE] to-white border border-[#D4AF37]/35 rounded-md p-7 sm:p-9">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-7 items-center">
          <div className="md:col-span-3">
            <div className="flex items-center gap-2 mb-3">
              <Calculator className="w-4 h-4 text-[#D4AF37]" />
              <span className="text-[#D4AF37] text-[10px] uppercase tracking-[0.25em] font-semibold">{t("Free Tool", "निःशुल्क टूल")}</span>
            </div>
            <h3 className="font-serif text-2xl sm:text-3xl text-[#6D2B35] font-bold leading-tight" data-testid={`text-${cfg.slug}-tithi-tool-title`}>
              {t("Pitru Tithi Calculator & Annual Shradh Reminders", "पितृ तिथि कैलकुलेटर एवं वार्षिक श्राद्ध स्मरण")}
            </h3>
            <p className="text-[#5a4a3a]/85 text-sm sm:text-[15px] mt-3 leading-relaxed">
              {isHi ? (
                <>अपने पितर की देहत्याग की तिथि, समय एवं स्थान दर्ज करें। हमारा वैदिक पंचांग इंजन सटीक <strong>तिथि, पक्ष एवं नक्षत्र</strong> गणना करता है, किसी भी <strong>पितृ दोष</strong> संकेत को चिह्नित करता है, और (साइन-इन करने पर) प्रत्येक वर्ष व्हाट्सऐप व ईमेल पर T−7, T−1 एवं श्राद्ध के दिन स्मरण कराता है।</>
              ) : (
                <>Enter your ancestor's date, time and place of departure. Our Vedic panchang engine computes the exact <strong>tithi, paksha &amp; nakshatra</strong>, flags any <strong>Pitru Dosh</strong> indicators, and (when you sign in) reminds you every year — by WhatsApp &amp; email — at T&minus;7, T&minus;1 and on the day of Shradh.</>
              )}
            </p>
            <ul className="mt-4 space-y-2 text-[13px] text-[#5a4a3a]/85">
              <li className="flex items-start gap-2"><Star className="w-3.5 h-3.5 text-[#D4AF37] mt-1 flex-shrink-0" /> {t("Annual Shradh tithi computed for every ancestor you save", "प्रत्येक सहेजे गए पितर हेतु वार्षिक श्राद्ध तिथि की गणना")}</li>
              <li className="flex items-start gap-2"><Star className="w-3.5 h-3.5 text-[#D4AF37] mt-1 flex-shrink-0" /> {t("Personalised Pitru Dosh assessment with shastric remedies", "शास्त्रीय उपायों सहित वैयक्तिक पितृ दोष आकलन")}</li>
              <li className="flex items-start gap-2"><Star className="w-3.5 h-3.5 text-[#D4AF37] mt-1 flex-shrink-0" /> {t("One-tap booking for the right Pind Daan / Shradh package", "उचित पिंडदान / श्राद्ध पैकेज हेतु एक-टैप बुकिंग")}</li>
            </ul>
          </div>
          <div className="md:col-span-2 flex flex-col gap-3">
            <Link
              href="/tools/tithi-calculator"
              className="bg-[#6D2B35] text-white hover:bg-[#5a232b] rounded-md h-11 px-5 text-[13px] font-bold tracking-wide transition-colors inline-flex items-center justify-center gap-2 leading-none"
              data-testid={`btn-${cfg.slug}-tithi-open`}
            >
              <Calculator className="w-4 h-4" /> {t("Open Tithi Calculator", "तिथि कैलकुलेटर खोलें")}
            </Link>
            <Link
              href="/panchang-calendar"
              className="bg-white text-[#6D2B35] border border-[#D4AF37]/45 hover:bg-[#FBF7EE] rounded-md h-11 px-5 text-[13px] font-semibold transition-colors inline-flex items-center justify-center gap-2"
              data-testid={`btn-${cfg.slug}-panchang-today`}
            >
              <Calendar className="w-4 h-4" /> {t("Today's Panchang", "आज का पंचांग")}
            </Link>
            <p className="text-[11px] text-[#5a4a3a]/60 text-center mt-1">
              {t("Built on our in-house Vedic panchang engine.", "हमारे स्व-निर्मित वैदिक पंचांग इंजन पर आधारित।")}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

// ----------------------------------------------------------------------------
// Related Journal — pulls Pind Daan related blog posts
// ----------------------------------------------------------------------------

function CityRelatedJournal({ cfg }: { cfg: CityConfig }) {
  return (
    <section className="container mx-auto px-4">
      <div className="max-w-6xl mx-auto">
        <RelatedBlogPosts category={`pind-daan-${cfg.slug}`} productName={`${cfg.cityName} Pind Daan Shradh Pitru`} limit={3} />
      </div>
    </section>
  );
}

function CityLanding({ cfg }: { cfg: CityConfig }) {
  return (
    <div className="w-full pb-16 bg-white">
      <CitySeo cfg={cfg} />
      <CityHero cfg={cfg} />
      <CityQuickAnswer cfg={cfg} />
      <CompactTithiCalculator testIdPrefix={`tithi-pind-daan-${cfg.slug}`} />
      <CityWhyImportant cfg={cfg} />
      <CityAnywhere cfg={cfg} />
      <CityHowItWorks cfg={cfg} />
      <CityPackages cfg={cfg} />
      <CityWhyChoose cfg={cfg} />
      <RecommendedRituals cfg={cfg} />
      <TithiToolTeaser cfg={cfg} />
      <SisterTirths cfg={cfg} />
      <CityRelatedJournal cfg={cfg} />
      <CityFaqs cfg={cfg} />
      <CityFinalCta cfg={cfg} />
    </div>
  );
}

export function PindDaanGayaLanding() {
  const { isHi } = useT();
  return <CityLanding cfg={isHi ? gayaCityConfigHi : gayaCityConfig} />;
}

export function PindDaanKashiLanding() {
  const { isHi } = useT();
  return <CityLanding cfg={isHi ? kashiCityConfigHi : kashiCityConfig} />;
}

export function PindDaanHaridwarLanding() {
  const { isHi } = useT();
  return <CityLanding cfg={isHi ? haridwarCityConfigHi : haridwarCityConfig} />;
}
