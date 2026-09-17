import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Starting Database Cleanup ---');

  const admins = await prisma.user.findMany({
    where: { role: 'admin' },
    select: { id: true, name: true, email: true, role: true },
  });

  console.log(`Found ${admins.length} admin user(s) to preserve:`, admins);

  if (admins.length === 0) {
    console.error('CRITICAL: No admin user found! Aborting to prevent total user loss.');
    process.exit(1);
  }

  const adminIds = admins.map((a) => a.id);

  console.log('1. Deleting group messages and reports...');
  await prisma.groupMessageReport.deleteMany({});
  await prisma.groupMessage.deleteMany({});
  await prisma.groupMember.deleteMany({});
  await prisma.groupPayment.deleteMany({});
  await prisma.group.deleteMany({});

  console.log('2. Deleting reviews and enrollments...');
  await prisma.courseReview.deleteMany({});
  await prisma.tutorReview.deleteMany({});
  await prisma.enrollment.deleteMany({});

  console.log('3. Deleting payments and refunds...');
  await prisma.refund.deleteMany({});
  await prisma.payment.deleteMany({});

  console.log('4. Deleting bundles and bundle items...');
  await prisma.bundleItem.deleteMany({});
  await prisma.bundle.deleteMany({});

  console.log('5. Deleting resources and related moderation metadata...');
  await prisma.videoModerationScene.deleteMany({});
  await prisma.videoMetadata.deleteMany({});
  await prisma.resourceModerationLog.deleteMany({});
  await prisma.resourceExtractedContent.deleteMany({});
  await prisma.resourceCategory.deleteMany({});
  await prisma.resource.deleteMany({});

  console.log('6. Deleting courses...');
  await prisma.course.deleteMany({});

  console.log('7. Deleting tutor application documents, applications, skills, and profiles...');
  await prisma.tutorApplicationDocument.deleteMany({});
  await prisma.tutorApplication.deleteMany({});
  await prisma.tutorSkill.deleteMany({});
  await prisma.tutorProfile.deleteMany({});

  console.log('8. Deleting non-admin users...');
  const deletedUsers = await prisma.user.deleteMany({
    where: {
      id: { notIn: adminIds },
    },
  });
  console.log(`Deleted ${deletedUsers.count} non-admin user(s).`);

  console.log('9. Cleaning up local file paths on admin users...');
  for (const admin of admins) {
    await prisma.user.update({
      where: { id: admin.id },
      data: {
        profilePic: null, // Clear any local /resources/ path
      },
    });
  }

  const remainingUsers = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true },
  });
  console.log('Database cleanup complete! Remaining users:', remainingUsers);
}

main()
  .catch((e) => {
    console.error('Error during database cleanup:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
