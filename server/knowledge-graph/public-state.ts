import { eq, sql } from "drizzle-orm";
import { knowledgeGraphPublicState } from "@shared/schema";

/** Must be called on the transaction which performed the visible mutation. */
export async function advanceKnowledgeGraphGeneration(tx: any): Promise<number> {
  const [state] = await tx.update(knowledgeGraphPublicState).set({
    generation: sql`${knowledgeGraphPublicState.generation} + 1`,
    updatedAt: new Date(),
  }).where(eq(knowledgeGraphPublicState.id, 1)).returning({ generation: knowledgeGraphPublicState.generation });
  if (!state) throw new Error("Knowledge Graph public state singleton is missing");
  return state.generation;
}
