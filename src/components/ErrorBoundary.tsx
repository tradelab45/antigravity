import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error | null;
}

interface ErrorBoundaryProps {
  children?: React.ReactNode;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('RupeeRookie interface error', error, info);
    try {
      sessionStorage.setItem('rr_last_error', JSON.stringify({ message: error?.message, stack: error?.stack, info }));
    } catch {}
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <section className="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-2xl text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-400/30 bg-amber-400/10 text-amber-300">
            <AlertTriangle className="h-7 w-7" aria-hidden="true" />
          </div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-indigo-300">RupeeRookie</p>
          <h1 className="mt-2 text-2xl font-black">The simulator hit a temporary snag</h1>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            Your browser-stored practice portfolio is still safe. Reload the app to reconnect and continue.
          </p>

          {this.state.error && (
            <div className="mt-4 text-left">
              <details className="rounded-xl border border-rose-500/30 bg-rose-950/30 p-3 text-xs">
                <summary className="cursor-pointer font-mono font-bold text-rose-300">
                  {this.state.error.message || 'Error details'}
                </summary>
                <pre className="mt-2 max-h-48 overflow-auto font-mono text-[10px] text-slate-300 whitespace-pre-wrap">
                  {this.state.error.stack}
                </pre>
              </details>
            </div>
          )}

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => {
                sessionStorage.clear();
                window.location.href = '/?classic=false';
              }}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 px-4 py-3 text-xs font-extrabold text-white transition"
            >
              Reset Session
            </button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-extrabold text-white transition hover:bg-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Reload RupeeRookie
            </button>
          </div>
        </section>
      </main>
    );
  }
}
