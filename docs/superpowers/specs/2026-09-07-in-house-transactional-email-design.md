# Hostinger transactional email system

**Status:** Approved design — pending written-spec review  
**Date:** 2026-09-07  
**Scope:** Customer and Pandit transactional email delivery through the project's domain and Hostinger's default mailbox/SMTP infrastructure, with durable retries and Admin visibility.

## Goals

- Send transactional email from the project's domain through Hostinger's standard SMTP service.
- Cover customer signup, Pandit application/approval, password recovery, password regeneration, and booking lifecycle events.
- Keep signup, recovery, and booking actions successful when SMTP is temporarily unavailable.
- Persist each email job, retry temporary failures, prevent duplicate sends, and expose delivery state in Admin.
- Preserve the current branded Vedic Tatva email styling and plain-text alternatives.
- Keep SMTP credentials and derived outbox encryption material out of source code and the Admin UI.
- Remove SendGrid and every other external email-provider fallback from transactional delivery.

## Non-goals

- Marketing/newsletter campaigns are not migrated in this phase.
- SMS and WhatsApp delivery are not replaced.
- Hostinger email credentials are not editable from the Admin panel.
- This phase does not implement a separate external queue service, Redis, or managed email provider.

## Current-state findings

- `server/email.ts` already supports Nodemailer SMTP, branded templates, and a SendGrid fallback that must be removed.
- Customer registration already attempts a welcome email.
- Customer forgot-password already generates a token and sends a reset email.
- Pandit forgot-password and approval already have email templates and direct send calls.
- Booking notification delivery sends a Pandit email only after contact release and currently records customer email as not configured.
- Existing booking event/delivery tables provide business-level notification audit records.
- Admin Notifications already has channel readiness, test delivery, settings, and notification-log UI.

## Architecture

### 1. Hostinger SMTP transport

Nodemailer remains the only application transport. Hostinger's default domain mailbox is the only outbound email provider. The SendGrid fallback and any other external provider path are removed from transactional code paths.

Configuration:

- `SMTP_HOST` — Hostinger SMTP hostname, defaulting to `smtp.hostinger.com`
- `SMTP_PORT` — Hostinger SSL/TLS port, defaulting to `465`
- `SMTP_SECURE` — explicit `true`/`false`; defaults to secure for port 465
- `SMTP_USER` — Hostinger domain mailbox username
- `SMTP_PASS` — Hostinger mailbox password
- `MAIL_FROM` — the same verified domain mailbox address as `SMTP_USER`
- `MAIL_FROM_NAME` — display name
- `SMTP_REPLY_TO` — optional address on the same Hostinger domain
- `PUBLIC_SITE_URL` — links in messages
- `ADMIN_NOTIFICATION_EMAIL` — operational alerts
- Outbox encryption key — derived internally from the existing protected `SESSION_SECRET` with a dedicated purpose string; no additional user-provided key is required

The domain's SPF, DKIM, DMARC, and MX records are configured in Hostinger's domain/mail controls. The application does not call a DNS provider or manage DNS records. The Admin readiness endpoint reports presence and connection health only; it never returns passwords, encryption keys, or raw environment values.

### 2. Durable email outbox

Add an `email_outbox` table with:

- identity: `id`, unique `event_key`, `kind`
- recipient: `recipient_email`, optional `recipient_name`
- relation: `related_type`, optional `related_id`, optional `booking_delivery_id`
- encrypted message payload containing subject, text, HTML, and headers
- lifecycle: `status` (`queued`, `processing`, `retrying`, `sent`, `failed`)
- retry state: `attempt_count`, `next_attempt_at`, `locked_at`, `last_error`
- timestamps: `created_at`, `updated_at`, `sent_at`

The `event_key` is the idempotency boundary. Enqueue uses `ON CONFLICT DO NOTHING`, so route retries and worker retries cannot create duplicate email jobs.

Sensitive payloads such as reset links and temporary passwords are encrypted at rest. The encryption key is derived from the existing protected `SESSION_SECRET` with a separate purpose string, so session signing and email-payload encryption remain cryptographically separated. The worker decrypts only the message it has leased for delivery, and successful rows have their payload cleared after delivery while retaining delivery metadata.

### 3. In-process worker

Start one worker with the existing Express process:

- poll every 10 seconds by default;
- lease a small batch using row locks and a short lease timeout;
- send through the Hostinger SMTP transport;
- mark successful messages `sent`;
- retry transient failures using bounded exponential backoff;
- mark permanent failures or exhausted retries `failed`;
- recover abandoned `processing` rows after the lease expires;
- never throw an unhandled error that can crash the web process.

The worker is intentionally database-backed so restarts do not lose queued messages. It remains a single-process solution for the current deployment shape; horizontal scaling will use row locking to avoid duplicate work.

### 4. Event enqueue boundary

Routes and services do not call SMTP directly. They call `enqueueTransactionalEmail(...)` after the related database transaction succeeds.

The enqueue operation is fire-and-forget from the HTTP response only after the outbox row has been committed. If enqueue itself fails, the related action reports a server error rather than claiming the email was queued.

Booking email outbox rows include the existing `puja_booking_deliveries.id` where available. The worker updates both the outbox and the booking delivery audit record, preserving current business-level reporting.

## Event matrix

