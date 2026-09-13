import type { Express, RequestHandler } from "express";
import { sql } from "drizzle-orm";
import { db } from "./db";
import { isPresenceViewInitialized, onlinePanditIds } from "./pandit-portal";
import {
  ACTIVE_BOOKING_STATUSES,
  ENROLLED_ACCOUNT_STATUSES,
  METRIC_DEFINITIONS,
  QUALIFYING_BOOKING_STATUSES,
  metric,
  unavailableMetric,
  unavailablePanditLiveMetrics,
  type PanditLiveMetrics,
} from "./pandit-live-metrics-policy";

export { METRIC_DEFINITIONS, QUALIFYING_BOOKING_STATUSES };
export type { PanditLiveMetrics };

const METRICS_CACHE_TTL_MS = 30_000;
let cache: { expiresAt: number; value: PanditLiveMetrics } | null = null;
let inFlight: Promise<PanditLiveMetrics> | null = null;

const sqlList = (values: readonly string[]) => sql.join(values.map(value => sql`${value}`), sql`, `);
const numeric = (result: { rows?: Array<Record<string, unknown>> }) =>
  Number(result.rows?.[0]?.count || 0);

async function queryMetrics(): Promise<PanditLiveMetrics> {
  const onlineIds = onlinePanditIds();
  const onlineFilter = onlineIds.length
    ? sql`and p.id in (${sql.join(onlineIds.map(id => sql`${id}`), sql`, `)})`
    : sql`and false`;
  const activeStatuses = sqlList(ACTIVE_BOOKING_STATUSES);
  const qualifyingStatuses = sqlList(QUALIFYING_BOOKING_STATUSES);

  // Keep these definitions in SQL so the aggregate cannot accidentally expose
  // a row-level projection or be changed by a client-side filter.
  const [servingRows, servedRows, bookingRows, enrolledRows, discoverableRows, availableRows, onlineRows] = await Promise.all([
    db.execute(sql`
      select count(distinct b.user_id)::int as count
      from puja_bookings b
      where b.status = 'in_progress'
        and b.pandit_id is not null
        and b.user_id is not null
    `),
    db.execute(sql`
      select count(distinct b.user_id)::int as count
      from puja_bookings b
      where b.user_id is not null
        and (
          (b.status in (${activeStatuses}) and b.created_at >= now() - interval '24 hours' and b.created_at <= now())
          or (b.status = 'completed' and b.completed_at >= now() - interval '24 hours' and b.completed_at <= now())
        )
    `),
    db.execute(sql`
      select count(*)::int as count
      from puja_bookings b
      where b.status in (${qualifyingStatuses})
    `),
    db.execute(sql`
      select count(*)::int as count
      from pandits p
      where p.archived = false
        and p.account_status in (${sqlList(ENROLLED_ACCOUNT_STATUSES)})
    `),
    db.execute(sql`
      select count(*)::int as count
      from pandits p
      join indian_states st on st.id = p.state_id and st.is_active = true
      join indian_cities ct on ct.id = p.city_id and ct.state_id = p.state_id and ct.is_active = true
      where p.verified = true
        and p.on_leave = false
        and p.archived = false
        and p.directory_visible = true
        and p.search_eligible = true
        and p.location_review_status = 'resolved'
        and p.account_status <> 'banned'
        and (p.account_status <> 'suspended' or (p.suspended_until is not null and p.suspended_until <= now()))
    `),
    db.execute(sql`
      select count(*)::int as count
      from pandits p
      where p.verified = true
        and p.on_leave = false
        and p.archived = false
        and p.account_status = 'active'
        and p.booking_enabled = true
        and lower(coalesce(p.availability, '')) = 'available'
        and exists (
          select 1
          from pandit_storefronts sf
          where sf.pandit_id = p.id
            and sf.status = 'published'
            and sf.is_published = true
        )
        and exists (
          select 1
          from pandit_services ps
          join master_services ms on ms.id = ps.master_service_id and ms.is_active = true
          where ps.pandit_id = p.id
            and ps.is_active = true
            and (
              lower(ps.mode) in ('online', 'virtual', 'hybrid', 'both')
              or coalesce(cardinality(ps.service_areas), 0) > 0
            )
        )
    `),
    db.execute(sql`
      select count(*)::int as count
      from pandits p
      join indian_states st on st.id = p.state_id and st.is_active = true
      join indian_cities ct on ct.id = p.city_id and ct.state_id = p.state_id and ct.is_active = true
      where p.verified = true
        and p.on_leave = false
        and p.archived = false
        and p.directory_visible = true
        and p.search_eligible = true
        and p.location_review_status = 'resolved'
        and p.account_status <> 'banned'
        and (p.account_status <> 'suspended' or (p.suspended_until is not null and p.suspended_until <= now()))
        ${onlineFilter}
    `),
  ]);

  return {
    health: "available",
    updatedAt: new Date().toISOString(),
    metrics: {
      servingNow: metric(numeric(servingRows)),
      servedLast24h: metric(numeric(servedRows)),
      pujasBooked: metric(numeric(bookingRows)),
      totalEnrolledPandits: metric(numeric(enrolledRows)),
      discoverablePandits: metric(numeric(discoverableRows)),
      availableToBook: metric(numeric(availableRows)),
      onlineNow: isPresenceViewInitialized()
        ? metric(numeric(onlineRows), "this_instance")
        : unavailableMetric("Presence view is not initialized on this server instance."),
    },
    definitions: METRIC_DEFINITIONS,
  };
}

