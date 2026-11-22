/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Loader2 } from 'lucide-react';
import App from './App';
import { SignInScreen } from './components/SignInScreen';
import { useAuth } from './hooks/useAuth';

/**
 * Sign-in is required: the workspace only renders for a signed-in user.
 * `key={user.uid}` remounts the app (resetting all state and the Firestore
 * listener) if a different account signs in.
 */
export const AuthGate: React.FC = () => {
  const { status, user, error, signIn } = useAuth();

  if (status === 'loading') {
    return (
      <div
        role="status"
        aria-label="Loading"
        className="min-h-screen flex items-center justify-center bg-[#F4F4F0] dark:bg-slate-950 text-slate-500 dark:text-slate-400"
      >
        <Loader2 className="w-6 h-6 animate-spin" aria-hidden="true" />
      </div>
    );
  }

  if (status === 'signedOut' || !user) {
    return <SignInScreen onSignIn={signIn} error={error} />;
  }

  return <App key={user.uid} user={user} />;
};
