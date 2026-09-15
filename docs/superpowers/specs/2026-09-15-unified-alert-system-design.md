# Unified Panchang and Puja Alert System Design

**Date:** 2026-09-15  
**Status:** Approved for specification review  
**Product:** Vedic Tatva

## 1. Purpose

Vedic Tatva needs one reliable alert platform for Panchang events, Puja bookings,
orders, Pandit operations, and Admin operations. The platform must support
customers, users with active Puja or order activity, Pandits, and Admins across
in-app notifications, visual overlays, email, SMS, WhatsApp, web push/PWA, and a
native Android client.

The system must be enabled by default for normal product alerts while giving
users clear category, channel, timing, and sound opt-out controls. It must be
provider-independent so future channels and providers can be added without
rewriting booking or Panchang logic.

This document defines the approved architecture and behavior. It does not
authorize implementation until this specification has been reviewed.

## 2. Current project context

The existing project already contains:

- Client-side Panchang event classification with event categories, themed cells,
  motifs, monthly highlights, PDF exports, and ICS calendar reminders.
- MSG91 SMS and WhatsApp delivery code for Puja journeys.
- A durable Hostinger SMTP transactional email outbox with encryption,
  idempotency, retry handling, and failure tracking.
- Customer and Pandit in-app notification tables and inbox behavior.
- An Admin notification screen for provider readiness, transactional email
  queue inspection, retries, and test sends.

The existing pieces are not a unified alert system:

- Panchang classification does not create scheduled alert subscriptions.
- Panchang alerts are not first-class inbox events.
- SMS is largely fire-and-forget compared with the durable email outbox.
- Customer and Pandit notification records are separate from outbound delivery
  history.
- Admin controls focus on booking-channel readiness rather than event
  definitions, preferences, templates, devices, overlays, or delivery health.

The implementation should extend these capabilities through a central
orchestrator instead of creating another parallel notification subsystem.

## 3. Approved architecture

Use a central, PostgreSQL-backed alert orchestrator inside the existing server
application. Do not start with microservices.

The system is organized into five boundaries:

1. **Domain events** — Panchang, booking, order, payment, Pandit, and Admin
   features emit canonical events.
2. **Alert policy** — resolves recipients, event classification, preferences,
   quiet hours, language, channel capability, and premium sound behavior.
3. **Durable delivery ledger** — stores one idempotent delivery record per
   recipient and channel, including retries and final status.
4. **Channel adapters** — send through MSG91, Hostinger SMTP, web push, native
   Android push, in-app, and visual overlay channels.
5. **Client capability registration** — records web and Android device
   permissions and capabilities without making any client the system of record.

The flow is:

```text
Domain event
  -> Alert event
    -> Audience resolution
      -> Preference and quiet-hour policy
        -> Channel delivery records
          -> Provider adapters
            -> Delivery status and audit history
```

Domain features must not send SMS, email, push, or WhatsApp directly. They
create an alert event or call a shared alert service that creates one.

### 3.1 Future-proofing rules

- The alert database, not an external provider, is the system of record.
- Provider-specific payloads stay inside adapters.
- Every delivery is idempotent and independently retryable.
- New channels must implement the shared adapter contract rather than add
  feature-specific send logic.
- Web and native Android clients consume the same alert API and preference
  model.
- A future iOS, Telegram, voice, or other client can register capabilities
  without changing event producers.
- Managed push providers may be added later as adapters; they must not own the
  canonical event, preference, or delivery history.

## 4. Core data model

The implementation should introduce these concepts as additive schema changes.
Exact table names may follow existing naming conventions.

### 4.1 Alert events

An alert event represents a business occurrence or a scheduled reminder.

Required concepts:

- Domain and event type
- Related object type and ID
- Audience
- Structured, safe payload
- Event-local date and time
- Scheduled delivery time
- Stable deduplication key
- Template version
- Created and processed timestamps

Examples:

- `panchang.sacred_day_upcoming`
- `booking.created`
- `booking.accepted`
- `booking.reminder_due`
- `samagri.updated`
- `order.shipped`
- `payment.received`
- `admin.provider_outage`

### 4.2 Alert deliveries

One delivery row must exist for each recipient and channel:

- `in_app`
- `visual_overlay`
- `email`
- `sms`
- `whatsapp`
- `web_push`
- `android_push`

Each delivery records status, attempts, scheduled time, sent time, safe error
text, provider message ID when available, and timestamps. Statuses should
include queued, processing, sent, skipped, retrying, and failed.

