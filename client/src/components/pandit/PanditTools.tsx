import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Search, Copy, BookOpen, ListChecks, Sparkles, ChevronRight, Wrench,
  ScrollText, Calculator, Flame, Play, Pause, RotateCcw, Check, IndianRupee,
} from "lucide-react";
import { PanditSectionHeader } from "@/components/pandit/PanditSection";

type Mantra = {
  id: string; title: string; deity: string; tradition: string;
  sanskrit: string; transliteration: string; meaning: string; usage: string;
};

type SamagriTemplate = {
  id: string; name: string; occasion: string; items: string[]; notes?: string;
};

const MANTRAS: Mantra[] = [
  {
    id: "ganesh-1", title: "Ganesh Vandana", deity: "Ganesha", tradition: "Universal",
    sanskrit: "वक्रतुण्ड महाकाय सूर्यकोटि समप्रभ। निर्विघ्नं कुरु मे देव सर्वकार्येषु सर्वदा॥",
    transliteration: "Vakratunda mahakaya suryakoti samaprabha. Nirvighnam kuru me deva sarvakaryeshu sarvada.",
    meaning: "O Lord with the curved trunk and mighty body, with the brilliance of a million suns, please make all my undertakings free of obstacles, always.",
    usage: "Recited at the start of every puja, project, or auspicious work.",
  },
  {
    id: "gayatri", title: "Gayatri Mantra", deity: "Savitr (Sun)", tradition: "Vedic",
    sanskrit: "ॐ भूर्भुवः स्वः। तत्सवितुर्वरेण्यं भर्गो देवस्य धीमहि। धियो यो नः प्रचोदयात्॥",
    transliteration: "Om bhur bhuvah svah. Tat savitur varenyam bhargo devasya dhimahi. Dhiyo yo nah prachodayat.",
    meaning: "We meditate on the divine light of the Sun. May it illuminate our intellect.",
    usage: "Sandhya vandana — sunrise, noon, sunset.",
  },
  {
    id: "mahamrityunjaya", title: "Mahamrityunjaya Mantra", deity: "Shiva", tradition: "Yajurveda",
    sanskrit: "ॐ त्र्यम्बकं यजामहे सुगन्धिं पुष्टिवर्धनम्। उर्वारुकमिव बन्धनान् मृत्योर्मुक्षीय मामृतात्॥",
    transliteration: "Om tryambakam yajamahe sugandhim pushtivardhanam. Urvarukamiva bandhanan mrityor mukshiya mamritat.",
    meaning: "We worship the three-eyed Lord, fragrant and nourishing. Like a ripe cucumber from its vine, free us from the bondage of death, not from immortality.",
    usage: "Healing, longevity, removing fear of death.",
  },
  {
    id: "shanti", title: "Shanti Mantra", deity: "Universal", tradition: "Upanishadic",
    sanskrit: "ॐ सर्वे भवन्तु सुखिनः। सर्वे सन्तु निरामयाः। सर्वे भद्राणि पश्यन्तु। मा कश्चिद्दुःखभाग्भवेत्॥",
    transliteration: "Om sarve bhavantu sukhinah. Sarve santu niramayah. Sarve bhadrani pashyantu. Ma kashchid duhkha bhagbhavet.",
    meaning: "May all be happy. May all be free from illness. May all see auspiciousness. May no one suffer.",
    usage: "Closing prayer for any puja or gathering.",
  },
  {
    id: "lakshmi", title: "Lakshmi Beej Mantra", deity: "Lakshmi", tradition: "Tantric",
    sanskrit: "ॐ श्रीं ह्रीं श्रीं कमले कमलालये प्रसीद प्रसीद श्रीं ह्रीं श्रीं ॐ महालक्ष्म्यै नमः॥",
    transliteration: "Om shrim hrim shrim kamale kamalalaye prasida prasida shrim hrim shrim om mahalakshmyai namah.",
    meaning: "Salutations to Mahalakshmi, who dwells in the lotus. Please grace us with prosperity.",
    usage: "Lakshmi puja, Diwali, Friday worship.",
  },
  {
    id: "saraswati", title: "Saraswati Vandana", deity: "Saraswati", tradition: "Universal",
    sanskrit: "या कुन्देन्दु तुषार हार धवला या शुभ्र वस्त्रावृता। या वीणा वर दण्ड मण्डित कर या श्वेत पद्मासना॥",
    transliteration: "Ya kundendu tushara hara dhavala ya shubhra vastravrita. Ya vina vara danda mandita kara ya shveta padmasana.",
    meaning: "She who is white as jasmine, moon and snow; clad in pure white; adorned with the veena; seated on a white lotus.",
    usage: "Vasant Panchami, exam blessings, study spaces.",
  },
  {
    id: "navagraha", title: "Navagraha Stotra opening", deity: "Nine planets", tradition: "Vedic",
    sanskrit: "जपाकुसुम संकाशं काश्यपेयं महाद्युतिम्। तमोऽरिं सर्वपापघ्नं प्रणतोऽस्मि दिवाकरम्॥",
    transliteration: "Japakusuma sankasham kashyapeyam mahadyutim. Tamorim sarva papaghnam pranatosmi divakaram.",
    meaning: "I bow to the Sun, red as a hibiscus flower, of the lineage of Kashyapa, dispeller of darkness and destroyer of all sins.",
    usage: "Navagraha shanti, planetary remedies.",
  },
  {
    id: "hanuman", title: "Hanuman Chalisa opening", deity: "Hanuman", tradition: "Tulsidas",
    sanskrit: "श्रीगुरु चरन सरोज रज, निज मन मुकुर सुधारि। बरनऊँ रघुवर बिमल जसु, जो दायक फल चारि॥",
    transliteration: "Shri guru charan saroj raj, nij man mukuru sudhari. Baranau Raghuvara bimala jasu, jo dayaka phala chari.",
    meaning: "Cleansing the mirror of my mind with the dust of my Guru's lotus feet, I describe the pure glory of Lord Rama, giver of the four fruits of life.",
    usage: "Tuesdays, Saturdays, Hanuman Jayanti.",
  },
];

