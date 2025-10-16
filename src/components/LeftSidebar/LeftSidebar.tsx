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
  onRenameShape?: (id: string, newName: string) => void;
  onSave?: () => void;
  onNewProject?: () => void;
  onExportPNG?: () => void;
  onExportPDF?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  hasClipboardContent?: boolean;
  hasUnsavedChanges?: boolean;
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
  onRenameShape,
  onSave,
  onNewProject,
  onExportPNG,
  onExportPDF,
  canUndo = false,
  canRedo = false,
  hasClipboardContent = false,
  hasUnsavedChanges = false,
}) => {
  const [activeTab, setActiveTab] = useState<"pages" | "objects">(() => {
    const saved = localStorage.getItem("sidebar-active-tab");
    return (saved as "pages" | "objects") || "objects";
  });
  const [showFileMenu, setShowFileMenu] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    objectId: string;
  } | null>(null);
  const [editingObjectId, setEditingObjectId] = useState<string | null>(null);
  const [editingObjectName, setEditingObjectName] = useState("");
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [editingPageName, setEditingPageName] = useState("");
  const [pageMenuId, setPageMenuId] = useState<string | null>(null);
  const [objectMenuId, setObjectMenuId] = useState<string | null>(null);
  const [copiedPage, setCopiedPage] = useState<{ id: string; name: string } | null>(null);
  
  // Persistent state management
  const [pages, setPages] = useState<{ id: string; name: string }[]>(() => {
    const saved = localStorage.getItem("canvas-pages");
    return saved ? JSON.parse(saved) : [{ id: "page1", name: "Page 1" }];
  });
  
  const [objectNames, setObjectNames] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem("canvas-object-names");
    return saved ? JSON.parse(saved) : {};
  });

  const fileMenuRef = useRef<HTMLDivElement>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const pageMenuRef = useRef<HTMLDivElement>(null);
  const objectMenuRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

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

  // Persistence effects
  useEffect(() => {
    localStorage.setItem("canvas-pages", JSON.stringify(pages));
  }, [pages]);

  useEffect(() => {
    localStorage.setItem("canvas-object-names", JSON.stringify(objectNames));
  }, [objectNames]);

  // Persist active tab
  useEffect(() => {
    localStorage.setItem("sidebar-active-tab", activeTab);
  }, [activeTab]);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (fileMenuRef.current && !fileMenuRef.current.contains(event.target as Node)) {
        setShowFileMenu(false);
      }
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
        setContextMenu(null);
      }
      if (pageMenuRef.current && !pageMenuRef.current.contains(event.target as Node)) {
        setPageMenuId(null);
      }
      if (objectMenuRef.current && !objectMenuRef.current.contains(event.target as Node)) {
        setObjectMenuId(null);
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
          case 's':
            event.preventDefault();
            if (onSave) onSave();
            break;
          case 'n':
            event.preventDefault();
            if (onNewProject) onNewProject();
            break;
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
  }, [selectedShapeIds, onCopy, onPaste, onUndo, onRedo, onDeleteSelected, onSave, onNewProject]);

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
      const trimmedName = editingObjectName.trim();
      
      // Check if the name already exists among other objects (excluding current one)
      const nameExists = Object.entries(objectNames).some(([id, name]) => 
        id !== editingObjectId && name.toLowerCase() === trimmedName.toLowerCase()
      );
      
      if (nameExists) {
        // Don't update if name already exists, just cancel editing
        setEditingObjectId(null);
        setEditingObjectName("");
        return;
      }
      
      setObjectNames(prev => ({
        ...prev,
        [editingObjectId]: trimmedName
      }));
      if (onRenameShape) {
        onRenameShape(editingObjectId, trimmedName);
      }
    }
    setEditingObjectId(null);
    setEditingObjectName("");
  };

  const handleAddPage = () => {
    // Find the highest existing page number to determine the next number
    const existingNumbers = pages
      .map(page => {
        const match = page.name.match(/^Page (\d+)$/);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter(num => num > 0);
    
    let nextPageNumber = existingNumbers.length > 0 
      ? Math.max(...existingNumbers) + 1 
      : pages.length + 1;
    
    // Ensure the generated name doesn't already exist
    let proposedName = `Page ${nextPageNumber}`;
    while (pages.some(page => page.name.toLowerCase() === proposedName.toLowerCase())) {
      nextPageNumber++;
      proposedName = `Page ${nextPageNumber}`;
    }
    
    const newPage = {
      id: `page${Date.now()}`, // Use timestamp for unique ID
      name: proposedName
    };
    setPages([...pages, newPage]);
  };

  const handlePageMenuClick = (pageId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setPageMenuId(pageMenuId === pageId ? null : pageId);
  };

  const handleObjectMenuClick = (objectId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setObjectMenuId(objectMenuId === objectId ? null : objectId);
  };

  const handleRenamePage = (pageId: string) => {
    const page = pages.find((p: { id: string; name: string }) => p.id === pageId);
    if (page) {
      setEditingPageId(pageId);
      setEditingPageName(page.name);
    }
    setPageMenuId(null);
  };

  const handlePageRenameSubmit = () => {
    if (editingPageId && editingPageName.trim()) {
      const trimmedName = editingPageName.trim();
      
      // Check if the name already exists (excluding the current page being edited)
      const nameExists = pages.some((page: { id: string; name: string }) => 
        page.id !== editingPageId && page.name.toLowerCase() === trimmedName.toLowerCase()
      );
      
      if (nameExists) {
        // Don't update if name already exists, just cancel editing
        setEditingPageId(null);
        setEditingPageName("");
        return;
      }
      
      setPages((prev: { id: string; name: string }[]) => prev.map((page: { id: string; name: string }) => 
        page.id === editingPageId 
          ? { ...page, name: trimmedName }
          : page
      ));
    }
    setEditingPageId(null);
    setEditingPageName("");
  };

  const handleCopyPage = (pageId: string) => {
    const page = pages.find((p: { id: string; name: string }) => p.id === pageId);
    if (page) {
      setCopiedPage(page);
    }
    setPageMenuId(null);
  };

  const handleDeletePage = (pageId: string) => {
    if (pages.length > 1) { // Don't delete the last page
      setPages((prev: { id: string; name: string }[]) => prev.filter((page: { id: string; name: string }) => page.id !== pageId));
    }
    setPageMenuId(null);
  };

  const handleCopyObjectFromMenu = (objectId: string) => {
    setCopiedPage(null); // Clear page clipboard
    // Also trigger the main copy functionality
    onSelectShape(objectId);
    if (onCopy) onCopy();
    setObjectMenuId(null);
  };

  const handleDeleteObjectFromMenu = (objectId: string) => {
    onSelectShape(objectId);
    if (onDeleteSelected) onDeleteSelected();
    setObjectMenuId(null);
  };

  const handleSidebarRightClick = (event: React.MouseEvent) => {
    event.preventDefault();
    
    // Check if we have something to paste
    if (copiedPage || hasClipboardContent) {
      const rect = sidebarRef.current?.getBoundingClientRect();
      if (rect) {
        setContextMenu({
          x: event.clientX,
          y: event.clientY,
          objectId: 'sidebar-paste', // Special ID for sidebar paste
        });
      }
    }
  };

  const handleSidebarPaste = () => {
    if (copiedPage) {
      // Paste page
      const newPage = {
        id: `page${Date.now()}`,
        name: `${copiedPage.name} Copy`
      };
      setPages((prev: { id: string; name: string }[]) => [...prev, newPage]);
    } else if (hasClipboardContent && onPaste) {
      // Paste object
      onPaste();
    }
    setContextMenu(null);
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
    <div className="left-sidebar" ref={sidebarRef} onContextMenu={handleSidebarRightClick}>
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
              <button 
                onClick={() => { if (onSave) onSave(); setShowFileMenu(false); }}
                className={hasUnsavedChanges ? "unsaved-indicator" : ""}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                  <polyline points="17,21 17,13 7,13 7,21"/>
                  <polyline points="7,3 7,8 15,8"/>
                </svg>
                Save{hasUnsavedChanges ? " *" : ""}
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
              <button onClick={() => { if (onNewProject) onNewProject(); setShowFileMenu(false); }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                  <polyline points="14,2 14,8 20,8"/>
                  <line x1="12" y1="18" x2="12" y2="12"/>
                  <line x1="9" y1="15" x2="15" y2="15"/>
                </svg>
                New Project
                <span className="shortcut">⌘N</span>
              </button>
              <div className="menu-divider" />
              <button onClick={() => { if (onExportPNG) onExportPNG(); setShowFileMenu(false); }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7,10 12,15 17,10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Export as PNG
              </button>
              <button onClick={() => { if (onExportPDF) onExportPDF(); setShowFileMenu(false); }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14,2 14,8 20,8"/>
                  <path d="M16 13H8"/>
                  <path d="M16 17H8"/>
                  <polyline points="10,9 9,9 8,9"/>
                </svg>
                Export as PDF
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
        {activeTab === "pages" && (
          <button
            className="add-button"
            onClick={handleAddPage}
            title="Add new page"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        )}
      </div>


      {/* Content Area */}
      <div className="sidebar-content">
        {activeTab === "pages" && (
          <div className="pages-panel">
            {pages.map((page: { id: string; name: string }, index: number) => (
              <div key={page.id} className={`page-item ${index === 0 ? "active" : ""}`}>
                <div className="page-content">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14,2 14,8 20,8" />
                  </svg>
                  <div className="page-info">
                    {editingPageId === page.id ? (
                      <input
                        type="text"
                        value={editingPageName}
                        onChange={(e) => setEditingPageName(e.target.value)}
                        onBlur={handlePageRenameSubmit}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handlePageRenameSubmit();
                          } else if (e.key === 'Escape') {
                            e.preventDefault();
                            setEditingPageId(null);
                            setEditingPageName("");
                          }
                          // Allow shift key and other keys to work normally for typing
                        }}
                        autoFocus
                        className="page-name-input"
                      />
                    ) : (
                      <span className="page-name">{page.name}</span>
                    )}
                  </div>
                  <div className="page-menu-container">
                    <button
                      className="page-menu-button"
                      onClick={(e) => handlePageMenuClick(page.id, e)}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="1"/>
                        <circle cx="12" cy="5" r="1"/>
                        <circle cx="12" cy="19" r="1"/>
                      </svg>
                    </button>
                    {pageMenuId === page.id && (
                      <div className="page-dropdown-menu" ref={pageMenuRef}>
                        <button onClick={() => handleRenamePage(page.id)}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                          Rename
                        </button>
                        <button onClick={() => handleCopyPage(page.id)}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                          </svg>
                          Copy
                        </button>
                        <button 
                          onClick={() => handleDeletePage(page.id)}
                          disabled={pages.length <= 1}
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
                </div>
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
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleRenameSubmit();
                              } else if (e.key === 'Escape') {
                                e.preventDefault();
                                setEditingObjectId(null);
                                setEditingObjectName("");
                              }
                              // Allow shift key and other keys to work normally for typing
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
                        <div className="object-menu-container">
                          <button
                            className="object-menu-button"
                            onClick={(e) => handleObjectMenuClick(object.id, e)}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="1"/>
                              <circle cx="12" cy="5" r="1"/>
                              <circle cx="12" cy="19" r="1"/>
                            </svg>
                          </button>
                          {objectMenuId === object.id && (
                            <div className="object-dropdown-menu" ref={objectMenuRef}>
                              <button onClick={() => handleRenameObject(object.id)}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                </svg>
                                Rename
                              </button>
                              <button onClick={() => handleCopyObjectFromMenu(object.id)}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                                </svg>
                                Copy
                              </button>
                              <button 
                                onClick={() => handleDeleteObjectFromMenu(object.id)}
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
          {contextMenu.objectId === 'sidebar-paste' ? (
            // Sidebar paste menu
            <button onClick={handleSidebarPaste}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
                <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
              </svg>
              {copiedPage ? `Paste Page "${copiedPage.name}"` : 'Paste Object'}
            </button>
          ) : (
            // Object context menu
            <>
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
            </>
          )}
        </div>
      )}
    </div>
  );
};
