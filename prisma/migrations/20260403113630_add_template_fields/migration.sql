-- AlterTable
ALTER TABLE "announcement_templates" ADD COLUMN     "language" TEXT NOT NULL DEFAULT 'en',
ADD COLUMN     "placeholders" JSONB DEFAULT '[]';
