ALTER TABLE veterinarians ADD COLUMN IF NOT EXISTS clinic_name VARCHAR(150);
ALTER TABLE veterinarians ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE veterinarians ADD COLUMN IF NOT EXISTS district VARCHAR(100);
ALTER TABLE veterinarians ADD COLUMN IF NOT EXISTS address TEXT;

UPDATE veterinarians
SET
    clinic_name = 'Pati Dostum Veteriner Kliniği',
    city = 'İstanbul',
    district = 'Kadıköy',
    address = 'Caferağa Mahallesi, Moda Caddesi No: 12 Kadıköy / İstanbul'
WHERE email = 'ayse@vet.com' OR full_name = 'Dr. Ayşe Demir';

UPDATE veterinarians
SET
    clinic_name = 'Minik Patiler Kliniği',
    city = 'İstanbul',
    district = 'Beşiktaş',
    address = 'Sinanpaşa Mahallesi, Ortabahçe Caddesi No: 8 Beşiktaş / İstanbul'
WHERE email = 'mehmet@vet.com' OR full_name = 'Dr. Mehmet Can';

UPDATE veterinarians
SET
    clinic_name = 'Sağlıklı Pati Kliniği',
    city = 'Ankara',
    district = 'Çankaya',
    address = 'Bahçelievler Mahallesi, 7. Cadde No: 24 Çankaya / Ankara'
WHERE email = 'selin@vet.com' OR full_name = 'Dr. Selin Arslan';

INSERT INTO veterinarians (full_name, specialty, phone, email, clinic_name, city, district, address)
SELECT 'Dr. Burak Yılmaz', NULL, '05550102030', 'burak@vet.com', 'Ege Vet Kliniği', 'İzmir', 'Karşıyaka', 'Bostanlı Mahallesi, Cemal Gürsel Caddesi No: 45 Karşıyaka / İzmir'
WHERE NOT EXISTS (SELECT 1 FROM veterinarians WHERE email = 'burak@vet.com');

INSERT INTO veterinarians (full_name, specialty, phone, email, clinic_name, city, district, address)
SELECT 'Dr. Elif Kaya', NULL, '05550405060', 'elifkaya@vet.com', 'Can Dostlar Vet', 'Gaziantep', 'Şahinbey', 'Binevler Mahallesi, Üniversite Bulvarı No: 18 Şahinbey / Gaziantep'
WHERE NOT EXISTS (SELECT 1 FROM veterinarians WHERE email = 'elifkaya@vet.com');

INSERT INTO veterinarians (full_name, specialty, phone, email, clinic_name, city, district, address)
SELECT 'Dr. Murat Demir', NULL, '05550708090', 'murat@vet.com', 'Pati Yaşam Kliniği', 'Gaziantep', 'Şehitkamil', 'Atatürk Mahallesi, İpekyolu Caddesi No: 31 Şehitkamil / Gaziantep'
WHERE NOT EXISTS (SELECT 1 FROM veterinarians WHERE email = 'murat@vet.com');
