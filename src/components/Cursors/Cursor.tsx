import React from "react";
import { CursorPosition } from "../../types/cursor";
import "./Cursor.css";

/**
 * Props interface for individual cursor component
 */
interface CursorProps {
  cursor: CursorPosition;
  canvasScale: number;
}

/**
 * Cursor Component - Individual user cursor indicator
 *
 * Displays other users' cursor positions in real-time with:
 * - Traditional arrow cursor icon
 * - User name label with custom color
 * - Automatic scaling based on canvas zoom level
 * - Smooth positioning updates via CSS transforms
 */

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
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill={userColor}
        className="cursor-pointer"
      >
        <path d="M2 2l8 16 2-6 6-2L2 2z" />
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
