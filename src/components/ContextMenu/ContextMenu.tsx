import React from "react";
import "./ContextMenu.css";

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onCut: () => void;
  onCopy: () => void;
  onPaste: () => void;
  canCut: boolean;
  canCopy: boolean;
  canPaste: boolean;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  x,
  y,
  onClose,
  onCut,
  onCopy,
  onPaste,
  canCut,
  canCopy,
  canPaste,
}) => {
  return (
    <>
      {/* Invisible overlay to close menu when clicking outside */}
      <div className="context-menu-overlay" onClick={onClose} />
      
      {/* Context menu */}
      <div 
        className="context-menu" 
        style={{ left: x, top: y }}
        onContextMenu={(e) => e.preventDefault()}
      >
        <button
          className={`context-menu-item ${!canCut ? 'disabled' : ''}`}
          onClick={canCut ? onCut : undefined}
          disabled={!canCut}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="6" cy="6" r="3"/>
            <circle cx="6" cy="18" r="3"/>
            <line x1="20" y1="4" x2="8.12" y2="15.88"/>
            <line x1="14.47" y1="14.48" x2="20" y2="20"/>
            <line x1="8.12" y1="8.12" x2="12" y2="12"/>
          </svg>
          Cut
          <span className="shortcut">⌘X</span>
        </button>
        
        <button
          className={`context-menu-item ${!canCopy ? 'disabled' : ''}`}
          onClick={canCopy ? onCopy : undefined}
          disabled={!canCopy}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
          </svg>
          Copy
          <span className="shortcut">⌘C</span>
        </button>
        
        <button
          className={`context-menu-item ${!canPaste ? 'disabled' : ''}`}
          onClick={canPaste ? onPaste : undefined}
          disabled={!canPaste}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
            <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
          </svg>
          Paste
          <span className="shortcut">⌘V</span>
        </button>
      </div>
    </>
  );
};
