-- AlterTable
ALTER TABLE "companies" ADD COLUMN     "timezone" TEXT NOT NULL DEFAULT 'UTC';

-- AlterTable
ALTER TABLE "publication_types" ADD COLUMN     "default_publish_date" INTEGER;
