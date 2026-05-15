import type { Request, Response, NextFunction } from "express";
import { db } from "./db";
import { adminSessions, users } from "@shared/schema";
import { eq, gt, and } from "drizzle-orm";

export async function validateAdminSession(token: string): Promise<number | null> {
  if (!token) return null;
  const sessions = await db
    .select()
    .from(adminSessions)
    .where(and(eq(adminSessions.token, token), gt(adminSessions.expiresAt, new Date())))
    .limit(1);
  if (sessions.length === 0) return null;
  const user = await db.select().from(users).where(eq(users.id, sessions[0].userId)).limit(1);
  if (user.length === 0 || user[0].role !== "admin") return null;
  return user[0].id;
}

export interface AdminRequest extends Request {
  adminUserId?: number;
}

export function adminAuthMiddleware(req: AdminRequest, res: Response, next: NextFunction) {
  // Accept the admin session token from either the legacy `x-admin-token`
  // header (still used by every admin tab today) or the new `vt_admin_token`
  // httpOnly cookie set on login. The cookie is the secure path forward —
  // it is XSS-stealable only if the attacker can run `document.cookie`,
  // which httpOnly forbids. The header is kept for one release while we
  // migrate every admin call site away from localStorage.
  const headerToken = req.headers["x-admin-token"] as string | undefined;
  const cookieToken = (req as any).cookies?.vt_admin_token as string | undefined;
  const token = headerToken || cookieToken;
  if (!token) {
    res.status(401).json({ message: "Admin authentication required" });
    return;
  }

  // CSRF guard (15B). The vt_admin_token cookie is SameSite=Strict, which
  // already prevents the browser from attaching it to a cross-site form POST
  // — but defence-in-depth: for any state-changing method authenticated
  // ONLY by the cookie (no explicit x-admin-token header), require the
  // request's Origin (or Referer fallback) to match the host the API is
  // serving on. The header path is CSRF-immune by design (cross-origin JS
  // can't set a custom header without a successful CORS preflight, and we
  // don't allow cross-origin admin calls).
  const isMutation = req.method !== "GET" && req.method !== "HEAD" && req.method !== "OPTIONS";
  if (isMutation && !headerToken) {
    const origin = req.headers.origin as string | undefined;
    const referer = req.headers.referer as string | undefined;
    const host = req.headers.host as string | undefined;
    let okOrigin = false;
    if (host) {
      const expected = new Set([`https://${host}`, `http://${host}`]);
      if (origin && expected.has(origin)) okOrigin = true;
      else if (!origin && referer) {
        try { okOrigin = expected.has(new URL(referer).origin); } catch {}
      }
    }
    if (!okOrigin) {
      res.status(403).json({ message: "CSRF check failed: cross-origin request rejected" });
      return;
    }
  }
  validateAdminSession(token)
    .then((userId) => {
      if (!userId) {
        res.status(401).json({ message: "Invalid or expired admin session" });
        return;
      }
      req.adminUserId = userId;
      next();
    })
    .catch(() => res.status(500).json({ message: "Auth check failed" }));
}
