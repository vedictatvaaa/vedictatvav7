-- Repair deployments where the lifetime registration columns were applied
-- without the sequence required by the approval transaction.
BEGIN;

CREATE SEQUENCE IF NOT EXISTS pandit_registration_no_seq AS bigint
  MINVALUE 1001000156
  MAXVALUE 9999999999
  START WITH 1001000156
  NO CYCLE;

SELECT setval(
  'pandit_registration_no_seq',
  GREATEST(
    COALESCE(MAX(registration_no::bigint) FILTER (WHERE registration_no ~ '^[0-9]{10}$'), 1001000156),
    1001000156
  ),
  COUNT(registration_no) FILTER (WHERE registration_no ~ '^[0-9]{10}$') > 0
)
FROM pandits;

COMMIT;