/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useState } from 'react';
import {
  getRedirectResult,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth';
import { clearIndexedDbPersistence, terminate } from 'firebase/firestore';
import { auth, db, googleProvider } from '../lib/firebase';

export type AuthStatus = 'loading' | 'signedOut' | 'signedIn';

export interface UseAuthResult {
  status: AuthStatus;
  user: User | null;
  /** Human-readable message from the last failed sign-in, if any. */
  error: string | null;
  signIn: () => Promise<void>;
}

/** Popup failures where a full-page redirect is likely to work instead. */
const REDIRECT_FALLBACK_CODES = new Set([
  'auth/popup-blocked',
  'auth/popup-closed-by-browser',
  'auth/operation-not-supported-in-this-environment',
]);

/** Errors that just mean the user backed out; not worth showing. */
const SILENT_CODES = new Set([
  'auth/popup-closed-by-user',
  'auth/cancelled-popup-request',
]);

function describeAuthError(err: unknown): string | null {
  const code = (err as { code?: string })?.code ?? '';
  if (SILENT_CODES.has(code)) return null;
  if (code === 'auth/network-request-failed') {
    return 'Network error. Check your connection and try again.';
  }
  if (code === 'auth/unauthorized-domain') {
    return 'Sign-in is not enabled for this site address yet.';
  }
  if (code === 'auth/operation-not-allowed') {
    return 'Google sign-in is not enabled for this project yet.';
  }
  return 'Sign-in failed. Please try again.';
}

export function useAuth(): UseAuthResult {
  const [user, setUser] = useState<User | null>(() => auth.currentUser);
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (next) => {
      setUser(next);
      setStatus(next ? 'signedIn' : 'signedOut');
    });
    // Surface errors from a redirect-based sign-in after the page returns.
    getRedirectResult(auth).catch((err) => setError(describeAuthError(err)));
    return unsubscribe;
  }, []);

  const signIn = useCallback(async () => {
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      const code = (err as { code?: string })?.code ?? '';
      if (REDIRECT_FALLBACK_CODES.has(code)) {
        await signInWithRedirect(auth, googleProvider);
        return;
      }
      setError(describeAuthError(err));
    }
  }, []);

  return { status, user, error, signIn };
}

/**
 * Sign out and wipe this device's offline copy of the tasks, so nothing stays
 * cached on a shared computer. The Firestore instance cannot be reused after
 * `terminate`, so the page reloads into a fresh signed-out state.
 */
export async function signOutAndClearCache(): Promise<void> {
  try {
    await firebaseSignOut(auth);
    await terminate(db);
    await clearIndexedDbPersistence(db);
  } finally {
    window.location.reload();
  }
}
