import React, { useCallback, useState, useEffect, useRef } from "react";
import { Rect, Circle, Group, Text, Transformer } from "react-konva";
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
  }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [realTimeScale, setRealTimeScale] = useState(canvasScale);
    const groupRef = useRef<Konva.Group>(null);
    const shapeRef = useRef<Konva.Rect | Konva.Circle>(null);
    const transformerRef = useRef<Konva.Transformer>(null);

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
        // Pass the original mouse event to get shift key state
        onSelect(shape.id, e.evt);
      },
      [shape.id, onSelect, isLockedByOther, selectedByOther]
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

    const handleTransform = useCallback(() => {
      const shapeNode = shapeRef.current;
      if (shapeNode && onResize) {
        const scaleX = shapeNode.scaleX();
        const scaleY = shapeNode.scaleY();

        // Calculate new dimensions
        const newWidth = Math.max(5, shapeNode.width() * scaleX);
        const newHeight = Math.max(5, shapeNode.height() * scaleY);

        // Reset scale to 1 and apply new dimensions
        shapeNode.scaleX(1);
        shapeNode.scaleY(1);
        shapeNode.width(newWidth);
        shapeNode.height(newHeight);

        onResize(shape.id, shapeNode.x(), shapeNode.y(), newWidth, newHeight);
      }
    }, [onResize, shape.id]);

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

    const commonProps = {
      x: shape.x,
      y: shape.y,
      fill: isPreview ? "rgba(33, 150, 243, 0.3)" : shape.color,
      stroke: isSelected
        ? "#2196f3"
        : selectedByOther
        ? selectedByOther.color
        : isPreview
        ? "#2196f3"
        : "transparent",
      strokeWidth: isSelected ? 3 : selectedByOther ? 3 : isPreview ? 2 : 0,
      strokeScaleEnabled: false,
      draggable: !isPreview && !isLockedByOther, // Disable dragging if locked by another user
      onClick: isPreview ? undefined : handleClick,
      onTap: isPreview ? undefined : handleClick,
      onDragStart: isPreview || isLockedByOther ? undefined : handleDragStart, // Disable drag if locked
      onDragEnd: isPreview || isLockedByOther ? undefined : handleDragEnd, // Disable drag if locked
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
      listening: !isPreview,
      dash: isPreview ? [5, 5] : undefined,
      opacity: isLockedByOther ? 0.7 : 1, // Slightly transparent if locked by another user
    };

    if (shape.type === "circle") {
      return (
        <Group ref={groupRef}>
          <Circle
            ref={shapeRef as React.RefObject<Konva.Circle>}
            x={shape.x + shape.width / 2} // Adjust x to center
            y={shape.y + shape.height / 2} // Adjust y to center
            radius={Math.min(shape.width, shape.height) / 2}
            fill={isPreview ? "rgba(33, 150, 243, 0.3)" : shape.color}
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
            draggable={!isPreview && !isLockedByOther} // Disable dragging if locked by another user
            onClick={isPreview ? undefined : handleClick}
            onTap={isPreview ? undefined : handleClick}
            onDragStart={
              isPreview || isLockedByOther ? undefined : handleDragStart
            } // Disable drag if locked
            onDragEnd={
              isPreview || isLockedByOther
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
                    // For circles, we need to adjust the position back to top-left corner
                    onDragEnd(
                      shape.id,
                      node.x() - shape.width / 2,
                      node.y() - shape.height / 2
                    );
                  }
            } // Disable drag if locked
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
            listening={!isPreview}
            dash={isPreview ? [5, 5] : undefined}
            opacity={isLockedByOther ? 0.7 : 1} // Slightly transparent if locked by another user
          />
          {/* User label for shapes selected by others - positioned as tab above circle */}
          {selectedByOther && !isSelected && (
            <Group
              x={shape.x + shape.width / 2}
              y={
                shape.y +
                shape.height / 2 -
                Math.min(shape.width, shape.height) / 2
              }
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
              onTransform={handleTransform}
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

    // Default to rectangle
    return (
      <Group ref={groupRef}>
        <Rect
          ref={shapeRef as React.RefObject<Konva.Rect>}
          {...commonProps}
          width={shape.width}
          height={shape.height}
        />
        {/* User label for shapes selected by others - positioned as tab on top of outline */}
        {selectedByOther && !isSelected && (
          <Group x={shape.x} y={shape.y} scaleX={uiScale} scaleY={uiScale}>
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
            onTransform={handleTransform}
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
