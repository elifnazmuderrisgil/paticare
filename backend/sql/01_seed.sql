-- ============================================================================
-- PATICARE DATABASE SEED DATA
-- Tüm veri insertion (INSERT/UPDATE) scriptleri
-- ============================================================================

-- ============================================================================
-- SECTION 1: Şehirleri Ekle
-- ============================================================================
INSERT INTO cities (name)
VALUES
('İstanbul'),
('Ankara'),
('İzmir'),
('Gaziantep'),
('Mersin'),
('Adana'),
('Antalya'),
('Eskişehir')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- SECTION 2: Veteriner Kliniği Bilgilerini Güncelle (var olanlar için)
-- ============================================================================
UPDATE veterinarians
SET
    clinic_name = 'Pati Dostum Veteriner Kliniği',
    district = 'Kadıköy',
    address = 'Caferağa Mahallesi, Moda Caddesi No: 12 Kadıköy / İstanbul',
    city_id = (SELECT id FROM cities WHERE name = 'İstanbul')
WHERE email = 'ayse@vet.com' OR full_name = 'Dr. Ayşe Demir';

UPDATE veterinarians
SET
    clinic_name = 'Minik Patiler Kliniği',
    district = 'Beşiktaş',
    address = 'Sinanpaşa Mahallesi, Ortabahçe Caddesi No: 8 Beşiktaş / İstanbul',
    city_id = (SELECT id FROM cities WHERE name = 'İstanbul')
WHERE email = 'mehmet@vet.com' OR full_name = 'Dr. Mehmet Can';

UPDATE veterinarians
SET
    clinic_name = 'Sağlıklı Pati Kliniği',
    district = 'Çankaya',
    address = 'Bahçelievler Mahallesi, 7. Cadde No: 24 Çankaya / Ankara',
    city_id = (SELECT id FROM cities WHERE name = 'Ankara')
WHERE email = 'selin@vet.com' OR full_name = 'Dr. Selin Arslan';

-- ============================================================================
-- SECTION 3: Veterinerleri Ekle (Yeni)
-- ============================================================================
INSERT INTO veterinarians (full_name, phone, email, clinic_name, district, address, city_id)
SELECT 'Dr. Burak Yılmaz', '05550102030', 'burak@vet.com', 'Ege Vet Kliniği', 'Karşıyaka', 'Bostanlı Mahallesi, Cemal Gürsel Caddesi No: 45 Karşıyaka / İzmir', c.id
FROM cities c
WHERE c.name = 'İzmir'
  AND NOT EXISTS (SELECT 1 FROM veterinarians WHERE email = 'burak@vet.com');

INSERT INTO veterinarians (full_name, phone, email, clinic_name, district, address, city_id)
SELECT 'Dr. Elif Kaya', '05550405060', 'elifkaya@vet.com', 'Can Dostlar Vet', 'Şahinbey', 'Binevler Mahallesi, Üniversite Bulvarı No: 18 Şahinbey / Gaziantep', c.id
FROM cities c
WHERE c.name = 'Gaziantep'
  AND NOT EXISTS (SELECT 1 FROM veterinarians WHERE email = 'elifkaya@vet.com');

INSERT INTO veterinarians (full_name, phone, email, clinic_name, district, address, city_id)
SELECT 'Dr. Murat Demir', '05550708090', 'murat@vet.com', 'Pati Yaşam Kliniği', 'Şehitkamil', 'Atatürk Mahallesi, İpekyolu Caddesi No: 31 Şehitkamil / Gaziantep', c.id
FROM cities c
WHERE c.name = 'Gaziantep'
  AND NOT EXISTS (SELECT 1 FROM veterinarians WHERE email = 'murat@vet.com');

INSERT INTO veterinarians (full_name, clinic_name, district, address, city_id)
SELECT 'Dr. Deniz Acar', 'Mersin Pati Kliniği', 'Yenişehir', 'Mersin Yenişehir merkez', c.id
FROM cities c
WHERE c.name = 'Mersin'
  AND NOT EXISTS (SELECT 1 FROM veterinarians WHERE full_name = 'Dr. Deniz Acar');

