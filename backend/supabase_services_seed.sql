INSERT INTO services (service_name, price)
VALUES
('Genel Muayene', 500),
('Aşı Uygulaması', 400),
('Tırnak Kesimi', 200),
('Acil Kontrol', 1000),
('Kontrol Muayenesi', 350),
('Diş Kontrolü', 600),
('Parazit Tedavisi', 450),
('Kısırlaştırma Danışmanlığı', 750),
('Beslenme Danışmanlığı', 300),
('Cilt ve Tüy Kontrolü', 550)
ON CONFLICT DO NOTHING;
