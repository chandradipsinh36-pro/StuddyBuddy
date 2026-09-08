import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding development database...');

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

  const passwordHash = await bcrypt.hash('Password123!', 12);

  // ── Student 1 ───────────────────────────────────────────────────
  const student1 = await prisma.user.upsert({
    where: { email: 'student1@dev.studybuddy.test' },
    update: {},
    create: {
      name: 'Alex Johnson',
      email: 'student1@dev.studybuddy.test',
      passwordHash,
      role: 'student',
      isVerified: true,
    },
  });

  // ── Student 2 ───────────────────────────────────────────────────
  const student2 = await prisma.user.upsert({
    where: { email: 'student2@dev.studybuddy.test' },
    update: {},
    create: {
      name: 'Maria Santos',
      email: 'student2@dev.studybuddy.test',
      passwordHash,
      role: 'student',
      isVerified: true,
    },
  });

  // ── Tutor 1 ─────────────────────────────────────────────────────
  const tutor1 = await prisma.user.upsert({
    where: { email: 'tutor1@dev.studybuddy.test' },
    update: {},
    create: {
      name: 'Dr. Sarah Chen',
      email: 'tutor1@dev.studybuddy.test',
      passwordHash,
      role: 'tutor',
      isVerified: true,
    },
  });

  // ── Tutor 2 ─────────────────────────────────────────────────────
  const tutor2 = await prisma.user.upsert({
    where: { email: 'tutor2@dev.studybuddy.test' },
    update: {},
    create: {
      name: 'Prof. James Wilson',
      email: 'tutor2@dev.studybuddy.test',
      passwordHash,
      role: 'tutor',
      isVerified: true,
    },
  });

  console.log('✅ Users seeded');

  // ── Tutor Profiles ───────────────────────────────────────────────
  await prisma.tutorProfile.upsert({
    where: { tutorId: tutor1.id },
    update: {},
    create: {
      tutorId: tutor1.id,
      bio: 'PhD in Mathematics from MIT. 10+ years teaching experience.',
      instituteName: 'MIT',
      experienceYears: 10,
    },
  });

  await prisma.tutorProfile.upsert({
    where: { tutorId: tutor2.id },
    update: {},
    create: {
      tutorId: tutor2.id,
      bio: 'Professor of Physics. Specializing in quantum mechanics.',
      instituteName: 'Stanford University',
      experienceYears: 15,
    },
  });

  // ── Tutor Skills ─────────────────────────────────────────────────
  await prisma.tutorSkill.createMany({
    data: [
      { tutorId: tutor1.id, skillName: 'Calculus', proficiency: 'expert' },
      { tutorId: tutor1.id, skillName: 'Linear Algebra', proficiency: 'expert' },
      { tutorId: tutor1.id, skillName: 'Statistics', proficiency: 'intermediate' },
      { tutorId: tutor2.id, skillName: 'Quantum Mechanics', proficiency: 'expert' },
      { tutorId: tutor2.id, skillName: 'Thermodynamics', proficiency: 'expert' },
    ],
    skipDuplicates: true,
  });

  // ── Tutor Applications ───────────────────────────────────────────
  const app1 = await prisma.tutorApplication.create({
    data: {
      userId: tutor1.id,
      trialVideoUrl: 'https://www.youtube.com/watch?v=example1',
      status: 'approved',
    },
  });

  await prisma.tutorApplication.create({
    data: {
      userId: tutor2.id,
      trialVideoUrl: 'https://www.youtube.com/watch?v=example2',
      status: 'approved',
    },
  });

  // ── Courses ──────────────────────────────────────────────────────
  const mathCategory = categories.find(c => c.name === 'Mathematics')!;
  const physicsCategory = categories.find(c => c.name === 'Physics')!;
  const csCategory = categories.find(c => c.name === 'Computer Science')!;

  const course1 = await prisma.course.create({
    data: {
      tutorId: tutor1.id,
      categoryId: mathCategory.categoryId,
      title: 'Calculus Fundamentals',
      description: 'Master differential and integral calculus from the ground up.',
      price: 29.99,
      isPublished: true,
    },
  });

  const course2 = await prisma.course.create({
    data: {
      tutorId: tutor2.id,
      categoryId: physicsCategory.categoryId,
      title: 'Introduction to Quantum Mechanics',
      description: 'Explore the fascinating world of quantum physics.',
      price: 49.99,
      isPublished: true,
    },
  });

  const course3 = await prisma.course.create({
    data: {
      tutorId: tutor1.id,
      categoryId: csCategory.categoryId,
      title: 'Data Structures & Algorithms',
      description: 'Essential programming knowledge for interviews and beyond.',
      price: 0,
      isPublished: true,
    },
  });

  console.log('✅ Courses seeded');

  // ── Resources ─────────────────────────────────────────────────────
  const resource1 = await prisma.resource.create({
    data: {
      courseId: course1.courseId,
      uploadedBy: tutor1.id,
      filename: 'Calculus Cheat Sheet',
      fileType: 'pdf',
      fileUrl: 'https://example.com/files/calculus-cheat-sheet.pdf',
      isLocked: false,
      price: 0,
      status: 'published',
    },
  });

  const resource2 = await prisma.resource.create({
    data: {
      courseId: course2.courseId,
      uploadedBy: tutor2.id,
      filename: 'Quantum Mechanics Lecture 1',
      fileType: 'youtube',
      fileUrl: 'https://www.youtube.com/watch?v=quantum_lecture1',
      isLocked: false,
      price: 0,
      status: 'published',
    },
  });

  // YouTube metadata for resource2
  await prisma.videoMetadata.create({
    data: {
      resourceId: resource2.resourceId,
      youtubeVideoId: 'quantum_lecture1',
      title: 'Introduction to Wave Functions',
      durationSeconds: 3600,
      isEmbeddable: true,
    },
  });

  // ── Resource categories ───────────────────────────────────────────
  await prisma.resourceCategory.createMany({
    data: [
      { resourceId: resource1.resourceId, categoryId: mathCategory.categoryId },
      { resourceId: resource2.resourceId, categoryId: physicsCategory.categoryId },
    ],
    skipDuplicates: true,
  });

  // ── Enrollments ───────────────────────────────────────────────────
  const enrollment1 = await prisma.enrollment.create({
    data: {
      studentId: student1.id,
      courseId: course1.courseId,
      priceAtEnrollment: course1.price,
      status: 'active',
    },
  });

  const enrollment2 = await prisma.enrollment.create({
    data: {
      studentId: student2.id,
      courseId: course1.courseId,
      priceAtEnrollment: course1.price,
      status: 'active',
    },
  });

  // ── Payments ──────────────────────────────────────────────────────
  await prisma.payment.create({
    data: {
      studentId: student1.id,
      courseId: course1.courseId,
      amount: course1.price,
      status: 'success',
    },
  });

  // ── Reviews ───────────────────────────────────────────────────────
  await prisma.courseReview.create({
    data: {
      studentId: student1.id,
      courseId: course1.courseId,
      rating: 5,
      comment: 'Excellent course! Very well explained.',
    },
  });

  await prisma.tutorReview.create({
    data: {
      studentId: student1.id,
      tutorId: tutor1.id,
      rating: 5,
      comment: 'Dr. Chen is an outstanding teacher!',
    },
  });

  // ── Bundles ───────────────────────────────────────────────────────
  const bundle1 = await prisma.bundle.create({
    data: {
      tutorId: tutor1.id,
      title: 'Math & Programming Starter Pack',
      description: 'Everything you need to start your STEM journey.',
      price: 39.99,
      isPublished: true,
    },
  });

  await prisma.bundleItem.create({
    data: { bundleId: bundle1.bundleId, resourceId: resource1.resourceId },
  });

  // ── Groups ────────────────────────────────────────────────────────
  const group1 = await prisma.group.create({
    data: {
      name: 'Calculus Study Circle',
      createdBy: student1.id,
      courseId: course1.courseId,
      messageQuota: 1000,
      messagesUsed: 0,
    },
  });

  // Creator auto-member
  await prisma.groupMember.create({
    data: { groupId: group1.groupId, userId: student1.id, role: 'admin' },
  });

  await prisma.groupMember.create({
    data: { groupId: group1.groupId, userId: student2.id, role: 'member' },
  });

  // ── Group Messages ────────────────────────────────────────────────
  const msg1 = await prisma.groupMessage.create({
    data: {
      groupId: group1.groupId,
      senderId: student1.id,
      content: 'Welcome to the Calculus study group! 📚',
    },
  });

  await prisma.groupMessage.create({
    data: {
      groupId: group1.groupId,
      senderId: student2.id,
      content: 'Thanks! Really excited to study together.',
    },
  });

  // Update messages used
  await prisma.group.update({
    where: { groupId: group1.groupId },
    data: { messagesUsed: 2 },
  });

  console.log('✅ Groups and messages seeded');
  console.log('');
  console.log('📋 Development credentials (all use password: Password123!):');
  console.log('  Student: student1@dev.studybuddy.test');
  console.log('  Student: student2@dev.studybuddy.test');
  console.log('  Tutor:   tutor1@dev.studybuddy.test');
  console.log('  Tutor:   tutor2@dev.studybuddy.test');
  console.log('');
  console.log('🎉 Seed complete!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
