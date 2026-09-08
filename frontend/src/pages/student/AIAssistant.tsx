import { Link } from 'react-router-dom';
import { Bot, Sparkles, Users, BookOpen, GraduationCap, ArrowRight } from 'lucide-react';
import { Button } from '../../components/ui/Button/Button';
import { Badge } from '../../components/ui/Badge/Badge';
import { ROUTES } from '../../constants';

export function AIAssistantPage() {
  return (
    <div style={{
      minHeight: 'calc(100vh - var(--nav-height))',
      background: 'radial-gradient(ellipse at top, rgba(99, 102, 241, 0.08) 0%, rgba(248, 250, 252, 0) 70%), var(--color-surface)',
      padding: 'var(--space-12) var(--space-6)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{
        maxWidth: '720px',
        width: '100%',
        textAlign: 'center',
        background: 'var(--color-white)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-xl)',
        padding: 'var(--space-10) var(--space-8)',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.02)',
      }}>
        <div style={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto var(--space-4)',
          boxShadow: '0 10px 15px -3px rgba(99, 102, 241, 0.3)',
          color: '#ffffff',
        }}>
          <Sparkles size={32} />
        </div>

        <div style={{ marginBottom: 'var(--space-3)' }}>
          <Badge variant="primary">StudyBuddy AI • Next-Gen Release</Badge>
        </div>

        <h1 style={{
          fontSize: 'var(--font-size-3xl)',
          fontWeight: 'var(--font-weight-bold)',
          color: 'var(--color-gray-900)',
          letterSpacing: '-0.025em',
          marginBottom: 'var(--space-3)',
        }}>
          AI Study Companion is Coming Soon
        </h1>

        <p style={{
          fontSize: 'var(--font-size-base)',
          color: 'var(--color-gray-600)',
          lineHeight: 'var(--line-height-relaxed)',
          marginBottom: 'var(--space-8)',
          maxWidth: '560px',
          margin: '0 auto var(--space-8)',
        }}>
          We are developing an intelligent, curriculum-aligned academic tutor that provides step-by-step doubt resolution, smart summary notes, and custom test quizzes.
        </p>

        {/* Feature Teasers */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 'var(--space-4)',
          marginBottom: 'var(--space-8)',
          textAlign: 'left',
        }}>
          <div style={{
            padding: 'var(--space-4)',
            background: 'var(--color-gray-50)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
          }}>
            <Bot size={20} color="var(--color-primary-600)" style={{ marginBottom: 8 }} />
            <h4 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)', margin: '0 0 4px' }}>
              Instant Doubt Solver
            </h4>
            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)', margin: 0 }}>
              Step-by-step mathematical & scientific explanations.
            </p>
          </div>

          <div style={{
            padding: 'var(--space-4)',
            background: 'var(--color-gray-50)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
          }}>
            <BookOpen size={20} color="var(--color-secondary-600)" style={{ marginBottom: 8 }} />
            <h4 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)', margin: '0 0 4px' }}>
              Smart Cheatsheets
            </h4>
            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)', margin: 0 }}>
              Automatic flashcards and summaries extracted from textbooks.
            </p>
          </div>

          <div style={{
            padding: 'var(--space-4)',
            background: 'var(--color-gray-50)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
          }}>
            <Sparkles size={20} color="#f59e0b" style={{ marginBottom: 8 }} />
            <h4 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)', margin: '0 0 4px' }}>
              Adaptive Quizzes
            </h4>
            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)', margin: 0 }}>
              Personalized practice tests targeting your knowledge gaps.
            </p>
          </div>
        </div>

        {/* Alternative Actions */}
        <div style={{
          borderTop: '1px solid var(--color-border)',
          paddingTop: 'var(--space-6)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'var(--space-3)',
        }}>
          <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-500)' }}>
            Need help right now? Learn from verified tutors and active peer study groups:
          </span>
          <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', justifyContent: 'center' }}>
            <Link to={ROUTES.TUTORS} style={{ textDecoration: 'none' }}>
              <Button variant="primary" size="md" leftIcon={<GraduationCap size={16} />}>
                Find Verified Tutors
              </Button>
            </Link>
            <Link to={ROUTES.STUDY_GROUPS} style={{ textDecoration: 'none' }}>
              <Button variant="secondary" size="md" leftIcon={<Users size={16} />}>
                Join Peer Groups
              </Button>
            </Link>
            <Link to={ROUTES.RESOURCES} style={{ textDecoration: 'none' }}>
              <Button variant="ghost" size="md" rightIcon={<ArrowRight size={16} />}>
                Browse Materials
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
