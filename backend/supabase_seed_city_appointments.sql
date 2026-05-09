WITH city_veterinarians AS (
    SELECT
        v.id AS veterinarian_id,
        v.city_id,
        DENSE_RANK() OVER (ORDER BY v.city_id) AS city_rank,
        ROW_NUMBER() OVER (PARTITION BY v.city_id ORDER BY v.id) AS vet_city_row
    FROM veterinarians v
    JOIN cities c ON c.id = v.city_id
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
