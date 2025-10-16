import { useState, useEffect } from 'react';
import { useAuth } from '../components/Auth/AuthProvider';
import { Project } from '../types/project';
import { Timestamp } from 'firebase/firestore';

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

      // TODO: Replace with actual Firestore queries
      // For now, using mock data
      const mockSharedProjects: SharedProject[] = [
        {
          id: 'shared-1',
          name: 'Design System Components',
          slug: 'design-system-components',
          slugHistory: [],
          ownerId: 'user-123',
          collaborators: [user!.id, 'user-456'],
          createdAt: Timestamp.fromMillis(Date.now() - 604800000), // 1 week ago
          updatedAt: Timestamp.fromMillis(Date.now() - 86400000), // 1 day ago
          deletedAt: null,
          thumbnailUrl: '',
          hostUserId: 'user-123',
          hostUserName: 'John Doe',
          collaboratorDetails: [
            {
              userId: user!.id,
              userName: user!.displayName,
              userEmail: user!.email,
              joinedAt: Date.now() - 86400000,
            },
            {
              userId: 'user-456',
              userName: 'Jane Smith',
              userEmail: 'jane@example.com',
              joinedAt: Date.now() - 172800000,
            }
          ],
          isHost: false,
        },
        {
          id: 'shared-2',
          name: 'Marketing Campaign Mockups',
          slug: 'marketing-campaign-mockups',
          slugHistory: [],
          ownerId: user!.id,
          collaborators: ['user-789'],
          createdAt: Timestamp.fromMillis(Date.now() - 259200000), // 3 days ago
          updatedAt: Timestamp.fromMillis(Date.now() - 3600000), // 1 hour ago
          deletedAt: null,
          thumbnailUrl: '',
          hostUserId: user!.id,
          hostUserName: user!.displayName,
          collaboratorDetails: [
            {
              userId: 'user-789',
              userName: 'Mike Johnson',
              userEmail: 'mike@example.com',
              joinedAt: Date.now() - 172800000,
            }
          ],
          isHost: true,
        }
      ];

      setSharedProjects(mockSharedProjects);
    } catch (err) {
      console.error('Error loading shared projects:', err);
      setError('Failed to load shared projects');
    } finally {
      setIsLoading(false);
    }
  };

  const loadCollaborationRequests = async () => {
    try {
      // TODO: Replace with actual Firestore queries
      // For now, using mock data
      const mockRequests: CollaborationRequest[] = [
        {
          id: 'req-1',
          projectId: 'project-123',
          projectName: 'Website Redesign',
          fromUserId: 'user-456',
          fromUserName: 'Sarah Wilson',
          fromUserEmail: 'sarah@example.com',
          toUserId: user!.id,
          message: 'Would love your input on the new homepage design!',
          createdAt: Date.now() - 7200000, // 2 hours ago
          status: 'pending',
        },
        {
          id: 'req-2',
          projectId: 'project-456',
          projectName: 'Mobile App Wireframes',
          fromUserId: 'user-789',
          fromUserName: 'Alex Chen',
          fromUserEmail: 'alex@example.com',
          toUserId: user!.id,
          createdAt: Date.now() - 14400000, // 4 hours ago
          status: 'pending',
        }
      ];

      setCollaborationRequests(mockRequests);
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
