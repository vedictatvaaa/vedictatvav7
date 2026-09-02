import { ENTITY_TYPES, type EntityType } from "./types";

export const RELATIONSHIP_TYPES = [
  "performed_by", "specializes_in", "available_in", "located_in", "offers",
  "related_to", "related_article", "related_product", "associated_with",
  "contains", "available_puja", "related_service", "related_tirth",
  "related_temple", "related_yatra", "discusses",
] as const;

export type RelationshipType = typeof RELATIONSHIP_TYPES[number];

export interface RelationshipDefinition {
  relationshipType: RelationshipType;
  sourceTypes: readonly EntityType[];
  targetTypes: readonly EntityType[];
}

const all = ENTITY_TYPES;
const content = ["PUJA", "PANDIT", "TIRTH", "TEMPLE", "PRODUCT", "ARTICLE", "SERVICE", "YATRA"] as const;

export const RELATIONSHIP_DEFINITIONS: readonly RelationshipDefinition[] = [
  { relationshipType: "performed_by", sourceTypes: ["PUJA", "SERVICE"], targetTypes: ["PANDIT"] },
  { relationshipType: "specializes_in", sourceTypes: ["PANDIT"], targetTypes: ["PUJA", "SERVICE"] },
  { relationshipType: "available_in", sourceTypes: ["PUJA", "SERVICE"], targetTypes: ["LOCATION"] },
  { relationshipType: "located_in", sourceTypes: ["PANDIT", "TIRTH", "TEMPLE"], targetTypes: ["LOCATION"] },
  { relationshipType: "offers", sourceTypes: ["PANDIT"], targetTypes: ["SERVICE"] },
  { relationshipType: "related_to", sourceTypes: all, targetTypes: all },
  { relationshipType: "related_article", sourceTypes: content, targetTypes: ["ARTICLE"] },
  { relationshipType: "related_product", sourceTypes: content, targetTypes: ["PRODUCT"] },
  { relationshipType: "associated_with", sourceTypes: ["REVIEW"], targetTypes: ["PUJA", "PANDIT", "PRODUCT", "SERVICE"] },
  { relationshipType: "contains", sourceTypes: ["TIRTH"], targetTypes: ["TEMPLE"] },
  { relationshipType: "available_puja", sourceTypes: ["TIRTH", "TEMPLE"], targetTypes: ["PUJA"] },
  { relationshipType: "related_service", sourceTypes: content, targetTypes: ["SERVICE"] },
  { relationshipType: "related_tirth", sourceTypes: content, targetTypes: ["TIRTH"] },
  { relationshipType: "related_temple", sourceTypes: content, targetTypes: ["TEMPLE"] },
  { relationshipType: "related_yatra", sourceTypes: content, targetTypes: ["YATRA"] },
  { relationshipType: "discusses", sourceTypes: ["ARTICLE"], targetTypes: ["PUJA", "SERVICE", "PRODUCT", "TIRTH", "TEMPLE", "YATRA"] },
] as const;

const entityTypeSet = new Set<string>(ENTITY_TYPES);
const relationshipTypeSet = new Set<string>(RELATIONSHIP_TYPES);

export function isEntityType(value: unknown): value is EntityType {
  return typeof value === "string" && entityTypeSet.has(value);
}

export function isRelationshipType(value: unknown): value is RelationshipType {
  return typeof value === "string" && relationshipTypeSet.has(value);
}

export function isValidRelationshipCombination(
  source: EntityType,
  relationship: RelationshipType,
  target: EntityType,
): boolean {
  return RELATIONSHIP_DEFINITIONS.some((definition) =>
    definition.relationshipType === relationship
    && definition.sourceTypes.includes(source)
    && definition.targetTypes.includes(target));
}

export function targetTypesFor(source: EntityType, relationship: RelationshipType): readonly EntityType[] {
  const result = new Set<EntityType>();
  for (const definition of RELATIONSHIP_DEFINITIONS) {
    if (definition.relationshipType === relationship && definition.sourceTypes.includes(source)) {
      definition.targetTypes.forEach((type) => result.add(type));
    }
  }
  return Array.from(result);
}