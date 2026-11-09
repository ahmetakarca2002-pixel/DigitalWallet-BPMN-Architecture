# Digital Wallet & BPMN Process Automation 🚀 [WIP]

Bu proje, modern bir dijital cüzdan uygulamasının arka planındaki karmaşık iş kurallarını ve finansal akışları **Camunda BPMN/DMN** motoru ile otomatize eden, **Node.js** ve **React Native** tabanlı tam yığın (full-stack) bir finansal teknoloji (FinTech) altyapısıdır. 

*Not: Proje aktif geliştirme aşamasındadır (Work in Progress).*

## 💡 Mimari Vizyon ve Çözülen Problemler
Geleneksel monolotik `if/else` blokları yerine, iş kuralları DMN (Decision Model and Notation) tablolarına soyutlanmış; asenkron görev kuyrukları ve zamanlanmış (cron) işlemler BPMN süreçleriyle yönetilmiştir.

* **Multi-Instance EOD (Gün Sonu) Batch Süreci:** Vadesi dolan binlerce hesabın, Camunda'nın Multi-Instance Sub-Process motoruyla eşzamanlı kilitlenme (OptimisticLockingException) yaratmadan, `Async Before` kuyruk mimarisiyle güvenle işlenmesi sağlandı.
* **Dinamik Bileşik Faiz (Roll-over) Motoru:** Müşterinin hesap türüne ve ana para büyüklüğüne göre (Örn: Standart %35, VIP %42) faiz oranını kod bağımsız şekilde DMN tablolarından çeken ve yeni dönem vadesini otomatik uzatan akıllı temdit sistemi entegre edildi.
* **Gerçek Zamanlı WebSocket İletişimi:** Camunda'dan onay alan veya zaman aşımına uğrayan transfer işlemleri, Node.js Worker'ı üzerinden anında React Native arayüzüne (Client) push bildirimleri (Socket.io) olarak iletilir.

## 🛠️ Kullanılan Teknolojiler
* **Backend:** Node.js, Express.js
* **Process Engine:** Camunda Platform 7, BPMN 2.0, DMN 1.3
* **Database:** SQLite (WAL Journal Mode)
* **Frontend:** React Native, Expo, Zustand
* **Real-time:** Socket.io
* **Workflow Client:** `camunda-external-task-client-js`

## ⚙️ BPMN & DMN Entegrasyonları
* `vadeli_faiz_oranlari.dmn`: Bakiye kademelerine göre dinamik getiri hesaplaması.
* `hesaplarim_arasi_transfer.bpmn`: Güvenlik ve bakiye onayından geçen iç transfer süreçleri.
* `vadeli_hesap_islemleri.bpmn` (EOD): Her gece tetiklenen, DMN entegreli otomatik vade yenileme (Roll-over) akışı.

## 🚧 Yapılacaklar (Roadmap)
- [x] BPMN tabanlı dış ve iç para transferi altyapısının kurulması.
- [x] DMN tabanlı faiz oranı ve kısıtlama kararlarının koda entegrasyonu.
- [x] Multi-Instance EOD (Gün Sonu) faiz tahakkuk sürecinin stabil hale getirilmesi.
- [ ] React Native arayüzünün 3D animasyonlu cüzdan tasarımının tamamlanması.
- [ ] Loglama ve Hata İzleme (Error Tracking) mekanizmalarının eklenmesi.