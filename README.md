# 🏋️‍♂️ FitERP — Spor Salonu ve Modüler İşletme Yönetim Sistemi

FitERP; modern spor salonları ve işletmelerin üye kayıtları, eğitmen takipleri, ödeme ve paket tanımları gibi operasyonel süreçlerini yönetmenin yanı sıra, gelişmiş bir **Veritabanı Yönetim Paneli** ve **Proje Yönetimi (CPM/Gantt)** modülü barındıran tam donanımlı, hibrit bir kurumsal kaynak planlama (ERP) uygulamasıdır.

Bu proje, işletmenin hem operasyonel (fitness/üye yönetimi) hem de yönetsel/teknik (proje planlama, kritik yol analizi ve canlı veritabanı şema yönetimi) ihtiyaçlarını tek bir çatı altında birleştirmektedir.

---

## 📂 Proje Dizin Yapısı

Proje, istemci ve sunucu mimarisi ayrık olacak şekilde monorepo yapısında tasarlanmıştır:

```text
fit-erp-system/
├── backend/                  # Node.js + Express Sunucusu
│   ├── node_modules/         # Sunucu bağımlılıkları
│   ├── package.json          # Sunucu bağımlılık tanımları
│   └── server.js             # API rotaları, MySQL Havuz yönetimi ve DB API'leri
├── frontend/                 # React + Vite İstemcisi
│   ├── public/               # Statik varlıklar
│   ├── src/                  # React Kaynak Kodları
│   │   ├── components/       # Ortak UI Bileşenleri
│   │   ├── layouts/          # Sayfa Düzenleri (MainLayout vb.)
│   │   ├── pages/            # Sayfa Bileşenleri (Dashboard, Members, PM, DBManager vb.)
│   │   ├── services/         # API servis entegrasyonları
│   │   ├── styles/           # Genel ve tema CSS dosyaları
│   │   ├── App.jsx           # Ana yönlendirici ve uygulama kökü
│   │   └── main.jsx          # Giriş noktası
│   ├── vite.config.js        # Vite yapılandırma dosyası
│   └── package.json          # İstemci bağımlılık tanımları
├── 2026 AgroERP_DB_Yoneticisi (1).html # Standalone SQLite/sql.js Veritabanı Yöneticisi simülatörü
└── README.md                 # Ana Proje Kılavuzu (Bu dosya)
```

---

## 🛠️ Teknoloji Yığını

*   **Frontend (İstemci):** React (v18), Vite, React Router DOM, HTML5 & Vanilla CSS3 (modern cam morfolojisi, karanlık mod esintileri, özel animasyonlar).
*   **Backend (Sunucu):** Node.js, Express.js, MySQL2 (Bağlantı Havuzlaması - Connection Pooling ile yüksek performans).
*   **Veritabanı:** MySQL (Üretim ortamı), SQLite / sql.js (AgroERP istemci simülatörü).
*   **Planlama & Algoritmalar:** Kritik Yol Yöntemi (CPM - Critical Path Method) ve Topological Sort (Döngüsel Bağımlılık Kontrolü).

---

## ⚙️ Kurulum ve Çalıştırma

Uygulamayı yerel bilgisayarınızda çalıştırmak için aşağıdaki adımları sırasıyla uygulayınız:

### 1. Ön Gereksinimler
*   Bilgisayarınızda **Node.js** (v16+) yüklü olmalıdır.
*   Yerel bir **MySQL** sunucusu (WampServer, XAMPP veya doğrudan MySQL Community Server) çalışıyor olmalıdır.

### 2. Veritabanı Hazırlığı
MySQL arayüzünüzde (veya terminalde) aşağıdaki sorgu ile veritabanını oluşturun:
```sql
CREATE DATABASE fiterp_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```
*Varsayılan bağlantı ayarları `backend/server.js` dosyasında `host: "localhost"`, `user: "root"`, `password: "root123"` olarak yapılandırılmıştır. Kendi MySQL şifreniz farklı ise ilgili satırı güncelleyiniz.*

### 3. Backend (Sunucu) Kurulumu
1. `backend` klasörüne geçiş yapın:
   ```bash
   cd backend
   ```
2. Gerekli paketleri yükleyin:
   ```bash
   npm install
   ```
3. Sunucuyu başlatın (Nodemon ile otomatik yenilemeli):
   ```bash
   npm start
   ```
   *Sunucu varsayılan olarak **http://localhost:5000** portunda çalışmaya başlayacaktır. İlk çalıştırmada veritabanında gerekli olan `pm_team`, `pm_tasks` ve `pm_budget` tabloları otomatik oluşturulacaktır.*

### 4. Frontend (İstemci) Kurulumu
1. Yeni bir terminal açıp `frontend` klasörüne geçiş yapın:
   ```bash
   cd frontend
   ```
2. Paketleri yükleyin:
   ```bash
   npm install
   ```
3. İstemciyi geliştirme modunda çalıştırın:
   ```bash
   npm run dev
   ```
   *Arayüz varsayılan olarak **http://localhost:5173** adresinde açılacaktır.*

---

## 📚 Alt Sistemler ve Detaylı Dokümantasyonlar

FitERP sisteminin iki devasa alt modülü bulunmaktadır. Bu modüller hakkında teknik mimari, veritabanı şemaları, iş kuralları ve algoritmik detaylar için özel olarak hazırlanan kılavuzları inceleyebilirsiniz:

### 🗄️ 1. Veritabanı Yöneticisi (Database Administrator)
Canlı MySQL veritabanı şemasını görselleştiren, serbest SQL sorguları çalıştırmaya olanak tanıyan, veri güvenliği önlemleri barındıran ve ayrıca standalone **AgroERP** tarım veritabanı simülasyonunu kapsayan kılavuz.
👉 **[Veritabanı Yöneticisi Detaylı Kılavuzu (VERITABANI_YONETICISI.md)](file:///c:/Users/BİLİŞİM/OneDrive/Masaüstü/fitERP/fit-erp-system/VERITABANI_YONETICISI.md)**

### 📊 2. Proje Yönetimi ve Planlama (Project Management & CPM)
Ekip yönetimi, bütçe takibi ve en önemlisi **Kritik Yol Yöntemi (CPM - Critical Path Method)** algoritması ile Gantt şeması üzerinde projedeki riskli/gecikemez adımları hesaplayan modül kılavuzu.
👉 **[Proje Yönetimi ve Planlama Kılavuzu (PROJE_YONETIMI.md)](file:///c:/Users/BİLİŞİM/OneDrive/Masaüstü/fitERP/fit-erp-system/PROJE_YONETIMI.md)**

---

## 🚀 Öne Çıkan Özellikler

*   **Dinamik Dashboard:** Toplam üye sayısı, aktif eğitmenler, aylık ciro grafiği ve genel gelir-gider dengesini gösteren özet paneli.
*   **SQL Güvenlik Kalkanı:** Arayüzdeki SQL editöründe yanlışlıkla çalıştırılabilecek koşulsuz `UPDATE` ve `DELETE` sorguları ile veritabanına zarar verebilecek `DROP` komutları için onay mekanizması.
*   **Döngüsel Bağımlılık Engeli:** Proje yönetiminde görevler birbirine bağlanırken döngü oluşması (Örn: A görevinin B'ye, B'nin ise A'ye bağımlı olması durumu) topological sort ile tespit edilerek CPM hesaplaması bloke edilir ve kullanıcı uyarılır.
