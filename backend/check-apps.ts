import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  const apps = await prisma.tutorApplication.findMany({
    include: {
      user: {
        include: {
          tutorProfile: true,
          tutorSkills: true,
        },
      },
      documents: true,
    },
  });
  console.log('APPS COUNT:', apps.length);
  console.log('APPS:', JSON.stringify(apps, null, 2));

  const tutors = await prisma.user.findMany({
    where: { role: 'tutor' },
    include: {
      tutorProfile: true,
      tutorApplications: true,
    },
  });
  console.log('TUTORS COUNT:', tutors.length);
  console.log('TUTORS:', JSON.stringify(tutors, null, 2));

  await prisma.$disconnect();
}

run().catch(console.error);
