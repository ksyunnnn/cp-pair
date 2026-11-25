// import.meta.env の型。https://vite.dev/guide/env-and-mode
interface ImportMetaEnv {
  /** "firestore" で Firestore 版の RoomStore を使う。それ以外は localStorage 版 */
  readonly VITE_ROOM_STORE?: string;
  readonly VITE_FIREBASE_API_KEY?: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN?: string;
  readonly VITE_FIREBASE_PROJECT_ID?: string;
  readonly VITE_FIREBASE_STORAGE_BUCKET?: string;
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID?: string;
  readonly VITE_FIREBASE_APP_ID?: string;
  /** "true" で手元の Firebase Emulator Suite につなぐ */
  readonly VITE_USE_FIREBASE_EMULATOR?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
