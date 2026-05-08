export type PlaybackStatus = "playing" | "paused";

export interface RoomUser {
  socketId: string;
  username: string;
  joinedAt: number;
}

export interface PlaybackState {
  videoId: string;
  timestamp: number;
  status: PlaybackStatus;
  lastUpdatedAt: number;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  username: string;
  message: string;
  timestamp: number;
}

export interface RoomState {
  roomId: string;
  hostSocketId: string;
  users: Map<string, RoomUser>;
  playback: PlaybackState;
}

export interface JoinRoomPayload {
  roomId: string;
  username: string;
}

export interface SyncStatePayload {
  roomId: string;
  videoId: string;
  timestamp: number;
  status: PlaybackStatus;
}

export interface SeekVideoPayload {
  roomId: string;
  timestamp: number;
}

export interface MessagePayload {
  roomId: string;
  message: string;
}
