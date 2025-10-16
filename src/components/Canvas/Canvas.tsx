import React, { useRef, useEffect, useState, useCallback } from "react";
import { Stage, Layer, Rect, Circle } from "react-konva";
import Konva from "konva";
import { KonvaEventObject } from "konva/lib/Node";
import { useCanvas } from "../../hooks/useCanvas";
import { useCanvasDimensions } from "../../hooks/useCanvasDimensions";
import { useCursors } from "../../hooks/useCursors";
import { useAuth } from "../Auth/AuthProvider";
import { Shape } from "./Shape";
import { MultipleCursors } from "../Cursors/MultipleCursors";
import { Shape as ShapeType } from "../../types/shape";
import {
  getRelativePointerPosition,
  generateRandomColor,
} from "../../utils/canvasHelpers";
import "./Canvas.css";

/**
 * Props interface for the Canvas component
 */
interface CanvasProps {
  selectedTool: ShapeType["type"] | null;
  shapes: ShapeType[];
  selectedShapeIds: string[];
  isLoading: boolean;
  error: string | null;
  createShape: (shapeData: any) => Promise<ShapeType | null>;
  updateShape: (id: string, updates: any) => Promise<void>;
  deleteSelectedShapes: () => Promise<void>;
  selectShape: (id: string | null, isShiftPressed?: boolean) => Promise<void>;
  isShapeLockedByOther: (shapeId: string) => boolean;
  getShapeSelector: (shapeId: string) => { name: string; color: string } | null;
}

/**
 * Canvas Component - Main collaborative drawing surface
 *
 * Features:
 * - Interactive shape creation (click and drag to draw)
 * - Multi-select with Shift key support
 * - Real-time cursor tracking across all users
 * - Zoom and pan functionality with smooth performance
 * - Dynamic canvas dimensions with real-time sync
 * - Shape locking and collaboration indicators
 * - Keyboard shortcuts (Delete key, Escape to deselect)
 * - Optimized rendering for 60 FPS performance
 */

