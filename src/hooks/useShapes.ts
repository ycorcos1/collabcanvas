import { useState, useCallback, useEffect } from "react";
import { Shape, CreateShapeData } from "../types/shape";
import * as shapesService from "../services/shapes";
import { useAuth } from "../components/Auth/AuthProvider";

/**
 * useShapes Hook - Central state management for collaborative shapes
 *
 * Handles:
 * - Real-time shape synchronization via Firebase Firestore
 * - Multi-select functionality with Shift-key support
 * - Shape creation, updates, and deletion
 * - Session persistence of selected shapes
 * - Optimistic UI updates with Firebase sync
 * - Error handling and connection resilience for idle users
 * - Shape validation and cleanup
 */

export const useShapes = () => {
  // Track the most recent shape creation for Firebase synchronization
  const [pendingAutoSelect, setPendingAutoSelect] = useState<{
    tempId: string;
    createdAt: number;
    userId: string;
  } | null>(null);

  const { user } = useAuth();
  const [shapes, setShapes] = useState<Shape[]>([]);

  // Multi-select state - persisted across page refreshes using sessionStorage
  const [selectedShapeIds, setSelectedShapeIds] = useState<string[]>(() => {
    const saved = sessionStorage.getItem("collabcanvas-selected-shapes");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Save selected shapes to sessionStorage when they change
  useEffect(() => {
    if (selectedShapeIds.length > 0) {
      sessionStorage.setItem(
        "collabcanvas-selected-shapes",
        JSON.stringify(selectedShapeIds)
      );
    } else {
      sessionStorage.removeItem("collabcanvas-selected-shapes");
    }
  }, [selectedShapeIds]);

  // Subscribe to shapes from Firebase with robust error handling
  useEffect(() => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    // Set a timeout to prevent infinite loading
    const loadingTimeout = setTimeout(() => {
      setIsLoading(false);
      setError(null); // Clear error - shapes will load from cache if available
    }, 5000); // 5 second timeout

    const unsubscribe = shapesService.subscribeToShapes(
      (firebaseShapes) => {
        clearTimeout(loadingTimeout);
        // Firebase shapes received

        // If we have a pending shape creation, find the corresponding Firebase shape
        if (pendingAutoSelect && user && pendingAutoSelect.userId === user.id) {
          // Find the most recently created shape by this user
          const userShapes = firebaseShapes.filter(
            (shape) => shape.createdBy === user.id
          );
          const sortedUserShapes = userShapes.sort(
            (a, b) => b.createdAt - a.createdAt
          );
          const newestUserShape = sortedUserShapes[0];

          // Check if this shape was created around the same time as our pending shape
          if (
            newestUserShape &&
            Math.abs(newestUserShape.createdAt - pendingAutoSelect.createdAt) <
              3000
          ) {
            // Don't auto-select - let user explicitly select if they want
            setPendingAutoSelect(null); // Clear the pending tracking
          }
        }

        setShapes(firebaseShapes);
        setIsLoading(false);
        setError(null); // Clear any previous errors on successful reconnection
      },
      (error) => {
        clearTimeout(loadingTimeout);
        console.error("Firebase shapes error:", error);

        // Handle different types of errors gracefully
        if (
          (error as any).code === "unavailable" ||
          (error as any).code === "permission-denied"
        ) {
          // Network issues or auth token expired - keep existing shapes and retry
          setError(null); // Don't show error to user for temporary network issues
          setIsLoading(false);
        } else {
          // Other errors - show error but don't crash
          setError(`Connection issue: ${error.message}`);
          setIsLoading(false);
        }
      }
    );

    return () => {
      clearTimeout(loadingTimeout);
      unsubscribe();
      setIsLoading(false);
    };
  }, [user]);

  // Validate persisted selected shape still exists after shapes load
  // Validate selected shapes still exist when shapes array changes
  useEffect(() => {
    if (selectedShapeIds.length > 0 && shapes.length > 0) {
      const validShapeIds = selectedShapeIds.filter((id) =>
        shapes.some((shape) => shape.id === id)
      );

      if (validShapeIds.length !== selectedShapeIds.length) {
        // Some selected shapes no longer exist, update the selection
        setSelectedShapeIds(validShapeIds);
      }
    }
  }, [shapes, selectedShapeIds]);

  /**
   * Creates a new shape with optimistic UI updates
   * Immediately adds a temporary shape to the UI, then syncs with Firebase
   */
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
        // Don't auto-select the shape during creation - let user explicitly select it
        console.log("🔥 Shape added optimistically:", tempId);

        // Set up pending tracking for when Firebase returns the real shape
        setPendingAutoSelect({
          tempId: tempId,
          createdAt: Date.now(),
          userId: user.id,
        });
        console.log("🔥 Pending shape tracking set for:", tempId);

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

        // Remove from selection if it was selected
        if (selectedShapeIds.includes(id)) {
          setSelectedShapeIds((prev) =>
            prev.filter((shapeId) => shapeId !== id)
          );
        }

        // Delete from Firebase
        await shapesService.deleteShape(id);
      } catch (err: any) {
        setError(err.message || "Failed to delete shape");
        // The subscription will restore the shape on error
      }
    },
    [user, selectedShapeIds]
  );

  // Multi-select shape function - supports shift key for multiple selection
  /**
   * Handles shape selection with multi-select support
   * @param shapeId - ID of shape to select/deselect, or null to clear selection
   * @param isShiftPressed - Whether Shift key is held for multi-select
   */
  const selectShape = useCallback(
    async (id: string | null, isShiftPressed: boolean = false) => {
      if (!user) return;

      try {
        if (!id) {
          // Deselecting all shapes
          // Clear selections in Firebase for all currently selected shapes
          for (const shapeId of selectedShapeIds) {
            await shapesService.deselectShape(shapeId);
          }
          setSelectedShapeIds([]);
          return;
        }

        // Check if shape is available for selection
        const shape = shapes.find((s) => s.id === id);
        if (shape?.selectedBy && shape.selectedBy !== user.id) {
          // Shape is selected by another user - cannot select
          console.log(
            `Shape ${id} is selected by ${shape.selectedByName}, cannot select`
          );
          return;
        }

        if (isShiftPressed) {
          // Shift key pressed - toggle selection
          if (selectedShapeIds.includes(id)) {
            // Deselect this shape
            await shapesService.deselectShape(id);
            setSelectedShapeIds((prev) =>
              prev.filter((shapeId) => shapeId !== id)
            );
          } else {
            // Add to selection
            await shapesService.selectShape(
              id,
              user.id,
              user.displayName,
              user.color
            );
            setSelectedShapeIds((prev) => [...prev, id]);
          }
        } else {
          // No shift key - single selection (clear others and select this one)
          // First deselect all currently selected shapes
          for (const shapeId of selectedShapeIds) {
            if (shapeId !== id) {
              await shapesService.deselectShape(shapeId);
            }
          }

          // Select the new shape
          await shapesService.selectShape(
            id,
            user.id,
            user.displayName,
            user.color
          );
          setSelectedShapeIds([id]);
        }
      } catch (error) {
        console.error("Error selecting shape:", error);
      }
    },
    [user, selectedShapeIds, shapes]
  );

  // Delete all selected shapes
  /**
   * Deletes all currently selected shapes
   * Uses optimistic updates for immediate UI response
   */
  const deleteSelectedShapes = useCallback(async () => {
    if (!user || selectedShapeIds.length === 0) return;

    try {
      setError(null);

      // Store the IDs to delete before clearing selection
      const shapesToDelete = [...selectedShapeIds];

      // Clear selection immediately
      setSelectedShapeIds([]);

      // Optimistically remove all selected shapes from local state
      setShapes((prev) =>
        prev.filter((shape) => !shapesToDelete.includes(shape.id))
      );

      // Delete all selected shapes from Firebase concurrently for better performance
      await Promise.all(
        shapesToDelete.map((shapeId) => shapesService.deleteShape(shapeId))
      );
    } catch (err: any) {
      setError(err.message || "Failed to delete shapes");
      // The subscription will restore the shapes on error
    }
  }, [user, selectedShapeIds]);

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
    setSelectedShapeIds([]);
  }, []);

  const clearAllShapes = useCallback(async () => {
    if (!user) return;

    try {
      setError(null);

      // Optimistically clear all shapes
      setShapes([]);
      setSelectedShapeIds([]);

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
    selectedShapeIds, // Changed from selectedShapeId to selectedShapeIds
    isLoading,
    error,
    createShape,
    updateShape,
    deleteShape,
    deleteSelectedShapes, // New function for deleting all selected shapes
    selectShape,
    clearShapes,
    clearAllShapes,
    getShapeById,
    isShapeLockedByOther,
    getShapeSelector,
  };
};
