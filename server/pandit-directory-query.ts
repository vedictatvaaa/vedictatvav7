import { sql, type SQL } from "drizzle-orm";
import { db } from "./db";
import { adminPanditDto, publicPanditDto } from "./pandit-discovery-policy";
import { onlinePanditIds } from "./pandit-portal";
import { evaluatePanditBookingEligibility } from "./pandit-booking-eligibility";
import { storage } from "./storage";

export const DIRECTORY_SORTS = ["best_match", "highest_rated", "most_reviewed", "price_low", "price_high", "nearest", "experience"] as const;
type DirectorySort = typeof DIRECTORY_SORTS[number];

export type DirectoryQuery = {
  q?: string; stateId?: number; cityId?: number; service?: string; languages: string[];
  region?: string; minRating?: number; maxPrice?: number; verified?: boolean; onlineOnly?: boolean;
  sort: DirectorySort; page: number; pageSize: number; nearMe?: boolean; lat?: number; lng?: number;
  radiusKm?: number; showAll?: boolean;
};

function numberParam(value: unknown, name: string, options: { min?: number; max?: number; integer?: boolean } = {}) {
  if (value === undefined) return undefined;
  const n = typeof value === "string" && value.trim() !== "" ? Number(value) : NaN;
  if (!Number.isFinite(n) || (options.integer && !Number.isInteger(n)) || (options.min !== undefined && n < options.min) || (options.max !== undefined && n > options.max)) {
    throw new Error(`Invalid ${name}`);
  }
  return n;
}

/** Parses only directory controls; date/catalogue validation remains in the route. */
export function parseDirectoryQuery(query: Record<string, unknown>): DirectoryQuery {
  const text = (key: string) => typeof query[key] === "string" ? query[key].trim() : undefined;
  const bool = (key: string) => {
    if (query[key] === undefined) return undefined;
    if (query[key] !== "true" && query[key] !== "false") throw new Error(`Invalid ${key}`);
    return query[key] === "true";
  };
  const languageValues = Array.isArray(query.language) ? query.language : query.language === undefined ? [] : [query.language];
  const languages = languageValues.flatMap(value => typeof value === "string" ? value.split(",") : []).map(value => value.trim()).filter(Boolean);
  if (languages.length > 12 || languages.some(value => value.length > 80)) throw new Error("Invalid language");
  const requestedSort = text("sort");
  if (requestedSort && !DIRECTORY_SORTS.includes(requestedSort as DirectorySort)) throw new Error("Invalid sort");
  const page = numberParam(query.page, "page", { min: 1, integer: true }) ?? 1;
  const pageSize = numberParam(query.pageSize, "pageSize", { min: 1, max: 24, integer: true }) ?? 12;
  const lat = numberParam(query.lat, "lat", { min: -90, max: 90 });
  const lng = numberParam(query.lng, "lng", { min: -180, max: 180 });
  const nearMe = bool("nearMe");
  const radiusKm = numberParam(query.radiusKm, "radiusKm", { min: Number.EPSILON, max: 100 }) ?? 50;
  const sort = (requestedSort || (nearMe ? "nearest" : "best_match")) as DirectorySort;
  if ((nearMe || sort === "nearest") && (lat === undefined || lng === undefined)) throw new Error("Nearest results require valid latitude and longitude");
  const q = text("q"), service = text("service"), region = text("region") || text("tradition");
  if ([q, service, region].some(value => value && value.length > 120)) throw new Error("Invalid directory filter");
  return {
    q, stateId: numberParam(query.stateId, "stateId", { min: 1, integer: true }),
    cityId: numberParam(query.cityId, "cityId", { min: 1, integer: true }), service,
    languages, region, minRating: numberParam(query.minRating, "minRating", { min: 0, max: 5 }),
    maxPrice: numberParam(query.maxPrice, "maxPrice", { min: 0, integer: true }), verified: bool("verified"),
    onlineOnly: bool("onlineOnly"), sort, page, pageSize, nearMe, lat, lng, radiusKm,
  };
}

const distanceExpression = (lat?: number, lng?: number) => lat === undefined || lng === undefined
  ? sql<number>`null`
  : sql<number>`6371.0 * 2 * asin(sqrt(power(sin(radians(p.latitude - ${lat}) / 2), 2) + cos(radians(${lat})) * cos(radians(p.latitude)) * power(sin(radians(p.longitude - ${lng}) / 2), 2)))`;

