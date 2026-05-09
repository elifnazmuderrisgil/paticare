UPDATE appointments
SET service_id = (
  SELECT id FROM services WHERE service_name = 'Aşı Uygulaması' LIMIT 1
)
WHERE service_id = (
  SELECT id FROM services WHERE service_name = 'Aşı' LIMIT 1
);

DELETE FROM services
WHERE service_name = 'Aşı';
