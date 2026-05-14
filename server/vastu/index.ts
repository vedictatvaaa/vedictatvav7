// Vastu Shastra rule engine — deterministic, scripture-based.
//
// Classical sources: Vishvakarma Vastu Shastra, Mayamatam, Manasara,
// Brihat Samhita (Varahamihira), Samarangana Sutradhara.
//
// The 8 cardinal/inter-cardinal directions each have:
//  - a presiding deity (devata)
//  - a ruling element (panchabhuta) and planet
//  - ideal/forbidden uses for rooms/utilities
//
// We compute fitness per room, detect classical doshas, and return
// scored findings that AI then narrates around.

export type Direction =
  | "North" | "North-East" | "East" | "South-East"
  | "South" | "South-West" | "West" | "North-West"
  | "Centre";

export interface DirectionMeta {
  name: Direction;
  hindi: string;
  deity: string;          // presiding devata
  element: string;        // panchabhuta
  planet: string;         // graha
  qualities: string;      // short character
  idealFor: string[];     // canonical room types
  avoidFor: string[];     // forbidden room types
}

export const DIRECTIONS: Record<Direction, DirectionMeta> = {
  "North": {
    name: "North", hindi: "उत्तर", deity: "Kubera (Lord of wealth)",
    element: "Water", planet: "Mercury",
    qualities: "Wealth, opportunity, career growth",
    idealFor: ["Living Room", "Study Room", "Office", "Cash Locker", "Water Tank", "Main Entrance"],
    avoidFor: ["Bathroom/Toilet", "Kitchen Stove", "Septic Tank", "Store Room"],
  },
  "North-East": {
    name: "North-East", hindi: "ईशान्य / ईशान कोण", deity: "Ishana (Shiva)",
    element: "Water + Ether", planet: "Jupiter",
    qualities: "Spirituality, clarity, prana, intuition — the most sacred zone",
    idealFor: ["Pooja Room", "Water Tank", "Well", "Main Entrance", "Study Room", "Living Room"],
    avoidFor: ["Kitchen", "Kitchen Stove", "Bathroom/Toilet", "Master Bedroom", "Septic Tank", "Store Room", "Staircase", "Garage"],
  },
  "East": {
    name: "East", hindi: "पूर्व", deity: "Indra (King of devas, Sun)",
    element: "Air", planet: "Sun",
    qualities: "Health, vitality, social success, fame",
    idealFor: ["Main Entrance", "Living Room", "Dining Room", "Bathroom (open window only)", "Children's Room"],
    avoidFor: ["Kitchen Stove", "Septic Tank", "Store Room", "Staircase"],
  },
  "South-East": {
    name: "South-East", hindi: "आग्नेय / आग्नेय कोण", deity: "Agni (Fire)",
    element: "Fire", planet: "Venus",
    qualities: "Digestion, energy, finances, health of the woman of the house",
    idealFor: ["Kitchen", "Kitchen Stove", "Electrical Panel", "Generator"],
    avoidFor: ["Pooja Room", "Master Bedroom", "Children's Room", "Water Tank", "Main Entrance"],
  },
  "South": {
    name: "South", hindi: "दक्षिण", deity: "Yama (Lord of dharma & time)",
    element: "Earth", planet: "Mars",
    qualities: "Stability, fame, ancestral merit",
    idealFor: ["Master Bedroom", "Store Room", "Garage", "Heavy Furniture"],
    avoidFor: ["Pooja Room", "Main Entrance", "Water Tank", "Septic Tank (NE corner of S only)", "Children's Room"],
  },
  "South-West": {
    name: "South-West", hindi: "नैऋत्य / नैऋत्य कोण", deity: "Niruti (Pitra/ancestors)",
    element: "Earth", planet: "Rahu",
    qualities: "Stability, leadership, command, wealth retention",
    idealFor: ["Master Bedroom", "Heavy Furniture", "Storage", "Strong Room", "Locker"],
    avoidFor: ["Main Entrance", "Pooja Room", "Kitchen", "Children's Room", "Water Tank", "Bathroom/Toilet", "Staircase to upper floor (allowed)"],
  },
  "West": {
    name: "West", hindi: "पश्चिम", deity: "Varuna (Lord of waters)",
    element: "Water", planet: "Saturn",
    qualities: "Gain, profits, fame in old age, profession",
    idealFor: ["Children's Room", "Dining Room", "Study Room", "Library", "Bathroom/Toilet", "Store Room"],
    avoidFor: ["Pooja Room", "Kitchen Stove (East-facing only)", "Main Entrance (acceptable)"],
  },
  "North-West": {
    name: "North-West", hindi: "वायव्य / वायव्य कोण", deity: "Vayu (Wind)",
    element: "Air", planet: "Moon",
    qualities: "Movement, travel, friendships, networks",
    idealFor: ["Guest Room", "Garage", "Store Room", "Bathroom/Toilet", "Children's Room (girls)", "Cattle Shed"],
    avoidFor: ["Pooja Room", "Master Bedroom (causes restlessness)", "Kitchen Stove", "Main Entrance"],
  },
  "Centre": {
    name: "Centre", hindi: "ब्रह्मस्थान", deity: "Brahma (Creator)",
    element: "Ether (Akasha)", planet: "—",
    qualities: "The cosmic centre — must remain open and clean",
    idealFor: ["Open Courtyard", "Open Space", "Tulsi Plant"],
    avoidFor: ["Kitchen", "Bathroom/Toilet", "Heavy Furniture", "Pillar", "Staircase", "Septic Tank", "Master Bedroom"],
  },
};