export const Canvas: React.FC<CanvasProps> = ({
  selectedTool,
  shapes,
  selectedShapeIds,
  isLoading,
  error,
  createShape,
  updateShape,
  deleteSelectedShapes,
  selectShape,
  isShapeLockedByOther,
  getShapeSelector,
}) => {
  const { user } = useAuth();
  const { canvasState, updateCanvasState, resetCanvas, centerCanvas } =
    useCanvas();
  const { dimensions: canvasDimensions } = useCanvasDimensions();
  const { updateCursorPosition } = useCursors();
  const stageRef = useRef<Konva.Stage>(null);
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });
  const [hasInitialized, setHasInitialized] = useState(false);

  // Zoom optimization refs
  const zoomAnimationRef = useRef<number | null>(null);
  const pendingZoomUpdate = useRef<{
    x: number;
    y: number;
    scale: number;
  } | null>(null);
  const lastZoomTime = useRef<number>(0);
  const zoomAccumulator = useRef<{
    deltaX: number;
    deltaY: number;
    count: number;
  }>({
    deltaX: 0,
    deltaY: 0,
    count: 0,
  });

  // State for shape creation
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStartPos, setDrawStartPos] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [previewShape, setPreviewShape] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
    type: ShapeType["type"];
    color: string;
  } | null>(null);

  // Debug state changes
  useEffect(() => {
    // Drawing state changed
  }, [isDrawing, drawStartPos, previewShape]);

  // Optimized zoom update using requestAnimationFrame with throttling for 60 FPS
  const scheduleZoomUpdate = useCallback(() => {
    if (zoomAnimationRef.current) return; // Animation already scheduled

    zoomAnimationRef.current = requestAnimationFrame(() => {
      if (pendingZoomUpdate.current) {
        // Only update React state every 16ms (60 FPS) to prevent excessive re-renders
        const now = Date.now();
        if (now - lastZoomTime.current >= 16) {
          updateCanvasState(pendingZoomUpdate.current);
          lastZoomTime.current = now;
        } else {
          // Re-schedule if we're updating too frequently
          zoomAnimationRef.current = null;
          scheduleZoomUpdate();
          return;
        }
        pendingZoomUpdate.current = null;
      }
      zoomAnimationRef.current = null;
    });
  }, [updateCanvasState]);

  // Cleanup animation frame on unmount
  useEffect(() => {
    return () => {
      if (zoomAnimationRef.current) {
        cancelAnimationFrame(zoomAnimationRef.current);
      }
    };
  }, []);

  // Track shift key state for multi-select
  const [isShiftPressed, setIsShiftPressed] = useState(false);
  const shiftKeyRef = useRef(false); // Ref for immediate access

  // Track shift key for multi-select - Enhanced event handling for production
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Shift" || e.shiftKey) {
        e.preventDefault();
        setIsShiftPressed(true);
        shiftKeyRef.current = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Shift" || !e.shiftKey) {
        setIsShiftPressed(false);
        shiftKeyRef.current = false;
      }
    };

    // Use multiple event targets for maximum compatibility
    document.addEventListener("keydown", handleKeyDown, { passive: false, capture: true });
    document.addEventListener("keyup", handleKeyUp, { passive: false, capture: true });
    window.addEventListener("keydown", handleKeyDown, { passive: false });
    window.addEventListener("keyup", handleKeyUp, { passive: false });
    
    // Also add focus/blur handlers to reset state
    const handleBlur = () => {
      setIsShiftPressed(false);
      shiftKeyRef.current = false;
    };
    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleBlur); // Reset on focus too

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleBlur);
    };
  }, []);

  // Handle canvas state based on user authentication
  useEffect(() => {
    if (!user) {
      // Reset canvas state when user signs out (clears sessionStorage)
      resetCanvas();
      setHasInitialized(false);
    } else if (!hasInitialized) {
      // Center the canvas when user first signs in
      // Use setTimeout to ensure sessionStorage has been cleared
      setTimeout(() => {
        const saved = sessionStorage.getItem("collabcanvas-canvas-state");
        if (!saved) {
          // No saved state means fresh sign-in, center the canvas
          centerCanvas(canvasDimensions.width, canvasDimensions.height);
        }
        setHasInitialized(true);
      }, 0);
    }
  }, [user, resetCanvas, centerCanvas, hasInitialized, canvasDimensions]);

  // Update stage size on window resize
  useEffect(() => {
    const updateSize = () => {
      setStageSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
      // Note: We don't re-center on resize anymore to preserve user's position
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  // Handle keyboard shortcuts (Delete key)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedShapeIds.length > 0) {
          e.preventDefault();

          // Reset cursor when deleting via keyboard
          const stage = stageRef.current;
          if (stage) {
            stage.container().style.cursor = "";
          }

          // Delete all selected shapes
          deleteSelectedShapes();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedShapeIds, deleteSelectedShapes]);

  // Handle zoom (wheel) - Ultra-smooth with event batching
  const handleWheel = useCallback(
    (e: KonvaEventObject<WheelEvent>) => {
      e.evt.preventDefault();

      const stage = stageRef.current;
      if (!stage) return;

      // Batch wheel events for smoother scrolling
      const now = Date.now();
      zoomAccumulator.current.deltaX += e.evt.deltaX;
      zoomAccumulator.current.deltaY += e.evt.deltaY;
      zoomAccumulator.current.count++;

      // Process accumulated wheel events every few milliseconds
      if (now - lastZoomTime.current < 8) {
        return; // Batch more events
      }

      const avgDeltaY =
        zoomAccumulator.current.deltaY / zoomAccumulator.current.count;

      // Reset accumulator
      zoomAccumulator.current = { deltaX: 0, deltaY: 0, count: 0 };

      const oldScale = stage.scaleX();
      const pointer = stage.getPointerPosition();

      if (!pointer) return;

      const mousePointTo = {
        x: (pointer.x - stage.x()) / oldScale,
        y: (pointer.y - stage.y()) / oldScale,
      };

      // Determine zoom direction and factor
      const direction = avgDeltaY > 0 ? -1 : 1;
      const scaleBy = 1.05; // Increased back for faster zooming while keeping smoothness
      const newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;

      // Clamp scale between 0.1 and 5
      const clampedScale = Math.max(0.1, Math.min(5, newScale));

      const newPos = {
        x: pointer.x - mousePointTo.x * clampedScale,
        y: pointer.y - mousePointTo.y * clampedScale,
      };

      // Update Konva stage immediately for visual feedback
      stage.scale({ x: clampedScale, y: clampedScale });
      stage.position(newPos);
      stage.batchDraw();

      // Schedule React state update for next frame
      pendingZoomUpdate.current = {
        x: newPos.x,
        y: newPos.y,
        scale: clampedScale,
      };
      scheduleZoomUpdate();
      lastZoomTime.current = now;
    },
    [scheduleZoomUpdate]
  );

  // Handle pan (drag) - only when dragging the stage itself
  const handleStageDragEnd = useCallback(
    (e: KonvaEventObject<DragEvent>) => {
      const stage = e.target as Konva.Stage;

      // Only update canvas state if the Stage itself was dragged
      // (not when a shape was dragged)
      if (e.target === stage) {
        updateCanvasState({
          x: stage.x(),
          y: stage.y(),
        });
      }
    },
    [updateCanvasState]
  );

  // Handle mouse down - start shape creation or selection
  const handleMouseDown = useCallback(
    (e: KonvaEventObject<MouseEvent | TouchEvent>) => {
      const stage = stageRef.current;
      if (!stage || !user) {
        return;
      }

      const pos = getRelativePointerPosition(stage);
      if (!pos) {
        return;
      }

      // Check if clicking on background (stage, background elements, or canvas background)
      const isBackgroundClick =
        e.target === stage ||
        // Check for background Rect elements
        (e.target.constructor.name === "Rect" &&
          (e.target.attrs.fill === "#ffffff" ||
            e.target.attrs.fill === "transparent")) ||
        // Check for Konva canvas background nodes (like 'n0')
        (typeof e.target === "object" &&
          e.target.constructor.name !== "Rect" &&
          e.target.constructor.name !== "Circle" &&
          e.target.constructor.name !== "Group");

      if (isBackgroundClick) {
        // Always deselect shape when clicking on background
        selectShape(null);

        // Only start shape creation if a tool is selected and within canvas bounds
        if (
          selectedTool &&
          pos.x >= 0 &&
          pos.x <= canvasDimensions.width &&
          pos.y >= 0 &&
          pos.y <= canvasDimensions.height
        ) {
          const newPreviewShape = {
            x: pos.x,
            y: pos.y,
            width: 0,
            height: 0,
            type: selectedTool,
            color: generateRandomColor(),
          };

          // Start creating shape
          setIsDrawing(true);
          setDrawStartPos(pos);
          setPreviewShape(newPreviewShape);
        }
      } else {
        // Clicked on a shape or other element
      }
    },
    [user, selectedTool, selectShape]
  );

  // Handle mouse move - update preview shape or cursor
  const handleMouseMove = useCallback(
    (_e: KonvaEventObject<MouseEvent>) => {
      const stage = stageRef.current;
      if (!stage || !user) return;

      const pos = getRelativePointerPosition(stage);
      if (!pos) return;

      // Update cursor position for multiplayer
      updateCursorPosition(pos.x, pos.y);

      // Update preview shape if drawing
      if (isDrawing && drawStartPos && previewShape) {
        const startX = drawStartPos.x;
        const startY = drawStartPos.y;

        // Calculate dimensions (constrain to canvas)
        const endX = Math.max(0, Math.min(canvasDimensions.width, pos.x));
        const endY = Math.max(0, Math.min(canvasDimensions.height, pos.y));

        const width = Math.abs(endX - startX);
        const height = Math.abs(endY - startY);

        // Calculate position (top-left corner)
        const x = Math.min(startX, endX);
        const y = Math.min(startY, endY);

        const newPreviewShape = {
          ...previewShape,
          x,
          y,
          width: Math.max(width, 1),
          height: Math.max(height, 1),
        };

        setPreviewShape(newPreviewShape);
      }
    },
    [user, updateCursorPosition, isDrawing, drawStartPos, previewShape]
  );

  // Handle mouse up - finalize shape creation
  const handleMouseUp = useCallback(
    async (_e?: KonvaEventObject<MouseEvent | TouchEvent>) => {
      if (isDrawing && previewShape && drawStartPos) {
        setIsDrawing(false);
        setDrawStartPos(null);

        // Only create if shape is large enough
        if (previewShape.width > 5 && previewShape.height > 5) {
          try {
            await createShape({
              type: previewShape.type,
              x: previewShape.x,
              y: previewShape.y,
              width: previewShape.width,
              height: previewShape.height,
              color: previewShape.color,
              createdBy: user!.id,
            });
          } catch (error) {
            console.error("Failed to create shape:", error);
          }
        } else {
          // Shape too small, not creating
        }

        setPreviewShape(null);
      }
    },
    [isDrawing, previewShape, drawStartPos, createShape, user]
  );

  // Handle shape selection with multiple shift detection methods
  const handleShapeSelect = useCallback(
    (shapeId: string, event?: MouseEvent) => {
      // Try multiple methods to detect shift key for production reliability
      const shiftPressed = 
        event?.shiftKey || // From the actual mouse event (most reliable)
        shiftKeyRef.current || // From our ref
        isShiftPressed; // From our state
      
      selectShape(shapeId, shiftPressed);
    },
    [selectShape, isShiftPressed]
  );

  // Handle shape drag end
  const handleShapeDragEnd = useCallback(
    (shapeId: string, x: number, y: number) => {
      // Get the shape to know its dimensions
      const shape = shapes.find((s) => s.id === shapeId);
      if (!shape) return;

      // Define minimum visible area (at least 20px should remain visible)
      const minVisible = 20;

      // Calculate constrained position
      const maxX = canvasDimensions.width - minVisible; // Allow shape to go mostly off-canvas to the right
      const maxY = canvasDimensions.height - minVisible; // Allow shape to go mostly off-canvas to the bottom
      const minX = minVisible - shape.width; // Allow shape to go mostly off-canvas to the left
      const minY = minVisible - shape.height; // Allow shape to go mostly off-canvas to the top

      // Constrain the position
      const constrainedX = Math.max(minX, Math.min(maxX, x));
      const constrainedY = Math.max(minY, Math.min(maxY, y));

      updateShape(shapeId, { x: constrainedX, y: constrainedY });
    },
    [updateShape, shapes]
  );

  // Handle shape resize
  const handleShapeResize = useCallback(
    (shapeId: string, x: number, y: number, width: number, height: number) => {
      updateShape(shapeId, { x, y, width, height });
    },
    [updateShape]
  );

  return (
    <div className={`canvas-container ${selectedTool ? "creating-shape" : ""}`}>
      {/* Don't render canvas content if user is not authenticated */}
      {!user ? (
        <div className="canvas-loading">
          <div className="loading-spinner"></div>
          <p>Signing out...</p>
        </div>
      ) : (
        <>
          {/* Loading indicator */}
          {isLoading && (
            <div className="canvas-loading">
              <div className="loading-spinner"></div>
              <p>Loading canvas...</p>
            </div>
          )}


          {/* Error indicator */}
          {error && (
            <div className="canvas-error">
              <p>Error: {error}</p>
            </div>
          )}

      <Stage
        ref={stageRef}
        width={stageSize.width}
        height={stageSize.height}
        x={canvasState.x}
        y={canvasState.y}
        scaleX={canvasState.scale}
        scaleY={canvasState.scale}
        draggable={!selectedTool && !isDrawing}
        onDragEnd={handleStageDragEnd}
        onWheel={handleWheel}
        onMouseDown={(e) => {
          handleMouseDown(e);
        }}
        onTouchStart={(e) => {
          handleMouseDown(e);
        }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchEnd={handleMouseUp}
        // Performance optimizations for smooth 60 FPS
        perfectDrawEnabled={false}
        imageSmoothingEnabled={true}
        listening={true}
      >
        <Layer
          clipX={0}
          clipY={0}
          clipWidth={canvasDimensions.width}
          clipHeight={canvasDimensions.height}
          perfectDrawEnabled={false}
        >
          {/* Canvas Background */}
          <Rect
            x={0}
            y={0}
            width={canvasDimensions.width}
            height={canvasDimensions.height}
            fill="#ffffff"
            stroke="#d0d0d0"
            strokeWidth={3}
          />

          {/* Grid pattern */}
          {Array.from({ length: Math.floor(canvasDimensions.width / 100) }).map(
            (_, i) =>
              Array.from({
                length: Math.floor(canvasDimensions.height / 100),
              }).map((_, j) => (
                <Rect
                  key={`grid-${i}-${j}`}
                  x={i * 100}
                  y={j * 100}
                  width={100}
                  height={100}
                  fill="transparent"
                  stroke="#f5f5f5"
                  strokeWidth={1}
                  listening={false}
                  perfectDrawEnabled={false}
                  strokeScaleEnabled={false}
                />
              ))
          )}

          {/* Render all shapes */}
          {shapes.map((shape) => {
            const isLockedByOther = isShapeLockedByOther(shape.id);
            const selectedByOther = getShapeSelector(shape.id);

            return (
              <Shape
                key={shape.id}
                shape={shape}
                isSelected={selectedShapeIds.includes(shape.id)}
                selectedTool={selectedTool}
                onSelect={handleShapeSelect}
                onDragEnd={handleShapeDragEnd}
                onResize={handleShapeResize}
                isLockedByOther={isLockedByOther}
                selectedByOther={selectedByOther}
                canvasScale={canvasState.scale}
              />
            );
          })}

          {/* Preview shape while drawing */}
          {previewShape &&
            (previewShape.type === "circle" ? (
              <Circle
                x={previewShape.x + previewShape.width / 2}
                y={previewShape.y + previewShape.height / 2}
                radius={Math.min(previewShape.width, previewShape.height) / 2}
                fill="rgba(33, 150, 243, 0.3)"
                stroke="#2196f3"
                strokeWidth={2}
                dash={[5, 5]}
                listening={false}
              />
            ) : (
              <Rect
                x={previewShape.x}
                y={previewShape.y}
                width={previewShape.width}
                height={previewShape.height}
                fill="rgba(33, 150, 243, 0.3)"
                stroke="#2196f3"
                strokeWidth={2}
                dash={[5, 5]}
                listening={false}
              />
            ))}
        </Layer>
      </Stage>

      {/* Multiplayer cursors overlay */}
      <MultipleCursors canvasState={canvasState} stageRef={stageRef} />
        </>
      )}
    </div>
  );
};
