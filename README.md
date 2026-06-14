# FitERP - Spor Salonu ve Proje Yönetim Sistemi

**FitERP**, spor salonu işletmelerinin üye, eğitmen, paket ve ödemelerini kolayca yönetmelerini sağlayan, aynı zamanda entegre bir Proje Yönetimi (Project Management) ve interaktif Veritabanı Yöneticisi (Database Manager) barındıran modern bir kurumsal kaynak planlama (ERP) web uygulamasıdır.

Bu yazılım projesi; frontend tarafında **React (Vite + React Router v7)** ve modern CSS, backend tarafında **Node.js (Express v5)**, veritabanı tarafında ise **MySQL** teknolojilerini kullanmaktadır.

---

## 📂 Proje Yapısı

Proje iki ana dizinden oluşmaktadır:

*   **[backend](file:///c:/Users/BİLİŞİM/OneDrive/Masaüstü/fitERP/fit-erp-system/backend)**: Express sunucusu, veritabanı havuzu (pool) bağlantıları ve API uç noktalarını (endpoints) içerir.
    *   **[server.js](file:///c:/Users/BİLİŞİM/OneDrive/Masaüstü/fitERP/fit-erp-system/backend/server.js)**: Tüm backend API yönlendirmelerinin, veritabanı bağlantısının ve otomatik tablo oluşturma mantığının barındığı ana sunucu dosyasıdır.
    *   **[package.json](file:///c:/Users/BİLİŞİM/OneDrive/Masaüstü/fitERP/fit-erp-system/backend/package.json)**: `express`, `mysql2`, `cors` ve `nodemon` bağımlılıklarını içerir.
*   **[frontend](file:///c:/Users/BİLİŞİM/OneDrive/Masaüstü/fitERP/fit-erp-system/frontend)**: Vite ile oluşturulmuş React uygulamasıdır.
    *   **[src/App.jsx](file:///c:/Users/BİLİŞİM/OneDrive/Masaüstü/fitERP/fit-erp-system/frontend/src/App.jsx)**: Uygulamanın sayfa yönlendirmelerini (Routing) ve ana layout yapısını yönetir.
    *   **[src/pages](file:///c:/Users/BİLİŞİM/OneDrive/Masaüstü/fitERP/fit-erp-system/frontend/src/pages)**: Uygulamanın ana ekranlarını (Dashboard, Members, Trainers, Packages, Payments, ProjectManagement, DatabaseManager) barındırır.
    *   **[src/config.js](file:///c:/Users/BİLİŞİM/OneDrive/Masaüstü/fitERP/fit-erp-system/frontend/src/config.js)**: Özellik bayraklarını (feature flags) kontrol eder.

---

## ⚡ Sistem Özellikleri ve Modüller

Uygulama 3 temel modülden oluşmaktadır:

### 1. Spor Salonu Yönetimi (Gym Management)
*   **Üye Yönetimi (Members)**: Üyelerin kaydı, güncellenmesi, silinmesi ve üyelik tiplerinin takibi.
*   **Eğitmen Yönetimi (Trainers)**: Eğitmenlerin uzmanlık alanları ve iletişim bilgilerinin yönetimi.
*   **Paket Yönetimi (Packages)**: Üyelik paketlerinin süreleri (aylık) ve fiyatlarının dinamik tanımlanması.
*   **Ödemeler (Payments)**: Üye bazlı tahsilat geçmişi ve ödeme takibi.

### 2. Entegre Proje Yönetimi (Project Management)
*   Dinamik Gantt şeması görselleştirmesi.
*   Kritik Yol Yöntemi (CPM - Critical Path Method) ile kritik görevlerin (Gecikmesi projeyi geciktirecek görevler) otomatik tespiti ve kırmızı renkle vurgulanması.
*   Proje bütçe gelir/gider analizleri ve sermaye yönetimi.
*   Ekip üyelerinin görev dağılımları ve iş yükü takibi.
*   Detaylı bilgi için **[Proje Yönetimi Dokümanı](file:///c:/Users/BİLİŞİM/OneDrive/Masaüstü/fitERP/fit-erp-system/PROJE_YONETIMI.md)** dosyasını inceleyebilirsiniz.

### 3. Veritabanı Yöneticisi (Database Manager)
*   Web arayüzünden doğrudan SQL sorguları çalıştırabilme.
*   Veritabanı tablolarının şema yapılarını, veri tiplerini ve yabancı anahtar (FK) ilişkilerini görsel olarak inceleyebilme.
*   Tablo boyutları ve satır sayıları gibi veritabanı istatistiklerinin anlık raporlanması.
*   Önceden tanımlanmış hızlı SQL şablonları.
*   Detaylı bilgi için **[Veritabanı Yöneticisi Rehberi](file:///c:/Users/BİLİŞİM/OneDrive/Masaüstü/fitERP/fit-erp-system/VERITABANI_YONETICISI.md)** dosyasını inceleyebilirsiniz.

---

## 🛠️ Kurulum ve Çalıştırma

### 1. Gereksinimler
*   [Node.js](https://nodejs.org/) (v16 veya üzeri önerilir)
*   [MySQL / MariaDB Server](https://www.mysql.com/)

### 2. Veritabanı Hazırlığı
MySQL sunucunuzda aşağıdaki isimde bir veritabanı oluşturun:
```sql
CREATE DATABASE fiterp_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

> [!NOTE]
> Proje Yönetimi tabloları (`pm_team`, `pm_tasks`, `pm_budget`) backend sunucusu ilk kez başlatıldığında otomatik olarak oluşturulacaktır. Spor salonu yönetim tablolarını (`members`, `trainers`, `packages`, `payments`) oluşturmak için **[Veritabanı Yöneticisi Rehberi](file:///c:/Users/BİLİŞİM/OneDrive/Masaüstü/fitERP/fit-erp-system/VERITABANI_YONETICISI.md#1-tablo-kurulum-sorgulari-ddl)** altındaki SQL komutlarını kullanabilirsiniz.

Veritabanı bağlantı bilgilerini değiştirmek için **[server.js](file:///c:/Users/BİLİŞİM/OneDrive/Masaüstü/fitERP/fit-erp-system/backend/server.js)** dosyasındaki `mysql.createPool` parametrelerini (kullanıcı adı, şifre vb.) düzenleyebilirsiniz:
```javascript
const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "root123", // MySQL şifreniz
  database: "fiterp_db",
  ...
});
```

### 3. Sunucuyu (Backend) Başlatma
1. Uçbirimden (Terminal) `backend` dizinine geçin:
   ```bash
   cd backend
   ```
2. Gerekli paketleri yükleyin:
   ```bash
   npm install
   ```
3. Sunucuyu geliştirici modunda (nodemon ile otomatik yenilenen) başlatın:
   ```bash
   npm start
   ```
   *Sunucu varsayılan olarak **`http://localhost:5000`** portunda çalışacaktır.*

### 4. Arayüzü (Frontend) Başlatma
1. Yeni bir uçbirim açıp `frontend` dizinine geçin:
   ```bash
   cd frontend
   ```
2. Gerekli paketleri yükleyin:
   ```bash
   npm install
   ```
3. React uygulamasını geliştirme sunucusunda başlatın:
   ```bash
   npm run dev
   ```
   *Arayüz varsayılan olarak **`http://localhost:5173`** adresinde açılacaktır.*

---

## 🛡️ Güvenlik Notu
*   Uygulamadaki Veritabanı Yöneticisi SQL Editörü, doğrudan SQL sorguları çalıştırmaya olanak tanır.
*   Kazara veya kötü niyetli veri silinmelerini önlemek adına, SQL Editörü üzerinde `DROP DATABASE` ve `DROP SCHEMA` gibi kritik DDL komutlarının çalıştırılması backend düzeyinde engellenmiştir.

---
*FitERP sistemi ile ilgili teknik altyapı ve yönetim detayları için yukarıda belirtilen kılavuzları inceleyebilirsiniz.*
