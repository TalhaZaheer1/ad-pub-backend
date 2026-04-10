/*
  Warnings:

  - The values [ADMIN] on the enum `Role` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `company_id` on the `customers` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "CustomerType" AS ENUM ('INDIVISUAL', 'BUSINESS', 'AGENCY', 'NON_PROFIT');

-- CreateEnum
CREATE TYPE "PublicationFrequency" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY');

-- CreateEnum
CREATE TYPE "AdSize" AS ENUM ('FULL_PAGE', 'HALF_PAGE', 'QUARTER_PAGE', 'ONE_EIGTH_PAGE');

-- CreateEnum
CREATE TYPE "AdStatus" AS ENUM ('APPROVED', 'IN_REVIEW', 'PUBLISHED', 'NEEDS_REVISIONS');

-- CreateEnum
CREATE TYPE "AdOrientation" AS ENUM ('POTRAIT', 'LANDSCAPE');

-- CreateEnum
CREATE TYPE "AdColorProfile" AS ENUM ('FULL_COLOR', 'GRAYSCALE', 'BLACK_WHITE');

-- CreateEnum
CREATE TYPE "PostingMethod" AS ENUM ('CUSTOMER_UPLOAD', 'EMPLOYEE_UPLOAD');

-- AlterEnum
BEGIN;
CREATE TYPE "Role_new" AS ENUM ('SUPER_ADMIN', 'COMPANY_ADMIN', 'SALES', 'DESIGNER', 'PRODUCTION');
ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "role" TYPE "Role_new" USING ("role"::text::"Role_new");
ALTER TYPE "Role" RENAME TO "Role_old";
ALTER TYPE "Role_new" RENAME TO "Role";
DROP TYPE "Role_old";
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'SALES';
COMMIT;

-- DropForeignKey
ALTER TABLE "customers" DROP CONSTRAINT "customers_company_id_fkey";

-- DropIndex
DROP INDEX "customers_company_id_idx";

-- AlterTable
ALTER TABLE "customers" DROP COLUMN "company_id",
ADD COLUMN     "customer_type" "CustomerType" NOT NULL DEFAULT 'BUSINESS',
ALTER COLUMN "password_hash" DROP NOT NULL;

-- CreateTable
CREATE TABLE "customers_on_companies" (
    "customer_id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "last_order" DATE NOT NULL,
    "lifetime_value" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "customers_on_companies_pkey" PRIMARY KEY ("customer_id","company_id")
);

-- CreateTable
CREATE TABLE "publication_types" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "frequency" "PublicationFrequency" NOT NULL DEFAULT 'WEEKLY',
    "default_publish_day" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "publication_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "publication_issues" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "publication_type_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "issue_date" DATE NOT NULL,
    "hebrew_date" TEXT NOT NULL,
    "deadline_at" TIMESTAMP(3) NOT NULL,
    "is_locked" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "publication_issues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ad_units" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "company_id" TEXT,
    "customer_id" TEXT,
    "posting_method" "PostingMethod" NOT NULL DEFAULT 'EMPLOYEE_UPLOAD',
    "status" "AdStatus" NOT NULL DEFAULT 'IN_REVIEW',
    "size" "AdSize" NOT NULL DEFAULT 'FULL_PAGE',
    "orientation" "AdOrientation" NOT NULL DEFAULT 'POTRAIT',
    "color_profile" "AdColorProfile" NOT NULL DEFAULT 'FULL_COLOR',
    "special_instructions" TEXT,
    "target_publication_issue_id" TEXT NOT NULL,
    "artwork_asset_url" TEXT,
    "artwork_asset_format" TEXT,
    "base_price" DECIMAL(6,2) NOT NULL,
    "color_surcharge_price" DECIMAL(6,2) NOT NULL,
    "placement_price" DECIMAL(6,2) NOT NULL,
    "estimated_total_price" DECIMAL(6,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publicationIssueId" TEXT NOT NULL,

    CONSTRAINT "ad_units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_CompanyToCustomer" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_CompanyToCustomer_AB_unique" ON "_CompanyToCustomer"("A", "B");

-- CreateIndex
CREATE INDEX "_CompanyToCustomer_B_index" ON "_CompanyToCustomer"("B");

-- AddForeignKey
ALTER TABLE "customers_on_companies" ADD CONSTRAINT "customers_on_companies_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customers_on_companies" ADD CONSTRAINT "customers_on_companies_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "publication_types" ADD CONSTRAINT "publication_types_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "publication_issues" ADD CONSTRAINT "publication_issues_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "publication_issues" ADD CONSTRAINT "publication_issues_publication_type_id_fkey" FOREIGN KEY ("publication_type_id") REFERENCES "publication_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_units" ADD CONSTRAINT "ad_units_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_units" ADD CONSTRAINT "ad_units_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_units" ADD CONSTRAINT "ad_units_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_units" ADD CONSTRAINT "ad_units_publicationIssueId_fkey" FOREIGN KEY ("publicationIssueId") REFERENCES "publication_issues"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CompanyToCustomer" ADD CONSTRAINT "_CompanyToCustomer_A_fkey" FOREIGN KEY ("A") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CompanyToCustomer" ADD CONSTRAINT "_CompanyToCustomer_B_fkey" FOREIGN KEY ("B") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
