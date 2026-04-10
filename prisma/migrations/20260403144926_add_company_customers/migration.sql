/*
  Warnings:

  - You are about to drop the column `language` on the `announcement_templates` table. All the data in the column will be lost.
  - You are about to drop the column `placeholders` on the `announcement_templates` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('COLD_LEAD', 'PROSPECT', 'ACTIVE', 'INACTIVE_CHURNED');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('NOTE', 'CALL', 'EMAIL', 'MEETING', 'SYSTEM_STATUS_CHANGE', 'ORDER_PLACED');

-- DropForeignKey
ALTER TABLE "ad_units" DROP CONSTRAINT "ad_units_customer_id_fkey";

-- AlterTable
ALTER TABLE "announcement_templates" DROP COLUMN "language",
DROP COLUMN "placeholders";

-- CreateTable
CREATE TABLE "company_customers" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "global_customer_id" TEXT,
    "assigned_rep_id" TEXT,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "business_name" TEXT,
    "address" TEXT,
    "customer_type" "CustomerType" NOT NULL DEFAULT 'BUSINESS',
    "tags" TEXT[],
    "lead_status" "LeadStatus" NOT NULL DEFAULT 'PROSPECT',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "total_ads_placed" INTEGER NOT NULL DEFAULT 0,
    "lifetime_value" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "outstanding_balance" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "last_order_date" DATE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_customer_activities" (
    "id" TEXT NOT NULL,
    "company_customer_id" TEXT NOT NULL,
    "user_id" TEXT,
    "type" "ActivityType" NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "company_customer_activities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "company_customers_company_id_lead_status_idx" ON "company_customers"("company_id", "lead_status");

-- CreateIndex
CREATE UNIQUE INDEX "company_customers_company_id_email_key" ON "company_customers"("company_id", "email");

-- CreateIndex
CREATE INDEX "company_customer_activities_company_customer_id_idx" ON "company_customer_activities"("company_customer_id");

-- AddForeignKey
ALTER TABLE "company_customers" ADD CONSTRAINT "company_customers_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_customers" ADD CONSTRAINT "company_customers_global_customer_id_fkey" FOREIGN KEY ("global_customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_customers" ADD CONSTRAINT "company_customers_assigned_rep_id_fkey" FOREIGN KEY ("assigned_rep_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_customer_activities" ADD CONSTRAINT "company_customer_activities_company_customer_id_fkey" FOREIGN KEY ("company_customer_id") REFERENCES "company_customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_customer_activities" ADD CONSTRAINT "company_customer_activities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_units" ADD CONSTRAINT "ad_units_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "company_customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
