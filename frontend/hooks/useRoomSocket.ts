"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { getSocket } from "@/lib/socket";
import { ChatMessage, PlaybackState, PlaybackStatus, RoomUser } from "@/types";

const DRIFT_THRESHOLD_SECONDS = 2;

interface UseRoomSocketArgs {
  roomId: string;
  username: string;
}

export function useRoomSocket({ roomId, username }: UseRoomSocketArgs) {
  const socket = useMemo(() => getSocket(), []);
  const [connected, setConnected] = useState(false);
  const [users, setUsers] = useState<RoomUser[]>([]);
  const [hostSocketId, setHostSocketId] = useState<string>("");
  const [socketId, setSocketId] = useState<string>("");
  const [playback, setPlayback] = useState<PlaybackState>({
    videoId: "dQw4w9WgXcQ",
    timestamp: 0,
    status: "paused",
    lastUpdatedAt: Date.now()
  });
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const suppressOutgoingRef = useRef(false);

  useEffect(() => {
    socket.connect();
    socket.emit("join_room", { roomId, username });

    const onConnect = () => {
      setConnected(true);
      toast.success("Connected to room server.");
    };
    const onDisconnect = () => {
      setConnected(false);
      toast.error("Disconnected. Trying to reconnect...");
    };
    const onJoined = (payload: { socketId: string; playback: PlaybackState }) => {
      setSocketId(payload.socketId);
      setPlayback(payload.playback);
    };
    const onSyncState = (state: PlaybackState & { roomId: string }) => {
      suppressOutgoingRef.current = true;
      setPlayback((prev) => {
        const drift = Math.abs(prev.timestamp - state.timestamp);
        if (drift < DRIFT_THRESHOLD_SECONDS && prev.status === state.status && prev.videoId === state.videoId) {
          suppressOutgoingRef.current = false;
          return prev;
        }
        return state;
      });
      window.setTimeout(() => {
        suppressOutgoingRef.current = false;
      }, 100);
    };
    const onRoomUsers = (payload: { hostSocketId: string; users: RoomUser[] }) => {
      setHostSocketId(payload.hostSocketId);
      setUsers(payload.users);
    };
    const onReceiveMessage = (message: ChatMessage) => {
      setMessages((prev) => [...prev, message]);
    };
    const onError = (message: string) => toast.error(message);

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("joined_room", onJoined);
    socket.on("sync_state", onSyncState);
    socket.on("room_users", onRoomUsers);
    socket.on("receive_message", onReceiveMessage);
    socket.on("error_message", onError);

    return () => {
      socket.emit("leave_room", { roomId });
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("joined_room", onJoined);
      socket.off("sync_state", onSyncState);
      socket.off("room_users", onRoomUsers);
      socket.off("receive_message", onReceiveMessage);
      socket.off("error_message", onError);
      socket.disconnect();
    };
  }, [roomId, socket, username]);

  const isHost = socketId !== "" && socketId === hostSocketId;

  const emitSyncState = (next: { videoId: string; timestamp: number; status: PlaybackStatus }) => {
    if (!isHost || suppressOutgoingRef.current) return;
    const payload = { roomId, ...next };
    if (next.status === "playing") socket.emit("play_video", payload);
    else socket.emit("pause_video", payload);
    socket.emit("sync_state", payload);
  };

  const emitSeek = (timestamp: number) => {
    if (!isHost || suppressOutgoingRef.current) return;
    socket.emit("seek_video", { roomId, timestamp });
  };

  const sendMessage = (message: string) => {
    socket.emit("send_message", { roomId, message });
  };

  return {
    connected,
    users,
    hostSocketId,
    socketId,
    isHost,
    playback,
    messages,
    emitSyncState,
    emitSeek,
    sendMessage
  };
}
