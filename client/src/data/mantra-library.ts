// Curated library of 30 widely-chanted Vedic / Sanatan mantras.
// Each entry uses the same shape as the AI mantra-assist response so the
// MysticMantraCounter can render either source identically.
//
// `audioUrl` is intentionally null by default — populate per-mantra with a
// direct MP3/OGG URL (CORS-enabled host) to enable in-browser playback.
// Users can also override any entry's audio at runtime via the focus-mode
// "Bring your own audio" input (persisted to localStorage).

export type LibraryMantra = {
  id: string;
  label: string;
  devanagari: string;
  transliteration: string;
  deity: string;
  meaning: string;
  recommendedCount: 27 | 54 | 108 | 1008;
  color: "gold" | "saffron" | "maroon" | "white" | "green" | "blue";
  category: "Universal" | "Shiva" | "Vishnu" | "Devi" | "Ganesha" | "Hanuman" | "Surya" | "Krishna" | "Rama" | "Healing";
  audioUrl: string | null;
};

export const MANTRA_LIBRARY: LibraryMantra[] = [
  // Universal
  { id: "om", label: "Om",
    devanagari: "ॐ", transliteration: "Om",
    deity: "Brahman", meaning: "The primordial sound — the seed of all creation, the unmanifest absolute.",
    recommendedCount: 108, color: "gold", category: "Universal", audioUrl: null },
  { id: "gayatri", label: "Gayatri Mantra",
    devanagari: "ॐ भूर्भुवः स्वः । तत्सवितुर्वरेण्यं । भर्गो देवस्य धीमहि । धियो यो नः प्रचोदयात् ॥",
    transliteration: "Om bhūr bhuvaḥ svaḥ, tat savitur vareṇyaṁ, bhargo devasya dhīmahi, dhiyo yo naḥ pracodayāt",
    deity: "Savitr (Sun)", meaning: "We meditate on the radiant glory of the Divine Sun; may it illumine our intellect.",
    recommendedCount: 108, color: "gold", category: "Universal", audioUrl: null },
  { id: "asato", label: "Asato Mā Sad Gamaya",
    devanagari: "ॐ असतो मा सद्गमय । तमसो मा ज्योतिर्गमय । मृत्योर्मा अमृतं गमय ॥",
    transliteration: "Om asato mā sad gamaya, tamaso mā jyotir gamaya, mṛtyor mā amṛtaṁ gamaya",
    deity: "Brahman", meaning: "Lead me from the unreal to the real, from darkness to light, from death to immortality.",
    recommendedCount: 54, color: "white", category: "Universal", audioUrl: null },
  { id: "shanti", label: "Shanti Mantra",
    devanagari: "ॐ शान्तिः शान्तिः शान्तिः ॥",
    transliteration: "Om Śāntiḥ Śāntiḥ Śāntiḥ",
    deity: "Brahman", meaning: "Peace of body, peace of mind, peace of spirit.",
    recommendedCount: 27, color: "white", category: "Universal", audioUrl: null },

  // Shiva
  { id: "om-namah-shivaya", label: "Om Namah Shivaya",
    devanagari: "ॐ नमः शिवाय",
    transliteration: "Om Namaḥ Śivāya",
    deity: "Shiva", meaning: "I bow to Shiva — the auspicious one, the consciousness within.",
    recommendedCount: 108, color: "maroon", category: "Shiva", audioUrl: null },
  { id: "mahamrityunjaya", label: "Mahamrityunjaya Mantra",
    devanagari: "ॐ त्र्यम्बकं यजामहे सुगन्धिं पुष्टिवर्धनम् । उर्वारुकमिव बन्धनान्मृत्योर्मुक्षीय मामृतात् ॥",
    transliteration: "Om tryambakaṁ yajāmahe sugandhiṁ puṣṭivardhanam; urvārukam iva bandhanān mṛtyor mukṣīya māmṛtāt",
    deity: "Shiva (Tryambaka)", meaning: "We worship the three-eyed one who nourishes all beings; may he liberate us from death like a ripe cucumber from its vine.",
    recommendedCount: 108, color: "maroon", category: "Healing", audioUrl: null },
  { id: "shivaya-namah-om", label: "Shivaya Namah Om",
    devanagari: "शिवाय नमः ॐ",
    transliteration: "Śivāya Namaḥ Om",
    deity: "Shiva", meaning: "Reversed form of the Panchakshara — turning inward toward the divine.",
    recommendedCount: 108, color: "maroon", category: "Shiva", audioUrl: null },
  { id: "rudra-gayatri", label: "Rudra Gayatri",
    devanagari: "ॐ तत्पुरुषाय विद्महे महादेवाय धीमहि । तन्नो रुद्रः प्रचोदयात् ॥",
    transliteration: "Om tatpuruṣāya vidmahe mahādevāya dhīmahi, tanno rudraḥ pracodayāt",
    deity: "Rudra-Shiva", meaning: "May the Great Lord Rudra guide our meditation and intellect.",
    recommendedCount: 108, color: "maroon", category: "Shiva", audioUrl: null },

  // Vishnu / Krishna / Rama
  { id: "om-namo-narayanaya", label: "Om Namo Narayanaya",
    devanagari: "ॐ नमो नारायणाय",
    transliteration: "Om Namo Nārāyaṇāya",
    deity: "Vishnu (Narayana)", meaning: "Salutations to Narayana — the refuge of all beings.",
    recommendedCount: 108, color: "blue", category: "Vishnu", audioUrl: null },
  { id: "vishnu-gayatri", label: "Vishnu Gayatri",
    devanagari: "ॐ नारायणाय विद्महे वासुदेवाय धीमहि । तन्नो विष्णुः प्रचोदयात् ॥",
    transliteration: "Om Nārāyaṇāya vidmahe Vāsudevāya dhīmahi, tanno Viṣṇuḥ pracodayāt",
    deity: "Vishnu", meaning: "May Lord Vishnu inspire our intellect.",
    recommendedCount: 108, color: "blue", category: "Vishnu", audioUrl: null },
  { id: "hare-krishna", label: "Hare Krishna Mahamantra",
    devanagari: "हरे कृष्ण हरे कृष्ण कृष्ण कृष्ण हरे हरे । हरे राम हरे राम राम राम हरे हरे ॥",
    transliteration: "Hare Kṛṣṇa Hare Kṛṣṇa, Kṛṣṇa Kṛṣṇa Hare Hare; Hare Rāma Hare Rāma, Rāma Rāma Hare Hare",
    deity: "Krishna & Rama", meaning: "The great mantra for deliverance — invoking the energies of the Divine Beloved.",
    recommendedCount: 108, color: "saffron", category: "Krishna", audioUrl: null },
  { id: "krishna-govinda", label: "Govinda Bolo Hari Gopal Bolo",
    devanagari: "गोविन्द बोलो हरि गोपाल बोलो",
    transliteration: "Govinda Bolo Hari Gopāla Bolo",
    deity: "Krishna", meaning: "Sing the names of Govinda, sing the names of Gopala.",
    recommendedCount: 108, color: "saffron", category: "Krishna", audioUrl: null },
  { id: "sri-ram-jai-ram", label: "Sri Ram Jai Ram Jai Jai Ram",
    devanagari: "श्री राम जय राम जय जय राम",
    transliteration: "Śrī Rāma Jaya Rāma Jaya Jaya Rāma",
    deity: "Rama", meaning: "Glory to Rama, victory to Rama — the thirteen-syllable mantra of Tulsidas.",
    recommendedCount: 108, color: "saffron", category: "Rama", audioUrl: null },
  { id: "ram-naam", label: "Ram Ram Ram",
    devanagari: "राम राम राम",
    transliteration: "Rāma Rāma Rāma",
    deity: "Rama", meaning: "The simplest, most powerful name — taken by Mahatma Gandhi until his last breath.",
    recommendedCount: 108, color: "saffron", category: "Rama", audioUrl: null },

  // Devi
  { id: "om-aim-saraswatyai", label: "Saraswati Mantra",
    devanagari: "ॐ ऐं सरस्वत्यै नमः",
    transliteration: "Om Aiṁ Sarasvatyai Namaḥ",
    deity: "Saraswati", meaning: "Salutations to Saraswati — for wisdom, learning, and the arts.",
    recommendedCount: 108, color: "white", category: "Devi", audioUrl: null },
  { id: "om-shrim-mahalakshmi", label: "Lakshmi Mantra",
    devanagari: "ॐ श्रीं महालक्ष्म्यै नमः",
    transliteration: "Om Śrīṁ Mahālakṣmyai Namaḥ",
    deity: "Lakshmi", meaning: "Salutations to Mahalakshmi — for abundance, prosperity, and grace.",
    recommendedCount: 108, color: "gold", category: "Devi", audioUrl: null },
  { id: "om-dum-durgayai", label: "Durga Mantra",
    devanagari: "ॐ दुं दुर्गायै नमः",
    transliteration: "Om Duṁ Durgāyai Namaḥ",
    deity: "Durga", meaning: "Salutations to Durga — the fierce protector who removes obstacles and grants strength.",
    recommendedCount: 108, color: "maroon", category: "Devi", audioUrl: null },
  { id: "kali-bija", label: "Kali Bija",
    devanagari: "ॐ क्रीं काल्यै नमः",
    transliteration: "Om Krīṁ Kālyai Namaḥ",
    deity: "Kali", meaning: "Invocation to Kali — the destroyer of ego and illusion.",
    recommendedCount: 108, color: "maroon", category: "Devi", audioUrl: null },
  { id: "devi-gayatri", label: "Devi Gayatri",
    devanagari: "ॐ कात्यायन्यै विद्महे कन्यकुमारि धीमहि । तन्नो देवी प्रचोदयात् ॥",
    transliteration: "Om Kātyāyanyai vidmahe Kanyakumāri dhīmahi, tanno Devī pracodayāt",
    deity: "Mahadevi", meaning: "May the Great Goddess inspire our consciousness.",
    recommendedCount: 108, color: "maroon", category: "Devi", audioUrl: null },

  // Ganesha
  { id: "om-gam-ganapataye", label: "Ganesha Mantra",
    devanagari: "ॐ गं गणपतये नमः",
    transliteration: "Om Gaṁ Gaṇapataye Namaḥ",
    deity: "Ganesha", meaning: "Salutations to Ganesha — the remover of obstacles, lord of new beginnings.",
    recommendedCount: 108, color: "saffron", category: "Ganesha", audioUrl: null },
  { id: "vakratunda", label: "Vakratunda Mahakaya",
    devanagari: "वक्रतुण्ड महाकाय सूर्यकोटि समप्रभ । निर्विघ्नं कुरु मे देव सर्वकार्येषु सर्वदा ॥",
    transliteration: "Vakratuṇḍa mahākāya sūryakoṭi samaprabha, nirvighnaṁ kuru me deva sarvakāryeṣu sarvadā",
    deity: "Ganesha", meaning: "O curved-trunked, mighty bodied one, brilliant as a million suns — make all my undertakings free of obstacles.",
    recommendedCount: 27, color: "saffron", category: "Ganesha", audioUrl: null },
  { id: "ganesha-gayatri", label: "Ganesha Gayatri",
    devanagari: "ॐ एकदन्ताय विद्महे वक्रतुण्डाय धीमहि । तन्नो दन्तिः प्रचोदयात् ॥",
    transliteration: "Om Ekadantāya vidmahe Vakratuṇḍāya dhīmahi, tanno Dantiḥ pracodayāt",
    deity: "Ganesha", meaning: "May the single-tusked Lord inspire our intellect.",
    recommendedCount: 108, color: "saffron", category: "Ganesha", audioUrl: null },

  // Hanuman
  { id: "hanuman-mantra", label: "Hanuman Mantra",
    devanagari: "ॐ हं हनुमते नमः",
    transliteration: "Om Haṁ Hanumate Namaḥ",
    deity: "Hanuman", meaning: "Salutations to Hanuman — for courage, devotion, and unwavering strength.",
    recommendedCount: 108, color: "saffron", category: "Hanuman", audioUrl: null },
  { id: "hanuman-bija", label: "Hanuman Bija",
    devanagari: "ॐ ऐं भ्रीं हनुमते श्री राम दूताय नमः",
    transliteration: "Om Aiṁ Bhrīṁ Hanumate Śrī Rāma Dūtāya Namaḥ",
    deity: "Hanuman", meaning: "Salutations to Hanuman, the messenger of Lord Rama — protection from fear.",
    recommendedCount: 108, color: "saffron", category: "Hanuman", audioUrl: null },

  // Surya
  { id: "om-suryaya-namah", label: "Surya Namaskar Mantra",
    devanagari: "ॐ सूर्याय नमः",
    transliteration: "Om Sūryāya Namaḥ",
    deity: "Surya", meaning: "Salutations to the Sun — for vitality, clarity, and life-force.",
    recommendedCount: 108, color: "gold", category: "Surya", audioUrl: null },
  { id: "aditya-hridaya", label: "Aditya Hridayam (opening)",
    devanagari: "आदित्य हृदयं पुण्यं सर्वशत्रुविनाशनम्",
    transliteration: "Āditya Hṛdayaṁ puṇyaṁ sarvaśatru-vināśanam",
    deity: "Surya", meaning: "The hymn to the Sun-heart — sacred and the destroyer of all enemies (told by Agastya to Rama).",
    recommendedCount: 27, color: "gold", category: "Surya", audioUrl: null },

  // Healing & special
  { id: "dhanvantari", label: "Dhanvantari Mantra",
    devanagari: "ॐ नमो भगवते वासुदेवाय धन्वन्तरये अमृतकलश हस्ताय",
    transliteration: "Om Namo Bhagavate Vāsudevāya Dhanvantaraye Amṛtakalaśa Hastāya",
    deity: "Dhanvantari", meaning: "Salutations to Dhanvantari, holding the pot of immortal nectar — for health and healing.",
    recommendedCount: 108, color: "green", category: "Healing", audioUrl: null },
  { id: "lokah-samastah", label: "Lokah Samastah Sukhino Bhavantu",
    devanagari: "लोकाः समस्ताः सुखिनो भवन्तु",
    transliteration: "Lokāḥ samastāḥ sukhino bhavantu",
    deity: "Universal", meaning: "May all beings everywhere be happy and free.",
    recommendedCount: 27, color: "green", category: "Universal", audioUrl: null },
  { id: "twameva-mata", label: "Twameva Mata",
    devanagari: "त्वमेव माता च पिता त्वमेव । त्वमेव बन्धुश्च सखा त्वमेव । त्वमेव विद्या द्रविणं त्वमेव । त्वमेव सर्वं मम देव देव ॥",
    transliteration: "Tvameva mātā ca pitā tvameva, tvameva bandhuś ca sakhā tvameva, tvameva vidyā draviṇaṁ tvameva, tvameva sarvaṁ mama deva deva",
    deity: "Brahman", meaning: "You are my mother, father, friend, kin, knowledge, wealth — you are everything to me, O Lord of lords.",
    recommendedCount: 27, color: "white", category: "Universal", audioUrl: null },
  { id: "sarve-bhavantu", label: "Sarve Bhavantu Sukhinah",
    devanagari: "सर्वे भवन्तु सुखिनः सर्वे सन्तु निरामयाः । सर्वे भद्राणि पश्यन्तु मा कश्चिद्दुःखभाग्भवेत् ॥",
    transliteration: "Sarve bhavantu sukhinaḥ, sarve santu nirāmayāḥ, sarve bhadrāṇi paśyantu, mā kaścid duḥkhabhāg bhavet",
    deity: "Universal", meaning: "May all be happy, may all be free of disease, may all see auspiciousness, may none suffer.",
    recommendedCount: 27, color: "green", category: "Universal", audioUrl: null },
];

export const LIBRARY_CATEGORIES = Array.from(new Set(MANTRA_LIBRARY.map((m) => m.category)));
