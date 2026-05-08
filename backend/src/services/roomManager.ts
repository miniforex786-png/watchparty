import { randomUUID } from "node:crypto";
import { PlaybackState, RoomState, RoomUser } from "../types/socket";

const DEFAULT_PLAYBACK: PlaybackState = {
  videoId: "dQw4w9WgXcQ",
  timestamp: 0,
  status: "paused",
  lastUpdatedAt: Date.now()
};

class RoomManager {
  private rooms = new Map<string, RoomState>();
  private socketToRoom = new Map<string, string>();

  createRoomId(): string {
    return randomUUID().slice(0, 8);
  }

  joinRoom(roomId: string, socketId: string, username: string): RoomState {
    let room = this.rooms.get(roomId);
    const user: RoomUser = { socketId, username, joinedAt: Date.now() };

    if (!room) {
      room = {
        roomId,
        hostSocketId: socketId,
        users: new Map([[socketId, user]]),
        playback: { ...DEFAULT_PLAYBACK, lastUpdatedAt: Date.now() }
      };
      this.rooms.set(roomId, room);
    } else {
      room.users.set(socketId, user);
    }

    this.socketToRoom.set(socketId, roomId);
    return room;
  }

  leaveRoom(socketId: string): RoomState | null {
    const roomId = this.socketToRoom.get(socketId);
    if (!roomId) return null;

    const room = this.rooms.get(roomId);
    if (!room) return null;

    room.users.delete(socketId);
    this.socketToRoom.delete(socketId);

    if (room.users.size === 0) {
      this.rooms.delete(roomId);
      return null;
    }

    if (room.hostSocketId === socketId) {
      const nextHost = room.users.values().next().value as RoomUser | undefined;
      if (nextHost) room.hostSocketId = nextHost.socketId;
    }

    return room;
  }

  getRoomById(roomId: string): RoomState | undefined {
    return this.rooms.get(roomId);
  }

  getRoomBySocketId(socketId: string): RoomState | undefined {
    const roomId = this.socketToRoom.get(socketId);
    if (!roomId) return undefined;
    return this.rooms.get(roomId);
  }

  isHost(roomId: string, socketId: string): boolean {
    const room = this.rooms.get(roomId);
    return room?.hostSocketId === socketId;
  }

  updatePlaybackState(roomId: string, playback: Partial<PlaybackState>): RoomState | undefined {
    const room = this.rooms.get(roomId);
    if (!room) return undefined;

    room.playback = {
      ...room.playback,
      ...playback,
      timestamp: Math.max(0, playback.timestamp ?? room.playback.timestamp),
      lastUpdatedAt: Date.now()
    };

    return room;
  }

  getRoomUsers(roomId: string): RoomUser[] {
    const room = this.rooms.get(roomId);
    if (!room) return [];
    return Array.from(room.users.values());
  }
}

export const roomManager = new RoomManager();
