import type { Response } from "express";
import type { GlobalContactMode } from "./pandit-contact-policy";

export function setPrivateContactResponse(res: Pick<Response, "setHeader">) {
  res.setHeader("Cache-Control", "private, no-store");
}

/** Deliberately contact-free: safe for anonymous status reads and logging. */
export function contactStatusDto(policy: GlobalContactMode, available: boolean, authenticated: boolean, quota: unknown) {
  const remaining = quota && typeof quota === "object" && "remaining" in quota
    ? Number((quota as { remaining?: unknown }).remaining) : null;
  const repeat = quota && typeof quota === "object" && "repeat" in quota
    ? (quota as { repeat?: unknown }).repeat === true : false;
  const state = !available ? "no_contact"
    : policy === "disabled" ? "disabled"
    : policy === "login_required" && !authenticated ? "login_required"
    : policy === "login_required" && repeat ? "repeat"
    : policy === "login_required" && remaining === 0 ? "exhausted"
    : policy === "login_required" ? "first_reveal"
    : "open";
  return { policy, available, authenticated, state, quota: quota && typeof quota === "object" && "repeat" in quota
    ? (({ repeat: _repeat, ...safeQuota }) => safeQuota)(quota as Record<string, unknown>) : quota };
}