import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc,
  updateDoc,
  arrayUnion,
  Timestamp 
} from 'firebase/firestore';
import { firestore } from './firebase';
import { Project } from '../types/project';
import { generateSlug, getUniqueSlug } from '../utils/slugify';

/**
 * Slug service for project URL management
 * 
 * Features:
 * - Get projects by current slug
 * - Get projects by historical slug (for redirects)
 * - Update project slugs with history tracking
 * - Check slug availability
 * - Generate unique slugs
 */

const PROJECTS_COLLECTION = 'projects';

/**
 * Get a project by its current slug
 * 
 * @param slug - The project slug to search for
 * @returns Project if found, null otherwise
 */
export async function getProjectBySlug(slug: string): Promise<Project | null> {
  try {
    const projectsRef = collection(firestore, PROJECTS_COLLECTION);
    const q = query(projectsRef, where('slug', '==', slug));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return null;
    }
    
    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data()
    } as Project;
  } catch (error) {
    console.error('Error getting project by slug:', error);
    return null;
  }
}

/**
 * Get a project by checking slug history (for redirects)
 * 
 * @param oldSlug - The historical slug to search for
 * @returns Project if found, null otherwise
 */
export async function getProjectByOldSlug(oldSlug: string): Promise<Project | null> {
  try {
    const projectsRef = collection(firestore, PROJECTS_COLLECTION);
    const q = query(projectsRef, where('slugHistory', 'array-contains', oldSlug));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return null;
    }
    
    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data()
    } as Project;
  } catch (error) {
    console.error('Error getting project by old slug:', error);
    return null;
  }
}

/**
 * Check if a slug is available (not used by any project)
 * 
 * @param slug - The slug to check
 * @param excludeProjectId - Optional project ID to exclude from check
 * @returns True if available, false if taken
 */
export async function slugExists(slug: string, excludeProjectId?: string): Promise<boolean> {
  try {
    const projectsRef = collection(firestore, PROJECTS_COLLECTION);
    const q = query(projectsRef, where('slug', '==', slug));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return false;
    }
    
    // If excluding a specific project, check if the found project is different
    if (excludeProjectId) {
      const foundProject = snapshot.docs[0];
      return foundProject.id !== excludeProjectId;
    }
    
    return true;
  } catch (error) {
    console.error('Error checking slug existence:', error);
    return true; // Assume taken on error for safety
  }
}

/**
 * Get all existing slugs for uniqueness checking
 * 
 * @returns Array of all current slugs
 */
export async function getAllSlugs(): Promise<string[]> {
  try {
    const projectsRef = collection(firestore, PROJECTS_COLLECTION);
    const snapshot = await getDocs(projectsRef);
    
    return snapshot.docs.map(doc => doc.data().slug).filter(Boolean);
  } catch (error) {
    console.error('Error getting all slugs:', error);
    return [];
  }
}

/**
 * Generate a unique slug for a project name
 * 
 * @param name - The project name
 * @param excludeProjectId - Optional project ID to exclude from conflict check
 * @returns Unique slug
 */
export async function generateUniqueSlug(
  name: string, 
  excludeProjectId?: string
): Promise<string> {
  const baseSlug = generateSlug(name);
  const existingSlugs = await getAllSlugs();
  
  // Filter out the excluded project's slug if provided
  const filteredSlugs = excludeProjectId 
    ? existingSlugs.filter(async (slug) => {
        const project = await getProjectBySlug(slug);
        return project?.id !== excludeProjectId;
      })
    : existingSlugs;
  
  return getUniqueSlug(baseSlug, await Promise.all(filteredSlugs));
}

/**
 * Update a project's slug and maintain slug history
 * 
 * @param projectId - The project ID to update
 * @param newName - The new project name (slug will be generated from this)
 * @returns The new slug that was set
 */
export async function updateProjectSlug(
  projectId: string, 
  newName: string
): Promise<string | null> {
  try {
    // Get current project to preserve old slug
    const projectRef = doc(firestore, PROJECTS_COLLECTION, projectId);
    const projectDoc = await getDoc(projectRef);
    
    if (!projectDoc.exists()) {
      throw new Error('Project not found');
    }
    
    const currentProject = projectDoc.data() as Project;
    const currentSlug = currentProject.slug;
    
    // Generate new unique slug
    const newSlug = await generateUniqueSlug(newName, projectId);
    
    // Only update if slug actually changed
    if (newSlug === currentSlug) {
      return currentSlug;
    }
    
    // Update project with new slug and add old slug to history
    await updateDoc(projectRef, {
      name: newName,
      slug: newSlug,
      slugHistory: arrayUnion(currentSlug),
      updatedAt: Timestamp.now()
    });
    
    return newSlug;
  } catch (error) {
    console.error('Error updating project slug:', error);
    return null;
  }
}

/**
 * Get project by either current slug or historical slug
 * Useful for handling redirects automatically
 * 
 * @param slug - The slug to search for
 * @returns Object with project and redirect info
 */
export async function getProjectBySlugWithRedirect(slug: string): Promise<{
  project: Project | null;
  shouldRedirect: boolean;
  currentSlug?: string;
}> {
  // First try current slug
  let project = await getProjectBySlug(slug);
  
  if (project) {
    return {
      project,
      shouldRedirect: false
    };
  }
  
  // Try historical slug
  project = await getProjectByOldSlug(slug);
  
  if (project) {
    return {
      project,
      shouldRedirect: true,
      currentSlug: project.slug
    };
  }
  
  return {
    project: null,
    shouldRedirect: false
  };
}
