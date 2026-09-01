# Vedic Tatva Advanced Order Management System — Phase 1

**Date:** 2026-09-01  
**Status:** Approved design  
**Scope:** Incremental Admin Orders command-centre upgrade

## Purpose

Upgrade the existing Admin → Orders experience into a reliable operational
command centre without replacing the current checkout, payment, invoice,
dispatch, Shiprocket, customer, or authentication architecture.

Phase 1 establishes the administrative foundation:

- dynamic operational KPIs and action-required queues
- server-side order search and combinable filters
- a shared, server-validated status-transition policy
- idempotent status actions and append-only transition events
- smart recommended next actions
- a responsive order detail workspace
- read-only inventory verification and ageing indicators

This phase is intentionally not a complete warehouse, accounting, or returns
system. It must surface existing invoice and shipping capabilities without
fabricating unsupported payment, courier, refund, or stock behavior.

## Current architecture to preserve

- The application is React + Vite on the client and Express + Drizzle ORM on
  the server, backed by PostgreSQL.
- Admin authorization uses the existing admin authentication middleware and
  token conventions.
- `orders` is the commerce source of truth. Its customer fields, addresses,
  totals, payment fields, status, and `items` JSON are retained.
- `orders.items` is a historical order-item snapshot. Phase 1 never rebuilds
  historical prices, tax, discounts, names, or SKUs from current products.
- `products.stock` is the current product stock field. It is used only for
  read-only verification in this phase.
- Existing invoices, dispatches, Shiprocket actions, return tickets,
  notification records, customer order history, and order timeline components
  remain in place.
- Existing Admin Orders routes and UI behavior remain compatible while the new
  workspace and operational metadata are added.
- No second order, payment, inventory, customer, invoice, or shipping system is
  introduced.

## Product experience

### Command centre

The existing `OrdersTab` remains the entry point. Its header gains dynamic
operational summaries for the selected day or supported date scope:

- today's orders
- today's revenue
- total items today
- awaiting confirmation
- awaiting picking
- awaiting packing
- ready to dispatch
- dispatched today
- stale orders
- COD orders
- prepaid orders
- returns/refunds

Every value is calculated on the server from actual records. No count or
revenue value is hardcoded or inferred from the currently visible page.

### Action required

Below the KPI row, the page displays an action-required section. Each item is
a URL-backed filter action, not a separate dataset. Examples include:

- paid orders awaiting confirmation
- confirmed orders awaiting picking
- picked orders awaiting packing
- packed orders awaiting dispatch
- orders with a verified shortage
- orders beyond the configured ageing threshold

If a category has no records, it remains available only where the existing UI
pattern makes the empty state useful; it must not display a misleading alert.

### Order list

Each existing order row/card is enhanced with:

- order number, customer, and placed date/time
- historical item count, unit count, and total
- payment method and payment state
- fulfilment/order status
- dispatch/shipping state when a dispatch exists
- ageing indicator
- inventory verification indicator
- recommended next action

The full row/card is an order-detail target. Existing inline document,
dispatch, Shiprocket, and bulk controls remain available and continue to use
their existing capabilities.

### Order workspace

Selecting an order opens an admin-only responsive detail sheet or drawer.
Desktop uses a main column plus a supporting sidebar; mobile stacks the same
sections without horizontal page overflow.

The workspace contains:

1. **Header and next action**
   - order number, placed timestamp, total, payment badge, status badge
   - recommended action and reason when unavailable

2. **Order summary**
   - item and unique-SKU counts
   - stored subtotal, discount, coupon, shipping, tax/GST, and grand total
   - no recalculation from current product prices

3. **Historical items**
   - product image where available
   - snapshot product name, SKU, variant/pack data, quantity, unit price,
     discount, tax, and line total
   - explicit “Not recorded” for absent historical fields

4. **Inventory verification**
   - required quantity and current available quantity when a safe product/SKU
     match exists
   - ready, short-by, or unable-to-verify states
   - no inventory mutation on read

5. **Customer and addresses**
   - customer name, email, phone, shipping address, and billing address from
     the order snapshot
   - call/email actions only where the existing environment supports them

6. **Payment**
   - stored payment status, method, amount, payment ID, and available payment
     date
   - COD is shown as payment pending where the stored records indicate COD
   - refund information is shown only from actual refund records

7. **Shipping and dispatch**
   - existing courier, AWB/tracking number, shipment ID, dispatch date,
     expected delivery, stored tracking URL, and Shiprocket state
   - existing supported actions only

