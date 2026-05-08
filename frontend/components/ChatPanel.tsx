"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { ChatMessage } from "@/types";

interface ChatPanelProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
}

export function ChatPanel({ messages, onSendMessage }: ChatPanelProps) {
  const [value, setValue] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const next = value.trim();
    if (!next) return;
    onSendMessage(next);
    setValue("");
  };

  return (
    <div className="flex h-full flex-col rounded-xl border border-border bg-panel">
      <div className="border-b border-border p-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-300">Live chat</h3>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.map((message) => (
          <div key={message.id} className="rounded-lg bg-surface p-3">
            <div className="mb-1 flex items-center justify-between text-xs text-gray-400">
              <span>{message.username}</span>
              <span>{new Date(message.timestamp).toLocaleTimeString()}</span>
            </div>
            <p className="text-sm text-white">{message.message}</p>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={onSubmit} className="border-t border-border p-3">
        <input
          className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-white outline-none focus:border-accent"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Message the room"
        />
      </form>
    </div>
  );
}
