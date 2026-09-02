export const ENTITY_TYPES = [
  "PUJA", "PANDIT", "LOCATION", "TIRTH", "TEMPLE",
  "PRODUCT", "ARTICLE", "SERVICE", "REVIEW", "YATRA",
] as const;

export type EntityType = typeof ENTITY_TYPES[number];
export type LocationKind = "STATE" | "CITY";

export interface EntityRef {
  type: EntityType;
  id: number;
  discriminator?: LocationKind;
}

export interface AdminEntityDto extends EntityRef {
  name: string;
  status: string;
  url: string | null;
  updatedAt: string | null;
  summary: Readonly<Record<string, string | number | boolean | null>>;
}

export interface EntitySearch {
  term: string;
  limit: number;
  offset: number;
  discriminator?: LocationKind;
  /** Normalized Admin status; adapters may push this down when representable. */
  status?: string;
}

export interface EntityAdapter {
  readonly type: EntityType;
  get(ref: EntityRef): Promise<AdminEntityDto | null>;
  exists(ref: EntityRef): Promise<boolean>;
  search(input: EntitySearch): Promise<AdminEntityDto[]>;
}

export class UnsupportedEntitySourceError extends Error {
  constructor(public readonly entityType: EntityType) {
    super(`Knowledge Graph source ${entityType} is not supported by a current canonical source`);
    this.name = "UnsupportedEntitySourceError";
  }
}

export class KnowledgeGraphValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "KnowledgeGraphValidationError";
  }
}

/** A stable public error for both optimistic and database-enforced duplicates. */
export class KnowledgeGraphConflictError extends Error {
  constructor(message = "Relationship or quality rule already exists") {
    super(message);
    this.name = "KnowledgeGraphConflictError";
  }
}

export class KnowledgeGraphGateBlockedError extends Error {
  constructor(public readonly report: unknown) {
    super("Knowledge Graph public enablement checks failed");
    this.name = "KnowledgeGraphGateBlockedError";
  }
}