import { randomUUID } from "node:crypto";
import { Server, Socket } from "socket.io";
import { roomManager } from "../services/roomManager";
import { messageSchema, seekVideoSchema, syncStateSchema, joinRoomSchema } from "../utils/validation";

function emitRoomUsers(io: Server, roomId: string) {
  const room = roomManager.getRoomById(roomId);
  if (!room) return;

  io.to(roomId).emit("room_users", {
    hostSocketId: room.hostSocketId,
    users: roomManager.getRoomUsers(roomId)
  });
}

function emitPlaybackState(io: Server, roomId: string) {
  const room = roomManager.getRoomById(roomId);
  if (!room) return;

  io.to(roomId).emit("sync_state", {
    roomId: room.roomId,
    ...room.playback
  });
}

export function registerSocketHandlers(io: Server) {
  io.on("connection", (socket: Socket) => {
    socket.on("join_room", (payload) => {
      const parsed = joinRoomSchema.safeParse(payload);
      if (!parsed.success) {
        socket.emit("error_message", "Invalid join payload.");
        return;
      }

      const { roomId, username } = parsed.data;
      const room = roomManager.joinRoom(roomId, socket.id, username);
      socket.join(roomId);

      socket.emit("joined_room", {
        roomId,
        socketId: socket.id,
        isHost: room.hostSocketId === socket.id,
        playback: room.playback
      });

      emitRoomUsers(io, roomId);
      emitPlaybackState(io, roomId);
    });

    socket.on("leave_room", ({ roomId }: { roomId: string }) => {
      socket.leave(roomId);
      const updated = roomManager.leaveRoom(socket.id);
      if (updated) emitRoomUsers(io, updated.roomId);
    });

    socket.on("play_video", (payload) => {
      const parsed = syncStateSchema.safeParse(payload);
      if (!parsed.success) return;
      const { roomId, videoId, timestamp } = parsed.data;
      if (!roomManager.isHost(roomId, socket.id)) return;

      roomManager.updatePlaybackState(roomId, {
        videoId,
        timestamp,
        status: "playing"
      });
      emitPlaybackState(io, roomId);
    });

    socket.on("pause_video", (payload) => {
      const parsed = syncStateSchema.safeParse(payload);
      if (!parsed.success) return;
      const { roomId, videoId, timestamp } = parsed.data;
      if (!roomManager.isHost(roomId, socket.id)) return;

      roomManager.updatePlaybackState(roomId, {
        videoId,
        timestamp,
        status: "paused"
      });
      emitPlaybackState(io, roomId);
    });

    socket.on("seek_video", (payload) => {
      const parsed = seekVideoSchema.safeParse(payload);
      if (!parsed.success) return;
      const { roomId, timestamp } = parsed.data;
      if (!roomManager.isHost(roomId, socket.id)) return;

      roomManager.updatePlaybackState(roomId, { timestamp });
      emitPlaybackState(io, roomId);
    });

    socket.on("sync_state", (payload) => {
      const parsed = syncStateSchema.safeParse(payload);
      if (!parsed.success) return;
      const { roomId, videoId, timestamp, status } = parsed.data;
      if (!roomManager.isHost(roomId, socket.id)) return;

      roomManager.updatePlaybackState(roomId, { videoId, timestamp, status });
      emitPlaybackState(io, roomId);
    });

    socket.on("send_message", (payload) => {
      const parsed = messageSchema.safeParse(payload);
      if (!parsed.success) return;
      const { roomId, message } = parsed.data;
      const room = roomManager.getRoomById(roomId);
      if (!room) return;

      const user = room.users.get(socket.id);
      if (!user) return;

      io.to(roomId).emit("receive_message", {
        id: randomUUID(),
        roomId,
        username: user.username,
        message,
        timestamp: Date.now()
      });
    });

    socket.on("disconnect", () => {
      const updated = roomManager.leaveRoom(socket.id);
      if (!updated) return;
      emitRoomUsers(io, updated.roomId);
      emitPlaybackState(io, updated.roomId);
    });
  });
}
