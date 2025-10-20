import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../components/Auth/AuthProvider";
import { useNavigate } from "react-router-dom";
import {
  Project,
  ProjectQueryOptions,
  CreateProjectData,
} from "../types/project";
import {
  getAllProjects,
  getProjects,
  // getRecentProjects, // replaced by realtime subscription
  createProject,
  moveProjectToTrash,
  recoverProject,
  deleteProjectPermanently,
  updateProjectAccess,
  batchRecoverProjects,
  batchDeleteProjects,
} from "../services/projects";
import { updateProjectSlug } from "../services/slugs";
import {
  collection,
  onSnapshot,
  query,
  where,
  orderBy as qorderBy,
  limit as qlimit,
} from "firebase/firestore";
import { firestore } from "../services/firebase";

interface UseProjectsReturn {
  /** Array of projects */
  projects: Project[];
  /** Loading state */
  isLoading: boolean;
  /** Error message */
  error: string | null;
  /** Whether there are more projects to load */
  hasMore: boolean;
  /** Whether the initial load has completed */
  hasInitialized: boolean;
  /** Create a new project */
  createNewProject: (data: CreateProjectData) => Promise<Project | null>;
  /** Open a project (navigate to canvas) */
  openProject: (projectId: string) => void;
  /** Rename a project */
  renameProject: (projectId: string, newName: string) => Promise<void>;
  /** Move project to trash */
  deleteProject: (projectId: string) => Promise<void>;
  /** Recover project from trash */
  recoverProjectFromTrash: (projectId: string) => Promise<void>;
  /** Permanently delete project */
  permanentlyDeleteProject: (projectId: string) => Promise<void>;
  /** Load more projects (pagination) */
  loadMore: () => Promise<void>;
  /** Refresh projects list */
  refresh: () => Promise<void>;
  /** Batch operations */
  batchRecover: (projectIds: string[]) => Promise<void>;
  batchDelete: (projectIds: string[]) => Promise<void>;
}

/**
 * Custom hook for managing projects
 *
 * Features:
 * - CRUD operations for projects
 * - Real-time updates and caching
 * - Pagination support
 * - Error handling and loading states
 * - Integration with routing
 */
