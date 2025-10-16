import React, { useState, useRef } from 'react';
import { Shape } from '../../types/shape';
import { ColorPicker } from '../ColorPicker/ColorPicker';
import './FloatingToolbar.css';

/**
 * Floating Toolbar Component - Modern, draggable, minimizable toolbar
 * 
 * Features:
 * - Floating design with modern aesthetics
 * - Draggable positioning
 * - Minimizable/expandable
 * - Organized tool groups
 * - Clean, professional appearance
 */

interface FloatingToolbarProps {
  selectedTool: Shape["type"] | null;
  onToolSelect: (tool: Shape["type"] | null) => void;
  selectedColor: string;
  onColorChange: (color: string) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onDuplicate: () => void;
  hasSelectedShapes: boolean;
  onDeleteSelected: () => void;
  onClearAll: () => void;
  onExportPNG: () => void;
  onExportSVG: () => void;
  onAlignLeft?: () => void;
  onAlignRight?: () => void;
  onAlignCenterH?: () => void;
  onAlignTop?: () => void;
  onAlignBottom?: () => void;
  onAlignCenterV?: () => void;
  onDistributeH?: () => void;
  onDistributeV?: () => void;
  position: { x: number; y: number };
  onPositionChange: (position: { x: number; y: number }) => void;
}

