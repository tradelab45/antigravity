import React, { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    google?: any;
  }
}

const GIS_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';

let clientIdPromise: Promise<string | null> | null = null;
let scriptPromise: Promise<void> | null = null;

function fetchClientId(): Promise<string | null> {
  if (!clientIdPromise) {
    clientIdPromise = fetch('/api/auth/google/config')
      .then((res) => (res.ok ? res.json() : { clientId: null }))
      .then((data) => data.clientId || null)
      .catch(() => null);
  }
  return clientIdPromise;
}

function loadGoogleScript(): Promise<void> {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
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
 * Renders Google's official Sign-In button. Renders nothing when the server
 * has no GOOGLE_CLIENT_ID configured, so email/password auth keeps working.
 */
export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  onCredential,
  text = 'continue_with',
  theme = 'outline',
  children,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const callbackRef = useRef(onCredential);
  const [available, setAvailable] = useState(false);

  callbackRef.current = onCredential;

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const clientId = await fetchClientId();
      if (!clientId || cancelled) return;
      try {
        await loadGoogleScript();
      } catch {
        return;
      }
      if (cancelled || !containerRef.current || !window.google?.accounts?.id) return;

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response: { credential?: string }) => {
          if (response.credential) callbackRef.current(response.credential);
        },
        ux_mode: 'popup',
      });
      window.google.accounts.id.renderButton(containerRef.current, {
        type: 'standard',
        theme,
        size: 'large',
        text,
        shape: 'pill',
        logo_alignment: 'center',
        width: Math.min(containerRef.current.offsetWidth || 360, 400),
      });
      setAvailable(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [text, theme]);

  return (
    <div>
      {/* Stays empty (zero height) until Google Sign-In is configured and loaded. */}
      <div ref={containerRef} className="flex justify-center w-full" />
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
