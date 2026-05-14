import { useState, useRef, useEffect, useMemo } from "react";
import { Link } from "wouter";
import {
  ArrowLeft, BookOpen, Play, Pause, Volume2, Loader2, Globe,
  ChevronRight, Sparkles, RotateCcw, Search, X, Star,
  Heart, Flame
} from "lucide-react";
import PageAPlusContent from "@/components/PageAPlusContent";
import { useToast } from "@/hooks/use-toast";
import { RelatedServicesSection } from "@/components/RelatedServices";
import PageSeo from "@/components/PageSeo";

import deityGanesh from "@/assets/images/deity-ganesh.png";
import deityShiva from "@/assets/images/deity-shiva.png";
import deityVishnu from "@/assets/images/deity-vishnu.png";
import deityHanuman from "@/assets/images/deity-hanuman.png";
import deityKrishna from "@/assets/images/deity-krishna.png";
import deityDurga from "@/assets/images/deity-durga.png";
import deityRama from "@/assets/images/deity-rama.png";
import deityLakshmi from "@/assets/images/deity-lakshmi.png";

const DEITY_IMAGES: Record<string, string> = {
  ganesh: deityGanesh,
  shiva: deityShiva,
  vishnu: deityVishnu,
  hanuman: deityHanuman,
  krishna: deityKrishna,
  durga: deityDurga,
  rama: deityRama,
  lakshmi: deityLakshmi,
};

interface KathaStory {
  title: string;
  titleHindi: string;
  god: string;
  paragraphs: string[];
  moral: string;
  mantra: string;
  mantraTranslation: string;
  significance: string;
}

interface KathaItem {
  title: string;
  titleHindi: string;
  description: string;
  descriptionHindi: string;
  tags: string[];
}

interface GodCategory {
  id: string;
  name: string;
  nameHindi: string;
  kathas: KathaItem[];
}

