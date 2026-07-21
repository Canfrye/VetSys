-- Sprint 26 API expansion: new tables + altered columns (idempotent-ish for empty/dev DBs)

-- Animals: optional customer + owner metadata
ALTER TABLE "animals" ALTER COLUMN "customerId" DROP NOT NULL;
ALTER TABLE "animals" ADD COLUMN IF NOT EXISTS "note" TEXT;
ALTER TABLE "animals" ADD COLUMN IF NOT EXISTS "ownerType" TEXT NOT NULL DEFAULT 'customer';
ALTER TABLE "animals" ADD COLUMN IF NOT EXISTS "otherOwnerName" TEXT;

-- Appointments / examinations / vaccines: optional customer
ALTER TABLE "appointments" ALTER COLUMN "customerId" DROP NOT NULL;
ALTER TABLE "examinations" ALTER COLUMN "customerId" DROP NOT NULL;
ALTER TABLE "vaccines" ALTER COLUMN "customerId" DROP NOT NULL;

-- Examinations expanded fields
ALTER TABLE "examinations" ADD COLUMN IF NOT EXISTS "examType" TEXT;
ALTER TABLE "examinations" ADD COLUMN IF NOT EXISTS "fee" DOUBLE PRECISION;
ALTER TABLE "examinations" ADD COLUMN IF NOT EXISTS "attachments" JSONB;

-- Vaccines expanded fields
ALTER TABLE "vaccines" ADD COLUMN IF NOT EXISTS "fee" DOUBLE PRECISION;
ALTER TABLE "vaccines" ADD COLUMN IF NOT EXISTS "status" TEXT;

-- Stock expanded fields + quantity as float
ALTER TABLE "stock" ADD COLUMN IF NOT EXISTS "minQuantity" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "stock" ADD COLUMN IF NOT EXISTS "purchasePrice" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "stock" ADD COLUMN IF NOT EXISTS "lotNo" TEXT;
ALTER TABLE "stock" ADD COLUMN IF NOT EXISTS "supplierName" TEXT;
ALTER TABLE "stock" ADD COLUMN IF NOT EXISTS "supplierPhone" TEXT;
ALTER TABLE "stock" ADD COLUMN IF NOT EXISTS "supplierEmail" TEXT;
ALTER TABLE "stock" ADD COLUMN IF NOT EXISTS "supplierNote" TEXT;
ALTER TABLE "stock" ALTER COLUMN "quantity" TYPE DOUBLE PRECISION USING "quantity"::DOUBLE PRECISION;

-- Invoices: optional animal/customer, cancelled flag, empty paymentStatus default
ALTER TABLE "invoices" ALTER COLUMN "animalId" DROP NOT NULL;
ALTER TABLE "invoices" ALTER COLUMN "customerId" DROP NOT NULL;
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "cancelled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "invoices" ALTER COLUMN "paymentStatus" SET DEFAULT '';

-- Invoice items expanded
ALTER TABLE "invoice_items" ADD COLUMN IF NOT EXISTS "purchasePrice" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "invoice_items" ADD COLUMN IF NOT EXISTS "stockId" TEXT;
ALTER TABLE "invoice_items" ADD COLUMN IF NOT EXISTS "priceSource" TEXT;
ALTER TABLE "invoice_items" ADD COLUMN IF NOT EXISTS "sourceRef" TEXT;

-- Stock movements
CREATE TABLE IF NOT EXISTS "stock_movements" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "previousQuantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "newQuantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "userName" TEXT,
    "note" TEXT,
    "date" TEXT NOT NULL,
    "prescriptionId" TEXT,
    "prescriptionNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "stockId" TEXT NOT NULL,
    "stockName" TEXT,
    CONSTRAINT "stock_movements_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "stock_movements_stockId_idx" ON "stock_movements"("stockId");
CREATE INDEX IF NOT EXISTS "stock_movements_date_idx" ON "stock_movements"("date");

DO $$ BEGIN
  ALTER TABLE "stock_movements"
    ADD CONSTRAINT "stock_movements_stockId_fkey"
    FOREIGN KEY ("stockId") REFERENCES "stock"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Prescriptions
CREATE TABLE IF NOT EXISTS "prescriptions" (
    "id" TEXT NOT NULL,
    "prescriptionNumber" TEXT NOT NULL,
    "veterinarian" TEXT,
    "examinationId" TEXT,
    "examinationDate" TEXT,
    "date" TEXT NOT NULL,
    "diagnosis" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "animalId" TEXT,
    "customerId" TEXT,
    CONSTRAINT "prescriptions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "prescriptions_prescriptionNumber_key" ON "prescriptions"("prescriptionNumber");
CREATE INDEX IF NOT EXISTS "prescriptions_animalId_idx" ON "prescriptions"("animalId");
CREATE INDEX IF NOT EXISTS "prescriptions_customerId_idx" ON "prescriptions"("customerId");
CREATE INDEX IF NOT EXISTS "prescriptions_date_idx" ON "prescriptions"("date");

DO $$ BEGIN
  ALTER TABLE "prescriptions"
    ADD CONSTRAINT "prescriptions_animalId_fkey"
    FOREIGN KEY ("animalId") REFERENCES "animals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "prescriptions"
    ADD CONSTRAINT "prescriptions_customerId_fkey"
    FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "prescription_items" (
    "id" TEXT NOT NULL,
    "medicationName" TEXT NOT NULL,
    "dose" TEXT,
    "quantity" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "frequency" TEXT,
    "duration" TEXT,
    "instructions" TEXT,
    "prescriptionId" TEXT NOT NULL,
    CONSTRAINT "prescription_items_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "prescription_items_prescriptionId_idx" ON "prescription_items"("prescriptionId");

DO $$ BEGIN
  ALTER TABLE "prescription_items"
    ADD CONSTRAINT "prescription_items_prescriptionId_fkey"
    FOREIGN KEY ("prescriptionId") REFERENCES "prescriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Payments
CREATE TABLE IF NOT EXISTS "payments" (
    "id" TEXT NOT NULL,
    "receiptNumber" TEXT NOT NULL,
    "invoiceNumber" TEXT,
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "method" TEXT NOT NULL DEFAULT 'Nakit',
    "date" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "invoiceId" TEXT,
    "animalId" TEXT,
    "customerId" TEXT,
    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "payments_receiptNumber_key" ON "payments"("receiptNumber");
CREATE INDEX IF NOT EXISTS "payments_invoiceId_idx" ON "payments"("invoiceId");
CREATE INDEX IF NOT EXISTS "payments_animalId_idx" ON "payments"("animalId");
CREATE INDEX IF NOT EXISTS "payments_customerId_idx" ON "payments"("customerId");
CREATE INDEX IF NOT EXISTS "payments_date_idx" ON "payments"("date");

DO $$ BEGIN
  ALTER TABLE "payments"
    ADD CONSTRAINT "payments_invoiceId_fkey"
    FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "payments"
    ADD CONSTRAINT "payments_animalId_fkey"
    FOREIGN KEY ("animalId") REFERENCES "animals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "payments"
    ADD CONSTRAINT "payments_customerId_fkey"
    FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Settings (single JSON row)
CREATE TABLE IF NOT EXISTS "settings" (
    "id" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);