export function clearPanditLiveMetricsCache() {
  cache = null;
}

export async function getPanditLiveMetrics(): Promise<PanditLiveMetrics> {
  const now = Date.now();
  if (cache && cache.expiresAt > now) return cache.value;
  if (inFlight) return inFlight;
  inFlight = queryMetrics()
    .then(value => {
      cache = { value, expiresAt: Date.now() + METRICS_CACHE_TTL_MS };
      return value;
    })
    .catch(error => {
      console.error("pandit-live-metrics error:", error);
      return unavailablePanditLiveMetrics("Metrics are temporarily unavailable.");
    })
    .finally(() => {
      inFlight = null;
    });
  return inFlight;
}

export function registerPanditLiveMetricsRoutes(app: Express, adminAuthMiddleware?: RequestHandler) {
  app.get("/api/pandit-metrics", async (_req, res) => {
    const payload = await getPanditLiveMetrics();
    res.setHeader(
      "Cache-Control",
      payload.health === "available"
        // Presence is process-local until a durable/global source exists, so
        // never let a shared CDN turn one instance's value into a universal
        // claim. Browser caching remains bounded.
        ? "private, max-age=15, stale-while-revalidate=15"
        : "no-store",
    );
    res.json(payload);
  });

  if (adminAuthMiddleware) {
    app.get("/api/admin/pandit-network/activity", adminAuthMiddleware, async (_req, res) => {
      const payload = await getPanditLiveMetrics();
      const health = payload.health === "available" ? "healthy" : "unavailable";
      const updatedAt = payload.updatedAt;
      const value = (key: keyof PanditLiveMetrics["metrics"]) => ({
        key,
        value: payload.metrics[key].value,
        definition: payload.definitions[key],
        updatedAt,
        health: payload.metrics[key].health === "available" ? "healthy" : "unavailable",
        scope: payload.metrics[key].scope,
      });
      res.setHeader("Cache-Control", payload.health === "available" ? "private, max-age=15" : "private, no-store");
      res.json({
        health,
        updatedAt,
        cacheTtlSeconds: METRICS_CACHE_TTL_MS / 1000,
        metrics: [
          { ...value("servingNow"), label: "Serving now" },
          { ...value("servedLast24h"), label: "Served in the last 24 hours" },
          { ...value("pujasBooked"), label: "Pujas booked" },
          { ...value("totalEnrolledPandits"), key: "panditsNetwork", label: "Pandits in our network" },
          { ...value("discoverablePandits"), label: "Discoverable Pandits" },
          { ...value("availableToBook"), label: "Available to book" },
          { ...value("onlineNow"), label: "Online now" },
        ],
      });
    });
  }
}