import { eq, ilike, and, or, desc, asc, sql as dsql, sql, gt, gte, lte, lt, count, inArray, notInArray, isNull, type SQL } from "drizzle-orm";
import { db } from "./db";
import {
  users, products, orders, pandits, panditReviews, panditApplications, franchiseApplications, pujaBookings, astrologyBookings,
  socialProofSettings, boostEvents, salesPopups, siteSettings, productReviews, reviewHelpfulVotes, productQuestions, returnTickets, adminAuditLogs, heroSlides, homepageSections,
  coupons, subscriptions, donations, donationOrders, astrologers, seoPages, matrimonyProfiles,
  invoices, dispatches, orderStatusEvents, orderLookupOtps, abandonedCarts, newsletterSubscribers, pdfKundliOrders, blogPosts,
  emailSends, newsletterCampaigns, emailUnsubscribes,
  notificationLog, notificationSettings,
  familyMembers, userNotifications, panditPayouts, spiritualJourney,
  panditStorefronts, panditReferrals, panditCardOrders, masterServices, panditServices,
  type FamilyMember, type InsertFamilyMember,
  type UserNotification, type InsertUserNotification,
  type PanditPayout, type InsertPanditPayout,
  type PanditStorefront, type InsertPanditStorefront,
  type PanditReferral, type InsertPanditReferral,
  type PanditCardOrder, type InsertPanditCardOrder,
  type MasterService, type InsertMasterService,
  type PanditService, type InsertPanditService,
  type NotificationLog, type InsertNotificationLog, type NotificationSettings,
  type NotificationChannel, type NotificationKind, type NotificationStatus,
  type User, type InsertUser,
  type Product, type InsertProduct,
  type Order, type InsertOrder, type OrderStatusEvent,
  type Pandit, type InsertPandit,
  type PanditReview, type InsertPanditReview,
  type PanditApplication, type InsertPanditApplication,
  type FranchiseApplication, type InsertFranchiseApplication,
  type PujaBooking, type InsertPujaBooking,
  type AstrologyBooking, type InsertAstrologyBooking,
  type SocialProofSettings, type InsertSocialProofSettings,
  type BoostEvent, type InsertBoostEvent,
  type SalesPopup, type InsertSalesPopup,
  type HeroSlide, type InsertHeroSlide,
  type HomepageSection, type InsertHomepageSection,
  type SiteSettings, type InsertSiteSettings,
  type ProductReview, type InsertProductReview,
  type ProductQuestion, type InsertProductQuestion,
  type ReturnTicket, type InsertReturnTicket,
  type Coupon, type InsertCoupon,
  type Subscription, type InsertSubscription,
  type Donation, type InsertDonation,
  type DonationOrder, type InsertDonationOrder,
  type Astrologer, type InsertAstrologer,
  type SeoPage, type InsertSeoPage,
  type MatrimonyProfile, type InsertMatrimonyProfile,
  type Invoice, type InsertInvoice,
  type Dispatch, type InsertDispatch,
  type OrderLookupOtp, type InsertOrderLookupOtp,
  type AdminAuditLog, type InsertAdminAuditLog,
  type AbandonedCart, type InsertAbandonedCart,
  type NewsletterSubscriber, type InsertNewsletterSubscriber,
  type EmailSend, type InsertEmailSend,
  type NewsletterCampaign, type InsertNewsletterCampaign,
  type PdfKundliOrder, type InsertPdfKundliOrder,
  type BlogPost, type InsertBlogPost,
  adminMantras, type AdminMantra, type InsertAdminMantra,
  panditChats, type PanditChat, type InsertPanditChat,
  schemaChangelog, type SchemaChangelog, type InsertSchemaChangelog,
} from "@shared/schema";

export interface IStorage {
  // ===== Schema Changelog =====
  listSchemaChangelog(): Promise<SchemaChangelog[]>;
  getSchemaChangelogEntry(id: number): Promise<SchemaChangelog | undefined>;
  createSchemaChangelogEntry(data: InsertSchemaChangelog): Promise<SchemaChangelog>;
  updateSchemaChangelogEntry(id: number, data: Partial<InsertSchemaChangelog>): Promise<SchemaChangelog | undefined>;
  deleteSchemaChangelogEntry(id: number): Promise<boolean>;

  // ===== Admin-managed Jap Counter mantras =====
  // Public list — only active rows, ordered by sortOrder asc.
  listActiveAdminMantras(): Promise<AdminMantra[]>;
  // Admin list — all rows including inactive.
  listAllAdminMantras(): Promise<AdminMantra[]>;
  getAdminMantra(id: number): Promise<AdminMantra | undefined>;
  getAdminMantraBySlug(slug: string): Promise<AdminMantra | undefined>;
  createAdminMantra(data: InsertAdminMantra): Promise<AdminMantra>;
  updateAdminMantra(id: number, data: Partial<InsertAdminMantra>): Promise<AdminMantra | undefined>;
  deleteAdminMantra(id: number): Promise<boolean>;

  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  getUserByPasswordResetToken(tokenHash: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<InsertUser>): Promise<User | undefined>;

  getProducts(): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  getProductsByCategory(category: string): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<boolean>;

