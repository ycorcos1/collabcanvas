import { useState, useCallback, useEffect, useRef } from "react";
import { Shape, CreateShapeData } from "../types/shape";
import * as shapesService from "../services/shapes";
// import { canAutoWriteToFirestore } from "../config/firebaseConfig";
import { useAuth } from "../components/Auth/AuthProvider";

/**
 * useShapes Hook - Central state management for collaborative shapes
 *
 * Handles:
 * - Real-time shape synchronization via Firebase Firestore
 * - Shape selection functionality
 * - Shape creation, updates, and deletion
 * - Session persistence of selected shapes
 * - Optimistic UI updates with Firebase sync
 * - Error handling and connection resilience for idle users
 * - Shape validation and cleanup
 */

export const useShapes = (projectId: string, pageId: string) => {
  // Firestore sync disabled - using local state only
  // const [pendingAutoSelect, setPendingAutoSelect] = useState<{
  //   tempId: string;
  //   createdAt: number;
  //   userId: string;
  // } | null>(null);

  const { user } = useAuth();
  const [shapes, setShapes] = useState<Shape[]>([]);

  // Multi-select state - persisted across page refreshes using sessionStorage
  const [selectedShapeIds, setSelectedShapeIds] = useState<string[]>(() => {
    const saved = sessionStorage.getItem("horizon-selected-shapes");
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
        "horizon-selected-shapes",
        JSON.stringify(selectedShapeIds)
      );
    } else {
      sessionStorage.removeItem("horizon-selected-shapes");
    }
  }, [selectedShapeIds]);

  // FIRESTORE SYNC ENABLED - Real-time collaboration via Firestore
  useEffect(() => {
    if (!user || !projectId || !pageId) return;

    setIsLoading(true);
    setError(null);

    // Subscribe to real-time shape updates from Firestore (by page)
    const unsubscribe = shapesService.subscribeToShapesByPage(
      projectId,
      pageId,
      (updatedShapes) => {
        // Check if canvas was just cleared to prevent flicker on refresh
        const wasCleared =
          sessionStorage.getItem(`canvas-cleared-${projectId}`) === "true";

        if (wasCleared && updatedShapes.length === 0) {
          // Canvas was cleared and Firestore confirms no shapes - clear the flag
          sessionStorage.removeItem(`canvas-cleared-${projectId}`);
        }

        if (wasCleared && updatedShapes.length > 0) {
          // Canvas was cleared but Firestore still has shapes (race condition)
          // Ignore the shapes and keep canvas empty
          // silent
          setShapes([]);
          setIsLoading(false);
          return;
        }

        setShapes(updatedShapes);
        setIsLoading(false);
      },
      (error: any) => {
        // Silently handle permission-denied errors for new projects
        // The project might not exist yet in Firestore
        if (
          error.code === "permission-denied" ||
          error.message?.includes("Missing or insufficient permissions")
        ) {
          // silent
          setIsLoading(false);
          return;
        }
        // silent
        setError(error.message);
        setIsLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [user, projectId, pageId]);

  // Track previous shape IDs to prevent unnecessary validation
  const prevShapeIdsRef = useRef<string>("[]");

  // Validate selected shapes still exist when shapes array changes
  // Only run when shapes array changes, NOT when selection changes
  useEffect(() => {
    // Serialize current shape IDs for comparison
    const currentShapeIds = JSON.stringify(shapes.map((s) => s.id).sort());

    // Only run validation if shapes actually changed
    if (currentShapeIds === prevShapeIdsRef.current) {
      return; // Skip validation - shapes didn't change
    }

    // Update ref AFTER checking to prevent loops
    prevShapeIdsRef.current = currentShapeIds;

    // Only validate if there are selected shapes
    if (selectedShapeIds.length > 0) {
      const shapeIds = shapes.map((s) => s.id);
      const validShapeIds = selectedShapeIds.filter((id) =>
        shapeIds.includes(id)
      );

      // Only update state if some selected shapes no longer exist
      if (validShapeIds.length !== selectedShapeIds.length) {
        setSelectedShapeIds(validShapeIds);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shapes]); // Only depend on shapes, not selectedShapeIds to prevent loops

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

        // Calculate next z-index (highest current + 1)
        const maxZIndex =
          shapes.length > 0 ? Math.max(...shapes.map((s) => s.zIndex)) : 0;

        // Optimistically add the shape to local state
        const newShape: Shape = {
          id: tempId,
          pageId,
          ...shapeData,
          createdBy: user.id,
          zIndex: shapeData.zIndex ?? maxZIndex + 1, // Use provided zIndex or next highest
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        setShapes((prev) => [...prev, newShape]);
        // Don't auto-select the shape during creation - let user explicitly select it

        // Sync to Firestore for real-time collaboration
        await shapesService.createShape(projectId, {
          ...shapeData,
          pageId,
          createdBy: user.id,
        } as any);

        return newShape;
      } catch (err: any) {
        console.error("Failed to create shape:", err);
        setError(err.message || "Failed to create shape");
        // Remove the optimistic shape on error
        setShapes((prev) => prev.filter((shape) => shape.id !== tempId));
        // Clear pending auto-select on error (disabled)
        // setPendingAutoSelect(null);
        return null;
      }
    },
    [user, projectId, pageId]
  );

  const updateShape = useCallback(
    async (id: string, updates: Partial<Shape>) => {
      if (!user) return;

      try {
        setError(null);

        // Check if shape is locked by another user (unless we're updating selection fields)
        const isUpdatingSelection =
          "selectedBy" in updates ||
          "selectedByName" in updates ||
          "selectedByColor" in updates ||
          "selectedAt" in updates;

        if (!isUpdatingSelection) {
          const shape = shapes.find((s) => s.id === id);
          if (shape?.selectedBy && shape.selectedBy !== user.id) {
            setError("Cannot update shape locked by another user");
            return;
          }
        }

        // Optimistically update local state
        setShapes((prev) =>
          prev.map((shape) =>
            shape.id === id
              ? { ...shape, ...updates, updatedAt: Date.now() }
              : shape
          )
        );

        // Sync to Firestore for real-time collaboration
        await shapesService.updateShape(projectId, id, updates);
      } catch (err: any) {
        setError(err.message || "Failed to update shape");
        // The subscription will revert the optimistic update
      }
    },
    [user, projectId, shapes]
  );

  const deleteShape = useCallback(
    async (id: string) => {
      if (!user) return;

      try {
        setError(null);

        // Check if shape is locked by another user
        const shape = shapes.find((s) => s.id === id);
        if (shape?.selectedBy && shape.selectedBy !== user.id) {
          setError("Cannot delete shape locked by another user");
          return;
        }

        // Optimistically remove from local state
        setShapes((prev) => prev.filter((shape) => shape.id !== id));

        // Remove from selection if it was selected
        if (selectedShapeIds.includes(id)) {
          setSelectedShapeIds((prev) =>
            prev.filter((shapeId) => shapeId !== id)
          );
        }

        // Sync to Firestore for real-time collaboration
        await shapesService.deleteShape(projectId, id);
      } catch (err: any) {
        setError(err.message || "Failed to delete shape");
        // The subscription will restore the shape on error
      }
    },
    [user, selectedShapeIds, shapes]
  );

  // Shape selection function - single selection only
  /**
   * Handles shape selection
   * @param shapeId - ID of shape to select, or null to clear selection
   */
  const selectShape = useCallback(
    async (id: string | null) => {
      if (!user) return;

      try {
        if (!id) {
          // Deselecting all shapes - clear selectedBy from all shapes
          setShapes((prev) =>
            prev.map((shape) =>
              selectedShapeIds.includes(shape.id)
                ? {
                    ...shape,
                    selectedBy: undefined,
                    selectedByName: undefined,
                    selectedByColor: undefined,
                    selectedAt: undefined,
                  }
                : shape
            )
          );
          setSelectedShapeIds([]);
          return;
        }

        // Check if shape is available for selection - check real-time state
        setShapes((prev) => {
          const shape = prev.find((s) => s.id === id);

          // If shape is locked by another user, don't select it
          if (shape?.selectedBy && shape.selectedBy !== user.id) {
            console.log(
              `Shape ${id} is locked by ${
                shape.selectedByName || "another user"
              }`
            );
            return prev; // Return unchanged
          }

          // If we're already selecting this shape, don't update
          if (shape?.selectedBy === user.id && selectedShapeIds.includes(id)) {
            return prev; // Return unchanged
          }

          // Clear selectedBy from ALL previously selected shapes (including by this user)
          // and select the new shape
          return prev.map((s) => {
            if (selectedShapeIds.includes(s.id)) {
              // Deselect previous shapes
              return {
                ...s,
                selectedBy: undefined,
                selectedByName: undefined,
                selectedByColor: undefined,
                selectedAt: undefined,
              };
            } else if (s.id === id) {
              // Select this shape
              return {
                ...s,
                selectedBy: user.id,
                selectedByName: user.displayName || user.email || "Unknown",
                selectedByColor: user.color || "#000000",
                selectedAt: Date.now(),
              };
            }
            return s;
          });
        });

        // Update selected shape IDs
        setSelectedShapeIds([id]);
      } catch (error) {
        console.error("Error selecting shape:", error);
      }
    },
    [user, selectedShapeIds, setShapes] // Removed shapes from dependencies to use real-time state
  );

  // Multi-select: select a set of shapes at once
  const selectShapes = useCallback(
    async (ids: string[]) => {
      if (!user) return;

      try {
        setError(null);

        setShapes((prev) => {
          const idSet = new Set(ids);
          const prevSet = new Set(selectedShapeIds);
          return prev.map((s) => {
            const shouldSelect = idSet.has(s.id);
            const wasSelected = prevSet.has(s.id);
            if (shouldSelect && !wasSelected) {
              return {
                ...s,
                selectedBy: user.id,
                selectedByName: user.displayName || user.email || "Unknown",
                selectedByColor: user.color || "#000000",
                selectedAt: Date.now(),
              };
            }
            if (!shouldSelect && wasSelected) {
              return {
                ...s,
                selectedBy: undefined,
                selectedByName: undefined,
                selectedByColor: undefined,
                selectedAt: undefined,
              };
            }
            return s;
          });
        });

        setSelectedShapeIds(ids);
      } catch (error) {
        console.error("Error selecting shapes:", error);
      }
    },
    [user, selectedShapeIds, setShapes]
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

      // Filter out shapes that are locked by other users
      const shapesToDelete = selectedShapeIds.filter((shapeId) => {
        const shape = shapes.find((s) => s.id === shapeId);
        // Only delete if not locked by another user
        return !shape?.selectedBy || shape.selectedBy === user.id;
      });

      if (shapesToDelete.length === 0) {
        setError("Cannot delete shapes locked by other users");
        return;
      }

      // Clear selection immediately
      setSelectedShapeIds([]);

      // Remove only the unlocked shapes from local state
      setShapes((prev) =>
        prev.filter((shape) => !shapesToDelete.includes(shape.id))
      );

      // Sync to Firestore for real-time collaboration
      await Promise.all(
        shapesToDelete.map((shapeId) =>
          shapesService.deleteShape(projectId, shapeId)
        )
      );
    } catch (err: any) {
      setError(err.message || "Failed to delete shapes");
    }
  }, [user, selectedShapeIds, shapes, setShapes]);

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

    const currentUserId = user.id; // Capture user ID to avoid null access during cleanup

    // Clear selections when component unmounts
    return () => {
      shapesService
        .clearUserSelections(projectId, currentUserId)
        .catch((error) => {
          console.error("Error clearing user selections:", error);
        });
    };
  }, [user, projectId]);

  const clearShapes = useCallback(() => {
    setShapes([]);
    setSelectedShapeIds([]);
  }, []);

  const clearAllShapes = useCallback(async () => {
    if (!user) return;

    try {
      setError(null);

      // Local-first clear for instant UX
      setShapes([]);
      setSelectedShapeIds([]);

      // Persist clear by deleting all shapes for this page
      await shapesService.clearShapesForPage(projectId, pageId);
    } catch (err: any) {
      setError(err.message || "Failed to clear all shapes");
    }
  }, [user, projectId, pageId]);

  const getShapeById = useCallback(
    (id: string): Shape | undefined => {
      return shapes.find((shape) => shape.id === id);
    },
    [shapes]
  );

  // Helper: select all shapes by groupId
  const selectGroup = useCallback(
    async (groupId: string) => {
      const ids = shapes.filter((s) => (s as any).groupId === groupId).map((s) => s.id);
      if (ids.length) {
        await selectShapes(ids);
      }
    },
    [shapes, selectShapes]
  );

  return {
    shapes,
    setShapes, // Export setShapes for direct shape manipulation (e.g., loading from saved data)
    selectedShapeIds, // Changed from selectedShapeId to selectedShapeIds
    isLoading,
    error,
    createShape,
    updateShape,
    deleteShape,
    deleteSelectedShapes, // New function for deleting all selected shapes
    selectShape,
    selectShapes,
    clearShapes,
    clearAllShapes,
    getShapeById,
    selectGroup,
    isShapeLockedByOther,
    getShapeSelector,
  };
};
