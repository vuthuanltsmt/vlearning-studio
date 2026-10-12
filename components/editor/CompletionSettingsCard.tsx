"use client";

import {
  Check,
  RotateCcw,
  Settings2,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import {
  DEFAULT_COMPLETION_SETTINGS,
  loadCompletionSettings,
  saveCompletionSettings,
} from "@/lib/completionSettings";

import type {
  CompletionSettings,
} from "@/lib/completionSettings";

export function CompletionSettingsCard() {
  const [
    settings,
    setSettings,
  ] =
    useState<CompletionSettings>(
      DEFAULT_COMPLETION_SETTINGS
    );

  const [
    saved,
    setSaved,
  ] =
    useState(false);

  /* =========================================
     LOAD
  ========================================= */

  useEffect(() => {
    setSettings(
      loadCompletionSettings()
    );
  }, []);

  /* =========================================
     UPDATE NUMBER
  ========================================= */

  function updatePercent(
    key:
      | "passScorePercent"
      | "minWatchPercent",
    value: number
  ) {
    const safeValue =
      Math.min(
        100,
        Math.max(
          0,
          value
        )
      );

    setSettings(
      (old) => ({
        ...old,
        [key]:
          safeValue,
      })
    );

    setSaved(false);
  }

  /* =========================================
     SAVE
  ========================================= */

  function handleSave() {
    saveCompletionSettings(
      settings
    );

    setSaved(true);

    window.setTimeout(
      () => {
        setSaved(false);
      },
      2000
    );
  }

  /* =========================================
     RESET
  ========================================= */

  function handleReset() {
    setSettings(
      DEFAULT_COMPLETION_SETTINGS
    );

    saveCompletionSettings(
      DEFAULT_COMPLETION_SETTINGS
    );

    setSaved(true);

    window.setTimeout(
      () => {
        setSaved(false);
      },
      2000
    );
  }

  /* =========================================
     UI
  ========================================= */

  return (
    <section className="rounded-2xl border border-blue-800 bg-[#102b52] p-4 text-white">

      <div className="flex items-center justify-between gap-3">

        <div className="flex items-center gap-2">

          <Settings2
            size={18}
            className="text-cyan-300"
          />

          <h3 className="font-black">
            ĐIỀU KIỆN HOÀN THÀNH
          </h3>

        </div>

        {saved && (

          <div className="flex items-center gap-1 text-xs font-bold text-green-300">

            <Check
              size={15}
            />

            Đã lưu

          </div>

        )}

      </div>

      <div className="mt-4 space-y-5">

        {/* PASS SCORE */}

        <div>

          <div className="mb-2 flex items-center justify-between">

            <label className="text-sm font-semibold text-slate-200">
              Điểm đạt
            </label>

            <strong className="text-cyan-300">
              {settings.passScorePercent}%
            </strong>

          </div>

          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={
              settings.passScorePercent
            }
            onChange={(event) =>
              updatePercent(
                "passScorePercent",
                Number(
                  event.target.value
                )
              )
            }
            className="w-full cursor-pointer"
          />

          <div className="mt-1 flex justify-between text-[11px] text-slate-500">

            <span>
              0%
            </span>

            <span>
              100%
            </span>

          </div>

        </div>

        {/* WATCH VIDEO */}

        <div>

          <div className="mb-2 flex items-center justify-between">

            <label className="text-sm font-semibold text-slate-200">
              Tỷ lệ xem video
            </label>

            <strong className="text-cyan-300">
              {settings.minWatchPercent}%
            </strong>

          </div>

          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={
              settings.minWatchPercent
            }
            onChange={(event) =>
              updatePercent(
                "minWatchPercent",
                Number(
                  event.target.value
                )
              )
            }
            className="w-full cursor-pointer"
          />

          <div className="mt-1 flex justify-between text-[11px] text-slate-500">

            <span>
              0%
            </span>

            <span>
              100%
            </span>

          </div>

        </div>

        {/* REQUIRE QUIZZES */}

        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-blue-800 bg-blue-950/40 p-3">

          <input
            type="checkbox"
            checked={
              settings.requireAllQuizzes
            }
            onChange={(event) => {
              setSettings(
                (old) => ({
                  ...old,
                  requireAllQuizzes:
                    event.target.checked,
                })
              );

              setSaved(false);
            }}
            className="mt-1 h-4 w-4"
          />

          <div>

            <div className="text-sm font-bold">
              Bắt buộc hoàn thành tất cả câu hỏi
            </div>

            <div className="mt-1 text-xs leading-5 text-slate-400">
              Người học phải làm hết các câu hỏi tương tác trước khi chuyển sang trang tiếp theo.
            </div>

          </div>

        </label>

      </div>

      {/* BUTTONS */}

      <div className="mt-5 flex gap-2">

        <button
          type="button"
          onClick={
            handleSave
          }
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-bold transition hover:bg-cyan-500"
        >

          <Check
            size={17}
          />

          Lưu điều kiện

        </button>

        <button
          type="button"
          onClick={
            handleReset
          }
          className="flex items-center justify-center gap-2 rounded-xl border border-blue-700 bg-blue-950 px-3 py-2.5 text-sm font-bold transition hover:bg-blue-900"
          title="Khôi phục mặc định"
        >

          <RotateCcw
            size={17}
          />

        </button>

      </div>

    </section>
  );
}