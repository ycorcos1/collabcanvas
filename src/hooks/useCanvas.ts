import { useState, useCallback } from "react";
import { CanvasState } from "../types/canvas";

export const useCanvas = () => {
  const [canvasState, setCanvasState] = useState<CanvasState>({
    x: 0,
    y: 0,
    scale: 1,
  });

  const updateCanvasState = useCallback((updates: Partial<CanvasState>) => {
    setCanvasState((prev) => ({ ...prev, ...updates }));
  }, []);

  const resetCanvas = useCallback(() => {
    setCanvasState({ x: 0, y: 0, scale: 1 });
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
