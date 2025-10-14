export interface Shape {
  id: string;
  type: "rectangle" | "circle";
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  createdBy: string;
  createdAt: number;
  updatedAt: number;
  // Selection state for collaborative editing
  selectedBy?: string; // userId of who has this shape selected
  selectedByName?: string; // display name of who has this shape selected
  selectedByColor?: string; // color of who has this shape selected
  selectedAt?: number; // timestamp when selected
}

export interface ShapeUpdate {
  id: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  color?: string;
  updatedAt: number;
}

export type CreateShapeData = Omit<Shape, "id" | "createdAt" | "updatedAt">;