INSERT INTO veterinarians (full_name, clinic_name, district, address, city_id)
SELECT 'Dr. Ceren Yıldız', 'Mezitli VetCare', 'Mezitli', 'Mersin Mezitli sahil yolu', c.id
FROM cities c
WHERE c.name = 'Mersin'
  AND NOT EXISTS (SELECT 1 FROM veterinarians WHERE full_name = 'Dr. Ceren Yıldız');

INSERT INTO veterinarians (full_name, clinic_name, district, address, city_id)
SELECT 'Dr. Emre Kılıç', 'Toroslar Hayvan Sağlığı', 'Toroslar', 'Mersin Toroslar merkez', c.id
FROM cities c
WHERE c.name = 'Mersin'
  AND NOT EXISTS (SELECT 1 FROM veterinarians WHERE full_name = 'Dr. Emre Kılıç');

INSERT INTO veterinarians (full_name, clinic_name, district, address, city_id)
SELECT 'Dr. Selin Koç', 'Adana Can Dostum Vet', 'Seyhan', 'Adana Seyhan merkez', c.id
FROM cities c
WHERE c.name = 'Adana'
  AND NOT EXISTS (SELECT 1 FROM veterinarians WHERE full_name = 'Dr. Selin Koç');

INSERT INTO veterinarians (full_name, clinic_name, district, address, city_id)
SELECT 'Dr. Barış Eren', 'Çukurova Pati Merkezi', 'Çukurova', 'Adana Çukurova merkez', c.id
FROM cities c
WHERE c.name = 'Adana'
  AND NOT EXISTS (SELECT 1 FROM veterinarians WHERE full_name = 'Dr. Barış Eren');

INSERT INTO veterinarians (full_name, clinic_name, district, address, city_id)
SELECT 'Dr. Melis Arda', 'Yüreğir Veteriner Kliniği', 'Yüreğir', 'Adana Yüreğir merkez', c.id
FROM cities c
WHERE c.name = 'Adana'
  AND NOT EXISTS (SELECT 1 FROM veterinarians WHERE full_name = 'Dr. Melis Arda');

INSERT INTO veterinarians (full_name, clinic_name, district, address, city_id)
SELECT 'Dr. Ece Demir', 'Antalya PetLife', 'Muratpaşa', 'Antalya Muratpaşa merkez', c.id
FROM cities c
WHERE c.name = 'Antalya'
  AND NOT EXISTS (SELECT 1 FROM veterinarians WHERE full_name = 'Dr. Ece Demir');

INSERT INTO veterinarians (full_name, clinic_name, district, address, city_id)
SELECT 'Dr. Kerem Yalçın', 'Konyaaltı Pati Kliniği', 'Konyaaltı', 'Antalya Konyaaltı sahil', c.id
FROM cities c
WHERE c.name = 'Antalya'
  AND NOT EXISTS (SELECT 1 FROM veterinarians WHERE full_name = 'Dr. Kerem Yalçın');

INSERT INTO veterinarians (full_name, clinic_name, district, address, city_id)
SELECT 'Dr. Sude Aksoy', 'Alanya VetPoint', 'Alanya', 'Antalya Alanya merkez', c.id
FROM cities c
WHERE c.name = 'Antalya'
  AND NOT EXISTS (SELECT 1 FROM veterinarians WHERE full_name = 'Dr. Sude Aksoy');

INSERT INTO veterinarians (full_name, clinic_name, district, address, city_id)
SELECT 'Dr. Okan Yılmaz', 'Eskişehir Pati Sağlığı', 'Odunpazarı', 'Eskişehir Odunpazarı merkez', c.id
FROM cities c
WHERE c.name = 'Eskişehir'
  AND NOT EXISTS (SELECT 1 FROM veterinarians WHERE full_name = 'Dr. Okan Yılmaz');

