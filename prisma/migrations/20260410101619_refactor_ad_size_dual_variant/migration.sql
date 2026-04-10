/*
  Warnings:

  - You are about to drop the column `height` on the `ad_sizes` table. All the data in the column will be lost.
  - You are about to drop the column `variant` on the `ad_sizes` table. All the data in the column will be lost.
  - You are about to drop the column `width` on the `ad_sizes` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[company_id,name]` on the table `ad_sizes` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `height_big` to the `ad_sizes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `height_small` to the `ad_sizes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `width_big` to the `ad_sizes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `width_small` to the `ad_sizes` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "ad_sizes_company_id_name_variant_key";

-- AlterTable
ALTER TABLE "ad_sizes" DROP COLUMN "height",
DROP COLUMN "variant",
DROP COLUMN "width",
ADD COLUMN     "height_big" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "height_small" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "width_big" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "width_small" DOUBLE PRECISION NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "ad_sizes_company_id_name_key" ON "ad_sizes"("company_id", "name");
