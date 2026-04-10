/*
  Warnings:

  - The values [POTRAIT] on the enum `AdOrientation` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `estimated_total_price` on the `ad_units` table. All the data in the column will be lost.
  - You are about to drop the column `publicationIssueId` on the `ad_units` table. All the data in the column will be lost.
  - You are about to drop the column `target_publication_issue_id` on the `ad_units` table. All the data in the column will be lost.
  - You are about to drop the column `user_id` on the `ad_units` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[reference_code]` on the table `ad_units` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `final_price` to the `ad_units` table without a default value. This is not possible if the table is not empty.
  - Added the required column `publication_issue_id` to the `ad_units` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `ad_units` table without a default value. This is not possible if the table is not empty.
  - Made the column `company_id` on table `ad_units` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PARTIAL', 'PAID', 'REFUNDED', 'WAIVED');

-- AlterEnum
BEGIN;
CREATE TYPE "AdOrientation_new" AS ENUM ('PORTRAIT', 'LANDSCAPE');
ALTER TABLE "ad_units" ALTER COLUMN "orientation" DROP DEFAULT;
ALTER TABLE "ad_units" ALTER COLUMN "orientation" TYPE "AdOrientation_new" USING ("orientation"::text::"AdOrientation_new");
ALTER TYPE "AdOrientation" RENAME TO "AdOrientation_old";
ALTER TYPE "AdOrientation_new" RENAME TO "AdOrientation";
DROP TYPE "AdOrientation_old";
ALTER TABLE "ad_units" ALTER COLUMN "orientation" SET DEFAULT 'PORTRAIT';
COMMIT;

-- DropForeignKey
ALTER TABLE "ad_units" DROP CONSTRAINT "ad_units_company_id_fkey";

-- DropForeignKey
ALTER TABLE "ad_units" DROP CONSTRAINT "ad_units_publicationIssueId_fkey";

-- DropForeignKey
ALTER TABLE "ad_units" DROP CONSTRAINT "ad_units_user_id_fkey";

-- AlterTable
ALTER TABLE "ad_units" DROP COLUMN "estimated_total_price",
DROP COLUMN "publicationIssueId",
DROP COLUMN "target_publication_issue_id",
DROP COLUMN "user_id",
ADD COLUMN     "ad_type_id" TEXT,
ADD COLUMN     "body_text" TEXT,
ADD COLUMN     "created_by_id" TEXT,
ADD COLUMN     "designed_by_id" TEXT,
ADD COLUMN     "discount_amount" DECIMAL(8,2) NOT NULL DEFAULT 0,
ADD COLUMN     "final_price" DECIMAL(8,2) NOT NULL,
ADD COLUMN     "payment_status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "publication_issue_id" TEXT NOT NULL,
ADD COLUMN     "reference_code" TEXT,
ADD COLUMN     "template_id" TEXT,
ADD COLUMN     "title" TEXT,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "userId" TEXT,
ADD COLUMN     "verified_by_id" TEXT,
ALTER COLUMN "company_id" SET NOT NULL,
ALTER COLUMN "orientation" SET DEFAULT 'PORTRAIT',
ALTER COLUMN "base_price" SET DATA TYPE DECIMAL(8,2),
ALTER COLUMN "color_surcharge_price" SET DEFAULT 0,
ALTER COLUMN "color_surcharge_price" SET DATA TYPE DECIMAL(8,2),
ALTER COLUMN "placement_price" SET DEFAULT 0,
ALTER COLUMN "placement_price" SET DATA TYPE DECIMAL(8,2);

-- CreateTable
CREATE TABLE "ad_types" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ad_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcement_templates" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "ad_type_id" TEXT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "subject_line" TEXT,
    "template_content" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "announcement_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ad_types_company_id_is_active_idx" ON "ad_types"("company_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "ad_types_company_id_slug_key" ON "ad_types"("company_id", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "ad_types_company_id_name_key" ON "ad_types"("company_id", "name");

-- CreateIndex
CREATE INDEX "announcement_templates_company_id_is_active_idx" ON "announcement_templates"("company_id", "is_active");

-- CreateIndex
CREATE INDEX "announcement_templates_company_id_ad_type_id_idx" ON "announcement_templates"("company_id", "ad_type_id");

-- CreateIndex
CREATE UNIQUE INDEX "announcement_templates_company_id_slug_key" ON "announcement_templates"("company_id", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "announcement_templates_company_id_name_key" ON "announcement_templates"("company_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "ad_units_reference_code_key" ON "ad_units"("reference_code");

-- CreateIndex
CREATE INDEX "ad_units_company_id_publication_issue_id_idx" ON "ad_units"("company_id", "publication_issue_id");

-- CreateIndex
CREATE INDEX "ad_units_company_id_customer_id_idx" ON "ad_units"("company_id", "customer_id");

-- CreateIndex
CREATE INDEX "ad_units_company_id_status_idx" ON "ad_units"("company_id", "status");

-- AddForeignKey
ALTER TABLE "ad_types" ADD CONSTRAINT "ad_types_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcement_templates" ADD CONSTRAINT "announcement_templates_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcement_templates" ADD CONSTRAINT "announcement_templates_ad_type_id_fkey" FOREIGN KEY ("ad_type_id") REFERENCES "ad_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_units" ADD CONSTRAINT "ad_units_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_units" ADD CONSTRAINT "ad_units_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_units" ADD CONSTRAINT "ad_units_designed_by_id_fkey" FOREIGN KEY ("designed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_units" ADD CONSTRAINT "ad_units_verified_by_id_fkey" FOREIGN KEY ("verified_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_units" ADD CONSTRAINT "ad_units_publication_issue_id_fkey" FOREIGN KEY ("publication_issue_id") REFERENCES "publication_issues"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_units" ADD CONSTRAINT "ad_units_ad_type_id_fkey" FOREIGN KEY ("ad_type_id") REFERENCES "ad_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_units" ADD CONSTRAINT "ad_units_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "announcement_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_units" ADD CONSTRAINT "ad_units_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
