/**
 * Lifecycle Save Service
 *
 * Saves project state on lifecycle events only (no periodic auto-save).
 * Features:
 * - Manual save (user-triggered)
 * - Save on beforeunload (refresh/close)
 * - Save on unmount (navigate away)
 * - Debouncing to prevent duplicate saves
 */

import { doc, updateDoc, Timestamp } from "firebase/firestore";
import { firestore } from "./firebase";
import { Shape } from "../types/shape";

export interface CanvasState {
  shapes: Shape[];
  canvasBackground: string;
  canvasDimensions: { width: number; height: number };
  projectName?: string; // Project name for auto-save on rename
  currentPageId?: string; // Current active page ID
  pageMetadata?: { id: string; name: string }[]; // Page names and IDs
  objectNames?: Record<string, string>; // Object custom names
}

export class LifecycleSave {
  private projectId: string;
  private lastSaveTime: number = 0;
  private minSaveInterval: number = 2000; // Prevent saves within 2 seconds
  private beforeUnloadHandler: ((e: BeforeUnloadEvent) => void) | null = null;
  private getCanvasState: (() => CanvasState) | null = null;
  private isSaving: boolean = false;
  private initialState: string | null = null; // Track initial state for change detection

  constructor(projectId: string) {
    this.projectId = projectId;
  }

  /**
   * Initialize lifecycle save handlers
   */
  start(getCanvasState: () => CanvasState): void {
    this.getCanvasState = getCanvasState;
    this.cleanup(); // Clear any existing handlers

    // Capture initial state for change detection
    try {
      const state = getCanvasState();
      this.initialState = JSON.stringify({
        shapes: state.shapes,
        canvasBackground: state.canvasBackground,
        canvasDimensions: state.canvasDimensions,
        projectName: state.projectName,
      });
    } catch (error) {
      // silent
      this.initialState = null;
    }

    // Set up beforeunload handler for refresh/close
    this.beforeUnloadHandler = (_e: BeforeUnloadEvent) => {
      if (this.getCanvasState) {
        const state = this.getCanvasState();
        if (state.shapes.length > 0) {
          // Best-effort synchronous save
          this.performSaveSync(state);
        }
      }
    };

    window.addEventListener("beforeunload", this.beforeUnloadHandler);

    // silent
  }

  /**
   * Cleanup handlers and save final state
   */
  async stop(): Promise<void> {
    // Save one final time before cleanup (navigate away)
    await this.performSave("Save on navigate");

    this.cleanup();
    // silent
  }

  /**
   * Remove all event listeners
   */
  private cleanup(): void {
    if (this.beforeUnloadHandler) {
      window.removeEventListener("beforeunload", this.beforeUnloadHandler);
      this.beforeUnloadHandler = null;
    }
  }

  /**
   * Perform a save (with debouncing to prevent duplicates)
   */
  private async performSave(_reason: string): Promise<boolean> {
    // _reason parameter reserved for future logging/debugging
    if (!this.getCanvasState) {
      // silent
      return false;
    }

    if (this.isSaving) {
      // silent
      return false;
    }

    const now = Date.now();
    if (now - this.lastSaveTime < this.minSaveInterval) {
      // silent
      return false;
    }

    const state = this.getCanvasState();

    // Validate state has no undefined values
    if (
      !state.canvasDimensions ||
      state.canvasDimensions.width === undefined ||
      state.canvasDimensions.height === undefined
    ) {
      // silent
      return false;
    }

    if (state.canvasBackground === undefined) {
      // silent
      return false;
    }

    // Check if anything actually changed
    const currentState = JSON.stringify({
      shapes: state.shapes,
      canvasBackground: state.canvasBackground,
      canvasDimensions: state.canvasDimensions,
      projectName: state.projectName,
      currentPageId: state.currentPageId,
      pageMetadata: state.pageMetadata,
      objectNames: state.objectNames,
    });

    if (this.initialState === currentState) {
      // silent
      return false;
    }

    try {
      this.isSaving = true;

      // Allow saving even with 0 shapes (to clear canvas)
      // silent

      const projectRef = doc(firestore, "projects", this.projectId);
      const updateData: any = {
        shapes: state.shapes,
        canvasBackground: state.canvasBackground,
        canvasDimensions: state.canvasDimensions,
        updatedAt: Timestamp.now(),
      };

      // Only include projectName if it's defined
      if (state.projectName !== undefined && state.projectName !== null) {
        updateData.name = state.projectName;
      }

      // Include currentPageId if defined
      if (state.currentPageId !== undefined) {
        updateData.currentPageId = state.currentPageId;
      }

      // Include pageMetadata if defined
      if (state.pageMetadata !== undefined) {
        updateData.pageMetadata = state.pageMetadata;
      }

      // Include objectNames if defined
      if (state.objectNames !== undefined) {
        updateData.objectNames = state.objectNames;
      }

      await updateDoc(projectRef, updateData);

      this.lastSaveTime = now;

      // Update initial state after successful save
      this.initialState = currentState;

      // silent
      return true;
    } catch (error: any) {
      // silent

      // Log what we tried to save for debugging
      // silent

      return false;
    } finally {
      this.isSaving = false;
    }
  }

  /**
   * Synchronous save on unload (best-effort)
   * Modern browsers may not wait for async operations
   */
  private performSaveSync(_state: CanvasState): void {
    try {
      // silent

      // Fire async save (best-effort)
      this.performSave("Save on close/refresh").catch(() => {});
    } catch (error) {
      // silent
    }
  }

  /**
   * Trigger manual save (called by user action)
   */
  async saveNow(): Promise<boolean> {
    return this.performSave("Manual save");
  }
}
