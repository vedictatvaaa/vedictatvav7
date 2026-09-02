import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, jsonb, real, check, uniqueIndex, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  role: text("role").notNull().default("user"),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password"),
  googleId: text("google_id").unique(),
  avatarUrl: text("avatar_url"),
  emailVerified: boolean("email_verified").notNull().default(false),
  phone: text("phone"),
  city: text("city"),
  gotra: text("gotra"),
  birthDate: text("birth_date"),
  birthTime: text("birth_time"),
  birthCity: text("birth_city"),
  twoFactorSecret: text("two_factor_secret"),
  twoFactorEnabled: boolean("two_factor_enabled").notNull().default(false),
  twoFactorMethod: text("two_factor_method").default("authenticator"),
  recoveryCodes: text("recovery_codes").array().notNull().default(sql`'{}'::text[]`),
  passwordResetToken: text("password_reset_token"),
  passwordResetExpires: timestamp("password_reset_expires"),
  loyaltyPoints: integer("loyalty_points").notNull().default(0),
  referralCode: text("referral_code").unique(),
  referredByUserId: integer("referred_by_user_id"),
  referralBonusPaid: boolean("referral_bonus_paid").notNull().default(false),
});

export const loyaltyTransactions = pgTable("loyalty_transactions", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").notNull(),
  delta: integer("delta").notNull(),
  reason: text("reason").notNull(),
  refType: text("ref_type"),
  refId: text("ref_id"),
  note: text("note"),
  balanceAfter: integer("balance_after").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  userIdIdx: index("loyalty_transactions_user_id_idx").on(t.userId),
}));

export const adminSessions = pgTable("admin_sessions", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").notNull(),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const products = pgTable("products", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: integer("price").notNull(),
  mrp: integer("mrp"),
  upcEan: text("upc_ean"),
  brand: text("brand").default("Vedic Tatva"),
  stock: integer("stock").notNull().default(50),
  category: text("category").notNull(),
  image: text("image").notNull(),
  images: text("images").array(),
  imageAlts: text("image_alts").array(),
  badge: text("badge"),
  salesCount: integer("sales_count").notNull().default(0),
  highlights: text("highlights").array(),
  features: text("features").array(),
  richDescription: text("rich_description"),
  aplusImages: text("aplus_images").array(),
  aplusEnabled: boolean("aplus_enabled").notNull().default(false),
  slug: text("slug"),
  variationGroupId: text("variation_group_id"),
  variationLabel: text("variation_label"),
  variations: text("variations"),
  gstPercent: integer("gst_percent").notNull().default(18),
  hsnCode: text("hsn_code"),
  costPrice: integer("cost_price"),
  productType: text("product_type").notNull().default("product"),
  seoFocusKeyword: text("seo_focus_keyword"),
  seoFaq: jsonb("seo_faq"),
  seoVideoUrl: text("seo_video_url"),
}, (t) => ({
  slugIdx: index("products_slug_idx").on(t.slug),
  categoryIdx: index("products_category_idx").on(t.category),
  salesCountIdx: index("products_sales_count_idx").on(t.salesCount),
}));

export const productReviews = pgTable("product_reviews", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  productId: integer("product_id").notNull(),
  reviewerName: text("reviewer_name").notNull(),
  reviewerCity: text("reviewer_city"),
  rating: integer("rating").notNull().default(5),
  title: text("title").notNull(),
  body: text("body").notNull(),
  images: text("images").array(),
  customerEmail: text("customer_email"),
  verified: boolean("verified").notNull().default(false),
  isBoosted: boolean("is_boosted").notNull().default(false),
  helpful: integer("helpful").notNull().default(0),
  status: text("status").notNull().default("approved"),
  moderatedBy: text("moderated_by"),
  moderatedAt: timestamp("moderated_at"),
  rejectReason: text("reject_reason"),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => ({
  productIdIdx: index("product_reviews_product_id_idx").on(t.productId),
  statusIdx: index("product_reviews_status_idx").on(t.status),
}));

export const reviewHelpfulVotes = pgTable("review_helpful_votes", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  reviewId: integer("review_id").notNull(),
  voterKey: text("voter_key").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  reviewVoterUniq: uniqueIndex("review_helpful_votes_review_voter_uniq").on(t.reviewId, t.voterKey),
}));

export const productQuestions = pgTable("product_questions", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  productId: integer("product_id").notNull(),
  askerName: text("asker_name").notNull(),
  askerEmail: text("asker_email"),
  question: text("question").notNull(),
  answer: text("answer"),
  answeredBy: text("answered_by"),
  answeredAt: timestamp("answered_at"),
  status: text("status").notNull().default("pending"),
  helpful: integer("helpful").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const orders = pgTable("orders", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id"),
  customerName: text("customer_name"),
  customerEmail: text("customer_email"),
  customerPhone: text("customer_phone"),
  totalAmount: integer("total_amount").notNull(),
  subtotal: integer("subtotal"),
  gstAmount: integer("gst_amount"),
  status: text("status").notNull().default("pending"),
  items: jsonb("items").notNull(),
  shippingAddress: text("shipping_address"),
  billingAddress: text("billing_address"),
  customerState: text("customer_state"),
  paymentId: text("payment_id"),
  paymentMethod: text("payment_method"),
  couponCode: text("coupon_code"),
  couponDiscount: integer("coupon_discount").default(0),
  prepaidDiscount: integer("prepaid_discount").default(0),
  shippingCharges: integer("shipping_charges").default(0),
  codCharges: integer("cod_charges").default(0),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => ({
  userIdIdx: index("orders_user_id_idx").on(t.userId),
  customerEmailIdx: index("orders_customer_email_idx").on(t.customerEmail),
  statusIdx: index("orders_status_idx").on(t.status),
  createdAtIdx: index("orders_created_at_idx").on(t.createdAt),
}));

// Append-only audit trail for operational status changes. Historical orders are
// intentionally not backfilled: their existing createdAt remains authoritative.
export const orderStatusEvents = pgTable("order_status_events", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  orderId: integer("order_id").notNull().references(() => orders.id),
  previousStatus: text("previous_status").notNull(),
  nextStatus: text("next_status").notNull(),
  actorType: text("actor_type").notNull().default("admin"),
  actorLabel: text("actor_label"),
  reason: text("reason"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => ({
  orderCreatedIdx: index("order_status_events_order_created_idx").on(t.orderId, t.createdAt),
}));

export const invoices = pgTable("invoices", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  orderId: integer("order_id").notNull(),
  invoiceNumber: text("invoice_number").notNull().unique(),
  financialYear: text("financial_year").notNull(),
  sequenceNumber: integer("sequence_number").notNull(),
  subtotal: integer("subtotal").notNull(),
  cgstAmount: integer("cgst_amount").notNull().default(0),
  sgstAmount: integer("sgst_amount").notNull().default(0),
  igstAmount: integer("igst_amount").notNull().default(0),
  totalGst: integer("total_gst").notNull(),
  roundOff: integer("round_off").notNull().default(0),
  grandTotal: integer("grand_total").notNull(),
  customerState: text("customer_state"),
  isIgst: boolean("is_igst").notNull().default(false),
  pdfUrl: text("pdf_url"),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => ({
  orderIdIdx: index("invoices_order_id_idx").on(t.orderId),
}));

export const dispatches = pgTable("dispatches", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  orderId: integer("order_id").notNull(),
  courierName: text("courier_name"),
  trackingNumber: text("tracking_number"),
  waybill: text("waybill"),
  dispatchLabelUrl: text("dispatch_label_url"),
  dispatchDate: timestamp("dispatch_date").defaultNow(),
  // Shiprocket integration fields. Populated when admin creates a shipment via
  // the Shiprocket workflow; manual dispatches leave them null and the row
  // continues to behave exactly as before.
  shiprocketOrderId: text("shiprocket_order_id"),
  shiprocketShipmentId: text("shiprocket_shipment_id"),
  courierCompanyId: integer("courier_company_id"),
  pickupScheduledDate: timestamp("pickup_scheduled_date"),
  pickupTokenNumber: text("pickup_token_number"),
  manifestUrl: text("manifest_url"),
  shippingStatus: text("shipping_status"),
  weightGrams: integer("weight_grams"),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => ({
  orderIdIdx: index("dispatches_order_id_idx").on(t.orderId),
}));

export const indianStates = pgTable("indian_states", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  code: varchar("code", { length: 3 }).notNull(),
  isUnionTerritory: boolean("is_union_territory").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => ({
  nameUnique: uniqueIndex("indian_states_name_unique").on(t.name),
  codeUnique: uniqueIndex("indian_states_code_unique").on(t.code),
  activeIdx: index("indian_states_active_idx").on(t.isActive),
}));

export const indianCities = pgTable("indian_cities", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  stateId: integer("state_id").notNull().references(() => indianStates.id),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  aliases: text("aliases").array().notNull().default(sql`'{}'::text[]`),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => ({
  stateNameUnique: uniqueIndex("indian_cities_state_name_unique").on(t.stateId, t.name),
  slugUnique: uniqueIndex("indian_cities_slug_unique").on(t.slug),
  stateActiveIdx: index("indian_cities_state_active_idx").on(t.stateId, t.isActive),
}));

export const pandits = pgTable("pandits", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  city: text("city").notNull(),
  specialization: text("specialization").notNull(),
  languages: text("languages").notNull(),
  experience: integer("experience").notNull(),
  fees: integer("fees").notNull(),
  rating: real("rating").notNull().default(4.5),
  reviewCount: integer("review_count").notNull().default(0),
  verified: boolean("verified").notNull().default(false),
  image: text("image"),
  phone: text("phone"),
  email: text("email"),
  bio: text("bio"),
  education: text("education"),
  createdAt: timestamp("created_at").defaultNow(),
  boostType: text("boost_type"),
  boostStartDate: timestamp("boost_start_date"),
  boostEndDate: timestamp("boost_end_date"),
  boostActive: boolean("boost_active").notNull().default(false),
  slug: text("slug").unique(),
  latitude: real("latitude"),
  longitude: real("longitude"),
  serviceArea: text("service_area"),
  regionalOrigin: text("regional_origin"),
  availability: text("availability").default("available"),
  passwordHash: text("password_hash"),
  lastLoginAt: timestamp("last_login_at"),
  commissionPct: integer("commission_pct").default(25),
  tier: text("tier").notNull().default("free"), // free | silver | gold | guru_elite
  // Optional UTC expiry for paid tiers. NULL = perpetual (legacy/admin set).
  // Server treats expired rows as effectively "free" until renewal.
  tierExpiresAt: timestamp("tier_expires_at"),
  state: text("state"), // for gold-tier state-wide reach matching
  stateId: integer("state_id").references(() => indianStates.id),
  cityId: integer("city_id").references(() => indianCities.id),
  // Keeps the submitted legacy value when a row is normalized to a master city.
  originalCity: text("original_city"),
  originalState: text("original_state"),
  locationReviewStatus: text("location_review_status").default("needs_review"),
  // Pandit storefronts (Phase 2 affiliate program):
  // commission % the pandit earns on referred shop product orders.
  // Tier defaults: free=0, silver=8, gold=12, guru_elite=15.
  // Stored per-pandit so admin can override on a case-by-case basis.
  productCommissionPct: integer("product_commission_pct").default(0),
  // Lifelong member id stamped automatically on account creation. Format
  // VT-PND-<id padded to 5 digits>. Immutable once set.
  membershipNo: text("membership_no").unique(),
  // Permanent 10-digit lifetime identity, allocated only by transactional approval.
  registrationNo: text("registration_no"),
  // Legacy registration value retained only when 0011 converts a historical
  // prefixed identity. It is audit data, not a public membership identifier.
  legacyRegistrationNo: text("legacy_registration_no"),
  registrationAssignedAt: timestamp("registration_assigned_at"),
  // Admin-controlled flag. When true, the pandit can download/share their
  // dual-sided business card from the dashboard. Defaults to true so any
  // pandit (incl. seeded fixtures) gets immediate access; admin can revoke.
  cardIssued: boolean("card_issued").notNull().default(true),
  cardIssuedAt: timestamp("card_issued_at"),
  // Server-synced leave status. When true, the pandit is hidden from the
  // public "Online now" indicator and the bulk listing surfaces an off-duty
  // signal. Set + cleared via /api/pandit/availability/leave from the
  // pandit portal Settings tab.
  onLeave: boolean("on_leave").notNull().default(false),
  leaveNote: text("leave_note"),
  leaveStartedAt: timestamp("leave_started_at"),
}, (t) => ({
  cityIdx: index("pandits_city_idx").on(t.city),
  stateIdx: index("pandits_state_idx").on(t.state),
  stateIdIdx: index("pandits_state_id_idx").on(t.stateId),
  cityIdIdx: index("pandits_city_id_idx").on(t.cityId),
  registrationNoUnique: uniqueIndex("pandits_registration_no_unique").on(t.registrationNo)
    .where(sql`${t.registrationNo} is not null`),
  legacyRegistrationNoUnique: uniqueIndex("pandits_legacy_registration_no_unique").on(t.legacyRegistrationNo)
    .where(sql`${t.legacyRegistrationNo} is not null`),
  verifiedIdx: index("pandits_verified_idx").on(t.verified),
  boostActiveIdx: index("pandits_boost_active_idx").on(t.boostActive),
}));

export const panditSessions = pgTable("pandit_sessions", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  panditId: integer("pandit_id").notNull(),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const panditApplications = pgTable("pandit_applications", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  fullName: text("full_name").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  city: text("city").notNull(),
  state: text("state"),
  stateId: integer("state_id").references(() => indianStates.id),
  cityId: integer("city_id").references(() => indianCities.id),
  originalCity: text("original_city"),
  originalState: text("original_state"),
  locationReviewStatus: text("location_review_status").default("needs_review"),
  serviceArea: text("service_area"),
  regionalOrigin: text("regional_origin"),
  gotra: text("gotra"),
  parampara: text("parampara"),
  vedaSpecialization: text("veda_specialization"),
  yearsExperience: integer("years_experience").notNull(),
  pujaTypes: text("puja_types").notNull(),
  languages: text("languages").notNull(),
  feeRangeMin: integer("fee_range_min").notNull(),
  feeRangeMax: integer("fee_range_max").notNull(),
  education: text("education"),
  certificates: text("certificates"),
  aadhaarLast4: text("aadhaar_last4"),
  panMasked: text("pan_masked"),
  sampleVideoUrl: text("sample_video_url"),
  photo: text("photo"),
  bio: text("bio"),
  membership: text("membership").default("free"),
  status: text("status").notNull().default("pending"),
  adminNote: text("admin_note"),
  reviewedAt: timestamp("reviewed_at"),
  // Set exactly once when approval transaction creates the authoritative Pandit.
  panditId: integer("pandit_id").references(() => pandits.id),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => ({
  stateIdIdx: index("pandit_applications_state_id_idx").on(t.stateId),
  cityIdIdx: index("pandit_applications_city_id_idx").on(t.cityId),
  panditUnique: uniqueIndex("pandit_applications_pandit_id_unique").on(t.panditId)
    .where(sql`${t.panditId} is not null`),
}));

export const panditCityRequests = pgTable("pandit_city_requests", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  applicationId: integer("application_id").notNull().references(() => panditApplications.id),
  stateId: integer("state_id").notNull().references(() => indianStates.id),
  proposedCityName: text("proposed_city_name").notNull(),
  status: text("status").notNull().default("pending"),
  resolvedCityId: integer("resolved_city_id").references(() => indianCities.id),
  resolutionReason: text("resolution_reason"),
  resolvedBy: text("resolved_by"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  resolvedAt: timestamp("resolved_at"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => ({
  applicationUnique: uniqueIndex("pandit_city_requests_application_unique").on(t.applicationId),
  statusIdx: index("pandit_city_requests_status_idx").on(t.status, t.createdAt),
  stateIdx: index("pandit_city_requests_state_idx").on(t.stateId),
}));

export const franchiseApplications = pgTable("franchise_applications", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  fullName: text("full_name").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  city: text("city").notNull(),
  state: text("state"),
  pincode: text("pincode"),
  model: text("model").notNull(),
  investmentReady: text("investment_ready"),
  occupation: text("occupation"),
  hasShop: boolean("has_shop").notNull().default(false),
  shopArea: text("shop_area"),
  whyJoin: text("why_join"),
  hearAbout: text("hear_about"),
  status: text("status").notNull().default("new"),
  adminNote: text("admin_note"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const panditReviews = pgTable("pandit_reviews", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  panditId: integer("pandit_id").notNull(),
  reviewerName: text("reviewer_name").notNull(),
  reviewerEmail: text("reviewer_email"),
  reviewerCity: text("reviewer_city"),
  rating: real("rating").notNull(),
  comment: text("comment"),
  serviceType: text("service_type"),
  // Pandit's public reply to a review. Plain text, surfaced under the
  // review on the public profile and inside the customer's notification
  // (when wired). Null until the pandit responds.
  panditReply: text("pandit_reply"),
  panditRepliedAt: timestamp("pandit_replied_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => ({
  panditIdIdx: index("pandit_reviews_pandit_id_idx").on(t.panditId),
}));

export const astrologers = pgTable("astrologers", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  city: text("city").notNull(),
  specialization: text("specialization").notNull(),
  languages: text("languages").notNull(),
  experience: integer("experience").notNull(),
  fees: integer("fees").notNull(),
  rating: real("rating").notNull().default(4.5),
  reviewCount: integer("review_count").notNull().default(0),
  verified: boolean("verified").notNull().default(false),
  image: text("image"),
  phone: text("phone"),
  email: text("email"),
  bio: text("bio"),
  certification: text("certification"),
  boostType: text("boost_type"),
  boostStartDate: timestamp("boost_start_date"),
  boostEndDate: timestamp("boost_end_date"),
  boostActive: boolean("boost_active").notNull().default(false),
  // AstroTalk-style real-time consultation fields
  password: text("password"),                         // bcrypt; nullable for legacy/admin-created rows
  chatRatePaisePerMin: integer("chat_rate_paise_per_min").notNull().default(1500), // ₹15/min default
  callRatePaisePerMin: integer("call_rate_paise_per_min").notNull().default(2500), // ₹25/min default
  online: boolean("online").notNull().default(false),
  acceptingChat: boolean("accepting_chat").notNull().default(true),
  acceptingCall: boolean("accepting_call").notNull().default(true),
  lastSeenAt: timestamp("last_seen_at"),
  totalEarningsPaise: integer("total_earnings_paise").notNull().default(0),
  totalSessions: integer("total_sessions").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Astrologer portal sessions (auth tokens)
export const astrologerPortalSessions = pgTable("astrologer_portal_sessions", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  astrologerId: integer("astrologer_id").notNull(),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => ({
  tokenIdx: index("astrologer_portal_sessions_token_idx").on(t.token),
}));

// User wallet (one row per user; balance in paise to avoid float math)
export const userWallets = pgTable("user_wallets", {
  userId: integer("user_id").primaryKey(),
  balancePaise: integer("balance_paise").notNull().default(0),
  totalRechargedPaise: integer("total_recharged_paise").notNull().default(0),
  totalSpentPaise: integer("total_spent_paise").notNull().default(0),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Wallet ledger
export const walletTransactions = pgTable("wallet_transactions", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").notNull(),
  kind: text("kind").notNull(),                       // recharge | bonus | session_debit | refund | adjustment
  amountPaise: integer("amount_paise").notNull(),     // positive = credit, negative = debit
  balanceAfterPaise: integer("balance_after_paise").notNull(),
  refType: text("ref_type"),                          // razorpay | session | admin | promo
  refId: text("ref_id"),
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  userIdIdx: index("wallet_txn_user_id_idx").on(t.userId),
  kindIdx: index("wallet_txn_kind_idx").on(t.kind),
}));

// Per-minute consultation sessions (chat now, call later)
export const astrologerSessions = pgTable("astrologer_sessions", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").notNull(),
  astrologerId: integer("astrologer_id").notNull(),
  mode: text("mode").notNull(),                       // chat | call
  status: text("status").notNull().default("waiting"), // waiting | active | ended | cancelled | timeout
  ratePaisePerMin: integer("rate_paise_per_min").notNull(),
  freeMinutesGranted: integer("free_minutes_granted").notNull().default(0),
  freeMinutesUsed: integer("free_minutes_used").notNull().default(0),
  startedAt: timestamp("started_at"),
  acceptedAt: timestamp("accepted_at"),
  endedAt: timestamp("ended_at"),
  endedBy: text("ended_by"),                          // user | astrologer | system_zero_balance | system_timeout
  durationSec: integer("duration_sec").notNull().default(0),
  paidMinutes: integer("paid_minutes").notNull().default(0),
  amountChargedPaise: integer("amount_charged_paise").notNull().default(0),
  astrologerEarningsPaise: integer("astrologer_earnings_paise").notNull().default(0),
  lastTickAt: timestamp("last_tick_at"),
  ratingId: integer("rating_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  userIdIdx: index("astro_sessions_user_idx").on(t.userId),
  astrologerIdIdx: index("astro_sessions_astrologer_idx").on(t.astrologerId),
  statusIdx: index("astro_sessions_status_idx").on(t.status),
}));

export const sessionMessages = pgTable("session_messages", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  sessionId: integer("session_id").notNull(),
  senderType: text("sender_type").notNull(),          // user | astrologer | system
  body: text("body").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  sessionIdIdx: index("session_messages_session_idx").on(t.sessionId),
}));

export const sessionRatings = pgTable("session_ratings", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  sessionId: integer("session_id").notNull().unique(),
  userId: integer("user_id").notNull(),
  astrologerId: integer("astrologer_id").notNull(),
  rating: integer("rating").notNull(),                // 1..5
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Free-chat grants (e.g. first 5 minutes free for new user)
export const freeChatGrants = pgTable("free_chat_grants", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").notNull(),
  astrologerId: integer("astrologer_id"),             // null = any astrologer
  minutesGranted: integer("minutes_granted").notNull().default(5),
  minutesUsed: integer("minutes_used").notNull().default(0),
  reason: text("reason").notNull().default("first_chat"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  userIdIdx: index("free_chat_grants_user_idx").on(t.userId),
}));

export const insertUserWalletSchema = createInsertSchema(userWallets);
export const insertWalletTransactionSchema = createInsertSchema(walletTransactions).omit({ id: true, createdAt: true });
export const insertAstrologerSessionSchema = createInsertSchema(astrologerSessions).omit({ id: true, createdAt: true });
export const insertSessionMessageSchema = createInsertSchema(sessionMessages).omit({ id: true, createdAt: true });
export const insertSessionRatingSchema = createInsertSchema(sessionRatings).omit({ id: true, createdAt: true });
export const insertFreeChatGrantSchema = createInsertSchema(freeChatGrants).omit({ id: true, createdAt: true });
export type UserWallet = typeof userWallets.$inferSelect;
export type WalletTransaction = typeof walletTransactions.$inferSelect;
export type InsertWalletTransaction = z.infer<typeof insertWalletTransactionSchema>;
export type AstrologerSession = typeof astrologerSessions.$inferSelect;
export type InsertAstrologerSession = z.infer<typeof insertAstrologerSessionSchema>;
export type SessionMessage = typeof sessionMessages.$inferSelect;
export type InsertSessionMessage = z.infer<typeof insertSessionMessageSchema>;
export type SessionRating = typeof sessionRatings.$inferSelect;
export type FreeChatGrant = typeof freeChatGrants.$inferSelect;
export type AstrologerPortalSession = typeof astrologerPortalSessions.$inferSelect;

export const pujaBookings = pgTable("puja_bookings", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id"),
  panditId: integer("pandit_id"),
  panditServiceId: integer("pandit_service_id"),
  panditPackageId: integer("pandit_package_id"),
  pricingSnapshot: jsonb("pricing_snapshot"),
  pujaType: text("puja_type").notNull(),
  mode: text("mode").notNull().default("offline"),
  date: text("date").notNull(),
  timeSlot: text("time_slot").notNull(),
  location: text("location"),
  contactName: text("contact_name").notNull(),
  contactPhone: text("contact_phone").notNull(),
  status: text("status").notNull().default("pending"),
  totalAmount: integer("total_amount").notNull(),
  acceptedAt: timestamp("accepted_at"),
  confirmedTimeSlot: text("confirmed_time_slot"),
  samagriList: jsonb("samagri_list"),
  samagriSentAt: timestamp("samagri_sent_at"),
  tipAmountInr: integer("tip_amount_inr").notNull().default(0),
  tipPaidAt: timestamp("tip_paid_at"),
  completedAt: timestamp("completed_at"),
  declineReason: text("decline_reason"),
  accessToken: text("access_token"),
  needsReassignment: boolean("needs_reassignment").notNull().default(false),
  reassignmentFlaggedAt: timestamp("reassignment_flagged_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => ({
  userIdIdx: index("puja_bookings_user_id_idx").on(t.userId),
  panditIdIdx: index("puja_bookings_pandit_id_idx").on(t.panditId),
  panditServiceIdIdx: index("puja_bookings_pandit_service_id_idx").on(t.panditServiceId),
  panditPackageIdIdx: index("puja_bookings_pandit_package_id_idx").on(t.panditPackageId),
  statusIdx: index("puja_bookings_status_idx").on(t.status),
  needsReassignmentIdx: index("puja_bookings_needs_reassignment_idx").on(t.needsReassignment),
}));

export const pujaBookingMessages = pgTable("puja_booking_messages", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  bookingId: integer("booking_id").notNull(),
  senderType: text("sender_type").notNull(), // 'pandit' | 'customer' | 'system'
  senderName: text("sender_name").notNull(),
  message: text("message").notNull(),
  attachmentUrl: text("attachment_url"),
  readByCustomer: boolean("read_by_customer").notNull().default(false),
  readByPandit: boolean("read_by_pandit").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});
export const insertPujaBookingMessageSchema = createInsertSchema(pujaBookingMessages).omit({ id: true, createdAt: true, readByCustomer: true, readByPandit: true });
export type PujaBookingMessage = typeof pujaBookingMessages.$inferSelect;
export type InsertPujaBookingMessage = z.infer<typeof insertPujaBookingMessageSchema>;

// Anonymous pre-booking chat between a logged-in user and a pandit.
// Contact details (phone/email/URL) are sanitized server-side before insert.
export const panditChats = pgTable("pandit_chats", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  panditId: integer("pandit_id").notNull(),
  userId: integer("user_id").notNull(),
  userEmail: text("user_email").notNull(),
  senderType: text("sender_type").notNull(), // 'user' | 'pandit' | 'system'
  message: text("message").notNull(),
  attachmentUrl: text("attachment_url"),
  sanitized: boolean("sanitized").notNull().default(false),
  readByUser: boolean("read_by_user").notNull().default(false),
  readByPandit: boolean("read_by_pandit").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});
