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
