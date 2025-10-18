import React, { useRef, useEffect, useState, useCallback } from "react";
import { Stage, Layer, Rect, Circle } from "react-konva";
import Konva from "konva";
import { KonvaEventObject } from "konva/lib/Node";
import { useCanvas } from "../../hooks/useCanvas";
import { useCanvasDimensions } from "../../hooks/useCanvasDimensions";
import { useCursors } from "../../hooks/useCursors";
import { useAuth } from "../Auth/AuthProvider";
import { Shape } from "./Shape";
import { TextBox } from "./TextBox";
import { DrawingPath } from "./DrawingPath";
import { MultipleCursors } from "../Cursors/MultipleCursors";
import { ContextMenu } from "../ContextMenu/ContextMenu";
import { Shape as ShapeType } from "../../types/shape";
import { getRelativePointerPosition } from "../../utils/canvasHelpers";
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
  selectShape: (id: string | null) => Promise<void>;
  isShapeLockedByOther: (shapeId: string) => boolean;
  getShapeSelector: (shapeId: string) => { name: string; color: string } | null;
  cursorMode?: string;
  onCut?: () => void;
  onCopy?: () => void;
  onPaste?: () => void;
  hasClipboardContent?: boolean;
  projectId: string;
  onStageRef?: (stage: any) => void; // Callback to expose stage reference
  canvasState?: { x: number; y: number; scale: number };
  updateCanvasState?: (updates: {
    x?: number;
    y?: number;
    scale?: number;
  }) => void;
}

