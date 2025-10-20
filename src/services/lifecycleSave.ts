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
      console.error("Failed to capture initial state:", error);
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

    console.log(
      "✅ Lifecycle save initialized (manual + refresh/close/navigate)"
    );
  }

  /**
   * Cleanup handlers and save final state
   */
  async stop(): Promise<void> {
    // Save one final time before cleanup (navigate away)
    await this.performSave("Save on navigate");

    this.cleanup();
    console.log("Lifecycle save stopped");
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
  private async performSave(reason: string): Promise<boolean> {
    if (!this.getCanvasState) {
      console.log("⏭️ Save skipped: No canvas state getter");
      return false;
    }

    if (this.isSaving) {
      console.log("⏭️ Save skipped: Already saving");
      return false;
    }

    const now = Date.now();
    if (now - this.lastSaveTime < this.minSaveInterval) {
      console.log("⏭️ Save skipped: Too soon since last save");
      return false;
    }

    const state = this.getCanvasState();

    // Validate state has no undefined values
    if (
      !state.canvasDimensions ||
      state.canvasDimensions.width === undefined ||
      state.canvasDimensions.height === undefined
    ) {
      console.log("⏭️ Save skipped: Canvas dimensions not ready");
      return false;
    }

    if (state.canvasBackground === undefined) {
      console.log("⏭️ Save skipped: Canvas background not ready");
      return false;
    }

    // Check if anything actually changed
    const currentState = JSON.stringify({
      shapes: state.shapes,
      canvasBackground: state.canvasBackground,
      canvasDimensions: state.canvasDimensions,
      projectName: state.projectName,
    });

    if (this.initialState === currentState) {
      console.log(`⏭️ ${reason} skipped: No changes detected`);
      return false;
    }

    try {
      this.isSaving = true;

      // Allow saving even with 0 shapes (to clear canvas)
      console.log(`💾 ${reason}...`);

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

      await updateDoc(projectRef, updateData);

      this.lastSaveTime = now;

      // Update initial state after successful save
      this.initialState = currentState;

      console.log(`✅ ${reason} complete`);
      return true;
    } catch (error: any) {
      console.error(`❌ ${reason} failed:`, error);

      // Log what we tried to save for debugging
      if (import.meta.env.DEV) {
        console.error("Failed to save state:", {
          shapesCount: state.shapes.length,
          canvasBackground: state.canvasBackground,
          canvasDimensions: state.canvasDimensions,
        });
      }

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
      console.log("💾 Save on close/refresh...");

      // Fire async save (best-effort)
      this.performSave("Save on close/refresh").catch((error) => {
        console.error("Unload save failed:", error);
      });
    } catch (error) {
      console.error("Sync save error:", error);
    }
  }

  /**
   * Trigger manual save (called by user action)
   */
  async saveNow(): Promise<boolean> {
    return this.performSave("Manual save");
  }
}