export async function queryPanditDirectory(input: DirectoryQuery) {
  const where: SQL[] = [];
  // This is the SQL equivalent of isPanditPubliclyEligible. Keep this predicate
  // aligned with that helper; inner joins also enforce active canonical locations.
  if (!input.showAll) where.push(sql`p.verified = true and p.on_leave = false and p.archived = false and p.directory_visible = true and p.search_eligible = true and p.location_review_status = 'resolved' and p.account_status <> 'banned' and (p.account_status <> 'suspended' or (p.suspended_until is not null and p.suspended_until <= now()))`);
  if (input.q) where.push(sql`(p.name ilike ${`%${input.q}%`} or p.city ilike ${`%${input.q}%`} or p.specialization ilike ${`%${input.q}%`})`);
  if (input.stateId) where.push(sql`p.state_id = ${input.stateId}`);
  if (input.cityId) where.push(sql`p.city_id = ${input.cityId}`);
  if (input.region) where.push(sql`p.regional_origin ilike ${`%${input.region}%`}`);
  if (input.maxPrice !== undefined) where.push(sql`p.fees <= ${input.maxPrice}`);
  if (input.verified !== undefined) where.push(sql`p.verified = ${input.verified}`);
  if (input.languages.length) where.push(sql`(${sql.join(input.languages.map(language => sql`p.languages ilike ${`%${language}%`}`), sql` or `)})`);
  if (input.service) {
    const wanted = `%${input.service}%`;
    // Catalogue offerings are authoritative once a pandit has configured any.
    // The legacy specialization fallback applies only to pandits with none.
    where.push(sql`(exists (select 1 from pandit_services ps join master_services ms on ms.id = ps.master_service_id and ms.is_active = true where ps.pandit_id = p.id and ps.is_active = true and (ms.name ilike ${wanted} or ms.slug ilike ${wanted})) or (not exists (select 1 from pandit_services any_ps where any_ps.pandit_id = p.id) and p.specialization ilike ${wanted}))`);
  }
  if (!input.nearMe && input.cityId) where.push(sql`((lower(coalesce(p.tier, 'free')) in ('platinum', 'guru_elite') and (p.tier_expires_at is null or p.tier_expires_at >= now())) or (lower(coalesce(p.tier, 'free')) = 'gold' and (p.tier_expires_at is null or p.tier_expires_at >= now()) and p.state_id = ${input.stateId!}) or p.city_id = ${input.cityId})`);
  else if (!input.nearMe && input.stateId) where.push(sql`((lower(coalesce(p.tier, 'free')) in ('platinum', 'guru_elite') and (p.tier_expires_at is null or p.tier_expires_at >= now())) or (lower(coalesce(p.tier, 'free')) = 'gold' and (p.tier_expires_at is null or p.tier_expires_at >= now()) and p.state_id = ${input.stateId}))`);

  // Heartbeats are runtime-only, so take one complete snapshot before SQL;
  // do not paginate before this predicate and do not look up each row.
  const activeOnlineIds = onlinePanditIds();
  const onlineIds = input.onlineOnly ? activeOnlineIds : [];
  if (input.onlineOnly) where.push(onlineIds.length ? sql`p.id in (${sql.join(onlineIds.map(id => sql`${id}`), sql`, `)})` : sql`false`);
  const distance = distanceExpression(input.lat, input.lng);
  if (input.nearMe) where.push(sql`p.latitude is not null and p.longitude is not null and ${distance} <= ${input.radiusKm!}`);
  const filter = where.length ? sql.join(where, sql` and `) : sql`true`;
  const having = input.minRating === undefined ? sql`` : sql`having coalesce(avg(r.rating), 0) >= ${input.minRating}`;
  const order: Record<DirectorySort, SQL> = {
    best_match: sql`p.verified desc, computed_review_count desc, p.id asc`,
    highest_rated: sql`computed_rating desc nulls last, computed_review_count desc, p.id asc`,
    most_reviewed: sql`computed_review_count desc, computed_rating desc nulls last, p.id asc`,
    price_low: sql`p.fees asc, p.id asc`, price_high: sql`p.fees desc, p.id asc`,
    nearest: sql`distance_km asc nulls last, p.id asc`, experience: sql`p.experience desc, p.id asc`,
  };
  const locationJoins = input.showAll
    ? sql`left join indian_states st on st.id = p.state_id left join indian_cities ct on ct.id = p.city_id and ct.state_id = p.state_id`
    : sql`join indian_states st on st.id = p.state_id and st.is_active = true join indian_cities ct on ct.id = p.city_id and ct.state_id = p.state_id and ct.is_active = true`;
  // Ratings are derived solely from genuine, publishable reviews.
  const base = sql`from pandits p ${locationJoins} left join pandit_reviews r on r.pandit_id = p.id and r.status = 'approved' where ${filter}`;
  const countResult: any = await db.execute(sql`select count(*)::int as total from (select p.id ${base} group by p.id ${having}) candidates`);
  const total = Number(countResult.rows[0]?.total || 0);
  const rowsResult: any = await db.execute(sql`select p.*, avg(r.rating)::float as computed_rating, count(r.id)::int as computed_review_count,
    ${distance} as distance_km ${base} group by p.id ${having} order by ${order[input.sort]} limit ${input.pageSize} offset ${(input.page - 1) * input.pageSize}`);
  const bookingById = new Map(await Promise.all(rowsResult.rows.map(async (row: any) => {
    const services = await storage.listPanditServicesWithMaster(row.id, true);
    const pandit = { accountStatus: row.account_status, verified: row.verified, onLeave: row.on_leave, archived: row.archived, bookingEnabled: row.booking_enabled, availability: row.availability };
    return [row.id, evaluatePanditBookingEligibility(pandit, {
      services: services.map(service => ({ mode: service.service.mode, serviceAreas: service.service.serviceAreas })),
      pujaSupported: services.length > 0,
    }).result.passed] as const;
  })));
  const items = rowsResult.rows.map((row: any) => {
    const distanceValue = row.distance_km == null ? undefined : Math.round(Number(row.distance_km) * 10) / 10;
    if (input.showAll) {
      const { password_hash, rating: _seedRating, review_count: _seedReviewCount, computed_rating, computed_review_count, distance_km, ...adminPandit } = row;
      return {
        ...adminPanditDto(adminPandit, activeOnlineIds.includes(adminPandit.id), distanceValue),
        ...(Number(computed_review_count) ? { rating: Math.round(Number(computed_rating) * 10) / 10 } : {}),
        reviewCount: Number(computed_review_count),
      };
    }
    // Raw SQL returns database column names. Remove both those private names
    // and the camel-case names handled by publicPanditDto before projection.
    const {
      rating: _seedRating, review_count: _seedReviewCount, computed_rating, computed_review_count, distance_km,
      password_hash, last_login_at, suspended_until, moderation_reason,
      must_change_password, membership_no, legacy_registration_no, registration_assigned_at,
      commission_pct, product_commission_pct, tier_expires_at, location_review_status,
      leave_note, leave_started_at, boost_type, boost_start_date, boost_end_date, boost_active,
      original_city, original_state, card_issued, card_issued_at, service_area,
      latitude, longitude, account_status, on_leave, tier, registration_no,
      state_id, city_id, regional_origin, created_at,
      directory_visible, search_eligible, booking_enabled, indexing_mode, archived,
      ...pandit
    } = row;
    const dto = publicPanditDto({
      ...pandit,
      stateId: state_id,
      cityId: city_id,
      regionalOrigin: regional_origin,
      serviceArea: service_area,
      createdAt: created_at,
      registrationNo: registration_no,
    }, activeOnlineIds.includes(pandit.id), distanceValue);
    return { ...dto, managedBookingEligible: bookingById.get(row.id) === true, ...(Number(computed_review_count) ? { rating: Math.round(Number(computed_rating) * 10) / 10 } : {}), reviewCount: Number(computed_review_count) };
  });
  const totalPages = Math.ceil(total / input.pageSize);
  return { items, pagination: { page: input.page, pageSize: input.pageSize, total, totalPages, hasNextPage: input.page < totalPages, hasPreviousPage: input.page > 1 }, availableSorts: DIRECTORY_SORTS.filter(sort => sort !== "nearest" || (input.lat !== undefined && input.lng !== undefined)) };
}