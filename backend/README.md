# VetSys Backend API

VetSys veteriner klinik yönetim sisteminin gerçek backend'i. Node.js +
Express + PostgreSQL + Prisma ORM ile katmanlı mimaride (routes →
controllers → services → repositories → Prisma) geliştirilmiştir.

> **Önemli:** Bu backend şu an frontend'e (src/) BAĞLI DEĞİLDİR.
> `src/services/apiClient.js` hâlâ LocalStorage kullanır. Bu sprintin amacı
> backend'i bağımsız olarak ayağa kaldırmaktır; entegrasyon ileriki bir
> sprintte yapılacaktır.

## Teknolojiler

- Node.js + Express 5
- PostgreSQL + Prisma ORM (6.19.x — bkz. "Bilinen Sınırlamalar")
- JWT (jsonwebtoken) + bcryptjs
- Zod (validation)
- Helmet, CORS, express-rate-limit (güvenlik)
- Swagger UI (API dokümantasyonu)
- Jest + Supertest (test)

## Klasör Yapısı

```
backend/
  prisma/
    schema.prisma          # Veritabanı şeması (9 model + Role enum)
    migrations/             # SQL migration dosyaları
    seed.js                 # Varsayılan kullanıcıları oluşturan seed script
  src/
    app.js                  # Express app kurulumu (middleware + route mount)
    server.js               # Giriş noktası (app.listen)
    config/
      env.js                 # Ortam değişkenlerinin tek okunduğu yer
      roles.js               # Rol sabitleri (ADMIN/VETERINARIAN/RECEPTION)
      swagger.js             # OpenAPI spesifikasyonu (programatik üretim)
    prisma/
      client.js              # PrismaClient singleton
    middleware/
      asyncHandler.js        # async route handler sarmalayıcı
      authenticate.js        # JWT doğrulama
      authorize.js           # Rol tabanlı yetkilendirme (RBAC)
      validate.js            # Zod tabanlı istek doğrulama
      errorHandler.js         # Global error handler + 404 handler
    common/
      BaseRepository.js      # Ortak Prisma CRUD veri erişimi
      BaseService.js         # Ortak "kayıt var mı" + CRUD iş mantığı
      createCrudController.js # Servisten standart Express handler üretimi
    utils/
      AppError.js             # Operasyonel hata sınıfı
      apiResponse.js          # Tutarlı başarı yanıtı zarfı
      jwt.js / password.js    # JWT ve bcrypt yardımcıları
      invoiceCalc.js          # Fatura toplamı hesaplama (frontend ile aynı mantık)
    modules/
      auth/            customers/       animals/
      appointments/    examinations/    vaccines/
      stock/            invoices/        users/
        *.routes.js      → Express router + middleware zinciri
        *.controller.js  → HTTP handler'lar (createCrudController + özel uçlar)
        *.service.js     → İş mantığı (BaseService'ten türer)
        *.repository.js  → Prisma veri erişimi (BaseRepository'den türer)
        *.validation.js  → Zod şemaları
    routes/
      index.js           # Tüm modül router'larını /api altında birleştirir
  tests/                 # Jest + Supertest testleri (DB gerektirmez, mock'lanmıştır)
```

## Kurulum

```bash
cd backend
npm install
cp .env.example .env   # DATABASE_URL ve JWT_SECRET'ı kendi ortamınıza göre düzenleyin
```

### Veritabanını hazırlama (gerçek bir PostgreSQL sunucusu gerekir)

```bash
npm run prisma:migrate      # migrations/ altındaki SQL'leri veritabanına uygular
npm run prisma:seed         # admin / veteriner / resepsiyon demo kullanıcılarını oluşturur
```

Geliştirme sırasında şemada değişiklik yapıp yeni migration üretmek için:

```bash
npm run prisma:migrate:dev
```

### Sunucuyu çalıştırma

