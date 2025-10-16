import React from "react";
import { Line } from "react-konva";

interface DrawingPathProps {
  points: number[];
  stroke: string;
  strokeWidth: number;
  globalCompositeOperation?: "source-over" | "source-atop" | "source-in" | "source-out" | "destination-over" | "destination-atop" | "destination-in" | "destination-out" | "lighter" | "copy" | "xor" | "multiply" | "screen" | "overlay" | "darken" | "lighten" | "color-dodge" | "color-burn" | "hard-light" | "soft-light" | "difference" | "exclusion" | "hue" | "saturation" | "color" | "luminosity";
}

export const DrawingPath: React.FC<DrawingPathProps> = ({
  points,
  stroke,
  strokeWidth,
  globalCompositeOperation = "source-over",
}) => {
  return (
    <Line
      points={points}
      stroke={stroke}
      strokeWidth={strokeWidth}
      tension={0.5}
      lineCap="round"
      lineJoin="round"
      globalCompositeOperation={globalCompositeOperation}
    />
  );
};
