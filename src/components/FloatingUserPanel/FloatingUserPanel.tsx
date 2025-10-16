import React, { useState, useRef } from 'react';
import { UserPresence } from '../Presence/UserPresence';
import './FloatingUserPanel.css';

/**
 * Floating User Panel Component - Modern, draggable user presence panel
 * 
 * Features:
 * - Floating design with modern aesthetics
 * - Draggable positioning
 * - Minimizable/expandable
 * - User presence indicators
 * - Clean, professional appearance
 */

interface FloatingUserPanelProps {
  position: { x: number; y: number };
  onPositionChange: (position: { x: number; y: number }) => void;
}

export const FloatingUserPanel: React.FC<FloatingUserPanelProps> = ({
  position,
  onPositionChange,
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  const panelRef = useRef<HTMLDivElement>(null);

  // Handle drag start
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === panelRef.current || (e.target as HTMLElement).classList.contains('panel-header')) {
      setIsDragging(true);
      const rect = panelRef.current!.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  // Handle drag move
  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const newX = e.clientX - dragOffset.x;
        const newY = e.clientY - dragOffset.y;
        
        // Keep panel within viewport bounds
        const panelWidth = 280;
        const panelHeight = 200;
        const maxX = Math.max(0, window.innerWidth - panelWidth);
        const maxY = Math.max(0, window.innerHeight - panelHeight);
        
        onPositionChange({
          x: Math.max(0, Math.min(newX, maxX)),
          y: Math.max(0, Math.min(newY, maxY)),
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset, onPositionChange]);

  return (
    <div
      ref={panelRef}
      className={`floating-user-panel ${isMinimized ? 'minimized' : ''} ${isDragging ? 'dragging' : ''}`}
      style={{
        left: position.x,
        top: position.y,
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="panel-header">
        <div className="panel-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
          <span>Online</span>
        </div>
        
        <button
          className="minimize-btn"
          onClick={() => setIsMinimized(!isMinimized)}
          title={isMinimized ? 'Expand Panel' : 'Minimize Panel'}
        >
          {isMinimized ? '⬆' : '⬇'}
        </button>
      </div>

      {!isMinimized && (
        <div className="panel-content">
          <div className="user-presence-wrapper">
            <UserPresence />
          </div>
        </div>
      )}
    </div>
  );
};
