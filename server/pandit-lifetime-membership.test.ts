import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import sharp from "sharp";
import test from "node:test";
import { isValidStoredProfilePhoto } from "./profile-photo-validation";
import { panditVerificationDto } from "./pandit-verification";
import { publicStorefrontPanditDto } from "./pandit-public-access";
import { publicPanditDto } from "./pandit-discovery-policy";
import { buildPanditSeoNetworkProjection } from "./pandit-seo-network/project";

const migration = readFileSync("migrations/0010_pandit_lifetime_registration.sql", "utf8");
const successorMigration = readFileSync("migrations/0011_finalize_pandit_registration_numbers.sql", "utf8");
const commerceMigration = readFileSync("migrations/0012_seed_pandit_membership_card_products.sql", "utf8");
const checkoutMigration = readFileSync("migrations/0013_checkout_payment_intents_inventory.sql", "utf8");

function assertSelfTransactionalMigration(sql: string) {
  assert.match(sql, /^\s*--[\s\S]*?\bBEGIN;/);
  assert.match(sql, /\bCOMMIT;\s*$/);
}

test("Pandit migrations are self-transactional for the Coolify psql runner", () => {
  for (const sql of [migration, successorMigration, commerceMigration, checkoutMigration]) {
    assertSelfTransactionalMigration(sql);
  }
});
const schema = readFileSync("shared/schema.ts", "utf8");
const routes = readFileSync("server/routes.ts", "utf8");
const seed = readFileSync("server/seed.ts", "utf8");
const photoValidator = readFileSync("server/profile-photo-validation.ts", "utf8");