/**
 * Canvas Component - Main collaborative drawing surface
 *
 * Features:
 * - Interactive shape creation (click and drag to draw)
 * - Shape selection and interaction
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
  cursorMode = "move",
  onCut,
  onCopy,
  onPaste,
  hasClipboardContent = false,
  projectId,
  onStageRef,
  canvasState: propCanvasState,
  updateCanvasState: propUpdateCanvasState,
}) => {
  const { user } = useAuth();

  // Use canvas state from props if provided, otherwise use local hook
  const localCanvasHook = useCanvas();
  const canvasState = propCanvasState || localCanvasHook.canvasState;
  const updateCanvasState =
    propUpdateCanvasState || localCanvasHook.updateCanvasState;

  const { dimensions: canvasDimensions, isLoading: dimensionsLoading } =
    useCanvasDimensions();
  const { updateCursorPosition } = useCursors(projectId);
  const stageRef = useRef<Konva.Stage>(null);
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });
  const [hasInitialized, setHasInitialized] = useState(false);

  // Expose stage reference to parent component for thumbnail generation
  useEffect(() => {
    if (onStageRef && stageRef.current) {
      onStageRef(stageRef.current);
    }
  }, [onStageRef]);

  // Zoom is now handled by parent component via CSS transform

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

  // State for multi-select with move tool
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionBox, setSelectionBox] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    hasSelectedShapes: boolean;
  } | null>(null);

  // Hand tool panning is now handled by the parent CanvasPage component

  // Text editing state
  const [editingTextId, setEditingTextId] = useState<string | null>(null);

  // Drawing state
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [currentDrawing, setCurrentDrawing] = useState<number[]>([]);
  const [drawingColor] = useState("#FF0000");
  const [drawingStrokeWidth] = useState(3);

  // Debug state changes
  useEffect(() => {
    // Drawing state changed
  }, [isDrawing, drawStartPos, previewShape]);

  // Zoom update optimization removed - now handled by CSS transform in parent

  // Removed shift key tracking functionality

  // Handle canvas state based on user authentication
  useEffect(() => {
    if (!user) {
      // Reset canvas state when user signs out
      updateCanvasState({ x: 0, y: 0, scale: 1 });
      setHasInitialized(false);
    } else if (!hasInitialized) {
      // Center the canvas when user first signs in
      // Use setTimeout to ensure sessionStorage has been cleared
      setTimeout(() => {
        const saved = sessionStorage.getItem("collabcanvas-canvas-state");
        if (!saved) {
          // No saved state means fresh sign-in, center the canvas
          updateCanvasState({ x: 0, y: 0, scale: 1 });
        }
        setHasInitialized(true);
      }, 0);
    }
  }, [user, updateCanvasState, hasInitialized, canvasDimensions]);

  // Update stage size based on canvas dimensions
  useEffect(() => {
    const updateSize = () => {
      // Use canvas dimensions for the stage size with fallback values
      setStageSize({
        width: canvasDimensions?.width || 2000,
        height: canvasDimensions?.height || 2000,
      });
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, [canvasDimensions?.width, canvasDimensions?.height]);

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

  // Mouse wheel zoom disabled - zoom now controlled by toolbar buttons only

  // Handle pan (drag) - only when dragging the stage itself
  // Stage dragging disabled - panning now handled by parent component via scrolling

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

        // Handle multi-select with move tool - start selection box
        if (cursorMode === "move" && !selectedTool) {
          setIsSelecting(true);
          setDrawStartPos(pos);
          setSelectionBox({
            x: pos.x,
            y: pos.y,
            width: 0,
            height: 0,
          });
          return;
        }

        // Handle text tool - create text immediately on click
        if (
          cursorMode === "text" &&
          pos.x >= 0 &&
          pos.x <= (canvasDimensions?.width || 2000) &&
          pos.y >= 0 &&
          pos.y <= (canvasDimensions?.height || 2000)
        ) {
          const textShape = {
            type: "text" as const,
            x: pos.x,
            y: pos.y,
            width: 100,
            height: 30,
            color: "#FF0000", // Red default color
            text: "Text",
            fontSize: 16,
            fontFamily: "Arial",
            createdBy: user.id,
          };

          createShape(textShape).then((newShape) => {
            if (newShape) {
              setEditingTextId(newShape.id);
              selectShape(newShape.id);
            }
          });
          return;
        }

        // Handle brush tool - start drawing
        if (
          cursorMode === "brush" &&
          pos.x >= 0 &&
          pos.x <= (canvasDimensions?.width || 2000) &&
          pos.y >= 0 &&
          pos.y <= (canvasDimensions?.height || 2000)
        ) {
          setIsDrawingMode(true);
          setCurrentDrawing([pos.x, pos.y]);
          return;
        }

        // Only start shape creation if a tool is selected and within canvas bounds
        if (
          selectedTool &&
          pos.x >= 0 &&
          pos.x <= (canvasDimensions?.width || 2000) &&
          pos.y >= 0 &&
          pos.y <= (canvasDimensions?.height || 2000)
        ) {
          const newPreviewShape = {
            x: pos.x,
            y: pos.y,
            width: 0,
            height: 0,
            type: selectedTool,
            color: "#FF0000", // Red default color for all shapes
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
    [user, selectedTool, selectShape, cursorMode, canvasDimensions, createShape]
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

      // Handle multi-select box
      if (isSelecting && drawStartPos) {
        const startX = drawStartPos.x;
        const startY = drawStartPos.y;

        const width = Math.abs(pos.x - startX);
        const height = Math.abs(pos.y - startY);

        const x = Math.min(startX, pos.x);
        const y = Math.min(startY, pos.y);

        setSelectionBox({
          x,
          y,
          width,
          height,
        });
        return;
      }

      // Handle drawing mode
      if (isDrawingMode && currentDrawing.length > 0) {
        const newPoints = [...currentDrawing, pos.x, pos.y];
        setCurrentDrawing(newPoints);
        return;
      }

      // Update preview shape if drawing
      if (isDrawing && drawStartPos && previewShape) {
        const startX = drawStartPos.x;
        const startY = drawStartPos.y;

        // Calculate dimensions (constrain to canvas)
        const endX = Math.max(
          0,
          Math.min(canvasDimensions?.width || 2000, pos.x)
        );
        const endY = Math.max(
          0,
          Math.min(canvasDimensions?.height || 2000, pos.y)
        );

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
    [
      user,
      updateCursorPosition,
      isDrawing,
      drawStartPos,
      previewShape,
      isDrawingMode,
      currentDrawing,
      canvasDimensions,
      isSelecting,
    ]
  );

  // Handle mouse up - finalize shape creation
  const handleMouseUp = useCallback(
    async (_e?: KonvaEventObject<MouseEvent | TouchEvent>) => {
      // Handle multi-select completion
      if (isSelecting && selectionBox) {
        // Find all shapes that intersect with the selection box
        const selectedIds = shapes
          .filter((shape) => {
            // Check if shape intersects with selection box
            const shapeRight = shape.x + shape.width;
            const shapeBottom = shape.y + shape.height;
            const boxRight = selectionBox.x + selectionBox.width;
            const boxBottom = selectionBox.y + selectionBox.height;

            return !(
              shape.x > boxRight ||
              shapeRight < selectionBox.x ||
              shape.y > boxBottom ||
              shapeBottom < selectionBox.y
            );
          })
          .map((shape) => shape.id);

        // Select all shapes that intersect
        if (selectedIds.length > 0) {
          // For now, we'll just select the first shape to match the current architecture
          // In the future, we could update the useShapes hook to support multi-select
          selectShape(selectedIds[0]);
          // TODO: Implement true multi-select in useShapes hook
        }

        setIsSelecting(false);
        setSelectionBox(null);
        setDrawStartPos(null);
        return;
      }

      // Handle drawing completion
      if (isDrawingMode) {
        // Always stop drawing mode on mouse up
        setIsDrawingMode(false);

        // Only create shape if we have enough points
        if (currentDrawing.length > 2) {
          // Calculate bounding box for the drawing
          const minX = Math.min(
            ...currentDrawing.filter((_, i) => i % 2 === 0)
          );
          const maxX = Math.max(
            ...currentDrawing.filter((_, i) => i % 2 === 0)
          );
          const minY = Math.min(
            ...currentDrawing.filter((_, i) => i % 2 === 1)
          );
          const maxY = Math.max(
            ...currentDrawing.filter((_, i) => i % 2 === 1)
          );

          const drawingShape = {
            type: "drawing" as const,
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY,
            color: drawingColor,
            points: currentDrawing,
            strokeWidth: drawingStrokeWidth,
            createdBy: user!.id,
          };

          try {
            await createShape(drawingShape);
          } catch (error) {
            console.error("Failed to create drawing:", error);
          }
        }

        // Clear drawing state
        setCurrentDrawing([]);
        return;
      }

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
    [
      isDrawing,
      previewShape,
      drawStartPos,
      createShape,
      user,
      isDrawingMode,
      currentDrawing,
      drawingColor,
      drawingStrokeWidth,
      isSelecting,
      selectionBox,
      shapes,
      selectShape,
    ]
  );

  // Handle shape selection without shift key functionality
  const handleShapeSelect = useCallback(
    (shapeId: string) => {
      selectShape(shapeId);
    },
    [selectShape]
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
      const maxX = (canvasDimensions?.width || 2000) - minVisible; // Allow shape to go mostly off-canvas to the right
      const maxY = (canvasDimensions?.height || 2000) - minVisible; // Allow shape to go mostly off-canvas to the bottom
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

  // Handle right-click context menu
  const handleContextMenu = useCallback(
    (e: KonvaEventObject<PointerEvent>) => {
      e.evt.preventDefault();

      const stage = e.target.getStage();
      if (!stage) return;

      const pos = stage.getPointerPosition();
      if (!pos) return;

      // Check if right-clicked on a shape
      const clickedOnShape = e.target !== stage;
      const hasSelectedShapes = selectedShapeIds.length > 0;

      setContextMenu({
        x: pos.x,
        y: pos.y,
        hasSelectedShapes: clickedOnShape && hasSelectedShapes,
      });
    },
    [selectedShapeIds]
  );

  // Close context menu
  const handleCloseContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  // Context menu actions
  const handleContextCut = useCallback(() => {
    if (onCut) onCut();
    setContextMenu(null);
  }, [onCut]);

  const handleContextCopy = useCallback(() => {
    if (onCopy) onCopy();
    setContextMenu(null);
  }, [onCopy]);

  const handleContextPaste = useCallback(() => {
    if (onPaste) onPaste();
    setContextMenu(null);
  }, [onPaste]);

  // Text handling functions
  const handleTextChange = useCallback(
    (textId: string, newText: string) => {
      updateShape(textId, { text: newText });
    },
    [updateShape]
  );

  const handleTextEditingChange = useCallback(
    (textId: string, isEditing: boolean) => {
      if (isEditing) {
        setEditingTextId(textId);
      } else {
        setEditingTextId(null);
      }
    },
    []
  );

  const handleTextDragEnd = useCallback(
    (textId: string, x: number, y: number) => {
      updateShape(textId, { x, y });
    },
    [updateShape]
  );

  const handleTextResize = useCallback(
    (textId: string, x: number, y: number, width: number, height: number) => {
      updateShape(textId, { x, y, width, height });
    },
    [updateShape]
  );

  return (
    <div
      className={`canvas-container ${
        selectedTool ? "creating-shape" : `cursor-${cursorMode}`
      }`}
    >
      {/* Don't render canvas content if user is not authenticated or dimensions are loading */}
      {!user ? (
        <div className="canvas-loading">
          <div className="loading-spinner"></div>
          <p>Signing out...</p>
        </div>
      ) : dimensionsLoading ? (
        <div className="canvas-loading">
          <div className="loading-spinner"></div>
          <p>Loading canvas...</p>
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
            x={0}
            y={0}
            scaleX={1}
            scaleY={1}
            draggable={false}
            onMouseDown={(e) => {
              handleMouseDown(e);
            }}
            onTouchStart={(e) => {
              handleMouseDown(e);
            }}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onTouchEnd={handleMouseUp}
            onContextMenu={handleContextMenu}
            // Performance optimizations for smooth 60 FPS
            perfectDrawEnabled={false}
            imageSmoothingEnabled={true}
            listening={true}
          >
            <Layer
              clipX={0}
              clipY={0}
              clipWidth={canvasDimensions?.width || 2000}
              clipHeight={canvasDimensions?.height || 2000}
              perfectDrawEnabled={false}
            >
              {/* Canvas Background - Document-style page */}
              <Rect
                x={0}
                y={0}
                width={canvasDimensions?.width || 2000}
                height={canvasDimensions?.height || 2000}
                fill="#ffffff"
                stroke="#e0e0e0"
                strokeWidth={1}
                shadowColor="rgba(0, 0, 0, 0.1)"
                shadowOffset={{ x: 0, y: 2 }}
                shadowBlur={4}
                listening={true}
                onClick={() => selectShape(null)}
                onTap={() => selectShape(null)}
              />

              {/* Invisible overlay to prevent browser default empty canvas behavior */}
              <Rect
                x={0}
                y={0}
                width={canvasDimensions?.width || 2000}
                height={canvasDimensions?.height || 2000}
                fill="transparent"
                listening={false}
              />

              {/* Force content to prevent any default browser icons */}
              <Rect
                x={-1}
                y={-1}
                width={1}
                height={1}
                fill="transparent"
                listening={false}
              />

              {/* Render all shapes */}
              {shapes.map((shape) => {
                const isLockedByOther = isShapeLockedByOther(shape.id);
                const selectedByOther = getShapeSelector(shape.id);
                const isSelected = selectedShapeIds.includes(shape.id);

                // Render text shapes differently
                if (shape.type === "text") {
                  return (
                    <TextBox
                      key={shape.id}
                      x={shape.x}
                      y={shape.y}
                      text={shape.text || "Text"}
                      fontSize={shape.fontSize || 16}
                      fontFamily={shape.fontFamily || "Arial"}
                      fill={shape.color}
                      isSelected={isSelected}
                      isEditing={editingTextId === shape.id}
                      onTextChange={(newText) =>
                        handleTextChange(shape.id, newText)
                      }
                      onEditingChange={(isEditing) =>
                        handleTextEditingChange(shape.id, isEditing)
                      }
                      onSelect={() => handleShapeSelect(shape.id)}
                      onDragEnd={(x, y) => handleTextDragEnd(shape.id, x, y)}
                      onResize={(x, y, width, height) =>
                        handleTextResize(shape.id, x, y, width, height)
                      }
                    />
                  );
                }

                // Render drawing shapes
                if (shape.type === "drawing" && shape.points) {
                  return (
                    <DrawingPath
                      key={shape.id}
                      points={shape.points}
                      stroke={shape.color}
                      strokeWidth={shape.strokeWidth || 3}
                    />
                  );
                }

                // Render regular shapes
                return (
                  <Shape
                    key={shape.id}
                    shape={shape}
                    isSelected={isSelected}
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
                    radius={
                      Math.min(previewShape.width, previewShape.height) / 2
                    }
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

              {/* Multi-select selection box */}
              {selectionBox && (
                <Rect
                  x={selectionBox.x}
                  y={selectionBox.y}
                  width={selectionBox.width}
                  height={selectionBox.height}
                  fill="rgba(33, 150, 243, 0.1)"
                  stroke="#2196f3"
                  strokeWidth={1}
                  dash={[5, 5]}
                  listening={false}
                />
              )}

              {/* Current drawing preview */}
              {isDrawingMode && currentDrawing.length > 2 && (
                <DrawingPath
                  points={currentDrawing}
                  stroke={drawingColor}
                  strokeWidth={drawingStrokeWidth}
                />
              )}
            </Layer>
          </Stage>

          {/* Multiplayer cursors overlay */}
          <MultipleCursors
            canvasState={canvasState}
            stageRef={stageRef}
            projectId={projectId}
          />
        </>
      )}

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={handleCloseContextMenu}
          onCut={handleContextCut}
          onCopy={handleContextCopy}
          onPaste={handleContextPaste}
          canCut={contextMenu.hasSelectedShapes}
          canCopy={contextMenu.hasSelectedShapes}
          canPaste={!contextMenu.hasSelectedShapes && hasClipboardContent}
        />
      )}
    </div>
  );
};
