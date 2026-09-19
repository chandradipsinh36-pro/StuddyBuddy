// =====================================================
// Comprehensive Academic Degrees & Subjects Taxonomy
// Includes global standards (India, US, UK, EU, International)
// =====================================================

export interface DegreeCategory {
  category: string;
  degrees: {
    code: string;
    name: string;
    level: string;
  }[];
}

export const DEGREE_CATEGORIES: DegreeCategory[] = [
  {
    category: 'Doctorate & Post-Doctoral',
    degrees: [
      { code: 'Ph.D.', name: 'Doctor of Philosophy (Ph.D.)', level: 'Doctorate' },
      { code: 'D.Sc.', name: 'Doctor of Science (D.Sc. / Sc.D.)', level: 'Doctorate' },
      { code: 'Ed.D.', name: 'Doctor of Education (Ed.D.)', level: 'Doctorate' },
      { code: 'DBA', name: 'Doctor of Business Administration (DBA)', level: 'Doctorate' },
      { code: 'D.Eng.', name: 'Doctor of Engineering (D.Eng.)', level: 'Doctorate' },
      { code: 'MD', name: 'Doctor of Medicine (MD)', level: 'Doctorate' },
      { code: 'Post-Doc', name: 'Post-Doctoral Fellowship / Research', level: 'Post-Doctoral' },
    ],
  },
  {
    category: "Master's Degrees",
    degrees: [
      { code: 'MCA', name: 'Master of Computer Applications (MCA)', level: "Master's" },
      { code: 'MBA', name: 'Master of Business Administration (MBA)', level: "Master's" },
      { code: 'M.Tech', name: 'Master of Technology (M.Tech)', level: "Master's" },
      { code: 'M.E.', name: 'Master of Engineering (M.E.)', level: "Master's" },
      { code: 'M.Sc', name: 'Master of Science (M.Sc)', level: "Master's" },
      { code: 'MS', name: 'Master of Science (MS - US/International)', level: "Master's" },
      { code: 'M.Com', name: 'Master of Commerce (M.Com)', level: "Master's" },
      { code: 'M.A.', name: 'Master of Arts (M.A.)', level: "Master's" },
      { code: 'LL.M.', name: 'Master of Laws (LL.M.)', level: "Master's" },
      { code: 'M.Ed', name: 'Master of Education (M.Ed)', level: "Master's" },
      { code: 'M.Pharm', name: 'Master of Pharmacy (M.Pharm)', level: "Master's" },
      { code: 'MSW', name: 'Master of Social Work (MSW)', level: "Master's" },
      { code: 'MFA', name: 'Master of Fine Arts (MFA)', level: "Master's" },
      { code: 'M.Phil', name: 'Master of Philosophy (M.Phil)', level: "Master's" },
      { code: 'M.Des', name: 'Master of Design (M.Des)', level: "Master's" },
      { code: 'M.Arch', name: 'Master of Architecture (M.Arch)', level: "Master's" },
    ],
  },
  {
    category: "Bachelor's Degrees",
    degrees: [
      { code: 'B.Tech', name: 'Bachelor of Technology (B.Tech)', level: "Bachelor's" },
      { code: 'B.E.', name: 'Bachelor of Engineering (B.E.)', level: "Bachelor's" },
      { code: 'BCA', name: 'Bachelor of Computer Applications (BCA)', level: "Bachelor's" },
      { code: 'B.Sc', name: 'Bachelor of Science (B.Sc)', level: "Bachelor's" },
      { code: 'BS', name: 'Bachelor of Science (BS - US/International)', level: "Bachelor's" },
      { code: 'B.Com', name: 'Bachelor of Commerce (B.Com)', level: "Bachelor's" },
      { code: 'B.A.', name: 'Bachelor of Arts (B.A.)', level: "Bachelor's" },
      { code: 'BA', name: 'Bachelor of Arts (BA - US/International)', level: "Bachelor's" },
      { code: 'BBA', name: 'Bachelor of Business Administration (BBA)', level: "Bachelor's" },
      { code: 'BBS', name: 'Bachelor of Business Studies (BBS)', level: "Bachelor's" },
      { code: 'MBBS', name: 'Bachelor of Medicine, Bachelor of Surgery (MBBS)', level: "Bachelor's" },
      { code: 'BDS', name: 'Bachelor of Dental Surgery (BDS)', level: "Bachelor's" },
      { code: 'B.Pharm', name: 'Bachelor of Pharmacy (B.Pharm)', level: "Bachelor's" },
      { code: 'LL.B.', name: 'Bachelor of Laws (LL.B.)', level: "Bachelor's" },
      { code: 'B.Ed', name: 'Bachelor of Education (B.Ed)', level: "Bachelor's" },
      { code: 'B.Arch', name: 'Bachelor of Architecture (B.Arch)', level: "Bachelor's" },
      { code: 'B.Des', name: 'Bachelor of Design (B.Des)', level: "Bachelor's" },
      { code: 'BFA', name: 'Bachelor of Fine Arts (BFA)', level: "Bachelor's" },
      { code: 'BSW', name: 'Bachelor of Social Work (BSW)', level: "Bachelor's" },
    ],
  },
  {
    category: 'Diplomas & Professional Certifications',
    degrees: [
      { code: 'PG Diploma', name: 'Post Graduate Diploma (PGD / PGDM)', level: 'Diploma' },
      { code: 'Polytechnic Diploma', name: 'Diploma in Engineering / Polytechnic', level: 'Diploma' },
      { code: 'Associate Degree', name: 'Associate Degree (AA / AS)', level: 'Associate' },
      { code: 'B.Voc', name: 'Bachelor of Vocational Studies (B.Voc)', level: "Bachelor's" },
      { code: 'CA / CPA', name: 'Chartered Accountant (CA / CPA / ACCA)', level: 'Professional' },
      { code: 'CFA', name: 'Chartered Financial Analyst (CFA)', level: 'Professional' },
      { code: 'Certified Educator', name: 'Certified Professional Educator / B.El.Ed', level: 'Certification' },
    ],
  },
];

