import React from "react";
import { useCursors } from "../../hooks/useCursors";
import { Cursor } from "./Cursor";
import { CanvasState } from "../../types/canvas";

interface MultipleCursorsProps {
  canvasState: CanvasState;
  stageRef: React.RefObject<any>;
}

export const MultipleCursors: React.FC<MultipleCursorsProps> = ({
  canvasState,
  stageRef,
}) => {
  const { cursors } = useCursors();

  // Convert canvas coordinates to screen coordinates
  const getScreenPosition = (canvasX: number, canvasY: number) => {
    const stage = stageRef.current;
    if (!stage) return { x: 0, y: 0 };

    const transform = stage.getAbsoluteTransform();
    const screenPos = transform.point({ x: canvasX, y: canvasY });

    return {
      x: screenPos.x,
      y: screenPos.y,
    };
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
