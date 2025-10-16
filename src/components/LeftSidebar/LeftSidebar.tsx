import React, { useState, useRef, useEffect } from "react";
import { Shape } from "../../types/shape";
import "./LeftSidebar.css";

/**
 * Left Sidebar Component - Enhanced left panel
 *
 * Features:
 * - File options menu (save, copy, paste, undo, redo, new project)
 * - Pages management with add/rename functionality
 * - Objects panel (replaces layers) with object management
 * - Right-click context menus for objects
 * - Keyboard shortcuts for copy/paste/delete
 */

interface LeftSidebarProps {
  shapes: Shape[];
  selectedShapeIds: string[];
  onSelectShape: (id: string | null, isShiftPressed?: boolean) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onCopy?: () => void;
  onPaste?: () => void;
  onDeleteSelected?: () => void;
  onCreateShape?: (type: "rectangle" | "circle" | "text" | "drawing") => void;
  onRenameShape?: (id: string, newName: string) => void;
  canUndo?: boolean;
  canRedo?: boolean;
  hasClipboardContent?: boolean;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  shapes,
  selectedShapeIds,
  onSelectShape,
  onUndo,
  onRedo,
  onCopy,
  onPaste,
  onDeleteSelected,
  onCreateShape,
  onRenameShape,
  canUndo = false,
  canRedo = false,
  hasClipboardContent = false,
}) => {
  const [activeTab, setActiveTab] = useState<"pages" | "objects">("objects");
  const [showFileMenu, setShowFileMenu] = useState(false);
  const [showObjectTypeMenu, setShowObjectTypeMenu] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    objectId: string;
  } | null>(null);
  const [editingObjectId, setEditingObjectId] = useState<string | null>(null);
  const [editingObjectName, setEditingObjectName] = useState("");
  const [pages, setPages] = useState([{ id: "page1", name: "Page 1" }]);
  const [objectNames, setObjectNames] = useState<Record<string, string>>({});

  const fileMenuRef = useRef<HTMLDivElement>(null);
  const objectTypeMenuRef = useRef<HTMLDivElement>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  // Generate object names with "Object #" format
  const getObjectName = (shape: Shape) => {
    if (objectNames[shape.id]) {
      return objectNames[shape.id];
    }
    
    const sameTypeShapes = shapes.filter(s => s.type === shape.type);
    const index = sameTypeShapes.findIndex(s => s.id === shape.id) + 1;
    return `Object ${index}`;
  };

  // Convert shapes to object items with generated names
  const objects = shapes
    .map((shape) => ({
      ...shape,
      name: getObjectName(shape),
    }))
    .sort((a, b) => b.zIndex - a.zIndex); // Sort by z-index (highest first)

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (fileMenuRef.current && !fileMenuRef.current.contains(event.target as Node)) {
        setShowFileMenu(false);
      }
      if (objectTypeMenuRef.current && !objectTypeMenuRef.current.contains(event.target as Node)) {
        setShowObjectTypeMenu(false);
      }
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
        setContextMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey) {
        switch (event.key) {
          case 'c':
            event.preventDefault();
            if (onCopy) onCopy();
            break;
          case 'v':
            event.preventDefault();
            if (onPaste) onPaste();
            break;
          case 'z':
            event.preventDefault();
            if (event.shiftKey) {
              if (onRedo) onRedo();
            } else {
              if (onUndo) onUndo();
            }
            break;
        }
      } else if (event.key === 'Delete' || event.key === 'Backspace') {
        if (selectedShapeIds.length > 0 && onDeleteSelected) {
          event.preventDefault();
          onDeleteSelected();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedShapeIds, onCopy, onPaste, onUndo, onRedo, onDeleteSelected]);

  const handleObjectClick = (objectId: string, event: React.MouseEvent) => {
    const isShiftPressed = event.shiftKey;
    onSelectShape(objectId, isShiftPressed);
  };

  const handleObjectRightClick = (objectId: string, event: React.MouseEvent) => {
    event.preventDefault();
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      objectId,
    });
  };

  const handleRenameObject = (objectId: string) => {
    const object = objects.find(obj => obj.id === objectId);
    if (object) {
      setEditingObjectId(objectId);
      setEditingObjectName(object.name);
    }
    setContextMenu(null);
  };

  const handleRenameSubmit = () => {
    if (editingObjectId && editingObjectName.trim()) {
      setObjectNames(prev => ({
        ...prev,
        [editingObjectId]: editingObjectName.trim()
      }));
      if (onRenameShape) {
        onRenameShape(editingObjectId, editingObjectName.trim());
      }
    }
    setEditingObjectId(null);
    setEditingObjectName("");
  };

  const handleAddPage = () => {
    const newPageNumber = pages.length + 1;
    const newPage = {
      id: `page${newPageNumber}`,
      name: `Page ${newPageNumber}`
    };
    setPages([...pages, newPage]);
  };

  const handleCreateObject = (type: "rectangle" | "circle" | "text" | "drawing") => {
    if (onCreateShape) {
      onCreateShape(type);
    }
    setShowObjectTypeMenu(false);
  };

  const getObjectIcon = (type: string) => {
    switch (type) {
      case "rectangle":
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" />
          </svg>
        );
      case "circle":
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="9" />
          </svg>
        );
      case "text":
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="4,7 4,4 20,4 20,7" />
            <line x1="9" y1="20" x2="15" y2="20" />
            <line x1="12" y1="4" x2="12" y2="20" />
          </svg>
        );
      case "drawing":
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 5l4 4L8 20l-4-1 1-4L16 4z"/>
            <path d="M13 7l4 4"/>
          </svg>
        );
      default:
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" />
          </svg>
        );
    }
  };

  return (
    <div className="left-sidebar">
      {/* File Options Menu */}
      <div className="sidebar-section file-section">
        <div className="file-menu-container" ref={fileMenuRef}>
          <button 
            className="file-menu-button"
            onClick={() => setShowFileMenu(!showFileMenu)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14,2 14,8 20,8"/>
            </svg>
            File
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6,9 12,15 18,9"/>
            </svg>
          </button>
          
          {showFileMenu && (
            <div className="file-dropdown">
              <button onClick={() => { /* Save functionality */ setShowFileMenu(false); }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                  <polyline points="17,21 17,13 7,13 7,21"/>
                  <polyline points="7,3 7,8 15,8"/>
                </svg>
                Save
                <span className="shortcut">⌘S</span>
              </button>
              <button 
                onClick={() => { if (onCopy) onCopy(); setShowFileMenu(false); }}
                disabled={selectedShapeIds.length === 0}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                </svg>
                Copy
                <span className="shortcut">⌘C</span>
              </button>
              <button 
                onClick={() => { if (onPaste) onPaste(); setShowFileMenu(false); }}
                disabled={!hasClipboardContent}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
                  <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
                </svg>
                Paste
                <span className="shortcut">⌘V</span>
              </button>
              <div className="menu-divider" />
              <button 
                onClick={() => { if (onUndo) onUndo(); setShowFileMenu(false); }}
                disabled={!canUndo}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 7v6h6"/>
                  <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/>
                </svg>
                Undo
                <span className="shortcut">⌘Z</span>
              </button>
              <button 
                onClick={() => { if (onRedo) onRedo(); setShowFileMenu(false); }}
                disabled={!canRedo}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 7v6h-6"/>
                  <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7"/>
                </svg>
                Redo
                <span className="shortcut">⌘⇧Z</span>
              </button>
              <div className="menu-divider" />
              <button onClick={() => { /* New project functionality */ setShowFileMenu(false); }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                  <polyline points="14,2 14,8 20,8"/>
                  <line x1="12" y1="18" x2="12" y2="12"/>
                  <line x1="9" y1="15" x2="15" y2="15"/>
                </svg>
                New Project
                <span className="shortcut">⌘N</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="sidebar-tabs">
        <button
          className={`tab-button ${activeTab === "pages" ? "active" : ""}`}
          onClick={() => setActiveTab("pages")}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14,2 14,8 20,8" />
          </svg>
          Pages
        </button>
        <button
          className={`tab-button ${activeTab === "objects" ? "active" : ""}`}
          onClick={() => setActiveTab("objects")}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
          Objects
        </button>
        <button
          className="add-button"
          onClick={activeTab === "pages" ? handleAddPage : () => setShowObjectTypeMenu(true)}
          title={`Add new ${activeTab === "pages" ? "page" : "object"}`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      </div>

      {/* Object Type Menu */}
      {showObjectTypeMenu && (
        <div className="object-type-menu" ref={objectTypeMenuRef}>
          <div className="object-type-header">Choose object type:</div>
          <button onClick={() => handleCreateObject("rectangle")}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" />
            </svg>
            Rectangle
          </button>
          <button onClick={() => handleCreateObject("circle")}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="9" />
            </svg>
            Circle
          </button>
          <button onClick={() => handleCreateObject("text")}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="4,7 4,4 20,4 20,7" />
              <line x1="9" y1="20" x2="15" y2="20" />
              <line x1="12" y1="4" x2="12" y2="20" />
            </svg>
            Text
          </button>
          <button onClick={() => handleCreateObject("drawing")}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 5l4 4L8 20l-4-1 1-4L16 4z"/>
              <path d="M13 7l4 4"/>
            </svg>
            Drawing
          </button>
        </div>
      )}

      {/* Content Area */}
      <div className="sidebar-content">
        {activeTab === "pages" && (
          <div className="pages-panel">
            {pages.map((page, index) => (
              <div key={page.id} className={`page-item ${index === 0 ? "active" : ""}`}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14,2 14,8 20,8" />
                </svg>
                <span>{page.name}</span>
              </div>
            ))}
          </div>
        )}

        {activeTab === "objects" && (
          <div className="objects-panel">
            {objects.length === 0 ? (
              <div className="empty-objects">
                <p>No objects yet</p>
                <span>Create objects to see them here</span>
              </div>
            ) : (
              <div className="objects-list">
                {objects.map((object) => (
                  <div
                    key={object.id}
                    className={`object-item ${
                      selectedShapeIds.includes(object.id) ? "selected" : ""
                    }`}
                    onClick={(e) => handleObjectClick(object.id, e)}
                    onContextMenu={(e) => handleObjectRightClick(object.id, e)}
                  >
                    <div className="object-content">
                      <div className="object-icon">
                        {getObjectIcon(object.type)}
                      </div>
                      <div className="object-info">
                        {editingObjectId === object.id ? (
                          <input
                            type="text"
                            value={editingObjectName}
                            onChange={(e) => setEditingObjectName(e.target.value)}
                            onBlur={handleRenameSubmit}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleRenameSubmit();
                              if (e.key === 'Escape') {
                                setEditingObjectId(null);
                                setEditingObjectName("");
                              }
                            }}
                            autoFocus
                            className="object-name-input"
                          />
                        ) : (
                          <span className="object-name">{object.name}</span>
                        )}
                      </div>
                      <div className="object-controls">
                        <div
                          className="object-color-preview"
                          style={{ backgroundColor: object.color }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div 
          className="object-context-menu" 
          ref={contextMenuRef}
          style={{ 
            position: 'fixed', 
            left: contextMenu.x, 
            top: contextMenu.y,
            zIndex: 10000
          }}
        >
          <button onClick={() => handleRenameObject(contextMenu.objectId)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            Rename
          </button>
          <button onClick={() => { 
            onSelectShape(contextMenu.objectId);
            if (onCopy) onCopy(); 
            setContextMenu(null);
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
            </svg>
            Copy
          </button>
          <button 
            onClick={() => { 
              if (onPaste) onPaste(); 
              setContextMenu(null);
            }}
            disabled={!hasClipboardContent}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
              <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
            </svg>
            Paste
          </button>
          <div className="menu-divider" />
          <button 
            onClick={() => { 
              onSelectShape(contextMenu.objectId);
              if (onDeleteSelected) onDeleteSelected(); 
              setContextMenu(null);
            }}
            className="delete-button"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3,6 5,6 21,6"/>
              <path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2V6"/>
            </svg>
            Delete
          </button>
        </div>
      )}
    </div>
  );
};
