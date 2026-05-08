"use client";

import { useEffect, useMemo, useRef } from "react";
import { PlaybackState } from "@/types";

declare global {
  interface Window {
    YT: {
      Player: new (id: string, options: Record<string, unknown>) => YTPlayer;
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
}

interface VideoPlayerProps {
  playback: PlaybackState;
  isHost: boolean;
  onSyncState: (next: { videoId: string; timestamp: number; status: "playing" | "paused" }) => void;
  onSeek: (timestamp: number) => void;
}

export function VideoPlayer({ playback, isHost, onSyncState, onSeek }: VideoPlayerProps) {
  const playerRef = useRef<YTPlayer | null>(null);
  const syncingRef = useRef(false);
  const containerId = useMemo(() => `yt-player-${Math.random().toString(36).slice(2, 9)}`, []);

  useEffect(() => {
    const scriptId = "youtube-iframe-api";
    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(script);
    }

    const initPlayer = () => {
      playerRef.current = new window.YT.Player(containerId, {
        videoId: playback.videoId,
        playerVars: {
          autoplay: 0,
          controls: 1,
          rel: 0,
          modestbranding: 1
        },
        events: {
          onStateChange: (event: { data: number }) => {
            if (!isHost || syncingRef.current || !playerRef.current) return;
            const timestamp = playerRef.current.getCurrentTime();
            const videoId = playerRef.current.getVideoData().video_id;
            if (event.data === window.YT.PlayerState.PLAYING) onSyncState({ videoId, timestamp, status: "playing" });
            if (event.data === window.YT.PlayerState.PAUSED) onSyncState({ videoId, timestamp, status: "paused" });
          }
        }
      });
    };

    if (window.YT?.Player) initPlayer();
    else window.onYouTubeIframeAPIReady = initPlayer;
  }, [containerId, isHost, onSyncState, playback.videoId]);

  useEffect(() => {
    if (!playerRef.current) return;

    const player = playerRef.current;
    const currentVideoId = player.getVideoData().video_id;
    const currentTime = player.getCurrentTime();
    const drift = Math.abs(currentTime - playback.timestamp);
    syncingRef.current = true;

    if (currentVideoId !== playback.videoId) {
      player.loadVideoById(playback.videoId, playback.timestamp);
    } else if (drift > 1.8) {
      player.seekTo(playback.timestamp, true);
    }

    if (playback.status === "playing") player.playVideo();
    else player.pauseVideo();

    const timer = window.setTimeout(() => {
      syncingRef.current = false;
    }, 200);
    return () => window.clearTimeout(timer);
  }, [playback]);

  useEffect(() => {
    if (!isHost || !playerRef.current) return;

    const interval = window.setInterval(() => {
      const time = playerRef.current?.getCurrentTime();
      if (typeof time === "number") onSeek(time);
    }, 4000);

    return () => window.clearInterval(interval);
  }, [isHost, onSeek]);

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-black shadow-lg">
      <div id={containerId} className="aspect-video w-full" />
    </div>
  );
}
