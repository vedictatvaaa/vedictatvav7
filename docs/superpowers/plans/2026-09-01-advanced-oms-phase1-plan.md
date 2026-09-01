# Advanced OMS Phase 1 Implementation Plan

**Design:** `docs/superpowers/specs/2026-09-01-advanced-oms-phase1-design.md`  
**Status:** Ready for implementation

## Goal

Upgrade the existing Admin → Orders tab into a server-authoritative operational
command centre while preserving the current order snapshots, checkout, payment,
invoice, dispatch, Shiprocket, customer, and admin-authentication behavior.

## Non-goals

- Inventory reservation, deduction, or restoration
- Picking and packing quantity workflows
- Partial fulfilment or warehouse-wide pick lists
- Automated refunds or new payment-provider behavior
- New courier integration or fabricated tracking
- Relational order-item migration
- New GST/accounting rules

## Existing contracts to preserve

- `orders.items` remains the historical purchased-item snapshot.
- Historical totals come from stored order fields, never current product prices.
- Existing invoice, dispatch, Shiprocket, return, notification, and customer
  tracking routes remain compatible.
- `adminAuthMiddleware` remains the authorization boundary.
- Existing Admin Orders bulk/document controls remain usable.
- Reading an order never changes product stock.

## Work breakdown

### 1. Add append-only status events

Files:

- `shared/schema.ts`
- `server/storage.ts`
- `migrations/0003_order_status_events.sql`

Add an `order_status_events` table with:

- order reference
- previous and next status
- actor type and optional actor label
- optional reason
- timestamp

Add indexes for order/timestamp lookup. Add storage methods to list events and
perform an atomic conditional order-status update plus event insert. Repeated
requests for the current target status must be no-ops without duplicate events.

### 2. Implement the status and next-action policy

Files:

- `server/order-operations.ts`
- `server/order-operations.test.ts`

Implement pure helpers for:

- normalization of existing and canonical status values
- legacy aliases
- allowed transitions
- recommended next action
- terminal and exception states
- human-readable validation failures
- ageing classification

Keep the policy independent from Express and Drizzle so all transition and
summary paths can use one tested source of truth.

### 3. Build operational order projections

Files:

- `server/order-operations.ts`
- `server/storage.ts`
- focused tests

Add projection helpers that safely derive:

- item and unit counts
- unique SKU count
- inventory verification using unambiguous product ID/SKU matches
- payment display state
- shipping/dispatch state
- ageing and stale state
- recommended next action and allowed transitions

Unknown item identifiers return unable-to-verify. No projection may mutate an
order, product, invoice, or dispatch.

### 4. Extend server-side search and filters

Files:

- `server/storage.ts`
- `server/routes.ts`
- focused tests

Extend the existing paginated admin query with supported combinations:

- free-text order/customer/email/phone/product/SKU/payment ID/AWB
- order status
- payment method
- start/end date
- state/city where stored
- min/max amount
- operational view

Keep pagination and sorting server-side. Validate and bound all query values.

### 5. Extend the admin summary and action-required model

Files:

- `server/order-operations.ts`
- `server/routes.ts`
- focused tests

Return dynamic:

- today’s order/revenue/unit totals
- COD/prepaid totals
- awaiting confirmation/picking/packing
- ready to dispatch
- dispatched today
- stale orders
- returns/refunds
- stock-warning count

Every action-required item contains the matching filter/view key so clicking it
reproduces the server-owned set.

### 6. Add the protected order workspace DTO

Files:

- `server/routes.ts`
- `server/storage.ts`
- `server/order-operations.ts`

Extend the protected order detail response with:

- safe historical item projection
- stored total breakdown
- customer and address snapshot
- stored payment information
- related invoice, dispatch, return, and status events
- inventory verification
- timeline milestones
- current status policy metadata

Do not return invented timestamps or values. Label inferred milestones.

### 7. Route status mutations through the policy

Files:

- `server/routes.ts`
- `server/storage.ts`
- focused tests

Replace direct status assignment in the existing admin mutation path with the
shared transition service. Preserve the current response compatibility where
possible and add structured transition errors.

Bulk status mutations must use the same service per order and return individual
success/failure results. Existing invoice/dispatch/payment side effects are not
duplicated.

### 8. Build reusable Admin Orders components

Files:

- `client/src/components/admin/orders/OrderKpiGrid.tsx`
- `client/src/components/admin/orders/ActionRequired.tsx`
- `client/src/components/admin/orders/OrderStatusBadge.tsx`
- `client/src/components/admin/orders/OrderWorkspace.tsx`
- focused support files under `client/src/components/admin/orders/`

Create typed, focused components for:

- operational KPI cards
- action-required links
- status/payment/shipping badges
- next-action control
- historical item list
- inventory verification
- customer/payment/shipping summary
- timeline/activity

Use the existing admin design primitives and maroon/cream/gold visual language.

### 9. Upgrade the existing OrdersTab

Files:

- `client/src/pages/admin-tabs/OrdersTab.tsx`

Integrate:

- KPI and action-required responses
- URL-backed quick views and supported filters
- enhanced order cards/rows
- full-card order workspace opening
- responsive sheet/drawer state
- status transition mutation with fresh-query invalidation

Keep existing documents, dispatch, Shiprocket, pagination, and bulk actions.
Normalize all new fetches and mutations through the existing admin-auth fetcher.

### 10. Verify migration and behavior

Run:

1. focused order-operations and route/storage tests
2. existing order/payment/invoice/dispatch tests
3. database schema push
4. production build
5. workflow restart and server-log check
6. browser verification on desktop and 390px mobile

Browser flows:

- KPIs and action-required filters
- server-side search/filter combinations
- order workspace loading, success, missing-data, and close states
- valid transition and resulting timeline event
- invalid transition rejection
- existing invoice/dispatch/Shiprocket actions remain present
- no inventory mutation from opening an order
- no horizontal mobile overflow

## Rollout order

1. Add migration and storage support.
2. Add/test pure status and projection services.
3. Extend list/summary/detail APIs.
4. route status changes through policy.
5. Add client components and OrdersTab integration.
6. apply schema and restart workflow.
7. run server and browser verification.

No destructive migration or removal of existing order fields is allowed.

## Release gates

- transition-policy tests pass
- operational summary/filter tests pass
- status-event idempotency is verified
- `git diff --check` passes
- production build passes
- migration applies cleanly
- workflow starts without a new server error
- desktop and mobile browser flows pass
- opening an order does not change inventory
- GitHub sync occurs only after all checks pass