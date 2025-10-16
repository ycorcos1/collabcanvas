import { useState, useCallback } from 'react';
import { useAuth } from '../components/Auth/AuthProvider';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  getDoc, 
  query, 
  where, 
  getDocs, 
  Timestamp 
} from 'firebase/firestore';
import { firestore as db } from '../services/firebase';
import { Project, CreateProjectData } from '../types/project';

/**
 * Hook for managing project creation, saving, and dashboard integration
 */
export const useProjectManagement = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createProject = useCallback(async (projectData: CreateProjectData): Promise<Project | null> => {
    if (!user) {
      setError('User not authenticated');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const now = Timestamp.now();
      const slug = projectData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      
      const newProjectData = {
        name: projectData.name,
        slug: slug,
        slugHistory: [],
        ownerId: user.id,
        collaborators: [],
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
        description: projectData.description || '',
        isPublic: projectData.isPublic || false,
        lastAccessedAt: now,
      };

      // Create project in Firestore
      const projectsRef = collection(db, 'projects');
      const docRef = await addDoc(projectsRef, newProjectData);

      const newProject: Project = {
        id: docRef.id,
        ...newProjectData,
      };

      return newProject;
    } catch (err: any) {
      console.error('Error creating project:', err);
      setError(err.message || 'Failed to create project');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const saveProject = useCallback(async (
    projectId: string,
    projectData: {
      name?: string;
      shapes?: any[];
      canvasBackground?: string;
      thumbnailUrl?: string;
    }
  ): Promise<boolean> => {
    if (!user) {
      setError('User not authenticated');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Check if project exists
      const projectRef = doc(db, 'projects', projectId);
      const projectDoc = await getDoc(projectRef);
      
      if (!projectDoc.exists()) {
        // Create new project if it doesn't exist
        const newProject = await createProject({
          name: projectData.name || 'Untitled Project',
          description: '',
          isPublic: false,
        });
        
        if (!newProject) return false;

        // Save canvas data to a separate collection
        const canvasRef = collection(db, 'canvasData');
        await addDoc(canvasRef, {
          projectId: newProject.id,
          shapes: projectData.shapes || [],
          canvasBackground: projectData.canvasBackground || '#ffffff',
          lastSaved: Timestamp.now(),
          ownerId: user.id,
        });
        
        return true;
      } else {
        // Update existing project
        await updateDoc(projectRef, {
          name: projectData.name,
          updatedAt: Timestamp.now(),
          lastAccessedAt: Timestamp.now(),
          thumbnailUrl: projectData.thumbnailUrl,
        });

        // Update canvas data
        const canvasQuery = query(
          collection(db, 'canvasData'),
          where('projectId', '==', projectId)
        );
        const canvasSnapshot = await getDocs(canvasQuery);
        
        if (!canvasSnapshot.empty) {
          const canvasDoc = canvasSnapshot.docs[0];
          await updateDoc(doc(db, 'canvasData', canvasDoc.id), {
            shapes: projectData.shapes || [],
            canvasBackground: projectData.canvasBackground || '#ffffff',
            lastSaved: Timestamp.now(),
          });
        } else {
          // Create new canvas data if it doesn't exist
          await addDoc(collection(db, 'canvasData'), {
            projectId: projectId,
            shapes: projectData.shapes || [],
            canvasBackground: projectData.canvasBackground || '#ffffff',
            lastSaved: Timestamp.now(),
            ownerId: user.id,
          });
        }
        
        return true;
      }
    } catch (err: any) {
      console.error('Error saving project:', err);
      setError(err.message || 'Failed to save project');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user, createProject]);

  const loadProject = useCallback(async (projectId: string) => {
    if (!user) {
      setError('User not authenticated');
      return null;
    }

    try {
      // Load project from Firestore
      const projectRef = doc(db, 'projects', projectId);
      const projectDoc = await getDoc(projectRef);
      
      if (!projectDoc.exists()) {
        setError('Project not found');
        return null;
      }

      const project = { id: projectDoc.id, ...projectDoc.data() } as Project;

      // Load canvas data
      const canvasQuery = query(
        collection(db, 'canvasData'),
        where('projectId', '==', projectId)
      );
      const canvasSnapshot = await getDocs(canvasQuery);
      
      let canvasData = {
        shapes: [],
        canvasBackground: '#ffffff',
        lastSaved: 0,
      };

      if (!canvasSnapshot.empty) {
        const canvasDoc = canvasSnapshot.docs[0].data();
        canvasData = {
          shapes: canvasDoc.shapes || [],
          canvasBackground: canvasDoc.canvasBackground || '#ffffff',
          lastSaved: canvasDoc.lastSaved?.toMillis() || 0,
        };
      }
      
      return {
        project,
        canvasData
      };
    } catch (err: any) {
      console.error('Error loading project:', err);
      setError(err.message || 'Failed to load project');
      return null;
    }
  }, [user]);

  const deleteProject = useCallback(async (projectId: string): Promise<boolean> => {
    if (!user) {
      setError('User not authenticated');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Soft delete project in Firestore
      const projectRef = doc(db, 'projects', projectId);
      await updateDoc(projectRef, {
        deletedAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      
      return true;
    } catch (err: any) {
      console.error('Error deleting project:', err);
      setError(err.message || 'Failed to delete project');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const generateUniqueProjectName = useCallback(async (): Promise<string> => {
    if (!user) return 'Untitled Project';

    try {
      // Query existing projects for current user
      const projectsRef = collection(db, 'projects');
      const projectsQuery = query(
        projectsRef,
        where('ownerId', '==', user.id),
        where('deletedAt', '==', null)
      );
      
      const projectsSnapshot = await getDocs(projectsQuery);
      const untitledProjects = projectsSnapshot.docs
        .map(doc => doc.data() as Project)
        .filter(p => p.name.startsWith('Untitled Project'));
      
      if (untitledProjects.length === 0) {
        return 'Untitled Project';
      }
      
      // Find the highest number
      let maxNumber = 0;
      untitledProjects.forEach((p: Project) => {
        const match = p.name.match(/Untitled Project (\d+)/);
        if (match) {
          maxNumber = Math.max(maxNumber, parseInt(match[1]));
        } else if (p.name === 'Untitled Project') {
          maxNumber = Math.max(maxNumber, 1);
        }
      });
      
      return `Untitled Project ${maxNumber + 1}`;
    } catch (err) {
      console.error('Error generating unique project name:', err);
      return 'Untitled Project';
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
