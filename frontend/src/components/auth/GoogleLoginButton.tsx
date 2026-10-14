import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { ROUTES } from '../../constants';
import toast from 'react-hot-toast';
import styles from './GoogleLoginButton.module.css';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          renderButton: (parent: HTMLElement, options: any) => void;
          prompt: (momentListener?: (notification: any) => void) => void;
          cancel: () => void;
        };
        oauth2: {
          initTokenClient: (config: any) => {
            requestAccessToken: (overrideConfig?: any) => void;
          };
          initCodeClient: (config: any) => {
            requestCode: () => void;
          };
        };
      };
    };
  }
}

const DEFAULT_CLIENT_ID = '174417435512-d3b8rmfsdq16tkohvvdicdkj7rt7os79.apps.googleusercontent.com';

interface GoogleLoginButtonProps {
  role?: 'student' | 'tutor';
  text?: 'signin_with' | 'signup_with' | 'continue_with';
  onSuccess?: (user: any) => void;
  className?: string;
}

export function GoogleLoginButton({
  role = 'student',
  text = 'continue_with',
  onSuccess,
  className = '',
}: GoogleLoginButtonProps) {
  const { googleLogin } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || DEFAULT_CLIENT_ID;
  const from = (location.state as any)?.from?.pathname || null;

  const handleAuthSuccess = useCallback(async (payload: { credential?: string; accessToken?: string; code?: string }) => {
    try {
      setLoading(true);
      const user = await googleLogin({ ...payload, role });
      toast.success(`Welcome, ${user.name}!`);
      if (onSuccess) {
        onSuccess(user);
      } else {
        const dest = from || (user.role === 'tutor' ? (!user.isVerified ? ROUTES.TUTOR_ONBOARDING : ROUTES.TUTOR_DASHBOARD) : ROUTES.STUDENT_DASHBOARD);
        navigate(dest, { replace: true });
      }
    } catch (err: any) {
      console.error('Google Auth Error:', err);
      const message = err?.response?.data?.error?.message || err?.message || 'Google sign in failed. Please try again.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [googleLogin, role, onSuccess, from, navigate]);

  // Load GIS script dynamically if not present
  useEffect(() => {
    if (window.google?.accounts?.id) {
      setScriptLoaded(true);
      return;
    }

    const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (!existingScript) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => setScriptLoaded(true);
      document.body.appendChild(script);
    } else {
      const checkInterval = setInterval(() => {
        if (window.google?.accounts?.id) {
          setScriptLoaded(true);
          clearInterval(checkInterval);
        }
      }, 150);
      return () => clearInterval(checkInterval);
    }
  }, []);

  // Initialize and render GIS button
  useEffect(() => {
    if (!scriptLoaded || !window.google?.accounts?.id || !containerRef.current) return;

    try {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response: any) => {
          if (response?.credential) {
            handleAuthSuccess({ credential: response.credential });
          }
        },
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      // Clear previous rendered button if theme changed
      containerRef.current.innerHTML = '';

      window.google.accounts.id.renderButton(containerRef.current, {
        type: 'standard',
        theme: theme === 'dark' ? 'filled_black' : 'outline',
        size: 'large',
        text: text === 'signup_with' ? 'signup_with' : text === 'signin_with' ? 'signin_with' : 'continue_with',
        shape: 'rectangular',
        logo_alignment: 'left',
        width: 320,
      });
    } catch (e) {
      console.warn('Google GSI render error:', e);
    }
  }, [scriptLoaded, clientId, theme, text, handleAuthSuccess]);

  // Custom click fallback (opens OAuth token client popup)
  const handleCustomClick = () => {
    if (loading) return;

    if (window.google?.accounts?.oauth2) {
      try {
        setLoading(true);
        const tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: 'email profile openid',
          callback: (response: any) => {
            if (response?.access_token) {
              handleAuthSuccess({ accessToken: response.access_token });
            } else if (response?.error) {
              setLoading(false);
              toast.error(response.error_description || 'Google sign-in was cancelled');
            } else {
              setLoading(false);
            }
          },
        });
        tokenClient.requestAccessToken();
      } catch (err) {
        setLoading(false);
        console.error('Failed to open token client:', err);
        // Fallback to prompt
        if (window.google?.accounts?.id) {
          window.google.accounts.id.prompt();
        }
      }
    } else if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt();
    } else {
      toast.error('Google Sign-In is initializing. Please wait a moment.');
    }
  };

  const buttonText = text === 'signup_with'
    ? 'Sign up with Google'
    : text === 'signin_with'
    ? 'Sign in with Google'
    : 'Continue with Google';

  return (
    <div className={`${styles.container} ${className}`}>
      {/* Container for the official Google GIS rendered button */}
      <div
        ref={containerRef}
        className={styles.googleBtnWrapper}
        style={{ display: scriptLoaded ? 'flex' : 'none' }}
      />

      {/* Fallback branded button while loading or if rendered button is hidden */}
      {(!scriptLoaded || loading) && (
        <button
          type="button"
          onClick={handleCustomClick}
          disabled={loading}
          className={styles.customGoogleBtn}
          aria-label={buttonText}
        >
          {loading ? (
            <div className={styles.spinner} />
          ) : (
            <svg className={styles.googleIcon} viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          )}
          <span>{loading ? 'Authenticating with Google...' : buttonText}</span>
        </button>
      )}
    </div>
  );
}
