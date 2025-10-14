export interface CursorPosition {
  x: number;
  y: number;
  userId: string;
  userName: string;
  userColor: string;
  timestamp: number;
}

export interface CursorState {
  [userId: string]: CursorPosition;
}