const SAMAGRI: SamagriTemplate[] = [
  {
    id: "ganesh-puja", name: "Ganesh Puja (basic)", occasion: "All auspicious starts",
    items: [
      "Ganesha murti or photo",
      "Red cloth (1 meter)",
      "Modak (21 pieces, fresh or laddoo)",
      "Durva grass (21 sprigs)",
      "Red flowers (hibiscus)",
      "Sindoor (red vermilion)",
      "Akshat (unbroken rice with turmeric)",
      "Camphor + diya + ghee + cotton wicks",
      "Agarbatti (5 sticks)",
      "Coconut, betel leaves (5), betel nuts (2)",
      "Panchamrit (milk, curd, ghee, honey, sugar)",
      "Kalash with water + mango leaves",
    ],
    notes: "Always begin Ganesh puja before any major puja.",
  },
  {
    id: "satyanarayan", name: "Satyanarayan Vrat Katha", occasion: "Purnima or Sankashti",
    items: [
      "Satyanarayan photo or yantra",
      "Yellow cloth + chowki",
      "Banana leaves (4) for the four corners",
      "Sugarcane sticks (4)",
      "Wheat flour, sugar, ghee, banana, milk for sheera prasad",
      "Tulsi leaves (11)",
      "Yellow flowers (marigold)",
      "Roli, akshat, kumkum, haldi",
      "Panchamrit + fruits (5 varieties)",
      "Coconut, betel leaves, betel nuts, supari",
      "Diya, agarbatti, dhoop, camphor",
      "Kalash + Ganesh murti (for prarambh puja)",
    ],
    notes: "Sheera (sooji halwa) prasad is mandatory — 1.25 times sugar to sooji.",
  },
  {
    id: "griha-pravesh", name: "Griha Pravesh", occasion: "Moving into a new home",
    items: [
      "Kalash with water + mango leaves + coconut on top (pournami theme)",
      "Cow milk (1 liter)",
      "Cow ghee + 9 wicks for navagraha diya",
      "Saffron + sandal paste",
      "9 grains (navadhanya) — small bowls",
      "Hessian/jute thread (mauli) for kalash",
      "New clothing for kalash murti",
      "Yantra or photo of Vastu Purusha",
      "Brass or copper plates (5)",
      "Camphor, sambrani, agarbatti, dhoop",
      "Coconuts (5), betel leaves (21), betel nuts (5)",
      "Sweet preparations (chappan bhog optional)",
      "Salt + turmeric for boundary purification",
    ],
    notes: "Boil milk till it overflows on the new stove — symbol of abundance.",
  },
  {
    id: "lakshmi-puja", name: "Lakshmi Puja (Diwali)", occasion: "Diwali Amavasya night",
    items: [
      "Lakshmi + Ganesh + Saraswati murti or photo",
      "Red or pink cloth",
      "Kuber yantra (optional)",
      "Cowrie shells (5)",
      "Silver or gold coin",
      "Lotus flowers + red flowers",
      "Rice + haldi + kumkum + sindoor",
      "Sweets (kheer, ladoo, kheel batashe)",
      "21 diyas + ghee + cotton wicks",
      "Fresh fruits (5 varieties including pomegranate)",
      "Panchamrit",
      "Account books or laptop (for businesspersons)",
    ],
    notes: "Light diyas in odd numbers — 5, 11, 21, 51, 108.",
  },
  {
    id: "navagraha-shanti", name: "Navagraha Shanti", occasion: "Planetary remedy",
    items: [
      "Navagraha yantra or 9 small murtis",
      "9 grains (navadhanya): wheat, rice, tur dal, moong, chana, white til, urad, masoor, kala til",
      "9 colored cloths (red, white, red, green, yellow, white, blue, black, multi)",
      "9 colored flowers (one per graha)",
      "9 dhoop varieties",
      "Til oil for Shani diya",
      "Ghee + cotton wicks (108)",
      "Samidha (havan wood) + samagri for homa",
      "Navgraha samidha bundle (special)",
      "Kalash + coconut + mango leaves",
      "108 leaves of Bilva, Tulsi, Durva (per planet)",
    ],
    notes: "Best performed on the day ruled by the afflicted planet, at sunrise.",
  },
];