// Flat list of popular degrees for instant quick-selection
export const POPULAR_DEGREES = [
  'MCA',
  'MBA',
  'Ph.D.',
  'B.Tech',
  'M.Tech',
  'B.Sc',
  'M.Sc',
  'BCA',
  'B.Com',
  'M.Com',
  'B.A.',
  'M.A.',
];

// All degrees flattened for search
export const ALL_DEGREES = DEGREE_CATEGORIES.flatMap((c) =>
  c.degrees.map((d) => ({
    ...d,
    category: c.category,
    searchable: `${d.code} ${d.name} ${d.level} ${c.category}`.toLowerCase(),
  }))
);

export interface SubjectCategory {
  category: string;
  iconName: string;
  subjects: string[];
}

export const SUBJECT_CATEGORIES: SubjectCategory[] = [
  {
    category: 'Programming Languages & Coding',
    iconName: 'Terminal',
    subjects: [
      'React.js / React JS',
      'React Native (Mobile App Development)',
      'Next.js (React Framework)',
      'Vue.js / Nuxt.js',
      'Angular',
      'Node.js & Express.js',
      'NestJS (Backend Framework)',
      'Python Programming',
      'Python (Django / Flask / FastAPI)',
      'Java Programming',
      'Java (Spring Boot & Microservices)',
      'JavaScript (JS / ES6+)',
      'TypeScript (TS)',
      'C Programming',
      'C++ Programming',
      'C# / .NET / ASP.NET Core',
      'Go (Golang)',
      'Rust Programming',
      'PHP Web Programming (Laravel / Symfony)',
      'Ruby / Ruby on Rails',
      'Swift & SwiftUI (iOS Development)',
      'Kotlin & Jetpack Compose (Android Development)',
      'Dart & Flutter (Cross-Platform Apps)',
      'HTML5, CSS3 & Responsive Web Design',
      'Tailwind CSS & Modern UI Styling',
      'SQL & Relational Databases (PostgreSQL, MySQL, SQLite)',
      'NoSQL Databases (MongoDB, Redis, Cassandra)',
      'GraphQL & RESTful API Development',
      'Docker, Kubernetes & Containerization',
      'Git, GitHub & Version Control',
      'Linux System Administration & Shell / Bash Scripting',
      'Cloud Computing (AWS / Azure / GCP)',
      'Data Structures & Algorithms (DSA)',
      'Artificial Intelligence (AI) & Machine Learning (ML)',
      'Deep Learning (PyTorch / TensorFlow / Keras)',
      'Cybersecurity & Ethical Hacking',
      'Blockchain & Solidity (Web3 & Smart Contracts)',
      'DevOps & CI/CD Pipelines',
      'System Design & Microservices Architecture',
      'Software Testing & QA (Jest, Cypress, Selenium)',
      'UI/UX Design & Figma Prototyping',
      'R Programming (Data Analytics)',
      'MATLAB & Octave',
      'Scala',
      'Assembly Language',
      'Perl',
      'Lua',
      'Haskell',
      'Julia',
    ],
  },
  {
    category: 'Computer Science & Information Technology',
    iconName: 'Code',
    subjects: [
      'Computer Science',
      'Information Technology',
      'Software Engineering',
      'Artificial Intelligence (AI)',
      'Machine Learning (ML)',
      'Deep Learning',
      'Data Science',
      'Data Structures & Algorithms (DSA)',
      'Python Programming',
      'Java Programming',
      'C / C++ Programming',
      'JavaScript & TypeScript',
      'Web Development (Frontend & Backend)',
      'Mobile App Development (React Native / Flutter / Android / iOS)',
      'Cybersecurity & Ethical Hacking',
      'Cloud Computing (AWS / Azure / GCP)',
      'Database Management Systems (SQL & NoSQL)',
      'DevOps & CI/CD',
      'Computer Networks',
      'Operating Systems',
      'Blockchain Technology',
      'Natural Language Processing (NLP)',
      'Computer Vision',
    ],
  },
  {
    category: 'Mathematics & Statistics',
    iconName: 'Divide',
    subjects: [
      'Mathematics (General)',
      'Calculus (Differential & Integral)',
      'Algebra & Abstract Algebra',
      'Linear Algebra',
      'Geometry & Topology',
      'Trigonometry',
      'Probability & Statistics',
      'Discrete Mathematics',
      'Differential Equations',
      'Applied Mathematics',
      'Business Mathematics & Statistics',
      'Quantitative Aptitude & Reasoning',
      'Numerical Methods',
      'Mathematical Logic',
    ],
  },
  {
    category: 'Physical & Natural Sciences',
    iconName: 'Atom',
    subjects: [
      'Physics (General)',
      'Classical Mechanics & Thermodynamics',
      'Electromagnetism & Optics',
      'Quantum Physics & Modern Physics',
      'Chemistry (General)',
      'Organic Chemistry',
      'Inorganic Chemistry',
      'Physical Chemistry',
      'Biology (General)',
      'Biochemistry & Molecular Biology',
      'Biotechnology',
      'Genetics & Genomics',
      'Microbiology',
      'Zoology',
      'Botany',
      'Astronomy & Astrophysics',
      'Environmental Science & Ecology',
      'Geology & Earth Sciences',
    ],
  },
  {
    category: 'Business, Commerce & Economics',
    iconName: 'TrendingUp',
    subjects: [
      'Economics (Microeconomics & Macroeconomics)',
      'Financial Accounting',
      'Management Accounting & Costing',
      'Business Studies & Management',
      'Corporate Finance & Investment',
      'Marketing & Digital Marketing',
      'Human Resource Management (HRM)',
      'Banking, Financial Services & Insurance',
      'Business Law & Corporate Governance',
      'Taxation (Income Tax & GST)',
      'International Business',
      'Entrepreneurship & Startup Management',
    ],
  },
  {
    category: 'Engineering & Technology',
    iconName: 'Cpu',
    subjects: [
      'Electrical Engineering',
      'Electronics & Communication Engineering (ECE)',
      'Mechanical Engineering',
      'Civil Engineering',
      'Chemical Engineering',
      'Aerospace & Aeronautical Engineering',
      'Robotics & Mechatronics',
      'Biomedical Engineering',
      'Automobile Engineering',
      'VLSI Design & Embedded Systems',
    ],
  },
  {
    category: 'Languages & Literature',
    iconName: 'BookOpen',
    subjects: [
      'English Language & Grammar',
      'English Literature',
      'Hindi Language & Literature',
      'French',
      'Spanish',
      'German',
      'Sanskrit',
      'Creative Writing & Composition',
      'Linguistics & Phonetics',
      'IELTS / TOEFL / PTE English Prep',
    ],
  },
  {
    category: 'Humanities & Social Sciences',
    iconName: 'Globe',
    subjects: [
      'History (Ancient, Medieval, Modern & World)',
      'Geography (Physical & Human)',
      'Political Science & International Relations',
      'Psychology (Cognitive, Clinical, Social)',
      'Sociology',
      'Philosophy & Ethics',
      'Public Administration & Governance',
      'Law & Legal Studies (Constitutional, Criminal, Civil)',
      'Anthropology',
      'Journalism & Mass Communication',
    ],
  },
  {
    category: 'Competitive Exam Preparation',
    iconName: 'Award',
    subjects: [
      'JEE Main & Advanced (Physics, Chemistry, Math)',
      'NEET (Physics, Chemistry, Biology)',
      'GATE (Engineering & Sciences)',
      'UPSC / Civil Services Examination',
      'CAT / XAT / MBA Entrances',
      'GRE / GMAT Preparation',
      'SAT / ACT Preparation',
      'UGC NET / JRF Examination',
    ],
  },
];

// Popular subjects for one-click instant tags
export const POPULAR_SUBJECTS = [
  'Mathematics (General)',
  'Calculus (Differential & Integral)',
  'Computer Science',
  'Python Programming',
  'Java Programming',
  'Data Structures & Algorithms (DSA)',
  'Artificial Intelligence (AI)',
  'Physics (General)',
  'Chemistry (General)',
  'Organic Chemistry',
  'Biology (General)',
  'Economics (Microeconomics & Macroeconomics)',
  'Financial Accounting',
  'English Language & Literature',
];

// Flattened list of all unique subjects
export const ALL_SUBJECTS = Array.from(
  new Set(SUBJECT_CATEGORIES.flatMap((c) => c.subjects))
).sort((a, b) => a.localeCompare(b));
