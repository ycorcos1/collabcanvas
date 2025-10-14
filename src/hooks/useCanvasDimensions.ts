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
    const unsubscribe = subscribeToCanvasDimensions((newDimensions) => {
      setDimensions(newDimensions);
      setIsLoading(false);
      setError(null);
    });

    return () => {
      if (unsubscribe) {
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
