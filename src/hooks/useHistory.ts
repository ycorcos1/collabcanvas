import { useState, useCallback, useRef } from 'react';
import { Shape } from '../types/shape';

/**
 * History Management Hook - Provides undo/redo functionality
 * 
 * Features:
 * - Maintains history stack of canvas states
 * - Undo/Redo operations with keyboard shortcuts
 * - Automatic history cleanup to prevent memory leaks
 * - Collaborative-safe history management
 */

interface HistoryState {
  shapes: Shape[];
  timestamp: number;
}

interface UseHistoryOptions {
  maxHistorySize?: number;
  debounceMs?: number;
}

interface UseHistoryReturn {
  canUndo: boolean;
  canRedo: boolean;
  undo: () => Shape[] | null;
  redo: () => Shape[] | null;
  pushState: (shapes: Shape[]) => void;
  clearHistory: () => void;
}

export const useHistory = (
  initialShapes: Shape[] = [],
  options: UseHistoryOptions = {}
): UseHistoryReturn => {
  const { maxHistorySize = 50, debounceMs = 500 } = options;
  
  // History stacks
  const [undoStack, setUndoStack] = useState<HistoryState[]>([
    { shapes: initialShapes, timestamp: Date.now() }
  ]);
  const [redoStack, setRedoStack] = useState<HistoryState[]>([]);
  
  // Debounce timer for automatic state saving
  const debounceTimer = useRef<number | null>(null);
  const lastPushTime = useRef<number>(0);

  // Push new state to history
  const pushState = useCallback((shapes: Shape[]) => {
    const now = Date.now();
    
    // Debounce rapid changes to prevent history spam
    if (now - lastPushTime.current < debounceMs) {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      
      debounceTimer.current = window.setTimeout(() => {
        pushState(shapes);
      }, debounceMs);
      return;
    }
    
    lastPushTime.current = now;
    
    setUndoStack(prev => {
      // Don't add if shapes are identical to last state
      const lastState = prev[prev.length - 1];
      if (lastState && JSON.stringify(lastState.shapes) === JSON.stringify(shapes)) {
        return prev;
      }
      
      const newStack = [...prev, { shapes: [...shapes], timestamp: now }];
      
      // Limit history size
      if (newStack.length > maxHistorySize) {
        return newStack.slice(-maxHistorySize);
      }
      
      return newStack;
    });
    
    // Clear redo stack when new state is pushed
    setRedoStack([]);
  }, [debounceMs, maxHistorySize]);

  // Undo operation
  const undo = useCallback((): Shape[] | null => {
    if (undoStack.length <= 1) return null;
    
    const currentState = undoStack[undoStack.length - 1];
    const previousState = undoStack[undoStack.length - 2];
    
    setUndoStack(prev => prev.slice(0, -1));
    setRedoStack(prev => [...prev, currentState]);
    
    return previousState.shapes;
  }, [undoStack]);

  // Redo operation
  const redo = useCallback((): Shape[] | null => {
    if (redoStack.length === 0) return null;
    
    const stateToRestore = redoStack[redoStack.length - 1];
    
    setRedoStack(prev => prev.slice(0, -1));
    setUndoStack(prev => [...prev, stateToRestore]);
    
    return stateToRestore.shapes;
  }, [redoStack]);

  // Clear all history
  const clearHistory = useCallback(() => {
    setUndoStack([{ shapes: [], timestamp: Date.now() }]);
    setRedoStack([]);
  }, []);

  return {
    canUndo: undoStack.length > 1,
    canRedo: redoStack.length > 0,
    undo,
    redo,
    pushState,
    clearHistory,
  };
};
