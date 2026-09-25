import React, { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    google?: any;
  }
}

const GIS_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';

export const FALLBACK_GOOGLE_CLIENT_ID = '92444997475-pplpa69ma4mv6l6ubs1r65apboehdn9n.apps.googleusercontent.com';

let clientIdPromise: Promise<string | null> | null = null;
let scriptPromise: Promise<void> | null = null;

function getStaticClientId(): string {
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GOOGLE_CLIENT_ID) {
      const viteId = String(import.meta.env.VITE_GOOGLE_CLIENT_ID).trim();
      if (viteId && viteId.includes('apps.googleusercontent.com')) return viteId;
    }
  } catch {}
  return FALLBACK_GOOGLE_CLIENT_ID;
}

function fetchClientId(): Promise<string> {
  if (!clientIdPromise) {
    clientIdPromise = (async () => {
      const defaultId = getStaticClientId();
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        const res = await fetch('/api/auth/google/config', { signal: controller.signal });
        clearTimeout(timeoutId);
        if (res.ok) {
          const contentType = res.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            const data = await res.json();
            if (data?.clientId && typeof data.clientId === 'string' && data.clientId.includes('apps.googleusercontent.com')) {
              return data.clientId;
            }
          }
        }
      } catch {
        // Expected when statically hosted on Hostinger / Netlify / Vercel
      }
      return defaultId;
    })();
  }
  return clientIdPromise as Promise<string>;
}

function loadGoogleScript(): Promise<void> {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[src="${GIS_SCRIPT_SRC}"]`) as HTMLScriptElement | null;
      if (existing) {
        if (window.google?.accounts?.id) return resolve();
        existing.addEventListener('load', () => resolve());
        existing.addEventListener('error', () => reject(new Error('Failed to load Google Sign-In')));
        return;
      }
      const script = document.createElement('script');
      script.src = GIS_SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => {
        scriptPromise = null;
        reject(new Error('Failed to load Google Sign-In'));
      };
      document.head.appendChild(script);
    });
  }
  return scriptPromise;
}

interface GoogleSignInButtonProps {
  /** Called with the Google ID token (JWT) after the user picks an account. */
  onCredential: (credential: string) => void;
  text?: 'signin_with' | 'signup_with' | 'continue_with';
  theme?: 'outline' | 'filled_blue' | 'filled_black';
  /** Rendered under the button, e.g. an "or" divider. Hidden when Google Sign-In is unavailable. */
  children?: React.ReactNode;
}

/**
 * Renders Google's official Sign-In button with automatic static-deployment support,
 * fallback client ID resolution, and custom branded button fallback if iframe fails.
 */
export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  onCredential,
  text = 'continue_with',
  theme = 'filled_black',
  children,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const callbackRef = useRef(onCredential);
  const [available, setAvailable] = useState(false);
  const [hasIframe, setHasIframe] = useState(false);

  callbackRef.current = onCredential;

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const clientId = await fetchClientId();
      if (!clientId || cancelled) return;

      try {
        await loadGoogleScript();
      } catch (err) {
        console.warn('Google Identity Services script load warning:', err);
      }

      if (cancelled || !containerRef.current) return;

      if (window.google?.accounts?.id) {
        try {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: (response: { credential?: string }) => {
              if (response?.credential) callbackRef.current(response.credential);
            },
            auto_select: false,
            cancel_on_tap_outside: true,
          });

          const computedWidth = containerRef.current.offsetWidth || 360;
          window.google.accounts.id.renderButton(containerRef.current, {
            type: 'standard',
            theme,
            size: 'large',
            text,
            shape: 'pill',
            logo_alignment: 'center',
            width: Math.min(Math.max(computedWidth, 240), 400),
          });

          // Check if Google successfully injected the iframe button
          setTimeout(() => {
            if (!cancelled && containerRef.current) {
              const iframe = containerRef.current.querySelector('iframe');
              if (iframe) {
                setHasIframe(true);
              }
            }
          }, 400);

          setAvailable(true);
        } catch (initErr) {
          console.error('Google button initialization error:', initErr);
          setAvailable(true);
        }
      } else {
        // Script could not be reached, still show fallback button
        setAvailable(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [text, theme]);

  const handleManualGoogleClick = () => {
    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          console.info('Google One Tap not displayed:', notification.getNotDisplayedReason?.());
        }
      });
    } else {
      alert('Google Sign-In is initializing. Please verify that https://aaravtest.online is added under "Authorized JavaScript origins" in your Google Cloud Console.');
    }
  };

  const labelText = text === 'signup_with' ? 'Sign up with Google' : text === 'signin_with' ? 'Sign in with Google' : 'Continue with Google';

  return (
    <div className="w-full flex flex-col items-center">
      {/* Official Google GSI Render Target */}
      <div 
        ref={containerRef} 
        className={`flex justify-center w-full min-h-[44px] transition-opacity duration-200 ${hasIframe ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`} 
      />

      {/* Branded Fallback Button (visible while iframe loads or if iframe cannot render due to origin policy) */}
      {available && !hasIframe && (
        <button
          type="button"
          onClick={handleManualGoogleClick}
          className="w-full max-w-[400px] h-[44px] px-5 rounded-full border border-white/15 bg-[#131314] hover:bg-[#1f1f23] text-white font-medium text-sm flex items-center justify-center gap-3 shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer active:scale-[0.99]"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
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
          <span>{labelText}</span>
        </button>
      )}

      {available && children}
    </div>
  );
};

export const AuthOrDivider: React.FC<{ className?: string }> = ({ className = 'text-slate-500 border-white/10' }) => (
  <div className={`flex items-center gap-3 my-4 text-[11px] font-bold uppercase tracking-wider ${className}`}>
    <span className="flex-1 border-t border-inherit" />
    <span>or</span>
    <span className="flex-1 border-t border-inherit" />
  </div>
);
