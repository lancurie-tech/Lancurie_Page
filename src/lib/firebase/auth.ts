import {
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';
import type { AdminProfile } from '@/types/admin';

export async function loginUser(email: string, password: string): Promise<User> {
  if (!auth) throw new Error('Firebase não está configurado.');
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function logoutUser(): Promise<void> {
  if (!auth) return;
  await firebaseSignOut(auth);
}

function passwordResetContinueUrl(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  return `${window.location.origin}/login`;
}

export async function resetPassword(email: string): Promise<void> {
  if (!auth) throw new Error('Firebase não está configurado.');
  const url = passwordResetContinueUrl();
  await sendPasswordResetEmail(
    auth,
    email,
    url
      ? {
          url,
          handleCodeInApp: false,
        }
      : undefined
  );
}

export function onAuthChange(cb: (user: User | null) => void): () => void {
  if (!auth) {
    cb(null);
    return () => {};
  }
  return onAuthStateChanged(auth, cb);
}

export async function getAdminProfile(uid: string): Promise<AdminProfile | null> {
  if (!db) return null;
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  const data = snap.data() as { role?: string };
  if (data.role !== 'admin') return null;
  return { role: 'admin' };
}
