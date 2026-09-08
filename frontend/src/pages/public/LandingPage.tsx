import { Link } from 'react-router-dom';
import {
  ArrowRight, ShieldCheck, BookOpen, Bot, Users,
  Play, ChevronRight, Zap, Award, TrendingUp
} from 'lucide-react';
import { MOCK_TUTORS, MOCK_RESOURCES, MOCK_CATEGORIES } from '../../mock/data';
import { TutorCard } from '../../components/shared/TutorCard';
import { ResourceCard } from '../../components/shared/ResourceCard';
import { Button } from '../../components/ui/Button/Button';
import { Badge } from '../../components/ui/Badge/Badge';
import { Rating } from '../../components/ui/Rating/Rating';
import { ROUTES } from '../../constants';
import styles from './LandingPage.module.css';

const HOW_IT_WORKS = [
  {
    step: '01', icon: <BookOpen size={24} />, title: 'Browse & Discover',
    desc: 'Explore thousands of verified tutors, curated resources, and structured learning playlists.',
  },
  {
    step: '02', icon: <ShieldCheck size={24} />, title: 'Verified Quality',
    desc: 'Every tutor undergoes identity verification and content goes through our safety pipeline.',
  },
  {
    step: '03', icon: <Zap size={24} />, title: 'Learn Effectively',
    desc: 'Use AI assistance, join study groups, track progress, and master your subjects.',
  },
  {
    step: '04', icon: <Award size={24} />, title: 'Achieve Your Goals',
    desc: 'Get real results with personalized learning and a supportive community.',
  },
];

