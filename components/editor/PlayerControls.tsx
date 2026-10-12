"use client";

import {
  Pause,
  Play,
  Plus,
} from "lucide-react";

import {
  formatTime,
} from "@/types/lesson";

type Props = {
  currentTime: number;

  duration: number;

  isPlaying: boolean;

  onTogglePlay: () => void;

  onSeek: (
    time: number
  ) => void;

  onAddQuestion:
    () => void;
};

export function PlayerControls({
  currentTime,
  duration,
  isPlaying,
  onTogglePlay,
  onSeek,
  onAddQuestion,
}: Props) {
  return (
    <div className="flex h-16 shrink-0 items-center gap-4 border-t border-blue-900 bg-[#07182c] px-5 text-white">

      {/* PLAY / PAUSE */}

      <button
        type="button"
        onClick={
          onTogglePlay
        }
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-cyan-500 transition hover:bg-cyan-400"
        title={
          isPlaying
            ? "Tạm dừng"
            : "Phát"
        }
      >
        {isPlaying ? (
          <Pause
            size={20}
          />
        ) : (
          <Play
            size={20}
          />
        )}
      </button>

      {/* CURRENT TIME */}

      <span className="w-32 shrink-0 font-mono text-sm text-slate-200">

        {formatTime(
          currentTime
        )}

        {" / "}

        {formatTime(
          duration
        )}

      </span>

      {/* SEEK BAR */}

      <input
        type="range"
        min={0}
        max={
          duration > 0
            ? duration
            : 10
        }
        step={0.01}
        value={
          Math.min(
            currentTime,
            duration > 0
              ? duration
              : 10
          )
        }
        onChange={(e) =>
          onSeek(
            Number(
              e.target.value
            )
          )
        }
        className="min-w-0 flex-1 cursor-pointer"
      />

      {/* ADD QUESTION */}

      <button
        type="button"
        onClick={
          onAddQuestion
        }
        className="flex shrink-0 items-center gap-2 rounded-lg bg-cyan-600 px-5 py-3 text-sm font-bold transition hover:bg-cyan-500"
      >
        <Plus
          size={17}
        />

        Thêm câu hỏi
      </button>

    </div>
  );
}