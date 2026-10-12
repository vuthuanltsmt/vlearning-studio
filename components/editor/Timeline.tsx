"use client";

import type {
  Quiz,
} from "@/types/lesson";

type Props = {
  duration: number;

  currentTime: number;

  quizzes: Quiz[];

  onQuizClick: (
    quiz: Quiz
  ) => void;
};

export function Timeline({
  duration,
  currentTime,
  quizzes,
  onQuizClick,
}: Props) {
  return (
    <div className="h-40 shrink-0 border-t border-blue-900 bg-[#04101f] p-4 text-white">

      {/* HEADER */}

      <div className="mb-4 flex items-center justify-between">

        <strong>
          Timeline
        </strong>

        <span className="text-xs text-slate-400">
          {quizzes.length} tương tác
        </span>

      </div>

      {/* TIMELINE AREA */}

      <div className="relative h-24 overflow-hidden rounded-xl border border-blue-900 bg-[#07182c]">

        {/* ĐƯỜNG GIỮA */}

        <div className="absolute left-0 right-0 top-1/2 h-px bg-blue-700" />

        {/* CÁC MARKER CÂU HỎI */}

        {quizzes.map(
          (quiz) => {
            const left =
              duration > 0
                ? (quiz.time /
                    duration) *
                  100
                : 0;

            return (
              <button
                key={
                  quiz.id
                }
                type="button"
                onClick={() =>
                  onQuizClick(
                    quiz
                  )
                }
                title={
                  quiz.question
                }
                style={{
                  left: `${left}%`,
                }}
                className="absolute top-6 -translate-x-1/2"
              >

                <div className="rounded-md bg-purple-600 px-2 py-1 text-xs font-bold shadow-lg transition hover:bg-purple-500">
                  Q
                </div>

              </button>
            );
          }
        )}

        {/* PLAYHEAD ĐỎ */}

        <div
          className="pointer-events-none absolute bottom-0 top-0 w-[2px] bg-red-500"
          style={{
            left: `${
              duration > 0
                ? (currentTime /
                    duration) *
                  100
                : 0
            }%`,
          }}
        />

      </div>

    </div>
  );
}