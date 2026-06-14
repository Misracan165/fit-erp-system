# FitERP - Veritabanı Yöneticisi Rehberi

Bu kılavuz, **FitERP** sisteminin veritabanı mimarisini, tabloları, veri tiplerini ve sistem yöneticileri ile veritabanı yöneticilerinin (DBA) sistemi nasıl kurup yöneteceğini açıklamaktadır.

---

## 🏗️ Veritabanı Mimarisi

FitERP, verileri saklamak için ilişkisel bir veritabanı yönetim sistemi olan **MySQL** kullanmaktadır. Veritabanının adı varsayılan olarak `fiterp_db`'dir. 

Veritabanı bağlantısı backend üzerinde bir bağlantı havuzu (connection pool) yönetimi ile kurulur. Bağlantı havuzu ayarları ve konfigürasyonları **[backend/server.js](file:///c:/Users/BİLİŞİM/OneDrive/Masaüstü/fitERP/fit-erp-system/backend/server.js)** dosyasında tanımlıdır.

---

## 1. Tablo Kurulum Sorguları (DDL)

Sistem kurulurken kullanılacak SQL tablolarının DDL tanımları aşağıda belirtilmiştir:

### A. Spor Salonu Yönetim Tabloları (Manuel Oluşturulmalıdır)

```sql
-- 1. Üye Paketleri Tablosu
CREATE TABLE IF NOT EXISTS packages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  duration_months INT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Spor Salonu Üyeleri Tablosu
CREATE TABLE IF NOT EXISTS members (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  membership_type VARCHAR(100),
  start_date DATE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Eğitmenler Tablosu
CREATE TABLE IF NOT EXISTS trainers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  specialty VARCHAR(255),
  phone VARCHAR(50),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Ödemeler / Tahsilat Tablosu
CREATE TABLE IF NOT EXISTS payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  member_id INT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  payment_date DATE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### B. Proje Yönetimi Tabloları (Sunucu Tarafından Otomatik Oluşturulur)

Backend başlatıldığında `initializePMTables` fonksiyonu aracılığıyla aşağıdaki tablolar otomatik olarak oluşturulmaktadır:

```sql
-- 1. Proje Ekip Üyeleri
CREATE TABLE IF NOT EXISTS pm_team (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(255),
  email VARCHAR(255)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Proje Görevleri (Bağımlılıklar virgülle ayrılmış PM Görev ID'leridir)
CREATE TABLE IF NOT EXISTS pm_tasks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  start_date DATE,
  duration_days INT DEFAULT 1,
  progress INT DEFAULT 0,
  assignee_id INT,
  dependencies VARCHAR(255),
  FOREIGN KEY (assignee_id) REFERENCES pm_team(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Proje Bütçesi
CREATE TABLE IF NOT EXISTS pm_budget (
  id INT AUTO_INCREMENT PRIMARY KEY,
  type ENUM('income', 'expense') NOT NULL,
  category VARCHAR(255) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  date DATE,
  description TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

## 💻 Veritabanı Yöneticisi Modülü (Web Arayüzü)

FitERP içinde yer alan interaktif veritabanı yöneticisine, frontend arayüzündeki `/db-manager` rotasından (**[DatabaseManager.jsx](file:///c:/Users/BİLİŞİM/OneDrive/Masaüstü/fitERP/fit-erp-system/frontend/src/pages/DatabaseManager.jsx)** dosyası ile render edilir) erişilebilir.

### 🌟 Özellikleri:
1.  **Şema İnceleyici (Schema Viewer)**: Veritabanındaki tüm tabloları, sütun adlarını, veri tiplerini, Primary Key (Birincil Anahtar) ve Foreign Key (Yabancı Anahtar) kısıtlamalarını şema kartları üzerinde görüntüler.
2.  **SQL Editörü**: Serbestçe SELECT, INSERT, UPDATE, DELETE gibi SQL komutlarını çalıştırmayı sağlar. Yazılan sorguların çalışma süresi (milisaniye bazında) ölçülür.
3.  **İstatistik Paneli**: Her tablonun veritabanında kapladığı alanı (boyut bayt cinsinden) ve toplam kayıt (satır) sayılarını anlık gösterir.
4.  **Hızlı Tablo Gezgini**: Sol menüden tıklanan herhangi bir tablonun ilk 100 kaydını hızlıca listeler, arama ve filtreleme yapılmasına olanak tanır.
5.  **Veri Dışa Aktarma**: Sorgu sonuçlarını tek tıkla **CSV** veya **JSON** formatlarında indirme desteği sunar.

---

## 📡 Veritabanı API Uç Noktaları (Endpoints)

Veritabanı yöneticisi modülüne güç veren backend API endpoints listesi:

*   **`GET /db/schema`**: Veritabanındaki tüm tabloları ve kolon bilgilerini JSON nesnesi olarak döndürür.
*   **`GET /db/stats`**: Tablo isimlerini, kayıt sayılarını ve veri boyutlarını liste halinde döndürür.
*   **`GET /db/table/:name`**: Belirtilen tablodaki kayıtları (`LIMIT 100`) ve alan isimlerini çeker.
*   **`POST /db/query`**: Gönderilen SQL sorgusunu veritabanında çalıştırır. Sorgu başarılıysa dönen sonuçları, etkilenen satır sayısını ve çalışma süresini iletir.

---

## 🛡️ Güvenlik ve DDL Koruması

SQL Editörü üzerinden yanlışlıkla yapılabilecek yıkıcı komutları engellemek amacıyla **[server.js](file:///c:/Users/BİLİŞİM/OneDrive/Masaüstü/fitERP/fit-erp-system/backend/server.js)** içerisinde bir güvenlik filtresi uygulanmaktadır:
*   Gönderilen SQL sorgusunun başında `DROP DATABASE` veya `DROP SCHEMA` ifadeleri tespit edilirse işlem bloke edilir ve `403 Forbidden` hata kodu ile birlikte *"DROP DATABASE / SCHEMA komutuna izin verilmiyor."* uyarısı döner.

---

## 📊 Örnek DBA ve Analiz Sorguları

Veritabanı yöneticisi paneli üzerinden çalıştırabileceğiniz bazı yararlı SQL şablonları:

### 1. En Çok Gelir Getiren Üyelik Paketleri
```sql
SELECT p.name AS paket_adi, COUNT(m.id) AS uye_sayisi, SUM(pay.amount) AS toplam_tahsilat
FROM packages p
LEFT JOIN members m ON m.membership_type = p.name
LEFT JOIN payments pay ON pay.member_id = m.id
GROUP BY p.id, p.name
ORDER BY toplam_tahsilat DESC;
```

### 2. Ödeme Yapmayan veya Geciken Üyeler
```sql
SELECT m.full_name, m.email, m.phone, m.membership_type
FROM members m
LEFT JOIN payments p ON m.id = p.member_id
WHERE p.id IS NULL;
```

### 3. Ortalama Görev Tamamlama Yüzdesine Göre Ekip Performansı
```sql
SELECT t.full_name AS calisan, t.role AS rol, COUNT(tk.id) AS toplam_gorev, ROUND(AVG(tk.progress), 1) AS ortalama_ilerleme
FROM pm_team t
LEFT JOIN pm_tasks tk ON t.id = tk.assignee_id
GROUP BY t.id, t.full_name, t.role
ORDER BY ortalama_ilerleme DESC;
```
