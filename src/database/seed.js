require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    const {
        SEED_ADMIN_EMAIL = 'superadmin@adpub.com',
        SEED_ADMIN_PASSWORD = 'SuperAdmin@123',
        SEED_ADMIN_FIRST_NAME = 'Super',
        SEED_ADMIN_LAST_NAME = 'Admin',
        BCRYPT_ROUNDS = '12',
    } = process.env;

    console.log('🌱 Seeding Super Admin...');

    const existing = await prisma.user.findUnique({ where: { email: SEED_ADMIN_EMAIL } });

    if (existing) {
        console.log(`✅ Super Admin already exists: ${SEED_ADMIN_EMAIL}`);
        return;
    }

    const passwordHash = await bcrypt.hash(SEED_ADMIN_PASSWORD, parseInt(BCRYPT_ROUNDS, 10));

    const admin = await prisma.user.create({
        data: {
            firstName: SEED_ADMIN_FIRST_NAME,
            lastName: SEED_ADMIN_LAST_NAME,
            email: SEED_ADMIN_EMAIL,
            passwordHash,
            role: 'SUPER_ADMIN',
            companyId: null,
            isActive: true,
        },
    });

    console.log(`✅ Super Admin created: ${admin.email} (id: ${admin.id})`);
    console.log(`   Default password: ${SEED_ADMIN_PASSWORD}`);
    console.log(`   ⚠️  Please change the password after first login!`);
}

main()
    .catch((err) => {
        console.error('❌ Seed failed:', err);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
