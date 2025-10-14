import React, { useCallback, useState } from "react";
import { Rect, Circle, Group, Text } from "react-konva";
import { KonvaEventObject } from "konva/lib/Node";
import { Shape as ShapeType } from "../../types/shape";

interface ShapeProps {
  shape: ShapeType;
  isSelected: boolean;
  isPreview?: boolean;
  selectedTool: ShapeType["type"] | null;
  onSelect: (id: string) => void;
  onDragEnd: (id: string, x: number, y: number) => void;
  onDelete: (id: string) => void;
  isLockedByOther?: boolean; // New prop for collaborative locking
  selectedByOther?: { name: string; color: string } | null; // New prop for showing who selected it
}

export const Shape: React.FC<ShapeProps> = React.memo(
  ({
    shape,
    isSelected,
    isPreview = false,
    selectedTool,
    onSelect,
    onDragEnd,
    onDelete,
    isLockedByOther = false,
    selectedByOther = null,
  }) => {
    const [isDragging, setIsDragging] = useState(false);

    const handleClick = useCallback(
      (e: KonvaEventObject<MouseEvent>) => {
        e.cancelBubble = true;
        // Don't allow selection if locked by another user
        if (isLockedByOther) {
          console.log(
            `Shape ${shape.id} is locked by ${selectedByOther?.name}`
          );
          return;
        }
        onSelect(shape.id);
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

    const handleDelete = useCallback(
      (e: KonvaEventObject<MouseEvent>) => {
        e.cancelBubble = true; // Prevent shape selection

        // Reset cursor since trash icon will disappear after deletion
        const stage = e.target.getStage();
        if (stage) {
          stage.container().style.cursor = "";
        }

        onDelete(shape.id);
      },
      [shape.id, onDelete]
    );

    const handleTrashMouseEnter = useCallback(
      (e: KonvaEventObject<MouseEvent>) => {
        // Change cursor to pointer when hovering over trash icon
        const stage = e.target.getStage();
        if (stage) {
          stage.container().style.cursor = "pointer";
        }
      },
      []
    );

    const handleTrashMouseLeave = useCallback(
      (e: KonvaEventObject<MouseEvent>) => {
        // Reset cursor when leaving trash icon
        const stage = e.target.getStage();
        if (stage) {
          stage.container().style.cursor = "";
        }
      },
      []
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
        <Group>
          <Circle
            {...commonProps}
            x={shape.x + shape.width / 2} // Adjust x to center
            y={shape.y + shape.height / 2} // Adjust y to center
            radius={Math.min(shape.width, shape.height) / 2}
          />
          {/* Trash icon for selected circle - only show if selected by current user */}
          {isSelected && !isPreview && !isLockedByOther && (
            <Group
              x={shape.x + shape.width}
              y={shape.y}
              onClick={handleDelete}
              onTap={handleDelete}
              onMouseEnter={handleTrashMouseEnter}
              onMouseLeave={handleTrashMouseLeave}
            >
              {/* Trash icon background */}
              <Circle
                x={0}
                y={0}
                radius={12}
                fill="rgba(255, 255, 255, 0.9)"
                stroke="#ff4444"
                strokeWidth={2}
                shadowColor="rgba(0, 0, 0, 0.2)"
                shadowOffset={{ x: 0, y: 2 }}
                shadowBlur={4}
              />
              {/* Trash icon */}
              <Rect
                x={-6}
                y={-6}
                width={12}
                height={12}
                fill="#ff4444"
                cornerRadius={1}
              />
              <Rect
                x={-4}
                y={-4}
                width={8}
                height={8}
                fill="white"
                cornerRadius={1}
              />
              <Rect x={-3} y={-2} width={2} height={4} fill="#ff4444" />
              <Rect x={1} y={-2} width={2} height={4} fill="#ff4444" />
            </Group>
          )}
          {/* User label for shapes selected by others */}
          {selectedByOther && !isSelected && (
            <Group x={shape.x} y={shape.y - 25}>
              <Rect
                x={0}
                y={0}
                width={selectedByOther.name.length * 8 + 10}
                height={20}
                fill={selectedByOther.color}
                cornerRadius={10}
                opacity={0.9}
              />
              <Text
                x={5}
                y={3}
                text={selectedByOther.name}
                fontSize={12}
                fill="white"
                fontStyle="bold"
              />
            </Group>
          )}
        </Group>
      );
    }

    // Default to rectangle
    return (
      <Group>
        <Rect {...commonProps} width={shape.width} height={shape.height} />
        {/* Trash icon for selected rectangle - only show if selected by current user */}
        {isSelected && !isPreview && !isLockedByOther && (
          <Group
            x={shape.x + shape.width}
            y={shape.y}
            onClick={handleDelete}
            onTap={handleDelete}
            onMouseEnter={handleTrashMouseEnter}
            onMouseLeave={handleTrashMouseLeave}
          >
            {/* Trash icon background */}
            <Circle
              x={0}
              y={0}
              radius={12}
              fill="rgba(255, 255, 255, 0.9)"
              stroke="#ff4444"
              strokeWidth={2}
              shadowColor="rgba(0, 0, 0, 0.2)"
              shadowOffset={{ x: 0, y: 2 }}
              shadowBlur={4}
            />
            {/* Trash icon */}
            <Rect
              x={-6}
              y={-6}
              width={12}
              height={12}
              fill="#ff4444"
              cornerRadius={1}
            />
            <Rect
              x={-4}
              y={-4}
              width={8}
              height={8}
              fill="white"
              cornerRadius={1}
            />
            <Rect x={-3} y={-2} width={2} height={4} fill="#ff4444" />
            <Rect x={1} y={-2} width={2} height={4} fill="#ff4444" />
          </Group>
        )}
        {/* User label for shapes selected by others */}
        {selectedByOther && !isSelected && (
          <Group x={shape.x} y={shape.y - 25}>
            <Rect
              x={0}
              y={0}
              width={selectedByOther.name.length * 8 + 10}
              height={20}
              fill={selectedByOther.color}
              cornerRadius={10}
              opacity={0.9}
            />
            <Text
              x={5}
              y={3}
              text={selectedByOther.name}
              fontSize={12}
              fill="white"
              fontStyle="bold"
            />
          </Group>
        )}
      </Group>
    );
  }
);

Shape.displayName = "Shape";
