// Canonical kathas corpus — seeds AI with authentic source material.
//
// Every entry is sourced from named scripture (Skanda Purana, Bhagavata,
// Shiva Purana, Valmiki Ramayana, Mahabharata Vyasa, etc.). The AI is
// fed the canonical seed and rewrites it as a devotional narrative —
// it is NOT free to invent plot points.

export interface KathaSeed {
  // Match keys (case/diacritic insensitive). Multiple entries match → first wins.
  match: RegExp[];
  source: string;            // canonical text + chapter/parva
  centralDeity: string;
  keyCharacters: string[];   // names that MUST appear
  plotBeats: string[];       // 6-10 concrete plot beats in order
  canonicalMantra?: { sanskrit: string; translation: string };
  moral: string;
  significance: string;
  tags: string[];            // for search
}

export const KATHA_CORPUS: KathaSeed[] = [
  {
    match: [/birth\s+of\s+lord\s+ganesha/i, /गणेश\s*का?\s*जन्म/, /how\s+ganesha\s+got\s+his\s+elephant\s+head/i],
    source: "Shiva Purana, Rudra Samhita, Kumara Khanda, Chapters 13–18",
    centralDeity: "Lord Ganesha",
    keyCharacters: ["Goddess Parvati", "Lord Shiva", "Nandi", "the ganas", "the devas"],
    plotBeats: [
      "Parvati, while Shiva is away on Mount Kailasa meditation, longs for a guardian who serves only her.",
      "She forms a boy-child from the sandalwood paste (or turmeric, per other recensions) of her own body and breathes life into him — Vinayaka.",
      "She instructs the boy to guard the entrance to her bath chamber and let no one enter.",
      "Shiva returns and is denied entry by the unknown boy. Shiva sends his ganas (and Nandi), who are all defeated.",
      "Enraged, Shiva himself battles the boy and severs his head with the trishula.",
      "Parvati emerges, sees her child slain, and unleashes a cosmic fury that threatens all creation.",
      "To pacify her, Shiva commands the devas to bring the head of the first being they find sleeping with its head pointing North — they return with a young elephant.",
      "Shiva fixes the elephant's head onto the boy's body and revives him with the Mahamrityunjaya power. Brahma, Vishnu, and the devas grant him boons.",
      "He is named Ganesha (Ganapati — lord of the ganas) and declared first to be worshipped before any deity, ritual, or undertaking.",
    ],
    canonicalMantra: { sanskrit: "वक्रतुण्ड महाकाय सूर्यकोटि समप्रभ। निर्विघ्नं कुरु मे देव सर्वकार्येषु सर्वदा॥", translation: "O curved-trunked, mighty-bodied Lord, radiant as a million suns — make all my undertakings free of obstacles, always." },
    moral: "True devotion may take the form of duty. Even the Lord Himself recognises and honours unwavering loyalty.",
    significance: "Establishes Ganesha as Pratham Pujya — worshipped first in every Hindu ritual. The katha is recited at Ganesh Chaturthi and before all auspicious beginnings.",
    tags: ["ganesha", "ganesh chaturthi", "parvati", "shiva", "pratham pujya", "elephant head"],
  },
  {
    match: [/ganesha.*moon('?s)?\s*curse/i, /moon('?s)?\s*curse.*ganesha/i, /चंद्रमा.*श्राप/, /गणेश.*चंद्रमा/],
    source: "Bhagavata Purana 10.56–57, Brahma Vaivarta Purana, Ganesha Khanda Ch. 12",
    centralDeity: "Lord Ganesha",
    keyCharacters: ["Lord Ganesha", "Mooshika (his mouse vahana)", "Chandra (the Moon)", "Krishna (in the Bhagavata layer)"],
    plotBeats: [
      "On the day of Bhadrapada Shukla Chaturthi, Ganesha visits Kubera's feast and consumes vast quantities of modaks.",
      "Riding home on his mouse Mooshika, a serpent crosses their path; the mouse stumbles and Ganesha falls, his belly bursts open, and the modaks spill out.",
      "Ganesha calmly gathers the modaks, ties his belly with the very serpent as a girdle, and continues home.",
      "The Moon, Chandra, witnesses this scene and laughs aloud at the Lord's appearance.",
      "Furious at the Moon's pride and disrespect, Ganesha curses Chandra: 'Whoever beholds you on this Chaturthi night will be falsely accused and disgraced.'",
      "Realising the curse will harm humanity too, the devas plead with Ganesha to relent.",
      "Ganesha modifies the curse: Chandra will wax and wane (origin of the lunar phases); only those who view the Moon on Bhadrapada Shukla Chaturthi will face the dosha.",
      "The remedy is to listen to or recite the Syamantaka katha (from the Bhagavata) — this absolves the dosha.",
    ],
    canonicalMantra: { sanskrit: "सिंहः प्रसेनमवधीत् सिंहो जाम्बवता हतः। सुकुमारक मा रोदीस्तव ह्येष स्यमन्तकः॥", translation: "The lion killed Prasena, the lion was killed by Jambavan — O child, do not weep, this Syamantaka jewel is yours. (Recited to absolve Chaturthi-darshan dosha.)" },
    moral: "Pride and ridicule, even from the celestial, invite divine correction. Compassion of the Lord still preserves a remedial path.",
    significance: "Establishes the prohibition of viewing the Moon on Ganesh Chaturthi (Bhadrapada Shukla Chaturthi) and the Syamantaka katha as the prescribed remedy.",
    tags: ["ganesha", "moon", "chaturthi", "syamantaka", "curse", "lunar phases"],
  },
  {
    match: [/ganesha.*race.*world/i, /ganesha.*kartikeya/i, /परिक्रमा/, /गणेश.*कार्तिकेय/],
    source: "Shiva Purana, Rudra Samhita, Kumara Khanda Ch. 18; Ganesha Purana 2.79",
    centralDeity: "Lord Ganesha",
    keyCharacters: ["Lord Shiva", "Goddess Parvati", "Ganesha", "Kartikeya (Murugan/Skanda)", "Narada"],
    plotBeats: [
      "Sage Narada brings a divine fruit (the fruit of supreme wisdom/immortality) to Shiva and Parvati.",
      "Both sons — Ganesha and Kartikeya — claim the fruit. The parents declare a contest: whoever circumambulates the world (Bhuloka) three times first wins it.",
      "Kartikeya immediately mounts his peacock vahana and flies off at great speed to circle the earth.",
      "Ganesha, large-bodied with a small mouse vahana, pauses, contemplates, and chooses a different path.",
      "Ganesha reverently circles his parents Shiva and Parvati three times.",
      "He explains: 'For me, my parents are the entire world — to circumambulate them is to circumambulate the universe.' (Mata-Pita Pratham Devo)",
      "Shiva and Parvati, moved by his wisdom and devotion, award him the fruit.",
      "Kartikeya returns, learns the outcome, and (in some recensions) departs in displeasure to Palani Hill where he is worshipped.",
    ],
    canonicalMantra: { sanskrit: "मातृ देवो भव। पितृ देवो भव।", translation: "Revere your mother as a god. Revere your father as a god. (Taittiriya Upanishad 1.11.2)" },
    moral: "True wisdom recognises the divine in one's parents. Devotion to mother and father is the highest pilgrimage.",
    significance: "The foundational story of filial reverence in Hindu tradition. Recited to instil respect for parents and to honour Ganesha's discerning intelligence.",
    tags: ["ganesha", "kartikeya", "parvati", "shiva", "wisdom", "race", "parents"],
  },
  {
    match: [/shiva.*drink.*poison/i, /samudra\s*manth/i, /समुद्र\s*मंथन/, /neelkanth/i, /नीलकंठ/],
    source: "Bhagavata Purana 8.6–8.9, Mahabharata Adi Parva 18, Vishnu Purana 1.9",
    centralDeity: "Lord Shiva (with Lord Vishnu as Kurma)",
    keyCharacters: ["Devas (led by Indra)", "Asuras (led by Bali)", "Lord Vishnu (as Kurma the tortoise & Mohini)", "Mount Mandara", "Vasuki (the serpent)", "Lord Shiva", "Goddess Lakshmi", "Dhanvantari", "Halahala (the poison)"],
    plotBeats: [
      "The devas, weakened by Sage Durvasa's curse, lose their strength and seek the nectar of immortality (amrit).",
      "Vishnu instructs them to ally with the asuras to churn the cosmic ocean (Kshira Sagara).",
      "Mount Mandara is used as the churning rod, and the serpent Vasuki as the rope. Devas hold the tail, asuras the head.",
      "The mountain begins to sink. Vishnu incarnates as Kurma (the tortoise) and supports it on his back.",
      "First emerges the deadly Halahala poison — its fumes alone threaten to destroy all creation.",
      "All devas and asuras flee. The devas pray to Lord Shiva, who alone can absorb it.",
      "Shiva, out of supreme compassion, drinks the entire Halahala. Parvati grasps his throat to prevent it from descending into his stomach (which holds the universe).",
      "The poison stays held in his throat, turning it blue — and Shiva is named Neelkanth (the blue-throated one).",
      "Churning continues — Kamadhenu (cow), Airavata (white elephant), Parijata tree, Apsaras, Chandra (Moon), Lakshmi (who chooses Vishnu), Varuni, Dhanvantari with the amrit kalasha emerge in succession.",
      "Mohini (Vishnu's enchantress form) tricks the asuras and distributes the amrit to the devas alone.",
    ],
    canonicalMantra: { sanskrit: "ॐ नमः शिवाय।", translation: "Salutations to the auspicious Lord Shiva." },
    moral: "Supreme compassion drinks even poison so that others may live. Selfless sacrifice transforms destruction into divinity.",
    significance: "The Samudra Manthan is recounted at every cosmic-renewal puja. Shiva's act establishes him as the Mahadeva — the great god of compassion. The story is the template for selfless leadership.",
    tags: ["shiva", "samudra manthan", "neelkanth", "vishnu", "kurma", "lakshmi", "amrit", "ocean"],
  },
  {
    match: [/marriage.*shiva.*parvati/i, /shiva.*parvati.*wedding/i, /शिव[\-\s]*पार्वती\s*विवाह/],
    source: "Shiva Purana, Rudra Samhita, Parvati Khanda; Skanda Purana, Maheshvara Khanda",
    centralDeity: "Lord Shiva and Goddess Parvati",
    keyCharacters: ["Parvati (Sati reborn)", "Lord Shiva", "Himavan & Mena (Parvati's parents)", "the Saptarishis (Seven Sages)", "Brahma", "Vishnu", "Kamadeva (whom Shiva burns with his third eye)"],
    plotBeats: [
      "After Sati's self-immolation in Daksha's yajna, she is reborn as Parvati, daughter of Himavan and Mena.",
      "From childhood Parvati knows she will marry Lord Shiva and serves him daily.",
      "Shiva is in deep tapas on Kailasa, indifferent to all worldly affairs after Sati's loss.",
      "The devas, troubled by demon Tarakasura (who can only be slain by Shiva's son), send Kamadeva to break Shiva's meditation.",
      "Shiva opens his third eye and incinerates Kamadeva (giving rise to his name Ananga — bodiless).",
      "Parvati undertakes severe tapas — the most rigorous penances — through summers, monsoons, and snow, surviving on a single bilva leaf, then air alone.",
      "The Saptarishis arrive disguised to test Parvati's resolve, criticising Shiva — she rebukes them firmly.",
      "Shiva himself appears in the form of an old Brahmin, again testing her — she refuses to hear ill of him.",
      "Pleased, Shiva accepts her. Himavan welcomes the marriage proposal. The grand wedding is held with all devas, sages, and Brahma as the priest.",
      "Parvati's mother Mena is shocked at Shiva's appearance with ash, snakes, and ghoulish ganas — Vishnu and Brahma reassure her, and Shiva reveals his luminous svarupa.",
    ],
    canonicalMantra: { sanskrit: "कात्यायनि महामाये महायोगिन्यधीश्वरि। नन्दगोपसुतं देवि पतिं मे कुरु ते नमः॥", translation: "O Katyayani, great Maya, supreme Yogini and Empress — bless me with the husband of my heart's devotion. (Recited by maidens for an auspicious marriage.)" },
    moral: "Unshakable bhakti and tapas earn what no force can compel. The divine marriage of consciousness (Shiva) and energy (Shakti) is the foundation of all creation.",
    significance: "Recited during marriage ceremonies and Mahashivaratri. Establishes Parvati's tapas as the model of devotion and the Shiva-Shakti union as the cosmic principle.",
    tags: ["shiva", "parvati", "marriage", "tapas", "mahashivaratri", "shiva shakti"],
  },
  {
    match: [/dashavatar/i, /ten\s*incarnations/i, /vishnu.*avatars/i, /दशावतार/],
    source: "Bhagavata Purana Skandha 1.3 & Skandhas 6–11; Garuda Purana, Acharakanda 86",
    centralDeity: "Lord Vishnu",
    keyCharacters: ["Vishnu", "King Manu", "Hiranyakashipu & Prahlad", "Bali", "Parashurama", "Rama & Sita", "Krishna & Radha", "Buddha", "Kalki"],
    plotBeats: [
      "Matsya: Vishnu as a fish saves Manu and the seven sages and the Vedas during the great pralaya (cosmic flood).",
      "Kurma: Vishnu as a tortoise supports Mount Mandara during the Samudra Manthan, allowing amrit to be churned forth.",
      "Varaha: Vishnu as a boar lifts the Earth (Bhudevi) from cosmic waters after the asura Hiranyaksha hides her.",
      "Narasimha: Vishnu as half-man-half-lion slays Hiranyakashipu — neither man nor beast, neither inside nor outside, neither day nor night — to save bhakta Prahlad.",
      "Vamana: Vishnu as a dwarf Brahmin asks King Bali for three steps of land, then grows cosmic and covers all three lokas in three strides.",
      "Parashurama: Vishnu as the warrior-Brahmin with axe, who twenty-one times rids the earth of unrighteous kshatriyas after his father Jamadagni is wronged.",
      "Rama: Vishnu as Maryada Purushottama, the perfect king, slays Ravana to restore dharma — narrated in the Valmiki Ramayana.",
      "Krishna: Vishnu as Yogeshwara, who delivers the Bhagavad Gita to Arjuna and establishes dharma at Kurukshetra.",
      "Buddha (per Bhagavata): Vishnu incarnates to redirect those misusing the Vedas, teaching ahimsa and inner inquiry.",
      "Kalki: the future avatara, prophesied to appear at the end of Kali Yuga riding a white horse, wielding a flaming sword to end adharma and restore Satya Yuga.",
    ],
    canonicalMantra: { sanskrit: "यदा यदा हि धर्मस्य ग्लानिर्भवति भारत। अभ्युत्थानमधर्मस्य तदात्मानं सृजाम्यहम्॥", translation: "Whenever there is decay of dharma, O Bharata, and a rise of adharma, then I manifest myself. (Bhagavad Gita 4.7)" },
    moral: "Dharma is never abandoned by the Divine. Across yugas, the Lord descends in the form needed to restore balance.",
    significance: "The Dashavatara is the central narrative arc of Vaishnava theology. Recited during Vaikuntha Ekadashi, Janmashtami, and Rama Navami; depicted in temple iconography across India.",
    tags: ["vishnu", "dashavatar", "matsya", "kurma", "narasimha", "vamana", "rama", "krishna", "kalki"],
  },
  {
    match: [/narasimha/i, /hiranyakashipu/i, /नरसिंह/, /हिरण्यकशिपु/],
    source: "Bhagavata Purana Skandha 7, Chapters 1–10",
    centralDeity: "Lord Narasimha (Vishnu's fourth avatar)",
    keyCharacters: ["Hiranyakashipu", "Prahlad", "Lord Brahma (boon-giver)", "Lord Narasimha", "Holika (sister of Hiranyakashipu)"],
    plotBeats: [
      "Hiranyakashipu, after his brother Hiranyaksha is slain by Vishnu (as Varaha), performs severe tapas to Brahma for invincibility.",
      "Brahma grants him a boon: he cannot be killed by man or beast, by day or night, indoors or outdoors, on earth or sky, by any weapon, in any of the four primary states.",
      "Empowered, Hiranyakashipu conquers the three lokas, banishes Vishnu's worship, and demands he alone be worshipped.",
      "His own son Prahlad, however, is a born devotee of Vishnu. The boy refuses to abandon his devotion despite his father's pleas.",
      "Hiranyakashipu attempts to kill Prahlad — throws him from cliffs, has him trampled by elephants, has serpents bite him. Each time Vishnu invisibly protects.",
      "Holika, his sister, immune to fire by boon, sits with Prahlad in a fire — but Holika burns and Prahlad emerges unscathed (origin of Holika Dahan and Holi).",
      "Enraged, Hiranyakashipu drags Prahlad to a pillar in the assembly hall and demands: 'Where is your Vishnu — in this pillar?' Prahlad answers, 'Yes, He is everywhere, even there.'",
      "Hiranyakashipu strikes the pillar — it bursts open, and Lord Narasimha (half-man, half-lion) emerges with terrible roar.",
      "At twilight (neither day nor night), on the threshold of his palace (neither indoors nor outdoors), placing him on his thighs (neither earth nor sky), with his claws (no weapon), Narasimha disembowels Hiranyakashipu — fulfilling and bypassing every boon.",
      "Narasimha's fury cannot be calmed by the devas; only Prahlad's gentle bhakti pacifies him. Narasimha blesses Prahlad and crowns him king.",
    ],
    canonicalMantra: { sanskrit: "उग्रं वीरं महाविष्णुं ज्वलन्तं सर्वतोमुखम्। नृसिंहं भीषणं भद्रं मृत्युमृत्युं नमाम्यहम्॥", translation: "I bow to the fierce, valorous, all-blazing, all-faced great Vishnu — Narasimha, terrible yet auspicious — the death of death itself." },
    moral: "Devotion (bhakti) is the ultimate refuge. No boon, no power, no fortress can stand against pure surrender to the Divine.",
    significance: "Recited on Narasimha Jayanti (Vaishakha Shukla Chaturdashi) and during Holika Dahan eve. The story is the foundational template for Vishnu's protection of his devotees.",
    tags: ["narasimha", "vishnu", "hiranyakashipu", "prahlad", "holi", "holika", "bhakti"],
  },
  {
    match: [/hanuman.*sanjeevani/i, /sanjeevani/i, /द्रोणगिरि/, /संजीवनी/],
    source: "Valmiki Ramayana, Yuddha Kanda, Sargas 73–74; Tulsidas Ramcharitmanas, Lanka Kanda",
    centralDeity: "Lord Hanuman",
    keyCharacters: ["Hanuman", "Lakshmana", "Lord Rama", "Vibhishana", "Sushena (vaidya)", "Indrajit (Meghnad — Ravana's son)", "Kalanemi (demon disguised as a rishi)"],
    plotBeats: [
      "In the war at Lanka, Indrajit strikes Lakshmana with the deadly Shakti astra. Lakshmana falls unconscious, life ebbing.",
      "Vibhishana sends for Sushena, the master physician of Lanka, who declares that only four sanjeevani herbs from Mount Dronagiri (in the Himalayas) can save him — and they must be brought before sunrise.",
      "Hanuman expands to gigantic form and flies northward across the entire subcontinent in moments.",
      "Ravana sends the demon Kalanemi disguised as a rishi to delay Hanuman with hospitality. Hanuman senses the deceit, slays Kalanemi, and continues.",
      "Reaching the Himalayas, Hanuman cannot identify the four specific herbs, which are said to glow at night.",
      "Without hesitation, Hanuman uproots the entire Mount Dronagiri and carries it back to Lanka on his palm.",
      "On the return flight, Bharata sees a celestial form passing over Ayodhya and shoots an arrow believing it a demon — Hanuman falls, identifies himself, blesses Bharata, and continues.",
      "Sushena administers the herbs and Lakshmana revives before sunrise. Rama embraces Hanuman, declaring his debt to him eternal.",
      "Hanuman returns the mountain to its place. The herbs that fell over Sri Lanka are still said to flourish there.",
    ],
    canonicalMantra: { sanskrit: "मनोजवं मारुततुल्यवेगं जितेन्द्रियं बुद्धिमतां वरिष्ठम्। वातात्मजं वानरयूथमुख्यं श्रीरामदूतं शरणं प्रपद्ये॥", translation: "Swift as thought, fast as the wind, master of the senses, foremost of the wise — son of Vayu, chief of the vanaras, messenger of Sri Rama — I take refuge in you." },
    moral: "When the task is impossible and time is short, devotion summons strength beyond measure. A devotee acts not for credit but for the Lord's purpose.",
    significance: "Recited on Hanuman Jayanti and during Tuesday-Saturday Hanuman pujas. Symbolises that bhakti accomplishes what intellect cannot; the herbs of Dronagiri are still searched for in the Himalayas.",
    tags: ["hanuman", "sanjeevani", "lakshmana", "ramayana", "dronagiri", "ravana"],
  },
  {
    match: [/krishna.*govardhan/i, /lifts?\s+govardhan/i, /गोवर्धन/],
    source: "Bhagavata Purana Skandha 10, Chapters 24–27",
    centralDeity: "Lord Krishna",
    keyCharacters: ["Krishna", "Nanda Maharaja", "Yashoda", "Indra", "the cowherds (gopas)", "the cows (gomata)", "the gopis"],
    plotBeats: [
      "Krishna, as a young boy in Vrindavan, observes the elaborate annual yajna being prepared for Indra (the rain-god).",
      "He questions his father Nanda: 'What sustains us — the rains, or the grass and trees the cattle feed on?'",
      "He persuades the cowherds that they should worship Govardhan Hill and the cows directly, not Indra. The community agrees.",
      "Indra, enraged at being denied his offering, summons the Samvartaka clouds — the apocalyptic storm-clouds — to drown Vrindavan.",
      "Torrential rain, hail, and lightning fall continuously. The cowherds, cows, and gopis cry to Krishna for protection.",
      "Krishna lifts the entire Govardhan Hill on his little finger — the kanishta anguli of his left hand — and holds it as a giant umbrella.",
      "All of Vrindavan — humans, cows, calves — shelter beneath it for seven full days and nights without harm.",
      "Indra, his pride shattered, realises Krishna's divinity. He descends with Kamadhenu and Airavata, washes Krishna's feet with the milk of the celestial cow, and crowns him 'Govinda' — protector of the cows.",
      "Krishna establishes the festival of Govardhan Puja (Annakut), celebrated the day after Diwali — where mountains of food are offered to the Lord and to the cows.",
    ],
    canonicalMantra: { sanskrit: "गोवर्धनधराधार गोपाल गोपीजनप्रिय। यशोदानन्दन कृष्ण देवकीनन्दन वन्दे॥", translation: "I bow to Krishna — bearer of Govardhan, protector of the cowherds, beloved of the gopis, the joy of Yashoda and Devaki." },
    moral: "True worship honours the Earth and her creatures who sustain us. The Lord protects those who recognise the divine in nature.",
    significance: "Govardhan Puja / Annakut is celebrated annually on the day after Diwali. The story is foundational to Vaishnava ecological thought and to Krishna's identity as Govinda — the cow-protector.",
    tags: ["krishna", "govardhan", "indra", "vrindavan", "annakut", "diwali", "govinda"],
  },
  {
    match: [/krishna.*sudama/i, /sudama/i, /सुदामा/],
    source: "Bhagavata Purana Skandha 10, Chapters 80–81",
    centralDeity: "Lord Krishna",
    keyCharacters: ["Sudama (Kuchela)", "Krishna", "Rukmini", "Sudama's wife", "the children of Sudama"],
    plotBeats: [
      "Sudama, a poor Brahmin, is Krishna's gurukul classmate at Sandipani Muni's ashram — they had once shared a meal of chickpeas in the forest in childhood.",
      "Years later, Sudama lives in extreme poverty with his wife and children — sometimes without food for days.",
      "Sudama's wife urges him to visit Krishna, now king of Dwarka, for help. Sudama is reluctant — he does not want to ask his friend for anything.",
      "She insists, but Sudama has no fitting gift. She gathers a small handful of beaten rice (poha/aval) wrapped in a torn cloth.",
      "Sudama walks the long road to Dwarka, ashamed of his poverty.",
      "When announced at the palace, Krishna leaps from his throne, runs to embrace Sudama, washes his dusty feet with his own hands, seats him on his throne, and weeps with joy at seeing his friend.",
      "Embarrassed by his humble gift, Sudama tries to hide it — but Krishna playfully snatches it and eats one handful with great relish.",
      "As Krishna eats the second handful, Rukmini gently stops him — saying that what he has already given Sudama is more than the three lokas can hold.",
      "Sudama, overwhelmed by Krishna's love, never finds the courage to ask for anything. He returns home empty-handed.",
      "Reaching home he discovers his hut has become a magnificent palace, his wife in royal silks, his children well-fed — Krishna had silently transformed everything in answer to his unspoken need.",
    ],
    canonicalMantra: { sanskrit: "अहं भक्तपराधीनो ह्यस्वतन्त्र इव द्विज। साधुभिर्ग्रस्तहृदयो भक्तैर्भक्तजनप्रियः॥", translation: "I am wholly under the control of My devotees — as if I have no independent will. My heart is held captive by them; I am the beloved of those who love their fellow devotees. (Bhagavata 9.4.63)" },
    moral: "True friendship transcends wealth and status. The Lord measures the devotee's heart, not the offering. What is given with love is multiplied infinitely.",
    significance: "Recited on Akshaya Tritiya and during friendship-and-bhakti satsangs. Sudama is the archetype of the silent devotee whose poverty conceals immense spiritual wealth.",
    tags: ["krishna", "sudama", "friendship", "dwarka", "poha", "bhakti", "akshaya tritiya"],
  },
];

// Find the best matching seed for a given title (case-insensitive).
export function findKathaSeed(title: string, god?: string): KathaSeed | null {
  const t = title.trim();
  for (const seed of KATHA_CORPUS) {
    if (seed.match.some(rx => rx.test(t))) return seed;
  }
  // Fallback: try matching by deity if title has no match
  if (god) {
    const g = god.toLowerCase();
    const byDeity = KATHA_CORPUS.filter(s => s.centralDeity.toLowerCase().includes(g));
    if (byDeity.length === 1) return byDeity[0];
  }
  return null;
}
