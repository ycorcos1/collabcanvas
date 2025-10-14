import React from "react";
import { CursorPosition } from "../../types/cursor";
import "./Cursor.css";

interface CursorProps {
  cursor: CursorPosition;
  canvasScale: number;
}

export const Cursor: React.FC<CursorProps> = ({ cursor, canvasScale }) => {
  const { x, y, userName, userColor } = cursor;

  // Scale factor for cursor size based on canvas zoom
  const scaleFactor = Math.max(0.5, Math.min(1, 1 / canvasScale));

  return (
    <div
      className="cursor"
      style={{
        left: x,
        top: y,
        transform: `scale(${scaleFactor})`,
      }}
    >
      {/* Cursor pointer */}
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill={userColor}
        className="cursor-pointer"
      >
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>

      {/* User name label */}
      <div
        className="cursor-label"
        style={{
          backgroundColor: userColor,
        }}
      >
        {userName}
      </div>
    </div>
  );
};
