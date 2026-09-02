import type { EntityAdapter, EntityRef } from "./types";
import { KnowledgeGraphConflictError, KnowledgeGraphValidationError } from "./types";
import { isValidRelationshipCombination, type RelationshipType } from "./registry";

export const MAX_ENTITY_ID = 2_147_483_647;
export const MAX_PAGE_SIZE = 100;
export const MAX_SEARCH_LENGTH = 120;
export const MAX_METADATA_KEYS = 32;
export const MAX_METADATA_BYTES = 8_192;
export const MAX_DISPLAY_ORDER = 10_000;
export const MAX_PAGINATION_WINDOW = 10_000;

export function positiveEntityId(value: unknown): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 1 || value > MAX_ENTITY_ID) {
    throw new KnowledgeGraphValidationError("Entity ID must be a positive 32-bit integer");
  }
  return value;
}

export function pagination(input: { page?: unknown; limit?: unknown }) {
  const page = input.page === undefined ? 1 : positiveBoundedInteger(queryInteger(input.page), 1, 1_000_000, "page");
  const limit = input.limit === undefined ? 25 : positiveBoundedInteger(queryInteger(input.limit), 1, MAX_PAGE_SIZE, "limit");
  const offset = (page - 1) * limit;
  if (offset + limit > MAX_PAGINATION_WINDOW) throw new KnowledgeGraphValidationError(`page and limit may not exceed a ${MAX_PAGINATION_WINDOW} item window`);
  return { page, limit, offset };
}

function queryInteger(value: unknown): unknown {
  return typeof value === "string" && /^\d+$/.test(value) ? Number(value) : value;
}

export function boundedSearchTerm(value: unknown): string {
  if (typeof value !== "string") throw new KnowledgeGraphValidationError("Search term must be a string");
  const term = value.trim();
  if (term.length > MAX_SEARCH_LENGTH) throw new KnowledgeGraphValidationError("Search term is too long");
  return term;
}

export function boundedSearch(input: { term: unknown; limit: unknown; offset: unknown }) {
  const term = boundedSearchTerm(input.term);
  const limit = positiveBoundedInteger(input.limit, 1, MAX_PAGE_SIZE, "limit");
  const offset = positiveBoundedInteger(input.offset, 0, 1_000_000, "offset");
  return { term, limit, offset };
}

export function displayOrder(value: unknown): number {
  if (value === undefined) return 0;
  return positiveBoundedInteger(value, 0, MAX_DISPLAY_ORDER, "displayOrder");
}

function positiveBoundedInteger(value: unknown, min: number, max: number, label: string): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < min || value > max) {
    throw new KnowledgeGraphValidationError(`${label} must be an integer between ${min} and ${max}`);
  }
  return value;
}

const dangerousKeys = new Set(["__proto__", "prototype", "constructor"]);

export function safeMetadata(value: unknown): Record<string, unknown> {
  if (value === undefined || value === null) return {};
  if (typeof value !== "object" || Array.isArray(value) || Object.getPrototypeOf(value) !== Object.prototype) {
    throw new KnowledgeGraphValidationError("Metadata must be a plain object");
  }
  const keys = Object.keys(value);
  if (keys.length > MAX_METADATA_KEYS || keys.some((key) => dangerousKeys.has(key))) {
    throw new KnowledgeGraphValidationError("Metadata contains too many or prohibited keys");
  }
  inspectJson(value, new Set<object>());
  let encoded: string;
  try {
    encoded = JSON.stringify(value);
  } catch {
    throw new KnowledgeGraphValidationError("Metadata must be JSON serializable");
  }
  if (Buffer.byteLength(encoded, "utf8") > MAX_METADATA_BYTES) {
    throw new KnowledgeGraphValidationError("Metadata is too large");
  }
  return value as Record<string, unknown>;
}

function inspectJson(value: unknown, seen: Set<object>, depth = 0): void {
  if (depth > 8) throw new KnowledgeGraphValidationError("Metadata is too deeply nested");
  if (value === null || typeof value === "string" || typeof value === "boolean") return;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new KnowledgeGraphValidationError("Metadata contains an unsupported number");
    return;
  }
  if (typeof value !== "object") throw new KnowledgeGraphValidationError("Metadata contains an unsupported value");
  if (seen.has(value)) throw new KnowledgeGraphValidationError("Metadata must not contain cycles");
  seen.add(value);
  if (!Array.isArray(value) && Object.getPrototypeOf(value) !== Object.prototype) {
    throw new KnowledgeGraphValidationError("Metadata contains a non-plain object");
  }
  for (const key of Object.keys(value)) {
    if (dangerousKeys.has(key)) throw new KnowledgeGraphValidationError("Metadata contains a prohibited key");
    inspectJson((value as Record<string, unknown>)[key], seen, depth + 1);
  }
  seen.delete(value);
}

export function validateEntityRef(ref: EntityRef): EntityRef {
  positiveEntityId(ref.id);
  if (ref.type === "LOCATION") {
    if (ref.discriminator !== "STATE" && ref.discriminator !== "CITY") {
      throw new KnowledgeGraphValidationError("LOCATION requires a STATE or CITY discriminator");
    }
  } else if (ref.discriminator !== undefined) {
    throw new KnowledgeGraphValidationError("Only LOCATION accepts a discriminator");
  }
  return ref;
}

export async function validateRelationship(input: {
  source: EntityRef;
  relationshipType: RelationshipType;
  target: EntityRef;
  metadata?: unknown;
  displayOrder?: unknown;
}, adapters: ReadonlyMap<string, EntityAdapter>, duplicateExists?: () => Promise<boolean>) {
  validateEntityRef(input.source);
  validateEntityRef(input.target);
  if (!isValidRelationshipCombination(input.source.type, input.relationshipType, input.target.type)) {
    throw new KnowledgeGraphValidationError("Invalid source, relationship, and target combination");
  }
  if (input.source.type === input.target.type && input.source.id === input.target.id
      && input.source.discriminator === input.target.discriminator) {
    throw new KnowledgeGraphValidationError("Self-links are not allowed");
  }
  const sourceAdapter = adapters.get(input.source.type);
  const targetAdapter = adapters.get(input.target.type);
  if (!sourceAdapter || !targetAdapter) throw new KnowledgeGraphValidationError("Entity source is unsupported");
  if (!(await sourceAdapter.exists(input.source))) throw new KnowledgeGraphValidationError("Source entity does not exist");
  if (!(await targetAdapter.exists(input.target))) throw new KnowledgeGraphValidationError("Target entity does not exist");
  if (duplicateExists && await duplicateExists()) throw new KnowledgeGraphConflictError("Relationship already exists");
  return { ...input, metadata: safeMetadata(input.metadata), displayOrder: displayOrder(input.displayOrder) };
}

export function rejectDuplicateInput<T>(items: readonly T[], key: (item: T) => string): void {
  const keys = new Set<string>();
  for (const item of items) {
    const itemKey = key(item);
    if (keys.has(itemKey)) throw new KnowledgeGraphValidationError("Duplicate input");
    keys.add(itemKey);
  }
}