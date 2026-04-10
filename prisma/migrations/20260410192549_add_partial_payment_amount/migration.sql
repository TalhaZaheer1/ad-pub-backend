-- CreateEnum
CREATE TYPE "PaymentRecordCreationMethod" AS ENUM ('STAFF', 'CUSTOMER', 'SYSTEM');

-- AlterTable
ALTER TABLE "ad_units" ADD COLUMN     "partial_payment_amount" DECIMAL(8,2);

-- AlterTable
ALTER TABLE "invoice_payments" ADD COLUMN     "payment_record_creation_method" "PaymentRecordCreationMethod" NOT NULL DEFAULT 'STAFF';
