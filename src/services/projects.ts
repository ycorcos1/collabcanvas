import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  Timestamp,
  writeBatch,
} from "firebase/firestore";
import { firestore } from "./firebase";
import {
  Project,
  CreateProjectData,
  UpdateProjectData,
  ProjectQueryOptions,
  ProjectListResponse,
} from "../types/project";
import { generateUniqueSlug } from "./slugs";

/**
 * Projects service for CRUD operations and project management
 *
 * Features:
 * - Create, read, update, delete projects
 * - Soft delete with trash system
 * - Pagination and filtering
 * - Slug management
 * - Thumbnail generation
 */

const PROJECTS_COLLECTION = "projects";

/**
 * Create a new project
 */
export async function createProject(
  data: CreateProjectData,
  ownerId: string
): Promise<Project> {
  try {
    // Generate unique slug
    const slug = await generateUniqueSlug(data.name);

    const now = Timestamp.now();
    const projectData = {
      name: data.name,
      slug,
      slugHistory: [],
      ownerId,
      collaborators: [],
      description: data.description || "",
      isPublic: data.isPublic || false,
      createdAt: now,
      updatedAt: now,
      lastAccessedAt: now,
      deletedAt: null,
    };

    const docRef = await addDoc(
      collection(firestore, PROJECTS_COLLECTION),
      projectData
    );

    return {
      id: docRef.id,
      ...projectData,
    };
  } catch (error) {
    console.error("Error creating project:", error);
    throw new Error("Failed to create project");
  }
}

/**
 * Get a project by ID
 */
export async function getProject(projectId: string): Promise<Project | null> {
  try {
    const docRef = doc(firestore, PROJECTS_COLLECTION, projectId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    return {
      id: docSnap.id,
      ...docSnap.data(),
    } as Project;
  } catch (error) {
    console.error("Error getting project:", error);
    return null;
  }
}

/**
 * Update a project
 */
export async function updateProject(
  projectId: string,
  data: UpdateProjectData
): Promise<void> {
  try {
    const docRef = doc(firestore, PROJECTS_COLLECTION, projectId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error("Error updating project:", error);
    throw new Error("Failed to update project");
  }
}

/**
 * Soft delete a project (move to trash)
 */
export async function moveProjectToTrash(projectId: string): Promise<void> {
  try {
    const docRef = doc(firestore, PROJECTS_COLLECTION, projectId);
    await updateDoc(docRef, {
      deletedAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error("Error moving project to trash:", error);
    throw new Error("Failed to move project to trash");
  }
}

/**
 * Recover a project from trash
 */
export async function recoverProject(projectId: string): Promise<void> {
  try {
    const docRef = doc(firestore, PROJECTS_COLLECTION, projectId);
    await updateDoc(docRef, {
      deletedAt: null,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error("Error recovering project:", error);
    throw new Error("Failed to recover project");
  }
}

/**
 * Permanently delete a project
 */
export async function deleteProjectPermanently(
  projectId: string
): Promise<void> {
  try {
    // TODO: Also delete shapes subcollection
    const docRef = doc(firestore, PROJECTS_COLLECTION, projectId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleting project permanently:", error);
    throw new Error("Failed to delete project permanently");
  }
}

/**
 * Get projects with filtering and pagination
 */
export async function getProjects(
  userId: string,
  options: ProjectQueryOptions = {}
): Promise<ProjectListResponse> {
  try {
    const {
      limit: queryLimit = 20,
      startAfter: cursor,
      orderBy: orderField = "updatedAt",
      orderDirection = "desc",
      includeDeleted = false,
      searchQuery,
    } = options;

    let q = query(
      collection(firestore, PROJECTS_COLLECTION),
      where("ownerId", "==", userId)
    );

    // Filter by deleted status
    if (!includeDeleted) {
      q = query(q, where("deletedAt", "==", null));
    } else {
      q = query(q, where("deletedAt", "!=", null));
    }

    // Add ordering
    q = query(q, orderBy(orderField, orderDirection));

    // Add pagination
    if (cursor) {
      q = query(q, startAfter(cursor));
    }

    // Add limit
    q = query(q, limit(queryLimit + 1)); // +1 to check if there are more

    const snapshot = await getDocs(q);
    const projects: Project[] = [];

    snapshot.docs.forEach((doc, index) => {
      if (index < queryLimit) {
        // Don't include the extra document
        projects.push({
          id: doc.id,
          ...doc.data(),
        } as Project);
      }
    });

    // Filter by search query (client-side for now)
    let filteredProjects = projects;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filteredProjects = projects.filter(
        (project) =>
          project.name.toLowerCase().includes(query) ||
          project.description?.toLowerCase().includes(query)
      );
    }

    return {
      projects: filteredProjects,
      hasMore: snapshot.docs.length > queryLimit,
      nextCursor:
        snapshot.docs.length > queryLimit
          ? snapshot.docs[queryLimit - 1]
          : undefined,
    };
  } catch (error) {
    console.error("Error getting projects:", error);
    throw new Error("Failed to get projects");
  }
}

/**
 * Get recent projects (last 5)
 */
export async function getRecentProjects(userId: string): Promise<Project[]> {
  try {
    const result = await getProjects(userId, {
      limit: 5,
      orderBy: "lastAccessedAt",
      orderDirection: "desc",
    });

    return result.projects;
  } catch (error) {
    console.error("Error getting recent projects:", error);
    // Return empty array for new users instead of throwing error
    return [];
  }
}

/**
 * Update project access time
 */
export async function updateProjectAccess(projectId: string): Promise<void> {
  try {
    const docRef = doc(firestore, PROJECTS_COLLECTION, projectId);
    await updateDoc(docRef, {
      lastAccessedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error("Error updating project access:", error);
    // Don't throw - this is not critical
  }
}

/**
 * Batch operations for trash management
 */
export async function batchRecoverProjects(
  projectIds: string[]
): Promise<void> {
  try {
    const batch = writeBatch(firestore);
    const now = Timestamp.now();

    projectIds.forEach((projectId) => {
      const docRef = doc(firestore, PROJECTS_COLLECTION, projectId);
      batch.update(docRef, {
        deletedAt: null,
        updatedAt: now,
      });
    });

    await batch.commit();
  } catch (error) {
    console.error("Error batch recovering projects:", error);
    throw new Error("Failed to recover projects");
  }
}

export async function batchDeleteProjects(projectIds: string[]): Promise<void> {
  try {
    const batch = writeBatch(firestore);

    projectIds.forEach((projectId) => {
      const docRef = doc(firestore, PROJECTS_COLLECTION, projectId);
      batch.delete(docRef);
    });

    await batch.commit();
  } catch (error) {
    console.error("Error batch deleting projects:", error);
    throw new Error("Failed to delete projects");
  }
}

/**
 * Generate project thumbnail from canvas
 * This will be implemented when we integrate with the canvas
 */
export async function generateProjectThumbnail(
  projectId: string,
  canvasDataUrl: string
): Promise<void> {
  try {
    // TODO: Upload to Firebase Storage and get URL
    // For now, just store the data URL directly (not recommended for production)
    await updateProject(projectId, {
      thumbnailUrl: canvasDataUrl,
    });
  } catch (error) {
    console.error("Error generating project thumbnail:", error);
    // Don't throw - thumbnails are not critical
  }
}
