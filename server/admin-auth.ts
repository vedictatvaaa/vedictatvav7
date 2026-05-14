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
  const token = req.headers["x-admin-token"] as string | undefined;
  if (!token) {
    res.status(401).json({ message: "Admin authentication required" });
    return;
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
