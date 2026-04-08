import { promises as fs } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

// Local-disk replacement for Firebase Storage. Files land under
// $UPLOADS_DIR (default /var/piped/uploads) and are served by the
// /uploads/[...path] route handler.

const UPLOADS_DIR = process.env.UPLOADS_DIR || "/var/piped/uploads";

export interface SaveImageInput {
  ownerId: string;
  projectId: string;
  /** PNG bytes — accept Buffer, Uint8Array, or base64 string. */
  data: Buffer | Uint8Array | string;
  /** File extension without the dot. Defaults to png. */
  extension?: string;
}

export interface SavedImage {
  /** Public URL the browser hits — served by /uploads/[...path]. */
  url: string;
  /** Path on disk relative to UPLOADS_DIR. */
  relativePath: string;
}

export async function saveImage(input: SaveImageInput): Promise<SavedImage> {
  const ext = input.extension ?? "png";
  const id = crypto.randomBytes(12).toString("hex");
  const relativePath = path.posix.join(
    "creatives",
    input.ownerId,
    input.projectId,
    `${id}.${ext}`
  );
  const fullPath = path.join(UPLOADS_DIR, relativePath);

  await fs.mkdir(path.dirname(fullPath), { recursive: true });

  const buf =
    typeof input.data === "string"
      ? Buffer.from(input.data, "base64")
      : Buffer.from(input.data);
  await fs.writeFile(fullPath, buf);

  return {
    url: `/uploads/${relativePath}`,
    relativePath,
  };
}

/**
 * Resolve the on-disk path for a stored upload, with a guard against
 * path-traversal so users can't read arbitrary files via the public route.
 */
export function resolveUploadPath(relative: string): string | null {
  const normalized = path.posix.normalize(relative).replace(/^(\.\.(\/|\\|$))+/, "");
  const full = path.join(UPLOADS_DIR, normalized);
  if (!full.startsWith(UPLOADS_DIR + path.sep)) return null;
  return full;
}
