import React, { useState } from "react";
import { Shape } from "../../types/shape";
import "./LeftSidebar.css";

/**
 * Left Sidebar Component - Modern left panel
 *
 * Features:
 * - File/project management
 * - Pages navigation
 * - Layers panel
 * - Assets panel
 */

interface LeftSidebarProps {
  shapes: Shape[];
  selectedShapeIds: string[];
  onSelectShape: (id: string | null, isShiftPressed?: boolean) => void;
  projectName: string;
  onSave?: () => void;
  onCopy?: () => void;
  onPaste?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onNewProject?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  hasClipboardContent?: boolean;
  onCreateObject?: (type: 'shape' | 'text' | 'brush') => void;
  onRenameObject?: (id: string, newName: string) => void;
  onDeleteObject?: (id: string) => void;
  onCopyObject?: (id: string) => void;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  shapes,
  selectedShapeIds,
  onSelectShape,
  projectName,
  onSave,
  onCopy,
  onPaste,
  onUndo,
  onRedo,
  onNewProject,
  canUndo = false,
  canRedo = false,
  hasClipboardContent = false,
  onCreateObject,
  onRenameObject,
  onDeleteObject,
  onCopyObject,
}) => {
  const [activeTab, setActiveTab] = useState<"pages" | "objects">("objects");
  const [showFileActions, setShowFileActions] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingObjectId, setEditingObjectId] = useState<string | null>(null);
  const [editingObjectName, setEditingObjectName] = useState("");

  // Convert shapes to object items with Object # naming
  const objects = shapes
    .map((shape, index) => ({
      ...shape,
      name: shape.text && shape.type === 'text' ? shape.text : `Object ${index + 1}`,
    }))
    .sort((a, b) => b.zIndex - a.zIndex); // Sort by z-index (highest first)

  // Handle object creation
  const handleCreateObject = (type: 'shape' | 'text' | 'brush') => {
    if (onCreateObject) {
      onCreateObject(type);
    }
    setShowCreateDialog(false);
  };

  // Handle object rename
  const handleRenameStart = (objectId: string, currentName: string) => {
    setEditingObjectId(objectId);
    setEditingObjectName(currentName);
  };

  const handleRenameSubmit = () => {
    if (editingObjectId && onRenameObject) {
      onRenameObject(editingObjectId, editingObjectName);
    }
    setEditingObjectId(null);
    setEditingObjectName("");
  };

  const handleRenameCancel = () => {
    setEditingObjectId(null);
    setEditingObjectName("");
  };

  // Handle object context menu
  const handleObjectRightClick = (e: React.MouseEvent, objectId: string) => {
    e.preventDefault();
    // For now, just copy the object on right-click
    // TODO: Implement proper context menu
    if (onCopyObject) {
      onCopyObject(objectId);
    }
  };

  // Handle object deletion with keyboard
  const handleObjectKeyDown = (e: React.KeyboardEvent, objectId: string) => {
    if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      if (onDeleteObject) {
        onDeleteObject(objectId);
      }
    }
  };

  const handleLayerClick = (layerId: string, event: React.MouseEvent) => {
    const isShiftPressed = event.shiftKey;
    onSelectShape(layerId, isShiftPressed);
  };

  const getLayerIcon = (type: string) => {
    switch (type) {
      case "rectangle":
        return (
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" />
          </svg>
        );
      case "circle":
        return (
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="9" />
          </svg>
        );
      default:
        return (
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" />
          </svg>
        );
    }
  };

  return (
    <div className="left-sidebar">
      {/* File Actions Section */}
      <div className="sidebar-section file-actions-section">
        <div className="file-actions-header">
          <button 
            className="file-menu-button"
            onClick={() => setShowFileActions(!showFileActions)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12h18m-9-9v18"/>
            </svg>
            {projectName}
          </button>
        </div>
        
        {showFileActions && (
          <div className="file-actions-dropdown">
            <button onClick={onSave} className="file-action-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                <polyline points="17,21 17,13 7,13 7,21"/>
                <polyline points="7,3 7,8 15,8"/>
              </svg>
              Save
            </button>
            <button onClick={onCopy} className="file-action-item" disabled={selectedShapeIds.length === 0}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
              </svg>
              Copy
            </button>
            <button onClick={onPaste} className="file-action-item" disabled={!hasClipboardContent}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
                <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
              </svg>
              Paste
            </button>
            <div className="file-action-separator" />
            <button onClick={onUndo} className="file-action-item" disabled={!canUndo}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 7v6h6"/>
                <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/>
              </svg>
              Undo
            </button>
            <button onClick={onRedo} className="file-action-item" disabled={!canRedo}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 7v6h-6"/>
                <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7"/>
              </svg>
              Redo
            </button>
            <div className="file-action-separator" />
            <button onClick={onNewProject} className="file-action-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14,2 14,8 20,8"/>
                <line x1="12" y1="18" x2="12" y2="12"/>
                <line x1="9" y1="15" x2="15" y2="15"/>
              </svg>
              New Project
            </button>
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="sidebar-tabs">
        <button
          className={`tab-button ${activeTab === "pages" ? "active" : ""}`}
          onClick={() => setActiveTab("pages")}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14,2 14,8 20,8" />
          </svg>
          Pages
        </button>
        <button
          className={`tab-button ${activeTab === "objects" ? "active" : ""}`}
          onClick={() => setActiveTab("objects")}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect x="3" y="3" width="7" height="7"/>
            <rect x="14" y="3" width="7" height="7"/>
            <rect x="14" y="14" width="7" height="7"/>
            <rect x="3" y="14" width="7" height="7"/>
          </svg>
          Objects
        </button>
        <button
          className="add-button"
          onClick={() => setShowCreateDialog(true)}
          title={`Add new ${activeTab === "pages" ? "page" : "object"}`}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      </div>

      {/* Content Area */}
      <div className="sidebar-content">
        {activeTab === "pages" && (
          <div className="pages-panel">
            <div className="page-item active">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14,2 14,8 20,8" />
              </svg>
              <span>Page 1</span>
            </div>
          </div>
        )}

        {activeTab === "objects" && (
          <div className="objects-panel">
            {objects.length === 0 ? (
              <div className="empty-objects">
                <p>No objects on canvas</p>
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
                    onClick={(e) => handleLayerClick(object.id, e)}
                    onContextMenu={(e) => handleObjectRightClick(e, object.id)}
                    onKeyDown={(e) => handleObjectKeyDown(e, object.id)}
                    tabIndex={0}
                  >
                    <div className="object-content">
                      <div className="object-icon">
                        {getLayerIcon(object.type)}
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
                              if (e.key === 'Escape') handleRenameCancel();
                            }}
                            className="object-name-input"
                            autoFocus
                          />
                        ) : (
                          <span 
                            className="object-name"
                            onDoubleClick={() => handleRenameStart(object.id, object.name)}
                          >
                            {object.name}
                          </span>
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

      {/* Create Object Dialog */}
      {showCreateDialog && (
        <div className="create-dialog-overlay">
          <div className="create-dialog">
            <h3>Create New {activeTab === "pages" ? "Page" : "Object"}</h3>
            {activeTab === "pages" ? (
              <div className="create-options">
                <button 
                  onClick={() => {
                    // Create new page logic
                    setShowCreateDialog(false);
                  }}
                  className="create-option"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14,2 14,8 20,8" />
                  </svg>
                  New Page
                </button>
              </div>
            ) : (
              <div className="create-options">
                <button onClick={() => handleCreateObject('shape')} className="create-option">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  </svg>
                  Shape
                </button>
                <button onClick={() => handleCreateObject('text')} className="create-option">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="4,7 4,4 20,4 20,7"/>
                    <line x1="9" y1="20" x2="15" y2="20"/>
                    <line x1="12" y1="4" x2="12" y2="20"/>
                  </svg>
                  Text
                </button>
                <button onClick={() => handleCreateObject('brush')} className="create-option">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M15 5l4 4L8 20l-4-1 1-4L16 4z"/>
                    <path d="M13 7l4 4"/>
                    <path d="M8 13l-2 8 8-2"/>
                  </svg>
                  Brush
                </button>
              </div>
            )}
            <button 
              onClick={() => setShowCreateDialog(false)}
              className="dialog-close"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
