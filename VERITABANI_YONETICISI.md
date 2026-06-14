# 🗄️ FitERP & AgroERP — Veritabanı Yönetim Panelleri Kılavuzu

Uygulamada iki farklı veritabanı yönetim katmanı yer almaktadır:
1. **FitERP Canlı MySQL Arayüzü:** React frontend üzerinden backend sunucusuna bağlanarak canlı MySQL veritabanını (`fiterp_db`) yöneten ekran (`DatabaseManager.jsx`).
2. **AgroERP SQLite Simülatörü:** WebAssembly tabanlı SQLite (`sql.js`) kullanarak tarım odaklı bir ERP sistemini tarayıcı belleğinde tamamen bağımsız simüle eden HTML5 uygulaması (`2026 AgroERP_DB_Yoneticisi.html`).

---

## 1. Veritabanı Mimarileri ve ER Şemaları

### A. FitERP MySQL Arayüzü Şeması
Bu şema spor salonu üyelik sistemini ve entegre proje yönetim araçlarını temsil eder. Canlı MySQL üzerinde koşar.

```mermaid
erDiagram
    members {
        int id PK
        varchar full_name
        varchar email
        varchar phone
        varchar membership_type
        date start_date
    }
    payments {
        int id PK
        int member_id FK
        decimal amount
        date payment_date
    }
    trainers {
        int id PK
        varchar full_name
        varchar specialty
        varchar phone
    }
    packages {
        int id PK
        varchar name
        int duration_months
        decimal price
        text description
        datetime created_at
    }
    pm_team {
        int id PK
        varchar full_name
        varchar role
        varchar email
    }
    pm_tasks {
        int id PK
        varchar name
        text description
        date start_date
        int duration_days
        int progress
        int assignee_id FK
        varchar dependencies
    }
    pm_budget {
        int id PK
        enum type
        varchar category
        decimal amount
        date date
        text description
    }

    members ||--o{ payments : "has"
    pm_team ||--o{ pm_tasks : "assignee"
```

---

### B. Standalone AgroERP Şeması (SQLite Simülatörü)
Bu modül, kapsamlı bir tarım/üretim odaklı ERP şemasını simüle eder ve `2026 AgroERP_DB_Yoneticisi.html` üzerinde SQLite in-memory olarak çalışır. 14 adet ilişkisel tablodan oluşur:

```mermaid
erDiagram
    kullanicilar {
        int id PK
        text ad_soyad
        text email
        text sifre_hash
        text rol
        text departman
        boolean aktif
        datetime olusturma_tarihi
        datetime son_giris
    }
    urunler {
        int id PK
        text kod
        text ad
        text kategori
        text aciklama
        real satis_fiyati_usd
        real uretim_maliyeti
        int min_stok
        boolean aktif
        int uretim_suresi_gun
        datetime olusturma
    }
    musteriler {
        int id PK
        text kod
        text ad
        text ulke
        text sehir
        text adres
        text telefon
        text email
        text vergi_no
        boolean yurt_disi
        real kredi_limiti
        boolean aktif
        datetime olusturma
    }
    siparis_basliklari {
        int id PK
        text siparis_no
        int musteri_id FK
        datetime tarih
        datetime teslim_tarihi
        text durum
        text odeme_durumu
        text odeme_tipi
        text para_birimi
        text notlar
        real toplam_tutar
        int olusturan_id FK
    }
    siparis_satirlari {
        int id PK
        int siparis_id FK
        int urun_id FK
        int miktar
        real birim_fiyat
        real indirim_oran
        real toplam
    }
    tedarikciler {
        int id PK
        text kod
        text ad
        text ulke
        text sehir
        text telefon
        text email
        text vergi_no
        int odeme_vadesi
        boolean aktif
        real puanlama
        datetime olusturma
    }
    malzemeler {
        int id PK
        text kod
        text ad
        text kategori
        text birim
        real mevcut_miktar
        real min_miktar
        real maks_miktar
        real birim_maliyet
        int tedarikci_id FK
        text raf_no
        datetime olusturma
    }
    uretim_emirleri {
        int id PK
        text emir_no
        int siparis_id FK
        int urun_id FK
        int miktar
        datetime baslama_tarihi
        datetime bitis_tarihi
        text durum
        text oncelik
        text notlar
        int olusturan_id FK
        datetime olusturma
    }
    satin_alma_emirleri {
        int id PK
        text sae_no
        int tedarikci_id FK
        int malzeme_id FK
        real miktar
        real birim_fiyat
        real toplam_tutar
        text para_birimi
        datetime siparis_tarihi
        datetime beklenen_tarih
        text durum
        text notlar
        int olusturan_id FK
    }
    kalite_kontrol {
        int id PK
        text kontrol_no
        int uretim_emir_id FK
        int urun_id FK
        datetime kontrol_tarihi
        text kontrol_eden
        int toplam_adet
        int kabul_adet
        int red_adet
        text sonuc
        text notlar
    }
    personel {
        int id PK
        text sicil_no
        text ad
        text soyad
        text departman
        text pozisyon
        real maas
        datetime ise_baslama
        text tc_kimlik
        text telefon
        text email
        boolean aktif
        datetime olusturma
    }
    bakim_kayitlari {
        int id PK
        text bakim_no
        text makine_adi
        text makine_kodu
        text bakim_tipi
        datetime bakim_tarihi
        datetime tamamlanma_tarihi
        text durum
        real maliyet
        text yapan_personel
        text aciklama
        datetime sonraki_bakim
    }
    finans_hareketleri {
        int id PK
        text hareket_no
        datetime tarih
        text tip
        text kategori
        real tutar
        text para_birimi
        real kur
        text aciklama
        text belge_no
        int olusturan_id FK
    }
    stok_hareketleri {
        int id PK
        datetime tarih
        int malzeme_id FK
        text hareket_tipi
        real miktar
        real onceki_miktar
        real sonraki_miktar
        text aciklama
        text belge_no
    }

    musteriler ||--o{ siparis_basliklari : "places"
    kullanicilar ||--o{ siparis_basliklari : "creates"
    siparis_basliklari ||--o{ siparis_satirlari : "contains"
    urunler ||--o{ siparis_satirlari : "item"
    tedarikciler ||--o{ malzemeler : "supplies"
    siparis_basliklari ||--o{ uretim_emirleri : "triggers"
    urunler ||--o{ uretim_emirleri : "produces"
    kullanicilar ||--o{ uretim_emirleri : "issues"
    tedarikciler ||--o{ satin_alma_emirleri : "receives"
    malzemeler ||--o{ satin_alma_emirleri : "buys"
    kullanicilar ||--o{ satin_alma_emirleri : "creates"
    uretim_emirleri ||--o{ kalite_kontrol : "verifies"
    urunler ||--o{ kalite_kontrol : "verifies"
    kullanicilar ||--o{ finans_hareketleri : "creates"
    malzemeler ||--o{ stok_hareketleri : "tracks"
```

---

## 2. Arayüz Yetenekleri ve SQL Editörü

### 🏗️ A. Şema Görünümü (Schema Viewer)
Her iki arayüzde de sol tarafta veritabanındaki tabloların listesi yer alır. Tabloların üzerine tıklandığında:
*   Tablodaki tüm sütunların isimleri, veri tipleri (INTEGER, VARCHAR, TEXT, REAL vb.), Primary Key (PK), Foreign Key (FK) ve Nullable/Not Null (NN) kısıtlamaları görselleştirilir.
*   Her tablonun yanındaki satır sayıları ve disk boyutları canlı olarak `information_schema` veya in-memory SQLite sayaçlarından çekilerek gösterilir.

