import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import test from "node:test";
import express from "express";
import { and, eq } from "drizzle-orm";
import {
  adminSessions,
  pandits,
  pujaMuhurats,
  pujaTypes,
  users,
} from "@shared/schema";
import { db } from "./db";
import { findPublicPujaBySlug, registerContentRoutes } from "./content-routes";
import {
  citationSchema,
  findPujaConflicts,
  normalizeGovernance,
  publicPujaEligible,
  pujaCreateSchema,
  pujaCompleteness,
  pujaPatchSchema,
} from "./puja-governance";

function completePuja(overrides: Record<string, any> = {}) {
  return {
    id: 1,
    slug: "lakshmi-puja",
    name: "Lakshmi Puja",
    shortDescription: "A complete guide.",
    whyPerformed: "Purpose",
    storyMyth: "Traditional background",
    howCelebrated: "Vidhi",
    ethics: "Guidance",
    benefits: "Benefits",
    requirements: [{ item: "Diya", qty: "1" }],
    faq: [{ q: "When?", a: "At an approved time." }],
    intents: ["Prosperity"],
    deities: ["Lakshmi"],
    ceremonies: [],
    festivals: ["Diwali"],
    aliases: ["Mahalakshmi Puja"],
    sourceNotes: "Reviewed traditional practice.",
    metaTitle: "Lakshmi Puja guide",
    metaDescription: "A reviewed guide to Lakshmi Puja.",
    citations: [{ label: "Reviewer notes", sourceType: "reviewer" }],
    onlineEligible: true,
    inPersonEligible: true,
    reviewStatus: "approved",
    reviewMethod: "pandit",
    reviewedByPanditId: 7,
    isPublished: true,
    ...overrides,
  };
}

test("taxonomy normalization trims and removes case-insensitive duplicates", () => {
  const normalized = normalizeGovernance({
    intents: [" Prosperity ", "prosperity", "Protection"],
    aliases: ["Lakshmi Pooja", " lakshmi pooja "],
  });
  assert.deepEqual(normalized.intents, ["Prosperity", "Protection"]);
  assert.deepEqual(normalized.aliases, ["Lakshmi Pooja"]);
});

test("completeness reports actionable missing governance fields", () => {
  const result = pujaCompleteness(completePuja({ citations: [], sourceNotes: "" }));
  assert.equal(result.complete, false);
  assert.ok(result.missing.includes("Source notes"));
  assert.ok(result.missing.includes("At least one citation"));
});

test("name and alias collisions are blocking conflicts", () => {
  const candidate = completePuja({ id: 2, slug: "mahalakshmi", name: "Mahalakshmi Puja", aliases: [] });
  const conflicts = findPujaConflicts(candidate, [completePuja()], candidate.id);
  assert.ok(conflicts.some(conflict => conflict.type === "alias" && conflict.recordId === 1));
});

test("AI-reviewed complete approved guides are publicly eligible without a Pandit", () => {
  const puja = completePuja();
  assert.equal(pujaCompleteness(puja).complete, true);
  assert.equal(publicPujaEligible(puja, [], false), true);
});

test("Pandit review requires a live verified Pandit for completeness and public eligibility", () => {
  const puja = completePuja();
  assert.equal(pujaCompleteness(puja).complete, true);
  assert.equal(publicPujaEligible(puja, [], false), true);
});

test("Pandit review requires a live verified Pandit for completeness and public eligibility", () => {
  const puja = completePuja();
  assert.equal(pujaCompleteness({ ...puja, reviewerVerified: true }).complete, true);
  assert.equal(pujaCompleteness({ ...puja, reviewerVerified: false }).complete, false);
  assert.equal(publicPujaEligible(puja, [], true), true);
  assert.equal(publicPujaEligible(puja, [], false), false);
  assert.equal(publicPujaEligible({ ...puja, reviewStatus: "in_review" }, [], true), false);
  assert.equal(publicPujaEligible(puja, [{ type: "name", recordId: 2, recordName: "Duplicate", value: "lakshmi puja", blocking: true }], true), false);
});

test("Zod governance permits AI/admin approval and requires Pandit attribution only for Pandit review", () => {
  assert.equal(pujaCreateSchema.safeParse(completePuja({ reviewMethod: "ai", reviewedByPanditId: null })).success, true);
  assert.equal(pujaCreateSchema.safeParse(completePuja({ reviewMethod: "admin", reviewedByPanditId: null })).success, true);
  assert.equal(pujaCreateSchema.safeParse(completePuja({ reviewMethod: "pandit", reviewedByPanditId: null })).success, false);
  assert.equal(pujaCreateSchema.safeParse(completePuja({ reviewMethod: "ai", reviewedByPanditId: 7 })).success, false);
});

