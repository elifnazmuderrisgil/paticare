# SQL Scripts - Organize Yapı

Tüm SQL dosyaları **şema oluşturma**, **veri ekleme** ve **temizleme** gibi işlevlere göre organize edilmiştir.

## 📋 Dosyalar

### 1️⃣ `00_schema.sql` - Veritabanı Şeması
**Amaç**: Tüm tabloları ve sütunları oluşturma/değiştirme

**İçerir**:
- `cities` tablosu oluşturma
- `veterinarians` tablosuna sütun ekleme:
  - `clinic_name`, `district`, `address`
  - `password`, `city_id`

**Çalıştırma**: İlk kez başlatıldığında
```bash
psql -f sql/00_schema.sql
```

---

### 2️⃣ `01_seed.sql` - Veri Ekleme (INSERT/UPDATE)
**Amaç**: Demo verileri ve referans verileri yükleme

**İçerir** (9 bölüm):
1. Şehirler (İstanbul, Ankara, İzmir, vb.)
2. Mevcut veterinerleri güncelle
3. Yeni veterinerleri ekle (16 veteriner)
4. Veteriner şifreleri
5. Hizmetleri ekle (Genel Muayene, Aşı, vb.)
6. Demo müşteriler (24 customer)
7. Demo evcil hayvanlar (28 pet)
8. Demo randevular
9. Hizmet adı temizliği

**Çalıştırma**:
```bash
psql -f sql/01_seed.sql
```

---

### 3️⃣ `02_cleanup.sql` - Veritabanı Temizleme (DELETE)
**Amaç**: Verileri silme (Demo'yu sıfırlamak için)

**⚠️ UYARI**: Bu script verileri silecektir!

**Siler**:
- Randevuları (`DELETE FROM appointments`)
- Demo müşterileri (`WHERE email LIKE %.demo@gmail.com`)
- Evcil hayvanları
- Şehirleri
- Hatalı hizmet adlarını

**Çalıştırma**:
```bash
psql -f sql/02_cleanup.sql
```

---

## 🚀 Çalıştırma Senaryoları

### İlk Kurulum (Tüm Setup)
```bash
psql -f sql/00_schema.sql  # Şema oluştur
psql -f sql/01_seed.sql    # Veri ekle
```

### Demo'yu Sıfırla
```bash
psql -f sql/02_cleanup.sql # Veriyi sil
psql -f sql/01_seed.sql    # Yeniden veri ekle
```

### Tek Seferde Çalıştır
```bash
cat sql/00_schema.sql sql/01_seed.sql | psql
```

---

## 💡 Supabase Konsolu Kullanımı

```bash
# Dosya içeriğini Supabase SQL Editor'a kopyala ve çalıştır
cat sql/00_schema.sql
cat sql/01_seed.sql
cat sql/02_cleanup.sql
```

---

## ⚠️ Önemli Notlar

✅ **Yapılması Gerekenler:**
- İlk kurulumda `00_schema.sql` → `01_seed.sql` sırasını takip et
- Production öncesinde **backup al**
- Test ortamında `02_cleanup.sql` dene

❌ **Yapılmaması Gerekenler:**
- `02_cleanup.sql`'i test etmeden üretimde çalıştırma
- Backup almadan `02_cleanup.sql` kullanma

---

## 📊 Veri Özeti

| İşlem | Veri Sayısı |
|-------|------------|
| Şehir | 8 |
| Veteriner | 16 |
| Hizmet | 10 |
| Demo Müşteri | 24 |
| Demo Pet | 28 |
| Demo Randevu | 150+ |

