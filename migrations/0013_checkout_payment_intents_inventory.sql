-- Payment intents and card-only inventory reservations. Safe for psql -f startup.
BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS checkout_payment_intents (
  id varchar(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  gateway_order_id text NOT NULL,
  canonical_payload jsonb NOT NULL,
  amount_paise integer NOT NULL CHECK (amount_paise >= 0),
  currency varchar(3) NOT NULL DEFAULT 'INR' CHECK (currency = 'INR'),
  pandit_id integer NULL REFERENCES pandits(id),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'consumed', 'expired')),
  consumed_order_id integer NULL REFERENCES orders(id),
  created_at timestamp NOT NULL DEFAULT now(),
  expires_at timestamp NOT NULL,
  consumed_at timestamp NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS checkout_payment_intents_gateway_order_uq ON checkout_payment_intents(gateway_order_id);
CREATE INDEX IF NOT EXISTS checkout_payment_intents_status_expiry_idx ON checkout_payment_intents(status, expires_at);

CREATE TABLE IF NOT EXISTS order_inventory_allocations (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_id integer NOT NULL REFERENCES orders(id),
  product_id integer NOT NULL REFERENCES products(id),
  quantity integer NOT NULL CHECK (quantity > 0),
  released_at timestamp NULL,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now(),
  CONSTRAINT order_inventory_allocations_order_product_uq UNIQUE(order_id, product_id)
);
CREATE INDEX IF NOT EXISTS order_inventory_allocations_product_released_idx ON order_inventory_allocations(product_id, released_at);

COMMIT;