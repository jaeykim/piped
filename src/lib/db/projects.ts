import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { getDb } from "@/lib/firebase/client";
import type { Project, PipelineStage, ProjectStatus } from "@/types/project";
import type { SiteAnalysis } from "@/types/analysis";

export async function createProject(
  ownerId: string,
  url: string,
  name: string
): Promise<string> {
  const docRef = await addDoc(collection(getDb(), "projects"), {
    ownerId,
    url,
    name,
    status: "crawling" as ProjectStatus,
    pipelineStage: "analysis" as PipelineStage,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function getProject(projectId: string): Promise<Project | null> {
  const snap = await getDoc(doc(getDb(), "projects", projectId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Project;
}

export async function getUserProjects(ownerId: string): Promise<Project[]> {
  const q = query(
    collection(getDb(), "projects"),
    where("ownerId", "==", ownerId),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Project);
}

export async function updateProjectStatus(
  projectId: string,
  status: ProjectStatus,
  pipelineStage?: PipelineStage
) {
  const updates: Record<string, unknown> = {
    status,
    updatedAt: serverTimestamp(),
  };
  if (pipelineStage) updates.pipelineStage = pipelineStage;
  await updateDoc(doc(getDb(), "projects", projectId), updates);
}

export async function saveAnalysis(
  projectId: string,
  analysis: SiteAnalysis
) {
  await setDoc(
    doc(getDb(), "projects", projectId, "analysis", "result"),
    {
      ...analysis,
      analyzedAt: serverTimestamp(),
    }
  );
}

export async function getAnalysis(
  projectId: string
): Promise<SiteAnalysis | null> {
  const snap = await getDoc(
    doc(getDb(), "projects", projectId, "analysis", "result")
  );
  if (!snap.exists()) return null;
  return snap.data() as SiteAnalysis;
}
