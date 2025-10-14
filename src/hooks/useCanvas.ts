import { useState, useCallback, useEffect } from "react";
import { CanvasState } from "../types/canvas";

export const useCanvas = () => {
  // Persist canvas state across page refreshes (using sessionStorage)
  const [canvasState, setCanvasState] = useState<CanvasState>(() => {
    const saved = sessionStorage.getItem("collabcanvas-canvas-state");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // If parsing fails, use default state
        return { x: 0, y: 0, scale: 1 };
      }
    }
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
    (canvasWidth: number, canvasHeight: number) => {
      // Position the viewport so the center of the canvas is visible in the center of the viewport
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // Calculate the center of the canvas
      const canvasCenterX = canvasWidth / 2;
      const canvasCenterY = canvasHeight / 2;

      // Position the canvas so its center appears in the viewport center
      const x = viewportWidth / 2 - canvasCenterX;
      const y = viewportHeight / 2 - canvasCenterY;

      setCanvasState({ x, y, scale: 1 });
    },
    []
  );

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
    const padding = 100;
    const scaleX = (window.innerWidth - padding) / width;
    const scaleY = (window.innerHeight - padding) / height;
    const scale = Math.min(scaleX, scaleY, 1);

    setCanvasState({
      x: (window.innerWidth - width * scale) / 2,
      y: (window.innerHeight - height * scale) / 2,
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
  };
};