// Map any compass direction degree → 8-point cardinal/inter-cardinal
export function degreesToDirection(deg: number): Exclude<Direction, "Centre"> {
  const d = ((deg % 360) + 360) % 360;
  const idx = Math.round(d / 45) % 8;
  return (["North", "North-East", "East", "South-East", "South", "South-West", "West", "North-West"] as const)[idx];
}

// Normalise free-text room labels users supply into canonical keys.
function normaliseRoom(raw: string): string {
  const r = raw.trim().toLowerCase();
  if (/(main|front)\s*(entrance|door|gate)/.test(r) || r === "entrance") return "Main Entrance";
  if (/(exit)/.test(r)) return "Exit Door";
  if (/(kitchen)\s*stove|stove|cook(ing)?\s*platform/.test(r)) return "Kitchen Stove";
  if (/kitchen/.test(r)) return "Kitchen";
  if (/(master|main)\s*bed/.test(r)) return "Master Bedroom";
  if (/child(ren)?(.*)bed/.test(r) || /child(ren)?'?s?\s*room/.test(r)) return "Children's Room";
  if (/guest(.*)bed|guest\s*room/.test(r)) return "Guest Room";
  if (/bed\s*room|bedroom/.test(r)) return "Master Bedroom";
  if (/pooja|puja|prayer|mandir|temple\s*room/.test(r)) return "Pooja Room";
  if (/bath|toilet|wash\s*room|wc/.test(r)) return "Bathroom/Toilet";
  if (/septic/.test(r)) return "Septic Tank";
  if (/water\s*tank/.test(r)) return "Water Tank";
  if (/well\b/.test(r)) return "Well";
  if (/stair/.test(r)) return "Staircase";
  if (/garage|car\s*park/.test(r)) return "Garage";
  if (/store/.test(r)) return "Store Room";
  if (/study/.test(r)) return "Study Room";
  if (/dining/.test(r)) return "Dining Room";
  if (/living|hall|drawing/.test(r)) return "Living Room";
  if (/balcon/.test(r)) return "Balcony";
  if (/garden|lawn/.test(r)) return "Garden";
  if (/wash\s*area|laundry/.test(r)) return "Wash Area";
  if (/locker|safe|cash/.test(r)) return "Cash Locker";
  if (/office/.test(r)) return "Office";
  return raw.trim();
}

export interface VastuRoomInput { name: string; direction: string; degrees: number }

export interface VastuFinding {
  room: string;
  direction: Direction;
  status: "excellent" | "good" | "warning" | "critical";
  finding: string;
  remedy: string | null;
  rule: string;     // citation of the classical principle invoked
  delta: number;    // contribution to score (-30..+15)
}

export interface VastuDosha {
  name: string;
  severity: "low" | "moderate" | "high" | "critical";
  cause: string;
  remedy: string;
}

export interface VastuComputation {
  overallScore: number;            // 0-100
  overallVerdict: string;
  findings: VastuFinding[];
  doshas: VastuDosha[];
  zoneCoverage: { direction: Direction; rooms: string[] }[];
  energyFlow: string;              // computed summary
  facingDirection?: Direction;     // entrance facing
  brahmasthanStatus: "clear" | "obstructed" | "unknown";
}

// Per-room ideal direction, with a fallback set of "acceptable".
// Score deltas: ideal=+15, acceptable=+5, neutral=0, suboptimal=-10, forbidden=-25.
function scoreRoomPlacement(room: string, dir: Direction): { delta: number; status: VastuFinding["status"]; rule: string; remedy: string | null } {
  const meta = DIRECTIONS[dir];
  // Forbidden lookup
  if (meta.avoidFor.some(a => a.toLowerCase() === room.toLowerCase())) {
    return {
      delta: -25,
      status: "critical",
      rule: `${room} in ${dir} contradicts the rulership of ${meta.deity} (${meta.element}).`,
      remedy: classicalRemedy(room, dir),
    };
  }
  if (meta.idealFor.some(a => a.toLowerCase() === room.toLowerCase())) {
    return {
      delta: 15,
      status: "excellent",
      rule: `${room} in ${dir} aligns perfectly with ${meta.deity} — ${meta.qualities.toLowerCase()}.`,
      remedy: null,
    };
  }
  // Soft rules — partial alignment
  const acceptable = ACCEPTABLE_FALLBACKS[room] || [];
  if (acceptable.includes(dir)) {
    return {
      delta: 5,
      status: "good",
      rule: `${room} in ${dir} is acceptable per Brihat Samhita; not ideal but does not create dosha.`,
      remedy: null,
    };
  }
  return {
    delta: -10,
    status: "warning",
    rule: `${room} in ${dir} is sub-optimal — the ${meta.element} energy of ${meta.deity} doesn't directly support this function.`,
    remedy: classicalRemedy(room, dir),
  };
}

// Acceptable-but-not-ideal placements per classical texts.
const ACCEPTABLE_FALLBACKS: Record<string, Direction[]> = {
  "Main Entrance": ["North", "North-East", "East", "West"],
  "Living Room": ["North", "North-East", "East", "North-West"],
  "Master Bedroom": ["South", "South-West", "West"],
  "Children's Room": ["West", "North-West", "East"],
  "Guest Room": ["North-West", "West"],
  "Study Room": ["North", "North-East", "East", "West"],
  "Pooja Room": ["North-East", "East", "North"],
  "Kitchen": ["South-East", "North-West"],
  "Kitchen Stove": ["South-East"],
  "Bathroom/Toilet": ["West", "North-West", "South"],
  "Dining Room": ["West", "East", "North"],
  "Store Room": ["South-West", "West", "North-West", "South"],
  "Staircase": ["South", "South-West", "West"],
  "Garage": ["North-West", "South-East", "South"],
  "Water Tank": ["North-East", "North", "East"],
  "Cash Locker": ["North", "North-East"],
  "Office": ["North", "North-East", "East", "North-West"],
  "Garden": ["East", "North", "North-East"],
  "Balcony": ["East", "North", "North-East"],
};

// Specific classical remedies for common mismatches (Vastu Shastra texts).
function classicalRemedy(room: string, dir: Direction): string {
  const r = room.toLowerCase();
  if (r === "kitchen" && dir === "North-East") return "Place a copper pyramid and shift the stove to the South-East corner of the kitchen if relocation isn't possible. Recite Agni mantra before cooking and keep a small Ganesha idol in the SE.";
  if (r === "kitchen" && dir === "North") return "Move the stove to face East within the kitchen. Place a small Agni Yantra near the stove and keep red curtains or a red bulb in the SE corner of the home.";
  if (r === "bathroom/toilet" && dir === "North-East") return "Critical Vastu defect — never use this toilet for bathing. Keep the door always closed, place a Vastu pyramid above the door, and add a sea-salt bowl that is replaced weekly to absorb negativity.";
  if (r === "bathroom/toilet" && dir === "Centre") return "Permanently seal if possible. Use it only as an emergency utility, keep door shut, and place a brass Brahma yantra opposite the door. A live Tulsi pot in the NE of the home further offsets damage.";
  if (r === "master bedroom" && dir === "North-East") return "Move sleeping head to the South so feet point North while sleeping. Use heavy wooden furniture along the SW wall to ground energy. A Shri Yantra above the bed strengthens prana.";
  if (r === "master bedroom" && dir === "North-West") return "Acceptable for elders but causes restlessness for young couples. Use earthy SW-coloured bedsheets, place a Vayu yantra in the NW corner, and keep electronics out of the bedroom.";
  if (r === "main entrance" && dir === "South-West") return "Severe entrance dosha — install a Vastu door yantra above the frame, hang a brass Ganesha at the doorstep, and place a heavy threshold (marble/stone) to ground negative energy.";
  if (r === "main entrance" && dir === "South") return "Hang a Yama-protective Vastu plate above the door, place two brass elephants facing inwards, and install a strong threshold step.";
  if (r === "pooja room" && (dir === "South" || dir === "South-West" || dir === "South-East")) return "Move pooja to the NE corner of any room if relocation isn't possible. The deities must face West (so worshipper faces East). A copper Sri Yantra and daily ghee diya for 41 days neutralises the dosha.";
  if (r === "staircase" && dir === "North-East") return "Major dosha — staircase blocks NE prana. Cover the staircase well with a fixed wooden lid when not in use, paint it light cream/yellow, and never store anything beneath it. A heavy SW counterweight (statue/safe) helps.";
  if (r === "staircase" && dir === "Centre") return "Centre staircase disrupts Brahmasthan. Treat the underside as a sacred space — keep a small Tulsi or pure white open zone; never store shoes or junk below.";
  if (r === "septic tank" && dir === "North-East") return "Critical defect — relocate to NW or SE if possible. If not, plant a thick row of NE-facing trees, install a Vastu pyramid plate above ground, and recite Maha Mrityunjaya 108 times for 41 days.";
  if (r === "store room" && dir === "North-East") return "Empty the store room of all heavy and broken items. Convert to a meditation/pooja nook. NE must always be light, clean, and open.";
  if (r === "kitchen stove" && dir !== "South-East" && dir !== "North-West") return "Reposition the stove so the cook faces East while cooking. The flame represents Agni and must align with the Agneya (SE) corner of the room/home.";
  return `Place a Vastu pyramid in the ${dir} corner of the ${room}, recite the ${DIRECTIONS[dir].deity.split(" ")[0]} mantra 11 times daily, and avoid clutter in this zone.`;
}

// Detect specific named doshas across the whole layout.
function detectDoshas(rooms: { name: string; dir: Direction }[]): VastuDosha[] {
  const out: VastuDosha[] = [];
  const at = (n: string) => rooms.find(r => r.name.toLowerCase() === n.toLowerCase());

  const kitchen = at("Kitchen") || at("Kitchen Stove");
  const toilet = at("Bathroom/Toilet");
  const pooja = at("Pooja Room");
  const masterBed = at("Master Bedroom");
  const entrance = at("Main Entrance");
  const septic = at("Septic Tank");
  const stairs = at("Staircase");
  const store = at("Store Room");

  if (kitchen && kitchen.dir === "North-East") out.push({
    name: "Agni-Jal Dosha (Fire-Water Conflict)",
    severity: "critical",
    cause: "Kitchen (Agni / fire) placed in the NE (Jal / water) zone — opposing elements destroy domestic harmony, finances, and the health of the woman of the house.",
    remedy: "Relocate the stove to the SE corner of the home. Install a copper Vastu pyramid in the NE; place a Sri Yantra and recite the Agni Suktam for 41 days.",
  });

  if (toilet && toilet.dir === "North-East") out.push({
    name: "Ishanya Dosha (NE Toilet)",
    severity: "critical",
    cause: "Toilet in the NE corner pollutes the most sacred zone (Ishanya — Shiva) — leads to severe loss of wealth, mental clarity, and prosperity.",
    remedy: "Keep the toilet door permanently shut, do not bathe here. Place a Vastu pyramid above the door, hang a Tulsi plant outside, and replace a sea-salt bowl inside weekly.",
  });

  if (entrance && entrance.dir === "South-West") out.push({
    name: "Nairutya Dwara Dosha (SW Entrance)",
    severity: "high",
    cause: "Main entrance in the SW — the zone of Niruti (ancestral/karmic energies). Causes financial drain, disputes, and instability.",
    remedy: "Install a brass Vastu door yantra, fix two stone elephants facing inward, recite Hanuman Chalisa daily before entering, and add a heavy threshold step.",
  });

  if (entrance && entrance.dir === "South") out.push({
    name: "Yama Dwara Dosha (South Entrance)",
    severity: "moderate",
    cause: "Main entrance in the South (Yama's direction) — invites delays, health issues, and obstacles.",
    remedy: "Hang a protective Yama-pacification yantra above the door, install a strong threshold, and keep a Vastu mirror facing inward (not outward).",
  });

  if (pooja && (pooja.dir === "South" || pooja.dir === "South-West")) out.push({
    name: "Misplaced Pooja Dosha",
    severity: "high",
    cause: `Pooja room in the ${pooja.dir} — sacred fire and devata energy must reside in the NE/E/N zones, not the heavy Yama/Niruti zones.`,
    remedy: "Move the altar to the NE corner of any room. Deities should face West so the worshipper faces East. Light a ghee lamp at sunrise for 41 days to neutralise the dosha.",
  });

  if (masterBed && masterBed.dir === "North-East") out.push({
    name: "Ishanya Shayan Dosha (NE Master Bedroom)",
    severity: "high",
    cause: "Master bedroom in the NE drains pranic energy meant for spiritual elevation, leading to insomnia, anxiety, and reduced authority.",
    remedy: "Sleep with head pointing South. Move heavy furniture to the SW wall. Install a Shri Yantra above the bed and recite Maha Mrityunjaya before sleep.",
  });

  if (septic && (septic.dir === "North-East" || septic.dir === "North" || septic.dir === "East")) out.push({
    name: "Septic Defilement Dosha",
    severity: "critical",
    cause: `Septic tank in the ${septic.dir} pollutes the auspicious Jal/Vayu zones — major karmic drain on the household.`,
    remedy: "Relocate to NW or SE if structurally possible. If not, plant a thick row of trees as a barrier and perform a Vastu Shanti puja annually.",
  });

  if (stairs && (stairs.dir === "North-East" || stairs.dir === "Centre")) out.push({
    name: "Brahmasthan/Ishanya Stair Dosha",
    severity: "high",
    cause: `Staircase in the ${stairs.dir} crushes the rising prana of the home and disturbs the ${stairs.dir === "Centre" ? "Brahmasthan" : "Ishanya"} zone.`,
    remedy: "Cover the staircase with a wooden lid when not in use. Never store anything underneath. Paint it light cream/yellow and add a heavy SW counterweight elsewhere in the home.",
  });

  if (store && store.dir === "North-East") out.push({
    name: "NE Store-Clutter Dosha",
    severity: "moderate",
    cause: "Store room in the NE blocks pranic flow and weighs down the lightest, most sacred zone.",
    remedy: "Empty the room of heavy/broken items and convert to a meditation or pooja nook. The NE must remain light, clean, and luminous.",
  });

  return out;
}

const VERDICTS: Array<[number, string]> = [
  [88, "Excellent — your home strongly aligns with classical Vastu principles."],
  [75, "Very Good — the layout supports prosperity and well-being with only minor gaps."],
  [60, "Good — most placements are favourable; address the flagged areas to amplify benefits."],
  [45, "Needs Improvement — specific doshas are draining the home's energy. Apply the remedies promptly."],
  [0,  "Significant Vastu Concerns — multiple doshas are present. Consider a phased remediation plan with a Vastu acharya."],
];

export function computeVastu(rooms: VastuRoomInput[], compassHeading?: number): VastuComputation {
  const normalised = rooms.map(r => {
    const dir = (typeof r.degrees === "number" ? degreesToDirection(r.degrees) : (r.direction as Direction)) as Direction;
    return { name: normaliseRoom(r.name), dir };
  });

  const findings: VastuFinding[] = normalised.map(({ name, dir }) => {
    const meta = DIRECTIONS[dir];
    const s = scoreRoomPlacement(name, dir);
    return {
      room: name, direction: dir,
      status: s.status,
      finding: `${name} sits in the ${dir} (${meta.hindi}) — the zone of ${meta.deity} ruled by ${meta.element}. ${s.rule}`,
      remedy: s.remedy,
      rule: s.rule,
      delta: s.delta,
    };
  });

  const doshas = detectDoshas(normalised);
  // Each named dosha further deducts.
  const doshaPenalty = doshas.reduce((s, d) => s + ({ low: 4, moderate: 8, high: 14, critical: 22 }[d.severity]), 0);

  const placementScore = findings.reduce((s, f) => s + f.delta, 0);
  // Map raw score onto 0-100. Baseline = 70.
  const raw = 70 + placementScore - doshaPenalty;
  const overallScore = Math.max(15, Math.min(98, Math.round(raw)));
  const overallVerdict = (VERDICTS.find(([t]) => overallScore >= t) ?? VERDICTS[VERDICTS.length - 1])[1];

  // Coverage map
  const zoneMap = new Map<Direction, string[]>();
  normalised.forEach(({ name, dir }) => {
    if (!zoneMap.has(dir)) zoneMap.set(dir, []);
    zoneMap.get(dir)!.push(name);
  });
  const zoneCoverage = (Object.keys(DIRECTIONS) as Direction[])
    .map(d => ({ direction: d, rooms: zoneMap.get(d) || [] }));

  const heavyRoomsInNE = normalised.filter(r => r.dir === "North-East" && /(store|septic|toilet|kitchen|stair)/i.test(r.name)).length;
  const flow = heavyRoomsInNE > 0
    ? "Pranic flow is obstructed at the NE intake — energy struggles to enter and circulate. Clearing the NE is the highest-leverage fix."
    : doshas.length > 0
      ? "Energy enters cleanly but encounters specific doshas downstream. Apply the listed remedies to restore balance."
      : "Pranic flow is largely unobstructed — energy enters from the NE/E and circulates well to the SW grounding zone.";

  const facingDirection = compassHeading != null ? degreesToDirection(compassHeading) : undefined;
  const brahmaRoom = normalised.find(r => /center|centre|courtyard|brahmasthan/i.test(r.name));
  const brahmasthanStatus: VastuComputation["brahmasthanStatus"] =
    brahmaRoom ? (DIRECTIONS["Centre"].avoidFor.includes(brahmaRoom.name) ? "obstructed" : "clear") : "unknown";

  return { overallScore, overallVerdict, findings, doshas, zoneCoverage, energyFlow: flow, facingDirection, brahmasthanStatus };
}

// Lucky elements derived from the dominant direction (most rooms placed there).
export function deriveLuckyElements(rooms: VastuRoomInput[]) {
  const counts = new Map<Direction, number>();
  rooms.forEach(r => {
    const d = degreesToDirection(r.degrees);
    counts.set(d, (counts.get(d) || 0) + 1);
  });
  const dominant = ([...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "North-East") as Direction;
  const meta = DIRECTIONS[dominant];
  // Element-based recommendations (canonical Vastu palette)
  const palette: Record<string, { color: string; plant: string; symbol: string; material: string }> = {
    "Water":         { color: "Soft white, sky blue, light cream",    plant: "Tulsi, Bamboo (in NE), Money Plant", symbol: "Sri Yantra, copper Kalash, conch (Shankh)", material: "Marble, copper, brass" },
    "Water + Ether": { color: "Pure white, light yellow, pale gold",  plant: "Tulsi, Bamboo, white-flower jasmine", symbol: "Sri Yantra, Shiva Lingam (small), brass bell", material: "Marble, white granite, copper" },
    "Air":           { color: "Pale yellow, off-white, soft green",   plant: "Money Plant, Areca Palm, Bamboo",   symbol: "Vastu pyramid, brass elephant, Swastika", material: "Wood (light), brass" },
    "Fire":          { color: "Warm reds, oranges, coral, gold",      plant: "Hibiscus, Marigold (in SE only)",    symbol: "Agni Yantra, copper diya, Kuber yantra", material: "Copper, terracotta" },
    "Earth":         { color: "Earthy browns, beiges, terracotta",    plant: "Cactus (in SW only), thick-leaved plants", symbol: "Crystal pyramid, brass tortoise, Hanuman idol", material: "Stone, marble, heavy wood" },
    "Ether (Akasha)":{ color: "Pure white, ivory",                    plant: "Tulsi at the centre",                symbol: "Brahma Yantra, open Mandala", material: "Marble, white stone" },
  };
  return palette[meta.element] || palette["Water"];
}
