import { useState, useEffect } from "react";
import { useAuth } from "../components/Auth/AuthProvider";
import { Project } from "../types/project";
import {
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
  QuerySnapshot,
  DocumentData,
} from "firebase/firestore";
import { firestore as db } from "../services/firebase";

interface SharedProject extends Project {
  hostUserId: string;
  hostUserName: string;
  collaboratorDetails: Array<{
    userId: string;
    userName: string;
    userEmail: string;
    joinedAt: number;
  }>;
  isHost: boolean;
}

interface CollaborationRequest {
  id: string;
  projectId: string;
  projectName: string;
  fromUserId: string;
  fromUserName: string;
  fromUserEmail: string;
  toUserId: string;
  message?: string;
  createdAt: number;
  status: "pending" | "accepted" | "denied";
}

/**
 * Hook for managing shared projects and collaboration requests
 */
export const useSharedProjects = () => {
  const { user } = useAuth();
  const [sharedProjects, setSharedProjects] = useState<SharedProject[]>([]);
  const [collaborationRequests, setCollaborationRequests] = useState<
    CollaborationRequest[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setSharedProjects([]);
      setCollaborationRequests([]);
      setIsLoading(false);
      return;
    }

    loadSharedProjects();
    const unsubscribe = loadCollaborationRequests();

    // Cleanup function to unsubscribe from real-time listener
    return () => {
      if (unsubscribe && typeof unsubscribe === "function") {
        unsubscribe();
      }
    };
  }, [user]);

  const loadSharedProjects = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!user) {
        setSharedProjects([]);
        setIsLoading(false);
        return;
      }

      // Initialize empty results
      let ownedSnapshot: QuerySnapshot<DocumentData> | { docs: any[] } = {
        docs: [],
      };
      let collaboratedSnapshot: QuerySnapshot<DocumentData> | { docs: any[] } =
        { docs: [] };

      try {
        // Query projects where user is owner or collaborator
        const projectsRef = collection(db, "projects");

        try {
          // Try to get projects where user is owner (we'll filter for collaborators client-side)
          const ownedProjectsQuery = query(
            projectsRef,
            where("ownerId", "==", user.id),
            where("deletedAt", "==", null)
          );
          ownedSnapshot = await getDocs(ownedProjectsQuery);
        } catch (ownedError: any) {
          // Silently handle errors - keep empty snapshot
        }

        try {
          // Try to get projects where user is collaborator
          const collaboratedProjectsQuery = query(
            projectsRef,
            where("collaborators", "array-contains", user.id),
            where("deletedAt", "==", null)
          );
          collaboratedSnapshot = await getDocs(collaboratedProjectsQuery);
        } catch (collaboratedError: any) {
          // Silently handle errors - keep empty snapshot
        }
      } catch (dbError: any) {
        // Silently handle database errors - continue with empty snapshots
      }

      const sharedProjectsMap = new Map<string, SharedProject>();

      // Process owned projects with collaborators (filter client-side)
      ownedSnapshot.docs.forEach((doc: any) => {
        const project = { id: doc.id, ...doc.data() } as Project;
        // Only include projects that have collaborators
        if (project.collaborators && project.collaborators.length > 0) {
          sharedProjectsMap.set(project.id, {
            ...project,
            hostUserId: project.ownerId,
            hostUserName: user.displayName || user.email || "Unknown",
            collaboratorDetails: [], // Will be populated below
            isHost: true,
          });
        }
      });

      // Process collaborated projects
      collaboratedSnapshot.docs.forEach((doc: any) => {
        const project = { id: doc.id, ...doc.data() } as Project;
        if (!sharedProjectsMap.has(project.id)) {
          sharedProjectsMap.set(project.id, {
            ...project,
            hostUserId: project.ownerId,
            hostUserName: "Loading...", // Will be populated below
            collaboratorDetails: [], // Will be populated below
            isHost: false,
          });
        }
      });

      // Get user details for all collaborators and owners
      const allUserIds = new Set<string>();
      sharedProjectsMap.forEach((project) => {
        allUserIds.add(project.ownerId);
        project.collaborators.forEach((id) => allUserIds.add(id));
      });

      // Fetch user details (in a real app, you might have a users collection)
      // For now, we'll use placeholder data
      const userDetailsMap = new Map<string, { name: string; email: string }>();
      userDetailsMap.set(user.id, {
        name: user.displayName || "You",
        email: user.email || "",
      });

      // Update projects with user details and sort by updatedAt
      const finalSharedProjects = Array.from(sharedProjectsMap.values())
        .map((project) => ({
          ...project,
          hostUserName:
            userDetailsMap.get(project.hostUserId)?.name || "Unknown User",
          collaboratorDetails: project.collaborators.map((userId) => ({
            userId,
            userName: userDetailsMap.get(userId)?.name || "Unknown User",
            userEmail: userDetailsMap.get(userId)?.email || "",
            joinedAt: Date.now(), // In real app, this would come from a collaborations subcollection
          })),
        }))
        .sort((a, b) => {
          // Sort by updatedAt descending (most recent first)
          const aTime = a.updatedAt?.toMillis() || 0;
          const bTime = b.updatedAt?.toMillis() || 0;
          return bTime - aTime;
        });

      setSharedProjects(finalSharedProjects);
    } catch (err: any) {
      // Silently handle all errors - show empty state
      setSharedProjects([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCollaborationRequests = () => {
    try {
      if (!user) {
        setCollaborationRequests([]);
        return;
      }

      // Query collaboration requests for current user with real-time listener
      const requestsRef = collection(db, "collaborationRequests");

      try {
        const requestsQuery = query(
          requestsRef,
          where("toUserEmail", "==", user.email),
          where("status", "==", "pending")
        );

        // Set up real-time listener
        const unsubscribe = onSnapshot(
          requestsQuery,
          (requestsSnapshot) => {
            const requests: CollaborationRequest[] = [];

            requestsSnapshot.forEach((doc) => {
              const data = doc.data();
              requests.push({
                id: doc.id,
                projectId: data.projectId,
                projectName: data.projectName,
                fromUserId: data.fromUserId,
                fromUserName: data.fromUserName,
                fromUserEmail: data.fromUserEmail,
                toUserId: data.toUserId,
                message: data.message,
                createdAt: data.createdAt?.toMillis() || Date.now(),
                status: data.status,
              });
            });

            // Sort requests by createdAt descending (most recent first)
            const sortedRequests = requests.sort(
              (a, b) => b.createdAt - a.createdAt
            );

            setCollaborationRequests(sortedRequests);
          },
          (_error) => {
            // Silently handle all errors for collaboration requests
            setCollaborationRequests([]);
          }
        );

        // Return unsubscribe function for cleanup
        return unsubscribe;
      } catch (requestsError: any) {
        // Silently handle all errors for collaboration requests
        setCollaborationRequests([]);
      }
    } catch (err) {
      // Silently handle all errors
      setCollaborationRequests([]);
    }
  };

  return {
    sharedProjects,
    collaborationRequests,
    isLoading,
    error,
    refetch: () => {
      loadSharedProjects();
      loadCollaborationRequests();
    },
  };
};
