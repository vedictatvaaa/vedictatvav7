-- Persist server-priced checkout intents and inventory allocations without
-- rewriting historical orders.
BEGIN;

CREATE TABLE IF NOT EXISTS checkout_payment_intents (
  id varchar(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  gateway_order_id text NOT NULL UNIQUE,
  canonical_payload jsonb NOT NULL,
  amount_paise integer NOT NULL,
  currency varchar(3) NOT NULL DEFAULT 'INR',
  pandit_id integer,
  status text NOT NULL DEFAULT 'pending',
  consumed_order_id integer,
  created_at timestamp NOT NULL DEFAULT now(),
  expires_at timestamp NOT NULL,
  consumed_at timestamp
);

CREATE INDEX IF NOT EXISTS checkout_payment_intents_status_expiry_idx
  ON checkout_payment_intents (status, expires_at);

CREATE TABLE IF NOT EXISTS order_inventory_allocations (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_id integer NOT NULL REFERENCES orders(id),
  product_id integer NOT NULL REFERENCES products(id),
  quantity integer NOT NULL,
  released_at timestamp,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now(),
  UNIQUE(order_id, product_id)
);

CREATE INDEX IF NOT EXISTS order_inventory_allocations_product_released_idx
  ON order_inventory_allocations (product_id, released_at);

COMMIT;