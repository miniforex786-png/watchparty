"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { PlaybackState } from "@/types";

declare global {
  interface Window {
    YT: {
      Player: new (target: string | HTMLElement, options: Record<string, unknown>) => YTPlayer;
      PlayerState: {
        PLAYING: number;
        PAUSED: number;
      };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

interface YTPlayer {
  playVideo: () => void;
  pauseVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  getCurrentTime: () => number;
  getVideoData: () => { video_id: string };
  loadVideoById: (videoId: string, startSeconds?: number) => void;
  destroy?: () => void;
}

interface YTPlayerEvent {
  data: number;
  target: YTPlayer;
}

interface VideoPlayerProps {
  playback: PlaybackState;
  isHost: boolean;
  onSyncState: (next: { videoId: string; timestamp: number; status: "playing" | "paused" }) => void;
  onSeek: (timestamp: number) => void;
}

type Provider = "youtube" | "vidking";

interface ParsedMedia {
  provider: Provider;
  value: string;
}

const VIDKING_ORIGIN = "https://www.vidking.net";

function parseMediaInput(rawInput: string): string | null {
  const input = rawInput.trim();
  if (!input) return null;
  if (input.startsWith("yt:")) {
    const id = input.slice(3).trim();
    return id ? `yt:${id}` : null;
  }
  if (input.startsWith("vidking:")) {
    const path = input.slice(8).trim().replace(/^\/+/, "");
    return path ? `vidking:${path}` : null;
  }

  const ytIdRegex = /^[A-Za-z0-9_-]{11}$/;
  if (ytIdRegex.test(input)) return `yt:${input}`;

  try {
    const parsed = new URL(input);
    if (parsed.hostname.includes("youtube.com")) {
      const v = parsed.searchParams.get("v");
      if (v) return `yt:${v}`;
    }
    if (parsed.hostname === "youtu.be") {
      const id = parsed.pathname.replace("/", "");
      if (id) return `yt:${id}`;
    }
    if (parsed.hostname === "www.vidking.net" || parsed.hostname === "vidking.net") {
      const path = parsed.pathname.replace(/^\/+/, "");
      if (path) return `vidking:${path}`;
    }
  } catch {
    return null;
  }

  return null;
}

function parsePlaybackVideoId(videoId: string): ParsedMedia {
  if (videoId.startsWith("yt:")) return { provider: "youtube", value: videoId.slice(3) };
  if (videoId.startsWith("vidking:")) return { provider: "vidking", value: videoId.slice(8) };
  return { provider: "youtube", value: videoId };
}

function buildVidkingEmbedUrl(path: string, playback: PlaybackState): string {
  const sanitizedPath = path.replace(/^\/+/, "");
  const params = new URLSearchParams();
  params.set("progress", Math.max(0, Math.floor(playback.timestamp)).toString());
  params.set("autoPlay", playback.status === "playing" ? "true" : "false");
  return `${VIDKING_ORIGIN}/${sanitizedPath}?${params.toString()}`;
}

export function VideoPlayer({ playback, isHost, onSyncState, onSeek }: VideoPlayerProps) {
  const playerRef = useRef<YTPlayer | null>(null);
  const playerContainerRef = useRef<HTMLDivElement | null>(null);
  const syncingRef = useRef(false);
  const playerReadyRef = useRef(false);
  const isHostRef = useRef(isHost);
  const onSyncStateRef = useRef(onSyncState);
  const onSeekRef = useRef(onSeek);
  const media = useMemo(() => parsePlaybackVideoId(playback.videoId), [playback.videoId]);
  const [hostInput, setHostInput] = useState(playback.videoId);
  const hostVidkingTimeRef = useRef(0);

  useEffect(() => {
    setHostInput(playback.videoId);
  }, [playback.videoId]);

  useEffect(() => {
    isHostRef.current = isHost;
  }, [isHost]);

  useEffect(() => {
    onSyncStateRef.current = onSyncState;
  }, [onSyncState]);

  useEffect(() => {
    onSeekRef.current = onSeek;
  }, [onSeek]);

  useEffect(() => {
    if (media.provider !== "youtube") return;

    const scriptId = "youtube-iframe-api";
    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(script);
    }

    const initPlayer = () => {
      if (!playerContainerRef.current || playerRef.current) return;
      playerReadyRef.current = false;
      playerRef.current = new window.YT.Player(playerContainerRef.current, {
        videoId: media.value,
        playerVars: {
          autoplay: 0,
          controls: 1,
          rel: 0,
          modestbranding: 1
        },
        events: {
          onReady: (event: YTPlayerEvent) => {
            playerRef.current = event.target;
            playerReadyRef.current = true;
          },
          onStateChange: (event: YTPlayerEvent) => {
            if (!isHostRef.current || syncingRef.current || !playerReadyRef.current) return;
            const player = event.target;
            if (!player || typeof player.getVideoData !== "function" || typeof player.getCurrentTime !== "function") return;
            const timestamp = player.getCurrentTime();
            const videoId = player.getVideoData().video_id;
            if (event.data === window.YT.PlayerState.PLAYING) onSyncStateRef.current({ videoId, timestamp, status: "playing" });
            if (event.data === window.YT.PlayerState.PAUSED) onSyncStateRef.current({ videoId, timestamp, status: "paused" });
          }
        }
      });
    };

    if (window.YT?.Player) initPlayer();
    else window.onYouTubeIframeAPIReady = initPlayer;

    return () => {
      if (window.onYouTubeIframeAPIReady === initPlayer) {
        window.onYouTubeIframeAPIReady = undefined;
      }
      playerReadyRef.current = false;
      try {
        if (playerRef.current?.destroy) playerRef.current.destroy();
      } catch {
        // YouTube API may attempt DOM cleanup after React has already replaced the node.
      }
      playerRef.current = null;
    };
  }, [media.provider]);

  useEffect(() => {
    if (media.provider !== "youtube") return;
    if (!playerRef.current || !playerReadyRef.current) return;

    const player = playerRef.current;
    if (typeof player.getVideoData !== "function" || typeof player.getCurrentTime !== "function") return;
    const currentVideoId = player.getVideoData().video_id;
    const currentTime = player.getCurrentTime();
    const drift = Math.abs(currentTime - playback.timestamp);
    syncingRef.current = true;

    if (currentVideoId !== media.value) {
      player.loadVideoById(media.value, playback.timestamp);
    } else if (drift > 1.8) {
      player.seekTo(playback.timestamp, true);
    }

    if (playback.status === "playing") player.playVideo();
    else player.pauseVideo();

    const timer = window.setTimeout(() => {
      syncingRef.current = false;
    }, 200);
    return () => window.clearTimeout(timer);
  }, [media.provider, media.value, playback]);

  useEffect(() => {
    if (media.provider !== "vidking") return;

    const onVidkingMessage = (event: MessageEvent) => {
      if (event.origin !== VIDKING_ORIGIN || !isHostRef.current || syncingRef.current) return;
      if (typeof event.data !== "string") return;

      try {
        const parsed = JSON.parse(event.data) as {
          type?: string;
          data?: { event?: string; currentTime?: number };
        };
        if (parsed.type !== "PLAYER_EVENT" || !parsed.data) return;

        const currentTime = typeof parsed.data.currentTime === "number" ? parsed.data.currentTime : 0;
        hostVidkingTimeRef.current = currentTime;

        if (parsed.data.event === "play" || parsed.data.event === "pause") {
          onSyncStateRef.current({
            videoId: playback.videoId,
            timestamp: currentTime,
            status: parsed.data.event === "play" ? "playing" : "paused"
          });
        }
        if (parsed.data.event === "seeked") onSeekRef.current(currentTime);
      } catch {
        return;
      }
    };

    window.addEventListener("message", onVidkingMessage);
    return () => window.removeEventListener("message", onVidkingMessage);
  }, [media.provider, playback.videoId]);

  useEffect(() => {
    if (!isHost || media.provider !== "youtube" || !playerRef.current || !playerReadyRef.current) return;

    const interval = window.setInterval(() => {
      const time = playerRef.current?.getCurrentTime();
      if (typeof time === "number") onSeekRef.current(time);
    }, 4000);

    return () => window.clearInterval(interval);
  }, [isHost, media.provider, onSeek]);

  const onHostChangeMedia = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isHost) return;

    const parsed = parseMediaInput(hostInput);
    if (!parsed) return;

    syncingRef.current = true;
    onSyncState({
      videoId: parsed,
      timestamp: 0,
      status: "paused"
    });
    window.setTimeout(() => {
      syncingRef.current = false;
    }, 250);
  };

  const vidkingSrc = media.provider === "vidking" ? buildVidkingEmbedUrl(media.value, playback) : "";

  return (
    <div className="space-y-3">
      {isHost ? (
        <form onSubmit={onHostChangeMedia} className="rounded-xl border border-border bg-panel p-3">
          <label className="mb-2 block text-xs uppercase tracking-wide text-gray-300">
            Media Source (YouTube or Vidking URL)
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-white outline-none transition focus:border-accent"
              value={hostInput}
              onChange={(event) => setHostInput(event.target.value)}
              placeholder="YouTube URL/ID or https://www.vidking.net/embed/..."
            />
            <button
              type="submit"
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-500"
            >
              Load
            </button>
          </div>
        </form>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-border bg-black shadow-lg">
        {media.provider === "youtube" ? (
          <div ref={playerContainerRef} className="aspect-video w-full" />
        ) : (
          <iframe
            src={vidkingSrc}
            className="aspect-video w-full"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            title="Vidking player"
          />
        )}
      </div>
    </div>
  );
}
