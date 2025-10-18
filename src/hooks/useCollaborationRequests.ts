import { useAuth } from "../components/Auth/AuthProvider";
import { useNavigate } from "react-router-dom";
import {
  collection,
  addDoc,
  updateDoc,
  setDoc,
  doc,
  query,
  where,
  getDocs,
  getDoc,
  Timestamp,
} from "firebase/firestore";
import { firestore as db } from "../services/firebase";

/**
 * Hook for managing collaboration request actions
 */
export const useCollaborationRequests = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const acceptRequest = async (requestId: string) => {
    if (!user) throw new Error("User not authenticated");

    try {
      console.log("Accepting request:", requestId);

      // Get the collaboration request directly
      const requestRef = doc(db, "collaborationRequests", requestId);
      const requestSnap = await getDoc(requestRef);

      if (!requestSnap.exists()) {
        throw new Error("Collaboration request not found");
      }

      const requestData = requestSnap.data();
      console.log("Request data:", requestData);

      // Verify the project exists
      const projectRef = doc(db, "projects", requestData.projectId);
      console.log("Checking project:", requestData.projectId);

      const projectSnap = await getDoc(projectRef);

      if (!projectSnap.exists()) {
        console.error("Project does not exist:", requestData.projectId);
        throw new Error(
          "This project no longer exists or was never saved. The sender needs to save the project first before you can accept this invitation."
        );
      }

      console.log("Project exists, adding collaborator");
      const projectData = projectSnap.data();
      console.log("Project data:", projectData);

      // Add user as collaborator to the project
      const currentCollaborators = projectData.collaborators || [];
      console.log("Current collaborators:", currentCollaborators);
      console.log("User ID:", user.id);

      // Only add if not already a collaborator
      if (!currentCollaborators.includes(user.id)) {
        console.log("Adding user as collaborator");
        console.log("Project owner:", projectData.ownerId);
        console.log("Auth user ID:", user.id);

        try {
          // Use setDoc with merge to add collaborator
          const updatedCollaborators = [...currentCollaborators, user.id];

          console.log("Attempting to write:", {
            collaborators: updatedCollaborators,
            updatedAt: "Timestamp.now()",
          });

          // Try using updateDoc first with just the collaborators array
          console.log("Attempting updateDoc...");
          await updateDoc(projectRef, {
            collaborators: updatedCollaborators,
            updatedAt: Timestamp.now(),
          });

          console.log("Successfully added collaborator");
        } catch (updateError: any) {
          console.error("updateDoc failed, trying setDoc with merge...");
          console.error("Error code:", updateError.code);
          console.error("Error message:", updateError.message);

          try {
            // Fallback to setDoc with merge
            const updatedCollaborators = [...currentCollaborators, user.id];
            await setDoc(
              projectRef,
              {
                collaborators: updatedCollaborators,
                updatedAt: Timestamp.now(),
              },
              { merge: true }
            );
            console.log("Successfully added collaborator with setDoc");
          } catch (setDocError: any) {
            console.error("setDoc also failed:", setDocError);
            console.error("SetDoc Error code:", setDocError.code);
            console.error("SetDoc Error message:", setDocError.message);

            // Check if rules are the issue - log the full error
            console.error(
              "Full error object:",
              JSON.stringify(setDocError, null, 2)
            );
            throw new Error(
              `Failed to add collaborator: ${setDocError.message}`
            );
          }
        }
      } else {
        console.log("User is already a collaborator");
      }

      // Update request status to 'accepted'
      console.log("Updating request status");
      await updateDoc(requestRef, {
        status: "accepted",
        acceptedAt: Timestamp.now(),
      });

      console.log("Request accepted successfully, navigating to project");
      // Navigate to the project canvas
      navigate(`/canvas/${requestData.projectSlug || requestData.projectId}`);
    } catch (error: any) {
      console.error("Error accepting collaboration request:", error);
      console.error("Error details:", {
        code: error.code,
        message: error.message,
        stack: error.stack,
      });
      throw error;
    }
  };

  const denyRequest = async (requestId: string) => {
    if (!user) throw new Error("User not authenticated");

    try {
      // Update request status to 'denied'
      await updateDoc(doc(db, "collaborationRequests", requestId), {
        status: "denied",
        deniedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error("Error denying collaboration request:", error);
      throw error;
    }
  };

  const sendCollaborationRequest = async (
    projectId: string,
    projectName: string,
    recipientEmail: string,
    message?: string
  ) => {
    if (!user) throw new Error("User not authenticated");

    try {
      // Check if recipient exists by looking up their email in users collection
      const usersRef = collection(db, "users");
      const userQuery = query(usersRef, where("email", "==", recipientEmail));
      const userSnapshot = await getDocs(userQuery);

      let recipientUserId: string | null = null;
      if (!userSnapshot.empty) {
        recipientUserId = userSnapshot.docs[0].id;
      }

      // Check if recipient is already a collaborator on the project
      if (recipientUserId) {
        try {
          const projectRef = doc(db, "projects", projectId);
          const projectSnap = await getDoc(projectRef);

          if (projectSnap.exists()) {
            const projectData = projectSnap.data();
            const collaborators = projectData.collaborators || [];

            if (collaborators.includes(recipientUserId)) {
              throw new Error(
                "This user is already a collaborator on this project"
              );
            }
          }
        } catch (error: any) {
          // If error is our custom message, rethrow it
          if (error.message?.includes("already a collaborator")) {
            throw error;
          }
          // Otherwise, continue (project might not exist yet, which is OK)
        }
      }

      // Check if request already exists (pending)
      const requestsRef = collection(db, "collaborationRequests");
      const existingRequestQuery = query(
        requestsRef,
        where("projectId", "==", projectId),
        where("fromUserId", "==", user.id),
        where("toUserEmail", "==", recipientEmail),
        where("status", "==", "pending")
      );

      const existingSnapshot = await getDocs(existingRequestQuery);
      if (!existingSnapshot.empty) {
        throw new Error(
          "A collaboration invitation has already been sent to this user"
        );
      }

      // Create new collaboration request
      const requestData = {
        projectId,
        projectName,
        fromUserId: user.id,
        fromUserName: user.displayName || user.email || "Unknown User",
        fromUserEmail: user.email,
        toUserEmail: recipientEmail,
        toUserId: recipientUserId || null,
        message: message || "",
        status: "pending",
        createdAt: Timestamp.now(),
      };

      const newRequestRef = await addDoc(requestsRef, requestData);

      // Verify the request was created
      if (!newRequestRef.id) {
        throw new Error("Failed to create collaboration request");
      }

      // Create a notification for the recipient if they have an account
      if (recipientUserId) {
        try {
          const notificationsRef = collection(db, "notifications");
          await addDoc(notificationsRef, {
            userId: recipientUserId,
            type: "collaboration_request",
            title: "New Collaboration Invitation",
            message: `${
              user.displayName || user.email
            } invited you to collaborate on "${projectName}"`,
            projectId,
            projectName,
            requestId: newRequestRef.id,
            fromUserId: user.id,
            fromUserName: user.displayName || user.email || "Unknown User",
            read: false,
            createdAt: Timestamp.now(),
          });
        } catch (notifError) {
          // Don't fail the whole operation if notification creation fails
          console.error(
            "Failed to create notification, but request was sent:",
            notifError
          );
        }
      }

      return { success: true, message: "Collaboration invitation sent!" };
    } catch (error) {
      console.error("Error sending collaboration request:", error);
      throw error;
    }
  };

  return {
    acceptRequest,
    denyRequest,
    sendCollaborationRequest,
  };
};
