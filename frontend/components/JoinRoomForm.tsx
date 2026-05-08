"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

function createRoomId() {
  return Math.random().toString(36).slice(2, 10);
}

export function JoinRoomForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [roomId, setRoomId] = useState("");
  const [loading, setLoading] = useState(false);
  const disabled = useMemo(() => loading || username.trim().length < 2, [loading, username]);

  const navigateToRoom = (targetRoomId: string) => {
    const params = new URLSearchParams({ username: username.trim() });
    router.push(`/room/${targetRoomId}?${params.toString()}`);
  };

  const onJoin = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!roomId.trim() || disabled) return;
    setLoading(true);
    navigateToRoom(roomId.trim());
  };

  const onCreate = () => {
    if (disabled) return;
    setLoading(true);
    const generatedRoomId = createRoomId();
    navigateToRoom(generatedRoomId);
  };

  return (
    <div className="w-full max-w-xl rounded-2xl border border-border bg-panel/70 p-6 shadow-xl">
      <h1 className="text-2xl font-semibold text-white">Watch Party</h1>
      <p className="mt-2 text-sm text-gray-400">Create a room, share the link, and watch YouTube together in sync.</p>

      <form className="mt-6 space-y-4" onSubmit={onJoin}>
        <div>
          <label className="mb-2 block text-sm text-gray-300">Username</label>
          <input
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-white outline-none transition focus:border-accent"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="Your display name"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm text-gray-300">Room ID</label>
          <input
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-white outline-none transition focus:border-accent"
            value={roomId}
            onChange={(event) => setRoomId(event.target.value)}
            placeholder="Enter room ID to join"
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            type="submit"
            disabled={disabled || roomId.trim().length < 3}
            className="rounded-lg bg-accent px-4 py-2 font-medium text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Join Room
          </button>
          <button
            type="button"
            onClick={onCreate}
            disabled={disabled}
            className="rounded-lg border border-border px-4 py-2 font-medium text-white transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Create Room
          </button>
        </div>
      </form>
    </div>
  );
}
