import { useState, useEffect } from "react";
import {
  CanvasDimensions,
  DEFAULT_CANVAS_DIMENSIONS,
  subscribeToCanvasDimensions,
  updateCanvasDimensions,
  resetCanvasDimensions,
} from "../services/canvasDimensions";
import { useAuth } from "../components/Auth/AuthProvider";

export const useCanvasDimensions = () => {
  const { user } = useAuth();
  const [dimensions, setDimensions] = useState<CanvasDimensions>({
    ...DEFAULT_CANVAS_DIMENSIONS,
    updatedAt: Date.now(),
    updatedBy: "system",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 3;
    
    const setupSubscription = () => {
      try {
        const unsubscribe = subscribeToCanvasDimensions(
          (newDimensions) => {
            setDimensions(newDimensions);
            setIsLoading(false);
            setError(null);
            retryCount = 0; // Reset retry count on success
          },
          (error) => {
            console.error("Canvas dimensions subscription error:", error);
            
            // Handle different types of errors gracefully
            if (error?.code === 'unavailable' || error?.code === 'permission-denied') {
              // Network issues or auth token expired - keep existing dimensions
              setError(null);
              setIsLoading(false);
              console.log("Canvas dimensions temporarily unavailable, keeping existing");
            } else if (retryCount < maxRetries) {
              // Retry connection for other errors
              retryCount++;
              console.log(`Retrying canvas dimensions subscription (${retryCount}/${maxRetries})`);
              setTimeout(setupSubscription, 2000 * retryCount); // Exponential backoff
            } else {
              setError("Unable to sync canvas dimensions");
              setIsLoading(false);
            }
          }
        );
        
        return unsubscribe;
      } catch (error) {
        console.error("Failed to setup canvas dimensions subscription:", error);
        setError(null); // Don't show error for setup failures
        setIsLoading(false);
        return () => {}; // Return empty cleanup function
      }
    };

    const unsubscribe = setupSubscription();

    return () => {
      if (unsubscribe && typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  const updateDimensions = async (width: number, height: number) => {
    if (!user) {
      setError("User must be authenticated to update canvas dimensions");
      return;
    }

    try {
      setError(null);
      await updateCanvasDimensions(width, height, user.id);
    } catch (err) {
      console.error("Error updating canvas dimensions:", err);
      setError("Failed to update canvas dimensions");
    }
  };

  const resetToDefault = async () => {
    if (!user) {
      setError("User must be authenticated to reset canvas dimensions");
      return;
    }

    try {
      setError(null);
      await resetCanvasDimensions(user.id);
    } catch (err) {
      console.error("Error resetting canvas dimensions:", err);
      setError("Failed to reset canvas dimensions");
    }
  };

  return {
    dimensions,
    isLoading,
    error,
    updateDimensions,
    resetToDefault,
    defaultDimensions: DEFAULT_CANVAS_DIMENSIONS,
  };
};
