-- CreateEnum
CREATE TYPE "PricingRuleType" AS ENUM ('BASE_RATE', 'SURCHARGE', 'DISCOUNT', 'OVERRIDE_LIMIT');

-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('PERCENTAGE', 'FIXED_AMOUNT');

-- CreateTable
CREATE TABLE "pricing_rules" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "rule_type" "PricingRuleType" NOT NULL,
    "publication_type_id" TEXT,
    "ad_type_id" TEXT,
    "size" "AdSize",
    "area" "AdArea",
    "color_profile" "AdColorProfile",
    "condition" JSONB,
    "discount_type" "DiscountType",
    "value" DECIMAL(8,2) NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "effective_from" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effective_to" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pricing_rules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pricing_rules_company_id_is_active_effective_from_effective_idx" ON "pricing_rules"("company_id", "is_active", "effective_from", "effective_to");

-- CreateIndex
CREATE INDEX "pricing_rules_publication_type_id_idx" ON "pricing_rules"("publication_type_id");

-- CreateIndex
CREATE INDEX "pricing_rules_ad_type_id_idx" ON "pricing_rules"("ad_type_id");

-- AddForeignKey
ALTER TABLE "pricing_rules" ADD CONSTRAINT "pricing_rules_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pricing_rules" ADD CONSTRAINT "pricing_rules_publication_type_id_fkey" FOREIGN KEY ("publication_type_id") REFERENCES "publication_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pricing_rules" ADD CONSTRAINT "pricing_rules_ad_type_id_fkey" FOREIGN KEY ("ad_type_id") REFERENCES "ad_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;
