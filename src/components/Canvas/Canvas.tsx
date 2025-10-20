import React, { useRef, useEffect, useState, useCallback } from "react";
import {
  Stage,
  Layer,
  Rect,
  Circle,
  Line as KonvaLine,
  Arrow as KonvaArrow,
} from "react-konva";
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
import { AlignmentGuides, calculateAlignmentGuides } from "./AlignmentGuides";
import { Grid, snapShapeToGrid } from "./Grid";
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
  selectShape: (id: string | null, event?: MouseEvent) => Promise<void> | void;
  isShapeLockedByOther: (shapeId: string) => boolean;
  getShapeSelector: (shapeId: string) => { name: string; color: string } | null;
  cursorMode?: string;
  currentColor?: string;
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
  // Grid and alignment guides
  showGrid?: boolean;
  gridSize?: 10 | 20 | 50;
  snapToGridEnabled?: boolean;
  onToggleGrid?: () => void;
  onToggleSnap?: () => void;
  onGridSizeChange?: (size: 10 | 20 | 50) => void;
  // Notify parent after a shape is created successfully
  onShapeCreated?: () => void;
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
  currentColor,
  onCut,
  onCopy,
  onPaste,
  hasClipboardContent = false,
  projectId,
  onStageRef,
  canvasState: propCanvasState,
  updateCanvasState: propUpdateCanvasState,
  showGrid: showGridProp = false,
  gridSize: gridSizeProp = 20,
  snapToGridEnabled: snapToGridEnabledProp = false,
  onShapeCreated,
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
  // Guard to prevent background deselect immediately after marquee complete
  const justSelectedRef = useRef(false);

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
  const [textDragBox, setTextDragBox] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  // Drawing state
  const [isDrawingMode] = useState(false);
  const [currentDrawing] = useState<number[]>([]);

  // Alignment guides and grid state
  const [alignmentGuides, setAlignmentGuides] = useState<any[]>([]);
  // Use props for grid settings (allow parent to control)
  const showGrid = showGridProp;
  const gridSize = gridSizeProp;
  const snapToGridEnabled = snapToGridEnabledProp;
  const [drawingColor] = useState("#FF0000");
  const [drawingStrokeWidth] = useState(3);
  // Drawing opacity unused after drawing removal

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

        // Handle text tool - start drag box to size textbox
        if (
          cursorMode === "text" &&
          pos.x >= 0 &&
          pos.x <= (canvasDimensions?.width || 2000) &&
          pos.y >= 0 &&
          pos.y <= (canvasDimensions?.height || 2000)
        ) {
          setDrawStartPos(pos);
          setTextDragBox({ x: pos.x, y: pos.y, width: 0, height: 0 });
          return;
        }

        // Drawing tool disabled

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
            color: currentColor || "#FF0000", // Toolbar-selected color for new shapes
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
    [
      user,
      selectedTool,
      selectShape,
      cursorMode,
      canvasDimensions,
      createShape,
      currentColor,
    ]
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

      // Handle multi-select box (live-update selection while dragging)
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

        // Live multi-select: detect intersecting shapes and select them during drag
        try {
          const boxRight = x + width;
          const boxBottom = y + height;
          const selectedIds = shapes
            .filter((shape) => {
              const shapeRight = (shape.x || 0) + (shape.width || 0);
              const shapeBottom = (shape.y || 0) + (shape.height || 0);
              return !(
                (shape.x || 0) > boxRight ||
                shapeRight < x ||
                (shape.y || 0) > boxBottom ||
                shapeBottom < y
              );
            })
            .map((s) => s.id);

          if (selectedIds.length > 0) {
            window.dispatchEvent(
              new CustomEvent("canvas:selectShapes", {
                detail: { ids: selectedIds },
              })
            );
          }
        } catch {}
        return;
      }

      // Drawing tool disabled

      // Handle text drag box sizing
      if (textDragBox && drawStartPos) {
        const startX = drawStartPos.x;
        const startY = drawStartPos.y;
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
        const x = Math.min(startX, endX);
        const y = Math.min(startY, endY);
        setTextDragBox({
          x,
          y,
          width: Math.max(50, width),
          height: Math.max(24, height),
        });
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
          try {
            // Prefer new multi-select API if available
            // @ts-ignore - hook now exports selectShapes
            if (
              typeof (selectShape as any) === "function" &&
              (selectShape as any).length !== 1
            ) {
              // no-op fallback
            }
          } catch {}
          // Use global window event to call multi-select via page (avoids import changes)
          try {
            window.dispatchEvent(
              new CustomEvent("canvas:selectShapes", {
                detail: { ids: selectedIds },
              })
            );
          } catch {}
        }

        setIsSelecting(false);
        setSelectionBox(null);
        setDrawStartPos(null);
        // Prevent background click from clearing selection this frame
        justSelectedRef.current = true;
        setTimeout(() => {
          justSelectedRef.current = false;
        }, 0);
        return;
      }

      // Drawing tool disabled

      // Finish text drag box or click -> create textbox and enter edit
      if (textDragBox && drawStartPos) {
        const w = Math.max(50, textDragBox.width);
        const h = Math.max(24, textDragBox.height);
        // Detect click vs drag
        const dx = Math.abs(textDragBox.x - drawStartPos.x);
        const dy = Math.abs(textDragBox.y - drawStartPos.y);
        const dragDistance = Math.hypot(dx, dy);
        const isClickOnly = dragDistance < 8 || (Math.abs(w) < 8 && Math.abs(h) < 8);

        const boxX = isClickOnly ? drawStartPos.x : textDragBox.x;
        const boxY = isClickOnly ? drawStartPos.y : textDragBox.y;
        const boxW = isClickOnly ? 200 : w;
        const boxH = isClickOnly ? 50 : h;

        const textShape = {
          type: "text" as const,
          x: boxX,
          y: boxY,
          width: boxW,
          height: boxH,
          color: currentColor || "#FF0000",
          text: "",
          fontSize: 16,
          fontFamily: "Inter",
          createdBy: user!.id,
        };
        try {
          const created = await createShape(textShape);
          if (created) {
            setEditingTextId(created.id);
            selectShape(created.id);
            if (onShapeCreated) onShapeCreated();
          }
        } catch (err) {
          console.error("Failed to create text box:", err);
        }
        setTextDragBox(null);
        setDrawStartPos(null);
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
            if (onShapeCreated) onShapeCreated();
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
      currentColor,
      textDragBox,
      setEditingTextId,
    ]
  );

  // Pass-through selection (parent handles shift-click)

  // TODO: Handle shape drag move (for real-time alignment guides while dragging)
  // This would require modifying the Shape component to support onDragMove callback
  // For now, alignment guides only appear on snap (drag end)

  // Handle shape drag end
  const handleShapeDragEnd = useCallback(
    (shapeId: string, x: number, y: number) => {
      // Clear alignment guides
      setAlignmentGuides([]);

      // Get the shape to know its dimensions
      const shape = shapes.find((s) => s.id === shapeId);
      if (!shape) return;

      // Apply snap-to-grid if enabled
      let finalX = x;
      let finalY = y;

      if (snapToGridEnabled) {
        const snapped = snapShapeToGrid(
          { x, y, width: shape.width, height: shape.height },
          gridSize,
          true
        );
        finalX = snapped.x;
        finalY = snapped.y;
      } else {
        // Apply snap-to-shape alignment
        const otherShapes = shapes
          .filter((s) => s.id !== shapeId)
          .map((s) => ({
            id: s.id,
            x: s.x,
            y: s.y,
            width: s.width,
            height: s.height,
          }));

        const { snapX, snapY } = calculateAlignmentGuides(
          { x, y, width: shape.width, height: shape.height },
          otherShapes,
          5,
          canvasDimensions || { width: 2000, height: 2000 }
        );

        if (snapX !== null) finalX = snapX;
        if (snapY !== null) finalY = snapY;
      }

      // Define minimum visible area (at least 20px should remain visible)
      const minVisible = 20;

      // Calculate constrained position
      const maxX = (canvasDimensions?.width || 2000) - minVisible;
      const maxY = (canvasDimensions?.height || 2000) - minVisible;
      const minX = minVisible - shape.width;
      const minY = minVisible - shape.height;

      // Constrain the position
      const constrainedX = Math.max(minX, Math.min(maxX, finalX));
      const constrainedY = Math.max(minY, Math.min(maxY, finalY));

      updateShape(shapeId, { x: constrainedX, y: constrainedY });
    },
    [updateShape, shapes, canvasDimensions, snapToGridEnabled, gridSize]
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
                onClick={() => {
                  if (isSelecting || justSelectedRef.current) return;
                  selectShape(null);
                }}
                onTap={() => {
                  if (isSelecting || justSelectedRef.current) return;
                  selectShape(null);
                }}
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

              {/* Grid overlay */}
              <Grid
                width={canvasDimensions?.width || 2000}
                height={canvasDimensions?.height || 2000}
                gridSize={gridSize}
                visible={showGrid}
                opacity={0.15}
              />

              {/* Alignment guides */}
              <AlignmentGuides
                guides={alignmentGuides}
                canvasDimensions={
                  canvasDimensions || { width: 2000, height: 2000 }
                }
              />

              {/* Render all shapes (sorted by zIndex) */}
              {[...shapes]
                .sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0))
                .map((shape) => {
                  const isLockedByOther = isShapeLockedByOther(shape.id);
                  const selectedByOther = getShapeSelector(shape.id);
                  const isSelected = selectedShapeIds.includes(shape.id);
                  const canInteract = cursorMode === "move"; // Only move cursor allows interactions

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
                        width={Math.max(50, shape.width || 200)}
                        height={Math.max(24, shape.height || 50)}
                        align="left"
                        lineHeight={1.2}
                        isSelected={isSelected}
                        isEditing={editingTextId === shape.id}
                        visible={shape.visible !== false}
                        onTextChange={(newText) =>
                          handleTextChange(shape.id, newText)
                        }
                        onEditingChange={(isEditing) =>
                          handleTextEditingChange(shape.id, isEditing)
                        }
                        onSelect={(evt?: any) =>
                          selectShape(shape.id, evt?.evt as MouseEvent)
                        }
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
                        id={shape.id}
                        x={shape.x || 0}
                        y={shape.y || 0}
                        points={shape.points}
                        stroke={shape.color}
                        strokeWidth={shape.strokeWidth || 3}
                        opacity={(shape as any).opacity || 1}
                        visible={shape.visible !== false}
                        isSelected={isSelected}
                        onSelect={() => selectShape(shape.id)}
                        onDragEnd={(id, x, y) => handleShapeDragEnd(id, x, y)}
                        onResize={(id, x, y, width, height) =>
                          handleShapeResize(id, x, y, width, height)
                        }
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
                      onSelect={selectShape}
                      onDragEnd={handleShapeDragEnd}
                      onResize={handleShapeResize}
                      isLockedByOther={isLockedByOther}
                      selectedByOther={selectedByOther}
                      canvasScale={canvasState.scale}
                      canInteract={canInteract}
                    />
                  );
                })}

              {/* Preview shape while drawing */}
              {previewShape &&
                (previewShape.type === "circle" ||
                previewShape.type === "ellipse" ? (
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
                ) : previewShape.type === "triangle" ? (
                  <KonvaLine
                    points={[
                      previewShape.x + previewShape.width / 2,
                      previewShape.y,
                      previewShape.x + previewShape.width,
                      previewShape.y + previewShape.height,
                      previewShape.x,
                      previewShape.y + previewShape.height,
                    ]}
                    fill="rgba(33, 150, 243, 0.3)"
                    stroke="#2196f3"
                    strokeWidth={2}
                    dash={[5, 5]}
                    closed
                    listening={false}
                  />
                ) : previewShape.type === "line" ? (
                  <KonvaLine
                    points={[
                      previewShape.x,
                      previewShape.y,
                      previewShape.x + previewShape.width,
                      previewShape.y + previewShape.height,
                    ]}
                    stroke="#2196f3"
                    strokeWidth={2}
                    dash={[5, 5]}
                    listening={false}
                  />
                ) : previewShape.type === "arrow" ? (
                  <KonvaArrow
                    points={[
                      previewShape.x,
                      previewShape.y,
                      previewShape.x + previewShape.width,
                      previewShape.y + previewShape.height,
                    ]}
                    stroke="#2196f3"
                    fill="#2196f3"
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

              {/* Drawing tool disabled */}
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