INSERT INTO veterinarians (full_name, clinic_name, district, address, city_id)
SELECT 'Dr. Derya Şahin', 'Tepebaşı Vet Kliniği', 'Tepebaşı', 'Eskişehir Tepebaşı merkez', c.id
FROM cities c
WHERE c.name = 'Eskişehir'
  AND NOT EXISTS (SELECT 1 FROM veterinarians WHERE full_name = 'Dr. Derya Şahin');

-- ============================================================================
-- SECTION 4: Veteriner Şifreleri
-- ============================================================================
UPDATE veterinarians
SET password = '123456'
WHERE password IS NULL;

-- ============================================================================
-- SECTION 5: Veteriner Hizmetleri
-- ============================================================================
INSERT INTO services (service_name)
VALUES
('Genel Muayene'),
('Aşı Uygulaması'),
('Tırnak Kesimi'),
('Acil Kontrol'),
('Kontrol Muayenesi'),
('Diş Kontrolü'),
('Parazit Tedavisi'),
('Kısırlaştırma Danışmanlığı'),
('Beslenme Danışmanlığı'),
('Cilt ve Tüy Kontrolü')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SECTION 6: Demo Müşteriler
-- ============================================================================
INSERT INTO users (full_name, email, password, phone, role)
VALUES
('Merve Kaya', 'merve.kaya.demo@gmail.com', '123456', '05551000001', 'customer'),
('Ali Demir', 'ali.demir.demo@gmail.com', '123456', '05551000002', 'customer'),
('Zeynep Arslan', 'zeynep.arslan.demo@gmail.com', '123456', '05551000003', 'customer'),
('Can Yılmaz', 'can.yilmaz.demo@gmail.com', '123456', '05551000004', 'customer'),
('Burcu Şahin', 'burcu.sahin.demo@gmail.com', '123456', '05551000005', 'customer'),
('Eren Aksoy', 'eren.aksoy.demo@gmail.com', '123456', '05551000006', 'customer'),
('Dilan Çelik', 'dilan.celik.demo@gmail.com', '123456', '05551000007', 'customer'),
('Yusuf Acar', 'yusuf.acar.demo@gmail.com', '123456', '05551000008', 'customer'),
('Selin Korkmaz', 'selin.korkmaz.demo@gmail.com', '123456', '05551000009', 'customer'),
('Kerem Yıldız', 'kerem.yildiz.demo@gmail.com', '123456', '05551000010', 'customer'),
('Melis Arda', 'melis.arda.demo@gmail.com', '123456', '05551000011', 'customer'),
('Okan Polat', 'okan.polat.demo@gmail.com', '123456', '05551000012', 'customer'),
('Sude Koç', 'sude.koc.demo@gmail.com', '123456', '05551000013', 'customer'),
('Barış Eren', 'baris.eren.demo@gmail.com', '123456', '05551000014', 'customer'),
('Ceren Yalçın', 'ceren.yalcin.demo@gmail.com', '123456', '05551000015', 'customer'),
('Deniz Demir', 'deniz.demir.demo@gmail.com', '123456', '05551000016', 'customer'),
('Ahmet Yavuz', 'ahmet.yavuz.demo@gmail.com', '123456', '05551000017', 'customer'),
('Gökçe Aydın', 'gokce.aydin.demo@gmail.com', '123456', '05551000018', 'customer'),
('İrem Bulut', 'irem.bulut.demo@gmail.com', '123456', '05551000019', 'customer'),
('Murat Kaplan', 'murat.kaplan.demo@gmail.com', '123456', '05551000020', 'customer'),
('Aslı Yüce', 'asli.yuce.demo@gmail.com', '123456', '05551000021', 'customer'),
('Tuna Ergin', 'tuna.ergin.demo@gmail.com', '123456', '05551000022', 'customer'),
('Buse Aksu', 'buse.aksu.demo@gmail.com', '123456', '05551000023', 'customer'),
('Emre Güneş', 'emre.gunes.demo@gmail.com', '123456', '05551000024', 'customer')
ON CONFLICT (email) DO UPDATE
SET
    full_name = EXCLUDED.full_name,
    password = EXCLUDED.password,
    phone = EXCLUDED.phone,
    role = 'customer';

