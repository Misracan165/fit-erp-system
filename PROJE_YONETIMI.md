# FitERP - Proje Yönetimi ve Planlama Rehberi

Bu kılavuz, **FitERP** sistemindeki entegre **Proje Yönetimi (Project Management)** modülünün işlevlerini, matematiksel altyapısını (CPM algoritması) ve veritabanı entegrasyonunu açıklamaktadır.

---

## 📋 Modül Hakkında Genel Bilgi

Proje Yönetimi modülü, özellikle spor salonu projelerinin veya ilişkili operasyonel çalışmaların planlanmasını, görevlerin sıralanmasını, ekip iş yüklerinin izlenmesini ve proje bütçesinin takip edilmesini sağlayan gelişmiş bir yönetim panelidir.

Modülün arayüzü **[ProjectManagement.jsx](file:///c:/Users/BİLİŞİM/OneDrive/Masaüstü/fitERP/fit-erp-system/frontend/src/pages/ProjectManagement.jsx)** sayfasında, API uç noktaları ise backend tarafında **[server.js](file:///c:/Users/BİLİŞİM/OneDrive/Masaüstü/fitERP/fit-erp-system/backend/server.js)** içerisinde tanımlıdır.

---

## 🛠️ Panel Sekmeleri ve Özellikleri

Proje Yönetim Paneli 6 farklı sekmeye ayrılmıştır:

1.  **📊 Genel Özet (Overview)**: 
    *   Projenin toplam süresi, tahmini başlangıç ve bitiş tarihleri, ortalama ilerleme yüzdesi.
    *   Tamamlanan, devam eden ve başlanmamış görevlerin sayısal KPI kartları.
    *   Proje bütçe durumu (Gelir, Gider, Net Sermaye ve Bütçe Kullanım Oranı).
    *   **Gantt Şeması**: Zaman cetveli üzerinde tüm görevlerin sıralanması ve kritik görevlerin vurgulanması.
    *   **İş Yükü Dağılımı**: Hangi personelin hangi zaman aralığında hangi görevleri üstlendiğini gösteren grafiksel şema.
2.  **📋 Görev Yönetimi (Tasks)**:
    *   Görev ekleme, güncelleme, silme (CRUD) işlemleri.
    *   Göreve isim, açıklama, başlangıç tarihi, gün cinsinden süre, % ilerleme oranı, atanan personel ve öncül görev (bağımlılık) seçimi.
3.  **⚡ Kritik Yol (CPM)**:
    *   Tüm görevlerin erken başlangıç (ES), erken bitiş (EF), geç başlangıç (LS), geç bitiş (LF) ve boş süre (Slack) hesaplama tablosu.
    *   Sadece kritik yolda bulunan (Slack süresi sıfır olan) görevlerin özel listesi.
4.  **👥 Ekip Yönetimi (Team)**:
    *   Projede çalışacak kişilerin ad, rol ve e-posta tanımlamaları.
5.  **💰 Sermaye & Bütçe (Budget)**:
    *   Gelir (Income) ve Gider (Expense) bazında finans hareketlerinin kaydı ve kategorilendirilmesi.
6.  **📄 Raporlar (Reports)**:
    *   Proje çıktıları, bütçe raporları ve ekip performans çıktılarının listelendiği raporlama ekranı.

---

## 📐 Kritik Yol Yöntemi (CPM) Matematiksel Analizi

Modülün en güçlü altyapısı, görevlerin birbirine olan bağımlılıklarını analiz eden **Critical Path Method (CPM)** hesaplayıcısıdır. Algoritma adımları şunlardır:

### 1. Döngü ve Kısır Döngü Kontrolü (Cycle Detection)
*   Algoritma öncelikle tüm görevleri ve öncül bağımlılıklarını bir yönlü grafiğe dönüştürür.
*   Topolojik Sıralama (Topological Sort) algoritması kullanılarak DFS (Derinlik Öncelikli Arama) yöntemiyle döngü kontrolü yapılır.
*   Eğer görevler birbirini kısır döngüye sokuyorsa (örneğin A görevi B'ye, B görevi de A'ya bağımlıysa), sistem bir hata mesajı döndürür:  
    `"Döngüsel Bağımlılık Tespit Edildi! Görevlerin öncülleri birbirini kısır döngüye sokuyor."`

### 2. İleri Doğru Hesaplama (Forward Pass)
*   Sıralı görevler üzerinde başlangıçtan bitişe doğru ilerlenir.
*   Her görevin **Erken Başlangıç (ES - Earliest Start)** ve **Erken Bitiş (EF - Earliest Finish)** değerleri hesaplanır:
    *   Eğer görevin hiçbir öncülü yoksa: $ES = 0$
    *   Eğer öncülleri varsa: $ES = \max(Öncüllerin\ EF\ Değerleri)$
    *   Görevin Erken Bitişi: $EF = ES + Süre\ (Gün)$

### 3. Geriye Doğru Hesaplama (Backward Pass)
*   Projenin toplam süresi belirlendikten sonra sondan geriye doğru ilerlenir.
*   Her görevin **Geç Bitiş (LF - Latest Finish)** ve **Geç Başlangıç (LS - Latest Start)** değerleri hesaplanır:
    *   Eğer görevin hiçbir ardılı (successor) yoksa: $LF = Projenin\ Toplam\ Süresi$
    *   Eğer ardılları varsa: $LF = \min(Ardılların\ LS\ Değerleri)$
    *   Görevin Geç Başlangıcı: $LS = LF - Süre\ (Gün)$

### 4. Boş Zaman (Slack) ve Kritik Yolun Belirlenmesi
*   Her görev için **Slack (Boş Zaman)** hesaplanır:  
    $Slack = LF - EF$ (veya $LS - ES$)
*   **Kritik Görevler**: Slack süresi **0 (sıfır)** olan görevlerdir. Bu görevlerde yaşanacak 1 günlük gecikme, projenin tamamlanma tarihini doğrudan 1 gün geciktirir.
*   Arayüzde bu görevler **"critical"** sınıfı ile işaretlenerek kırmızı renkle yanıp söner (pulse animasyonu).

---

## 📡 Proje Yönetimi API Uç Noktaları (Endpoints)

Proje verilerini saklamak ve yönetmek için backend sunucusundaki API endpoints listesi:

### Ekip (Team) CRUD:
*   `GET /pm/team`: Tüm ekip üyelerini getirir.
*   `POST /pm/team`: Yeni ekip üyesi ekler.
*   `PUT /pm/team/:id`: Ekip üyesi bilgilerini günceller.
*   `DELETE /pm/team/:id`: Ekip üyesini siler.

### Görevler (Tasks) CRUD:
*   `GET /pm/tasks`: Proje görevlerini başlangıç tarihine göre sıralı getirir.
*   `POST /pm/tasks`: Yeni görev ekler (Öncül görev ID'leri virgülle ayrılarak `dependencies` alanında saklanır).
*   `PUT /pm/tasks/:id`: Görevi günceller.
*   `DELETE /pm/tasks/:id`: Görevi siler.

### Bütçe (Budget) CRUD:
*   `GET /pm/budget`: Bütçe hareketlerini tarihe göre azalan sırada çeker.
*   `POST /pm/budget`: Yeni bütçe hareketi (Gelir/Gider) ekler.
*   `PUT /pm/budget/:id`: Bütçe hareketini günceller.
*   `DELETE /pm/budget/:id`: Bütçe hareketini siler.

---

## 💡 Proje Yöneticisi İçin İpuçları
1.  **Zamanlama Girişi**: Görevlerin Gantt şemasında düzgün konumlanması için görev ekleme ekranında mutlaka **Başlangıç Tarihi** değerini giriniz.
2.  **Bağımlılık Zinciri**: Bir görevin başlayabilmesi için bitmesi gereken diğer görevleri **Öncüller** alanından seçiniz. Çoklu seçim için `Ctrl` tuşuna basılı tutarak tıklayınız.
3.  **Kritik Yolu Kısaltma**: Projeyi daha hızlı tamamlamak istiyorsanız, sadece kırmızı renkle parlayan **Kritik Görevlere** ek kaynak (personel/bütçe) atayarak sürelerini kısaltmaya odaklanınız.