const GOD_CATEGORIES: GodCategory[] = [
  {
    id: "ganesh",
    name: "Lord Ganesha",
    nameHindi: "श्री गणेश",
    kathas: [
      { title: "Birth of Lord Ganesha", titleHindi: "श्री गणेश का जन्म", description: "The divine story of how Goddess Parvati created Ganesha from sandalwood paste and Lord Shiva's encounter with the young guardian at the gates.", descriptionHindi: "माँ पार्वती ने चंदन के लेप से गणेश को कैसे बनाया और शिव जी की उनसे भेंट की कथा।", tags: ["origin", "parvati", "shiva"] },
      { title: "Ganesha and the Moon's Curse", titleHindi: "गणेश और चंद्रमा का श्राप", description: "When the Moon laughed at Ganesha after he fell from his mouse, the angry lord cursed the Moon to wane — the origin of Ganesh Chaturthi.", descriptionHindi: "जब चंद्रमा ने गणेश जी पर हँसा तो उन्होंने चंद्रमा को श्राप दिया — गणेश चतुर्थी की उत्पत्ति।", tags: ["chaturthi", "moon", "curse"] },
      { title: "Ganesha Wins the Race Around the World", titleHindi: "गणेश ने विश्व की परिक्रमा जीती", description: "Shiva and Parvati set a challenge: who circles the world first? While Kartikeya flew on his peacock, Ganesha simply circled his parents — for they are his world.", descriptionHindi: "शिव-पार्वती ने चुनौती रखी — गणेश ने माता-पिता की परिक्रमा कर बुद्धि से विजय प्राप्त की।", tags: ["wisdom", "kartikeya", "race"] },
      { title: "Ganesha and the River Kaveri", titleHindi: "गणेश और कावेरी नदी", description: "How young Ganesha, in the form of a crow, tipped sage Agastya's water pot and released the sacred river Kaveri to bless South India.", descriptionHindi: "गणेश जी ने कौवे का रूप धरकर अगस्त्य मुनि के कमंडल से कावेरी नदी को मुक्त किया।", tags: ["kaveri", "agastya", "river"] },
      { title: "How Ganesha Got His Elephant Head", titleHindi: "गणेश को हाथी का सिर कैसे मिला", description: "Lord Shiva, unaware of Ganesha's identity, severed his head. Overcome with remorse, he replaced it with the head of a noble elephant — Gajanan.", descriptionHindi: "शिव जी ने अनजाने में गणेश का सिर काट दिया और फिर हाथी का सिर लगाकर उन्हें गजानन बनाया।", tags: ["elephant", "shiva", "origin"] },
      { title: "Ganesha Writes the Mahabharata", titleHindi: "गणेश ने महाभारत लिखा", description: "Sage Vyasa needed a scribe for the epic Mahabharata. Ganesha agreed on one condition — Vyasa must never stop dictating. He broke his own tusk to use as a pen.", descriptionHindi: "व्यास मुनि को महाभारत लिखवाने के लिए लेखक चाहिए था — गणेश ने अपना दाँत तोड़कर कलम बनाया।", tags: ["mahabharata", "vyasa", "tusk", "scribe"] },
    ],
  },
  {
    id: "shiva",
    name: "Lord Shiva",
    nameHindi: "भगवान शिव",
    kathas: [
      { title: "Shiva Drinks the Poison (Samudra Manthan)", titleHindi: "शिव ने विष पिया (समुद्र मंथन)", description: "During the churning of the cosmic ocean, deadly Halahala poison emerged threatening all creation. Shiva drank it to save the universe, turning his throat blue — Neelkanth.", descriptionHindi: "समुद्र मंथन से निकले हलाहल विष को शिव जी ने पीकर सृष्टि की रक्षा की — नीलकंठ बने।", tags: ["samudra manthan", "neelkanth", "poison", "ocean"] },
      { title: "The Marriage of Shiva and Parvati", titleHindi: "शिव-पार्वती विवाह", description: "Parvati's intense tapas to win Shiva's heart, the testing by the Seven Sages, and the grand divine wedding that united the ascetic lord with the goddess of devotion.", descriptionHindi: "पार्वती की कठोर तपस्या, सप्तर्षियों की परीक्षा और शिव-पार्वती का दिव्य विवाह।", tags: ["parvati", "marriage", "tapas", "wedding"] },
      { title: "Shiva and the Hunter (Kirata)", titleHindi: "शिव और किरात (शिकारी)", description: "Arjuna prayed to Shiva for the Pashupatastra. Shiva appeared disguised as a tribal hunter and tested Arjuna's valor before granting the divine weapon.", descriptionHindi: "अर्जुन ने पाशुपतास्त्र के लिए तपस्या की — शिव ने किरात (शिकारी) रूप में उनकी परीक्षा ली।", tags: ["arjuna", "pashupatastra", "hunter", "mahabharata"] },
      { title: "Shiva's Tandava - The Cosmic Dance", titleHindi: "शिव का तांडव - ब्रह्मांडीय नृत्य", description: "The story of Nataraja — Shiva's cosmic dance of creation, preservation, and destruction that maintains the rhythm of the universe in the hall of Chidambaram.", descriptionHindi: "नटराज शिव का सृष्टि, पालन और संहार का ब्रह्मांडीय नृत्य — चिदंबरम की कथा।", tags: ["nataraja", "tandava", "dance", "cosmic"] },
      { title: "Shiva and Bhakta Kannappa", titleHindi: "शिव और भक्त कण्णप्पा", description: "A tribal devotee offered meat and water from his mouth to the Shiva lingam. When the lingam's eye bled, Kannappa gouged out his own eyes to heal it — the ultimate devotion.", descriptionHindi: "आदिवासी भक्त कण्णप्पा ने शिवलिंग की आँख से खून बहने पर अपनी आँखें निकालकर चढ़ा दीं।", tags: ["kannappa", "devotion", "bhakti", "tribal"] },
      { title: "The Story of Ardhanarishvara", titleHindi: "अर्धनारीश्वर की कथा", description: "How Shiva merged with Parvati to become Ardhanarishvara — half male, half female — symbolizing that masculine and feminine energies are inseparable in creation.", descriptionHindi: "शिव और पार्वती कैसे अर्धनारीश्वर बने — पुरुष और प्रकृति की एकता का प्रतीक।", tags: ["ardhanarishvara", "parvati", "unity", "creation"] },
    ],
  },
  {
    id: "vishnu",
    name: "Lord Vishnu",
    nameHindi: "भगवान विष्णु",
    kathas: [
      { title: "Vishnu's Dashavatar - Ten Incarnations", titleHindi: "विष्णु के दशावतार", description: "The grand saga of Vishnu's ten avatars — from Matsya the fish to Kalki the future warrior — each appearing to restore dharma when evil threatens the world.", descriptionHindi: "मत्स्य से कल्कि तक — जब-जब धर्म की हानि हुई, विष्णु ने अवतार लिया।", tags: ["dashavatar", "avatars", "dharma", "incarnations"] },
      { title: "The Story of Narasimha Avatar", titleHindi: "नरसिंह अवतार की कथा", description: "Vishnu took the fierce half-man, half-lion form to slay the demon king Hiranyakashipu who could not be killed by man or beast, day or night, indoors or outdoors.", descriptionHindi: "विष्णु ने नरसिंह रूप धारण कर हिरण्यकशिपु का वध किया — न मनुष्य, न पशु, न दिन, न रात।", tags: ["narasimha", "hiranyakashipu", "prahlad", "demon"] },
      { title: "Vishnu and Bhakta Prahlad", titleHindi: "विष्णु और भक्त प्रह्लाद", description: "Young prince Prahlad's unwavering devotion to Vishnu despite his demon father's tortures — thrown from cliffs, fed poison, burned by Holika — yet Vishnu always protected him.", descriptionHindi: "राक्षस पिता की यातनाओं के बावजूद प्रह्लाद की अटूट भक्ति — विष्णु ने हर बार रक्षा की।", tags: ["prahlad", "devotion", "holika", "holi"] },
      { title: "The Vamana Avatar Story", titleHindi: "वामन अवतार की कथा", description: "Vishnu appeared as a dwarf Brahmin and asked demon king Bali for just three steps of land. With two cosmic strides he covered heaven and earth — the third step crowned Bali's head.", descriptionHindi: "विष्णु ने वामन रूप में बलि राजा से तीन पग भूमि माँगी और तीन लोकों को नाप लिया।", tags: ["vamana", "bali", "dwarf", "three steps"] },
      { title: "Vishnu and the Churning of the Ocean", titleHindi: "विष्णु और समुद्र मंथन", description: "Devas and Asuras united to churn the cosmic ocean using Mount Mandara and serpent Vasuki. Vishnu as Kurma (tortoise) supported the mountain, and treasures including Lakshmi emerged.", descriptionHindi: "देवों और असुरों ने मिलकर समुद्र मंथन किया — विष्णु ने कूर्म रूप में मंदार पर्वत को धारण किया।", tags: ["kurma", "churning", "ocean", "lakshmi", "amrit"] },
      { title: "The Story of Matsya Avatar", titleHindi: "मत्स्य अवतार की कथा", description: "A tiny fish asked King Manu for protection. It grew to enormous size, revealed itself as Vishnu, and warned of the great flood — guiding Manu's boat to safety with all life seeds.", descriptionHindi: "एक छोटी मछली ने राजा मनु से रक्षा माँगी — वह विष्णु का मत्स्य अवतार था, महाप्रलय से सृष्टि बचाई।", tags: ["matsya", "fish", "flood", "manu", "first avatar"] },
    ],
  },
  {
    id: "hanuman",
    name: "Lord Hanuman",
    nameHindi: "श्री हनुमान",
    kathas: [
      { title: "Hanuman Swallows the Sun", titleHindi: "हनुमान ने सूर्य को निगला", description: "As a child, Hanuman mistook the sun for a ripe fruit and leapt to swallow it. Indra struck him with his thunderbolt, but the gods blessed the unconscious child with extraordinary powers.", descriptionHindi: "बाल हनुमान ने सूर्य को फल समझकर निगलना चाहा — इंद्र ने वज्र मारा, देवताओं ने वरदान दिए।", tags: ["childhood", "sun", "indra", "powers", "blessings"] },
      { title: "Hanuman Burns Lanka", titleHindi: "हनुमान ने लंका जलाई", description: "Captured by Ravana's forces, Hanuman's tail was set ablaze. He leapt across Lanka, setting the golden city on fire, showing Ravana the power of Rama's devotee.", descriptionHindi: "रावण की सेना ने हनुमान की पूँछ में आग लगाई — हनुमान ने पूरी स्वर्ण लंका जला दी।", tags: ["lanka", "ravana", "fire", "tail", "ramayana"] },
      { title: "Hanuman Brings Sanjeevani", titleHindi: "हनुमान संजीवनी लाए", description: "When Lakshmana lay mortally wounded, Hanuman flew to the Himalayas for the Sanjeevani herb. Unable to identify it, he uprooted the entire Dronagiri mountain and flew it back.", descriptionHindi: "लक्ष्मण के प्राण बचाने हनुमान हिमालय गए — जड़ी न पहचान पाए तो पूरा द्रोणगिरि पर्वत उठा लाए।", tags: ["sanjeevani", "lakshmana", "dronagiri", "mountain", "healing"] },
      { title: "Hanuman Meets Lord Rama", titleHindi: "हनुमान की राम से भेंट", description: "In the forests of Kishkindha, the destined meeting between Rama and Hanuman — when the devoted monkey recognized his eternal lord, tears of divine love flowed.", descriptionHindi: "किष्किंधा के वन में राम और हनुमान की दिव्य भेंट — भक्त ने अपने प्रभु को पहचाना।", tags: ["kishkindha", "meeting", "sugriva", "devotion"] },
      { title: "Hanuman Tears Open His Chest", titleHindi: "हनुमान ने छाती चीरी", description: "When questioned about his devotion, Hanuman tore open his chest to reveal Rama and Sita residing in his heart — the ultimate expression of selfless love and surrender.", descriptionHindi: "जब भक्ति पर प्रश्न उठा, हनुमान ने छाती चीरकर दिखाया — राम-सीता उनके हृदय में विराजमान हैं।", tags: ["devotion", "chest", "heart", "rama sita", "bhakti"] },
      { title: "Hanuman and the Ring of Rama", titleHindi: "हनुमान और राम की अंगूठी", description: "Rama sent Hanuman to Lanka with his ring as proof for Sita. Hanuman crossed the mighty ocean in a single leap, found Sita in Ashoka Vatika, and gave her hope.", descriptionHindi: "राम ने हनुमान को सीता के लिए अंगूठी दी — हनुमान ने समुद्र लांघकर अशोक वाटिका में सीता को ढाँढ़स बँधाया।", tags: ["ring", "sita", "ashoka vatika", "ocean", "messenger"] },
    ],
  },
  {
    id: "krishna",
    name: "Lord Krishna",
    nameHindi: "श्री कृष्ण",
    kathas: [
      { title: "Krishna's Birth in the Prison", titleHindi: "कृष्ण का कारागार में जन्म", description: "On the stormy night of Ashtami, Krishna was born in Kamsa's prison. Vasudeva carried the divine infant across the flooding Yamuna while the serpent Shesha shielded them.", descriptionHindi: "अष्टमी की आँधी-तूफानी रात कंस के कारागार में कृष्ण जन्मे — वासुदेव ने यमुना पार कर गोकुल पहुँचाया।", tags: ["birth", "kamsa", "vasudeva", "yamuna", "janmashtami"] },
      { title: "Krishna Lifts Govardhan Hill", titleHindi: "कृष्ण ने गोवर्धन पर्वत उठाया", description: "When Indra unleashed furious storms to punish Vrindavan, young Krishna lifted the entire Govardhan Hill on his little finger to shelter all the villagers and cattle for seven days.", descriptionHindi: "इंद्र के प्रकोप से बचाने कृष्ण ने गोवर्धन पर्वत को छोटी उंगली पर उठाकर सात दिन रखा।", tags: ["govardhan", "indra", "vrindavan", "mountain", "protection"] },
      { title: "Krishna and Kalia Naag", titleHindi: "कृष्ण और कालिया नाग", description: "The deadly serpent Kalia poisoned the Yamuna river. Young Krishna jumped into the waters, danced on Kalia's many hoods, and banished him — purifying the river for all.", descriptionHindi: "कालिया नाग ने यमुना को विषैला कर दिया — बालकृष्ण ने उसके फनों पर नृत्य कर नदी को शुद्ध किया।", tags: ["kalia", "yamuna", "serpent", "dance", "vrindavan"] },
      { title: "Krishna's Raas Leela", titleHindi: "कृष्ण की रास लीला", description: "On a full moon night in Vrindavan, Krishna played his flute and multiplied himself to dance with every Gopi — the divine Raas Leela symbolizing the soul's longing for the divine.", descriptionHindi: "वृंदावन में पूर्णिमा की रात कृष्ण ने बाँसुरी बजाई — हर गोपी के साथ नृत्य किया, आत्मा और परमात्मा का मिलन।", tags: ["raas leela", "gopis", "flute", "vrindavan", "moonlight"] },
      { title: "Krishna and Sudama's Friendship", titleHindi: "कृष्ण और सुदामा की मित्रता", description: "Poor Brahmin Sudama visited his childhood friend Krishna in Dwarka with a humble gift of beaten rice. Krishna's love transformed Sudama's life — true friendship transcends wealth.", descriptionHindi: "गरीब सुदामा ने मित्र कृष्ण से मिलने द्वारका में चावल का उपहार ले गए — कृष्ण ने सब बदल दिया।", tags: ["sudama", "friendship", "dwarka", "poha", "devotion"] },
      { title: "The Butter Thief - Makhan Chor", titleHindi: "माखन चोर", description: "The adorable tales of baby Krishna stealing butter from the Gopis' homes, forming a pyramid with his friends, and getting caught red-handed by mother Yashoda.", descriptionHindi: "बालकृष्ण की माखन चोरी — गोपियों के घरों से माखन चुराना, यशोदा माँ की डाँट, नटखट लीलाएँ।", tags: ["butter", "yashoda", "childhood", "makhan", "naughty"] },
    ],
  },
  {
    id: "durga",
    name: "Goddess Durga",
    nameHindi: "माँ दुर्गा",
    kathas: [
      { title: "Durga Slays Mahishasura", titleHindi: "दुर्गा ने महिषासुर का वध किया", description: "The buffalo demon Mahishasura conquered heaven. The gods combined their powers to create Durga — she battled for nine days and slew him on the tenth, Vijayadashami.", descriptionHindi: "महिषासुर ने स्वर्ग जीत लिया — देवताओं ने शक्ति मिलाकर दुर्गा की रचना की — नौ दिन युद्ध कर दसवें दिन वध किया।", tags: ["mahishasura", "navratri", "vijayadashami", "battle", "demon"] },
      { title: "The Origin of Goddess Durga", titleHindi: "माँ दुर्गा की उत्पत्ति", description: "When no god could defeat the demons, a blazing light emerged from each deity's body and merged to form the radiant Goddess Durga, armed with divine weapons from every god.", descriptionHindi: "जब कोई देवता राक्षसों को नहीं हरा सका — हर देवता के तेज से दुर्गा माँ प्रकट हुईं।", tags: ["origin", "creation", "devas", "shakti", "weapons"] },
      { title: "Durga and the Nine Nights (Navratri)", titleHindi: "दुर्गा और नौ रातें (नवरात्रि)", description: "The significance of each night of Navratri — nine forms of Durga (Navdurga), from Shailputri to Siddhidatri, each representing a unique power and spiritual teaching.", descriptionHindi: "नवरात्रि की नौ रातें — शैलपुत्री से सिद्धिदात्री तक, माँ दुर्गा के नौ रूपों की कथा।", tags: ["navratri", "navdurga", "nine nights", "forms", "festival"] },
      { title: "Chamunda Devi's Victory", titleHindi: "चामुंडा देवी की विजय", description: "From Durga's fury emerged the fierce Chamunda, who destroyed the demons Chanda and Munda. She drank their blood to prevent new demons from sprouting — the terrifying protector.", descriptionHindi: "दुर्गा के क्रोध से चामुंडा प्रकट हुईं — चंड-मुंड राक्षसों का संहार किया।", tags: ["chamunda", "chanda", "munda", "fierce", "battle"] },
      { title: "Durga and Raktabeej", titleHindi: "दुर्गा और रक्तबीज", description: "The demon Raktabeej could multiply from every drop of blood that touched the ground. Goddess Kali emerged from Durga's forehead and drank every drop before it could fall.", descriptionHindi: "रक्तबीज के खून की हर बूँद से नया राक्षस जन्मता — काली माँ ने हर बूँद पी ली।", tags: ["raktabeej", "kali", "blood", "demon", "fierce"] },
      { title: "The Story of Shakti Peethas", titleHindi: "शक्ति पीठों की कथा", description: "Grief-stricken Shiva wandered with Sati's body. Vishnu's Sudarshan Chakra cut her body into 51 pieces — each fell to earth, creating the 51 sacred Shakti Peethas across India.", descriptionHindi: "सती के शरीर के 51 टुकड़े पृथ्वी पर गिरे — वहीं 51 शक्ति पीठ बने, भारत भर में।", tags: ["shakti peethas", "sati", "shiva", "pilgrimage", "sacred"] },
    ],
  },
  {
    id: "rama",
    name: "Lord Rama",
    nameHindi: "श्री राम",
    kathas: [
      { title: "Ram Breaks Shiva's Bow", titleHindi: "राम ने शिव धनुष तोड़ा", description: "In King Janaka's court, princes from all kingdoms failed to even lift the mighty Pinaka bow. Young Rama not only lifted it but broke it effortlessly, winning Sita's hand.", descriptionHindi: "जनक की सभा में कोई राजकुमार शिव धनुष उठा न सका — राम ने सहज ही तोड़ दिया, सीता से विवाह हुआ।", tags: ["bow", "sita", "swayamvar", "janaka", "marriage"] },
      { title: "Rama's Exile to the Forest", titleHindi: "राम का वनवास", description: "Bound by duty and love for his father's word, Rama accepted 14 years of exile with grace. Sita and Lakshmana followed him — the beginning of the great Ramayana journey.", descriptionHindi: "पिता की आज्ञा मानकर राम ने 14 वर्ष का वनवास स्वीकार किया — सीता और लक्ष्मण भी साथ गए।", tags: ["exile", "vanvas", "kaikeyi", "dasharatha", "duty"] },
      { title: "Rama Builds the Bridge to Lanka", titleHindi: "राम ने लंका तक सेतु बनाया", description: "To reach Lanka and rescue Sita, Rama's vanara army built a miraculous floating bridge across the ocean — the Ram Setu — with stones inscribed with Rama's name.", descriptionHindi: "सीता को बचाने राम की वानर सेना ने राम नाम लिखे पत्थरों से समुद्र पर सेतु बनाया।", tags: ["ram setu", "bridge", "ocean", "vanara", "nala neel"] },
      { title: "Rama and Shabari's Berries", titleHindi: "राम और शबरी के बेर", description: "The elderly tribal woman Shabari waited years for Rama. She offered him berries she had tasted first to ensure sweetness — Rama ate them with love, honoring pure devotion.", descriptionHindi: "शबरी ने वर्षों राम की प्रतीक्षा की — चखकर मीठे बेर चुने — राम ने प्रेम से खाए, शुद्ध भक्ति।", tags: ["shabari", "berries", "devotion", "tribal", "bhakti"] },
      { title: "The Killing of Ravana", titleHindi: "रावण का वध", description: "After a fierce battle, Rama with Brahma's astra finally defeated the ten-headed demon king Ravana, restoring dharma and rescuing Sita — the triumph celebrated as Dussehra.", descriptionHindi: "ब्रह्मास्त्र से राम ने दशानन रावण का वध किया — दशहरा का पर्व यही विजय।", tags: ["ravana", "battle", "dussehra", "dharma", "victory"] },
      { title: "Rama's Coronation in Ayodhya", titleHindi: "राम का अयोध्या में राज्याभिषेक", description: "After 14 years of exile, Rama returned to Ayodhya — the city lit thousands of lamps to welcome him. His coronation began Ram Rajya, the golden age of dharma — celebrated as Diwali.", descriptionHindi: "14 वर्ष बाद राम अयोध्या लौटे — दीप जलाकर स्वागत हुआ — राज्याभिषेक से राम राज्य आरंभ — यही दीपावली।", tags: ["coronation", "ayodhya", "diwali", "ram rajya", "return"] },
    ],
  },
  {
    id: "lakshmi",
    name: "Goddess Lakshmi",
    nameHindi: "माँ लक्ष्मी",
    kathas: [
      { title: "Lakshmi Emerges from the Ocean", titleHindi: "लक्ष्मी का समुद्र से प्रकट होना", description: "During the Samudra Manthan, the most beautiful Goddess Lakshmi emerged seated on a lotus, with elephants showering her with sacred waters — she chose Vishnu as her eternal consort.", descriptionHindi: "समुद्र मंथन से कमल पर विराजमान लक्ष्मी प्रकट हुईं — गजों ने अभिषेक किया — विष्णु को वर चुना।", tags: ["samudra manthan", "lotus", "vishnu", "ocean", "creation"] },
      { title: "Why Lakshmi Chose Vishnu", titleHindi: "लक्ष्मी ने विष्णु को क्यों चुना", description: "All the gods desired Lakshmi's hand. She examined each — Brahma was too proud, Shiva too detached. Only Vishnu showed the perfect balance of strength, wisdom, and humility.", descriptionHindi: "सभी देवता लक्ष्मी से विवाह चाहते थे — विष्णु में शक्ति, ज्ञान और विनम्रता का संतुलन था।", tags: ["vishnu", "choice", "marriage", "humility", "devas"] },
      { title: "Lakshmi's Test of the King", titleHindi: "लक्ष्मी की राजा की परीक्षा", description: "A prosperous king grew arrogant about his wealth. Lakshmi appeared as an old woman to test him. When he showed disrespect, she departed — with her went all his fortune.", descriptionHindi: "घमंडी राजा ने बूढ़ी महिला रूपी लक्ष्मी का अपमान किया — उनके जाते ही सारा वैभव चला गया।", tags: ["test", "arrogance", "humility", "king", "lesson"] },
      { title: "Diwali - The Return of Lakshmi", titleHindi: "दीपावली - लक्ष्मी का आगमन", description: "On Diwali night, homes are lit with lamps to welcome Lakshmi. The story of why she visits clean, bright homes and blesses devoted families with prosperity for the coming year.", descriptionHindi: "दीवाली की रात दीपों से सजे स्वच्छ घरों में लक्ष्मी माँ पधारती हैं — समृद्धि का आशीर्वाद देती हैं।", tags: ["diwali", "lamps", "prosperity", "festival", "home"] },
      { title: "Lakshmi and Alakshmi", titleHindi: "लक्ष्मी और अलक्ष्मी", description: "Lakshmi's elder sister Alakshmi (goddess of misfortune) was also born from the ocean. Where there is strife, jealousy, and filth, Lakshmi departs and Alakshmi arrives.", descriptionHindi: "लक्ष्मी की बड़ी बहन अलक्ष्मी — जहाँ कलह, ईर्ष्या और गंदगी हो वहाँ लक्ष्मी जाती, अलक्ष्मी आती हैं।", tags: ["alakshmi", "misfortune", "contrast", "cleanliness", "harmony"] },
    ],
  },
];