-- ============================================================================
-- SECTION 7: Demo Evcil Hayvanlar
-- ============================================================================
WITH pet_seed(email, name, species, breed, age, gender) AS (
    VALUES
    ('merve.kaya.demo@gmail.com', 'Luna', 'Kedi', 'British Shorthair', 2, 'Dişi'),
    ('merve.kaya.demo@gmail.com', 'Pamuk', 'Kedi', 'Tekir', 4, 'Dişi'),
    ('ali.demir.demo@gmail.com', 'Max', 'Köpek', 'Golden Retriever', 4, 'Erkek'),
    ('zeynep.arslan.demo@gmail.com', 'Çakıl', 'Köpek', 'Terrier', 3, 'Erkek'),
    ('can.yilmaz.demo@gmail.com', 'Maviş', 'Kuş', 'Muhabbet Kuşu', 1, 'Dişi'),
    ('can.yilmaz.demo@gmail.com', 'Boncuk', 'Kedi', 'Van Kedisi', 5, 'Dişi'),
    ('burcu.sahin.demo@gmail.com', 'Zeytin', 'Köpek', 'Labrador', 6, 'Erkek'),
    ('eren.aksoy.demo@gmail.com', 'Köpük', 'Köpek', 'Poodle', 2, 'Dişi'),
    ('dilan.celik.demo@gmail.com', 'Minnoş', 'Kedi', 'Scottish Fold', 3, 'Dişi'),
    ('yusuf.acar.demo@gmail.com', 'Tarçın', 'Tavşan', 'Hollanda Lop', 1, 'Erkek'),
    ('selin.korkmaz.demo@gmail.com', 'Luna', 'Kedi', 'British Shorthair', 1, 'Dişi'),
    ('kerem.yildiz.demo@gmail.com', 'Max', 'Köpek', 'Golden Retriever', 5, 'Erkek'),
    ('kerem.yildiz.demo@gmail.com', 'Çakıl', 'Köpek', 'Terrier', 2, 'Erkek'),
    ('melis.arda.demo@gmail.com', 'Maviş', 'Kuş', 'Muhabbet Kuşu', 2, 'Dişi'),
    ('okan.polat.demo@gmail.com', 'Pamuk', 'Kedi', 'Tekir', 3, 'Dişi'),
    ('sude.koc.demo@gmail.com', 'Boncuk', 'Kedi', 'Van Kedisi', 4, 'Dişi'),
    ('baris.eren.demo@gmail.com', 'Zeytin', 'Köpek', 'Labrador', 2, 'Erkek'),
    ('ceren.yalcin.demo@gmail.com', 'Köpük', 'Köpek', 'Poodle', 1, 'Dişi'),
    ('deniz.demir.demo@gmail.com', 'Minnoş', 'Kedi', 'Scottish Fold', 6, 'Dişi'),
    ('deniz.demir.demo@gmail.com', 'Tarçın', 'Tavşan', 'Hollanda Lop', 2, 'Erkek'),
    ('ahmet.yavuz.demo@gmail.com', 'Luna', 'Kedi', 'British Shorthair', 3, 'Dişi'),
    ('gokce.aydin.demo@gmail.com', 'Max', 'Köpek', 'Golden Retriever', 2, 'Erkek'),
    ('irem.bulut.demo@gmail.com', 'Çakıl', 'Köpek', 'Terrier', 5, 'Erkek'),
    ('murat.kaplan.demo@gmail.com', 'Maviş', 'Kuş', 'Muhabbet Kuşu', 1, 'Dişi'),
    ('asli.yuce.demo@gmail.com', 'Pamuk', 'Kedi', 'Tekir', 4, 'Dişi'),
    ('tuna.ergin.demo@gmail.com', 'Boncuk', 'Kedi', 'Van Kedisi', 2, 'Dişi'),
    ('buse.aksu.demo@gmail.com', 'Zeytin', 'Köpek', 'Labrador', 6, 'Erkek'),
    ('emre.gunes.demo@gmail.com', 'Köpük', 'Köpek', 'Poodle', 3, 'Dişi')
)
INSERT INTO pets (user_id, name, species, breed, age, gender)
SELECT u.id, ps.name, ps.species, ps.breed, ps.age, ps.gender
FROM pet_seed ps
JOIN users u ON u.email = ps.email
WHERE NOT EXISTS (
    SELECT 1
    FROM pets p
    WHERE p.user_id = u.id
      AND p.name = ps.name
);