export default function PanditTools() {
  return (
    <div className="space-y-5" data-testid="pandit-tools">
      <PanditSectionHeader title="Tools" description="Quick-reference mantras, puja stages, quotes, and samagri checklists for your daily practice." />

      <Tabs defaultValue="sankalpa">
        <TabsList className="flex h-auto w-full max-w-full flex-wrap justify-start gap-1">
          <TabsTrigger value="sankalpa" data-testid="tab-tools-sankalpa"><ScrollText className="h-3.5 w-3.5 mr-1.5" />Sankalpa</TabsTrigger>
          <TabsTrigger value="quote" data-testid="tab-tools-quote"><Calculator className="h-3.5 w-3.5 mr-1.5" />Quote</TabsTrigger>
          <TabsTrigger value="stages" data-testid="tab-tools-stages"><Flame className="h-3.5 w-3.5 mr-1.5" />Puja stages</TabsTrigger>
          <TabsTrigger value="mantras" data-testid="tab-tools-mantras"><BookOpen className="h-3.5 w-3.5 mr-1.5" />Mantras</TabsTrigger>
          <TabsTrigger value="samagri" data-testid="tab-tools-samagri"><ListChecks className="h-3.5 w-3.5 mr-1.5" />Samagri</TabsTrigger>
        </TabsList>

        <TabsContent value="sankalpa" className="mt-4">
          <SankalpaBuilder />
        </TabsContent>
        <TabsContent value="quote" className="mt-4">
          <QuoteEstimator />
        </TabsContent>
        <TabsContent value="stages" className="mt-4">
          <PujaStages />
        </TabsContent>
        <TabsContent value="mantras" className="mt-4">
          <MantraLibrary />
        </TabsContent>
        <TabsContent value="samagri" className="mt-4">
          <SamagriLibrary />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function MantraLibrary() {
  const { toast } = useToast();
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return MANTRAS;
    return MANTRAS.filter((m) => m.title.toLowerCase().includes(t) || m.deity.toLowerCase().includes(t) || m.tradition.toLowerCase().includes(t));
  }, [q]);

  async function copy(m: Mantra) {
    const text = `${m.title}\n\n${m.sanskrit}\n\n${m.transliteration}\n\nMeaning: ${m.meaning}`;
    await safeCopy(text, () => toast({ title: "Mantra copied", description: m.title }), () => toast({ title: "Copy failed", description: "Long-press to select & copy manually.", variant: "destructive" }));
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#5a4a3a]/50" />
        <Input className="pl-9" placeholder="Search by deity, name, or tradition…" value={q} onChange={(e) => setQ(e.target.value)} data-testid="input-mantra-search" />
      </div>
      <div className="space-y-2">
        {filtered.map((m) => {
          const open = openId === m.id;
          return (
            <Card key={m.id} data-testid={`mantra-${m.id}`}>
              <CardContent className="p-0">
                <button onClick={() => setOpenId(open ? null : m.id)} className="w-full p-3 flex items-center justify-between gap-3 text-left hover-elevate" data-testid={`btn-mantra-toggle-${m.id}`}>
                  <div className="min-w-0">
                    <div className="font-bold text-[#4a1a22] text-sm flex items-center gap-2"><Sparkles className="h-3.5 w-3.5 text-[#D4AF37]" />{m.title}</div>
                    <div className="flex gap-1.5 mt-1">
                      <Badge variant="outline" className="text-[10px]">{m.deity}</Badge>
                      <Badge variant="outline" className="text-[10px]">{m.tradition}</Badge>
                    </div>
                  </div>
                  <ChevronRight className={`h-4 w-4 text-[#5a4a3a]/50 transition-transform ${open ? "rotate-90" : ""}`} />
                </button>
                {open && (
                  <div className="border-t border-[#D4AF37]/20 p-4 space-y-3 bg-[#FBF7EE]/40">
                    <div>
                      <div className="text-[10px] uppercase tracking-wide text-[#5a4a3a]/65 font-bold mb-1">Sanskrit</div>
                      <div className="font-serif text-base text-[#4a1a22] leading-relaxed">{m.sanskrit}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-wide text-[#5a4a3a]/65 font-bold mb-1">Transliteration</div>
                      <div className="text-sm italic text-[#4a1a22]/85">{m.transliteration}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-wide text-[#5a4a3a]/65 font-bold mb-1">Meaning</div>
                      <div className="text-sm text-[#4a1a22]/85">{m.meaning}</div>
                    </div>
                    <div className="text-[11px] text-[#5a4a3a]/70 italic">When: {m.usage}</div>
                    <Button size="sm" variant="outline" onClick={() => copy(m)} data-testid={`btn-mantra-copy-${m.id}`}><Copy className="h-3 w-3 mr-1.5" />Copy</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function SamagriLibrary() {
  const { toast } = useToast();
  async function copy(t: SamagriTemplate) {
    const text = `${t.name} — Samagri checklist\n${t.occasion}\n\n${t.items.map((i, ix) => `${ix + 1}. ${i}`).join("\n")}${t.notes ? `\n\nNote: ${t.notes}` : ""}`;
    await safeCopy(text, () => toast({ title: "Checklist copied", description: t.name }), () => toast({ title: "Copy failed", description: "Long-press to select & copy manually.", variant: "destructive" }));
  }
  return (
    <div className="grid md:grid-cols-2 gap-3">
      {SAMAGRI.map((t) => (
        <Card key={t.id} data-testid={`samagri-${t.id}`}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-bold text-[#4a1a22]">{t.name}</div>
                <div className="text-[11px] text-[#5a4a3a]/70 mt-0.5">{t.occasion}</div>
              </div>
              <Button size="sm" variant="outline" onClick={() => copy(t)} data-testid={`btn-samagri-copy-${t.id}`}><Copy className="h-3 w-3" /></Button>
            </div>
            <ul className="mt-3 space-y-1 text-xs text-[#4a1a22]/85 list-decimal list-inside">
              {t.items.map((i, ix) => <li key={ix}>{i}</li>)}
            </ul>
            {t.notes && <div className="mt-3 text-[11px] italic text-[#5a4a3a]/70 border-t border-[#D4AF37]/20 pt-2">{t.notes}</div>}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Best-effort clipboard copy with graceful fallback for non-secure
// contexts (e.g. http) and permission-denied environments.
async function safeCopy(text: string, onOk: () => void, onErr: () => void) {
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      onOk();
      return;
    }
    // legacy fallback
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    ok ? onOk() : onErr();
  } catch {
    onErr();
  }
}

// =====================================================================
// Sankalpa Builder — generates traditional sankalpa text in both
// Sanskrit/Devanagari and English from yajamana details.
// =====================================================================

const PUJA_PURPOSES = [
  { id: "satyanarayan",   sa: "श्रीसत्यनारायण व्रत कथा", en: "Satyanarayan Vrat Katha" },
  { id: "ganesh",         sa: "श्रीगणेश पूजन",          en: "Ganesh Puja" },
  { id: "lakshmi",        sa: "श्रीमहालक्ष्मी पूजन",      en: "Lakshmi Puja" },
  { id: "griha-pravesh",  sa: "गृह प्रवेश",              en: "Griha Pravesh" },
  { id: "vastu-shanti",   sa: "वास्तु शान्ति",            en: "Vastu Shanti" },
  { id: "navagraha",      sa: "नवग्रह शान्ति",           en: "Navagraha Shanti" },
  { id: "rudrabhishek",   sa: "रुद्राभिषेक",              en: "Rudrabhishek" },
  { id: "mahamrityunjaya",sa: "महामृत्युञ्जय जप",         en: "Mahamrityunjaya Jap" },
  { id: "naamkaran",      sa: "नामकरण संस्कार",          en: "Naamkaran Sanskar" },
  { id: "annaprashan",    sa: "अन्नप्राशन संस्कार",        en: "Annaprashan Sanskar" },
  { id: "mundan",         sa: "चूड़ाकरण (मुण्डन) संस्कार", en: "Mundan Sanskar" },
  { id: "vivah",          sa: "विवाह संस्कार",            en: "Vivah Sanskar" },
  { id: "antyeshti",      sa: "अन्त्येष्टि / श्राद्ध",      en: "Shraddha / Pind Daan" },
  { id: "custom",         sa: "—",                      en: "Custom" },
];

const TITHIS = ["प्रतिपदा","द्वितीया","तृतीया","चतुर्थी","पञ्चमी","षष्ठी","सप्तमी","अष्टमी","नवमी","दशमी","एकादशी","द्वादशी","त्रयोदशी","चतुर्दशी","पूर्णिमा/अमावस्या"];
const VARAS  = [
  { sa: "रविवासरे",  en: "Sunday" },
  { sa: "सोमवासरे",  en: "Monday" },
  { sa: "मङ्गलवासरे", en: "Tuesday" },
  { sa: "बुधवासरे",  en: "Wednesday" },
  { sa: "गुरुवासरे",  en: "Thursday" },
  { sa: "शुक्रवासरे",  en: "Friday" },
  { sa: "शनिवासरे",  en: "Saturday" },
];
const NAKSHATRAS = ["अश्विनी","भरणी","कृत्तिका","रोहिणी","मृगशिरा","आर्द्रा","पुनर्वसु","पुष्य","आश्लेषा","मघा","पूर्व फाल्गुनी","उत्तर फाल्गुनी","हस्त","चित्रा","स्वाती","विशाखा","अनुराधा","ज्येष्ठा","मूल","पूर्वाषाढ़ा","उत्तराषाढ़ा","श्रवण","धनिष्ठा","शतभिषा","पूर्व भाद्रपद","उत्तर भाद्रपद","रेवती"];
const PAKSHAS = [{ sa: "शुक्ल पक्षे", en: "Shukla Paksha" }, { sa: "कृष्ण पक्षे", en: "Krishna Paksha" }];

function SankalpaBuilder() {
  const { toast } = useToast();
  const today = new Date();
  const [yajamana, setYajamana] = useState("");
  const [gotra, setGotra]       = useState("कश्यप");
  const [city, setCity]         = useState("");
  const [date, setDate]         = useState(today.toISOString().slice(0, 10));
  const [purposeId, setPurposeId] = useState(PUJA_PURPOSES[0].id);
  const [customPurpose, setCustomPurpose] = useState("");
  const [tithi, setTithi]       = useState(TITHIS[0]);
  const [paksha, setPaksha]     = useState(0);
  const [nakshatra, setNakshatra] = useState(NAKSHATRAS[0]);
  const [intent, setIntent]     = useState("परिवारस्य कल्याण, आरोग्य, समृद्धि एवं सर्व-बाधा निवृत्ति");

  const purpose = PUJA_PURPOSES.find((p) => p.id === purposeId)!;
  const purposeSa = purpose.id === "custom" ? (customPurpose || "—") : purpose.sa;
  const purposeEn = purpose.id === "custom" ? (customPurpose || "—") : purpose.en;
  const dateObj = new Date(`${date}T06:00:00`);
  const vara = VARAS[dateObj.getDay()];
  const yearVS = dateObj.getFullYear() + 57; // approximate Vikram Samvat
  const dateEn = dateObj.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

  const sankalpaSa = `ॐ विष्णुर् विष्णुर् विष्णुः। श्रीमद्भगवतो महापुरुषस्य विष्णोराज्ञया प्रवर्तमानस्य अद्य ब्रह्मणो द्वितीये परार्धे श्रीश्वेतवाराहकल्पे वैवस्वतमन्वन्तरे अष्टाविंशतितमे कलियुगे कलि-प्रथम-चरणे जम्बूद्वीपे भारतवर्षे भरतखण्डे आर्यावर्तान्तर्गत-${city || "[नगर/ग्राम]"}-नगरे, विक्रम-संवत् ${yearVS}, ${PAKSHAS[paksha].sa}, ${tithi}-तिथौ, ${vara.sa}, ${nakshatra}-नक्षत्रे, ${gotra || "—"}-गोत्रोत्पन्नः ${yajamana || "[यजमान-नाम]"} अहं ${intent} काम्यार्थम् ${purposeSa} करिष्ये।`;

  const sankalpaEn = `Om Vishnu, Vishnu, Vishnu. By the will of the Supreme Lord Vishnu, on this day in Kali Yuga, on the land of Bharata, in the city of ${city || "[city]"}, in Vikram Samvat ${yearVS}, ${PAKSHAS[paksha].en}, ${tithi} tithi, on ${vara.en} (${dateEn}), under ${nakshatra} nakshatra, I, ${yajamana || "[yajamana name]"} of ${gotra || "—"} gotra, hereby resolve to perform the ${purposeEn} for the welfare, health and prosperity of my family, and the removal of all obstacles. Thus do I make this sankalpa.`;

  const copyAll = () => {
    void safeCopy(
      `${sankalpaSa}\n\n— English —\n${sankalpaEn}`,
      () => toast({ title: "Sankalpa copied", description: "Paste it into your notes or share with the yajamana." }),
      () => toast({ title: "Copy failed", description: "Long-press to select & copy manually.", variant: "destructive" }),
    );
  };

  return (
    <div className="space-y-3">
      <Card>
        <CardContent className="p-4 grid sm:grid-cols-2 gap-3">
          <Field label="Yajamana name"><Input value={yajamana} onChange={(e) => setYajamana(e.target.value)} placeholder="e.g. श्री राकेश शर्मा" data-testid="input-sankalpa-name" /></Field>
          <Field label="Gotra"><Input value={gotra} onChange={(e) => setGotra(e.target.value)} placeholder="e.g. कश्यप" data-testid="input-sankalpa-gotra" /></Field>
          <Field label="City / Sthala"><Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Varanasi" data-testid="input-sankalpa-city" /></Field>
          <Field label="Date">
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} data-testid="input-sankalpa-date" />
          </Field>
          <Field label="Purpose">
            <select value={purposeId} onChange={(e) => setPurposeId(e.target.value)} className="h-9 rounded-md border border-input bg-background px-2 text-sm w-full" data-testid="select-sankalpa-purpose">
              {PUJA_PURPOSES.map((p) => <option key={p.id} value={p.id}>{p.en}</option>)}
            </select>
          </Field>
          {purpose.id === "custom" && (
            <Field label="Custom purpose"><Input value={customPurpose} onChange={(e) => setCustomPurpose(e.target.value)} placeholder="e.g. Birthday puja" data-testid="input-sankalpa-custom-purpose" /></Field>
          )}
          <Field label="Tithi">
            <select value={tithi} onChange={(e) => setTithi(e.target.value)} className="h-9 rounded-md border border-input bg-background px-2 text-sm w-full" data-testid="select-sankalpa-tithi">
              {TITHIS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Paksha">
            <select value={paksha} onChange={(e) => setPaksha(Number(e.target.value))} className="h-9 rounded-md border border-input bg-background px-2 text-sm w-full" data-testid="select-sankalpa-paksha">
              {PAKSHAS.map((p, i) => <option key={p.en} value={i}>{p.en}</option>)}
            </select>
          </Field>
          <Field label="Nakshatra">
            <select value={nakshatra} onChange={(e) => setNakshatra(e.target.value)} className="h-9 rounded-md border border-input bg-background px-2 text-sm w-full" data-testid="select-sankalpa-nakshatra">
              {NAKSHATRAS.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </Field>
          <Field label="Intent / Phala (Sanskrit)" full>
            <Textarea value={intent} onChange={(e) => setIntent(e.target.value)} rows={2} data-testid="input-sankalpa-intent" />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 space-y-3">
          <div>
            <div className="text-[10px] uppercase tracking-wide text-[#5a4a3a]/65 font-bold mb-1">Sanskrit / Devanagari</div>
            <div className="font-serif text-base text-[#4a1a22] leading-relaxed bg-[#FBF7EE] border border-[#D4AF37]/25 rounded-md p-3" data-testid="text-sankalpa-sanskrit">{sankalpaSa}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wide text-[#5a4a3a]/65 font-bold mb-1">English</div>
            <div className="text-sm text-[#4a1a22]/85 leading-relaxed" data-testid="text-sankalpa-english">{sankalpaEn}</div>
          </div>
          <Button onClick={copyAll} className="bg-[#6D2B35] hover:bg-[#6D2B35] text-[#D4AF37]" data-testid="btn-sankalpa-copy">
            <Copy className="h-3.5 w-3.5 mr-1.5" />Copy sankalpa
          </Button>
          <p className="text-[11px] text-[#5a4a3a]/60 italic">Tithi, paksha and nakshatra default to placeholders — verify with today's panchang before chanting.</p>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      <div className="text-[10px] uppercase tracking-wide font-bold text-[#5a4a3a]/65 mb-1">{label}</div>
      {children}
    </div>
  );
}

// =====================================================================
// Quote Estimator — generate a clean price quote for a yajamana.
// =====================================================================

const QUOTE_PRESETS: Array<{ id: string; label: string; samagri: number; dakshina: number; pandits: number; durationHr: number }> = [
  { id: "ganesh",        label: "Ganesh Puja",         samagri: 1500, dakshina: 2100, pandits: 1, durationHr: 1.5 },
  { id: "satyanarayan",  label: "Satyanarayan Katha",  samagri: 2500, dakshina: 3100, pandits: 1, durationHr: 2.5 },
  { id: "lakshmi",       label: "Lakshmi Puja",        samagri: 2500, dakshina: 2500, pandits: 1, durationHr: 2 },
  { id: "griha-pravesh", label: "Griha Pravesh",       samagri: 5500, dakshina: 5100, pandits: 2, durationHr: 3 },
  { id: "vastu-shanti",  label: "Vastu Shanti",        samagri: 4500, dakshina: 5100, pandits: 2, durationHr: 3 },
  { id: "navagraha",     label: "Navagraha Shanti",    samagri: 6500, dakshina: 8100, pandits: 2, durationHr: 4 },
  { id: "rudrabhishek",  label: "Rudrabhishek",        samagri: 2500, dakshina: 3100, pandits: 1, durationHr: 2 },
  { id: "vivah",         label: "Vivah Sanskar",       samagri: 8500, dakshina: 11000, pandits: 2, durationHr: 4 },
  { id: "shraddha",      label: "Shraddha / Pind Daan",samagri: 3500, dakshina: 5100, pandits: 1, durationHr: 2.5 },
  { id: "custom",        label: "Custom puja",         samagri: 0,    dakshina: 0,    pandits: 1, durationHr: 1 },
];

function QuoteEstimator() {
  const { toast } = useToast();
  const [presetId, setPresetId] = useState(QUOTE_PRESETS[0].id);
  const preset = QUOTE_PRESETS.find((p) => p.id === presetId)!;
  const [samagri, setSamagri] = useState(preset.samagri);
  const [dakshina, setDakshina] = useState(preset.dakshina);
  const [pandits, setPandits] = useState(preset.pandits);
  const [travelKm, setTravelKm] = useState(10);
  const [perKm, setPerKm] = useState(15);
  const [extras, setExtras] = useState(0);
  const [extrasNote, setExtrasNote] = useState("");
  const [yajamana, setYajamana] = useState("");
  const [pujaDate, setPujaDate] = useState(new Date().toISOString().slice(0, 10));

  const applyPreset = (id: string) => {
    const p = QUOTE_PRESETS.find((x) => x.id === id)!;
    setPresetId(id); setSamagri(p.samagri); setDakshina(p.dakshina); setPandits(p.pandits);
  };

  const dakshinaTotal = dakshina * pandits;
  const travelTotal = travelKm * perKm;
  const total = samagri + dakshinaTotal + travelTotal + extras;

  const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;

  const message = useMemo(() => {
    const lines = [
      `Namaste${yajamana ? ` ${yajamana}` : ""} 🙏`,
      ``,
      `Quote for *${preset.label}* on ${new Date(`${pujaDate}T06:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}:`,
      ``,
      `• Samagri (puja items)         ${fmt(samagri)}`,
      `• Dakshina × ${pandits} pandit${pandits > 1 ? "s" : ""}        ${fmt(dakshinaTotal)}`,
      `• Travel (${travelKm} km × ₹${perKm}/km)   ${fmt(travelTotal)}`,
      ...(extras > 0 ? [`• ${extrasNote || "Extras"}                ${fmt(extras)}`] : []),
      `———————————————————`,
      `Total                          ${fmt(total)}`,
      ``,
      `Estimated duration: ~${preset.durationHr} hr · ${pandits} pandit${pandits > 1 ? "s" : ""}`,
      `Sankalpa, mantras and arti included.`,
    ];
    return lines.join("\n").replace(/🙏/g, "Pranam");
  }, [yajamana, preset, pujaDate, samagri, dakshinaTotal, pandits, travelKm, perKm, travelTotal, extras, extrasNote, total]);

  return (
    <div className="grid lg:grid-cols-2 gap-3">
      <Card>
        <CardContent className="p-4 space-y-3">
          <Field label="Puja type">
            <select value={presetId} onChange={(e) => applyPreset(e.target.value)} className="h-9 rounded-md border border-input bg-background px-2 text-sm w-full" data-testid="select-quote-preset">
              {QUOTE_PRESETS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Yajamana name"><Input value={yajamana} onChange={(e) => setYajamana(e.target.value)} placeholder="Mr/Mrs ..." data-testid="input-quote-name" /></Field>
            <Field label="Puja date"><Input type="date" value={pujaDate} onChange={(e) => setPujaDate(e.target.value)} data-testid="input-quote-date" /></Field>
            <Field label="Samagri (₹)"><Input type="number" min={0} value={samagri} onChange={(e) => setSamagri(Math.max(0, Number(e.target.value) || 0))} data-testid="input-quote-samagri" /></Field>
            <Field label="Dakshina / pandit (₹)"><Input type="number" min={0} value={dakshina} onChange={(e) => setDakshina(Math.max(0, Number(e.target.value) || 0))} data-testid="input-quote-dakshina" /></Field>
            <Field label="No. of pandits"><Input type="number" min={1} max={20} value={pandits} onChange={(e) => setPandits(Math.max(1, Math.min(20, Number(e.target.value) || 1)))} data-testid="input-quote-pandits" /></Field>
            <Field label="Travel km"><Input type="number" min={0} value={travelKm} onChange={(e) => setTravelKm(Math.max(0, Number(e.target.value) || 0))} data-testid="input-quote-km" /></Field>
            <Field label="Rate ₹/km"><Input type="number" min={0} value={perKm} onChange={(e) => setPerKm(Math.max(0, Number(e.target.value) || 0))} data-testid="input-quote-rate" /></Field>
            <Field label="Extras (₹)"><Input type="number" min={0} value={extras} onChange={(e) => setExtras(Math.max(0, Number(e.target.value) || 0))} data-testid="input-quote-extras" /></Field>
            <Field label="Extras note" full><Input value={extrasNote} onChange={(e) => setExtrasNote(e.target.value)} placeholder="e.g. Tent, sound system, prasad" data-testid="input-quote-extras-note" /></Field>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <IndianRupee className="h-5 w-5 text-[#6D2B35]" />
            <h3 className="font-serif font-bold text-[#4a1a22]">Quote summary</h3>
          </div>
          <div className="space-y-1.5 text-sm">
            <Row label="Samagri" value={fmt(samagri)} />
            <Row label={`Dakshina × ${pandits}`} value={fmt(dakshinaTotal)} />
            <Row label={`Travel (${travelKm} km × ₹${perKm})`} value={fmt(travelTotal)} />
            {extras > 0 && <Row label={extrasNote || "Extras"} value={fmt(extras)} />}
            <div className="h-px bg-[#D4AF37]/30 my-2" />
            <Row label="Total" value={fmt(total)} bold testId="text-quote-total" />
          </div>
          <Textarea readOnly value={message} rows={10} className="font-mono text-xs" data-testid="text-quote-message" />
          <div className="flex gap-2">
            <Button size="sm" onClick={() => void safeCopy(message, () => toast({ title: "Quote copied", description: "Send it to the yajamana on WhatsApp." }), () => toast({ title: "Copy failed", description: "Long-press the box to select & copy manually.", variant: "destructive" }))} className="bg-[#6D2B35] hover:bg-[#6D2B35] text-[#D4AF37]" data-testid="btn-quote-copy"><Copy className="h-3.5 w-3.5 mr-1.5" />Copy message</Button>
            <Button size="sm" variant="outline" asChild data-testid="btn-quote-whatsapp">
              <a href={`https://wa.me/?text=${encodeURIComponent(message)}`} target="_blank" rel="noopener noreferrer">Open in WhatsApp</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value, bold, testId }: { label: string; value: string; bold?: boolean; testId?: string }) {
  return (
    <div className={`flex items-baseline justify-between gap-2 ${bold ? "text-[#4a1a22] font-bold text-base" : "text-[#4a1a22]/85"}`}>
      <span className="truncate">{label}</span>
      <span className="tabular-nums" data-testid={testId}>{value}</span>
    </div>
  );
}

// =====================================================================
// Puja Stages — 16 shodashopachara checklist with running timer.
// =====================================================================

const SHODASHOPACHARA: Array<{ id: number; sa: string; en: string; hint: string }> = [
  { id: 1,  sa: "आवाहन",       en: "Avahana",        hint: "Invoke the deity into the murti or yantra." },
  { id: 2,  sa: "आसन",         en: "Asana",          hint: "Offer a seat (flowers / pure cloth / akshat)." },
  { id: 3,  sa: "पाद्य",        en: "Padya",          hint: "Wash the deity's feet with pure water." },
  { id: 4,  sa: "अर्घ्य",       en: "Arghya",         hint: "Offer water for hands, with sandal & flowers." },
  { id: 5,  sa: "आचमनीय",      en: "Achamaniya",     hint: "Offer water for sipping (3 sips, with mantra)." },
  { id: 6,  sa: "स्नान",        en: "Snana",          hint: "Bathe the deity — Panchamrit then pure water." },
  { id: 7,  sa: "वस्त्र",       en: "Vastra",         hint: "Offer fresh garments / mauli / janeu." },
  { id: 8,  sa: "यज्ञोपवीत",   en: "Yajnopavita",    hint: "Sacred thread (for male deities)." },
  { id: 9,  sa: "गन्ध",         en: "Gandha",         hint: "Apply sandal paste, kumkum, haldi." },
  { id: 10, sa: "पुष्प",        en: "Pushpa",         hint: "Offer fresh flowers + tulsi/durva/bilva." },
  { id: 11, sa: "धूप",          en: "Dhupa",          hint: "Light dhoop / agarbatti — wave clockwise." },
  { id: 12, sa: "दीप",          en: "Deepa",          hint: "Light ghee diya — wave clockwise." },
  { id: 13, sa: "नैवेद्य",      en: "Naivedya",       hint: "Offer cooked food + fruits + sweets." },
  { id: 14, sa: "ताम्बूल",      en: "Tambula",        hint: "Betel leaves, betel nut, dakshina coin." },
  { id: 15, sa: "नीराजन (आरती)", en: "Niranjan / Arti",hint: "Camphor arti — sing arti + bell + shankh." },
  { id: 16, sa: "मन्त्र-पुष्पाञ्जलि", en: "Mantra Pushpanjali", hint: "Final flower offering with mantra + visarjan." },
];

type StageState = { done: boolean; elapsedMs: number; startedAt: number | null };

function PujaStages() {
  const { toast } = useToast();
  const [stages, setStages] = useState<StageState[]>(() => SHODASHOPACHARA.map(() => ({ done: false, elapsedMs: 0, startedAt: null })));
  const [activeIdx, setActiveIdx] = useState<number>(0);
  const [running, setRunning] = useState(false);
  const [, force] = useState(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Force re-render every ~500ms while a stage timer is active
  useEffect(() => {
    if (!running) return;
    tickRef.current = setInterval(() => force((n) => n + 1), 500);
    return () => {
      if (tickRef.current !== null) {
        clearInterval(tickRef.current);
        tickRef.current = null;
      }
    };
  }, [running]);

  const startTimer = () => {
    if (running) return;
    setStages((prev) => {
      const next = [...prev];
      if (!next[activeIdx].startedAt) next[activeIdx] = { ...next[activeIdx], startedAt: Date.now() };
      return next;
    });
    setRunning(true);
  };

  const pauseTimer = () => {
    setRunning(false);
    setStages((prev) => {
      const next = [...prev];
      const s = next[activeIdx];
      if (s.startedAt) {
        next[activeIdx] = { ...s, elapsedMs: s.elapsedMs + (Date.now() - s.startedAt), startedAt: null };
      }
      return next;
    });
  };

  const completeAndNext = () => {
    setRunning(false);
    setActiveIdx((idx) => {
      setStages((prev) => {
        const next = [...prev];
        const s = next[idx];
        const extra = s.startedAt ? Date.now() - s.startedAt : 0;
        next[idx] = { done: true, elapsedMs: s.elapsedMs + extra, startedAt: null };
        return next;
      });
      if (idx >= SHODASHOPACHARA.length - 1) {
        toast({ title: "Puja complete", description: "Sarve bhavantu sukhinah." });
        return idx;
      }
      return idx + 1;
    });
  };

  const reset = () => {
    if (!confirm("Reset all stages and timers?")) return;
    setStages(SHODASHOPACHARA.map(() => ({ done: false, elapsedMs: 0, startedAt: null })));
    setActiveIdx(0);
    setRunning(false);
  };

  const currentMs = (s: StageState) => s.elapsedMs + (s.startedAt ? Date.now() - s.startedAt : 0);
  const totalMs = stages.reduce((sum, s) => sum + currentMs(s), 0);
  const fmtTime = (ms: number) => {
    const total = Math.floor(ms / 1000);
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  const completedCount = stages.filter((s) => s.done).length;

  return (
    <div className="grid lg:grid-cols-3 gap-3">
      <Card className="lg:col-span-1">
        <CardContent className="p-4 space-y-3">
          <div>
            <div className="text-[10px] uppercase tracking-wide text-[#5a4a3a]/65 font-bold">Now performing</div>
            <div className="font-serif text-2xl font-bold text-[#4a1a22] mt-1" data-testid="text-stage-active-sa">{SHODASHOPACHARA[activeIdx].sa}</div>
            <div className="text-sm text-[#5a4a3a]/80">{SHODASHOPACHARA[activeIdx].en} · stage {activeIdx + 1} of {SHODASHOPACHARA.length}</div>
            <div className="text-xs text-[#5a4a3a]/70 mt-2 leading-relaxed">{SHODASHOPACHARA[activeIdx].hint}</div>
          </div>
          <div className="rounded-md bg-[#FBF7EE] border border-[#D4AF37]/30 p-3 text-center">
            <div className="text-[10px] uppercase tracking-wide text-[#5a4a3a]/65 font-bold">Stage time</div>
            <div className="text-3xl font-bold text-[#4a1a22] tabular-nums" data-testid="text-stage-time">{fmtTime(currentMs(stages[activeIdx]))}</div>
            <div className="text-[11px] text-[#5a4a3a]/65 mt-1">Total puja time: <span className="tabular-nums" data-testid="text-total-time">{fmtTime(totalMs)}</span></div>
          </div>
          <div className="flex gap-2">
            {!running ? (
              <Button size="sm" onClick={startTimer} className="bg-[#6D2B35] hover:bg-[#6D2B35] text-[#D4AF37] flex-1" data-testid="btn-stage-start"><Play className="h-3.5 w-3.5 mr-1" />Start</Button>
            ) : (
              <Button size="sm" onClick={pauseTimer} variant="outline" className="flex-1" data-testid="btn-stage-pause"><Pause className="h-3.5 w-3.5 mr-1" />Pause</Button>
            )}
            <Button size="sm" onClick={completeAndNext} variant="outline" className="flex-1" data-testid="btn-stage-next"><Check className="h-3.5 w-3.5 mr-1" />Complete &amp; next</Button>
          </div>
          <Button size="sm" variant="ghost" onClick={reset} className="w-full text-rose-700" data-testid="btn-stage-reset"><RotateCcw className="h-3.5 w-3.5 mr-1" />Reset all</Button>
          <div className="text-[11px] text-[#5a4a3a]/65 text-center">{completedCount} of {SHODASHOPACHARA.length} stages complete</div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardContent className="p-3">
          <div className="text-[10px] uppercase tracking-wide text-[#5a4a3a]/65 font-bold mb-2 px-1">Shodashopachara · 16 stages</div>
          <div className="space-y-1">
            {SHODASHOPACHARA.map((u, idx) => {
              const s = stages[idx];
              const isActive = idx === activeIdx;
              return (
                <button
                  key={u.id}
                  onClick={() => setActiveIdx(idx)}
                  aria-current={isActive ? "step" : undefined}
                  aria-label={`Stage ${u.id} of ${SHODASHOPACHARA.length}: ${u.en}${s.done ? ", complete" : ""}${isActive ? ", active" : ""}`}
                  className={`w-full text-left rounded-md px-3 py-2 flex items-center gap-3 hover-elevate ${isActive ? "bg-[#FBF7EE] border border-[#D4AF37]/40" : "border border-transparent"}`}
                  data-testid={`btn-stage-${u.id}`}
                >
                  <div className={`h-7 w-7 shrink-0 rounded-full flex items-center justify-center text-xs font-bold ${s.done ? "bg-emerald-100 text-emerald-800" : isActive ? "bg-[#6D2B35] text-[#D4AF37]" : "bg-[#FBF7EE] text-[#5a4a3a]/70 border border-[#D4AF37]/30"}`}>
                    {s.done ? <Check className="h-3.5 w-3.5" /> : u.id}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-serif font-bold text-[#4a1a22] text-sm">{u.sa} · <span className="font-sans font-normal text-[#5a4a3a]/85">{u.en}</span></div>
                    <div className="text-[11px] text-[#5a4a3a]/65 truncate">{u.hint}</div>
                  </div>
                  {currentMs(s) > 0 && <div className="text-[11px] text-[#5a4a3a]/70 tabular-nums shrink-0">{fmtTime(currentMs(s))}</div>}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
