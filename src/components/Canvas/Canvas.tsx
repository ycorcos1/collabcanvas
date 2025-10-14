import React, { useRef, useEffect, useState, useCallback } from "react";
import { Stage, Layer, Rect, Circle } from "react-konva";
import Konva from "konva";
import { KonvaEventObject } from "konva/lib/Node";
import { useCanvas } from "../../hooks/useCanvas";
import { useShapes } from "../../hooks/useShapes";
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

// Canvas dimensions (virtual workspace) - Made larger
const CANVAS_WIDTH = 5000;
const CANVAS_HEIGHT = 4000;

interface CanvasProps {
  selectedTool: ShapeType["type"] | null;
}

export const Canvas: React.FC<CanvasProps> = ({ selectedTool }) => {
  const { user } = useAuth();
  const { canvasState, updateCanvasState } = useCanvas();
  const {
    shapes,
    selectedShapeId,
    isLoading,
    error,
    createShape,
    updateShape,
    deleteShape,
    selectShape,
    isShapeLockedByOther,
    getShapeSelector,
  } = useShapes();
  const { updateCursorPosition } = useCursors();
  const stageRef = useRef<Konva.Stage>(null);
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });

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
    console.log(
      "State changed - isDrawing:",
      isDrawing,
      "drawStartPos:",
      drawStartPos,
      "previewShape:",
      previewShape
    );
  }, [isDrawing, drawStartPos, previewShape]);

  // Reset canvas state when user signs out
  useEffect(() => {
    if (!user) {
      updateCanvasState({ x: 0, y: 0, scale: 1 });
    }
  }, [user, updateCanvasState]);

  // Update stage size on window resize
  useEffect(() => {
    const updateSize = () => {
      setStageSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  // Handle keyboard shortcuts (Delete key)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedShapeId) {
          e.preventDefault();

          // Reset cursor when deleting via keyboard
          const stage = stageRef.current;
          if (stage) {
            stage.container().style.cursor = "";
          }

          deleteShape(selectedShapeId);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedShapeId, deleteShape]);

  // Handle zoom (wheel)
  const handleWheel = useCallback(
    (e: KonvaEventObject<WheelEvent>) => {
      e.evt.preventDefault();

      const stage = stageRef.current;
      if (!stage) return;

      const oldScale = stage.scaleX();
      const pointer = stage.getPointerPosition();

      if (!pointer) return;

      const mousePointTo = {
        x: (pointer.x - stage.x()) / oldScale,
        y: (pointer.y - stage.y()) / oldScale,
      };

      // Determine zoom direction and factor
      const direction = e.evt.deltaY > 0 ? -1 : 1;
      const scaleBy = 1.02; // Reduced from 1.05 for less sensitivity
      const newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;

      // Clamp scale between 0.1 and 5
      const clampedScale = Math.max(0.1, Math.min(5, newScale));

      stage.scale({ x: clampedScale, y: clampedScale });

      const newPos = {
        x: pointer.x - mousePointTo.x * clampedScale,
        y: pointer.y - mousePointTo.y * clampedScale,
      };

      stage.position(newPos);
      stage.batchDraw();

      updateCanvasState({
        x: newPos.x,
        y: newPos.y,
        scale: clampedScale,
      });
    },
    [updateCanvasState]
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
        console.log("No stage or user:", { stage: !!stage, user: !!user });
        return;
      }

      const pos = getRelativePointerPosition(stage);
      if (!pos) {
        console.log("No position found");
        return;
      }

      console.log("Mouse down at:", pos, "Target:", e.target.constructor.name);
      console.log("Selected tool:", selectedTool);
      console.log("User:", user);

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
        console.log("Clicked on background (stage or background rect)");
        // Always deselect shape when clicking on background
        selectShape(null);

        // Only start shape creation if a tool is selected and within canvas bounds
        if (
          selectedTool &&
          pos.x >= 0 &&
          pos.x <= CANVAS_WIDTH &&
          pos.y >= 0 &&
          pos.y <= CANVAS_HEIGHT
        ) {
          console.log("Starting shape creation with tool:", selectedTool);

          const newPreviewShape = {
            x: pos.x,
            y: pos.y,
            width: 0,
            height: 0,
            type: selectedTool,
            color: generateRandomColor(),
          };

          console.log("Created preview shape:", newPreviewShape);

          // Start creating shape
          setIsDrawing(true);
          setDrawStartPos(pos);
          setPreviewShape(newPreviewShape);

          console.log("State updated - isDrawing: true, drawStartPos:", pos);
        }
      } else {
        console.log("Clicked on non-stage element:", e.target.constructor.name);
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
        console.log("Updating preview shape:", {
          isDrawing,
          drawStartPos,
          currentPos: pos,
          previewShape,
        });
        const startX = drawStartPos.x;
        const startY = drawStartPos.y;

        // Calculate dimensions (constrain to canvas)
        const endX = Math.max(0, Math.min(CANVAS_WIDTH, pos.x));
        const endY = Math.max(0, Math.min(CANVAS_HEIGHT, pos.y));

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

        console.log("Setting new preview shape:", newPreviewShape);
        setPreviewShape(newPreviewShape);
      }
    },
    [user, updateCursorPosition, isDrawing, drawStartPos, previewShape]
  );

  // Handle mouse up - finalize shape creation
  const handleMouseUp = useCallback(
    async (_e?: KonvaEventObject<MouseEvent | TouchEvent>) => {
      console.log(
        "Mouse up - isDrawing:",
        isDrawing,
        "previewShape:",
        previewShape
      );
      if (isDrawing && previewShape && drawStartPos) {
        console.log("Finalizing shape creation:", previewShape);
        setIsDrawing(false);
        setDrawStartPos(null);

        // Only create if shape is large enough
        if (previewShape.width > 5 && previewShape.height > 5) {
          console.log("Creating shape in Firebase");
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
            console.log("Shape created successfully");
          } catch (error) {
            console.error("Failed to create shape:", error);
          }
        } else {
          console.log("Shape too small, not creating");
        }

        setPreviewShape(null);
      }
    },
    [isDrawing, previewShape, drawStartPos, createShape, user]
  );

  // Handle shape selection
  const handleShapeSelect = useCallback(
    (shapeId: string) => {
      selectShape(shapeId);
    },
    [selectShape]
  );

  // Handle shape deletion
  const handleShapeDelete = useCallback(
    (shapeId: string) => {
      deleteShape(shapeId);
    },
    [deleteShape]
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
      const maxX = CANVAS_WIDTH - minVisible; // Allow shape to go mostly off-canvas to the right
      const maxY = CANVAS_HEIGHT - minVisible; // Allow shape to go mostly off-canvas to the bottom
      const minX = minVisible - shape.width; // Allow shape to go mostly off-canvas to the left
      const minY = minVisible - shape.height; // Allow shape to go mostly off-canvas to the top

      // Constrain the position
      const constrainedX = Math.max(minX, Math.min(maxX, x));
      const constrainedY = Math.max(minY, Math.min(maxY, y));

      console.log("Shape drag end:", {
        shapeId,
        originalPos: { x, y },
        constrainedPos: { x: constrainedX, y: constrainedY },
        shapeDimensions: { width: shape.width, height: shape.height },
        bounds: { minX, maxX, minY, maxY },
      });

      updateShape(shapeId, { x: constrainedX, y: constrainedY });
    },
    [updateShape, shapes]
  );

  return (
    <div className={`canvas-container ${selectedTool ? "creating-shape" : ""}`}>
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
          console.log("🔥 STAGE - Raw mouse down event received!");
          console.log("🔥 STAGE - Event details:", {
            target: e.target.constructor.name,
            position: e.evt.clientX + "," + e.evt.clientY,
            selectedTool,
          });
          handleMouseDown(e);
        }}
        onTouchStart={(e) => {
          console.log("🔥 STAGE - Touch start event received!");
          console.log("🔥 STAGE - Touch event details:", {
            target: e.target.constructor.name,
            selectedTool,
          });
          handleMouseDown(e);
        }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchEnd={handleMouseUp}
        // Performance optimizations for smooth 60 FPS
        perfectDrawEnabled={false}
        listening={true}
      >
        <Layer
          clipX={0}
          clipY={0}
          clipWidth={CANVAS_WIDTH}
          clipHeight={CANVAS_HEIGHT}
        >
          {/* Canvas Background */}
          <Rect
            x={0}
            y={0}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            fill="#ffffff"
            stroke="#d0d0d0"
            strokeWidth={3}
          />

          {/* Grid pattern */}
          {Array.from({ length: Math.floor(CANVAS_WIDTH / 100) }).map((_, i) =>
            Array.from({ length: Math.floor(CANVAS_HEIGHT / 100) }).map(
              (_, j) => (
                <Rect
                  key={`grid-${i}-${j}`}
                  x={i * 100}
                  y={j * 100}
                  width={100}
                  height={100}
                  fill="transparent"
                  stroke="#f5f5f5"
                  strokeWidth={1}
                />
              )
            )
          )}

          {/* Render all shapes */}
          {console.log("Rendering shapes array:", shapes)}
          {shapes.map((shape) => {
            const isLockedByOther = isShapeLockedByOther(shape.id);
            const selectedByOther = getShapeSelector(shape.id);

            return (
              <Shape
                key={shape.id}
                shape={shape}
                isSelected={selectedShapeId === shape.id}
                selectedTool={selectedTool}
                onSelect={handleShapeSelect}
                onDragEnd={handleShapeDragEnd}
                onDelete={handleShapeDelete}
                isLockedByOther={isLockedByOther}
                selectedByOther={selectedByOther}
              />
            );
          })}

          {/* Preview shape while drawing */}
          {console.log("Preview shape:", previewShape)}
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
    </div>
  );
};
