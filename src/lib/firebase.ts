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
 * Firebase web config for the `stunning-dock-j6pck` project.
 *
 * These values identify the project; they are not secrets (Firebase documents
 * them as safe to ship in client code). Access to data is enforced by the
 * Firestore security rules in `firestore.rules`.
 *
 * `authDomain` is the Hosting domain (`*.web.app`) rather than the default
 * `*.firebaseapp.com`: Hosting serves the `/__/auth/` handler on its own
 * domain, which keeps the sign-in flow same-site for browsers that block
 * third-party storage (Safari, and Chrome without third-party cookies).
 */
const firebaseConfig = {
  apiKey: 'AIzaSyBm8bwTBew_w0f2qo_oqIn5_2VYmgn2VEg',
  authDomain: 'stunning-dock-j6pck.web.app',
  projectId: 'stunning-dock-j6pck',
  storageBucket: 'stunning-dock-j6pck.firebasestorage.app',
  messagingSenderId: '953248612426',
  appId: '1:953248612426:web:e8c7c8abc7181ce72226b3',
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
