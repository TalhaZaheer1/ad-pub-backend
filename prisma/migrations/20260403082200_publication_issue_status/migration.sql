-- CreateEnum
CREATE TYPE "PublicationIssueStatus" AS ENUM ('SCHEDULED', 'OPEN', 'IN_PROGRESS', 'READY', 'LOCKED', 'PRINTED', 'ARCHIVED', 'DEADLINE_PASSED');

-- AlterTable
ALTER TABLE "publication_issues" ADD COLUMN     "status" "PublicationIssueStatus" NOT NULL DEFAULT 'SCHEDULED';
