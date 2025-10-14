import { useState, useCallback, useEffect } from "react";
import { CanvasState } from "../types/canvas";

export const useCanvas = () => {
  // Persist canvas state across page refreshes (using sessionStorage)
  const [canvasState, setCanvasState] = useState<CanvasState>(() => {
    const saved = sessionStorage.getItem('collabcanvas-canvas-state');
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
    sessionStorage.setItem('collabcanvas-canvas-state', JSON.stringify(canvasState));
  }, [canvasState]);

  const updateCanvasState = useCallback((updates: Partial<CanvasState>) => {
    setCanvasState((prev) => ({ ...prev, ...updates }));
  }, []);

  const resetCanvas = useCallback(() => {
    const defaultState = { x: 0, y: 0, scale: 1 };
    setCanvasState(defaultState);
    sessionStorage.setItem('collabcanvas-canvas-state', JSON.stringify(defaultState));
  }, []);

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
    zoomToFit,
  };
};
