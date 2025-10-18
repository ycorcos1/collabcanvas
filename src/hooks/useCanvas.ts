import { useState, useCallback, useEffect } from "react";
import { CanvasState } from "../types/canvas";

export const useCanvas = () => {
  // Persist canvas state across page refreshes (using sessionStorage)
  // Note: Zoom (scale) always resets to 100% (1.0) on refresh/logout as per requirements
  const [canvasState, setCanvasState] = useState<CanvasState>(() => {
    // Clear any old/invalid session storage to ensure clean start
    sessionStorage.removeItem("collabcanvas-canvas-state");

    // Always start at 100% zoom (scale: 1)
    return { x: 0, y: 0, scale: 1 };
  });

  // Save canvas state to sessionStorage when it changes
  useEffect(() => {
    sessionStorage.setItem(
      "collabcanvas-canvas-state",
      JSON.stringify(canvasState)
    );
  }, [canvasState]);

  const updateCanvasState = useCallback((updates: Partial<CanvasState>) => {
    setCanvasState((prev) => ({ ...prev, ...updates }));
  }, []);

  const resetCanvas = useCallback(() => {
    setCanvasState({ x: 0, y: 0, scale: 1 });
    sessionStorage.removeItem("collabcanvas-canvas-state");
  }, []);

  const centerCanvas = useCallback(
    (_canvasWidth?: number, _canvasHeight?: number) => {
      // For the new layout, we want the canvas to be positioned at the top-left of the viewport
      // The centering is handled by CSS flexbox in the workspace
      setCanvasState({ x: 0, y: 0, scale: 1 });
    },
    []
  );

  // Zoom functions for toolbar integration
  // Zoom in 10% increments, max 200%
  const zoomIn = useCallback(() => {
    setCanvasState((prev) => ({
      ...prev,
      scale: Math.min(prev.scale + 0.1, 2.0), // Max zoom 2.0x (200%)
    }));
  }, []);

  // Zoom out in 10% increments, min 10%
  const zoomOut = useCallback(() => {
    setCanvasState((prev) => ({
      ...prev,
      scale: Math.max(prev.scale - 0.1, 0.1), // Min zoom 0.1x (10%)
    }));
  }, []);

  const zoomReset = useCallback(() => {
    setCanvasState((prev) => ({
      ...prev,
      scale: 1,
    }));
  }, []);

  const initializeCanvas = useCallback(
    (canvasWidth: number, canvasHeight: number) => {
      // Only center if there's no saved state (indicating a fresh sign-in)
      const saved = sessionStorage.getItem("collabcanvas-canvas-state");
      if (!saved) {
        centerCanvas(canvasWidth, canvasHeight);
      }
      // If there is saved state, it's already loaded in the useState initializer
    },
    [centerCanvas]
  );

  const zoomToFit = useCallback((width: number, height: number) => {
    // For the new layout, we estimate the available viewport space
    // Assuming sidebars take about 500px total and toolbar takes about 100px
    const availableWidth = window.innerWidth - 500;
    const availableHeight = window.innerHeight - 150;

    const padding = 80; // Account for workspace padding
    const scaleX = (availableWidth - padding) / width;
    const scaleY = (availableHeight - padding) / height;
    const scale = Math.min(scaleX, scaleY, 1);

    setCanvasState({
      x: 0,
      y: 0,
      scale,
    });
  }, []);

  return {
    canvasState,
    updateCanvasState,
    resetCanvas,
    centerCanvas,
    initializeCanvas,
    zoomToFit,
    zoomIn,
    zoomOut,
    zoomReset,
  };
};