### 4.3 Preferences

Preferences are scoped to a user, Pandit, or Admin and include:

- Category enabled/disabled
- Channel enabled/disabled
- Language
- Timezone
- Preferred daily send time
- Quiet hours
- Visual overlay setting
- Web push permission state
- Android push permission state
- Lock-screen setting
- OM-chime setting

Defaults are enabled for normal product alerts. Preference changes affect
future deliveries and do not retroactively resend or cancel a delivery that has
already been sent.

### 4.4 Device subscriptions

Web and native clients register a protected device endpoint or push token with:

- Platform
- Endpoint/token reference
- Permission state
- App/browser version
- Last active time
- Revoked/expired state
- Owning account

Raw tokens must not be displayed in Admin screens.

### 4.5 Templates and visual assets

Each event type may have channel-specific content:

- SMS content
- Email subject and HTML
- In-app title and body
- Push title and body
- Overlay layout
- Optional push image
- English and Hindi variants
- Version and activation status

The first visual implementation should use deterministic templates and the
existing Panchang motifs rather than require AI-generated artwork for every
alert.

## 5. Audience and alert taxonomy

### 5.1 Devotees and customers

Default-on product alerts:

- All classified sacred Panchang events
- Account and security notices
- Relevant saved-location or Panchang updates
- Booking and order updates when applicable

Separately managed optional alerts:

- Devotional content
- Puja recommendations
- Promotions and marketing campaigns

Promotional messaging must retain normal consent and unsubscribe requirements,
even though product alerts are enabled by default.

### 5.2 Users with active Puja or order activity

Transactional events include:

- Booking created
- Payment confirmed
- Pandit assigned
- Pandit accepted or declined
- Booking reminder
- Reschedule or cancellation
- Samagri list sent or updated
- Puja completed
- Order confirmed
- Order shipped
- Out for delivery
- Delivered
- Refund initiated
- Failure or escalation

Users may choose channels, but the system must preserve a reliable
transactional path where required by the event and applicable law.

### 5.3 Pandits and service providers

Events include:

- New booking offer
- Booking accepted or declined
- Customer message
- Schedule change
- Upcoming Puja reminder
- Payment or settlement update
- Customer cancellation
- Admin escalation
- Approval and account status

Existing contact-release rules remain in force. Alerts must not expose customer
contact details before the booking is eligible.

### 5.4 Admins and operations

Events include:

- Provider outage
- Delivery failure spike
- Stuck queue
- Booking escalation
- Payment or refund exception
- Pandit approval issue
- System health digest
- Manual test result

Admin alerts should favor in-app and email first, with configurable SMS or
push escalation for urgent incidents.

## 6. Panchang schedule

All currently classified sacred events are enabled by default.

For each eligible event, the scheduler creates at most one reminder per user,
event, and local calendar day:

| Local time relative to event | Reminder |
| --- | --- |
| 48 hours before | First reminder |
| 24 hours before | Second reminder |
| Event date at 08:00 | Final reminder |

The default local send time is 08:00. Default quiet hours are 21:00–07:00.
Each user’s timezone is used. If a custom quiet-hours setting conflicts with
08:00, delivery is deferred to the next permitted local time.

The scheduler must skip reminders when the user has opted out, the event has
expired, a valid delivery already exists for that reminder key, or the event
is no longer valid.

Panchang calculations remain authoritative from the existing Panchang source.
The alert scheduler consumes classified event data and must not create a
second, conflicting calendar-classification implementation.

## 7. Channel behavior

### In-app inbox

Extend the existing customer and Pandit inboxes to understand alert events,
including Panchang events. In-app delivery is durable and deep-links to the
relevant Panchang, booking, order, or operations view.

### Visual overlays

Use the existing visual language:

- Event motif
- Category color
- Date and local timing
- Hindi/Sanskrit label where available
- Clear action such as Open Panchang
- Dismiss control
- Category opt-out shortcut

Overlays must be dismissible and must not block checkout, booking, or essential
navigation.

### Email

Continue using the Hostinger transactional outbox, linked to the central
delivery ledger. Preserve encryption, idempotency, retry handling, sanitized
Admin logs, and manual retry for safe failures.

### SMS and WhatsApp

Continue using MSG91 initially through durable adapters. The adapter must
queue the delivery, capture provider results, retry temporary failures, and
reconcile delivery status where provider callbacks are available.

### Web push/PWA

Register browser endpoints only after a clear permission interaction. Support
click-through to the relevant product surface and respect browser permission,
device sound, and system quiet settings.

