import React from "react";
import { useCursors } from "../../hooks/useCursors";
import { Cursor } from "./Cursor";
import { CanvasState } from "../../types/canvas";
import "./MultipleCursors.css";

interface MultipleCursorsProps {
  canvasState: CanvasState;
  stageRef: React.RefObject<any>;
  projectId: string;
}

export const MultipleCursors: React.FC<MultipleCursorsProps> = ({
  canvasState,
  stageRef,
  projectId,
}) => {
  const { cursors } = useCursors(projectId);

  // Position cursor at canvas coordinates - it should stay at the same canvas position regardless of zoom/pan
  const getScreenPosition = (canvasX: number, canvasY: number) => {
    const stage = stageRef.current;
    if (!stage) return { x: 0, y: 0 };

    // Convert canvas coordinates to screen coordinates using the stage transformation
    const transform = stage.getAbsoluteTransform().copy();
    const screenPos = transform.point({ x: canvasX, y: canvasY });

    return screenPos;
  };

  return (
    <div className="multiple-cursors">
      {Object.values(cursors).map((cursor) => {
        const screenPos = getScreenPosition(cursor.x, cursor.y);

        return (
          <Cursor
            key={cursor.userId}
            cursor={{
              ...cursor,
              x: screenPos.x,
              y: screenPos.y,
            }}
            canvasScale={canvasState.scale}
          />
        );
      })}
    </div>
  );
};
