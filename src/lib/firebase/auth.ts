import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import { getAuth_ } from "./client";
import type { UserRole, UserProfile } from "@/types/user";

// Auth still flows through Firebase (ID token verification), but the user
// profile / credits / integrations now live in Postgres. These helpers call
// our /api/users/me route instead of writing to Firestore directly.

async function authedFetch(path: string, init: RequestInit = {}) {
  const u = getAuth_().currentUser;
  if (!u) throw new Error("not signed in");
  const token = await u.getIdToken();
  return fetch(path, {
    ...init,
    headers: {
      ...(init.headers || {}),
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
}

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
  _user: User,
  role: UserRole,
  displayName?: string
) {
  // Wait for Firebase to mint a token before calling our API.
  const res = await authedFetch("/api/users/me", {
    method: "POST",
    body: JSON.stringify({ role, displayName }),
  });
  if (!res.ok) throw new Error("Failed to create user profile");
}

export async function getUserProfile(_uid: string): Promise<UserProfile | null> {
  try {
    const res = await authedFetch("/api/users/me");
    if (!res.ok) return null;
    const data = await res.json();
    return data.user as UserProfile | null;
  } catch {
    return null;
  }
}

export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(getAuth_(), callback);
}
