import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ── Categories ──────────────────────────────────────────────────
  const categories = await Promise.all([
    prisma.category.upsert({ where: { name: 'Mathematics' }, update: {}, create: { name: 'Mathematics', description: 'Algebra, Calculus, Statistics and more' } }),
    prisma.category.upsert({ where: { name: 'Physics' }, update: {}, create: { name: 'Physics', description: 'Classical mechanics, thermodynamics, quantum' } }),
    prisma.category.upsert({ where: { name: 'Computer Science' }, update: {}, create: { name: 'Computer Science', description: 'Programming, algorithms, data structures' } }),
    prisma.category.upsert({ where: { name: 'Chemistry' }, update: {}, create: { name: 'Chemistry', description: 'Organic, inorganic, physical chemistry' } }),
    prisma.category.upsert({ where: { name: 'English' }, update: {}, create: { name: 'English', description: 'Grammar, literature, writing skills' } }),
    prisma.category.upsert({ where: { name: 'Biology' }, update: {}, create: { name: 'Biology', description: 'Cells, genetics, ecology, anatomy' } }),
  ]);
  console.log(`✅ ${categories.length} categories seeded`);

  // ── Admin user (bootstrap mechanism) ─────────────────────────
  const passwordHash = await bcrypt.hash('Password123!', 12);
  const passwordHash2 = await bcrypt.hash('Admin@123456', 12);

  const admin = await prisma.user.upsert({
    where:  { email: 'admin@dev.studybuddy.test' },
    update: {},
    create: {
      name:        'Platform Admin',
      email:       'admin@dev.studybuddy.test',
      passwordHash,
      role:        'admin',
      status:      'active',
      isVerified:  true,
    },
  });

  const admin2 = await prisma.user.upsert({
    where:  { email: 'admin@studybuddy.com' },
    update: {},
    create: {
      name:        'StudyBuddy Admin',
      email:       'admin@studybuddy.com',
      passwordHash: passwordHash2,
      role:        'admin',
      status:      'active',
      isVerified:  true,
    },
  });
  console.log('✅ Admin users seeded:', admin.email, admin2.email);

  console.log('');
  console.log('📋 Credentials:');
  console.log('  Admin 1:  admin@studybuddy.com       |  Admin@123456');
  console.log('  Admin 2:  admin@dev.studybuddy.test  |  Password123!');
  console.log('');
  console.log('🎉 Seed complete!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
