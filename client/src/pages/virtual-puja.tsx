import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import {
  ArrowLeft, Flame, Play, Pause, SkipForward, RotateCcw,
  Check, Clock, ChevronRight, Sparkles, Heart,
  ShieldCheck, Globe, Users, BookOpen
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { RelatedServicesSection } from "@/components/RelatedServices";
import PageAPlusContent from "@/components/PageAPlusContent";
import PageSeo from "@/components/PageSeo";
import { softwareApplication, breadcrumbList } from "@/lib/seo-schemas";

interface PujaStep {
  id: number;
  title: string;
  titleHindi: string;
  description: string;
  mantra: string;
  mantraTranslation: string;
  duration: number;
  icon: string;
}

const PUJA_TYPES = [
  {
    id: "ganesh",
    name: "Ganesh Puja",
    nameHindi: "श्री गणेश पूजा",
    desc: "Invoke Lord Ganesha's blessings for new beginnings and obstacle removal",
    color: "from-orange-500 to-red-500",
    duration: "15-20 min",
    steps: [
      { id: 1, title: "Dhyana (Meditation)", titleHindi: "ध्यान", description: "Close your eyes. Sit comfortably facing East. Take 3 deep breaths. Visualize Lord Ganesha's form with a bright golden aura.", mantra: "ॐ गं गणपतये नमः", mantraTranslation: "Om Gam Ganapataye Namaha — I bow to Lord Ganesha", duration: 120, icon: "🧘" },
      { id: 2, title: "Avahan (Invocation)", titleHindi: "आवाहन", description: "Ring the bell gently. Sprinkle water around the idol/image. Invite Lord Ganesha to be present in your puja space.", mantra: "ॐ गणेशाय नमः, आवाहयामि", mantraTranslation: "I invoke and welcome Lord Ganesha", duration: 60, icon: "🔔" },
      { id: 3, title: "Snaan (Bathing)", titleHindi: "स्नान", description: "Gently pour water over the idol while chanting. If using image, sprinkle holy water. This symbolizes purification.", mantra: "ॐ गं गणपतये नमः, स्नानं समर्पयामि", mantraTranslation: "I offer this sacred bath to Lord Ganesha", duration: 60, icon: "💧" },
      { id: 4, title: "Vastra (Clothing)", titleHindi: "वस्त्र", description: "Offer fresh cloth or flowers to the deity. Red or yellow cloth is preferred for Ganesh Puja. This represents devotion.", mantra: "ॐ गणेशाय नमः, वस्त्रं समर्पयामि", mantraTranslation: "I offer these garments to Lord Ganesha", duration: 45, icon: "🧣" },
      { id: 5, title: "Gandha (Sandalwood)", titleHindi: "गंध", description: "Apply sandalwood paste (chandan) or kumkum tilak on the deity's forehead. Apply on your own forehead too.", mantra: "ॐ गणेशाय नमः, चंदनं समर्पयामि", mantraTranslation: "I offer this sacred sandalwood paste", duration: 45, icon: "🪷" },
      { id: 6, title: "Pushpa (Flowers)", titleHindi: "पुष्प", description: "Offer fresh flowers — red flowers are most auspicious for Ganesha. Durva grass (doob) is especially dear to Him.", mantra: "ॐ गणेशाय नमः, पुष्पं समर्पयामि", mantraTranslation: "I offer these sacred flowers", duration: 45, icon: "🌺" },
      { id: 7, title: "Dhoop (Incense)", titleHindi: "धूप", description: "Light an agarbatti or dhoop. Circle it clockwise 3 times before the deity. The fragrance purifies the atmosphere.", mantra: "ॐ गणेशाय नमः, धूपं समर्पयामि", mantraTranslation: "I offer this sacred incense", duration: 60, icon: "🪔" },
      { id: 8, title: "Deep (Lamp)", titleHindi: "दीप", description: "Light a ghee or oil lamp. Place it to the right of the deity. The flame represents divine knowledge dispelling ignorance.", mantra: "ॐ गणेशाय नमः, दीपं समर्पयामि", mantraTranslation: "I offer this sacred lamp", duration: 45, icon: "🕯️" },
      { id: 9, title: "Naivedya (Offering)", titleHindi: "नैवेद्य", description: "Offer modak, laddoo, or fresh fruits. Sprinkle water around the offering. This is prasad — share it after puja.", mantra: "ॐ गणेशाय नमः, नैवेद्यं समर्पयामि", mantraTranslation: "I offer this sacred food", duration: 60, icon: "🍬" },
      { id: 10, title: "Aarti", titleHindi: "आरती", description: "Light the aarti lamp with 5 wicks. Circle it clockwise before the deity — 3 times at face, 2 at feet, 1 full circle.", mantra: "जय गणेश जय गणेश जय गणेश देवा, माता जाकी पार्वती पिता महादेवा", mantraTranslation: "Victory to Lord Ganesha, whose mother is Parvati and father is Mahadeva", duration: 120, icon: "🪔" },
      { id: 11, title: "Prarthana (Prayer)", titleHindi: "प्रार्थना", description: "Fold your hands. Close your eyes. Offer your personal prayers and wishes to Lord Ganesha from the heart.", mantra: "वक्रतुण्ड महाकाय सूर्यकोटि समप्रभ। निर्विघ्नं कुरु मे देव सर्वकार्येषु सर्वदा॥", mantraTranslation: "O Lord with curved trunk and great body, radiant as a million suns, remove all obstacles from my endeavors always", duration: 90, icon: "🙏" },
      { id: 12, title: "Visarjan (Conclusion)", titleHindi: "विसर्जन", description: "Seek forgiveness for any errors in the puja. Take prasad. Share blessings with family. Your puja is complete.", mantra: "ॐ गं गणपतये नमः। यद्दत्तं भक्तियुक्तेन, तत् गृहाण गणाधिप।", mantraTranslation: "Accept my offerings made with devotion, O Lord of all beings", duration: 60, icon: "✨" },
    ] as PujaStep[],
  },
  {
    id: "lakshmi",
    name: "Lakshmi Puja",
    nameHindi: "श्री लक्ष्मी पूजा",
    desc: "Seek blessings of Goddess Lakshmi for prosperity, wealth, and well-being",
    color: "from-yellow-500 to-pink-500",
    duration: "15-20 min",
    steps: [
      { id: 1, title: "Dhyana (Meditation)", titleHindi: "ध्यान", description: "Sit facing East or North. Light a lamp. Meditate on Goddess Lakshmi seated on a lotus, showering gold coins.", mantra: "ॐ श्रीं महालक्ष्म्यै नमः", mantraTranslation: "Om Shreem Mahalakshmyai Namaha", duration: 120, icon: "🧘" },
      { id: 2, title: "Kalash Sthapana", titleHindi: "कलश स्थापना", description: "Place a kalash (water vessel) with mango leaves and coconut. This represents Goddess Lakshmi's presence.", mantra: "ॐ श्रीं ह्रीं श्रीं कमले कमलालये प्रसीद", mantraTranslation: "O Goddess of the Lotus, be pleased with us", duration: 60, icon: "🏺" },
      { id: 3, title: "Snaan & Shringar", titleHindi: "स्नान व श्रृंगार", description: "Bathe the deity with water, milk, and rosewater. Adorn with red cloth, flowers, and jewelry.", mantra: "ॐ महालक्ष्म्यै नमः, स्नानं समर्पयामि", mantraTranslation: "I offer this sacred bath", duration: 90, icon: "💧" },
      { id: 4, title: "Pushpa & Kumkum", titleHindi: "पुष्प व कुमकुम", description: "Offer lotus flowers or red flowers. Apply kumkum and haldi on the deity. These are dear to Goddess Lakshmi.", mantra: "ॐ श्री लक्ष्म्यै नमः, पुष्पं समर्पयामि", mantraTranslation: "I offer these sacred flowers", duration: 60, icon: "🌺" },
      { id: 5, title: "Dhoop & Deep", titleHindi: "धूप व दीप", description: "Light incense sticks and ghee lamp. The aroma and light invite divine energy into your home.", mantra: "ॐ लक्ष्म्यै नमः, धूपदीपं समर्पयामि", mantraTranslation: "I offer this incense and lamp", duration: 60, icon: "🪔" },
      { id: 6, title: "Naivedya", titleHindi: "नैवेद्य", description: "Offer sweets, kheer, fruits, and paan. Sprinkle water around the offering plate clockwise.", mantra: "ॐ श्री लक्ष्म्यै नमः, नैवेद्यं समर्पयामि", mantraTranslation: "I offer this sacred food", duration: 60, icon: "🍚" },
      { id: 7, title: "Lakshmi Aarti", titleHindi: "लक्ष्मी आरती", description: "Perform aarti with ghee lamp. Circle clockwise — this is the most sacred part of the puja.", mantra: "ॐ जय लक्ष्मी माता, मैया जय लक्ष्मी माता। तुमको निशदिन सेवत, हरि विष्णु विधाता", mantraTranslation: "Victory to Mother Lakshmi, served day and night by Hari Vishnu", duration: 120, icon: "🪔" },
      { id: 8, title: "Prarthana & Visarjan", titleHindi: "प्रार्थना व विसर्जन", description: "Offer personal prayers for prosperity and well-being. Distribute prasad. Your Lakshmi Puja is complete.", mantra: "सर्वमंगल मांगल्ये शिवे सर्वार्थ साधिके। शरण्ये त्र्यंबके गौरी नारायणि नमोस्तुते॥", mantraTranslation: "O auspicious one, fulfiller of all wishes, I bow to you", duration: 90, icon: "🙏" },
    ] as PujaStep[],
  },
  {
    id: "shiva",
    name: "Shiva Puja",
    nameHindi: "श्री शिव पूजा",
    desc: "Worship Lord Shiva for inner peace, strength, and destruction of negativity",
    color: "from-blue-500 to-indigo-600",
    duration: "15-20 min",
    steps: [
      { id: 1, title: "Dhyana", titleHindi: "ध्यान", description: "Sit quietly facing North. Visualize Lord Shiva in meditation on Mount Kailash. Feel his serene presence.", mantra: "ॐ नमः शिवाय", mantraTranslation: "Om Namah Shivaya — I bow to Lord Shiva", duration: 120, icon: "🧘" },
      { id: 2, title: "Jal Abhishek", titleHindi: "जल अभिषेक", description: "Pour water or milk gently over the Shivling while chanting. Each drop purifies karma and negativity.", mantra: "ॐ नमः शिवाय, अभिषेकं समर्पयामि", mantraTranslation: "I offer this sacred abhishek to Lord Shiva", duration: 120, icon: "💧" },
      { id: 3, title: "Bel Patra", titleHindi: "बेल पत्र", description: "Offer Bilva (Bel) leaves — 3-leaf clusters are ideal. Each leaf represents Brahma, Vishnu, Mahesh.", mantra: "ॐ नमः शिवाय, बिल्वपत्रं समर्पयामि", mantraTranslation: "I offer these sacred Bilva leaves", duration: 60, icon: "🍃" },
      { id: 4, title: "Dhatura & Flowers", titleHindi: "धतूरा व पुष्प", description: "Offer white flowers, dhatura, and akand flowers. These are uniquely dear to Lord Shiva.", mantra: "ॐ शिवाय नमः, पुष्पं समर्पयामि", mantraTranslation: "I offer these flowers to Lord Shiva", duration: 45, icon: "🌸" },
      { id: 5, title: "Dhoop & Deep", titleHindi: "धूप व दीप", description: "Light incense and a ghee lamp. The smoke carries prayers to the divine realm.", mantra: "ॐ नमः शिवाय, धूपं दीपं समर्पयामि", mantraTranslation: "I offer this incense and lamp", duration: 60, icon: "🪔" },
      { id: 6, title: "Naivedya", titleHindi: "नैवेद्य", description: "Offer fruits, bhang (if available), milk sweets, and water. Lord Shiva is pleased with simple offerings.", mantra: "ॐ नमः शिवाय, नैवेद्यं समर्पयामि", mantraTranslation: "I offer this food to Lord Shiva", duration: 60, icon: "🥛" },
      { id: 7, title: "Shiva Aarti", titleHindi: "शिव आरती", description: "Perform aarti with devotion. Ring the bell. Circle the lamp before the deity.", mantra: "ॐ जय शिव ओंकारा, स्वामी जय शिव ओंकारा। ब्रह्मा विष्णु सदाशिव, अर्धांगी धारा", mantraTranslation: "Victory to Lord Shiva, the supreme being", duration: 120, icon: "🪔" },
      { id: 8, title: "Maha Mrityunjaya Mantra", titleHindi: "महामृत्युंजय मंत्र", description: "Chant the powerful healing mantra 3, 11, or 108 times for protection and wellness.", mantra: "ॐ त्र्यंबकं यजामहे सुगंधिं पुष्टिवर्धनम्। उर्वारुकमिव बंधनान् मृत्योर्मुक्षीय मामृतात्॥", mantraTranslation: "We worship the three-eyed one who nourishes all. May He liberate us from death, like a fruit from its bondage", duration: 180, icon: "📿" },
      { id: 9, title: "Prarthana", titleHindi: "प्रार्थना", description: "Fold hands. Offer personal prayers. Ask for strength, peace, and wisdom. Distribute prasad.", mantra: "कर्पूरगौरं करुणावतारं संसारसारं भुजगेंद्रहारम्। सदा वसंतं हृदयारविंदे भवं भवानी सहितं नमामि॥", mantraTranslation: "I bow to Lord Shiva, white as camphor, the embodiment of compassion", duration: 90, icon: "🙏" },
    ] as PujaStep[],
  },
];

export default function VirtualPuja() {
  const { toast } = useToast();
  const [selectedPuja, setSelectedPuja] = useState<typeof PUJA_TYPES[0] | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [pujaComplete, setPujaComplete] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);


  useEffect(() => {
    if (isPlaying && timeLeft > 0) {
      timerRef.current = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    } else if (isPlaying && timeLeft === 0 && selectedPuja) {
      setIsPlaying(false);
      if (!completedSteps.includes(currentStep)) {
        setCompletedSteps(prev => [...prev, currentStep]);
      }
      if (currentStep < selectedPuja.steps.length - 1) {
        toast({ title: "Step Complete!", description: `${selectedPuja.steps[currentStep].title} completed. Move to next step.` });
      } else {
        setPujaComplete(true);
        toast({ title: "Puja Complete!", description: "Your virtual puja has been completed. May blessings be upon you." });
      }
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [isPlaying, timeLeft]);

  const startStep = () => {
    if (selectedPuja) {
      setTimeLeft(selectedPuja.steps[currentStep].duration);
      setIsPlaying(true);
    }
  };

  const nextStep = () => {
    if (selectedPuja && currentStep < selectedPuja.steps.length - 1) {
      if (!completedSteps.includes(currentStep)) {
        setCompletedSteps(prev => [...prev, currentStep]);
      }
      setCurrentStep(prev => prev + 1);
      setIsPlaying(false);
      setTimeLeft(0);
    }
  };

  const resetPuja = () => {
    setCurrentStep(0);
    setCompletedSteps([]);
    setIsPlaying(false);
    setTimeLeft(0);
    setPujaComplete(false);
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
  const progress = selectedPuja ? ((completedSteps.length / selectedPuja.steps.length) * 100) : 0;

  if (!selectedPuja) {
    return (
      <div className="min-h-screen bg-white">
        <PageSeo
          title="Virtual Puja Online — Guided Ganesh, Lakshmi & Shiva Puja | Vedic Tatva"
          description="Perform sacred Hindu pujas online from home with step-by-step guided rituals, authentic Sanskrit mantras, real-time progress timer, and traditional Vedic vidhi for Ganesh, Lakshmi, and Shiva puja."
          canonical="/virtual-puja"
          schemas={[
            softwareApplication({
              name: "Vedic Tatva Virtual Puja",
              description: "Free guided online puja experience with mantras, timers, and authentic Vedic rituals.",
              url: "/virtual-puja",
              applicationCategory: "LifestyleApplication",
            }),
            breadcrumbList([
              { name: "Vedic Tatva", url: "/" },
              { name: "Virtual Puja", url: "/virtual-puja" },
            ]),
          ]}
        />
        <div className="bg-[#6D2B35] text-white border-b border-[#D4AF37]/30">
          <div className="container mx-auto px-4 py-10 sm:py-14">
            <Link href="/" className="inline-flex items-center gap-1.5 text-[#D4AF37] hover:text-white text-[11px] uppercase tracking-[0.2em] mb-5 transition-colors" data-testid="link-back-home">
              <ArrowLeft className="h-3.5 w-3.5" /> Home
            </Link>
            <div className="flex items-center gap-2 mb-3">
              <div className="h-px w-8 bg-[#D4AF37]/60" />
              <Flame className="h-3.5 w-3.5 text-[#D4AF37]" />
              <span className="text-[#D4AF37] text-[11px] uppercase tracking-[0.25em] font-medium">Guided Ritual Experience</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold mb-2" data-testid="text-virtual-puja-title">Virtual Puja Experience</h1>
            <p className="text-white/70 max-w-lg text-sm">Perform sacred pujas from the comfort of your home with step-by-step guided rituals, authentic mantras, and real-time progress tracking.</p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-10">
          <div className="flex items-center gap-3 mb-6 max-w-4xl mx-auto">
            <div className="h-px flex-1 bg-[#D4AF37]/25" />
            <span className="text-[#D4AF37] text-[10px] uppercase tracking-[0.25em] font-medium">Choose Your Puja</span>
            <div className="h-px flex-1 bg-[#D4AF37]/25" />
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {PUJA_TYPES.map(puja => (
              <button
                key={puja.id}
                onClick={() => { setSelectedPuja(puja); setTimeLeft(puja.steps[0].duration); }}
                className="bg-white rounded-md overflow-hidden border border-[#D4AF37]/25 hover-elevate text-left"
                data-testid={`select-puja-${puja.id}`}
              >
                <div className={`h-28 bg-gradient-to-br ${puja.color} border-b border-[#D4AF37]/25 flex items-center justify-center`}>
                  <div className="font-serif text-3xl text-white drop-shadow-sm">{puja.nameHindi}</div>
                </div>
                <div className="p-5">
                  <h3 className="font-serif text-lg font-bold text-[#6D2B35]">{puja.name}</h3>
                  <p className="text-xs text-[#D4AF37] font-medium mb-2">{puja.nameHindi}</p>
                  <p className="text-sm text-[#5a4a3a]/70 mb-3">{puja.desc}</p>
                  <div className="flex items-center justify-between text-[11px] text-[#5a4a3a]/60">
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {puja.duration}</span>
                    <span>{puja.steps.length} steps</span>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="mt-10 bg-white rounded-md p-6 max-w-2xl mx-auto border border-[#D4AF37]/25">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-px w-6 bg-[#D4AF37]/60" />
              <span className="text-[#D4AF37] text-[10px] uppercase tracking-[0.25em] font-medium">How It Works</span>
            </div>
            <div className="grid sm:grid-cols-3 gap-px bg-[#D4AF37]/25 rounded-md overflow-hidden border border-[#D4AF37]/25">
              {[
                { step: "1", title: "Select a Puja", desc: "Choose from Ganesh, Lakshmi, or Shiva puja" },
                { step: "2", title: "Follow Steps", desc: "Guided rituals with mantras and timers" },
                { step: "3", title: "Complete & Share", desc: "Finish all steps and receive blessings" },
              ].map(s => (
                <div key={s.step} className="bg-white p-4 text-center">
                  <div className="w-9 h-9 rounded-md bg-[#FBF7EE] border border-[#D4AF37]/25 flex items-center justify-center mx-auto mb-2 text-[#6D2B35] font-serif font-bold text-sm">{s.step}</div>
                  <p className="text-sm font-semibold text-[#6D2B35]">{s.title}</p>
                  <p className="text-xs text-[#5a4a3a]/60 mt-1">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const step = selectedPuja.steps[currentStep];

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-[#6D2B35] text-white border-b border-[#D4AF37]/30">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-3">
            <button onClick={() => { setSelectedPuja(null); resetPuja(); }} className="flex items-center gap-1.5 text-[#D4AF37] hover:text-white text-[11px] uppercase tracking-[0.2em] transition-colors" data-testid="btn-back-selection">
              <ArrowLeft className="h-3.5 w-3.5" /> Back
            </button>
            <button onClick={resetPuja} className="flex items-center gap-1.5 text-[#D4AF37] hover:text-white text-[11px] uppercase tracking-[0.2em] transition-colors" data-testid="btn-restart-puja">
              <RotateCcw className="h-3.5 w-3.5" /> Restart
            </button>
          </div>
          <div className="flex items-center gap-2 mb-1">
            <div className="h-px w-6 bg-[#D4AF37]/60" />
            <Flame className="h-3.5 w-3.5 text-[#D4AF37]" />
            <span className="text-[#D4AF37] text-[10px] uppercase tracking-[0.25em] font-medium">Active Puja</span>
          </div>
          <h1 className="font-serif text-2xl font-bold" data-testid="text-puja-name">{selectedPuja.name}</h1>
          <p className="text-[#D4AF37] text-sm">{selectedPuja.nameHindi}</p>

          <div className="mt-4">
            <div className="flex items-center justify-between text-[11px] text-white/60 mb-1.5 uppercase tracking-wider">
              <span>Progress</span>
              <span>{completedSteps.length}/{selectedPuja.steps.length} steps</span>
            </div>
            <div className="w-full h-1.5 bg-white/10 rounded-md overflow-hidden">
              <div className="h-full bg-[#D4AF37] transition-all duration-500" style={{ width: `${progress}%` }} data-testid="progress-bar" />
            </div>
          </div>
        </div>
      </div>

      {pujaComplete ? (
        <div className="container mx-auto px-4 py-12 text-center">
          <div className="max-w-md mx-auto bg-white border border-[#D4AF37]/25 rounded-md p-8">
            <div className="w-16 h-16 rounded-md bg-[#FBF7EE] border border-[#D4AF37]/25 flex items-center justify-center mx-auto mb-5">
              <Sparkles className="h-7 w-7 text-[#D4AF37]" />
            </div>
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="h-px w-6 bg-[#D4AF37]/60" />
              <span className="text-[#D4AF37] text-[10px] uppercase tracking-[0.25em] font-medium">Puja Complete</span>
              <div className="h-px w-6 bg-[#D4AF37]/60" />
            </div>
            <h2 className="font-serif text-2xl font-bold text-[#6D2B35] mb-3">{selectedPuja.name} Complete</h2>
            <p className="text-[#5a4a3a]/70 mb-6 text-sm">May the divine blessings of {selectedPuja.name === "Ganesh Puja" ? "Lord Ganesha" : selectedPuja.name === "Lakshmi Puja" ? "Goddess Lakshmi" : "Lord Shiva"} be upon you and your family. Share this sacred experience with loved ones.</p>
            <div className="flex gap-3 justify-center flex-wrap">
              <button onClick={resetPuja} className="bg-[#6D2B35] text-[#D4AF37] hover:bg-[#5a1f29] rounded-md h-10 px-5 text-[13px] font-semibold transition-colors" data-testid="btn-do-again">Do Again</button>
              <button onClick={() => { setSelectedPuja(null); resetPuja(); }} className="bg-[#FBF7EE] text-[#6D2B35] border border-[#D4AF37]/25 hover:bg-[#f4eedd] rounded-md h-10 px-5 text-[13px] font-semibold transition-colors" data-testid="btn-choose-another">Choose Another Puja</button>
            </div>
          </div>
        </div>
      ) : (
        <div className="container mx-auto px-4 py-6">
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <div className="bg-white rounded-md p-4 border border-[#D4AF37]/25 sticky top-24">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-px w-5 bg-[#D4AF37]/60" />
                  <span className="text-[#D4AF37] text-[10px] uppercase tracking-[0.25em] font-medium">Steps</span>
                </div>
                <div className="space-y-1">
                  {selectedPuja.steps.map((s, i) => (
                    <button
                      key={s.id}
                      onClick={() => { setCurrentStep(i); setIsPlaying(false); setTimeLeft(s.duration); }}
                      className={`w-full flex items-center gap-2 px-3 h-9 rounded-md text-left text-sm transition-all ${
                        i === currentStep ? "bg-[#6D2B35] text-[#D4AF37]" : completedSteps.includes(i) ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "text-[#5a4a3a]/80 hover-elevate border border-transparent"
                      }`}
                      data-testid={`step-nav-${i}`}
                    >
                      {completedSteps.includes(i) ? <Check className="h-3.5 w-3.5 flex-shrink-0" /> : <span className="text-xs w-4 text-center flex-shrink-0">{i + 1}</span>}
                      <span className="truncate">{s.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="bg-white rounded-md overflow-hidden border border-[#D4AF37]/25">
                <div className="bg-[#FBF7EE] border-b border-[#D4AF37]/25 p-6 text-center">
                  <div className="mx-auto mb-3 h-14 w-14 rounded-full bg-[#6D2B35] text-[#D4AF37] flex items-center justify-center text-xl font-serif font-bold border border-[#D4AF37]/40">{currentStep + 1}</div>
                  <div className="text-3xl font-bold text-[#6D2B35] font-serif tabular-nums" data-testid="text-timer">{formatTime(timeLeft > 0 ? timeLeft : step.duration)}</div>
                  <div className="flex items-center justify-center gap-3 mt-4">
                    {!isPlaying ? (
                      <button onClick={startStep} className="w-11 h-11 rounded-md bg-[#6D2B35] text-[#D4AF37] flex items-center justify-center hover:bg-[#5a1f29] transition-colors border border-[#D4AF37]/25" data-testid="btn-play">
                        <Play className="h-5 w-5 ml-0.5" />
                      </button>
                    ) : (
                      <button onClick={() => setIsPlaying(false)} className="w-11 h-11 rounded-md bg-[#D4AF37] text-[#3a1a20] flex items-center justify-center hover:bg-[#c4a030] transition-colors" data-testid="btn-pause">
                        <Pause className="h-5 w-5" />
                      </button>
                    )}
                    {currentStep < selectedPuja.steps.length - 1 && (
                      <button onClick={nextStep} className="w-11 h-11 rounded-md bg-white text-[#6D2B35] border border-[#D4AF37]/25 flex items-center justify-center hover-elevate transition-colors" data-testid="btn-next-step">
                        <SkipForward className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] text-[#5a4a3a]/50 uppercase tracking-[0.25em] font-medium">Step {currentStep + 1} of {selectedPuja.steps.length}</span>
                    {completedSteps.includes(currentStep) && (
                      <span className="text-[10px] uppercase tracking-wider font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <Check className="h-3 w-3" /> Done
                      </span>
                    )}
                  </div>
                  <h2 className="font-serif text-xl font-bold text-[#6D2B35] mb-1" data-testid="text-step-title">{step.title}</h2>
                  <p className="text-sm text-[#D4AF37] mb-3">{step.titleHindi}</p>
                  <p className="text-sm text-[#5a4a3a]/80 leading-relaxed mb-5" data-testid="text-step-desc">{step.description}</p>

                  <div className="bg-[#FBF7EE] border border-[#D4AF37]/25 rounded-md p-4 mb-4">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="h-px w-5 bg-[#D4AF37]/60" />
                      <span className="text-[10px] text-[#D4AF37] uppercase tracking-[0.25em] font-medium">Mantra</span>
                    </div>
                    <p className="font-serif text-lg text-[#6D2B35] font-semibold leading-relaxed" data-testid="text-mantra">{step.mantra}</p>
                    <p className="text-xs text-[#5a4a3a]/60 mt-2 italic">{step.mantraTranslation}</p>
                  </div>

                  {currentStep < selectedPuja.steps.length - 1 && (
                    <button onClick={nextStep} className="w-full h-10 bg-[#6D2B35] text-[#D4AF37] hover:bg-[#5a1f29] rounded-md text-[13px] font-semibold transition-colors flex items-center justify-center gap-2" data-testid="btn-next-full">
                      Next Step <ChevronRight className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <PageAPlusContent
        eyebrow="Why Choose Virtual Puja"
        title="Virtual Puja — Sacred Rituals at India's Holiest Temples, From Anywhere"
        intro="Whether you live in Bengaluru or Boston, Mumbai or Melbourne — Vedic Tatva's virtual puja brings India's most sacred temples to your screen. Our partner priests perform full Vedic rituals on your behalf at Kashi Vishwanath, Tirupati, Mahakaleshwar, Vaishno Devi and other sacred sites. Watch live, receive prasad and digital sankalp certificate."
        trustBadges={[
          { value: "100+", label: "Sacred Temples" },
          { value: "Live", label: "Video Stream" },
          { value: "Prasad", label: "Delivered Home" },
          { value: "12+", label: "Languages" },
        ]}
        benefits={[
          { icon: Globe, title: "Sacred Temples Worldwide", body: "Book puja at Kashi Vishwanath, Tirupati Balaji, Mahakaleshwar, Vaishno Devi, Somnath, Rameshwaram, Jagannath Puri, Kedarnath and 100+ other sacred sites." },
          { icon: Play, title: "Live Video Streaming", body: "Watch your puja live via private video link — see the sankalp taken in your name, the abhishek, archana and aarti, all in real time." },
          { icon: Heart, title: "Prasad Delivered Home", body: "Sacred prasad — laddu, tirth jal, tulsi, vibhuti, rakshashutra — packed at the temple and couriered to your home anywhere in India or abroad." },
          { icon: ShieldCheck, title: "Authentic Temple Pujaris", body: "All rituals performed by official temple pujaris with full vidhi, exact mantras and authentic samagri — never compromised, never staged." },
          { icon: BookOpen, title: "Digital Sankalp Certificate", body: "Receive a beautifully designed digital sankalp certificate with your name, gotra, puja details and temple priest's blessing — share with family." },
          { icon: Users, title: "For NRIs & Family Distance", body: "Perfect for NRIs, elderly parents abroad, or family members unable to travel. Maintain your traditions wherever you are." },
        ]}
        steps={[
          { title: "Choose Temple & Puja", body: "Browse partnered sacred temples and select your preferred puja — Abhishek, Archana, Sahasranama, Maha Aarti or special tithi puja." },
          { title: "Provide Sankalp Details", body: "Enter your name, gotra, family members and your specific intention (sankalp) — the priest takes the sankalp on your behalf." },
          { title: "Watch Live or Recorded", body: "Receive a private video link — watch the puja live at the scheduled time, or watch the recording later if timezone differs." },
          { title: "Receive Prasad", body: "Sacred prasad is packed at the temple and delivered to your home. Digital sankalp certificate emailed within 24 hours." },
        ]}
        faqs={[
          { q: "Is virtual puja a real puja with real spiritual benefit?", a: "Yes — the puja is performed by official temple pujaris with full Vedic vidhi, your sankalp, your gotra and your name. Scripturally, the punya (spiritual merit) of the puja accrues to the person whose sankalp is taken — you don't need to be physically present. This is the same principle as ancient pind daan and shradh ceremonies." },
          { q: "Which temples can I book virtual puja at?", a: "Kashi Vishwanath (Varanasi), Tirupati Balaji, Mahakaleshwar (Ujjain), Vaishno Devi, Somnath, Rameshwaram, Jagannath Puri, Kedarnath, Badrinath, Mata Vaishno Devi, Shirdi Sai Baba, and 100+ other sacred sites across India." },
          { q: "Will I receive prasad from the actual temple?", a: "Yes — prasad is collected immediately after your puja at the temple and dispatched within 48 hours. Items vary by temple — Tirupati laddu, Vaishno Devi prasad, Kashi Ganga jal, Mahakaleshwar bhasma, Jagannath dry prasad. International delivery available for most countries." },
          { q: "Can I watch the puja live?", a: "Yes — you'll receive a private video link 30 minutes before your scheduled puja. Watch the entire ceremony live, including your sankalp being taken. If your timezone makes live viewing difficult, the full recording is shared within 24 hours." },
          { q: "Can I sponsor virtual puja for family in India?", a: "Yes — many NRIs sponsor virtual puja in their parents' or family's name. Just enter their gotra and details during sankalp. The priest takes their name. Prasad and certificate can be sent to either address." },
          { q: "What is the difference between virtual puja and home puja?", a: "Virtual puja is performed by temple priests at the sacred temple itself — best for special tithis, deity-specific worship and major sankalps. Home puja brings a pandit to your residence — best for family ceremonies (Griha Pravesh, Satyanarayan, Wedding). Both are equally authentic — they serve different purposes." },
          { q: "Is the payment secure for international devotees?", a: "Yes — we accept payments in INR, USD, GBP, EUR, AUD, CAD and SGD via Razorpay/Stripe. All payments are bank-grade encrypted. NRIs can pay via international cards or NRO/NRE accounts." },
          { q: "Can I book virtual puja for special occasions?", a: "Yes — birthdays, anniversaries, exam success, new business, marriage anniversary, parents' health, child blessing, removing dosha (Kaal Sarp, Mangal, Pitra) — all life events can be honoured with virtual puja at the appropriate temple/deity." },
        ]}
        keywordsBlurb="Online virtual puja at India's sacred temples — Kashi Vishwanath, Tirupati Balaji, Mahakaleshwar, Vaishno Devi, Somnath, Rameshwaram, Jagannath Puri, Kedarnath, Badrinath, Shirdi Sai Baba. Book Rudra Abhishek, Lakshmi Archana, Vishnu Sahasranama, Mahamrityunjaya Jaap, Navagraha Shanti, Kaal Sarp Dosh Nivaran online. Live video streaming, prasad delivered home worldwide, digital sankalp certificate. Perfect for NRIs in USA, UK, Canada, Australia, Singapore, UAE — keep your Sanatan traditions alive from anywhere."
      />

      <div className="container mx-auto px-4">
        <RelatedServicesSection context="virtual-puja" currentPath="/virtual-puja" />
      </div>
    </div>
  );
}