### ⌨️ B. SQL Editörü (Premium Code Console)
*   **Renklendirilmiş & Numaralandırılmış Satırlar:** Cascadia Code / JetBrains Mono fontlarıyla zenginleştirilmiş koyu mod kod editörü.
*   **Tab Desteği:** Editör içinde `Tab` tuşuna basıldığında form kontrolünü kaybetmeden 2 karakterlik boşluk bırakır.
*   **F5 Kısayolu:** SQL sorgularını hızlı çalıştırmak için F5 klavye kısayolu entegre edilmiştir.
*   **Büyük Harf Formatlayıcı:** `SELECT`, `FROM`, `WHERE`, `JOIN` gibi SQL anahtar kelimelerini otomatik olarak büyük harfe dönüştürür.

> [!IMPORTANT]
> **Veri Güvenliği Kontrolleri (Güvenlik Kalkanı):**
> Kullanıcının yanlışlıkla tüm tabloyu silmesini veya güncellemesini önlemek adına; WHERE koşulu içermeyen `DELETE` ve `UPDATE` komutları ile `DROP` veya `TRUNCATE` ifadeleri çalıştırılmak istendiğinde tarayıcı üzerinden ek bir onay penceresi (`window.confirm`) gösterilmektedir.
> Backend API'lerinde `DROP DATABASE` ve `DROP SCHEMA` komutları doğrudan bloke edilmektedir.

---

## 3. Hazır Şablon Sorgular ve Raporlar

Panellerde sık kullanılan bazı karmaşık SQL sorguları gömülü olarak gelir:

### 📈 Üye Başına Toplam Ödeme (FitERP)
Her üyenin yaptığı ödeme miktarları ve toplam harcaması:
```sql
SELECT m.id, m.full_name AS Uye, m.membership_type AS Paket, 
       COUNT(p.id) AS Odeme_Sayisi, IFNULL(SUM(p.amount), 0) AS Toplam_Odeme
FROM members m
LEFT JOIN payments p ON m.id = p.member_id
GROUP BY m.id, m.full_name, m.membership_type
ORDER BY Toplam_Odeme DESC;
```

### 🔩 Kritik Stok Uyarısı (AgroERP)
Minimum stok seviyesinin altına düşen hammaddeler ve bunları sağlayan tedarikçiler:
```sql
SELECT m.kod, m.ad, m.mevcut_miktar, m.min_miktar, 
       (m.min_miktar - m.mevcut_miktar) AS acik_miktar, t.ad AS tedarikci
FROM malzemeler m
LEFT JOIN tedarikciler t ON m.tedarikci_id = t.id
WHERE m.mevcut_miktar <= m.min_miktar
ORDER BY acik_miktar DESC;
```

### 🏭 Ürün Karlılık Analizi (AgroERP)
Satış fiyatı ile üretim maliyetini kıyaslayıp kar marjını yüzdesel olarak hesaplayan sorgu:
```sql
SELECT kod, ad, satis_fiyati_usd, uretim_maliyeti,
       (satis_fiyati_usd - uretim_maliyeti) AS kar_usd,
       ROUND((satis_fiyati_usd - uretim_maliyeti) * 100.0 / satis_fiyati_usd, 1) AS kar_marji_pct
FROM urunler
WHERE aktif = 1
ORDER BY kar_marji_pct DESC;
```

---

## 4. Dışa Aktarma (Export) Seçenekleri

Sorgu sonuçları veya tablo tarayıcısındaki veriler tek tıkla dışa aktarılabilir:
*   **CSV Dışa Aktar:** Çıktıyı UTF-8 BOM standardına uygun, Excel ile tam uyumlu Türkçe karakter destekli virgülle ayrılmış CSV formatında indirir.
*   **JSON Dışa Aktar:** Veriyi ham, biçimlendirilmiş bir JSON dizisi olarak kaydeder.
*   **SQL Dışa Aktar (SQLite Simülatöründe):** Mevcut veritabanının yapısını ve in-memory verilerini içeren SQL script dosyasını indirir.
