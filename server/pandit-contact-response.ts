import type { Response } from "express";
import type { GlobalContactMode } from "./pandit-contact-policy";

export function setPrivateContactResponse(res: Pick<Response, "setHeader">) {
  res.setHeader("Cache-Control", "private, no-store");
}

/** Deliberately contact-free: safe for anonymous status reads and logging. */
export function contactStatusDto(policy: GlobalContactMode, available: boolean, authenticated: boolean, quota: unknown) {
  return { policy, available, authenticated, quota };
}