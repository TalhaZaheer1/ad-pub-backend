/*
  Warnings:

  - The values [NEEDS_REVISIONS] on the enum `AdStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `artwork_asset_format` on the `ad_units` table. All the data in the column will be lost.
  - You are about to drop the column `artwork_asset_url` on the `ad_units` table. All the data in the column will be lost.
  - You are about to drop the column `base_price` on the `ad_units` table. All the data in the column will be lost.
  - You are about to drop the column `color_surcharge_price` on the `ad_units` table. All the data in the column will be lost.
  - You are about to drop the column `discount_amount` on the `ad_units` table. All the data in the column will be lost.
  - You are about to drop the column `placement_price` on the `ad_units` table. All the data in the column will be lost.
  - You are about to drop the column `size` on the `ad_units` table. All the data in the column will be lost.
  - You are about to drop the column `size` on the `pricing_rules` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'OPEN', 'PAID', 'PARTIAL', 'OVERDUE', 'REFUNDED', 'WAIVED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('STRIPE', 'BANK_TRANSFER', 'CREDIT_CARD', 'CHECK', 'CASH', 'OTHER');

-- CreateEnum
CREATE TYPE "DesignStatus" AS ENUM ('NOT_STARTED', 'QUEUED', 'IN_DESIGN', 'NEEDS_CONTENT', 'CONTENT_ADDED', 'NEEDS_REVIEW', 'APPROVED');

-- CreateEnum
CREATE TYPE "LayoutVariant" AS ENUM ('BIG', 'SMALL');

-- CreateEnum
CREATE TYPE "OperationalTag" AS ENUM ('PAID', 'FREE', 'FILLER', 'EXCHANGE');

-- AlterEnum
BEGIN;
CREATE TYPE "AdStatus_new" AS ENUM ('IN_REVIEW', 'APPROVED', 'REJECTED', 'READY', 'PRINTED', 'PUBLISHED', 'ARCHIVED');
ALTER TABLE "ad_units" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "ad_units" ALTER COLUMN "status" TYPE "AdStatus_new" USING ("status"::text::"AdStatus_new");
ALTER TYPE "AdStatus" RENAME TO "AdStatus_old";
ALTER TYPE "AdStatus_new" RENAME TO "AdStatus";
DROP TYPE "AdStatus_old";
ALTER TABLE "ad_units" ALTER COLUMN "status" SET DEFAULT 'IN_REVIEW';
COMMIT;

-- AlterEnum
ALTER TYPE "PaymentStatus" ADD VALUE 'NOT_REQUIRED';

-- AlterEnum
ALTER TYPE "PricingRuleType" ADD VALUE 'TAX';

-- AlterEnum
ALTER TYPE "PublicationIssueStatus" ADD VALUE 'PUBLISHED';

-- AlterTable
ALTER TABLE "ad_units" DROP COLUMN "artwork_asset_format",
DROP COLUMN "artwork_asset_url",
DROP COLUMN "base_price",
DROP COLUMN "color_surcharge_price",
DROP COLUMN "discount_amount",
DROP COLUMN "placement_price",
DROP COLUMN "size",
ADD COLUMN     "ad_size_name" TEXT,
ADD COLUMN     "deadline" DATE,
ADD COLUMN     "design_status" "DesignStatus" NOT NULL DEFAULT 'NOT_STARTED',
ADD COLUMN     "has_big_variant" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "has_small_variant" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "last_design_action_at" TIMESTAMP(3),
ADD COLUMN     "layout_variant" "LayoutVariant",
ADD COLUMN     "operational_tags" "OperationalTag"[],
ADD COLUMN     "priority" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "companies" ADD COLUMN     "invoice_seq" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "pricing_rules" DROP COLUMN "size",
ADD COLUMN     "ad_size_name" TEXT;

-- DropEnum
DROP TYPE "AdSize";

-- CreateTable
CREATE TABLE "ad_unit_pricing" (
    "id" TEXT NOT NULL,
    "ad_unit_id" TEXT NOT NULL,
    "rule_id" TEXT,
    "name" TEXT NOT NULL,
    "amount" DECIMAL(8,2) NOT NULL,
    "type" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ad_unit_pricing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ad_assets" (
    "id" TEXT NOT NULL,
    "ad_unit_id" TEXT NOT NULL,
    "asset_role" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "format" TEXT,
    "filename" TEXT,
    "public_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ad_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "company_customer_id" TEXT NOT NULL,
    "ad_unit_id" TEXT,
    "publication_issue_id" TEXT,
    "created_by_id" TEXT,
    "invoice_number" TEXT NOT NULL,
    "issue_date" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "due_date" DATE,
    "base_amount" DECIMAL(10,2) NOT NULL,
    "tax_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total_amount" DECIMAL(10,2) NOT NULL,
    "paid_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "remaining_balance" DECIMAL(10,2) NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'OPEN',
    "sent_at" TIMESTAMP(3),
    "paid_at" TIMESTAMP(3),
    "refunded_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_payments" (
    "id" TEXT NOT NULL,
    "invoice_id" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "payment_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "payment_method" "PaymentMethod" NOT NULL,
    "reference_number" TEXT,
    "proof_asset_url" TEXT,
    "recorded_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invoice_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ad_sizes" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "variant" "LayoutVariant" NOT NULL DEFAULT 'BIG',
    "width" DOUBLE PRECISION NOT NULL,
    "height" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'mm',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ad_sizes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ad_assets_ad_unit_id_idx" ON "ad_assets"("ad_unit_id");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_ad_unit_id_key" ON "invoices"("ad_unit_id");

-- CreateIndex
CREATE INDEX "invoices_company_id_status_idx" ON "invoices"("company_id", "status");

-- CreateIndex
CREATE INDEX "invoices_company_customer_id_idx" ON "invoices"("company_customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_company_id_invoice_number_key" ON "invoices"("company_id", "invoice_number");

-- CreateIndex
CREATE INDEX "invoice_payments_invoice_id_idx" ON "invoice_payments"("invoice_id");

-- CreateIndex
CREATE UNIQUE INDEX "ad_sizes_company_id_name_variant_key" ON "ad_sizes"("company_id", "name", "variant");

-- AddForeignKey
ALTER TABLE "ad_unit_pricing" ADD CONSTRAINT "ad_unit_pricing_ad_unit_id_fkey" FOREIGN KEY ("ad_unit_id") REFERENCES "ad_units"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_assets" ADD CONSTRAINT "ad_assets_ad_unit_id_fkey" FOREIGN KEY ("ad_unit_id") REFERENCES "ad_units"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_company_customer_id_fkey" FOREIGN KEY ("company_customer_id") REFERENCES "company_customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_ad_unit_id_fkey" FOREIGN KEY ("ad_unit_id") REFERENCES "ad_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_payments" ADD CONSTRAINT "invoice_payments_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_payments" ADD CONSTRAINT "invoice_payments_recorded_by_id_fkey" FOREIGN KEY ("recorded_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_sizes" ADD CONSTRAINT "ad_sizes_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
