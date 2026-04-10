/**
 * migrate_workflow_enums.js
 *
 * Uses raw SQL to remap stale enum values that were valid before the schema
 * change but no longer exist in the new Prisma-generated client.
 *
 * Usage:  node backend/prisma/migrations/migrate_workflow_enums.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Starting workflow enum migration (raw SQL)...\n');

  // ── AdStatus: NEEDS_REVISIONS → IN_REVIEW ────────────────────────────────
  const r1 = await prisma.$executeRawUnsafe(
    `UPDATE "ad_units" SET "status" = 'IN_REVIEW' WHERE "status"::text = 'NEEDS_REVISIONS'`
  );
  console.log(`✅ AdStatus NEEDS_REVISIONS → IN_REVIEW: ${r1} rows`);

  // ── DesignStatus: APPROVED_FOR_PRINT → NEEDS_REVIEW ──────────────────────
  const r2 = await prisma.$executeRawUnsafe(
    `UPDATE "ad_units" SET "design_status" = 'NEEDS_REVIEW' WHERE "design_status"::text = 'APPROVED_FOR_PRINT'`
  );
  console.log(`✅ DesignStatus APPROVED_FOR_PRINT → NEEDS_REVIEW: ${r2} rows`);

  // ── DesignStatus: PRINTED → APPROVED ─────────────────────────────────────
  const r3 = await prisma.$executeRawUnsafe(
    `UPDATE "ad_units" SET "design_status" = 'APPROVED' WHERE "design_status"::text = 'PRINTED'`
  );
  console.log(`✅ DesignStatus PRINTED → APPROVED: ${r3} rows`);

  // ── DesignStatus: READY → APPROVED ───────────────────────────────────────
  const r4 = await prisma.$executeRawUnsafe(
    `UPDATE "ad_units" SET "design_status" = 'APPROVED' WHERE "design_status"::text = 'READY'`
  );
  console.log(`✅ DesignStatus READY → APPROVED: ${r4} rows`);

  // ── DesignStatus: ARCHIVED → NOT_STARTED ─────────────────────────────────
  const r5 = await prisma.$executeRawUnsafe(
    `UPDATE "ad_units" SET "design_status" = 'NOT_STARTED' WHERE "design_status"::text = 'ARCHIVED'`
  );
  console.log(`✅ DesignStatus ARCHIVED → NOT_STARTED: ${r5} rows`);

  console.log('\n🎉 Migration complete.');
}

main()
  .catch((e) => {
    console.error('❌ Migration failed:', e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
