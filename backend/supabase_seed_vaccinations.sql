ALTER TABLE users
ADD COLUMN IF NOT EXISTS role VARCHAR(30) DEFAULT 'customer';

CREATE TABLE IF NOT EXISTS vaccinations (
    id SERIAL PRIMARY KEY,
    pet_id INT NOT NULL,
    vaccine_name VARCHAR(100) NOT NULL,
    vaccination_date DATE NOT NULL,
    next_due_date DATE NOT NULL,
    notes TEXT,
    FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE
);

INSERT INTO users (full_name, email, password, phone, role)
SELECT 'Elif Yılmaz', 'elif@gmail.com', '123456', '05551112233', 'customer'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'elif@gmail.com');

INSERT INTO users (full_name, email, password, phone, role)
SELECT 'Zeynep Kaya', 'zeynep@gmail.com', '123456', '05553334455', 'customer'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'zeynep@gmail.com');

INSERT INTO users (full_name, email, password, phone, role)
SELECT 'Ahmet Demir', 'ahmet@gmail.com', '123456', '05554445566', 'customer'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'ahmet@gmail.com');

INSERT INTO users (full_name, email, password, phone, role)
SELECT 'Dr. Ayşe Demir', 'ayse@vet.com', '123456', '05552223344', 'veterinarian'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'ayse@vet.com');

INSERT INTO users (full_name, email, password, phone, role)
SELECT 'Dr. Mehmet Can', 'mehmet@vet.com', '123456', '05556667788', 'veterinarian'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'mehmet@vet.com');

INSERT INTO veterinarians (full_name, specialty, phone, email)
SELECT 'Dr. Ayşe Demir', 'Kedi ve Köpek Hastalıkları', '05552223344', 'ayse@vet.com'
WHERE NOT EXISTS (SELECT 1 FROM veterinarians WHERE email = 'ayse@vet.com');

INSERT INTO veterinarians (full_name, specialty, phone, email)
SELECT 'Dr. Mehmet Can', 'Egzotik Hayvanlar', '05556667788', 'mehmet@vet.com'
WHERE NOT EXISTS (SELECT 1 FROM veterinarians WHERE email = 'mehmet@vet.com');

INSERT INTO veterinarians (full_name, specialty, phone, email)
SELECT 'Dr. Selin Arslan', 'Genel Veterinerlik', '05558889900', 'selin@vet.com'
WHERE NOT EXISTS (SELECT 1 FROM veterinarians WHERE email = 'selin@vet.com');

INSERT INTO services (service_name, price)
SELECT 'Genel Muayene', 500.00
WHERE NOT EXISTS (SELECT 1 FROM services WHERE service_name = 'Genel Muayene');

INSERT INTO services (service_name, price)
SELECT 'Aşı', 350.00
WHERE NOT EXISTS (SELECT 1 FROM services WHERE service_name = 'Aşı');

INSERT INTO services (service_name, price)
SELECT 'Tırnak Kesimi', 150.00
WHERE NOT EXISTS (SELECT 1 FROM services WHERE service_name = 'Tırnak Kesimi');

INSERT INTO services (service_name, price)
SELECT 'Acil Kontrol', 750.00
WHERE NOT EXISTS (SELECT 1 FROM services WHERE service_name = 'Acil Kontrol');

INSERT INTO services (service_name, price)
SELECT 'Kontrol Muayenesi', 300.00
WHERE NOT EXISTS (SELECT 1 FROM services WHERE service_name = 'Kontrol Muayenesi');

INSERT INTO pets (user_id, name, species, breed, age, gender)
SELECT u.id, 'Pamuk', 'Kedi', 'Tekir', 3, 'Dişi'
FROM users u
WHERE u.email = 'elif@gmail.com'
  AND NOT EXISTS (
      SELECT 1 FROM pets p WHERE p.user_id = u.id AND p.name = 'Pamuk'
  );

INSERT INTO pets (user_id, name, species, breed, age, gender)
SELECT u.id, 'Karabaş', 'Köpek', 'Golden', 4, 'Erkek'
FROM users u
WHERE u.email = 'elif@gmail.com'
  AND NOT EXISTS (
      SELECT 1 FROM pets p WHERE p.user_id = u.id AND p.name = 'Karabaş'
  );

