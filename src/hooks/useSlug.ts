import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Project } from '../types/project';
import { getProjectBySlugWithRedirect } from '../services/slugs';

interface UseSlugReturn {
  /** The project data if found */
  project: Project | null;
  /** Loading state */
  isLoading: boolean;
  /** Error message if project not found or error occurred */
  error: string | null;
  /** Whether the project was found but needs redirect */
  shouldRedirect: boolean;
}

/**
 * Custom hook for fetching projects by slug with redirect handling
 * 
 * Features:
 * - Fetches project by current slug
 * - Handles historical slug redirects automatically
 * - Manages loading and error states
 * - Integrates with React Router for navigation
 * 
 * @param slug - The project slug from URL params
 * @returns Project data, loading state, and error handling
 */
export const useSlug = (slug: string | undefined): UseSlugReturn => {
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!slug) {
      setError('No project slug provided');
      setIsLoading(false);
      return;
    }

    const fetchProject = async () => {
      try {
        setIsLoading(true);
        setError(null);
        setShouldRedirect(false);

        const result = await getProjectBySlugWithRedirect(slug);

        if (result.project) {
          setProject(result.project);
          
          // Handle redirect for historical slugs
          if (result.shouldRedirect && result.currentSlug) {
            setShouldRedirect(true);
            // Redirect to current slug
            navigate(`/canvas/${result.currentSlug}`, { replace: true });
          }
        } else {
          setError('Project not found');
          setProject(null);
        }
      } catch (err) {
        console.error('Error fetching project by slug:', err);
        setError('Failed to load project');
        setProject(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProject();
  }, [slug, navigate]);

  return {
    project,
    isLoading,
    error,
    shouldRedirect
  };
};
