import { z } from "zod";

export const joinRoomSchema = z.object({
  roomId: z.string().trim().min(3).max(64),
  username: z.string().trim().min(2).max(32)
});

export const syncStateSchema = z.object({
  roomId: z.string().trim().min(3).max(64),
  videoId: z.string().trim().min(3).max(32),
  timestamp: z.number().min(0).max(86400),
  status: z.enum(["playing", "paused"])
});

export const seekVideoSchema = z.object({
  roomId: z.string().trim().min(3).max(64),
  timestamp: z.number().min(0).max(86400)
});

export const messageSchema = z.object({
  roomId: z.string().trim().min(3).max(64),
  message: z.string().trim().min(1).max(500)
});
