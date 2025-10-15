import { Timestamp } from 'firebase/firestore';

/**
 * Project data structure for CollabCanvas v1.0
 * 
 * Enhanced from MVP to support:
 * - URL slugs for human-readable URLs
 * - Soft deletion with trash system
 * - Collaboration features
 * - Project metadata and thumbnails
 */

export interface Project {
  /** Canonical project ID (Firebase document ID) */
  id: string;
  
  /** Display name of the project */
  name: string;
  
  /** URL-friendly slug for routing */
  slug: string;
  
  /** Previous slugs for redirect support */
  slugHistory: string[];
  
  /** Project owner user ID */
  ownerId: string;
  
  /** Array of collaborator user IDs */
  collaborators: string[];
  
  /** Project creation timestamp */
  createdAt: Timestamp;
  
  /** Last modification timestamp */
  updatedAt: Timestamp;
  
  /** Soft delete timestamp (null if not deleted) */
  deletedAt: Timestamp | null;
  
  /** Optional canvas preview thumbnail URL */
  thumbnailUrl?: string;
  
  /** Project description (optional) */
  description?: string;
  
  /** Project visibility settings */
  isPublic?: boolean;
  
  /** Last accessed timestamp for recent projects */
  lastAccessedAt?: Timestamp;
}

/**
 * Data required to create a new project
 */
export interface CreateProjectData {
  name: string;
  description?: string;
  isPublic?: boolean;
}

/**
 * Data for updating an existing project
 */
export interface UpdateProjectData {
  name?: string;
  description?: string;
  isPublic?: boolean;
  thumbnailUrl?: string;
  lastAccessedAt?: Timestamp;
}

/**
 * Project with additional computed fields for UI
 */
export interface ProjectWithMeta extends Project {
  /** Computed relative time string (e.g., "2 hours ago") */
  relativeTime: string;
  
  /** Whether current user is the owner */
  isOwner: boolean;
  
  /** Whether current user can edit */
  canEdit: boolean;
  
  /** Number of collaborators */
  collaboratorCount: number;
}

/**
 * Project list query options
 */
export interface ProjectQueryOptions {
  /** Maximum number of projects to return */
  limit?: number;
  
  /** Cursor for pagination */
  startAfter?: any;
  
  /** Sort field */
  orderBy?: 'updatedAt' | 'createdAt' | 'name' | 'lastAccessedAt';
  
  /** Sort direction */
  orderDirection?: 'asc' | 'desc';
  
  /** Filter by deleted status */
  includeDeleted?: boolean;
  
  /** Search query for project names */
  searchQuery?: string;
}

/**
 * Project list response with pagination
 */
export interface ProjectListResponse {
  /** Array of projects */
  projects: Project[];
  
  /** Whether there are more projects to load */
  hasMore: boolean;
  
  /** Cursor for next page */
  nextCursor?: any;
  
  /** Total count (if available) */
  totalCount?: number;
}
