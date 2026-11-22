/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** "true" to point Auth and Firestore at the local Firebase emulators. */
  readonly VITE_USE_EMULATORS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
