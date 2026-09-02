import type { Express } from "express";
import { db } from "../db";
import { createEntityAdapters } from "./entity-adapters";
import { KnowledgeGraphRepository } from "./repository";
import { KnowledgeGraphPublicProjector } from "./public-projection";
import { isEntityType } from "./registry";
import { KnowledgeGraphValidationError } from "./types";
import { positiveEntityId, validateEntityRef } from "./validation";

export function registerKnowledgeGraphPublicRoutes(app: Express, projector = new KnowledgeGraphPublicProjector(
  new KnowledgeGraphRepository(db), createEntityAdapters(db),
)) {
  app.get("/api/knowledge-graph/related/:type/:id", async (req, res) => {
    let ref: any;
    try {
      if (!isEntityType(req.params.type)) throw new KnowledgeGraphValidationError("Unknown entity type");
      ref = validateEntityRef({ type: req.params.type, id: positiveEntityId(Number(req.params.id)),
        discriminator: req.query.discriminator as any });
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
    try {
      return res.json(await projector.project(ref));
    } catch (error: any) {
      console.warn("[knowledge-graph-public] projection unavailable", {
        source: `${ref.type}:${ref.discriminator || "NONE"}`, errorClass: error?.constructor?.name || "Error",
      });
      return res.json({ groups: [] });
    }
  });
  return projector;
}