test("0010 is additive and preserves legacy membership and card-order systems", () => {
  assert.match(migration, /ADD COLUMN IF NOT EXISTS registration_no text/);
  assert.match(migration, /ADD COLUMN IF NOT EXISTS pandit_id integer REFERENCES pandits\(id\)/);
  assert.doesNotMatch(migration, /\bDROP TABLE\b|\bTRUNCATE\b/);
  assert.doesNotMatch(migration, /ALTER TABLE (?:pandit_card_orders|pandits) DROP COLUMN/);
  assert.match(schema, /membershipNo: text\("membership_no"\)/);
  assert.match(schema, /export const panditCardOrders = pgTable\("pandit_card_orders"/);
});

test("0010 leaves ambiguous legacy application matches for Admin review", () => {
  assert.doesNotMatch(migration, /Approved Pandit application cannot be linked uniquely/);
  assert.match(migration, /HAVING count\(p\.id\) = 1/);
  assert.match(migration, /HAVING count\(application_id\) = 1/);
  assert.match(migration, /remain unlinked[\s\S]*Admin review/);
});

test("registration allocation is formatted, unique, immutable, retry-safe, and never reused", () => {
  assert.match(migration, /CREATE SEQUENCE IF NOT EXISTS pandit_registration_no_seq/);
  assert.match(migration, /MINVALUE 1001000156 MAXVALUE 9999999999 START WITH 1001000156 NO CYCLE/);
  assert.match(migration, /\^\[0-9\]\{10\}\$/);
  assert.match(migration, /COALESCE\(MAX\(registration_no::bigint\), 1001000155\)/);
  assert.match(migration, /\(existing\.max_no \+ eligible\.ordinal\)::text/);
  assert.doesNotMatch(migration, /VT-PAN/);
  assert.match(migration, /pandits_registration_no_unique/);
  assert.match(migration, /Pandit registration number is immutable/);
  assert.match(migration, /pandit_registration_numbers[\s\S]+registration_no text PRIMARY KEY/);
  assert.match(migration, /WHERE verified = true AND registration_no IS NULL/);
  assert.match(migration, /ORDER BY created_at NULLS LAST, id/);
  assert.match(routes, /\.for\("update"\)/);
  assert.match(routes, /pending\.status === "approved" && pending\.panditId/);
  assert.match(routes, /registrationNo: sql`nextval\('pandit_registration_no_seq'\)::text`/);
  assert.doesNotMatch(routes, /VT-PAN/);
});

test("0011 safely upgrades either numeric 0010 or legacy prefixed 0010 state", () => {
  assert.match(successorMigration, /ALTER TABLE pandits ADD COLUMN IF NOT EXISTS legacy_registration_no text/);
  assert.match(successorMigration, /VT-PAN-\[0-9\]\{6,\}/);
  assert.match(successorMigration, /legacy_registration_no = COALESCE\(p\.legacy_registration_no, p\.registration_no\)/);
  assert.match(successorMigration, /registration_no = \(ceiling\.value \+ legacy\.ordinal\)::text/);
  assert.match(successorMigration, /ORDER BY created_at NULLS LAST, id/);
  assert.match(successorMigration, /Pandit registration\/ledger history is invalid; aborting 0011/);
  assert.match(successorMigration, /Pandit legacy registration number is immutable/);
});

test("0011 uses ledger history, including deleted Pandits, as the sequence ceiling", () => {
  assert.match(successorMigration, /FROM pandit_registration_numbers WHERE registration_no ~ '\^\[0-9\]\{10\}\$'/);
  assert.match(successorMigration, /SELECT MAX\(registration_no::bigint\)[\s\S]+FROM pandit_registration_numbers WHERE registration_no ~ '\^\[0-9\]\{10\}\$'/);
  assert.match(successorMigration, /setval\([\s\S]+pandit_registration_numbers/);
  assert.match(successorMigration, /1001000156/);
  assert.match(successorMigration, /DO NOTHING/);
});

test("missing-city lifecycle remains governed by canonical State and City IDs", () => {
  assert.match(migration, /status IN \('pending','mapped','created','rejected'\)/);
  assert.match(migration, /application_id integer NOT NULL UNIQUE/);
  assert.match(routes, /Choose a canonical city or submit one missing-city request/);
  assert.match(routes, /City must be active and belong to the requested State/);
  assert.match(routes, /pandit_location_request\.\$\{parsed\.data\.action\}/);
  assert.match(routes, /Resolve the application's active State and City request before approval/);
});

test("application submission and approval both reject absent or invalid photos", () => {
  assert.match(routes, /photo: z\.string\(\)\.min\(1\)/);
  assert.equal((routes.match(/isValidStoredProfilePhoto\(/g) || []).length >= 3, true);
  assert.match(routes, /A valid successfully uploaded profile photo is required before approval/);
  assert.match(routes, /expectedMime\[extension\] === file\.mimetype\.toLowerCase\(\)/);
  assert.match(photoValidator, /sharp\(bytes, \{ failOn: "error", limitInputPixels: MAX_PIXELS \}\)/);
  assert.match(photoValidator, /await image\.rotate\(\)\.toBuffer\(\)/);
  assert.match(photoValidator, /metadata\.width > MAX_DIMENSION/);
});

test("photo validation decodes valid images and rejects spoofed, truncated, and junk data", async () => {
  const directory = mkdtempSync(path.join(os.tmpdir(), "pandit-photo-"));
  const png = await sharp({
    create: { width: 1, height: 1, channels: 3, background: { r: 1, g: 2, b: 3 } },
  }).png().toBuffer();
  try {
    writeFileSync(path.join(directory, "valid.png"), png);
    writeFileSync(path.join(directory, "spoofed.jpg"), png);
    writeFileSync(path.join(directory, "text.jpg"), "not an image");
    writeFileSync(path.join(directory, "truncated.png"), png.subarray(0, -1));
    writeFileSync(path.join(directory, "junk.png"), Buffer.concat([png, Buffer.from("junk")]));
    assert.equal(await isValidStoredProfilePhoto("/uploads/valid.png", directory), true);
    assert.equal(await isValidStoredProfilePhoto("/uploads/spoofed.jpg", directory), false);
    assert.equal(await isValidStoredProfilePhoto("/uploads/text.jpg", directory), false);
    assert.equal(await isValidStoredProfilePhoto("/uploads/truncated.png", directory), false);
    assert.equal(await isValidStoredProfilePhoto("/uploads/junk.png", directory), false);
    const encoded = png.toString("base64");
    assert.equal(await isValidStoredProfilePhoto(`data:image/png;base64,${encoded}`, directory), true);
    assert.equal(await isValidStoredProfilePhoto(`data:image/jpeg;base64,${encoded}`, directory), false);
    assert.equal(await isValidStoredProfilePhoto(`data:image/png;base64,${Buffer.concat([png, Buffer.from("junk")]).toString("base64")}`, directory), false);
    assert.equal(await isValidStoredProfilePhoto("data:image/jpeg;base64,bm90IGFuIGltYWdl", directory), false);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("admin APIs are protected and expose registration and location review data", () => {
  assert.match(routes, /"\/api\/admin\/pandits", adminAuthMiddleware/);
  assert.match(routes, /\/\^\\d\{10\}\$\/\.test\(search\) \? eq\(pandits\.registrationNo, search\)/);
  assert.match(routes, /"\/api\/admin\/pandit-city-requests", adminAuthMiddleware/);
  assert.match(routes, /cityRequest:/);
  assert.match(routes, /Invalid location request resolution/);
});

test("admin registrationNo query is authenticated, exact, bounded, and never falls back to private search", () => {
  assert.match(routes, /app\.get\("\/api\/admin\/pandits", adminAuthMiddleware/);
  assert.match(routes, /const requestedRegistrationNo = req\.query\.registrationNo/);
  assert.match(routes, /typeof requestedRegistrationNo !== "string" \|\| !\/\^\[0-9\]\{10\}\$\/\.test\(requestedRegistrationNo\)/);
  assert.match(routes, /status\(400\)\.json\(\{ message: "registrationNo must be exactly 10 digits" \}\)/);
  assert.match(routes, /typeof requestedRegistrationNo === "string"[\s\S]*?\.where\(eq\(pandits\.registrationNo, requestedRegistrationNo\)\)[\s\S]*?\.limit\(1\)/);
  const explicitBranch = routes.match(/const rows = typeof requestedRegistrationNo === "string"[\s\S]*?: search/)?.[0] || "";
  assert.doesNotMatch(explicitBranch, /ilike\(pandits\.(?:name|phone|email)/);
});

test("public verification endpoint enforces exact grammar and bounded exact lookup", () => {
  assert.match(routes, /"\/api\/pandits\/verify\/:registrationNo"/);
  assert.match(routes, /if \(!\/\^\\d\{10\}\$\/\.test\(registrationNo\)\)/);
  assert.match(routes, /\.where\(eq\(pandits\.registrationNo, registrationNo\)\)[\s\S]+\.limit\(1\)/);
  assert.equal((routes.match(/Pandit verification not found/g) || []).length, 2);
});

test("public verification DTO has an explicit safe allowlist", () => {
  const source = {
    id: 42,
    verified: true,
    registrationNo: "1001000156",
    name: "Pandit Test",
    image: "/uploads/pandit.png",
    specialization: "Vedic Puja",
    languages: "Hindi, Sanskrit",
    experience: 12,
    city: "Varanasi",
    state: "Uttar Pradesh",
    registrationAssignedAt: new Date("2026-09-02T00:00:00Z"),
    slug: "pandit-test-varanasi",
    phone: "9999999999",
    email: "private@example.com",
    bio: "private",
    passwordHash: "private",
  } as any;
  const dto = panditVerificationDto(source);
  assert.deepEqual(Object.keys(dto).sort(), [
    "city", "experience", "image", "languages", "lifetimeMembership", "name",
    "profilePath", "registrationAssignedAt", "registrationNo", "specialization",
    "state", "status",
  ].sort());
  assert.equal(dto.status, "verified");
  assert.equal(dto.profilePath, "/pandit/pandit-test-varanasi");
  for (const sensitive of ["id", "phone", "email", "address", "documents", "passwordHash", "bio"]) {
    assert.equal(sensitive in dto, false);
  }
});

test("known but unverified registration returns inactive identity only", () => {
  const dto = panditVerificationDto({
    verified: false,
    registrationNo: "1001000157",
    name: "Private Name",
    image: "/uploads/private.png",
    specialization: "Private",
    languages: "Private",
    experience: 1,
    city: "Private",
    state: "Private",
    registrationAssignedAt: new Date(),
    slug: "private",
  } as any);
  assert.deepEqual(dto, { status: "inactive", registrationNo: "1001000157" });
});

test("all public storefront and profile projections include only canonical registration identity", () => {
  const source = {
    id: 42,
    name: "Pandit Test",
    slug: "pandit-test",
    city: "Varanasi",
    state: "Uttar Pradesh",
    cityId: 2,
    stateId: 1,
    image: "/uploads/pandit.png",
    bio: "A sufficiently detailed public profile biography for visitors.",
    languages: "Hindi, Sanskrit",
    specialization: "Vedic Puja",
    verified: true,
    onLeave: false,
    locationReviewStatus: "resolved",
    registrationNo: "1001000156",
    legacyRegistrationNo: "VT-PAN-000001",
    membershipNo: "legacy-membership",
    phone: "9999999999",
    email: "private@example.com",
    passwordHash: "private",
    documents: ["private"],
  };
  const storefront = publicStorefrontPanditDto(source);
  const profile = publicPanditDto(source, false);
  assert.equal(storefront.registrationNo, "1001000156");
  assert.equal(profile.registrationNo, "1001000156");
  for (const dto of [storefront, profile]) {
    for (const privateField of ["legacyRegistrationNo", "membershipNo", "phone", "email", "passwordHash", "documents"]) {
      assert.equal(privateField in dto, false, `${privateField} must not be public`);
    }
  }

  const projection = buildPanditSeoNetworkProjection({
    candidates: [{
      pandit: source,
      storefront: { isPublished: true, status: "published", bio: source.bio },
      services: [{
        service: { id: 1, masterServiceId: 1, isActive: true, mode: "in_person" },
        master: { id: 1, name: "Puja", slug: "puja", isActive: true, supportedModes: ["in_person"] },
      }],
    }],
    states: [{ id: 1, name: "Uttar Pradesh", code: "UP", isActive: true }],
    cities: [{ id: 2, stateId: 1, name: "Varanasi", slug: "varanasi", isActive: true }],
  });
  assert.equal(projection.profiles[0].pandit?.registrationNo, "1001000156");
  assert.equal("legacyRegistrationNo" in (projection.profiles[0].pandit || {}), false);
});

test("0012 safely seeds normal-commerce Plastic and Metal card siblings", () => {
  assert.match(commerceMigration, /'pandit-membership-card-plastic', 'pandit-membership-card', 'Plastic'/);
  assert.match(commerceMigration, /'pandit-membership-card-metal', 'pandit-membership-card', 'Metal'/);
  assert.match(commerceMigration, /500, 500/);
  assert.match(commerceMigration, /1000, 1000/);
  assert.match(commerceMigration, /'pandit_membership_card'/);
  assert.doesNotMatch(commerceMigration, /ON CONFLICT/);
  assert.match(commerceMigration, /LOCK TABLE products IN SHARE ROW EXCLUSIVE MODE/);
  assert.match(commerceMigration, /IF target_count > 1 THEN/);
  assert.match(commerceMigration, /RAISE EXCEPTION 'Cannot seed Pandit membership card: duplicate target slug %'/);
  assert.equal((commerceMigration.match(/IF NOT FOUND THEN/g) || []).length, 2);
  assert.equal((commerceMigration.match(/UPDATE products SET/g) || []).length, 2);
  const updates = commerceMigration.match(/UPDATE products SET[\s\S]*?WHERE slug = '[^']+';/g) || [];
  assert.equal(updates.length, 2);
  for (const update of updates) {
    assert.doesNotMatch(update, /\bprice\s*=/);
    assert.doesNotMatch(update, /\bstock\s*=/);
  }
  assert.match(commerceMigration, /\/og\/og-pandit-registration\.jpg/);
  assert.match(seed, /p\.productType !== "pandit_membership_card"/);
  assert.match(seed, /"pandit-membership-card-plastic"/);
  assert.match(seed, /"pandit-membership-card-metal"/);
});

test("all four card-aware checkout paths gate authoritative card items", () => {
  assert.equal((routes.match(/stampPanditMembershipCardItems\(req,/g) || []).length, 4);
  assert.match(routes, /item\.productType === "pandit_membership_card"/);
  assert.match(routes, /validatePanditSession\(token\)/);
  assert.match(routes, /isPanditEligibleForMembershipCardOrder\(pandit\)/);
  assert.match(routes, /quantity < 1 \|\| quantity > 10/);
  assert.match(routes, /panditRegistrationNo: pandit\.registrationNo/);
  assert.match(routes, /productType: product\.productType/);
  assert.match(routes, /trustedPrice = \(product\.salePrice && product\.salePrice > 0\) \? product\.salePrice : product\.price/);
});

test("all card order paths reject stale client inventory using authoritative stock", () => {
  assert.equal((routes.match(/stampPanditMembershipCardItems\(req,/g) || []).length, 4);
  assert.match(routes, /const product = await storage\.getProduct\(productId\)/);
  assert.match(routes, /product\.stock <= 0 \|\| quantity > product\.stock/);
  assert.match(routes, /status: 409, message: "Requested membership card quantity is unavailable"/);
  assert.match(routes, /status\(mockCardItems\.status \|\| 403\)/);
  assert.match(routes, /status\(paymentCardItems\.status \|\| 403\)/);
  assert.match(routes, /status\(checkoutCardItems\.status \|\| 403\)/);
  assert.match(routes, /quantitiesByProduct\.set\(productId, \(quantitiesByProduct\.get\(productId\) \|\| 0\) \+ quantity\)/);
});

test("card checkout bypasses are rejected while ordinary checkout falls through", () => {
  assert.match(routes, /Membership cards require a checkoutIntentId/);
  assert.match(routes, /Membership card prepaid orders must use Razorpay checkout/);
  assert.match(routes, /Membership cards must be purchased through authenticated checkout/);
  assert.match(routes, /if \(!await requestHasMembershipCard\(req\.body\?\.items\)\) return next\(\)/);
  assert.match(routes, /Loyalty redemption is not available for membership card orders/);
  assert.match(routes, /hasMembershipCard && \(Number\(input\.loyaltyPointsRedeem \|\| 0\) > 0 \|\| input\.loyaltyUserId != null\)/);
  assert.match(routes, /const canonical = await canonicalizeCheckout\(req, req\.body\.orderData, "prepaid"\)/);
});

test("0013 defines idempotent intent and allocation persistence without historical rewrites", () => {
  assert.match(checkoutMigration, /CREATE TABLE IF NOT EXISTS checkout_payment_intents/);
  assert.match(checkoutMigration, /CREATE TABLE IF NOT EXISTS order_inventory_allocations/);
  assert.match(checkoutMigration, /canonical_payload jsonb NOT NULL/);
  assert.match(checkoutMigration, /UNIQUE\(order_id, product_id\)/);
  assert.doesNotMatch(checkoutMigration, /UPDATE orders|DELETE FROM orders|TRUNCATE/);
});

test("intent finalization is locked, exact, rollback-safe, and retry-idempotent", () => {
  const operations = readFileSync("server/order-operations.ts", "utf8");
  assert.match(routes, /checkout_payment_intents WHERE id=\$1 FOR UPDATE/);
  assert.match(routes, /intent\.status === "consumed"[\s\S]*existingOrderId: intent\.consumed_order_id/);
  assert.match(routes, /gateway\.currency !== "INR" \|\| Number\(gateway\.amount_paid \?\? gateway\.amount\) !== Number\(intent\.amount_paise\)/);
  assert.match(routes, /UPDATE products SET stock=stock-\$1[\s\S]*stock >= \$1 RETURNING id/);
  assert.match(routes, /decrementMembershipCardInventory\(canonical\.allocations/);
  assert.match(operations, /if \(!await decrementIfAvailable\(allocation\)\)[\s\S]*status: 409/);
  assert.match(routes, /catch \(error\) \{ await client\.query\("ROLLBACK"\)/);
  assert.match(routes, /status='expired'[\s\S]*Checkout intent has expired/);
});

test("cancellation releases each allocation once and never release-on-refund", () => {
  const storage = readFileSync("server/storage.ts", "utf8");
  assert.match(storage, /input\.nextStatus === "cancelled"/);
  assert.match(storage, /released_at IS NULL/);
  assert.match(storage, /SET released_at = now\(\), updated_at = now\(\)/);
  assert.match(storage, /SET stock = stock \+ \$\{Number\(allocation\.quantity\)\}/);
  assert.doesNotMatch(storage, /input\.nextStatus === "refunded"[\s\S]*released_at/);
});

test("non-card Razorpay mock preserves its prior client economics", () => {
  assert.match(routes, /if \(!hasMembershipCard\) \{[\s\S]*Preserve the legacy dev-mock contract exactly/);
  assert.match(routes, /totalAmount: hasMembershipCard[\s\S]*: orderData\?\.totalAmount \|\| 0/);
  assert.match(routes, /couponDiscount: orderData\?\.couponDiscount \|\| 0/);
  assert.match(routes, /prepaidDiscount: orderData\?\.prepaidDiscount \|\| 0/);
  assert.match(routes, /shippingCharges: orderData\?\.shippingCharges \|\| 0/);
  assert.match(routes, /codCharges: orderData\?\.codCharges \|\| 0/);
  assert.match(routes, /paymentMethod: orderData\?\.paymentMethod \|\| "prepaid"/);
});

test("card product discovery is protected and exposes no checkout ownership input", () => {
  assert.match(routes, /"\/api\/pandit\/membership-card-products"/);
  assert.match(routes, /Pandit authentication required/);
  assert.match(routes, /const pandit = await storage\.getPandit\(panditId\)/);
  assert.match(routes, /if \(!isPanditEligibleForMembershipCardOrder\(pandit\)\)/);
  assert.match(routes, /status\(403\)\.json\(\{ message: "An approved Pandit membership is required to view membership cards"/);
  assert.match(routes, /pandit\?\.verified === true[\s\S]*\^\\d\{10\}\$/);
  assert.match(routes, /eq\(products\.productType, "pandit_membership_card"\)/);
  assert.match(routes, /variationGroupId === "pandit-membership-card"/);
  assert.match(routes, /available: product\.stock > 0/);
});