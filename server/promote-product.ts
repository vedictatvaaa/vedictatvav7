import type { Express, Request, Response } from "express";
import { adminAuthMiddleware } from "./admin-auth";
import { storage } from "./storage";
import { pushSingleProduct, buildPromoteLinks } from "./google-merchant";
import { pingIndexNowAsync } from "./indexnow";

export function registerPromoteProductRoutes(app: Express) {
  // Returns share/promotion links + Merchant Center push readiness for ONE product
  app.get("/api/admin/products/:id/promote-links", adminAuthMiddleware, async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const product = await storage.getProduct(id);
      if (!product) return res.status(404).json({ message: "Product not found" });

      const baseUrl = process.env.PUBLIC_SITE_URL || `${req.protocol}://${req.get("host")}`;
      const links = buildPromoteLinks(product, baseUrl);
      const apiConfigured = !!(process.env.GOOGLE_MERCHANT_ID && process.env.GOOGLE_SERVICE_ACCOUNT_JSON);

      // Pre-flight readiness so the UI can warn before a failed push
      const issues: string[] = [];
      if (!product.image) issues.push("Missing primary image");
      if (!(product as any).description) issues.push("Missing description");
      if (product.stock <= 0) issues.push("Out of stock");
      if (!product.price || product.price <= 0) issues.push("Invalid price");
      if (!(product as any).brand) issues.push("Brand recommended for higher Merchant Center quality score");
      if (!(product as any).upcEan) issues.push("GTIN/UPC recommended (or set identifierExists=false)");

      res.json({
        product: {
          id: product.id,
          name: product.name,
          price: product.price,
          stock: product.stock,
          image: product.image,
          slug: (product as any).slug,
        },
        ...links,
        merchantApiConfigured: apiConfigured,
        publicSiteUrlSet: !!process.env.PUBLIC_SITE_URL,
        readiness: { ready: issues.length === 0, issues },
      });
    } catch (err: any) {
      console.error("[promote-links] error:", err);
      res.status(500).json({ message: err?.message || "Failed to build promote links" });
    }
  });

  // One-click push: send THIS product to Google Merchant Center via Content API
  // and ping IndexNow for the product URL so all engines re-crawl immediately.
  app.post("/api/admin/products/:id/promote", adminAuthMiddleware, async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const product = await storage.getProduct(id);
      if (!product) return res.status(404).json({ message: "Product not found" });

      const baseUrl = process.env.PUBLIC_SITE_URL || `${req.protocol}://${req.get("host")}`;
      const productUrl = `${baseUrl}/product/${(product as any).slug || product.id}`;

      // Always ping IndexNow — works even without Merchant Center configured
      pingIndexNowAsync([productUrl]);

      const apiConfigured = !!(process.env.GOOGLE_MERCHANT_ID && process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
      if (!apiConfigured) {
        return res.json({
          success: true,
          merchantPushed: false,
          indexNowPinged: true,
          productUrl,
          message: "IndexNow pinged. Configure GOOGLE_MERCHANT_ID + GOOGLE_SERVICE_ACCOUNT_JSON to also push to Google Merchant Center.",
        });
      }

      const push = await pushSingleProduct(product, baseUrl);
      res.json({
        success: push.success,
        merchantPushed: push.success,
        indexNowPinged: true,
        productUrl,
        offerId: push.offerId,
        warnings: push.warnings,
        message: push.message,
      });
    } catch (err: any) {
      console.error("[promote] error:", err);
      res.status(500).json({ message: err?.message || "Failed to promote product" });
    }
  });
}
