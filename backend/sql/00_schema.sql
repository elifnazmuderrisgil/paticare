-- ============================================================================
-- PATICARE DATABASE SCHEMA
-- Tüm tabloları oluşturan SQL scriptler
-- ============================================================================

-- Şirketler/Klinikler için tablo
CREATE TABLE IF NOT EXISTS cities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS clinics (
    id SERIAL PRIMARY KEY,
    clinic_name VARCHAR(255) NOT NULL,
    city_id INT REFERENCES cities(id),
    district VARCHAR(100),
    address TEXT
);

-- Veteriner şifresi
ALTER TABLE veterinarians
ADD COLUMN IF NOT EXISTS password VARCHAR(255);

-- Klinik ilişkisi
ALTER TABLE veterinarians
ADD COLUMN IF NOT EXISTS clinic_id INT REFERENCES clinics(id);
