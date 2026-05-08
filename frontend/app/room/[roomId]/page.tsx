"use client";

import { useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { ChatPanel } from "@/components/ChatPanel";
import { RoomHeader } from "@/components/RoomHeader";
import { UserList } from "@/components/UserList";
import { VideoPlayer } from "@/components/VideoPlayer";
import { useRoomSocket } from "@/hooks/useRoomSocket";

export default function RoomPage() {
  const params = useParams<{ roomId: string }>();
  const searchParams = useSearchParams();
  const roomId = params.roomId;

  const usernameRef = useRef<string>("");
  if (!usernameRef.current) {
    const fromQuery = searchParams.get("username");
    usernameRef.current = fromQuery && fromQuery.trim().length >= 2
      ? fromQuery.trim()
      : `Guest-${Math.random().toString(36).slice(2, 6)}`;
  }
  const username = usernameRef.current;

  const { connected, isHost, playback, users, hostSocketId, messages, emitSyncState, emitSeek, sendMessage } = useRoomSocket({
    roomId,
    username
  });

  return (
    <main className="min-h-screen bg-slate-950 p-4 text-white sm:p-6">
      <RoomHeader roomId={roomId} username={username} isHost={isHost} connected={connected} />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <section className="space-y-4 xl:col-span-8">
          <VideoPlayer playback={playback} isHost={isHost} onSyncState={emitSyncState} onSeek={emitSeek} />
          <UserList users={users} hostSocketId={hostSocketId} />
        </section>

        <section className="h-[70vh] xl:col-span-4">
          <ChatPanel messages={messages} onSendMessage={sendMessage} />
        </section>
      </div>
    </main>
  );
}