export const FloatingToolbar: React.FC<FloatingToolbarProps> = ({
  selectedTool,
  onToolSelect,
  selectedColor,
  onColorChange,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onDuplicate,
  hasSelectedShapes,
  onDeleteSelected,
  onClearAll,
  onExportPNG,
  onExportSVG,
  onAlignLeft,
  onAlignRight,
  onAlignCenterH,
  onAlignTop,
  onAlignBottom,
  onAlignCenterV,
  onDistributeH,
  onDistributeV,
  position,
  onPositionChange,
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'tools' | 'actions' | 'align'>('tools');
  
  const toolbarRef = useRef<HTMLDivElement>(null);
  const colorButtonRef = useRef<HTMLButtonElement>(null);

  // Handle drag start
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === toolbarRef.current || (e.target as HTMLElement).classList.contains('toolbar-header')) {
      setIsDragging(true);
      const rect = toolbarRef.current!.getBoundingClientRect();
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
        
        // Keep toolbar within viewport bounds
        const maxX = window.innerWidth - 320;
        const maxY = window.innerHeight - 400;
        
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

  const renderToolsTab = () => (
    <div className="toolbar-content">
      <div className="tool-group">
        <div className="tool-group-label">Drawing Tools</div>
        <div className="tool-buttons">
          <button
            className={`tool-btn ${selectedTool === null ? 'active' : ''}`}
            onClick={() => onToolSelect(null)}
            title="Select Tool (V)"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2 2l7 7-3 3 8 8 3-3 7 7H2V2z"/>
            </svg>
          </button>
          
          <button
            className={`tool-btn ${selectedTool === 'rectangle' ? 'active' : ''}`}
            onClick={() => onToolSelect('rectangle')}
            title="Rectangle Tool (R)"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
            </svg>
          </button>
          
          <button
            className={`tool-btn ${selectedTool === 'circle' ? 'active' : ''}`}
            onClick={() => onToolSelect('circle')}
            title="Circle Tool (C)"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="9"/>
            </svg>
          </button>
        </div>
      </div>

      <div className="tool-group">
        <div className="tool-group-label">Color</div>
        <button
          ref={colorButtonRef}
          className="color-btn"
          onClick={() => setIsColorPickerOpen(!isColorPickerOpen)}
          title="Select Color"
        >
          <div className="color-preview" style={{ backgroundColor: selectedColor }} />
          <span>{selectedColor}</span>
        </button>
      </div>
    </div>
  );

  const renderActionsTab = () => (
    <div className="toolbar-content">
      <div className="tool-group">
        <div className="tool-group-label">History</div>
        <div className="tool-buttons">
          <button
            className={`tool-btn ${!canUndo ? 'disabled' : ''}`}
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo (⌘Z)"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 7v6h6"/>
              <path d="m21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13"/>
            </svg>
          </button>
          
          <button
            className={`tool-btn ${!canRedo ? 'disabled' : ''}`}
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo (⌘⇧Z)"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m21 7-6-6v6h-6a9 9 0 0 0-9 9 9 9 0 0 0 9 9h6v-6"/>
            </svg>
          </button>
        </div>
      </div>

      <div className="tool-group">
        <div className="tool-group-label">Edit</div>
        <div className="tool-buttons">
          <button
            className={`tool-btn ${!hasSelectedShapes ? 'disabled' : ''}`}
            onClick={onDuplicate}
            disabled={!hasSelectedShapes}
            title="Duplicate (⌘D)"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="9" y="9" width="13" height="13" rx="2"/>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
            </svg>
          </button>
          
          <button
            className={`tool-btn ${!hasSelectedShapes ? 'disabled' : ''}`}
            onClick={onDeleteSelected}
            disabled={!hasSelectedShapes}
            title="Delete Selected (Del)"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18"/>
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
            </svg>
          </button>
        </div>
      </div>

        <div className="tool-group">
          <div className="tool-group-label">Canvas</div>
          <div className="tool-buttons">
            <button className="tool-btn" onClick={onClearAll} title="Clear All Shapes">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18"/>
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                <line x1="10" y1="11" x2="10" y2="17"/>
                <line x1="14" y1="11" x2="14" y2="17"/>
              </svg>
            </button>
          </div>
        </div>

        <div className="tool-group">
          <div className="tool-group-label">Export</div>
          <div className="tool-buttons">
            <button className="tool-btn" onClick={onExportPNG} title="Export as PNG">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14,2 14,8 20,8"/>
              </svg>
            </button>
            
            <button className="tool-btn" onClick={onExportSVG} title="Export as SVG">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2-2V8z"/>
                <polyline points="14,2 14,8 20,8"/>
                <circle cx="10" cy="12" r="2"/>
              </svg>
            </button>
          </div>
        </div>
    </div>
  );

  const renderAlignTab = () => (
    <div className="toolbar-content">
      {hasSelectedShapes ? (
        <>
          <div className="tool-group">
            <div className="tool-group-label">Horizontal</div>
            <div className="tool-buttons">
              {onAlignLeft && (
                <button className="tool-btn" onClick={onAlignLeft} title="Align Left">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="3" y1="6" x2="21" y2="6"/>
                    <line x1="3" y1="12" x2="15" y2="12"/>
                    <line x1="3" y1="18" x2="18" y2="18"/>
                  </svg>
                </button>
              )}
              {onAlignCenterH && (
                <button className="tool-btn" onClick={onAlignCenterH} title="Center Horizontal">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="2" x2="12" y2="22"/>
                    <rect x="8" y="6" width="8" height="4"/>
                    <rect x="6" y="14" width="12" height="4"/>
                  </svg>
                </button>
              )}
              {onAlignRight && (
                <button className="tool-btn" onClick={onAlignRight} title="Align Right">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="3" y1="6" x2="21" y2="6"/>
                    <line x1="9" y1="12" x2="21" y2="12"/>
                    <line x1="6" y1="18" x2="21" y2="18"/>
                  </svg>
                </button>
              )}
            </div>
          </div>

          <div className="tool-group">
            <div className="tool-group-label">Vertical</div>
            <div className="tool-buttons">
              {onAlignTop && (
                <button className="tool-btn" onClick={onAlignTop} title="Align Top">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="6" y1="3" x2="6" y2="21"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                    <line x1="18" y1="3" x2="18" y2="18"/>
                  </svg>
                </button>
              )}
              {onAlignCenterV && (
                <button className="tool-btn" onClick={onAlignCenterV} title="Center Vertical">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="2" y1="12" x2="22" y2="12"/>
                    <rect x="6" y="8" width="4" height="8"/>
                    <rect x="14" y="6" width="4" height="12"/>
                  </svg>
                </button>
              )}
              {onAlignBottom && (
                <button className="tool-btn" onClick={onAlignBottom} title="Align Bottom">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="6" y1="3" x2="6" y2="21"/>
                    <line x1="12" y1="9" x2="12" y2="21"/>
                    <line x1="18" y1="6" x2="18" y2="21"/>
                  </svg>
                </button>
              )}
            </div>
          </div>

          <div className="tool-group">
            <div className="tool-group-label">Distribute</div>
            <div className="tool-buttons">
              {onDistributeH && (
                <button className="tool-btn" onClick={onDistributeH} title="Distribute Horizontal">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="8" width="4" height="8"/>
                    <rect x="10" y="6" width="4" height="12"/>
                    <rect x="17" y="8" width="4" height="8"/>
                  </svg>
                </button>
              )}
              {onDistributeV && (
                <button className="tool-btn" onClick={onDistributeV} title="Distribute Vertical">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="8" y="3" width="8" height="4"/>
                    <rect x="6" y="10" width="12" height="4"/>
                    <rect x="8" y="17" width="8" height="4"/>
                  </svg>
                </button>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="empty-state">
          <p>Select shapes to see alignment tools</p>
        </div>
      )}
    </div>
  );

  return (
    <div
      ref={toolbarRef}
      className={`floating-toolbar ${isMinimized ? 'minimized' : ''} ${isDragging ? 'dragging' : ''}`}
      style={{
        left: position.x,
        top: position.y,
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="toolbar-header">
        <div className="toolbar-tabs">
          {!isMinimized && (
            <>
              <button
                className={`tab-btn ${activeTab === 'tools' ? 'active' : ''}`}
                onClick={() => setActiveTab('tools')}
              >
                Tools
              </button>
              <button
                className={`tab-btn ${activeTab === 'actions' ? 'active' : ''}`}
                onClick={() => setActiveTab('actions')}
              >
                Actions
              </button>
              <button
                className={`tab-btn ${activeTab === 'align' ? 'active' : ''}`}
                onClick={() => setActiveTab('align')}
              >
                Align
              </button>
            </>
          )}
        </div>
        
        <button
          className="minimize-btn"
          onClick={() => setIsMinimized(!isMinimized)}
          title={isMinimized ? 'Expand Toolbar' : 'Minimize Toolbar'}
        >
          {isMinimized ? '⬆' : '⬇'}
        </button>
      </div>

      {!isMinimized && (
        <>
          {activeTab === 'tools' && renderToolsTab()}
          {activeTab === 'actions' && renderActionsTab()}
          {activeTab === 'align' && renderAlignTab()}
        </>
      )}

      {/* Color Picker */}
      <ColorPicker
        selectedColor={selectedColor}
        onColorChange={onColorChange}
        isOpen={isColorPickerOpen}
        onClose={() => setIsColorPickerOpen(false)}
        anchorEl={colorButtonRef.current}
      />
    </div>
  );
};
