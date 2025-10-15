import { useEffect } from 'react';
import { useTheme } from '../hooks/useTheme';

/**
 * Theme Initializer - Ensures theme is properly initialized when user logs in
 * 
 * This component:
 * - Initializes theme system for authenticated users
 * - Restores user's saved theme preference
 * - Sets default to 'auto' for new users
 * - Only runs once per login session
 */
export const ThemeInitializer: React.FC = () => {
  const { theme } = useTheme();

  useEffect(() => {
    // The useTheme hook automatically handles:
    // 1. Loading saved theme from localStorage
    // 2. Defaulting to 'auto' for new users
    // 3. Applying theme to document element
    // 4. Listening for system preference changes
    
    // This component just ensures the hook is active for authenticated users
  }, [theme]);

  // This component doesn't render anything
  return null;
};
