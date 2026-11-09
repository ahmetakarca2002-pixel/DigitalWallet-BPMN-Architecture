# Digital Wallet & BPMN Process Automation 🚀 [WIP]

Bu proje, modern bir dijital cüzdan uygulamasının arka planındaki karmaşık iş kurallarını ve finansal akışları **Camunda BPMN/DMN** motoru ile otomatize eden, **Node.js** ve **React Native** tabanlı tam yığın (full-stack) bir finansal teknoloji (FinTech) altyapısıdır. 

*Not: Proje aktif geliştirme aşamasındadır (Work in Progress).*

---

## 💡 Mimari Vizyon ve Çözülen Problemler
Geleneksel monolotik `if/else` blokları yerine, iş kuralları DMN (Decision Model and Notation) tablolarına soyutlanmış; asenkron görev kuyrukları ve zamanlanmış (cron) işlemler BPMN süreçleriyle yönetilmiştir.

- **Modüler (Micro-Process) Mimari:** Ana para transferi (Havale/EFT/SWIFT) akışları tek bir devasa süreç yerine; `Call Activity` yapıları kullanılarak *Güvenlik Duvarı (Fraud)*, *Komisyon Tahsilatı (Fee)* ve *Sadakat (Cashback)* gibi bağımsız ve tekrar kullanılabilir alt süreçlere (Micro-processes) bölünmüştür.
- **Multi-Instance EOD (Gün Sonu) Batch Süreci:** Vadesi dolan binlerce hesabın, Camunda'nın Multi-Instance Sub-Process motoruyla eşzamanlı kilitlenme (OptimisticLockingException) yaratmadan, `Async Before` kuyruk mimarisiyle güvenle işlenmesi sağlandı.
- **Dinamik Karar Motorları (DMN):** Çapraz kur dönüşüm zorunlulukları, vade bozum uyarıları, risk bazlı operasyon onayları ve kademeli faiz oranları tamamen koddan bağımsız DMN Karar Tabloları üzerinden yönetilmektedir.
- **Gerçek Zamanlı WebSocket İletişimi:** Camunda'dan onay alan veya zaman aşımına uğrayan transfer işlemleri, Node.js Worker'ı üzerinden anında React Native arayüzüne (Client) push bildirimleri (Socket.io) olarak iletilir.

---

## 📱 Kullanıcı Deneyimi (UI/UX) ve Frontend Mimarisi
Uygulama arayüzü, "Neo-Banking" konseptiyle tamamen karanlık mod (Dark Mode) odaklı ve üst düzey kullanıcı deneyimi sunacak şekilde tasarlanmıştır.

- **Kusursuz Animasyonlar ve 3D Cüzdan:** `React Native Animated` ve `PanResponder` API'leri kullanılarak, kaydırılabilir (swipeable) işlem geçmişi (Bottom Sheet) ve fiziksel kart hissi veren 3D cüzdan tasarımı geliştirildi.
- **Gelişmiş Form Yönetimi:** Çok sekmeli (IBAN, Hesap No, Kolay Adres) Havale/EFT akışları, uluslararası SWIFT (SHA, OUR, BEN masraf tipleri) işlemleri ve dinamik kurlu "Yeni Hesap Açılış" formları tamamen kontrollü bileşenlerle oluşturuldu.
- **Zustand ile Merkezi State ve Socket Entegrasyonu:** Uygulamanın tüm bakiye, hesap ve işlem geçmişi durumu `Zustand` ile yönetilmekte olup; Socket.io istemcisi sayesinde backend'den gelen "Transfer Onaylandı" veya "İptal Edildi" logları anında ekrana yansıtılmaktadır.
- **Premium FinTech Estetiği:** Linear Gradient, Glassmorphism detayları ve Neon vurgular kullanılarak modern ve güven veren bir finansal arayüz inşa edildi.

---

## 🛠️ Kullanılan Teknolojiler
- **Backend:** Node.js, Express.js
- **Process Engine:** Camunda Platform 7, BPMN 2.0, DMN 1.3
- **Database:** SQLite (WAL Journal Mode)
- **Frontend:** React Native, Expo (expo-router), Zustand
- **Real-time:** Socket.io (Client & Server)
- **Workflow Client:** `camunda-external-task-client-js`

