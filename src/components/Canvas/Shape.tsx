import React, { useCallback, useState, useEffect, useRef } from "react";
import {
  Rect,
  Circle,
  Group,
  Text,
  Transformer,
  Image as KonvaImage,
  Line as KonvaLine,
  Arrow as KonvaArrow,
} from "react-konva";
import { KonvaEventObject } from "konva/lib/Node";
import { Shape as ShapeType } from "../../types/shape";
import Konva from "konva";

interface ShapeProps {
  shape: ShapeType;
  isSelected: boolean;
  isPreview?: boolean;
  selectedTool: ShapeType["type"] | null;
  onSelect: (id: string, event?: MouseEvent) => void;
  onDragEnd: (id: string, x: number, y: number) => void;
  onResize?: (
    id: string,
    x: number,
    y: number,
    width: number,
    height: number
  ) => void;
  isLockedByOther?: boolean; // New prop for collaborative locking
  selectedByOther?: { name: string; color: string } | null; // New prop for showing who selected it
  canvasScale: number; // New prop for canvas zoom scale
  // Whether shapes can be interacted with (drag/select). True only for move cursor.
  canInteract?: boolean;
}

export const Shape: React.FC<ShapeProps> = React.memo(
  ({
    shape,
    isSelected,
    isPreview = false,
    selectedTool,
    onSelect,
    onDragEnd,
    onResize,
    isLockedByOther = false,
    selectedByOther = null,
    canvasScale,
    canInteract,
  }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [realTimeScale, setRealTimeScale] = useState(canvasScale);
    const [isTransforming, setIsTransforming] = useState(false);
    const groupRef = useRef<Konva.Group>(null);
    const shapeRef = useRef<Konva.Rect | Konva.Circle | Konva.Image>(null);
    const [imageObj, setImageObj] = useState<HTMLImageElement | null>(null);
    const transformerRef = useRef<Konva.Transformer>(null);

    // Debug: Log when shape props change
    useEffect(() => {
      if (import.meta.env.DEV) {
        console.log(`[Shape Props Update] ${shape.id}:`, {
          type: shape.type,
          x: shape.x,
          y: shape.y,
          width: shape.width,
          height: shape.height,
        });
      }
    }, [shape.id, shape.x, shape.y, shape.width, shape.height, shape.type]);

    // Attach transformer to shape when selected
    useEffect(() => {
      if (isSelected && !isPreview && selectedTool === null) {
        // Only show transformer when using move tool (selectedTool === null)
        const transformer = transformerRef.current;
        const shape = shapeRef.current;

        if (transformer && shape) {
          transformer.nodes([shape]);
          transformer.getLayer()?.batchDraw();
        }
      }
    }, [isSelected, isPreview, selectedTool]);

    // Update real-time scale by checking the stage scale frequently during interactions
    useEffect(() => {
      const updateScale = () => {
        const group = groupRef.current;
        if (group) {
          const stage = group.getStage();
          if (stage) {
            const currentScale = stage.scaleX();
            if (Math.abs(currentScale - realTimeScale) > 0.01) {
              setRealTimeScale(currentScale);
            }
          }
        }
      };

      // Update scale on animation frame for smooth real-time updates
      let animationId: number;
      const animate = () => {
        updateScale();
        animationId = requestAnimationFrame(animate);
      };
      animate();

      return () => {
        if (animationId) {
          cancelAnimationFrame(animationId);
        }
      };
    }, [realTimeScale]);

    // Also update when canvasScale prop changes (fallback)
    useEffect(() => {
      setRealTimeScale(canvasScale);
    }, [canvasScale]);

    // Sync Konva node properties with shape data after state updates
    // This ensures the visual representation matches the data model
    // Skip during active transforms to avoid fighting with Konva's internal state
    useEffect(() => {
      const node = shapeRef.current;
      if (!node || isPreview || isTransforming || isSelected) return; // Skip if selected (being transformed)

      if (import.meta.env.DEV) {
        console.log(`[Sync Effect] Running for shape ${shape.id}:`, {
          type: shape.type,
          dimensions: {
            x: shape.x,
            y: shape.y,
            w: shape.width,
            h: shape.height,
          },
        });
      }

      // For circles: ensure radius matches shape dimensions
      if (shape.type === "circle" || shape.type === "ellipse") {
        const expectedRadius = Math.min(shape.width, shape.height) / 2;
        const currentRadius = (node as any).radius?.();
        if (currentRadius && Math.abs(currentRadius - expectedRadius) > 0.5) {
          (node as any).radius(expectedRadius);
          node.getLayer()?.batchDraw();
        }
      } else if (
        shape.type === "rectangle" ||
        shape.type === "rect" ||
        shape.type === "image"
      ) {
        // For rectangles/images: ensure width/height match
        const currentWidth = node.width?.();
        const currentHeight = node.height?.();
        if (currentWidth && currentHeight) {
          if (
            Math.abs(currentWidth - shape.width) > 0.5 ||
            Math.abs(currentHeight - shape.height) > 0.5
          ) {
            node.width(shape.width);
            node.height(shape.height);
            node.getLayer()?.batchDraw();
          }
        }
      }

      // Always ensure scale is 1 (transforms should be applied to dimensions, not scale)
      if (node.scaleX() !== 1 || node.scaleY() !== 1) {
        node.scaleX(1);
        node.scaleY(1);
        node.getLayer()?.batchDraw();
      }
    }, [
      shape.x,
      shape.y,
      shape.width,
      shape.height,
      shape.type,
      isPreview,
      isTransforming,
      isSelected,
    ]);

    // Calculate the scale factor for UI elements using real-time scale
    // Enhanced scaling for better readability, especially when zoomed out
    const baseUiScale = 1 / realTimeScale;

    // More aggressive scaling for better readability when zoomed out
    // When zoomed out (canvasScale < 1), make labels larger
    // When zoomed in (canvasScale > 1), make labels smaller but still readable
    const uiScale = Math.max(0.8, Math.min(3.5, baseUiScale));

    // Calculate responsive font size with enhanced scaling for readability
    const baseFontSize = 16; // Larger base size for better readability
    // More aggressive scaling curve to ensure readability at all zoom levels
    const scaledFontSize = baseFontSize * Math.pow(uiScale, 0.75);
    const responsiveFontSize = Math.max(12, Math.min(22, scaledFontSize));

    // Calculate responsive label dimensions - optimized for readability
    const labelWidth = selectedByOther
      ? Math.max(
          80,
          selectedByOther.name.length * (responsiveFontSize * 0.65) + 24
        )
      : 0;
    const labelHeight = responsiveFontSize + 10; // More padding for better appearance

    const handleClick = useCallback(
      (e: KonvaEventObject<MouseEvent>) => {
        e.cancelBubble = true;
        // Don't allow selection if locked by another user
        if (isLockedByOther) {
          return;
        }
        // Pass the native event to check for shift key
        const nativeEvent = e.evt as MouseEvent;
        onSelect(shape.id, nativeEvent);
      },
      [shape.id, onSelect, isLockedByOther]
    );

    const handleDragStart = useCallback((e: KonvaEventObject<DragEvent>) => {
      // Prevent event bubbling to the stage
      e.cancelBubble = true;
      setIsDragging(true);
      // Change cursor to grabbing
      const stage = e.target.getStage();
      if (stage) {
        stage.container().style.cursor = "grabbing";
      }
    }, []);

    const handleDragEnd = useCallback(
      (e: KonvaEventObject<DragEvent>) => {
        const node = e.target;
        // Prevent event bubbling to the stage
        e.cancelBubble = true;
        setIsDragging(false);
        // Reset cursor - let CSS handle the state
        const stage = e.target.getStage();
        if (stage) {
          stage.container().style.cursor = "";
        }
        onDragEnd(shape.id, node.x(), node.y());
      },
      [shape.id, onDragEnd]
    );

    const handleTransformEnd = useCallback(() => {
      const shapeNode = shapeRef.current;
      if (!shapeNode || !onResize) {
        setIsTransforming(false);
        return;
      }

      const scaleX = shapeNode.scaleX();
      const scaleY = shapeNode.scaleY();

      if (import.meta.env.DEV) {
        console.log(`[Transform End] Shape ${shape.id}:`, {
          type: shape.type,
          scale: { x: scaleX, y: scaleY },
          beforeResize: {
            x: shape.x,
            y: shape.y,
            w: shape.width,
            h: shape.height,
          },
        });
      }

      // Handle different shape types with their specific coordinate systems
      if (shape.type === "circle" || shape.type === "ellipse") {
        // Circles use center-based positioning
        // The Circle node is positioned at (safeX + safeWidth/2, safeY + safeHeight/2)
        const currentRadius = (shapeNode as any).radius();
        const newRadius = Math.max(5, currentRadius * Math.max(scaleX, scaleY));

        // Get the current center position
        const centerX = shapeNode.x();
        const centerY = shapeNode.y();

        // Reset scale
        shapeNode.scaleX(1);
        shapeNode.scaleY(1);
        (shapeNode as any).radius(newRadius);

        // Calculate new top-left corner position (what we store in the data model)
        const newSize = newRadius * 2;
        const newX = centerX - newRadius;
        const newY = centerY - newRadius;

        if (import.meta.env.DEV) {
          console.log(`[Circle Resize] Calling onResize with:`, {
            x: newX,
            y: newY,
            width: newSize,
            height: newSize,
          });
        }

        onResize(shape.id, newX, newY, newSize, newSize);
      } else if (
        shape.type === "triangle" ||
        shape.type === "line" ||
        shape.type === "arrow"
      ) {
        // Shapes with points arrays use corner-based positioning with relative points
        // The node is positioned at (safeX, safeY) with points relative to that
        const points = (shapeNode as any).points();
        const newPoints = points.map(
          (coord: number, i: number) => coord * (i % 2 === 0 ? scaleX : scaleY)
        );

        // Calculate bounding box from scaled points
        const xCoords = newPoints.filter((_: number, i: number) => i % 2 === 0);
        const yCoords = newPoints.filter((_: number, i: number) => i % 2 === 1);
        const minX = Math.min(...xCoords);
        const maxX = Math.max(...xCoords);
        const minY = Math.min(...yCoords);
        const maxY = Math.max(...yCoords);

        const newWidth = Math.max(5, maxX - minX);
        const newHeight = Math.max(5, maxY - minY);

        // If points don't start at 0,0, we need to adjust
        // Normalize points to start from 0,0
        const normalizedPoints = [];
        for (let i = 0; i < newPoints.length; i += 2) {
          normalizedPoints.push(newPoints[i] - minX);
          normalizedPoints.push(newPoints[i + 1] - minY);
        }

        // Reset scale and update points
        shapeNode.scaleX(1);
        shapeNode.scaleY(1);
        (shapeNode as any).points(normalizedPoints);

        // Adjust position to account for normalization
        const currentX = shapeNode.x();
        const currentY = shapeNode.y();
        const newX = currentX + minX;
        const newY = currentY + minY;

        // Update node position if it changed
        if (minX !== 0 || minY !== 0) {
          shapeNode.x(newX);
          shapeNode.y(newY);
        }

        onResize(shape.id, newX, newY, newWidth, newHeight);
      } else {
        // Rectangle, image, and other standard shapes with corner-based positioning
        const newWidth = Math.max(5, shapeNode.width() * scaleX);
        const newHeight = Math.max(5, shapeNode.height() * scaleY);

        // Reset scale to 1 and apply new dimensions
        shapeNode.scaleX(1);
        shapeNode.scaleY(1);
        shapeNode.width(newWidth);
        shapeNode.height(newHeight);

        onResize(shape.id, shapeNode.x(), shapeNode.y(), newWidth, newHeight);
      }

      // Reset transforming flag
      setIsTransforming(false);
    }, [onResize, shape.id, shape.type]);

    // Set transforming flag when transform starts
    const handleTransformStart = useCallback(() => {
      setIsTransforming(true);
    }, []);

    const handleMouseEnter = useCallback(
      (e: KonvaEventObject<MouseEvent>) => {
        if (!isPreview && !isDragging && selectedTool) {
          // Only change cursor to grab when hovering over shape AND a tool is selected
          const stage = e.target.getStage();
          if (stage) {
            stage.container().style.cursor = "grab";
          }
        }
      },
      [isPreview, isDragging, selectedTool]
    );

    const handleMouseLeave = useCallback(
      (e: KonvaEventObject<MouseEvent>) => {
        if (!isPreview && !isDragging && selectedTool) {
          // Reset cursor when leaving shape - let CSS handle the state (back to crosshair)
          const stage = e.target.getStage();
          if (stage) {
            stage.container().style.cursor = "";
          }
        }
      },
      [isPreview, isDragging, selectedTool]
    );

    // Check if a shape creation tool is active
    const isShapeToolActive =
      selectedTool &&
      [
        "rectangle",
        "rect",
        "circle",
        "ellipse",
        "triangle",
        "line",
        "arrow",
        "image",
      ].includes(selectedTool);

    // Defensive fallbacks for AI-created or partial shapes
    const safeX = Number.isFinite((shape as any).x) ? (shape as any).x : 0;
    const safeY = Number.isFinite((shape as any).y) ? (shape as any).y : 0;
    const safeWidth = Number.isFinite((shape as any).width)
      ? (shape as any).width
      : 100;
    const safeHeight = Number.isFinite((shape as any).height)
      ? (shape as any).height
      : 100;
    const safeColor = (shape as any).color || (shape as any).fill || "#FF0000";

    const canInteractSafe = canInteract !== undefined ? !!canInteract : true;

    // Check visibility (default to true if not specified)
    const isVisible = shape.visible !== false;

    const commonProps = {
      x: safeX,
      y: safeY,
      visible: isVisible, // Add visibility support
      fill: isPreview ? "rgba(33, 150, 243, 0.3)" : safeColor,
      stroke: isSelected
        ? "#2196f3"
        : selectedByOther
        ? selectedByOther.color
        : isPreview
        ? "#2196f3"
        : "transparent",
      strokeWidth: isSelected ? 3 : selectedByOther ? 3 : isPreview ? 2 : 0,
      strokeScaleEnabled: false,
      draggable:
        !isPreview && !isLockedByOther && !isShapeToolActive && canInteractSafe,
      onClick:
        isPreview || !canInteractSafe || isShapeToolActive
          ? undefined
          : handleClick,
      onTap:
        isPreview || !canInteractSafe || isShapeToolActive
          ? undefined
          : handleClick,
      onDragStart:
        isPreview || isLockedByOther || isShapeToolActive || !canInteractSafe
          ? undefined
          : handleDragStart,
      onDragEnd:
        isPreview || isLockedByOther || isShapeToolActive || !canInteractSafe
          ? undefined
          : handleDragEnd,
      onMouseEnter: isPreview ? undefined : handleMouseEnter,
      onMouseLeave: isPreview ? undefined : handleMouseLeave,
      perfectDrawEnabled: false,
      shadowColor: isSelected
        ? "rgba(33, 150, 243, 0.3)"
        : selectedByOther
        ? `${selectedByOther.color}40`
        : "transparent",
      shadowOffset: { x: 0, y: 2 },
      shadowBlur: isSelected || selectedByOther ? 8 : 0,
      listening: !isPreview && !isShapeToolActive, // Disable listening if shape tool is active
      dash: isPreview ? [5, 5] : undefined,
      opacity: isLockedByOther ? 0.7 : 1, // Slightly transparent if locked by another user
      rotation: shape.rotation || 0, // Apply rotation from shape data
    };

    // Load image when shape.type === "image"
    useEffect(() => {
      if (shape.type === "image" && shape.src) {
        const img = new window.Image();
        img.crossOrigin = "anonymous";
        img.onload = () => setImageObj(img);
        img.src = shape.src;
      }
    }, [shape.type, (shape as any).src]);

    // Handle circle/ellipse shapes (both "circle" and "ellipse" map to the same rendering)
    if (shape.type === "circle" || shape.type === "ellipse") {
      return (
        <Group ref={groupRef} visible={isVisible}>
          <Circle
            ref={shapeRef as React.RefObject<Konva.Circle>}
            x={safeX + safeWidth / 2}
            y={safeY + safeHeight / 2}
            radius={Math.min(safeWidth, safeHeight) / 2}
            fill={isPreview ? "rgba(33, 150, 243, 0.3)" : safeColor}
            stroke={
              isSelected
                ? "#2196f3"
                : selectedByOther
                ? selectedByOther.color
                : isPreview
                ? "#2196f3"
                : "transparent"
            }
            strokeWidth={
              isSelected ? 3 : selectedByOther ? 3 : isPreview ? 2 : 0
            }
            strokeScaleEnabled={false}
            draggable={!isPreview && !isLockedByOther && !isShapeToolActive} // Disable dragging if shape tool is active
            onClick={isPreview || isShapeToolActive ? undefined : handleClick}
            onTap={isPreview || isShapeToolActive ? undefined : handleClick}
            onDragStart={
              isPreview || isLockedByOther || isShapeToolActive
                ? undefined
                : handleDragStart
            }
            onDragEnd={
              isPreview || isLockedByOther || isShapeToolActive
                ? undefined
                : (e: KonvaEventObject<DragEvent>) => {
                    const node = e.target;
                    // Prevent event bubbling to the stage
                    e.cancelBubble = true;
                    setIsDragging(false);
                    // Reset cursor - let CSS handle the state
                    const stage = e.target.getStage();
                    if (stage) {
                      stage.container().style.cursor = "";
                    }
                    // For circles (center-based), convert center to top-left using current props
                    // Use shape width/height to avoid Konva internal radius discrepancies
                    const half = Math.min(safeWidth, safeHeight) / 2;
                    onDragEnd(shape.id, node.x() - half, node.y() - half);
                  }
            }
            onMouseEnter={isPreview ? undefined : handleMouseEnter}
            onMouseLeave={isPreview ? undefined : handleMouseLeave}
            perfectDrawEnabled={false}
            shadowColor={
              isSelected
                ? "rgba(33, 150, 243, 0.3)"
                : selectedByOther
                ? `${selectedByOther.color}40`
                : "transparent"
            }
            shadowOffset={{ x: 0, y: 2 }}
            shadowBlur={isSelected || selectedByOther ? 8 : 0}
            listening={!isPreview && !isShapeToolActive} // Disable listening if shape tool is active
            dash={isPreview ? [5, 5] : undefined}
            opacity={isLockedByOther ? 0.7 : 1} // Slightly transparent if locked by another user
          />
          {/* User label for shapes selected by others - positioned as tab above circle */}
          {selectedByOther && !isSelected && (
            <Group
              x={safeX + safeWidth / 2}
              y={safeY + safeHeight / 2 - Math.min(safeWidth, safeHeight) / 2}
              scaleX={uiScale}
              scaleY={uiScale}
            >
              {/* Tab background with user's color - centered */}
              <Rect
                x={-labelWidth / 2}
                y={-labelHeight}
                width={labelWidth}
                height={labelHeight}
                fill={selectedByOther.color}
                cornerRadius={[6, 6, 0, 0]} // Rounded top corners only for tab effect
                opacity={0.95}
              />
              {/* Tab border/outline - centered */}
              <Rect
                x={-labelWidth / 2}
                y={-labelHeight}
                width={labelWidth}
                height={labelHeight}
                stroke={selectedByOther.color}
                strokeWidth={2}
                cornerRadius={[6, 6, 0, 0]}
                fill="transparent"
              />
              {/* User name text - centered */}
              <Text
                x={-labelWidth / 2 + 10}
                y={-labelHeight + (labelHeight - responsiveFontSize) / 2 + 2}
                text={selectedByOther.name}
                fontSize={responsiveFontSize}
                fill="white"
                fontStyle="bold"
              />
            </Group>
          )}
          {/* Transformer for resize handles when selected and using move tool */}
          {isSelected && !isPreview && selectedTool === null && (
            <Transformer
              ref={transformerRef}
              onTransformStart={handleTransformStart}
              onTransformEnd={handleTransformEnd}
              boundBoxFunc={(oldBox, newBox) => {
                // Minimum size constraints
                if (newBox.width < 5 || newBox.height < 5) {
                  return oldBox;
                }
                return newBox;
              }}
              anchorStroke="#2196f3"
              anchorFill="white"
              anchorSize={8}
              borderEnabled={false}
            />
          )}
        </Group>
      );
    }

    // Render triangle
    if (shape.type === "triangle") {
      return (
        <Group ref={groupRef} x={0} y={0} visible={isVisible}>
          <KonvaLine
            ref={shapeRef as React.RefObject<any>}
            x={safeX}
            y={safeY}
            points={[
              safeWidth / 2,
              0, // top
              safeWidth,
              safeHeight, // bottom right
              0,
              safeHeight, // bottom left
            ]}
            fill={isPreview ? "rgba(33, 150, 243, 0.3)" : safeColor}
            stroke={
              isSelected ? "#2196f3" : isPreview ? "#2196f3" : "transparent"
            }
            strokeWidth={isSelected ? 3 : isPreview ? 2 : 0}
            closed
            draggable={!isPreview && !isLockedByOther && !isShapeToolActive}
            onClick={isPreview || isShapeToolActive ? undefined : handleClick}
            onTap={isPreview || isShapeToolActive ? undefined : handleClick}
            onDragStart={
              isPreview || isLockedByOther || isShapeToolActive
                ? undefined
                : handleDragStart
            }
            onDragEnd={
              isPreview || isLockedByOther || isShapeToolActive
                ? undefined
                : handleDragEnd
            }
            perfectDrawEnabled={false}
            listening={!isPreview && !isShapeToolActive}
            rotation={shape.rotation || 0}
          />
          {isSelected && !isPreview && selectedTool === null && (
            <Transformer
              ref={transformerRef}
              onTransformStart={handleTransformStart}
              onTransformEnd={handleTransformEnd}
              boundBoxFunc={(oldBox, newBox) => {
                if (newBox.width < 5 || newBox.height < 5) return oldBox;
                return newBox;
              }}
              anchorStroke="#2196f3"
              anchorFill="white"
              anchorSize={8}
              borderEnabled={false}
            />
          )}
        </Group>
      );
    }

    // Render line
    if (shape.type === "line") {
      return (
        <Group ref={groupRef} x={0} y={0} visible={isVisible}>
          <KonvaLine
            ref={shapeRef as React.RefObject<any>}
            x={safeX}
            y={safeY}
            points={[0, 0, safeWidth, safeHeight]}
            stroke={safeColor}
            strokeWidth={Math.max(2, Math.min(safeWidth, safeHeight) * 0.1)}
            shadowColor={isSelected ? "#2196f3" : "transparent"}
            shadowBlur={isSelected ? 8 : 0}
            draggable={!isPreview && !isLockedByOther && !isShapeToolActive}
            onClick={isPreview || isShapeToolActive ? undefined : handleClick}
            onTap={isPreview || isShapeToolActive ? undefined : handleClick}
            onDragStart={
              isPreview || isLockedByOther || isShapeToolActive
                ? undefined
                : handleDragStart
            }
            onDragEnd={
              isPreview || isLockedByOther || isShapeToolActive
                ? undefined
                : handleDragEnd
            }
            perfectDrawEnabled={false}
            listening={!isPreview && !isShapeToolActive}
            rotation={shape.rotation || 0}
          />
          {isSelected && !isPreview && selectedTool === null && (
            <Transformer
              ref={transformerRef}
              onTransformStart={handleTransformStart}
              onTransformEnd={handleTransformEnd}
              boundBoxFunc={(oldBox, newBox) => {
                if (newBox.width < 5 || newBox.height < 5) return oldBox;
                return newBox;
              }}
              anchorStroke="#2196f3"
              anchorFill="white"
              anchorSize={8}
              borderEnabled={false}
            />
          )}
        </Group>
      );
    }

    // Render arrow
    if (shape.type === "arrow") {
      return (
        <Group ref={groupRef} x={0} y={0} visible={isVisible}>
          <KonvaArrow
            ref={shapeRef as React.RefObject<any>}
            x={safeX}
            y={safeY}
            points={[0, 0, safeWidth, safeHeight]}
            stroke={safeColor}
            fill={safeColor}
            strokeWidth={Math.max(2, Math.min(safeWidth, safeHeight) * 0.1)}
            pointerLength={10}
            pointerWidth={10}
            shadowColor={isSelected ? "#2196f3" : "transparent"}
            shadowBlur={isSelected ? 8 : 0}
            draggable={!isPreview && !isLockedByOther && !isShapeToolActive}
            onClick={isPreview || isShapeToolActive ? undefined : handleClick}
            onTap={isPreview || isShapeToolActive ? undefined : handleClick}
            onDragStart={
              isPreview || isLockedByOther || isShapeToolActive
                ? undefined
                : handleDragStart
            }
            onDragEnd={
              isPreview || isLockedByOther || isShapeToolActive
                ? undefined
                : handleDragEnd
            }
            perfectDrawEnabled={false}
            listening={!isPreview && !isShapeToolActive}
            rotation={shape.rotation || 0}
          />
          {isSelected && !isPreview && selectedTool === null && (
            <Transformer
              ref={transformerRef}
              onTransformStart={handleTransformStart}
              onTransformEnd={handleTransformEnd}
              boundBoxFunc={(oldBox, newBox) => {
                if (newBox.width < 5 || newBox.height < 5) return oldBox;
                return newBox;
              }}
              anchorStroke="#2196f3"
              anchorFill="white"
              anchorSize={8}
              borderEnabled={false}
            />
          )}
        </Group>
      );
    }

    // Render image
    if (shape.type === "image") {
      return (
        <Group ref={groupRef} visible={isVisible}>
          <KonvaImage
            ref={shapeRef as React.RefObject<Konva.Image>}
            x={safeX}
            y={safeY}
            width={safeWidth}
            height={safeHeight}
            image={imageObj || undefined}
            draggable={!isPreview && !isLockedByOther && !isShapeToolActive}
            onClick={isPreview || isShapeToolActive ? undefined : handleClick}
            onTap={isPreview || isShapeToolActive ? undefined : handleClick}
            onDragStart={
              isPreview || isLockedByOther || isShapeToolActive
                ? undefined
                : handleDragStart
            }
            onDragEnd={
              isPreview || isLockedByOther || isShapeToolActive
                ? undefined
                : handleDragEnd
            }
            rotation={shape.rotation || 0}
            perfectDrawEnabled={false}
            listening={!isPreview && !isShapeToolActive}
            opacity={isLockedByOther ? 0.9 : 1}
          />
          {isSelected && !isPreview && selectedTool === null && (
            <Transformer
              ref={transformerRef}
              onTransformStart={handleTransformStart}
              onTransformEnd={handleTransformEnd}
              boundBoxFunc={(oldBox, newBox) => {
                if (newBox.width < 10 || newBox.height < 10) {
                  return oldBox;
                }
                return newBox;
              }}
              anchorStroke="#2196f3"
              anchorFill="white"
              anchorSize={8}
              borderEnabled={false}
            />
          )}
        </Group>
      );
    }

    // Default to rectangle
    return (
      <Group ref={groupRef}>
        <Rect
          ref={shapeRef as React.RefObject<Konva.Rect>}
          {...commonProps}
          width={safeWidth}
          height={safeHeight}
        />
        {/* User label for shapes selected by others - positioned as tab on top of outline */}
        {selectedByOther && !isSelected && (
          <Group x={safeX} y={safeY} scaleX={uiScale} scaleY={uiScale}>
            {/* Tab background with user's color */}
            <Rect
              x={0}
              y={-labelHeight}
              width={labelWidth}
              height={labelHeight}
              fill={selectedByOther.color}
              cornerRadius={[6, 6, 0, 0]} // Rounded top corners only for tab effect
              opacity={0.95}
            />
            {/* Tab border/outline */}
            <Rect
              x={0}
              y={-labelHeight}
              width={labelWidth}
              height={labelHeight}
              stroke={selectedByOther.color}
              strokeWidth={2}
              cornerRadius={[6, 6, 0, 0]}
              fill="transparent"
            />
            {/* User name text */}
            <Text
              x={8}
              y={-labelHeight + (labelHeight - responsiveFontSize) / 2 + 2}
              text={selectedByOther.name}
              fontSize={responsiveFontSize}
              fill="white"
              fontStyle="bold"
            />
          </Group>
        )}
        {/* Transformer for resize handles when selected and using move tool */}
        {isSelected && !isPreview && selectedTool === null && (
          <Transformer
            ref={transformerRef}
            onTransformStart={handleTransformStart}
            onTransformEnd={handleTransformEnd}
            boundBoxFunc={(oldBox, newBox) => {
              // Minimum size constraints
              if (newBox.width < 5 || newBox.height < 5) {
                return oldBox;
              }
              return newBox;
            }}
            anchorStroke="#2196f3"
            anchorFill="white"
            anchorSize={8}
            borderStroke="#2196f3"
            borderDash={[3, 3]}
          />
        )}
      </Group>
    );
  }
);

Shape.displayName = "Shape";
