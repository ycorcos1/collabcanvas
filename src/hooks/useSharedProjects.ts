import { useState, useEffect } from 'react';
import { useAuth } from '../components/Auth/AuthProvider';
import { Project } from '../types/project';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs
} from 'firebase/firestore';
import { firestore as db } from '../services/firebase';

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
  status: 'pending' | 'accepted' | 'denied';
}

/**
 * Hook for managing shared projects and collaboration requests
 */
export const useSharedProjects = () => {
  const { user } = useAuth();
  const [sharedProjects, setSharedProjects] = useState<SharedProject[]>([]);
  const [collaborationRequests, setCollaborationRequests] = useState<CollaborationRequest[]>([]);
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
    loadCollaborationRequests();
  }, [user]);

  const loadSharedProjects = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!user) {
        setSharedProjects([]);
        return;
      }

      // Query projects where user is owner or collaborator
      const projectsRef = collection(db, 'projects');
      
      // Get projects where user is owner
      const ownedProjectsQuery = query(
        projectsRef,
        where('ownerId', '==', user.id),
        where('collaborators', '!=', []), // Has collaborators
        where('deletedAt', '==', null),
        orderBy('updatedAt', 'desc')
      );

      // Get projects where user is collaborator
      const collaboratedProjectsQuery = query(
        projectsRef,
        where('collaborators', 'array-contains', user.id),
        where('deletedAt', '==', null),
        orderBy('updatedAt', 'desc')
      );

      const [ownedSnapshot, collaboratedSnapshot] = await Promise.all([
        getDocs(ownedProjectsQuery),
        getDocs(collaboratedProjectsQuery)
      ]);

      const sharedProjectsMap = new Map<string, SharedProject>();

      // Process owned projects with collaborators
      ownedSnapshot.forEach((doc) => {
        const project = { id: doc.id, ...doc.data() } as Project;
        if (project.collaborators.length > 0) {
          sharedProjectsMap.set(project.id, {
            ...project,
            hostUserId: project.ownerId,
            hostUserName: user.displayName || user.email || 'Unknown',
            collaboratorDetails: [], // Will be populated below
            isHost: true,
          });
        }
      });

      // Process collaborated projects
      collaboratedSnapshot.forEach((doc) => {
        const project = { id: doc.id, ...doc.data() } as Project;
        if (!sharedProjectsMap.has(project.id)) {
          sharedProjectsMap.set(project.id, {
            ...project,
            hostUserId: project.ownerId,
            hostUserName: 'Loading...', // Will be populated below
            collaboratorDetails: [], // Will be populated below
            isHost: false,
          });
        }
      });

      // Get user details for all collaborators and owners
      const allUserIds = new Set<string>();
      sharedProjectsMap.forEach((project) => {
        allUserIds.add(project.ownerId);
        project.collaborators.forEach(id => allUserIds.add(id));
      });

      // Fetch user details (in a real app, you might have a users collection)
      // For now, we'll use placeholder data
      const userDetailsMap = new Map<string, { name: string; email: string }>();
      userDetailsMap.set(user.id, { 
        name: user.displayName || 'You', 
        email: user.email || '' 
      });

      // Update projects with user details
      const finalSharedProjects = Array.from(sharedProjectsMap.values()).map(project => ({
        ...project,
        hostUserName: userDetailsMap.get(project.hostUserId)?.name || 'Unknown User',
        collaboratorDetails: project.collaborators.map(userId => ({
          userId,
          userName: userDetailsMap.get(userId)?.name || 'Unknown User',
          userEmail: userDetailsMap.get(userId)?.email || '',
          joinedAt: Date.now(), // In real app, this would come from a collaborations subcollection
        }))
      }));

      setSharedProjects(finalSharedProjects);
    } catch (err) {
      console.error('Error loading shared projects:', err);
      setError('Failed to load shared projects');
    } finally {
      setIsLoading(false);
    }
  };

  const loadCollaborationRequests = async () => {
    try {
      if (!user) {
        setCollaborationRequests([]);
        return;
      }

      // Query collaboration requests for current user
      const requestsRef = collection(db, 'collaborationRequests');
      const requestsQuery = query(
        requestsRef,
        where('toUserId', '==', user.id),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc')
      );

      const requestsSnapshot = await getDocs(requestsQuery);
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

      setCollaborationRequests(requests);
    } catch (err) {
      console.error('Error loading collaboration requests:', err);
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
    }
  };
};
