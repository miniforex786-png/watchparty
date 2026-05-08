"use client";

import { toast } from "sonner";

interface RoomHeaderProps {
  roomId: string;
  username: string;
  isHost: boolean;
  connected: boolean;
}

export function RoomHeader({ roomId, username, isHost, connected }: RoomHeaderProps) {
  const copyRoomLink = async () => {
    const link = `${window.location.origin}/room/${roomId}?username=${encodeURIComponent(username)}`;
    await navigator.clipboard.writeText(link);
    toast.success("Room link copied to clipboard.");
  };

  return (
    <header className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-panel p-4">
      <div>
        <p className="text-xs uppercase tracking-wider text-gray-400">Room</p>
        <h2 className="font-semibold text-white">{roomId}</h2>
      </div>
      <div className="flex items-center gap-2 text-sm">
        <span className={`rounded px-2 py-1 ${connected ? "bg-emerald-500/20 text-emerald-300" : "bg-red-500/20 text-red-300"}`}>
          {connected ? "Connected" : "Reconnecting..."}
        </span>
        <span className="rounded bg-white/10 px-2 py-1 text-gray-200">{isHost ? "Host" : "Viewer"}</span>
      </div>
      <button
        type="button"
        className="rounded-md border border-border px-3 py-2 text-sm text-white hover:bg-white/5"
        onClick={copyRoomLink}
      >
        Copy Room Link
      </button>
    </header>
  );
}
