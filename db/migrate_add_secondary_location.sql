-- ============================================================
-- Migration: Add secondary_location_id to employee table
-- Run this once against the live ebpdb database.
-- Safe to re-run (uses IF NOT EXISTS guard).
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employee' AND column_name = 'secondary_location_id'
  ) THEN
    ALTER TABLE employee
      ADD COLUMN secondary_location_id INT REFERENCES location(id);

    -- Assign a secondary store to ~70% of existing employees
    -- Secondary must differ from primary
    UPDATE employee
    SET secondary_location_id = CASE
      WHEN (id % 10) < 7 THEN
        CASE
          WHEN (1 + ((location_id + (id % 9)) % 10)) = location_id
            THEN 1 + (location_id % 10)
          ELSE
            1 + ((location_id + (id % 9)) % 10)
        END
      ELSE NULL
    END;

    RAISE NOTICE 'secondary_location_id column added and populated.';
  ELSE
    RAISE NOTICE 'secondary_location_id already exists, skipping.';
  END IF;
END $$;
