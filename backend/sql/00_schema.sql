-- ============================================================================
-- PATICARE DATABASE SCHEMA
-- Tüm tabloları oluşturan SQL scriptler
-- ============================================================================

-- Şirketler/Klinikler için tablo
CREATE TABLE IF NOT EXISTS cities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL
);

-- Veteriner Kliniğini eklemek için tabloda sütun ekleme
ALTER TABLE veterinarians 
ADD COLUMN IF NOT EXISTS clinic_name VARCHAR(150);

ALTER TABLE veterinarians 
ADD COLUMN IF NOT EXISTS city VARCHAR(100);

ALTER TABLE veterinarians 
ADD COLUMN IF NOT EXISTS district VARCHAR(100);

ALTER TABLE veterinarians 
ADD COLUMN IF NOT EXISTS address TEXT;

-- Veteriner şifresi
ALTER TABLE veterinarians
ADD COLUMN IF NOT EXISTS password VARCHAR(255);

-- Şehir ID'si
ALTER TABLE veterinarians
ADD COLUMN IF NOT EXISTS city_id INT REFERENCES cities(id);