const ALL_KATHAS = GOD_CATEGORIES.flatMap(god =>
  god.kathas.map(k => ({ ...k, godId: god.id, godName: god.name, godNameHindi: god.nameHindi }))
);

const PRIMARY_BTN =
  "inline-flex items-center justify-center gap-2 bg-[#6D2B35] text-[#D4AF37] hover:bg-[#5a1f29] disabled:opacity-50 rounded-md h-10 px-5 text-[13px] font-semibold transition-colors";

const OUTLINE_BTN =
  "inline-flex items-center justify-center gap-2 bg-[#FBF7EE] text-[#6D2B35] hover:bg-[#f3ecdc] border border-[#D4AF37]/40 rounded-md h-10 px-5 text-[13px] font-semibold transition-colors";

export default function Kathas() {
  const { toast } = useToast();
  const [selectedGod, setSelectedGod] = useState<GodCategory | null>(null);
  const [selectedKatha, setSelectedKatha] = useState<string | null>(null);
  const [story, setStory] = useState<KathaStory | null>(null);
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState<"english" | "hindi">("english");
  const [audioLoading, setAudioLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAllKathas, setShowAllKathas] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);


  const filteredKathas = useMemo(() => {
    if (!searchQuery.trim()) return ALL_KATHAS;
    const q = searchQuery.toLowerCase();
    return ALL_KATHAS.filter(k =>
      k.title.toLowerCase().includes(q) ||
      k.titleHindi.includes(searchQuery) ||
      k.description.toLowerCase().includes(q) ||
      k.descriptionHindi.includes(searchQuery) ||
      k.godName.toLowerCase().includes(q) ||
      k.godNameHindi.includes(searchQuery) ||
      k.tags.some(t => t.toLowerCase().includes(q))
    );
  }, [searchQuery]);

  const generateKatha = async (god: string, kathaTitle: string, lang?: "english" | "hindi") => {
    setLoading(true);
    setStory(null);
    setAudioUrl(null);
    setIsPlaying(false);
    try {
      const res = await fetch("/api/kathas/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ god, kathaTitle, language: lang ?? language }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setStory(data);
    } catch {
      toast({ title: "Error", description: "Could not generate katha. Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const generateAudio = async () => {
    if (!story || !selectedGod || !selectedKatha) return;
    setAudioLoading(true);
    try {
      const textForAudio = [story.title, ...story.paragraphs.slice(0, 5), story.moral].join(". ");
      const res = await fetch("/api/kathas/audio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: textForAudio.substring(0, 4000),
          language,
          god: selectedGod.name,
          kathaTitle: selectedKatha,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
      toast({ title: "Audio Ready", description: "Your katha audio has been generated. Press play to listen." });
    } catch {
      toast({ title: "Audio Error", description: "Could not generate audio. Please try again.", variant: "destructive" });
    } finally {
      setAudioLoading(false);
    }
  };

  const toggleAudio = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const openKatha = (godName: string, kathaTitle: string) => {
    const god = GOD_CATEGORIES.find(g => g.name === godName);
    if (god) setSelectedGod(god);
    setSelectedKatha(kathaTitle);
    generateKatha(godName, kathaTitle);
  };

  if (selectedKatha && selectedGod) {
    return (
      <div className="min-h-screen bg-[#FBF7EE]">
        <section className="relative bg-[#6D2B35] border-b border-[#D4AF37]/30 py-8 md:py-10">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-transparent" aria-hidden="true" />
          <div className="container mx-auto px-4 relative z-10">
            <button
              onClick={() => { setSelectedKatha(null); setStory(null); setAudioUrl(null); setIsPlaying(false); }}
              className="inline-flex items-center gap-1.5 text-white/70 hover:text-[#D4AF37] text-[11px] uppercase tracking-[0.2em] font-semibold mb-3 transition-colors"
              data-testid="btn-back-kathas"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Kathas
            </button>
            <div className="flex items-center gap-2.5 mb-2">
              <span className="h-px w-6 bg-[#D4AF37]/60" />
              <span className="text-[#D4AF37] text-[10px] uppercase tracking-[0.3em] font-semibold">{selectedGod.nameHindi}</span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl text-white leading-tight" data-testid="text-katha-name">{selectedKatha}</h1>
            <p className="text-white/60 text-[12px] mt-1">{selectedGod.name} · {language === "hindi" ? "हिन्दी" : "English"}</p>
          </div>
        </section>

        <div className="container mx-auto px-4 py-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-8 w-8 text-[#6D2B35] animate-spin mb-4" />
              <p className="text-[13px] text-[#5a4a3a]/70">Generating the sacred katha…</p>
              <p className="text-[11px] text-[#5a4a3a]/40 mt-1">This may take a moment</p>
            </div>
          ) : story ? (
            <div className="max-w-3xl mx-auto">
              <div className="rounded-md border border-[#D4AF37]/30 bg-white p-6 sm:p-8 mb-5">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-5">
                  <div className="min-w-0">
                    <h2 className="font-serif text-xl sm:text-2xl text-[#6D2B35]" data-testid="text-story-title">{story.title}</h2>
                    {story.titleHindi && <p className="text-[12px] text-[#D4AF37] mt-0.5">{story.titleHindi}</p>}
                  </div>
                  <button
                    onClick={() => {
                      const next = language === "english" ? "hindi" : "english";
                      setLanguage(next);
                      generateKatha(selectedGod.name, selectedKatha!, next);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 h-8 bg-[#FBF7EE] border border-[#D4AF37]/30 rounded-md text-[11px] font-semibold uppercase tracking-[0.15em] text-[#6D2B35] hover:bg-[#f3ecdc] transition-colors self-start shrink-0"
                    data-testid="btn-switch-lang"
                  >
                    <Globe className="h-3 w-3" strokeWidth={1.8} /> {language === "english" ? "हिन्दी" : "English"}
                  </button>
                </div>

                <div className="space-y-4 mb-5">
                  {story.paragraphs.map((para, i) => (
                    <p key={i} className="text-[13.5px] text-[#5a4a3a] leading-[1.75]" data-testid={`para-${i}`}>{para}</p>
                  ))}
                </div>

                {story.moral && (
                  <div className="rounded-md border border-[#D4AF37]/25 bg-[#FBF7EE] p-4 mb-3">
                    <p className="text-[10px] text-[#D4AF37] uppercase tracking-[0.2em] font-semibold mb-1">{language === "hindi" ? "नैतिक शिक्षा" : "Moral of the Story"}</p>
                    <p className="text-[13px] text-[#6D2B35] font-medium leading-relaxed">{story.moral}</p>
                  </div>
                )}

                {story.mantra && (
                  <div className="rounded-md border border-[#D4AF37]/25 bg-[#FBF7EE] p-4 mb-3">
                    <p className="text-[10px] text-[#5a4a3a]/60 uppercase tracking-[0.2em] font-semibold mb-1">{language === "hindi" ? "मंत्र" : "Sacred Mantra"}</p>
                    <p className="font-serif text-base text-[#6D2B35] font-semibold leading-relaxed">{story.mantra}</p>
                    {story.mantraTranslation && <p className="text-[11.5px] text-[#5a4a3a]/65 mt-1 italic">{story.mantraTranslation}</p>}
                  </div>
                )}

                {story.significance && (
                  <div className="rounded-md border border-[#D4AF37]/20 bg-white p-4">
                    <p className="text-[10px] text-[#6D2B35]/70 uppercase tracking-[0.2em] font-semibold mb-1">{language === "hindi" ? "महत्व" : "Significance"}</p>
                    <p className="text-[13px] text-[#5a4a3a] leading-relaxed">{story.significance}</p>
                  </div>
                )}
              </div>

              <div className="rounded-md border border-[#D4AF37]/25 bg-white p-5 mb-5">
                <h3 className="font-serif text-base text-[#6D2B35] mb-4 flex items-center gap-2">
                  <Volume2 className="h-4 w-4 text-[#D4AF37]" strokeWidth={1.8} /> {language === "hindi" ? "कथा सुनें" : "Listen to Katha"}
                </h3>

                {audioUrl ? (
                  <div className="flex items-center gap-4">
                    <button
                      onClick={toggleAudio}
                      className={`w-11 h-11 rounded-md flex items-center justify-center transition-colors flex-shrink-0 border ${isPlaying ? "bg-[#D4AF37] border-[#D4AF37] text-[#3a1a20]" : "bg-[#6D2B35] border-[#6D2B35] text-[#D4AF37]"}`}
                      data-testid="btn-play-audio"
                    >
                      {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
                    </button>
                    <div className="flex-1">
                      <audio ref={audioRef} src={audioUrl} onEnded={() => setIsPlaying(false)} controls className="w-full h-10" />
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={generateAudio}
                    disabled={audioLoading}
                    className={`${PRIMARY_BTN} w-full`}
                    data-testid="btn-generate-audio"
                  >
                    {audioLoading ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Generating Audio…</>
                    ) : (
                      <><Volume2 className="h-4 w-4" strokeWidth={1.8} /> Generate Audio Narration</>
                    )}
                  </button>
                )}
              </div>

              <div className="flex flex-wrap gap-3 justify-center">
                <button
                  onClick={() => { generateKatha(selectedGod.name, selectedKatha!); }}
                  className={OUTLINE_BTN}
                  data-testid="btn-regenerate"
                >
                  <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.8} /> Regenerate
                </button>
                <button
                  onClick={() => { setSelectedKatha(null); setStory(null); setAudioUrl(null); setIsPlaying(false); }}
                  className={OUTLINE_BTN}
                  data-testid="btn-more-kathas"
                >
                  More Kathas
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FBF7EE]">
      <PageSeo
        title="Sacred Hindu Kathas & Vrat Stories — Satyanarayan, Vat Savitri, Karva Chauth | Vedic Tatva"
        description="Read complete Hindu kathas and vrat stories — Satyanarayan, Vat Savitri, Karva Chauth, Ahoi Ashtami and more — with vidhi, mantras, and timing. Free online katha library."
        canonical="/kathas"
      />
      <section className="relative bg-[#6D2B35] border-b border-[#D4AF37]/30 py-12 md:py-16">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-transparent" aria-hidden="true" />
        <div className="container mx-auto px-4 relative z-10">
          <Link href="/" className="inline-flex items-center gap-1.5 text-white/70 hover:text-[#D4AF37] text-[11px] uppercase tracking-[0.2em] font-semibold mb-4 transition-colors" data-testid="link-back-home">
            <ArrowLeft className="h-3.5 w-3.5" /> Home
          </Link>
          <div className="max-w-2xl">
            <div className="flex items-center gap-2.5 mb-3">
              <span className="h-px w-8 bg-[#D4AF37]/60" />
              <BookOpen className="h-4 w-4 text-[#D4AF37]" strokeWidth={1.8} />
              <span className="text-[#D4AF37] text-[10px] uppercase tracking-[0.3em] font-semibold">Divine Stories</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl text-white mb-2 leading-tight" data-testid="text-kathas-title">
              Sacred Kathas
            </h1>
            <p className="text-white/65 text-[13px] sm:text-sm leading-relaxed mb-5 max-w-xl">
              Immerse yourself in divine stories of Hindu gods and goddesses. Read or listen to AI-narrated kathas in English and Hindi.
            </p>

            <div className="relative max-w-xl">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#5a4a3a]/40" strokeWidth={1.8} />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search kathas by name, god, keyword…"
                className="w-full h-11 pl-10 pr-10 rounded-md bg-white text-[#5a4a3a] text-[13px] placeholder:text-[#5a4a3a]/40 border border-[#D4AF37]/30 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/40 outline-none transition-colors"
                data-testid="input-search-kathas"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md hover:bg-[#FBF7EE] text-[#5a4a3a]/50 hover:text-[#6D2B35] transition-colors"
                  data-testid="btn-clear-search"
                >
                  <X className="h-3.5 w-3.5" strokeWidth={2} />
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-10">
        {searchQuery.trim() ? (
          <>
            <p className="text-[12px] text-[#5a4a3a]/70 mb-4 uppercase tracking-[0.15em] font-semibold">
              {filteredKathas.length} katha{filteredKathas.length !== 1 ? "s" : ""} found for "{searchQuery}"
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredKathas.map((katha, i) => (
                <button
                  key={`${katha.godId}-${i}`}
                  onClick={() => openKatha(katha.godName, katha.title)}
                  className="rounded-md border border-[#D4AF37]/25 bg-white p-4 hover:border-[#D4AF37]/55 transition-colors text-left group"
                  data-testid={`search-katha-${i}`}
                >
                  <div className="flex items-start gap-3">
                    <img src={DEITY_IMAGES[katha.godId]} alt={katha.godName} className="w-12 h-14 rounded-md object-cover object-top flex-shrink-0 border border-[#D4AF37]/20" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-[13px] text-[#6D2B35] group-hover:text-[#D4AF37] transition-colors leading-snug">{katha.title}</h3>
                      <p className="text-[11px] text-[#D4AF37] font-medium mt-0.5">{katha.titleHindi}</p>
                      <p className="text-[11.5px] text-[#5a4a3a]/60 mt-1.5 line-clamp-2 leading-relaxed">{katha.description}</p>
                      <p className="text-[10px] text-[#5a4a3a]/50 mt-2 uppercase tracking-[0.15em] font-semibold flex items-center gap-1.5">
                        {katha.godName} · <Sparkles className="h-2.5 w-2.5" /> AI · Audio
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-[#5a4a3a]/30 group-hover:text-[#D4AF37] flex-shrink-0 mt-1 transition-colors" />
                  </div>
                </button>
              ))}
            </div>
            {filteredKathas.length === 0 && (
              <div className="text-center py-12">
                <BookOpen className="h-10 w-10 text-[#5a4a3a]/20 mx-auto mb-3" strokeWidth={1.5} />
                <p className="text-[#5a4a3a]/60 text-[13px]">No kathas found. Try a different search.</p>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
              <h2 className="font-serif text-xl text-[#6D2B35]">Choose a Deity</h2>
              <div className="inline-flex bg-white rounded-md border border-[#D4AF37]/30 p-1">
                <button
                  onClick={() => setLanguage("english")}
                  className={`px-3 h-8 rounded-md text-[11px] font-semibold uppercase tracking-[0.15em] transition-colors ${language === "english" ? "bg-[#6D2B35] text-[#D4AF37]" : "text-[#5a4a3a]/60 hover:text-[#6D2B35]"}`}
                  data-testid="btn-lang-en"
                >
                  English
                </button>
                <button
                  onClick={() => setLanguage("hindi")}
                  className={`px-3 h-8 rounded-md text-[11px] font-semibold uppercase tracking-[0.15em] transition-colors ${language === "hindi" ? "bg-[#6D2B35] text-[#D4AF37]" : "text-[#5a4a3a]/60 hover:text-[#6D2B35]"}`}
                  data-testid="btn-lang-hi"
                >
                  हिन्दी
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-10">
              {GOD_CATEGORIES.map(god => (
                <button
                  key={god.id}
                  onClick={() => { setSelectedGod(god); setShowAllKathas(false); }}
                  className="rounded-md border border-[#D4AF37]/25 bg-white overflow-hidden hover:border-[#D4AF37]/55 transition-colors text-left group"
                  data-testid={`god-card-${god.id}`}
                >
                  <div className="h-32 sm:h-40 relative overflow-hidden bg-[#FBF7EE]">
                    <img src={DEITY_IMAGES[god.id]} alt={god.name} className="w-full h-full object-cover object-top" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#6D2B35]/80 via-[#6D2B35]/20 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-3 border-t border-[#D4AF37]/30">
                      <h3 className="font-serif text-[13px] sm:text-sm text-white leading-tight">{god.name}</h3>
                      <p className="text-[10px] text-[#D4AF37] font-medium mt-0.5">{god.nameHindi}</p>
                    </div>
                  </div>
                  <div className="px-3 py-2.5 border-t border-[#D4AF37]/20">
                    <p className="text-[10px] text-[#5a4a3a]/60 uppercase tracking-[0.18em] font-semibold">{god.kathas.length} sacred kathas</p>
                  </div>
                </button>
              ))}
            </div>

            {selectedGod && (
              <div id="katha-list" className="scroll-mt-4 mb-10">
                <div className="flex items-center justify-between mb-5 gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <img src={DEITY_IMAGES[selectedGod.id]} alt={selectedGod.name} className="w-10 h-12 rounded-md object-cover object-top border border-[#D4AF37]/25 shrink-0" />
                    <div className="min-w-0">
                      <h2 className="font-serif text-lg text-[#6D2B35] leading-tight">{selectedGod.name} Kathas</h2>
                      <p className="text-[11px] text-[#5a4a3a]/60 mt-0.5">{selectedGod.nameHindi} · {selectedGod.kathas.length} divine stories</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedGod(null)}
                    className="p-2 rounded-md border border-[#D4AF37]/30 bg-white hover:bg-[#FBF7EE] text-[#5a4a3a]/60 hover:text-[#6D2B35] transition-colors shrink-0"
                    data-testid="btn-close-god"
                  >
                    <X className="h-3.5 w-3.5" strokeWidth={2} />
                  </button>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {selectedGod.kathas.map((katha, i) => (
                    <button
                      key={i}
                      onClick={() => openKatha(selectedGod.name, katha.title)}
                      className="rounded-md border border-[#D4AF37]/25 bg-white p-4 hover:border-[#D4AF37]/55 transition-colors text-left group"
                      data-testid={`katha-card-${i}`}
                    >
                      <div className="flex items-start gap-3">
                        <img src={DEITY_IMAGES[selectedGod.id]} alt={selectedGod.name} className="w-12 h-14 rounded-md object-cover object-top flex-shrink-0 border border-[#D4AF37]/20" />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-[13px] text-[#6D2B35] group-hover:text-[#D4AF37] transition-colors leading-snug">{katha.title}</h3>
                          <p className="text-[11px] text-[#D4AF37] font-medium mt-0.5">{katha.titleHindi}</p>
                          <p className="text-[11.5px] text-[#5a4a3a]/60 mt-1.5 line-clamp-2 leading-relaxed">{language === "hindi" ? katha.descriptionHindi : katha.description}</p>
                          <div className="flex items-center gap-3 mt-2">
                            <span className="inline-flex items-center gap-1 text-[10px] text-[#5a4a3a]/55 uppercase tracking-[0.15em] font-semibold">
                              <Sparkles className="h-2.5 w-2.5" /> AI Story
                            </span>
                            <span className="inline-flex items-center gap-1 text-[10px] text-[#5a4a3a]/55 uppercase tracking-[0.15em] font-semibold">
                              <Volume2 className="h-2.5 w-2.5" /> Audio
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-[#5a4a3a]/30 group-hover:text-[#D4AF37] flex-shrink-0 mt-1 transition-colors" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {!selectedGod && (
              <div className="text-center mt-4">
                <button
                  onClick={() => setShowAllKathas(!showAllKathas)}
                  className={OUTLINE_BTN}
                  data-testid="btn-view-all"
                >
                  <BookOpen className="h-4 w-4" strokeWidth={1.8} /> {showAllKathas ? "Hide All Kathas" : `View All ${ALL_KATHAS.length} Kathas`}
                </button>
              </div>
            )}

            {showAllKathas && !selectedGod && (
              <div className="mt-8">
                <div className="flex items-center gap-2.5 mb-4">
                  <span className="h-px w-6 bg-[#D4AF37]" />
                  <span className="text-[#D4AF37] text-[10px] uppercase tracking-[0.3em] font-semibold">Complete Library</span>
                </div>
                <h2 className="font-serif text-xl text-[#6D2B35] mb-5">All {ALL_KATHAS.length} Sacred Kathas</h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {ALL_KATHAS.map((katha, i) => (
                    <button
                      key={`all-${i}`}
                      onClick={() => openKatha(katha.godName, katha.title)}
                      className="rounded-md border border-[#D4AF37]/25 bg-white p-4 hover:border-[#D4AF37]/55 transition-colors text-left group"
                      data-testid={`all-katha-${i}`}
                    >
                      <div className="flex items-start gap-3">
                        <img src={DEITY_IMAGES[katha.godId]} alt={katha.godName} className="w-12 h-14 rounded-md object-cover object-top flex-shrink-0 border border-[#D4AF37]/20" />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-[13px] text-[#6D2B35] group-hover:text-[#D4AF37] transition-colors leading-snug">{katha.title}</h3>
                          <p className="text-[11px] text-[#D4AF37] font-medium mt-0.5">{katha.titleHindi}</p>
                          <p className="text-[11.5px] text-[#5a4a3a]/60 mt-1.5 line-clamp-2 leading-relaxed">{language === "hindi" ? katha.descriptionHindi : katha.description}</p>
                          <p className="text-[10px] text-[#5a4a3a]/55 mt-2 uppercase tracking-[0.15em] font-semibold flex items-center gap-1.5">
                            {katha.godName} · <Sparkles className="h-2.5 w-2.5" /> AI · Audio
                          </p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-[#5a4a3a]/30 group-hover:text-[#D4AF37] flex-shrink-0 mt-1 transition-colors" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        <PageAPlusContent
          eyebrow="Why Listen to Katha on Vedic Tatva"
          title="Hindu Kathas — Sundarkand, Ramayana, Bhagavad Gita Audio Online"
          intro="Sacred kathas are the soul of Sanatan Dharma. Vedic Tatva offers authentic recitations of Sundarkand, Hanuman Chalisa, Bhagavad Gita, Ramcharitmanas, Vishnu Sahasranama, Devi Mahatmya and more — narrated by traditional acharyas with original Sanskrit, Hindi translation and English meaning."
          trustBadges={[
            { value: "100+", label: "Sacred Texts" },
            { value: "Audio", label: "Streaming Free" },
            { value: "12+", label: "Languages" },
            { value: "Free", label: "Forever" },
          ]}
          benefits={[
            { icon: Volume2, title: "Authentic Audio Recitation", body: "Every katha narrated by traditional Vedic acharyas with correct Sanskrit pronunciation, intonation (svara) and pace." },
            { icon: BookOpen, title: "Original + Translation", body: "Read the original Sanskrit/Hindi shloka alongside translations in English, Hindi, Tamil, Telugu, Kannada, Bengali and other regional languages." },
            { icon: Heart, title: "Sundarkand & Hanuman Chalisa", body: "Daily recitation of Sundarkand removes obstacles, Hanuman Chalisa builds courage. Listen anytime, anywhere — at home, work or travel." },
            { icon: Flame, title: "Bhagavad Gita & Sahasranamas", body: "Complete Bhagavad Gita with chapter-wise breakdown, plus Vishnu Sahasranama, Lalita Sahasranama and Shiva Sahasranama — for daily parayan." },
            { icon: Star, title: "Devi Mahatmya & Durga Saptashati", body: "Sacred Shakti texts for Navaratri and daily devotion — full audio with Sanskrit, transliteration and meaning." },
            { icon: Sparkles, title: "Bookmark & Offline", body: "Bookmark favourite shlokas, download for offline listening, share verses with family — keep daily parayan effortless." },
          ]}
          steps={[
            { title: "Choose Your Katha", body: "Browse from Sundarkand, Hanuman Chalisa, Bhagavad Gita, Ramcharitmanas, Devi Mahatmya, Vishnu Sahasranama and 100+ sacred texts." },
            { title: "Pick Language", body: "Select your preferred language — Sanskrit (original), Hindi, English, Tamil, Telugu, Kannada, Bengali, Marathi or Gujarati." },
            { title: "Listen or Read", body: "Stream the audio recitation while reading the synchronised text. Pause, rewind and bookmark as you wish." },
            { title: "Daily Parayan", body: "Set a daily reading goal — finish Sundarkand in 7 days, Bhagavad Gita in 18 days. Track your progress and earn punya." },
          ]}
          faqs={[
            { q: "What are kathas in Hindu tradition?", a: "Kathas are sacred narratives — stories, hymns and shastric texts — passed down through generations to teach dharma, bhakti and life wisdom. Listening to or reciting kathas (parayan) is considered a powerful spiritual practice that purifies the mind and accumulates punya." },
            { q: "Why is Sundarkand recited regularly?", a: "Sundarkand (the 5th canto of Ramcharitmanas/Valmiki Ramayana) describes Hanuman's journey to Lanka. It's considered the most powerful section for removing obstacles, fears and difficulties. Tuesday and Saturday Sundarkand parayan is a centuries-old tradition." },
            { q: "Can I listen to Bhagavad Gita audio in chapters?", a: "Yes — all 18 chapters of Bhagavad Gita are available as separate audio tracks. You can listen chapter-by-chapter (one chapter per day = 18-day parayan) or shloka-by-shloka with Sanskrit, Hindi and English meaning." },
            { q: "Is the audio recitation traditional?", a: "Yes — all our recitations are by traditional Vedic acharyas (not actors or modern singers) trained in correct Sanskrit pronunciation, svara (intonation) and parampara. The recordings preserve the authentic vibration (mantra shakti) of each text." },
            { q: "Can I download for offline listening?", a: "Yes — premium members can download any katha for offline listening. Free users can stream unlimited online. All audio is high-quality MP3 for clear listening on any device." },
            { q: "Are translations available in regional languages?", a: "Yes — translations available in Hindi, English, Tamil, Telugu, Kannada, Bengali, Marathi, Gujarati, Malayalam and Punjabi. Sanskrit text is always shown alongside transliteration so you can follow even if you don't read Devanagari." },
            { q: "What is the spiritual benefit of listening to katha?", a: "Listening to katha (shravan) is one of the nine paths of bhakti (navavidha bhakti). It purifies the mind, awakens devotion, removes negative samskaras, and builds spiritual merit. Many devotees report increased peace, clarity and strength from daily katha listening." },
            { q: "Is everything really free?", a: "Yes — streaming all kathas online is completely free. Premium features (offline download, ad-free experience, advanced bookmarks, group parayan tracking) are part of optional Vedic Tatva membership." },
          ]}
          keywordsBlurb="Listen to Hindu kathas online — Sundarkand path, Hanuman Chalisa, Bhagavad Gita audio, Ramcharitmanas, Vishnu Sahasranama, Lalita Sahasranama, Shiva Sahasranama, Devi Mahatmya, Durga Saptashati, Shrimad Bhagavatam, Garuda Purana, Shiva Purana. Free Sanskrit shlokas with Hindi and English translation. Vedic acharya recitations in authentic svara. Daily parayan tracker, offline download, bookmark verses. Hindu scriptures audio in Hindi, Tamil, Telugu, Kannada, Bengali, Marathi, Gujarati and 12+ Indian languages. Sundarkand for Tuesday and Saturday parayan, Hanuman Chalisa for daily recitation."
        />

        <RelatedServicesSection context="katha" currentPath="/kathas" />
      </div>
    </div>
  );
}