### Native Android

The native Android client uses the same alert API and preference model. It may
support:

- Popup notifications
- Lock-screen visibility
- Dedicated OM-chime notification channel
- Vibration and importance controls
- Deep links
- Device permission handling

Android, OEM, battery, Do Not Disturb, and lock-screen settings can override
application preferences. The UI must distinguish the Vedic Tatva setting from
the device’s actual permission state.

The OM chime must never bypass system mute or Do Not Disturb behavior.

The push provider is intentionally behind an adapter boundary. Provider
selection and integration authorization must be reviewed separately before
implementation; no provider is made the system of record by this design.

## 8. Default-on preference experience

The first-time preference explanation should state:

> Alerts are enabled so you do not miss Panchang dates, Puja updates, or order
> activity. You can change categories, channels, timing, and sound at any time.

The settings UI has three levels:

1. **Categories** — Panchang, Puja, orders, account/security, operations,
   recommendations, and promotions.
2. **Channels** — in-app, visual overlay, email, SMS, WhatsApp, web push,
   Android popup, lock-screen, and OM chime.
3. **Timing** — timezone, daily reminder time, quiet hours, and language.

SMS STOP handling, email unsubscribe, WhatsApp opt-out behavior, and
promotional consent remain mandatory.

## 9. Admin Alert Operations area

The current Booking Notifications screen should evolve into an Alert Operations
area with:

### Overview

- Sent, queued, retrying, and failed counts
- Delivery rate by channel
- Queue age
- Provider readiness
- Current outage state
- Last successful test

### Event catalog

- Audience
- Default state
- Available channels
- Schedule
- Quiet-hours behavior
- Template version
- Active/inactive status

### Templates and graphics

- Channel copy
- English/Hindi variants
- Graphic/overlay preview
- Version history
- Controlled test send

### Delivery monitor

Filter by audience, event, booking/order, channel, status, and date range.
Retry must be limited to safe, idempotent failures.

### Device and premium-channel health

- Web push registrations
- Android registrations
- Permission-denied counts
- Expired tokens
- Chime-enabled devices
- Lock-screen opt-outs

### Global controls

Admins may pause a failing provider, non-transactional event, or broken
template. Global controls must not silently disable booking, payment, security,
or legally required notices.

## 10. Reliability and failure handling

The alert engine must:

- Create durable event and delivery records before provider side effects.
- Use stable idempotency keys for event, recipient, channel, and template
  version.
- Retry temporary failures with bounded exponential backoff.
- Mark missing configuration as skipped rather than endlessly retrying.
- Redact phone numbers, email addresses, tokens, and credentials from errors.
- Recover queued and processing records after server restart.
- Reconcile provider callbacks without creating duplicate deliveries.
- Preserve failure history for Admin investigation.

SMS must receive the same durable treatment as email and WhatsApp.

## 11. Verification requirements

Before release, tests must cover:

- One Panchang reminder per user/event/day.
- 48-hour, 24-hour, and event-day scheduling.
- Timezone and quiet-hour boundaries.
- User and channel opt-out behavior.
- Duplicate booking-event protection.
- Missing phone, email, and device endpoint handling.
- MSG91 timeout and retry behavior.
- Hostinger outbox reconciliation.
- Restart recovery.
- Expired web push and Android tokens.
- In-app overlay dismissal and accessibility.
- Android permission denial, lock-screen settings, and chime fallback.
- Admin retry, provider pause, and status reporting.
- API contract behavior for every channel adapter.

## 12. Delivery approach

Implementation should proceed as one architecture with vertical slices:

1. Establish the central event, preference, delivery, and adapter contracts.
2. Integrate Panchang scheduling and in-app/visual delivery.
3. Move existing SMS, WhatsApp, and email flows behind the durable ledger.
4. Add web push/PWA device registration and delivery.
5. Add the native Android client against the same API and preference model.
6. Expand Admin operations, templates, graphics, and delivery analytics.

This is not a microservices migration. It is a modular alert platform inside the
existing application, with a shared contract that supports future clients and
providers.

## 13. Out of scope for this specification

- Choosing or authorizing a specific web-push or native-push provider.
- Building the native Android artifact.
- Replacing MSG91 or Hostinger.
- Creating a full promotional marketing automation platform.
- AI-generating custom artwork for each notification.
- Splitting the application into microservices.

These items can be added through the adapter, client, and template boundaries
defined here without changing the core alert model.