INSERT INTO pets (user_id, name, species, breed, age, gender)
SELECT u.id, 'Luna', 'Kedi', 'British Shorthair', 2, 'Dişi'
FROM users u
WHERE u.email = 'zeynep@gmail.com'
  AND NOT EXISTS (
      SELECT 1 FROM pets p WHERE p.user_id = u.id AND p.name = 'Luna'
  );

INSERT INTO pets (user_id, name, species, breed, age, gender)
SELECT u.id, 'Max', 'Köpek', 'Labrador', 5, 'Erkek'
FROM users u
WHERE u.email = 'ahmet@gmail.com'
  AND NOT EXISTS (
      SELECT 1 FROM pets p WHERE p.user_id = u.id AND p.name = 'Max'
  );

INSERT INTO pets (user_id, name, species, breed, age, gender)
SELECT u.id, 'Mavi', 'Kuş', 'Muhabbet Kuşu', 1, 'Erkek'
FROM users u
WHERE u.email = 'ahmet@gmail.com'
  AND NOT EXISTS (
      SELECT 1 FROM pets p WHERE p.user_id = u.id AND p.name = 'Mavi'
  );

INSERT INTO vaccinations (pet_id, vaccine_name, vaccination_date, next_due_date, notes)
SELECT p.id, 'Karma Aşı', '2025-05-01', '2026-05-01', 'Yıllık tekrar gecikmiş.'
FROM pets p
JOIN users u ON u.id = p.user_id
WHERE u.email = 'elif@gmail.com'
  AND p.name = 'Pamuk'
  AND NOT EXISTS (
      SELECT 1 FROM vaccinations v
      WHERE v.pet_id = p.id AND v.vaccine_name = 'Karma Aşı'
  );

INSERT INTO vaccinations (pet_id, vaccine_name, vaccination_date, next_due_date, notes)
SELECT p.id, 'Kuduz Aşısı', '2025-05-20', '2026-05-20', 'Yaklaşan yıllık tekrar.'
FROM pets p
JOIN users u ON u.id = p.user_id
WHERE u.email = 'elif@gmail.com'
  AND p.name = 'Karabaş'
  AND NOT EXISTS (
      SELECT 1 FROM vaccinations v
      WHERE v.pet_id = p.id AND v.vaccine_name = 'Kuduz Aşısı'
  );

INSERT INTO vaccinations (pet_id, vaccine_name, vaccination_date, next_due_date, notes)
SELECT p.id, 'Lösemi Aşısı', '2026-02-10', '2026-08-10', 'Rutin takip.'
FROM pets p
JOIN users u ON u.id = p.user_id
WHERE u.email = 'zeynep@gmail.com'
  AND p.name = 'Luna'
  AND NOT EXISTS (
      SELECT 1 FROM vaccinations v
      WHERE v.pet_id = p.id AND v.vaccine_name = 'Lösemi Aşısı'
  );

INSERT INTO vaccinations (pet_id, vaccine_name, vaccination_date, next_due_date, notes)
SELECT p.id, 'Bronşin Aşısı', '2026-03-15', '2026-09-15', 'Köpek parkı öncesi takip önerildi.'
FROM pets p
JOIN users u ON u.id = p.user_id
WHERE u.email = 'ahmet@gmail.com'
  AND p.name = 'Max'
  AND NOT EXISTS (
      SELECT 1 FROM vaccinations v
      WHERE v.pet_id = p.id AND v.vaccine_name = 'Bronşin Aşısı'
  );

INSERT INTO vaccinations (pet_id, vaccine_name, vaccination_date, next_due_date, notes)
SELECT p.id, 'Parazit Uygulaması', '2026-04-25', '2026-05-25', 'Kontrol tarihi yaklaşıyor.'
FROM pets p
JOIN users u ON u.id = p.user_id
WHERE u.email = 'ahmet@gmail.com'
  AND p.name = 'Mavi'
  AND NOT EXISTS (
      SELECT 1 FROM vaccinations v
      WHERE v.pet_id = p.id AND v.vaccine_name = 'Parazit Uygulaması'
  );