8. **Timeline and activity**
   - order creation and available existing milestones
   - new status-transition events recorded after rollout
   - actual timestamps only; inferred milestones are labeled as such

9. **Documents**
   - existing invoice view/download/print behavior
   - existing packing-slip or dispatch document behavior where supported

The workspace provides loading, not-found, authorization, stale-data, and
recoverable-error states. Closing the workspace does not mutate the order.

## Status policy

### Canonical operational states

The transition policy uses these canonical states where the current business
workflow supports them:

```text
PLACED
PAYMENT_PENDING
PAID
CONFIRMED
PICKING
PACKING
PACKED
READY_TO_DISPATCH
DISPATCHED
IN_TRANSIT
OUT_FOR_DELIVERY
DELIVERED
```

Exception states are:

```text
CANCELLED
REFUND_PENDING
REFUNDED
RETURN_REQUESTED
RETURNED
FAILED
```

The implementation must first map the actual existing values such as
`pending`, `processing`, `shipped`, `dispatched`, and `out_for_delivery`.
Compatibility aliases are preferred over a destructive data rewrite.

### Transition rules

The server owns the allowed transition map. The client may hide unavailable
buttons for clarity, but backend validation is mandatory.

The normal operational path is:

```text
PLACED → PAYMENT_PENDING or PAID
PAID → CONFIRMED
CONFIRMED → PICKING
PICKING → PACKING
PACKING → PACKED
PACKED → READY_TO_DISPATCH
READY_TO_DISPATCH → DISPATCHED
DISPATCHED → IN_TRANSIT
IN_TRANSIT → OUT_FOR_DELIVERY
OUT_FOR_DELIVERY → DELIVERED
```

Exception transitions are allowed only from states where the current payment,
inventory, and shipping architecture can safely support them. Phase 1 does
not implement automated refunds, inventory restoration, or return processing;
it only preserves and surfaces existing records and actions.

An invalid request, including `DELIVERED → PACKED`, returns a structured
validation response and leaves the order unchanged.

### Smart next action

The server derives one recommended next action from the actual current state
and operational prerequisites. Examples:

| Current state | Recommended action |
|---|---|
| `PAID` | Confirm order |
| `CONFIRMED` | Start picking |
| `PICKING` | Start packing |
| `PACKING` | Complete packing |
| `PACKED` | Prepare dispatch |
| `READY_TO_DISPATCH` | Mark dispatched |
| `DISPATCHED` | Track shipment |
| `DELIVERED` | No further operational action |

The action is unavailable when the prerequisite is not met, such as a
verified inventory shortage or missing dispatch capability. The response
includes a reason rather than silently presenting a button that cannot work.

## Data model additions

Because the current schema has no authoritative status history, add a minimal
append-only `order_status_events` table:

- event ID
- order ID
- previous status
- next status
- actor type and available actor label from the existing admin auth
- optional reason
- event timestamp

The table records transitions made after this feature is installed. Existing
orders are not backfilled with invented status timestamps. The existing order
creation time remains the source for the placed milestone, while existing
dispatch and notification data supplies other available milestones.

The table must support lookup by order ID and chronological ordering. Repeated
requests that find the order already at the requested target state are
idempotent and do not create duplicate events.

## API boundaries

### Admin order list

Extend the existing paginated Admin Orders read model to return operational
metadata alongside each order. Supported server-side filters include:

- order number
- customer name, email, or phone
- SKU or product name from the stored item snapshot
- AWB/tracking number where a dispatch exists
- payment ID
- order status
- payment method
- date range
- state/city where recorded
- supported amount range

Filters are combinable and pagination remains server-side. Unsupported
concepts are not presented as pretend filters.

### Operational summary

Extend the existing admin summary route or its response contract to return
the KPI and action-required values for the requested date scope. The same
status normalization used by the list and transition service must be used by
the summary so counts cannot disagree with visible order badges.

### Order detail

Extend the protected admin order detail response with:

- snapshot-safe item lines and totals
- payment and address fields already stored on the order
- related dispatch, invoice, and return information
- status events and available timeline milestones
- derived ageing
- derived inventory verification
- current allowed transitions and recommended next action

Raw rows are not returned where a purpose-built response object is safer.
Customer information remains protected by the existing admin middleware.

### Status mutation

The existing single-order status mutation and bulk status actions must call
the shared transition service. The service must:

1. validate the order and requested target state
2. validate the current state and transition
3. perform a conditional update so stale tabs cannot overwrite a newer state
4. append one transition event for a successful state change
5. return the updated operational metadata

