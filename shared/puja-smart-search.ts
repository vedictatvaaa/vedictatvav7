export type SmartPujaSearchItem = {
  slug: string;
  name: string;
  deity: string;
  category: string;
  shortDescription: string;
  intents: string[];
  deities: string[];
  ceremonies: string[];
  festivals: string[];
  aliases: string[];
  onlineEligible: boolean;
  inPersonEligible: boolean;
};

export type SmartSearchMode = "online" | "offline";

const normalize = (value: string) =>
  value.toLocaleLowerCase("en-IN").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim();

const STOP_WORDS = new Set(["a", "an", "and", "for", "i", "in", "into", "me", "my", "of", "the", "to", "with"]);

const INTENT_EXPANSIONS: Array<{ phrases: string[]; terms: string[] }> = [
  {
    phrases: ["moving into a new home", "move into a new home", "new home", "housewarming", "house warming"],
    terms: ["griha pravesh", "vastu shanti", "housewarming", "house warming"],
  },
  {
    phrases: ["new baby", "welcoming a baby", "baby ceremony"],
    terms: ["namkaran", "naamkaran", "annaprashan", "mundan"],
  },
  {
    phrases: ["peace at home", "family peace", "remove obstacles"],
    terms: ["ganesh", "vastu shanti", "satyanarayan"],
  },
  {
    phrases: ["ancestor", "ancestors", "peace for departed", "after someone passed"],
    terms: ["shradh", "tarpan", "pind daan", "asthi visarjan", "narayan bali"],
  },
];

function searchableText(item: SmartPujaSearchItem) {
  return normalize([
    item.name,
    item.deity,
    item.category,
    item.shortDescription,
    ...item.intents,
    ...item.deities,
    ...item.ceremonies,
    ...item.festivals,
    ...item.aliases,
  ].join(" "));
}

function matchesMode(item: SmartPujaSearchItem, mode?: SmartSearchMode) {
  return !mode || (mode === "online" ? item.onlineEligible : item.inPersonEligible);
}

export function rankPujaSearchResults<T extends SmartPujaSearchItem>(
  items: T[],
  query: string,
  mode?: SmartSearchMode,
  limit = 6,
): T[] {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) return items.filter(item => matchesMode(item, mode)).slice(0, limit);
  const queryTokens = normalizedQuery.split(" ").filter(token => token.length > 1 && !STOP_WORDS.has(token));
  const expansions = INTENT_EXPANSIONS
    .filter(group => group.phrases.some(phrase => normalizedQuery.includes(normalize(phrase))))
    .flatMap(group => group.terms.map(normalize));

  return items
    .filter(item => matchesMode(item, mode))
    .map(item => {
      const name = normalize(item.name);
      const searchable = searchableText(item);
      const fields = {
        name,
        aliases: normalize(item.aliases.join(" ")),
        intent: normalize(item.intents.join(" ")),
        context: normalize([
          item.deity,
          item.category,
          item.shortDescription,
          ...item.deities,
          ...item.ceremonies,
          ...item.festivals,
        ].join(" ")),
      };
      let score = 0;
      if (name === normalizedQuery) score += 100;
      if (name.startsWith(normalizedQuery)) score += 60;
      if (fields.aliases.includes(normalizedQuery)) score += 45;
      if (fields.intent.includes(normalizedQuery)) score += 35;
      queryTokens.forEach(token => {
        if (fields.name.includes(token)) score += 20;
        else if (fields.aliases.includes(token)) score += 16;
        else if (fields.intent.includes(token)) score += 13;
        else if (fields.context.includes(token)) score += 7;
      });
      expansions.forEach(term => {
        if (searchable.includes(term)) score += 18;
      });
      return { item, score };
    })
    .filter(result => result.score > 0)
    .sort((a, b) => b.score - a.score || a.item.name.localeCompare(b.item.name, "en-IN"))
    .slice(0, limit)
    .map(result => result.item);
}

export function isIntentLikePujaQuery(query: string) {
  const normalized = normalize(query);
  return normalized.split(" ").filter(Boolean).length >= 2
    || INTENT_EXPANSIONS.some(group => group.phrases.some(phrase => normalized.includes(normalize(phrase))));
}