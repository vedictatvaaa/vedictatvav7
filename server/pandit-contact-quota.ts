// Compatibility exports for callers that still use the pre-ledger module
// name. All entitlement calculations now live in the append-only ledger.
export {
  claimPanditContactQuota,
  getPanditContactQuota,
  hasPanditContactEntitlement,
} from "./pandit-contact-entitlements";
export { hasPanditContactEntitlement as hasPanditContactReveal } from "./pandit-contact-entitlements";