The operation does not deduct stock, generate a second invoice, create a
second shipment, or initiate a refund.

## Inventory verification

Inventory is read-only in Phase 1. For each stored item:

1. Prefer an explicit product ID or SKU from the historical snapshot.
2. Match to a current product only when the identifier is unambiguous.
3. Compare required quantity with current available stock.
4. Report ready or shortage when the comparison is reliable.
5. Report unable to verify when no safe match exists.

Different SKUs are never consolidated for the purpose of an individual order
shortage calculation. No order view, filter, status action, or summary query
changes `products.stock`.

## Ageing and stale orders

Ageing is derived from the actual order creation timestamp and the current
time. Existing SLA or admin settings are used if present. If no configured
threshold exists, the feature uses a clearly named operational default only
for visual sorting and marks the result as an operational ageing indicator,
not a customer promise. The implementation must not represent an arbitrary
threshold as a contractual SLA.

The stale filter uses the same threshold and status policy as the action
required section, ensuring an order cannot appear stale in one place and
current in another.

## Error handling and security

- All new reads and mutations use the existing admin authentication path.
- Unauthorized users receive the existing authorization response shape.
- Missing orders return a clear not-found response without internal details.
- Invalid transitions return current state, allowed actions, and a readable
  validation message.
- Stock lookup errors show unable-to-verify, never ready or shortage by
  accident.
- Missing historical values show not recorded, never a value reconstructed
  from current product data.
- Existing invoice, dispatch, Shiprocket, and payment actions are disabled or
  omitted when their actual capability is unavailable.
- Concurrent mutation responses invalidate the affected order and list data.
- Customer notes and internal admin activity are kept distinct. Phase 1 does
  not expose internal notes to customers.
- All new status events are append-only from the application surface.

## Rollout

1. Add the status-event migration and storage methods.
2. Implement and test the shared status/next-action service.
3. Extend admin list, summary, and detail DTOs with operational metadata.
4. Route single and bulk status updates through the transition service.
5. Add the command-centre KPI/action-required section.
6. Add the responsive order workspace.
7. Verify existing invoice, dispatch, Shiprocket, and order-history behavior.
8. Apply the migration, restart the workflow, and run browser smoke checks.

The previous Admin Orders list and existing document/shipping actions remain
available throughout rollout. A failure in new derived metadata must not make
the underlying order unavailable; it should produce a visible error state and
preserve the existing record view.

## Testing and acceptance

### Server tests

- canonical transition acceptance and rejection
- legacy status alias compatibility
- rejection of impossible transitions
- idempotent repeated status actions
- conditional update behavior for stale concurrent requests
- one event per successful state change
- dynamic KPI calculations
- action-required counts
- search by order/customer/SKU/AWB/payment ID
- combinable filters and pagination
- ageing calculation from actual timestamps
- safe inventory matching, shortage, and unknown-SKU handling
- historical totals and item snapshots remain unchanged
- admin authorization on new reads and mutations

### Browser verification

- Admin Orders loads with dynamic KPIs and action-required items.
- Clicking an action-required item applies the correct filter.
- Search, status, payment, date, and supported operational filters combine
  correctly.
- An order card opens the detail workspace and shows actual stored values.
- Valid next action succeeds and refreshes the list/workspace.
- Invalid transition shows an error without changing the order.
- Opening and closing the workspace does not change inventory.
- Existing invoice, dispatch, and Shiprocket actions still behave as before.
- Missing or unsupported data renders safe empty/error states.
- Desktop and 390px mobile layouts have no horizontal overflow.
- Keyboard focus, labels, close behavior, and status communication are
  accessible.

### Release gates

- focused server tests pass
- production build passes
- database migration applies cleanly
- workflow restarts and serves the application
- browser smoke checks pass on desktop and mobile
- no new browser console or server errors are introduced
- existing order/payment/invoice/dispatch tests remain green

## Explicitly deferred

These are separate implementation slices and must not be faked in Phase 1:

- picking mode and warehouse-wide consolidated pick lists
- packing mode and partial fulfilment
- inventory reservation, deduction, and restoration
- new payment ledger or payment-provider behavior
- automated refund execution
- return approval/receipt processing
- courier API or fabricated live tracking
- new invoice accounting rules or GST configuration
- relational order-item migration
- customer-facing order status changes
- configurable SLA administration if no existing settings surface supports it

Later slices must reuse this status policy, historical order snapshot, admin
authorization, and event model rather than creating parallel order workflows.