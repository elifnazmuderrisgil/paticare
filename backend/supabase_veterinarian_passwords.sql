ALTER TABLE veterinarians
ADD COLUMN IF NOT EXISTS password VARCHAR(255);

UPDATE veterinarians
SET password = '123456'
WHERE password IS NULL;
