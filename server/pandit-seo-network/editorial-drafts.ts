import type OpenAI from "openai";
import { createAiClient } from "../ai-provider";
import { storage } from "../storage";
import { getPanditSeoNetworkProjection } from "./cache";
import { getHierarchicalLocation, type HierarchicalLocation } from "./state-city-seo";

type DraftFaq = { question: string; answer: string };
export type LocationEditorialDraft = {
  introduction: string;
  faqs: DraftFaq[];
};

function factsFor(location: HierarchicalLocation) {
  const providers = location.providers
    .filter((provider) => provider.pandit)
    .map((provider) => ({
      name: provider.pandit?.name,
      services: provider.services.map((service) => service.name),
      languages: provider.pandit?.languages,
    }));
  return {
    kind: location.kind,
    state: location.state?.name,
    city: location.city?.city.name || null,
    qualifyingProviderCount: providers.length,
    providers,
  };
}

function keyFor(location: HierarchicalLocation) {
  return location.kind === "state"
    ? `state:${location.state?.id}`
    : location.city?.entityId || "";
}

export async function generateLocationEditorialDraft(
  location: HierarchicalLocation,
): Promise<LocationEditorialDraft | null> {
  let openai: OpenAI;
  try {
    openai = createAiClient({ task: "location_editorial_draft" });
  } catch {
    return null;
  }
  const facts = factsFor(location);
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: [
          "You write a conservative editorial draft for a Vedic Tatva location directory.",
          "Output only JSON with introduction and faqs (array of question and answer).",
          "Use only facts in the supplied VERIFIED_FACTS object.",
          "Never invent availability, pricing, ratings, expertise, traditions, addresses, reviews, guarantees, or local presence.",
          "Do not mention any provider by name. Say 'published Pandits' and use only the supplied count and service/language values.",
          "This is a DRAFT for human review; do not state that it is approved.",
        ].join(" "),
      },
      {
        role: "user",
        content: `VERIFIED_FACTS:\n${JSON.stringify(facts)}\n\nWrite useful, neutral copy for ${location.canonicalUrl}.`,
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0.1,
    max_tokens: 700,
  });
  const raw = response.choices[0]?.message?.content;
  if (!raw) return null;
  const parsed = JSON.parse(raw) as Partial<LocationEditorialDraft>;
  const introduction = typeof parsed.introduction === "string"
    ? parsed.introduction.trim().slice(0, 8000)
    : "";
  const faqs = Array.isArray(parsed.faqs)
    ? parsed.faqs.flatMap((faq) => {
      if (!faq || typeof faq.question !== "string" || typeof faq.answer !== "string") return [];
      const question = faq.question.trim().slice(0, 240);
      const answer = faq.answer.trim().slice(0, 1600);
      return question && answer ? [{ question, answer }] : [];
    }).slice(0, 12)
    : [];
  return introduction ? { introduction, faqs } : null;
}

export async function generateLocationEditorialDrafts(options: {
  location?: HierarchicalLocation;
  actor?: string;
} = {}) {
  const projection = await getPanditSeoNetworkProjection();
  const locations = options.location
    ? [options.location]
    : Array.from(new Map(projection.cities.flatMap((city) => {
      const state = getHierarchicalLocation(projection, city.state.name);
      const location = getHierarchicalLocation(projection, city.state.name, city.city.name);
      return [state, location].filter((item): item is HierarchicalLocation => Boolean(item));
    }).map((location) => [location.canonicalUrl, location])).values());
  const result = { attempted: 0, generated: 0, saved: 0, skipped: 0, failed: 0 };
  for (const location of locations) {
    result.attempted++;
    const key = keyFor(location);
    const existing = await storage.getPanditSeoEditorial(location.kind === "state" ? "state" as any : "city", key);
    if (existing && existing.status !== "draft") {
      result.skipped++;
      continue;
    }
    try {
      const draft = await generateLocationEditorialDraft(location);
      if (!draft) {
        result.failed++;
        continue;
      }
      await storage.upsertPanditSeoEditorial({
        entityType: location.kind === "state" ? "state" as any : "city",
        entityKey: key,
        introduction: draft.introduction,
        faqs: draft.faqs,
        status: "draft",
      }, options.actor || "system:seo-location-ai");
      result.generated++;
      result.saved++;
    } catch {
      result.failed++;
    }
  }
  return result;
}