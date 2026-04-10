-- AlterEnum
ALTER TYPE "PublicationFrequency" ADD VALUE 'SPECIAL';

-- AlterTable
ALTER TABLE "publication_types" ADD COLUMN     "special_publication_date" DATE;