export const useProjects = (
  options: ProjectQueryOptions = {}
): UseProjectsReturn => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<any>(null);
  const [hasInitialized, setHasInitialized] = useState(false);

  // Load projects
  const loadProjects = useCallback(
    async (reset = false) => {
      if (!user) return;

      try {
        setIsLoading(true);
        setError(null);

        const queryOptions = {
          ...options,
          startAfter: reset ? undefined : nextCursor,
        };

        const result = options.includeDeleted
          ? await getProjects(user.id, queryOptions)
          : await getAllProjects(user.id, queryOptions as any);

        if (reset) {
          setProjects(result.projects);
        } else {
          setProjects((prev) => [...prev, ...result.projects]);
        }

        setHasMore(result.hasMore);
        setNextCursor(result.nextCursor);
      } catch (err) {
        // Silently handle errors
        setError("Failed to load projects");
      } finally {
        setIsLoading(false);
        setHasInitialized(true);
      }
    },
    [
      user,
      nextCursor,
      options.searchQuery,
      options.orderBy,
      options.orderDirection,
      options.limit,
      options.includeDeleted,
    ]
  );

  // Reset initialization when search/filter options change
  useEffect(() => {
    setHasInitialized(false);
    setProjects([]);
    setError(null);
    setHasMore(false);
    setNextCursor(null);
  }, [
    options.searchQuery,
    options.orderBy,
    options.orderDirection,
    options.includeDeleted,
  ]);

  // Load projects on mount and when user changes
  useEffect(() => {
    if (user) {
      loadProjects(true);
    }
  }, [user, loadProjects]);

  // Realtime subscription for projects (owned + shared)
  useEffect(() => {
    if (!user) return;

    try {
      const projectsRef = collection(firestore, "projects");

      // Owned projects query
      const ownedBase = [where("ownerId", "==", user.id)];
      const ownedActive = options.includeDeleted
        ? [where("deletedAt", "!=", null), qorderBy("deletedAt", "desc")]
        : [where("deletedAt", "==", null)];

      const ownedQuery = query(
        projectsRef,
        ...(ownedBase as any),
        ...(ownedActive as any),
        qlimit((options.limit || 20) + 1)
      );

      // Shared projects query (only active shown in dashboard views)
      const sharedQuery = options.includeDeleted
        ? null
        : query(
            projectsRef,
            where("collaborators", "array-contains", user.id),
            where("deletedAt", "==", null),
            qlimit((options.limit || 20) + 1)
          );

      let ownedUnsub: any = null;

      const applyState = (ownedDocs: any[], sharedDocs: any[]) => {
        // Merge and dedupe by id
        const map = new Map<string, Project>();
        [...ownedDocs, ...sharedDocs].forEach((d: any) => {
          const proj = { id: d.id, ...(d.data() as any) } as Project;
          map.set(proj.id, proj);
        });

        let combined = Array.from(map.values());

        // Client search
        const sq = options.searchQuery?.toLowerCase();
        if (sq) {
          combined = combined.filter(
            (p) =>
              p.name?.toLowerCase()?.includes(sq) ||
              p.description?.toLowerCase()?.includes(sq)
          );
        }

        // Client sort
        const toTs = (v: any) =>
          typeof v === "object" && v?.seconds
            ? v.seconds
            : typeof v === "number"
            ? v
            : 0;
        const orderField = (options.orderBy as any) || "updatedAt";
        const dir = options.orderDirection || "desc";
        combined.sort((a: any, b: any) => {
          const diff = toTs(b[orderField]) - toTs(a[orderField]);
          return dir === "desc" ? diff : -diff;
        });

        setProjects(combined.slice(0, options.limit || 20));
        setHasMore(combined.length > (options.limit || 20));
        setHasInitialized(true);
      };

      ownedUnsub = onSnapshot(ownedQuery, (snap) => {
        const ownedDocs = snap.docs;
        if (!sharedQuery) {
          applyState(ownedDocs, []);
        }
      });

      // We'll attach shared listener below with state tracking

      // Maintain latest snapshots
      let lastOwned: any[] = [];
      let lastShared: any[] = [];

      if (ownedUnsub) {
        ownedUnsub(); // reattach to capture and store lastOwned
      }

      // Re-attach with state tracking
      const ownedUnsub2 = onSnapshot(ownedQuery, (snap) => {
        lastOwned = snap.docs;
        applyState(lastOwned, lastShared);
      });

      let sharedUnsub2: any = null;
      if (sharedQuery) {
        sharedUnsub2 = onSnapshot(sharedQuery, (snap) => {
          lastShared = snap.docs;
          applyState(lastOwned, lastShared);
        });
      }

      return () => {
        ownedUnsub2 && ownedUnsub2();
        sharedUnsub2 && sharedUnsub2();
      };
    } catch (e) {
      // Fallback to non-realtime if snapshot fails
      // No-op; loadProjects already runs
      return;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    user?.id,
    options.searchQuery,
    options.orderBy,
    options.orderDirection,
    options.limit,
    options.includeDeleted,
  ]);

  // Create new project
  const createNewProject = useCallback(
    async (data: CreateProjectData): Promise<Project | null> => {
      if (!user) return null;

      try {
        const project = await createProject(data, user.id);

        // Add to local state
        setProjects((prev) => [project, ...prev]);

        return project;
      } catch (err) {
        // Silently handle error
        setError("Failed to create project");
        return null;
      }
    },
    [user]
  );

  // Open project
  const openProject = useCallback(
    (projectId: string) => {
      const project = projects.find((p) => p.id === projectId);
      if (project) {
        // Update access time
        updateProjectAccess(projectId);
        // Navigate to canvas - use slug if available, otherwise use project ID
        const routeParam = project.slug || project.id;
        navigate(`/canvas/${routeParam}`);
      }
    },
    [projects, navigate]
  );

  // Rename project
  const renameProject = useCallback(
    async (projectId: string, newName: string) => {
      try {
        // Update slug and name
        const newSlug = await updateProjectSlug(projectId, newName);

        if (newSlug) {
          // Update local state
          setProjects((prev) =>
            prev.map((project) =>
              project.id === projectId
                ? { ...project, name: newName, slug: newSlug }
                : project
            )
          );
        }
      } catch (err) {
        // Silently handle error
        setError("Failed to rename project");
      }
    },
    []
  );

  // Delete project (move to trash)
  const deleteProject = useCallback(async (projectId: string) => {
    try {
      await moveProjectToTrash(projectId);

      // Update local state
      setProjects((prev) => prev.filter((project) => project.id !== projectId));
    } catch (err: any) {
      console.error("Failed to delete project:", err);
      const errorMessage = err.message || "Failed to delete project";
      setError(errorMessage);
      throw err; // Re-throw so UI can show error
    }
  }, []);

  // Recover project from trash
  const recoverProjectFromTrash = useCallback(async (projectId: string) => {
    try {
      await recoverProject(projectId);

      // Remove from local state (assuming we're viewing trash)
      setProjects((prev) => prev.filter((project) => project.id !== projectId));
    } catch (err) {
      // Silently handle error
      setError("Failed to recover project");
    }
  }, []);

  // Permanently delete project
  const permanentlyDeleteProject = useCallback(async (projectId: string) => {
    try {
      await deleteProjectPermanently(projectId);

      // Remove from local state
      setProjects((prev) => prev.filter((project) => project.id !== projectId));
    } catch (err) {
      // Silently handle error
      setError("Failed to permanently delete project");
    }
  }, []);

  // Load more projects
  const loadMore = useCallback(async () => {
    if (!hasMore || isLoading) return;
    await loadProjects(false);
  }, [hasMore, isLoading, loadProjects]);

  // Refresh projects
  const refresh = useCallback(async () => {
    await loadProjects(true);
  }, [loadProjects]);

  // Batch recover projects
  const batchRecover = useCallback(async (projectIds: string[]) => {
    try {
      await batchRecoverProjects(projectIds);

      // Remove from local state
      setProjects((prev) =>
        prev.filter((project) => !projectIds.includes(project.id))
      );
    } catch (err) {
      // Silently handle error
      setError("Failed to recover projects");
    }
  }, []);

  // Batch delete projects
  const batchDelete = useCallback(async (projectIds: string[]) => {
    try {
      await batchDeleteProjects(projectIds);

      // Remove from local state
      setProjects((prev) =>
        prev.filter((project) => !projectIds.includes(project.id))
      );
    } catch (err) {
      // Silently handle error
      setError("Failed to delete projects");
    }
  }, []);

  return {
    projects,
    isLoading,
    error,
    hasMore,
    hasInitialized,
    createNewProject,
    openProject,
    renameProject,
    deleteProject,
    recoverProjectFromTrash,
    permanentlyDeleteProject,
    loadMore,
    refresh,
    batchRecover,
    batchDelete,
  };
};

