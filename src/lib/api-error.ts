import { NextResponse } from "next/server";

// Single source of truth for API route error responses.
//
// Recognises Firebase Auth verifyIdToken errors (which carry a `code` like
// "auth/argument-error" or "auth/id-token-expired") and turns them into a
// generic 401 — without this, every route's catch block would return 500
// with the raw Firebase error message, which leaks implementation details
// and breaks the contract for the client.
export function jsonError(
  error: unknown,
  fallback: string = "request failed",
  fallbackStatus: number = 500
): NextResponse {
  const code = (error as { code?: string })?.code;
  if (typeof code === "string" && code.startsWith("auth/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(
    { error: error instanceof Error ? error.message : fallback },
    { status: fallbackStatus }
  );
}
