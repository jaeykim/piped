import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { getAuth_, getDb } from "./client";
import type { UserRole } from "@/types/user";

export async function signUp(email: string, password: string) {
  const result = await createUserWithEmailAndPassword(getAuth_(), email, password);
  return result.user;
}

export async function signIn(email: string, password: string) {
  const result = await signInWithEmailAndPassword(getAuth_(), email, password);
  return result.user;
}

export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(getAuth_(), provider);
  return result.user;
}

export async function signOut() {
  await firebaseSignOut(getAuth_());
}

export async function createUserProfile(
  user: User,
  role: UserRole,
  displayName?: string
) {
  const userRef = doc(getDb(), "users", user.uid);
  await setDoc(userRef, {
    uid: user.uid,
    email: user.email,
    displayName: displayName || user.displayName || user.email?.split("@")[0],
    photoURL: user.photoURL || null,
    role,
    credits: 50, // Free starter credits (enough for: analysis 5 + copy 10 + images 5×2 + extras)
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    onboardingComplete: true,
    integrations: {},
  });
}

export async function getUserProfile(uid: string) {
  const userRef = doc(getDb(), "users", uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) return null;
  return { ...snap.data(), uid: snap.id } as import("@/types/user").UserProfile;
}

export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(getAuth_(), callback);
}
