/**
 * OpenAPI (Swagger) spesifikasyonu — JSDoc yorum taraması yerine, standart
 * CRUD modüllerinin path'lerini TEK bir fabrika fonksiyonuyla (buildCrudPaths)
 * programatik olarak üretir. Sekiz CRUD modülünün (customers, animals,
 * appointments, examinations, vaccines, stock, invoices, users) hepsi için
 * neredeyse aynı list/getById/create/update/remove şemasını elle tekrar
 * tekrar yazmak yerine, her modül tek satırlık bir çağrı ile spesifikasyona
 * eklenir.
 */

const bearerSecurity = [{ bearerAuth: [] }];

function buildCrudPaths(basePath, resourceName, tag) {
  return {
    [basePath]: {
      get: {
        tags: [tag],
        summary: `${resourceName} listesini getirir`,
        security: bearerSecurity,
        responses: { 200: { description: "OK" } },
      },
      post: {
        tags: [tag],
        summary: `Yeni ${resourceName.toLowerCase()} oluşturur`,
        security: bearerSecurity,
        requestBody: { required: true, content: { "application/json": { schema: { type: "object" } } } },
        responses: { 201: { description: "Created" }, 400: { description: "Validation Error" } },
      },
    },
    [`${basePath}/{id}`]: {
      get: {
        tags: [tag],
        summary: `ID ile ${resourceName.toLowerCase()} getirir`,
        security: bearerSecurity,
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "OK" }, 404: { description: "Not Found" } },
      },
      put: {
        tags: [tag],
        summary: `${resourceName} günceller`,
        security: bearerSecurity,
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "OK" }, 404: { description: "Not Found" } },
      },
      delete: {
        tags: [tag],
        summary: `${resourceName} siler`,
        security: bearerSecurity,
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 204: { description: "No Content" }, 404: { description: "Not Found" } },
      },
    },
  };
}

const authPaths = {
  "/api/auth/login": {
    post: {
      tags: ["Auth"],
      summary: "Kullanıcı adı/şifre ile giriş yapar, JWT döner",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["username", "password"],
              properties: {
                username: { type: "string" },
                password: { type: "string" },
              },
            },
          },
        },
      },
      responses: { 200: { description: "OK" }, 401: { description: "Unauthorized" } },
    },
  },
  "/api/auth/me": {
    get: {
      tags: ["Auth"],
      summary: "Giriş yapmış kullanıcının profilini döner",
      security: bearerSecurity,
      responses: { 200: { description: "OK" }, 401: { description: "Unauthorized" } },
    },
  },
};

const paths = {
  "/api/health": {
    get: {
      tags: ["System"],
      summary: "Sunucu ve dokümantasyon ayakta mı kontrolü",
      responses: { 200: { description: "OK" } },
    },
  },
  ...authPaths,
  ...buildCrudPaths("/api/users", "Kullanıcı", "Users"),
  ...buildCrudPaths("/api/customers", "Müşteri", "Customers"),
  ...buildCrudPaths("/api/animals", "Hayvan", "Animals"),
  ...buildCrudPaths("/api/appointments", "Randevu", "Appointments"),
  ...buildCrudPaths("/api/examinations", "Muayene", "Examinations"),
  ...buildCrudPaths("/api/vaccines", "Aşı", "Vaccines"),
  ...buildCrudPaths("/api/stock", "Stok kalemi", "Stock"),
  ...buildCrudPaths("/api/invoices", "Fatura", "Invoices"),
};

const swaggerSpec = {
  openapi: "3.0.3",
  info: {
    title: "VetSys API",
    version: "1.0.0",
    description:
      "VetSys veteriner klinik yönetim sistemi REST API. Katmanlı mimari: routes → controllers → services → repositories → Prisma.",
  },
  servers: [{ url: "/" }, { url: "http://localhost:4000" }],
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
    },
  },
  tags: [
    { name: "System" },
    { name: "Auth" },
    { name: "Users" },
    { name: "Customers" },
    { name: "Animals" },
    { name: "Appointments" },
    { name: "Examinations" },
    { name: "Vaccines" },
    { name: "Stock" },
    { name: "Invoices" },
  ],
  paths,
};

module.exports = swaggerSpec;