```bash
npm run dev     # nodemon ile
npm start       # production
```

- API: `http://localhost:4000/api`
- Swagger UI: `http://localhost:4000/api-docs`
- Health check: `GET /api/health`

### Testleri çalıştırma

```bash
npm test
```

Testler gerçek bir veritabanı bağlantısı GEREKTİRMEZ; Prisma'ya bağımlı
repository'ler mock'lanarak middleware/servis/validation katmanları izole
test edilir.

## Demo Kullanıcılar (seed sonrası)

| Kullanıcı Adı | Şifre         | Rol          |
|---------------|---------------|--------------|
| admin         | admin123      | ADMIN        |
| veteriner     | vet123        | VETERINARIAN |
| resepsiyon    | resepsiyon123 | RECEPTION    |

## Kimlik Doğrulama

```
POST /api/auth/login   { "username": "admin", "password": "admin123" }
→ { success: true, data: { user: {...}, token: "<JWT>" } }

GET /api/auth/me
Header: Authorization: Bearer <JWT>
```

## Rol Tabanlı Yetkilendirme

Frontend'deki `src/utils/roles.js` ile kavramsal olarak eşleşir:

| Endpoint grubu                  | İzinli roller                  |
|----------------------------------|---------------------------------|
| `/api/customers`, `/api/animals`, `/api/appointments` | Tüm giriş yapmış roller |
| `/api/examinations`, `/api/vaccines`, `/api/stock`    | ADMIN, VETERINARIAN     |
| `/api/invoices`                                       | ADMIN, RECEPTION        |
| `/api/users`                                          | ADMIN                   |

## Bilinen Sınırlamalar

- **Bu ortamda canlı bir PostgreSQL/Docker bulunmadığından migration'lar
  gerçek bir veritabanına karşı ÇALIŞTIRILMAMIŞTIR.** `prisma migrate diff
  --from-empty` komutuyla (DB bağlantısı gerektirmeyen offline diff modu)
  üretilmiştir; SQL içeriği doğrulanmış ve `prisma validate` ile şema
  geçerliliği teyit edilmiştir, ancak gerçek bir Postgres'e `npm run
  prisma:migrate` ile hiç uygulanmamıştır. Gerçek bir Postgres bağlantısı
  sağlandığında ilk çalıştırmada bu doğrulanmalıdır.
- Prisma **6.19.3**'e bilinçli olarak sabitlenmiştir. Yeni kurulan Prisma
  7, `datasource.url` alanını kaldırıp `prisma.config.ts` + driver adapter
  zorunluluğu getiriyor; bu, geniş çapta dokümante edilmemiş ve TypeScript
  gerektiren yeni bir yapı olduğu için, yaygın/kararlı `url =
  env("DATABASE_URL")` yapısını koruyan 6.x sürümü tercih edilmiştir.
- Durum alanları (`Appointment.status`, `Invoice.paymentStatus`) Prisma
  `enum` değil `String` olarak tutulur (bkz. `schema.prisma` başındaki not)
  — esneklik için bilinçli bir tercihtir, DB seviyesinde değer kısıtlaması
  yoktur (uygulama seviyesinde Zod ile kısıtlanır).
- `apiClient.js` (frontend) bu API'ye HENÜZ bağlı değildir — bu sprintin
  kuralı gereği kasıtlı olarak yapılmamıştır.
- Dosya/görsel yükleme, gerçek zamanlı bildirim (websocket), refresh
  token / token yenileme mekanizması bu sprintte kapsam dışıdır.
- Rate limiting sadece `/api/auth/login` uçuna uygulanmıştır.
- `InvoiceItem.type` sabit bir liste ile (Muayene/Aşı/Tedavi/Ürün) Zod
  seviyesinde kısıtlanmıştır; stok (Stock) ile fatura kalemleri arasında
  frontend'deki mevcut tasarıma paralel olarak bir FK ilişkisi YOKTUR.
