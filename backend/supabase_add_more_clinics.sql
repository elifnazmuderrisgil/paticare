INSERT INTO veterinarians (full_name, clinic_name, city, district, address)
VALUES
('Dr. Deniz Acar', 'Mersin Pati Kliniği', 'Mersin', 'Yenişehir', 'Mersin Yenişehir merkez'),
('Dr. Ceren Yıldız', 'Mezitli VetCare', 'Mersin', 'Mezitli', 'Mersin Mezitli sahil yolu'),
('Dr. Emre Kılıç', 'Toroslar Hayvan Sağlığı', 'Mersin', 'Toroslar', 'Mersin Toroslar merkez'),
('Dr. Selin Koç', 'Adana Can Dostum Vet', 'Adana', 'Seyhan', 'Adana Seyhan merkez'),
('Dr. Barış Eren', 'Çukurova Pati Merkezi', 'Adana', 'Çukurova', 'Adana Çukurova merkez'),
('Dr. Melis Arda', 'Yüreğir Veteriner Kliniği', 'Adana', 'Yüreğir', 'Adana Yüreğir merkez'),
('Dr. Ece Demir', 'Antalya PetLife', 'Antalya', 'Muratpaşa', 'Antalya Muratpaşa merkez'),
('Dr. Kerem Yalçın', 'Konyaaltı Pati Kliniği', 'Antalya', 'Konyaaltı', 'Antalya Konyaaltı sahil'),
('Dr. Sude Aksoy', 'Alanya VetPoint', 'Antalya', 'Alanya', 'Antalya Alanya merkez'),
('Dr. Okan Yılmaz', 'Eskişehir Pati Sağlığı', 'Eskişehir', 'Odunpazarı', 'Eskişehir Odunpazarı merkez'),
('Dr. Derya Şahin', 'Tepebaşı Vet Kliniği', 'Eskişehir', 'Tepebaşı', 'Eskişehir Tepebaşı merkez')
ON CONFLICT DO NOTHING;