  getOrders(): Promise<Order[]>;
  getOrdersPaginated(opts: { page: number; limit: number; status?: string; search?: string; paymentMethod?: string; startDate?: Date; endDate?: Date; state?: string; city?: string; minAmount?: number; maxAmount?: number; view?: string }): Promise<{ orders: Order[]; total: number }>;
  getOrder(id: number): Promise<Order | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: number, data: Partial<InsertOrder>): Promise<Order | undefined>;
  getOrderStatusEvents(orderId: number): Promise<OrderStatusEvent[]>;
  /** Atomically changes a status only when it still equals expectedStatus. */
  transitionOrderStatus(input: { orderId: number; expectedStatus: string; nextStatus: string; actorType: string; actorLabel?: string | null; reason?: string | null }): Promise<{ order?: Order; changed: boolean }>;

  getPandits(): Promise<Pandit[]>;
  getPandit(id: number): Promise<Pandit | undefined>;
  getPanditsByCity(city: string): Promise<Pandit[]>;
  getPanditsByRegion(regionalOrigin: string): Promise<Pandit[]>;
  getPanditsByCityAndRegion(city: string, regionalOrigin: string): Promise<Pandit[]>;
  createPandit(pandit: InsertPandit): Promise<Pandit>;
  ensurePanditMembershipNo(panditId: number): Promise<string>;
  setPanditCardIssued(panditId: number, issued: boolean): Promise<Pandit | undefined>;
  updatePandit(id: number, data: Partial<InsertPandit>): Promise<Pandit | undefined>;
  deletePandit(id: number): Promise<boolean>;

  getPanditReviews(panditId: number): Promise<PanditReview[]>;
  getAllPanditReviews(): Promise<PanditReview[]>;
  createPanditReview(review: InsertPanditReview): Promise<PanditReview>;
  deletePanditReview(id: number): Promise<boolean>;

  getPanditApplications(status?: string): Promise<PanditApplication[]>;
  getPanditApplication(id: number): Promise<PanditApplication | undefined>;
  createPanditApplication(app: InsertPanditApplication): Promise<PanditApplication>;
  createFranchiseApplication(app: InsertFranchiseApplication): Promise<FranchiseApplication>;
  getFranchiseApplications(): Promise<FranchiseApplication[]>;
  updatePanditApplication(id: number, data: Partial<PanditApplication>): Promise<PanditApplication | undefined>;

  getPujaBookings(): Promise<PujaBooking[]>;
  createPujaBooking(booking: InsertPujaBooking): Promise<PujaBooking>;
  updatePujaBooking(id: number, data: Partial<InsertPujaBooking>): Promise<PujaBooking | undefined>;

  getAstrologyBookings(): Promise<AstrologyBooking[]>;
  createAstrologyBooking(booking: InsertAstrologyBooking): Promise<AstrologyBooking>;
  updateAstrologyBooking(id: number, data: Partial<InsertAstrologyBooking>): Promise<AstrologyBooking | undefined>;

  getSocialProofSettings(): Promise<SocialProofSettings | undefined>;
  upsertSocialProofSettings(settings: InsertSocialProofSettings): Promise<SocialProofSettings>;
  getBoostEvents(): Promise<BoostEvent[]>;
  createBoostEvent(event: InsertBoostEvent): Promise<BoostEvent>;

  getSalesPopups(): Promise<SalesPopup[]>;
  getActiveSalesPopup(): Promise<SalesPopup | undefined>;
  createSalesPopup(popup: InsertSalesPopup): Promise<SalesPopup>;
  updateSalesPopup(id: number, data: Partial<InsertSalesPopup>): Promise<SalesPopup | undefined>;
  deleteSalesPopup(id: number): Promise<boolean>;

  // Hero slider
  listHeroSlides(opts?: { enabledOnly?: boolean }): Promise<HeroSlide[]>;
  getHeroSlide(id: number): Promise<HeroSlide | undefined>;
  createHeroSlide(data: InsertHeroSlide): Promise<HeroSlide>;
  updateHeroSlide(id: number, data: Partial<InsertHeroSlide>): Promise<HeroSlide | undefined>;
  deleteHeroSlide(id: number): Promise<boolean>;
  reorderHeroSlides(orderedIds: number[]): Promise<HeroSlide[]>;

  // Homepage sections (movable blocks on /)
  listHomepageSections(opts?: { enabledOnly?: boolean }): Promise<HomepageSection[]>;
  updateHomepageSection(id: number, data: Partial<InsertHomepageSection>): Promise<HomepageSection | undefined>;
  reorderHomepageSections(orderedIds: number[]): Promise<HomepageSection[]>;
  seedHomepageSections(defaults: InsertHomepageSection[]): Promise<HomepageSection[]>;

  getSiteSettings(): Promise<SiteSettings | undefined>;
  upsertSiteSettings(settings: InsertSiteSettings): Promise<SiteSettings>;

  // Admin audit log (append-only).
  logAdminAction(entry: InsertAdminAuditLog): Promise<AdminAuditLog>;
  getAdminAuditLogs(limit?: number): Promise<AdminAuditLog[]>;
  getBestsellerProducts(): Promise<Product[]>;

  getProductReviews(productId: number): Promise<ProductReview[]>;
  getAllReviews(): Promise<ProductReview[]>;
  createProductReview(review: InsertProductReview): Promise<ProductReview>;
  updateProductReview(id: number, data: Partial<InsertProductReview>): Promise<ProductReview | undefined>;
  deleteProductReview(id: number): Promise<boolean>;
  voteReviewHelpful(reviewId: number, voterKey: string): Promise<{ helpful: number; alreadyVoted: boolean } | null>;

  getProductQuestions(productId: number, opts?: { onlyApproved?: boolean }): Promise<ProductQuestion[]>;
  getAllProductQuestions(opts?: { status?: string }): Promise<ProductQuestion[]>;
  createProductQuestion(q: InsertProductQuestion): Promise<ProductQuestion>;
  updateProductQuestion(id: number, data: Partial<ProductQuestion>): Promise<ProductQuestion | undefined>;
  deleteProductQuestion(id: number): Promise<boolean>;

  getReturnTickets(): Promise<ReturnTicket[]>;
  getReturnTicket(id: number): Promise<ReturnTicket | undefined>;
  getReturnTicketByRefundId(refundId: string): Promise<ReturnTicket | undefined>;
  getReturnTicketsByOrderId(orderId: number): Promise<ReturnTicket[]>;
  getReturnTicketsByEmail(email: string): Promise<ReturnTicket[]>;
  deleteExpiredOrderLookupOtps(olderThan: Date): Promise<number>;
  getOrderByPaymentId(paymentId: string): Promise<Order | undefined>;
  createReturnTicket(ticket: InsertReturnTicket): Promise<ReturnTicket>;
  updateReturnTicket(id: number, data: Partial<InsertReturnTicket> & { refundId?: string; refundAmount?: number; refundStatus?: string; refundedAt?: Date }): Promise<ReturnTicket | undefined>;
  getOrdersByEmail(email: string): Promise<Order[]>;

  createOrderLookupOtp(data: InsertOrderLookupOtp): Promise<OrderLookupOtp>;
  getActiveOrderLookupOtp(email: string): Promise<OrderLookupOtp | undefined>;
  countOrderLookupOtpsSince(email: string, since: Date): Promise<number>;
  incrementOrderLookupOtpAttempts(id: number): Promise<void>;
  markOrderLookupOtpUsed(id: number): Promise<void>;

  getCoupons(): Promise<Coupon[]>;
  getCoupon(id: number): Promise<Coupon | undefined>;
  getCouponByCode(code: string): Promise<Coupon | undefined>;
  createCoupon(coupon: InsertCoupon): Promise<Coupon>;
  updateCoupon(id: number, data: Partial<InsertCoupon>): Promise<Coupon | undefined>;
  deleteCoupon(id: number): Promise<boolean>;
  incrementCouponUsage(id: number): Promise<void>;

  getSubscriptions(): Promise<Subscription[]>;
  getSubscription(id: number): Promise<Subscription | undefined>;
  getSubscriptionsByEmail(email: string): Promise<Subscription[]>;
  createSubscription(sub: InsertSubscription): Promise<Subscription>;
  updateSubscription(id: number, data: Partial<InsertSubscription>): Promise<Subscription | undefined>;

  getDonations(): Promise<Donation[]>;
  getDonation(id: number): Promise<Donation | undefined>;
  createDonation(donation: InsertDonation): Promise<Donation>;
  updateDonation(id: number, data: Partial<InsertDonation>): Promise<Donation | undefined>;
  deleteDonation(id: number): Promise<boolean>;

  getDonationOrders(): Promise<DonationOrder[]>;
  getDonationOrdersByEmail(email: string): Promise<DonationOrder[]>;
  createDonationOrder(order: InsertDonationOrder): Promise<DonationOrder>;

  // Premium PDF Kundli orders
  createPdfKundliOrder(order: InsertPdfKundliOrder & { downloadToken: string }): Promise<PdfKundliOrder>;
  getPdfKundliOrder(id: number): Promise<PdfKundliOrder | undefined>;
  getPdfKundliOrderByRazorpay(razorpayOrderId: string): Promise<PdfKundliOrder | undefined>;
  getPdfKundliOrderByToken(token: string): Promise<PdfKundliOrder | undefined>;
  updatePdfKundliOrder(id: number, patch: Partial<PdfKundliOrder>): Promise<PdfKundliOrder | undefined>;
  updateDonationOrder(id: number, data: Partial<InsertDonationOrder>): Promise<DonationOrder | undefined>;

  getAstrologers(): Promise<Astrologer[]>;
  getAstrologer(id: number): Promise<Astrologer | undefined>;
  createAstrologer(astrologer: InsertAstrologer): Promise<Astrologer>;
  updateAstrologer(id: number, data: Partial<InsertAstrologer>): Promise<Astrologer | undefined>;
  deleteAstrologer(id: number): Promise<boolean>;

  // Blog
  getBlogPosts(opts?: { onlyPublished?: boolean }): Promise<BlogPost[]>;
  getBlogPostBySlug(slug: string): Promise<BlogPost | undefined>;
  getBlogPost(id: number): Promise<BlogPost | undefined>;
  createBlogPost(post: InsertBlogPost): Promise<BlogPost>;
  updateBlogPost(id: number, patch: Partial<InsertBlogPost>): Promise<BlogPost | undefined>;
  deleteBlogPost(id: number): Promise<boolean>;
  incrementBlogPostView(slug: string): Promise<void>;

  getSeoPages(): Promise<SeoPage[]>;
  getSeoPage(id: number): Promise<SeoPage | undefined>;
  getSeoPageByPath(path: string): Promise<SeoPage | undefined>;
  createSeoPage(page: InsertSeoPage): Promise<SeoPage>;
  updateSeoPage(id: number, data: Partial<InsertSeoPage>): Promise<SeoPage | undefined>;
  deleteSeoPage(id: number): Promise<boolean>;

  getProductBySlug(slug: string): Promise<Product | undefined>;
  getPanditBySlug(slug: string): Promise<Pandit | undefined>;

  getPanditChats(panditId: number, userId: number, sinceId?: number): Promise<PanditChat[]>;
  createPanditChat(data: InsertPanditChat & { sanitized?: boolean }): Promise<PanditChat>;

  getMatrimonyProfiles(): Promise<MatrimonyProfile[]>;
  getApprovedMatrimonyProfiles(): Promise<MatrimonyProfile[]>;
  getMatrimonyProfile(id: number): Promise<MatrimonyProfile | undefined>;
  createMatrimonyProfile(profile: InsertMatrimonyProfile): Promise<MatrimonyProfile>;
  updateMatrimonyProfile(id: number, data: Partial<InsertMatrimonyProfile>): Promise<MatrimonyProfile | undefined>;
  deleteMatrimonyProfile(id: number): Promise<boolean>;

  getInvoices(): Promise<Invoice[]>;
  getInvoice(id: number): Promise<Invoice | undefined>;
  getInvoiceByOrderId(orderId: number): Promise<Invoice | undefined>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  getNextInvoiceSequence(financialYear: string): Promise<number>;

  getDispatches(): Promise<Dispatch[]>;
  getDispatch(id: number): Promise<Dispatch | undefined>;
  getDispatchByOrderId(orderId: number): Promise<Dispatch | undefined>;
  getDispatchByShiprocketShipmentId(shipmentId: string): Promise<Dispatch | undefined>;
  getDispatchByAwb(awb: string): Promise<Dispatch | undefined>;
  createDispatch(dispatch: InsertDispatch): Promise<Dispatch>;
  updateDispatch(id: number, data: Partial<InsertDispatch>): Promise<Dispatch | undefined>;

  getNewsletterSubscribers(): Promise<NewsletterSubscriber[]>;
  getNewsletterSubscriberByEmail(email: string): Promise<NewsletterSubscriber | undefined>;
  createNewsletterSubscriber(sub: InsertNewsletterSubscriber): Promise<NewsletterSubscriber>;
  getNewsletterSubscribersSince(since: Date): Promise<NewsletterSubscriber[]>;
  markNewsletterSubscriberUnsubscribed(email: string): Promise<void>;

  // Email marketing
  createEmailSend(send: InsertEmailSend): Promise<EmailSend>;
  getEmailSendsForRelated(relatedId: number, kinds: string[]): Promise<EmailSend[]>;
  getDueQueuedEmailSends(kinds: string[], now: Date): Promise<EmailSend[]>;
  markEmailSendStatus(id: number, status: string, error?: string | null): Promise<void>;
  recordEmailUnsubscribe(email: string, source: string | null): Promise<void>;
  isEmailUnsubscribed(email: string): Promise<boolean>;
  createNewsletterCampaign(c: InsertNewsletterCampaign & { createdBy?: string | null }): Promise<NewsletterCampaign>;
  updateNewsletterCampaign(id: number, patch: Partial<NewsletterCampaign>): Promise<NewsletterCampaign | undefined>;
  getNewsletterCampaign(id: number): Promise<NewsletterCampaign | undefined>;
  getNewsletterCampaigns(): Promise<NewsletterCampaign[]>;

  getReviewFunnelStats(): Promise<{
    windows: Array<{
      days: number;
      request1Sent: number;
      request2Sent: number;
      request2SkippedVerified: number;
      verifiedReviewsWithin14d: number;
    }>;
  }>;

  getAnalyticsSales(from: Date, to: Date): Promise<any[]>;
  getAnalyticsCategorySales(): Promise<any[]>;
  getAnalyticsCustomers(): Promise<any>;
  getAnalyticsProductPerformance(): Promise<any>;

  // Notifications log + per-kind settings (Task #20).
  recordNotificationLog(entry: InsertNotificationLog): Promise<NotificationLog | null>;
  hasNotificationLog(orderId: number, kind: string, status?: string, channel?: string): Promise<boolean>;
  hasRecentNotificationByPhone(phone: string, kind: string, since: Date): Promise<boolean>;
  listNotificationLogs(opts: { limit: number; offset: number; channel?: string; kind?: string; status?: string; since?: Date; until?: Date }): Promise<{ rows: NotificationLog[]; total: number }>;
  listNotificationLogsByOrder(orderId: number): Promise<NotificationLog[]>;
  getNotificationKpis(since: Date): Promise<{ sent: number; failed: number; skipped: number }>;
  getNotificationSettings(): Promise<NotificationSettings>;
  updateNotificationSettings(patch: Partial<NotificationSettings>): Promise<NotificationSettings>;

  // Abandoned cart capture for SendGrid recovery nudges.
  getAbandonedCarts(): Promise<AbandonedCart[]>;
  getAbandonedCartByEmail(email: string): Promise<AbandonedCart | undefined>;
  upsertAbandonedCart(data: InsertAbandonedCart): Promise<AbandonedCart>;
  markAbandonedCartNudged(id: number): Promise<AbandonedCart | undefined>;
  markAbandonedCartRecovered(email: string): Promise<void>;
  deleteAbandonedCart(id: number): Promise<boolean>;

  // Phase 1 — Family Profiles
  listFamilyMembers(userId: number): Promise<FamilyMember[]>;
  createFamilyMember(input: InsertFamilyMember): Promise<FamilyMember>;
  updateFamilyMember(id: number, userId: number, patch: Partial<InsertFamilyMember>): Promise<FamilyMember | null>;
  deleteFamilyMember(id: number, userId: number): Promise<boolean>;

  // Phase 1 — User Notifications inbox
  listUserNotifications(userId: number, opts?: { limit?: number; unreadOnly?: boolean }): Promise<UserNotification[]>;
  unreadNotificationCount(userId: number): Promise<number>;
  createUserNotification(input: InsertUserNotification): Promise<UserNotification>;
  markUserNotificationRead(id: number, userId: number): Promise<boolean>;
  markAllUserNotificationsRead(userId: number): Promise<number>;

  // Phase 2 — Pandit payout ledger
  listPanditPayouts(panditId: number, opts?: { from?: Date; to?: Date; limit?: number }): Promise<PanditPayout[]>;
  listAllPanditPayouts(opts?: { panditId?: number; limit?: number }): Promise<PanditPayout[]>;
  totalPanditPayouts(panditId: number): Promise<number>;
  createPanditPayout(input: InsertPanditPayout): Promise<PanditPayout>;
  deletePanditPayout(id: number): Promise<boolean>;
  // Atomic: settle a batch of referral rows by recording one payout and
  // marking each referral paid + linking it to the new payout.
  payoutPanditReferrals(input: { panditId: number; referralIds: number[]; method: string; reference?: string | null; notes?: string | null; createdByAdminId?: number | null }): Promise<{ payout: PanditPayout; settledIds: number[] }>;

  // Pandit storefronts + referrals + card orders
  getPanditStorefrontByPanditId(panditId: number): Promise<PanditStorefront | undefined>;
  ensurePanditStorefront(panditId: number): Promise<PanditStorefront>;
  updatePanditStorefront(panditId: number, patch: Partial<InsertPanditStorefront>): Promise<PanditStorefront | undefined>;
  incrementStorefrontView(panditId: number): Promise<void>;
  listActiveMasterServices(): Promise<MasterService[]>;
  listAllMasterServices(): Promise<MasterService[]>;
  getMasterService(id: number): Promise<MasterService | undefined>;
  getMasterServiceBySlug(slug: string): Promise<MasterService | undefined>;
  createMasterService(data: InsertMasterService): Promise<MasterService>;
  updateMasterService(id: number, data: Partial<InsertMasterService>): Promise<MasterService | undefined>;
  listPanditServices(panditId: number, activeOnly?: boolean): Promise<PanditService[]>;
  listPanditServicesWithMaster(panditId: number, activeOnly?: boolean): Promise<Array<{ service: PanditService; master: MasterService }>>;
  getPanditService(id: number): Promise<PanditService | undefined>;
  createPanditService(data: InsertPanditService): Promise<PanditService>;
  updatePanditService(id: number, data: Partial<InsertPanditService>): Promise<PanditService | undefined>;

  createPanditReferral(input: InsertPanditReferral): Promise<PanditReferral | undefined>;
  listPanditReferrals(panditId: number, opts?: { limit?: number; status?: string }): Promise<PanditReferral[]>;
  listAllPanditReferrals(opts?: { limit?: number; status?: string; panditId?: number }): Promise<PanditReferral[]>;
  panditReferralSummary(panditId: number): Promise<{ totalCommission: number; pending: number; approved: number; paid: number; count: number }>;
  updatePanditReferral(id: number, patch: Partial<PanditReferral>): Promise<PanditReferral | undefined>;
  bulkUpdatePanditReferrals(ids: number[], patch: { status?: string; notes?: string | null }): Promise<number>;

  createPanditCardOrder(input: InsertPanditCardOrder): Promise<PanditCardOrder>;
  getPanditCardOrder(id: number): Promise<PanditCardOrder | undefined>;
  listPanditCardOrders(panditId: number): Promise<PanditCardOrder[]>;
  listAllPanditCardOrders(opts?: { limit?: number; status?: string }): Promise<PanditCardOrder[]>;
  updatePanditCardOrder(id: number, patch: Partial<PanditCardOrder>): Promise<PanditCardOrder | undefined>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.googleId, googleId));
    return user;
  }

  async getUserByPasswordResetToken(tokenHash: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.passwordResetToken, tokenHash));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [created] = await db.insert(users).values(user).returning();
    return created;
  }

  async updateUser(id: number, data: Partial<InsertUser>): Promise<User | undefined> {
    const [updated] = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return updated;
  }

  async getProducts(): Promise<Product[]> {
    return db.select().from(products);
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  async getProductsByCategory(category: string): Promise<Product[]> {
    return db.select().from(products).where(eq(products.category, category));
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [created] = await db.insert(products).values(product).returning();
    return created;
  }

  async updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined> {
    const [updated] = await db.update(products).set(product).where(eq(products.id, id)).returning();
    return updated;
  }

  async deleteProduct(id: number): Promise<boolean> {
    const result = await db.delete(products).where(eq(products.id, id)).returning();
    return result.length > 0;
  }

  async getOrders(): Promise<Order[]> {
    return db.select().from(orders);
  }

  async getOrdersPaginated(opts: { page: number; limit: number; status?: string; search?: string; paymentMethod?: string; startDate?: Date; endDate?: Date; state?: string; city?: string; minAmount?: number; maxAmount?: number; view?: string }): Promise<{ orders: Order[]; total: number }> {
    const page = Math.max(1, opts.page);
    const limit = Math.min(200, Math.max(1, opts.limit));
    const offset = (page - 1) * limit;
    const conds: any[] = [];
    if (opts.status && opts.status !== "all") {
      // Existing rows retain their legacy spelling; this makes canonical filter
      // values compatible without rewriting historical data.
      const status = opts.status.toLowerCase().replace(/[\s-]+/g, "_");
      const legacyStatuses: Record<string, string[]> = {
        placed: ["placed", "pending"], payment_pending: ["payment_pending", "unpaid"],
        confirmed: ["confirmed", "processing"], dispatched: ["dispatched", "shipped"],
      };
      conds.push(inArray(orders.status, legacyStatuses[status] || [status]));
    }
    if (opts.search) {
      const q = `%${opts.search}%`;
      conds.push(
        dsql`(${orders.customerName} ILIKE ${q} OR ${orders.customerEmail} ILIKE ${q} OR ${orders.customerPhone} ILIKE ${q} OR ${orders.paymentId} ILIKE ${q} OR CAST(${orders.id} AS TEXT) ILIKE ${q} OR CAST(${orders.items} AS TEXT) ILIKE ${q} OR EXISTS (SELECT 1 FROM dispatches d WHERE d.order_id = ${orders.id} AND (d.tracking_number ILIKE ${q} OR d.waybill ILIKE ${q})))`
      );
    }
    if (opts.paymentMethod && opts.paymentMethod !== "all") conds.push(eq(orders.paymentMethod, opts.paymentMethod));
    if (opts.startDate) conds.push(gte(orders.createdAt, opts.startDate));
    if (opts.endDate) conds.push(lte(orders.createdAt, opts.endDate));
    if (opts.state) conds.push(ilike(orders.customerState, `%${opts.state}%`));
    if (opts.city) conds.push(ilike(orders.shippingAddress, `%${opts.city}%`));
    if (opts.minAmount !== undefined) conds.push(gte(orders.totalAmount, opts.minAmount));
    if (opts.maxAmount !== undefined) conds.push(lte(orders.totalAmount, opts.maxAmount));
    if (opts.view === "stale") {
      // Must mirror isOperationallyStale: old terminal orders are historical,
      // not work that needs operational attention.
      conds.push(
        lt(orders.createdAt, new Date(Date.now() - 24 * 60 * 60 * 1000)),
        notInArray(orders.status, ["delivered", "cancelled", "canceled", "refunded", "returned", "failed"]),
      );
    }
    if (opts.view === "ready-to-dispatch") conds.push(inArray(orders.status, ["packed", "ready_to_dispatch", "ready"]));
    const where = conds.length ? and(...conds) : undefined;
    const [list, totalRow] = await Promise.all([
      db.select().from(orders).where(where as any).orderBy(desc(orders.id)).limit(limit).offset(offset),
      db.select({ c: count() }).from(orders).where(where as any),
    ]);
    return { orders: list, total: Number(totalRow[0]?.c || 0) };
  }

  async getOrder(id: number): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order;
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const [created] = await db.insert(orders).values(order).returning();
    return created;
  }

  async updateOrder(id: number, data: Partial<InsertOrder>): Promise<Order | undefined> {
    const [updated] = await db.update(orders).set(data).where(eq(orders.id, id)).returning();
    return updated;
  }

  async getOrderStatusEvents(orderId: number): Promise<OrderStatusEvent[]> {
    return db.select().from(orderStatusEvents)
      .where(eq(orderStatusEvents.orderId, orderId))
      .orderBy(asc(orderStatusEvents.createdAt), asc(orderStatusEvents.id));
  }

  async transitionOrderStatus(input: { orderId: number; expectedStatus: string; nextStatus: string; actorType: string; actorLabel?: string | null; reason?: string | null }): Promise<{ order?: Order; changed: boolean }> {
    return db.transaction(async (tx) => {
      const [order] = await tx.update(orders)
        .set({ status: input.nextStatus })
        .where(and(eq(orders.id, input.orderId), eq(orders.status, input.expectedStatus)))
        .returning();
      if (!order) return { changed: false };
      await tx.insert(orderStatusEvents).values({
        orderId: input.orderId,
        previousStatus: input.expectedStatus,
        nextStatus: input.nextStatus,
        actorType: input.actorType,
        actorLabel: input.actorLabel ?? null,
        reason: input.reason ?? null,
      });
      return { order, changed: true };
    });
  }

  async getPandits(): Promise<Pandit[]> {
    return db.select().from(pandits);
  }

  async getPandit(id: number): Promise<Pandit | undefined> {
    const [pandit] = await db.select().from(pandits).where(eq(pandits.id, id));
    return pandit;
  }

  async getPanditsByCity(city: string): Promise<Pandit[]> {
    return db.select().from(pandits).where(ilike(pandits.city, `%${city}%`));
  }

  async getPanditsByRegion(regionalOrigin: string): Promise<Pandit[]> {
    return db.select().from(pandits).where(ilike(pandits.regionalOrigin, `%${regionalOrigin}%`));
  }

  async getPanditsByCityAndRegion(city: string, regionalOrigin: string): Promise<Pandit[]> {
    return db.select().from(pandits).where(
      and(ilike(pandits.city, `%${city}%`), ilike(pandits.regionalOrigin, `%${regionalOrigin}%`))
    );
  }

  async createPandit(pandit: InsertPandit): Promise<Pandit> {
    // Ensure slug is present and unique. Generated from name+city when caller
    // does not provide one; collisions get a numeric suffix.
    const { baseSlugFor, ensureUniqueSlug } = await import("./pandit-slug");
    const wantedSlug = (pandit.slug && String(pandit.slug).trim()) || baseSlugFor(pandit.name, pandit.city);
    const uniqueSlug = await ensureUniqueSlug(wantedSlug);
    const [created] = await db.insert(pandits).values({ ...pandit, slug: uniqueSlug }).returning();
    // Stamp the lifelong membership number from the auto-generated id.
    // Skipped if caller already supplied one (e.g. admin import).
    if (created && !created.membershipNo) {
      const memberNo = `VT-PND-${String(created.id).padStart(5, "0")}`;
      const [stamped] = await db.update(pandits)
        .set({ membershipNo: memberNo, cardIssuedAt: created.cardIssuedAt ?? new Date() })
        .where(eq(pandits.id, created.id))
        .returning();
      return stamped || { ...created, membershipNo: memberNo };
    }
    return created;
  }

  // Lazy backfill — call before reading membershipNo for any pandit that
  // pre-dates this column. Idempotent and cheap (1 update at most, ever).
  async ensurePanditMembershipNo(panditId: number): Promise<string> {
    const p = await this.getPandit(panditId);
    if (!p) throw new Error("Pandit not found");
    if (p.membershipNo) return p.membershipNo;
    const memberNo = `VT-PND-${String(p.id).padStart(5, "0")}`;
    await db.update(pandits)
      .set({ membershipNo: memberNo, cardIssuedAt: p.cardIssuedAt ?? new Date() })
      .where(eq(pandits.id, p.id));
    return memberNo;
  }

  async setPanditCardIssued(panditId: number, issued: boolean): Promise<Pandit | undefined> {
    const [updated] = await db.update(pandits)
      .set({ cardIssued: issued, cardIssuedAt: issued ? new Date() : null })
      .where(eq(pandits.id, panditId))
      .returning();
    return updated;
  }

  async updatePandit(id: number, data: Partial<InsertPandit>): Promise<Pandit | undefined> {
    // If caller is changing the slug, enforce uniqueness against other rows.
    let patch = data;
    if (data.slug !== undefined && data.slug !== null && String(data.slug).trim() !== "") {
      const { ensureUniqueSlug } = await import("./pandit-slug");
      patch = { ...data, slug: await ensureUniqueSlug(String(data.slug).trim(), id) };
    }
    const [updated] = await db.update(pandits).set(patch).where(eq(pandits.id, id)).returning();
    return updated;
  }

  async deletePandit(id: number): Promise<boolean> {
    const result = await db.delete(pandits).where(eq(pandits.id, id)).returning();
    return result.length > 0;
  }

  async getPanditReviews(panditId: number): Promise<PanditReview[]> {
    return db.select().from(panditReviews).where(eq(panditReviews.panditId, panditId));
  }

  async getAllPanditReviews(): Promise<PanditReview[]> {
    return db.select().from(panditReviews);
  }

  async createPanditReview(review: InsertPanditReview): Promise<PanditReview> {
    const [created] = await db.insert(panditReviews).values(review).returning();
    return created;
  }

  async deletePanditReview(id: number): Promise<boolean> {
    const result = await db.delete(panditReviews).where(eq(panditReviews.id, id)).returning();
    return result.length > 0;
  }

  async getPanditApplications(status?: string): Promise<PanditApplication[]> {
    if (status) {
      return db.select().from(panditApplications).where(eq(panditApplications.status, status)).orderBy(desc(panditApplications.createdAt));
    }
    return db.select().from(panditApplications).orderBy(desc(panditApplications.createdAt));
  }

  async getPanditApplication(id: number): Promise<PanditApplication | undefined> {
    const [app] = await db.select().from(panditApplications).where(eq(panditApplications.id, id));
    return app;
  }

  async createPanditApplication(app: InsertPanditApplication): Promise<PanditApplication> {
    const [created] = await db.insert(panditApplications).values(app).returning();
    return created;
  }

  async createFranchiseApplication(app: InsertFranchiseApplication): Promise<FranchiseApplication> {
    const [created] = await db.insert(franchiseApplications).values(app).returning();
    return created;
  }

  async getFranchiseApplications(): Promise<FranchiseApplication[]> {
    return db.select().from(franchiseApplications).orderBy(desc(franchiseApplications.createdAt));
  }

  async updatePanditApplication(id: number, data: Partial<PanditApplication>): Promise<PanditApplication | undefined> {
    const [updated] = await db.update(panditApplications).set(data).where(eq(panditApplications.id, id)).returning();
    return updated;
  }

  async getPujaBookings(): Promise<PujaBooking[]> {
    return db.select().from(pujaBookings);
  }

  async createPujaBooking(booking: InsertPujaBooking): Promise<PujaBooking> {
    const [created] = await db.insert(pujaBookings).values(booking).returning();
    return created;
  }

  async updatePujaBooking(id: number, data: Partial<InsertPujaBooking>): Promise<PujaBooking | undefined> {
    const [updated] = await db.update(pujaBookings).set(data).where(eq(pujaBookings.id, id)).returning();
    return updated;
  }

  async getAstrologyBookings(): Promise<AstrologyBooking[]> {
    return db.select().from(astrologyBookings);
  }

  async createAstrologyBooking(booking: InsertAstrologyBooking): Promise<AstrologyBooking> {
    const [created] = await db.insert(astrologyBookings).values(booking).returning();
    return created;
  }

  async updateAstrologyBooking(id: number, data: Partial<InsertAstrologyBooking>): Promise<AstrologyBooking | undefined> {
    const [updated] = await db.update(astrologyBookings).set(data).where(eq(astrologyBookings.id, id)).returning();
    return updated;
  }

  async getSocialProofSettings(): Promise<SocialProofSettings | undefined> {
    const [settings] = await db.select().from(socialProofSettings);
    return settings;
  }

  async upsertSocialProofSettings(settings: InsertSocialProofSettings): Promise<SocialProofSettings> {
    const existing = await this.getSocialProofSettings();
    if (existing) {
      const [updated] = await db.update(socialProofSettings).set(settings).where(eq(socialProofSettings.id, existing.id)).returning();
      return updated;
    }
    const [created] = await db.insert(socialProofSettings).values(settings).returning();
    return created;
  }

  async getBoostEvents(): Promise<BoostEvent[]> {
    return db.select().from(boostEvents);
  }

  async createBoostEvent(event: InsertBoostEvent): Promise<BoostEvent> {
    const [created] = await db.insert(boostEvents).values(event).returning();
    return created;
  }

  async getSalesPopups(): Promise<SalesPopup[]> {
    return await db.select().from(salesPopups).orderBy(desc(salesPopups.createdAt));
  }

  async getActiveSalesPopup(): Promise<SalesPopup | undefined> {
    // Most recently created enabled popup whose window covers "now".
    const now = new Date();
    const [active] = await db
      .select()
      .from(salesPopups)
      .where(and(
        eq(salesPopups.enabled, true),
        lte(salesPopups.startsAt, now),
        gte(salesPopups.endsAt, now),
      ))
      .orderBy(desc(salesPopups.createdAt))
      .limit(1);
    return active;
  }

  async createSalesPopup(popup: InsertSalesPopup): Promise<SalesPopup> {
    const [created] = await db.insert(salesPopups).values(popup).returning();
    return created;
  }

  async updateSalesPopup(id: number, data: Partial<InsertSalesPopup>): Promise<SalesPopup | undefined> {
    const [updated] = await db.update(salesPopups).set(data).where(eq(salesPopups.id, id)).returning();
    return updated;
  }

  async deleteSalesPopup(id: number): Promise<boolean> {
    const result = await db.delete(salesPopups).where(eq(salesPopups.id, id)).returning();
    return result.length > 0;
  }

  async getSiteSettings(): Promise<SiteSettings | undefined> {
    const [settings] = await db.select().from(siteSettings);
    return settings;
  }

  async upsertSiteSettings(settings: InsertSiteSettings): Promise<SiteSettings> {
    const existing = await this.getSiteSettings();
    if (existing) {
      const [updated] = await db.update(siteSettings).set(settings).where(eq(siteSettings.id, existing.id)).returning();
      return updated;
    }
    const [created] = await db.insert(siteSettings).values(settings).returning();
    return created;
  }

  async logAdminAction(entry: InsertAdminAuditLog): Promise<AdminAuditLog> {
    const [row] = await db.insert(adminAuditLogs).values(entry).returning();
    return row;
  }

  async getAdminAuditLogs(limit = 200): Promise<AdminAuditLog[]> {
    return await db.select().from(adminAuditLogs).orderBy(desc(adminAuditLogs.createdAt)).limit(limit);
  }

  async getBestsellerProducts(): Promise<Product[]> {
    const settings = await this.getSiteSettings();
    const limit = Math.max(1, Math.min(24, settings?.bestsellersLimit ?? 6));
    const mode = settings?.bestsellersMode ?? "auto";

    if (mode === "manual") {
      // Manual mode still needs the curated id list — fetch only those rows.
      const ids = settings?.bestsellerProductIds ?? [];
      if (ids.length === 0) return [];
      const rows = await db
        .select()
        .from(products)
        .where(and(inArray(products.id, ids), gt(products.stock, 0)));
      const byId = new Map(rows.map((p) => [p.id, p]));
      const ordered: Product[] = [];
      for (const id of ids) {
        const p = byId.get(id);
        if (p) ordered.push(p);
        if (ordered.length >= limit) break;
      }
      return ordered;
    }

    // Auto mode: do the filter + sort + limit at the DB layer instead of
    // pulling the full catalog into Node and sorting in JS. Saves memory
    // + scales as the catalog grows. COALESCE(sales_count, 0) keeps
    // ranking parity with the previous JS `(salesCount ?? 0)` sort —
    // otherwise Postgres puts NULLs first under DESC and would surface
    // never-sold products at the top.
    return await db
      .select()
      .from(products)
      .where(gt(products.stock, 0))
      .orderBy(dsql`COALESCE(${products.salesCount}, 0) DESC, ${products.id} DESC`)
      .limit(limit);
  }

  async getProductReviews(productId: number, opts: { onlyApproved?: boolean } = {}): Promise<ProductReview[]> {
    if (opts.onlyApproved) {
      return db.select().from(productReviews).where(and(eq(productReviews.productId, productId), eq(productReviews.status, "approved")));
    }
    return db.select().from(productReviews).where(eq(productReviews.productId, productId));
  }

  async getAllReviews(opts: { status?: string; onlyApproved?: boolean } = {}): Promise<ProductReview[]> {
    if (opts.status) return db.select().from(productReviews).where(eq(productReviews.status, opts.status));
    if (opts.onlyApproved) return db.select().from(productReviews).where(eq(productReviews.status, "approved"));
    return db.select().from(productReviews);
  }

  async createProductReview(review: InsertProductReview): Promise<ProductReview> {
    const [created] = await db.insert(productReviews).values(review).returning();
    return created;
  }

  async updateProductReview(id: number, data: Partial<InsertProductReview>): Promise<ProductReview | undefined> {
    const [updated] = await db.update(productReviews).set(data).where(eq(productReviews.id, id)).returning();
    return updated;
  }

  async deleteProductReview(id: number): Promise<boolean> {
    const result = await db.delete(productReviews).where(eq(productReviews.id, id)).returning();
    return result.length > 0;
  }

  async voteReviewHelpful(reviewId: number, voterKey: string): Promise<{ helpful: number; alreadyVoted: boolean } | null> {
    const inserted = await db
      .insert(reviewHelpfulVotes)
      .values({ reviewId, voterKey })
      .onConflictDoNothing({ target: [reviewHelpfulVotes.reviewId, reviewHelpfulVotes.voterKey] })
      .returning();
    if (inserted.length === 0) {
      const [existing] = await db.select().from(productReviews).where(eq(productReviews.id, reviewId));
      if (!existing) return null;
      return { helpful: existing.helpful ?? 0, alreadyVoted: true };
    }
    const [updated] = await db
      .update(productReviews)
      .set({ helpful: dsql`${productReviews.helpful} + 1` })
      .where(eq(productReviews.id, reviewId))
      .returning();
    if (!updated) {
      await db.delete(reviewHelpfulVotes).where(and(eq(reviewHelpfulVotes.reviewId, reviewId), eq(reviewHelpfulVotes.voterKey, voterKey)));
      return null;
    }
    return { helpful: updated.helpful ?? 0, alreadyVoted: false };
  }

  async getProductQuestions(productId: number, opts: { onlyApproved?: boolean } = {}): Promise<ProductQuestion[]> {
    if (opts.onlyApproved) {
      return db.select().from(productQuestions).where(and(eq(productQuestions.productId, productId), eq(productQuestions.status, "approved"))).orderBy(desc(productQuestions.createdAt));
    }
    return db.select().from(productQuestions).where(eq(productQuestions.productId, productId)).orderBy(desc(productQuestions.createdAt));
  }
  async getAllProductQuestions(opts: { status?: string } = {}): Promise<ProductQuestion[]> {
    if (opts.status) return db.select().from(productQuestions).where(eq(productQuestions.status, opts.status)).orderBy(desc(productQuestions.createdAt));
    return db.select().from(productQuestions).orderBy(desc(productQuestions.createdAt));
  }
  async createProductQuestion(q: InsertProductQuestion): Promise<ProductQuestion> {
    const [created] = await db.insert(productQuestions).values(q).returning();
    return created;
  }
  async updateProductQuestion(id: number, data: Partial<ProductQuestion>): Promise<ProductQuestion | undefined> {
    const [updated] = await db.update(productQuestions).set(data).where(eq(productQuestions.id, id)).returning();
    return updated;
  }
  async deleteProductQuestion(id: number): Promise<boolean> {
    const r = await db.delete(productQuestions).where(eq(productQuestions.id, id)).returning();
    return r.length > 0;
  }

  async getReturnTickets(): Promise<ReturnTicket[]> {
    return db.select().from(returnTickets);
  }

  async getReturnTicket(id: number): Promise<ReturnTicket | undefined> {
    const [t] = await db.select().from(returnTickets).where(eq(returnTickets.id, id));
    return t;
  }

  async getReturnTicketByRefundId(refundId: string): Promise<ReturnTicket | undefined> {
    const [t] = await db.select().from(returnTickets).where(eq(returnTickets.refundId, refundId));
    return t;
  }

  async getReturnTicketsByOrderId(orderId: number): Promise<ReturnTicket[]> {
    return db.select().from(returnTickets).where(eq(returnTickets.orderId, orderId));
  }

  async getReturnTicketsByEmail(email: string): Promise<ReturnTicket[]> {
    return db.select().from(returnTickets).where(eq(returnTickets.customerEmail, email));
  }

  async createReturnTicket(ticket: InsertReturnTicket): Promise<ReturnTicket> {
    const [created] = await db.insert(returnTickets).values(ticket).returning();
    return created;
  }

  async updateReturnTicket(id: number, data: Partial<InsertReturnTicket>): Promise<ReturnTicket | undefined> {
    const [updated] = await db.update(returnTickets).set(data).where(eq(returnTickets.id, id)).returning();
    return updated;
  }

  async getOrdersByEmail(email: string): Promise<Order[]> {
    return db.select().from(orders).where(ilike(orders.customerEmail, email));
  }

  async createOrderLookupOtp(data: InsertOrderLookupOtp): Promise<OrderLookupOtp> {
    const [created] = await db.insert(orderLookupOtps).values(data).returning();
    return created;
  }

  async getActiveOrderLookupOtp(email: string): Promise<OrderLookupOtp | undefined> {
    const [otp] = await db
      .select()
      .from(orderLookupOtps)
      .where(and(eq(orderLookupOtps.email, email), eq(orderLookupOtps.used, false), gte(orderLookupOtps.expiresAt, new Date())))
      .orderBy(desc(orderLookupOtps.id))
      .limit(1);
    return otp;
  }

  async countOrderLookupOtpsSince(email: string, since: Date): Promise<number> {
    const [row] = await db
      .select({ c: count() })
      .from(orderLookupOtps)
      .where(and(eq(orderLookupOtps.email, email), gte(orderLookupOtps.createdAt, since)));
    return Number(row?.c || 0);
  }

  async incrementOrderLookupOtpAttempts(id: number): Promise<void> {
    await db.update(orderLookupOtps).set({ attempts: dsql`${orderLookupOtps.attempts} + 1` }).where(eq(orderLookupOtps.id, id));
  }

  async markOrderLookupOtpUsed(id: number): Promise<void> {
    await db.update(orderLookupOtps).set({ used: true }).where(eq(orderLookupOtps.id, id));
  }

  async deleteExpiredOrderLookupOtps(olderThan: Date): Promise<number> {
    const result: any = await db.delete(orderLookupOtps).where(lt(orderLookupOtps.expiresAt, olderThan));
    return Number(result?.rowCount || 0);
  }

  async getOrderByPaymentId(paymentId: string): Promise<Order | undefined> {
    const [o] = await db.select().from(orders).where(eq(orders.paymentId, paymentId));
    return o;
  }

  async getCoupons(): Promise<Coupon[]> {
    return db.select().from(coupons);
  }

  async getCoupon(id: number): Promise<Coupon | undefined> {
    const [coupon] = await db.select().from(coupons).where(eq(coupons.id, id));
    return coupon;
  }

  async getCouponByCode(code: string): Promise<Coupon | undefined> {
    const [coupon] = await db.select().from(coupons).where(eq(coupons.code, code));
    return coupon;
  }

  async createCoupon(coupon: InsertCoupon): Promise<Coupon> {
    const [created] = await db.insert(coupons).values(coupon).returning();
    return created;
  }

  async updateCoupon(id: number, data: Partial<InsertCoupon>): Promise<Coupon | undefined> {
    const [updated] = await db.update(coupons).set(data).where(eq(coupons.id, id)).returning();
    return updated;
  }

  async deleteCoupon(id: number): Promise<boolean> {
    const result = await db.delete(coupons).where(eq(coupons.id, id)).returning();
    return result.length > 0;
  }

  async incrementCouponUsage(id: number): Promise<void> {
    const coupon = await this.getCoupon(id);
    if (coupon) {
      await db.update(coupons).set({ usedCount: coupon.usedCount + 1 }).where(eq(coupons.id, id));
    }
  }

  async getSubscriptions(): Promise<Subscription[]> {
    return db.select().from(subscriptions);
  }

  async getSubscription(id: number): Promise<Subscription | undefined> {
    const [sub] = await db.select().from(subscriptions).where(eq(subscriptions.id, id));
    return sub;
  }

  async getSubscriptionsByEmail(email: string): Promise<Subscription[]> {
    return db.select().from(subscriptions).where(eq(subscriptions.customerEmail, email));
  }

  async createSubscription(sub: InsertSubscription): Promise<Subscription> {
    const [created] = await db.insert(subscriptions).values(sub).returning();
    return created;
  }

  async updateSubscription(id: number, data: Partial<InsertSubscription>): Promise<Subscription | undefined> {
    const [updated] = await db.update(subscriptions).set(data).where(eq(subscriptions.id, id)).returning();
    return updated;
  }

  async getDonations(): Promise<Donation[]> {
    return db.select().from(donations);
  }

  async getDonation(id: number): Promise<Donation | undefined> {
    const [donation] = await db.select().from(donations).where(eq(donations.id, id));
    return donation;
  }

  async createDonation(donation: InsertDonation): Promise<Donation> {
    const [created] = await db.insert(donations).values(donation).returning();
    return created;
  }

  async updateDonation(id: number, data: Partial<InsertDonation>): Promise<Donation | undefined> {
    const [updated] = await db.update(donations).set(data).where(eq(donations.id, id)).returning();
    return updated;
  }

  async deleteDonation(id: number): Promise<boolean> {
    const result = await db.delete(donations).where(eq(donations.id, id)).returning();
    return result.length > 0;
  }

  async getDonationOrders(): Promise<DonationOrder[]> {
    return db.select().from(donationOrders);
  }

  async getDonationOrdersByEmail(email: string): Promise<DonationOrder[]> {
    return db.select().from(donationOrders).where(eq(donationOrders.donorEmail, email));
  }

  async createDonationOrder(order: InsertDonationOrder): Promise<DonationOrder> {
    const [created] = await db.insert(donationOrders).values(order).returning();
    return created;
  }

  async updateDonationOrder(id: number, data: Partial<InsertDonationOrder>): Promise<DonationOrder | undefined> {
    const [updated] = await db.update(donationOrders).set(data).where(eq(donationOrders.id, id)).returning();
    return updated;
  }

  async getAstrologers(): Promise<Astrologer[]> {
    return db.select().from(astrologers);
  }

  async getAstrologer(id: number): Promise<Astrologer | undefined> {
    const [astrologer] = await db.select().from(astrologers).where(eq(astrologers.id, id));
    return astrologer;
  }

  async createAstrologer(astrologer: InsertAstrologer): Promise<Astrologer> {
    const [created] = await db.insert(astrologers).values(astrologer).returning();
    return created;
  }

  async updateAstrologer(id: number, data: Partial<InsertAstrologer>): Promise<Astrologer | undefined> {
    const [updated] = await db.update(astrologers).set(data).where(eq(astrologers.id, id)).returning();
    return updated;
  }

  async deleteAstrologer(id: number): Promise<boolean> {
    const result = await db.delete(astrologers).where(eq(astrologers.id, id)).returning();
    return result.length > 0;
  }

  async getSeoPages(): Promise<SeoPage[]> {
    return db.select().from(seoPages);
  }

  async getSeoPage(id: number): Promise<SeoPage | undefined> {
    const [page] = await db.select().from(seoPages).where(eq(seoPages.id, id));
    return page;
  }

  async getSeoPageByPath(path: string): Promise<SeoPage | undefined> {
    const [page] = await db.select().from(seoPages).where(eq(seoPages.pagePath, path));
    return page;
  }

  async createSeoPage(page: InsertSeoPage): Promise<SeoPage> {
    const [created] = await db.insert(seoPages).values(page).returning();
    return created;
  }

  async updateSeoPage(id: number, data: Partial<InsertSeoPage>): Promise<SeoPage | undefined> {
    const [updated] = await db.update(seoPages).set({ ...data, updatedAt: new Date() }).where(eq(seoPages.id, id)).returning();
    return updated;
  }

  async deleteSeoPage(id: number): Promise<boolean> {
    const result = await db.delete(seoPages).where(eq(seoPages.id, id)).returning();
    return result.length > 0;
  }

  async getProductBySlug(slug: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.slug, slug));
    return product;
  }

  async getPanditBySlug(slug: string): Promise<Pandit | undefined> {
    const [pandit] = await db.select().from(pandits).where(eq(pandits.slug, slug));
    return pandit;
  }

  async getPanditChats(panditId: number, userId: number, sinceId = 0): Promise<PanditChat[]> {
    const rows = await db.select().from(panditChats).where(
      and(
        eq(panditChats.panditId, panditId),
        eq(panditChats.userId, userId),
        sinceId > 0 ? sql`${panditChats.id} > ${sinceId}` : sql`true`,
      ),
    ).orderBy(asc(panditChats.id)).limit(200);
    return rows;
  }

  async createPanditChat(data: InsertPanditChat & { sanitized?: boolean }): Promise<PanditChat> {
    const [row] = await db.insert(panditChats).values({
      panditId: data.panditId,
      userId: data.userId,
      userEmail: data.userEmail,
      senderType: data.senderType,
      message: data.message,
      attachmentUrl: data.attachmentUrl ?? null,
      sanitized: !!data.sanitized,
    }).returning();
    return row;
  }

  async getMatrimonyProfiles(): Promise<MatrimonyProfile[]> {
    return db.select().from(matrimonyProfiles);
  }

  async getApprovedMatrimonyProfiles(): Promise<MatrimonyProfile[]> {
    return db.select().from(matrimonyProfiles).where(
      and(eq(matrimonyProfiles.approved, true), eq(matrimonyProfiles.status, "approved"))
    );
  }

  async getMatrimonyProfile(id: number): Promise<MatrimonyProfile | undefined> {
    const [profile] = await db.select().from(matrimonyProfiles).where(eq(matrimonyProfiles.id, id));
    return profile;
  }

  async createMatrimonyProfile(profile: InsertMatrimonyProfile): Promise<MatrimonyProfile> {
    const [created] = await db.insert(matrimonyProfiles).values(profile).returning();
    return created;
  }

  async updateMatrimonyProfile(id: number, data: Partial<InsertMatrimonyProfile>): Promise<MatrimonyProfile | undefined> {
    const [updated] = await db.update(matrimonyProfiles).set(data).where(eq(matrimonyProfiles.id, id)).returning();
    return updated;
  }

  async deleteMatrimonyProfile(id: number): Promise<boolean> {
    const result = await db.delete(matrimonyProfiles).where(eq(matrimonyProfiles.id, id)).returning();
    return result.length > 0;
  }

  async getInvoices(): Promise<Invoice[]> {
    return db.select().from(invoices).orderBy(desc(invoices.createdAt));
  }

  async getInvoice(id: number): Promise<Invoice | undefined> {
    const [inv] = await db.select().from(invoices).where(eq(invoices.id, id));
    return inv;
  }

  async getInvoiceByOrderId(orderId: number): Promise<Invoice | undefined> {
    const [inv] = await db.select().from(invoices).where(eq(invoices.orderId, orderId));
    return inv;
  }

  async createInvoice(invoice: InsertInvoice): Promise<Invoice> {
    const [created] = await db.insert(invoices).values(invoice).returning();
    return created;
  }

  async getNextInvoiceSequence(financialYear: string): Promise<number> {
    const result = await db.select({ maxSeq: dsql<number>`COALESCE(MAX(${invoices.sequenceNumber}), 0)` }).from(invoices).where(eq(invoices.financialYear, financialYear));
    return (result[0]?.maxSeq || 0) + 1;
  }

  async getDispatches(): Promise<Dispatch[]> {
    return db.select().from(dispatches).orderBy(desc(dispatches.createdAt));
  }

  async getDispatch(id: number): Promise<Dispatch | undefined> {
    const [d] = await db.select().from(dispatches).where(eq(dispatches.id, id));
    return d;
  }

  async getDispatchByOrderId(orderId: number): Promise<Dispatch | undefined> {
    const [d] = await db.select().from(dispatches).where(eq(dispatches.orderId, orderId));
    return d;
  }

  async getDispatchByShiprocketShipmentId(shipmentId: string): Promise<Dispatch | undefined> {
    const [d] = await db.select().from(dispatches).where(eq(dispatches.shiprocketShipmentId, shipmentId));
    return d;
  }

  async getDispatchByAwb(awb: string): Promise<Dispatch | undefined> {
    const [d] = await db.select().from(dispatches).where(eq(dispatches.waybill, awb));
    return d;
  }

  async createDispatch(dispatch: InsertDispatch): Promise<Dispatch> {
    const [created] = await db.insert(dispatches).values(dispatch).returning();
    return created;
  }

  async updateDispatch(id: number, data: Partial<InsertDispatch>): Promise<Dispatch | undefined> {
    const [updated] = await db.update(dispatches).set(data).where(eq(dispatches.id, id)).returning();
    return updated;
  }

  async getAnalyticsSales(from: Date, to: Date): Promise<any[]> {
    return db.select({
      date: dsql<string>`DATE(${orders.createdAt})`,
      totalSales: dsql<number>`COALESCE(SUM(${orders.totalAmount}), 0)`,
      orderCount: count(orders.id),
      gstCollected: dsql<number>`COALESCE(SUM(${orders.gstAmount}), 0)`,
    }).from(orders)
      .where(and(gte(orders.createdAt, from), lte(orders.createdAt, to)))
      .groupBy(dsql`DATE(${orders.createdAt})`)
      .orderBy(dsql`DATE(${orders.createdAt})`);
  }

  async getAnalyticsCategorySales(): Promise<any[]> {
    const allOrders = await db.select().from(orders);
    const categoryMap: Record<string, { revenue: number; units: number }> = {};
    for (const order of allOrders) {
      const items = order.items as any[];
      if (!Array.isArray(items)) continue;
      for (const item of items) {
        const cat = item.category || "Uncategorized";
        if (!categoryMap[cat]) categoryMap[cat] = { revenue: 0, units: 0 };
        categoryMap[cat].revenue += (item.price || 0) * (item.quantity || 1);
        categoryMap[cat].units += item.quantity || 1;
      }
    }
    return Object.entries(categoryMap).map(([category, data]) => ({ category, ...data }));
  }

  async getAnalyticsCustomers(): Promise<any> {
    const allOrders = await db.select().from(orders);
    const customerMap: Record<string, { name: string; email: string; orders: number; spent: number }> = {};
    for (const order of allOrders) {
      const email = order.customerEmail || "unknown";
      if (!customerMap[email]) customerMap[email] = { name: order.customerName || "Unknown", email, orders: 0, spent: 0 };
      customerMap[email].orders++;
      customerMap[email].spent += order.totalAmount;
    }
    const customers = Object.values(customerMap).sort((a, b) => b.spent - a.spent);
    const repeatCustomers = customers.filter(c => c.orders > 1).length;
    return { total: customers.length, repeatCount: repeatCustomers, repeatPercent: customers.length ? Math.round((repeatCustomers / customers.length) * 100) : 0, topCustomers: customers.slice(0, 10) };
  }

  async getAnalyticsProductPerformance(): Promise<any> {
    const allProducts = await db.select().from(products);
    const sorted = [...allProducts].sort((a, b) => b.salesCount - a.salesCount);
    const lowStock = allProducts.filter(p => p.stock < 10);
    const withMargin = allProducts.filter(p => p.costPrice).map(p => ({ ...p, margin: p.price - (p.costPrice || 0), marginPercent: p.costPrice ? Math.round(((p.price - p.costPrice) / p.price) * 100) : 0 }));
    return { topSelling: sorted.slice(0, 10), leastSelling: sorted.slice(-10).reverse(), lowStock, highMargin: withMargin.sort((a, b) => b.marginPercent - a.marginPercent).slice(0, 10) };
  }

  async getAbandonedCarts(): Promise<AbandonedCart[]> {
    return db.select().from(abandonedCarts).orderBy(desc(abandonedCarts.updatedAt));
  }
  async getAbandonedCartByEmail(email: string): Promise<AbandonedCart | undefined> {
    const [row] = await db.select().from(abandonedCarts).where(eq(abandonedCarts.email, email.toLowerCase()));
    return row;
  }
  async upsertAbandonedCart(data: InsertAbandonedCart): Promise<AbandonedCart> {
    const email = data.email.toLowerCase();
    const existing = await this.getAbandonedCartByEmail(email);
    if (existing) {
      const [updated] = await db.update(abandonedCarts)
        .set({ ...data, email, updatedAt: new Date(), recovered: false, nudgeSentAt: null })
        .where(eq(abandonedCarts.id, existing.id))
        .returning();
      return updated;
    }
    const [created] = await db.insert(abandonedCarts).values({ ...data, email }).returning();
    return created;
  }
  async markAbandonedCartNudged(id: number): Promise<AbandonedCart | undefined> {
    const [updated] = await db.update(abandonedCarts)
      .set({ nudgeSentAt: new Date() })
      .where(eq(abandonedCarts.id, id))
      .returning();
    return updated;
  }
  async markAbandonedCartRecovered(email: string): Promise<void> {
    await db.update(abandonedCarts)
      .set({ recovered: true })
      .where(eq(abandonedCarts.email, email.toLowerCase()));
  }
  async deleteAbandonedCart(id: number): Promise<boolean> {
    const result = await db.delete(abandonedCarts).where(eq(abandonedCarts.id, id)).returning();
    return result.length > 0;
  }

  async getNewsletterSubscribers(): Promise<NewsletterSubscriber[]> {
    return db.select().from(newsletterSubscribers).orderBy(desc(newsletterSubscribers.createdAt));
  }

  async getNewsletterSubscriberByEmail(email: string): Promise<NewsletterSubscriber | undefined> {
    const [sub] = await db.select().from(newsletterSubscribers).where(eq(newsletterSubscribers.email, email));
    return sub;
  }

  async createNewsletterSubscriber(sub: InsertNewsletterSubscriber): Promise<NewsletterSubscriber> {
    const [created] = await db.insert(newsletterSubscribers).values(sub).returning();
    return created;
  }

  async getNewsletterSubscribersSince(since: Date): Promise<NewsletterSubscriber[]> {
    return db.select().from(newsletterSubscribers).where(gte(newsletterSubscribers.createdAt, since));
  }

  async markNewsletterSubscriberUnsubscribed(email: string): Promise<void> {
    await db.update(newsletterSubscribers)
      .set({ unsubscribedAt: new Date() })
      .where(eq(newsletterSubscribers.email, email.toLowerCase()));
  }

  // ===== Email marketing =====
  async createEmailSend(send: InsertEmailSend): Promise<EmailSend> {
    const [row] = await db.insert(emailSends).values({ ...send, recipientEmail: send.recipientEmail.toLowerCase() }).returning();
    return row;
  }

  async getEmailSendsForRelated(relatedId: number, kinds: string[]): Promise<EmailSend[]> {
    if (kinds.length === 0) return [];
    return db.select().from(emailSends)
      .where(and(eq(emailSends.relatedId, relatedId), inArray(emailSends.kind, kinds)));
  }

  async getDueQueuedEmailSends(kinds: string[], now: Date): Promise<EmailSend[]> {
    if (kinds.length === 0) return [];
    return db.select().from(emailSends).where(and(
      inArray(emailSends.kind, kinds),
      eq(emailSends.status, "queued"),
      lte(emailSends.scheduledFor, now),
    ));
  }

  async markEmailSendStatus(id: number, status: string, error: string | null = null): Promise<void> {
    await db.update(emailSends)
      .set({ status, error, sentAt: status === "sent" ? new Date() : undefined })
      .where(eq(emailSends.id, id));
  }

  async recordEmailUnsubscribe(email: string, source: string | null): Promise<void> {
    const lower = email.toLowerCase();
    await db.insert(emailUnsubscribes).values({ email: lower, source }).onConflictDoNothing();
    // Also flag any matching newsletter subscriber.
    await db.update(newsletterSubscribers)
      .set({ unsubscribedAt: new Date() })
      .where(eq(newsletterSubscribers.email, lower));
  }

  async isEmailUnsubscribed(email: string): Promise<boolean> {
    const lower = email.toLowerCase();
    const [u] = await db.select().from(emailUnsubscribes).where(eq(emailUnsubscribes.email, lower));
    if (u) return true;
    const [sub] = await db.select().from(newsletterSubscribers).where(eq(newsletterSubscribers.email, lower));
    return !!(sub && sub.unsubscribedAt);
  }

  async createNewsletterCampaign(c: InsertNewsletterCampaign & { createdBy?: string | null }): Promise<NewsletterCampaign> {
    const [row] = await db.insert(newsletterCampaigns).values(c).returning();
    return row;
  }

  async updateNewsletterCampaign(id: number, patch: Partial<NewsletterCampaign>): Promise<NewsletterCampaign | undefined> {
    const [row] = await db.update(newsletterCampaigns).set(patch).where(eq(newsletterCampaigns.id, id)).returning();
    return row;
  }

  async getNewsletterCampaign(id: number): Promise<NewsletterCampaign | undefined> {
    const [row] = await db.select().from(newsletterCampaigns).where(eq(newsletterCampaigns.id, id));
    return row;
  }

  async getNewsletterCampaigns(): Promise<NewsletterCampaign[]> {
    return db.select().from(newsletterCampaigns).orderBy(desc(newsletterCampaigns.createdAt));
  }

  // ===== Premium PDF Kundli orders =====
  async createPdfKundliOrder(order: InsertPdfKundliOrder & { downloadToken: string }): Promise<PdfKundliOrder> {
    const [created] = await db.insert(pdfKundliOrders).values(order).returning();
    return created;
  }

  async getPdfKundliOrder(id: number): Promise<PdfKundliOrder | undefined> {
    const [row] = await db.select().from(pdfKundliOrders).where(eq(pdfKundliOrders.id, id));
    return row;
  }

  async getPdfKundliOrderByRazorpay(razorpayOrderId: string): Promise<PdfKundliOrder | undefined> {
    const [row] = await db.select().from(pdfKundliOrders).where(eq(pdfKundliOrders.razorpayOrderId, razorpayOrderId));
    return row;
  }

  async getPdfKundliOrderByToken(token: string): Promise<PdfKundliOrder | undefined> {
    const [row] = await db.select().from(pdfKundliOrders).where(eq(pdfKundliOrders.downloadToken, token));
    return row;
  }

  async updatePdfKundliOrder(id: number, patch: Partial<PdfKundliOrder>): Promise<PdfKundliOrder | undefined> {
    const [updated] = await db.update(pdfKundliOrders).set(patch).where(eq(pdfKundliOrders.id, id)).returning();
    return updated;
  }

  // ===== Blog =====
  async getBlogPosts(opts?: { onlyPublished?: boolean }): Promise<BlogPost[]> {
    if (opts?.onlyPublished) {
      return db.select().from(blogPosts).where(eq(blogPosts.isPublished, true)).orderBy(desc(blogPosts.publishedAt));
    }
    return db.select().from(blogPosts).orderBy(desc(blogPosts.publishedAt));
  }
  async getBlogPostBySlug(slug: string): Promise<BlogPost | undefined> {
    const [row] = await db.select().from(blogPosts).where(eq(blogPosts.slug, slug));
    return row;
  }
  async getBlogPost(id: number): Promise<BlogPost | undefined> {
    const [row] = await db.select().from(blogPosts).where(eq(blogPosts.id, id));
    return row;
  }
  async createBlogPost(post: InsertBlogPost): Promise<BlogPost> {
    const values: InsertBlogPost & { publishedAt?: Date | null } = { ...post };
    if (values.isPublished && !values.publishedAt) values.publishedAt = new Date();
    const [created] = await db.insert(blogPosts).values(values).returning();
    return created;
  }
  async updateBlogPost(id: number, patch: Partial<InsertBlogPost>): Promise<BlogPost | undefined> {
    const next: Partial<InsertBlogPost> & { publishedAt?: Date | null } = { ...patch };
    if (next.isPublished === true && next.publishedAt === undefined) {
      const [existing] = await db.select({ isPublished: blogPosts.isPublished, publishedAt: blogPosts.publishedAt })
        .from(blogPosts).where(eq(blogPosts.id, id));
      if (existing && (!existing.isPublished || !existing.publishedAt)) {
        next.publishedAt = new Date();
      }
    }
    const [updated] = await db.update(blogPosts).set(next).where(eq(blogPosts.id, id)).returning();
    return updated;
  }
  async deleteBlogPost(id: number): Promise<boolean> {
    const r = await db.delete(blogPosts).where(eq(blogPosts.id, id)).returning();
    return r.length > 0;
  }
  async incrementBlogPostView(slug: string): Promise<void> {
    await db.update(blogPosts).set({ viewCount: dsql`${blogPosts.viewCount} + 1` }).where(eq(blogPosts.slug, slug));
  }

  // ── Notifications log + per-kind settings (Task #20) ──
  async recordNotificationLog(entry: InsertNotificationLog): Promise<NotificationLog | null> {
    // ON CONFLICT DO NOTHING cooperates with the partial unique indexes
    // (notification_log_order_kind_sent_uniq, notification_log_phone_kind_day_uniq)
    // so concurrent webhook retries cannot insert a duplicate "sent" row.
    const [created] = await db
      .insert(notificationLog)
      .values(entry)
      .onConflictDoNothing()
      .returning();
    return created ?? null;
  }
  async hasNotificationLog(orderId: number, kind: string, status?: string, channel?: string): Promise<boolean> {
    const conds = [eq(notificationLog.orderId, orderId), eq(notificationLog.kind, kind)];
    if (status) conds.push(eq(notificationLog.status, status as NotificationStatus));
    if (channel) conds.push(eq(notificationLog.channel, channel as NotificationChannel));
    const [row] = await db.select({ c: count() }).from(notificationLog).where(and(...conds));
    return Number(row?.c || 0) > 0;
  }
  async hasRecentNotificationByPhone(phone: string, kind: string, since: Date): Promise<boolean> {
    const [row] = await db.select({ c: count() }).from(notificationLog).where(and(
      eq(notificationLog.recipientPhone, phone),
      eq(notificationLog.kind, kind),
      eq(notificationLog.status, "sent"),
      gte(notificationLog.createdAt, since),
    ));
    return Number(row?.c || 0) > 0;
  }
  async listNotificationLogs(opts: { limit: number; offset: number; channel?: string; kind?: string; status?: string; since?: Date; until?: Date }): Promise<{ rows: NotificationLog[]; total: number }> {
    const conds: SQL[] = [];
    if (opts.channel && opts.channel !== "all") conds.push(eq(notificationLog.channel, opts.channel as NotificationChannel));
    if (opts.kind && opts.kind !== "all") conds.push(eq(notificationLog.kind, opts.kind as NotificationKind));
    if (opts.status && opts.status !== "all") conds.push(eq(notificationLog.status, opts.status as NotificationStatus));
    if (opts.since) conds.push(gte(notificationLog.createdAt, opts.since));
    if (opts.until) conds.push(lte(notificationLog.createdAt, opts.until));
    const where = conds.length ? and(...conds) : undefined;
    const [rows, totalRow] = await Promise.all([
      db.select().from(notificationLog).where(where).orderBy(desc(notificationLog.id)).limit(opts.limit).offset(opts.offset),
      db.select({ c: count() }).from(notificationLog).where(where),
    ]);
    return { rows, total: Number(totalRow[0]?.c || 0) };
  }
  async listNotificationLogsByOrder(orderId: number): Promise<NotificationLog[]> {
    return await db
      .select()
      .from(notificationLog)
      .where(eq(notificationLog.orderId, orderId))
      .orderBy(desc(notificationLog.createdAt));
  }
  async getReviewFunnelStats(): Promise<{
    windows: Array<{
      days: number;
      request1Sent: number;
      request2Sent: number;
      request2SkippedVerified: number;
      verifiedReviewsWithin14d: number;
    }>;
  }> {
    const windows = [30, 90];
    const out: Array<{
      days: number;
      request1Sent: number;
      request2Sent: number;
      request2SkippedVerified: number;
      verifiedReviewsWithin14d: number;
    }> = [];
    for (const days of windows) {
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      const [r1Row] = await db.select({ c: count() }).from(emailSends).where(and(
        eq(emailSends.kind, "review_request_1"),
        eq(emailSends.status, "sent"),
        gte(emailSends.sentAt, since),
      ));
      const [r2Row] = await db.select({ c: count() }).from(emailSends).where(and(
        eq(emailSends.kind, "review_request_2"),
        eq(emailSends.status, "sent"),
        gte(emailSends.sentAt, since),
      ));
      const [r2SkipRow] = await db.select({ c: count() }).from(emailSends).where(and(
        eq(emailSends.kind, "review_request_2"),
        eq(emailSends.status, "skipped"),
        eq(emailSends.error, "verified review already exists"),
        gte(emailSends.createdAt, since),
      ));
      // Verified reviews collected within 14 days of delivery. Orders have no
      // deliveredAt column today, so we use the review_request_1 row's sent_at
      // (sent ~5 days after the order flips to "delivered") as a delivery-time
      // proxy. Only sent rows are counted so the numerator stays consistent
      // with the request1Sent denominator. Counts distinct orders where the
      // customer left a verified review for any item in the order within 14d.
      const verifiedRow = await db.execute<{ c: number }>(dsql`
        SELECT COUNT(DISTINCT o.id)::int AS c
        FROM ${emailSends} es
        JOIN ${orders} o ON o.id = es.related_id
        JOIN ${productReviews} pr ON LOWER(pr.customer_email) = LOWER(o.customer_email)
        WHERE es.kind = 'review_request_1'
          AND es.status = 'sent'
          AND es.sent_at >= ${since}
          AND pr.verified = true
          AND pr.created_at >= es.sent_at
          AND pr.created_at <= es.sent_at + INTERVAL '14 days'
          AND EXISTS (
            SELECT 1 FROM jsonb_array_elements(o.items) AS item
            WHERE COALESCE((item->>'productId')::int, (item->>'id')::int) = pr.product_id
          )
      `);
      const verifiedCount = Number(verifiedRow.rows?.[0]?.c ?? 0);
      out.push({
        days,
        request1Sent: Number(r1Row?.c || 0),
        request2Sent: Number(r2Row?.c || 0),
        request2SkippedVerified: Number(r2SkipRow?.c || 0),
        verifiedReviewsWithin14d: verifiedCount,
      });
    }
    return { windows: out };
  }

  async getNotificationKpis(since: Date): Promise<{ sent: number; failed: number; skipped: number }> {
    const rows = await db.select({ status: notificationLog.status, c: count() })
      .from(notificationLog)
      .where(gte(notificationLog.createdAt, since))
      .groupBy(notificationLog.status);
    const out: Record<NotificationStatus, number> = { sent: 0, failed: 0, skipped: 0 };
    for (const r of rows) {
      const k = r.status;
      if (k in out) out[k] = Number(r.c || 0);
    }
    return out;
  }
  async getNotificationSettings(): Promise<NotificationSettings> {
    const [row] = await db.select().from(notificationSettings).where(eq(notificationSettings.id, 1));
    if (row) return row;
    const [created] = await db.insert(notificationSettings).values({ id: 1 }).returning();
    return created;
  }
  async updateNotificationSettings(patch: Partial<NotificationSettings>): Promise<NotificationSettings> {
    await this.getNotificationSettings();
    const { id: _omit, ...rest } = patch;
    const next = { ...rest, updatedAt: new Date() };
    const [updated] = await db.update(notificationSettings).set(next).where(eq(notificationSettings.id, 1)).returning();
    return updated;
  }

  // ===== Phase 1: Family Profiles =====
  async listFamilyMembers(userId: number): Promise<FamilyMember[]> {
    return db.select().from(familyMembers).where(eq(familyMembers.userId, userId)).orderBy(asc(familyMembers.createdAt));
  }
  async createFamilyMember(input: InsertFamilyMember): Promise<FamilyMember> {
    const [row] = await db.insert(familyMembers).values(input).returning();
    return row;
  }
  async updateFamilyMember(id: number, userId: number, patch: Partial<InsertFamilyMember>): Promise<FamilyMember | null> {
    const { userId: _u, ...rest } = patch;
    const [row] = await db.update(familyMembers)
      .set({ ...rest, updatedAt: new Date() })
      .where(and(eq(familyMembers.id, id), eq(familyMembers.userId, userId)))
      .returning();
    return row || null;
  }
  async deleteFamilyMember(id: number, userId: number): Promise<boolean> {
    const r = await db.delete(familyMembers).where(and(eq(familyMembers.id, id), eq(familyMembers.userId, userId))).returning({ id: familyMembers.id });
    return r.length > 0;
  }

  // ===== Phase 1: User Notifications inbox =====
  async listUserNotifications(userId: number, opts: { limit?: number; unreadOnly?: boolean } = {}): Promise<UserNotification[]> {
    const limit = Math.min(Math.max(opts.limit ?? 50, 1), 200);
    const where = opts.unreadOnly
      ? and(eq(userNotifications.userId, userId), sql`${userNotifications.readAt} is null`)
      : eq(userNotifications.userId, userId);
    return db.select().from(userNotifications).where(where).orderBy(desc(userNotifications.createdAt)).limit(limit);
  }
  async unreadNotificationCount(userId: number): Promise<number> {
    const rows = await db.select({ c: count() }).from(userNotifications)
      .where(and(eq(userNotifications.userId, userId), sql`${userNotifications.readAt} is null`));
    return Number(rows[0]?.c || 0);
  }
  async createUserNotification(input: InsertUserNotification): Promise<UserNotification> {
    const [row] = await db.insert(userNotifications).values(input).returning();
    return row;
  }
  async markUserNotificationRead(id: number, userId: number): Promise<boolean> {
    const r = await db.update(userNotifications).set({ readAt: new Date() })
      .where(and(eq(userNotifications.id, id), eq(userNotifications.userId, userId)))
      .returning({ id: userNotifications.id });
    return r.length > 0;
  }
  async markAllUserNotificationsRead(userId: number): Promise<number> {
    const r = await db.update(userNotifications).set({ readAt: new Date() })
      .where(and(eq(userNotifications.userId, userId), sql`${userNotifications.readAt} is null`))
      .returning({ id: userNotifications.id });
    return r.length;
  }

  // ===== Phase 2: Pandit payout ledger =====
  async listPanditPayouts(panditId: number, opts: { from?: Date; to?: Date; limit?: number } = {}): Promise<PanditPayout[]> {
    const filters: SQL[] = [eq(panditPayouts.panditId, panditId)];
    if (opts.from) filters.push(gte(panditPayouts.paidAt, opts.from));
    if (opts.to) filters.push(lte(panditPayouts.paidAt, opts.to));
    const limit = Math.min(Math.max(opts.limit ?? 200, 1), 1000);
    return db.select().from(panditPayouts).where(and(...filters)).orderBy(desc(panditPayouts.paidAt)).limit(limit);
  }
  async totalPanditPayouts(panditId: number): Promise<number> {
    const rows = await db.select({ s: sql<number>`coalesce(sum(${panditPayouts.amountInr}), 0)` })
      .from(panditPayouts).where(eq(panditPayouts.panditId, panditId));
    return Number(rows[0]?.s || 0);
  }
  async createPanditPayout(input: InsertPanditPayout): Promise<PanditPayout> {
    const [row] = await db.insert(panditPayouts).values(input).returning();
    return row;
  }
  async deletePanditPayout(id: number): Promise<boolean> {
    const r = await db.delete(panditPayouts).where(eq(panditPayouts.id, id)).returning({ id: panditPayouts.id });
    return r.length > 0;
  }
  // Reverse a payout (Task #70). Marks the payout row as reversed (preserves
  // the audit trail) AND flips every referral it settled back to 'approved'
  // with payout_id cleared so they will be picked up by the next batch.
  // Idempotent: returns null if the payout was already reversed or doesn't
  // exist. Runs in a transaction.
  async reversePanditPayout(id: number, reason: string | null): Promise<{ payout: PanditPayout; restoredIds: number[] } | null> {
    return await db.transaction(async (tx) => {
      const [existing] = await tx.select().from(panditPayouts).where(eq(panditPayouts.id, id)).for("update");
      if (!existing) return null;
      if (existing.reversedAt) return null;
      const refIds = (existing.referralIds || []).filter((n): n is number => Number.isFinite(n));
      let restored: { id: number }[] = [];
      if (refIds.length > 0) {
        restored = await tx.update(panditReferrals)
          .set({ status: "approved", paidAt: null, payoutId: null })
          .where(and(
            inArray(panditReferrals.id, refIds),
            eq(panditReferrals.payoutId, id),
          ))
          .returning({ id: panditReferrals.id });
      }
      const [updated] = await tx.update(panditPayouts)
        .set({ reversedAt: new Date(), reverseReason: reason || null })
        .where(eq(panditPayouts.id, id))
        .returning();
      return { payout: updated, restoredIds: restored.map((r) => r.id) };
    });
  }
  async listAllPanditPayouts(opts: { panditId?: number; limit?: number } = {}): Promise<PanditPayout[]> {
    const limit = Math.min(Math.max(opts.limit ?? 500, 1), 2000);
    const filters: SQL[] = [];
    if (opts.panditId) filters.push(eq(panditPayouts.panditId, opts.panditId));
    const q = db.select().from(panditPayouts).orderBy(desc(panditPayouts.paidAt)).limit(limit);
    return filters.length ? q.where(and(...filters)) : q;
  }
  async payoutPanditReferrals(input: { panditId: number; referralIds: number[]; method: string; reference?: string | null; notes?: string | null; createdByAdminId?: number | null }): Promise<{ payout: PanditPayout; settledIds: number[] }> {
    const ids = Array.from(new Set((input.referralIds || []).map(Number).filter((n) => Number.isFinite(n))));
    if (ids.length === 0) throw new Error("No referrals selected");
    return await db.transaction(async (tx) => {
      // 1. SELECT ... FOR UPDATE locks the candidate rows so a second admin
      //    clicking "Pay out" on the same batch waits here.
      // 2. We require status='approved' — the settlement state machine is
      //    pending -> approved -> paid. Pending/confirmed cannot skip review.
      // 3. The conditional UPDATE only flips rows that are still 'approved'
      //    AND still have payout_id IS NULL, so even if locking somehow
      //    raced (e.g. retried tx), we only ever pay each referral once.
      await tx.execute(sql`
        SELECT id FROM pandit_referrals
        WHERE pandit_id = ${input.panditId}
          AND id = ANY(${ids}::int[])
          AND status = 'approved'
          AND payout_id IS NULL
        FOR UPDATE
      `);
      const eligible = await tx.select().from(panditReferrals).where(and(
        eq(panditReferrals.panditId, input.panditId),
        inArray(panditReferrals.id, ids),
        eq(panditReferrals.status, "approved"),
        sql`${panditReferrals.payoutId} IS NULL`,
      ));
      if (eligible.length === 0) {
        throw new Error("No eligible referrals (must be approved and not already paid)");
      }
      const eligibleIds = eligible.map((r) => r.id);
      const amount = eligible.reduce((s, r) => s + (r.commissionAmount || 0), 0);
      if (amount <= 0) throw new Error("Selected referrals total ₹0");
      const [payout] = await tx.insert(panditPayouts).values({
        panditId: input.panditId,
        amountInr: amount,
        method: input.method || "upi",
        reference: input.reference || null,
        notes: input.notes || null,
        referralIds: eligibleIds,
        createdByAdminId: input.createdByAdminId ?? null,
      } as any).returning();
      // Conditional update — guards against any leak past the FOR UPDATE.
      const updated = await tx.update(panditReferrals)
        .set({ status: "paid", paidAt: new Date(), payoutId: payout.id })
        .where(and(
          inArray(panditReferrals.id, eligibleIds),
          eq(panditReferrals.status, "approved"),
          sql`${panditReferrals.payoutId} IS NULL`,
        ))
        .returning({ id: panditReferrals.id });
      if (updated.length !== eligibleIds.length) {
        // Someone else won the race for at least one row. Roll back the payout.
        throw new Error("Concurrent payout detected; please retry");
      }
      return { payout, settledIds: eligibleIds };
    });
  }

  // ===== Pandit storefronts =====
  async getPanditStorefrontByPanditId(panditId: number): Promise<PanditStorefront | undefined> {
    const [row] = await db.select().from(panditStorefronts).where(eq(panditStorefronts.panditId, panditId)).limit(1);
    return row;
  }
  async ensurePanditStorefront(panditId: number): Promise<PanditStorefront> {
    const existing = await this.getPanditStorefrontByPanditId(panditId);
    if (existing) return existing;
    try {
      const [row] = await db.insert(panditStorefronts).values({ panditId }).returning();
      return row;
    } catch (error: any) {
      if (error?.code !== "23505") throw error;
      const concurrent = await this.getPanditStorefrontByPanditId(panditId);
      if (!concurrent) throw error;
      return concurrent;
    }
  }
  async updatePanditStorefront(panditId: number, patch: Partial<InsertPanditStorefront>): Promise<PanditStorefront | undefined> {
    await this.ensurePanditStorefront(panditId);
    const [row] = await db.update(panditStorefronts)
      .set({ ...patch, updatedAt: new Date() })
      .where(eq(panditStorefronts.panditId, panditId))
      .returning();
    return row;
  }
  async incrementStorefrontView(panditId: number): Promise<void> {
    await db.update(panditStorefronts)
      .set({ viewCount: sql`${panditStorefronts.viewCount} + 1` })
      .where(eq(panditStorefronts.panditId, panditId));
  }

  // ===== Pandit service catalogue =====
  async listActiveMasterServices(): Promise<MasterService[]> {
    return db.select().from(masterServices)
      .where(eq(masterServices.isActive, true))
      .orderBy(asc(masterServices.category), asc(masterServices.name));
  }
  async listAllMasterServices(): Promise<MasterService[]> {
    return db.select().from(masterServices)
      .orderBy(asc(masterServices.category), asc(masterServices.name));
  }
  async getMasterService(id: number): Promise<MasterService | undefined> {
    const [row] = await db.select().from(masterServices).where(eq(masterServices.id, id)).limit(1);
    return row;
  }
  async getMasterServiceBySlug(slug: string): Promise<MasterService | undefined> {
    const [row] = await db.select().from(masterServices).where(eq(masterServices.slug, slug)).limit(1);
    return row;
  }
  async createMasterService(data: InsertMasterService): Promise<MasterService> {
    const [row] = await db.insert(masterServices).values(data).returning();
    return row;
  }
  async updateMasterService(id: number, data: Partial<InsertMasterService>): Promise<MasterService | undefined> {
    const [row] = await db.update(masterServices)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(masterServices.id, id))
      .returning();
    return row;
  }
  async listPanditServices(panditId: number, activeOnly = false): Promise<PanditService[]> {
    const where = activeOnly
      ? and(eq(panditServices.panditId, panditId), eq(panditServices.isActive, true))
      : eq(panditServices.panditId, panditId);
    return db.select().from(panditServices)
      .where(where)
      .orderBy(asc(panditServices.displayOrder), asc(panditServices.id));
  }
  async listPanditServicesWithMaster(panditId: number, activeOnly = false): Promise<Array<{ service: PanditService; master: MasterService }>> {
    const filters = [eq(panditServices.panditId, panditId), eq(masterServices.isActive, true)];
    if (activeOnly) filters.push(eq(panditServices.isActive, true));
    return db.select({ service: panditServices, master: masterServices })
      .from(panditServices)
      .innerJoin(masterServices, eq(panditServices.masterServiceId, masterServices.id))
      .where(and(...filters))
      .orderBy(asc(panditServices.displayOrder), asc(panditServices.id));
  }
  async getPanditService(id: number): Promise<PanditService | undefined> {
    const [row] = await db.select().from(panditServices).where(eq(panditServices.id, id)).limit(1);
    return row;
  }
  async createPanditService(data: InsertPanditService): Promise<PanditService> {
    const [row] = await db.insert(panditServices).values(data).returning();
    return row;
  }
  async updatePanditService(id: number, data: Partial<InsertPanditService>): Promise<PanditService | undefined> {
    const [row] = await db.update(panditServices)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(panditServices.id, id))
      .returning();
    return row;
  }

  // ===== Referrals =====
  async createPanditReferral(input: InsertPanditReferral): Promise<PanditReferral | undefined> {
    // Unique index on (kind, ref_id) prevents duplicate attribution if a
    // checkout webhook fires twice. Swallow the conflict and return undefined.
    try {
      const [row] = await db.insert(panditReferrals).values(input).returning();
      return row;
    } catch (e: any) {
      if (e?.code === "23505") return undefined; // unique_violation
      throw e;
    }
  }
  async listPanditReferrals(panditId: number, opts: { limit?: number; status?: string } = {}): Promise<PanditReferral[]> {
    const limit = Math.min(Math.max(opts.limit ?? 200, 1), 1000);
    const filters: SQL[] = [eq(panditReferrals.panditId, panditId)];
    if (opts.status) filters.push(eq(panditReferrals.status, opts.status));
    return db.select().from(panditReferrals).where(and(...filters)).orderBy(desc(panditReferrals.createdAt)).limit(limit);
  }
  async listAllPanditReferrals(opts: { limit?: number; status?: string; panditId?: number } = {}): Promise<PanditReferral[]> {
    const limit = Math.min(Math.max(opts.limit ?? 500, 1), 2000);
    const filters: SQL[] = [];
    if (opts.status) filters.push(eq(panditReferrals.status, opts.status));
    if (opts.panditId) filters.push(eq(panditReferrals.panditId, opts.panditId));
    const q = db.select().from(panditReferrals).orderBy(desc(panditReferrals.createdAt)).limit(limit);
    return filters.length ? q.where(and(...filters)) : q;
  }
  async panditReferralSummary(panditId: number): Promise<{ totalCommission: number; pending: number; approved: number; paid: number; count: number }> {
    const rows = await db.select({
      total: sql<number>`coalesce(sum(${panditReferrals.commissionAmount}), 0)`,
      pending: sql<number>`coalesce(sum(case when ${panditReferrals.status} in ('pending','confirmed') then ${panditReferrals.commissionAmount} else 0 end), 0)`,
      approved: sql<number>`coalesce(sum(case when ${panditReferrals.status} = 'approved' then ${panditReferrals.commissionAmount} else 0 end), 0)`,
      paid: sql<number>`coalesce(sum(case when ${panditReferrals.status} = 'paid' then ${panditReferrals.commissionAmount} else 0 end), 0)`,
      cnt: sql<number>`count(*)`,
    }).from(panditReferrals).where(eq(panditReferrals.panditId, panditId));
    const r = rows[0] || { total: 0, pending: 0, approved: 0, paid: 0, cnt: 0 };
    return { totalCommission: Number(r.total || 0), pending: Number(r.pending || 0), approved: Number(r.approved || 0), paid: Number(r.paid || 0), count: Number(r.cnt || 0) };
  }
  async updatePanditReferral(id: number, patch: Partial<PanditReferral>): Promise<PanditReferral | undefined> {
    const { id: _o, ...rest } = patch;
    if (rest.status === "paid" && !rest.paidAt) rest.paidAt = new Date();
    const [row] = await db.update(panditReferrals).set(rest).where(eq(panditReferrals.id, id)).returning();
    return row;
  }
  async bulkUpdatePanditReferrals(ids: number[], patch: { status?: string; notes?: string | null }): Promise<number> {
    const cleanIds = Array.from(new Set((ids || []).map(Number).filter((n) => Number.isFinite(n))));
    if (cleanIds.length === 0) return 0;
    const set: any = {};
    if (patch.status) {
      set.status = patch.status;
      if (patch.status === "paid") set.paidAt = new Date();
    }
    if (patch.notes !== undefined) set.notes = patch.notes;
    if (Object.keys(set).length === 0) return 0;
    const out = await db.update(panditReferrals).set(set)
      .where(inArray(panditReferrals.id, cleanIds))
      .returning({ id: panditReferrals.id });
    return out.length;
  }

  // ===== Card orders =====
  async createPanditCardOrder(input: InsertPanditCardOrder): Promise<PanditCardOrder> {
    const [row] = await db.insert(panditCardOrders).values(input).returning();
    return row;
  }
  async getPanditCardOrder(id: number): Promise<PanditCardOrder | undefined> {
    const [row] = await db.select().from(panditCardOrders).where(eq(panditCardOrders.id, id)).limit(1);
    return row;
  }
  async listPanditCardOrders(panditId: number): Promise<PanditCardOrder[]> {
    return db.select().from(panditCardOrders).where(eq(panditCardOrders.panditId, panditId)).orderBy(desc(panditCardOrders.createdAt));
  }
  async listAllPanditCardOrders(opts: { limit?: number; status?: string } = {}): Promise<PanditCardOrder[]> {
    const limit = Math.min(Math.max(opts.limit ?? 500, 1), 2000);
    const q = db.select().from(panditCardOrders).orderBy(desc(panditCardOrders.createdAt)).limit(limit);
    return opts.status
      ? q.where(eq(panditCardOrders.status, opts.status))
      : q;
  }
  async updatePanditCardOrder(id: number, patch: Partial<PanditCardOrder>): Promise<PanditCardOrder | undefined> {
    const { id: _o, ...rest } = patch;
    const [row] = await db.update(panditCardOrders).set({ ...rest, updatedAt: new Date() }).where(eq(panditCardOrders.id, id)).returning();
    return row;
  }

  // ===== Admin-managed Jap Counter mantras =====
  async listActiveAdminMantras(): Promise<AdminMantra[]> {
    return db.select().from(adminMantras)
      .where(eq(adminMantras.isActive, true))
      .orderBy(asc(adminMantras.sortOrder), asc(adminMantras.id));
  }
  async listAllAdminMantras(): Promise<AdminMantra[]> {
    return db.select().from(adminMantras)
      .orderBy(asc(adminMantras.sortOrder), asc(adminMantras.id));
  }
  async getAdminMantra(id: number): Promise<AdminMantra | undefined> {
    const [row] = await db.select().from(adminMantras).where(eq(adminMantras.id, id)).limit(1);
    return row;
  }
  async getAdminMantraBySlug(slug: string): Promise<AdminMantra | undefined> {
    const [row] = await db.select().from(adminMantras).where(eq(adminMantras.slug, slug)).limit(1);
    return row;
  }
  async createAdminMantra(data: InsertAdminMantra): Promise<AdminMantra> {
    const [row] = await db.insert(adminMantras).values(data).returning();
    return row;
  }
  async updateAdminMantra(id: number, data: Partial<InsertAdminMantra>): Promise<AdminMantra | undefined> {
    const { ...rest } = data;
    const [row] = await db.update(adminMantras)
      .set({ ...rest, updatedAt: new Date() })
      .where(eq(adminMantras.id, id))
      .returning();
    return row;
  }
  async deleteAdminMantra(id: number): Promise<boolean> {
    const out = await db.delete(adminMantras).where(eq(adminMantras.id, id)).returning({ id: adminMantras.id });
    return out.length > 0;
  }

  // ===== Schema Changelog =====
  async listSchemaChangelog(): Promise<SchemaChangelog[]> {
    return db.select().from(schemaChangelog).orderBy(desc(schemaChangelog.changeDate), desc(schemaChangelog.createdAt));
  }
  async getSchemaChangelogEntry(id: number): Promise<SchemaChangelog | undefined> {
    const [row] = await db.select().from(schemaChangelog).where(eq(schemaChangelog.id, id));
    return row;
  }
  async createSchemaChangelogEntry(data: InsertSchemaChangelog): Promise<SchemaChangelog> {
    const [row] = await db.insert(schemaChangelog).values(data).returning();
    return row;
  }
  async updateSchemaChangelogEntry(id: number, data: Partial<InsertSchemaChangelog>): Promise<SchemaChangelog | undefined> {
    const [row] = await db.update(schemaChangelog)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(schemaChangelog.id, id))
      .returning();
    return row;
  }
  async deleteSchemaChangelogEntry(id: number): Promise<boolean> {
    const out = await db.delete(schemaChangelog).where(eq(schemaChangelog.id, id)).returning({ id: schemaChangelog.id });
    return out.length > 0;
  }

  async getSpiritualJourney(userId: number): Promise<any | null> {
    const [row] = await db.select().from(spiritualJourney).where(eq(spiritualJourney.userId, userId));
    return row ? row.data : null;
  }

  // ===== Hero slider =====
  async listHeroSlides(opts?: { enabledOnly?: boolean }): Promise<HeroSlide[]> {
    const q = db.select().from(heroSlides);
    const rows = opts?.enabledOnly
      ? await q.where(eq(heroSlides.enabled, true)).orderBy(asc(heroSlides.position), asc(heroSlides.id))
      : await q.orderBy(asc(heroSlides.position), asc(heroSlides.id));
    return rows;
  }
  async getHeroSlide(id: number): Promise<HeroSlide | undefined> {
    const [row] = await db.select().from(heroSlides).where(eq(heroSlides.id, id));
    return row;
  }
  async createHeroSlide(data: InsertHeroSlide): Promise<HeroSlide> {
    // Auto-place new slides at the end so the admin sees them at the bottom
    // instead of overlapping an existing position.
    let position = data.position;
    if (position === undefined || position === null) {
      const [{ maxPos }] = await db
        .select({ maxPos: dsql<number>`coalesce(max(${heroSlides.position}), -1)` })
        .from(heroSlides);
      position = (Number(maxPos) || -1) + 1;
    }
    const [row] = await db.insert(heroSlides).values({ ...data, position }).returning();
    return row;
  }
  async updateHeroSlide(id: number, data: Partial<InsertHeroSlide>): Promise<HeroSlide | undefined> {
    const [row] = await db.update(heroSlides)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(heroSlides.id, id))
      .returning();
    return row;
  }
  async deleteHeroSlide(id: number): Promise<boolean> {
    const out = await db.delete(heroSlides).where(eq(heroSlides.id, id)).returning({ id: heroSlides.id });
    return out.length > 0;
  }
  async reorderHeroSlides(orderedIds: number[]): Promise<HeroSlide[]> {
    // Re-stamp position sequentially. Run as a single transaction so the
    // public /api/hero-slides query never observes a half-applied order.
    await db.transaction(async (tx) => {
      for (let i = 0; i < orderedIds.length; i++) {
        await tx.update(heroSlides)
          .set({ position: i, updatedAt: new Date() })
          .where(eq(heroSlides.id, orderedIds[i]));
      }
    });
    return this.listHeroSlides();
  }

  // ===== Homepage sections (movable blocks on /) =====
  async listHomepageSections(opts?: { enabledOnly?: boolean }): Promise<HomepageSection[]> {
    const q = db.select().from(homepageSections);
    return opts?.enabledOnly
      ? await q.where(eq(homepageSections.enabled, true)).orderBy(asc(homepageSections.position), asc(homepageSections.id))
      : await q.orderBy(asc(homepageSections.position), asc(homepageSections.id));
  }
  async updateHomepageSection(id: number, data: Partial<InsertHomepageSection>): Promise<HomepageSection | undefined> {
    const [row] = await db.update(homepageSections)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(homepageSections.id, id))
      .returning();
    return row;
  }
  async reorderHomepageSections(orderedIds: number[]): Promise<HomepageSection[]> {
    await db.transaction(async (tx) => {
      for (let i = 0; i < orderedIds.length; i++) {
        await tx.update(homepageSections)
          .set({ position: i, updatedAt: new Date() })
          .where(eq(homepageSections.id, orderedIds[i]));
      }
    });
    return this.listHomepageSections();
  }
  // Idempotently inserts defaults the first time, then on subsequent boots
  // syncs `label` AND `position` from code so the canonical order in
  // HOMEPAGE_SECTION_DEFAULTS is the source of truth. Admin re-ordering via
  // the panel will be reset on next deploy — intentional trade-off so default
  // order changes actually propagate.
  async seedHomepageSections(defaults: InsertHomepageSection[]): Promise<HomepageSection[]> {
    for (let i = 0; i < defaults.length; i++) {
      const d = defaults[i];
      await db.insert(homepageSections)
        .values({ key: d.key, label: d.label, position: d.position ?? i, enabled: d.enabled ?? true })
        .onConflictDoUpdate({
          target: homepageSections.key,
          set: { label: d.label, position: d.position ?? i, updatedAt: new Date() },
        });
    }
    return this.listHomepageSections();
  }

  async upsertSpiritualJourney(userId: number, data: any): Promise<void> {
    await db.insert(spiritualJourney)
      .values({ userId, data, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: spiritualJourney.userId,
        set: { data, updatedAt: new Date() },
      });
  }
}

export const storage = new DatabaseStorage();
