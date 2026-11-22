/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp } from 'firebase/app';
import {
  GoogleAuthProvider,
  connectAuthEmulator,
  getAuth,
} from 'firebase/auth';
import {
  connectFirestoreEmulator,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore';

/**
 * Firebase web config for the `focuslist-ee442` project.
 *
 * These values identify the project; they are not secrets (Firebase documents
 * them as safe to ship in client code). Access to data is enforced by the
 * Firestore security rules in `firestore.rules`.
 *
 * `authDomain` is the default `*.firebaseapp.com`, whose sign-in handler
 * always exists, so sign-in works locally even before the first Hosting
 * deploy. Popup sign-in (the normal path) works with it in every browser.
 * After the site is live, switching this to `focuslist-ee442.web.app` makes
 * the redirect fallback same-site too, for browsers that block third-party
 * storage (Safari, and Chrome without third-party cookies).
 */
const firebaseConfig = {
  apiKey: 'AIzaSyCTacv7CR3ZWWh9ZfpJ3_pkj4sWwwyndPQ',
  authDomain: 'focuslist-ee442.firebaseapp.com',
  projectId: 'focuslist-ee442',
  storageBucket: 'focuslist-ee442.firebasestorage.app',
  messagingSenderId: '886696919495',
  appId: '1:886696919495:web:f9b73e5818ec9f14f219e2',
};

export const USE_EMULATORS = import.meta.env.VITE_USE_EMULATORS === 'true';

/**
 * Local emulators run under a `demo-` project id, which the Firebase CLI keeps
 * fully offline (no real project or login needed). The app must use the same
 * id so its data lands where the emulators look.
 */
export const EMULATOR_PROJECT_ID = 'demo-focuslist';

export const app = initializeApp(
  USE_EMULATORS ? { ...firebaseConfig, projectId: EMULATOR_PROJECT_ID } : firebaseConfig
);

export const auth = getAuth(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

/**
 * IndexedDB-backed cache: tasks load instantly and keep working offline, and
 * writes made offline are queued and sent when the connection returns. The
 * multi-tab manager lets several open tabs share one cache.
 */
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});

if (USE_EMULATORS) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
}