/**
 * Hook for recent projects specifically
 */
export const useRecentProjects = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);

      const projectsRef = collection(firestore, "projects");
      const ownedQuery = query(
        projectsRef,
        where("ownerId", "==", user.id),
        where("deletedAt", "==", null),
        qlimit(25)
      );
      const sharedQuery = query(
        projectsRef,
        where("collaborators", "array-contains", user.id),
        where("deletedAt", "==", null),
        qlimit(25)
      );

      let lastOwned: any[] = [];
      let lastShared: any[] = [];

      const apply = () => {
        const map = new Map<string, Project>();
        [...lastOwned, ...lastShared].forEach((d: any) => {
          const data = d.data() as any;
          map.set(d.id, { id: d.id, ...data } as Project);
        });
        const all = Array.from(map.values());
        const toTs = (v: any) =>
          typeof v === "object" && v?.seconds
            ? v.seconds
            : typeof v === "number"
            ? v
            : 0;
        all.sort((a: any, b: any) => toTs(b.updatedAt) - toTs(a.updatedAt));
        setProjects(all.slice(0, 10));
        setIsLoading(false);
      };

      const unsubOwned = onSnapshot(ownedQuery, (snap) => {
        lastOwned = snap.docs;
        apply();
      });
      const unsubShared = onSnapshot(sharedQuery, (snap) => {
        lastShared = snap.docs;
        apply();
      });

      return () => {
        unsubOwned();
        unsubShared();
      };
    } catch {
      setIsLoading(false);
    }
  }, [user?.id]);

  return { projects, isLoading, error };
};
