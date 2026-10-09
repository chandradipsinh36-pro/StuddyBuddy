import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding rich academic courses and study bundles...');

  // Find tutors
  const tutors = await prisma.user.findMany({ where: { role: 'tutor' } });
  if (tutors.length === 0) {
    console.log('No tutors found.');
    return;
  }
  const tutor1 = tutors[0]; // TestTutor1 (id 76)
  const tutor2 = tutors.length > 1 ? tutors[1] : tutor1; // John (id 78)
  const tutor3 = tutors.length > 2 ? tutors[2] : tutor1; // prof.max (id 79)

  // Categories map
  const categories = await prisma.category.findMany();
  const getCatId = (name: string) => categories.find(c => c.name.toLowerCase() === name.toLowerCase())?.categoryId;

  const bioCatId = getCatId('Biology');
  const mathCatId = getCatId('Mathematics');
  const physCatId = getCatId('Physics');
  const chemCatId = getCatId('Chemistry');
  const engCatId = getCatId('English');
  const csCatId = getCatId('Computer Science');

  const newCourses = [
    {
      title: 'Complete Biology & Genetics Masterclass',
      categoryId: bioCatId,
      tutorId: tutor3.id,
      price: 1999,
      isPublished: true,
      description: JSON.stringify({
        overview: 'Comprehensive study of cell biology, genetics, molecular structures, and evolutionary processes with illustrated diagrams and exam question practice.',
        thumbnailUrl: 'https://images.unsplash.com/photo-1530497610245-94d3c16cda28?auto=format&fit=crop&w=800&q=80',
        lessons: [
          {
            id: 'bio-l1',
            title: 'Lesson 1: Cell Structure and Organelles In-Depth',
            videoUrl: 'https://www.youtube.com/watch?v=URUJD5NEXC8',
            resourceIds: []
          },
          {
            id: 'bio-l2',
            title: 'Lesson 2: Mendelian Genetics & DNA Replication',
            videoUrl: 'https://www.youtube.com/watch?v=8m6hHRlKwxY',
            resourceIds: []
          },
          {
            id: 'bio-l3',
            title: 'Lesson 3: Human Physiology & Metabolism Overview',
            videoUrl: 'https://www.youtube.com/watch?v=fR3NxCR9z2U',
            resourceIds: []
          }
        ]
      })
    },
    {
      title: 'Human Anatomy & Cellular Biology Essentials',
      categoryId: bioCatId,
      tutorId: tutor2.id,
      price: 1499,
      isPublished: true,
      description: JSON.stringify({
        overview: 'Foundational guide to human physiology, microscopic anatomy, cell communication, and immunological systems for medical and biological studies.',
        thumbnailUrl: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=800&q=80',
        lessons: [
          {
            id: 'bio-anat-l1',
            title: 'Lesson 1: Cellular Membrane & Signal Transduction',
            videoUrl: 'https://www.youtube.com/watch?v=qBCVVszQQNs',
            resourceIds: []
          },
          {
            id: 'bio-anat-l2',
            title: 'Lesson 2: Tissue Systems and Organ Functions',
            videoUrl: 'https://www.youtube.com/watch?v=uBGl2BujkPQ',
            resourceIds: []
          }
        ]
      })
    },
    {
      title: 'Advanced Calculus & Linear Algebra Mastery',
      categoryId: mathCatId,
      tutorId: tutor1.id,
      price: 2499,
      isPublished: true,
      description: JSON.stringify({
        overview: 'Master differentiation, integration, multivariable calculus, eigenvalues, eigenvectors, and matrix decompositions with real-world problems.',
        thumbnailUrl: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=800&q=80',
        lessons: [
          {
            id: 'math-l1',
            title: 'Lesson 1: Limits, Continuity and Fundamental Theorem',
            videoUrl: 'https://www.youtube.com/watch?v=WUvTyaaNkzM',
            resourceIds: []
          },
          {
            id: 'math-l2',
            title: 'Lesson 2: Matrix Transformations and Vector Spaces',
            videoUrl: 'https://www.youtube.com/watch?v=fNk_zzaMoSs',
            resourceIds: []
          }
        ]
      })
    },
    {
      title: 'Classical Mechanics & Modern Quantum Physics',
      categoryId: physCatId,
      tutorId: tutor3.id,
      price: 2199,
      isPublished: true,
      description: JSON.stringify({
        overview: 'Deep dive into Newtonian mechanics, electromagnetism, wave-particle duality, Schrödinger equation, and thermodynamic laws.',
        thumbnailUrl: 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?auto=format&fit=crop&w=800&q=80',
        lessons: [
          {
            id: 'phys-l1',
            title: 'Lesson 1: Kinematics, Dynamics & Conservation Laws',
            videoUrl: 'https://www.youtube.com/watch?v=b1t41Q3xRM8',
            resourceIds: []
          },
          {
            id: 'phys-l2',
            title: 'Lesson 2: Wave Mechanics and Quantum States',
            videoUrl: 'https://www.youtube.com/watch?v=7u_UQG1Ka6Q',
            resourceIds: []
          }
        ]
      })
    },
    {
      title: 'Organic Chemistry Reactions & Mechanisms',
      categoryId: chemCatId,
      tutorId: tutor2.id,
      price: 1899,
      isPublished: true,
      description: JSON.stringify({
        overview: 'Step-by-step breakdown of electrophilic substitution, nucleophilic addition, stereochemistry, and spectroscopy for chemistry undergraduates.',
        thumbnailUrl: 'https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?auto=format&fit=crop&w=800&q=80',
        lessons: [
          {
            id: 'chem-l1',
            title: 'Lesson 1: Bonding, Hybridization and Resonance',
            videoUrl: 'https://www.youtube.com/watch?v=V8kH5e0c5R0',
            resourceIds: []
          },
          {
            id: 'chem-l2',
            title: 'Lesson 2: Reaction Mechanisms and Synthesis Pathways',
            videoUrl: 'https://www.youtube.com/watch?v=9hE_uVp1U4M',
            resourceIds: []
          }
        ]
      })
    },
    {
      title: 'Academic English: Essay Writing & Critical Analysis',
      categoryId: engCatId,
      tutorId: tutor1.id,
      price: 999,
      isPublished: true,
      description: JSON.stringify({
        overview: 'Develop strong academic arguments, master advanced grammar structures, write compelling literature reviews, and format research papers.',
        thumbnailUrl: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=800&q=80',
        lessons: [
          {
            id: 'eng-l1',
            title: 'Lesson 1: Thesis Formation and Structuring Arguments',
            videoUrl: 'https://www.youtube.com/watch?v=7P4f8zXz3k0',
            resourceIds: []
          },
          {
            id: 'eng-l2',
            title: 'Lesson 2: Advanced Sentence Variety and Rhetoric',
            videoUrl: 'https://www.youtube.com/watch?v=mD9f_Bw5C5g',
            resourceIds: []
          }
        ]
      })
    }
  ];

  for (const c of newCourses) {
    if (!c.categoryId) continue;
    const existing = await prisma.course.findFirst({ where: { title: c.title } });
    if (!existing) {
      await prisma.course.create({
        data: {
          title: c.title,
          description: c.description,
          price: c.price,
          isPublished: c.isPublished,
          categoryId: c.categoryId,
          tutorId: c.tutorId,
        }
      });
      console.log(`Created course: ${c.title}`);
    } else {
      console.log(`Course exists: ${c.title}`);
    }
  }

  // Create additional bundles if needed so Curated Study Bundles has diverse subjects
  const existingBundles = await prisma.bundle.findMany();
  console.log(`Current bundles count: ${existingBundles.length}`);

  if (existingBundles.length < 4) {
    await prisma.bundle.create({
      data: {
        title: 'Complete Biology & Life Sciences Bundle',
        description: 'Comprehensive study packs covering Cell Biology, Genetics, and Physiology notes and exam sets.',
        price: 999,
        originalPrice: 1599,
        discountPercent: 37,
        isPublished: true,
        tutorId: tutor3.id,
      }
    });
    console.log('Created Biology bundle');
  }

  console.log('Seeding finished successfully.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