-- ============================================================================
-- SECTION 8: Demo Randevular (Şehir bazlı)
-- ============================================================================
WITH city_veterinarians AS (
    SELECT
        v.id AS veterinarian_id,
        v.city_id,
        DENSE_RANK() OVER (ORDER BY v.city_id) AS city_rank,
        ROW_NUMBER() OVER (PARTITION BY v.city_id ORDER BY v.id) AS vet_city_row
    FROM veterinarians v
    WHERE v.city_id IS NOT NULL
),
selected_veterinarians AS (
    SELECT *
    FROM city_veterinarians
    WHERE vet_city_row <= 2
),
available_pets AS (
    SELECT
        p.id AS pet_id,
        p.user_id,
        ROW_NUMBER() OVER (ORDER BY p.id) AS pet_row
    FROM pets p
),
available_services AS (
    SELECT
        s.id AS service_id,
        ROW_NUMBER() OVER (ORDER BY s.id) AS service_row
    FROM services s
),
seed_slots AS (
    SELECT
        sv.veterinarian_id,
        ap.user_id,
        ap.pet_id,
        svc.service_id,
        (CURRENT_DATE + (30 + sv.city_rank * 3 + sv.vet_city_row + slot_data.slot_no)::int) AS appointment_date,
        (
            TIME '08:00'
            + (((sv.city_rank + sv.vet_city_row + slot_data.slot_no * 2) % 19) * INTERVAL '30 minutes')
        )::time AS appointment_time,
        CASE ((sv.city_rank + sv.vet_city_row + slot_data.slot_no) % 3)
            WHEN 0 THEN 'Bekliyor'
            WHEN 1 THEN 'Onaylandı'
            ELSE 'Tamamlandı'
        END AS status
    FROM selected_veterinarians sv
    CROSS JOIN (VALUES (1), (2)) AS slot_data(slot_no)
    JOIN available_pets ap
      ON ap.pet_row = (((sv.city_rank + sv.vet_city_row + slot_data.slot_no - 2) % (SELECT COUNT(*) FROM available_pets)) + 1)
    JOIN available_services svc
      ON svc.service_row = (((sv.city_rank + sv.vet_city_row + slot_data.slot_no - 2) % (SELECT COUNT(*) FROM available_services)) + 1)
)
INSERT INTO appointments (
    user_id,
    pet_id,
    veterinarian_id,
    service_id,
    appointment_date,
    appointment_time,
    status
)
SELECT
    user_id,
    pet_id,
    veterinarian_id,
    service_id,
    appointment_date,
    appointment_time,
    status
FROM seed_slots seed
WHERE NOT EXISTS (
    SELECT 1
    FROM appointments existing
    WHERE existing.veterinarian_id = seed.veterinarian_id
      AND existing.appointment_date = seed.appointment_date
      AND existing.appointment_time = seed.appointment_time
);

-- ============================================================================
-- SECTION 9: Hizmet Adı Temizliği (Eski adları güncelle)
-- ============================================================================
UPDATE appointments
SET service_id = (
  SELECT id FROM services WHERE service_name = 'Aşı Uygulaması' LIMIT 1
)
WHERE service_id = (
  SELECT id FROM services WHERE service_name = 'Aşı' LIMIT 1
);

UPDATE appointments
SET appointment_date = appointment_date + INTERVAL '1 day'
WHERE status = 'İptal';


