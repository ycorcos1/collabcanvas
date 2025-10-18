import { useEffect, useState, useRef } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { firestore as db } from "../services/firebase";

/**
 * Real-time project synchronization hook
 *
 * Listens to project changes in real-time and notifies when the project data changes.
 * This allows multiple users to see changes made by others immediately.
 */

interface ProjectSyncData {
  name: string;
  pages: Record<string, any>;
  currentPageId: string;
  pageMetadata: { id: string; name: string }[];
  objectNames: Record<string, string>;
  canvasBackground?: string;
  updatedAt: any;
}

interface UseProjectSyncReturn {
  projectData: ProjectSyncData | null;
  isLoading: boolean;
  error: string | null;
}

export const useProjectSync = (
  projectId: string | null
): UseProjectSyncReturn => {
  const [projectData, setProjectData] = useState<ProjectSyncData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lastUpdateTime = useRef<number>(0);
  const isInitialLoad = useRef(true);

  useEffect(() => {
    if (!projectId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    // Subscribe to real-time project updates
    const projectRef = doc(db, "projects", projectId);

    const unsubscribe = onSnapshot(
      projectRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();

          // Extract relevant canvas data
          const syncData: ProjectSyncData = {
            name: data.name || "Untitled Project",
            pages: data.pages || {},
            currentPageId: data.currentPageId || "page1",
            pageMetadata: data.pageMetadata || [
              { id: "page1", name: "Page 1" },
            ],
            objectNames: data.objectNames || {},
            canvasBackground: data.canvasBackground,
            updatedAt: data.updatedAt,
          };

          // Prevent updating too frequently (debounce)
          const now = Date.now();
          if (isInitialLoad.current || now - lastUpdateTime.current > 500) {
            setProjectData(syncData);
            lastUpdateTime.current = now;
            isInitialLoad.current = false;
          }

          setIsLoading(false);
        } else {
          setError("Project not found");
          setIsLoading(false);
        }
      },
      (err) => {
        console.error("Error listening to project changes:", err);
        setError(err.message || "Failed to sync project");
        setIsLoading(false);
      }
    );

    // Cleanup subscription on unmount
    return () => {
      unsubscribe();
    };
  }, [projectId]);

  return { projectData, isLoading, error };
};
