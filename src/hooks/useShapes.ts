import { useState, useCallback, useEffect } from "react";
import { Shape, CreateShapeData } from "../types/shape";
import * as shapesService from "../services/shapes";
import { useAuth } from "../components/Auth/AuthProvider";

export const useShapes = () => {
  // Track the most recent shape creation for auto-selection
  const [pendingAutoSelect, setPendingAutoSelect] = useState<{
    tempId: string;
    createdAt: number;
    userId: string;
  } | null>(null);

  const { user } = useAuth();
  const [shapes, setShapes] = useState<Shape[]>([]);
  // Persist selected shape across page refreshes (using sessionStorage)
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(() => {
    const saved = sessionStorage.getItem('collabcanvas-selected-shape');
    return saved || null;
  });
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
        console.log("🔥 AUTO-SELECT - Firebase shapes received:", firebaseShapes.length);
        console.log("🔥 AUTO-SELECT - Current selectedShapeId:", selectedShapeId);
        console.log("🔥 AUTO-SELECT - Pending auto-select:", pendingAutoSelect);
        
        // If we have a pending auto-select, try to find the corresponding Firebase shape
        if (pendingAutoSelect && user && pendingAutoSelect.userId === user.id) {
          console.log("🔥 AUTO-SELECT - Looking for Firebase shape to replace temp ID:", pendingAutoSelect.tempId);
          
          // Find the most recently created shape by this user
          const userShapes = firebaseShapes.filter(shape => shape.createdBy === user.id);
          const sortedUserShapes = userShapes.sort((a, b) => b.createdAt - a.createdAt);
          const newestUserShape = sortedUserShapes[0];
          
          // Check if this shape was created around the same time as our pending shape
          if (newestUserShape && Math.abs(newestUserShape.createdAt - pendingAutoSelect.createdAt) < 3000) {
            console.log("🔥 AUTO-SELECT - Found matching shape, selecting it:", newestUserShape.id);
            setSelectedShapeId(newestUserShape.id);
            sessionStorage.setItem('collabcanvas-selected-shape', newestUserShape.id);
            setPendingAutoSelect(null); // Clear the pending auto-select
          }
        }
        
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

  // Validate persisted selected shape still exists after shapes load
  useEffect(() => {
    if (selectedShapeId && shapes.length > 0) {
      console.log("🔥 AUTO-SELECT - Validating selected shape:", selectedShapeId);
      console.log("🔥 AUTO-SELECT - Current shapes:", shapes.map(s => s.id));
      
      const shapeExists = shapes.some(shape => shape.id === selectedShapeId);
      if (!shapeExists) {
        // Selected shape no longer exists, clear the selection
        console.log("🔥 AUTO-SELECT - Selected shape no longer exists, clearing selection");
        setSelectedShapeId(null);
        sessionStorage.removeItem('collabcanvas-selected-shape');
      } else {
        console.log("🔥 AUTO-SELECT - Selected shape still exists, keeping selection");
      }
    }
  }, [shapes, selectedShapeId]);

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
        console.log("🔥 AUTO-SELECT - Shape added optimistically and selected:", tempId);
        console.log("🔥 AUTO-SELECT - Selected shape ID set to:", tempId);

        // Persist the selection to sessionStorage
        sessionStorage.setItem('collabcanvas-selected-shape', tempId);

        // Set up pending auto-select for when Firebase returns the real shape
        setPendingAutoSelect({
          tempId: tempId,
          createdAt: Date.now(),
          userId: user.id
        });
        console.log("🔥 AUTO-SELECT - Pending auto-select set for:", tempId);

        // Save to Firebase (the subscription will update with the real ID)
        await shapesService.createShape(shapeData);
        console.log("Shape saved to Firebase successfully");

        return newShape;
      } catch (err: any) {
        console.error("Failed to create shape:", err);
        setError(err.message || "Failed to create shape");
        // Remove the optimistic shape on error
        setShapes((prev) => prev.filter((shape) => shape.id !== tempId));
        // Clear pending auto-select on error
        setPendingAutoSelect(null);
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
          sessionStorage.removeItem('collabcanvas-selected-shape');
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

        // Update local state and persist to sessionStorage
        setSelectedShapeId(id);
        if (id) {
          sessionStorage.setItem('collabcanvas-selected-shape', id);
        } else {
          sessionStorage.removeItem('collabcanvas-selected-shape');
        }
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

  // Get the user who has selected a shape (excluding current user)
  const getShapeSelector = useCallback(
    (shapeId: string): { name: string; color: string } | null => {
      if (!user) return null;
      
      const shape = shapes.find((s) => s.id === shapeId);
      if (shape?.selectedBy && shape.selectedByName && shape.selectedByColor) {
        // Only return selector info if it's NOT the current user
        if (shape.selectedBy !== user.id) {
          return {
            name: shape.selectedByName,
            color: shape.selectedByColor,
          };
        }
      }
      return null;
    },
    [shapes, user]
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
