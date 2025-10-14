export interface CanvasState {
  x: number;
  y: number;
  scale: number;
}

export interface ViewportBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PresenceData {
  userId: string;
  userName: string;
  userColor: string;
  isOnline: boolean;
  lastSeen: number;
}

export interface PresenceState {
  [userId: string]: PresenceData;
}
