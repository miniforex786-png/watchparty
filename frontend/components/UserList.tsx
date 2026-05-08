"use client";

import { RoomUser } from "@/types";

interface UserListProps {
  users: RoomUser[];
  hostSocketId: string;
}

export function UserList({ users, hostSocketId }: UserListProps) {
  return (
    <aside className="rounded-xl border border-border bg-panel p-4">
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-300">Active users ({users.length})</h3>
      <ul className="space-y-2">
        {users.map((user) => (
          <li key={user.socketId} className="flex items-center justify-between rounded-md bg-surface px-3 py-2 text-sm text-white">
            <span>{user.username}</span>
            {user.socketId === hostSocketId && <span className="text-xs text-violet-300">Host</span>}
          </li>
        ))}
      </ul>
    </aside>
  );
}
