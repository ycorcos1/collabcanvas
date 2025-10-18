/**
 * Minimal checkpoint store for AI actions (browser-only)
 * Stores a bounded stack in sessionStorage to enable one-click undo.
 */

import { Shape } from "../types/shape";

const KEY = "ai:checkpoints";
const MAX = 20;

export type AICheckpoint = {
  id: string; // timestamp id
  action: string; // e.g., update_many_shapes
  projectId?: string;
  items: Array<{ id: string; before: Partial<Shape> }>;
};

function read(): AICheckpoint[] {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as AICheckpoint[]) : [];
  } catch {
    return [];
  }
}

function write(list: AICheckpoint[]) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(list.slice(-MAX)));
  } catch {}
}

export function pushCheckpoint(cp: AICheckpoint) {
  const list = read();
  list.push(cp);
  write(list);
}

export function popCheckpoint(): AICheckpoint | null {
  const list = read();
  const cp = list.pop() || null;
  write(list);
  return cp;
}

