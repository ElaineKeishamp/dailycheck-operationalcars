ALTER TABLE check_photos
  ADD COLUMN IF NOT EXISTS part_index integer;

DO $$
BEGIN
  ALTER TABLE check_photos
    ADD CONSTRAINT check_photos_part_index_check
    CHECK (
      (part_type = 'ban' AND (part_index IS NULL OR part_index BETWEEN 1 AND 4))
      OR (part_type <> 'ban' AND part_index IS NULL)
    )
    NOT VALID;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE check_photos
  VALIDATE CONSTRAINT check_photos_part_index_check;

CREATE UNIQUE INDEX IF NOT EXISTS unique_check_photos_daily_non_ban_slot
  ON check_photos (daily_id, part_type)
  WHERE part_type <> 'ban';

CREATE UNIQUE INDEX IF NOT EXISTS unique_check_photos_daily_ban_slot
  ON check_photos (daily_id, part_type, part_index)
  WHERE part_type = 'ban' AND part_index IS NOT NULL;