export const insertPanditChatSchema = createInsertSchema(panditChats).omit({ id: true, createdAt: true, sanitized: true, readByUser: true, readByPandit: true });
export type PanditChat = typeof panditChats.$inferSelect;
export type InsertPanditChat = z.infer<typeof insertPanditChatSchema>;

// Pandit-curated memory of important dates per yajamana (client). Auto-seeded
// from past bookings + manually added by the pandit. Used to surface upcoming
// anniversaries / shradh tithis in the dashboard so the pandit can proactively
// reach out. customerKey mirrors the pandit-tools customer aggregation keys
// ("u:<userId>" or "p:<phone>") so a single client maps to one row set.
export const panditClientMemories = pgTable("pandit_client_memories", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  panditId: integer("pandit_id").notNull(),
  customerKey: text("customer_key").notNull(),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone"),
  // birthday | anniversary | shradh | naamkaran | mundan | griha_pravesh | other
  kind: text("kind").notNull(),
  label: text("label").notNull(),
  // Either an ISO date (YYYY-MM-DD) or a free-text tithi like "Krishna Paksha
  // Trayodashi". `dateText` is canonical; `tithi` is the human label when the
  // date repeats by lunar calendar.
  dateText: text("date_text"),
  tithi: text("tithi"),
  // Days before the date that the pandit wants a reminder. 0 = on the day.
  notifyDaysBefore: integer("notify_days_before").notNull().default(3),
  notes: text("notes"),
  // Updated by the reminder cron so we don't double-send within the same year.
  lastNotifiedYear: integer("last_notified_year"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export const insertPanditClientMemorySchema = createInsertSchema(panditClientMemories).omit({ id: true, createdAt: true, lastNotifiedYear: true });
export type PanditClientMemory = typeof panditClientMemories.$inferSelect;
export type InsertPanditClientMemory = z.infer<typeof insertPanditClientMemorySchema>;

// Payment requests a pandit raises against a yajamana for dakshina, samagri,
// or out-of-band services. Backed by a Razorpay Payment Link (short_url) so
// the client can pay over WhatsApp/email without a custom checkout page.
// Status transitions: pending -> paid (webhook or pandit mark) | cancelled.
export const panditPaymentRequests = pgTable("pandit_payment_requests", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  panditId: integer("pandit_id").notNull(),
  customerKey: text("customer_key"),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone").notNull(),
  customerEmail: text("customer_email"),
  amountInr: integer("amount_inr").notNull(),
  purpose: text("purpose").notNull(),
  notes: text("notes"),
  status: text("status").notNull().default("pending"),
  // Razorpay Payment Link references.
  // Random opaque token used in the public lookup URL so the row cannot be
  // enumerated by sequential id. 32 hex chars from crypto.randomBytes(16).
  publicToken: text("public_token").unique(),
  rpLinkId: text("rp_link_id"),
  rpShortUrl: text("rp_short_url"),
  rpPaymentId: text("rp_payment_id"),
  paidAt: timestamp("paid_at"),
  // Pandit-side note explaining a manual mark-as-paid (cash/UPI direct).
  manualPaidNote: text("manual_paid_note"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export const insertPanditPaymentRequestSchema = createInsertSchema(panditPaymentRequests).omit({
  id: true, createdAt: true, paidAt: true, status: true, publicToken: true,
  rpLinkId: true, rpShortUrl: true, rpPaymentId: true, manualPaidNote: true,
});
export type PanditPaymentRequest = typeof panditPaymentRequests.$inferSelect;
export type InsertPanditPaymentRequest = z.infer<typeof insertPanditPaymentRequestSchema>;

export const pujaTips = pgTable("puja_tips", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  bookingId: integer("booking_id").notNull(),
  panditId: integer("pandit_id").notNull(),
  userId: integer("user_id"),
  amountInr: integer("amount_inr").notNull(),
  paymentMethod: text("payment_method").notNull().default("razorpay"),
  paymentRef: text("payment_ref").unique(),
  status: text("status").notNull().default("pending"), // pending|paid|failed
  message: text("message"),
  createdAt: timestamp("created_at").defaultNow(),
});
export type PujaTip = typeof pujaTips.$inferSelect;

export const astrologyBookings = pgTable("astrology_bookings", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id"),
  serviceType: text("service_type").notNull(),
  fullName: text("full_name").notNull(),
  birthDate: text("birth_date").notNull(),
  birthTime: text("birth_time"),
  birthCity: text("birth_city"),
  partnerName: text("partner_name"),
  partnerBirthDate: text("partner_birth_date"),
  status: text("status").notNull().default("pending"),
  totalAmount: integer("total_amount").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const socialProofSettings = pgTable("social_proof_settings", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  realRatio: integer("real_ratio").notNull().default(60),
  boostRatio: integer("boost_ratio").notNull().default(40),
  viewMin: integer("view_min").notNull().default(12),
  viewMax: integer("view_max").notNull().default(45),
  salesBoostPercent: integer("sales_boost_percent").notNull().default(15),
  urgencyEnabled: boolean("urgency_enabled").notNull().default(true),
  enabled: boolean("enabled").notNull().default(true),
});

export const boostEvents = pgTable("boost_events", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  city: text("city").notNull(),
  productId: integer("product_id"),
  type: text("type").notNull(),
});

// FOMO sales-promotion popups. Admin creates a campaign with a window
// (startsAt → endsAt), an optional coupon code, and a CTA. The frontend
// fetches the currently-active one and shows a centered modal with a
// live countdown. Frequency caps prevent annoying repeat shows.
export const salesPopups = pgTable("sales_popups", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  couponCode: text("coupon_code"),
  ctaLabel: text("cta_label").notNull().default("Shop Now"),
  ctaUrl: text("cta_url").notNull().default("/products"),
  startsAt: timestamp("starts_at").notNull(),
  endsAt: timestamp("ends_at").notNull(),
  // Delay before showing on each visit, gives the page time to settle.
  showAfterSeconds: integer("show_after_seconds").notNull().default(8),
  // "session" = once per browser session, "daily" = once per calendar day,
  // "always" = every visit (still capped to once per session in practice).
  frequency: text("frequency").notNull().default("session"),
  enabled: boolean("enabled").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const siteSettings = pgTable("site_settings", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  siteName: text("site_name").notNull().default("Vedic Tatva"),
  tagline: text("tagline").notNull().default("Heritage of Nature Wellness & Purity"),
  logoUrl: text("logo_url"),
  heroImageUrl: text("hero_image_url"),
  heroHeading: text("hero_heading").notNull().default("Vedic Tatva"),
  heroSubheading: text("hero_subheading").notNull().default("Connecting you with divine wisdom and authentic spiritual practices."),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  whatsappNumber: text("whatsapp_number"),
  socialInstagram: text("social_instagram"),
  socialFacebook: text("social_facebook"),
  socialYoutube: text("social_youtube"),
  bestsellersMode: text("bestsellers_mode").notNull().default("auto"),
  bestsellerProductIds: integer("bestseller_product_ids").array().notNull().default(sql`ARRAY[]::integer[]`),
  bestsellersLimit: integer("bestsellers_limit").notNull().default(6),
  // Appearance Studio — live theming applied at runtime via ThemeApplier.
  // Colors are stored as hex (#rrggbb) and converted to HSL at inject time.
  primaryColor: text("primary_color").notNull().default("#6D2B35"),
  secondaryColor: text("secondary_color").notNull().default("#D4AF37"),
  accentColor: text("accent_color").notNull().default("#E8D5A8"),
  backgroundColor: text("background_color").notNull().default("#F5F0E6"),
  foregroundColor: text("foreground_color").notNull().default("#2B1115"),
  bodyFont: text("body_font").notNull().default("Inter"),
  headingFont: text("heading_font").notNull().default("Playfair Display"),
  faviconUrl: text("favicon_url"),
  // Ambient floral backdrop (drifting marigold/lotus/jasmine SVGs). Off by
  // default — admin can re-enable it from Site Settings → Appearance.
  ambientFloralEnabled: boolean("ambient_floral_enabled").notNull().default(false),
  // Light-weight analytics hooks surfaced by ThemeApplier when set.
  googleAnalyticsId: text("google_analytics_id"),
  facebookPixelId: text("facebook_pixel_id"),
  // Tag Manager container (loads ALL tags you configure in the GTM UI — GA4,
  // Ads, conversion pixels — without code changes).
  gtmContainerId: text("gtm_container_id"),
  // Raw content value from the Search Console "HTML tag" verification option.
  gscVerification: text("gsc_verification"),
  // Google Business Profile (GMB). URL used in Organization schema sameAs.
  googleBusinessProfileUrl: text("google_business_profile_url"),
  // Postal address for LocalBusiness JSON-LD. Optional — when streetAddress
  // is missing we emit an Organization schema instead of LocalBusiness.
  businessStreet: text("business_street"),
  businessCity: text("business_city"),
  businessRegion: text("business_region"),
  businessPostalCode: text("business_postal_code"),
  businessCountry: text("business_country").default("IN"),
  // Last Merchant Center sync (push) result. Persisted so the admin tab
  // shows the last attempt even after a page refresh.
  lastMerchantSyncAt: timestamp("last_merchant_sync_at"),
  lastMerchantSyncResult: jsonb("last_merchant_sync_result"),
  // Site-wide promo ribbon (the slim maroon strip under the navbar).
  // Admin can toggle the whole bar on/off, control how fast it auto-rotates,
  // and edit the list of slides (icon/eyebrow/title/detail/cta/href) without
  // a code change.
  ribbonEnabled: boolean("ribbon_enabled").notNull().default(false),
  ribbonRotationMs: integer("ribbon_rotation_ms").notNull().default(5000),
  ribbonItems: jsonb("ribbon_items").notNull().default(sql`'[]'::jsonb`),
  // When ON, every public HTML page navigation is redirected to the branded
  // /offline.html outage page (with the Sacred Symbols mini-game). API
  // routes, /admin and /offline.html itself are never affected. Useful
  // during deploys, DB migrations, or any planned downtime.
  maintenanceMode: boolean("maintenance_mode").notNull().default(false),
  // Blog automation. blogAutoGenerate gates the daily AI generation run;
  // blogAutoPublish, when on, publishes generated posts immediately instead of
  // parking them in the pending review queue (auto-gen + auto-publish vs.
  // auto-gen + manual-publish). blogDailyCount is the admin-configurable number
  // of posts the daily run attempts. blogFestivalAware prefers upcoming
  // festivals / Ekadashi / Amavasya / Purnima as topics over the rotating pool.
  blogAutoGenerate: boolean("blog_auto_generate").notNull().default(true),
  blogAutoPublish: boolean("blog_auto_publish").notNull().default(false),
  blogDailyCount: integer("blog_daily_count").notNull().default(3),
  blogFestivalAware: boolean("blog_festival_aware").notNull().default(true),
  // Controlled rollout gate for public Pandit SEO network endpoints.
  panditSeoNetworkEnabled: boolean("pandit_seo_network_enabled").notNull().default(false),
});

// Editorial copy only. Marketplace facts continue to come from their owning
// Pandit, location, storefront, and service records.
export const panditSeoEditorials = pgTable("pandit_seo_editorials", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  entityType: text("entity_type").notNull(),
  entityKey: text("entity_key").notNull(),
  introduction: text("introduction").notNull().default(""),
  faqs: jsonb("faqs").notNull().default(sql`'[]'::jsonb`),
  status: text("status").notNull().default("draft"),
  revision: integer("revision").notNull().default(1),
  createdBy: text("created_by"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedBy: text("updated_by"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  reviewedBy: text("reviewed_by"),
  reviewedAt: timestamp("reviewed_at"),
  publishedBy: text("published_by"),
  publishedAt: timestamp("published_at"),
}, (t) => ({
  entityUnique: uniqueIndex("pandit_seo_editorials_entity_unique").on(t.entityType, t.entityKey),
}));

// Abandoned cart capture. The frontend POSTs here when a shopper enters
// their email at checkout but does not complete the order. A background
// scheduler emails them a recovery nudge after a configurable delay.
export const abandonedCarts = pgTable("abandoned_carts", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  email: text("email").notNull(),
  customerName: text("customer_name"),
  cartTotal: integer("cart_total").notNull().default(0),
  itemCount: integer("item_count").notNull().default(0),
  items: jsonb("items").notNull().default(sql`'[]'::jsonb`),
  recovered: boolean("recovered").notNull().default(false),
  nudgeSentAt: timestamp("nudge_sent_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (t) => ({
  emailIdx: index("abandoned_carts_email_idx").on(t.email),
  recoveredIdx: index("abandoned_carts_recovered_idx").on(t.recovered),
}));
export const insertAbandonedCartSchema = createInsertSchema(abandonedCarts).omit({
  id: true, createdAt: true, updatedAt: true, nudgeSentAt: true, recovered: true,
});
export type InsertAbandonedCart = z.infer<typeof insertAbandonedCartSchema>;
export type AbandonedCart = typeof abandonedCarts.$inferSelect;

export const coupons = pgTable("coupons", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  code: text("code").notNull().unique(),
  description: text("description"),
  type: text("type").notNull().default("percentage"),
  value: integer("value").notNull(),
  minOrderAmount: integer("min_order_amount").notNull().default(0),
  maxDiscount: integer("max_discount"),
  maxUses: integer("max_uses"),
  usedCount: integer("used_count").notNull().default(0),
  active: boolean("active").notNull().default(true),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const subscriptions = pgTable("subscriptions", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  customerPhone: text("customer_phone"),
  productId: integer("product_id").notNull(),
  productName: text("product_name").notNull(),
  quantity: integer("quantity").notNull().default(1),
  frequency: text("frequency").notNull().default("monthly"),
  price: integer("price").notNull(),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  pincode: text("pincode"),
  status: text("status").notNull().default("active"),
  nextDelivery: timestamp("next_delivery"),
  lastDelivery: timestamp("last_delivery"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const orderLookupOtps = pgTable("order_lookup_otps", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  email: text("email").notNull(),
  codeHash: text("code_hash").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  attempts: integer("attempts").notNull().default(0),
  used: boolean("used").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});
export const insertOrderLookupOtpSchema = createInsertSchema(orderLookupOtps).omit({ id: true, createdAt: true });
export type InsertOrderLookupOtp = z.infer<typeof insertOrderLookupOtpSchema>;
export type OrderLookupOtp = typeof orderLookupOtps.$inferSelect;

export const returnTickets = pgTable("return_tickets", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  orderId: integer("order_id").notNull(),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  customerPhone: text("customer_phone"),
  productName: text("product_name").notNull(),
  reason: text("reason").notNull(),
  description: text("description"),
  status: text("status").notNull().default("pending"),
  adminNotes: text("admin_notes"),
  refundId: text("refund_id").unique(),
  refundAmount: integer("refund_amount"),
  refundStatus: text("refund_status"),
  refundedAt: timestamp("refunded_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const donations = pgTable("donations", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  nameHindi: text("name_hindi"),
  description: text("description").notNull(),
  longDescription: text("long_description"),
  image: text("image").notNull(),
  category: text("category").notNull(),
  suggestedAmounts: text("suggested_amounts").array(),
  minAmount: integer("min_amount").notNull().default(101),
  active: boolean("active").notNull().default(true),
  benefitsText: text("benefits_text"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const donationOrders = pgTable("donation_orders", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  donationId: integer("donation_id").notNull(),
  donationName: text("donation_name").notNull(),
  donorName: text("donor_name").notNull(),
  donorEmail: text("donor_email").notNull(),
  donorPhone: text("donor_phone"),
  amount: integer("amount").notNull(),
  gotra: text("gotra"),
  dedicatedTo: text("dedicated_to"),
  occasion: text("occasion"),
  message: text("message"),
  recurring: boolean("recurring").notNull().default(false),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const seoPages = pgTable("seo_pages", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  pagePath: text("page_path").notNull().unique(),
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
  metaKeywords: text("meta_keywords"),
  canonicalUrl: text("canonical_url"),
  ogTitle: text("og_title"),
  ogDescription: text("og_description"),
  ogImage: text("og_image"),
  ogType: text("og_type").default("website"),
  twitterTitle: text("twitter_title"),
  twitterDescription: text("twitter_description"),
  twitterImage: text("twitter_image"),
  robotsIndex: boolean("robots_index").notNull().default(true),
  robotsFollow: boolean("robots_follow").notNull().default(true),
  priority: real("priority").default(0.5),
  changeFreq: text("change_freq").default("weekly"),
  schemaMarkup: text("schema_markup"),
  customHeadTags: text("custom_head_tags"),
  h1Override: text("h1_override"),
  breadcrumbLabel: text("breadcrumb_label"),
  isActive: boolean("is_active").notNull().default(true),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const seoRedirects = pgTable("seo_redirects", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  fromPath: text("from_path").notNull().unique(),
  toPath: text("to_path").notNull(),
  statusCode: integer("status_code").notNull().default(301),
  hits: integer("hits").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const seoBacklinks = pgTable("seo_backlinks", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  sourceUrl: text("source_url").notNull(),
  targetPath: text("target_path").notNull(),
  anchorText: text("anchor_text"),
  domainAuthority: integer("domain_authority"),
  linkType: text("link_type").default("dofollow"),
  status: text("status").default("active"),
  discoveredAt: timestamp("discovered_at").defaultNow(),
  note: text("note"),
});

export const seoKeywordTargets = pgTable("seo_keyword_targets", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  keyword: text("keyword").notNull().unique(),
  targetPath: text("target_path").notNull(),
  intent: text("intent").notNull().default("transactional"),
  priority: integer("priority").notNull().default(5),
  cluster: text("cluster").notNull().default("general"),
  language: text("language").notNull().default("en"),
  status: text("status").notNull().default("active"),
  lastOptimizedAt: timestamp("last_optimized_at"),
  lastScore: integer("last_score"),
  lastError: text("last_error"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const searchQueries = pgTable("search_queries", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  query: text("query").notNull(),
  normalized: text("normalized").notNull(),
  resultCount: integer("result_count").notNull().default(0),
  hits: integer("hits").notNull().default(1),
  lastSeenAt: timestamp("last_seen_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const matrimonyProfiles = pgTable("matrimony_profiles", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  profileType: text("profile_type").notNull(),
  fullName: text("full_name").notNull(),
  gender: text("gender").notNull(),
  dateOfBirth: text("date_of_birth").notNull(),
  age: integer("age").notNull(),
  height: text("height"),
  weight: text("weight"),
  complexion: text("complexion"),
  gotra: text("gotra"),
  manglik: text("manglik"),
  religion: text("religion").notNull().default("Hindu"),
  caste: text("caste"),
  subCaste: text("sub_caste"),
  motherTongue: text("mother_tongue"),
  education: text("education").notNull(),
  occupation: text("occupation").notNull(),
  annualIncome: text("annual_income"),
  employedIn: text("employed_in"),
  city: text("city").notNull(),
  state: text("state").notNull(),
  country: text("country").notNull().default("India"),
  maritalStatus: text("marital_status").notNull().default("Never Married"),
  diet: text("diet"),
  smoking: text("smoking"),
  drinking: text("drinking"),
  aboutMe: text("about_me"),
  familyType: text("family_type"),
  familyStatus: text("family_status"),
  fatherOccupation: text("father_occupation"),
  motherOccupation: text("mother_occupation"),
  siblings: text("siblings"),
  partnerAgeMin: integer("partner_age_min"),
  partnerAgeMax: integer("partner_age_max"),
  partnerHeightMin: text("partner_height_min"),
  partnerHeightMax: text("partner_height_max"),
  partnerEducation: text("partner_education"),
  partnerOccupation: text("partner_occupation"),
  partnerCaste: text("partner_caste"),
  partnerCity: text("partner_city"),
  partnerExpectations: text("partner_expectations"),
  contactName: text("contact_name").notNull(),
  contactEmail: text("contact_email").notNull(),
  contactPhone: text("contact_phone").notNull(),
  contactRelation: text("contact_relation"),
  photo: text("photo"),
  kundliDetails: text("kundli_details"),
  birthTime: text("birth_time"),
  birthPlace: text("birth_place"),
  rashi: text("rashi"),
  nakshatra: text("nakshatra"),
  verified: boolean("verified").notNull().default(false),
  approved: boolean("approved").notNull().default(false),
  featured: boolean("featured").notNull().default(false),
  status: text("status").notNull().default("pending"),
  adminNotes: text("admin_notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Admin audit log — append-only trail of sensitive admin writes
// (settings saves, refunds, ticket status changes, integration pings, etc.)
export const adminAuditLogs = pgTable("admin_audit_logs", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  actor: text("actor"),          // masked admin token tail or username
  action: text("action").notNull(),       // e.g. "site-settings.save"
  target: text("target"),                 // e.g. "order:123" or "integration:razorpay"
  details: jsonb("details"),              // structured context
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const newsletterSubscribers = pgTable("newsletter_subscribers", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  email: text("email").notNull().unique(),
  language: text("language").notNull().default("en"),
  unsubscribedAt: timestamp("unsubscribed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Marketing email log — one row per attempted send. Used by the scheduler to
// avoid sending duplicates (cart_1/2/3, welcome_1/2) and by admins to audit
// broadcast deliverability.
export const emailSends = pgTable("email_sends", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  recipientEmail: text("recipient_email").notNull(),
  // 'abandoned_cart_1' | 'abandoned_cart_2' | 'abandoned_cart_3' |
  // 'welcome_1' | 'welcome_2' | 'broadcast'
  kind: text("kind").notNull(),
  // For abandoned_cart_* this is the abandoned_carts.id; for welcome_* this
  // is the newsletter_subscribers.id; for broadcast it's the campaign id.
  relatedId: integer("related_id"),
  scheduledFor: timestamp("scheduled_for"),
  sentAt: timestamp("sent_at"),
  status: text("status").notNull().default("queued"), // queued | sent | failed | skipped
  error: text("error"),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => ({
  recipientKindIdx: index("email_sends_recipient_kind_idx").on(t.recipientEmail, t.kind),
  statusIdx: index("email_sends_status_idx").on(t.status),
}));
export const insertEmailSendSchema = createInsertSchema(emailSends).omit({ id: true, createdAt: true });
export type InsertEmailSend = z.infer<typeof insertEmailSendSchema>;
export type EmailSend = typeof emailSends.$inferSelect;

// One-shot newsletter campaign blast.
export const newsletterCampaigns = pgTable("newsletter_campaigns", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  subject: text("subject").notNull(),
  previewText: text("preview_text"),
  bodyHtml: text("body_html").notNull(),
  bodyText: text("body_text"),
  segment: text("segment").notNull().default("all"), // all | last_30_days | csv
  recipientCount: integer("recipient_count").notNull().default(0),
  sentCount: integer("sent_count").notNull().default(0),
  failureCount: integer("failure_count").notNull().default(0),
  status: text("status").notNull().default("draft"), // draft | sending | sent | failed
  createdBy: text("created_by"),
  createdAt: timestamp("created_at").defaultNow(),
  sentAt: timestamp("sent_at"),
});
export const insertNewsletterCampaignSchema = createInsertSchema(newsletterCampaigns).omit({
  id: true, createdAt: true, sentAt: true, sentCount: true, failureCount: true, recipientCount: true, status: true,
});
export type InsertNewsletterCampaign = z.infer<typeof insertNewsletterCampaignSchema>;
export type NewsletterCampaign = typeof newsletterCampaigns.$inferSelect;

// Email-level unsubscribe (covers guest / cart-abandoner emails too — they
// may not have a newsletter_subscribers row).
export const emailUnsubscribes = pgTable("email_unsubscribes", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  email: text("email").notNull().unique(),
  source: text("source"), // which email/kind triggered the unsubscribe
  createdAt: timestamp("created_at").defaultNow(),
});
export type EmailUnsubscribe = typeof emailUnsubscribes.$inferSelect;

// =====================================================================
// Notifications log + per-kind settings (Task #20: WhatsApp + SMS journey)
// =====================================================================
export const NOTIFICATION_CHANNELS = ["whatsapp", "sms", "email"] as const;
export type NotificationChannel = typeof NOTIFICATION_CHANNELS[number];

export const NOTIFICATION_KINDS = [
  "payment_received",
  "order_confirmed",
  "order_shipped",
  "out_for_delivery",
  "delivered",
  "refund_initiated",
  "abandoned_cart_wa",
  "review_request_2",
  "test",
] as const;
export type NotificationKind = typeof NOTIFICATION_KINDS[number];

export const NOTIFICATION_STATUSES = ["sent", "skipped", "failed"] as const;
export type NotificationStatus = typeof NOTIFICATION_STATUSES[number];

export const notificationLog = pgTable("notification_log", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  orderId: integer("order_id"),
  recipientPhone: text("recipient_phone"),
  recipientEmail: text("recipient_email"),
  channel: text("channel").$type<NotificationChannel>().notNull(),
  kind: text("kind").$type<NotificationKind>().notNull(),
  status: text("status").$type<NotificationStatus>().notNull(),
  reason: text("reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  channelChk: check("notification_log_channel_chk", sql`${t.channel} IN ('whatsapp','sms','email')`),
  statusChk: check("notification_log_status_chk", sql`${t.status} IN ('sent','skipped','failed')`),
  kindChk: check("notification_log_kind_chk", sql`${t.kind} IN ('payment_received','order_confirmed','order_shipped','out_for_delivery','delivered','refund_initiated','abandoned_cart_wa','review_request_2','test')`),
  // DB-level idempotency guards. Cooperate with ON CONFLICT DO NOTHING in the
  // app so concurrent webhook retries cannot double-send for the same milestone.
  orderKindSentUniq: uniqueIndex("notification_log_order_kind_sent_uniq")
    .on(t.orderId, t.kind)
    .where(sql`status = 'sent' AND order_id IS NOT NULL`),
  phoneKindDayUniq: uniqueIndex("notification_log_phone_kind_day_uniq")
    .on(t.recipientPhone, t.kind, sql`((created_at)::date)`)
    .where(sql`status = 'sent' AND order_id IS NULL AND recipient_phone IS NOT NULL`),
}));
export const insertNotificationLogSchema = createInsertSchema(notificationLog).omit({ id: true, createdAt: true });
export type InsertNotificationLog = z.infer<typeof insertNotificationLogSchema>;
export type NotificationLog = typeof notificationLog.$inferSelect;

export const notificationSettings = pgTable("notification_settings", {
  id: integer("id").primaryKey().default(1),
  paymentReceived: boolean("payment_received").notNull().default(true),
  orderConfirmed: boolean("order_confirmed").notNull().default(true),
  orderShipped: boolean("order_shipped").notNull().default(true),
  outForDelivery: boolean("out_for_delivery").notNull().default(true),
  delivered: boolean("delivered").notNull().default(true),
  refundInitiated: boolean("refund_initiated").notNull().default(true),
  abandonedCartWa: boolean("abandoned_cart_wa").notNull().default(true),
  reviewRequest2: boolean("review_request_2").notNull().default(true),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
export type NotificationSettings = typeof notificationSettings.$inferSelect;

export const kathaStorage = pgTable("katha_storage", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  god: text("god").notNull(),
  kathaTitle: text("katha_title").notNull(),
  language: text("language").notNull(),
  content: jsonb("content").notNull(),
  audioData: text("audio_data"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users);
export const insertKathaStorageSchema = createInsertSchema(kathaStorage);
export const insertNewsletterSubscriberSchema = createInsertSchema(newsletterSubscribers).omit({ id: true, createdAt: true });
export type InsertNewsletterSubscriber = z.infer<typeof insertNewsletterSubscriberSchema>;
export type NewsletterSubscriber = typeof newsletterSubscribers.$inferSelect;
export const insertProductSchema = createInsertSchema(products);
export const insertProductReviewSchema = createInsertSchema(productReviews);
export const insertProductQuestionSchema = createInsertSchema(productQuestions).omit({ id: true, createdAt: true, answeredAt: true });
export type InsertProductQuestion = z.infer<typeof insertProductQuestionSchema>;
export type ProductQuestion = typeof productQuestions.$inferSelect;
export const insertOrderSchema = createInsertSchema(orders);
export const insertOrderStatusEventSchema = createInsertSchema(orderStatusEvents).omit({ id: true, createdAt: true });
export const insertPanditSchema = createInsertSchema(pandits).omit({
  registrationNo: true,
  legacyRegistrationNo: true,
  registrationAssignedAt: true,
});
export const insertPanditReviewSchema = createInsertSchema(panditReviews);
export const insertPanditApplicationSchema = createInsertSchema(panditApplications).omit({ id: true, status: true, adminNote: true, reviewedAt: true, panditId: true, createdAt: true });
export const insertPanditCityRequestSchema = createInsertSchema(panditCityRequests).omit({
  id: true, status: true, resolvedCityId: true, resolutionReason: true,
  resolvedBy: true, createdAt: true, resolvedAt: true, updatedAt: true,
});
export const insertFranchiseApplicationSchema = createInsertSchema(franchiseApplications).omit({ id: true, status: true, adminNote: true, createdAt: true });
export const insertPujaBookingSchema = createInsertSchema(pujaBookings);
export const insertAstrologyBookingSchema = createInsertSchema(astrologyBookings);
export const insertSocialProofSettingsSchema = createInsertSchema(socialProofSettings);
export const insertBoostEventSchema = createInsertSchema(boostEvents);
// Coerce ISO date strings from JSON requests into Date objects so the
// drizzle-zod-generated schema accepts what the admin form actually sends.
export const insertSalesPopupSchema = createInsertSchema(salesPopups, {
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date(),
}).omit({ id: true, createdAt: true });
// Promo ribbon slide — validated structure for the jsonb `ribbonItems` column.
// href must be a relative path (starting with /) or an http(s) URL — this
// blocks javascript:, data:, vbscript: and other dangerous URL schemes from
// reaching the rendered <a href>.
const safeHrefSchema = z.string().trim().min(1).max(500).refine(
  (v) => /^\//.test(v) || /^https?:\/\//i.test(v),
  { message: "Link must start with '/' or 'https://'" },
);
export const ribbonItemSchema = z.object({
  id: z.string().trim().min(1).max(64),
  iconName: z.string().trim().min(1).max(40),
  eyebrow: z.string().max(60).default(""),
  title: z.string().trim().min(1).max(200),
  detail: z.string().max(300).default(""),
  href: safeHrefSchema,
  cta: z.string().max(40).default(""),
});
export type RibbonItem = z.infer<typeof ribbonItemSchema>;

export const insertSiteSettingsSchema = createInsertSchema(siteSettings, {
  ribbonItems: z.array(ribbonItemSchema).max(20).optional(),
  ribbonRotationMs: z.number().int().min(1500).max(60000).optional(),
  ribbonEnabled: z.boolean().optional(),
  maintenanceMode: z.boolean().optional(),
  blogAutoGenerate: z.boolean().optional(),
  blogAutoPublish: z.boolean().optional(),
  blogDailyCount: z.number().int().min(1).max(12).optional(),
  blogFestivalAware: z.boolean().optional(),
  panditSeoNetworkEnabled: z.boolean().optional(),
});
export const panditSeoEditorialEntityTypeSchema = z.enum(["profile", "city", "city_service"]);
export const panditSeoEditorialStatusSchema = z.enum(["draft", "reviewed", "published"]);
export const panditSeoEditorialFaqSchema = z.object({
  question: z.string().trim().min(1).max(240),
  answer: z.string().trim().min(1).max(1600),
}).strict();
export const insertPanditSeoEditorialSchema = createInsertSchema(panditSeoEditorials, {
  entityType: panditSeoEditorialEntityTypeSchema,
  entityKey: z.string().trim().min(1).max(200),
  introduction: z.string().trim().max(8000),
  faqs: z.array(panditSeoEditorialFaqSchema).max(12),
  status: panditSeoEditorialStatusSchema,
}).omit({
  id: true, revision: true,
  createdBy: true, createdAt: true,
  updatedBy: true, updatedAt: true,
  reviewedBy: true, reviewedAt: true,
  publishedBy: true, publishedAt: true,
});
export const insertAstrologerSchema = createInsertSchema(astrologers);
export const insertCouponSchema = createInsertSchema(coupons);
export const insertSubscriptionSchema = createInsertSchema(subscriptions);
export const insertReturnTicketSchema = createInsertSchema(returnTickets);
export const insertDonationSchema = createInsertSchema(donations);
export const insertDonationOrderSchema = createInsertSchema(donationOrders);
export const insertSeoPageSchema = createInsertSchema(seoPages);
export const insertMatrimonyProfileSchema = createInsertSchema(matrimonyProfiles).omit({ id: true, createdAt: true });
export const insertAdminAuditLogSchema = createInsertSchema(adminAuditLogs).omit({ id: true, createdAt: true });
export type InsertAdminAuditLog = z.infer<typeof insertAdminAuditLogSchema>;
export type AdminAuditLog = typeof adminAuditLogs.$inferSelect;

export const insertInvoiceSchema = createInsertSchema(invoices).omit({ id: true, createdAt: true });
export const insertDispatchSchema = createInsertSchema(dispatches).omit({ id: true, createdAt: true });

// Types
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Invoice = typeof invoices.$inferSelect;
export type InsertDispatch = z.infer<typeof insertDispatchSchema>;
export type Dispatch = typeof dispatches.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;
export type InsertProductReview = z.infer<typeof insertProductReviewSchema>;
export type ProductReview = typeof productReviews.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;
export type OrderStatusEvent = typeof orderStatusEvents.$inferSelect;
export type InsertOrderStatusEvent = z.infer<typeof insertOrderStatusEventSchema>;
export type InsertPandit = z.infer<typeof insertPanditSchema>;
export type Pandit = typeof pandits.$inferSelect;
export type InsertPanditReview = z.infer<typeof insertPanditReviewSchema>;
export type PanditReview = typeof panditReviews.$inferSelect;
export type InsertPanditApplication = z.infer<typeof insertPanditApplicationSchema>;
export type PanditApplication = typeof panditApplications.$inferSelect;
export type PanditCityRequest = typeof panditCityRequests.$inferSelect;
export type InsertPanditCityRequest = z.infer<typeof insertPanditCityRequestSchema>;
export type InsertFranchiseApplication = z.infer<typeof insertFranchiseApplicationSchema>;
export type FranchiseApplication = typeof franchiseApplications.$inferSelect;
export type InsertPujaBooking = z.infer<typeof insertPujaBookingSchema>;
export type PujaBooking = typeof pujaBookings.$inferSelect;
export type InsertAstrologyBooking = z.infer<typeof insertAstrologyBookingSchema>;
export type AstrologyBooking = typeof astrologyBookings.$inferSelect;
export type SocialProofSettings = typeof socialProofSettings.$inferSelect;
export type InsertSocialProofSettings = z.infer<typeof insertSocialProofSettingsSchema>;
export type BoostEvent = typeof boostEvents.$inferSelect;
export type InsertBoostEvent = z.infer<typeof insertBoostEventSchema>;
export type SalesPopup = typeof salesPopups.$inferSelect;
export type InsertSalesPopup = z.infer<typeof insertSalesPopupSchema>;
export type SiteSettings = typeof siteSettings.$inferSelect;
export type InsertSiteSettings = z.infer<typeof insertSiteSettingsSchema>;
export type PanditSeoEditorial = typeof panditSeoEditorials.$inferSelect;
export type InsertPanditSeoEditorial = z.infer<typeof insertPanditSeoEditorialSchema>;
export type Coupon = typeof coupons.$inferSelect;
export type InsertCoupon = z.infer<typeof insertCouponSchema>;
export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type ReturnTicket = typeof returnTickets.$inferSelect;
export type InsertReturnTicket = z.infer<typeof insertReturnTicketSchema>;
export type Astrologer = typeof astrologers.$inferSelect;
export type InsertAstrologer = z.infer<typeof insertAstrologerSchema>;
export type Donation = typeof donations.$inferSelect;
export type InsertDonation = z.infer<typeof insertDonationSchema>;
export type DonationOrder = typeof donationOrders.$inferSelect;
export type InsertDonationOrder = z.infer<typeof insertDonationOrderSchema>;
export type SeoPage = typeof seoPages.$inferSelect;
export type InsertSeoPage = z.infer<typeof insertSeoPageSchema>;
export type MatrimonyProfile = typeof matrimonyProfiles.$inferSelect;
export type InsertMatrimonyProfile = z.infer<typeof insertMatrimonyProfileSchema>;
export type KathaStorageEntry = typeof kathaStorage.$inferSelect;
export type InsertKathaStorage = z.infer<typeof insertKathaStorageSchema>;

export const aiCache = pgTable("ai_cache", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  cacheType: text("cache_type").notNull(),
  cacheKey: text("cache_key").notNull(),
  data: jsonb("data").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => ({
  typeKeyIdx: index("ai_cache_type_key_idx").on(t.cacheType, t.cacheKey),
  expiresAtIdx: index("ai_cache_expires_at_idx").on(t.expiresAt),
}));

export type AiCache = typeof aiCache.$inferSelect;

// =====================================================================
// Tirth Yatra (organized pilgrimage tours), Lucky Draw, Pilgrimage Card
// =====================================================================

export const tirthYatraTours = pgTable("tirth_yatra_tours", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  shortName: text("short_name"),
  route: text("route").notNull(),
  departureCity: text("departure_city").notNull().default("Delhi"),
  durationDays: integer("duration_days").notNull(),
  durationNights: integer("duration_nights").notNull(),
  priceInr: integer("price_inr").notNull(),
  mrpInr: integer("mrp_inr"),
  groupSize: integer("group_size").notNull().default(20),
  inclusions: text("inclusions").array(),
  highlights: text("highlights").array(),
  itinerary: jsonb("itinerary"),
  heroImage: text("hero_image"),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  isFlagship: boolean("is_flagship").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});
export const insertTirthYatraTourSchema = createInsertSchema(tirthYatraTours).omit({ id: true, createdAt: true });
export type TirthYatraTour = typeof tirthYatraTours.$inferSelect;
export type InsertTirthYatraTour = z.infer<typeof insertTirthYatraTourSchema>;

export const tirthYatraInquiries = pgTable("tirth_yatra_inquiries", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  tourId: integer("tour_id"),
  tourSlug: text("tour_slug"),
  canonicalDestinationType: text("canonical_destination_type"),
  canonicalDestinationId: integer("canonical_destination_id"),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  city: text("city"),
  travelers: integer("travelers").notNull().default(1),
  preferredMonth: text("preferred_month"),
  message: text("message"),
  status: text("status").notNull().default("new"),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => ({
  canonicalDestinationCheck: check("tirth_yatra_inquiries_canonical_destination_check", sql`(${t.canonicalDestinationType} IS NULL AND ${t.canonicalDestinationId} IS NULL) OR (${t.canonicalDestinationType} IS NOT NULL AND ${t.canonicalDestinationId} IS NOT NULL AND ${t.canonicalDestinationType} IN ('TIRTH','TEMPLE') AND ${t.canonicalDestinationId} > 0)`),
}));
export const insertTirthYatraInquirySchema = createInsertSchema(tirthYatraInquiries).omit({ id: true, status: true, createdAt: true, canonicalDestinationType: true, canonicalDestinationId: true });
export type TirthYatraInquiry = typeof tirthYatraInquiries.$inferSelect;
export type InsertTirthYatraInquiry = z.infer<typeof insertTirthYatraInquirySchema>;

export const luckyDrawEntries = pgTable("lucky_draw_entries", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id"),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  productSerial: text("product_serial").notNull(),
  productName: text("product_name"),
  orderId: text("order_id"),
  preferredYatra: text("preferred_yatra"),
  drawYear: integer("draw_year").notNull(),
  status: text("status").notNull().default("entered"),
  createdAt: timestamp("created_at").defaultNow(),
});
export const insertLuckyDrawEntrySchema = createInsertSchema(luckyDrawEntries).omit({ id: true, status: true, createdAt: true });
export type LuckyDrawEntry = typeof luckyDrawEntries.$inferSelect;
export type InsertLuckyDrawEntry = z.infer<typeof insertLuckyDrawEntrySchema>;

export const pilgrimageCardApplications = pgTable("pilgrimage_card_applications", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id"),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  city: text("city").notNull(),
  age: integer("age"),
  monthlySipInr: integer("monthly_sip_inr").notNull().default(10000),
  totalCommitmentInr: integer("total_commitment_inr").notNull().default(600000),
  preferredYatras: text("preferred_yatras").array(),
  message: text("message"),
  status: text("status").notNull().default("new"),
  createdAt: timestamp("created_at").defaultNow(),
});
export const insertPilgrimageCardApplicationSchema = createInsertSchema(pilgrimageCardApplications).omit({ id: true, status: true, createdAt: true });
export type PilgrimageCardApplication = typeof pilgrimageCardApplications.$inferSelect;
export type InsertPilgrimageCardApplication = z.infer<typeof insertPilgrimageCardApplicationSchema>;

// Premium PDF Kundli — paid Vedic birth-chart report delivered as PDF + email
export const pdfKundliOrders = pgTable("pdf_kundli_orders", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id"),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  gender: text("gender"),
  birthDate: text("birth_date").notNull(), // YYYY-MM-DD
  birthTime: text("birth_time").notNull(), // HH:MM
  birthCity: text("birth_city").notNull(),
  language: text("language").notNull().default("English"), // English / Hindi
  amountPaise: integer("amount_paise").notNull().default(50100), // ₹501
  currency: text("currency").notNull().default("INR"),
  razorpayOrderId: text("razorpay_order_id"),
  razorpayPaymentId: text("razorpay_payment_id"),
  status: text("status").notNull().default("pending"), // pending | paid | generating | ready | sent | failed
  pdfPath: text("pdf_path"),
  errorMessage: text("error_message"),
  // Unguessable token gating the download endpoint — protects PII (birth details) from order-id enumeration.
  downloadToken: text("download_token").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
  paidAt: timestamp("paid_at"),
  sentAt: timestamp("sent_at"),
});
export const insertPdfKundliOrderSchema = createInsertSchema(pdfKundliOrders).omit({
  id: true, status: true, razorpayOrderId: true, razorpayPaymentId: true, pdfPath: true,
  errorMessage: true, downloadToken: true, createdAt: true, paidAt: true, sentAt: true,
});
export type PdfKundliOrder = typeof pdfKundliOrders.$inferSelect;
export type InsertPdfKundliOrder = z.infer<typeof insertPdfKundliOrderSchema>;

// ===== Blog =====
export const blogPosts = pgTable("blog_posts", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  excerpt: text("excerpt"),
  body: text("body").notNull(),
  coverImage: text("cover_image"),
  category: text("category"),
  tags: text("tags").array(),
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
  metaKeywords: text("meta_keywords"),
  relatedShopUrl: text("related_shop_url"),
  relatedShopLabel: text("related_shop_label"),
  authorName: text("author_name").default("Vedic Tatva"),
  readMinutes: integer("read_minutes").default(5),
  viewCount: integer("view_count").notNull().default(0),
  isPublished: boolean("is_published").notNull().default(true),
  publishedAt: timestamp("published_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  status: text("status").notNull().default("published"), // "draft" | "pending" | "published" | "rejected"
  aiGenerated: boolean("ai_generated").notNull().default(false),
  sourcePrompt: text("source_prompt"),
}, (t) => ({
  categoryIdx: index("blog_posts_category_idx").on(t.category),
  isPublishedIdx: index("blog_posts_is_published_idx").on(t.isPublished),
  publishedAtIdx: index("blog_posts_published_at_idx").on(t.publishedAt),
  statusIdx: index("blog_posts_status_idx").on(t.status),
}));
export const insertBlogPostSchema = createInsertSchema(blogPosts).omit({ id: true, createdAt: true, viewCount: true });
export type BlogPost = typeof blogPosts.$inferSelect;
export type InsertBlogPost = z.infer<typeof insertBlogPostSchema>;

// ===== Pitru / Ancestor reminder system =====
// Saved ancestors whose Shradh tithi we will remind the signed-in user about each year.
export const pitruAncestors = pgTable("pitru_ancestors", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  relation: text("relation").notNull(),               // father, mother, grandfather, etc.
  gotra: text("gotra"),
  // Departure (death) details — used to compute the annual Shradh tithi.
  departureDate: text("departure_date").notNull(),    // YYYY-MM-DD local
  departureTime: text("departure_time"),              // HH:MM 24h, optional (defaults to 12:00)
  departurePlace: text("departure_place").notNull(),  // free-text city name
  departureLat: real("departure_lat"),
  departureLon: real("departure_lon"),
  departureTz: text("departure_tz"),
  // Computed at create time and refreshed when ancestor is edited.
  tithiNumber: integer("tithi_number"),               // 1..30 (absolute, Shukla 1..15 / Krishna 16..30)
  tithiName: text("tithi_name"),
  paksha: text("paksha"),
  nakshatraName: text("nakshatra_name"),
  hinduMonth: text("hindu_month"),
  // Which Shradh tradition the family observes — drives next-Shradh-date calc.
  //  • "pitru-paksha"     — Ashvin Krishna Paksha (Sept-Oct), the dominant North Indian tradition.
  //  • "pratisamvatsarik" — same tithi in the same lunar month of death (Bengali, Maithili, Marathi, many South).
  shradhTradition: text("shradh_tradition").notNull().default("pitru-paksha"),
  // Channels & notes
  notifyWhatsapp: boolean("notify_whatsapp").notNull().default(true),
  notifyEmail: boolean("notify_email").notNull().default(true),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => ({
  userIdIdx: index("pitru_ancestors_user_id_idx").on(t.userId),
}));
export const insertPitruAncestorSchema = createInsertSchema(pitruAncestors).omit({
  id: true, createdAt: true, updatedAt: true,
  tithiNumber: true, tithiName: true, paksha: true, nakshatraName: true, hinduMonth: true,
});
export type PitruAncestor = typeof pitruAncestors.$inferSelect;
export type InsertPitruAncestor = z.infer<typeof insertPitruAncestorSchema>;

// Idempotent record of every reminder dispatch for an ancestor + offset day.
// Composite key (ancestorId, year, offsetDays) prevents duplicate sends.
export const pitruReminderJobs = pgTable("pitru_reminder_jobs", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  ancestorId: integer("ancestor_id").notNull(),
  userId: integer("user_id").notNull(),
  year: integer("year").notNull(),
  offsetDays: integer("offset_days").notNull(),       // 7, 1, or 0
  shradhDate: text("shradh_date").notNull(),          // YYYY-MM-DD of the Shradh
  channel: text("channel").notNull(),                 // "whatsapp" | "email"
  status: text("status").notNull().default("sent"),   // "sent" | "failed" | "skipped"
  reason: text("reason"),                             // failure reason if any
  sentAt: timestamp("sent_at").defaultNow().notNull(),
}, (t) => ({
  uniq: uniqueIndex("pitru_reminder_jobs_uniq").on(t.ancestorId, t.year, t.offsetDays, t.channel),
}));
export type PitruReminderJob = typeof pitruReminderJobs.$inferSelect;

// =====================================================================
// PHASE 1 — Dashboard foundation
// Family Profiles: a user's saved family members so they don't re-key
// gotra/birth details for every puja booking, kundli, etc.
// =====================================================================
export const familyMembers = pgTable("family_members", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  relation: text("relation").notNull(),         // self | spouse | son | daughter | father | mother | sibling | other
  gender: text("gender"),                        // male | female | other
  dateOfBirth: text("date_of_birth"),           // YYYY-MM-DD
  timeOfBirth: text("time_of_birth"),           // HH:MM (24h)
  placeOfBirth: text("place_of_birth"),
  gotra: text("gotra"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => ({
  userIdIdx: index("family_members_user_id_idx").on(t.userId),
}));
export const insertFamilyMemberSchema = createInsertSchema(familyMembers).omit({ id: true, createdAt: true, updatedAt: true });
export type FamilyMember = typeof familyMembers.$inferSelect;
export type InsertFamilyMember = z.infer<typeof insertFamilyMemberSchema>;

// In-app notifications surfaced inside the User Dashboard inbox.
// Distinct from `notification_log` which tracks outbound channel delivery
// (whatsapp/sms/email). This table is a plain user-facing inbox.
export const userNotifications = pgTable("user_notifications", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").notNull(),
  kind: text("kind").notNull(),         // booking_accepted | booking_declined | booking_completed | order_paid | order_shipped | order_delivered | refund_initiated | loyalty_earned | system
  title: text("title").notNull(),
  body: text("body"),
  link: text("link"),                    // in-app deep link, e.g. /my-bookings, /order-history
  meta: jsonb("meta"),                   // optional extra context (orderId, bookingId, …)
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  userIdIdx: index("user_notifications_user_id_idx").on(t.userId),
  readAtIdx: index("user_notifications_read_at_idx").on(t.readAt),
}));
export const insertUserNotificationSchema = createInsertSchema(userNotifications).omit({ id: true, createdAt: true, readAt: true });
export type UserNotification = typeof userNotifications.$inferSelect;
export type InsertUserNotification = z.infer<typeof insertUserNotificationSchema>;

// Mirror of userNotifications for the Pandit portal inbox. Pandits learn
// about customer-side actions (booking cancelled, new chat, new review,
// payment received) without polling every list endpoint.
export const panditNotifications = pgTable("pandit_notifications", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  panditId: integer("pandit_id").notNull(),
  kind: text("kind").notNull(), // booking_cancelled | booking_message | review_new | payment_received | payment_request_paid | system
  title: text("title").notNull(),
  body: text("body"),
  link: text("link"),
  meta: jsonb("meta"),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  panditIdIdx: index("pandit_notifications_pandit_id_idx").on(t.panditId),
  readAtIdx: index("pandit_notifications_read_at_idx").on(t.readAt),
}));
export const insertPanditNotificationSchema = createInsertSchema(panditNotifications).omit({ id: true, createdAt: true, readAt: true });
export type PanditNotification = typeof panditNotifications.$inferSelect;
export type InsertPanditNotification = z.infer<typeof insertPanditNotificationSchema>;

// Phase 2 — Pandit payout ledger. Admin-recorded payments to pandits.
// Earnings (computed): completed-booking gross − commission + paid tips.
// Pending balance = earnings − sum(payouts).
export const panditPayouts = pgTable("pandit_payouts", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  panditId: integer("pandit_id").notNull(),
  amountInr: integer("amount_inr").notNull(),
  paidAt: timestamp("paid_at").notNull().defaultNow(),
  method: text("method").notNull().default("upi"), // upi | bank | cash | other
  reference: text("reference"),                     // UPI ref / UTR / cheque no
  notes: text("notes"),
  // IDs of pandit_referrals rows settled by this payout. Empty for legacy
  // booking-earnings payouts created before the referral payout flow shipped.
  referralIds: integer("referral_ids").array().notNull().default(sql`'{}'::integer[]`),
  createdByAdminId: integer("created_by_admin_id"),
  // Reversal trail (Task #70). When non-null, the payout was reversed by an
  // admin (e.g. UPI bounce, sent to wrong VPA). The referral rows it settled
  // are flipped back to 'approved' so they can be re-paid in the next batch.
  reversedAt: timestamp("reversed_at"),
  reverseReason: text("reverse_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  panditIdIdx: index("pandit_payouts_pandit_id_idx").on(t.panditId),
}));
export const insertPanditPayoutSchema = createInsertSchema(panditPayouts).omit({ id: true, createdAt: true, reversedAt: true, reverseReason: true });
export type PanditPayout = typeof panditPayouts.$inferSelect;
export type InsertPanditPayout = z.infer<typeof insertPanditPayoutSchema>;

// =====================================================================
// Pandit storefronts at /p/<slug>
// Each pandit gets a public landing page that sells:
//   (a) their own services (existing puja booking)
//   (b) a curated set of shop products with referral commission
//   (c) a free digital QR card (download)
//   (d) a ₹999 physical NFC/printed card (paid via Razorpay, shipped)
// =====================================================================
export const panditStorefronts = pgTable("pandit_storefronts", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  panditId: integer("pandit_id").notNull().unique(),
  // Long-form bio shown on the public /p/<slug> page (markdown-lite plain text).
  bio: text("bio"),
  tagline: text("tagline"),
  // Optional social links the pandit chooses to display.
  whatsappNumber: text("whatsapp_number"),
  youtubeUrl: text("youtube_url"),
  instagramUrl: text("instagram_url"),
  facebookUrl: text("facebook_url"),
  websiteUrl: text("website_url"),
  // Brand color override; defaults to maroon if null.
  themeColor: text("theme_color"),
  bannerImage: text("banner_image"),
  // Curated list of product IDs the pandit features in their storefront shop.
  productIds: integer("product_ids").array().notNull().default(sql`'{}'::integer[]`),
  // Curated puja types (subset of services the pandit offers) shown above the
  // generic "book any puja" CTA. Free-text array.
  featuredPujas: text("featured_pujas").array().notNull().default(sql`'{}'::text[]`),
  // Editorial status is separate from Pandit public eligibility. Public reads
  // require both status=published and the shared eligibility predicate.
  status: text("status").notNull().default("published"),
  isPublished: boolean("is_published").notNull().default(true),
  viewCount: integer("view_count").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
export const insertPanditStorefrontSchema = createInsertSchema(panditStorefronts).omit({ id: true, viewCount: true, createdAt: true, updatedAt: true });
export type PanditStorefront = typeof panditStorefronts.$inferSelect;
export type InsertPanditStorefront = z.infer<typeof insertPanditStorefrontSchema>;

// Admin-owned identity for a puja/service. Pandits can configure an offering
// only after selecting an active master service; they cannot invent service
// identities in their own records.
export const masterServices = pgTable("master_services", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  category: text("category").notNull(),
  description: text("description").notNull().default(""),
  serviceType: text("service_type").notNull().default("puja"),
  supportedModes: text("supported_modes").array().notNull().default(sql`'{}'::text[]`),
  onlineAvailable: boolean("online_available").notNull().default(false),
  physicalAvailable: boolean("physical_available").notNull().default(true),
  searchMetadata: jsonb("search_metadata"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => ({
  slugUnique: uniqueIndex("master_services_slug_unique").on(t.slug),
  activeIdx: index("master_services_active_idx").on(t.isActive),
}));
export const insertMasterServiceSchema = createInsertSchema(masterServices).omit({ id: true, createdAt: true, updatedAt: true });
export type MasterService = typeof masterServices.$inferSelect;
export type InsertMasterService = z.infer<typeof insertMasterServiceSchema>;

// Pandit-owned configuration for one approved master service.
export const panditServices = pgTable("pandit_services", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  panditId: integer("pandit_id").notNull().references(() => pandits.id),
  masterServiceId: integer("master_service_id").notNull().references(() => masterServices.id),
  price: integer("price").notNull(),
  durationMinutes: integer("duration_minutes").notNull(),
  mode: text("mode").notNull().default("in_person"),
  description: text("description").notNull().default(""),
  preparation: text("preparation").notNull().default(""),
  inclusions: text("inclusions").array().notNull().default(sql`'{}'::text[]`),
  serviceAreas: text("service_areas").array().notNull().default(sql`'{}'::text[]`),
  availability: text("availability"),
  isActive: boolean("is_active").notNull().default(true),
  displayOrder: integer("display_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => ({
  panditMasterUnique: uniqueIndex("pandit_services_pandit_master_unique").on(t.panditId, t.masterServiceId),
  panditActiveIdx: index("pandit_services_pandit_active_idx").on(t.panditId, t.isActive),
  masterActiveIdx: index("pandit_services_master_active_idx").on(t.masterServiceId, t.isActive),
}));
export const insertPanditServiceSchema = createInsertSchema(panditServices).omit({ id: true, createdAt: true, updatedAt: true });
export type PanditService = typeof panditServices.$inferSelect;
export type InsertPanditService = z.infer<typeof insertPanditServiceSchema>;

// Pandit-owned bundles. Price is stored in rupees and is always revalidated by
// the booking service; package items point only at the owner's pandit services.
export const panditPackages = pgTable("pandit_packages", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  panditId: integer("pandit_id").notNull().references(() => pandits.id),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  description: text("description").notNull().default(""),
  price: integer("price").notNull(),
  compareAtPrice: integer("compare_at_price"),
  isActive: boolean("is_active").notNull().default(true),
  isPublished: boolean("is_published").notNull().default(false),
  displayOrder: integer("display_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => ({
  panditSlugUnique: uniqueIndex("pandit_packages_pandit_slug_unique").on(t.panditId, t.slug),
  panditPublicIdx: index("pandit_packages_pandit_public_idx").on(t.panditId, t.isActive, t.isPublished),
}));
export const panditPackageItems = pgTable("pandit_package_items", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  packageId: integer("package_id").notNull().references(() => panditPackages.id, { onDelete: "cascade" }),
  panditServiceId: integer("pandit_service_id").notNull().references(() => panditServices.id),
  displayOrder: integer("display_order").notNull().default(0),
}, (t) => ({
  packageServiceUnique: uniqueIndex("pandit_package_items_package_service_unique").on(t.packageId, t.panditServiceId),
  packageOrderIdx: index("pandit_package_items_package_order_idx").on(t.packageId, t.displayOrder),
}));
export const panditGalleryItems = pgTable("pandit_gallery_items", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  panditId: integer("pandit_id").notNull().references(() => pandits.id),
  mediaKind: text("media_kind").notNull().default("image"),
  mediaUrl: text("media_url").notNull(),
  altText: text("alt_text").notNull(),
  caption: text("caption"),
  displayOrder: integer("display_order").notNull().default(0),
  isPublished: boolean("is_published").notNull().default(false),
  removedAt: timestamp("removed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => ({
  panditPublicIdx: index("pandit_gallery_items_pandit_public_idx").on(t.panditId, t.isPublished, t.displayOrder),
}));
export const panditAvailabilityRules = pgTable("pandit_availability_rules", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  panditId: integer("pandit_id").notNull().references(() => pandits.id),
  weekday: integer("weekday").notNull(),
  startMinutes: integer("start_minutes").notNull(),
  endMinutes: integer("end_minutes").notNull(),
  timezone: text("timezone").notNull().default("Asia/Kolkata"),
  mode: text("mode").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  effectiveFrom: timestamp("effective_from"),
  effectiveUntil: timestamp("effective_until"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => ({
  panditActiveIdx: index("pandit_availability_rules_pandit_active_idx").on(t.panditId, t.isActive, t.weekday),
}));
export const insertPanditPackageSchema = createInsertSchema(panditPackages).omit({ id: true, createdAt: true, updatedAt: true });
export const insertPanditPackageItemSchema = createInsertSchema(panditPackageItems).omit({ id: true });
export const insertPanditGalleryItemSchema = createInsertSchema(panditGalleryItems).omit({ id: true, createdAt: true, updatedAt: true, removedAt: true });
export const insertPanditAvailabilityRuleSchema = createInsertSchema(panditAvailabilityRules).omit({ id: true, createdAt: true, updatedAt: true });
export type PanditPackage = typeof panditPackages.$inferSelect;
export type InsertPanditPackage = z.infer<typeof insertPanditPackageSchema>;
export type PanditPackageItem = typeof panditPackageItems.$inferSelect;
export type InsertPanditPackageItem = z.infer<typeof insertPanditPackageItemSchema>;
export type PanditGalleryItem = typeof panditGalleryItems.$inferSelect;
export type InsertPanditGalleryItem = z.infer<typeof insertPanditGalleryItemSchema>;
export type PanditAvailabilityRule = typeof panditAvailabilityRules.$inferSelect;
export type InsertPanditAvailabilityRule = z.infer<typeof insertPanditAvailabilityRuleSchema>;

// Referral attribution ledger. One row per attributable order/booking.
// kind = "order" (shop purchase) | "booking" (puja booking) | "donation".
// Commission is computed at attribution time from the pandit's tier so a
// later tier change doesn't retroactively rewrite history.
export const panditReferrals = pgTable("pandit_referrals", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  panditId: integer("pandit_id").notNull(),
  kind: text("kind").notNull(), // order | booking | donation
  refId: integer("ref_id").notNull(), // FK into orders/pujaBookings/donationOrders
  refEmail: text("ref_email"),
  grossAmount: integer("gross_amount").notNull(),       // pre-commission rupees
  commissionPct: integer("commission_pct").notNull(),   // captured at time of attribution
  commissionAmount: integer("commission_amount").notNull(),
  status: text("status").notNull().default("pending"),  // pending | approved | paid | rejected | reversed
  paidAt: timestamp("paid_at"),
  // FK into panditPayouts when the commission is settled. Null until paid.
  payoutId: integer("payout_id"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  // Idempotency: a given (kind, refId) can only attribute commission once,
  // even if a webhook retries or a checkout endpoint fires twice.
  kindRefUniq: uniqueIndex("pandit_referrals_kind_ref_id_uniq").on(t.kind, t.refId),
}));
export const insertPanditReferralSchema = createInsertSchema(panditReferrals).omit({ id: true, createdAt: true, paidAt: true, payoutId: true });
export type PanditReferral = typeof panditReferrals.$inferSelect;
export type InsertPanditReferral = z.infer<typeof insertPanditReferralSchema>;

// Physical-card orders. ₹999 default. Paid via Razorpay then shipped via
// Shiprocket. Type "qr_only" = free digital card (no row written, just PDF).
// "printed" = standard print card. "nfc" = NFC-tap card (premium tier).
export const panditCardOrders = pgTable("pandit_card_orders", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  panditId: integer("pandit_id").notNull(),
  cardType: text("card_type").notNull().default("printed"), // printed | nfc
  quantity: integer("quantity").notNull().default(1),
  unitPrice: integer("unit_price").notNull().default(999),
  totalAmount: integer("total_amount").notNull(),
  shippingName: text("shipping_name").notNull(),
  shippingPhone: text("shipping_phone").notNull(),
  shippingAddress: text("shipping_address").notNull(),
  shippingCity: text("shipping_city").notNull(),
  shippingState: text("shipping_state").notNull(),
  shippingPincode: text("shipping_pincode").notNull(),
  // Razorpay payment fields (mirroring orders table conventions).
  razorpayOrderId: text("razorpay_order_id"),
  razorpayPaymentId: text("razorpay_payment_id"),
  paymentStatus: text("payment_status").notNull().default("pending"), // pending | paid | failed | refunded
  // Shiprocket fulfilment fields.
  status: text("status").notNull().default("pending"), // pending | paid | printing | shipped | delivered | cancelled
  shiprocketOrderId: text("shiprocket_order_id"),
  shiprocketShipmentId: text("shiprocket_shipment_id"),
  trackingNumber: text("tracking_number"),
  trackingUrl: text("tracking_url"),
  shiprocketError: text("shiprocket_error"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
export const insertPanditCardOrderSchema = createInsertSchema(panditCardOrders).omit({ id: true, createdAt: true, updatedAt: true });
export type PanditCardOrder = typeof panditCardOrders.$inferSelect;
export type InsertPanditCardOrder = z.infer<typeof insertPanditCardOrderSchema>;

// Pandit tier upgrade purchases. Audit trail for Razorpay-paid tier
// transitions. The pandits.tier flip happens on /verify success; this
// row records who bought what, for how much, and which Razorpay txn it
// was tied to. Never deleted — admin can refund via paymentStatus flip.
export const panditMembershipPurchases = pgTable("pandit_membership_purchases", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  panditId: integer("pandit_id").notNull(),
  fromTier: text("from_tier").notNull(),
  toTier: text("to_tier").notNull(), // silver | gold | guru_elite
  amount: integer("amount").notNull(), // INR rupees, full price paid
  razorpayOrderId: text("razorpay_order_id"),
  razorpayPaymentId: text("razorpay_payment_id"),
  paymentStatus: text("payment_status").notNull().default("pending"), // pending | paid | failed | refunded
  // Tier validity from purchase moment. We default to 365 days; admin
  // can extend or revoke.
  activatedAt: timestamp("activated_at"),
  expiresAt: timestamp("expires_at"),
  // Renewal-reminder bookkeeping. The daily sweep emails pandits once at
  // T-14d, again at T-3d, and a final notice on the day of expiry; we
  // record the latest stage so we never double-send.
  lastReminderAt: timestamp("last_reminder_at"),
  lastReminderStage: text("last_reminder_stage"), // 14d | 3d | expired
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export const insertPanditMembershipPurchaseSchema = createInsertSchema(panditMembershipPurchases).omit({ id: true, createdAt: true });
export type PanditMembershipPurchase = typeof panditMembershipPurchases.$inferSelect;
export type InsertPanditMembershipPurchase = z.infer<typeof insertPanditMembershipPurchaseSchema>;

// Admin-managed Jap Counter mantras + chant audio. The JapCounter ships
// with 13 built-in PRESET_MANTRAS hardcoded in the component; this table
// lets the admin extend that list at runtime — adding regional mantras,
// festival-specific chants, or community submissions without a deploy.
// Audio can be uploaded as an .mp3/.m4a/.ogg/.wav (multer → /uploads/
// mantra-audio/...) OR pasted as an external URL. Marked isActive=false
// to soft-hide without deleting.
export const adminMantras = pgTable("admin_mantras", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  // URL-safe stable id used as the mantraId in localStorage so per-user
  // counts persist across renames. Lowercase, hyphenated, unique.
  slug: text("slug").notNull().unique(),
  label: text("label").notNull(),
  sanskrit: text("sanskrit"),
  transliteration: text("transliteration"),
  // Free-form short paragraph, surfaced in the JapCounter's "What does
  // this mean?" disclosure for admin-added mantras.
  meaning: text("meaning"),
  deity: text("deity"),
  // Loose grouping ("Shiva", "Devi", "Hanuman", "Festival" …) — purely
  // informational for now; the counter UI groups by label order.
  category: text("category"),
  // Either a /uploads/mantra-audio/... path (uploaded via the admin
  // upload route) OR a fully-qualified https URL to an external file.
  // When non-empty, the JapCounter shows the play/pause control.
  audioUrl: text("audio_url"),
  audioMimeType: text("audio_mime_type"),
  // Hex color used as the accent for the mantra card (defaults to gold
  // when blank). e.g. #6D2B35.
  accentColor: text("accent_color"),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
export const insertAdminMantraSchema = createInsertSchema(adminMantras).omit({
  id: true, createdAt: true, updatedAt: true,
});
export type AdminMantra = typeof adminMantras.$inferSelect;
export type InsertAdminMantra = z.infer<typeof insertAdminMantraSchema>;

// =====================================================================
// AI Coder — admin-facing in-house code generation tab.
// One row per generation request. Stores the prompt, the files the
// admin selected as context, and the diffs the model proposed. On
// Apply, oldContents is snapshotted from disk before the new files
// are written, enabling Rollback to restore byte-for-byte. Tier 1:
// AI never edits the live filesystem itself — every write is gated
// by a manual Apply click in the admin UI.
// =====================================================================
export const aiCoderSessions = pgTable("ai_coder_sessions", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  adminActor: text("admin_actor").notNull(), // last 6 of admin session token (mirrors audit log convention)
  prompt: text("prompt").notNull(),
  contextPaths: text("context_paths").array().notNull().default(sql`ARRAY[]::text[]`),
  generatedFiles: jsonb("generated_files").notNull().default(sql`'[]'::jsonb`), // [{ path, newContent }]
  oldContents: jsonb("old_contents").notNull().default(sql`'[]'::jsonb`),       // [{ path, oldContent }] snapshot at apply
  summary: text("summary"),
  model: text("model"),
  status: text("status").notNull().default("proposed"), // proposed | applied | rejected | rolledback | error
  errorMessage: text("error_message"),
  tokenUsage: jsonb("token_usage"), // { prompt, completion, total }
  createdAt: timestamp("created_at").defaultNow(),
  appliedAt: timestamp("applied_at"),
  rolledbackAt: timestamp("rolledback_at"),
});
export const insertAiCoderSessionSchema = createInsertSchema(aiCoderSessions).omit({
  id: true, status: true, createdAt: true, appliedAt: true, rolledbackAt: true,
});
export type AiCoderSession = typeof aiCoderSessions.$inferSelect;
export type InsertAiCoderSession = z.infer<typeof insertAiCoderSessionSchema>;

// =====================================================================
// Spiritual Journey — persists a user's sadhana log server-side so
// progress survives device switches and browser clears.
// One row per user; `data` stores the full JourneyData JSON blob.
// =====================================================================
export const spiritualJourney = pgTable("spiritual_journey", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").notNull().unique(),
  data: jsonb("data").notNull().default("{}"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
export type SpiritualJourney = typeof spiritualJourney.$inferSelect;

// =====================================================================
// Schema Changelog — human-readable log of every database schema change.
// Each row records when a change was made, what it was (in plain English),
// which type of change it was, which table(s) it affected, and who did it.
// Surfaced in Admin → Schema Changelog for non-technical stakeholders.
// =====================================================================
export const schemaChangelog = pgTable("schema_changelog", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  changeDate: text("change_date").notNull(),
  description: text("description").notNull(),
  changeType: text("change_type").notNull().default("other"),
  tableName: text("table_name"),
  author: text("author"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
export const insertSchemaChangelogSchema = createInsertSchema(schemaChangelog).omit({
  id: true, createdAt: true, updatedAt: true,
});
export type SchemaChangelog = typeof schemaChangelog.$inferSelect;
export type InsertSchemaChangelog = z.infer<typeof insertSchemaChangelogSchema>;

// =====================================================================
// API Credentials Vault — admin-managed payment-gateway and AI-provider
// keys. Stored encrypted (AES-256-GCM) in `encrypted_data`. On server
// boot every row with `is_active = true` is decrypted and projected into
// process.env via the provider's envMap, so existing code paths that
// read `process.env.RAZORPAY_KEY_ID` etc. keep working unchanged.
// =====================================================================
export const apiCredentials = pgTable("api_credentials", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  kind: text("kind").notNull(),          // "payment" | "ai"
  provider: text("provider").notNull(),  // "razorpay" | "openai" | ...
  label: text("label").notNull(),
  mode: text("mode").notNull().default("test"), // "test" | "live"
  isActive: boolean("is_active").notNull().default(false),
  encryptedData: text("encrypted_data").notNull(),
  meta: jsonb("meta").notNull().default(sql`'{}'::jsonb`),
  lastTestedAt: timestamp("last_tested_at"),
  lastTestResult: jsonb("last_test_result"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => ({
  providerActiveIdx: index("api_credentials_provider_active_idx").on(t.provider, t.isActive),
  kindIdx: index("api_credentials_kind_idx").on(t.kind),
}));
export const insertApiCredentialSchema = createInsertSchema(apiCredentials).omit({
  id: true, createdAt: true, updatedAt: true, lastTestedAt: true, lastTestResult: true,
});
export type ApiCredential = typeof apiCredentials.$inferSelect;
export type InsertApiCredential = z.infer<typeof insertApiCredentialSchema>;

// ===== Blog Comments (public, moderated) =====
export const blogComments = pgTable("blog_comments", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  postId: integer("post_id").notNull(),
  parentId: integer("parent_id"), // for threaded replies (1 level deep)
  name: text("name").notNull(),
  email: text("email").notNull(),
  body: text("body").notNull(),
  status: text("status").notNull().default("pending"), // "pending" | "approved" | "rejected"
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  postIdx: index("blog_comments_post_idx").on(t.postId),
  statusIdx: index("blog_comments_status_idx").on(t.status),
}));
export const insertBlogCommentSchema = createInsertSchema(blogComments).omit({
  id: true, createdAt: true, status: true, ipAddress: true,
});
export type BlogComment = typeof blogComments.$inferSelect;
export type InsertBlogComment = z.infer<typeof insertBlogCommentSchema>;

// ===== Community Q&A (Quora-style) =====
// postId NULL = global community Q&A (not tied to a single blog post)
export const qaQuestions = pgTable("qa_questions", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  body: text("body"),
  category: text("category"), // "puja" | "rituals" | "astrology" | "festivals" | "general"
  tags: text("tags").array(),
  postId: integer("post_id"), // optional link to a blog post
  pujaSlug: text("puja_slug"), // optional link to a puja-type page
  authorName: text("author_name").notNull().default("Anonymous"),
  authorEmail: text("author_email"),
  status: text("status").notNull().default("pending"), // "pending" | "approved" | "rejected"
  isFeatured: boolean("is_featured").notNull().default(false),
  viewCount: integer("view_count").notNull().default(0),
  upvotes: integer("upvotes").notNull().default(0),
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
}, (t) => ({
  categoryIdx: index("qa_questions_category_idx").on(t.category),
  statusIdx: index("qa_questions_status_idx").on(t.status),
  postIdx: index("qa_questions_post_idx").on(t.postId),
  pujaIdx: index("qa_questions_puja_idx").on(t.pujaSlug),
}));
export const insertQaQuestionSchema = createInsertSchema(qaQuestions).omit({
  id: true, createdAt: true, status: true, viewCount: true, upvotes: true, ipAddress: true,
});
export type QaQuestion = typeof qaQuestions.$inferSelect;
export type InsertQaQuestion = z.infer<typeof insertQaQuestionSchema>;

export const qaAnswers = pgTable("qa_answers", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  questionId: integer("question_id").notNull(),
  body: text("body").notNull(),
  authorName: text("author_name").notNull().default("Vedic Tatva"),
  authorEmail: text("author_email"),
  authorRole: text("author_role").notNull().default("admin"), // "admin" | "user" | "ai"
  isAccepted: boolean("is_accepted").notNull().default(false),
  upvotes: integer("upvotes").notNull().default(0),
  status: text("status").notNull().default("approved"),
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  questionIdx: index("qa_answers_question_idx").on(t.questionId),
  statusIdx: index("qa_answers_status_idx").on(t.status),
}));
export const insertQaAnswerSchema = createInsertSchema(qaAnswers).omit({
  id: true, createdAt: true, upvotes: true, ipAddress: true,
});
export type QaAnswer = typeof qaAnswers.$inferSelect;
export type InsertQaAnswer = z.infer<typeof insertQaAnswerSchema>;

// ===== Puja Library (rich content per puja type) =====
export const pujaTypes = pgTable("puja_types", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  deity: text("deity"),
  shortDescription: text("short_description"),
  whyPerformed: text("why_performed"), // markdown/HTML — meaning and purpose
  storyMyth: text("story_myth"), // mythological background
  howCelebrated: text("how_celebrated"), // step-by-step ritual
  ethics: text("ethics"), // do's and don'ts
  requirements: jsonb("requirements").default(sql`'[]'::jsonb`), // array of {item, qty, note}
  benefits: text("benefits"),
  faq: jsonb("faq").default(sql`'[]'::jsonb`), // array of {q, a}
  aplusBlocks: jsonb("aplus_blocks").default(sql`'[]'::jsonb`), // optional rich content blocks
  category: text("category"), // "deity" | "occasion" | "remedial" | "samskara"
  difficulty: text("difficulty").default("moderate"), // "simple" | "moderate" | "elaborate"
  durationMinutes: integer("duration_minutes"),
  estimatedCost: text("estimated_cost"),
  bestMonths: text("best_months").array(), // hindu month names
  // Computed muhurat seed — engine uses these to derive yearly muhurats
  muhuratRules: jsonb("muhurat_rules").default(sql`'[]'::jsonb`), // [{type:"tithi", paksha, tithi}, {type:"weekday", day}, {type:"festival", name}]
  coverImage: text("cover_image"),
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
  metaKeywords: text("meta_keywords"),
  bookingShopUrl: text("booking_shop_url"),
  bookingShopLabel: text("booking_shop_label"),
  isPublished: boolean("is_published").notNull().default(true),
  viewCount: integer("view_count").notNull().default(0),
  displayOrder: integer("display_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => ({
  categoryIdx: index("puja_types_category_idx").on(t.category),
  publishedIdx: index("puja_types_published_idx").on(t.isPublished),
}));
export const insertPujaTypeSchema = createInsertSchema(pujaTypes).omit({
  id: true, createdAt: true, updatedAt: true, viewCount: true,
});
export type PujaType = typeof pujaTypes.$inferSelect;
export type InsertPujaType = z.infer<typeof insertPujaTypeSchema>;

// ===== Yearly muhurat cache (regenerated annually; content stable) =====
export const pujaMuhurats = pgTable("puja_muhurats", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  pujaId: integer("puja_id").notNull(),
  year: integer("year").notNull(),
  muhurats: jsonb("muhurats").notNull().default(sql`'[]'::jsonb`), // [{date:"2026-03-14", tithi, time, note, label}]
  generatedAt: timestamp("generated_at").defaultNow().notNull(),
}, (t) => ({
  pujaYearUnique: uniqueIndex("puja_muhurats_puja_year_unique").on(t.pujaId, t.year),
  yearIdx: index("puja_muhurats_year_idx").on(t.year),
}));
export const insertPujaMuhuratSchema = createInsertSchema(pujaMuhurats).omit({
  id: true, generatedAt: true,
});
export type PujaMuhurat = typeof pujaMuhurats.$inferSelect;
export type InsertPujaMuhurat = z.infer<typeof insertPujaMuhuratSchema>;

// ===== Sacred Library: Kindle-style reader for chalisas, mantras, kathas, =====
// stotras, aartis. One row per text. Lyrics + transliteration + translation
// all stored together so the reader can toggle scripts. audioUrl points to a
// /uploads/sacred-audio/... file (uploaded by admin) or an external URL.
export const sacredTexts = pgTable("sacred_texts", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  deity: text("deity").notNull(), // e.g. "Hanuman", "Shiva", "Ganesha"
  textType: text("text_type").notNull(), // chalisa | mantra | katha | aarti | stotra | book
  language: text("language").notNull().default("hindi"), // hindi | sanskrit | english
  lyrics: text("lyrics").notNull(), // Devanagari verses, line-separated
  transliteration: text("transliteration"), // IAST/Roman
  translation: text("translation"), // English meaning per verse or paragraph
  meaning: text("meaning"), // Overall summary / phala-shruti
  audioUrl: text("audio_url"),
  coverImage: text("cover_image"),
  excerpt: text("excerpt"),
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
  tags: text("tags").array().default(sql`ARRAY[]::text[]`),
  durationSeconds: integer("duration_seconds"),
  verseCount: integer("verse_count"),
  aiGenerated: boolean("ai_generated").default(false),
  sourcePrompt: text("source_prompt"),
  status: text("status").notNull().default("pending"), // pending | published | rejected
  isPublished: boolean("is_published").default(false),
  viewCount: integer("view_count").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => ({
  deityIdx: index("sacred_texts_deity_idx").on(t.deity),
  typeIdx: index("sacred_texts_type_idx").on(t.textType),
  publishedIdx: index("sacred_texts_published_idx").on(t.isPublished),
}));
export const insertSacredTextSchema = createInsertSchema(sacredTexts).omit({
  id: true, createdAt: true, updatedAt: true, viewCount: true,
});
export type SacredText = typeof sacredTexts.$inferSelect;
export type InsertSacredText = z.infer<typeof insertSacredTextSchema>;

// =====================================================================
// Karma & Dharma — gamified spiritual activity tracker.
//   - spiritualActivities: append-only log of every action (japa rounds,
//     charity ₹, fasting day, temple visit, gauseva, pind daan).
//   - festivals: editable calendar of festivals; the daily reminder
//     scheduler picks rows that are exactly 7 days away.
//   - festivalReminderLog: dedupes reminder emails so the scheduler can
//     run safely every hour without re-sending.
// Karma + Dharma scores are derived sums (computed by the API), not
// denormalized — keeps writes simple and avoids drift.
// =====================================================================
export const SPIRITUAL_ACTIVITY_TYPES = [
  "japa", "charity", "fasting", "temple", "gauseva", "pind_daan",
] as const;
export type SpiritualActivityType = (typeof SPIRITUAL_ACTIVITY_TYPES)[number];

export const spiritualActivities = pgTable("spiritual_activities", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").notNull(),
  activityType: text("activity_type").notNull(),
  // Free-form numeric value: japa rounds, ₹ donated, days fasted, etc.
  value: integer("value").notNull().default(1),
  // Pre-computed at write time so dashboards stay O(1) per row.
  karmaPoints: integer("karma_points").notNull().default(0),
  dharmaPoints: integer("dharma_points").notNull().default(0),
  notes: text("notes"),
  performedAt: timestamp("performed_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  userIdx: index("spiritual_act_user_idx").on(t.userId),
  perfIdx: index("spiritual_act_performed_idx").on(t.performedAt),
}));
export const insertSpiritualActivitySchema = createInsertSchema(spiritualActivities).omit({
  id: true, karmaPoints: true, dharmaPoints: true, createdAt: true,
});
export type SpiritualActivity = typeof spiritualActivities.$inferSelect;
export type InsertSpiritualActivity = z.infer<typeof insertSpiritualActivitySchema>;

export const festivals = pgTable("festivals", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  // Stored as YYYY-MM-DD so we can compare without timezone games.
  date: text("date").notNull(),
  description: text("description"),
  preparationNotes: text("preparation_notes"),
  importance: text("importance").notNull().default("medium"), // low|medium|high
  notifyPandits: boolean("notify_pandits").notNull().default(true),
  notifyUsers: boolean("notify_users").notNull().default(true),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  dateIdx: index("festivals_date_idx").on(t.date),
}));
export const insertFestivalSchema = createInsertSchema(festivals).omit({ id: true, createdAt: true });
export type Festival = typeof festivals.$inferSelect;
export type InsertFestival = z.infer<typeof insertFestivalSchema>;

export const festivalReminderLog = pgTable("festival_reminder_log", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  festivalId: integer("festival_id").notNull(),
  recipientType: text("recipient_type").notNull(), // user|pandit
  recipientId: integer("recipient_id").notNull(),
  sentAt: timestamp("sent_at").defaultNow().notNull(),
}, (t) => ({
  // Idempotency: each (festival, recipient) pair gets exactly one reminder.
  unq: uniqueIndex("festival_reminder_unq").on(t.festivalId, t.recipientType, t.recipientId),
}));

// ============================================================================
// Hero Slider — admin-managed homepage hero carousel.
// Each row = one slide. CRUD via /api/admin/hero-slides. Public read at
// /api/hero-slides returns only enabled rows ordered by `position`.
// imageUrl can be an absolute URL, a /uploads/... path (admin upload), or
// a /attached_assets/... path (legacy bundled hero scenes).
// ============================================================================
export const heroSlides = pgTable("hero_slides", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  position: integer("position").notNull().default(0),
  enabled: boolean("enabled").notNull().default(true),
  imageUrl: text("image_url").notNull(),
  imageAlt: text("image_alt").notNull().default(""),
  mobilePosition: text("mobile_position").notNull().default("center center"),
  // Separate mobile image (portrait-optimised); falls back to imageUrl if null
  mobileImageUrl: text("mobile_image_url"),
  // Content-aware focal point 0–100 (percentage of image width/height)
  focalX: integer("focal_x").notNull().default(50),
  focalY: integer("focal_y").notNull().default(50),
  // Overlay opacity 0–100 for desktop and mobile
  overlayOpacity: integer("overlay_opacity").notNull().default(50),
  mobileOverlayOpacity: integer("mobile_overlay_opacity").notNull().default(60),
  tagline: text("tagline").notNull().default(""),
  title1: text("title1").notNull().default(""),
  title2: text("title2").notNull().default(""),
  title2Highlight: text("title2_highlight").notNull().default(""),
  subtitle: text("subtitle").notNull().default(""),
  cta1Label: text("cta1_label").notNull().default(""),
  cta1Href: text("cta1_href").notNull().default(""),
  cta1Icon: text("cta1_icon").notNull().default("ShoppingBag"),
  cta1Style: text("cta1_style").notNull().default("filled"),
  cta2Label: text("cta2_label").notNull().default(""),
  cta2Href: text("cta2_href").notNull().default(""),
  cta2Icon: text("cta2_icon").notNull().default("Sparkles"),
  cta2Style: text("cta2_style").notNull().default("outline"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => ({
  positionIdx: index("hero_slides_position_idx").on(t.position),
}));

export const insertHeroSlideSchema = createInsertSchema(heroSlides, {
  imageUrl: z.string().min(1, "imageUrl is required").max(2048),
  imageAlt: z.string().max(500).optional(),
  mobilePosition: z.string().max(50).optional(),
  mobileImageUrl: z.string().max(2048).nullable().optional(),
  focalX: z.number().int().min(0).max(100).optional(),
  focalY: z.number().int().min(0).max(100).optional(),
  overlayOpacity: z.number().int().min(0).max(100).optional(),
  mobileOverlayOpacity: z.number().int().min(0).max(100).optional(),
  tagline: z.string().max(200).optional(),
  title1: z.string().max(200).optional(),
  title2: z.string().max(200).optional(),
  title2Highlight: z.string().max(200).optional(),
  subtitle: z.string().max(600).optional(),
  cta1Label: z.string().max(120).optional(),
  cta1Href: z.string().max(1024).optional(),
  cta1Icon: z.string().max(60).optional(),
  cta1Style: z.enum(["filled", "outline"]).optional(),
  cta2Label: z.string().max(120).optional(),
  cta2Href: z.string().max(1024).optional(),
  cta2Icon: z.string().max(60).optional(),
  cta2Style: z.enum(["filled", "outline"]).optional(),
  position: z.number().int().min(0).max(999).optional(),
  enabled: z.boolean().optional(),
}).omit({ id: true, createdAt: true, updatedAt: true });

export type HeroSlide = typeof heroSlides.$inferSelect;
export type InsertHeroSlide = z.infer<typeof insertHeroSlideSchema>;

// ============================================================================
// Homepage Sections — admin-managed order + visibility of the movable blocks
// on the homepage (Spiritual Snapshot, Book a Pandit, Tabbed Shop, Bhandara
// Seva, Testimonials, Vedic Astrology). Hero, conversion tagline and the
// SEO content block remain structural and are NOT in this table.
// `key` is a stable string the frontend maps to a section component.
// Public GET /api/homepage-sections returns ordered rows; admin PATCH/reorder
// gated by adminAuthMiddleware.
// ============================================================================
export const homepageSections = pgTable("homepage_sections", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  key: text("key").notNull().unique(),
  label: text("label").notNull(),
  position: integer("position").notNull().default(0),
  enabled: boolean("enabled").notNull().default(true),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => ({
  positionIdx: index("homepage_sections_position_idx").on(t.position),
}));

export const insertHomepageSectionSchema = createInsertSchema(homepageSections, {
  key: z.string().min(1).max(64),
  label: z.string().min(1).max(120),
  position: z.number().int().min(0).max(999).optional(),
  enabled: z.boolean().optional(),
}).omit({ id: true, updatedAt: true });

export type HomepageSection = typeof homepageSections.$inferSelect;
export type InsertHomepageSection = z.infer<typeof insertHomepageSectionSchema>;

// ============================================================================
// Page Views — lightweight visitor analytics captured server-side.
// Each SPA route change fires POST /api/track/pageview which stores this row.
// IP → city/country enrichment happens asynchronously via ipapi.co (free tier).
// ============================================================================
export const pageViews = pgTable("page_views", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  sessionId: text("session_id"),
  path: text("path").notNull(),
  referrer: text("referrer"),
  userAgent: text("user_agent"),
  ip: text("ip"),
  country: text("country"),
  city: text("city"),
  device: text("device"),
  browser: text("browser"),
  os: text("os"),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => ({
  createdAtIdx: index("page_views_created_at_idx").on(t.createdAt),
  sessionIdx:   index("page_views_session_idx").on(t.sessionId),
}));

export type PageView = typeof pageViews.$inferSelect;

// ============================================================================
// Knowledge Graph — governed links between existing source records only.
// Entity content remains authoritative in its existing table.
// ============================================================================
export const knowledgeGraphRelationships = pgTable("knowledge_graph_relationships", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  sourceEntityType: text("source_entity_type").notNull(),
  sourceEntityId: integer("source_entity_id").notNull(),
  sourceDiscriminator: text("source_discriminator"),
  relationshipType: text("relationship_type").notNull(),
  targetEntityType: text("target_entity_type").notNull(),
  targetEntityId: integer("target_entity_id").notNull(),
  targetDiscriminator: text("target_discriminator"),
  status: text("status").notNull().default("ACTIVE"),
  displayOrder: integer("display_order").notNull().default(0),
  metadata: jsonb("metadata").notNull().default(sql`'{}'::jsonb`),
  createdByAdminId: integer("created_by_admin_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => ({
  sourceIdx: index("knowledge_graph_relationships_source_idx").on(t.sourceEntityType, t.sourceEntityId),
  targetIdx: index("knowledge_graph_relationships_target_idx").on(t.targetEntityType, t.targetEntityId),
  relationshipTypeIdx: index("knowledge_graph_relationships_relationship_type_idx").on(t.relationshipType),
  sourceRelationshipIdx: index("knowledge_graph_relationships_source_relationship_idx").on(t.sourceEntityType, t.sourceEntityId, t.relationshipType),
  targetRelationshipIdx: index("knowledge_graph_relationships_target_relationship_idx").on(t.targetEntityType, t.targetEntityId, t.relationshipType),
  statusIdx: index("knowledge_graph_relationships_status_idx").on(t.status),
  exactEdgeUnique: uniqueIndex("knowledge_graph_relationships_exact_edge_unique").on(
    t.sourceEntityType, t.sourceEntityId, sql`COALESCE(${t.sourceDiscriminator}, '')`, t.relationshipType,
    t.targetEntityType, t.targetEntityId, sql`COALESCE(${t.targetDiscriminator}, '')`,
  ),
  sourceTypeCheck: check("knowledge_graph_relationships_source_type_check", sql`${t.sourceEntityType} IN ('PUJA','PANDIT','LOCATION','TIRTH','TEMPLE','PRODUCT','ARTICLE','SERVICE','REVIEW','YATRA')`),
  targetTypeCheck: check("knowledge_graph_relationships_target_type_check", sql`${t.targetEntityType} IN ('PUJA','PANDIT','LOCATION','TIRTH','TEMPLE','PRODUCT','ARTICLE','SERVICE','REVIEW','YATRA')`),
  relationshipTypeCheck: check("knowledge_graph_relationships_relationship_type_check", sql`${t.relationshipType} IN ('performed_by','specializes_in','available_in','located_in','offers','related_to','related_article','related_product','associated_with','contains','available_puja','related_service','related_tirth','related_temple','related_yatra','discusses')`),
  statusCheck: check("knowledge_graph_relationships_status_check", sql`${t.status} IN ('ACTIVE','DRAFT')`),
  sourceIdCheck: check("knowledge_graph_relationships_source_id_check", sql`${t.sourceEntityId} > 0`),
  targetIdCheck: check("knowledge_graph_relationships_target_id_check", sql`${t.targetEntityId} > 0`),
  displayOrderCheck: check("knowledge_graph_relationships_display_order_check", sql`${t.displayOrder} BETWEEN 0 AND 10000`),
  metadataCheck: check("knowledge_graph_relationships_metadata_check", sql`jsonb_typeof(${t.metadata}) = 'object'`),
  sourceLocationCheck: check("knowledge_graph_relationships_source_location_check", sql`(${t.sourceEntityType} = 'LOCATION' AND ${t.sourceDiscriminator} IS NOT NULL AND ${t.sourceDiscriminator} IN ('STATE','CITY')) OR (${t.sourceEntityType} <> 'LOCATION' AND ${t.sourceDiscriminator} IS NULL)`),
  targetLocationCheck: check("knowledge_graph_relationships_target_location_check", sql`(${t.targetEntityType} = 'LOCATION' AND ${t.targetDiscriminator} IS NOT NULL AND ${t.targetDiscriminator} IN ('STATE','CITY')) OR (${t.targetEntityType} <> 'LOCATION' AND ${t.targetDiscriminator} IS NULL)`),
}));

export const knowledgeGraphQualityRules = pgTable("knowledge_graph_quality_rules", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  sourceEntityType: text("source_entity_type").notNull(),
  relationshipType: text("relationship_type").notNull(),
  allowedTargetEntityTypes: text("allowed_target_entity_types").array().notNull(),
  minimumRequiredCount: integer("minimum_required_count").notNull().default(1),
  isActive: boolean("is_active").notNull().default(true),
  createdByAdminId: integer("created_by_admin_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => ({
  sourceRelationshipUnique: uniqueIndex("knowledge_graph_quality_rules_source_relationship_unique").on(t.sourceEntityType, t.relationshipType),
  activeIdx: index("knowledge_graph_quality_rules_active_idx").on(t.isActive),
  sourceIdx: index("knowledge_graph_quality_rules_source_idx").on(t.sourceEntityType),
  sourceTypeCheck: check("knowledge_graph_quality_rules_source_type_check", sql`${t.sourceEntityType} IN ('PUJA','PANDIT','LOCATION','TIRTH','TEMPLE','PRODUCT','ARTICLE','SERVICE','REVIEW','YATRA')`),
  relationshipTypeCheck: check("knowledge_graph_quality_rules_relationship_type_check", sql`${t.relationshipType} IN ('performed_by','specializes_in','available_in','located_in','offers','related_to','related_article','related_product','associated_with','contains','available_puja','related_service','related_tirth','related_temple','related_yatra','discusses')`),
  targetsCheck: check("knowledge_graph_quality_rules_targets_check", sql`cardinality(${t.allowedTargetEntityTypes}) BETWEEN 1 AND 10 AND ${t.allowedTargetEntityTypes} <@ ARRAY['PUJA','PANDIT','LOCATION','TIRTH','TEMPLE','PRODUCT','ARTICLE','SERVICE','REVIEW','YATRA']::text[]`),
  minimumCountCheck: check("knowledge_graph_quality_rules_minimum_count_check", sql`${t.minimumRequiredCount} BETWEEN 1 AND 100`),
}));

// Canonical destination source records.  These deliberately do not share a
// table with sellable tirth_yatra_tours: a destination and a tour have
// different ownership and lifecycle rules.
export const tirths = pgTable("tirths", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  migrationSourceKey: text("migration_source_key").notNull(),
  slug: text("slug").notNull(),
  name: text("name").notNull(),
  nameHindi: text("name_hindi"),
  status: text("status").notNull().default("DRAFT"),
  provenance: text("provenance").notNull(),
  region: text("region"),
  state: text("state"),
  deity: text("deity"),
  category: text("category"),
  shortDescription: text("short_description"),
  description: text("description"),
  latitude: real("latitude"),
  longitude: real("longitude"),
  heroMediaUrl: text("hero_media_url"),
  editorial: jsonb("editorial").notNull().default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => ({
  migrationSourceKeyUnique: uniqueIndex("tirths_migration_source_key_unique").on(t.migrationSourceKey),
  slugUnique: uniqueIndex("tirths_slug_unique").on(t.slug),
  statusIdx: index("tirths_status_idx").on(t.status),
  publicEligibilityIdx: index("tirths_public_eligibility_idx").on(t.status, t.slug),
  statusCheck: check("tirths_status_check", sql`${t.status} IN ('DRAFT','PUBLISHED','ARCHIVED')`),
  provenanceCheck: check("tirths_provenance_check", sql`${t.provenance} IN ('TIRTH_GUIDE','TEMPLE_TOURISM','EDITORIAL')`),
  sourceKeyCheck: check("tirths_migration_source_key_check", sql`length(${t.migrationSourceKey}) BETWEEN 1 AND 200`),
  slugCheck: check("tirths_slug_check", sql`${t.slug} ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'`),
  editorialCheck: check("tirths_editorial_check", sql`jsonb_typeof(${t.editorial}) = 'object'`),
  coordinatesCheck: check("tirths_coordinates_check", sql`(${t.latitude} IS NULL AND ${t.longitude} IS NULL) OR (${t.latitude} IS NOT NULL AND ${t.longitude} IS NOT NULL)`),
  latitudeRangeCheck: check("tirths_latitude_range_check", sql`${t.latitude} IS NULL OR ${t.latitude} BETWEEN -90 AND 90`),
  longitudeRangeCheck: check("tirths_longitude_range_check", sql`${t.longitude} IS NULL OR ${t.longitude} BETWEEN -180 AND 180`),
}));

export const temples = pgTable("temples", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  migrationSourceKey: text("migration_source_key").notNull(),
  slug: text("slug").notNull(),
  name: text("name").notNull(),
  nameHindi: text("name_hindi"),
  status: text("status").notNull().default("DRAFT"),
  provenance: text("provenance").notNull(),
  location: text("location"),
  state: text("state"),
  deity: text("deity"),
  category: text("category"),
  shortDescription: text("short_description"),
  description: text("description"),
  latitude: real("latitude"),
  longitude: real("longitude"),
  heroMediaUrl: text("hero_media_url"),
  editorial: jsonb("editorial").notNull().default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => ({
  migrationSourceKeyUnique: uniqueIndex("temples_migration_source_key_unique").on(t.migrationSourceKey),
  slugUnique: uniqueIndex("temples_slug_unique").on(t.slug),
  statusIdx: index("temples_status_idx").on(t.status),
  publicEligibilityIdx: index("temples_public_eligibility_idx").on(t.status, t.slug),
  statusCheck: check("temples_status_check", sql`${t.status} IN ('DRAFT','PUBLISHED','ARCHIVED')`),
  provenanceCheck: check("temples_provenance_check", sql`${t.provenance} IN ('TEMPLE_TOURISM','EDITORIAL')`),
  sourceKeyCheck: check("temples_migration_source_key_check", sql`length(${t.migrationSourceKey}) BETWEEN 1 AND 200`),
  slugCheck: check("temples_slug_check", sql`${t.slug} ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'`),
  editorialCheck: check("temples_editorial_check", sql`jsonb_typeof(${t.editorial}) = 'object'`),
  coordinatesCheck: check("temples_coordinates_check", sql`(${t.latitude} IS NULL AND ${t.longitude} IS NULL) OR (${t.latitude} IS NOT NULL AND ${t.longitude} IS NOT NULL)`),
  latitudeRangeCheck: check("temples_latitude_range_check", sql`${t.latitude} IS NULL OR ${t.latitude} BETWEEN -90 AND 90`),
  longitudeRangeCheck: check("temples_longitude_range_check", sql`${t.longitude} IS NULL OR ${t.longitude} BETWEEN -180 AND 180`),
}));

export const destinationSlugAliases = pgTable("destination_slug_aliases", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  entityType: text("entity_type").notNull(),
  entityId: integer("entity_id").notNull(),
  aliasSlug: text("alias_slug").notNull(),
  canonicalSlug: text("canonical_slug").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => ({
  entityAliasUnique: uniqueIndex("destination_slug_aliases_entity_alias_unique").on(t.entityType, t.aliasSlug),
  aliasLookupIdx: index("destination_slug_aliases_alias_lookup_idx").on(t.aliasSlug),
  entityLookupIdx: index("destination_slug_aliases_entity_lookup_idx").on(t.entityType, t.entityId),
  entityTypeCheck: check("destination_slug_aliases_entity_type_check", sql`${t.entityType} IN ('TIRTH','TEMPLE')`),
  entityIdCheck: check("destination_slug_aliases_entity_id_check", sql`${t.entityId} > 0`),
  aliasSlugCheck: check("destination_slug_aliases_alias_slug_check", sql`${t.aliasSlug} ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'`),
  canonicalSlugCheck: check("destination_slug_aliases_canonical_slug_check", sql`${t.canonicalSlug} ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'`),
  nonSelfCheck: check("destination_slug_aliases_non_self_check", sql`${t.aliasSlug} <> ${t.canonicalSlug}`),
}));

// A singleton.  Cache consumers include generation in their key and therefore
// fail closed until a later Admin-only gate implementation explicitly enables it.
export const knowledgeGraphPublicState = pgTable("knowledge_graph_public_state", {
  id: integer("id").primaryKey().default(1),
  isPublicEnabled: boolean("is_public_enabled").notNull().default(false),
  generation: integer("generation").notNull().default(0),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => ({
  singletonCheck: check("knowledge_graph_public_state_singleton_check", sql`${t.id} = 1`),
  generationCheck: check("knowledge_graph_public_state_generation_check", sql`${t.generation} >= 0`),
}));
export const knowledgeGraphEntityRevisions = pgTable("knowledge_graph_entity_revisions", {
  entityType: text("entity_type").notNull(),
  entityId: integer("entity_id").notNull(),
  discriminator: text("discriminator").notNull().default(""),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => ({ identity: uniqueIndex("knowledge_graph_entity_revisions_identity").on(t.entityType, t.entityId, t.discriminator) }));

export type KnowledgeGraphRelationship = typeof knowledgeGraphRelationships.$inferSelect;
export type KnowledgeGraphQualityRule = typeof knowledgeGraphQualityRules.$inferSelect;
export type Tirth = typeof tirths.$inferSelect;
export type Temple = typeof temples.$inferSelect;
export type DestinationSlugAlias = typeof destinationSlugAliases.$inferSelect;
export type KnowledgeGraphPublicState = typeof knowledgeGraphPublicState.$inferSelect;
export type KnowledgeGraphEntityRevision = typeof knowledgeGraphEntityRevisions.$inferSelect;
export const insertKnowledgeGraphRelationshipSchema = createInsertSchema(knowledgeGraphRelationships).omit({
  id: true, createdAt: true, updatedAt: true,
});
export const insertKnowledgeGraphQualityRuleSchema = createInsertSchema(knowledgeGraphQualityRules).omit({
  id: true, createdAt: true, updatedAt: true,
});
export type InsertKnowledgeGraphRelationship = z.infer<typeof insertKnowledgeGraphRelationshipSchema>;
export type InsertKnowledgeGraphQualityRule = z.infer<typeof insertKnowledgeGraphQualityRuleSchema>;
