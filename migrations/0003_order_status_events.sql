CREATE TABLE IF NOT EXISTS order_status_events (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_id integer NOT NULL REFERENCES orders(id),
  previous_status text NOT NULL,
  next_status text NOT NULL,
  actor_type text NOT NULL DEFAULT 'admin',
  actor_label text,
  reason text,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS order_status_events_order_created_idx
  ON order_status_events (order_id, created_at);