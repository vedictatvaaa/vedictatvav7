import assert from "node:assert/strict";
import test from "node:test";
import { isIntentLikePujaQuery, rankPujaSearchResults, type SmartPujaSearchItem } from "@shared/puja-smart-search";

const catalogue: SmartPujaSearchItem[] = [
  {
    slug: "griha-pravesh-puja",
    name: "Griha Pravesh Puja",
    deity: "Ganesha",
    category: "occasion",
    shortDescription: "A housewarming Puja for entering a new home.",
    intents: ["new home", "housewarming"],
    deities: ["Ganesha"],
    ceremonies: ["griha pravesh"],
    festivals: [],
    aliases: ["house warming"],
    onlineEligible: true,
    inPersonEligible: false,
  },
  {
    slug: "ganesh-puja",
    name: "Ganesh Puja",
    deity: "Ganesha",
    category: "deity",
    shortDescription: "A devotional Puja for Ganesha.",
    intents: ["remove obstacles"],
    deities: ["Ganesha"],
    ceremonies: [],
    festivals: [],
    aliases: ["ganapati puja"],
    onlineEligible: true,
    inPersonEligible: false,
  },
];

test("smart search ranks an exact Puja name before broader matches", () => {
  const results = rankPujaSearchResults(catalogue, "griha", "online");
  assert.equal(results[0]?.slug, "griha-pravesh-puja");
});

test("smart search expands a new-home intent only to grounded catalogue records", () => {
  assert.equal(isIntentLikePujaQuery("moving into a new home"), true);
  const results = rankPujaSearchResults(catalogue, "moving into a new home", "online");
  assert.deepEqual(results.map((result) => result.slug), ["griha-pravesh-puja"]);
});

test("smart search respects the requested booking mode", () => {
  const results = rankPujaSearchResults(catalogue, "ganesh", "offline");
  assert.deepEqual(results, []);
});