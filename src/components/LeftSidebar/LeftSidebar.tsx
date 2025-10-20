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
  onSelectShape?: (id: string | null) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onCopy?: () => void;
  onPaste?: () => void;
  onDeleteSelected?: () => void;
  onRenameShape?: (id: string, newName: string) => void;
  onSave?: () => void;
  onNewProject?: () => void;
  onAddCollaborators?: () => void;
  // onTransferOwnership removed
  onLeaveProject?: () => void;
  onExportPNG?: () => void;
  onExportPDF?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  hasClipboardContent?: boolean;
  hasUnsavedChanges?: boolean;

  // Page management
  currentPageId?: string;
  onPageSwitch?: (pageId: string) => void;

  // Project isolation
  projectId?: string;

  // Page persistence callbacks
  onPageDataChange?: (
    pages: { id: string; name: string }[],
    objectNames: Record<string, string>
  ) => void;

  // Page data from parent (overrides localStorage when provided)
  pages?: { id: string; name: string }[];
  objectNames?: Record<string, string>;

  // Layers Panel removed
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  shapes: _shapes, // Reserved for future objects list feature
  selectedShapeIds,
  onSelectShape: _onSelectShape, // Reserved for future objects list feature
  onUndo,
  onRedo,
  onCopy,
  onPaste,
  onDeleteSelected,
  onRenameShape: _onRenameShape, // Reserved for future objects list feature
  onSave,
  onNewProject,
  onAddCollaborators,
  onLeaveProject,
  onExportPNG,
  onExportPDF,
  canUndo = false,
  canRedo = false,
  hasClipboardContent = false,
  hasUnsavedChanges = false,
  currentPageId = "page1",
  onPageSwitch,
  projectId,
  onPageDataChange,
  pages: propPages,
  objectNames: propObjectNames,
}) => {
  // Tab management: pages or layers
  const [activeTab, setActiveTab] = useState<"pages">("pages");
  const [showFileMenu, setShowFileMenu] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    objectId: string;
  } | null>(null);
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [editingPageName, setEditingPageName] = useState("");
  const [pageMenuId, setPageMenuId] = useState<string | null>(null);
  const [copiedPage, setCopiedPage] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // Persistent state management - project-specific
  const [pages, setPages] = useState<{ id: string; name: string }[]>(() => {
    // Use props if provided, otherwise fall back to localStorage
    if (propPages && propPages.length > 0) {
      return propPages;
    }
    if (!projectId) return [{ id: "page1", name: "Page 1" }];
    const saved = localStorage.getItem(`canvas-pages-${projectId}`);
    return saved ? JSON.parse(saved) : [{ id: "page1", name: "Page 1" }];
  });

  const [objectNames, setObjectNames] = useState<Record<string, string>>(() => {
    // Use props if provided, otherwise fall back to localStorage
    if (propObjectNames) {
      return propObjectNames;
    }
    if (!projectId) return {};
    const saved = localStorage.getItem(`canvas-object-names-${projectId}`);
    return saved ? JSON.parse(saved) : {};
  });

  const fileMenuRef = useRef<HTMLDivElement>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const pageMenuRef = useRef<HTMLDivElement>(null);
  // const objectMenuRef = useRef<HTMLDivElement>(null); // unused
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Generate object names with "Object #" format
  // Reserved for future object list UI
  // const getObjectName = (_shape: Shape) => {
  //   if (_shape && objectNames[_shape.id]) {
  //     return objectNames[_shape.id];
  //   }
  //   return "Object";
  // };

  // Convert shapes to object items with generated names
  // Precomputed objects list (currently unused by UI, reserved for future list view)
  // const objects = shapes
  //   .map((shape) => ({
  //     ...shape,
  //     name: getObjectName(shape),
  //   }))
  //   .sort((a, b) => b.zIndex - a.zIndex);

  // Notify parent component of page data changes (for in-memory tracking)
  useEffect(() => {
    if (onPageDataChange) {
      onPageDataChange(pages, objectNames);
    }
  }, [pages, objectNames, onPageDataChange]);

  // One-time cleanup of old localStorage data (for migration)
  useEffect(() => {
    const hasCleanedUp = localStorage.getItem("canvas-data-cleanup-v1");
    if (!hasCleanedUp) {
      // Clear old universal canvas data
      localStorage.removeItem("canvas-pages");
      localStorage.removeItem("canvas-object-names");
      localStorage.setItem("canvas-data-cleanup-v1", "true");
    }
  }, []);

  // Sync with props when they change (for loaded project data)
  useEffect(() => {
    if (propPages && propPages.length > 0) {
      setPages(propPages);
    }
  }, [propPages]);

  useEffect(() => {
    if (propObjectNames) {
      setObjectNames(propObjectNames);
    }
  }, [propObjectNames]);

  // Reset pages when projectId changes (for project isolation)
  useEffect(() => {
    if (projectId && !propPages) {
      // Only load from localStorage if no props are provided
      const saved = localStorage.getItem(`canvas-pages-${projectId}`);
      const projectPages = saved
        ? JSON.parse(saved)
        : [{ id: "page1", name: "Page 1" }];
      setPages(projectPages);
    }

    if (projectId && !propObjectNames) {
      // Only load from localStorage if no props are provided
      const savedObjectNames = localStorage.getItem(
        `canvas-object-names-${projectId}`
      );
      const projectObjectNames = savedObjectNames
        ? JSON.parse(savedObjectNames)
        : {};
      setObjectNames(projectObjectNames);
    }
  }, [projectId, propPages, propObjectNames]);

  // Persist active tab
  useEffect(() => {
    localStorage.setItem("sidebar-active-tab", activeTab);
  }, [activeTab]);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        fileMenuRef.current &&
        !fileMenuRef.current.contains(event.target as Node)
      ) {
        setShowFileMenu(false);
      }
      if (
        contextMenuRef.current &&
        !contextMenuRef.current.contains(event.target as Node)
      ) {
        setContextMenu(null);
      }
      if (
        pageMenuRef.current &&
        !pageMenuRef.current.contains(event.target as Node)
      ) {
        setPageMenuId(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Allow native behavior in inputs (e.g., AI chat input)
      const target = event.target as HTMLElement;
      const isInputElement =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target.contentEditable === "true" ||
        target.isContentEditable;

      if (isInputElement) {
        return;
      }

      // If user has a text selection anywhere, let the browser handle copy/cut
      const selection = window.getSelection?.();
      const hasTextSelection = !!selection && selection.toString().length > 0;

      if (event.metaKey || event.ctrlKey) {
        switch (event.key) {
          case "s":
            event.preventDefault();
            if (onSave) onSave();
            break;
          case "n":
            event.preventDefault();
            if (onNewProject) onNewProject();
            break;
          case "c":
            if (hasTextSelection) return; // let native copy for selected text
            event.preventDefault();
            if (onCopy) onCopy();
            break;
          case "x":
            if (hasTextSelection) return; // let native cut for selected text
            // Implement cut as copy + delete when shapes selected
            if (selectedShapeIds.length > 0) {
              event.preventDefault();
              if (onCopy) onCopy();
              if (onDeleteSelected) onDeleteSelected();
            }
            break;
          case "v":
            event.preventDefault();
            if (onPaste) onPaste();
            break;
          case "z":
            event.preventDefault();
            if (onUndo) onUndo();
            break;
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [
    selectedShapeIds,
    onCopy,
    onPaste,
    onUndo,
    onRedo,
    onDeleteSelected,
    onSave,
    onNewProject,
  ]);

  // Handle save - manual save only
  const handleSave = () => {
    setShowFileMenu(false); // Close menu

    if (onSave) {
      onSave();
    }
  };

  const handleAddPage = () => {
    // Find the highest existing page number to determine the next number
    const existingNumbers = pages
      .map((page) => {
        const match = page.name.match(/^Page (\d+)$/);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter((num) => num > 0);

    let nextPageNumber =
      existingNumbers.length > 0
        ? Math.max(...existingNumbers) + 1
        : pages.length + 1;

    // Ensure the generated name doesn't already exist
    let proposedName = `Page ${nextPageNumber}`;
    while (
      pages.some(
        (page) => page.name.toLowerCase() === proposedName.toLowerCase()
      )
    ) {
      nextPageNumber++;
      proposedName = `Page ${nextPageNumber}`;
    }

    const newPage = {
      id: `page${Date.now()}`, // Use timestamp for unique ID
      name: proposedName,
    };

    const updatedPages = [...pages, newPage];
    setPages(updatedPages);

    // Auto-switch to the new page
    if (onPageSwitch) {
      onPageSwitch(newPage.id);
    }
  };

  const handlePageMenuClick = (pageId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setPageMenuId(pageMenuId === pageId ? null : pageId);
  };

  const handleRenamePage = (pageId: string) => {
    const page = pages.find(
      (p: { id: string; name: string }) => p.id === pageId
    );
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
      const nameExists = pages.some(
        (page: { id: string; name: string }) =>
          page.id !== editingPageId &&
          page.name.toLowerCase() === trimmedName.toLowerCase()
      );

      if (nameExists) {
        // Don't update if name already exists, just cancel editing
        setEditingPageId(null);
        setEditingPageName("");
        return;
      }

      setPages((prev: { id: string; name: string }[]) =>
        prev.map((page: { id: string; name: string }) =>
          page.id === editingPageId ? { ...page, name: trimmedName } : page
        )
      );
    }
    setEditingPageId(null);
    setEditingPageName("");
  };

  const handleCopyPage = (pageId: string) => {
    const page = pages.find(
      (p: { id: string; name: string }) => p.id === pageId
    );
    if (page) {
      setCopiedPage(page);
    }
    setPageMenuId(null);
  };

  const handleDeletePage = (pageId: string) => {
    if (pages.length > 1) {
      // Don't delete the last page
      setPages((prev: { id: string; name: string }[]) =>
        prev.filter((page: { id: string; name: string }) => page.id !== pageId)
      );

      // If deleting the current page, switch to the first remaining page
      if (pageId === currentPageId && onPageSwitch) {
        const remainingPages = pages.filter((page) => page.id !== pageId);
        if (remainingPages.length > 0) {
          onPageSwitch(remainingPages[0].id);
        }
      }
    }
    setPageMenuId(null);
  };

  const handleSidebarRightClick = (event: React.MouseEvent) => {
    // Never override native context menu inside inputs/textarea/contentEditable (e.g., AI chat input)
    const target = event.target as HTMLElement;
    const isInputElement =
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      target.isContentEditable ||
      target.getAttribute("contenteditable") === "true";

    if (isInputElement) {
      return; // allow native paste menu
    }

    // Only show custom paste menu when a paste action is possible;
    // otherwise let the browser's native context menu appear.
    if (copiedPage || hasClipboardContent) {
      event.preventDefault();
      const rect = sidebarRef.current?.getBoundingClientRect();
      if (rect) {
        setContextMenu({
          x: event.clientX,
          y: event.clientY,
          objectId: "sidebar-paste", // Special ID for sidebar paste
        });
      }
    }
  };

  const handleSidebarPaste = () => {
    if (copiedPage) {
      // Paste page
      const newPage = {
        id: `page${Date.now()}`,
        name: `${copiedPage.name} Copy`,
      };
      setPages((prev: { id: string; name: string }[]) => [...prev, newPage]);

      // Auto-switch to the new page
      if (onPageSwitch) {
        onPageSwitch(newPage.id);
      }
    } else if (hasClipboardContent && onPaste) {
      // Paste object
      onPaste();
    }
    setContextMenu(null);
  };

  return (
    <div
      className="left-sidebar"
      ref={sidebarRef}
      onContextMenu={handleSidebarRightClick}
    >
      {/* File Options Menu */}
      <div className="sidebar-section file-section">
        <div className="file-menu-container" ref={fileMenuRef}>
          <button
            className="file-menu-button"
            onClick={() => setShowFileMenu(!showFileMenu)}
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
            File
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="6,9 12,15 18,9" />
            </svg>
          </button>

          {showFileMenu && (
            <div className="file-dropdown">
              <button
                onClick={handleSave}
                disabled={!onSave}
                title="Save project"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                  <polyline points="17,21 17,13 7,13 7,21" />
                  <polyline points="7,3 7,8 15,8" />
                </svg>
                Save{hasUnsavedChanges ? " *" : ""}
                <span className="shortcut">⌘S</span>
              </button>
              <button
                onClick={() => {
                  if (onCopy) onCopy();
                  setShowFileMenu(false);
                }}
                disabled={selectedShapeIds.length === 0}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                Copy
                <span className="shortcut">⌘C</span>
              </button>
              <button
                onClick={() => {
                  if (onPaste) onPaste();
                  setShowFileMenu(false);
                }}
                disabled={!hasClipboardContent}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                  <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                </svg>
                Paste
                <span className="shortcut">⌘V</span>
              </button>
              <div className="menu-divider" />
              <button
                onClick={() => {
                  if (onUndo) onUndo();
                  setShowFileMenu(false);
                }}
                disabled={!canUndo}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M3 7v6h6" />
                  <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
                </svg>
                Undo
                <span className="shortcut">⌘Z</span>
              </button>
              <button
                onClick={() => {
                  if (onRedo) onRedo();
                  setShowFileMenu(false);
                }}
                disabled={!canRedo}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M21 7v6h-6" />
                  <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7" />
                </svg>
                Redo
                <span className="shortcut">⌘⇧Z</span>
              </button>
              <div className="menu-divider" />
              <button
                onClick={() => {
                  if (onNewProject) onNewProject();
                  setShowFileMenu(false);
                }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                  <polyline points="14,2 14,8 20,8" />
                  <line x1="12" y1="18" x2="12" y2="12" />
                  <line x1="9" y1="15" x2="15" y2="15" />
                </svg>
                New Project
                <span className="shortcut">⌘N</span>
              </button>
              <button
                onClick={() => {
                  if (onAddCollaborators) onAddCollaborators();
                  setShowFileMenu(false);
                }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="8.5" cy="7" r="4" />
                  <line x1="20" y1="8" x2="20" y2="14" />
                  <line x1="23" y1="11" x2="17" y2="11" />
                </svg>
                Add Collaborators
              </button>
              {/* Transfer Ownership removed */}
              <button
                onClick={() => {
                  if (onLeaveProject) onLeaveProject();
                  setShowFileMenu(false);
                }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M10 17l5-5-5-5" />
                  <path d="M4 18V6" />
                </svg>
                Leave Project
              </button>
              <div className="menu-divider" />
              <button
                onClick={() => {
                  if (onExportPNG) onExportPNG();
                  setShowFileMenu(false);
                }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7,10 12,15 17,10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Export as PNG
              </button>
              <button
                onClick={() => {
                  if (onExportPDF) onExportPDF();
                  setShowFileMenu(false);
                }}
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
                  <path d="M16 13H8" />
                  <path d="M16 17H8" />
                  <polyline points="10,9 9,9 8,9" />
                </svg>
                Export as PDF
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Tabs - Pages */}
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
        {activeTab === "pages" && (
          <button
            className="add-button"
            onClick={handleAddPage}
            title="Add new page"
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
        )}
      </div>

      {/* Content Area (Pages only) */}
      <div className="sidebar-content">
        {activeTab === "pages" ? (
          <div className="pages-panel">
            {pages.map((page: { id: string; name: string }) => (
              <div
                key={page.id}
                className={`page-item ${
                  page.id === currentPageId ? "active" : ""
                }`}
                onClick={() => onPageSwitch?.(page.id)}
              >
                <div className="page-content">
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
                  <div className="page-info">
                    {editingPageId === page.id ? (
                      <input
                        type="text"
                        value={editingPageName}
                        onChange={(e) => setEditingPageName(e.target.value)}
                        onBlur={handlePageRenameSubmit}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handlePageRenameSubmit();
                          } else if (e.key === "Escape") {
                            e.preventDefault();
                            setEditingPageId(null);
                            setEditingPageName("");
                          }
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
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <circle cx="12" cy="12" r="1" />
                        <circle cx="12" cy="5" r="1" />
                        <circle cx="12" cy="19" r="1" />
                      </svg>
                    </button>
                    {pageMenuId === page.id && (
                      <div className="page-dropdown-menu" ref={pageMenuRef}>
                        <button onClick={() => handleRenamePage(page.id)}>
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                          Rename
                        </button>
                        <button onClick={() => handleCopyPage(page.id)}>
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <rect
                              x="9"
                              y="9"
                              width="13"
                              height="13"
                              rx="2"
                              ry="2"
                            />
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                          </svg>
                          Copy
                        </button>
                        <button
                          onClick={() => handleDeletePage(page.id)}
                          disabled={pages.length <= 1}
                          className="delete-button"
                        >
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <polyline points="3,6 5,6 21,6" />
                            <path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2V6" />
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
        ) : null}
      </div>

      {/* Context Menu */}
      {contextMenu && contextMenu.objectId === "sidebar-paste" && (
        <div
          className="object-context-menu"
          ref={contextMenuRef}
          style={{
            position: "fixed",
            left: contextMenu.x,
            top: contextMenu.y,
            zIndex: 10000,
          }}
        >
          {/* Sidebar paste menu */}
          <button onClick={handleSidebarPaste}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
              <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
            </svg>
            {copiedPage ? `Paste Page "${copiedPage.name}"` : "Paste"}
          </button>
        </div>
      )}
    </div>
  );
};
