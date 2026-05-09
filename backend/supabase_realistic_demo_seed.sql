DELETE FROM appointments;

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

WITH demo_customers AS (
    SELECT
        u.id AS user_id,
        u.email,
        ROW_NUMBER() OVER (ORDER BY u.id) AS customer_row
    FROM users u
    WHERE u.email IN (
        'merve.kaya.demo@gmail.com',
        'ali.demir.demo@gmail.com',
        'zeynep.arslan.demo@gmail.com',
        'can.yilmaz.demo@gmail.com',
        'burcu.sahin.demo@gmail.com',
        'eren.aksoy.demo@gmail.com',
        'dilan.celik.demo@gmail.com',
        'yusuf.acar.demo@gmail.com',
        'selin.korkmaz.demo@gmail.com',
        'kerem.yildiz.demo@gmail.com',
        'melis.arda.demo@gmail.com',
        'okan.polat.demo@gmail.com',
        'sude.koc.demo@gmail.com',
        'baris.eren.demo@gmail.com',
        'ceren.yalcin.demo@gmail.com',
        'deniz.demir.demo@gmail.com',
        'ahmet.yavuz.demo@gmail.com',
        'gokce.aydin.demo@gmail.com',
        'irem.bulut.demo@gmail.com',
        'murat.kaplan.demo@gmail.com',
        'asli.yuce.demo@gmail.com',
        'tuna.ergin.demo@gmail.com',
        'buse.aksu.demo@gmail.com',
        'emre.gunes.demo@gmail.com'
    )
),
customer_pets AS (
    SELECT
        dc.user_id,
        dc.customer_row,
        p.id AS pet_id,
        ROW_NUMBER() OVER (PARTITION BY dc.user_id ORDER BY p.id) AS pet_row
    FROM demo_customers dc
    JOIN pets p ON p.user_id = dc.user_id
),
vets AS (
    SELECT
        v.id AS veterinarian_id,
        ROW_NUMBER() OVER (ORDER BY v.id) AS vet_row
    FROM veterinarians v
),
vet_customer_slots AS (
    SELECT
        v.veterinarian_id,
        slot_data.slot_no,
        dc.user_id,
        cp.pet_id,
        v.vet_row
    FROM vets v
    CROSS JOIN (VALUES (1), (2), (3), (4), (5)) AS slot_data(slot_no)
    JOIN demo_customers dc
      ON dc.customer_row = (((v.vet_row - 1) % (SELECT COUNT(*) FROM demo_customers)) + 1)
    JOIN customer_pets cp
      ON cp.user_id = dc.user_id
     AND cp.pet_row = (((slot_data.slot_no - 1) % (
         SELECT COUNT(*) FROM customer_pets customer_pet_count
         WHERE customer_pet_count.user_id = dc.user_id
     )) + 1)
),
service_choices AS (
    SELECT
        service_data.service_row,
        s.id AS service_id
    FROM (
        VALUES
        (1, 'Genel Muayene'),
        (2, 'Aşı Uygulaması'),
        (3, 'Tırnak Kesimi'),
        (4, 'Diş Kontrolü'),
        (5, 'Parazit Tedavisi')
    ) AS service_data(service_row, service_name)
    JOIN services s ON s.service_name = service_data.service_name
),
appointment_seed AS (
    SELECT
        vcs.user_id,
        vcs.pet_id,
        vcs.veterinarian_id,
        sc.service_id,
        CASE vcs.slot_no
            WHEN 1 THEN CURRENT_DATE + INTERVAL '3 days'
            WHEN 2 THEN CURRENT_DATE + INTERVAL '7 days'
            WHEN 3 THEN CURRENT_DATE - INTERVAL '5 days'
            WHEN 4 THEN CURRENT_DATE + INTERVAL '14 days'
            ELSE CURRENT_DATE - INTERVAL '10 days'
        END::date AS appointment_date,
        (
            TIME '08:00'
            + (((vcs.vet_row * 3 + vcs.slot_no * 2) % 19) * INTERVAL '30 minutes')
        )::time AS appointment_time,
        CASE vcs.slot_no
            WHEN 1 THEN 'Bekliyor'
            WHEN 2 THEN 'Onaylandı'
            WHEN 3 THEN 'Tamamlandı'
            WHEN 4 THEN 'İptal'
            ELSE
                CASE WHEN vcs.vet_row % 2 = 0 THEN 'Bekliyor' ELSE 'Onaylandı' END
        END AS status
    FROM vet_customer_slots vcs
    JOIN service_choices sc ON sc.service_row = vcs.slot_no
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
FROM appointment_seed seed
WHERE NOT EXISTS (
    SELECT 1
    FROM appointments existing
    WHERE existing.veterinarian_id = seed.veterinarian_id
      AND existing.appointment_date = seed.appointment_date
      AND existing.appointment_time = seed.appointment_time
);
