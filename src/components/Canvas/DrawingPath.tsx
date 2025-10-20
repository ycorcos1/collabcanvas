import React, { useRef, useCallback } from "react";
import { Line, Group, Transformer } from "react-konva";
import Konva from "konva";

interface DrawingPathProps {
  id?: string;
  x?: number;
  y?: number;
  points: number[];
  stroke: string;
  strokeWidth: number;
  opacity?: number;
  visible?: boolean; // Add visibility support
  isSelected?: boolean;
  onSelect?: () => void;
  onDragEnd?: (id: string, x: number, y: number) => void;
  onResize?: (
    id: string,
    x: number,
    y: number,
    width: number,
    height: number
  ) => void;
  globalCompositeOperation?:
    | "source-over"
    | "source-atop"
    | "source-in"
    | "source-out"
    | "destination-over"
    | "destination-atop"
    | "destination-in"
    | "destination-out"
    | "lighter"
    | "copy"
    | "xor"
    | "multiply"
    | "screen"
    | "overlay"
    | "darken"
    | "lighten"
    | "color-dodge"
    | "color-burn"
    | "hard-light"
    | "soft-light"
    | "difference"
    | "exclusion"
    | "hue"
    | "saturation"
    | "color"
    | "luminosity";
}

export const DrawingPath: React.FC<DrawingPathProps> = ({
  id,
  x = 0,
  y = 0,
  points,
  stroke,
  strokeWidth,
  opacity = 1,
  visible = true,
  isSelected = false,
  onSelect,
  onDragEnd,
  onResize,
  globalCompositeOperation = "source-over",
}) => {
  const groupRef = useRef<Konva.Group>(null);
  const lineRef = useRef<Konva.Line>(null);
  const transformerRef = useRef<Konva.Transformer>(null);

  const handleClick = useCallback(() => {
    if (onSelect) {
      onSelect();
    }
  }, [onSelect]);

  const handleDragEnd = useCallback(
    (e: any) => {
      if (onDragEnd && id) {
        const node = e.target;
        onDragEnd(id, node.x(), node.y());
      }
    },
    [onDragEnd, id]
  );

  const handleTransform = useCallback(() => {
    const lineNode = lineRef.current;
    if (!lineNode || !onResize || !id) return;

    const scaleX = lineNode.scaleX();
    const scaleY = lineNode.scaleY();

    // Scale the points
    const scaledPoints = points.map((coord, i) =>
      i % 2 === 0 ? coord * scaleX : coord * scaleY
    );

    // Calculate bounding box
    const xCoords = scaledPoints.filter((_, i) => i % 2 === 0);
    const yCoords = scaledPoints.filter((_, i) => i % 2 === 1);
    const width = Math.max(...xCoords) - Math.min(...xCoords);
    const height = Math.max(...yCoords) - Math.min(...yCoords);

    // Reset scale
    lineNode.scaleX(1);
    lineNode.scaleY(1);
    lineNode.points(scaledPoints);

    // Report new dimensions
    onResize(id, lineNode.x(), lineNode.y(), width, height);
  }, [points, onResize, id]);

  // Attach transformer when selected
  React.useEffect(() => {
    if (isSelected && onResize) {
      const transformer = transformerRef.current;
      const line = lineRef.current;

      if (transformer && line) {
        transformer.nodes([line]);
        transformer.getLayer()?.batchDraw();
      }
    }
  }, [isSelected, onResize]);

  return (
    <Group
      ref={groupRef}
      x={x}
      y={y}
      visible={visible}
      draggable={!!onDragEnd}
      onDragEnd={handleDragEnd}
    >
      <Line
        ref={lineRef}
        points={points}
        stroke={stroke}
        strokeWidth={strokeWidth}
        tension={0.5}
        lineCap="round"
        lineJoin="round"
        opacity={opacity}
        globalCompositeOperation={globalCompositeOperation}
        onClick={handleClick}
        onTap={handleClick}
      />
      {isSelected && onResize && (
        <Transformer
          ref={transformerRef}
          onTransform={handleTransform}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 5 || newBox.height < 5) return oldBox;
            return newBox;
          }}
          anchorStroke="#4A90E2"
          anchorFill="white"
          anchorSize={8}
          borderStroke="#4A90E2"
          borderDash={[3, 3]}
        />
      )}
    </Group>
  );
};