---

## ⚙️ BPMN (İş Akışı) & DMN (Karar Motoru) Entegrasyonları

### 1. Ana İş Akışları (Orchestration)
- 🦅 **`MoneyTransferProcess.bpmn`:** Dış transferlerde (Havale/EFT) AML, Bakiye, Risk ve Operasyon Onayı (User Task) adımlarını yöneten ana orkestratör.
- 🌍 **`SwiftTransferProcess.bpmn`:** Uluslararası transferlerde (SWIFT) çapraz kur ve muhabir banka masraf tiplerini (SHA, OUR, BEN) işleyen akış.
- 🔄 **`InternalTransferProcess.bpmn`:** Müşterinin kendi hesapları arası anlık iç transfer süreci.
- 🏦 **`vadeliParaTransferi.bpmn`:** Yeni Vadeli/Vadesiz hesap açılışı ve ilk bakiye aktarımı (Kur dönüşümü ve kısıtlama onaylarıyla).
- 🌙 **`Process_0jnjnto.bpmn` (EOD):** Her gece tetiklenen, otomatik vade yenileme (Roll-over) batch akışı.

### 2. Tekrar Kullanılabilir Alt Süreçler (Call Activities)
- 🛡️ **`FraudCheckProcess.bpmn`:** Kara liste IBAN kontrolü ve anında blokaj.
- 💰 **`FeeDeductionProcess.bpmn`:** Dinamik komisyon kesinti alt süreci.
- 🎁 **`CashbackProcess.bpmn`:** İşlem sonu sadakat puanı hesaplama ve yükleme.
- 🧮 **`brutFaiz.bpmn`:** Script Task (`JavaScript`) ile matematiksel brüt faiz formülasyonu.

### 3. Karar Tabloları (DMN - Business Rules)
- ⚖️ **`hesapAcmaKisitlamalari.dmn`:** Vadeli hesaptan vadesiz hesaba geçişte çapraz kur ve vade bozum cezası kontrolleri.
- 🚦 **`RiskKurali.dmn`:** İşlem tutarına (Örn: 11.000₺ üstü) göre otomatik "Operasyon Ekibi Onayı" (User Task) gereksinimi belirleme.
- 📉 **`TransferKisitlamalari.dmn`** & **`KomisyonKurallari.dmn`:** Limitler ve durumsal komisyon oranları.
- 📈 **`vadeli_faiz_oranlari.dmn`:** Bakiye kademelerine göre dinamik getiri oranı ataması.

---

## 🚧 Yapılacaklar (Roadmap)
- [x] BPMN tabanlı dış, iç ve SWIFT para transferi altyapısının kurulması.
- [x] DMN tabanlı faiz oranı, komisyon ve risk kısıtlama kararlarının koda entegrasyonu.
- [x] React Native arayüzünün 3D animasyonlu cüzdan (Neo-Banking) tasarımının tamamlanması.
- [x] Zustand ve WebSockets ile gerçek zamanlı UI güncellemelerinin bağlanması.
- [x] Multi-Instance EOD (Gün Sonu) faiz tahakkuk sürecinin stabil hale getirilmesi.
- [ ] **Fatura ve Kurum Ödemeleri:** BPMN Service Task'leri üzerinden 3. parti (SOAP/REST) kurum API'lerine bağlanarak anlık tahsilat altyapısının kurulması.
- [ ] **Otomatik Ödeme Talimatları:** Camunda `Timer Start Event` mimarisi kullanılarak düzenli fatura ve abonelik ödemelerinin otomatize edilmesi.
- [ ] **Yatırım Modülü (Kripto & Döviz/Altın):** Harici borsa API'lerinden anlık veri çekilerek alım/satım (Trade) süreçlerinin BPMN akışlarına entegre edilmesi.
- [ ] **Sanal Kart Yönetimi:** Kullanıcıların anlık limit belirleyip oluşturabileceği sanal kart altyapısının (Card Issuing) eklenmesi.
- [ ] Loglama ve Gelişmiş Hata İzleme (Error Tracking) mekanizmalarının entegrasyonu.
- [ ] Operasyon paneli (Admin Dashboard) üzerinden onay bekleyen süreçlerin (User Tasks) arayüz entegrasyonu.