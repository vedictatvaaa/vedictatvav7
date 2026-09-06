import type { RequestHandler } from "express";
import { db } from "./db";
import { storage } from "./storage";
import { authorizePanditSession, type PanditAuthorization } from "./pandit-portal";
import { products } from "@shared/schema";
import { eq } from "drizzle-orm";

export type MembershipCardRouteProduct = {
  id: number;
  slug: string | null;
  name: string;
  description: string | null;
  image: string | null;
  category: string | null;
  productType: string | null;
  price: number | null;
  salePrice?: number | null;
  stock: number | null;
  variationGroupId: string | null;
  variationLabel: string | null;
  [key: string]: unknown;
};

export type MembershipCardRouteDependencies = {
  authorize: (token?: string) => Promise<PanditAuthorization>;
  getPandit: (panditId: number) => Promise<any>;
  listProducts: () => Promise<MembershipCardRouteProduct[]>;
};

export function isPanditEligibleForMembershipCardOrder(pandit: any): boolean {
  return pandit?.verified === true
    && typeof pandit.registrationNo === "string"
    && /^\d{10}$/.test(pandit.registrationNo);
}

async function listMembershipCardProducts(): Promise<MembershipCardRouteProduct[]> {
  return db.select().from(products)
    .where(eq(products.productType, "pandit_membership_card")) as Promise<MembershipCardRouteProduct[]>;
}

const defaultDependencies: MembershipCardRouteDependencies = {
  authorize: authorizePanditSession,
  getPandit: (panditId) => storage.getPandit(panditId),
  listProducts: listMembershipCardProducts,
};

export function createMembershipCardProductsHandler(
  overrides: Partial<MembershipCardRouteDependencies> = {},
): RequestHandler {
  const dependencies = { ...defaultDependencies, ...overrides };

  return async (req, res) => {
    const token = (req.headers["x-pandit-token"] as string | undefined) || req.cookies?.pandit_token;
    const authorization = await dependencies.authorize(token);
    if (authorization.panditId == null) {
      return res.status(authorization.status).json({
        message: authorization.error,
        ...(authorization.code ? { code: authorization.code } : {}),
      });
    }

    const pandit = await dependencies.getPandit(authorization.panditId);
    if (!isPanditEligibleForMembershipCardOrder(pandit)) {
      return res.status(403).json({
        message: "An approved Pandit membership is required to view membership cards",
      });
    }

    const cardProducts = (await dependencies.listProducts())
      .filter(product => product.variationGroupId === "pandit-membership-card")
      .map(product => ({
        id: product.id,
        slug: product.slug,
        name: product.name,
        description: product.description,
        image: product.image,
        category: product.category,
        productType: product.productType,
        price: (product.salePrice && product.salePrice > 0) ? product.salePrice : product.price,
        stock: product.stock,
        available: (product.stock ?? 0) > 0,
        variationGroupId: product.variationGroupId,
        variationLabel: product.variationLabel,
      }));

    return res.json({ variationGroupId: "pandit-membership-card", products: cardProducts });
  };
}