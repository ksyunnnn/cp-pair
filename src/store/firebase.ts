// Firebase の初期化はこのファイルだけで行う（モジュラー SDK）。
//
// VITE_FIREBASE_* の値は秘密ではない。ブラウザに配る前提の値で、守りは Firestore のセキュリティルール
// （firestore.rules）が受け持つ。値を隠すことで守っているのではない。
import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { connectAuthEmulator, getAuth, signInAnonymously, type Auth } from "firebase/auth";
import { connectFirestoreEmulator, getFirestore, type Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// 開発サーバの再読み込みで同じアプリを二度作らない
const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);

// VITE_USE_FIREBASE_EMULATOR が true のときだけ、手元のエミュレーターにつなぐ。二重につながない
declare global {
  var __CP_PAIR_FB_EMULATOR__: boolean | undefined;
}

if (import.meta.env.VITE_USE_FIREBASE_EMULATOR === "true" && !globalThis.__CP_PAIR_FB_EMULATOR__) {
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
  globalThis.__CP_PAIR_FB_EMULATOR__ = true;
}

let signingIn: Promise<string> | null = null;

/** 匿名認証でサインインし、uid を返す。uid はこのブラウザに残り、開き直しても同じ値になる。 */
export function ensureSignedIn(): Promise<string> {
  if (!signingIn) {
    signingIn = (async () => {
      await auth.authStateReady();
      if (auth.currentUser) return auth.currentUser.uid;
      const credential = await signInAnonymously(auth);
      return credential.user.uid;
    })();
    // 失敗したら、次の呼び出しでやり直す
    signingIn.catch(() => {
      signingIn = null;
    });
  }
  return signingIn;
}

export { app };
