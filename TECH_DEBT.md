# Technical Debt Backlog

Bu dosya, ürün geliştirme sprintleri sırasında bilinçli olarak **düzeltilmeyip biriktirilen** teknik borç kalemlerini takip eder. Amaç: yeni sprintlerde bu hataların üstüne yeni hata eklememek, ama düzeltmeyi ayrı bir "Teknik Borç Sprinti"ne bırakmak.

## Kural

- Yeni yazılan kodda **0 lint hatası** hedeflenir.
- Mevcut/aşağıdaki hatalar yeni sprintlerde **kapsam dışıdır** (dokunulmadıkça bozulmaz, dokunulduğunda düzeltilmesi değerlendirilebilir).
- Bir madde başka bir sprintte tesadüfen düzeltilirse bu dosyadan çıkarılmalı ve kapatılma tarihi not edilmelidir.

## Açık Kalemler

**Yok.** Sprint 11 sonunda (bkz. "Kapatılan Kalemler") tüm kalemler çözüldü. `npm run lint` şu an **0 hata, 0 uyarı** ile temiz.

## Kapatılan Kalemler

| # | Dosya | Kural | Kapanma Sebebi | Sprint |
|---|---|---|---|---|
| 1 | `src/components/forms/AnimalForm.jsx` | `react-hooks/set-state-in-effect` | `useEffect` + `setForm()` deseni kaldırıldı, `useState` lazy initializer'a (`useState(() => animal ? {...} : emptyForm)`) geçildi. Üst bileşenler (`Hayvanlar.jsx`, `MusteriDetay.jsx`) artık `key={animal?.id \|\| "new"}` ile formu düzenlenen kayıt değiştiğinde yeniden mount ediyor (InvoiceForm'daki — Sprint 7 — desenle aynı). | Sprint 11 |
| 2 | `src/components/forms/AppointmentForm.jsx` | `react-hooks/set-state-in-effect` | Aynı desen: lazy initializer + `Appointments.jsx`'te `key` (randevu id'si ya da seçilen takvim slotu tarih/saatine göre). | Sprint 11 |
| 3 | `src/components/forms/AppointmentForm.jsx` | `react-hooks/exhaustive-deps` (warning) | `useEffect` kaldırıldığı için bağımlılık uyarısı da ortadan kalktı. | Sprint 11 |
| 4 | `src/components/forms/CustomerForm.jsx` | `react-hooks/set-state-in-effect` | Aynı desen: lazy initializer + `Musteriler.jsx`'te `key={customer?.id \|\| "new"}`. | Sprint 11 |
| 5 | `src/components/forms/CustomerForm.jsx` | `react-hooks/exhaustive-deps` (warning) | `useEffect` kaldırıldığı için bağımlılık uyarısı da ortadan kalktı. | Sprint 11 |
| 6 | `src/components/forms/ExaminationForm.jsx` | `react-hooks/set-state-in-effect` | Aynı desen: lazy initializer + `Examinations.jsx`'te `key={examination?.id \|\| "new"}`. | Sprint 11 |
| 7 | `src/components/forms/ExaminationForm.jsx` | `react-hooks/exhaustive-deps` (warning) | `useEffect` kaldırıldığı için bağımlılık uyarısı da ortadan kalktı. | Sprint 11 |
| 8 | `src/components/forms/StockForm.jsx` | `react-hooks/set-state-in-effect` | Aynı desen: lazy initializer + `Stock.jsx`'te `key={stock?.id \|\| "new"}`. | Sprint 11 |
| 9 | `src/components/forms/StockForm.jsx` | `react-hooks/exhaustive-deps` (warning) | `useEffect` kaldırıldığı için bağımlılık uyarısı da ortadan kalktı. | Sprint 11 |
| 10 | `src/components/forms/VaccineForm.jsx` | `react-hooks/set-state-in-effect` | Aynı desen: lazy initializer + `Vaccines.jsx`'te `key={vaccine?.id \|\| "new"}`. | Sprint 11 |
| 11 | `src/components/forms/VaccineForm.jsx` | `react-hooks/exhaustive-deps` (warning) | `useEffect` kaldırıldığı için bağımlılık uyarısı da ortadan kalktı. | Sprint 11 |
| 12 | `src/pages/Dashboard.jsx` | `react-hooks/immutability` (`loadDashboard` tanımlanmadan önce kullanılıyor) | `loadDashboard`, Sprint 6'da `MusteriDetay.jsx`/`Settings.jsx`'te kurulan desenle aynı şekilde `useEffect` içine taşındı (yerel, iç içe `async function`). Bu hem hoisting uyarısını hem de (fonksiyon dışarıdan çağrılabilir olmaktan çıktığı için ortaya çıkan) `react-hooks/set-state-in-effect` hatasını ortadan kaldırdı. | Sprint 11 |
| 13 | `src/pages/MusteriDetay.jsx` | `react-hooks/set-state-in-effect` | Sprint 6'da servisler async'e geçirilirken `useEffect` içi veri yükleme mantığı ayrı bir `async` fonksiyona taşındı; senkron `setState` çağrısı ortadan kalktığı için hata kendiliğinden kapandı. | Sprint 6 |
| 14 | `src/pages/Settings.jsx` | `react-hooks/set-state-in-effect` | Aynı sebeple (`getSettings()` artık async, `useEffect` içinde `async` bir yükleme fonksiyonu kullanıldı) hata kendiliğinden kapandı. | Sprint 6 |

## Sprint 11 Notu: `backend/` ve kök ESLint kapsamı

Sprint 10'da eklenen `backend/` klasörü kendi `package.json`'ına ve Node.js (CommonJS) çalışma zamanına sahip, frontend'den tamamen bağımsız bir projedir. Kökteki `eslint.config.js` `files: ['**/*.{js,jsx}']` deseni kullandığından ve `backend/`'i hariç tutmadığından, `npx eslint .` çalıştırıldığında `backend/src/**` ve `backend/tests/**` dosyaları da **tarayıcı odaklı frontend kurallarıyla** (Node globals: `require`, `module`, `process`; Jest globals: `describe`, `it`, `expect`, `jest` tanımsız kabul edilerek) taranıyor ve gerçek olmayan ~380 `no-undef` hatası üretiyordu. Bu, backend'in kendi lint sürecine hiç sahip olmamasından ve kapsam dışında bırakılmamasından kaynaklanan bir yapılandırma boşluğuydu — kod kalitesiyle ilgisi yoktu.

Sprint 11'de `eslint.config.js`'e `globalIgnores(['dist', 'backend'])` eklenerek bu kapsam boşluğu düzeltildi. Böylece `npm run lint` sadece frontend (`src/`) kodunu değerlendiriyor ve raporun doğruluğu sağlanıyor. Backend zaten kendi test paketiyle (Jest/Supertest, bkz. `backend/tests/`) doğrulanıyor; backend için ayrı bir ESLint kurulumu bu sprintin kapsamı dışındadır (yeni özellik/altyapı eklenmedi kuralına uygun olarak sonraki bir teknik borç sprintine bırakılabilir).
