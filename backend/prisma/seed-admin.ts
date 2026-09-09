import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('Password123!', 12);

  const admin = await prisma.user.upsert({
    where:  { email: 'admin@dev.studybuddy.test' },
    update: {},
    create: {
      name:         'Platform Admin',
      email:        'admin@dev.studybuddy.test',
      passwordHash,
      role:         'admin',
      status:       'active',
      isVerified:   true,
    },
  });

  console.log('✅ Admin user ready:', admin.email);
  console.log('   Password: Password123!');
  console.log('   Role:    ', admin.role);
  console.log('   Status:  ', admin.status);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
