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
  // Keep cursor visible at all zoom levels
  const scaleFactor = Math.max(0.7, Math.min(1.2, 1 / canvasScale));

  return (
    <div
      className="cursor"
      style={{
        left: x,
        top: y,
        transform: `scale(${scaleFactor})`,
      }}
    >
      {/* Cursor pointer - larger and more visible */}
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        className="cursor-pointer"
      >
        {/* White outline for better contrast */}
        <path
          d="M2 2l8 16 2-6 6-2L2 2z"
          fill="white"
          stroke="rgba(0, 0, 0, 0.3)"
          strokeWidth="1"
        />
        {/* Main cursor color */}
        <path d="M3 3l6 12 1.5-4.5L15 9 3 3z" fill={userColor} />
      </svg>

      {/* User name label with improved readability */}
      <div
        className="cursor-label"
        style={{
          backgroundColor: userColor,
        }}
      >
        <span className="cursor-label-text">{userName}</span>
      </div>
    </div>
  );
};
