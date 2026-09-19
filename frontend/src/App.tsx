import { useEffect } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { AppRouter } from './routes/router';
import './styles/tokens.css';
import './styles/global.css';

function App() {
  // Global Protection: Intercept Ctrl+P (Print) and Ctrl+S (Save) for secure study materials
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCmdOrCtrl = e.ctrlKey || e.metaKey;
      if (isCmdOrCtrl && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault();
        e.stopPropagation();
        toast.error('Printing protected study materials and course content is strictly disabled.', {
          id: 'security-print-disabled',
        });
        return false;
      }
      if (isCmdOrCtrl && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        e.stopPropagation();
        toast.error('Downloading or exporting protected content is disabled.', {
          id: 'security-save-disabled',
        });
        return false;
      }
    };

    const handleBeforePrint = (e: Event) => {
      e.preventDefault();
      toast.error('Printing protected study materials is prohibited on StudyBuddy.', {
        id: 'security-print-disabled',
      });
    };

    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('beforeprint', handleBeforePrint);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('beforeprint', handleBeforePrint);
    };
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              fontFamily: 'Inter, sans-serif',
              fontSize: '14px',
              borderRadius: '10px',
              padding: '12px 16px',
              background: 'var(--color-surface)',
              color: 'var(--color-gray-900)',
              border: '1px solid var(--color-border)',
            },
            success: {
              iconTheme: { primary: '#10B981', secondary: 'white' },
            },
            error: {
              iconTheme: { primary: '#EF4444', secondary: 'white' },
            },
          }}
        />
        <AppRouter />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
