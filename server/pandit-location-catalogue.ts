import { eq } from "drizzle-orm";
import { indianCities, indianStates } from "@shared/schema";
import { db } from "./db";
import { cleanLocationSlug } from "./pandit-seo-network/state-city-seo";

function stateMatches(state: { name: string; code: string }, value: string) {
  const wanted = cleanLocationSlug(value);
  return [
    cleanLocationSlug(state.name),
    cleanLocationSlug(state.code),
    ...(state.name.toLowerCase() === "nct of delhi" ? ["delhi", "new-delhi"] : []),
  ].includes(wanted);
}

function cityMatches(city: { name: string; slug: string; aliases: string[] }, value: string) {
  const wanted = cleanLocationSlug(value);
  return [city.name, city.slug, ...(city.aliases || [])]
    .map(cleanLocationSlug)
    .includes(wanted);
}

export async function resolveActiveCatalogueLocation(stateValue: string, cityValue: string) {
  const [states, cities] = await Promise.all([
    db.select().from(indianStates).where(eq(indianStates.isActive, true)),
    db.select().from(indianCities).where(eq(indianCities.isActive, true)),
  ]);
  const state = states.find((candidate) => stateMatches(candidate, stateValue));
  if (!state) return null;
  const city = cities.find((candidate) =>
    candidate.stateId === state.id && cityMatches(candidate, cityValue),
  );
  return city ? { state, city } : null;
}