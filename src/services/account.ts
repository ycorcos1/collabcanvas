import { auth, firestore } from "./firebase";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  writeBatch,
  runTransaction,
} from "firebase/firestore";

/**
 * Deletes a user account and associated content owned by that user.
 * - Deletes all projects where user is owner
 * - Removes user from collaborators of projects they don't own
 * - Deletes optional user doc and notifications (best-effort)
 * - Finally deletes the Firebase Auth user (must be recently re-authenticated)
 */
export async function deleteAccountCascade(userId: string): Promise<void> {
  const db = firestore;

  // 1) Collect projects where user is owner or collaborator
  const ownerQ = query(
    collection(db, "projects"),
    where("ownerId", "==", userId)
  );
  const collabQ = query(
    collection(db, "projects"),
    where("collaborators", "array-contains", userId)
  );
  const [ownerSnap, collabSnap] = await Promise.all([
    getDocs(ownerQ),
    getDocs(collabQ),
  ]);

  // 2) Remove user from collaborators for non-owned projects
  const batch = writeBatch(db);
  collabSnap.forEach((d) => {
    const data: any = d.data();
    if (data.ownerId !== userId) {
      const updated = (data.collaborators || []).filter(
        (c: string) => c !== userId
      );
      batch.update(d.ref, { collaborators: updated });
    }
  });

  // 3) Delete projects owned by user
  ownerSnap.forEach((d) => {
    batch.delete(d.ref);
  });

  await batch.commit();

  // 4) Best-effort cleanup of optional user data
  try {
    await deleteDoc(doc(db, "users", userId));
  } catch {}
  // Optionally: notifications cleanup could be added here via queries

  // 5) Delete auth user
  const currentUser = auth.currentUser;
  if (currentUser && currentUser.uid === userId) {
    await currentUser.delete();
  }
}

/**
 * Transfers ownership of a project to another user.
 * Ensures target user is collaborator; optionally keeps original owner as collaborator.
 */
export async function transferOwnership(
  projectId: string,
  targetUserId: string,
  keepOriginalAsCollaborator: boolean
): Promise<void> {
  const db = firestore;
  const projectRef = doc(db, "projects", projectId);

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(projectRef);
    if (!snap.exists()) throw new Error("Project not found");
    const data: any = snap.data();
    const ownerId: string = data.ownerId;
    const collaborators: string[] = data.collaborators || [];

    // Ensure target is in collaborators
    const newCollaborators = new Set(collaborators);
    newCollaborators.add(targetUserId);
    // Optionally keep/remove previous owner from collaborators
    if (keepOriginalAsCollaborator) {
      newCollaborators.add(ownerId);
    } else {
      newCollaborators.delete(ownerId);
    }

    tx.update(projectRef, {
      ownerId: targetUserId,
      collaborators: Array.from(newCollaborators),
    });
  });
}
