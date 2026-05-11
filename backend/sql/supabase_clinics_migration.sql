-- ============================================================================
-- PATICARE CLINICS MIGRATION
-- Moves clinic data from veterinarians into relational clinics table.
-- Run this before dropping the legacy veterinarian clinic columns elsewhere.
-- ============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS clinics (
    id SERIAL PRIMARY KEY,
    clinic_name VARCHAR(255) NOT NULL,
    city_id INT REFERENCES cities(id),
    district VARCHAR(100),
    address TEXT
);

ALTER TABLE veterinarians
ADD COLUMN IF NOT EXISTS clinic_id INT REFERENCES clinics(id);

WITH source_clinics AS (
    SELECT DISTINCT ON (LOWER(TRIM(clinic_name)))
        TRIM(clinic_name) AS clinic_name,
        city_id,
        district,
        address
    FROM veterinarians
    WHERE clinic_name IS NOT NULL
      AND TRIM(clinic_name) <> ''
    ORDER BY LOWER(TRIM(clinic_name)), id
)
INSERT INTO clinics (clinic_name, city_id, district, address)
SELECT
    source_clinics.clinic_name,
    source_clinics.city_id,
    source_clinics.district,
    source_clinics.address
FROM source_clinics
WHERE NOT EXISTS (
    SELECT 1
    FROM clinics
    WHERE LOWER(TRIM(clinics.clinic_name)) = LOWER(TRIM(source_clinics.clinic_name))
);

UPDATE veterinarians
SET clinic_id = clinics.id
FROM clinics
WHERE veterinarians.clinic_id IS NULL
  AND veterinarians.clinic_name IS NOT NULL
  AND LOWER(TRIM(veterinarians.clinic_name)) = LOWER(TRIM(clinics.clinic_name));

ALTER TABLE veterinarians DROP COLUMN IF EXISTS clinic_name;
ALTER TABLE veterinarians DROP COLUMN IF EXISTS city_id;
ALTER TABLE veterinarians DROP COLUMN IF EXISTS district;
ALTER TABLE veterinarians DROP COLUMN IF EXISTS address;

COMMIT;
