-- CreateEnum
CREATE TYPE "AnnouncementTemplateLanguage" AS ENUM ('ENGLISH', 'HEBREW', 'YIDDISH');

-- AlterTable
ALTER TABLE "announcement_templates" ADD COLUMN     "language" "AnnouncementTemplateLanguage" NOT NULL DEFAULT 'ENGLISH';