test("citation validation rejects stored-script and non-HTTPS URLs across write schemas", () => {
  const unsafeUrls = [
    "javascript:alert(1)",
    "data:text/html,<script>alert(1)</script>",
    "http://example.com/source",
  ];
  for (const url of unsafeUrls) {
    const citation = { label: "Unsafe source", url, sourceType: "other" as const };

  const unique = `${Date.now()}-${process.pid}`;
    assert.equal(invalidated.reviewStatus, "in_review");
    assert.equal(invalidated.isPublished, false);
    assert.equal(invalidated.approvedAt, null);
    await assertPubliclyHidden("substantive edit invalidation");

    response = await request(`/api/admin/pujas/${pujaId}`, {
      method: "PATCH",
      headers: adminHeaders,
      body: JSON.stringify({ reviewStatus: "approved", isPublished: true }),
    });
    assert.equal(response.status, 200);
    await db.update(pandits).set({ verified: false }).where(eq(pandits.id, reviewerId));
    await assertPubliclyHidden("reviewer revocation");
  } finally {
    if (pujaId) {
      await db.delete(pujaMuhurats).where(eq(pujaMuhurats.pujaId, pujaId));
      await db.delete(pujaTypes).where(eq(pujaTypes.id, pujaId));
    }
    if (reviewerId) await db.delete(pandits).where(eq(pandits.id, reviewerId));
    if (userId) {
      await db.delete(adminSessions).where(and(eq(adminSessions.userId, userId), eq(adminSessions.token, token)));
      await db.delete(users).where(eq(users.id, userId));
    }
    await new Promise<void>((resolve, reject) =>
      server.close(error => error ? reject(error) : resolve()),
    );
  }
});

  const server = app.listen(0, "127.0.0.1");

  const email = `governance-api-${unique}@example.test`;

  const app = express();

  const request = (path: string, init: RequestInit = {}) =>
    fetch(`${baseUrl}${path}`, init);

    const created = await response.json();

    const listResponse = await request("/api/pujas");

  const adminHeaders = {
    "content-type": "application/json",
    "x-admin-token": token,
  };

  const token = `governance-api-token-${unique}`;

  const baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;

    const detailResponse = await request(`/api/pujas/${slug}`);

    const invalidated = await response.json();

  const slug = `governance-api-${unique}`;

  let reviewerId: number | undefined;

    const [reviewer] = await db.insert(pandits).values({
      name: "Governance API Test Reviewer",
      city: "Test City",
      specialization: "Test Puja",
      languages: "Hindi",
      experience: 10,
      fees: 1000,
      verified: true,
    }).returning({ id: pandits.id });

    let response = await request("/api/admin/pujas", {
      method: "POST",
      headers: adminHeaders,
      body: JSON.stringify({
        slug,
        name: "Governance API Puja",
        shortDescription: "An isolated API governance test guide.",
        whyPerformed: "Test purpose",
        storyMyth: "Test tradition",
        howCelebrated: "Test ritual steps",
        ethics: "Test ethical guidance",
        benefits: "Test benefits",
        metaTitle: "Governance API Puja test guide",
        metaDescription: "An isolated reviewed Puja governance API test guide.",
        requirements: [{ item: "Lamp", qty: "1" }],
        faq: [{ q: "When?", a: "At the reviewed time." }],
        intents: ["Testing"],
        deities: ["Test Deity"],
        ceremonies: [],
        festivals: [],
        aliases: [],
        sourceNotes: "Internal source notes that must stay private.",
        citations: [{ label: "Test reviewer source", sourceType: "reviewer" }],
        onlineEligible: true,
        inPersonEligible: true,
        reviewStatus: "draft",
        reviewNotes: "Internal review notes that must stay private.",
        isPublished: false,
      }),
    });

    const publicRow = (await listResponse.json() as Array<Record<string, unknown>>)
      .find(row => row.slug === slug);

  const date = `${new Date().getUTCFullYear() + 1}-06-15`;

    const detail = await detailResponse.json();

    const matchResponse = await request(
      `/api/test/dated-puja-match?pujaSlug=${encodeURIComponent(slug)}`,
    );

  let pujaId: number | undefined;

    const eligible = await findPublicPujaBySlug(String(req.query.pujaSlug || ""));

  let userId: number | undefined;

    const [admin] = await db.insert(users).values({
      role: "admin",
      name: "Governance API Test Admin",
      email,
    }).returning({ id: users.id });

  async function assertPubliclyHidden(name: string) {
    const listResponse = await request("/api/pujas");
    assert.equal(listResponse.status, 200, `${name}: public list request`);
    const list = await listResponse.json() as Array<Record<string, unknown>>;
    assert.equal(list.some(row => row.slug === slug), false, `${name}: public list`);

    const detailResponse = await request(`/api/pujas/${slug}`);
    assert.equal(detailResponse.status, 404, `${name}: public detail`);

    const matchResponse = await request(
      `/api/test/dated-puja-match?pujaSlug=${encodeURIComponent(slug)}`,
    );
    assert.equal(matchResponse.status, 400, `${name}: dated matching`);
    assert.deepEqual(await matchResponse.json(), {
      message: "Puja catalogue reference is not approved for matching",
    });
  }
