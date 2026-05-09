DROP TABLE IF EXISTS vaccinations;

CREATE TABLE IF NOT EXISTS cities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL
);

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

ALTER TABLE veterinarians
ADD COLUMN IF NOT EXISTS city_id INT REFERENCES cities(id);

UPDATE veterinarians v
SET city_id = c.id
FROM cities c
WHERE v.city = c.name;
