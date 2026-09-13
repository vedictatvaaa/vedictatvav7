BEGIN;

ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS pandit_contact_unlock_price_paise integer NOT NULL DEFAULT 1000;
ALTER TABLE site_settings DROP CONSTRAINT IF EXISTS site_settings_pandit_contact_unlock_price_check;
ALTER TABLE site_settings ADD CONSTRAINT site_settings_pandit_contact_unlock_price_check
  CHECK (pandit_contact_unlock_price_paise BETWEEN 100 AND 1000000);

CREATE TABLE IF NOT EXISTS pandit_contact_entitlement_events (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id integer NOT NULL REFERENCES users(id),
  pandit_id integer REFERENCES pandits(id),
  event_type text NOT NULL CHECK (event_type IN ('free_reveal', 'paid_reveal', 'booking_reset')),
  source_booking_id integer REFERENCES puja_bookings(id),
  source_purchase_id integer,
  source_reveal_id integer REFERENCES pandit_contact_reveals(id),
  event_time timestamp NOT NULL DEFAULT now(),
  amount_paise integer,
  currency varchar(3),
  created_at timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS pandit_contact_entitlement_events_user_time_idx
  ON pandit_contact_entitlement_events(user_id, event_time);
CREATE INDEX IF NOT EXISTS pandit_contact_entitlement_events_user_pandit_time_idx
  ON pandit_contact_entitlement_events(user_id, pandit_id, event_time);
CREATE UNIQUE INDEX IF NOT EXISTS pandit_contact_entitlement_events_source_purchase_unique
  ON pandit_contact_entitlement_events(source_purchase_id)
  WHERE source_purchase_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS pandit_contact_entitlement_events_source_booking_unique
  ON pandit_contact_entitlement_events(source_booking_id)
  WHERE source_booking_id IS NOT NULL AND event_type = 'booking_reset';
CREATE UNIQUE INDEX IF NOT EXISTS pandit_contact_entitlement_events_source_reveal_unique
  ON pandit_contact_entitlement_events(source_reveal_id)
  WHERE source_reveal_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS pandit_contact_unlock_purchases (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id integer NOT NULL REFERENCES users(id),
  pandit_id integer NOT NULL REFERENCES pandits(id),
  amount_paise integer NOT NULL CHECK (amount_paise BETWEEN 100 AND 1000000),
  currency varchar(3) NOT NULL DEFAULT 'INR',
  razorpay_order_id text NOT NULL UNIQUE,
  razorpay_payment_id text UNIQUE,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'paid', 'failed', 'expired', 'refunded')),
  expires_at timestamp NOT NULL,
  paid_at timestamp,
  revoked_at timestamp,
  created_at timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS pandit_contact_unlock_purchases_user_pandit_idx
  ON pandit_contact_unlock_purchases(user_id, pandit_id, created_at);
CREATE INDEX IF NOT EXISTS pandit_contact_unlock_purchases_status_expiry_idx
  ON pandit_contact_unlock_purchases(status, expires_at);

-- Existing protected reveals are the initial free-reveal history. The
-- source-row unique key makes this safe to run repeatedly.
INSERT INTO pandit_contact_entitlement_events
  (user_id, pandit_id, event_type, source_reveal_id, event_time)
SELECT user_id, pandit_id, 'free_reveal', id, revealed_at
FROM pandit_contact_reveals
WHERE revealed_at >= now() - interval '30 days'
ON CONFLICT DO NOTHING;

COMMIT;