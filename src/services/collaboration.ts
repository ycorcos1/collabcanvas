import {
  collection,
  addDoc,
  doc,
  query,
  where,
  getDocs,
  getDoc,
  Timestamp,
} from "firebase/firestore";
import { firestore as db } from "./firebase";

/**
 * Send a collaboration access invitation
 */
export async function sendCollaborationInvitation(
  projectId: string,
  projectName: string,
  senderUserId: string,
  senderName: string,
  recipientEmail: string,
  message?: string
): Promise<void> {
  // Validate email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(recipientEmail)) {
    throw new Error("Invalid email format");
  }

  // Check if recipient exists
  const usersRef = collection(db, "users");
  const userQuery = query(usersRef, where("email", "==", recipientEmail));
  const userSnapshot = await getDocs(userQuery);

  let recipientUserId: string | null = null;
  if (!userSnapshot.empty) {
    recipientUserId = userSnapshot.docs[0].id;
  }

  // Check if already a collaborator
  if (recipientUserId) {
    const projectRef = doc(db, "projects", projectId);
    const projectSnap = await getDoc(projectRef);

    if (projectSnap.exists()) {
      const projectData = projectSnap.data();
      const collaborators = projectData.collaborators || [];

      if (collaborators.includes(recipientUserId)) {
        throw new Error("already_collaborator");
      }
    }
  }

  // Check for existing pending request
  const requestsRef = collection(db, "collaborationRequests");
  const existingRequestQuery = query(
    requestsRef,
    where("projectId", "==", projectId),
    where("recipientEmail", "==", recipientEmail),
    where("status", "==", "pending")
  );
  const existingRequests = await getDocs(existingRequestQuery);

  if (!existingRequests.empty) {
    throw new Error("already_pending");
  }

  // Create the collaboration request
  await addDoc(requestsRef, {
    projectId,
    projectName,
    senderUserId,
    senderName,
    recipientEmail,
    recipientUserId,
    message:
      message || `${senderName} invited you to collaborate on "${projectName}"`,
    status: "pending",
    sentAt: Timestamp.now(),
  });
}


