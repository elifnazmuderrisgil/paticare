INSERT INTO users (full_name, email, password, phone, role)
VALUES
('Merve Kaya', 'merve@gmail.com', '123456', '05550000001', 'customer'),
('Ali Demir', 'ali@gmail.com', '123456', '05550000002', 'customer'),
('Zeynep Arslan', 'zeynep2@gmail.com', '123456', '05550000003', 'customer'),
('Can Yılmaz', 'can@gmail.com', '123456', '05550000004', 'customer')
ON CONFLICT (email) DO NOTHING;

INSERT INTO pets (user_id, name, species, breed, age, gender)
SELECT u.id, pet_data.name, pet_data.species, pet_data.breed, pet_data.age, pet_data.gender
FROM (
    VALUES
    ('merve@gmail.com', 'Luna', 'Kedi', 'British Shorthair', 2, 'Dişi'),
    ('ali@gmail.com', 'Max', 'Köpek', 'Golden Retriever', 4, 'Erkek'),
    ('zeynep2@gmail.com', 'Çakıl', 'Köpek', 'Terrier', 3, 'Erkek'),
    ('can@gmail.com', 'Maviş', 'Kuş', 'Muhabbet Kuşu', 1, 'Dişi')
) AS pet_data(email, name, species, breed, age, gender)
JOIN users u ON u.email = pet_data.email
WHERE NOT EXISTS (
    SELECT 1
    FROM pets p
    WHERE p.user_id = u.id
      AND p.name = pet_data.name
);

WITH demo_pets AS (
    SELECT
        p.id AS pet_id,
        p.user_id,
        ROW_NUMBER() OVER (ORDER BY p.id) AS pet_row
    FROM pets p
    JOIN users u ON u.id = p.user_id
    WHERE u.email IN ('merve@gmail.com', 'ali@gmail.com', 'zeynep2@gmail.com', 'can@gmail.com')
),
demo_services AS (
    SELECT
        s.id AS service_id,
        ROW_NUMBER() OVER (ORDER BY s.id) AS service_row
    FROM services s
),
veterinarian_slots AS (
    SELECT
        v.id AS veterinarian_id,
        ROW_NUMBER() OVER (ORDER BY v.id) AS vet_row
    FROM veterinarians v
),
appointment_seed AS (
    SELECT
        vs.veterinarian_id,
        dp.user_id,
        dp.pet_id,
        ds.service_id,
        (CURRENT_DATE + ((vs.vet_row % 14) + slot_data.slot_no + 1)::int) AS appointment_date,
        (
            TIME '08:00'
            + (((vs.vet_row + slot_data.slot_no * 3) % 19) * INTERVAL '30 minutes')
        )::time AS appointment_time,
        CASE ((vs.vet_row + slot_data.slot_no) % 3)
            WHEN 0 THEN 'Bekliyor'
            WHEN 1 THEN 'Onaylandı'
            ELSE 'Tamamlandı'
        END AS status
    FROM veterinarian_slots vs
    CROSS JOIN (
        VALUES (1), (2)
    ) AS slot_data(slot_no)
    JOIN demo_pets dp ON dp.pet_row = (((vs.vet_row + slot_data.slot_no - 2) % 4) + 1)
    JOIN demo_services ds ON ds.service_row = (((vs.vet_row + slot_data.slot_no - 2) % (SELECT COUNT(*) FROM demo_services)) + 1)
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
