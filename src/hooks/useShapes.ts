import { useState, useCallback, useEffect } from "react";
import { Shape, CreateShapeData } from "../types/shape";
import * as shapesService from "../services/shapes";
import { useAuth } from "../components/Auth/AuthProvider";

export const useShapes = () => {
  const { user } = useAuth();
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Subscribe to shapes from Firebase
  useEffect(() => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    // Set a timeout to prevent infinite loading
    const loadingTimeout = setTimeout(() => {
      setIsLoading(false);
      setError(null); // Clear error - shapes will load from cache if available
      console.log(
        "Canvas loaded with timeout fallback - Firestore may not be accessible"
      );
    }, 5000); // 5 second timeout

    const unsubscribe = shapesService.subscribeToShapes(
      (firebaseShapes) => {
        clearTimeout(loadingTimeout);
        setShapes(firebaseShapes);
        setIsLoading(false);
        console.log("Firebase shapes loaded:", firebaseShapes.length);
      },
      (error) => {
        clearTimeout(loadingTimeout);
        setError(`Firebase connection failed: ${error.message}`);
        setIsLoading(false);
        console.error("Firebase shapes error:", error);
      }
    );

    return () => {
      clearTimeout(loadingTimeout);
      unsubscribe();
      setIsLoading(false);
    };
  }, [user]);

  const createShape = useCallback(
    async (shapeData: CreateShapeData) => {
      if (!user) {
        console.error("Cannot create shape: user not authenticated");
        return null;
      }

      // Generate temp ID at the beginning so it's accessible in catch block
      const tempId = crypto.randomUUID();

      try {
        setError(null);
        console.log("Creating shape:", shapeData);

        // Optimistically add the shape to local state
        const newShape: Shape = {
          id: tempId,
          ...shapeData,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        setShapes((prev) => [...prev, newShape]);
        setSelectedShapeId(tempId);
        console.log("Shape added optimistically:", tempId);

        // Save to Firebase (the subscription will update with the real ID)
        await shapesService.createShape(shapeData);
        console.log("Shape saved to Firebase successfully");

        return newShape;
      } catch (err: any) {
        console.error("Failed to create shape:", err);
        setError(err.message || "Failed to create shape");
        // Remove the optimistic shape on error
        setShapes((prev) => prev.filter((shape) => shape.id !== tempId));
        return null;
      }
    },
    [user]
  );

  const updateShape = useCallback(
    async (id: string, updates: Partial<Shape>) => {
      if (!user) return;

      try {
        setError(null);

        // Optimistically update local state
        setShapes((prev) =>
          prev.map((shape) =>
            shape.id === id
              ? { ...shape, ...updates, updatedAt: Date.now() }
              : shape
          )
        );

        // Update in Firebase
        await shapesService.updateShape(id, updates);
      } catch (err: any) {
        setError(err.message || "Failed to update shape");
        // The subscription will revert the optimistic update
      }
    },
    [user]
  );

  const deleteShape = useCallback(
    async (id: string) => {
      if (!user) return;

      try {
        setError(null);

        // Optimistically remove from local state
        setShapes((prev) => prev.filter((shape) => shape.id !== id));
        if (selectedShapeId === id) {
          setSelectedShapeId(null);
        }

        // Delete from Firebase
        await shapesService.deleteShape(id);
      } catch (err: any) {
        setError(err.message || "Failed to delete shape");
        // The subscription will restore the shape on error
      }
    },
    [user, selectedShapeId]
  );

  const selectShape = useCallback(
    async (id: string | null) => {
      if (!user) return;

      try {
        // If deselecting current shape, clear selection in Firebase
        if (selectedShapeId && !id) {
          await shapesService.deselectShape(selectedShapeId);
        }

        // If selecting a new shape, check if it's available
        if (id) {
          const shape = shapes.find((s) => s.id === id);
          if (shape?.selectedBy && shape.selectedBy !== user.id) {
            // Shape is selected by another user - cannot select
            console.log(
              `Shape ${id} is selected by ${shape.selectedByName}, cannot select`
            );
            return;
          }

          // Select the shape in Firebase
          await shapesService.selectShape(
            id,
            user.id,
            user.displayName,
            user.color
          );
        }

        // Update local state
        setSelectedShapeId(id);
      } catch (error) {
        console.error("Error selecting shape:", error);
      }
    },
    [user, selectedShapeId, shapes]
  );

  // Check if a shape is selected by another user
  const isShapeLockedByOther = useCallback(
    (shapeId: string): boolean => {
      if (!user) return false;
      const shape = shapes.find((s) => s.id === shapeId);
      return !!(shape?.selectedBy && shape.selectedBy !== user.id);
    },
    [user, shapes]
  );

  // Get the user who has selected a shape
  const getShapeSelector = useCallback(
    (shapeId: string): { name: string; color: string } | null => {
      const shape = shapes.find((s) => s.id === shapeId);
      if (shape?.selectedBy && shape.selectedByName && shape.selectedByColor) {
        return {
          name: shape.selectedByName,
          color: shape.selectedByColor,
        };
      }
      return null;
    },
    [shapes]
  );

  // Clear user's selections when they disconnect (cleanup)
  useEffect(() => {
    if (!user) return;

    // Clear selections when component unmounts
    return () => {
      shapesService.clearUserSelections(user.id).catch((error) => {
        console.error("Error clearing user selections:", error);
      });
    };
  }, [user]);

  const clearShapes = useCallback(() => {
    setShapes([]);
    setSelectedShapeId(null);
  }, []);

  const clearAllShapes = useCallback(async () => {
    if (!user) return;

    try {
      setError(null);

      // Optimistically clear all shapes
      setShapes([]);
      setSelectedShapeId(null);

      // Delete all shapes from Firebase
      await Promise.all(
        shapes.map((shape) => shapesService.deleteShape(shape.id))
      );
    } catch (err: any) {
      setError(err.message || "Failed to clear all shapes");
      // The subscription will restore the shapes on error
    }
  }, [user, shapes]);

  const getShapeById = useCallback(
    (id: string): Shape | undefined => {
      return shapes.find((shape) => shape.id === id);
    },
    [shapes]
  );

  return {
    shapes,
    selectedShapeId,
    isLoading,
    error,
    createShape,
    updateShape,
    deleteShape,
    selectShape,
    clearShapes,
    clearAllShapes,
    getShapeById,
    isShapeLockedByOther,
    getShapeSelector,
  };
};
