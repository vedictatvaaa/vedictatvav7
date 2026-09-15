-- Unified alert orchestration foundation.
-- Additive only: canonical events, per-channel delivery attempts,
-- user preferences, and web/native device capability registrations.

CREATE TABLE IF NOT EXISTS "alert_events" (
  "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "event_key" text NOT NULL UNIQUE,
  "event_type" text NOT NULL,
  "category" text NOT NULL,
  "audience" text NOT NULL DEFAULT 'customer',
  "user_id" integer,
  "pandit_id" integer,
  "related_type" text,
  "related_id" integer,
  "payload" jsonb,
  "scheduled_for" timestamptz NOT NULL,
  "processed_at" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "alert_events_scheduled_idx"
  ON "alert_events" ("scheduled_for", "processed_at");
CREATE INDEX IF NOT EXISTS "alert_events_user_idx"
  ON "alert_events" ("user_id", "created_at");
CREATE INDEX IF NOT EXISTS "alert_events_category_idx"
  ON "alert_events" ("category", "scheduled_for");

CREATE TABLE IF NOT EXISTS "alert_deliveries" (
  "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "event_id" integer NOT NULL,
  "user_id" integer,
  "pandit_id" integer,
  "channel" text NOT NULL,
  "status" text NOT NULL DEFAULT 'queued',
  "attempt_count" integer NOT NULL DEFAULT 0,
  "idempotency_key" text NOT NULL UNIQUE,
  "provider_message_id" text,
  "last_error" text,
  "scheduled_for" timestamptz NOT NULL,
  "sent_at" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "alert_deliveries_event_channel_recipient_uniq"
  ON "alert_deliveries" ("event_id", "user_id", "pandit_id", "channel");
CREATE INDEX IF NOT EXISTS "alert_deliveries_due_idx"
  ON "alert_deliveries" ("status", "scheduled_for");
CREATE INDEX IF NOT EXISTS "alert_deliveries_recipient_idx"
  ON "alert_deliveries" ("user_id", "created_at");

CREATE TABLE IF NOT EXISTS "alert_preferences" (
  "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "user_id" integer NOT NULL UNIQUE,
  "panchang_enabled" boolean NOT NULL DEFAULT true,
  "booking_enabled" boolean NOT NULL DEFAULT true,
  "order_enabled" boolean NOT NULL DEFAULT true,
  "account_enabled" boolean NOT NULL DEFAULT true,
  "operations_enabled" boolean NOT NULL DEFAULT true,
  "recommendations_enabled" boolean NOT NULL DEFAULT true,
  "promotions_enabled" boolean NOT NULL DEFAULT false,
  "in_app_enabled" boolean NOT NULL DEFAULT true,
  "visual_overlay_enabled" boolean NOT NULL DEFAULT true,
  "email_enabled" boolean NOT NULL DEFAULT true,
  "sms_enabled" boolean NOT NULL DEFAULT true,
  "whatsapp_enabled" boolean NOT NULL DEFAULT true,
  "web_push_enabled" boolean NOT NULL DEFAULT true,
  "android_push_enabled" boolean NOT NULL DEFAULT true,
  "lock_screen_enabled" boolean NOT NULL DEFAULT true,
  "om_chime_enabled" boolean NOT NULL DEFAULT true,
  "language" text NOT NULL DEFAULT 'en',
  "timezone" text NOT NULL DEFAULT 'Asia/Kolkata',
  "daily_send_time" text NOT NULL DEFAULT '08:00',
  "quiet_start" text NOT NULL DEFAULT '21:00',
  "quiet_end" text NOT NULL DEFAULT '07:00',
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "alert_preferences_timezone_idx"
  ON "alert_preferences" ("timezone");

CREATE TABLE IF NOT EXISTS "alert_device_subscriptions" (
  "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "user_id" integer NOT NULL,
  "platform" text NOT NULL,
  "endpoint" text NOT NULL,
  "permission_state" text NOT NULL DEFAULT 'granted',
  "app_version" text,
  "last_seen_at" timestamptz NOT NULL DEFAULT now(),
  "revoked_at" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS "alert_device_subscriptions_endpoint_uniq"
  ON "alert_device_subscriptions" ("platform", "endpoint");
CREATE INDEX IF NOT EXISTS "alert_device_subscriptions_user_platform_idx"
  ON "alert_device_subscriptions" ("user_id", "platform");