| Event kind | Recipient | Trigger | Required |
| --- | --- | --- | --- |
| `customer_signup` | Customer | Password or Google account creation | Yes |
| `pandit_application_received` | Applicant | Successful Pandit application transaction | Yes |
| `pandit_application_approved` | Pandit | Successful Admin approval transaction | Yes |
| `customer_password_reset` | Customer | Valid forgot-password request | Yes |
| `pandit_password_reset` | Pandit | Valid Pandit forgot-password request | Yes |
| `pandit_password_regenerated` | Pandit | Admin regenerates temporary password | Yes |
| `booking_requested_customer` | Customer | New booking created | Yes |
| `booking_offered_pandit` | Pandit | New booking offered to a selected Pandit | Yes |
| `booking_accepted_customer` | Customer | Pandit accepts booking | Yes |
| `booking_declined_customer` | Customer | Pandit declines booking | Yes |
| `booking_cancelled_customer` | Customer | Booking is cancelled | Yes |
| `booking_updated_customer` | Customer | Important booking details change | Yes |
| `booking_completed_customer` | Customer | Booking is completed | Yes |
| existing samagri/payout kinds | Relevant party | Existing service events | Preserve and route through outbox |

Events with no email address are recorded as skipped with an explicit reason. They are not retried indefinitely.

## Template design

- Consolidate Pandit approval and reset templates under the shared branded email layout.
- Add:
  - application received confirmation;
  - customer booking request confirmation;
  - booking accepted/declined/cancelled/updated/completed messages;
  - Pandit booking-offer message that does not disclose customer contact details before acceptance.
- Every template provides both HTML and plain text.
- All user-controlled values are escaped in HTML.
- Recovery responses remain generic to prevent account enumeration.
- Email links use `PUBLIC_SITE_URL`, never a guessed hostname.
- Templates do not include secrets beyond the one-time temporary password or reset link required by the flow.

## Admin module

Extend the existing Admin Notifications area with a **Transactional Email** module.

### Status and health

- SMTP configured/missing
- SMTP connection test result and last checked time
- queue counts by status
- last successful send
- oldest queued message
- worker heartbeat

### Queue and delivery log

- paginated rows with event, recipient (redacted in list), status, attempt count, created time, last attempt, and related booking/application link;
- filters for event, status, date range, and recipient search;
- detail view with subject, delivery timestamps, and sanitized error;
- payload body is not shown for reset links or temporary-password messages.

### Actions

- retry a failed message;
- send a controlled test email to an explicitly entered address;
- clear stale processing leases;
- toggle optional event categories;
- refresh status and queue data.

All mutations use the existing Admin authentication and audit logging. A stale legacy admin header cannot override a valid cookie session.

## Configuration and secret flow

Implementation will request the Hostinger mailbox password through the workspace secret flow, not chat. The outbox encryption key is derived internally from the existing protected `SESSION_SECRET`. Non-secret values such as Hostinger SMTP host, port, secure mode, sender address, and public site URL will be stored as environment variables. The app will start in a safe “SMTP unavailable” state in development and will show queued/failed state in Admin rather than silently claiming delivery.

## Error handling

- A successful signup, reset request, or booking creation does not wait for SMTP.
- A durable outbox enqueue failure is a server error because the system cannot make the requested notification reliable.
- SMTP authentication/configuration failures are marked failed and surfaced in Admin.
- Connection timeouts, temporary DNS failures, and 4xx SMTP responses are retried.
- Permanent 5xx recipient failures and exhausted retries become failed.
- Error text is sanitized before database storage and must not contain credentials, reset URLs, full phone numbers, or full email addresses.
- The worker logs event IDs and statuses, not message bodies or secrets.

## Verification plan

### Unit and contract tests

- Hostinger SMTP-only transport selection never invokes SendGrid or another external email API.
- Message encryption/decryption round-trips, uses a purpose-separated key derived from `SESSION_SECRET`, and rejects tampered payloads.
- Idempotent enqueue creates one row for repeated event keys.
- Backoff, lease recovery, retry exhaustion, and permanent-failure handling work deterministically.
- Templates include required recipients, subjects, plain text, HTML escaping, and no premature contact release.

### Flow tests

- Customer signup returns success and creates exactly one welcome outbox row.
- Customer forgot-password remains generic and creates one reset row for an eligible account.
- Pandit application returns success and creates one application-received row.
- Pandit approval creates one account and one approval email even when the Admin request is retried.
- Pandit password recovery and Admin password regeneration create the correct rows.
- New booking creates customer and Pandit email rows, with Pandit contact visibility matching booking state.
- Accept/decline/cancel/update/complete transitions create the corresponding customer email rows exactly once.
- A simulated SMTP outage leaves the action successful, retries the row, and exposes the failure in Admin.
- A simulated successful SMTP send marks the outbox and linked booking delivery sent.
- Admin endpoints reject unauthenticated access and support retry/test/filter behavior.

## Rollout sequence

1. Add schema, encryption helper, Hostinger-only SMTP transport, and outbox enqueue/worker.
2. Add and test templates.
3. Migrate account and booking triggers from direct sends to outbox.
4. Add Admin status, queue, retry, and test controls.
5. Request and attach VPS SMTP secrets through the secure flow.
6. Run local/dev smoke tests with a test recipient.
7. Verify real Hostinger delivery from Admin before publishing.