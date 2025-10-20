import { useState, useCallback } from "react";
import { useAuth } from "../components/Auth/AuthProvider";
import {
  collection,
  addDoc,
  updateDoc,
  setDoc,
  doc,
  getDoc,
  query,
  where,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import { firestore as db } from "../services/firebase";
import { Project, CreateProjectData } from "../types/project";
import {
  canAutoWriteToFirestore,
  canManualSaveToFirestore,
} from "../config/firebaseConfig";
import { memorySync } from "../services/memorySync";
import { generateUniqueSlug } from "../services/slugs";

/**
 * Hook for managing project creation, saving, and dashboard integration
 */
export const useProjectManagement = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createProject = useCallback(
    async (projectData: CreateProjectData): Promise<Project | null> => {
      if (!user) {
        setError("User not authenticated");
        return null;
      }

      // Check if auto-writes are enabled
      if (!canAutoWriteToFirestore()) {
        // Auto-writes disabled - return mock project
        const now = Timestamp.now();
        const slug = projectData.name
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/[^a-z0-9-]/g, "");

        return {
          id: crypto.randomUUID(),
          name: projectData.name,
          slug: slug,
          slugHistory: [],
          ownerId: user.id,
          collaborators: [],
          createdAt: now,
          updatedAt: now,
          deletedAt: null,
          description: projectData.description || "",
          isPublic: projectData.isPublic || false,
          lastAccessedAt: now,
        };
      }

      setIsLoading(true);
      setError(null);

      try {
        const now = Timestamp.now();
        // Generate unique slug to avoid collisions
        const slug = await generateUniqueSlug(projectData.name);

        const newProjectData = {
          name: projectData.name,
          slug: slug,
          slugHistory: [],
          ownerId: user.id,
          collaborators: [],
          createdAt: now,
          updatedAt: now,
          deletedAt: null,
          description: projectData.description || "",
          isPublic: projectData.isPublic || false,
          lastAccessedAt: now,
        };

        // Create project in Firestore
        const projectsRef = collection(db, "projects");
        const docRef = await addDoc(projectsRef, newProjectData);

        const newProject: Project = {
          id: docRef.id,
          ...newProjectData,
        };

        return newProject;
      } catch (err: any) {
        console.error("Error creating project:", err);
        setError(err.message || "Failed to create project");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [user]
  );

  // Helper function to recursively remove undefined values from objects and arrays
  const removeUndefined = (obj: any): any => {
    if (obj === null || obj === undefined) {
      return null; // Convert undefined to null for Firestore
    }

    if (Array.isArray(obj)) {
      return obj
        .map((item) => removeUndefined(item))
        .filter((item) => item !== null);
    }

    if (typeof obj === "object") {
      const cleaned: any = {};
      Object.keys(obj).forEach((key) => {
        const value = obj[key];
        if (value !== undefined) {
          cleaned[key] = removeUndefined(value);
        }
      });
      return cleaned;
    }

    return obj;
  };

  const saveProject = useCallback(
    async (
      projectId: string,
      projectData: {
        name?: string;
        shapes?: any[];
        canvasBackground?: string;
        thumbnailUrl?: string;
        pages?: Record<string, { shapes: any[]; canvasBackground: string }>;
        currentPageId?: string;
        objectNames?: Record<string, string>;
        pageMetadata?: { id: string; name: string }[];
      }
    ): Promise<boolean> => {
      if (!user) {
        setError("User not authenticated");
        return false;
      }

      // Manual saves are ALWAYS allowed - check permission
      if (!canManualSaveToFirestore()) {
        console.error("Manual saves are disabled");
        return false;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Check if project exists
        const projectRef = doc(db, "projects", projectId);
        let projectDoc;
        let projectExists = false;

        try {
          projectDoc = await getDoc(projectRef);
          projectExists = projectDoc.exists();
        } catch (getError: any) {
          // If getDoc fails (e.g., permissions), treat as non-existent
          projectExists = false;
        }

        if (!projectExists) {
          // Create new project document with specific ID
          const now = Timestamp.now();
          const newProjectData = {
            name: projectData.name || "Untitled Project",
            slug: projectId, // Use the projectId as the slug for new projects
            slugHistory: [],
            ownerId: user.id,
            collaborators: [],
            createdAt: now,
            updatedAt: now,
            deletedAt: null,
            canvasBackground: projectData.canvasBackground || "#ffffff",
            pages: projectData.pages || {
              page1: { shapes: [], canvasBackground: "#ffffff" },
            },
            currentPageId: projectData.currentPageId || "page1",
            objectNames: projectData.objectNames || {},
            pageMetadata: projectData.pageMetadata || [
              { id: "page1", name: "Page 1" },
            ],
          };

          // Clean undefined values from new project data
          const cleanedNewProjectData = removeUndefined(newProjectData);

          await setDoc(projectRef, cleanedNewProjectData);
          return true;
        } else {
          // Update existing project
          const updateData: any = {
            updatedAt: Timestamp.now(),
          };

          if (projectData.name !== undefined)
            updateData.name = projectData.name;
          if (projectData.shapes !== undefined)
            updateData.shapes = removeUndefined(projectData.shapes);
          if (projectData.canvasBackground !== undefined)
            updateData.canvasBackground = projectData.canvasBackground;
          if (projectData.pages !== undefined)
            updateData.pages = removeUndefined(projectData.pages);
          if (projectData.currentPageId !== undefined)
            updateData.currentPageId = projectData.currentPageId;
          if (projectData.thumbnailUrl !== undefined)
            updateData.thumbnailUrl = projectData.thumbnailUrl;
          if (projectData.objectNames !== undefined)
            updateData.objectNames = removeUndefined(projectData.objectNames);
          if (projectData.pageMetadata !== undefined)
            updateData.pageMetadata = removeUndefined(projectData.pageMetadata);

          // Deep clean the entire updateData object to remove any nested undefined values
          const cleanedUpdateData = removeUndefined(updateData);

          try {
            await updateDoc(projectRef, cleanedUpdateData);
            try {
              memorySync.recordEvent({
                type: "SAVE",
                summary: `Saved project ${projectId}`,
                details: { keys: Object.keys(cleanedUpdateData) },
              });
            } catch {}
          } catch (updateError: any) {
            // If update fails (project doesn't exist), try creating it instead
            if (
              updateError.code === "not-found" ||
              updateError.message?.includes("No document to update")
            ) {
              const now = Timestamp.now();
              const newProjectData = {
                name: projectData.name || "Untitled Project",
                slug: projectId,
                slugHistory: [],
                ownerId: user.id,
                collaborators: [],
                createdAt: now,
                updatedAt: now,
                deletedAt: null,
                canvasBackground: projectData.canvasBackground || "#ffffff",
                pages: projectData.pages || {
                  page1: { shapes: [], canvasBackground: "#ffffff" },
                },
                currentPageId: projectData.currentPageId || "page1",
                objectNames: projectData.objectNames || {},
                pageMetadata: projectData.pageMetadata || [
                  { id: "page1", name: "Page 1" },
                ],
              };
              const cleanedNewProjectData = removeUndefined(newProjectData);
              await setDoc(projectRef, cleanedNewProjectData);
            } else {
              throw updateError;
            }
          }
          return true;
        }
      } catch (err: any) {
        console.error("Error saving project:", err);
        setError(err.message || "Failed to save project");
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [user, createProject]
  );

  const loadProject = useCallback(
    async (slugOrId: string) => {
      if (!user) {
        setError("User not authenticated");
        return null;
      }

      try {
        let projectDoc;
        let projectId = slugOrId;

        // First, try to get project by slug (for URL-based access)
        try {
          const projectsRef = collection(db, "projects");
          const slugQuery = query(projectsRef, where("slug", "==", slugOrId));
          const slugSnapshot = await getDocs(slugQuery);

          if (!slugSnapshot.empty) {
            projectDoc = slugSnapshot.docs[0];
            projectId = projectDoc.id;
          }
        } catch (slugError) {
          // If slug query fails, continue to try direct ID lookup
        }

        // If not found by slug, try direct document ID lookup
        if (!projectDoc) {
          const projectRef = doc(db, "projects", slugOrId);
          projectDoc = await getDoc(projectRef);
          if (projectDoc.exists()) {
            projectId = slugOrId; // Use the provided ID
          }
        }

        if (!projectDoc.exists()) {
          // Project doesn't exist - this is normal for new projects
          return null;
        }

        const projectData = projectDoc.data();

        // Verify user has access to this project
        const isOwner = projectData.ownerId === user.id;
        const isCollaborator = projectData.collaborators?.includes(user.id);

        if (!isOwner && !isCollaborator) {
          const accessError = new Error(
            "You don't have permission to access this project"
          );
          accessError.name = "AccessDeniedError";
          setError(accessError.message);
          throw accessError;
        }

        // Migration: Add slug to projects that don't have one
        if (!projectData.slug) {
          try {
            const projectRef = doc(db, "projects", projectId);
            await updateDoc(projectRef, {
              slug: projectId, // Use project ID as slug for existing projects
              slugHistory: [],
            });
            // Update the local data
            projectData.slug = projectId;
            projectData.slugHistory = [];
          } catch (migrationError) {
            console.error("Failed to migrate project slug:", migrationError);
            // Continue without slug - the fallback logic will handle it
          }
        }

        // Helper to safely convert Timestamp to millis
        const getTimestampMillis = (timestamp: any): number => {
          if (!timestamp) return 0;
          if (typeof timestamp.toMillis === "function") {
            return timestamp.toMillis();
          }
          if (typeof timestamp === "number") {
            return timestamp;
          }
          if (timestamp.seconds) {
            return timestamp.seconds * 1000;
          }
          return 0;
        };

        return {
          project: {
            id: projectId,
            name: projectData.name || "Untitled Project",
            slug: projectData.slug || projectId, // Ensure slug is always present
            ownerId: projectData.ownerId,
            collaborators: projectData.collaborators || [],
            createdAt: projectData.createdAt,
            updatedAt: projectData.updatedAt,
            deletedAt: projectData.deletedAt,
          },
          canvasData: {
            pages: projectData.pages || {
              page1: { shapes: [], canvasBackground: "#ffffff" },
            },
            currentPageId: projectData.currentPageId || "page1",
            canvasBackground: projectData.canvasBackground || "#ffffff",
            objectNames: projectData.objectNames || {},
            pageMetadata: projectData.pageMetadata || [
              { id: "page1", name: "Page 1" },
            ],
            lastSaved: getTimestampMillis(projectData.updatedAt),
          },
        };
      } catch (err: any) {
        console.error("Error loading project:", err);
        setError(err.message || "Failed to load project");
        return null;
      }
    },
    [user]
  );

  const deleteProject = useCallback(
    async (projectId: string): Promise<boolean> => {
      if (!user) {
        setError("User not authenticated");
        return false;
      }

      // Check if auto-writes are enabled
      if (!canAutoWriteToFirestore()) {
        // Auto-writes disabled - return success without deleting
        return true;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Soft delete project in Firestore
        const projectRef = doc(db, "projects", projectId);
        await updateDoc(projectRef, {
          deletedAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });

        return true;
      } catch (err: any) {
        console.error("Error deleting project:", err);
        setError(err.message || "Failed to delete project");
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [user]
  );

  const generateUniqueProjectName = useCallback(async (): Promise<string> => {
    if (!user) return "Untitled Project";

    try {
      // Query existing projects for current user
      const projectsRef = collection(db, "projects");
      const projectsQuery = query(
        projectsRef,
        where("ownerId", "==", user.id),
        where("deletedAt", "==", null)
      );

      const projectsSnapshot = await getDocs(projectsQuery);
      const untitledProjects = projectsSnapshot.docs
        .map((doc) => doc.data() as Project)
        .filter((p) => p.name.startsWith("Untitled Project"));

      if (untitledProjects.length === 0) {
        return "Untitled Project";
      }

      // Find the highest number
      let maxNumber = 0;
      untitledProjects.forEach((p: Project) => {
        const match = p.name.match(/Untitled Project (\d+)/);
        if (match) {
          maxNumber = Math.max(maxNumber, parseInt(match[1]));
        } else if (p.name === "Untitled Project") {
          maxNumber = Math.max(maxNumber, 1);
        }
      });

      return `Untitled Project ${maxNumber + 1}`;
    } catch (err) {
      console.error("Error generating unique project name:", err);
      return "Untitled Project";
    }
  }, [user]);

  return {
    createProject,
    saveProject,
    loadProject,
    deleteProject,
    generateUniqueProjectName,
    isLoading,
    error,
  };
};
