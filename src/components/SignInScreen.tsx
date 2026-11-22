/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, Cloud, Loader2, Monitor, Moon, Sun } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

interface SignInScreenProps {
  onSignIn: () => Promise<void>;
  error: string | null;
}

/** Google's "G" mark, inline so the sign-in screen needs no extra assets. */
const GoogleMark: React.FC = () => (
  <svg viewBox="0 0 48 48" className="w-4 h-4" aria-hidden="true">
    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
  </svg>
);

const BENEFITS = [
  'Your tasks sync across all your devices',
  'Keeps working offline and catches up when you reconnect',
  'Tasks already saved in this browser are carried over',
];

export const SignInScreen: React.FC<SignInScreenProps> = ({ onSignIn, error }) => {
  const theme = useTheme();
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleSignIn = async () => {
    setIsSigningIn(true);
    try {
      await onSignIn();
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F4F0] dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <header className="flex items-center justify-between px-6 py-3.5">
        <span className="text-lg font-bold tracking-tight font-display">Focuslist</span>
        <button
          type="button"
          onClick={theme.cyclePreference}
          aria-label={`Theme: ${theme.preference}. Click to switch.`}
          className="icon-btn text-slate-600 dark:text-slate-400 bg-stone-100 dark:bg-slate-800 hover:bg-stone-200 dark:hover:bg-slate-700"
        >
          {theme.preference === 'light' ? (
            <Sun className="w-4 h-4" aria-hidden="true" />
          ) : theme.preference === 'dark' ? (
            <Moon className="w-4 h-4" aria-hidden="true" />
          ) : (
            <Monitor className="w-4 h-4" aria-hidden="true" />
          )}
        </button>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <section
          aria-labelledby="sign-in-heading"
          className="w-full max-w-sm bg-white dark:bg-slate-900 border border-stone-200/90 dark:border-slate-800 rounded-xl p-6 sm:p-8 space-y-6 shadow-sm"
        >
          <div className="space-y-2 text-center">
            <div className="w-11 h-11 mx-auto rounded-xl bg-slate-900 text-white dark:bg-slate-700 flex items-center justify-center">
              <Cloud className="w-5 h-5" aria-hidden="true" />
            </div>
            <h1 id="sign-in-heading" className="text-xl font-bold font-display tracking-tight">
              Sign in to Focuslist
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Your tasks and priorities, saved to your account.
            </p>
          </div>

          <ul className="space-y-2">
            {BENEFITS.map((benefit) => (
              <li key={benefit} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" aria-hidden="true" />
                <span>{benefit}</span>
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={handleSignIn}
            disabled={isSigningIn}
            className="w-full py-2.5 px-4 text-sm font-semibold rounded-lg border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:bg-stone-50 dark:hover:bg-slate-700 disabled:opacity-60 transition-colors inline-flex items-center justify-center gap-2.5"
          >
            {isSigningIn ? (
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
            ) : (
              <GoogleMark />
            )}
            <span>{isSigningIn ? 'Signing in…' : 'Continue with Google'}</span>
          </button>

          {error && (
            <p role="alert" className="text-xs font-medium text-red-600 dark:text-red-400 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>{error}</span>
            </p>
          )}
        </section>
      </main>
    </div>
  );
};