export function LandingPage() {
  return (
    <div className={styles.page}>

      {/* ===== HERO ===== */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <Badge variant="ai" className={styles.heroBadge}>
            <Bot size={12} />
            AI-Powered Learning Platform
          </Badge>
          <h1 className={styles.heroTitle}>
            Learn Something<br />
            <span className={styles.heroTitleAccent}>New Today</span>
          </h1>
          <p className={styles.heroSubtitle}>
            Connect with verified expert tutors, access structured resources,
            get AI-powered doubt solving, and learn collaboratively —
            all in one trusted platform.
          </p>
          <div className={styles.heroCta}>
            <Link to={ROUTES.REGISTER}>
              <Button size="lg" rightIcon={<ArrowRight size={18} />}>
                Start Learning Free
              </Button>
            </Link>
            <Link to={`${ROUTES.REGISTER}?role=tutor`}>
              <Button size="lg" variant="secondary" leftIcon={<Play size={16} />}>
                Become a Tutor
              </Button>
            </Link>
          </div>
          <div className={styles.heroStats}>
            <div className={styles.heroStat}>
              <span className={styles.heroStatValue}>10,000+</span>
              <span className={styles.heroStatLabel}>Active Students</span>
            </div>
            <div className={styles.heroStatDivider} />
            <div className={styles.heroStat}>
              <span className={styles.heroStatValue}>500+</span>
              <span className={styles.heroStatLabel}>Verified Tutors</span>
            </div>
            <div className={styles.heroStatDivider} />
            <div className={styles.heroStat}>
              <span className={styles.heroStatValue}>25,000+</span>
              <span className={styles.heroStatLabel}>Resources</span>
            </div>
            <div className={styles.heroStatDivider} />
            <div className={styles.heroStat}>
              <span className={styles.heroStatValue}>4.8★</span>
              <span className={styles.heroStatLabel}>Platform Rating</span>
            </div>
          </div>
        </div>
        <div className={styles.heroVisual}>
          <div className={styles.heroCard}>
            <div className={styles.heroCardInner}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--color-primary-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary-500)', fontSize: 20 }}>🧠</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>AI Study Assistant</div>
                  <div style={{ fontSize: 12, color: 'var(--color-gray-500)' }}>Ready to help</div>
                </div>
                <Badge variant="ai" className={styles.heroCardBadge}>Live</Badge>
              </div>
              <div className={styles.heroCardChat}>
                <div className={styles.heroCardMsg}>Can you explain integration by parts?</div>
                <div className={styles.heroCardReply}>
                  Sure! Integration by parts uses the formula: <strong>∫u dv = uv − ∫v du</strong>. Choose u as the function that simplifies when differentiated...
                </div>
              </div>
            </div>
          </div>
          <div className={styles.heroFloatingCard1}>
            <ShieldCheck size={16} color="var(--color-success)" />
            <span>Verified Tutor</span>
          </div>
          <div className={styles.heroFloatingCard2}>
            <TrendingUp size={16} color="var(--color-primary-500)" />
            <span>+23% this week</span>
          </div>
        </div>
      </section>

      {/* ===== CATEGORIES ===== */}
      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Browse by Subject</h2>
            <Link to={ROUTES.EXPLORE} className={styles.seeAll}>
              See all subjects <ChevronRight size={16} />
            </Link>
          </div>
          <div className={styles.categoriesGrid}>
            {MOCK_CATEGORIES.map(cat => (
              <Link key={cat.id} to={`${ROUTES.EXPLORE}?subject=${cat.slug}`} className={styles.categoryCard}>
                <span className={styles.categoryIcon}>{cat.icon}</span>
                <span className={styles.categoryName}>{cat.name}</span>
                <span className={styles.categoryCount}>{cat.resourceCount} resources</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FEATURED TUTORS ===== */}
      <section className={`${styles.section} ${styles.sectionAlt}`}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <div>
              <Badge variant="primary" className={styles.sectionBadge}>Expert Tutors</Badge>
              <h2 className={styles.sectionTitle}>Learn from the Best</h2>
              <p className={styles.sectionSubtitle}>All tutors are verified, background-checked, and rated by real students.</p>
            </div>
            <Link to={ROUTES.TUTORS} className={styles.seeAll}>
              Browse all tutors <ChevronRight size={16} />
            </Link>
          </div>
          <div className={styles.tutorGrid}>
            {MOCK_TUTORS.slice(0, 3).map(tutor => (
              <TutorCard key={tutor.id} tutor={tutor} />
            ))}
          </div>
        </div>
      </section>

      {/* ===== POPULAR RESOURCES ===== */}
      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <div>
              <Badge variant="premium" className={styles.sectionBadge}>Resources</Badge>
              <h2 className={styles.sectionTitle}>Popular Learning Resources</h2>
              <p className={styles.sectionSubtitle}>PDFs, videos, tests, and more — all verified and safe.</p>
            </div>
            <Link to={ROUTES.RESOURCES} className={styles.seeAll}>
              Browse all resources <ChevronRight size={16} />
            </Link>
          </div>
          <div className={styles.resourceGrid}>
            {MOCK_RESOURCES.slice(0, 4).map(resource => (
              <ResourceCard key={resource.id} resource={resource} />
            ))}
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className={`${styles.section} ${styles.howSection}`}>
        <div className={styles.container}>
          <div className={styles.sectionHeaderCenter}>
            <Badge variant="primary">How It Works</Badge>
            <h2 className={styles.sectionTitle}>Your Learning Journey</h2>
            <p className={styles.sectionSubtitle}>From discovery to mastery in four simple steps.</p>
          </div>
          <div className={styles.howGrid}>
            {HOW_IT_WORKS.map((item, i) => (
              <div key={i} className={styles.howCard}>
                <div className={styles.howStep}>{item.step}</div>
                <div className={styles.howIcon}>{item.icon}</div>
                <h3 className={styles.howTitle}>{item.title}</h3>
                <p className={styles.howDesc}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== AI SECTION ===== */}
      <section className={styles.aiSection}>
        <div className={styles.container}>
          <div className={styles.aiContent}>
            <div className={styles.aiText}>
              <Badge variant="ai" className={styles.sectionBadge}>
                <Bot size={12} />
                AI-Powered
              </Badge>
              <h2 className={styles.sectionTitle} style={{ color: 'white' }}>
                Your Personal AI<br />Study Companion
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.75)', lineHeight: 'var(--line-height-relaxed)', fontSize: 'var(--font-size-lg)' }}>
                Get instant answers, step-by-step explanations, code examples, and personalized study guidance — available 24/7.
              </p>
              <ul className={styles.aiFeatures}>
                <li>✓ Instant doubt solving in any subject</li>
                <li>✓ Step-by-step problem explanations</li>
                <li>✓ Code debugging and explanations</li>
                <li>✓ Personalized study strategies</li>
                <li>✓ Math formula and equation support</li>
              </ul>
              <Link to={ROUTES.AI}>
                <Button size="lg" style={{ background: 'white', color: 'var(--color-primary-700)', border: 'none' }}>
                  Try AI Assistant Free <ArrowRight size={18} />
                </Button>
              </Link>
            </div>
            <div className={styles.aiDemo}>
              <div className={styles.aiDemoCard}>
                <div className={styles.aiDemoHeader}>
                  <Bot size={20} />
                  <span>StudyBuddy AI</span>
                  <Badge variant="ai">Online</Badge>
                </div>
                <div className={styles.aiDemoMessages}>
                  <div className={styles.aiDemoUser}>What is the difference between a stack and a queue?</div>
                  <div className={styles.aiDemoBot}>
                    <p>Great question! Here's the key difference:</p>
                    <p><strong>Stack</strong> — Last In, First Out (LIFO)<br />
                    Like a stack of plates 🍽️ — you add/remove from the top.</p>
                    <p><strong>Queue</strong> — First In, First Out (FIFO)<br />
                    Like a line at a store 🛒 — first come, first served.</p>
                  </div>
                </div>
                <div className={styles.aiDemoUsage}>
                  <div className={styles.aiDemoUsageBar}>
                    <div style={{ width: '60%', height: '100%', background: 'var(--color-ai)', borderRadius: 'var(--radius-full)' }} />
                  </div>
                  <span>3 / 5 free messages used today</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== STUDY GROUPS ===== */}
      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <div>
              <Badge variant="success">Community</Badge>
              <h2 className={styles.sectionTitle}>Learn Together</h2>
              <p className={styles.sectionSubtitle}>Join study groups, share resources, and grow together.</p>
            </div>
            <Link to={ROUTES.STUDY_GROUPS} className={styles.seeAll}>
              Browse groups <ChevronRight size={16} />
            </Link>
          </div>
          <div className={styles.groupsGrid}>
            {[
              { name: 'JEE 2026 Aspirants', subject: 'Physics / Chem / Maths', members: 234, online: 18, emoji: '⚗️' },
              { name: 'CS Interview Prep', subject: 'Computer Science', members: 156, online: 12, emoji: '💻' },
              { name: 'Mathematics Enthusiasts', subject: 'Mathematics', members: 178, online: 15, emoji: '📐' },
              { name: 'IB Study Hub', subject: 'IB Curriculum', members: 89, online: 7, emoji: '📚', premium: true },
            ].map((g, i) => (
              <Link key={i} to={ROUTES.STUDY_GROUPS} className={styles.groupCard}>
                <div className={styles.groupEmoji}>{g.emoji}</div>
                <div className={styles.groupInfo}>
                  <div className={styles.groupName}>
                    {g.name}
                    {g.premium && <Badge variant="premium">Premium</Badge>}
                  </div>
                  <div className={styles.groupSubject}>{g.subject}</div>
                  <div className={styles.groupStats}>
                    <Users size={12} />
                    <span>{g.members} members</span>
                    <span className={styles.groupOnline}>• {g.online} online</span>
                  </div>
                </div>
                <ChevronRight size={16} className={styles.groupArrow} />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ===== TUTOR CTA ===== */}
      <section className={styles.tutorCta}>
        <div className={styles.container}>
          <div className={styles.tutorCtaContent}>
            <div className={styles.tutorCtaText}>
              <h2 className={styles.tutorCtaTitle}>Are You an Expert? Start Teaching Today.</h2>
              <p className={styles.tutorCtaDesc}>
                Share your knowledge, build your brand, and earn by creating resources and teaching students.
                Join 500+ verified tutors on StudyBuddy.
              </p>
              <div className={styles.tutorCtaStats}>
                <div><strong>₹48,000+</strong><br /><span>Avg. monthly earnings</span></div>
                <div><strong>500+</strong><br /><span>Active tutors</span></div>
                <div><strong>10K+</strong><br /><span>Students reached</span></div>
              </div>
            </div>
            <div className={styles.tutorCtaActions}>
              <Link to={`${ROUTES.REGISTER}?role=tutor`}>
                <Button size="lg" rightIcon={<ArrowRight size={18} />}>
                  Become a Tutor
                </Button>
              </Link>
              <Link to={ROUTES.TUTORS}>
                <Button size="lg" variant="ghost" style={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)', border: '1.5px solid' }}>
                  Learn More
                </Button>
              </Link>
              <div className={styles.tutorCtaReviews}>
                <div style={{ display: 'flex', marginLeft: 8 }}>
                  {['Sarah', 'James', 'Priya', 'David'].map(name => (
                    <div key={name} style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.5)', marginLeft: -8, background: 'var(--color-primary-700)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: 'white', fontWeight: 600 }}>
                      {name[0]}
                    </div>
                  ))}
                </div>
                <div>
                  <Rating value={4.8} showValue count={248} size="sm" />
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>from verified tutors</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
