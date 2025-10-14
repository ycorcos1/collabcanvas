import { Vector2d } from "konva/lib/types";

export function getRelativePointerPosition(stage: any): Vector2d | null {
  const transform = stage.getAbsoluteTransform().copy();
  transform.invert();
  const pos = stage.getPointerPosition();
  return pos ? transform.point(pos) : null;
}

export function generateRandomColor(): string {
  const colors = [
    "#FF6B6B",
    "#4ECDC4",
    "#45B7D1",
    "#96CEB4",
    "#FECA57",
    "#FF9FF3",
    "#54A0FF",
    "#5F27CD",
    "#00D2D3",
    "#FF9F43",
    "#10AC84",
    "#EE5A24",
    "#0984E3",
    "#A29BFE",
    "#6C5CE7",
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

export function getUserColor(userId: string): string {
  const colors = [
    "#FF6B6B", // Red
    "#4ECDC4", // Teal
    "#45B7D1", // Blue
    "#96CEB4", // Green
    "#FECA57", // Yellow
    "#FF9FF3", // Pink
    "#54A0FF", // Light Blue
    "#5F27CD", // Purple
    "#00D2D3", // Cyan
    "#FF9F43", // Orange
    "#10AC84", // Dark Green
    "#EE5A24", // Dark Orange
    "#0984E3", // Dark Blue
    "#A29BFE", // Light Purple
    "#6C5CE7", // Violet
  ];

  // Create a simple hash from the userId to get consistent colors
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }

  const index = Math.abs(hash) % colors.length;
  return colors[index];
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function distance(
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}
